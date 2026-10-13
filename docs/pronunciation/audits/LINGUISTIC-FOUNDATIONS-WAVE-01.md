# MLS-SND — Linguistic review: foundations wave 01

**Branch:** `snd/linguistic-review-foundations-wave-01`  
**Date:** 2026-10-11  
**Gate:** `EVIDENCE_CHECKED → LINGUISTIC_REVIEW`

## Scope

Independent linguistic review of the ten foundation entries that had already passed claim/evidence checking:

- SND-FND-002
- SND-FND-003
- SND-FND-004
- SND-FND-006
- SND-FND-007
- SND-FND-008
- SND-FND-009
- SND-FND-011
- SND-FND-013
- SND-FND-015

This review checks analytical framing, terminology, representation level, cross-linguistic scope and risk of false universalization. It does **not** replace R33 evidence checking and does **not** constitute `EDITORIAL_REVIEW`.

## Result

**10/10 entries: PASS or PASS WITH CHANGE.**

All ten canonical entries are promoted to `LINGUISTIC_REVIEW`.

## Duplicate resolution

Parallel work had produced duplicate files for three IDs. The review resolved them before promotion.

### SND-FND-004

**Canonical:** `SND-FND-004-produccion-y-tracto-vocal.md`

**Removed duplicate:** `SND-FND-004-aparato-vocal-y-articulacion.md`

Rationale:

- canonical title matches Master Inventory;
- canonical version covers articulatory regions and pulmonic airflow;
- useful midsagittal-diagram precision from the parallel version was retained as FND004-C04;
- scope remains introductory rather than anatomical/medical.

### SND-FND-006

**Canonical:** `SND-FND-006-consonantes-parametros-articulatorios.md`

**Removed duplicate:** `SND-FND-006-consonantes.md`

Rationale:

- canonical version includes the stronger cross-linguistic safeguard against treating shared place/manner/laryngeal properties as phonetic identity;
- useful terminology caution from the parallel version was integrated;
- `phonation` is no longer collapsed into the binary voiced/voiceless distinction;
- “sonoridad” is explicitly protected against ambiguity with loudness/intensity.

### SND-FND-007

**Canonical:** `SND-FND-007-vocales-parametros.md`

**Removed duplicate:** `SND-FND-007-vocales.md`

Rationale:

- canonical version more explicitly separates vowel description from orthographic letters and cross-language equivalence;
- the parallel version’s useful warning that height/backness labels describe regions in a continuous articulatory space was integrated;
- language-specific inventories remain outside the common chapter.

## Per-entry verdicts

### SND-FND-002 — Fonética y fonología

**PASS.**

Keeps phonetic realization and phonological organization analytically distinct while allowing both to interact in language profiles. Does not infer phonological categories directly from physical differences.

### SND-FND-003 — Fonema, alófono, segmento y realización

**PASS.**

Treats phoneme/allophone labels as analysis-dependent and explicitly permits competing analyses. “Segmento” and “realización” remain useful lower-commitment descriptive terms.

### SND-FND-004 — Producción del habla y tracto vocal

**PASS WITH CONSOLIDATION.**

See duplicate resolution above. The entry is kept at the level needed for phonetic description and does not become a medical anatomy chapter.

### SND-FND-006 — Consonantes: parámetros articulatorios

**PASS WITH CONSOLIDATION.**

Place, manner and laryngeal/phonation dimensions are presented as an introductory framework, not an exhaustive universal representation. Voicing is treated as one laryngeal dimension rather than a synonym for all phonation.

### SND-FND-007 — Vocales: parámetros articulatorios

**PASS WITH CONSOLIDATION.**

Height, backness and rounding are retained as common descriptive axes with an explicit warning that the vowel space is continuous and that the axes do not create cross-language identity.

### SND-FND-008 — La sílaba

**PASS.**

Onset, nucleus, coda and rhyme are explicitly analysis-dependent tools rather than a mandatory universal template. Concrete syllabification remains language-specific.

### SND-FND-009 — Fonotáctica

**PASS WITH CHANGE.**

The basic definition was narrowed from “possible or habitual” patterns to permitted/distributional patterns. Frequency/gradient phonotactics is now treated as an additional phenomenon rather than silently conflated with categorical restrictions.

### SND-FND-011 — Acento y prominencia

**PASS WITH CHANGE.**

The entry no longer presupposes that all languages must be analyzed with the same stress category. Each language profile must justify whether it uses stress, prominence, tone, pitch-accent or another analysis.

Independent typological control:

Van Soeren (2023, §6.1) explicitly notes that stress is not found in the word-level phonology of all languages and that its functions and realization vary considerably among languages that do have stress.  
DOI: https://doi.org/10.1017/S0022226722000081

The introductory source’s intensity/duration/pitch correlates therefore remain illustrative, not universal.

### SND-FND-013 — Tono

**PASS WITH CHANGE.**

The entry now distinguishes linguistic/perceived tonal categories from fundamental frequency (F0) as an acoustic correlate. Tone, pitch accent and intonation remain separate analytical domains.

### SND-FND-015 — Entonación

**PASS.**

The entry correctly avoids equating intonation with lexical tone and rejects universal formulas such as “questions rise”. Concrete form–function mappings remain profile-specific.

## Terminology correction

`editorial/terminology.md` was corrected from **“Intonación”** to **“Entonación”** and the lexical-stress definition was narrowed so that MLS-SND does not presuppose a universal stress category.

## Gate interpretation

`LINGUISTIC_REVIEW` means:

- the shared linguistic framing is acceptable for the current prototype;
- obvious cross-linguistic overgeneralizations in this wave have been removed or bounded;
- duplicate analyses/files have been reconciled.

It does **not** mean:

- final prose/style approval;
- final typography/composition;
- language-specific specialist approval for future profile claims;
- `READY_FOR_COMPOSITION`.

## Next gate

These ten entries are eligible for an **independent `EDITORIAL_REVIEW`** after integration into `feat/mls-snd-foundation`.

A separate reviewer should preferably perform that gate.
