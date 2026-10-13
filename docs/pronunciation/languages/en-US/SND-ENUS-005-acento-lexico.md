# SND-ENUS-005 — Acento léxico

**Estado:** LINGUISTIC_REVIEW — PASS_WITH_SOURCE_ROLE_WARNING.  
**Idioma:** inglés.  
**Variedad:** inglés estadounidense; recursos con alcance explícito.  
**Dominio:** prosodia / acento léxico.

## 1. Alcance

Esta entrada trata **acento dentro de palabras**. No utiliza “acento” en el sentido de variedad regional y no lo confunde con entonación de frase.

## 2. Regularidades y consulta léxica

El manual abierto de Broeders y Gussenhoven dedica su capítulo 3 a *word stress* y organiza la exposición mediante homógrafos, palabras derivadas, palabras con más de un acento, compuestos y *stress shift*.

El mismo capítulo reconoce que existen palabras para las que no ofrece una regla general y remite a consulta de pronunciación. Para MLS-SND esto justifica combinar explicaciones de regularidades con recursos lexicográficos cuando se trate una palabra concreta.

## 3. CMUdict como recurso auxiliar

CMUdict se presenta en su README como un diccionario gratuito de pronunciación mantenido por el Speech Group de Carnegie Mellon University. Ese mismo README advierte que pueden permanecer errores, omisiones e inconsistencias.

La documentación de cmudict-tools especifica que las vocales del formato CMU pueden llevar:

- `0` — sin acento;
- `1` — acento primario;
- `2` — acento secundario.

MLS-SND puede usar CMUdict para consultar formas concretas, pero no convierte esos números en notación prosódica universal ni usa el diccionario como única autoridad para generalizaciones fonológicas.

## 4. Evidencia R33

| claim_id | afirmación | source_id | localizador | alcance | estado |
|---|---|---|---|---|---|
| ENUS005-C01 | El manual organiza word stress en homógrafos, derivados, múltiples acentos, compuestos y stress shift | SND-SRC-0070 | cap. 3 “Word stress”; §§3.1–3.8 | marco pedagógico | VERIFIED |
| ENUS005-C02 | El capítulo reconoce palabras sin regla general proporcionada y remite a consulta de pronunciación | SND-SRC-0070 | cap. 3, introducción | marco pedagógico | VERIFIED |
| ENUS005-C03 | CMUdict es un diccionario gratuito de pronunciación mantenido por el Speech Group de Carnegie Mellon University | SND-SRC-0071 | README | recurso lexicográfico/técnico | VERIFIED |
| ENUS005-C04 | El README de CMUdict advierte errores, omisiones e inconsistencias | SND-SRC-0071 | README | limitación del recurso | VERIFIED |
| ENUS005-C05 | El formato documentado usa 0/1/2 para ausencia de stress, primario y secundario en vocales | SND-SRC-0072 | README → “CMU Pronunciation Dictionary File Format” | formato CMUdict | VERIFIED |

## 5. Relacionado con

- SND-FND-011 — Acento y prominencia.
- SND-ENUS-007 — Organización temporal.
- SND-ENUS-008 — Entonación regional.

## 6. Auditoría

- **Fecha:** 2026-10-11.
- **Resultado:** EVIDENCE_CHECKED.
- **Control:** el manual SND-SRC-0070 no se usa para reinstalar “General American” como variedad homogénea; su función aquí es pedagógica y el alcance queda explícito.

## 7. Revisión lingüística wave 01

- **Fecha:** 2026-10-12.
- **Versión revisada:** blob `6c06706ea28d5da8c1da239869a31ffc3414e908`.
- **Resultado:** PASS_WITH_SOURCE_ROLE_WARNING → `LINGUISTIC_REVIEW`.
- **Terminología:** acento léxico se mantiene separado de variedad regional y entonación.
- **Rol de fuentes:** SND-SRC-0070 se usa como marco pedagógico, no para reinstalar GA como estándar fonético nacional; CMUdict y cmudict-tools son recursos lexicográfico/técnicos, no teoría fonológica general.
- **Notación:** 0/1/2 se conserva como convención del formato CMUdict, no como notación prosódica universal.
- **Claims R33:** sin cambios.
- **Siguiente gate:** EDITORIAL_REVIEW independiente.
