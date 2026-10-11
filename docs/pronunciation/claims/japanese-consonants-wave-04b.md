# Claim — japanese-consonants-wave-04b

- Área: SND-JA
- IDs: SND-JA-004
- Tipo: mapa segmental + evidencia contemporánea selectiva
- Estado: COMPLETE
- Base: feat/mls-snd-foundation
- Inicio: 2026-10-11
- Reapply limpia de: PR #7347 / `snd/japanese-consonants-wave-04`

## Alcance

- mapa general de consonantes del japonés de referencia;
- separación entre categoría fonológica y realización fonética;
- /r/ como caso contemporáneo documentado de variabilidad articulatoria;
- alternancias p~h~b en contadores como ejemplo de condicionamiento morfofonológico;
- no duplicar mora/duración (#7290), acento (#7332), escritura (#7333) ni romanización (#7313).

## Gate previsto

SOURCE_MAPPED / RESEARCHED_PARTIAL salvo que el inventario completo pueda revalidarse con evidencia contemporánea suficiente.

## Salida

- SND-JA-004 — RESEARCHED_PARTIAL.
- SND-SRC-0023 reutilizada como baseline con advertencia de fecha.
- JA-W04-S01 — NINJAL 2026, /r/ vs /d/ con articulación + CSJ.
- JA-W04-S02 — NINJAL 2024, alternancias p~h~b en contadores.
- JA-W04-S03 — manual institucional del CSJ, política y mapa amplio de etiquetado segmental.
- JA-W04-S04 — Kubozono (2015), metadatos y §3 “Consonant inventory” identificados; HOLD_FULLTEXT, sin claims dependientes.
- Source map local creado conforme a #7320.

## QA de reapply

- rebase conceptual limpio sobre la matriz viva; no cherry-pick de la historia divergida;
- solo 3 archivos de dominio;
- no modifica Source Registry ni hot files globales;
- IDs locales siguen explícitos hasta canonicalización/deduplicación;
- coordinación con #7374: los IDs `JA-W04-S01..S04` son locales declarados, no refs globales huérfanas.

## Gate

No se promueve a EVIDENCE_CHECKED: el CSJ aporta un mapa segmental amplio de corpus y ya se identificó Kubozono (2015) como síntesis fonológica amplia, pero su §3 debe inspeccionarse en texto completo antes de usarlo para claims o reconciliar el inventario.
