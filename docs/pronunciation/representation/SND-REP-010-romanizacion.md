# SND-REP-010 — Romanización

**Estado:** READY_FOR_COMPOSITION.  
**Dominio:** representación / escritura.  
**Idioma:** transversal.  
**Fuente conceptual:** SND-SRC-0049 — UNGEGN, canonicalizada en el Source Registry.

## 1. Definición operativa MLS-SND

MLS-SND utilizará **romanización** para sistemas que convierten o representan contenido escrito originalmente en un sistema no romano mediante el alfabeto romano/latino, siempre identificando el sistema concreto.

Esta definición sigue el criterio de destino gráfico usado por UNGEGN: la romanización convierte escritura desde un sistema no romano al Roman script.

## 2. Romanización no significa IPA

Una romanización puede diseñarse para estandarización, identificación, lectura, interoperabilidad u otros fines. No debe suponerse que codifica todos los detalles fonéticos de una realización.

Un ejemplo ya canónico del proyecto es la Romanización Revisada del coreano: la documentación del NIKL señala que se basa en pronunciación estándar, pero no refleja todos los detalles, como la longitud vocálica.

## 3. El nombre del sistema es obligatorio

Cuando exista más de una romanización posible, MLS-SND no mostrará una forma latina sin identificar de qué sistema proviene.

Formato recomendado:

**Romanización (nombre del sistema):** …

## 4. Reversibilidad

UNGEGN exige un grado aceptable de reversibilidad para los sistemas de romanización que evalúa para nombres geográficos. MLS-SND no convertirá ese requisito institucional en una propiedad universal de toda romanización.

## 5. Relación con pronunciación

La existencia de una forma romanizada no autoriza a tratarla como transcripción fonética. Si una entrada necesita detalle de realización, deberá añadir IPA u otra capa descriptiva adecuada.

## 6. Evidencia R33

| claim_id | afirmación | source_id | localizador | alcance | estado |
|---|---|---|---|---|---|
| REP010-C01 | UNGEGN define romanización como conversión de escritura no romana al Roman script | SND-SRC-0049 | página “Romanization Systems”, párrafo inicial | definición UNGEGN | VERIFIED |
| REP010-C02 | Los sistemas UNGEGN deben basarse en principios científicos y asegurar un grado aceptable de reversibilidad | SND-SRC-0049 | misma página, requisitos de adopción | sistemas UNGEGN para nombres geográficos | VERIFIED |
| REP010-C03 | La Romanización Revisada coreana no representa todos los detalles fonéticos, incluida longitud vocálica | SND-SRC-0012 | Summary, Note 2 | coreano / sistema específico | VERIFIED |

## 7. Nota editorial

La definición operativa MLS-SND identifica el **tipo de conversión**; las propiedades de cada romanización deberán comprobarse sistema por sistema.

## 8. Gate

**EVIDENCE_CHECKED histórico.** La fuente institucional quedó canonicalizada; la revisión lingüística posterior consta en §9.

## 9. Revisión lingüística wave 02

- **Fecha:** 2026-10-12.
- **Versión revisada:** blob `3b25480aecd20fc4bb45b01414a223518c58bef4`.
- **Resultado:** PASS_WITH_INSTITUTIONAL_SCOPE_WARNING → `LINGUISTIC_REVIEW`.
- **Definición:** romanización se mantiene como representación mediante letras latinas conforme a un sistema identificado; no equivale a IPA.
- **UNGEGN:** su requisito de reversibilidad se limita a sistemas evaluados para nombres geográficos y no se universaliza.
- **Metadata:** SND-SRC-0049 ya estaba canonicalizada; se corrige únicamente el encabezado obsoleto.
- **Siguiente gate:** EDITORIAL_REVIEW independiente.

## 10. Revisión editorial wave 01

- **Fecha:** 2026-10-13.
- **Versión revisada:** blob `c9f6caec4e8f9dc64b56035754e877e3d8146a8d`.
- **Resultado:** PASS_WITH_INSTITUTIONAL_SCOPE_WARNING → `EDITORIAL_REVIEW`.
- **Terminología:** “romanización” permanece alineada con `editorial/terminology.md`: representación mediante letras latinas conforme a un sistema identificado; no equivale a IPA.
- **Alcance institucional:** el requisito de reversibilidad de UNGEGN sigue limitado a los sistemas que esa institución evalúa para nombres geográficos.
- **Siguiente gate:** composition readiness con el scope warning preservado.

## 11. Composition readiness

- **Fecha:** 2026-10-13.
- **Versión evaluada:** blob `7e9349a24490f7db4d7b8e0bf545efeca70fd521`.
- **Resultado:** PASS → `READY_FOR_COMPOSITION`.
- **Reader-facing projection:** §§1–7 incluidas; §§8–10 quedan como metadata interna.
- **Pronunciation Quick Layer:** `NOT_APPLICABLE` — entrada conceptual de representación; no hay forma pronunciable objetivo.
- **Written-only gate:** PASS; no depende de audio ni de una inferencia fonética nueva.
- **Scope guard:** El alcance institucional de UNGEGN permanece visible y no se convierte en regla universal.
- **Handoff:** `composition/handoffs/SND-REP-010.md`.
