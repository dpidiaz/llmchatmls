# SND-IT-005 — Acento léxico

**Estado:** EVIDENCE_CHECKED.  
**Idioma:** italiano.  
**Dominio:** prosodia / fonología / fonética.  
**Tipo de alcance:** REFERENCE_VARIETY / BROADLY_DISTRIBUTED con límites explícitos.  
**Nivel de representación:** fonológico / fonético / ortográfico.  
**Dependencias:** SND-IT-001, SND-IT-008; SND-SRC-0074 y SND-SRC-0075 canonicalizadas.  
**Versión:** wave-02.

## 1. Qué es

El **acento léxico** hace que una sílaba de la palabra tenga mayor prominencia que las demás. En italiano, la posición del acento no está fijada siempre a una misma sílaba: puede distinguir palabras y formas que comparten la misma secuencia segmental o una secuencia muy cercana.

MLS-SND separará tres capas:

1. **posición del acento** dentro de la palabra;
2. **función fonológica**, incluida su capacidad de distinguir significado o categoría;
3. **realización fonética**, que puede involucrar duración, frecuencia fundamental e intensidad.

Estas capas se relacionan, pero no son equivalentes.

## 2. Posición: libre, pero no aleatoria

La *Enciclopedia dell’Italiano* describe la posición del acento italiano como **libre**: no existe una única sílaba fija que reciba el acento en todas las palabras.

En palabras simples son frecuentes las posiciones:

- final;
- penúltima;
- antepenúltima.

También aparecen acentos más alejados del final en contextos morfológicos concretos, por ejemplo en determinadas formas verbales o con clíticos.

“Libre” no significa “sin patrones”. La misma fuente documenta una fuerte preferencia estadística por la penúltima y restricciones prosódicas y morfofonológicas. Por eso, MLS-SND no enseñará una regla absoluta del tipo “el italiano se acentúa en la penúltima”.

## 3. Función distintiva

La posición del acento puede diferenciar palabras o categorías gramaticales.

Un ejemplo transparente es:

- /ˈpapa/ **papa**
- /paˈpa/ **papà**

La secuencia consonantes-vocales es esencialmente la misma; cambia la ubicación del acento y cambia la palabra.

Esto justifica tratar el acento como parte de la representación fonológica cuando la evidencia lexical lo exige, y no como simple “énfasis” añadido al hablar.

## 4. Correlatos fonéticos

La prominencia acentual puede manifestarse mediante más de un parámetro acústico. Treccani resume como correlatos relevantes:

- frecuencia fundamental;
- duración;
- intensidad.

Para el italiano, la duración tiene un papel especialmente importante, pero una equivalencia simple entre **acento** y **vocal larga** sería engañosa.

D’Imperio y Rosenthall muestran que la duración vocálica no es contrastiva por sí misma en las variedades estándar y regionales consideradas en su trabajo. Las vocales de sílabas abiertas tónicas pueden ser más largas que las átonas o las de sílabas cerradas, pero el grado de alargamiento cambia según la posición del acento dentro de la palabra.

## 5. Por qué no enseñamos “tónica = larga”

El estudio de D’Imperio y Rosenthall destaca diferencias importantes entre posiciones:

- una vocal en sílaba abierta tónica penúltima puede mostrar un alargamiento notable;
- una vocal en sílaba abierta tónica antepenúltima muestra un patrón de duración distinto;
- una vocal tónica final no presenta el mismo incremento de duración.

Por tanto, la duración es un **correlato fonético condicionado**, no una traducción automática del acento a una categoría fonológica de cantidad vocálica.

Esta distinción también evita confundir el acento de SND-IT-005 con la **geminación consonántica** de SND-IT-004.

## 6. Acento léxico y acento de frase

Esta entrada trata principalmente el acento **de palabra**.

La prominencia dentro de una frase puede modificar o reforzar propiedades acústicas de una sílaba ya acentuada, pero ese nivel pertenece a la estructura prosódica del enunciado. MLS-SND no usará “acento” sin aclarar el nivel cuando exista riesgo de confusión entre:

- acento léxico;
- prominencia secundaria;
- acento de frase;
- entonación.

## 7. Morfología y movilidad

La posición del acento puede interactuar con la estructura morfológica.

Treccani documenta, entre otros patrones, que:

- la prefijación no necesariamente desplaza el acento primario;
- la sufijación puede cambiar su posición;
- la flexión verbal puede producir formas cuya posición acentual difiere de la preferencia general por la penúltima;
- los clíticos pueden hacer que el acento aparezca más lejos del borde derecho de la forma gráfica resultante.

Estas regularidades son más precisas que una regla única para “adivinar” el acento de cualquier palabra.

## 8. Relación con la escritura

La escritura y el acento fonológico no son la misma capa.

SND-IT-008 ya establece que la ortografía italiana no funciona como una transcripción fonética completa. Para el acento, esto significa que una entrada puede necesitar IPA u otra indicación explícita aunque la grafía ordinaria no marque visualmente toda la información prosódica necesaria.

Cuando se use un acento gráfico como pista, MLS-SND distinguirá:

- **marca ortográfica**;
- **posición del acento léxico**;
- **realización fonética**.

## 9. Representación en MLS-SND

Cuando sea necesario indicar el acento primario en IPA, se colocará la marca **ˈ** antes de la sílaba acentuada.

Ejemplos de lectura:

- /ˈpapa/ → acento en la primera sílaba;
- /paˈpa/ → acento en la segunda.

La transcripción concreta de una palabra seguirá dependiendo de la variedad y de la fuente utilizada; esta entrada no congela por sí sola un inventario fonético para todo el italiano.

