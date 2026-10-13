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
