# MLS-SND — Estado del proyecto

Última actualización: 2026-10-11.

Este archivo describe **lo que ya existe en la rama matriz** `feat/mls-snd-foundation`. Los PRs abiertos se registran aparte en `WORK-QUEUE.md` e `INTEGRATION-QUEUE.md`.

## Fundación editorial

| Componente | Estado |
|---|---|
| Editorial Charter | DRAFTED |
| Transcription Guide | v0.2 — decisiones base cerradas |
| Varieties Policy | v0.2 — sincronizada con es-GT y fr |
| Master Inventory | v0.3 — 144 unidades candidatas |
| Source Registry | v0.10 — 50 fuentes canónicas |
| R33 gate | DRAFTED / operativo en waves |
| Entry Template | v0.1 |
| R44 Work Plan | v0.1 |
| Coordination Protocol | ACTIVO |
| Integration Queue | ACTIVO |

## Snapshot integrado

**Entradas presentes en el snapshot auditado: 73.**

Distribución por gate:

- **26** en `LINGUISTIC_REVIEW`;
- **41** en `EVIDENCE_CHECKED`;
- **6** en estados previos (`SOURCE_MAPPED`, `RESEARCHED`, `RESEARCHED_PARTIAL`, `DRAFTED` o `IN_PROGRESS`);
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

### EVIDENCE_CHECKED

- FND-001 — El sonido como parte del idioma.
- FND-005 — Percepción del habla.
- FND-012 — Ritmo.
- FND-014 — Acento tonal.
- FND-016 — Habla conectada y procesos contextuales.
- FND-018 — Norma, descripción y uso.

## Representación integrada

- REP-001 — EVIDENCE_CHECKED.
- REP-002 — LINGUISTIC_REVIEW.
- REP-005 — LINGUISTIC_REVIEW.
- REP-006 — LINGUISTIC_REVIEW.
- REP-007 — LINGUISTIC_REVIEW.
- REP-008 — LINGUISTIC_REVIEW.
- REP-009 — EVIDENCE_CHECKED.
- REP-010 — EVIDENCE_CHECKED.
- REP-011 — EVIDENCE_CHECKED.
- REP-012 — EVIDENCE_CHECKED.

REP-003/004 todavía no están presentes como entrada canónica en el snapshot auditado.

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
- DE-001 — EVIDENCE_CHECKED.
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
- KO-001 — LINGUISTIC_REVIEW.
- KO-002 — SOURCE_MAPPED.
- KO-003 — LINGUISTIC_REVIEW.
- KO-004 — LINGUISTIC_REVIEW.
- KO-005 — RESEARCHED_PARTIAL.
- KO-006 — LINGUISTIC_REVIEW.
- KO-007 — LINGUISTIC_REVIEW.
- KO-008 — LINGUISTIC_REVIEW.
- KO-009 — LINGUISTIC_REVIEW.
- KO-010 — LINGUISTIC_REVIEW.

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


## Gate SOURCE-ID-INTEGRITY-01

**HISTÓRICO / REQUIERE REEJECUCIÓN:** el último PASS documentado cubrió 60/60 entradas contra un snapshot anterior del Source Registry. El snapshot reconciliado contiene 73 entradas y 50 fuentes; no se declara 73/73 hasta ejecutar una nueva auditoría de integridad.

- 0 `SND-SRC` citados inexistentes.
- 0 entradas `EVIDENCE_CHECKED` con IDs locales.
- 0 entradas `LINGUISTIC_REVIEW` con IDs locales.
- 4 entradas pre-gate conservan IDs locales documentados y bloqueados antes de promoción.

Auditoría: `audits/SOURCE-ID-INTEGRITY-2026-10-11.md`.
