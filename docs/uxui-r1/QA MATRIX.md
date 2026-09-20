# MLS EXPERIENCE REFINEMENT R1 — QA MATRIX

## Certificación mínima por workstream

| Área | A | B | C | D | E | F | G |
|---|---|---|---|---|---|---|---|
| Unit/integration tests | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Build/predeploy | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| No canonical regressions | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Keyboard | observe | observe | observe | shared primitives | observe | observe | certify |
| Focus visible | observe | observe | observe | implement shared | observe | observe | certify |
| Mobile | verify | verify | verify | verify primitives | verify | verify | certify |
| 200% zoom/reflow | observe | observe | observe | observe | observe | observe | certify |
| Offline | no regression | no regression | fallback | no regression | certify | degraded states | certify |
| AI unavailable | no regression | n/a | no dependency | n/a | verify messaging | certify | certify |
| Recovery | no regression | no regression | no regression | no regression | no regression | no regression | final |

## Viewports de QA transversal
- 320
- 375
- 390
- 430
- 768
- 1024
- 1280
- 1440
- 1920

## Recorridos críticos
1. Home → Buscar → Virtuoso → entrada
2. Home → idioma → capítulo → entrada
3. Entrada → Profesor IA → cerrar → continuar lectura
4. Entrada → guardar → salir → recuperar
5. Continuar leyendo → restaurar contexto
6. Entrada → También mira → entrada relacionada
7. Offline → lectura disponible
8. Offline/AI unavailable → estado comprensible
9. Keyboard-only navigation
10. Mobile navigation

## Gate de integración
Antes de integrar un PR a `uxui-r1-integration`:
- alcance correcto
- ownership respetado
- contratos intactos
- tests verdes
- no temporary workflow
- no deploy
- no cambios de main

## Gate final a main
- suite completa verde
- predeploy verde
- recovery:verify verde
- deployment contract verde
- Wrangler dry-run verde
- canonical corpus intacto
- reader independiente de AI
- full-text fallback intacto
- Virtuoso fallback intacto
- offline sin regresión
- mobile QA aprobado
- accessibility QA aprobado
