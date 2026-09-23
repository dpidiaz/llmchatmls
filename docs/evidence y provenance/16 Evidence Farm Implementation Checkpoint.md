# R33 Evidence Farm R1 — Implementation Checkpoint

**Fecha:** 2026-09-23 UTC  
**Branch:** `r33-evidence-farm-r1`  
**Estado:** EN IMPLEMENTACIÓN

## Objetivo

Permitir que múltiples chats trabajen simultáneamente en Evidence/Provenance R33 sin duplicar entradas ni colisionar comandos del Bridge.

## Decisiones ya fijadas

- Control plane mediante GitHub Issues con leases, inspirado en MLS Farm.
- Comando natural previsto: `R33 siguientes N`.
- Claim canónico con `requestId` y `workerId` únicos.
- Heartbeat obligatorio al observar lease.
- Checkpoints de hasta 10 entradas.
- `finish`, `cancel` y `reap` idempotentes.
- El control plane no toca D1; D1 se usa únicamente mediante el runtime Evidence existente.
- Los comandos del Bridge se namespacian por `poolId/batchId/workerId`; se abandona la coordinación por números globales `command 0330`, etc.
- Gate 500 continúa bloqueado por el Gate 100 Final Report.
- Pool activo inicial: `MLS-R33-CORRECTION-REPEAT-100`, muestra fresca de 100 entradas, 10 por idioma.

## Siguiente trabajo

1. Añadir core Evidence Farm.
2. Añadir scheduler y worker events.
3. Añadir workflows GitHub Actions.
4. Añadir pruebas de leases, idempotencia, pool isolation y namespacing Bridge.
5. Robustecer guardado concurrente de resultados del MLS Chat Bridge.
6. Ejecutar tests y abrir PR.

Este archivo es un punto de reanudación persistente si la sesión de chat se interrumpe.
