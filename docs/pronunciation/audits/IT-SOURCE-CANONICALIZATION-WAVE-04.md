# MLS-SND — Italian source canonicalization wave 04

**Branch:** `snd/source-canonicalization-it-wave-04`  
**Parent integration:** `snd/source-canonicalization-ja-writing-wave-03` / PR #7360  
**Source workers:** PR #7306 (IT-005), PR #7317 (IT-009)  
**Independent linguistic review:** PR #7358  
**Date:** 2026-10-11

## Canonical mappings

| Local ID | Canonical ID | Source |
|---|---|---|
| IT-PROP-CORE-001 | SND-SRC-0061 | Bertinetto & Loporcaro (2005), SI vs FI/MI/RI |
| IT-W02-S01 | SND-SRC-0062 | Gili Fivela (2010), Treccani “Accento” |
| IT-W02-S02 | SND-SRC-0063 | D’Imperio & Rosenthall (1999), main stress |

## Atomic entry rewrites

### IT-005
- local stress-source IDs replaced by SND-SRC-0062/0063;
- IT005-C01…C05 re-audited against declared source localizers;
- IT005-C06 retains canonical SND-SRC-0008 dependency;
- state promoted from DRAFTED → EVIDENCE_CHECKED only after canonicalization + re-audit + prior independent content-direction review #7358.

### IT-009
- IT-PROP-CORE-001 replaced by SND-SRC-0061;
- IT009-C03 re-audited against the article's explicit SI/FI/MI/RI scope;
- IT009-C04 re-audited against p. 137, where FI/RI/MI are explicitly described as diverging in the distribution of stressed higher-/lower-mid vowels;
- state promoted from RESEARCHED → EVIDENCE_CHECKED after re-audit.

## Integrity gate

- registry count on this stacked branch: 63;
- highest ID: SND-SRC-0063;
- SND-SRC-0061…0063 each occur exactly once;
- 0 `IT-W02-Sxx` IDs remain in integrated content;
- 0 `IT-PROP-CORE-xxx` IDs remain in integrated content;
- every SND-SRC cited by IT-005/009 exists in the stacked registry;
- no existing language volume outside MLS-SND is modified.

## Scope gate

Canonicalization does not erase the profile's limits:

- Standard Italian ≠ every regional variety;
- FI/MI/RI are documented comparators, not an exhaustive map of Italy;
- free stress ≠ random stress;
- penultimate preference ≠ categorical penultimate rule;
- lexical stress ≠ phonological vowel length;
- DOP orthoepy ≠ complete regional phonetics.

## Result

**SOURCE_CANONICALIZATION + R33 RE-AUDIT PASS for IT-005/009.**

Next integration order:

1. #7356 (0053–0056) → matrix;
2. #7360 (0057–0060 / JA-008/009) retarget → matrix and integrate;
3. this wave (0061–0063 / IT-005/009) retarget → matrix and integrate;
4. update Italian linguistic-review artifact so IT-005/009 can enter the next formal review state without losing warnings.
