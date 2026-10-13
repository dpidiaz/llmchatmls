# Audit — French FR-001…008 composition readiness wave 01

**Rama:** `snd/fr001-008-composition-readiness-wave-01`  
**Fecha:** 2026-10-12  
**Base reclamada:** `70fdeb4f08624c6b28893eda9611d6a8f492352e`  
**Gate:** `EDITORIAL_REVIEW → READY_FOR_COMPOSITION`

## Resultado

| ID | versión evaluada | resultado | estado de salida |
|---|---|---|---|
| SND-FR-001 | `667d9ed5d427dca033c29cfacfc6b1e3e2c1ecd3` | BLOCKED | EDITORIAL_REVIEW |
| SND-FR-002 | `2fd8a47f786514f1011948f4fdbad3e8bb9a6ce8` | PASS | READY_FOR_COMPOSITION |
| SND-FR-003 | `5e8a5b0ca11605e2b1289e1c3a86bc83ffaed66f` | PASS | READY_FOR_COMPOSITION |
| SND-FR-004 | `cf9030f4c4a4f8fe61effddbf6f5e1e7607d9cb5` | PASS | READY_FOR_COMPOSITION |
| SND-FR-005 | `c1ac81f65a5c529385c0bb89528b55af59eae3ce` | PASS | READY_FOR_COMPOSITION |
| SND-FR-006 | `4bc6b6f6d22ee2d11db0237c7af5c82dd2bd7723` | PASS | READY_FOR_COMPOSITION |
| SND-FR-007 | `cd33d4a485ef5a6c83d374511955ea2de8d5504a` | PASS | READY_FOR_COMPOSITION |
| SND-FR-008 | `d29430c99d812657f0a9ae816d61bdbd40798f0d` | PASS | READY_FOR_COMPOSITION |

## FR-001 — blocker

FR-001 permanece **BLOCKED** porque la selección de la referencia francesa principal sigue siendo provisional y no está definida operacionalmente por corpus/criterio. Esto afecta el alcance central de la entrada y cumple el criterio de blocker de `composition-readiness.md`.

No se crea handoff y no se modifica su estado.

## FR-002 — por qué el inventario futuro no bloquea el mapa

FR-002 se evalúa como **mapa descriptivo**. La selección futura de una variedad/subcorpus primario es necesaria para una tabla fonológica de referencia, pero no altera los claims actuales ni el alcance fuente-por-fuente. Se registra como open question no bloqueante, no como permiso para publicar una tabla nacional final.

## FR-003…008 — alcance

Los pendientes explícitos son expansiones futuras fuera del núcleo aprobado:
- FR-003: ampliación contemporánea/subcorpus PFC;
- FR-004: e caduc, elisión, registros y variación;
- FR-006: taxonomía normativa y sociolingüística de liaison;
- FR-008: entonación detallada y estructura prosódica ampliada.

No se incorporan silenciosamente en COMPOSITION.

## Written-only gate

Para FR-002…008:

- WRT-01 PASS — comprensión sin audio;
- WRT-02 PASS — alcance/variedad visibles;
- WRT-03 PASS — no se colapsan grafía, fonología y fonética;
- WRT-04 PASS — convenciones necesarias están explicadas o no se introducen nuevas;
- WRT-05 PASS — no hay prácticas ni intuición oral como evidencia;
- WRT-06 PASS — no hay esquemas inventados presentados como medición;
- WRT-07 PASS — variación y límites permanecen visibles;
- WRT-08 PASS — las entradas son consultables de forma modular;
- WRT-09 PASS — no dependen de color;
- WRT-10 PASS — R33 trazado;
- WRT-11 PASS — sin ejercicios/evaluación;
- WRT-12 PASS — Unicode/IPA del texto fuente se preserva;
- WRT-13/14 PASS o NOT_APPLICABLE según handoff; no se crea pronunciación fácil nueva.

FR-001 no se evalúa a PASS global porque falla el gate previo de alcance para composición.

## Reader-facing projection

Cada PASS tiene manifest propio en `docs/pronunciation/composition/handoffs/`. Las tablas R33 y logs de gates se mantienen como metadata interna; el fundamento visible se deriva de claims/fuentes verificados.

## Pronunciation Quick Layer

- FR-002: NOT_APPLICABLE.
- FR-003/004/005/006/007: OMITTED_WITH_REASON.
- FR-008: NOT_APPLICABLE.

No se inventan formas ni respellings.

## Integridad

- 7 manifests creados.
- 7 entradas promovidas.
- 1 entrada bloqueada sin modificación.
- 0 claims R33 modificados.
- 0 source IDs/localizadores modificados.
- 0 transcripciones o ejemplos añadidos.
- 0 hot files globales modificados.
