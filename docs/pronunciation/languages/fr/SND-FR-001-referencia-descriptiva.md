# SND-FR-001 — Selección de variedad de referencia

**Estado:** EVIDENCE_CHECKED.
**Idioma:** francés.
**Dominio:** alcance / variación.
**Propuesta de estado:** REFERENCE_PROVISIONAL.

## 1. Problema

“Francés” no designa una única pronunciación contemporánea homogénea.

El proyecto PFC se construye explícitamente para documentar el francés oral en su **unidad y diversidad** y organiza encuestas en múltiples regiones de la francofonía.

Por ello MLS-SND no etiquetará automáticamente una realización parisina como “la pronunciación francesa”.

## 2. Ancla propuesta para la primera edición

Cuando el tomo necesite una referencia principal para la descripción básica, utilizará provisionalmente:

> **una referencia metropolitana provisional, delimitada operacionalmente por el corpus que se seleccione; los datos de norte de Francia y de París conservarán siempre su etiqueta específica.**

Esta elección sirve para mantener un perfil manejable dentro del MLS. No pretende representar toda la francofonía.

## 3. Por qué París puede ser un ancla pero no el universo

La Illustration of the IPA de Fougeron y Smith se basa explícitamente en una joven hablante parisina. Es útil como fotografía documentada de una referencia concreta, pero su propio alcance impide convertirla en descripción de todos los hablantes.

La investigación de Chalier sobre normas de pronunciación compara París, Suiza francófona y Québec y concluye que la imagen de una única norma parisina panfrancófona ya no describe adecuadamente el panorama: los resultados apoyan al menos una tendencia bicéntrica, con centro europeo parisino y centro norteamericano quebequense.

## 4. Rol de PFC

PFC será el marco para:
- contrastar localidades;
- documentar variación;
- evitar confundir lectura, conversación guiada y habla espontánea;
- conservar variables sociales y generacionales cuando sean relevantes.

Cuando MLS use datos de un punto PFC concreto, deberá citar ese punto y su publicación principal, conforme a las propias condiciones del proyecto.

## 5. Política de etiquetas

Ejemplos admisibles:

- `FR-PARIS-PFC`
- `FR-FRANCE-NORD`
- `FR-QUEBEC-<FUENTE>`
- `FR-SWITZERLAND-<FUENTE>`

Estas etiquetas **no son intercambiables**. Si se adopta una etiqueta metropolitana o supralocal para la referencia editorial, deberá definirse por separado y vincularse a un corpus o criterio explícito.

No usar `FR-STANDARD` sin definir qué norma o corpus sustenta la etiqueta.

## 6. Evidencia R33

| claim_id | afirmación | fuente | localizador | estado |
|---|---|---|---|---|
| FR001-C01 | PFC se propone describir el francés hablado en su unidad y diversidad | SND-SRC-0009 | PFC Recherche, objetivos del proyecto | VERIFIED |
| FR001-C02 | PFC organiza coordinaciones y encuestas en múltiples regiones francófonas | SND-SRC-0009 | PFC Recherche, coordinaciones regionales y protocolo | VERIFIED |
| FR001-C03 | La Illustration of the IPA de 1993 se basa en una joven hablante parisina | SND-SRC-0018 | extracto de Cambridge; JIPA 23(2), pp. 73–76 | VERIFIED |
| FR001-C04 | Chalier documenta pluralidad de normas y una tendencia bicéntrica París/Québec en el alcance estudiado | SND-SRC-0039 | resumen institucional FWF + conclusión del libro | VERIFIED |
| FR001-C05 | PFC exige citar la encuesta específica cuando se usan uno o dos puntos concretos | SND-SRC-0009 | página principal, condiciones de uso | VERIFIED |

## 7. Decisión editorial

El ancla metropolitana provisional es una **decisión MLS**, no un hecho que las fuentes impongan.

Debe revisarse tras el primer cluster completo.

## 8. Fuentes

Chalier, M. (2021). *Les normes de prononciation du français : Une étude perceptive panfrancophone*. De Gruyter.

Fougeron, C., & Smith, C. L. (1993). French. *Journal of the International Phonetic Association, 23*(2), 73–76.

Programme Phonologie du Français Contemporain. *PFC : usages, variétés, structure*.

## 9. Entradas relacionadas

- **SND-FR-002** — Vocales y contrastes: mapa descriptivo.
- **SND-FR-009** — Variación documentada en PFC.

## 10. Gate

Los claims permanecen **EVIDENCE_CHECKED**. La revisión lingüística independiente concluyó **PASS_WITH_SCOPE_WARNING**; esta entrada no pasa a READY_FOR_COMPOSITION hasta definir operacionalmente la referencia francesa y superar el gate editorial.
