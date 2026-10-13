# SND-REP-012 — Sistemas locales de anotación y consulta

**Estado:** LINGUISTIC_REVIEW — PASS.  
**Dominio:** representación / escritura / consulta.  
**Idioma:** transversal con ejemplos delimitados.

## 1. No todas las tradiciones consultan pronunciación de la misma manera

Además del IPA, los lectores pueden encontrar sistemas locales, romanizaciones, convenciones lexicográficas y escrituras auxiliares vinculadas a la pronunciación.

MLS-SND los explicará por su **función real**, no mediante la etiqueta genérica “equivalente local del IPA”.

## 2. Ejemplo: Zhuyin/Bopomofo

El Ministry of Education de Taiwán publica un manual específico de símbolos fonéticos del mandarín que organiza símbolos de onset, rhyme y marcas tonales y contiene tablas de sílabas.

En MLS-SND, Zhuyin puede aparecer junto a caracteres e IPA, pero cada capa se identificará de forma separada.

## 3. Ejemplo: Romanización Revisada del coreano

El National Institute of Korean Language publica una romanización basada en pronunciación estándar. Esa convención sirve para representar coreano con letras latinas, pero la propia normativa no refleja todos los detalles fonéticos, como la longitud vocálica.

Por tanto una romanización puede ser útil sin convertirse en transcripción fonética completa.

## 4. Diccionarios y convenciones especializadas

Otros perfiles pueden usar diccionarios ortoépicos, notaciones de acento o convenciones propias de una tradición académica. Antes de incorporarlas, cada perfil deberá registrar:

- quién mantiene el sistema;
- qué representa;
- qué no representa;
- qué variedad o norma cubre;
- cómo se relaciona con IPA y con la escritura principal.

## 5. Regla MLS-SND

El libro elegirá **capas necesarias por idioma**, no una plantilla visual que obligue a todos a tener ortografía + romanización + IPA + sistema local.

## 6. Evidencia R33

| claim_id | afirmación | source_id | localizador exacto | alcance | estado |
|---|---|---|---|---|---|
| REP012-C01 | El MOE de Taiwán mantiene un manual de Zhuyin con onset, rhyme, tonos y tablas silábicas | SND-SRC-0011 | “List of Phonetic Symbols” y “Reference Table…” | zh-TW | VERIFIED |
| REP012-C02 | La Romanización Revisada coreana se basa en pronunciación estándar | SND-SRC-0012 | “Basic Principles for Transcription”, punto 1 | coreano | VERIFIED |
| REP012-C03 | La Romanización Revisada no refleja la longitud vocálica | SND-SRC-0012 | “Summary of the Transcription System”, Note 2 | coreano | VERIFIED |
| REP012-C04 | La IPA mantiene una tabla de símbolos internacional independiente de estos sistemas locales | SND-SRC-0001 | IPA Chart | transversal | VERIFIED |

## 7. Relacionado con

- SND-ZHTW-007 — Zhuyin/Bopomofo.
- SND-KO-009 — Romanización Revisada.
- SND-REP-002 — Qué es el AFI/IPA.

## 8. Nota editorial

Los ejemplos de Taiwán y Corea ilustran tipos de capa; no se usan para definir las tradiciones de los otros ocho idiomas.

## 9. Auditoría R33

- **Fecha:** 2026-10-11.
- **Resultado:** EVIDENCE_CHECKED.

## 10. Revisión lingüística wave 02

- **Fecha:** 2026-10-12.
- **Versión revisada:** blob `e8ea6828cf13e01b341009b17b410841e7205a0f`.
- **Resultado:** PASS → `LINGUISTIC_REVIEW`.
- **Función:** Zhuyin y Romanización Revisada se describen por su función documentada y no como equivalentes locales del IPA.
- **Arquitectura:** las capas necesarias se eligen por idioma; no se obliga a una plantilla universal ortografía + romanización + IPA + sistema local.
- **Alcance:** los ejemplos de Taiwán y Corea no se extrapolan a otras tradiciones.
- **Siguiente gate:** EDITORIAL_REVIEW independiente.
