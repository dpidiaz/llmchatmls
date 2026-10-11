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
| Source Registry | v0.18 — 79 fuentes canónicas |
| R33 gate | operativo por claim/entrada |
| Entry Template | v0.1 |
| R44 Work Plan | v0.1 |
| Coordination Protocol | ACTIVO |
| Source Integration Protocol | ACTIVO |
| Integration Queue | ACTIVO |

## Snapshot canónico

**Entradas físicas únicas `SND-*.md` presentes en la rama matriz: 90.**

El árbol Git actual fue recontado tras la pausa: **90 archivos de entrada / 90 IDs únicos / 0 IDs duplicados**.

La distribución por estados que sigue debajo corresponde al último snapshot detallado de 79 entradas y se conserva como **histórico**, no como conteo global vigente. Debe recalcularse antes de declarar una distribución 90/90.

Distribución del último snapshot detallado (79 entradas):

- **30** en `EVIDENCE_CHECKED`;
- **42** en `LINGUISTIC_REVIEW`;
- **2** en `SOURCE_MAPPED`;
- **2** en `DRAFTED`;
- **1** en `RESEARCHED`;
- **1** en `RESEARCHED_PARTIAL`;
- **1** en `IN_PROGRESS`;
- **0** en `EDITORIAL_REVIEW`;
- **0** en `READY_FOR_COMPOSITION`.

Los conteos se refieren a entradas físicas canónicas, no a claims, notas de investigación o PRs. Ese audit histórico verificó **56 fuentes canónicas**, **0 referencias canónicas inexistentes** y **0 IDs de fuente locales en las entradas de aquel snapshot**. El Source Registry actual contiene 79 fuentes; las waves posteriores requieren un nuevo scan global.

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
- REP-003 — EVIDENCE_CHECKED.
- REP-004 — EVIDENCE_CHECKED.
- REP-005 — LINGUISTIC_REVIEW.
- REP-006 — LINGUISTIC_REVIEW.
- REP-007 — LINGUISTIC_REVIEW.
- REP-008 — LINGUISTIC_REVIEW.
- REP-009 — EVIDENCE_CHECKED.
- REP-010 — EVIDENCE_CHECKED.
- REP-011 — EVIDENCE_CHECKED.
- REP-012 — EVIDENCE_CHECKED.

REP-003/004 ya existen físicamente y están en `EVIDENCE_CHECKED`; el trabajo útil sobre ellos es `LINGUISTIC_REVIEW`, corrección o ampliación compatible.

## Comparación y referencia

- CMP-001 — **EVIDENCE_CHECKED**. La versión canónica incorpora el checklist editorial y dos controles empíricos con SND-SRC-0051/0052.
- REF-002 — **IN_PROGRESS**. Índice IPA vivo reaplicado limpiamente desde #7310.
- REF-001/003…008 continúan en waves o inventario según `WORK-QUEUE.md`.

## Perfiles lingüísticos integrados

### 🇬🇹 es-GT
- ESGT-001 — EVIDENCE_CHECKED.
- ESGT-002 — SOURCE_MAPPED.
- ESGT-003 — EVIDENCE_CHECKED; SND-SRC-0025 + SND-SRC-0053 (contacto, abstract-only).
- ESGT-004 — DRAFTED; mapa consonántico inicial.
- ESGT-005 — EVIDENCE_CHECKED.
- ESGT-009 — EVIDENCE_CHECKED; contacto K’iche’–español, fuentes canonicalizadas.
- ESGT-010 — EVIDENCE_CHECKED; ortografía/pronunciación, fuentes canonicalizadas.

Referencia: **REFERENCE_PROVISIONAL**; el perfil nacional mantiene variación explícita.

### 🇺🇸 en-US
Entradas físicas canónicas presentes: ENUS-001, ENUS-003, ENUS-004, ENUS-005, ENUS-006, ENUS-007, ENUS-008 y ENUS-009.

La distribución exacta de estados de las integraciones 003–008 debe entrar en el próximo scan global; no se infiere aquí a partir del merge.

Referencia: **MULTI_REFERENCE**.

### 🇧🇷 pt-BR-rio
- PTBR-001 — EVIDENCE_CHECKED.
- PTBR-006 — EVIDENCE_CHECKED.

Referencia: **REFERENCE_PROVISIONAL**; mantener PB_BROAD separado de RIO_CARIOCA.

### 🇮🇹 it
Entradas físicas canónicas presentes: IT-001, IT-004, IT-005, IT-008 e IT-009.

IT-005/009 fueron integradas con sus fuentes canonicalizadas; su distribución de estados se reconciliará en el próximo scan global.

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
Entradas físicas canónicas presentes: JA-001, JA-004, JA-008 y JA-009.

JA-004 y JA-008/009 entraron con nuevas fuentes canonicalizadas hasta SND-SRC-0079; sus estados exactos se reconciliarán en el próximo scan global.

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
9. **SOURCE-ID-INTEGRITY-02:** PASS histórico 79/79 contra Source Registry v0.13 / 56 fuentes; no se proyecta automáticamente sobre el árbol actual de 90 entradas / 79 fuentes.

## Source-ID integrity

La auditoría `SOURCE-ID-INTEGRITY-02` dio **PASS 79/79** sobre un snapshot anterior. El árbol físico actual ya creció a **90 entradas únicas** y el Source Registry a **79 fuentes**, por lo que ese PASS debe tratarse como histórico hasta repetir el scan.

Resultados verificados:

- **79** entradas físicas únicas en el snapshot auditado;
- **56** fuentes canónicas en Source Registry v0.13 en ese snapshot;
- **0** referencias `SND-SRC-*` inexistentes;
- **0** IDs de fuente locales/no canónicos dentro de entradas canónicas;
- **0** entradas promovidas sin referencia canónica.

Este PASS sustituyó al histórico 60/60 para aquel snapshot, pero ya no representa el árbol completo actual. Antes de una nueva declaración global debe repetirse el scan sobre **90 entradas / 79 fuentes**.

## Próximos gates

1. ejecutar de inmediato un nuevo reescaneo de integridad sobre **90 entradas / 79 fuentes**;
2. llevar REP-003 y REP-004 desde EVIDENCE_CHECKED a `LINGUISTIC_REVIEW`;
3. continuar LINGUISTIC_REVIEW de perfiles EVIDENCE_CHECKED y comenzar EDITORIAL_REVIEW de en-US, zh-TW, ru y otros perfiles con PASS lingüístico;
4. reconciliar waves nuevas de es-GT, fr, it, de, ja y perfiles piloto sin duplicar canónicos;
5. ejecutar EDITORIAL_REVIEW del primer bloque transversal;
6. completar los aparatos REF vivos;
7. congelar arquitectura solo después de esos gates.

## Regla operativa

Los PRs y ramas pueden cerrarse sin merge administrativo cuando su contenido se reaplica selectivamente a la matriz. Para determinar el estado canónico, **manda el archivo presente en `feat/mls-snd-foundation`**, no el estado histórico del PR.

Las cifras de este archivo son snapshots y deben volver a derivarse después de waves de integración relevantes.
