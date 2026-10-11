# MLS-SND — Estado canónico del proyecto

**Corte:** 2026-10-11  
**SHA de coordinación:** `24d5ad1c7f2b3a9102c525145f1e0d64c0285cf4`  
**Rama matriz:** `feat/mls-snd-foundation`  
**Inventario editorial:** 143 unidades candidatas; no son una cuota fija de publicación.  
**Fuente de verdad:** cada archivo canónico `SND-*.md` dentro de los directorios editoriales, cotejado con el inventario.

MLS-SND es el tomo independiente de pronunciación y sistemas sonoros del MLS. No modifica los tomos lingüísticos existentes. Su contenido es enciclopédico, sin ejercicios ni dependencia obligatoria de audio. R32 organiza; R33 exige evidencia, alcance y localizadores; R44 coordina las waves.

## Snapshot físico y editorial

**108 entradas canónicas / 108 IDs únicos / 0 duplicados.**  
**97 fuentes canónicas** (`SND-SRC-0001…0097`).

| Estado registrado en la entrada | Número |
|---|---:|
| EDITORIAL_REVIEW | 39 |
| LINGUISTIC_REVIEW | 33 |
| EVIDENCE_CHECKED | 22 |
| SOURCE_MAPPED | 0 |
| DRAFTED | 0 |
| RESEARCHED | 0 |
| RESEARCHED_PARTIAL | 1 |
| IN_PROGRESS | 1 |
| READY_FOR_COMPOSITION | 12 |
| **Total** | **108** |

**Importante:** `EDITORIAL_REVIEW` no equivale a `READY_FOR_COMPOSITION`. `EVIDENCE_CHECKED` tampoco equivale a publicación ni valida automáticamente claims futuros.

## Qué cuenta como entrada canónica

Se cuentan únicamente archivos `SND-*.md` bajo:

- `fundamentals/`
- `representation/`
- `comparative/`
- `reference/`
- `languages/<perfil>/`

No cuentan artefactos de `audits/`, `reviews/`, `claims/` o `editorial/`, aunque su nombre comience por `SND-`.

## Distribución por bloque

| Bloque | Entradas | Estado / alcance |
|---|---:|---|
| Fundamentos FND | 18 | 10 READY_FOR_COMPOSITION; 3 LINGUISTIC_REVIEW; 5 EVIDENCE_CHECKED |
| Representación REP | 12 | 7 EDITORIAL_REVIEW; 5 EVIDENCE_CHECKED |
| Comparación CMP | 1 | CMP-001 LINGUISTIC_REVIEW |
| Referencia REF | 1 | REF-002 IN_PROGRESS |
| Español de Guatemala ESGT | 7 | 2 EDITORIAL_REVIEW; 4 LINGUISTIC_REVIEW; 1 EVIDENCE_CHECKED |
| Inglés estadounidense ENUS | 8 | 1 EDITORIAL_REVIEW; 6 EVIDENCE_CHECKED; 1 READY_FOR_COMPOSITION |
| Portugués brasileño / carioca PTBR | 2 | 2 EDITORIAL_REVIEW |
| Italiano IT | 9 | 9 LINGUISTIC_REVIEW |
| Francés FR | 9 | 3 EDITORIAL_REVIEW; 6 LINGUISTIC_REVIEW |
| Alemán DE | 7 | 6 LINGUISTIC_REVIEW; 1 EVIDENCE_CHECKED |
| Mandarín de Taiwán ZHTW | 9 | 1 READY_FOR_COMPOSITION; 5 EDITORIAL_REVIEW; 2 EVIDENCE_CHECKED; 1 RESEARCHED_PARTIAL |
| Coreano KO | 10 | 9 EDITORIAL_REVIEW; 1 EVIDENCE_CHECKED |
| Japonés JA | 6 | 2 EDITORIAL_REVIEW; 4 LINGUISTIC_REVIEW |
| Ruso RU | 9 | 8 EDITORIAL_REVIEW; 1 EVIDENCE_CHECKED |
| **Total** | **106** | |

## Composición: primer bloque integrado

**12 entradas** han superado el gate por versión concreta.

