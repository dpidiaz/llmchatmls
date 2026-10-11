# SND-ZHTW-009 — Romanización latina

**Estado:** SOURCE_MAPPED — fuente institucional verificada; canonicalización pendiente.
**Idioma:** mandarín de Taiwán.
**Dominio:** romanización / consulta.

## 1. Evidencia institucional mínima

El *Revised Mandarin Chinese Dictionary* del Ministry of Education de Taiwán permite consultar mediante **Bopomofo** y **Hanyu Pinyin**.

La búsqueda básica incluye explícitamente ambos métodos, y entradas individuales como 博 y 模 muestran campos separados de **Bopomofo** y **Hanyu Pinyin**.

Esto documenta que Hanyu Pinyin puede funcionar como una **capa latina institucional de consulta** junto a Zhuyin/Bopomofo dentro de un recurso contemporáneo del MOE taiwanés.

## 2. Decisión provisional MLS-SND

Cuando una romanización latina ayude al lector, el perfil zh-TW podrá utilizar **Hanyu Pinyin**, siempre etiquetado como romanización.

La secuencia recomendada será, según necesidad:

**caracteres → Zhuyin → Hanyu Pinyin → IPA → explicación**

No todas las entradas necesitan las cuatro capas.

## 3. Qué no implica esta decisión

- No afirma que Hanyu Pinyin sea la única romanización históricamente usada en Taiwán.
- No lo convierte en transcripción fonética.
- No reemplaza Zhuyin en el perfil.
- No obliga a mostrar Pinyin si añade ruido y no información.
- No convierte el uso del diccionario MOE en una regla universal para todos los materiales de chino del MLS.

## 4. Evidencia R33 local

| claim_id | afirmación | source_id | localizador | alcance | estado |
|---|---|---|---|---|---|
| ZHTW009-C01 | La búsqueda básica del diccionario MOE acepta chino, Bopomofo y Hanyu Pinyin y ofrece teclados para Bopomofo y Hanyu Pinyin | ZHTW-ROM-S01 | Basic Search: campo principal + “Bopomofo Keypad” + “Hanyu Pinyin Keypad” | recurso institucional taiwanés | CHECKED_LOCAL |
| ZHTW009-C02 | Las entradas del diccionario presentan campos separados de Bopomofo y Hanyu Pinyin | ZHTW-ROM-S01 | entradas 博 y 模, campos “Bopomofo” / “Hanyu Pinyin” | recurso institucional taiwanés | CHECKED_LOCAL |

## 5. Fuente local pendiente de canonicalización

**ZHTW-ROM-S01**

Ministry of Education, R.O.C. (Taiwan). (2021–). *Revised Mandarin Chinese Dictionary, Taiwan Academic Network Version 6*. https://dict.revised.moe.edu.tw/

Detalle completo: `SOURCE-MAP-ROMANIZATION-WAVE-01.md`.

## 6. Estado de decisión

**PROVISIONAL_ACCEPT:** Hanyu Pinyin como romanización latina auxiliar para MLS-SND zh-TW.

La evidencia disponible basta para sustentar ese uso como capa de consulta dentro del perfil, pero la política global de romanización del MLS sigue siendo una decisión editorial aparte.

## 7. Gate

La correspondencia claim ↔ fuente ↔ localizador fue comprobada en esta wave.

La entrada permanece en **SOURCE_MAPPED** y no pasa aún a EVIDENCE_CHECKED porque utiliza un source ID local. El integrador debe:

1. deduplicar/canonicalizar ZHTW-ROM-S01;
2. sustituirlo por un `SND-SRC-*` global;
3. ejecutar SOURCE-ID-INTEGRITY;
4. confirmar que los claims no cambiaron;
5. entonces promover la entrada si el gate pasa.

## 8. Relacionado con

- SND-ZHTW-007 — Zhuyin/Bopomofo
- SND-ZHTW-008 — IPA y Zhuyin: funciones distintas
- SND-REP-010 — Romanización
- SND-REP-012 — Sistemas locales de anotación

## 9. Nota editorial

Esta entrada resuelve el **mapeo mínimo de fuente** para Hanyu Pinyin en el perfil zh-TW. No pretende reconstruir la historia de las políticas de romanización en Taiwán.
