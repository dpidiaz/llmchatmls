# MLS-SND — Japanese writing source canonicalization wave 03c

**Branch:** `snd/source-canonicalization-ja-writing-wave-03c`  
**Base:** `feat/mls-snd-foundation`  
**Supersedes:** PR #7367, clean-reapplied from the current live matrix because its full-registry snapshot had diverged.  
**Date:** 2026-10-11

## Canonical mapping

- JA-W3-S01 → SND-SRC-0057
- JA-W3-S02 → SND-SRC-0058
- JA-W3-S03 → SND-SRC-0059
- JA-W3-S04 → SND-SRC-0060

## Integrated entries

- JA-008 — EVIDENCE_CHECKED; cites only 0057/0058.
- JA-009 — EVIDENCE_CHECKED; cites only 0059/0060.

## Integrity

- source registry count: 60;
- max canonical ID: 0060;
- 0057–0060 each occur once;
- zero JA-W3-Sxx IDs remain;
- zero missing SND-SRC references;
- delta rebuilt directly from the current matrix; only source blocks 0057–0060 were transplanted, never the stale full registry.

## Scope

- kana/katakana/kanji remain writing/reading layers;
- none is treated as IPA;
- Jōyō is not an exhaustive reading dictionary;
- loanword katakana is not exact source-language phonetics.

## Result

**SOURCE_CANONICALIZATION PASS.**

This clean PR is the new parent expected for subsequent serialized source waves.
