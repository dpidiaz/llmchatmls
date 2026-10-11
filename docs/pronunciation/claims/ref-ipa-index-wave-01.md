# MLS-SND work claim — IPA index wave 01

**Branch:** `snd/ref-ipa-index-wave-01`  
**Base:** `feat/mls-snd-foundation`  
**Type:** reference apparatus / indexing

## Claimed ID

- SND-REF-002 — Índice IPA

## Scope

Design and initialize a living IPA index for symbols and diacritics actually used in MLS-SND.

The index will record:
- symbol;
- official IPA category/description;
- representation role in MLS-SND;
- language/variety occurrences;
- first/primary entry;
- broad vs narrow use where relevant;
- notes on analysis/source scope.

## Explicit non-goals

- do not copy the whole IPA chart merely to claim completeness;
- do not infer that a symbol has one universal realization across languages;
- do not treat a shared symbol as cross-language identity;
- do not duplicate REP-003…REP-006 teaching entries.

## Dependency

Official IPA Chart / symbol-list resources (SND-SRC-0001) and current MLS-SND entries.


## Completed

2026-10-11

### Outcome

- Created `reference/SND-REF-002-ipa-index.md`.
- Seeded the index from integrated MLS-SND entries rather than copying the complete IPA chart.
- Added explicit statuses: USED, EXPLAINED, SOURCE_SPECIFIC, PENDING_CLASSIFICATION.
- Added a notation guard so source-specific `/S/` in PTBR-006 is not misclassified as an IPA symbol.
- Recorded official IPA chart revision/reissue distinction and CC BY-SA 4.0 reuse conditions.
- Added `audits/REF-002-IPA-INDEX-SEED.md`.
- Advanced only SND-REF-002 from `INVENTORY` to `IN_PROGRESS`.
- Index remains intentionally incomplete until active language/representation waves are integrated.
