# R33 local — informe final del lease y validación global

Actualizado: 2026-10-12 16:24 UTC (10:24, hora de Guatemala).

## Resultado del lease

- Worker: `R33W-local-20261012152808-572e6e`.
- Asignación: `R33A-1791818888838-78b06c`.
- Resultado: **25/25 entradas `VERIFIED`**; el coordinador confirmó la integración y cerró el lease.
- Las siete entradas de seguimiento que estaban abiertas al checkpoint anterior (`MLS-V08-1080`, `MLS-V08-1083`, `MLS-V08-1084`, `MLS-V08-1085`, `MLS-V08-1086`, `MLS-V08-1087`, `MLS-V08-1091`) quedaron con historial preservado, APA 7, Evidence canónica y `assessEntry` exitoso. `MLS-V08-1085` se acotó a la evidencia de interferencia en traducción automática coreano→español de discursos presidenciales; se retiraron afirmaciones sobre transferencia español→coreano que la fuente no respaldaba.

## Estado global del coordinador y validación canónica

- Entradas totales: **10,133**.
- Índice canónico `verified.json`: **10,133 códigos**.
- Coordinador: **10,133 VERIFIED**, **0 resultados sin resolver**, **0 leases activos**.
- Validación global `evidence git.validateStore`: `ok=true`; **10,133 entradas**, **2,366 fuentes**, **0 errores**, **0 advertencias**; `verified=10,133`, `reviewed=0`.
- Seguridad: 0 interacciones Cloudflare, 0 lecturas/escrituras D1, 0 llamadas API, 0 pushes, 0 merges y 0 despliegues.

Checkpoint por worker: `docs/r33-local/workers/R33W-local-20261012152808-572e6e/checkpoint.json`.
