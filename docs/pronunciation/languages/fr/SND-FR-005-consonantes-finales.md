# SND-FR-005 — Consonantes finales y realización contextual

**Estado:** READY_FOR_COMPOSITION.  
**Idioma:** francés.  
**Dominio:** consonantes / fonotáctica / habla conectada.  
**Alcance:** descripción de Fougeron & Smith (1993).

## 1. No hay una regla única “las consonantes finales no se pronuncian”

La fuente distingue entre consonantes finales que están presentes y se realizan, y consonantes subyacentes cuya aparición depende del contexto de la palabra siguiente.

Por eso MLS-SND evitará la regla escolar absoluta “las consonantes finales son mudas”.

## 2. Consonantes finales realizadas

Fougeron & Smith describen las consonantes finales realizadas como liberadas y señalan que, cuando las sigue una palabra inicial en vocal, suelen resilabificarse como ataques: este patrón se relaciona con **enchaînement**.

## 3. Consonantes latentes y liaison

La fuente distingue además consonantes finales subyacentes que no se pronuncian ante consonante pero sí aparecen antes de vocal dentro del mismo grupo rítmico. Ese proceso se identifica como **liaison**.

## 4. Rhotic final: variación adicional

Para la hablante de la Illustration, la rótica uvular puede debilitarse y hasta reducirse a cero en algunas posiciones finales; los autores mencionan realizaciones distintas en otros hablantes/dialectos.

Esto muestra que “consonante final” tampoco describe un comportamiento fonético uniforme entre segmentos.

## 5. Evidencia R33

| claim_id | afirmación | source_id | localizador | alcance | estado |
|---|---|---|---|---|---|
| FR005-C01 | Las consonantes finales realizadas se describen como liberadas | SND-SRC-0018 | p. 75, párrafo “Word-final consonants…” | descripción del artículo | VERIFIED |
| FR005-C02 | Ante palabra inicial en vocal suelen resilabificarse como ataques (enchaînement) | SND-SRC-0018 | p. 75, mismo párrafo | descripción del artículo | VERIFIED |
| FR005-C03 | Ciertas consonantes finales subyacentes aparecen ante vocal en el mismo grupo rítmico pero no ante consonante (liaison) | SND-SRC-0018 | p. 75, mismo párrafo | descripción del artículo | VERIFIED |
| FR005-C04 | La rótica de la hablante presenta variación y puede reducirse a cero en algunas posiciones finales | SND-SRC-0018 | p. 75, párrafo sobre rhotic | hablante parisina | VERIFIED |

## 6. Fuente

Fougeron, C., & Smith, C. L. (1993). French. *JIPA, 23*(2), 73–76.

## 7. Auditoría R33

- **Fecha:** 2026-10-11.
- **Resultado:** EVIDENCE_CHECKED.

## 8. Revisión editorial wave 01

- **Fecha:** 2026-10-12.
- **Resultado:** PASS → `EDITORIAL_REVIEW`.
- **Lectura:** la entrada desmonta la regla escolar absoluta sin mezclar consonantes finales realizadas, liaison, enchaînement y variación de la rótica.
- **Jerarquía:** la secuencia regla general → procesos contextuales → variación → evidencia es clara.
- **Cambios lingüísticos/R33:** ninguno.
- **Siguiente gate:** composition readiness sobre esta misma versión.

## 9. Composition readiness wave 01

- **Fecha:** 2026-10-12.
- **Versión evaluada:** blob `c1ac81f65a5c529385c0bb89528b55af59eae3ce`.
- **Resultado:** PASS → `READY_FOR_COMPOSITION`.
- **Alcance:** conservar separadas consonantes finales realizadas, liaison, enchaînement y variación de la rótica.
- **Reader-facing:** incluir §§1–4 y fuente/fundamento derivado; excluir tabla R33 y metadata interna.
- **Pronunciation Quick Layer:** OMITTED_WITH_REASON; no hay una forma léxica aprobada para respelling.
- **Written-only:** PASS.

