# SND-IT-006 — E y O: pronunciación y ortoepía

**Estado:** DRAFTED.  
**Idioma:** italiano.  
**Dominio:** vocales / ortoepía / escritura-pronunciación.  
**Tipo de alcance:** NORMATIVE + REFERENCE_VARIETY, con variación explícita.  
**Nivel de representación:** ortográfico / fonológico / fonético.  
**Dependencias:** SND-IT-001, SND-IT-008, SND-SRC-0008; canonicalización de IT-PROP-005.  
**Versión:** wave-03.

## 1. El problema

Las letras **e** y **o** no bastan, por sí solas, para representar toda la información vocálica relevante de una pronunciación italiana de referencia.

En la descripción fonológica estándar usada como referencia ortoépica se distinguen, en posición tónica:

- /e/ frente a /ɛ/;
- /o/ frente a /ɔ/.

Por eso una grafía como <e> o <o> no funciona como una transcripción fonética completa.

## 2. E tónica: dos calidades en la referencia DOP

El DOP afirma explícitamente que la letra **e** representa dos vocales en la ortografía italiana cuando la vocal lleva el acento tónico de la palabra: una realización tradicionalmente descrita como **aperta** y otra como **chiusa**.

En IPA, MLS-SND representará esa oposición de referencia como:

- /ɛ/ — media abierta / medio-baja anterior;
- /e/ — media cerrada / medio-alta anterior.

La elección para una palabra concreta debe proceder de una fuente lexicográfica o fonética, no de la letra por sí sola.

## 3. O tónica: contraste paralelo en el inventario estándar

La descripción fonológica del italiano estándar de Treccani incluye asimismo dos vocales medias posteriores tónicas:

- /ɔ/ — media abierta / medio-baja posterior;
- /o/ — media cerrada / medio-alta posterior.

El DOP contiene una sección específica “La lettera O” dentro de sus normas de lectura. MLS-SND la tratará como referencia ortoépica palabra por palabra cuando se necesite decidir una pronunciación normativa.

Esta wave no reconstruye reglas históricas para adivinar la calidad de <o>: la prioridad editorial es consultar la entrada o norma pertinente.

## 4. La oposición depende de la tonicidad

Treccani presenta siete fonemas vocálicos para la posición tónica del italiano estándar:

/i e ɛ a ɔ o u/

y un inventario de cinco en posición átona:

/i e a o u/

Esto significa que la oposición entre las vocales medias abiertas y cerradas pertenece, en esta descripción de referencia, al dominio tónico.

No debe inferirse que toda <e> o <o> escrita en cualquier posición requiera escoger entre cuatro timbres distintos.

## 5. Ortografía y pronunciación

SND-IT-008 ya establece la regla general:

> la escritura italiana no es una transcripción IPA.

IT-006 aplica esa regla a un caso concreto. Para una palabra con <e> o <o> tónica pueden ser necesarias tres capas separadas:

1. **grafía:** <e> o <o>;
2. **referencia fonológica/ortoépica:** /e/ ~ /ɛ/ o /o/ ~ /ɔ/;
3. **realización fonética concreta:** dependiente de la variedad, el hablante y el contexto.

El signo gráfico no debe usarse como prueba autónoma de la tercera capa.

## 6. Norma no significa uniformidad nacional

El inventario de siete vocales tónicas es útil como **modelo de referencia**, pero no describe de manera uniforme todas las pronunciaciones regionales.

Treccani documenta variación regional importante y señala neutralizaciones de las oposiciones /e ~ ɛ/ y /o ~ ɔ/ en amplias áreas y variedades.

Por ello, MLS-SND no formulará:

- “todos los italianos distinguen siempre e abierta y cerrada”;
- “todos los italianos distinguen siempre o abierta y cerrada”;
- “una realización regional diferente es incorrecta”.

En su lugar, etiquetará la fuente y el alcance: **ortoepía de referencia**, **variedad regional documentada** o **realización observada**.

## 7. Cómo leer las etiquetas “abierta” y “cerrada”

En la tradición descriptiva italiana son frecuentes los términos *aperta* y *chiusa*. MLS-SND los conservará cuando ayuden a enlazar con diccionarios y manuales, pero mostrará también IPA.

Correspondencias de referencia:

| grafía | tradicional | IPA |
|---|---|---|
| e | chiusa | /e/ |
| e | aperta | /ɛ/ |
| o | chiusa | /o/ |
| o | aperta | /ɔ/ |

La tabla describe categorías de referencia, no valores acústicos idénticos en todas las variedades.

