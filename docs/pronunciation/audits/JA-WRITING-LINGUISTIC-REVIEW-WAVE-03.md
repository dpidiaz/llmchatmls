# MLS-SND — Japanese writing/pronunciation linguistic review wave 03

**Reviewed content:** JA-008 / JA-009 from #7333 and clean canonical integration #7367  
**Date:** 2026-10-11  
**Scope:** writing ↔ pronunciation only; mora, segmental phonetics, pitch accent and romanization are outside this gate.

## Executive verdict

**LINGUISTIC_REVIEW PASS for JA-008 and JA-009, conditional only on clean source integration #7367.**

The entries correctly distinguish:
- kana orthography;
- loanword katakana conventions;
- kanji;
- lexical readings;
- phonological representation;
- phonetic IPA.

No reviewed claim treats kana or kanji as an IPA-like system.

---

## JA-008 — Kana y pronunciación

**Verdict: PASS.**

### JA008-C01 — PASS

The official Modern Kana Usage preface states that words are, in principle, written according to the phonology of modern Japanese while established orthographic practice is respected through specified exceptions.

That is exactly the distinction the entry needs: sound structure informs orthography, but orthography is not narrow phonetic transcription.

### JA008-C02 — PASS

The same preface explicitly says the policy does not attempt to decide between alternative pronunciations where a word has pronunciation variation.

Therefore a canonical kana spelling must not be used by MLS-SND to infer one uniquely prescribed surface realization.

### JA008-C03/C04 — PASS

The official exception section explicitly preserves:
- を / は / へ in particle uses;
- specified ぢ/づ cases;
- orthographic conventions for long vowels.

For the relevant o-row cases, the policy says the same spelling is used regardless of whether pronunciation is treated as a long vowel or as sequences such as オ・オ / コ・オ. The appended e-row rule makes a parallel distinction between long-vowel and vowel-sequence interpretations.

This directly supports the entry's warning that a kana string is not a sequence of narrow phonetic symbols.

### JA008-C05 — PASS

The official loanword-orthography guidance:
- defines its scope as katakana writing of loanwords and foreign names;
- explicitly refuses to choose one form when lexical form varies;
- preserves established usage;
- allows forms closer to foreign pronunciation/spelling in appropriate cases;
- leaves some special-sound representations unregulated.

Therefore MLS-SND is right to describe loanword katakana as **Japanese orthographic adaptation**, not exact reproduction of source-language phonetics.

### Additional safeguard from the official kana rule

The rule separately identifies 直音, 拗音, 撥音, 促音 and 長音. This is useful evidence against a future oversimplification such as “one kana character = one sound/mora”: yōon itself uses multi-character written sequences such as しゃ.

This refinement may be added later, but is not required for JA-008's current PASS.

---

## JA-009 — Kanji, lecturas y pronunciación

**Verdict: PASS.**

### JA009-C01 — PASS

The current Agency for Cultural Affairs page identifies the Jōyō Kanji Table as the November 30, 2010 Cabinet Notice No. 2 and explicitly describes it as a guide for kanji use in writing modern Japanese in general social life.

This is a usage standard, not a complete pronunciation dictionary.

### JA009-C02 — PASS

The official 音訓 index states:
- search by 音 uses katakana;
- search by 訓 uses hiragana;
- result rows contain character, 音訓, examples and notes.

The entry's use of 音/訓 as institutional/traditional reading categories is therefore appropriate.

### JA009-C03 — PASS

The index visibly lists many characters with multiple readings. The row for 下, used by the entry, contains multiple 音 and 訓 together with different lexical examples.

Therefore a kanji should not be assigned one context-free phonetic transcription as “the pronunciation of the character”.

### JA009-C04 — PASS

Current Agency for Cultural Affairs explanatory material states that the Jōyō table is a general-use guide and, with specified prefectural-name exceptions in the 2010 version, does not generally target proper names.

The entry correctly refuses to infer that an unlisted personal/place-name reading is impossible Japanese.

---

# Cross-entry review

## PASS — reading vs. pronunciation

The architecture:

**written word → reading in kana → phonological representation when needed → phonetic IPA when needed**

is editorially coherent.

The middle “reading in kana” layer identifies lexical reading; it does **not** encode:
- narrow allophony;
- pitch accent;
- every prosodic property;
- source-language phonetics of loanwords.

## PASS — orthography ≠ IPA

The entries preserve the global MLS-SND transcription rule: IPA is the shared phonetic layer; Japanese writing systems retain their own functions.

## PASS — no false universality

Neither entry claims:
- every Japanese word is covered by Jōyō;
- every kanji reading is listed;
- every foreign sound has a unique katakana equivalent;
- spelling determines one narrow pronunciation.

---

# Gate result

| Entry | Result |
|---|---|
| JA-008 | PASS |
| JA-009 | PASS |

## Integration dependency

The review is linguistically complete, but the matrix version must use the clean canonical source path in #7367:

- SND-SRC-0057;
- SND-SRC-0058;
- SND-SRC-0059;
- SND-SRC-0060.

After #7367 integrates, JA-008/009 are eligible to carry **LINGUISTIC_REVIEW** state on the integrated version, provided no substantive text changes occur.
