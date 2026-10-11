# MLS-SND claim — status-reconciler-tool-wave-01

- Área: coordinación / consistencia global.
- Tipo: herramienta local de auditoría.
- Base: feat/mls-snd-foundation.
- Estado: ACTIVE.
- Fecha: 2026-10-11.

## Objetivo

Crear un reconciliador sin dependencias externas que calcule desde el árbol del repositorio:

- número real de entradas SND;
- distribución por gate;
- IDs únicos del Master Inventory;
- conteo y duplicados del Source Registry;
- referencias a SND-SRC inexistentes;
- discrepancias entre estado de archivo e inventario;
- discrepancias entre STATUS.md y el estado real.

## Límites

- no cambia contenido lingüístico;
- no promueve gates;
- no renumera IDs;
- no depende de servicios externos;
- no escribe automáticamente STATUS.md: solo audita y reporta.
