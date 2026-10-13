# SND-RU-005 — Palatalización y oposición “blanda/dura”

**Estado:** READY_FOR_COMPOSITION.  
**Idioma:** ruso.  
**Dominio:** consonantes / fonología / articulación.  
**Alcance:** análisis de SND-SRC-0015.

## 1. Una oposición central en la descripción consonántica

Yanushevskaya y Bunčić caracterizan el sistema consonántico ruso mediante una oposición fonológica entre consonantes palatalizadas (“blandas”) y no palatalizadas (“duras”) que alcanza a casi todas las consonantes, con un pequeño conjunto de excepciones.

MLS-SND utilizará “blanda” y “dura” solo como etiquetas tradicionales acompañadas por la explicación articulatoria y fonológica correspondiente.

## 2. No palatalizada no significa simplemente “sin nada añadido”

En el análisis del artículo, las consonantes no palatalizadas se realizan con velarización, especialmente perceptible en ciertos segmentos.

Esto es relevante porque una comparación pedagógica que trate la serie “dura” como una consonante neutral idéntica a la de otro idioma podría borrar información fonética real.

## 3. Palatalización no es simplemente “agregar una y”

La fuente explica que la articulación secundaria de palatalización en su forma más pura se observa en bilabiales y labiodentales. En otras consonantes, la oposición va acompañada por ajustes adicionales de lugar y/o modo de articulación.

Entre los ejemplos que da el artículo están cambios en las coronales palatalizadas, la realización de /rʲ/ y el adelantamiento del lugar de articulación en velares palatalizadas.

Por eso MLS-SND no utilizará una equivalencia ortográfica del tipo “consonante + y = consonante blanda” como definición fonética.

## 4. Excepciones y límites

El propio artículo enumera consonantes sin contraparte palatalizada y otras sin contraparte no palatalizada. Las entradas posteriores deberán conservar esas excepciones y no generar parejas mecánicamente.

## 5. Evidencia R33

| claim_id | afirmación | source_id | localizador exacto | alcance | estado |
|---|---|---|---|---|---|
| RU005-C01 | El sistema descrito opone fonológicamente consonantes palatalizadas y no palatalizadas en casi todo el inventario | SND-SRC-0015 | p. 222, sección “Consonants”, primer párrafo | análisis del artículo | VERIFIED |
| RU005-C02 | Las consonantes no palatalizadas se describen como velarizadas | SND-SRC-0015 | p. 222, mismo párrafo | análisis del artículo | VERIFIED |
| RU005-C03 | La palatalización secundaria en sentido más puro se aplica a bilabiales/labiodentales, mientras que otras consonantes presentan ajustes de lugar y modo | SND-SRC-0015 | p. 223, párrafo “The realisation of the palatalised…” | descripción articulatoria | VERIFIED |
| RU005-C04 | La fuente documenta ajustes específicos en /tʲ dʲ rʲ/ y las velares palatalizadas | SND-SRC-0015 | p. 223, mismo párrafo | ejemplos del artículo | VERIFIED |
| RU005-C05 | Existen consonantes sin contraparte palatalizada o sin contraparte no palatalizada | SND-SRC-0015 | p. 222, primer párrafo de “Consonants” | sistema descrito | VERIFIED |

## 6. Fuente

Yanushevskaya, I., & Bunčić, D. (2015). Russian. *Journal of the International Phonetic Association, 45*(2), 221–228. https://doi.org/10.1017/S0025100314000395

## 7. Nota editorial

La comparación con ortografía/cirílico se desarrollará en SND-RU-009; esta entrada no deriva la palatalización de letras por sí solas.

## 8. Auditoría R33

- **Fecha:** 2026-10-11.
- **Resultado:** EVIDENCE_CHECKED.

## Entradas relacionadas

- SND-RU-004 — Consonantes: mapa del sistema descrito.
- SND-RU-007 — Procesos contextuales.
- SND-RU-009 — Cirílico y pronunciación (entrada prevista/integración pendiente).

## Revisión lingüística

- **Fecha:** 2026-10-11.
- **Resultado:** PASS → `LINGUISTIC_REVIEW`.
- **Comprobación:** La oposición blanda/dura se explica fonética y fonológicamente y se evita la equivalencia simplista consonante + y.
- **Control:** no se cambiaron source IDs, localizadores ni transcripciones; cualquier cambio terminológico mantiene el mismo contenido analítico.

## Revisión editorial wave 01

- **Fecha:** 2026-10-11.
- **Resultado:** PASS.
- **Comprobado:** claridad, jerarquía, navegación, terminología y visibilidad de límites entre descripción, análisis, norma y variación.
- **Cambios lingüísticos:** ninguno.
- **Claims R33 modificados:** ninguno.
- **Estado resultante:** EDITORIAL_REVIEW.
- **Siguiente gate:** composition-readiness; no se promueve automáticamente a READY_FOR_COMPOSITION.

## Composition readiness

- **Fecha:** 2026-10-12.
- **Resultado:** PASS → `READY_FOR_COMPOSITION`.
- **Versión evaluada (blob):** `c5806907d5c6573281f479b066a5dbe00605ed8b`.
- **Handoff:** `docs/pronunciation/composition/handoffs/SND-RU-005.md`.
- **Pronunciation Quick Layer:** `OMITTED_WITH_REASON`; esta versión describe un sistema/fenómeno y no fija una única pareja forma–glosa con respelling derivada aprobada. No se inventa una ayuda fonética para llenar la capa.
- **Reader-facing projection:** contenido explicativo aprobado, fuentes utilizadas, navegación y notas editoriales necesarias; tablas R33, auditorías y logs de revisión quedan como metadata interna.
- **Control:** no se modificaron claims, fuentes, localizadores, transcripciones, análisis, variedad ni alcance.
