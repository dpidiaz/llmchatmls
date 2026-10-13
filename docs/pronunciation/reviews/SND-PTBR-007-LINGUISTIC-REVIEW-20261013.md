# SND-PTBR-007 — Linguistic review — 2026-10-13

## Versión
- **Entrada:** SND-PTBR-007
- **Blob revisado:** `6998fa6c5fc73a48330db749769ee03b317b5433`
- **Gate de entrada:** EVIDENCE_CHECKED
- **Gate evaluado:** LINGUISTIC_REVIEW

## Controles

### 1. Alcance de variedad
PASS_WITH_SCOPE_WARNING.

La entrada mantiene separados:
- **RIO_SUBSCOPE:NURC** — habla culta histórica en los conjuntos de 1970/1990;
- **RIO_SUBSCOPE:FavRio** — hablantes periféricos del municipio en el estudio de 2026.

Ningún subalcance se convierte en “todo Río”, y la política REFERENCE_PROVISIONAL de pt-BR-rio permanece intacta.

### 2. Temporalidad
PASS.

Los datos NURC no se presentan como distribución contemporánea. La entrada conserva explícitamente la fecha de los conjuntos y la necesidad de evidencia reciente para generalizaciones actuales.

### 3. Representación y análisis
PASS tras guard explícito.

La letra **R** funciona como rótulo de la variable/rótica del fenómeno. No se trata automáticamente como:
- símbolo IPA;
- /fonema/ o archifonema canónico;
- una única realización fonética carioca.

No se añadió IPA ni se infirieron realizaciones desde ortografía o desde etiquetas de fuente.

### 4. Contexto estructural
PASS.

La entrada separa:
- onset;
- intervocálico;
- coda interna;
- coda externa/final;
- verbo/no verbo cuando es material.

La versión vigente solo hace claims auditados sobre el alcance que sus fuentes sostienen.

### 5. Fuente Silva (2026)
PASS_WITH_SCOPE_WARNING.

SND-SRC-0083 se usa en PTBR007-C05 para el diseño/alcance del estudio FavRio. La entrada no afirma resultados finos a partir del resumen institucional y mantiene esa extracción como OPEN_QUESTION.

### 6. Claims y localizadores
PASS para la versión EVIDENCE_CHECKED.

PTBR007-C01…C04 continúan ligados a SND-SRC-0082 y sus secciones/páginas declaradas; PTBR007-C05 continúa ligado a SND-SRC-0083 y al resumen institucional. Esta review no cambia su contenido ni su estado evidencial.

### 7. Cobertura abierta
No bloquea este gate porque la entrada se define como **foco inicial en coda**, no como inventario completo de róticas.

Siguen abiertas:
- realizaciones fonéticas concretas por contexto;
- onset e intervocálico;
- resultados completos de Silva (2026);
- separación adicional de patrones PB_BROAD.

Cualquier ampliación material reabre los gates afectados.

## Veredicto
**PASS_WITH_SCOPE_WARNING → LINGUISTIC_REVIEW.**

Siguiente gate: EDITORIAL_REVIEW sobre la versión resultante.
