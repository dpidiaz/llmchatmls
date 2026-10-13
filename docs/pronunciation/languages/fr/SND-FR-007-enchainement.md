# SND-FR-007 — Enchaînement

**Estado:** READY_FOR_COMPOSITION.  
**Idioma:** francés.  
**Dominio:** habla conectada / silabificación.  
**Alcance:** SND-SRC-0018.

## 1. Qué distingue este proceso

En la descripción de Fougeron & Smith, las consonantes finales que sí se realizan suelen pasar a funcionar como ataque de la sílaba siguiente cuando la palabra posterior comienza por vocal.

Los autores denominan **enchaînement** a esa resilabificación.

## 2. Diferencia con liaison

La diferencia operativa para MLS-SND será:

- **enchaînement:** la consonante final ya pertenece a la forma pronunciada y se resilabifica;
- **liaison:** una consonante final subyacente que no aparece ante consonante emerge antes de vocal dentro del grupo rítmico.

Esta distinción evita tratar ambos fenómenos como simple “enlace”.

## 3. No es una regla ortográfica

El proceso se describe en términos fonológicos/fonéticos y de frontera de palabra. No se inferirá únicamente observando letras finales.

## 4. Evidencia R33

| claim_id | afirmación | source_id | localizador | alcance | estado |
|---|---|---|---|---|---|
| FR007-C01 | Consonantes finales realizadas suelen resilabificarse como ataques ante palabra inicial en vocal | SND-SRC-0018 | p. 75, “Word-final consonants…” | descripción del artículo | VERIFIED |
| FR007-C02 | La fuente denomina enchaînement a ese proceso | SND-SRC-0018 | p. 75, mismo párrafo | terminología del artículo | VERIFIED |
| FR007-C03 | Liaison se distingue porque involucra consonantes finales subyacentes no pronunciadas ante consonante | SND-SRC-0018 | p. 75, oración siguiente | terminología del artículo | VERIFIED |

## 5. Fuente

Fougeron, C., & Smith, C. L. (1993). French. *JIPA, 23*(2), 73–76.

## 6. Auditoría R33

- **Fecha:** 2026-10-11.
- **Resultado:** EVIDENCE_CHECKED.

## 7. Revisión editorial wave 01

- **Fecha:** 2026-10-12.
- **Resultado:** PASS → `EDITORIAL_REVIEW`.
- **Lectura:** la distinción enchaînement ↔ liaison está expresada de forma operativa y evita derivar el proceso desde la ortografía.
- **Cambios lingüísticos/R33:** ninguno.
- **Siguiente gate:** composition readiness sobre esta misma versión.

## 8. Composition readiness wave 01

- **Fecha:** 2026-10-12.
- **Versión evaluada:** blob `cd33d4a485ef5a6c83d374511955ea2de8d5504a`.
- **Resultado:** PASS → `READY_FOR_COMPOSITION`.
- **Alcance:** mantener visible la diferencia operativa enchaînement ↔ liaison y la advertencia contra inferencia ortográfica.
- **Reader-facing:** incluir §§1–3 y fundamento visible derivado; excluir tabla R33 y metadata interna.
- **Pronunciation Quick Layer:** OMITTED_WITH_REASON; no hay una forma concreta aprobada para derivación.
- **Written-only:** PASS.

