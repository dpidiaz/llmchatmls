# SND-JA-008 — Kana y pronunciación: ortografía, no transcripción fonética

**Estado:** EVIDENCE_CHECKED  
**Idioma:** japonés  
**Dominio:** escritura / pronunciación  
**Alcance:** ortografía kana moderna de uso general; préstamos tratados con instrumento institucional separado

## 1. Principio editorial

MLS-SND presentará hiragana y katakana como **sistemas de escritura** del japonés, no como una transcripción IPA.

La relación entre kana y pronunciación es estrecha y útil para el lector, pero las propias normas ortográficas japonesas muestran que no es una equivalencia fonética uno-a-uno.

## 2. La norma moderna parte del sistema sonoro, pero conserva convenciones

La introducción oficial de **現代仮名遣い** establece como principio escribir palabras de acuerdo con la fonología del japonés moderno y, al mismo tiempo, conservar determinadas convenciones ortográficas mediante excepciones.

Esa doble formulación es importante para MLS-SND:

> una ortografía puede estar fuertemente relacionada con la estructura sonora sin convertirse por ello en transcripción fonética exhaustiva.

## 3. La norma no decide toda variación de pronunciación

La propia introducción declara que el sistema ortográfico no pretende decidir cuál pronunciación debe imponerse cuando una palabra presenta variantes de pronunciación.

Por tanto, MLS-SND no inferirá una pronunciación única solo porque exista una forma escrita canónica.

## 4. Excepciones convencionales

La sección de excepciones de **現代仮名遣い** mantiene convenciones específicas para:

- las partículas escritas を, は y へ;
- determinadas grafías con ぢ/づ;
- ciertos patrones de vocales largas.

Especialmente relevante: para algunos casos con vocales largas, la norma mantiene una grafía determinada **independientemente de si la realización se interpreta como vocal larga o como secuencia vocálica**.

Esto demuestra directamente que la cadena de kana no debe leerse como si cada signo fuera un símbolo fonético estrecho.

## 5. Katakana y préstamos

La política oficial **外来語の表記** trata por separado la escritura de préstamos y nombres extranjeros en katakana.

Distingue entre formas generalmente usadas y formas que intentan aproximarse más al sonido o grafía original, pero:

- no obliga a resolver toda variación léxica;
- permite convenciones establecidas;
- deja sin regulación exhaustiva determinados sonidos especiales.

MLS-SND tratará por ello el katakana de préstamos como **adaptación ortográfica japonesa**, no como reproducción fonética exacta del idioma de origen.

## 6. Regla de representación MLS-SND

Cuando una entrada necesite precisión:

**forma escrita en kana → /representación fonológica/, si es pertinente → [representación fonética]**

No se añadirán barras o corchetes alrededor de kana para hacerlos parecer IPA.

## 7. Evidencia R33

| claim_id | afirmación | source_id | localizador | estado |
|---|---|---|---|---|
| JA008-C01 | La ortografía kana moderna sigue como principio la fonología moderna, pero conserva excepciones basadas en convención escrita | SND-SRC-0059 | 前書き 1; 本文 第2 | VERIFIED |
| JA008-C02 | La norma declara que no pretende decidir entre pronunciaciones variables de una palabra | SND-SRC-0059 | 前書き 6 | VERIFIED |
| JA008-C03 | La norma conserva excepciones ortográficas explícitas para を/は/へ y para determinados patrones de vocal larga | SND-SRC-0059 | 本文 第2, §§1–3 y 6 + 付記 | VERIFIED |
| JA008-C04 | En ciertos patrones, una misma convención ortográfica se mantiene independientemente de si la realización se considera vocal larga o secuencia vocálica | SND-SRC-0059 | 本文 第2, §6 y 付記 | VERIFIED |
| JA008-C05 | La política de préstamos trata el katakana como ortografía y admite tanto convenciones generales como formas más próximas al original, sin regular exhaustivamente todos los sonidos especiales | SND-SRC-0060 | 留意事項その1 §§1–6; 仮名と符号の表 §§1–3 | VERIFIED |

## 8. Límites

Esta entrada:
- no describe todavía el inventario fonético completo del japonés;
- no explica acento tonal;
- no convierte katakana en una tabla de equivalencias fonéticas con otros idiomas;
- no sustituye JA-002/003/004/005 ni la política de romanización de JA-010.

## 9. Nota editorial

La conclusión “kana ≠ IPA” es una decisión de arquitectura MLS-SND apoyada por la diferencia funcional que muestran las propias normas ortográficas.
