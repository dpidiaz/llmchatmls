# SND-ENUS-001 — Por qué MLS-SND no usa “General American” como una sola voz

**Estado:** READY_FOR_COMPOSITION.
**Idioma:** inglés.
**Variedad:** Estados Unidos; alcance multirreferencia.
**Dominio:** variación / política descriptiva.

## 1. Problema

Una etiqueta amplia como “General American” puede dar la impresión de que existe una única realización fonética neutral que represente de manera uniforme el inglés de Estados Unidos.

Para MLS-SND esa simplificación no es suficientemente precisa.

## 2. Evidencia

La presentación de Cambridge para la Illustration “American English: Southern Michigan” resume que Ladefoged había señalado una diversidad fonética considerable en el inglés de Norteamérica y que la expresión “General American English” no resulta completamente significativa como etiqueta de una única pronunciación.

El artículo de Hillenbrand se plantea precisamente como complemento regional a la descripción previa de Ladefoged.

## 3. Decisión MLS

El perfil en-US será MULTI_REFERENCE.

Esto significa que:

- se describirán contrastes ampliamente documentados cuando la evidencia permita un alcance amplio;
- toda realización regionalmente sensible se etiquetará;
- los ejemplos fonéticos quedarán vinculados a la fuente y variedad que los sustenta;
- una variedad regional concreta no se presentará como sinónimo de todo el inglés estadounidense.

## 4. Qué no significa

No significa que sea imposible enseñar pronunciación estadounidense de manera coherente. Significa que la coherencia editorial se obtendrá declarando el alcance de cada descripción, no ocultando la variación.

## 5. Evidencia R33

| claim_id | afirmación | source_id | localizador | estado |
|---|---|---|---|---|
| ENUS001-C01 | Existe diversidad fonética considerable en el inglés norteamericano y la etiqueta General American no designa una realización única suficientemente precisa | SND-SRC-0005 | Cambridge Core, Extract; Hillenbrand (2003), pp. 121–126 | VERIFIED |
| ENUS001-C02 | La descripción de Hillenbrand trata Southern Michigan como perfil regional que complementa una descripción previa | SND-SRC-0005 | Cambridge Core, Extract; propósito declarado del artículo, pp. 121–126 | VERIFIED |

## 6. Fuentes

Ladefoged, P. (1999). American English. En International Phonetic Association (Ed.), *Handbook of the International Phonetic Association: A guide to the use of the International Phonetic Alphabet* (pp. 41–44). Cambridge University Press.

Hillenbrand, J. M. (2003). American English: Southern Michigan. Journal of the International Phonetic Association, 33(1), 121–126.

## 7. Nota editorial

La elección MULTI_REFERENCE es una decisión de MLS-SND construida a partir de esta evidencia; no es una categoría utilizada por los artículos.

## 8. Auditoría R33

- **Fecha:** 2026-10-11.
- **Resultado:** EVIDENCE_CHECKED.
- **Comprobación:** el extracto de Hillenbrand confirma explícitamente la diversidad fonética norteamericana, cuestiona la utilidad de “General American English” como etiqueta plenamente significativa y declara que su perfil de Southern Michigan amplía la descripción previa de Ladefoged. Para procedencia canónica, MLS-SND usa la versión de Ladefoged incorporada al *Handbook* de 1999 (pp. 41–44); la historia editorial de JIPA documenta el antecedente de 1989.
- **Límite:** MULTI_REFERENCE es una decisión editorial MLS-SND, no una categoría de Hillenbrand.

## Revisión lingüística wave 01

- **Fecha:** 2026-10-11.
- **Resultado:** PASS.
- **Comprobado:** alcance regional/histórico, límites de muestra, relación con Ladefoged y control de generalización nacional.
- **Cambios de claims:** ninguno.
- **Siguiente gate:** EDITORIAL_REVIEW.

## Revisión editorial wave 01

- **Fecha:** 2026-10-11.
- **Resultado:** PASS → `EDITORIAL_REVIEW`.
- **Lectura:** La secuencia problema → evidencia → decisión MLS → límites es compacta y comprensible. MULTI_REFERENCE aparece claramente como decisión editorial y no como categoría atribuida a las fuentes.
- **Control:** no se modificaron claims R33, source IDs, localizadores, transcripciones ni alcance de variedad durante este gate.
- **Siguiente paso:** candidato a `READY_FOR_COMPOSITION` únicamente después de aplicar el gate de composition readiness a esta misma versión.

## Composition readiness

- **Fecha:** 2026-10-11.
- **Resultado:** PASS → `READY_FOR_COMPOSITION`.
- **Cambio lingüístico en este gate:** ninguno.
- **Reader-facing projection:** encabezado editorial + §§1–4 + §6 Fuentes + §7 Nota editorial.
- **Metadata interna excluida de la edición de lectura:** §5 Evidencia R33; §8 Auditoría R33; Revisión lingüística wave 01; Revisión editorial wave 01; este bloque de Composition readiness.
- **Fuentes y fundamento visible:** SND-SRC-0004 como procedencia/alcance complementario y SND-SRC-0005 como fuente evidencial de los claims listados.
- **Scope guard:** MULTI_REFERENCE permanece identificado como decisión MLS-SND y no como categoría de las fuentes.
- **Rollback:** cualquier cambio futuro de claims, variedad/alcance o wording material reabre el gate correspondiente.