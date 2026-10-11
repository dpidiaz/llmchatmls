# Claim — DE-008 evidence gate wave 01

**Tipo:** R33 evidence-map gate.
**Base:** `feat/mls-snd-foundation`.

## ID

- SND-DE-008 — Mapa DE/AT/CH de variación estándar.

## Objetivo

Validar DE-008 como **mapa de evidencia por estándar nacional**, no como tres perfiles fonéticos exhaustivos.

## Fuentes canónicas

- SND-SRC-0010 — Duden; referencia lexicográfica alemana.
- SND-SRC-0019 — Kohler (1990); Illustration histórica con DATE_SCOPE_WARNING.
- SND-SRC-0030 — Austria; variación de -ig.
- SND-SRC-0031 — Swiss Standard German; calidad vocálica e influencia alemánica.

## Reglas

- MULTI_REFERENCE: Alemania, Austria y Suiza no se colapsan.
- Un estudio de un fenómeno no equivale a perfil nacional completo.
- Alemania conserva warning temporal.
- Austria conserva scope de -ig.
- Suiza conserva scope de calidad vocálica/áreas estudiadas.
- DE-PROP-003 puede seguir como research lead; no es requisito para este gate.

## Gate esperado

`EVIDENCE_CHECKED` **solo como mapa comparativo de cobertura**.
