# MLS-SND — Integration Queue

Actualizado: 2026-10-12.  
Corte coordinado: **108 entradas / 97 fuentes**.

Este archivo registra decisiones de reconciliación entre chats. El estado lingüístico canónico vive en las entradas de `feat/mls-snd-foundation` y en `STATUS.md`.

## Reglas

- Ningún PR entra por volumen; entra por gate.
- No-draft ≠ merge automático.
- Ramas muy behind/diverged → clean reapply.
- Un ID tiene una sola ruta canónica.
- IDs locales de fuentes se canonicalizan antes de promoción.
- Nunca retroceder un estado canónico copiando un snapshot viejo.
- Hot files se editan solo desde waves explícitas de integración/coordinación.

## Corte actual

Auditoría:

`audits/STATUS-SYNC-108-97-WAVE-05-2026-10-11.md`

Resultado:

- 108 entradas canónicas;
- 97 fuentes canónicas;
- 39 EDITORIAL_REVIEW;
- 33 LINGUISTIC_REVIEW;
- 22 EVIDENCE_CHECKED;
- 0 SOURCE_MAPPED;
- 0 DRAFTED;
- 0 RESEARCHED;
- 1 RESEARCHED_PARTIAL;
- 1 IN_PROGRESS;
- 12 READY_FOR_COMPOSITION.

## Reconciliaciones recientes

### ZHTW-009
La matriz ya contiene ZHTW-009 en **EVIDENCE_CHECKED** con fuente canónica. La wave de source mapping cumplió su objetivo; no revivir el estado DRAFTED histórico.

### KO-002
PR #7429: **MERGED**.

KO-002 está EVIDENCE_CHECKED únicamente como **mapa de evidencia**. Fricativas, africadas, nasales, líquidas y codas siguen abiertas dentro del propio mapa.

### FND-014
Revisión lingüística integrada: FND-014 está en **LINGUISTIC_REVIEW**.

### Composition readiness
El gate canónico ya está integrado.

PR #7458: **MERGED** — FND-002 es la primera entrada READY_FOR_COMPOSITION con reader-facing projection, audit PASS y handoff manifest.

PR #7463: **MERGED** — ENUS-001 es la segunda entrada READY_FOR_COMPOSITION; conserva MULTI_REFERENCE como decisión MLS-SND y separa fuente evidencial de fuente complementaria de alcance.

Las siguientes entradas deben ejecutar el gate de forma independiente; no hay promoción por arrastre.

### Source integrity
La wave #7446 produjo un audit 106/91 pero queda supersedida por esta reconciliación, que además fija la definición exacta de entrada canónica y absorbe los cambios FND-014/KO-002.

## Históricos absorbidos

Se mantienen como antecedente, no como fuente de conteos actuales:

- PASS 60/60;
- PASS 79/79;
- PASS 90/79;
- snapshots 96/79.

No reutilizar sus conteos para describir el árbol actual.

## Activos / acción

### Gates pre-R33
- ZHTW-003 — RESEARCHED_PARTIAL.
- REF-002 — IN_PROGRESS.

ESGT-002 y DE-008 están EVIDENCE_CHECKED; ESGT-004 está LINGUISTIC_REVIEW. No reabrirlos como pre-gates.

### Coverage waves
Priorizar integración por ID de contenido ya producido para:
- PTBR faltantes;
- ESGT-006/007/008;
- ENUS-002;
- DE-005;
- ZHTW-006;
- JA-002/003/005/010;
- RU: sin gap físico en el corte 108/97.

### Review waves
No crear segundos canónicos para entradas ya en LINGUISTIC_REVIEW o EDITORIAL_REVIEW.

## Source-ID integrity

Source Registry v0.20:

`SND-SRC-0001…SND-SRC-0097`

El control actual es estructural/referencial. El control de localizadores y suficiencia por claim sigue siendo otro gate.

## Próximo orden sugerido

1. continuar composition-readiness por lotes pequeños y heterogéneos; ya existen PASS en fundamentos y en-US;
2. cerrar pre-gates ZHTW-003 y REF-002;
3. clean-reapply de coverage waves ya investigadas;
4. completar aparato REF;
5. ejecutar primer composition-readiness pilot;
6. repetir QA global tras la siguiente ola de integraciones.

## Regla final

Las ramas paralelas son granja de producción y revisión.  
La matriz es el producto editorial canónico.
