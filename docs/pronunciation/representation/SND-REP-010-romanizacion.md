# SND-REP-010 — Romanización

**Estado:** RESEARCHED.  
**Dominio:** representación / escritura.  
**Idioma:** transversal.  
**Fuente conceptual nueva:** REP-PROP-001, pendiente de canonicalización.

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

## 6. Evidencia provisional

| claim_id | afirmación | source_id | localizador | alcance | estado |
|---|---|---|---|---|---|
| REP010-C01 | UNGEGN define romanización como conversión de escritura no romana al Roman script | REP-PROP-001 | página “Romanization Systems”, párrafo inicial | definición UNGEGN | MAPPED_PENDING_REGISTRY |
| REP010-C02 | Los sistemas UNGEGN deben basarse en principios científicos y asegurar un grado aceptable de reversibilidad | REP-PROP-001 | misma página, requisitos de adopción | sistemas UNGEGN para nombres geográficos | MAPPED_PENDING_REGISTRY |
| REP010-C03 | La Romanización Revisada coreana no representa todos los detalles fonéticos, incluida longitud vocálica | SND-SRC-0012 | Summary, Note 2 | coreano / sistema específico | VERIFIED |

## 7. Nota editorial

La definición operativa MLS-SND identifica el **tipo de conversión**; las propiedades de cada romanización deberán comprobarse sistema por sistema.

## 8. Gate pendiente

Canonicalizar REP-PROP-001 antes de promover esta entrada a EVIDENCE_CHECKED.