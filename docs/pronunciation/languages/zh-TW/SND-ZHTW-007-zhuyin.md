# SND-ZHTW-007 — Zhuyin/Bopomofo

**Estado:** READY_FOR_COMPOSITION.
**Idioma:** mandarín de Taiwán.
**Dominio:** sistema local de anotación / escritura-pronunciación.

## 1. Qué es en este tomo

Zhuyin/Bopomofo se tratará como un sistema local de símbolos utilizado en Taiwán para representar la pronunciación del mandarín y organizar sílabas y marcas tonales dentro de su propia convención.

## 2. Fuente institucional

El Ministry of Education de Taiwán publica The Manual of the Phonetic Symbols of Mandarin Chinese. El manual contiene listas de símbolos de ataque y rima, marcas tonales y tablas de sílabas.

## 3. Relación con el IPA

MLS-SND no describirá Zhuyin como “el IPA de Taiwán”.

Ambos pueden aparecer en una misma entrada porque cumplen funciones distintas:

- Zhuyin: sistema local de representación con tradición propia;
- IPA: capa descriptiva fonética internacional usada por MLS-SND.

## 4. Relación con caracteres

Cuando sea pertinente, una entrada de zh-TW podrá presentar:

caracteres → Zhuyin → IPA → explicación.

La romanización latina se trata por separado en **SND-ZHTW-009**; no sustituye ni a Zhuyin ni al IPA.

## 5. Entradas relacionadas

- **SND-ZHTW-008** — Zhuyin e IPA: funciones distintas.
- **SND-ZHTW-009** — Romanización latina.
- **SND-REP-010** — Romanización.
- **SND-REP-012** — Sistemas locales de anotación.

## 6. Evidencia R33

| claim_id | afirmación | source_id | localizador | estado |
|---|---|---|---|---|
| ZHTW007-C01 | El MOE de Taiwán publica un manual de símbolos fonéticos del mandarín | SND-SRC-0011 | datos editoriales de la edición digital 2017; Ministry of Education | VERIFIED |
| ZHTW007-C02 | El manual organiza símbolos de onset, rhyme y marcas tonales | SND-SRC-0011 | “1. List of Phonetic Symbols”, apartados a–d: main list, onset, rhyme y tonal marks | VERIFIED |
| ZHTW007-C03 | El manual incluye una tabla de sílabas de mandarín con Bopomofo | SND-SRC-0011 | “6. Reference Table of Chinese Characters with Mandarin Chinese Syllables”; Reader’s Guide, punto 5 | VERIFIED |

## 7. Fuente

Ministry of Education, Taiwan. (2017). The Manual of the Phonetic Symbols of Mandarin Chinese. https://language.moe.gov.tw/001/Upload/files/site_content/M0001/juyin/html_en/index.html

## 8. Nota editorial

La separación conceptual entre Zhuyin e IPA es una decisión metodológica MLS-SND respaldada por las funciones distintas de ambos sistemas.

## 9. Auditoría R33

- **Fecha:** 2026-10-11.
- **Resultado:** EVIDENCE_CHECKED.
- **Comprobación:** el manual oficial del MOE identifica Bopomofo, lista onset/rhyme/tonal marks y contiene una tabla de sílabas de mandarín con Bopomofo.
- **Límite:** la distinción conceptual Zhuyin ≠ IPA es política metodológica MLS-SND; el manual no se usa como descripción fonética completa de Taiwan Mandarin.


## 10. Revisión lingüística wave 01

- **Fecha:** 2026-10-11.
- **Resultado:** PASS.
- **Comprobado:** alcance de variedad, separación fonética/fonología, límites de generalización y función de las capas de representación.
- **Fuente/claims:** no se amplió ningún claim más allá del localizador ya auditado.
- **Siguiente gate:** EDITORIAL_REVIEW.


## 11. Revisión editorial wave 01

- **Fecha:** 2026-10-11.
- **Resultado:** PASS → `EDITORIAL_REVIEW`.
- **Lectura:** Zhuyin se presenta como sistema local de representación con función propia; la entrada evita equipararlo con IPA y mantiene separada la decisión de romanización latina.
- **Control:** no se modificaron claims R33, source IDs, localizadores, transcripciones ni alcance de variedad durante este gate.
- **Siguiente paso:** aplicar composition readiness a esta misma versión.
