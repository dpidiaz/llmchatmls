# zh-TW segmental integration — wave 03

**Fecha:** 2026-10-11  
**Rama:** `snd/integrate-zh-tw-segmental-wave-03`  
**Origen de investigación:** PR #7337 / wave 02, reaplicada limpiamente sobre la matriz actual.

## Resultado

**SOURCE CANONICALIZATION: PASS**  
**LOCAL-ID CLEANUP: PASS**  
**ZHTW-002: EVIDENCE_CHECKED (mapa descriptivo)**  
**ZHTW-003: RESEARCHED_PARTIAL (sin promoción)**

## Fuentes canonicalizadas

- ZHTW-LOCAL-007 → **SND-SRC-0092** — Zhang (2009), vocales de Taipei.
- ZHTW-LOCAL-008 → **SND-SRC-0093** — Chiu & Lu (2021), nasales finales.
- ZHTW-LOCAL-009 → **SND-SRC-0094** — Wan et al. (2024), fonotáctica/tipos silábicos.
- ZHTW-LOCAL-010 → **SND-SRC-0095** — Wan & Jaeger (2003), representación vocálica.
- ZHTW-LOCAL-011 → **SND-SRC-0096** — Ogasawara (2011), VOT.

## Verificación bibliográfica

- NCCU institucional para Zhang (2009).
- SAGE/PubMed para Chiu & Lu (2021).
- ACL Anthology para Wan et al. (2024).
- NCCU Academic Hub / University at Buffalo / DOI para Wan & Jaeger (2003).
- Taiwan Citation Index / National Central Library para Ogasawara (2011).

## Control de integridad

- No quedan `ZHTW-LOCAL-*` en ZHTW-002 ni ZHTW-003.
- SND-SRC-0092…0096 no existen en la matriz base al crear esta integración.
- Source Registry base: SND-SRC-0001…0091.
- Source Registry de esta rama: SND-SRC-0001…0096.
- No se modifica ZHTW-009: ya fue canonicalizado separadamente como SND-SRC-0080.
- No se modifica tono 004/005/008.

## ZHTW-002

Se integra como **EVIDENCE_CHECKED como mapa descriptivo**.

Eso valida:
- organización institucional de Zhuyin;
- clasificación de superficie de Wan et al.;
- muestra acústica de Zhang;
- evidencia articulatoria de Chiu & Lu.

No fija una teoría fonológica silábica única.

## ZHTW-003

Permanece **RESEARCHED_PARTIAL**.

La canonicalización elimina bloqueos de identidad de fuente, pero siguen abiertos:
1. localizadores internos más finos de SND-SRC-0044;
2. decisión sobre el análisis vocálico principal/alternativo;
3. contraste con propuestas modernas adicionales;
4. LINGUISTIC_REVIEW independiente.

## Regla de merge

Si la matriz reserva SND-SRC-0092…0096 antes del merge, renumerar atómicamente Registry + claims antes de integrar. No resolver colisiones manualmente fuera del PR.
