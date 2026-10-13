# SND-ZHTW-009 — Romanización latina

**Estado:** READY_FOR_COMPOSITION.
**Idioma:** mandarín de Taiwán.
**Dominio:** romanización / consulta.

## 1. Evidencia institucional mínima

El *Revised Mandarin Chinese Dictionary* del Ministry of Education de Taiwán permite consultar mediante **Bopomofo** y **Hanyu Pinyin**.

La búsqueda básica incluye explícitamente ambos métodos, y entradas individuales como 博 y 模 muestran campos separados de **Bopomofo** y **Hanyu Pinyin**.

Esto documenta que Hanyu Pinyin puede funcionar como una **capa latina institucional de consulta** junto a Zhuyin/Bopomofo dentro de un recurso contemporáneo del MOE taiwanés.

## 2. Decisión editorial MLS-SND para zh-TW

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

## 4. Evidencia R33

| claim_id | afirmación | source_id | localizador | alcance | estado |
|---|---|---|---|---|---|
| ZHTW009-C01 | La búsqueda básica del diccionario MOE acepta chino, Bopomofo y Hanyu Pinyin y ofrece teclados para Bopomofo y Hanyu Pinyin | SND-SRC-0080 | Basic Search: campo principal + “Bopomofo Keypad” + “Hanyu Pinyin Keypad” | recurso institucional taiwanés | VERIFIED |
| ZHTW009-C02 | Las entradas del diccionario presentan campos separados de Bopomofo y Hanyu Pinyin | SND-SRC-0080 | entradas 博 y 模, campos “Bopomofo” / “Hanyu Pinyin” | recurso institucional taiwanés | VERIFIED |

## 5. Fuente canónica

**SND-SRC-0080**

Ministry of Education, R.O.C. (Taiwan). (2021–). *Revised Mandarin Chinese Dictionary, Taiwan Academic Network Version 6*. https://dict.revised.moe.edu.tw/

La trazabilidad del antiguo ID local se conserva en `SOURCE-MAP-ROMANIZATION-WAVE-01.md`.

## 6. Alcance de la decisión editorial

**Decisión vigente del perfil zh-TW:** Hanyu Pinyin puede utilizarse como romanización latina auxiliar cuando aporte valor de consulta.

La evidencia disponible basta para sustentar ese uso dentro de este perfil. La política global de romanización del MLS sigue siendo una decisión editorial aparte y esta entrada no la determina.

## 7. Gate

La correspondencia claim ↔ fuente ↔ localizador fue comprobada en esta wave.

La fuente fue canonicalizada como **SND-SRC-0080**. Los claims no cambiaron durante la sustitución de ID y sus localizadores siguen siendo los mismos.

**Gate R33: PASS → EVIDENCE_CHECKED.**

Siguiente gate: **LINGUISTIC_REVIEW**. La política global de romanización para el resto del MLS permanece fuera del alcance de esta entrada.

## 8. Relacionado con

- SND-ZHTW-007 — Zhuyin/Bopomofo
- SND-ZHTW-008 — IPA y Zhuyin: funciones distintas
- SND-REP-010 — Romanización
- SND-REP-012 — Sistemas locales de anotación

## 9. Nota editorial

Esta entrada resuelve el **mapeo mínimo de fuente** para Hanyu Pinyin en el perfil zh-TW. No pretende reconstruir la historia de las políticas de romanización en Taiwán.

## 10. Revisión lingüística wave 01

- **Fecha:** 2026-10-12.
- **Versión revisada:** blob `242a056f727b6b12e3977e728311ae11cb727ccc`.
- **Resultado:** PASS → `LINGUISTIC_REVIEW`.
- **Alcance:** la evidencia institucional de SND-SRC-0080 sustenta el uso de Hanyu Pinyin como capa latina de consulta en el recurso MOE; no se extrapola a una descripción fonética de Taiwan Mandarin ni a exclusividad histórica.
- **Separación de representaciones:** Zhuyin/Bopomofo, Hanyu Pinyin e IPA se mantienen como capas funcionalmente distintas; la romanización no se trata como IPA ni como sustituto automático de una transcripción fonética.
- **Decisión MLS:** la secuencia visual `caracteres → Zhuyin → Hanyu Pinyin → IPA → explicación` se conserva como recomendación editorial condicional, no como claim derivado del diccionario.
- **Claims R33:** ZHTW009-C01/C02 permanecen sin ampliación y con los mismos localizadores.
- **Siguiente gate:** EDITORIAL_REVIEW independiente sobre esta versión.

## 11. Revisión editorial wave 01

- **Fecha:** 2026-10-13.
- **Versión revisada:** blob `17d2942e73293f8f887ebbd05274719908dc4bd9`.
- **Resultado:** PASS_WITH_SCOPE_CLARIFICATION → `EDITORIAL_REVIEW`.
- **Decisión local:** Hanyu Pinyin queda aceptado como romanización latina auxiliar **solo para el perfil zh-TW** cuando aporte valor de consulta.
- **Separación de capas:** caracteres, Zhuyin, Hanyu Pinyin e IPA permanecen funcionalmente distintos; la secuencia visual sigue siendo condicional.
- **Alcance institucional:** SND-SRC-0080 demuestra coexistencia operativa de Bopomofo y Hanyu Pinyin en el recurso MOE, no exclusividad histórica ni obligación universal.
- **Cambio editorial:** se retira la etiqueta “provisional” de la decisión local porque la evidencia ya sustenta el uso auxiliar descrito; no se amplían claims ni se fija política global.
- **Cambios lingüísticos/R33:** ninguno.
- **Siguiente gate:** composition readiness sobre esta versión estabilizada.

## 12. Composition readiness — 2026-10-13

- **Versión evaluada:** blob `2ddcd954447ce8256329c497bc2363a981cba32b`.
- **Resultado:** PASS → `READY_FOR_COMPOSITION`.
- **Proyección reader-facing:** §§1–3, §5 (referencia bibliográfica, excluyendo la frase interna de trazabilidad del ID), §6, §§8–9.
- **Metadata interna excluida:** §4 (tabla R33), §7 (gate interno), §§10–11 (revisiones/workflow) y la referencia interna a `SOURCE-MAP-ROMANIZATION-WAVE-01.md`.
- **Fuentes y fundamento:** derivado de SND-SRC-0080, dejando visible que se trata de un recurso institucional del MOE de Taiwán y no de un corpus fonético.
- **Pronunciation Quick Layer:** `NOT_APPLICABLE` — la entrada define funciones de representación y no presenta una forma léxica objetivo cuya respelling sea necesaria.
- **Autonomía escrita:** PASS; caracteres, Zhuyin, Hanyu Pinyin e IPA se distinguen conceptualmente sin requerir audio.
- **Open questions no bloqueantes:** la historia completa de romanización en Taiwán y la política global del MLS quedan fuera del alcance de esta entrada.
- **Regla para COMPOSITION:** no puede convertir Hanyu Pinyin en IPA, sustituir Zhuyin, ni transformar la secuencia visual condicional en una obligación universal.
