# MLS-SND — Editorial infrastructure clean reapply — wave 01

**Fecha:** 2026-10-11  
**Base:** `b1bd83f5d404a29937985d67da74306d37056fdb`

## Alcance

Reconciliar dos waves editoriales históricas sin sobrescribir archivos ya canónicos:

- #7308 — Fuentes y fundamento para el lector;
- #7335 — Tipografía, Unicode y QA multiescritura.

## Reader-facing evidence

Los cuatro archivos editoriales sustantivos de #7308 ya estaban presentes en la matriz y sus blobs eran exactamente idénticos a la wave original:

- `citation-and-apa-policy.md`;
- `evidence-editorial-checklist.md`;
- `evidence-language-policy.md`;
- `reader-facing-evidence.md`.

Por ello esta integración añade únicamente el claim histórico que faltaba; no reescribe esos cuatro archivos.

## Unicode / tipografía

Se reaplican los seis archivos faltantes de #7335:

- claim de la wave;
- propuesta de fuentes Unicode;
- política Unicode/tipografía;
- smoke test;
- resultados QA;
- checklist de composición.

Verificación externa previa a integración:

- Unicode Standard Annex #15: **Unicode 18.0.0**;
- fecha: **2026-08-12**;
- revisión: **58**;
- estado del documento: estable/aprobado para publicación por Unicode Consortium;
- URL normativa: https://www.unicode.org/reports/tr15/

La wave no distribuye archivos tipográficos ni selecciona una familia concreta.

## Resultado

**PASS_CLEAN_REAPPLY.**

- 0 entradas lingüísticas modificadas;
- 0 estados de workflow modificados;
- 0 claims R33 lingüísticos modificados;
- 0 sobrescrituras de políticas reader-facing ya canónicas;
- fixture Unicode conserva su resultado NFC PASS / U+FFFD = 0 como dato de la wave original.

Los controles de render PDF/web y cobertura de una familia tipográfica concreta siguen siendo gates futuros de composición.
