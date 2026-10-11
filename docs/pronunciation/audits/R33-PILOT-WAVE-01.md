# MLS-SND — Auditoría R33 consolidada: pilot wave 01

**Fecha:** 2026-10-11  
**Estado:** COMPLETE  
**Alcance:** SND-REP-002, SND-ENUS-001, SND-ZHTW-007, SND-KO-009, SND-JA-001.

## 1. Propósito

Este informe consolida dos auditorías independientes realizadas en paralelo sobre las cinco primeras entradas piloto. La consolidación conserva los hallazgos complementarios y elimina divergencias de procedencia o alcance antes de avanzar a LINGUISTIC_REVIEW.

La auditoría verifica únicamente:

**claim ↔ fuente ↔ localizador ↔ alcance ↔ versión del texto**

No sustituye LINGUISTIC_REVIEW ni EDITORIAL_REVIEW.

## 2. Resultado general

| ID | Resultado consolidado | Acción |
|---|---|---|
| SND-REP-002 | PASS | Sin cambio sustantivo |
| SND-ENUS-001 | PASS WITH PROVENANCE CORRECTION | Canonizar Ladefoged 1999 Handbook; conservar antecedente 1989 como nota histórica |
| SND-ZHTW-007 | PASS | Sin cambio sustantivo |
| SND-KO-009 | PASS | Sin cambio sustantivo |
| SND-JA-001 | PASS WITH CLAIM NARROWING | Acotar JA001-C03 al alcance explícito de OJAD |

Las cinco entradas permanecen en **EVIDENCE_CHECKED**.

## 3. SND-REP-002 — Qué es el AFI/IPA

### Comprobado

La documentación oficial de la International Phonetic Association respalda:

- mantenimiento oficial del IPA y su tabla;
- requisito de aprobación del Council para cambios oficiales;
- existencia de subgráficos de consonantes, vocales, diacríticos, suprasegmentales y tonos/acentos de palabra;
- función del Handbook como guía de uso y colección de Illustrations.

### Límite

Las reglas MLS-SND sobre no sustituir ortografías, Zhuyin, hangul, kana, kanji o cirílico son **decisiones editoriales del proyecto** y no se atribuyen a la IPA.

**Resultado:** PASS.

## 4. SND-ENUS-001 — Alcance de “General American”

### Hallazgo 1: diversidad y alcance

Hillenbrand (2003) declara explícitamente que existe diversidad fonética considerable en el inglés de Norteamérica y que la etiqueta “General American English” no resulta enteramente significativa como una sola pronunciación. También explica que su descripción de Southern Michigan amplía la descripción anterior de Ladefoged basada en Southern California.

### Hallazgo 2: procedencia de Ladefoged

La Illustration de Ladefoged tiene una historia editorial en dos etapas relevantes:

1. en 1989, durante el desarrollo del nuevo modelo de Illustrations de JIPA, Ladefoged presentó American English como ejemplo del formato;
2. la Illustration fue incorporada al *Handbook of the International Phonetic Association* de 1999.

Para R33, MLS-SND adopta como **referencia canónica**:

Ladefoged, P. (1999). American English. En International Phonetic Association (Ed.), *Handbook of the International Phonetic Association: A guide to the use of the International Phonetic Alphabet* (pp. 41–44). Cambridge University Press.

La elección no declara “incorrecta” la procedencia de 1989; selecciona la manifestación con mejor procedencia, contexto y localización directamente comprobables.

### Alcance explícito del capítulo

El extracto de Cambridge delimita el perfil a hablantes jóvenes educados del Far West y algunas zonas del Midwest, y la grabación base corresponde a una hablante de 21 años de Southern California.

**Resultado:** PASS WITH PROVENANCE CORRECTION.

## 5. SND-ZHTW-007 — Zhuyin/Bopomofo

El manual oficial del Ministry of Education de Taiwán confirma:

- lista de símbolos de onset;
- lista de símbolos de rhyme;
- marcas tonales;
- tabla de sílabas de mandarín con Bopomofo.

La afirmación “Zhuyin ≠ IPA” continúa correctamente tratada como distinción metodológica/editorial de MLS-SND.

**Resultado:** PASS.

## 6. SND-KO-009 — Romanización Revisada

La documentación del National Institute of Korean Language confirma:

- que la Romanización Revisada se basa en pronunciación estándar;
- que procura utilizar letras romanas sin símbolos adicionales en la medida de lo posible;
- que la longitud vocálica no se refleja.

Por tanto, es válido tratar la romanización como capa auxiliar y no como transcripción fonética exhaustiva.

**Resultado:** PASS.

## 7. SND-JA-001 — Tokio como ancla

### Tokyo Accent

El recurso de NINJAL documenta:

- 12,803 palabras;
- 19 hablantes;
- selección orientada a palabras donde se esperaba variación;
- objetivo de mostrar diversidad del acento de Tokio;
- investigación realizada entre 1982 y 1984.

Esto respalda la evidencia de variación y el control temporal de la entrada.

### OJAD

La página institucional de OJAD declara explícitamente que el recurso utiliza como referencia el acento de la **lengua común (dialecto de Tokio)**.

La versión previa de JA001-C03 añadía que OJAD “reconoce variación” con un localizador insuficientemente preciso. La auditoría reduce el claim a aquello que el texto de OJAD declara de forma directa.

La variación continúa respaldada por SND-SRC-0013 (Tokyo Accent), no por una sobreextensión de SND-SRC-0014.

**Resultado:** PASS WITH CLAIM NARROWING.

## 8. Localizador de Guatemala preservado

Durante las auditorías paralelas también se refinó SND-SRC-0003. La rama matriz ya conserva el localizador:

- capítulo “Una aproximación al español en Guatemala en los albores del siglo XXI”;
- “Peculiaridades del español de Guatemala”;
- “Fonética y fonología”;
- p. 209 de la edición impresa.

La consolidación no reescribe este dato porque ya estaba integrado correctamente.

## 9. Cambios canónicos resultantes

1. SND-SRC-0004 usa Ladefoged (1999), *Handbook*, pp. 41–44 como referencia canónica.
2. La historia de 1989 se conserva como antecedente editorial, no se borra.
3. SND-ENUS-001 sincroniza su bibliografía con SND-SRC-0004.
4. JA001-C03 se limita a la referencia explícita de OJAD a 共通語（東京方言）.
5. La evidencia de variación japonesa queda adscrita a Tokyo Accent.
6. Las cinco entradas permanecen EVIDENCE_CHECKED.

## 10. Próximo gate

Estas entradas son elegibles para:

1. **LINGUISTIC_REVIEW**;
2. después, **EDITORIAL_REVIEW**.

No pasan automáticamente a READY_FOR_COMPOSITION.
