# MLS-SND — Estado del proyecto

Última actualización: 2026-10-11.

Este archivo describe **lo que ya existe en la rama matriz** `feat/mls-snd-foundation`. Los PRs abiertos y la coordinación paralela se registran en `WORK-QUEUE.md` e `INTEGRATION-QUEUE.md`.

## Fundación editorial

| Componente | Estado |
|---|---|
| Editorial Charter | DRAFTED |
| Transcription Guide | v0.2 — decisiones base cerradas |
| Varieties Policy | v0.2 — operativa |
| Master Inventory | v0.2 — 143 unidades candidatas |
| Source Registry | v0.13 — 56 fuentes canónicas |
| R33 gate | operativo por claim/entrada |
| Entry Template | v0.1 |
| R44 Work Plan | v0.1 |
| Coordination Protocol | ACTIVO |
| Source Integration Protocol | ACTIVO |
| Integration Queue | ACTIVO |

## Snapshot canónico

**Entradas físicas únicas `SND-*.md` presentes en la rama matriz: 79.**

Distribución física verificada por `SOURCE-ID-INTEGRITY-02`:

- **30** en `EVIDENCE_CHECKED`;
- **42** en `LINGUISTIC_REVIEW`;
- **2** en `SOURCE_MAPPED`;
- **2** en `DRAFTED`;
- **1** en `RESEARCHED`;
- **1** en `RESEARCHED_PARTIAL`;
- **1** en `IN_PROGRESS`;
- **0** en `EDITORIAL_REVIEW`;
- **0** en `READY_FOR_COMPOSITION`.

Los conteos se refieren a entradas físicas canónicas, no a claims, notas de investigación o PRs. El audit también verificó **56 fuentes canónicas**, **0 referencias canónicas inexistentes** y **0 IDs de fuente locales en entradas canónicas**.

## Fundamentos

Los **18 IDs FND-001…FND-018 ya tienen entrada canónica física**.

### LINGUISTIC_REVIEW

- FND-002 — Fonética y fonología.
- FND-003 — Fonema, alófono, segmento y realización.
- FND-004 — Producción del habla y tracto vocal.
- FND-006 — Consonantes: parámetros articulatorios.
- FND-007 — Vocales: parámetros.
- FND-008 — Sílaba.
- FND-009 — Fonotáctica.
- FND-011 — Acento y prominencia.
- FND-013 — Tono.
- FND-015 — Entonación.

### EVIDENCE_CHECKED

- FND-001 — El sonido como parte del idioma.
- FND-005 — Percepción del habla.
- FND-010 — Duración y cantidad.
- FND-012 — Ritmo.
- FND-014 — Acento tonal.
- FND-016 — Procesos contextuales y habla conectada.
- FND-017 — Variación.
- FND-018 — Norma, descripción y uso.

Las waves abiertas sobre estos IDs deben tratarse como **revisión, ampliación compatible o corrección**, no como segundo canónico.

## Representación

Entradas canónicas físicas presentes:

- REP-001 — EVIDENCE_CHECKED.
- REP-002 — LINGUISTIC_REVIEW.
- REP-003 — SOURCE_MAPPED.
- REP-004 — SOURCE_MAPPED.
- REP-005 — LINGUISTIC_REVIEW.
- REP-006 — LINGUISTIC_REVIEW.
- REP-007 — LINGUISTIC_REVIEW.
- REP-008 — LINGUISTIC_REVIEW.
- REP-009 — EVIDENCE_CHECKED.
- REP-010 — EVIDENCE_CHECKED.
- REP-011 — EVIDENCE_CHECKED.
- REP-012 — EVIDENCE_CHECKED.

REP-003/004 ya existen físicamente en la matriz; cualquier wave abierta sobre ellos debe tratarse como revisión o ampliación compatible, no como creación del canónico faltante.

## Comparación y referencia

- CMP-001 — **EVIDENCE_CHECKED**. La versión canónica incorpora el checklist editorial y dos controles empíricos con SND-SRC-0051/0052.
- REF-002 — **IN_PROGRESS**. Índice IPA vivo reaplicado limpiamente desde #7310.
- REF-001/003…008 continúan en waves o inventario según `WORK-QUEUE.md`.

## Perfiles lingüísticos integrados

### 🇬🇹 es-GT
- ESGT-001 — EVIDENCE_CHECKED.
- ESGT-002 — SOURCE_MAPPED.
- ESGT-003 — DRAFTED; SND-SRC-0025 + SND-SRC-0053 (contacto, abstract-only).
- ESGT-004 — DRAFTED; mapa consonántico inicial.
- ESGT-005 — EVIDENCE_CHECKED.
- ESGT-009 — RESEARCHED; contacto K’iche’–español, fuentes canonicalizadas.
- ESGT-010 — RESEARCHED; ortografía/pronunciación, fuentes canonicalizadas.

Referencia: **REFERENCE_PROVISIONAL**; el perfil nacional mantiene variación explícita.

### 🇺🇸 en-US
- ENUS-001 — LINGUISTIC_REVIEW.
- ENUS-009 — LINGUISTIC_REVIEW.

Referencia: **MULTI_REFERENCE**.

### 🇧🇷 pt-BR-rio
- PTBR-001 — DRAFTED.
- PTBR-006 — EVIDENCE_CHECKED.

