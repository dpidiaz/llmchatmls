# SND-FND-016 — Procesos contextuales y habla conectada

**Estado:** READY_FOR_COMPOSITION.  
**Versión revisada:** 2026-10-12; base `2afbec8eb45065c5ae320fef3e6cfad88f20912b`.  
**Dominio:** fonología / pronunciación.  
**Idioma:** transversal.

## 1. Los sonidos aparecen en contextos

Una pronunciación aislada de diccionario no describe necesariamente todas las realizaciones que aparecen dentro de palabras, frases y habla continua. Esta es una advertencia metodológica de MLS-SND, no una afirmación de que toda entrada léxica deba presentar alternancias.

Los segmentos pueden cambiar de realización dependiendo de los sonidos vecinos y de otras condiciones del entorno lingüístico.

## 2. Asimilación

Un proceso común es la **asimilación**, en la que una realización adquiere una propiedad relacionada con un segmento cercano.

La dirección, el rasgo afectado y las condiciones del proceso dependen de la lengua y del análisis.

MLS-SND no enseñará “asimilación” como una regla universal concreta, sino como una clase de procesos que luego debe especializarse por idioma.

## 3. Reglas y contextos

La descripción fonológica puede expresar que una unidad presenta cierta realización bajo condiciones específicas.

En una entrada MLS-SND, esas condiciones deberán escribirse en lenguaje accesible y, cuando sea útil, también mediante una representación formal.

## 4. Habla conectada

Como **índice editorial de fenómenos posibles**, el rótulo “habla conectada” podrá remitir, cuando haya evidencia para la lengua y el contexto, a:

- asimilación;
- elisión;
- reducción;
- resílabificación;
- alternancias contextuales;
- otros procesos respaldados para una lengua.

Esta enumeración no demuestra por sí sola que cada fenómeno sea productivo en una lengua dada, ni que todos ocurran exclusivamente en habla conectada. Las reglas y las frecuencias requieren evidencia específica por variedad y contexto.

## 5. Ortografía

Un proceso contextual puede no reflejarse en la escritura.

Por ello la forma ortográfica no debe utilizarse como prueba de que la realización permanece idéntica en todos los contextos.

## 6. Evidencia R33

| claim_id | afirmación | source_id | localizador exacto | alcance | estado |
|---|---|---|---|---|---|
| FND016-C01 | Las realizaciones fonéticas pueden depender del entorno fonológico | SND-SRC-0024 | §4.7 “Phonological rules”, apartados “Eliminating redundancy with simplicity” y “Writing phonological rules” | introductorio/transversal | VERIFIED |
| FND016-C02 | La asimilación es un proceso fonológico común en el que una realización adquiere propiedades de su entorno | SND-SRC-0024 | §4.9 “Types of phonological rules”, apartados “Phonation assimilation”, “Place assimilation” y “Nasality assimilation” | introductorio/transversal | VERIFIED |
| FND016-C03 | Las reglas fonológicas pueden expresar una realización condicionada por contexto | SND-SRC-0024 | §4.7 “Phonological rules” | introductorio/transversal | VERIFIED |

## 7. Fuente

Anderson, C., Bjorkman, B. M., Denis, D., Doner, J., Grant, M., Sanders, N., & Taniguchi, A. (2022). *Essentials of Linguistics* (2nd ed.). eCampusOntario Pressbooks.

## 8. Nota editorial

“Elisión”, “reducción” y otros subtipos se enumeran aquí como categorías que pueden aparecer en perfiles; sus afirmaciones específicas requieren evidencia por lengua.

## 9. Nota de auditoría y gate

Revisión lingüística/evidencial de esta versión: 2026-10-12. Los tres claims se cotejaron directamente con §4.7 y §4.9 de `SND-SRC-0024` (manual introductorio; alcance transversal). La relación fonema → alófono que ilustra la fuente es un **marco analítico**, no una obligación de analizar de igual modo todos los fenómenos en todas las lenguas. La lista de §4 es una taxonomía editorial de remisiones, no un conjunto de claims de productividad universal. No se añaden transcripciones, corpus ni frecuencias.

**Gate lingüístico/evidencial:** PASS delimitado para C01–C03 y las cautelas metodológicas de esta versión. La revisión editorial independiente también quedó completada para este núcleo; esto no implica `READY_FOR_COMPOSITION`. Se requieren nuevas fuentes/localizadores antes de cualquier ejemplificación específica por idioma.

## 10. Revisión editorial wave 02

- **Fecha:** 2026-10-12.
- **Resultado:** PASS_WITH_SCOPE_WARNING → `EDITORIAL_REVIEW`.
- **Lectura:** la entrada distingue una clase general de procesos de las reglas específicas por lengua y presenta “habla conectada” como índice editorial, no como lista universal de procesos.
- **Scope warning:** ningún fenómeno enumerado gana productividad, frecuencia o exclusividad contextual por aparecer en la lista.
- **Cambios lingüísticos/R33:** ninguno.
- **Siguiente gate:** composition readiness del núcleo actual.

## Composition readiness — 2026-10-13

- **Versión evaluada:** blob `a7cfff7c7afb01918a1c113b56fae4324eb6ccf8`.
- **Resultado:** PASS → `READY_FOR_COMPOSITION`.
- **Proyección reader-facing:** §§1–8.
- **Metadata interna excluida de la edición de lectura:** §§9–10 (auditoría/gates internos).
- **Fuentes y fundamento:** derivado de la evidencia R33 y la bibliografía ya aprobadas; los claim IDs/localizadores completos permanecen auditables en el repositorio.
- **Pronunciation Quick Layer:** `NOT_APPLICABLE` — entrada conceptual/transversal sin forma léxica cuya respelling aporte valor.
- **Autonomía escrita:** PASS; no requiere audio para comprender el contenido aprobado.
- **Open questions:** ninguna bloqueante para el núcleo actual. «Habla conectada» permanece índice editorial de fenómenos posibles, no lista universal de procesos productivos.
- **Regla para COMPOSITION:** puede ajustar presentación visual, pero no wording lingüísticamente material, claims, alcance, fuentes/localizadores ni decisiones analíticas.
