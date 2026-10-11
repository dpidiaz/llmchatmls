# SND-REP-003 — Cómo leer consonantes del IPA

**Estado:** EDITORIAL_REVIEW.
**Dominio:** representación / fonética.
**Idioma:** transversal.

## 1. Función de la tabla

La tabla oficial del IPA organiza consonantes mediante categorías articulatorias. MLS-SND la utilizará como **mapa de lectura**, no como inventario de ninguna lengua concreta.

Que un símbolo exista en la tabla no significa que todas las lenguas lo utilicen.

## 2. Cómo leer una descripción consonántica

Para una consonante pulmonar, una descripción introductoria suele combinar:

1. lugar de articulación;
2. modo de articulación;
3. fonación; en las celdas pareadas de la tabla pulmonar, la distinción sorda/sonora cuando está representada.

La lectura exacta de cada símbolo deberá comprobarse en la tabla oficial y, para una lengua concreta, en la fuente de esa lengua.

### Precisión terminológica

MLS-SND utilizará **fonación** como categoría general y **sordo/sonoro** para la oposición de voicing cuando corresponda. No utilizará “sonoridad” como sinónimo general de fonación, porque esa palabra puede confundirse con otros conceptos fonológicos.

Además, no todas las consonantes quedan plenamente descritas solo con lugar, modo y una oposición sorda/sonora: la propia tabla IPA mantiene secciones y diacríticos adicionales para articulaciones que requieren más información.

## 3. Tabla general y perfil lingüístico

El IPA responde a la pregunta:

> ¿cómo podemos representar esta categoría o realización?

El perfil de una lengua responde a otra:

> ¿qué categorías y realizaciones están documentadas en esta lengua/variedad?

MLS-SND mantendrá ambas preguntas separadas.

## 4. Más allá de la tabla pulmonar

La IPA mantiene además secciones específicas para consonantes no pulmonares, otros símbolos y diacríticos.

Cuando un perfil necesite alguno de ellos, la entrada correspondiente explicará cómo se integra en la descripción en vez de asumir que el lector debe memorizar toda la tabla.

## 5. Evidencia R33

| claim_id | afirmación | source_id | localizador exacto | alcance | estado |
|---|---|---|---|---|---|
| REP003-C01 | La IPA mantiene oficialmente el alfabeto y su organización en una tabla | SND-SRC-0001 | “The International Phonetic Alphabet and the IPA Chart” | transversal | VERIFIED |
| REP003-C02 | La página oficial separa subtablas de consonantes pulmonares, no pulmonares, otros símbolos y diacríticos | SND-SRC-0001 | “Quick links” → consonants (pulmonic), consonants (non-pulmonic), other symbols, diacritics | transversal | VERIFIED |
| REP003-C03 | Lugar, fonación y modo son dimensiones introductorias usadas para describir consonantes | SND-SRC-0024 | §§3.3–3.4, “Describing consonants: Place and phonation” + “Manner” | introductorio/transversal | VERIFIED |
| REP003-C04 | En las celdas pareadas de la tabla de consonantes pulmonares, el símbolo de la izquierda es sordo y el de la derecha sonoro | SND-SRC-0001 | tabla “CONSONANTS (PULMONIC)” y nota “Symbols to the right in a cell are voiced, to the left are voiceless” | tabla IPA | VERIFIED |

## 6. Fuentes

International Phonetic Association. (2026). *The IPA Chart*. https://www.internationalphoneticassociation.org/content/ipa-chart

Anderson, C., Bjorkman, B. M., Denis, D., Doner, J., Grant, M., Sanders, N., & Taniguchi, A. (2022). *Essentials of Linguistics* (2nd ed.). eCampusOntario Pressbooks.

## 7. Nota editorial

La entrada enseña a orientarse en la tabla. No reproduce aquí el inventario completo ni sustituye la consulta de la tabla oficial.

## 8. Revisión lingüística

- **Fecha:** 2026-10-11.
- **Resultado:** **PASS_WITH_CHANGE**.
- **Cambio material de precisión:** se sustituyó la formulación ambigua “información laríngea/sonoridad” por la distinción entre **fonación** y **sordo/sonoro**, y se añadió el localizador explícito de la regla izquierda/derecha de la tabla pulmonar.
- **No se cambió:** el alcance transversal, la función editorial de la entrada ni la separación IPA ↔ inventario de una lengua.
- **Gate alcanzado:** `LINGUISTIC_REVIEW`.
- **Pendiente:** `EDITORIAL_REVIEW`.


## 9. Revisión editorial

- **Fecha:** 2026-10-11.
- **Resultado:** PASS → `EDITORIAL_REVIEW`.
- **Lectura:** La entrada conduce al lector desde la función de la tabla hacia lugar, modo y fonación sin presentar el IPA como inventario universal; la precisión sordo/sonoro queda visible y la sección sobre límites evita memorización acrítica.
- **Control:** no se modificaron claims R33, source IDs, localizadores, símbolos IPA, transcripciones ni alcance durante este gate.
- **Siguiente paso:** candidato a `READY_FOR_COMPOSITION` únicamente después del gate de composition readiness aplicado a esta misma versión.