Referencia: **REFERENCE_PROVISIONAL**; mantener PB_BROAD separado de RIO_CARIOCA.

### 🇮🇹 it
- IT-001 — EVIDENCE_CHECKED.
- IT-004 — EVIDENCE_CHECKED.
- IT-008 — EVIDENCE_CHECKED.

### 🇫🇷 fr
- FR-001 — EVIDENCE_CHECKED.
- FR-002 — EVIDENCE_CHECKED.
- FR-009 — EVIDENCE_CHECKED.

Referencia: **REFERENCE_PROVISIONAL**; ancla metropolitana supralocal/norte de Francia, con datos parisinos solo cuando la fuente sea parisina.

### 🇩🇪 de
- DE-001 — EVIDENCE_CHECKED.
- DE-007 — EVIDENCE_CHECKED.
- DE-008 — RESEARCHED.

Referencia: **MULTI_REFERENCE**.

### 🇹🇼 zh-TW
- ZHTW-001 — LINGUISTIC_REVIEW.
- ZHTW-003 — RESEARCHED_PARTIAL.
- ZHTW-004 — LINGUISTIC_REVIEW.
- ZHTW-005 — LINGUISTIC_REVIEW.
- ZHTW-007 — LINGUISTIC_REVIEW.
- ZHTW-008 — LINGUISTIC_REVIEW.
- ZHTW-009 — DRAFTED.
- ZHTW-010 — LINGUISTIC_REVIEW.

Referencia: **REFERENCE_PROVISIONAL**.

### 🇰🇷 ko
- KO-001 — LINGUISTIC_REVIEW.
- KO-002 — SOURCE_MAPPED.
- KO-003…KO-010 — LINGUISTIC_REVIEW.

Referencia: **REFERENCE_PROVISIONAL**; norma institucional, habla empírica de Seúl y romanización permanecen separadas.

### 🇯🇵 ja
- JA-001 — EVIDENCE_CHECKED.

Referencia: **REFERENCE_FIXED** solo como ancla prosódica Tokio/lengua común, con límites explícitos.

### 🇷🇺 ru
- RU-001…RU-008 — LINGUISTIC_REVIEW.

Referencia: **REFERENCE_FIXED** para referencia ortoépica literaria, separada de descripción fonética y variación.

## Gates cumplidos

1. **FND-01:** primer bloque fundacional superó el gate de evidencia.
2. **PILOT-SCOPE-01:** es-GT, en-US y pt-BR-rio tienen alcance documentado.
3. **PILOT-PHENOMENA-01:** los tres perfiles piloto poseen al menos un fenómeno sustantivo con evidencia comprobada.
4. **LINGUISTIC-FOUNDATIONS-01:** diez fundamentos están actualmente en LINGUISTIC_REVIEW.
5. **REPRESENTATION-REVIEW-01:** REP-002/005/006/007/008 están en LINGUISTIC_REVIEW.
6. **SOURCE-INTEGRATION-PROTOCOL-01:** protocolo de IDs locales → canonicalización global activo.
7. **CMP-METHOD-01:** CMP-001 integrado y EVIDENCE_CHECKED.
8. **REF-IPA-SEED-01:** REF-002 integrado como índice vivo IN_PROGRESS.
9. **SOURCE-ID-INTEGRITY-02:** PASS 79/79 contra Source Registry v0.13 / 56 fuentes; 0 referencias rotas y 0 IDs locales en entradas canónicas.

## Source-ID integrity

La auditoría vigente `SOURCE-ID-INTEGRITY-02` dio **PASS 79/79** sobre el snapshot actual de `feat/mls-snd-foundation`.

Resultados verificados:

- **79** entradas físicas únicas;
- **56** fuentes canónicas en Source Registry v0.13;
- **0** referencias `SND-SRC-*` inexistentes;
- **0** IDs de fuente locales/no canónicos dentro de entradas canónicas;
- **0** entradas promovidas sin referencia canónica.

Este PASS sustituye para el snapshot actual al PASS histórico 60/60. No debe proyectarse automáticamente sobre integraciones futuras: después de cualquier lote que añada/promueva entradas o fuentes debe repetirse el scan.

## Próximos gates

1. mantener el reescaneo de integridad después de cada lote relevante de integración;
2. llevar REP-003 y REP-004 desde SOURCE_MAPPED a revisión lingüística cuando su evidencia lo permita;
3. continuar LINGUISTIC_REVIEW de perfiles EVIDENCE_CHECKED y comenzar EDITORIAL_REVIEW de en-US, zh-TW, ru y otros perfiles con PASS lingüístico;
4. reconciliar waves nuevas de es-GT, fr, it, de, ja y perfiles piloto sin duplicar canónicos;
5. ejecutar EDITORIAL_REVIEW del primer bloque transversal;
6. completar los aparatos REF vivos;
7. congelar arquitectura solo después de esos gates.

## Regla operativa

Los PRs y ramas pueden cerrarse sin merge administrativo cuando su contenido se reaplica selectivamente a la matriz. Para determinar el estado canónico, **manda el archivo presente en `feat/mls-snd-foundation`**, no el estado histórico del PR.

Las cifras de este archivo son snapshots y deben volver a derivarse después de waves de integración relevantes.
