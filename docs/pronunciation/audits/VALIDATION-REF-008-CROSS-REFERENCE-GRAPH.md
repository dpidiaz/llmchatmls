# MLS-SND — Validation: cross-reference graph bootstrap

**Branch:** `snd/ref-cross-reference-graph-wave-01`  
**PR:** #7325  
**Date:** 2026-10-11

## Inputs

- Canonical inventory: `feat/mls-snd-foundation:docs/pronunciation/MLS-SND-MASTER-INVENTORY.md`.
- Edge data: `reference/cross-reference-edges.tsv` on this branch.

## Checks

1. every `source_id` exists in the canonical inventory;
2. every `target_id` exists in the canonical inventory;
3. every relation belongs to the bootstrap vocabulary;
4. no duplicate `(source, relation, target)` edge exists;
5. every `EVIDENCE_CONTEXT` edge points from a profile entry to the `*-001` entry of the same profile.

## Result

**PASS.**

- inventory IDs detected: **145 unique IDs**;
- graph edges checked: **117**;
- missing source/target IDs: **0**;
- invalid relation labels: **0**;
- duplicate edges: **0**;
- invalid profile-context edges: **0**.

## Interpretation

This validates structural consistency only. It does not prove that every future semantic relation is editorially desirable and does not convert navigation edges into linguistic claims.

## Re-run conditions

Re-run this validation after:

- ID splits/merges/retirements;
- inventory restructuring;
- adding `COMPARE` or `SEE_ALSO_LANGUAGE` relations;
- profile-scope entry renames or redirects.