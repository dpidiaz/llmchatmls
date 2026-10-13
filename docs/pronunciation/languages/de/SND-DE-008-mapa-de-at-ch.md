# SND-DE-008 — Mapa DE/AT/CH de variación estándar

**Estado:** READY_FOR_COMPOSITION — PASS_WITH_SCOPE_WARNING como mapa de cobertura; perfiles nacionales completos pendientes.  
**Idioma:** alemán.  
**Dominio:** variación / comparación interna / estándares nacionales.  
**Política:** MULTI_REFERENCE.

## 1. Objetivo

Esta entrada no es una tabla de “cómo pronuncia cada país”.

Su función es registrar **qué tipos de evidencia ya existen** para referencias estándar de Alemania, Austria y Suiza, con su alcance y sus límites.

MLS-SND no obliga a que los tres países tengan la misma cantidad de filas ni una única respuesta nacional.

## 2. Alemania — ancla histórica y lexicográfica

La referencia de Alemania se apoya, por ahora, en:

- **SND-SRC-0019** — Kohler (1990), *Illustration of the IPA*;
- **SND-SRC-0010** — Duden, referencia lexicográfica de pronunciación e IPA.

Esto permite sostener una **capa de referencia**, pero no una descripción sociophonética contemporánea exhaustiva de Alemania.

### Warning temporal

Kohler (1990) se mantiene como referencia histórica/descriptiva.

No se utilizará por sí sola para afirmar:
- frecuencias actuales;
- distribución generacional contemporánea;
- ausencia/presencia de cambios posteriores;
- homogeneidad nacional.

Duden aporta una capa lexicográfica, no corpus de habla espontánea.

## 3. Austria — variación interna documentada

**SND-SRC-0030** estudia la realización de **-ig** en alemán estándar de Austria.

La muestra incluye:
- 52 hablantes;
- dos generaciones;
- cobertura regional austríaca dentro del diseño.

El estudio documenta variación condicionada por factores fonéticos, gramaticales, situacionales, regionales y sociales.

### Inferencia permitida

> El estándar austríaco no debe representarse como una única realización fonética invariable.

### Inferencia no permitida

> “Así se pronuncia el alemán austríaco en general”.

SND-SRC-0030 cubre un fenómeno específico, no todo el sistema.

## 4. Suiza — variación y efecto dialectal

**SND-SRC-0031** estudia calidad vocálica en cuatro dialectos alemánicos y sus variedades correspondientes de Swiss Standard German.

El trabajo documenta influencia de variedades alemánicas sobre las realizaciones estándar investigadas.

Esto respalda dos decisiones editoriales:

1. Swiss Standard German no se trata como simple copia fonética del estándar federal alemán;
2. tampoco se trata como una pronunciación suiza única y homogénea.

### Research lead adicional

Büchler, Bülow & Britain (2024) aporta contexto sociolingüístico contemporáneo sobre variación fonético-fonológica en spoken Swiss Standard German.

Ese artículo puede enriquecer una wave futura, pero **no es necesario para este gate** y no recibe ID canónico aquí.

## 5. Tres capas que deben permanecer separadas

Una futura tabla DE/AT/CH distinguirá:

1. **norma / referencia lexicográfica**;
2. **realización fonética documentada**;
3. **variación regional/social/situacional**.

No se inferirá una de otra.

## 6. Mapa de cobertura actual

| Área | Fuente principal | Cobertura | Estado |
|---|---|---|---|
| Alemania | SND-SRC-0019 | Illustration histórica | EVIDENCE_MAPPED_WITH_DATE_WARNING |
| Alemania | SND-SRC-0010 | referencia lexicográfica / IPA | EVIDENCE_MAPPED_LEXICOGRAPHIC |
| Austria | SND-SRC-0030 | variación de -ig | EVIDENCE_CHECKED_CLUSTER |
| Suiza | SND-SRC-0031 | calidad vocálica / influencia alemánica | EVIDENCE_CHECKED_CLUSTER |

## 7. Evidencia R33

