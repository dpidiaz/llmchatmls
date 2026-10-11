# MLS-SND — Japanese writing source canonicalization audit

**Branch:** `snd/source-canonicalization-ja-writing-wave-03`  
**Parent integration:** `snd/source-canonicalization-wave-02` / PR #7356  
**Worker source:** PR #7333  
**Date:** 2026-10-11

## Mapping

| Local ID | Canonical ID | Source |
|---|---|---|
| JA-W3-S01 | SND-SRC-0057 | 現代仮名遣い |
| JA-W3-S02 | SND-SRC-0058 | 外来語の表記 |
| JA-W3-S03 | SND-SRC-0059 | 常用漢字表 |
| JA-W3-S04 | SND-SRC-0060 | 常用漢字表の音訓索引 |

## Atomic rewrite

Integrated entry files:
- SND-JA-008 — now cites only SND-SRC-0057/0058.
- SND-JA-009 — now cites only SND-SRC-0059/0060.

## Integrity checks

- Registry entries after parent wave: 60.
- Highest ID: SND-SRC-0060.
- SND-SRC-0057…0060 each occur exactly once.
- 0 `JA-W3-Sxx` IDs remain in integrated entry content.
- 0 cited SND-SRC IDs are absent from this branch's registry.
- No existing language volume is modified.
- No claim state was promoted solely because of canonicalization.

## Scope checks

- kana = orthography, not IPA;
- katakana loanword spelling = Japanese adaptation, not exact source-language phonetics;
- Jōyō table = general-use guide, not exhaustive reading dictionary;
- 音/訓 index = reading index, not pitch-accent or narrow-phonetic source.

## Gate

**SOURCE_CANONICALIZATION PASS.**

Next:
1. parent #7356 integrates;
2. retarget this stacked PR to `feat/mls-snd-foundation`;
3. merge source+entries atomically;
4. run independent linguistic review for JA-008/009.
