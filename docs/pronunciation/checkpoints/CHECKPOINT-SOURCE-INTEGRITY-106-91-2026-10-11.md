# MLS-SND — Checkpoint: source integrity audit paused

**Date:** 2026-10-11  
**Branch:** `snd/source-integrity-107-wave-01`  
**State:** PAUSED_BY_USER  

## Why this checkpoint exists

The audit was paused explicitly before completion. This file records only verified progress so another chat can resume without repeating or overstating work.

## Canonical universe correction

The first raw tree count found **107** files matching `SND-*.md`, but one is a review artifact, not a canonical entry:

- `docs/pronunciation/reviews/SND-FND-014-LINGUISTIC-REVIEW-20261011.md`

Using only canonical roots:

- `fundamentals/`
- `representation/`
- `comparative/`
- `reference/`
- `languages/`

the frozen audit universe is **106 canonical entries**.

Root distribution at the frozen cut:

- FND: 18
- REP: 12
- CMP: 1
- REF: 1
- language profiles: 74

Physical duplicate canonical IDs found at this stage: **0**.

## Source Registry at the cut

- Canonical Source IDs detected: **91** (`SND-SRC-0001…0091`).

## Completed scan work

### Canonical entries 12–23

Completed with the corrected local-ID detector.

Result:

- unknown canonical `SND-SRC` references: **0**;
- local/wave source IDs: **0**;
- filename/heading ID mismatches: **0**;
- entries without a canonical source reference: **0**.

IDs covered:

- SND-FND-012
- SND-FND-013
- SND-FND-014
- SND-FND-015
- SND-FND-016
- SND-FND-017
- SND-FND-018
- SND-DE-001
- SND-DE-002
- SND-DE-003
- SND-DE-004
- SND-DE-006

Observed states in this completed batch:

- EVIDENCE_CHECKED: 3
- EDITORIAL_REVIEW: 2
- LINGUISTIC_REVIEW: 7

### Canonical entries 0–11

A first pass was run, and these checks were valid:

- unknown canonical source references: 0;
- filename/heading mismatches: 0;
- entries without canonical source references: 0.

However, the **local-ID subcheck is NOT accepted** for this batch because the initial audit regex accidentally classified canonical `SND-SRC-*` IDs as local IDs.

Therefore entries 0–11 must be rerun with the corrected local-ID regex before the global audit can pass.

## Corrected local-ID rule

Do not classify canonical `SND-SRC-*` as local.

Local IDs to detect include patterns such as:

- `JA-W04-S01`
- `KO-W1-C04`
- `FND005-CAND-001`
- `REP-PROP-002`
- other non-`SND-SRC` `<PREFIX>-SRC-<n>` wave IDs where applicable.

## Remaining work

1. rerun canonical entries 0–11 with the corrected local-ID detector;
2. scan canonical entries 24–105;
3. aggregate exact state counts from all 106 entries;
4. verify every cited `SND-SRC-NNNN` exists in the 91-source Registry;
5. verify no local IDs remain in canonical entries;
6. list entries with zero canonical source references;
7. record exact SHA for the completed audit cut;
8. only then publish PASS/FAIL and reconcile STATUS/Inventory if needed.

## Safety rule

Do **not** report `PASS 106/91` yet. The audit is incomplete.

Do **not** reuse the older 96/79, 90/79, 79/79 or 60/60 passes as proof for this cut.

## Resume command

`Continue SOURCE-ID-INTEGRITY 106/91 from checkpoint`

Resume from this checkpoint rather than restarting the whole audit.