# MLS-SND — Japanese writing source canonicalization wave 03d

**Branch:** `snd/source-canonicalization-ja-writing-wave-03d`  
**Base:** `feat/mls-snd-foundation`  
**Supersedes:** PR #7387 after merged #7384 reserved 0057–0058 for es-GT.  
**Date:** 2026-10-11

## Canonical mapping

- JA-W3-S01 → SND-SRC-0059
- JA-W3-S02 → SND-SRC-0060
- JA-W3-S03 → SND-SRC-0061
- JA-W3-S04 → SND-SRC-0062

## Integrated entries

- JA-008 — EVIDENCE_CHECKED; cites only 0057/0058.
- JA-009 — EVIDENCE_CHECKED; cites only 0059/0060.

## Integrity

- source registry count: 62;
- max canonical ID: 0060;
- 0059–0062 each occur once;
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


## Collision resolution

Merged PR #7384 owns SND-SRC-0057/0058. This wave therefore assigns the Japanese writing sources to SND-SRC-0059…0062 without changing their source identities or evidential scope.
