# PTBR composition readiness wave 01 — 2026-10-13

## Alcance

Evaluación individual de:
- SND-PTBR-001 — Portugués brasileño amplio vs. habla carioca
- SND-PTBR-006 — Sibilante /S/ en coda y variación carioca

Base: `e59af25e25222eecae83cd3da6be87ca6987e975`.

## Versiones evaluadas

| ID | blob | resultado |
|---|---|---|
| PTBR-001 | `b3ebe10cbec6545e78276ab1bac865f87ca14660` | BLOCKED |
| PTBR-006 | `8b43795891bfa403096043526dbfde43786a5cee` | PASS |

## PTBR-001 — BLOCKED

La taxonomía PB_BROAD / RIO_CARIOCA es editorialmente útil y ya está respaldada para controlar alcance, pero §4 mantiene la **referencia principal** como `REFERENCE_PROVISIONAL`.

Esto es material para la identidad futura del perfil: COMPOSITION no puede decidir qué referencia principal usar ni borrar el carácter provisional.

**Resultado:** permanece `EDITORIAL_REVIEW`.

**Gate de retorno:** EDITORIAL_REVIEW cuando suficiente evidencia de PTBR-002…010 permita estabilizar la referencia en una versión concreta.

## PTBR-006 — PASS

La entrada es componible como descripción histórica acotada:
- porcentajes siempre ligados a décadas de 1970/1990;
- no afirma tasas de 2026;
- no presenta palatalización como obligatoria;
- conserva variación social;
- mantiene `/S/` como notación analítica de la fuente.

### Reader-facing projection
Incluye §§1–7 y §9. Excluye §§8 y 10 como infraestructura interna.

### Pronunciation Quick Layer
`NOT_APPLICABLE`: no existe forma léxica objetivo para respelling.

### Written-only gate
- WRT-01: PASS
- WRT-02: PASS_WITH_DATE_SCOPE_WARNING
- WRT-03: PASS
- WRT-04: PASS
- WRT-05: PASS
- WRT-06: PASS
- WRT-07: PASS
- WRT-08: PASS
- WRT-09: PASS
- WRT-10: PASS
- WRT-11: PASS
- WRT-12: PASS
- WRT-13/14: NOT_APPLICABLE

Handoff: `composition/handoffs/SND-PTBR-006.md`.

## Resultado global

**1 PASS / 1 BLOCKED.**

- PTBR-006 → `READY_FOR_COMPOSITION`
- PTBR-001 → permanece `EDITORIAL_REVIEW`

No se modifica PB_BROAD/RIO_CARIOCA, /S/, claims R33, porcentajes, fechas, fuentes o localizadores.
