# MLS-SND — Revisión lingüística independiente en-US core 003–008

- **IDs:** SND-ENUS-003, 004, 005, 006, 007, 008
- **Fecha:** 2026-10-12
- **Rama:** `snd/enus-core-linguistic-review-wave-01`
- **Resultado global:** PASS_WITH_SCOPED_WARNINGS
- **Arquitectura:** MULTI_REFERENCE

## 1. Resultado por entrada

| ID | Versión revisada | Resultado | Límite preservado |
|---|---|---|---|
| ENUS-003 | `e7a1a367161fdfde4c3288361a19c38b3f52647b` | PASS | seis regiones ≠ inventario nacional exhaustivo |
| ENUS-004 | `379ce0feabbebcc90afa10b77c80ce057494e611` | PASS_WITH_SCOPE_WARNING | reducción ≠ schwa universal; estudios delimitados |
| ENUS-005 | `6c06706ea28d5da8c1da239869a31ffc3414e908` | PASS_WITH_SOURCE_ROLE_WARNING | manual/CMUdict no son teoría nacional general |
| ENUS-006 | `cd31b84435ce6ae897f56a65fce307c894ccb48c` | PASS | Buckeye = Columbus/Central Ohio, no EE. UU. completo |
| ENUS-007 | `722e840d8661e20ebb60df4ca688d42babcbac38` | PASS_WITH_SCOPE_WARNING | organización temporal validada; prominencia fina pendiente |
| ENUS-008 | `893cec66970fd50c54a1c736e01e925601071a2a` | PASS | Southern/Midland read speech, no gramática nacional |

## 2. Controles transversales

- No se reinstala “General American” como realización fonética homogénea.
- Región, corpus, tipo de habla, edad/género y fecha se preservan cuando la fuente los vuelve materiales.
- Evidencia regional no se convierte en estereotipo categórico.
- Reducción, acento léxico, ritmo/prominencia y entonación permanecen conceptos separados.
- Los marcadores 0/1/2 de CMUdict siguen siendo convención técnica del formato.
- Buckeye conserva metadatos de procedencia para cualquier ejemplo futuro.
- Southern/Midland de ENUS-008 conserva el control de habla leída y efectos de género.
- ENUS-007 no obtiene una teoría de prominencia por inferencia desde pausas o velocidad.

## 3. Cambios de esta wave

Solo:
- transición de estado de las seis versiones exactas a `LINGUISTIC_REVIEW`;
- notas de revisión por entrada;
- este artefacto de review.

No se modifican claims R33, Source IDs, localizadores, transcripciones, resultados numéricos ni alcance de las fuentes.

## 4. Siguiente gate

EDITORIAL_REVIEW independiente por versión. Si una entrada se amplía materialmente —especialmente ENUS-007 en prominencia— deberá reabrir los gates afectados.