Fundamentos READY_FOR_COMPOSITION:
- FND-002, FND-003, FND-004;
- FND-006, FND-007, FND-008, FND-009;
- FND-011, FND-013 y FND-015.

Perfiles READY_FOR_COMPOSITION:
- **ENUS-001 — Por qué MLS-SND no usa “General American” como una sola voz.**
- **ZHTW-007 — Zhuyin/Bopomofo.**

Los diez fundamentos cuentan con Composition Handoff Manifest canónico bajo `composition/handoffs/`. ENUS-001 conserva su handoff previo. La reader-facing projection es una vista derivada; metadata R33 y reviews permanecen en repositorio.

## Entradas todavía pre-gate

- **ZHTW-003** — RESEARCHED_PARTIAL.
- **REF-002** — IN_PROGRESS.

En el snapshot actual no queda ninguna entrada física con estado top-level SOURCE_MAPPED o DRAFTED. Esto no significa que todos los subclusters internos estén cerrados: varios mapas EVIDENCE_CHECKED conservan gaps explícitos.

## Integridad de fuentes

Auditoría vigente:

`audits/SOURCE-ID-INTEGRITY-108-97-2026-10-11.md`

Resultado estructural/referencial para el SHA indicado:

- 108 IDs canónicos únicos;
- 97 fuentes `SND-SRC-0001…0097`, sin huecos;
- 0 IDs de entrada duplicados;
- 0 referencias canónicas inexistentes detectadas en el audit diferencial;
- 0 tokens locales detectados en las 30 entradas nuevas/modificadas;
- 12/12 entradas `READY_FOR_COMPOSITION` con handoff canónico.

Este PASS **no** certifica:

- corrección semántica de cada claim;
- exactitud de todos los localizadores;
- licencias de reutilización;
- revisión lingüística;
- revisión editorial.

## Políticas de alcance vigentes

- **es-GT:** referencia guatemalteca provisional; variación regional y contacto se etiquetan explícitamente.
- **en-US:** MULTI_REFERENCE; no presentar “General American” como una pronunciación homogénea única.
- **pt-BR-rio:** mantener `PB_BROAD`, `RIO_CARIOCA` y subalcances empíricos separados.
- **fr:** París, norte de Francia, metropolitano y supralocal no son etiquetas equivalentes.
- **de:** MULTI_REFERENCE; distinguir Alemania, Austria y Suiza.
- **zh-TW:** separar sistema tonal, variación, Zhuyin, Hanyu Pinyin e IPA.
- **ko:** separar norma institucional, habla empírica de Seúl y romanización.
- **ja:** Tokio/lengua común es ancla prosódica, no descripción universal.
- **ru:** ancla ortoépica literaria separada de descripción fonética y variación.

## Trabajo pendiente priorizado

1. **Pre-EVIDENCE:** ZHTW-003 y REF-002 siguen por debajo de EVIDENCE_CHECKED.
2. **Referencia:** completar REF-002 y los demás artefactos REF todavía no físicos.
3. **Reviews:** continuar los 33 LINGUISTIC_REVIEW y 39 EDITORIAL_REVIEW sin saltar etapas.
4. **Cobertura:** integrar únicamente IDs ausentes o revisiones compatibles; no crear segundos canónicos.
5. **Composición:** continuar readiness por versión concreta; nunca promover en masa por estado anterior.
6. **QA:** repetir source/localizer lint después de grandes waves y siempre sobre SHA congelado.

## Coordinación por GitHub

- `WORK-QUEUE.md`: gaps y prioridades.
- `INTEGRATION-QUEUE.md`: reconciliación de waves.
- `MLS-SND-MASTER-INVENTORY.md`: inventario de 143 candidatas.
- `MLS-SND-SOURCE-REGISTRY.md`: 97 fuentes canónicas.
- `audits/STATUS-SYNC-108-97-WAVE-05-2026-10-11.md`: corte de workflow; `audits/SOURCE-ID-INTEGRITY-108-97-2026-10-11.md`: QA referencial vigente.

**Regla:** el estado canónico lo determina el árbol de `feat/mls-snd-foundation`, no el título histórico de un PR.
