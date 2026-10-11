# MLS-SND — Estado canónico del proyecto

**Corte:** 2026-10-11 (incluye IT-002/003/006/007 y revisión italiana 9/9)  
**Rama matriz:** `feat/mls-snd-foundation`  
**Inventario:** 143 unidades candidatas; no son una cuota fija de publicación.  
**Fuente de verdad para cada entrada:** su archivo `SND-*.md`, cotejado con `MLS-SND-MASTER-INVENTORY.md`.

MLS-SND es el tomo independiente de pronunciación y sistemas sonoros. No modifica los tomos lingüísticos existentes. Su contenido es enciclopédico, sin ejercicios ni dependencia obligatoria de audio. R32 organiza; R33 exige evidencia, alcance y localizadores; R44 coordina las waves.

## Snapshot físico y editorial

**94 entradas físicas / 94 IDs únicos / 0 duplicados.**  
**79 fuentes canónicas** en Source Registry v0.18 (`SND-SRC-0001…0079`).

| Estado registrado en el encabezado de cada entrada | Número |
|---|---:|
| EDITORIAL_REVIEW | 40 |
| LINGUISTIC_REVIEW | 21 |
| EVIDENCE_CHECKED | 25 |
| SOURCE_MAPPED | 3 |
| DRAFTED | 2 |
| RESEARCHED | 1 |
| RESEARCHED_PARTIAL | 1 |
| IN_PROGRESS | 1 |
| READY_FOR_COMPOSITION | 0 |
| **Total** | **94** |

**Importante:** `EDITORIAL_REVIEW` significa que la entrada alcanzó esa etapa de revisión, **no** que esté aprobada para composición. `EVIDENCE_CHECKED` no equivale a publicación ni valida automáticamente todos los claims futuros.

## Distribución por bloque

| Bloque | Entradas | Estado / alcance |
|---|---:|---|
| Fundamentos FND | 18 | 10 EDITORIAL_REVIEW; 2 LINGUISTIC_REVIEW; 6 EVIDENCE_CHECKED |
| Representación REP | 12 | 7 LINGUISTIC_REVIEW; 5 EVIDENCE_CHECKED |
| Comparación CMP | 1 | CMP-001 EVIDENCE_CHECKED |
| Referencia REF | 1 | REF-002 IN_PROGRESS; índice IPA vivo |
| Español de Guatemala es-GT | 7 | 5 EVIDENCE_CHECKED; 1 SOURCE_MAPPED; 1 DRAFTED |
| Inglés estadounidense en-US | 8 | 2 EDITORIAL_REVIEW; 6 EVIDENCE_CHECKED |
| Portugués brasileño / carioca pt-BR-rio | 2 | 2 EDITORIAL_REVIEW |
| Italiano it | 9 | 9 LINGUISTIC_REVIEW |
| Francés fr | 3 | 3 EDITORIAL_REVIEW, con límites de referencia |
| Alemán de | 3 | 2 EVIDENCE_CHECKED; 1 RESEARCHED |
| Mandarín de Taiwán zh-TW | 8 | 6 EDITORIAL_REVIEW; 1 RESEARCHED_PARTIAL; 1 DRAFTED |
| Coreano ko | 10 | 9 EDITORIAL_REVIEW; 1 SOURCE_MAPPED |
| Japonés ja | 4 | 3 LINGUISTIC_REVIEW; 1 SOURCE_MAPPED |
| Ruso ru | 8 | 8 EDITORIAL_REVIEW |
| **Total** | **90** | |

## Integridad de fuentes

Auditoría de base: `audits/SOURCE-ID-INTEGRITY-90-2026-10-11.md` (90/79, SHA congelado de ese corte). Después se integraron cuatro entradas IT-002/003/006/007, todas con fuentes canónicas comprobadas individualmente; **el siguiente PASS global debe reescanear 94/79**.

