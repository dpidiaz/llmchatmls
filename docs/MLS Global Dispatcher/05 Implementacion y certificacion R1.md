# MLS Global Dispatcher R1 — Implementación y certificación

Fecha: 2026-09-23 (America/Guatemala)  
Estado: **ACTIVE / CERTIFIED R1**

## Resultado

El Global Dispatcher R1 está implementado y activo en `main`. El comando universal:

`MLS siguiente`

puede ser usado desde múltiples chats. GitHub selecciona automáticamente un work item elegible, crea ownership exclusivo y evita colisiones mediante leases, dependencias y resource locks.

## Implementación

### PR principal

- PR #707 — `Global Dispatcher R1: activar MLS siguiente`
- Merge SHA: `608aa78be94b41c851ee57579bd8412a1073b0f6`
- `MLS Global Dispatcher Tests`: success
- Run certificado: `35953545311`

### Hardening de recovery

- PR #716 — `Global Dispatcher R1: hardening de recovery`
- Merge SHA: `c9a193bd694c72deacda12ecdf4b5347c7d144ee`
- `MLS Global Dispatcher Tests`: success
- Run certificado: `35954188686`

El hardening mueve la clasificación de recovery al core canónico y hace que el scheduler use exactamente la misma función cubierta por tests.

## Componentes canónicos

- `MLS R32 EDITORIAL/global dispatcher/core.js`
- `MLS R32 EDITORIAL/global dispatcher/work registry.json`
- `scripts/MLS global dispatcher scheduler.cjs`
- `scripts/MLS global dispatcher worker.cjs`
- `.github/workflows/MLS Global Dispatcher Scheduler.yml`
- `.github/workflows/MLS Global Dispatcher Worker Events.yml`
- `.github/workflows/MLS Global Dispatcher Tests.yml`
- `test/mls global dispatcher.test.cjs`

## Timing activo

- claim TTL: 90 segundos;
- ACK: 5 minutos;
- lease móvil tras ACK: 10 minutos;
- reaper: cada 5 minutos;
- lazy reap: antes de adjudicar nuevos claims.

## Certificación contra el contrato R1

1. **Claims simultáneos:** probado en producción con Issues #711–#714.
2. **Locks solapados:** test unitario de locks jerárquicos `path:`.
3. **Lease expiry:** test unitario de expiración.
4. **Zombie event:** evento posterior a expiry rechazado.
5. **Orphan commit recovery:** `classifyRecoveryState` probado explícitamente.
6. **Checkpoint idempotente:** retry idéntico no duplica; payload distinto falla cerrado.
7. **Crash antes del ACK:** expiración exacta después del deadline de 5 min y `ACK_TIMEOUT`.
8. **Crash después de commit/antes de checkpoint:** branch HEAD posterior a base se clasifica `orphan_progress`, preservando `orphanHeadSha` y `resumeCommit`.
9. **Dependency ordering:** work items dependientes no son elegibles hasta terminalidad requerida.
10. **No escritura directa a main:** cada assignment recibe una rama exclusiva.
11. **GitHub-only editorial:** guard de tests sin D1/Cloudflare editorial.
12. **4 workers concurrentes sobre work items distintos y locks compatibles:** probado con #711–#714.

## Smoke test simple

Issue #708 creó un claim real después de activar R1.

El Dispatcher asignó automáticamente:

- assignment: `MLS-GLOBAL-000708`;
- workId: `evidence-runtime-e2e-certification`;
- branch: `worker/evidence-runtime-e2e-certification/000708`.

Se envió un `cancel` válido antes de producir cambios.

Issue #710 ejecutó reap:

- #708 cerró `CANCELLED`;
- recovery: false;
- activeAssignments: 0;
- recoveries: 0;
- terminal: 0;
- ready: 4;
- D1 editorial reads/writes: 0;
- Cloudflare editorial interactions: 0.

El ledger durable vive en Issue #709.

## Smoke test concurrente — 4 workers

Se crearon cuatro claims casi simultáneos:

- #711 → `evidence-runtime-e2e-certification`
- #712 → `r33-benchmark-pr-699-certification`
- #713 → `dispatcher-provider-mls-farm`
- #714 → `dispatcher-provider-r33`

Cada uno recibió:

- workId distinto;
- branch exclusiva;
- leaseToken propio;
- leaseEpoch propio.

No hubo adjudicación duplicada ni lock conflict.

Los cuatro assignments fueron cancelados deliberadamente y el Issue #715 ejecutó reap.

Resultado final:

- 4 assignments `CANCELLED`;
- 0 recoveries falsos;
- 0 active assignments;
- los 4 work items volvieron a `ready`;
- 0 D1 editorial reads/writes;
- 0 Cloudflare editorial interactions.

Los runs redundantes pendientes del Scheduler pueden ser cancelados por la semántica de GitHub `concurrency`; esto no pierde claims porque el Scheduler activo drena todos los comandos pendientes sobre estado fresco.

## Recovery

Si un chat desaparece:

### Sin ACK

`leased → ACK deadline → ACK_TIMEOUT → release`

No hay recovery si la rama no avanzó.

### Con checkpoint

El commit confirmado se conserva y un nuevo worker continúa desde ese checkpoint.

### Commit sin checkpoint

Si el branch HEAD avanzó respecto de `lastCheckpointCommit || baseCommit`:

`RECOVERY_REQUIRED / orphan_progress`

Se preservan:

- branch;
- baseCommit;
- lastCheckpointCommit;
- orphanHeadSha;
- resumeCommit;
- locks y allowedPaths del assignment anterior.

El siguiente worker recupera y valida ese progreso antes de regenerar.

### Worker zombi

Un evento con leaseToken/leaseEpoch viejo o posterior al expiry es rechazado y no puede recuperar ownership.

## Work Registry inicial

Disponibles al finalizar esta certificación, cuando no exista otro lease compatible:

- `evidence-runtime-e2e-certification`;
- `r33-benchmark-pr-699-certification`;
- `dispatcher-provider-r33`;
- `dispatcher-provider-mls-farm`.

`dispatcher-provider-integration` depende de ambos adaptadores.

Permanecen bloqueados:

- `r33-benchmark-pr-699-integration`;
- `gate500`.

**Esta certificación no autoriza Gate 500.**

## Regla operacional

Un chat worker debe persistir después de 2–3 operaciones significativas como máximo.

La recuperación protege todo lo que haya llegado a GitHub. El razonamiento que solo haya existido dentro del contexto del chat y nunca se haya persistido no puede recuperarse.

## Conclusión

R1 cumple el objetivo operativo:

> múltiples chats pueden ejecutar `MLS siguiente`; GitHub decide automáticamente qué trabajo libre asignar, evita ownership duplicado y recupera trabajo durable cuando un worker desaparece.
