# MLS-SND — Linguistic review REP-003/004 — wave 03

**Fecha:** 2026-10-11.  
**Rama:** `snd/representation-ipa-reading-review-wave-03`.  
**Gate:** `EVIDENCE_CHECKED → LINGUISTIC_REVIEW`.  
**Resultado:** **2/2 PASS_WITH_CHANGE**.

## 1. Alcance revisado

- SND-REP-003 — Cómo leer consonantes del IPA.
- SND-REP-004 — Cómo leer vocales del IPA.

No se revisaron REP-005/006 ni otros componentes de representación.

## 2. Fuentes contrastadas

### IPA oficial

La tabla interactiva de la International Phonetic Association confirma:

- organización de consonantes pulmonares por categorías de lugar y modo;
- nota explícita: en celdas pareadas, el símbolo de la derecha es sonoro y el de la izquierda sordo;
- subtablas separadas para consonantes no pulmonares, otros símbolos y diacríticos;
- diagrama vocálico Front/Central/Back y Close…Open;
- nota explícita: en pares vocálicos, el símbolo de la derecha es redondeado.

Fuente canónica MLS-SND: `SND-SRC-0001`.

### Essentials of Linguistics

Las §§3.3–3.5 sustentan:

- lugar y fonación para consonantes;
- modo de articulación;
- altura, backness y redondeamiento para vocales;
- calidad vocálica como continuo dividido en regiones descriptivas.

Fuente canónica: `SND-SRC-0024`.

### Control comparativo

`SND-SRC-0052` se usa únicamente como control empírico acotado para la cautela “misma notación amplia ≠ identidad física automática”, dentro de su alcance polaco/ucraniano/ruso.

## 3. REP-003

### Hallazgo

La versión pre-review decía “información laríngea/sonoridad”. Esa formulación puede mezclar:

- **fonación** como categoría general;
- la oposición **sordo/sonoro**;
- “sonoridad” en otros sentidos fonológicos.

### Cambio

Se sustituyó por una formulación explícita de fonación + oposición sorda/sonora donde la tabla la representa.

Se añadió `REP003-C04` con localizador directo a la nota de la tabla pulmonar.

### Veredicto

**PASS_WITH_CHANGE → LINGUISTIC_REVIEW.**

## 4. REP-004

### Hallazgo

La entrada ya separaba correctamente diagrama descriptivo e inventario de una lengua, pero:

1. el papel del redondeamiento aparecía en prosa sin claim propio;
2. la cautela sobre símbolos amplios compartidos merecía un control empírico en la propia tabla R33.

### Cambios

- se añadió `REP004-C04` para la convención de redondeamiento del diagrama IPA;
- se añadió `REP004-C05` con SND-SRC-0052 como control comparativo explícitamente limitado.

### Veredicto

**PASS_WITH_CHANGE → LINGUISTIC_REVIEW.**

## 5. Controles negativos

La revisión **no** afirma que:

- lugar + modo + voicing agoten todas las dimensiones consonánticas;
- el diagrama vocálico sea una plantilla física exacta de la boca;
- un símbolo IPA tenga una realización física idéntica en todas las lenguas;
- SND-SRC-0052 autorice una generalización sobre cualquier símbolo compartido;
- LINGUISTIC_REVIEW equivalga a EDITORIAL_REVIEW.

## 6. Siguiente gate

Después de integrar esta wave:

1. REP-003/004 pueden entrar a una wave de `EDITORIAL_REVIEW`;
2. revisar claridad para lectores autodidactas y redundancia con REP-002/005/006;
3. no modificar claims ni transcripciones durante editorial review sin devolver el cambio al gate correspondiente.
