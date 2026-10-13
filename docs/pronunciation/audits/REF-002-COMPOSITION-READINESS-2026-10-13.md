# SND-REF-002 — Composition readiness — 2026-10-13

## Scope
Evaluar únicamente la versión editorial vigente de **SND-REF-002 — Índice IPA de MLS-SND** como aparato de consulta vivo.

- **Base matrix:** `8befac6480fea5c0be5f9d3814dce1037b9268c9`
- **Editorial candidate blob:** `bbab709531d29c9b421405c42e8e022583bd0dd5`
- **Gate:** EDITORIAL_REVIEW → READY_FOR_COMPOSITION

## Precondiciones
- EVIDENCE_CHECKED: PASS en la versión de base evidencial; los cambios posteriores fueron guards/terminología y no alteraron fuentes, localizadores ni inventarios.
- LINGUISTIC_REVIEW: PASS_WITH_SCOPE_WARNING, PR #7567.
- EDITORIAL_REVIEW: PASS_WITH_SCOPE_WARNING, PR #7568.
- No hubo reescritura lingüística material posterior.

## Identidad y alcance
PASS_WITH_SCOPE_WARNING.

REF-002 es un **índice vivo** de formas IPA observadas/explicadas por MLS-SND. No es:
- reproducción integral de la tabla IPA;
- inventario fonémico de una lengua;
- mecanismo para promover gates de entradas fuente.

La expansión futura es no bloqueante para componer la versión actual.

## Evidencia R33
PASS para el alcance aprobado.

- SND-SRC-0001 permanece como fuente normativa del sistema IPA.
- Las ocurrencias lingüísticas indexadas conservan su procedencia mediante las entradas canónicas citadas.
- SOURCE_SPECIFIC permanece separado de IPA oficial.
- No se añadieron claims, fuentes ni localizadores en esta wave.

## Representación
PASS.

- /…/ y […] conservan funciones distintas.
- símbolo, diacrítico y secuencia atestiguada no se colapsan.
- `/S/` permanece SOURCE_SPECIFIC.
- Zhuyin y romanizaciones no se convierten en IPA.
- Unicode/diacríticos presentes en el archivo fuente deben preservarse literalmente.

## Reader-facing projection
**Incluido:**
- §§1–6: propósito, inclusión, campos, estados y formas actualmente observadas;
- §8: exclusiones/notaciones no canónicas;
- §10: política frente a versiones de la tabla IPA;
- §12: fuente normativa visible.

**Excluido de la edición de lectura de esta versión:**
- §7: conjunto explicado con estados de indexación futura;
- §9: reglas internas de mantenimiento;
- §11: obligaciones internas de licencia/reproducción gráfica;
- §§13–17: gates, expansión futura, logs de revisión y el propio registro de composition readiness.

La exclusión de metadata interna no elimina esos bloques del repositorio.

## Fuentes y fundamento
La vista de lectura puede derivar un bloque breve desde §12 y desde la procedencia de las filas incluidas. No debe mostrar hashes, ramas, gates ni claims internos por defecto.

## Pronunciation Quick Layer
**NOT_APPLICABLE.**

REF-002 cataloga símbolos, diacríticos y secuencias; no presenta una forma léxica objetivo para pronunciación fácil. Crear respelling de símbolos IPA introduciría una capa confusa y no exigida por la versión aprobada.

## Ejemplos
No hay ejercicios ni ejemplos pedagógicos nuevos. Las formas de las tablas son registros del índice y conservan su procedencia en las entradas canónicas citadas.

## Navegación
PASS.

Referencias necesarias:
- SND-REP-002/003/005/006/007/008;
- SND-RU-007;
- SND-ZHTW-003;
- SND-ZHTW-007;
- SND-PTBR-006.

No se detectó necesidad de redirects para esta proyección.

## Open questions

### Bloqueantes
Ninguno para esta versión.

### No bloqueantes
- expansión futura del índice;
- nuevas emisiones oficiales de la tabla IPA;
- eventual reclasificación de notaciones SOURCE_SPECIFIC si la entrada fuente aporta un análisis aprobado.

Cualquier cambio material reabre el gate afectado.

## Tipografía y composición
PASS con requisitos:
- comenzar en página nueva;
- preservar Unicode real;
- no separar diacríticos combinantes de su base;
- distinguir visualmente /…/ y […];
- no usar color como única señal de categoría;
- mantener tablas legibles sin depender de fuente tipográfica privada;
- no exigir audio.

## Resultado
**PASS → READY_FOR_COMPOSITION.**

Handoff obligatorio: `composition/handoffs/SND-REF-002.md`.
