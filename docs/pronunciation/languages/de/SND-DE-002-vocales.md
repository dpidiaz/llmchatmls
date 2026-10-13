# SND-DE-002 — Vocales: mapa del sistema descrito

**Estado:** READY_FOR_COMPOSITION.  
**Idioma:** alemán.  
**Dominio:** vocales / fonética.  
**Alcance:** variedad ilustrada por Kohler (1990): muchos hablantes educados del norte; grabación de un hablante de 54 años.

## 1. La fuente ofrece un sistema vocálico explícito

Kohler presenta una tabla de vocales con monoptongos y diptongos y ejemplos léxicos para las categorías que utiliza.

MLS-SND tratará esa tabla como descripción del sistema adoptado por la Illustration, no como una tabla universal para todas las variedades alemanas.

## 2. Vocales monoptongales y diptongos

La fuente distingue monoptongos y diptongos y representa ambos conjuntos en diagramas separados.

El perfil general del alemán deberá conservar esa distinción cuando explique la referencia descrita por Kohler, pero las realizaciones concretas de otros estándares nacionales requerirán sus propias fuentes.

## 3. /r/ vocalizada y espacio vocálico

El artículo representa además realizaciones vocalizadas de /r/ en ciertos contextos postvocálicos y las integra gráficamente con secuencias/diptongos en su convención descriptiva.

Esto no significa que /r/ deje de pertenecer al sistema consonántico del análisis; muestra una realización contextual que se desarrolla en SND-DE-006.

## 4. Acento y contexto

La propia fuente condiciona algunas generalizaciones de duración/calidad al acento y al entorno. Por eso MLS-SND no presentará el inventario vocálico como lista de valores acústicos invariantes.

## 5. Evidencia R33

| claim_id | afirmación | source_id | localizador exacto | alcance | estado |
|---|---|---|---|---|---|
| DE002-C01 | Kohler presenta un inventario de monoptongos y diptongos con ejemplos | SND-SRC-0019 | Kohler 1990, p. 49, sección “Vowels” y diagramas | variedad descrita por el artículo | VERIFIED |
| DE002-C02 | La fuente representa realizaciones postvocálicas vocalizadas de /r/ dentro del espacio vocálico/diptongal | SND-SRC-0019 | pp. 49–50, conventions + diagrama [ɐ] diphthongs | realización contextual del artículo | VERIFIED |
| DE002-C03 | Las generalizaciones de duración de pares vocálicos se condicionan por acento y entorno | SND-SRC-0019 | p. 50, párrafo “The closer vowels…” | variedad descrita | VERIFIED |

## 6. Fuente

Kohler, K. J. (1990). German. *Journal of the International Phonetic Association, 20*(1), 48–50. https://doi.org/10.1017/S0025100300004084

## 7. Nota editorial

Los perfiles de alemán austríaco y suizo, cuando se integren, no heredarán automáticamente este inventario ni estas realizaciones.

## 8. Auditoría R33

- **Fecha:** 2026-10-11.
- **Resultado:** EVIDENCE_CHECKED.

## 9. Revisión editorial wave 01

- **Fecha:** 2026-10-12.
- **Resultado:** PASS → `EDITORIAL_REVIEW`.
- **Lectura:** la entrada mantiene visible desde el inicio que Kohler (1990) describe una referencia delimitada y no una tabla universal DE/AT/CH.
- **Jerarquía:** inventario, realización contextual de /r/, condicionamiento por acento y evidencia aparecen en orden comprensible.
- **Cambios lingüísticos/R33:** ninguno.
- **Siguiente gate:** composition readiness sobre esta misma versión.

## 10. Composition readiness wave 01

- **Fecha:** 2026-10-12.
- **Versión evaluada:** blob `e20043f9d34a137b5b1193e1739ab57a136ca257`.
- **Resultado:** PASS → `READY_FOR_COMPOSITION`.
- **Alcance:** conservar Kohler (1990) como referencia delimitada; AT/CH no heredan automáticamente inventario ni realizaciones.
- **Reader-facing:** incluir §§1–4 y nota editorial de alcance; excluir tabla R33, auditoría y metadata de revisión.
- **Pronunciation Quick Layer:** OMITTED_WITH_REASON; no hay forma léxica concreta aprobada para respelling.
- **Written-only:** PASS.

