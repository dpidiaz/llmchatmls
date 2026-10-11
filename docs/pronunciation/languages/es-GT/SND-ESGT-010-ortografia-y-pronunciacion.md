# SND-ESGT-010 — Ortografía y pronunciación

**Estado:** LINGUISTIC_REVIEW.
**Idioma:** español.
**Variedad:** Guatemala dentro del sistema ortográfico panhispánico.
**Dominio:** escritura / pronunciación / transcripción.

## 1. Dos capas que MLS-SND debe mantener separadas

El español de Guatemala utiliza el sistema ortográfico general del español, pero una ortografía no es una transcripción fonética exhaustiva.

La *Ortografía de la lengua española* de RAE/ASALE tiene como objetivo describir el **sistema ortográfico** y sus normas de escritura. MLS-SND utilizará esas reglas para la capa escrita, no como sustituto de la descripción fonética de las variedades guatemaltecas.

## 2. Un ejemplo institucional de la diferencia

La *Ortografía básica* explica que la pronunciación de determinadas secuencias vocálicas puede oscilar entre hiato, diptongo o triptongo según factores como procedencia geográfica, posición, velocidad y analogía.

Para aplicar las reglas de acentuación gráfica, la obra fija convenciones sobre qué secuencias cuentan **a efectos ortográficos**, y advierte explícitamente que esas convenciones no obligan a los hablantes a modificar su pronunciación real.

Ese principio es central para MLS-SND:

> una categoría ortográfica puede ser estable aunque la realización fonética presente variación.

## 3. Consecuencia para el perfil guatemalteco

En las entradas de es-GT se mostrarán como capas independientes, cuando sean necesarias:

1. forma ortográfica;
2. representación fonológica;
3. realización o rango de realizaciones fonéticas;
4. etiqueta de región/variedad/contexto.

No se deducirá una transcripción IPA únicamente desde la escritura.

## 4. Variación regional y escritura

La ortografía compartida no elimina la variación de pronunciación documentada dentro de Guatemala.

Por ejemplo, ESGT-005 registra variación regional de /s/ con una misma ortografía general. Esa entrada seguirá siendo responsable de describir los detalles fonéticos; ESGT-010 solo establece el principio de separación entre las capas.

## 5. Qué no debe hacer el tomo

MLS-SND no debe:

- presentar letras como si fueran sonidos;
- transcribir automáticamente cada palabra a IPA a partir de reglas ortográficas;
- tratar una convención de acentuación gráfica como prueba de silabificación fonética universal;
- utilizar diferencias ortográficas para inferir por sí solas diferencias fonológicas;
- ocultar variantes porque compartan la misma escritura.

## 6. Evidencia R33

| claim_id | afirmación | source_id | localizador | alcance | estado |
|---|---|---|---|---|---|
| ESGT010-C01 | La Ortografía 2010 describe el sistema ortográfico y las normas que rigen la escritura del español | SND-SRC-0055 | ficha ASALE “Ortografía 2010”, objetivo y características | español panhispánico / escritura | VERIFIED |
| ESGT010-C02 | La articulación de ciertas secuencias vocálicas puede variar por factores geográficos y de habla | SND-SRC-0056 | §2.4.2, párrafos introductorios sobre variación de hiato/diptongo/triptongo | español panhispánico | VERIFIED |
| ESGT010-C03 | Las convenciones de diptongo/triptongo/hiato para acentuación son ortográficas y pueden aplicarse independientemente de la articulación real | SND-SRC-0056 | §2.4.2, párrafo “Por todo ello…” | español panhispánico / ortografía | VERIFIED |
| ESGT010-C04 | Guatemala presenta variación regional de pronunciación que la ortografía compartida no codifica como variantes gráficas distintas en el fenómeno de /s/ documentado | SND-SRC-0003 | “Peculiaridades del español de Guatemala” → “Fonética y fonología”, apartado a), p. 209 | Guatemala | VERIFIED_GLOBAL |

## 7. Gate lingüístico

SND-SRC-0055, SND-SRC-0056 y SND-SRC-0003 están canonicalizadas y los claims de esta entrada fueron re-auditados.

**R33: PASS. LINGUISTIC_REVIEW: PASS.**

La distinción central queda preservada: las convenciones ortográficas de diptongo/triptongo/hiato pueden mantenerse aunque la pronunciación real varíe, por lo que la escritura no se usa como transcripción fonética automática.

## 8. Relacionado con

- SND-REP-001 — Sonido, letra y símbolo
- SND-REP-009 — Ortografía y pronunciación
- SND-ESGT-005 — /s/ y variación regional
- SND-ESGT-009 — Contacto lingüístico y alcance

## 9. Nota editorial

Esta entrada no intenta resumir la ortografía española. Solo define cómo debe usarse la escritura dentro del perfil fonético-fonológico de Guatemala.
