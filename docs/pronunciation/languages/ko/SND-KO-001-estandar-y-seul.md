# SND-KO-001 — Estándar y habla de Seúl

**Estado:** READY_FOR_COMPOSITION.
**Idioma:** coreano.
**Dominio:** variedad / norma / fonética.
**Referencia:** REFERENCE_PROVISIONAL.

## 1. Tres capas distintas

MLS-SND distinguirá:

1. **coreano estándar normativo**;
2. **habla contemporánea de Seúl documentada empíricamente**;
3. **romanización**.

No son tres nombres para el mismo objeto.

## 2. Norma institucional

Las Standard Pronunciation Rules del National Institute of Korean Language establecen como principio seguir la pronunciación real del estándar, con consideración de tradición y racionalidad.

La explicación oficial conecta el estándar, por principio, con el habla moderna de Seúl ampliamente usada por hablantes educados.

Esto justifica que Seúl sea un ancla importante del perfil, pero no demuestra que toda realización espontánea contemporánea de Seúl sea automáticamente normativa.

## 3. El habla de Seúl cambia

Estudios fonéticos contemporáneos documentan cambios en curso en Seúl.

En particular, la literatura sobre oclusivas muestra una reorganización de las pistas acústicas usadas para distinguir categorías en ciertas posiciones.

Por eso MLS-SND no copiará una descripción de 1993 y la etiquetará sin más como “coreano actual”.

## 4. Política del tomo

- Para reglas normativas: citar NIKL.
- Para realizaciones fonéticas: citar estudios empíricos fechados.
- Para escritura: usar hangul como escritura principal.
- Para romanización: identificar Revised Romanization cuando se utilice.
- Para IPA: describir únicamente realizaciones respaldadas por la fuente.

## 5. Evidencia R33

| claim_id | afirmación | fuente | localizador | estado |
|---|---|---|---|---|
| KO001-C01 | La norma oficial sigue la pronunciación real del estándar, condicionada por tradición y racionalidad | SND-SRC-0032 | Standard Pronunciation Rules, capítulo 1, artículo 1 | VERIFIED |
| KO001-C02 | La explicación oficial vincula el estándar por principio al habla moderna de Seúl ampliamente usada por hablantes educados | SND-SRC-0032 | comentario al artículo 1 | VERIFIED |
| KO001-C03 | El coreano de Seúl presenta cambios fonéticos contemporáneos en las pistas de las oclusivas | SND-SRC-0021 + SND-SRC-0033 | JIPA 2026, introducción/abstract; Journal of Phonetics 2018, abstract | VERIFIED |
| KO001-C04 | La romanización oficial se basa en pronunciación estándar pero no refleja todos los detalles fonéticos | SND-SRC-0012 | Basic Principles + Note 2 | VERIFIED |

## 6. Decisión editorial

Seúl será **ancla descriptiva contemporánea**, no sinónimo de “todo el coreano”.

La norma NIKL se tratará como capa normativa separada de la descripción sociophonética.

## 7. Gate

LINGUISTIC_REVIEW completado; esta entrada pasa ahora por EDITORIAL_REVIEW.


## Revisión lingüística 2026-10-11

- Alcance y variedad preservados.
- Source IDs canónicos comprobados.
- No se detectó extrapolación normativa/descriptiva incompatible con el alcance declarado.
- Gate: **LINGUISTIC_REVIEW**; aún falta EDITORIAL_REVIEW.

## Revisión editorial wave 01

- **Fecha:** 2026-10-11.
- **Resultado:** PASS.
- **Comprobado:** claridad, jerarquía, navegación conceptual y separación entre norma, habla empírica, hangul, romanización e IPA.
- **Cambios lingüísticos:** ninguno.
- **Claims R33 modificados:** ninguno.
- **Estado resultante:** EDITORIAL_REVIEW.
- **Siguiente gate:** composition-readiness; no se promueve automáticamente a READY_FOR_COMPOSITION.

## Composition readiness

- **Fecha:** 2026-10-12.
- **Resultado:** PASS → `READY_FOR_COMPOSITION`.
- **Versión evaluada (blob):** `ea2c84adcf6f91f346219f726056fc5d3e306c66`.
- **Handoff:** `docs/pronunciation/composition/handoffs/SND-KO-001.md`.
- **Pronunciation Quick Layer:** `NOT_APPLICABLE`; entrada de alcance/variedad sin forma léxica concreta.
- **Reader-facing projection:** §§1–4 y 6, fundamento visible derivado de claims verificados; tabla R33 y logs de gates internos.
- **Control:** separación norma NIKL / habla empírica de Seúl / hangul / romanización / IPA intacta; sin cambios lingüísticos/R33.
