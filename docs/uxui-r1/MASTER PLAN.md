# MLS EXPERIENCE REFINEMENT R1 — MASTER PLAN

## Propósito
Refinar UX y UI de MASTER LANGUAGE SYSTEM mediante varios workstreams paralelos, acumulativos y reversibles, sin romper contratos existentes ni interferir entre equipos.

## Principio rector
Cada chat tiene un dominio claro. GitHub es la memoria compartida. Ningún worker modifica `main` ni despliega producción.

## Equipo
- Chat 0 — Coordinator / Integration Lead
- Chat A — Navigation & Orientation
- Chat B — Continuity & Personal Library
- Chat C — Discovery & Learning
- Chat D — Visual System
- Chat E — Offline & Resilience
- Chat F — AI Experience
- Chat G — Accessibility & Responsive QA

## Ramas
- integración: `uxui-r1-integration`
- A: `uxui-r1-navigation`
- B: `uxui-r1-continuity`
- C: `uxui-r1-discovery`
- D: `uxui-r1-visual-system`
- E: `uxui-r1-offline`
- F: `uxui-r1-ai-experience`
- G: `uxui-r1-accessibility`

## Flujo
1. Worker parte de `uxui-r1-integration` o del commit base indicado por Chat 0.
2. Worker modifica solo su dominio.
3. Worker añade tests razonables.
4. Worker actualiza STATUS y dependencias.
5. Worker abre PR hacia `uxui-r1-integration`.
6. Chat 0 revisa contratos, dependencias, conflictos y CI.
7. Solo Chat 0 integra.
8. `main` se toca únicamente al cierre de una wave certificada.

## Waves
### Wave 0 — Coordinación
Contratos, ownership, decisiones, dependencias, QA y definición de terminado.

### Wave 1 — Fundación visual
D normaliza tokens y primitives sin rediseño perceptible.

### Wave 2 — Paralelo funcional
A, B, C, E y F avanzan en paralelo respetando ownership y dependencias.

### Wave 3 — Integración
Chat 0 integra cambios compatibles y resuelve conflictos de contrato.

### Wave 4 — QA transversal
G audita accesibilidad y responsive sobre la integración conjunta.

### Wave 5 — Certificación
Tests, predeploy, recovery, contrato de deploy y dry-run antes de considerar merge a main.

## Regla de seguridad
No sacrificar funcionalidad existente para lograr una mejora estética o de flujo. Todo cambio debe ser reversible, testeable y compatible con los contratos del proyecto.
