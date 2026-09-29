# MLS BCR siguiente — contrato universal R4.2

Este documento sustituye las instrucciones de continuación manual de BCR de los
documentos 17 y 18. El único comando que escribe el usuario es **MLS BCR siguiente**,
en cualquier chat disponible. El chat tramita los mensajes técnicos sin pedir al
usuario reserva, bloque, SHA ni volver al productor. El comando ordinario
`MLS siguiente` conserva su contrato R4 separado.

## Autoridad, alcance y admisión

GitHub es el canon. Antes de actuar, leer el Dispatcher, el único ledger abierto
`[MLS Dispatcher Ledger]`, las reservas y sus ramas. No reconstruir ownership de
memoria. El Scheduler continúa excluyendo los terminales, recoveries, reservas y
leases del circuito anterior al crear nuevas reservas. Un inventario truncado,
ledger duplicado o corrupto detiene la adjudicación.

El chat abre un Issue OWNER/MEMBER/COLLABORATOR con título
`[MLS Dispatcher][BCR][REQUEST] <nonce>` y este marcador:

```text
<!-- MLS_BCR_ELASTIC_COMMAND
{"kind":"mls_bcr_elastic_command","version":1,"action":"next","requestId":"bcr-<nonce-unico-de-este-intento>"}
-->
```

Conservar el mismo requestId al recuperar un envío incierto. No crear varias
solicitudes para el mismo intento. La respuesta será un claim, su recibo anterior,
una tarea técnica automática pendiente, STALE o CAPACITY_BUSY. Las solicitudes
sin atender durante dos minutos no reciben trabajo a escondidas. Un chat termina
si no recibió lease; el siguiente chat vuelve a usar el mismo comando universal.

Prioridad: reconciliar completions/heartbeats; preservar y recuperar leases
vencidos; Gate de reservas consolidadas; corrección/revisión selectiva; sellado y
sync; recuperar bloques de producción; bloques nuevos; reserva nueva de 25.
Se procesa como máximo un Gate y cinco solicitudes de admisión por tick. Las
recuperaciones R4 anteriores conservan sus locks y su propio proveedor; no se
convierten ni se certifican como BCR por inferencia.

## Dos clases de claim; mismo comando

Leer `MLS_BCR_ELASTIC_CLAIM` y cotejarlo con la reserva viva. Un claim de producción
usa block 1..5 y el contrato de once archivos del documento 18. Un claim con
`task:"repair", block:0` incluye hasta cinco códigos con errores reales del Gate,
la rama generacional, outputPrefix, el buffer original por SHA y las correcciones
previas por SHA. Consultar los artículos canónicos y las fuentes realmente.

La reparación escribe únicamente estos tres archivos por código asignado:

```text
<outputPrefix>/entries/<CODE>.json
<outputPrefix>/checkpoints/<CODE>.json
<outputPrefix>/reviews/<CODE>.json
```

El checkpoint conserva el esquema R4.1, code, evidenceArtifactPath, allocationHash,
entrySha calculado sobre el JSON estable, claimedStatus y
assessment `PENDING_CANONICAL_R33_VALIDATION`. Se permiten commits parciales
entrada+checkpoint para recuperación. Añadir el informe de revisión al terminar
la consulta. No cambiar entradas correctas por conveniencia ni sobrescribir los
checkpoints originales. Las correcciones se referencian desde la reserva;
el sellador reconstruye un buffer efectivo desde esos objetos inmutables.

Formato de `reviews/<CODE>.json` (usar valores reales, nunca estos placeholders):

```json
{
  "schema": "MLS-BCR-SOURCE-REVIEW-1",
  "code": "<CODE>",
  "entryHash": "<SHA256 logico de la entrada final>",
  "reviewType": "ai",
  "humanReviewed": false,
  "claims": [{
    "claimId": "<claim canónico>",
    "linkId": "<EvidenceLink canónico>",
    "sourceId": "<Source Registry ID>",
    "locatorHash": "<SHA256 logico del locator>",
    "verdict": "supported",
    "sourceUrl": "<URL HTTPS consultada; igual al locator.url si existe>",
    "accessedAt": "<fecha ISO real de consulta>",
    "rationale": "Explicación específica de cómo el pasaje consultado sostiene la afirmación."
  }]
}
```

Cubrir cada afirmación sustancial una sola vez. La automatización comprueba
identidades, cobertura y registros; **no lee ni verifica semánticamente las
fuentes externas**. Un registro vacío, heredado o una etiqueta VERIFIED no
equivalen a revisión. Si la fuente no respalda la afirmación, corregirla y recalcular
las identidades R33; si no se puede resolver, conservar el checkpoint sin COMPLETE.

## Heartbeat, finalización y recuperación

TTL: cinco minutos desde la adjudicación/renovación confirmada. Verificar reserva,
epoch, expiresAt y HEAD antes de escribir. El chat envía internamente RENEW antes
de vencer y COMPLETE con el SHA remoto confirmado. Usar los mismos marcadores del
documento 18; en reparación añadir `task:"repair"` y `block:0`. No pedir estos
comandos técnicos al usuario. Cada mensaje tiene un requestId único.

El Scheduler acepta mensajes enviados antes del vencimiento con hasta dos minutos
de espera, siempre que el epoch aún pertenezca al claim. Una renovación repetida
no extiende otra vez el TTL. Un worker viejo no puede completar el lease nuevo.
Al vencer, se conserva la rama y su HEAD comprobado; el chat siguiente recibe una
rama nueva desde ese snapshot. El antiguo no tiene permiso de seguir escribiendo.
El reaper invalida ownership, nunca libera los códigos de la reserva por TTL.