- **PASS referencial del corte anterior:** 90 archivos inspeccionados; 90 IDs únicos. El árbol actual tiene 94 entradas únicas tras cuatro incorporaciones italianas.
- 79 fuentes registradas con IDs contiguos.
- **0** referencias `SND-SRC-NNNN` fuera del registro.
- **0** IDs locales de wave detectados mediante los patrones examinados.
- **93/94** entradas con al menos una referencia canónica (los cuatro IT nuevos usan IDs ya registrados).
- **SND-ZHTW-009** permanece `DRAFTED` sin referencia canónica; requiere source mapping, no promoción.
- **0** entradas en `READY_FOR_COMPOSITION`.

El PASS histórico es **estructural/referencial**, no certifica que cada claim esté bien sustentado, que sus localizadores sean correctos ni que las licencias permitan cualquier reutilización. El linter definitivo deberá repetir el control sobre un SHA congelado.

El PASS histórico 79/79 (Source Registry v0.13 / 56 fuentes) sigue archivado como antecedente, **no** se usa como sustituto del control actual.

## Políticas de alcance que siguen vigentes

- **es-GT:** referencia guatemalteca provisional, variación explícita; los datos de contacto K’iche’–español no se generalizan a todo el país.
- **en-US:** MULTI_REFERENCE; no presentar General American como una variedad homogénea única.
- **pt-BR-rio:** mantener `PB_BROAD`, `RIO_CARIOCA` y subalcances empíricos separados.
- **fr:** París, norte de Francia, metropolitano y supralocal no son etiquetas equivalentes; la referencia editorial definitiva sigue condicionada al corpus.
- **de:** MULTI_REFERENCE; distinguir Alemania, Austria y Suiza.
- **zh-TW:** separar sistema tonal, variación, Zhuyin, romanización e IPA.
- **ko:** separar norma institucional, habla empírica de Seúl y romanización.
- **ja:** Tokio/lengua común es ancla prosódica, no descripción universal; los corpus históricos no prueban vigencia contemporánea sin control.
- **ru:** ancla ortoépica literaria separada de descripción fonética y variación.

## Trabajo pendiente priorizado

1. **R33:** completar source mapping de ZHTW-009 y los tres IDs en `SOURCE_MAPPED` (ESGT-002, KO-002, JA-004); resolver DE-008 y ZHTW-003 sin saltar gates.
2. **QA reproducible:** linter a SHA fijo, detección exhaustiva de IDs locales, coherencia de estados y localizadores de claims.
3. **Lingüística/editorial:** continuar reviews de las 32 entradas EVIDENCE_CHECKED; conservar warnings de alcance, especialmente francés y japonés.
4. **Cobertura:** integrar waves activas de perfiles sin crear un segundo archivo para un ID existente; Italia IT-001…009 ya tiene nueve entradas físicas en LINGUISTIC_REVIEW.
5. **Referencia:** completar glosario, índices, tablas de romanización, bibliografías y grafo de referencias cruzadas.
6. **Composición:** definir y ejecutar un gate explícito de `READY_FOR_COMPOSITION`; no inferirlo de `EDITORIAL_REVIEW`.

## Coordinación por GitHub

- `WORK-QUEUE.md`: asignación y gaps; consultar PRs abiertos antes de reclamar.
- `INTEGRATION-QUEUE.md`: reconciliación y decisiones de clean reapply.
- `MLS-SND-MASTER-INVENTORY.md`: 143 candidatas y estado actualizado de los 90 IDs físicos.
- `MLS-SND-SOURCE-REGISTRY.md`: identidad y alcance de 79 fuentes.
- `audits/SOURCE-ID-INTEGRITY-90-2026-10-11.md`: control estructural del corte anterior 90/79; repetir sobre 94/79.

**Regla:** el estado canónico lo determina el contenido de la rama matriz, no el título o estado histórico de un PR. Una wave paralela puede producir revisión o ampliación, pero no un segundo canónico ni una promoción editorial sin gate.
