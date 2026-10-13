# MLS-SND — Italian source canonicalization wave 04d

**Branch:** `snd/source-canonicalization-it-wave-04d`  
**Parent:** `snd/source-canonicalization-en-us-wave-04` / PR #7394  
**Supersedes:** PR #7363 (provisional Italian IDs 0061–0063)  
**Source workers:** #7306 / #7317  
**Independent linguistic review:** #7358  
**Date:** 2026-10-11

## Collision resolution

The first Italian integration reserved 0061–0063 after checking the then-visible queue. A concurrent en-US integrator subsequently materialized 0061–0070 on the same Japanese parent.

Rather than compete for the registry append:

- Italian yielded 0061–0063;
- this wave was rebuilt from the en-US integration branch;
- Italian now owns 0073–0075.

No conflicting numeric identity survives in this branch.

## Canonical mapping

| Local | Canonical |
|---|---|
| IT-PROP-CORE-001 | SND-SRC-0073 |
| IT-W02-S01 | SND-SRC-0074 |
| IT-W02-S02 | SND-SRC-0075 |

## Entry states

- IT-005: EVIDENCE_CHECKED after source rewrite + R33 re-audit.
- IT-009: EVIDENCE_CHECKED after source rewrite + direct p. 137 regional-vowel verification.

## Integrity

- registry count: 73;
- max source ID: 0073;
- 0071/0072/0073 each occur once;
- zero Italian local source IDs remain in integrated content;
- zero missing SND-SRC references;
- no language volume outside MLS-SND modified.

## Scope retained

- Standard Italian ≠ all regional Italian;
- FI/MI/RI = documented comparators, not exhaustive national taxonomy;
- free stress ≠ random stress;
- penultimate preference ≠ categorical rule;
- lexical stress ≠ phonological vowel length.

## Gate

**SOURCE_CANONICALIZATION + R33 RE-AUDIT PASS.**

Integration chain:

#7356 → #7360 → #7394 → this wave.

Retarget sequentially as each parent enters `feat/mls-snd-foundation`.


## Clean reapply note

Rebuilt on #7394 (`snd/source-canonicalization-en-us-wave-04c`); only source blocks 0073–0075 and the canonical IT-005/009 entry deltas were transplanted. No stale full-registry snapshot was copied.


## Collision resolution

After merged es-GT #7384, JA writing #7393 and en-US #7394, the same Italian source identities move to SND-SRC-0073…0075.
