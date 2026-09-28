# MLS-LEASE-001 — entrega y evidencia

Fecha: 2026-09-28.

Este informe conserva la evidencia del commit de implementación indicado abajo; sus conteos y checks corresponden a ese commit, no a posteriores cambios documentales. Véase el [protocolo MLS-LEASE-001](03%20MLS-LEASE-001%20Durable%20Queue.md) para arquitectura, operación y activación. El estado de producción describe lo observado durante esa verificación, no un monitor en tiempo real.

- PR en borrador: https://github.com/dpidiaz/llmchatmls/pull/1559
- Commit: `a3f9350e4b7c4ac9580799755dab4cdf9bbf8939`.
- Rama: `fix/mls-lease-001`.
- Base inspeccionada: `8bdbde3b2d3b7c680a6401693f495ca48c83ed24`.
- Árbol remoto e índice local coinciden: `3a2892c8b4e4b05286d3c602699b7966d5d6bb4b`.
- 15 archivos modificados, 572 inserciones y 92 eliminaciones. Copia local sincronizada con el commit remoto y sin cambios pendientes.

## Resultado implementado en el PR

Cola QUEUED sin caducidad; FIFO por Issue original; idempotencia por requestId; actualización atómica de solicitudes, assignments, ledger y recuperaciones mediante Git ref no forzado; outbox para reparar publicación de Issues; fencing por token/epoch y rama generacional; reencolado de expirados conservando solicitud, trabajo y checkpoints; replay de comentarios antes del reaping; backoff 403/429; cancelación explícita; CORPUS_COMPLETE solo con evidencia positiva; despacho tras finish en el mismo pase.

Chat conserva sus envelopes e interfaz en Issues. No se modificaron contenido, fuentes, estándares editoriales R33, gates ni proveedores de pago. No se añadieron interacciones editoriales con Cloudflare/D1.

## Archivos

| Grupo | Archivos del repositorio |
|---|---|
| Estado y exclusión | `MLS R32 EDITORIAL/global dispatcher/durable.js`, `core.js` |
| Agotamiento de proveedores | `MLS R32 EDITORIAL/global dispatcher/providers/integration.js` |
| Ejecución | `scripts/MLS global dispatcher scheduler.cjs`, `scripts/MLS global dispatcher worker.cjs` |
| CI y ejecución de pruebas | `.github/workflows/MLS Global Dispatcher Tests.yml`, `.github/workflows/MLS Global Dispatcher Worker Events.yml`, `package.json` |
| Pruebas | `test/mls global dispatcher durable.test.cjs`, `test/mls global dispatcher.test.cjs`, `test/mls global dispatcher recovery.test.cjs`, `test/mls global dispatcher providers integration.test.cjs` |
| Documentación | `docs/MLS Global Dispatcher/01 Master Prompt MLS Global Dispatcher R1.md`, `02 Protocolo operativo MLS Global Dispatcher R1.md`, `03 MLS-LEASE-001 Durable Queue.md` |

## Pruebas ejecutadas

- **88/88 pruebas del dispatcher**. Incluyen bursts 10/25/50/100 con cuatro schedulers concurrentes simulados, FIFO, ausencia de claims huérfanos, exclusión de recursos, requestId repetido, CAS con commits hermanos, expiración y checkpoint, eventos de token antiguo, reinicio antes de commit y publicación, avance de main tras crash, fallo de proyección, 403/backoff, cancelación explícita, corpus agotado y paginación superior a 2 000 Issues.
- **38/38 pruebas R33 GitHub Native**, ejecutadas sobre una exportación LF exacta del índice Git.
- Aprobados: Evidence, índices derivados, Gate 500, Gate 1000 y guard GitHub-only. Gates: **cero drift**. Snapshot validado: 1 700 entradas VERIFIED y 62 fuentes.
- `git diff --cached --check`: aprobado.
- En Windows se usó `--test-isolation=none`. El primer intento editorial sobre checkout CRLF produjo 8 fallos de patrones del lector y drift de hashes; desaparecieron al usar los bytes LF originales. No se alteró contenido para hacer pasar esas pruebas.

CI del commit remoto: cinco checks concluidos en success:

- [Dispatcher test](https://github.com/dpidiaz/llmchatmls/actions/runs/36397869191/job/108848459252)
- [GitHub Native](https://github.com/dpidiaz/llmchatmls/actions/runs/36397869186/job/108848459428)
- [R4](https://github.com/dpidiaz/llmchatmls/actions/runs/36397869190/job/108848459260)
- [Editorial batch](https://github.com/dpidiaz/llmchatmls/actions/runs/36397869117/job/108848459143)
- [Workers Builds](https://github.com/dpidiaz/llmchatmls/runs/108848522973)

## Producción y límites

**El nuevo dispatcher no está activado.** El PR no se fusionó. Se verificó que `main` sigue en la base indicada y que no existe la rama remota `mls-dispatch-state`. No se ejecutó el nuevo scheduler, ni se reabrió #1509, ni se modificaron manualmente claims o ledger de producción.

Publicar la rama sí disparó automáticamente el build de Cloudflare ya conectado al repositorio. Su check reportó versión `bfadb89a-6982-49af-8d73-e0e22fcad96f`. GitHub no devolvió registros de deployments para ese SHA (`200 []`). Esto **no permite confirmar si Cloudflare promovió esa versión a tráfico real**; no se consultó el estado de tráfico dentro de Cloudflare. Por tanto, no se afirma ausencia absoluta de efectos en esa plataforma ni un despliegue exitoso de la intervención.

La garantía eventual depende de trabajo elegible, capacidad, progreso de dependencias y disponibilidad de GitHub/Actions. “Exactamente uno” significa un assignment lógico y como máximo una generación válida simultánea; un worker obsoleto puede seguir calculando, pero sus eventos son rechazados. No se promete ejecución física exactamente una vez ni bloqueo de merges deliberados fuera del protocolo. Las pruebas de bursts son simuladas, no carga contra producción.

Las solicitudes históricas cerradas no se reinterpretan automáticamente. Antes de activar hay que dejar sin escritores a la versión anterior, validar el ledger único y hacer una prueba operativa controlada. Los snapshots completos de Git requieren monitorear crecimiento; la documentación incluye operación, límites y rollback seguro.

La revisión automática rechazó inicialmente ampliar los permisos del workflow del worker. Se resolvió conservando sus permisos: solo despierta al scheduler, cuyo permiso de escritura ya existía. La autorización posterior del usuario quedó recibida, pero no fue necesario ampliar permisos.
