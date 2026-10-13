# MLS-SND — Revisión editorial independiente FR-003…008

- **IDs:** SND-FR-003, 004, 005, 006, 007, 008
- **Fecha:** 2026-10-12
- **Rama:** `snd/fr-core-editorial-review-wave-01`
- **Resultado global:** PASS_WITH_SCOPED_WARNINGS
- **Gate:** `LINGUISTIC_REVIEW → EDITORIAL_REVIEW`

## 1. Resultado por entrada

| ID | Versión revisada | Resultado | Límite preservado |
|---|---|---|---|
| FR-003 | `74e4580487039f00e1bfd55d1f683ae1c3120e92` | PASS | hablante parisina / inventario tradicional no universal |
| FR-004 | `82795b51bdeb15791f1285f9e9f94054fe6c0758` | PASS_WITH_METADATA_FIX | núcleo mínimo; elisión de schwa pendiente |
| FR-005 | `2696735a1b0076e208db32213598c2f14ea188de` | PASS | consonante final ≠ una sola regla; procesos separados |
| FR-006 | `e4ead242350d8a6659f1ca5e197b583acb37a8a7` | PASS_WITH_SCOPE_WARNING | definición básica; distribución normativa pendiente |
| FR-007 | `ba64a15b95afef6eda8a19973b9f7d312f60654e` | PASS | enchaînement separado de liaison y de ortografía |
| FR-008 | `7f17f3258c71de7e79729e493b7a52b01da3f1a9` | PASS_WITH_METADATA_FIX | dominio prosódico básico; entonación detallada pendiente |

## 2. Controles editoriales

- La jerarquía de cada entrada permite distinguir afirmación central, límites, evidencia y siguiente gate.
- No se añadieron ni retiraron claims R33.
- No se modificaron Source IDs, localizadores, IPA, análisis lingüístico ni alcance de variedad.
- FR-004 y FR-008 tenían notas internas que todavía hablaban de `EVIDENCE_CHECKED` como “estado”; se reformularon como **gate evidencial previo** para evitar drift de metadata.
- FR-006 conserva de forma explícita que la clasificación obligatoria/facultativa/prohibida de liaison sigue fuera del alcance actual.
- FR-008 conserva que una teoría detallada de entonación francesa requiere fuentes adicionales.

## 3. Próximo gate

Las seis entradas pueden pasar a **composition readiness** sobre estas versiones exactas. Cualquier ampliación material de schwa, liaison o entonación debe reabrir los gates afectados.
