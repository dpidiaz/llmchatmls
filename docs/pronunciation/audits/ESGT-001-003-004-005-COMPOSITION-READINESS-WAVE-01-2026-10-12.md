# Audit — es-GT ESGT-001/003/004/005 composition readiness wave 01

**Rama:** `snd/esgt001-003-004-005-composition-readiness-wave-01`  
**Fecha:** 2026-10-12  
**Base:** `c9da0d2421b36dd1499def147145bec161bc55e9`

## Resultado

| ID | versión evaluada | resultado | estado de salida |
|---|---|---|---|
| SND-ESGT-001 | `bf0fbce0c8c427aa11453ad092d6bc2f41e2a0d3` | BLOCKED | EDITORIAL_REVIEW |
| SND-ESGT-003 | `0e95a3a49c63b8e226379a4c1576f497e71a7250` | PASS | READY_FOR_COMPOSITION |
| SND-ESGT-004 | `4eb233ed19ee5d1ed6203b862f3d92b7f0f44f69` | PASS | READY_FOR_COMPOSITION |
| SND-ESGT-005 | `964d143daa00a6ac6317984062cfea2d101cc2df` | BLOCKED | EDITORIAL_REVIEW |

## Blockers

### ESGT-001
La referencia sigue **REFERENCE_PROVISIONAL**. Su propio gate exige completar/reconciliar referencia urbana, inventario segmental y prosodia antes de READY_FOR_COMPOSITION. Esto afecta el alcance central de la entrada.

### ESGT-005
Su gate editorial condiciona la salida al avance del mapa segmental ESGT-002. ESGT-002 sigue en LINGUISTIC_REVIEW y todavía no ha completado EDITORIAL_REVIEW/composition readiness. No se promueve /s/ aisladamente ignorando esa dependencia explícita.

## PASS — ESGT-003
- encuesta Utgård limitada a su diseño;
- Baird (2020) se mantiene abstract-scoped;
- contacto K’ichee’–español no se convierte en pronunciación nacional;
- no se añaden valores formánticos o estadísticas no verificadas.

## PASS — ESGT-004
- mapa de realizaciones, no inventario fonémico final;
- “fricativa” conserva la terminología de Utgård;
- /s/ y demás clusters pendientes siguen fuera;
- no se reconstruye IPA estrecho desde tipografía histórica.

## Written-only
Para ESGT-003/004:
- WRT-01…12: PASS;
- WRT-13/14: OMITTED_WITH_REASON;
- audio no requerido.

ESGT-001/005 no reciben PASS global por blockers previos al gate de composición.

## Integridad
- 2 entradas promovidas;
- 2 entradas bloqueadas sin modificación;
- 2 handoffs creados;
- 0 claims R33 modificados;
- 0 fuentes/localizadores modificados;
- 0 IPA/ejemplos añadidos.

## Resultado final
**2 PASS / 2 BLOCKED.**
