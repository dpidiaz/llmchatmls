# MLS-SND — R33 independent audit: pilot wave 01

**Branch:** `snd/r33-audit-pilots-wave-01`  
**Date:** 2026-10-11  
**Scope:** independent second-pass check of five pilot entries already marked `EVIDENCE_CHECKED`.

## Method

For each entry:

1. read the current claim table;
2. open the cited institutional/academic source;
3. verify that the claim is actually supported by the cited section or page;
4. check that scope/variety limitations are not silently widened;
5. distinguish source-backed statements from MLS-SND editorial decisions;
6. record any metadata or locator defect before accepting the audit.

This audit does **not** equal `LINGUISTIC_REVIEW` or `EDITORIAL_REVIEW`.

## Results

| ID | Result | Notes |
|---|---|---|
| SND-REP-002 | PASS | Official IPA page confirms maintenance of the official alphabet/chart, Council approval for official changes, and the listed subcharts; Handbook page confirms analytical chapters and language Illustrations. |
| SND-ENUS-001 | PASS WITH CORRECTION | Hillenbrand 2003 directly supports North American phonetic diversity and the inadequacy of treating “General American English” as a single meaningful pronunciation label. Source metadata for Ladefoged was corrected from an unreliable 1989 secondary record to the stable 1999 Handbook chapter, pp. 41–44. |
| SND-ZHTW-007 | PASS | Taiwan MOE manual directly lists onset symbols, rhyme symbols, tonal marks, and a reference table of Mandarin syllables with Bopomofo. The statement Zhuyin ≠ IPA remains correctly labeled as MLS-SND methodology. |
| SND-KO-009 | PASS | NIKL explicitly states that Revised Romanization is based on standard Korean pronunciation, uses Roman letters without extra symbols as far as possible, and does not reflect vowel length. The layered display policy remains editorial. |
| SND-JA-001 | PASS | NINJAL Tokyo Accent resource directly documents 12,803 words, 19 speakers, variation, and 1982–1984 data collection; the NINJAL/OJAD project explicitly uses common language/Tokyo-dialect accent information while recognizing variation. |

## Detailed audit

### SND-REP-002 — Qué es el AFI/IPA

**Sources checked**

- International Phonetic Association, “The IPA Chart”:  
  https://www.internationalphoneticassociation.org/node/1061
- International Phonetic Association, “Handbook of the IPA”:  
  https://www.internationalphoneticassociation.org/content/handbook-ipa

**Verdict**

All four evidence-table claims are supportable at the cited scope.

**Boundary confirmed**

Statements about IPA not replacing orthographies, Zhuyin, hangul, kana, kanji or Cyrillic are MLS-SND editorial policy. They are not attributed to the IPA.

### SND-ENUS-001 — Por qué MLS-SND no usa “General American” como una sola voz

**Sources checked**

- Hillenbrand, J. M. (2003), Cambridge extract:  
  https://www.cambridge.org/core/journals/journal-of-the-international-phonetic-association/article/american-english-southern-michigan/5A8CECE6958DD48F85113A210E6554F4
- Ladefoged, P. (1999), “American English”, *Handbook of the International Phonetic Association*, pp. 41–44:  
  https://www.cambridge.org/core/books/handbook-of-the-international-phonetic-association/illustrations-of-the-ipa/324F06806CCBF10275E6E52989B02404

**Finding**

The prior Source Registry record identified a 1989 JIPA item as “American English” with metadata copied from a secondary index. Independent verification found that Hillenbrand’s bibliography cites the 1999 Handbook chapter, and the Cambridge Handbook page provides a stable, directly inspectable description.

The registry was corrected to use the 1999 Handbook chapter for `SND-SRC-0004`.

**Verdict**

The two claims in SND-ENUS-001 remain verified through Hillenbrand. The bibliographic correction removes an unnecessary provenance ambiguity.

### SND-ZHTW-007 — Zhuyin/Bopomofo

**Source checked**

- Ministry of Education, Taiwan, *The Manual of the Phonetic Symbols of Mandarin Chinese*:  
  https://language.moe.gov.tw/001/Upload/files/site_content/M0001/juyin/html_en/index.html

**Verified locators**

- Reader’s Guide;
- “1. List of Phonetic Symbols”;
- onset/rhyme/tonal-mark subsections;
- “6. Reference Table of Mandarin Chinese Syllables with Bopomofo”.

**Verdict**

PASS. No change required.

### SND-KO-009 — Romanización Revisada del coreano

**Source checked**

- National Institute of Korean Language, “Romanization of Korean”:  
  https://www.korean.go.kr/front_eng/roman/roman_01.do

**Verified locators**

- “1. Basic Principles for Transcription”, items (1) and (2);
- “2. Summary of the Transcription System”, vowel Note 2.

**Verdict**

PASS. The source itself demonstrates that romanization does not encode every phonetic detail because vowel length is not reflected.

### SND-JA-001 — Tokio como ancla de referencia y sus límites

**Sources checked**

- NINJAL, *東京語アクセント資料*:  
  https://mmsrv.ninjal.ac.jp/tokyo_accent/
- NINJAL, OJAD project overview/details:  
  https://www.ninjal.ac.jp/research/cr-project/project/pubpro/accentdictionary/  
  https://www.ninjal.ac.jp/research/cr-project/project/pubpro/accentdictionary/accentdictionary-detail/

**Verified facts**

- 12,803 target words;
- 19 speakers;
- explicit focus on diversity/variation in contemporary Tokyo accent;
- data collection from 1982 through 1984;
- OJAD/common-language accent explicitly grounded in Tokyo-dialect speakers;
- OJAD project explicitly recognizes accent variation.

**Verdict**

PASS. The entry correctly limits `REFERENCE_FIXED` to the role of a prosodic anchor rather than treating Tokyo as all of Japanese.

## Changes made by this audit

1. Corrected `SND-SRC-0004` from an unreliable 1989 secondary bibliographic record to the directly verifiable Ladefoged 1999 Handbook chapter.
2. Updated the SND-ENUS-001 bibliography/audit note to match the corrected source.
3. No substantive claim changes were required in SND-REP-002, SND-ZHTW-007, SND-KO-009 or SND-JA-001.

## Handoff

After merge, the five entries can remain `EVIDENCE_CHECKED`. They are now eligible for the next independent gates:

- `LINGUISTIC_REVIEW`;
- then `EDITORIAL_REVIEW`.

This audit does not promote those states automatically.
