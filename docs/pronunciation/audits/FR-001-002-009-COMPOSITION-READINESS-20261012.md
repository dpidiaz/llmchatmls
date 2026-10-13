# MLS-SND — French composition readiness wave 01

- **Fecha:** 2026-10-12
- **Rama:** `snd/fr-composition-readiness-wave-01`
- **IDs evaluados:** SND-FR-001, SND-FR-002, SND-FR-009
- **Resultado global:** MIXED — 1 PASS / 2 BLOCKED
- **Gate:** `EDITORIAL_REVIEW → READY_FOR_COMPOSITION` por entrada

## 1. Resultado por entrada

| ID | Versión canónica evaluada | Resultado | Motivo |
|---|---|---|---|
| FR-001 | `667d9ed5d427dca033c29cfacfc6b1e3e2c1ecd3` | BLOCKED | la referencia francesa principal sigue siendo provisional y depende de definir operacionalmente corpus/subcorpus; afecta el alcance central |
| FR-002 | `2fd8a47f786514f1011948f4fdbad3e8bb9a6ce8` | BLOCKED | el inventario/variedad primaria sigue ligado a una decisión de subcorpus/referencia; el open question cambia alcance e interpretación central |
| FR-009 | `cf1ae1ca3eec8f3e3b52bca94aa4ef058c1d5a5b` | PASS → READY_FOR_COMPOSITION | la entrada describe PFC, su protocolo y reglas de uso; seleccionar futuros puntos concretos no altera este núcleo metodológico |

## 2. FR-001 — BLOCKED

No se modifica el archivo canónico ni su estado.

Bloqueante:
- la propia entrada mantiene una **referencia metropolitana provisional** “delimitada operacionalmente por el corpus que se seleccione”;
- elegir ese corpus/subcorpus determina qué variedad se presenta como referencia;
- COMPOSITION no puede tomar esa decisión sin reabrir el gate de contenido.

El hecho de que FR-003…008 ya hayan alcanzado EDITORIAL_REVIEW elimina el antiguo blocker de “core incompleto”, pero **no resuelve la definición operacional de la referencia francesa**.

## 3. FR-002 — BLOCKED

No se modifica el archivo canónico ni su estado.

Bloqueante:
- la entrada es un mapa descriptivo y declara que aún no es “la tabla de vocales del francés”;
- fijar la variedad/subcorpus primaria puede cambiar qué categorías, contrastes marginales, fusiones y warnings deben ocupar la proyección principal;
- la decisión afecta directamente alcance y contenido reader-facing.

COMPOSITION no debe escoger por sí sola entre París, norte de Francia, una referencia supralocal u otro criterio.

## 4. FR-009 — PASS

La pregunta futura “qué puntos PFC serán base de la referencia editorial francesa” se clasifica como **no bloqueante** para FR-009 porque:
- FR-009 no presenta una realización fonética concreta como referencia;
- describe infraestructura, tareas, variables y reglas de procedencia del corpus;
- cualquier uso futuro de un punto concreto conserva su encuesta/publicación y pasará sus propios gates.

### Written-only gate

| Control | Resultado | Nota |
|---|---|---|
| WRT-01 | PASS | no depende de audio |
| WRT-02 | PASS | PFC/múltiples puntos y alcance metodológico explícitos |
| WRT-03 | PASS / N/A | no mezcla ortografía, romanización o IPA |
| WRT-04 | PASS / N/A | no introduce notación especializada no explicada |
| WRT-05 | PASS | no contiene prácticas ni tareas para el lector |
| WRT-06 | PASS | metodología/corpus no se presenta como medición inventada |
| WRT-07 | PASS | variación y límites están explícitos |
| WRT-08 | PASS | referencias cruzadas FR-001/002 |
| WRT-09 | PASS | no depende de color |
| WRT-10 | PASS | FR009-C01…C05 con SND-SRC-0009 |
| WRT-11 | PASS | sin ejercicios/evaluación |
| WRT-12 | PASS | no requiere IPA; Unicode ordinario intacto |
| WRT-13 | NOT_APPLICABLE | Pronunciation Quick Layer no aplica |
| WRT-14 | NOT_APPLICABLE | no existe respelling pedagógica |

### Pronunciation Quick Layer

`NOT_APPLICABLE`: entrada de metodología/corpus, no ficha de una forma pronunciable concreta.

### Reader-facing projection

Definida en `handoffs/SND-FR-009-composition.md`.

## 5. Invariantes

- no se modifican claims R33;
- no se cambian fuentes/localizadores;
- no se selecciona una variedad francesa nueva;
- no se inventa IPA, ejemplo léxico ni punto PFC representativo;
- FR-001/002 permanecen en EDITORIAL_REVIEW;
- solo FR-009 avanza a READY_FOR_COMPOSITION.

## 6. Próximo trabajo

Para desbloquear FR-001/002 se necesita una decisión explícita y evidencialmente defendible sobre la referencia/subcorpus francés; esa decisión pertenece al contenido, no a COMPOSITION.
