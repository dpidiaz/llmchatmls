# MLS-SND — Claim: coordination drift reconciliation

**Base SHA:** `cfbe8735e334ef0933c11beb8dd61a6483bcaa9c`  
**Fecha:** 2026-10-12  
**Tipo:** coordinación / auditoría estructural  

## Alcance

Reconciliar el estado vivo del árbol canónico con los documentos de coordinación que todavía conservan snapshots anteriores.

Rutas principales:
- `docs/pronunciation/STATUS.md`
- `docs/pronunciation/WORK-QUEUE.md`
- `docs/pronunciation/INTEGRATION-QUEUE.md`
- este informe de auditoría

## Invariantes

- El árbol actual y los archivos canónicos `SND-*.md` tienen prioridad sobre conteos históricos.
- No se promueven estados lingüísticos ni editoriales por inferencia.
- No se modifican claims, IPA, fuentes ni localizadores de entradas.
- Source Registry se usa como autoridad para el conteo/identidad de fuentes.

## Motivo

En el base SHA actual, `STATUS.md` declara 108 entradas / 97 fuentes / 12 READY_FOR_COMPOSITION, mientras `WORK-QUEUE.md` e `INTEGRATION-QUEUE.md` aún declaran 106 / 91 / 2. El drift es material para dispatch y anti-duplicación.

## Resultado de reconciliación

- Árbol canónico: **108 entradas / 108 IDs únicos**.
- Source Registry v0.20: **97 fuentes**, `SND-SRC-0001…0097`.
- Estados tomados del snapshot canónico documentado en `STATUS.md`: 39 EDITORIAL_REVIEW, 33 LINGUISTIC_REVIEW, 22 EVIDENCE_CHECKED, 1 RESEARCHED_PARTIAL, 1 IN_PROGRESS y 12 READY_FOR_COMPOSITION.
- Cobertura física: **35 gaps** sobre 143 candidatas.
- Drift físico corregido: ZHTW-002 y RU-009 ya son canónicos; no deben seguir apareciendo como ausentes.
- Pre-gates obsoletos retirados de dispatch: ESGT-002, ESGT-004 y DE-008 ya no están por debajo de EVIDENCE_CHECKED en el snapshot canónico.
- No se modificó ninguna entrada SND, claim, fuente, localizador, IPA ni estado editorial.

## Gaps físicos vigentes

CMP 10; REF 7; ESGT 3; ENUS 1; PTBR 8; DE 1; ZHTW 1; JA 4. Total: **35**.

## QA

- La suma de la tabla de distribución de STATUS se corrigió de 106 a **108**; sus filas ya sumaban 108.
- WORK-QUEUE e INTEGRATION-QUEUE quedan alineadas al corte 108/97 y a los 12 handoffs READY existentes.
- Cualquier cambio posterior al base SHA exige nueva reconciliación antes de reutilizar estos conteos.
