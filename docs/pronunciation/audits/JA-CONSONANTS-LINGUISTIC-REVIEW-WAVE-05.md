# Japanese consonants linguistic review — wave 05

**Fecha:** 2026-10-11
**Alcance:** SND-JA-004.
**Tipo:** claim-level R33 re-audit + LINGUISTIC_REVIEW.

## Resultado global

**PASS_WITH_SCOPE_WARNING.**

JA-004 pasa de SOURCE_MAPPED a LINGUISTIC_REVIEW.

El PASS valida los claims actuales y su arquitectura de mapa. **No** declara un inventario superficial/exhaustivo definitivo del japonés contemporáneo.

## Claim audit

| Claim | Resultado | Fuente / control |
|---|---|---|
| JA004-C01 | PASS_WITH_DATE_WARNING | SND-SRC-0023, Okada 1991 |
| JA004-C02 | PASS | SND-SRC-0076, articulación /r/–/d/ |
| JA004-C03 | PASS | SND-SRC-0076, ~200 hablantes CSJ / seis entornos |
| JA004-C04 | PASS | SND-SRC-0076, variación de contacto + hipótesis vocálica |
| JA004-C05 | PASS | SND-SRC-0077, alternancia p~h~b en contadores |
| JA004-C06 | PASS | SND-SRC-0077, sokuon + historia de la serie ハ |
| JA004-C07 | PASS | SND-SRC-0078, ~500k palabras / ~44 h CSJ |
| JA004-C08 | PASS | SND-SRC-0078, política de etiquetado |
| JA004-C09 | PASS | SND-SRC-0078, Tabla 2 + etiquetas definidas/no usadas |
| JA004-C10 | PASS | SND-SRC-0079, p. 6, §3.1, Tabla 1 |
| JA004-C11 | PASS | SND-SRC-0079, pp. 6–7, alofonía + estratos léxicos |
| JA004-C12 | PASS | SND-SRC-0079, p. 7, préstamos y expansión CV |

## Controles independientes

### /r/ y /d/

La página institucional de NINJAL confirma:
- semejanza articulatoria general;
- contacto breve para /r/ frente a cierre más sostenido para /d/;
- diferencias de lugar de contacto;
- análisis CSJ de aproximadamente 200 hablantes;
- /r/ más breve que /d/ en los seis entornos reportados;
- variación contextual del contacto de /r/;
- explicación por influencia vocálica presentada como hipótesis, no regla cerrada.

### p~h~b

La explicación institucional de NINJAL confirma:
- 匹 con p/h/b según numeral;
- relación de /p/ con sokuon en varios numerales;
- papel de la historia de la serie ハ;
- fenómeno tratado como morfofonología/historia, no variación libre.

### CSJ

El manual institucional, incluido control visual de sus pp. 2–3, confirma:
- ~500.000 palabras / ~44 horas en el núcleo etiquetado;
- etiquetas basadas en fonemas japoneses + variantes fonéticas;
- nivel intermedio entre transcripción amplia y estrecha;
- Tabla 2 con conjunto consonántico amplio;
- algunas etiquetas definidas pero no usadas actualmente.

### Kubozono 2015

El preview oficial, incluido control visual de las pp. impresas 6–7, confirma:
- Tabla 1 de consonantes de referencia /p b t d k g s z h m n r w j/;
- alofonía contextual de /s/, /t/ y /h/ en vocabulario nativo;
- pérdida de complementariedad estricta para varias realizaciones en estratos sinojaponeses/préstamos;
- expansión reciente de combinaciones consonante-vocal mediante préstamos, incluida la distribución de [t], [ts], [ɸ], /w/ y /j/.

## Scope safeguards

1. Okada 1991 sigue como baseline fechado, no prueba única de actualidad.
2. CSJ es fuente de anotación/corpus, no inventario fonológico metafísico.
3. Las páginas NINJAL 2024/2026 son controles contemporáneos puntuales, no gramática consonántica completa.
4. Kubozono 2015 es baseline amplio, pero el propio capítulo muestra que la superficie es más rica que la Tabla 1.
5. Kana y romanización no se usan para deducir realizaciones fonéticas.
6. Las alternancias p~h~b no se presentan como libres.

## Gate

**R33: PASS. LINGUISTIC_REVIEW: PASS_WITH_SCOPE_WARNING.**

Pendiente:
- EDITORIAL_REVIEW;
- reconciliación futura con JA-002/005/008/010;
- no promover a READY_FOR_COMPOSITION mientras el perfil japonés siga incompleto.