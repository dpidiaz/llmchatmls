# MLS Global Dispatcher R1 — Implementación y certificación

Fecha: 2026-09-23 (America/Guatemala)  
Estado: **ACTIVE / CERTIFIED R1**

## Resultado

El Global Dispatcher R1 está implementado en `main` y el comando universal `MLS siguiente` puede usar GitHub para seleccionar automáticamente un work item elegible sin que el chat elija manualmente el workstream.

## Merge de implementación

- PR: #707 — `Global Dispatcher R1: activar MLS siguiente`
- Merge SHA: `608aa78be94b41c851ee57579bd8412a1073b0f6`
- Workflow: `MLS Global Dispatcher Tests`
- Run certificado: `35953545311`
- Resultado: `success`

## Componentes activos

- `MLS R32 EDITORIAL/global dispatcher/core.js`
- `MLS R32 EDITORIAL/global dispatcher/work registry.json`
- `scripts/MLS global dispatcher scheduler.cjs`
- `scripts/MLS global dispatcher worker.cjs`
- `.github/workflows/MLS Global Dispatcher Scheduler.yml`
- `.github/workflows/MLS Global Dispatcher Worker Events.yml`
- `.github/workflows/MLS Global Dispatcher Tests.yml`
- `test/mls global dispatcher.test.cjs`

## Contrato temporal

- claim TTL: 90 segundos;
- ACK: 5 minutos;
- lease móvil: 10 minutos;
- reaper GitHub: cada 5 minutos;
- lazy reap: antes de adjudicar nuevos claims.

## Garantías certificadas

- selección determinista por recovery, prioridad, antigüedad y workId;
- dependencias antes de elegibilidad;
- locks jerárquicos para paths;
- un workId activo no se adjudica dos veces;
- ramas exclusivas por assignment;
- ningún worker normal escribe directamente a `main`;
- checkpoint exige HEAD exacto de la rama;
- checkpoint debe descender de base/checkpoint anterior;
- escritura fuera de `allowedPaths` falla cerrado;
- retry idéntico de checkpoint es idempotente;
- checkpoint distinto sobre el mismo commit produce conflicto;
- worker zombi posterior al vencimiento es rechazado;
- finish requiere commit checkpointed y validación pasada;
- GitHub es el plano de control;
- 0 dependencias editoriales D1/Cloudflare;
- Gate 500 continúa bloqueado.

## Smoke test real

Se ejecutó un claim productivo de prueba después del merge.

### Claim

Issue #708:

- requestId: `smoke-20260923-2141`;
- assignment: `MLS-GLOBAL-000708`;
- workId adjudicado automáticamente: `evidence-runtime-e2e-certification`;
- branch creada: `worker/evidence-runtime-e2e-certification/000708`;
- ACK deadline: 5 minutos.

El Dispatcher eligió el workstream sin indicación manual del chat.

### Cancel / worker event

El assignment recibió un evento `cancel` válido mediante el workflow `MLS Global Dispatcher Worker Events`.

Resultado:

- `acknowledgedAt` persistido;
- `cancelRequested: true`;
- no se creó progreso falso;
- no se produjo recovery artificial.

### Reap

Issue #710 ejecutó `reap`.

Resultado:

- #708 cerró como `CANCELLED`;
- `recovery: false`;
- activeAssignments: 0;
- recoveries: 0;
- terminal: 0;
- ready: 4;
- D1 editorial reads/writes: 0;
- Cloudflare editorial interactions: 0.

### Ledger

Issue #709 conserva el ledger durable.

El request de smoke quedó registrado como `cancelled`, con su assignment, branch y epoch. El work item original volvió a estar disponible.

## Uso

En un chat nuevo:

`MLS siguiente`

El chat debe crear un claim canónico con `requestId` y `workerId`, observar la adjudicación, enviar ACK inmediato y trabajar únicamente dentro del assignment entregado.

Varios chats pueden ejecutar el mismo comando. El Scheduler adjudica de forma single-writer y evita colisiones mediante leases y resource locks.

## Estado del Work Registry inicial

Al activar R1 existen cuatro work items listos para adjudicación simultánea cuando no chocan sus locks:

- certificación E2E del Evidence runtime;
- certificación del PR #699 del benchmark R33;
- adaptador R33 Evidence Farm;
- adaptador MLS Farm.

La integración de providers depende de los dos adaptadores.

`r33-benchmark-pr-699-integration` y `gate500` permanecen bloqueados según su contrato.

## Límite conocido

El sistema puede recuperar trabajo que haya llegado a GitHub mediante commit/checkpoint. El razonamiento que solo exista dentro de un chat y nunca haya sido persistido no puede recuperarse.

Por eso sigue vigente la regla: no acumular más de 2–3 operaciones significativas sin persistir estado durable.
