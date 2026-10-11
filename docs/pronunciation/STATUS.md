# MLS-SND — Estado canónico del proyecto

**Corte:** 2026-10-11  
**SHA de coordinación:** `6020ef0ca75053cdd73a14aaf32896cef02b1704`  
**Rama matriz:** `feat/mls-snd-foundation`  
**Inventario editorial:** 143 unidades candidatas; no son una cuota fija de publicación.  
**Fuente de verdad:** cada archivo canónico `SND-*.md` dentro de los directorios editoriales, cotejado con el inventario.

MLS-SND es el tomo independiente de pronunciación y sistemas sonoros del MLS. No modifica los tomos lingüísticos existentes. Su contenido es enciclopédico, sin ejercicios ni dependencia obligatoria de audio. R32 organiza; R33 exige evidencia, alcance y localizadores; R44 coordina las waves.

## Snapshot físico y editorial

**106 entradas canónicas / 106 IDs únicos / 0 duplicados.**  
**91 fuentes canónicas** en Source Registry v0.19 (`SND-SRC-0001…0091`).

| Estado registrado en la entrada | Número |
|---|---:|
| EDITORIAL_REVIEW | 44 |
| LINGUISTIC_REVIEW | 35 |
| EVIDENCE_CHECKED | 22 |
| SOURCE_MAPPED | 1 |
| DRAFTED | 1 |
| RESEARCHED | 1 |
| RESEARCHED_PARTIAL | 1 |
| IN_PROGRESS | 1 |
| READY_FOR_COMPOSITION | 0 |
| **Total** | **106** |

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
| Fundamentos FND | 18 | 10 EDITORIAL_REVIEW; 3 LINGUISTIC_REVIEW; 5 EVIDENCE_CHECKED |
| Representación REP | 12 | 7 LINGUISTIC_REVIEW; 5 EVIDENCE_CHECKED |
| Comparación CMP | 1 | CMP-001 EVIDENCE_CHECKED |
| Referencia REF | 1 | REF-002 IN_PROGRESS |
| Español de Guatemala ESGT | 7 | 2 EDITORIAL_REVIEW; 3 EVIDENCE_CHECKED; 1 SOURCE_MAPPED; 1 DRAFTED |
| Inglés estadounidense ENUS | 8 | 2 EDITORIAL_REVIEW; 6 EVIDENCE_CHECKED |
| Portugués brasileño / carioca PTBR | 2 | 2 EDITORIAL_REVIEW |
| Italiano IT | 9 | 9 LINGUISTIC_REVIEW |
| Francés FR | 9 | 3 EDITORIAL_REVIEW; 6 LINGUISTIC_REVIEW |
| Alemán DE | 7 | 6 LINGUISTIC_REVIEW; 1 RESEARCHED |
| Mandarín de Taiwán ZHTW | 8 | 6 EDITORIAL_REVIEW; 1 EVIDENCE_CHECKED; 1 RESEARCHED_PARTIAL |
| Coreano KO | 10 | 9 EDITORIAL_REVIEW; 1 EVIDENCE_CHECKED |
| Japonés JA | 6 | 2 EDITORIAL_REVIEW; 4 LINGUISTIC_REVIEW |
| Ruso RU | 8 | 8 EDITORIAL_REVIEW |
| **Total** | **106** | |

## Entradas todavía pre-gate

- **ESGT-002** — SOURCE_MAPPED.
- **ESGT-004** — DRAFTED.
- **DE-008** — RESEARCHED.
- **ZHTW-003** — RESEARCHED_PARTIAL.
- **REF-002** — IN_PROGRESS.

La presencia de una fuente canónica no promueve automáticamente ninguna de estas entradas.

## Integridad de fuentes

Auditoría vigente:

`audits/STATUS-RECONCILIATION-106-91-2026-10-11.md`

Resultado estructural/referencial para el SHA indicado:

- 106 IDs canónicos únicos;
- 91 fuentes `SND-SRC-0001…0091`;
- 0 IDs de entrada duplicados;
- 0 referencias `SND-SRC-*` inexistentes detectadas en el scan completo base;
- 0 entradas `READY_FOR_COMPOSITION`.

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

1. **Gates pre-R33:** ESGT-002, ESGT-004, DE-008 y ZHTW-003.
2. **Referencia:** completar REF-002 y los demás artefactos REF todavía no físicos.
3. **Reviews:** continuar LINGUISTIC_REVIEW y EDITORIAL_REVIEW sin saltar etapas.
4. **Cobertura:** integrar únicamente IDs ausentes o revisiones compatibles; no crear segundos canónicos.
5. **Composición:** integrar el gate explícito de `READY_FOR_COMPOSITION` y luego ejecutar pilotos por versión concreta.
6. **QA:** repetir source/localizer lint después de grandes waves y siempre sobre SHA congelado.

## Coordinación por GitHub

- `WORK-QUEUE.md`: gaps y prioridades.
- `INTEGRATION-QUEUE.md`: reconciliación de waves.
- `MLS-SND-MASTER-INVENTORY.md`: inventario de 143 candidatas.
- `MLS-SND-SOURCE-REGISTRY.md`: 91 fuentes canónicas.
- `audits/STATUS-RECONCILIATION-106-91-2026-10-11.md`: corte reproducible actual.

**Regla:** el estado canónico lo determina el árbol de `feat/mls-snd-foundation`, no el título histórico de un PR.
