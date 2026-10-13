# SND-REP-001 — Sonido, letra y símbolo

**Estado:** LINGUISTIC_REVIEW — PASS.  
**Dominio:** representación / fonética / escritura.  
**Idioma:** transversal.

## 1. Tres objetos que no deben mezclarse

MLS-SND distinguirá sistemáticamente entre:

- **sonido/realización hablada:** fenómeno de la señal lingüística que puede describirse fonéticamente;
- **letra/grafema ortográfico:** unidad de un sistema de escritura;
- **símbolo de transcripción:** signo empleado por una convención descriptiva, como IPA.

Una forma escrita puede ayudar a identificar una palabra, pero no se tratará como sustituto automático de su pronunciación.

## 2. Por qué hace falta la distinción

Una misma realización puede escribirse de distintas maneras dentro de una ortografía, y una misma secuencia gráfica puede no bastar para determinar todos los detalles fonéticos.

Un ejemplo introductorio documentado por *Essentials of Linguistics* muestra que una misma vocal del inglés puede aparecer representada por diversas secuencias ortográficas; el objetivo de usar IPA allí es separar la escritura ordinaria de la descripción del sonido.

MLS-SND utiliza ese ejemplo solo para demostrar el tipo de problema. No extrapola las irregularidades concretas del inglés a todos los idiomas.

## 3. Un símbolo IPA tampoco es “el sonido”

Un símbolo IPA es una representación convencional. Para interpretarlo correctamente también importa:

- si está entre /barras/ o [corchetes];
- el nivel de detalle de la transcripción;
- el análisis adoptado;
- la variedad descrita.

Por ello esta entrada se relaciona directamente con SND-REP-007 y SND-REP-008.

## 4. Regla editorial

Siempre que una entrada combine escritura y pronunciación deberá etiquetar cada capa. No se usarán comillas, cursivas o caracteres latinos de manera ambigua para hacer que ortografía, romanización e IPA parezcan la misma cosa.

## 5. Evidencia R33

| claim_id | afirmación | source_id | localizador exacto | alcance | estado |
|---|---|---|---|---|---|
| REP001-C01 | La ortografía ordinaria puede representar un mismo sonido mediante distintas secuencias gráficas | SND-SRC-0024 | §3.6 “The International Phonetic Alphabet”, discusión inicial del problema de spelling/transcription | ejemplo introductorio en inglés | VERIFIED |
| REP001-C02 | El IPA se introduce como sistema de transcripción para representar sonidos de manera explícita | SND-SRC-0024 | §3.6 “The International Phonetic Alphabet” | función descriptiva general | VERIFIED |
| REP001-C03 | El IPA es un sistema de símbolos mantenido por la International Phonetic Association | SND-SRC-0001 | “The International Phonetic Alphabet and the IPA Chart” | transversal | VERIFIED |

## 6. Fuentes

- SND-SRC-0001 — International Phonetic Association, *The IPA Chart*.
- SND-SRC-0024 — Anderson et al., *Essentials of Linguistics* (2nd ed.), §3.6.

## 7. Nota editorial

La taxonomía “sonido / letra / símbolo” se fija como convención de claridad del MLS. Cada tradición escrita puede requerir terminología más específica.

## 8. Auditoría R33

- **Fecha:** 2026-10-11.
- **Resultado:** EVIDENCE_CHECKED.

## 9. Revisión lingüística wave 02

- **Fecha:** 2026-10-12.
- **Versión revisada:** blob `e9acc0736e57f89d1db22c6b851dd15c2738473f`.
- **Resultado:** PASS → `LINGUISTIC_REVIEW`.
- **Separación conceptual:** sonido/realización, letra/grafema y símbolo de transcripción permanecen como objetos distintos.
- **IPA:** se conserva como sistema de representación, no como “el sonido” mismo.
- **Terminología:** coherente con `editorial/terminology.md` v0.2.
- **Siguiente gate:** EDITORIAL_REVIEW independiente.
