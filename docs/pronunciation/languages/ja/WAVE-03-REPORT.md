# 🇯🇵 Japanese writing/pronunciation — Wave 03 report

**PR:** #7333  
**Branch:** `snd/japanese-writing-wave-03`  
**IDs:** JA-008, JA-009  
**Date:** 2026-10-11

## Result

| ID | State | Result |
|---|---|---|
| SND-JA-008 | EVIDENCE_CHECKED | Kana treated as orthography related to phonology, not as IPA; convention-driven exceptions and pronunciation-variation limits documented |
| SND-JA-009 | EVIDENCE_CHECKED | Kanji readings treated lexically/contextually; Jōyō 音/訓 data and scope limits documented |

## Sources introduced locally

- JA-W3-S01 — 現代仮名遣い / Modern Kana Usage.
- JA-W3-S02 — 外来語の表記 / Orthography of Loanwords.
- JA-W3-S03 — 常用漢字表 / Jōyō Kanji Table (2010).
- JA-W3-S04 — 常用漢字表の音訓索引.

All are Japanese government / Agency for Cultural Affairs sources.

## Key editorial findings

### 1. Kana is not IPA

The official modern-kana policy says spelling follows modern phonology as a principle **while preserving conventional exceptions**. It also says it does not decide between variable pronunciations.

Therefore MLS-SND can explain a strong spelling–sound relationship without treating kana as narrow phonetic transcription.

### 2. Katakana for loans is adaptation, not source-language phonetics

The official loanword policy distinguishes ordinary katakana spellings from forms that try to approximate the original sound/spelling more closely, preserves established conventions and leaves some special sounds unregulated.

MLS-SND should therefore avoid equations such as “katakana X = foreign-language phone Y” without language-specific evidence.

### 3. Kanji does not encode one intrinsic pronunciation

The official Jōyō index lists 音/訓 and lexical examples. Individual characters can have several listed readings.

MLS-SND should identify the reading of the **word**, then add phonological/phonetic representation when needed.

### 4. Jōyō scope is deliberately limited

The table is a general-use guide and does not exhaust proper-name readings. Absence from the table must not be described as impossibility in Japanese.

## Boundaries preserved

This wave does **not** claim or revise:
- mora structure (JA-002/005);
- vowel/consonant inventories (JA-003/004);
- Tokyo pitch accent (JA-006/007);
- romanization policy (JA-010).

## Next gate

1. Canonicalize JA-W3-S01..S04 through source-integration protocol #7320.
2. Rewrite JA-008/009 to canonical `SND-SRC` IDs.
3. Run independent LINGUISTIC_REVIEW.
4. Only then consider matrix integration.

## Status

**REVIEW_READY pending source canonicalization.**
