# zh-TW wave 02 — Pre-audit de integración

**Fecha:** 2026-10-11  
**PR:** #7337  
**Tipo de revisión:** integración/R33 de referencias, **no** revisión lingüística independiente.

## 1. Resultado

**LOCAL CONSISTENCY: PASS**  
**MATRIX INTEGRATION: BLOCKED_BY_LOCAL_SOURCE_IDS**

Todos los IDs locales citados por las entradas de esta wave existen en el source map de la misma rama. No se detectaron source IDs locales huérfanos.

Sin embargo, el protocolo canónico `editorial/source-integration-protocol.md` exige que ningún ID local sobreviva al merge hacia `feat/mls-snd-foundation`.

## 2. Dependencias por entrada

### SND-ZHTW-002

Usa:
- SND-SRC-0011 — canónico;
- ZHTW-LOCAL-007;
- ZHTW-LOCAL-008;
- ZHTW-LOCAL-009.

**Gate:** no integrar hasta canonicalizar 007/008/009 y reescribir claims atómicamente.

### SND-ZHTW-003

Usa:
- SND-SRC-0044;
- SND-SRC-0045;
- SND-SRC-0046;
- ZHTW-LOCAL-007;
- ZHTW-LOCAL-008;
- ZHTW-LOCAL-009;
- ZHTW-LOCAL-010;
- ZHTW-LOCAL-011.

**Gate:** no integrar hasta canonicalizar 007–011.  
**Gate adicional:** permanece RESEARCHED_PARTIAL por razones lingüísticas incluso después de canonicalizar fuentes.

### SND-ZHTW-009

Usa:
- ZHTW-LOCAL-001.

**Gate:** no integrar hasta canonicalizar el diccionario MOE y reescribir los tres claims.

La decisión editorial `PROVISIONAL_ACCEPT` no debe elevarse automáticamente al canonicalizar la fuente.

## 3. Fuentes ya resueltas

- SND-SRC-0011 — MOE Zhuyin manual.
- SND-SRC-0044 — Fon (2020).
- SND-SRC-0045 — Fon et al. (2011).
- SND-SRC-0046 — Chiu et al. (2020).

## 4. Candidatas pendientes

- ZHTW-LOCAL-001 — MOE Revised Mandarin Chinese Dictionary.
- ZHTW-LOCAL-007 — Zhang (2009).
- ZHTW-LOCAL-008 — Chiu & Lu (2021).
- ZHTW-LOCAL-009 — Wan et al. (2024).
- ZHTW-LOCAL-010 — Wan & Jaeger (2003).
- ZHTW-LOCAL-011 — Ogasawara (2011).

## 5. Comprobaciones realizadas

- [x] Todo ID local citado existe en `SOURCES.md`.
- [x] Los IDs globales citados existen en el Source Registry de la matriz.
- [x] No se modifican archivos globales de inventario/STATUS/registry.
- [x] No se modifican ZHTW-004/005/008, propiedad del workstream tonal paralelo.
- [x] Los localizadores web transitorios se sustituyeron por páginas/secciones estables.
- [ ] Candidatas locales canonicalizadas.
- [ ] Claims reescritos a SND-SRC globales.
- [ ] Gate claim ↔ source ↔ locator reejecutado después de canonicalización.
- [ ] LINGUISTIC_REVIEW independiente.

## 6. Regla de integración

La canonicalización de fuente + reescritura de claims debe ocurrir como una operación atómica. No fusionar parcialmente una entrada dejando IDs locales.

## 7. Dictamen

El PR es **RESEARCH/INTEGRATION READY**, pero todavía **NOT MERGE READY** según el protocolo de fuentes.
