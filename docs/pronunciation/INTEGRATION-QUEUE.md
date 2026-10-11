# MLS-SND — Integration Queue

Actualizado: 2026-10-11.

Este archivo registra **decisiones de reconciliación entre chats paralelos**. El estado lingüístico canónico vive en los archivos de `feat/mls-snd-foundation` y en `STATUS.md`.

## Reglas

- Ningún PR entra por volumen de trabajo; entra por gate.
- No-draft ≠ merge automático.
- Si una rama está muy behind/diverged, preferir **clean reapply** de archivos/claims válidos.
- Cuando dos PRs cubren el mismo ID, existe una sola ruta canónica; el resto se convierte en review/superseded.
- Los Source IDs locales se deduplican y reciben `SND-SRC-xxxx` solo durante integración.
- Nunca retroceder el estado canónico por copiar un snapshot viejo.
- Antes de escribir hot files globales, volver a leer su SHA actual.

## Resultados de reconciliación cerrados

| PR | Área | Resultado |
|---|---|---|
| #7294 | CMP-001 | **CLOSED_REAPPLIED** — controles empíricos absorbidos; fuentes canonicalizadas como SND-SRC-0051/0052; branch alterna no mergeada. |
| #7297 | CMP-001 paralelo | **CLOSED_SUPERSEDED** — checklist editorial transferido; segundo archivo CMP-001 descartado. |
| #7310 | REF-002 | **CLOSED_REAPPLIED** — índice IPA, audit y claim reaplicados limpiamente; REF-002 = IN_PROGRESS. |
| #7323 | es-GT segmental | **CLOSED_CANONICALIZED** — ESGT-003/004 presentes; Baird 2020 = SND-SRC-0053; ambos siguen DRAFTED. |
| #7339 | ruso linguistic review | **CLOSED_REAPPLIED** — RU-001…008 → LINGUISTIC_REVIEW; RU-004 desambigua voicing. |
| #7344 | branch divergence audit | **CLOSED_REAPPLIED** — auditoría técnica integrada; no es gate lingüístico. |
| #7345 | zh-TW linguistic review | **CLOSED_REAPPLIED** — 001/004/005/007/008/010 → LINGUISTIC_REVIEW; 003/009 intactos. |
| #7348 | francés linguistic review | **CLOSED_REAPPLIED** — audit PASS/PASS_WITH_SCOPE_WARNING integrado; no promoción automática a EDITORIAL_REVIEW. |
| #7349 | en-US linguistic review | **CLOSED_REAPPLIED** — ENUS-001/009 → LINGUISTIC_REVIEW. |
| #7351 | SND-SRC-0031 DOI | **CLOSED_FIXED** — DOI corregido a 10.1017/S0025100320000377. |

## Reconciliaciones históricas ya absorbidas

- Foundations clean integration de #7301/#7303: contenido canónico reaplicado; no revivir ramas stale como rutas de merge.
- FND-012/016/018 de #7302: ya canónicos.
- FND-001/014 de #7304: ya canónicos.
- Source integration protocol de #7320: ya canónico y operativo.
- Coreano #7288 absorbió hallazgos de la ruta paralela #7287.
- zh-TW amplio ya contiene ZHTW-008 y cautelas que estaban repartidas entre #7286/#7291.
- Representation REP-001/009/010/011/012 ya es canónica aunque sus PRs históricos permanezcan visibles.

## Activos con acción concreta

| PR / wave | Área | Estado integrador | Acción |
|---|---|---|---|
| #7343 / #7373 / #7375 | content linter | **CLOSED_FIXED** | Linter v0.1 y fix de integridad ya integrados; falta rerun global sobre 90 entradas / 79 fuentes. |
| #7342 | status reconciliation | **STALE_SNAPSHOT / REBASE_REQUIRED** | No reemplazar STATUS/Inventory con conteos antiguos; reevaluar 77 entradas / 56 fuentes o posteriores. |
| #7336 | coordinación | **USEFUL_RULES / STALE_COUNTS** | Integrar solo reglas anti-colisión compatibles; no copiar snapshots históricos. |
| #7352 | alemán linguistic review | **REVIEW_ARTIFACT_CANDIDATE** | Integrar audit/claim sin promover DE-005/008 mientras sigan pre-gate. |
| #7340 | pt-BR/rio review | **REVIEW_ARTIFACT_CANDIDATE** | Conservar PASS con scoped holds; canonicalizar fuentes locales antes de cualquier promoción. |
| #7350 | en-US reducción | **ACTIVE_CONTENT** | Esperar salida; no solapar ENUS-001/009 ya revisados. |
| #7347 | japonés consonantes | **ACTIVE_CONTENT** | Estado deliberadamente RESEARCHED_PARTIAL; canonicalizar fuentes locales al integrar. |
| #7337 | zh-TW segmental | **ACTIVE_CONTENT** | Coordinar con ZHTW-003 pre-gate y evitar duplicar 001/004/005/007/008/010. |
| #7324 | francés core | **ACTIVE_CONTENT** | FR-003…008; respetar warning de referencia francesa ya auditado. |
| #7309 | alemán core | **ACTIVE_CONTENT** | DE-002…006; separar DE/AT/CH. |
| #7277 | pt-BR/rio pilot | **ACTIVE_CONTENT** | Mantener PB_BROAD / RIO_CARIOCA / subscopes separados. |
| #7278 | en-US pilot | **ACTIVE_CONTENT** | Mantener MULTI_REFERENCE; no crear General American homogéneo. |

## es-GT canonicalization

ESGT-003/004/009/010 ya existen físicamente.

Fuentes recién canonicalizadas:

- SND-SRC-0053 — Baird 2020, espacios vocálicos español–k’ichee’, **abstract-only scope**.
- SND-SRC-0054 — Baird & Regan 2025, /f/ en población K’iche’–español.
- SND-SRC-0055 — RAE/ASALE, *Ortografía de la lengua española* (2010).
- SND-SRC-0056 — RAE/ASALE, *Ortografía básica*, §2.4.2.

No promover ESGT-003/004/009/010 por el mero hecho de haber canonicalizado fuentes; sus gates siguen siendo independientes.

## CMP-001 canonical path

Único archivo canónico:

`comparative/SND-CMP-001-comparar-sin-equivalencias.md`

La versión duplicada `SND-CMP-001-comparar-sin-identidad.md` fue retirada después de comprobar que sus aportes diferenciales ya estaban absorbidos.

## Source-ID integrity

Último PASS completo histórico: 60/60 contra Source Registry v0.7.

Árbol físico actual recontado: **90 entradas únicas / 79 fuentes / 0 IDs de entrada duplicados**.

No declarar un nuevo PASS global hasta ejecutar el reescaneo completo con el linter/reconciliador actualizado sobre **90/79**. Los merges recientes no sustituyen ese scan.

## Próximo orden de integración

1. ejecutar QA estructural/global actualizado sobre 90 entradas / 79 fuentes;
2. integrar reviews lingüísticas concluidas que no alteren claims;
3. canonicalizar fuentes locales de waves activas antes de promoción;
4. clean-reapply de ramas muy behind;
5. integrar perfiles nuevos por ID, nunca por merge masivo de historia vieja;
6. luego abrir EDITORIAL_REVIEW del primer bloque transversal.
