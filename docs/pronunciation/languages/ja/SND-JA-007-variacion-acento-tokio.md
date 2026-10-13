# SND-JA-007 — Variación y cambio en el acento de Tokio

**Estado:** READY_FOR_COMPOSITION.
**Idioma:** japonés.  
**Variedad:** Tokio; datos recogidos principalmente entre 1982 y 1984.  
**Dominio:** prosodia / variación.

## 1. La referencia de Tokio no es uniforme

El recurso *東京語アクセント資料* fue construido precisamente para estudiar palabras en las que se esperaba **variación acentual**.

El conjunto registra 12,803 palabras y los patrones de 19 hablantes seleccionados procurando evitar sesgos de:

- edad;
- zona dentro de Tokio —Yamanote y Shitamachi—;
- sexo.

## 2. Qué buscaba documentar

El objetivo declarado del recurso es describir la diversidad real del acento de Tokio moderno, considerado base importante del acento de la lengua común.

Esto significa que incluso dentro de la variedad que MLS-SND usa como ancla existen diferencias internas que no deben borrarse.

## 3. Dimensión generacional

Los hablantes principales nacieron entre 1911 y 1962.

La documentación y los análisis derivados del recurso registran diferencias de edad en numerosos patrones y procesos de cambio acentual.

Por tanto, una forma documentada en este corpus no debe presentarse automáticamente como “la forma actual” en 2026.

## 4. Dimensión regional dentro de Tokio

La selección distingue hablantes criados en:

- 山の手 — Yamanote;
- 下町 — Shitamachi.

El propio recurso fue diseñado para observar diversidad dentro de Tokio, no solo para proporcionar una única forma de referencia.

## 5. Relación con diccionarios

El recurso incluye además patrones registrados en cuatro diccionarios de acento.

Los análisis posteriores citados por NINJAL encontraron diferencias entre habla documentada y diccionarios para numerosas palabras.

Eso permite a MLS-SND diferenciar:

- forma lexicográfica;
- patrón observado en hablantes;
- cambio generacional;
- elección editorial de referencia.

## 6. Regla temporal

Cuando esta fuente se utilice para describir un patrón concreto, la entrada deberá conservar su fecha.

Para afirmar uso contemporáneo en 2026 puede requerirse evidencia adicional más reciente.

## 7. Evidencia R33

| claim_id | afirmación | source_id | localizador exacto | alcance | estado |
|---|---|---|---|---|---|
| JA007-C01 | El recurso contiene 12,803 palabras seleccionadas por variación acentual esperada | SND-SRC-0013 | página principal, líneas 1–2 | corpus Tokyo Accent | VERIFIED |
| JA007-C02 | Registra patrones de 19 hablantes seleccionados con control de edad, zona y sexo | SND-SRC-0013 | página principal, líneas 1–3 | muestra del recurso | VERIFIED |
| JA007-C03 | Los datos principales fueron recogidos entre 1982 y 1984 | SND-SRC-0013 | página principal, línea 1 | dimensión temporal | VERIFIED |
| JA007-C04 | El recurso fue creado para revelar la diversidad real del acento del Tokio moderno | SND-SRC-0013 | página principal, línea 1 | objetivo del recurso | VERIFIED |
| JA007-C05 | La documentación del recurso reporta diferencias de edad y procesos de cambio acentual derivados de sus análisis | SND-SRC-0013 | sección “研究”, líneas 46–55 | análisis derivados del corpus | VERIFIED |
| JA007-C06 | El recurso incluye patrones de cuatro diccionarios de acento además de los hablantes | SND-SRC-0013 | página principal, línea 1 | comparación corpus/lexicografía | VERIFIED |

## 8. Fuente

Shibata, T. (superv.), Mase, Y., & Sato, R. (Eds.). (1985/2013). *東京語アクセント資料 [A Dictionary of Tone-accent on Words in the Tokyo Dialect]*. National Institute for Japanese Language and Linguistics. https://mmsrv.ninjal.ac.jp/tokyo_accent/

## 9. Relacionado con

- SND-JA-001 — Tokio como ancla de referencia y sus límites
- SND-JA-006 — Acento tonal de Tokio como referencia
- SND-FND-017 — Variación
- SND-FND-018 — Norma, descripción y uso

## 10. Nota de auditoría

Claim ↔ source ↔ locator comprobados el 2026-10-11 contra la página institucional de NINJAL. La fuente tiene advertencia temporal explícita. La revisión lingüística independiente obtuvo PASS_WITH_NOTE; la revisión editorial de esta versión también quedó completada.


## Revisión lingüística wave 04

- **Resultado:** PASS_WITH_NOTE.
- **Control:** alcance, temporalidad y separación entre referencia de Tokio, variación interna y terminología editorial revisados de forma independiente.
- **Siguiente gate:** EDITORIAL_REVIEW.

## Revisión editorial wave 01

- **Fecha:** 2026-10-12; reaplicación limpia 2026-10-13.
- **Resultado:** PASS_WITH_TEMPORAL_SCOPE_WARNING → `EDITORIAL_REVIEW`.
- **Lectura:** la fecha de recogida 1982–1984 aparece en metadata, dimensión generacional y regla temporal antes del cierre de evidencia.
- **Separación:** patrones observados en hablantes, patrones de diccionario, cambio generacional y elección editorial de referencia permanecen como capas distintas.
- **Advertencia contemporánea:** ningún dato del corpus se presenta automáticamente como “la forma actual” en 2026; una afirmación contemporánea concreta puede requerir evidencia más reciente.
- **Cambios lingüísticos/R33:** ninguno.
- **Siguiente gate:** composition readiness sobre esta misma versión, conservando la advertencia temporal.

## Composition readiness — 2026-10-13

- **Versión evaluada:** blob `47a406025eb7a61a8119e35e6ad443754b788518`.
- **Resultado:** PASS → `READY_FOR_COMPOSITION`.
- **Proyección reader-facing:** metadata inicial y §§1–6, 8–9.
- **Metadata interna excluida:** §7 (tabla R33), §10 (auditoría interna) y bloques de revisión lingüística/editorial.
- **Fuentes y fundamento:** derivado de SND-SRC-0013, manteniendo visibles la fecha de recogida 1982–1984, el tamaño de muestra y la diferencia entre corpus y diccionarios.
- **Pronunciation Quick Layer:** `NOT_APPLICABLE` — la entrada describe variación/cambio de un recurso y no presenta una forma léxica objetivo para respelling.
- **Autonomía escrita:** PASS; no requiere audio.
- **Open questions no bloqueantes:** para afirmar patrones concretos de uso en 2026 puede requerirse evidencia más reciente; eso no impide componer la entrada histórica con su alcance explícito.
- **Regla para COMPOSITION:** no puede borrar la advertencia temporal, presentar los 19 hablantes como muestra exhaustiva ni fusionar forma lexicográfica, patrón de hablantes, cambio generacional y referencia editorial.
