# es-GT linguistic review — wave 01

**Fecha:** 2026-10-11  
**Alcance:** SND-ESGT-001, SND-ESGT-002, SND-ESGT-005.  
**Tipo:** LINGUISTIC_REVIEW / R33 scope audit.  
**Fuera de alcance:** ESGT-003/004/009/010; róticas/prosodia con waves activas.

## Resultado global

**PASS_WITH_SCOPE_WARNINGS + ONE PRE-GATE HOLD**

- ESGT-001 — **PASS_WITH_SCOPE_WARNING**
- ESGT-002 — **BLOCKED_BY_EVIDENCE** como inventario; **PASS_AS_SOURCE_MAP**
- ESGT-005 — **PASS_WITH_SCOPE_WARNING**

No se detectó falsificación de claims ni localizadores inventados.

---

## SND-ESGT-001 — Alcance y variedades

**Dictamen:** PASS_WITH_SCOPE_WARNING.

### Verificación

La fuente institucional ASALE 2021, p. 209, declara explícitamente:

- tres grandes áreas dialectales: centro-occidental, oriental y norteña;
- rasgos que afectan a distintos grupos etarios;
- que el informe no pretende una descripción fonético-fonológica exhaustiva.

La fuente canónica SND-SRC-0025 registra correctamente la metodología ampliada de Utgård:
- 22 localidades;
- 88 informantes;
- estudio geolingüístico segmental de alcance nacional.

La copia de autor de la investigación asociada confirma además que las 22 localidades incluyen Ciudad de Guatemala y que los 88 informantes son mayoritariamente monolingües criados en sus localidades, con excepciones bilingües/multilingües en Livingston.

### Advertencia de alcance

La entrada ya formula correctamente que una futura referencia urbana/centro-occidental es una **decisión editorial**, no una equivalencia demostrada.

Debe conservarse la separación:

**centro-occidental ≠ Ciudad de Guatemala por defecto.**

### Claims

- ESGT001-C01 — PASS.
- ESGT001-C02 — PASS.
- ESGT001-C03 — PASS.
- ESGT001-C04 — PASS_WITH_SOURCE-SCOPE_NOTE: el conteo 22/88 está correctamente registrado en SND-SRC-0025; para claims metodológicos más finos conviene usar el pasaje específico de metodología.

---

## SND-ESGT-002 — Inventario segmental: mapa de evidencia

**Dictamen:** BLOCKED_BY_EVIDENCE como inventario final / PASS_AS_SOURCE_MAP.

La entrada hace algo metodológicamente correcto: **se niega a publicar todavía un inventario fonémico canónico**.

Esto es coherente con la evidencia disponible y con la distinción MLS entre:
- fonema;
- realización;
- alófono;
- variedad;
- contexto.

### Razones para no promover

1. Sigue en SOURCE_MAPPED.
2. El propio archivo identifica gaps acústicos y full-text requirements.
3. Mantiene IDs locales/provisionales en el mapa de fuentes.
4. Algunas fuentes de contacto no pueden generalizarse a español monolingüe nacional.
5. No contiene todavía un gate claim↔source↔locator suficiente para un inventario.

### Recomendación

Mantener el archivo como mapa de investigación. No cambiarlo a EVIDENCE_CHECKED ni transformarlo en tabla de inventario hasta resolver esos gaps.

---

## SND-ESGT-005 — /s/ y variación regional

**Dictamen:** PASS_WITH_SCOPE_WARNING.

### Verificación directa de ASALE 2021, p. 209

La fuente dice explícitamente que:

- en general /s/ mantiene valor predorsal alveolar;
- en el oriente se da lenición y aspiración;
- hay casos de ceceo en posición inicial e intervocálica;
- algunos rasgos orientales se han extendido, pero no esos alófonos de /s/;
- la pronunciación predorsal alveolar sigue siendo la de prestigio en la descripción citada.

Por tanto:

- ESGT005-C01 — PASS.
- ESGT005-C02 — PASS.
- ESGT005-C03 — PASS.
- ESGT005-C04 — PASS.

### Advertencia necesaria

La síntesis regional de ASALE no debe convertirse en un **atlas exhaustivo de distribución de /s/**.

Utgård (SND-SRC-0025) documenta en su encuesta nacional:
- ceceo parcial en localidades de varias zonas, no solo el oriente;
- aspiración en determinados contextos y localidades costeras/interiores;
- condicionamiento por posición y diferencias entre informantes.

Esto no invalida los claims de ESGT-005: demuestra que describen correctamente **lo que afirma ASALE**, pero no agotan toda la distribución geográfica/contextual de las realizaciones de /s/.

### Recomendación

Conservar EVIDENCE_CHECKED, pero antes de una tabla o regla de distribución completa reconciliar ASALE 2021 con SND-SRC-0025 por:
- posición silábica;
- contexto segmental;
- localidad;
- edad/género cuando sea material.

---

## Fuentes comprobadas

1. Herrera Peña, G., & Montenegro Muñoz, M. R. (2021). “Una aproximación al español en Guatemala en los albores del siglo XXI”. En *Crónica de la lengua española 2021*, pp. 206–217. Ver “Fonética y fonología”, p. 209.
2. Utgård, K. (2010). “El español de Guatemala”. En M. Á. Quesada Pacheco (Ed.), *El español hablado en América Central: Nivel fonético*, pp. 49–82. DOI 10.31819/9783865278708-003.
3. Copia de autor de la investigación geolingüística ampliada de Utgård, usada únicamente como control metodológico de 22 localidades / 88 informantes y distribución contextual.

## Gate de salida

- ESGT-001: elegible para continuar tras PASS_WITH_SCOPE_WARNING.
- ESGT-002: permanecer SOURCE_MAPPED.
- ESGT-005: mantener EVIDENCE_CHECKED; revisión lingüística PASS_WITH_SCOPE_WARNING.

Este review no promueve automáticamente ninguna entrada a EDITORIAL_REVIEW.