Los claims se guardan en la reserva antes de crear la rama y publicar la respuesta.
Una respuesta perdida se recupera del recibo durable. La exclusión depende del
único escritor de reservas bajo `concurrency.group: mls-global-dispatcher`, compartido
con sync. GitHub Issues no ofrece una transacción multiobjeto: los pasos parciales
son recuperables y los cambios de refs usan fast-forward sin force y readback.
No ejecutar dos copias manuales del Scheduler fuera de ese mutex.

## Gate, sellado y sincronización automáticos

El Gate ejecuta `canonicalAssessment` R33 y `academic.inspect`, valida checkpoints,
chunks, Source Index y declaraciones de revisión por entrada. Publica un reporte
inmutable, incluso BLOCKED, en `r42-reports/<reserva>/<reportHash>.json` dentro de
la rama del buffer. La reserva conserva su ubicación/SHA y los códigos fallidos.
Un fallo de integridad global detiene el circuito; no habilita otro productor.

Después de corregir, Actions vuelve a ejecutar el Gate completo. Solo un PASS
real de 25/25 permite sellar; el sellador vuelve a ejecutar R33. Publica un único
bundle validado e inmutable en `r41/inbox/<reserva>`. Reutiliza la solicitud original
autorizada para SYNC y despacha `R4.1 Buffered Sync` automáticamente. No crea una
solicitud de autoridad ficticia como bot. El workflow revalida el Issue vivo.

SYNC usa el escritor único existente, validación y staging `r41/staged/<reserva>`.
El Dispatcher solo registra CERTIFIED_STAGED tras confirmar que el run terminó con
éxito, su identidad, el commit y la ausencia de colisiones. STAGED no es integración
en main ni despliegue. Los runs fallidos conservan QUARANTINED y el mismo paquete.
Los dispatches inciertos esperan quince minutos; máximo tres intentos automáticos.
Otro `MLS BCR siguiente` puede reabrir ese presupuesto después del backoff.

## Capacidad, coste y límites reales

Un solo chat BCR activo y un solo escritor de Actions: como máximo dos escritores
BCR cooperantes. Las llamadas de escritura de Actions son secuenciales. Noventa
chats son noventa solicitudes, no noventa leases. No se puede impedir que un
colaborador con permisos GitHub escriba por fuera del protocolo; las validaciones
rechazan contenido ajeno o ownership desplazado. Los leases heredados se conservan
y cuentan para no admitir otro chat BCR mientras estén activos.

Ante 403/429 se detienen las llamadas de esa ejecución. El cooldown guarda
Retry-After, reset de cuota primaria y backoff exponencial con jitter (base un
minuto, componente exponencial máximo una hora). Actions conserva este pequeño
registro entre runs mediante cache. El buffer y la reserva no se borran. La cache
es una optimización de backoff, nunca autoridad editorial; su pérdida no autoriza
claims duplicados y puede ocasionar una nueva llamada que vuelva a fallar cerrada.
Los cron de GitHub pueden retrasarse: cinco minutos de TTL no promete reaping en
cinco minutos de reloj.

FREE ONLY: repositorio público y runner estándar `ubuntu-latest`, sin OpenAI API,
otras APIs de IA pagadas, Work, Cloudflare o despliegues. No introducir credenciales
privadas ni IDs de conversaciones. GitHub documenta los [runners estándar gratuitos
en repositorios públicos](https://docs.github.com/en/billing/concepts/product-billing/github-actions)
y permite [workflow_dispatch desde GITHUB_TOKEN](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).

## Auditoría y adopción de #1881

Snapshot auditado: main `fd52083` y buffer
`bc261a392073dac31b3fdef4001cf2750add22e6`. El Issue #1881 dice
JOINED_AWAITING_CANONICAL_R33_GATE, cinco bloques DONE. Se comprobaron 25 checkpoints
íntegros, sin paquete. La ejecución real del Gate encontró **0/25 aprobados**:
25 fallos canónicos, seis entradas con secciones académicas sin cubrir y ausencia
del nuevo registro explícito de revisión. Son resultados técnicos; no se declara
que se haya leído de nuevo la bibliografía. Ver `reports/1881-universal-gate.json`.

El ledger #709 pudo descomprimirse y comprobar su hash; contenía 311 terminales y
tres recoveries al snapshot `2026-09-29T14:31:32.314Z`. No equivale a que estos sean
los últimos cambios de todos los Issues; el Scheduler reconcilia DONE posteriores
antes de asignar. La auditoría no cerró recoveries ni liberó códigos.

La adopción es aditiva: al activar esta infraestructura, el primer NEXT examina la
reserva consolidada y añade el estado universal con un Gate ejecutado en ese momento.
Conserva allocationHash, cinco bloques, commit original y checkpoints. No se
migra el Issue vivo antes de que exista la infraestructura revisada en main.
No hacer merge de esta implementación ni tocar producción como parte del audit.

Validación: `node --test 'test/r4 universal bcr.test.cjs' 'test/r4 elastic bcr.test.cjs'`.
Las pruebas de 90 chats simulan llegadas concurrentes a la cola serializada; no son
90 chats reales ni una prueba de carga contra GitHub. Las fixtures de revisión
académica son sintéticas y están marcadas como tales; no certifican contenido nuevo.
