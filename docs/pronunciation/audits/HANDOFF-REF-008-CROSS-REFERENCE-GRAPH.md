# MLS-SND — Handoff: SND-REF-008 cross-reference graph

**Branch:** `snd/ref-cross-reference-graph-wave-01`
**PR:** #7325
**Status:** BOOTSTRAP_V0_1

## Output

- `reference/cross-reference-edges.tsv` — 117 initial edges.
- `reference/SND-REF-008-cross-reference-graph.md` — relation semantics and maintenance rules.

## Safety rule

An edge is navigation metadata, not a linguistic-equivalence claim and not R33 evidence.

## Deferred

`COMPARE` and `SEE_ALSO_LANGUAGE` remain intentionally absent until cross-language profiles and comparison chapters pass sufficient gates.

## Next integration check

Validate every source/target ID against the canonical inventory after merge, then remove/redirect any edge affected by splits, merges or retired IDs.