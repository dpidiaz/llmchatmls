# SND-JA-002 — Mora

**Estado:** RESEARCHED.  
**Idioma:** japonés.  
**Dominio:** fonología / prosodia / estructura.

## 1. Por qué la mora necesita entrada propia

MLS-SND no tratará **mora** como sinónimo de sílaba.

La documentación del Corpus of Spontaneous Japanese utiliza explícitamente una capa de información de mora y publica una correspondencia entre las moras del japonés contemporáneo y sus etiquetas segmentales.

Esto basta para establecer que la mora es una unidad operativa real dentro de una tradición institucional de análisis/anotación del japonés, pero no para imponer una única teoría fonológica de la mora.

## 2. Evidencia del CSJ

El manual de segmentación del CSJ:

- distingue etiquetas de vocales y consonantes;
- incluye `N` (撥音), `Q` (促音) y `H` (segundo elemento de vocal larga);
- contiene un apéndice titulado “correspondencia entre las moras del japonés contemporáneo y las etiquetas segmentales CSJ”.

La base relacional del CSJ contiene además una entidad/campo específico de información de mora enlazado al capítulo 6 del informe metodológico.

## 3. Consecuencia editorial

La futura explicación deberá distinguir al menos:

- mora;
- sílaba;
- segmento;
- unidades especiales representadas en el análisis del CSJ.

No se decidirá todavía aquí cómo formalizar todas las estructuras moraicas del japonés.

## 4. Evidencia provisional

| claim_id | afirmación | fuente | localizador | estado |
|---|---|---|---|---|
| JA002-C01 | El CSJ incluye una capa explícita de información de mora | JA-PROP-002 | CSJ-RDB, campo segMora; referencia a cap. 6 | SOURCED_PENDING_REGISTRY |
| JA002-C02 | El manual publica una correspondencia entre moras del japonés contemporáneo y etiquetas CSJ | JA-PROP-001 | apéndice, p. 11 | SOURCED_PENDING_REGISTRY |
| JA002-C03 | N, Q y H aparecen en la tabla del manual como unidades especiales dentro de la correspondencia de moras | JA-PROP-001 | p. 3 etiquetas + apéndice p. 11 | SOURCED_PENDING_REGISTRY |

## 5. Gate

RESEARCHED. Falta canonicalizar JA-PROP-001/002 y una revisión lingüística que decida hasta dónde presentar la mora como unidad fonológica frente a unidad de anotación.
