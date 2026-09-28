# MLS-LEASE-001 — cola durable y leases generacionales

Esta especificación sustituye las reglas R1 de caducidad del claim, cierre por capacidad y escritura directa del ledger/assignment. No cambia R33, sus validadores, contenido, fuentes, gates, FREE ONLY ni el trabajo editorial desde Chat.

## Garantía y límites

Una solicitud válida `claim` se acepta durablemente cuando GitHub confirma la creación del Issue con el envelope `MLS_GLOBAL_DISPATCH_COMMAND`. El scheduler la incorpora como `queued` al estado transaccional. `requestId` es la identidad lógica estable: todos los reintentos deben reutilizarlo. El número del primer Issue determina el orden FIFO; los Issues duplicados solo apuntan al resultado original.

Cada solicitud conserva como máximo un lease vigente y eventualmente obtiene uno si sigue existiendo trabajo elegible, se libera capacidad, las dependencias progresan y GitHub/Actions vuelven a estar disponibles. No existe plazo máximo prometido: cron puede retrasarse y cuotas, permisos, fallos persistentes del proveedor o un corpus finito pueden impedir una asignación. La cola no caduca ni se cancela por esos motivos. Si se demuestra agotamiento de ambos proveedores y no quedan assignments, recuperaciones ni trabajo pendiente, el resultado es `CORPUS_COMPLETE`.

“Exactamente uno” significa un assignment lógico por request y como máximo una generación válida a la vez. Una expiración puede emitir otro token/epoch para **la misma solicitud y el mismo trabajo**, invalidando el anterior. No significa ejecutar físicamente código una sola vez: un worker puede seguir calculando tras perder su lease. Los eventos aceptados están cercados por token/epoch y CAS; las ramas por generación aíslan las escrituras. Los permisos de GitHub de un usuario que deliberadamente escribe o mergea fuera del protocolo no pueden revocarse mediante este dispatcher. El merge editorial sigue sujeto al preflight, HEAD exacto, validación R33 y serialización ya establecidos.

## Arquitectura y fuente de verdad

- Entrada durable: Issues de comandos y comentarios de eventos existentes. Chat conserva los mismos envelopes, heartbeat, checkpoint y finish.
- Fuente de verdad posterior a la migración: rama de Git `mls-dispatch-state`, archivo `dispatcher.json`. Contiene los Issues lógicos, ledger completo y outbox `dirty` de proyecciones pendientes.
- Cada transición crea un blob, tree y commit cuyo único padre es el SHA leído. Actualiza la referencia con `force:false`. Dos propuestas con el mismo padre son commits hermanos: solo una puede avanzar la referencia; la otra relee y recalcula. El alta inicial usa creación exclusiva de la referencia.
- Assignment, reservas de recursos, epoch, request, checkpoint, terminales y recuperaciones se confirman en el mismo commit. Nunca se publica un lease en Issues antes de confirmarlo allí.
- Issues son proyecciones reparables. Un reinicio después del commit y antes del PATCH conserva el outbox. La publicación se reintenta; ACK TTL empieza al preparar la publicación. `publicationPending` mantiene la reserva hasta confirmar el PATCH, incluso ante 403/reinicio. Un PATCH confirmado cuya respuesta se pierde puede repetirse sin crear otro lease.
- La proyección del ledger se sustituye por un enlace a la rama de estado si excede 60 000 caracteres. El ledger completo no se trunca en Git. El consumidor interno lee siempre el estado autoritativo.
- Scheduler y workflow de eventos comparten `mls-global-dispatcher`. Esta serialización protege la publicación de las vistas; el CAS protege el estado. El worker conserva `contents: read`, `issues: write`, `actions: write` y únicamente solicita despertar al scheduler. No se amplían sus permisos. El scheduler conserva su `contents: write` existente.

