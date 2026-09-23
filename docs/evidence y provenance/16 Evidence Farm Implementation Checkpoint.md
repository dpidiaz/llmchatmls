# R33 Evidence Farm R1 — Implementation Checkpoint

**Fecha:** 2026-09-23 UTC  
**Branch:** `r33-evidence-farm-r1`  
**PR:** #669  
**Estado:** IMPLEMENTADO / TESTS ESPECÍFICOS PASS / PENDIENTE CHECK GENERAL Y MERGE

## Objetivo

Permitir que múltiples chats trabajen simultáneamente en Evidence/Provenance R33 sin duplicar entradas ni colisionar comandos del Bridge.

## Implementado

- Control plane mediante GitHub Issues con leases, inspirado en MLS Farm.
- Comando natural previsto: `R33 siguientes N`.
- Claim canónico con `requestId` y `workerId` únicos.
- Claim TTL: 90 s.
- ACK deadline: 5 min.
- Lease móvil tras ACK: 60 min.
- Heartbeat, checkpoint, finish, cancel y reap.
- Checkpoints idempotentes de 1–10 entradas.
- Estados terminales del ledger: `verified` y `exception`.
- Protección contra `RESULT_HASH_CONFLICT`.
- Prohibición explícita de fabricar `REVIEWED` humano.
- Scheduler y worker-event handler GitHub-only; no usan D1.
- Pool explícito/versionado; un claim nunca puede salir del pool activo.
- Pool inicial: `MLS-R33-CORRECTION-REPEAT-100`, 100 entradas frescas, 10 por idioma.
- Gate 500 permanece bloqueado (`gate500Authorized: false`).
- Bridge commands namespaced:
  `mls chat bridge/commands/r33-farm/<poolId>/<batchId>/<workerId>/<name>.json`
- Bridge result path espejo requerido por cada checkpoint.
- MLS Chat Bridge endurecido con hasta 4 intentos de fetch/rebase/push para resultados bajo concurrencia.
- Protocol R1 documentado en `MLS R32 EDITORIAL/R33 Evidence Farm Protocol R1.md`.

## Archivos principales

- `MLS R32 EDITORIAL/evidence farm core.js`
- `scripts/R33 evidence farm scheduler.cjs`
- `scripts/R33 evidence farm worker.cjs`
- `.github/workflows/R33 Evidence Farm Scheduler.yml`
- `.github/workflows/R33 Evidence Farm Worker Events.yml`
- `.github/workflows/R33 Evidence Farm Tests.yml`
- `test/r33 evidence farm.test.cjs`
- `docs/evidence y provenance/15 Evidence Farm Correction Repeat Pool.json`

## Validación

PR #669 abrió la suite específica.

Primera corrida:
- 11/12 PASS.
- 1 fallo de test por fixture incorrecta: el batch de conflicto tenía una sola entrada y quedaba `readyToClose` antes del retry.
- No fue fallo del core.

Corrección:
- fixture cambiada a dos entradas para mantener lease activo.

Segunda corrida:
- **12/12 PASS**.
- Workflow `R33 Evidence Farm Tests`: **success**.

## Seguridad del gate

El Gate 100 Final Report mantiene:

```yaml
Gate100:
  editorial: PASS
  scalability: CORRECT_AND_REPEAT
  gate500Authorized: false
```

Por ello Evidence Farm activa únicamente el Correction Repeat. No existe ruta implícita desde `R33 siguientes N` hacia Gate 500.

## Siguiente paso

1. Confirmar workflow general del PR.
2. Fusionar PR #669 si queda verde.
3. Verificar workflows presentes en `main`.
4. Ejecutar smoke test del control plane con claim pequeño/cancel o claim real del Correction Repeat.
5. A partir de ahí múltiples chats pueden usar `R33 siguientes 25`.

Este archivo es el punto de reanudación persistente si la sesión de chat se interrumpe.
