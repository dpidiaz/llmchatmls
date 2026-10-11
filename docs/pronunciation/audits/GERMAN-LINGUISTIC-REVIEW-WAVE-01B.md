# MLS-SND — German linguistic review wave 01b

**Base:** `feat/mls-snd-foundation`  
**Date:** 2026-10-11  
**Purpose:** clean reapply of the already completed German linguistic review to the current canonical matrix.

## Canonical scope

Promoted in this wave:
- DE-001 — German standard reference and national standards;
- DE-007 — Duden and IPA.

Not promoted:
- DE-008 — remains RESEARCHED;
- DE-002/003/004/005/006 — not currently canonical in the matrix.

## Source status

### DE-001
Canonical sources:
- SND-SRC-0019 — Kohler (1990);
- SND-SRC-0010 — Duden;
- SND-SRC-0030 — Austrian standard <-ig>;
- SND-SRC-0031 — Swiss Standard German vowel study.

The SND-SRC-0031 DOI is already corrected in the live matrix to 10.1017/S0025100320000377.

### DE-007
Canonical source:
- SND-SRC-0010 — Duden pronunciation documentation.

## Review verdicts

### DE-001 — PASS_WITH_SCOPE_WARNING

MULTI_REFERENCE remains mandatory.

The entry properly distinguishes:
- an IPA Illustration/reference system;
- Duden lexicographic pronunciation;
- bounded Austrian evidence;
- bounded Swiss evidence.

No source is treated as a complete phonetic grammar of DE/AT/CH.

### DE-007 — PASS

Duden is appropriately used for:
- IPA-based pronunciation information;
- pronunciation-symbol conventions;
- length/stress notation.

It is not treated as evidence that national standard varieties are phonetically uniform.

## Explicit hold

DE-008 must remain RESEARCHED until the national-standard comparison has broader evidence. A symmetric DE/AT/CH table must not be filled by analogy.

## Gate

| Entry | Result |
|---|---|
| DE-001 | LINGUISTIC_REVIEW PASS |
| DE-007 | LINGUISTIC_REVIEW PASS |
| DE-008 | HOLD_RESEARCHED |

**Result: 2/2 current canonical German entries eligible for `LINGUISTIC_REVIEW`; DE-008 remains outside the gate.**
