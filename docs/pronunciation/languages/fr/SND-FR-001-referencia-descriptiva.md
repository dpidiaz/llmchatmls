# SND-FR-001 — Selección de variedad de referencia

**Estado:** READY_FOR_COMPOSITION.
**Idioma:** francés.
**Dominio:** alcance / variación.
**Política de referencia:** MULTI_REFERENCE.

## 1. Problema

“Francés” no designa una única pronunciación contemporánea homogénea.

El proyecto PFC se construye explícitamente para documentar el francés oral en su **unidad y diversidad** y organiza encuestas en múltiples regiones de la francofonía.

Por ello MLS-SND no etiquetará automáticamente una realización parisina como “la pronunciación francesa”.

## 2. Referencia para la primera edición

La primera edición utilizará una política **MULTI_REFERENCE**: no se seleccionará una única voz, ciudad o corpus como sustituto de todo el francés.

Cada descripción deberá conservar la referencia que realmente sustenta el claim:

- **París** cuando la fuente esté delimitada a una hablante o muestra parisina;
- **France-Nord / alcance supralocal** únicamente cuando la fuente lo declare;
- **punto PFC concreto** cuando se usen datos de una encuesta específica;
- **otras regiones francófonas** con su etiqueta y fuente propias.

Esta política permite mantener un perfil coherente sin convertir una realización metropolitana en “la pronunciación francesa”.

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

**MULTI_REFERENCE** es una **decisión MLS-SND**, no una categoría impuesta por las fuentes.

El primer cluster francés ya revisado confirma que el contenido estable funciona con referencias delimitadas por fuente y variedad: una hablante parisina para determinados claims de Fougeron & Smith, datos parisinos contemporáneos cuando la fuente los ofrece, alcance supralocal/norte de Francia cuando está documentado y PFC como marco de variación con puntos identificados.

Por ello no se fija una única referencia principal para todos los fenómenos. La coherencia editorial se obtiene declarando alcance y procedencia, no ocultando la variación.

## 8. Fuentes

Chalier, M. (2021). *Les normes de prononciation du français : Une étude perceptive panfrancophone*. De Gruyter.

Fougeron, C., & Smith, C. L. (1993). French. *Journal of the International Phonetic Association, 23*(2), 73–76.

Programme Phonologie du Français Contemporain. *PFC : usages, variétés, structure*.

## 9. Entradas relacionadas

- **SND-FR-002** — Vocales y contrastes: mapa descriptivo.
- **SND-FR-009** — Variación documentada en PFC.

## 10. Gate

Los claims permanecen **EVIDENCE_CHECKED** y la revisión lingüística independiente mantiene **PASS_WITH_SCOPE_WARNING**.

El blocker `REFERENCE_PROVISIONAL` queda resuelto en esta versión mediante la política editorial `MULTI_REFERENCE`: toda realización reader-facing debe conservar su fuente/variedad/punto cuando sea material. Esta decisión no añade claims lingüísticos y debe superar composition readiness sobre esta versión concreta.

## 11. Revisión editorial de estabilización de referencia

- **Fecha:** 2026-10-13.
- **Versión de partida:** blob `667d9ed5d427dca033c29cfacfc6b1e3e2c1ecd3`.
- **Resultado:** PASS_WITH_SCOPE_POLICY_UPDATE → `EDITORIAL_REVIEW`.
- **Cambio editorial material:** `REFERENCE_PROVISIONAL` se sustituye por `MULTI_REFERENCE` para la primera edición.
- **Justificación:** el cluster FR-002…009 ya aprobado utiliza referencias delimitadas por fuente/variedad en lugar de una sola voz francesa; la decisión es consistente con PFC, la muestra parisina de Fougeron & Smith y la pluralidad normativa discutida por Chalier.
- **Invariante:** París, France-Nord, puntos PFC y otras referencias no son intercambiables.
- **Cambios lingüísticos/R33:** ninguno; FR001-C01…C05, fuentes y localizadores permanecen intactos.
- **Siguiente gate:** composition readiness sobre esta versión estabilizada.

## 12. Composition readiness wave 02 — 2026-10-13

- **Versión evaluada:** blob `c07d00c632552d964e21616713cf51672d22ae1e`.
- **Resultado:** PASS → `READY_FOR_COMPOSITION`.
- **Blocker previo:** `REFERENCE_PROVISIONAL` resuelto por la política editorial `MULTI_REFERENCE`.
- **Proyección reader-facing:** encabezado editorial + §§1–5, 7–9.
- **Metadata interna excluida:** §6 (tabla R33), §10 (gate interno), §11 (revisión editorial/workflow) y este bloque.
- **Fuentes y fundamento:** derivado de SND-SRC-0009, SND-SRC-0018 y SND-SRC-0039; la política MULTI_REFERENCE debe identificarse como decisión MLS-SND.
- **Pronunciation Quick Layer:** `NOT_APPLICABLE` — entrada de política descriptiva, sin forma léxica objetivo.
- **Autonomía escrita:** PASS; no requiere audio.
- **Open questions:** ninguna bloqueante para la política de referencia actual. Futuras entradas concretas siguen obligadas a declarar su propia variedad/muestra/fuente.
- **Regla para COMPOSITION:** no puede crear `FR-STANDARD`, convertir París en sinónimo de francés ni ocultar el punto PFC/corpus cuando sea material.
