# MLS-SND — Auditoría de integridad de Source IDs

**Fecha:** 2026-10-11  
**Rama auditada:** `feat/mls-snd-foundation`  
**Entradas canónicas auditadas:** 60  
**Source Registry:** v0.7, `SND-SRC-0001`…`SND-SRC-0046`

## Objetivo

Comprobar dos invariantes del flujo R33:

1. ninguna entrada promovida a `EVIDENCE_CHECKED` o `LINGUISTIC_REVIEW` puede depender de un ID local de una branch;
2. todo `SND-SRC-xxxx` citado por una entrada canónica debe existir en el Source Registry global.

## Resultado

**PASS para contenido promovido.**

- 60/60 entradas canónicas recorridas.
- 0 referencias `SND-SRC` inexistentes.
- 0 entradas `EVIDENCE_CHECKED` con IDs locales.
- 0 entradas `LINGUISTIC_REVIEW` con IDs locales.
- 4 entradas pre-gate conservan IDs locales de investigación, de forma coherente con su estado.

## Entradas con IDs locales todavía permitidos

| Entrada | Estado | IDs locales | Acción |
|---|---|---|---|
| SND-DE-001 | RESEARCHED | DE-PROP-003 | canonicalizar antes de EVIDENCE_CHECKED |
| SND-DE-008 | RESEARCHED | DE-PROP-003 | canonicalizar antes de EVIDENCE_CHECKED |
| SND-ESGT-002 | SOURCE_MAPPED | ESGT-SRC-P01, ESGT-SRC-P03, ESGT-SRC-P04 | canonicalizar solo las fuentes que sostengan claims futuros |
| SND-KO-005 | RESEARCHED_PARTIAL | KO-W1-S06 | canonicalizar antes de promover |

## Interpretación

La presencia de un ID local en una entrada **no es por sí sola un error** mientras la entrada permanezca antes del gate R33 y el source map local sea reproducible.

Se convierte en bloqueo si se intenta promover la entrada a:

- `EVIDENCE_CHECKED`;
- `LINGUISTIC_REVIEW`;
- o cualquier estado posterior,

sin resolver primero la fuente global y reauditar claim ↔ source ↔ locator.

## Source Registry

El registro vivo contiene 46 IDs globales únicos y consecutivos:

`SND-SRC-0001` → `SND-SRC-0046`.

No se detectaron IDs locales dentro del Source Registry.

## Conclusión

El protocolo propuesto en PR #7320 coincide con una necesidad real del proyecto y con la práctica que ya produjo entradas canónicas limpias.

**Gate:** SOURCE-ID-INTEGRITY-01 — **PASS**.

Siguiente control recomendado: repetir esta auditoría automáticamente o manualmente después de cada wave de canonicalización masiva.
