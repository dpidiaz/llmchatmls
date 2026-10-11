# SND-ENUS-005 — Acento léxico

**Estado:** RESEARCHED.
**Idioma:** inglés.
**Variedad:** inglés estadounidense; recursos con alcance explícito.
**Dominio:** prosodia / acento léxico.

## 1. Qué describe esta entrada

Esta entrada trata la **posición y organización del acento dentro de palabras**. No utiliza “acento” en el sentido sociolingüístico de variedad regional y no lo confunde con entonación de frase.

## 2. Por qué no basta una regla única

El material universitario de Broeders & Gussenhoven dedica un capítulo completo a word stress y organiza la descripción en varios tipos de regularidad:

- homógrafos;
- palabras derivadas;
- palabras con múltiples acentos;
- compuestos nominales, verbales y adjetivales;
- stress shift.

El mismo capítulo reconoce que hay palabras para las que no se ofrece una regla general y que deben consultarse lexicográficamente.

Para MLS-SND esto implica una arquitectura doble:

1. explicar regularidades cuando la fuente las documenta;
2. recurrir a recursos de pronunciación para palabras individuales cuando una regla general no basta.

## 3. Recurso lexicográfico estadounidense

CMUdict es un diccionario de pronunciación de inglés estadounidense mantenido por el Speech Group de Carnegie Mellon University.

En su formato documentado, las vocales pueden llevar marcadores:

- `0` — sin acento;
- `1` — acento primario;
- `2` — acento secundario.

MLS-SND puede usar ese recurso para localizar o contrastar pronunciaciones de palabras concretas, pero no convertirá el sistema de números de CMUdict en una notación prosódica universal del tomo.

## 4. Variación y límites

Una pronunciación lexicográfica no demuestra que todas las variedades estadounidenses compartan exactamente el mismo patrón ni que no existan variantes.

Cuando una palabra tenga más de una pronunciación documentada, la entrada deberá:

- conservar las variantes relevantes;
- identificar el recurso;
- evitar presentar una sola forma como universal sin justificación;
- distinguir acento léxico de prominencia en frase.

## 5. Relación con otras entradas

- SND-FND-011 — Acento y prominencia.
- SND-ENUS-007 — Ritmo, organización temporal y prominencia.
- SND-ENUS-008 — Entonación y variación prosódica regional.

## 6. Claims de esta versión

| claim_id | afirmación | fuente | localizador | estado |
|---|---|---|---|---|
| ENUS005-C01 | El manual universitario consultado trata word stress mediante homógrafos, derivados, múltiples acentos, compuestos y stress shift | ENUS-CAND-008 | cap. 3 “Word stress”; §§3.1–3.8 | SOURCED_PENDING_REGISTRY |
| ENUS005-C02 | El mismo capítulo reconoce palabras para las que no proporciona una regla general y remite a consulta de pronunciación | ENUS-CAND-008 | cap. 3 “Word stress”, introducción | SOURCED_PENDING_REGISTRY |
| ENUS005-C03 | CMUdict es un diccionario gratuito de pronunciación de US English mantenido por Carnegie Mellon University | ENUS-CAND-009 | CMUdict README | SOURCED_PENDING_REGISTRY |
| ENUS005-C04 | La documentación del formato CMUdict usa 0, 1 y 2 para ausencia de acento, acento primario y acento secundario en vocales | ENUS-CAND-009 | cmudict-tools, “CMU Pronunciation Dictionary File Format” | SOURCED_PENDING_REGISTRY |
| ENUS005-C05 | El propio proyecto CMUdict advierte que pueden permanecer errores, omisiones e inconsistencias | ENUS-CAND-009 | CMUdict README | SOURCED_PENDING_REGISTRY |

## 7. Gate pendiente

Para pasar a EVIDENCE_CHECKED:

1. promover ENUS-CAND-008/009 al Source Registry global con IDs canónicos;
2. verificar localizadores del capítulo 3 para cada subregla que llegue a publicarse;
3. seleccionar ejemplos que no dependan de una única variedad sin etiqueta;
4. no usar CMUdict como autoridad única para una generalización fonológica.

## 8. Nota editorial

MLS-SND prioriza explicar **cómo consultar y comprender el acento léxico** antes que ofrecer una lista de reglas aparentemente exhaustiva.