El scheduler primero repara el outbox, luego relee **todos** los comentarios pendientes de los assignments activos, antes de expirar leases. Procesa esos eventos y drena la cola en una transacción. Un finish libera capacidad y adjudica el siguiente claim en ese mismo pase. Un evento creado con `GITHUB_TOKEN` que no dispare otro workflow sigue siendo visible en el siguiente pase programado (cada cinco minutos). La paginación no tiene el antiguo corte silencioso de 2 000 Issues.

## Estados y protocolo desde Chat

| Estado visible | Significado y siguiente transición |
|---|---|
| `QUEUED` | Solicitud persistente sin TTL; espera FIFO por trabajo/capacidad/dependencias. |
| `LEASED` | Assignment confirmado y publicado; ACK mediante heartbeat en cinco minutos. |
| RUNNING / CHECKPOINTED | Fases del mismo `leased`, con heartbeat y checkpoints aceptados. |
| BACKOFF | Subestado `assignment.backoff`; mantiene el lease hasta `retryAt` más diez minutos. |
| EXPIRED → REQUEUED | Recuperación interna: conserva request, trabajo, checkpoints y FIFO, cambia epoch/token/rama. |
| `DONE` | Finish validado, terminal en ledger y Issue cerrado. |
| `CORPUS_COMPLETE` | Agotamiento probado; ausencia de candidatos por sí sola no basta. |
| `CANCELLED` | Solo evento de cancelación explícito y autorizado. |

El JSON del ledger usa minúsculas (`queued`, `assigned`, `done`, `corpus_complete`, `cancelled`); los títulos usan mayúsculas. Los errores de validación de un envelope inválido pueden producir `REJECTED`. Una dependencia de recovery inaccesible se registra como `blockedReason` y mantiene la solicitud en cola. Un fallo de infraestructura conserva el input sin consumirlo.

Para cancelar antes del lease, el autor del Issue publica:

```text
<!-- MLS_GLOBAL_DISPATCH_EVENT
{"operation":"cancel","requestId":"identidad-estable-de-la-solicitud"}
-->
```

Con lease se usa el evento `cancel` existente con `assignmentId`, `leaseToken` y `leaseEpoch`. Cerrar un Issue, terminar una respuesta de Chat, perder heartbeat o estar lleno **no equivale** a cancelación explícita. No limpiar claims pendientes con `not_planned`.

Para una espera GitHub 403 Secondary Rate Limit, el worker conserva checkpoint y envía, cuando GitHub permita escribir:

```json
{"operation":"backoff","assignmentId":"MLS-GLOBAL-000123","leaseToken":"TOKEN_VIGENTE","leaseEpoch":123,"retryAt":"2026-09-28T12:00:00.000Z"}
```

`retryAt` debe estar dentro de las siguientes 24 horas. Al reanudar, heartbeat vuelve al TTL normal de diez minutos. No publicar tokens reales ni identificadores privados de conversación en documentación. Si no puede publicarse ningún evento por indisponibilidad, no se supone una renovación inexistente: al recuperarse la API, el reaper preserva el progreso y cerca la generación anterior.

El cliente del dispatcher reconoce 403/429 de rate limit, respeta `Retry-After` y reset de cuota, y usa espera mínima de un minuto, backoff exponencial y jitter. Tras tres reintentos termina la **ejecución**, no la solicitud. Los Issues/comentarios y el outbox quedan disponibles para cron. Errores de permisos no se confunden con rate limit ni consumen el comentario como si fuera inválido. Un evento durably recibido antes del TTL se reproduce antes del reaping y renueva desde el instante de procesamiento, evitando perderlo por retraso de Actions.

## Recuperación y fencing

El epoch nuevo supera el anterior. El token cambia. La rama incluye Issue, epoch y base SHA: un reinicio después de crear una rama y antes del commit de estado no transforma el claim en error terminal, incluso si `main` avanzó. Puede quedar una rama preparatoria sin lease confirmado; eso no es un claim huérfano y no debe usarse como evidencia de ownership.

