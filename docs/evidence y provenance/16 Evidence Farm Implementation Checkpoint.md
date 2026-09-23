> **SUPERSEDED parcialmente por R33 Evidence Farm R2.** La coordinación GitHub-only se conserva, pero la dependencia editorial del MLS Chat Bridge fue retirada. Evidence canónico vive ahora en GitHub.

# R33 Evidence Farm R1 — Implementation Checkpoint

**Fecha:** 2026-09-23 UTC  
**Estado:** IMPLEMENTADO / MERGED / SMOKE TEST PASS  
**PR principal:** #669  
**Hotfix:** #674

## Resultado

R33 Evidence Farm R1 quedó implementado en `main` para permitir trabajo Evidence/Provenance concurrente desde múltiples chats.

Commit principal de merge:

`8272fb89a715d843462018358fdd4610b088a658`

Hotfix de cancelación:

`9fa0d986600e1b2bb03e59020674224c72f8105a`

## Capacidades activas

- Comando natural: `R33 siguientes N`.
- Claim con `requestId` y `workerId` únicos.
- Claim TTL: 90 s.
- ACK deadline: 5 min.
- Lease móvil después de ACK: 60 min.
- Heartbeat.
- Checkpoints idempotentes de 1–10 entradas.
- `finish`.
- `cancel`.
- `reap`.
- Ledger persistente por pool.
- Protección contra solapamiento entre chats.
- Protección contra `RESULT_HASH_CONFLICT`.
- Prohibición de fabricar `REVIEWED` humano.
- Control plane GitHub-only: 0 interacción D1/Cloudflare.
- Bridge commands namespaced por pool, batch y worker.
- Bridge result path del propio namespace obligatorio para checkpoints.
- MLS Chat Bridge endurecido con 4 intentos de fetch/rebase/push ante concurrencia.

## Pool activo

`MLS-R33-CORRECTION-REPEAT-100`

Manifiesto:

`docs/evidence y provenance/15 Evidence Farm Correction Repeat Pool.json`

Propiedades:

```yaml
entries: 100
languages: 10
entriesPerLanguage: 10
freshVsPilot20: true
freshVsGate100: true
active: true
gate500Authorized: false
```

El pool ejecuta únicamente el Correction Repeat autorizado por el Gate 100 Final Report.

**Gate 500 sigue bloqueado.**

## Bridge namespace

Cada worker debe crear comandos exclusivamente bajo:

`mls chat bridge/commands/r33-farm/<poolId>/<batchId>/<workerId>/<name>.json`

Resultado espejo:

`mls chat bridge/results/r33-farm/<poolId>/<batchId>/<workerId>/<name>.json`

Se elimina la necesidad de coordinar números globales como `command 0330.json`.

## Pruebas

Suite específica:

`R33 Evidence Farm Tests`

Resultado final antes del merge principal:

- 12/12 PASS.

Hotfix de cancelación añadió regresión adicional:

- cancel explícito tiene precedencia sobre expiry al calcular `releaseReason`.
- suite específica PASS.
- check general del repositorio PASS.
- `test:chat-editorial` PASS.
- `test:evidence` PASS.
- canonical tools PASS.
- QA baseline PASS.
- predeploy PASS.
- recovery verify PASS.
- deploy-contract PASS.
- `npm run check` PASS.

## Smoke test multi-chat real

Claims simultáneos:

- Issue #670 → `MLS-V10-0093`
- Issue #671 → `MLS-V10-0186`

Resultado:

- códigos distintos;
- 0 solapamiento;
- ambos leases reconocidos por heartbeat;
- ambos cancelados;
- ambos códigos liberados;
- ningún resultado terminal escrito.

El primer smoke detectó una semántica incorrecta en `releaseReason`: cancelación quedaba etiquetada como `LEASE_TIMEOUT`. No afectaba la liberación ni el ledger, pero se corrigió en PR #674.

## Smoke test post-hotfix

Issue #675:

- asignada: `MLS-V10-0093`;
- heartbeat aceptado;
- cancel aceptado;
- reap: Issue #676.

Resultado canónico:

```yaml
status: cancelled
releaseReason: WORKER_CANCELLED
releasedCodes:
  - MLS-V10-0093
```

Estado final del pool tras smoke:

```yaml
total: 100
terminal: 0
verified: 0
exceptions: 0
leased: 0
activeBatches: 0
partialResults: 0
pending: 100
gate500Authorized: false
```

Ledger operativo: Issue #672.

## Protocolo

Contrato durable:

`MLS R32 EDITORIAL/R33 Evidence Farm Protocol R1.md`

Secuencia de cada chat:

`claim → heartbeat → Evidence/Bridge namespaced → checkpoint(s) → finish`

Si el chat no puede continuar:

`cancel → reap`

## Estado de continuidad

La implementación está lista para uso real.

Varios chats pueden abrir simultáneamente:

`R33 siguientes 25`

Cada chat debe recibir un lote distinto del pool Correction Repeat.

La conversación no es fuente de verdad. Para reanudar desde cualquier chat se debe leer:

1. manifiesto del pool;
2. ledger Issue #672;
3. batches activos `[R33 Evidence Farm][LEASED]`;
4. resultados namespaced del Bridge.

Este checkpoint permite reanudación exacta si cualquier chat se interrumpe.


## SUPERSEDED — control plane R1

Las rutas Bridge descritas aquí son históricas. El protocolo activo es R2 y usa artefactos Evidence Git + commit SHA.