## 10. Comparación útil

Para hablantes de otras lenguas, puede ser útil comparar la **movilidad** del acento o sus correlatos acústicos, pero no debe afirmarse que dos idiomas “tienen el mismo acento” solo porque ambos permitan más de una posición.

Etiqueta recomendada para comparaciones generales: **SEMEJANZA_PARCIAL**.

Una comparación válida debe separar al menos:

- dónde puede caer el acento;
- si distingue palabras;
- qué restricciones lo condicionan;
- cómo se realiza fonéticamente;
- qué parte, si alguna, queda marcada en la escritura.

## 11. Advertencia de equivalencia

**Acento léxico ≠ intensidad solamente.**  
**Acento léxico ≠ vocal larga.**  
**Acento gráfico ≠ transcripción completa del acento fonológico.**

Las tres simplificaciones pueden ser útiles como primeras pistas en contextos muy acotados, pero no se usarán como definiciones del sistema italiano.

## 12. Entradas relacionadas

- SND-FND-011 — Acento y prominencia.
- SND-FND-010 — Duración y cantidad.
- SND-IT-001 — Italiano de referencia, variedades regionales y “mainstream Italian”.
- SND-IT-004 — Geminación y duración consonántica.
- SND-IT-008 — Grafía y pronunciación en italiano.
- SND-IT-009 — Variación regional.

## 13. Evidencia R33

| claim_id | afirmación | source_id | localizador exacto | alcance | estado |
|---|---|---|---|---|---|
| IT005-C01 | El acento léxico italiano tiene posición libre y puede cumplir función distintiva | SND-SRC-0074 | “Definizione”; “L’accento in italiano”, apartados sobre posición libre y función distintiva | italiano descrito por la Enciclopedia dell’Italiano | VERIFIED |
| IT005-C02 | La penúltima es estadísticamente preferida, pero existen otras posiciones y restricciones prosódicas/morfofonológicas | SND-SRC-0074 | “L’accento in italiano”, apartados sobre distribución, restricción prosódica y fenómenos morfofonológicos | italiano / síntesis enciclopédica | VERIFIED |
| IT005-C03 | F0, duración e intensidad son correlatos acústicos del acento; su contribución no debe reducirse a un único parámetro | SND-SRC-0074 | “Principali correlati fonetici”; “L’accento in italiano” | general + italiano | VERIFIED |
| IT005-C04 | En el estudio citado la duración vocálica no es contrastiva en las variedades estándar/regionales consideradas; las vocales de sílabas abiertas tónicas son más largas que las átonas o las de sílabas cerradas | SND-SRC-0075 | Abstract | alcance del estudio de D’Imperio & Rosenthall | VERIFIED |
| IT005-C05 | El incremento de duración asociado a vocales tónicas abiertas cambia según la posición del acento, y la posición final no muestra el mismo alargamiento | SND-SRC-0075 | Abstract | alcance del estudio de D’Imperio & Rosenthall | VERIFIED |
| IT005-C06 | La ortografía no debe usarse como transcripción fonética completa de la pronunciación italiana | SND-SRC-0008 | SND-IT-008, claims IT008-C01–C03 y sus localizadores DOP | referencia ortoépica / regla editorial ya validada | VERIFIED_BY_DEPENDENCY |

## 14. Fuentes APA 7

D’Imperio, M., & Rosenthall, S. (1999). Phonetics and phonology of main stress in Italian. *Phonology, 16*(1), 1–28. https://doi.org/10.1017/S0952675799003681

Gili Fivela, B. (2010). Accento. En *Enciclopedia dell’Italiano*. Treccani. https://www.treccani.it/enciclopedia/accento_%28Enciclopedia-dell%27Italiano%29/

RAI. (2025). *DOP: Dizionario italiano multimediale e multilingue d’ortografia e di pronunzia* (2.ª ed. multimediale). https://www.dop.rai.it/

## 15. Nota editorial

- La entrada evita presentar “penúltima” como regla categórica: es una preferencia de distribución con excepciones y condicionamientos.
- El tratamiento de duración se limita a lo verificable en el resumen del artículo de D’Imperio y Rosenthall consultado para esta wave.
- No se adopta aquí una teoría métrica única del acento italiano.
- La variación regional detallada queda para SND-IT-009 y para revisión lingüística posterior.

## Gate de salida

**Resultado integrado:** EVIDENCE_CHECKED.

- SND-SRC-0074 y SND-SRC-0075 están canonicalizadas.
- Los claims IT005-C01…C05 fueron re-auditados contra los localizadores declarados.
- La revisión lingüística independiente #7358 aprobó la dirección del contenido y mantuvo como invariantes la separación acento/duración/geminación/ortografía.
- La canonicalización no se trató por sí sola como validación: el estado se promueve después de la re-auditoría de esta versión.


## Auditoría de integración — 2026-10-11

- **IT005-C01:** VERIFIED contra SND-SRC-0074, “Definizione” y “L’accento in italiano”.
- **IT005-C02:** VERIFIED contra SND-SRC-0074, distribución/posición libre y preferencia penúltima.
- **IT005-C03:** VERIFIED contra SND-SRC-0074, “Principali correlati fonetici”.
- **IT005-C04:** VERIFIED contra SND-SRC-0075, Abstract.
- **IT005-C05:** VERIFIED contra SND-SRC-0075, Abstract.
- **IT005-C06:** conserva dependencia ya validada SND-SRC-0008 / IT-008.
- **Resultado:** EVIDENCE_CHECKED; todavía requiere promoción formal a LINGUISTIC_REVIEW en la versión integrada.