# SND-ZHTW-008 — Zhuyin e IPA: funciones distintas

**Estado:** EVIDENCE_CHECKED.  
**Idioma:** mandarín de Taiwán.  
**Dominio:** representación / pronunciación.

## 1. Dos herramientas distintas

MLS-SND podrá mostrar **Zhuyin/Bopomofo** e **IPA** en una misma entrada, pero no los presentará como sistemas equivalentes.

### Zhuyin

El manual del Ministry of Education de Taiwán organiza:

- símbolos de onset;
- símbolos de rhyme;
- marcas tonales;
- tablas de sílabas del mandarín.

Su función en el tomo será conservar una convención local relevante para lectura y pronunciación en Taiwán.

### IPA

El IPA será la capa descriptiva internacional común de MLS-SND para describir propiedades fonéticas cuando haga falta precisión adicional.

## 2. Por qué no hacemos una conversión automática

Una marca o símbolo de Zhuyin pertenece a una convención de representación concreta.

Una transcripción IPA pretende explicitar propiedades fonéticas/fonológicas según el nivel de análisis adoptado.

Por ello una tabla “Zhuyin = IPA” sin contexto puede ocultar:

- variación fonética;
- decisiones analíticas;
- diferencias de nivel de representación.

## 3. Tonos

El manual del MOE incluye marcas para:

- primer tono;
- segundo tono;
- tercer tono;
- cuarto tono;
- tono neutro.

Esto documenta la **convención de anotación** del manual.

No demuestra que cada categoría tenga una única realización acústica fija. SND-ZHTW-005 muestra precisamente un caso de variación fonética dentro de Tone 1.

## 4. Orden visual recomendado

Cuando una entrada lo necesite:

**caracteres → Zhuyin → IPA → explicación**

No todas las entradas requieren las cuatro capas.

## 5. Evidencia R33

| claim_id | afirmación | source_id | localizador exacto | alcance | estado |
|---|---|---|---|---|---|
| ZHTW008-C01 | El manual MOE distingue onset, rhyme y tonal marks en Zhuyin | SND-SRC-0011 | “1. List of Phonetic Symbols”, apartados b–d | convención Zhuyin | VERIFIED |
| ZHTW008-C02 | El manual contiene marcas diferenciadas para cuatro tonos y tono neutro | SND-SRC-0011 | “d. Explanatory Table of Tonal Marks” | convención Zhuyin | VERIFIED |
| ZHTW008-C03 | La IPA mantiene una tabla descriptiva internacional con categorías fonéticas y suprasegmentales | SND-SRC-0001 | IPA Chart oficial | transversal | VERIFIED |
| ZHTW008-C04 | La realización de Tone 1 en Taiwan Mandarin muestra variación fonética documentada | SND-SRC-0022 | Abstract / Results | Tone 1, norte/centro | VERIFIED |

## 6. Fuentes

Ministry of Education, Taiwan. (2017). *The Manual of the Phonetic Symbols of Mandarin Chinese*.

International Phonetic Association. (2026). *The IPA Chart*.

Fon, J., & Chuang, Y.-Y. (2025). *When a rise is not only a rise…* https://doi.org/10.1017/S0025100324000100

## 7. Nota editorial

La secuencia visual es una decisión MLS-SND. La evidencia respalda las funciones distintas y los límites de cada capa, no una equivalencia uno-a-uno.