Se conserva el último checkpoint validado, sus unidades terminadas, la política de integración y base original. Una rama con progreso no checkpointed solo se reutiliza si su comparación prueba descendencia y alcance completos; una comparación de 300 archivos se trata conservadoramente como incompleta. Las recuperaciones reservan sus recursos para el request original. Un token antiguo no puede completar, renovar ni sobrescribir la nueva generación. Los eventos se deduplican por ID de comentario; finish y los claims autoPull conservan idempotencia por requestId, aunque una respuesta ambigua al crear un Issue pueda dejar un Issue duplicado.

## Activación, operación y rollback

Este cambio no se activa por crear un PR. Antes de activar, dejar terminar o detener las ejecuciones de la versión anterior; no mantener escritores R1 funcionando después del primer commit de estado. Verificar que el ledger existente es válido y que solo existe uno. El primer pase importa los Issues abiertos y el ledger existente, conservando terminales. Se rehúsa inicializar un ledger vacío si falta el original.

No se reabren automáticamente solicitudes históricas cerradas como `capacity_busy`, `stale`, `no_work` ni la #1509. Su revisión requiere distinguir cancelaciones reales de cierres administrativos; para nuevos pedidos usar nuevas identidades, y para reintentos del protocolo nuevo reutilizar la original. Antes de activar debe revisarse cualquier claim antiguo relevante: la garantía empieza con la adopción del protocolo nuevo, no reinterpreta todas las operaciones históricas.

Tras activar: ejecutar el workflow Scheduler, inspeccionar el commit en `mls-dispatch-state`, comparar requests/assignments/reservas, confirmar que el outbox se vacía y realizar un claim de control con heartbeat/checkpoint/finish. Estas verificaciones de producción no forman parte de las pruebas simuladas. No arrancar el script de publicación fuera de la serialización del workflow. No editar manualmente los bloques ni borrar/forzar la rama de estado.

Si hay un fallo operativo, pausar el scheduler y conservar rama, Issues y comentarios. **No** volver al scheduler R1 mientras existan leases nuevos o cola pendiente: escribiría en proyecciones y podría duplicar ownership. Reparar hacia adelante o preparar una migración inversa explícita durante una ventana sin escritores. Conservar historial Git para auditoría. Monitorizar tamaño del estado, antigüedad de `queued`, `blockedReason`, outbox, fallos de Actions y conflictos CAS. La implementación usa snapshots completos: el costo y tamaño crecen con el historial y será necesaria una estrategia de compactación conservadora para una operación indefinida a gran escala.

## Evidencia de validación

`npm run test:global-dispatcher` ejecuta todos los archivos de pruebas del dispatcher; CI también los descubre automáticamente. Las pruebas durables usan el scheduler/worker reales con un API simulado y almacenamiento CAS, incluyendo bursts 10/25/50/100, cuatro schedulers concurrentes, FIFO, exclusión, idempotencia, expiración/checkpoint, token antiguo, reinicios antes de commit/publicación, avance de main, 403, cancelación explícita, agotamiento y paginación. Una prueba adicional ejercita el adaptador Git con commits hermanos y rechazo de avance no fast-forward.

Validación local del cambio sobre base `8bdbde3b2d3b7c680a6401693f495ca48c83ed24`: 88/88 pruebas del dispatcher; 38/38 pruebas R33 GitHub Native; validadores de Evidence, índices, Gate 500, Gate 1000 y guard GitHub-only aprobados. Los Gates conservaron cero drift. En Windows se usó `--test-isolation=none`; la validación editorial se ejecutó sobre una exportación del índice de Git con LF, porque el checkout CRLF altera hashes de blobs y patrones del lector. No se cambió contenido para corregir esos fallos ambientales.

No son una prueba de carga contra GitHub real ni demuestran por sí solas un despliegue. Mantener separados los resultados locales, los checks de CI del PR y la verificación posterior a activación.

Referencias: [Git references: force=false](https://docs.github.com/en/rest/git/refs#update-a-reference), [GitHub rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api), [Actions concurrency](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency).
