# SND-RU-009 — Cirílico, escritura y pronunciación

**Estado:** EVIDENCE_CHECKED.  
**Idioma:** ruso.  
**Dominio:** escritura / ortografía / pronunciación.  
**Fuente ortográfica principal:** SND-SRC-0097.

## 1. Escritura y pronunciación están relacionadas, pero no son idénticas

Las reglas académicas de ortografía describen la escritura rusa como un sistema **sonido-letra**: sus unidades básicas, las letras, se relacionan con unidades fonéticas del idioma.

La misma fuente advierte que entre sonidos y letras del alfabeto **no existen relaciones simples y unívocas**.

Por eso MLS-SND no presenta el cirílico ruso como una tabla fija de equivalencias fonéticas.

## 2. Alfabeto

La fuente académica indica que el alfabeto ruso contiene **33 letras**.

Conocer esas letras es necesario para leer la ortografía, pero no basta para predecir de forma mecánica la realización fonética de una palabra.

## 3. Dureza y blandura consonántica en la escritura

Las reglas explican que el ruso no posee letras consonánticas distintas para cada miembro de las parejas duro/blando. Una misma letra consonántica puede participar en la representación de ambas.

La distinción se codifica mediante el contexto gráfico, incluyendo pares de letras vocálicas y otros recursos ortográficos.

Esto se relaciona con **SND-RU-005**, donde la oposición palatalizada/no palatalizada se explica desde la fonética y la fonología, no desde la escritura.

## 4. Por qué la ortografía no predice toda la superficie fonética

El perfil ya documenta procesos que modifican la realización sin que la escritura sea una transcripción fonética estrecha:

- reducción vocálica dependiente del acento (**SND-RU-003**);
- ensordecimiento final y asimilación (**SND-RU-007**);
- realizaciones contextuales vinculadas a palatalización (**SND-RU-005**).

La secuencia editorial recomendada es:

**ortografía cirílica → análisis fonológico cuando corresponda → realización fonética documentada**.

## 5. Qué no hace esta entrada

Esta entrada no proporciona una tabla exhaustiva de pronunciación de las 33 letras ni deduce sonidos a partir de grafías aisladas.

Las correspondencias más específicas deberán desarrollarse únicamente cuando puedan delimitarse con evidencia suficiente y con sus excepciones.

## 6. Evidencia R33

| claim_id | afirmación | source_id | localizador exacto | alcance | estado |
|---|---|---|---|---|---|
| RU009-C01 | La escritura rusa se describe como sonido-letra y sus letras se relacionan con unidades fonéticas | SND-SRC-0097 | Gramota, “Общие сведения о русском письме”, apertura | principio gráfico/ortográfico | VERIFIED |
| RU009-C02 | El alfabeto ruso contiene 33 letras | SND-SRC-0097 | Gramota, “Общие сведения о русском письме”, tabla del alfabeto | alfabeto | VERIFIED |
| RU009-C03 | No existe una relación simple y unívoca entre sonidos y letras | SND-SRC-0097 | Gramota, “Основной принцип употребления букв”, apertura | principio gráfico | VERIFIED |
| RU009-C04 | Las parejas de consonantes duro/blando no se representan mediante dos letras consonánticas distintas | SND-SRC-0097 | Gramota, “Основной принцип употребления букв”, explicación de consonantes pares duro/blando | grafía de palatalización | VERIFIED |

## 7. Fuentes relacionadas ya canónicas

- **SND-SRC-0015** — descripción fonética/fonológica del ruso.
- **SND-SRC-0016** — ortoepía contemporánea.
- **SND-SRC-0097** — reglas académicas de ortografía y uso de letras.

## 8. Nota editorial

La fuente principal de esta entrada es ortográfica, no fonética. Para realizaciones concretas se mantienen las fuentes fonéticas del perfil.

## 9. Entradas relacionadas

- **SND-RU-003** — Reducción vocálica.
- **SND-RU-005** — Palatalización y oposición blanda/dura.
- **SND-RU-007** — Procesos contextuales.
- **SND-RU-008** — Norma ortoépica y variantes.

## 10. Gate

**R33: PASS → EVIDENCE_CHECKED.**

Este gate valida:
- identidad de fuente;
- localizadores;
- alcance ortográfico;
- separación entre grafía y realización fonética.

No valida:
- una tabla completa letra→sonido;
- pronunciaciones léxicas concretas no consultadas;
- LINGUISTIC_REVIEW ni EDITORIAL_REVIEW;
- READY_FOR_COMPOSITION.