| claim_id | afirmación | fuente | localizador | alcance | estado |
|---|---|---|---|---|---|
| DE008-C01 | Kohler 1990 proporciona una Illustration del alemán, pero no cubre por sí sola los estándares nacionales contemporáneos DE/AT/CH | SND-SRC-0019 | pp. 48–50 + limitación del Source Registry | Alemania / histórico | VERIFIED_WITH_DATE_SCOPE |
| DE008-C02 | Duden aporta pronunciación lexicográfica e IPA, no una descripción nacional sociophonética completa | SND-SRC-0010 | “Aussprache” → “Lautschriftzeichen” | lexicográfico | VERIFIED_SCOPE_ONLY |
| DE008-C03 | La realización austríaca de -ig varía según factores fonéticos y extralingüísticos dentro del estudio | SND-SRC-0030 | pp. 143–175; metodología/resultados | Austria / fenómeno específico | VERIFIED |
| DE008-C04 | El estudio austríaco incluye 52 hablantes, dos generaciones y cobertura regional | SND-SRC-0030 | metodología | Austria / muestra | VERIFIED |
| DE008-C05 | La calidad vocálica del Swiss Standard German estudiado muestra influencia de dialectos alemánicos | SND-SRC-0031 | Abstract; Methods; Results; Discussion | Suiza / cuatro áreas | VERIFIED |
| DE008-C06 | SND-SRC-0031 no representa toda la fonética del Swiss Standard German | SND-SRC-0031 | alcance y limitación del Source Registry | Suiza | VERIFIED_SCOPE_ONLY |

## 8. Regla de publicación

Una futura tabla DE/AT/CH deberá registrar por rasgo:

- fenómeno;
- estándar/área;
- realización documentada;
- contexto;
- fuente;
- fecha/población cuando sea relevante;
- estatus: descriptivo, normativo o lexicográfico.

No se publicará una celda simplemente para “completar” los tres países.

## 9. Gate

**R33: EVIDENCE_CHECKED como mapa MULTI_REFERENCE.**

Este gate valida:
- trazabilidad;
- separación de estándares;
- alcance de las fuentes;
- warnings temporales y de fenómeno.

No valida:
- tres perfiles nacionales completos;
- una única pronunciación por país;
- equivalencia entre norma y uso espontáneo;
- READY_FOR_COMPOSITION.

Siguiente gate: ampliación de cobertura + LINGUISTIC_REVIEW independiente.

## 10. Revisión lingüística wave 02

- **Fecha:** 2026-10-12.
- **Versión revisada:** blob `7b4426555ea76bfeb7c9ea3cd8409519a8863533`.
- **Resultado:** PASS_WITH_SCOPE_WARNING → `LINGUISTIC_REVIEW`.
- **Arquitectura:** `MULTI_REFERENCE` es obligatoria; Alemania, Austria y Suiza no se colapsan en una referencia fonética única.
- **Alemania:** Kohler (1990) permanece ancla histórica/descriptiva con warning temporal; Duden permanece capa lexicográfica.
- **Austria:** SND-SRC-0030 sustenta solo el cluster de variación de `-ig`, no el sistema nacional completo.
- **Suiza:** SND-SRC-0031 sustenta calidad vocálica/influencia alemánica en las áreas del estudio, no toda la fonética del Swiss Standard German.
- **Gate:** se valida el mapa y sus límites; los tres perfiles nacionales completos siguen pendientes.
- **Siguiente gate:** EDITORIAL_REVIEW independiente del mapa. Una ampliación material de cobertura nacional debe reabrir los gates afectados.

## 11. Revisión editorial wave 01

- **Fecha:** 2026-10-12.
- **Versión revisada:** blob `ab23a88525b042f795beae4c7da7eeb4438ed1c2`.
- **Resultado:** PASS_WITH_SCOPE_WARNING → `EDITORIAL_REVIEW`.
- **Lectura:** el objetivo de mapa, las tres capas de evidencia y la regla de publicación quedan explícitos antes de cualquier futura tabla DE/AT/CH.
- **Jerarquía:** Alemania, Austria y Suiza conservan secciones separadas y cobertura asimétrica; no se fuerza una fila equivalente por país.
- **Warnings:** Kohler (1990) permanece marcado como histórico; Duden como lexicográfico; Austria y Suiza como clusters de fenómeno/muestra.
- **Cambios lingüísticos/R33:** ninguno.
- **Siguiente gate:** composition readiness de este mapa exacto. Una ampliación material de cobertura nacional reabre los gates afectados.

## 12. Composition readiness wave 01

- **Fecha:** 2026-10-12.
- **Versión evaluada:** blob `17a00802d6ae267a5c92961bede3e55ed0c84abd`.
- **Resultado:** PASS → `READY_FOR_COMPOSITION` como mapa MULTI_REFERENCE.
- **Open questions no bloqueantes:** ampliar cobertura nacional y evaluar nuevas fuentes; no se permite convertir el mapa actual en perfiles completos por composición.
- **Reader-facing:** incluir §§1–6 y 8; derivar fundamento visible de claims verificados; excluir tabla R33 y metadata de gates.
- **Pronunciation Quick Layer:** NOT_APPLICABLE; entrada comparativa de cobertura.
- **Written-only:** PASS.

