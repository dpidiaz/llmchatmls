# zh-TW segmental clean reapply — wave 04

**Fecha:** 2026-10-11
**PR:** #7467

## Resultado

**SOURCE CANONICALIZATION: PASS**
**LOCAL-ID CLEANUP: PASS**
**ZHTW-002: EVIDENCE_CHECKED como mapa descriptivo**
**ZHTW-003: RESEARCHED_PARTIAL, sin promoción**

## Integridad

- Source Registry: 96 IDs canónicos (SND-SRC-0001…SND-SRC-0096).
- Source IDs usados por ZHTW-002/003: SND-SRC-0011, SND-SRC-0044, SND-SRC-0045, SND-SRC-0046, SND-SRC-0092, SND-SRC-0093, SND-SRC-0094, SND-SRC-0095, SND-SRC-0096.
- Source IDs inexistentes: 0.
- IDs locales ZHTW-LOCAL restantes en las dos entradas: 0.

## Fuentes añadidas

- SND-SRC-0092 — Zhang (2009), vocales acústicas de Taipei.
- SND-SRC-0093 — Chiu & Lu (2021), nasales finales.
- SND-SRC-0094 — Wan et al. (2024), fonotáctica/tipos silábicos.
- SND-SRC-0095 — Wan & Jaeger (2003), representación vocálica.
- SND-SRC-0096 — Ogasawara (2011), VOT.

## ZHTW-002

Se integra como EVIDENCE_CHECKED únicamente como mapa descriptivo. Distingue organización institucional de Zhuyin, análisis fonológico atribuido, estructura de superficie del corpus y realización fonética. No fija una teoría silábica única.

## ZHTW-003

Permanece RESEARCHED_PARTIAL. La ampliación añade evidencia contemporánea y fuentes canonicalizadas, pero mantiene abiertos:

1. localizadores internos más finos de SND-SRC-0044;
2. decisión sobre análisis vocálico principal/alternativo;
3. contraste con propuestas modernas adicionales;
4. LINGUISTIC_REVIEW independiente.

## Regla de integración

El merge es válido solo si los IDs 0092…0096 continúan libres en la matriz. Si apareciera una colisión antes del merge, renumerar atómicamente Registry + claims.