## 8. Qué debe hacer el estudiante

Cuando la calidad de E/O sea relevante:

1. identificar si la vocal es tónica;
2. consultar la pronunciación de referencia en DOP u otra fuente admitida;
3. leer la transcripción IPA;
4. comprobar si la entrada describe una variedad regional distinta;
5. evitar deducir la calidad únicamente por analogía gráfica.

Las reglas etimológicas pueden explicar patrones históricos, pero no sustituyen la consulta lexical cuando existan excepciones o variación.

## 9. Comparación útil

Con otras lenguas que también tienen vocales medias, la etiqueta inicial debe ser **SEMEJANZA_PARCIAL**, no identidad automática.

Compartir los símbolos /e/, /ɛ/, /o/ o /ɔ/ indica una clasificación IPA comparable, pero no demuestra que los espacios acústicos ni las distribuciones léxicas sean idénticos.

## 10. Advertencia de equivalencia

**<e> ≠ un único timbre tónico en la referencia ortoépica.**  
**<o> ≠ un único timbre tónico en la referencia estándar descrita.**  
**Norma DOP ≠ pronunciación uniforme de toda Italia.**

## 11. Entradas relacionadas

- SND-FND-007 — Vocales.
- SND-FND-017 — Variación.
- SND-REP-007 — Transcripción fonológica y fonética.
- SND-IT-001 — Italiano de referencia y variedades.
- SND-IT-005 — Acento léxico.
- SND-IT-008 — Grafía y pronunciación en italiano.
- SND-IT-009 — Variación regional.

## 12. Evidencia R33

| claim_id | afirmación | source_id | localizador exacto | alcance | estado |
|---|---|---|---|---|---|
| IT006-C01 | El DOP indica que la grafía <e> representa dos vocales diferenciadas cuando porta el acento tónico | SND-SRC-0008 | “Norme per la lettura” → “La lettera E”, párrafo inicial | referencia ortoépica DOP | VERIFIED |
| IT006-C02 | El DOP dispone de secciones específicas “La lettera E” y “La lettera O” dentro de sus normas de lectura | SND-SRC-0008 | índice de “Norme per la lettura delle voci italiane” | estructura del recurso DOP | VERIFIED |
| IT006-C03 | La descripción estándar consultada distingue siete fonemas vocálicos en posición tónica, incluidos /e ɛ o ɔ/, y cinco en posición átona | IT-PROP-005 | “Inventario delle vocali”, tabla inicial | italiano estándar descrito por Treccani | SOURCED_PENDING_REGISTRY |
| IT006-C04 | Las oposiciones de vocales medias presentan neutralización y realizaciones diferentes en múltiples variedades regionales | IT-PROP-005 | “Inventario delle vocali”, párrafos sobre variantes regionales y neutralización | variedades regionales descritas en la fuente | SOURCED_PENDING_REGISTRY |
| IT006-C05 | DOP es una referencia ortoépica/lexicográfica, no una descripción exhaustiva de toda la variación regional | SND-SRC-0008 | Source Registry MLS-SND: cobertura y limitación; DOP, navegación y normas de lectura | decisión de alcance editorial | VERIFIED_BY_REGISTRY |

## 13. Fuentes APA 7

De Dominicis, A. (2010). Fonologia. En *Enciclopedia dell’Italiano*. Treccani. https://www.treccani.it/enciclopedia/fonologia_%28Enciclopedia-dell%27Italiano%29/

RAI. (2025). *DOP: Dizionario italiano multimediale e multilingue d’ortografia e di pronunzia* (2.ª ed. multimediale). https://www.dop.rai.it/

## 14. Nota editorial

- Esta entrada no presenta la norma DOP como única pronunciación legítima.
- IT006-C01 y C02 pueden sostenerse ya con la fuente canónica SND-SRC-0008.
- IT006-C03 y C04 permanecen pendientes de canonicalización de IT-PROP-005.
- La wave evita convertir reglas históricas del DOP en algoritmo productivo sin control de excepciones.
- El detalle regional debe ampliarse en SND-IT-009.

## Gate de salida

**Resultado de esta wave:** DRAFTED con dos claims canónicos VERIFIED y dos claims de variación/inventario pendientes de registro.

Para avanzar a EVIDENCE_CHECKED:
1. canonicalizar IT-PROP-005 o sustituirla por una fuente ya admitida con cobertura equivalente;
2. comprobar de forma independiente la sección “La lettera O” cuando se incorporen reglas léxicas específicas;
3. revisión lingüística de la relación entre norma ortoépica y variación regional.
