# MLS-SND claim — inventory-status-reconciliation-wave-01

- Área: integración / consistencia global.
- Tipo: auditoría + reconciliación documental.
- Base: feat/mls-snd-foundation.
- Estado: ACTIVE.
- Fecha: 2026-10-11.

## Objetivo

Recalcular el número real de IDs del Master Inventory, detectar discrepancias entre conteos declarados y tablas, y sincronizar STATUS.md con el Source Registry y las entradas efectivamente presentes en la rama matriz.

## Límites

- no cambia contenido lingüístico;
- no promueve gates;
- no renumera IDs existentes;
- no pisa trabajo de perfiles;
- cualquier discrepancia se documenta antes de corregirse.
