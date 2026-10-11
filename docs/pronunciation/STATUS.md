# MLS-SND — Estado del proyecto

Última actualización: 2026-10-11.

Este archivo describe **lo que ya existe en la rama matriz** `feat/mls-snd-foundation`. Los PRs abiertos se registran aparte en `WORK-QUEUE.md` e `INTEGRATION-QUEUE.md`.

## Fundación editorial

| Componente | Estado |
|---|---|
| Editorial Charter | DRAFTED |
| Transcription Guide | v0.2 — decisiones base cerradas |
| Varieties Policy | v0.2 — sincronizada con es-GT y fr |
| Master Inventory | v0.2 — 143 unidades candidatas |
| Source Registry | v0.6 — 27 fuentes canónicas |
| R33 gate | DRAFTED / operativo en waves |
| Entry Template | v0.1 |
| R44 Work Plan | v0.1 |
| Coordination Protocol | ACTIVO |
| Integration Queue | ACTIVO |

## Snapshot integrado

**Entradas presentes en la rama matriz: 60.**

Distribución por gate:

- **16** en `LINGUISTIC_REVIEW`;
- **36** en `EVIDENCE_CHECKED`;
- **8** en estados `RESEARCHED`, `RESEARCHED_PARTIAL`, `SOURCE_MAPPED` o `DRAFTED`;
- **0** en `EDITORIAL_REVIEW`;
- **0** en `READY_FOR_COMPOSITION`.

Los conteos anteriores se refieren a archivos de entrada `SND-*.md` integrados, no a claims o PRs.

## Fundamentos integrados

### LINGUISTIC_REVIEW

- FND-002 — Fonética y fonología.
- FND-003 — Fonema, alófono, segmento y realización.
- FND-004 — Producción del habla y tracto vocal.
- FND-006 — Consonantes: parámetros articulatorios.
- FND-007 — Vocales: parámetros.
- FND-008 — Sílaba.
- FND-009 — Fonotáctica.
- FND-010 — Duración y cantidad.
- FND-011 — Acento y prominencia.
- FND-013 — Tono.
- FND-015 — Entonación.
- FND-017 — Variación.

### Aún no integrados como entrada canónica

- FND-001 — wave activa.
- FND-005 — wave especializada activa; ruta canónica de investigación #7300.
- FND-012 — wave activa.
- FND-014 — RESEARCHED en wave activa; fuente Hyman pendiente de canonicalización.
- FND-016 — wave activa.
- FND-018 — wave activa.

## Representación integrada

- REP-002 — EVIDENCE_CHECKED.
- REP-005 — LINGUISTIC_REVIEW.
- REP-006 — LINGUISTIC_REVIEW.
- REP-007 — LINGUISTIC_REVIEW.
- REP-008 — LINGUISTIC_REVIEW.

REP-001/003/004/009/010/011/012 continúan en waves o inventario.

## Perfiles lingüísticos integrados

### 🇬🇹 es-GT
- ESGT-001 — EVIDENCE_CHECKED.
- ESGT-002 — SOURCE_MAPPED.
- ESGT-005 — EVIDENCE_CHECKED.

Referencia: **REFERENCE_PROVISIONAL**, perfil nacional con variación explícita; Ciudad de Guatemala no sustituye automáticamente al país.

### 🇺🇸 en-US
- ENUS-001 — EVIDENCE_CHECKED.
- ENUS-009 — EVIDENCE_CHECKED.

Referencia: **MULTI_REFERENCE**.

### 🇧🇷 pt-BR-rio
- PTBR-001 — EVIDENCE_CHECKED.
- PTBR-006 — EVIDENCE_CHECKED.

Referencia: **REFERENCE_PROVISIONAL**.

### 🇮🇹 it
- IT-001 — EVIDENCE_CHECKED.
- IT-004 — RESEARCHED.
- IT-008 — EVIDENCE_CHECKED.

### 🇫🇷 fr
- FR-001 — EVIDENCE_CHECKED.
- FR-002 — EVIDENCE_CHECKED.
- FR-009 — EVIDENCE_CHECKED.

Referencia: **REFERENCE_PROVISIONAL**; ancla metropolitana supralocal/norte de Francia con datos parisinos solo cuando la fuente sea parisina.

### 🇩🇪 de
- DE-001 — RESEARCHED.
- DE-007 — EVIDENCE_CHECKED.
- DE-008 — RESEARCHED.

Referencia: **MULTI_REFERENCE**.

### 🇹🇼 zh-TW
- ZHTW-001 — EVIDENCE_CHECKED.
- ZHTW-003 — RESEARCHED_PARTIAL.
- ZHTW-004 — EVIDENCE_CHECKED para mapa descriptivo básico.
- ZHTW-005 — EVIDENCE_CHECKED.
- ZHTW-007 — EVIDENCE_CHECKED.
- ZHTW-008 — EVIDENCE_CHECKED.
- ZHTW-009 — DRAFTED.
- ZHTW-010 — EVIDENCE_CHECKED.

Referencia: **REFERENCE_PROVISIONAL**.

### 🇰🇷 ko
- KO-001 — EVIDENCE_CHECKED.
- KO-002 — SOURCE_MAPPED.
- KO-003 — EVIDENCE_CHECKED.
- KO-004 — EVIDENCE_CHECKED.
- KO-005 — RESEARCHED_PARTIAL.
- KO-006 — EVIDENCE_CHECKED, alcance normativo.
- KO-007 — EVIDENCE_CHECKED para modelo de referencia.
- KO-008 — EVIDENCE_CHECKED, alcance normativo.
- KO-009 — EVIDENCE_CHECKED.
- KO-010 — EVIDENCE_CHECKED.

Referencia: **REFERENCE_PROVISIONAL**; norma institucional, habla empírica de Seúl y romanización permanecen separadas.

### 🇯🇵 ja
- JA-001 — EVIDENCE_CHECKED.

Referencia: **REFERENCE_FIXED** solo como ancla prosódica Tokio/lengua común, con límites explícitos.

### 🇷🇺 ru
- RU-001…RU-008 — EVIDENCE_CHECKED.

Referencia: **REFERENCE_FIXED** para referencia ortoépica literaria, separada de descripción fonética y variación.

## Gates cumplidos

1. **FND-01:** primer bloque fundacional alcanzó EVIDENCE_CHECKED.
2. **PILOT-SCOPE-01:** es-GT, en-US y pt-BR-rio cuentan con alcance documentado.
3. **PILOT-PHENOMENA-01:** los tres perfiles piloto cuentan con al menos un fenómeno sustantivo EVIDENCE_CHECKED.
4. **LINGUISTIC-FOUNDATIONS-01:** 12 fundamentos integrados están actualmente en LINGUISTIC_REVIEW.
5. **REPRESENTATION-REVIEW-01:** REP-005/006/007/008 están en LINGUISTIC_REVIEW.

## Próximos gates

1. completar y revisar FND-001/005/012/014/016/018;
2. integrar REP-003/004 y cerrar REP-001/009/010/011/012;
3. ejecutar LINGUISTIC_REVIEW de perfiles con waves EVIDENCE_CHECKED;
4. canonicalizar fuentes locales propuestas sin colisiones;
5. integrar CMP-001 después de source canonicalization;
6. ejecutar EDITORIAL_REVIEW del primer bloque transversal;
7. congelar arquitectura solo después de esos gates.

## Regla operativa

Los PRs y ramas pueden cerrarse sin merge administrativo cuando su contenido se reaplica a la matriz por otra wave. Para determinar el estado canónico, **manda el archivo presente en `feat/mls-snd-foundation`**, no el estado histórico del PR.
