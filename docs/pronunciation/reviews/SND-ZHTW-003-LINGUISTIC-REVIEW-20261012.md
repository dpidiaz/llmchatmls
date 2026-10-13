# SND-ZHTW-003 — Revisión lingüística 2026-10-12

## Alcance

Revisión independiente del gate `EVIDENCE_CHECKED → LINGUISTIC_REVIEW` sobre la versión canónica cuyo blob de entrada era:

`18f9dda5284af0a0d264244a23ff9bfd43470083`

La revisión evalúa el texto **como mapa de evidencia segmental**, no como inventario fonémico definitivo.

## Controles aplicados

- separación fonología `/ /` ↔ fonética `[ ]` ↔ medida acústica;
- alcance de las etiquetas tradicionales `initial/final`;
- separación Zhuyin / Hanyu Pinyin / IPA / análisis fonológico;
- variedad `Taiwan Mandarin` bajo `REFERENCE_PROVISIONAL`;
- tratamiento de `phones` de corpus frente a unidades fonológicas;
- preservación de propuestas analíticas como `ANALYTICAL_CHOICE`;
- mantenimiento de variación regional/contextual y de OPEN_QUESTION.

## Fuentes y roles revisados

- **SND-SRC-0044** — marco comparativo de Mandarin/variantes; no autoriza por sí sola un inventario exclusivo de Taiwan Mandarin. Su claim cuantitativo permanece en HOLD sin localizador interno fino.
- **SND-SRC-0045** — variación norte/sur en mergers de nasales finales; fenómeno específico.
- **SND-SRC-0046** — variación/merger de sibilantes; fenómeno específico y no descripción segmental completa.
- **SND-SRC-0092** — calidad vocálica acústica de seis hombres de Taipei; muestra pequeña, masculina y fechada.
- **SND-SRC-0093** — articulación de /n/–/ŋ/ finales; fenómeno específico.
- **SND-SRC-0094** — corpus/fonotáctica y tablas de *phones*; evidencia de superficie/corpus, no inventario fonémico definitivo.
- **SND-SRC-0095** — propuesta de cinco vocales; se conserva como `ANALYTICAL_CHOICE`.
- **SND-SRC-0096** — VOT de oclusivas aspiradas/no aspiradas; evidencia acústica específica.

## Hallazgo lingüístico

La versión revisada no colapsa representación y realización:

1. los pares de SND-SRC-0094 están escritos entre corchetes y tratados como *phones*;
2. la oposición aspirada/no aspirada se mantiene separada de la medición VOT de SND-SRC-0096;
3. la propuesta vocálica de SND-SRC-0095 se distingue de la calidad fonética medida por SND-SRC-0092;
4. los mergers de sibilantes y nasales se presentan como variación documentada, no como forma obligatoria;
5. la tabla futura ya exige columnas separadas para representación fonológica, sistemas gráficos/romanizados, IPA y realizaciones.

Se añadió un guard explícito: `initial/final` organiza el mapa, pero no funciona como inventario fonémico ni convierte automáticamente escritura/romanización en IPA.

## Veredicto

**PASS_WITH_SCOPE_WARNING → LINGUISTIC_REVIEW**

La entrada pasa el gate para su alcance actual de mapa. Permanecen abiertos y fuera de este gate:

- selección de un inventario fonémico integral;
- elección editorial definitiva del análisis vocálico principal;
- cualquier claim cuantitativo tomado de SND-SRC-0044 sin localizador interno fino;
- la futura proyección reader-facing, que deberá preservar la separación de capas.

No se añadieron fuentes, IPA nuevo, pronunciaciones, equivalencias ni claims materiales nuevos.
