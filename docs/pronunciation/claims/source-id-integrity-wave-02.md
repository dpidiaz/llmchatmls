# MLS-SND work claim — Source-ID integrity wave 02

**Branch:** `snd/source-id-integrity-wave-02`
**Base:** `feat/mls-snd-foundation`
**Type:** QA / integrity audit

## Scope

- scan all canonical physical `SND-*.md` entries under `docs/pronunciation/`;
- compare every `SND-SRC-*` citation against the current Source Registry;
- detect local/noncanonical source IDs still present in promoted entries;
- distinguish real broken references from tooling false positives;
- report counts by gate/state.

## Exclusions

- no content rewriting;
- no automatic source-ID substitution;
- no promotion of editorial/linguistic states;
- no merge of active worker branches.