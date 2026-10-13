# MLS-SND — German linguistic review wave 01

**Review branch:** `snd/german-linguistic-review-wave-01`  
**Matrix:** `feat/mls-snd-foundation`  
**Target wave:** PR #7309 / `snd/german-core-wave-02`  
**Date:** 2026-10-11

## Executive verdict

**LINGUISTIC_REVIEW PASS for DE-001/002/003/004/006/007 within their declared scope.**

**HOLD / current state preserved for DE-005 and DE-008.**

This is a **MULTI_REFERENCE** profile. No reviewed entry authorizes collapsing German, Austrian and Swiss Standard German into one invariant pronunciation.

A source-metadata defect was discovered during review:
- canonical `SND-SRC-0031` has an incorrect DOI in the matrix Source Registry;
- correct DOI: `10.1017/S0025100320000377`;
- fix prepared separately in PR #7351.

The DOI correction changes metadata only, not the linguistic claims.

---

# Review principles

## 1. Kohler 1990 is a bounded Illustration

SND-SRC-0019 is useful for:
- a coherent IPA Illustration;
- source-specific vowel/consonant analyses;
- contextual realizations;
- a reference point for the variety described.

It is **not** sufficient evidence for:
- all contemporary speakers in Germany;
- Austrian Standard German;
- Swiss Standard German;
- all regional/social styles;
- timeless acoustic values.

Every PASS below preserves this limit.

## 2. National standards are independent evidence domains

SND-SRC-0030 addresses one phonetic variable (-ig) in Austrian standard usage with 52 speakers from two generations and all Austrian dialect regions.

SND-SRC-0031 addresses long-vowel quality in four Alemannic regions and their corresponding Swiss Standard German varieties.

Neither source is a complete national phonetic grammar. Their value lies precisely in showing that national-standard pronunciation is internally variable.

## 3. Lexicography is not population phonetics

Duden is admitted as a lexicographic pronunciation source and current documentation explicitly:
- uses IPA for pronunciation information;
- publishes its symbol table;
- uses graphical marks for short/long stressed vowels;
- documents stress and other transcription conventions.

Duden is therefore useful for dictionary-level pronunciation and notation, not as evidence that DE/AT/CH speech is phonetically uniform.

---

# Entry review

## DE-001 — Alemán estándar y estándares nacionales

**Verdict: PASS_WITH_METADATA_FIX.**

The architectural decision `MULTI_REFERENCE` is justified.

### Austria

Lanwermeyer et al. (2019) directly studies phonetic variation of unstressed <-ig> within Austrian standard-language register:
- 52 speakers;
- two generations;
- all Austrian dialect regions;
- several elicitation settings.

The study explicitly reports influence from phonetic context, part of speech, setting, gender and regional background, and frames Austrian speakers as navigating competing transnational and intranational norms.

DE001-C02 is appropriately scoped.

### Switzerland

Zihlmann's study directly investigates long-vowel quality in four Alemannic dialects and the corresponding Swiss Standard German varieties and finds dialect-related effects that differ by region.

DE001-C03 is appropriately scoped to the phonetic domain studied.

### Required remediation

Merge source metadata fix #7351 before treating SND-SRC-0031 bibliography as clean.

The entry itself does not need linguistic rewriting.

---

## DE-002 — Vocales

**Verdict: PASS_SCOPE.**

The entry correctly presents Kohler's vowel table as **the system used by the Illustration**, not a universal inventory for the whole German-speaking area.

Good safeguards:
- monophthongs and diphthongs are distinguished;
- post-vocalic /r/ vocalization is treated as a contextual realization;
- Austrian and Swiss profiles do not inherit this inventory automatically.

No promotion beyond the described reference variety should occur without additional national-standard evidence.

---

## DE-003 — Longitud y calidad vocálica

**Verdict: PASS_SCOPE.**

The entry avoids the common oversimplification “German has long vs. short vowels” as if duration alone defined the contrast.

Within Kohler's analysis, quality/openness and duration interact under comparable stress/environment conditions.

The current text correctly:
- ties the generalization to the source;
- includes unstressed shortening;
- preserves the stated functional-word limitation;
- avoids projecting the pattern automatically onto Austria or Switzerland.

### Terminology safeguard

Do not convert Kohler's close/open wording into a universal `tense/lax = long/short` equation in later editorial polishing.

---

## DE-004 — Consonantes

**Verdict: PASS_WITH_ANALYSIS_LABEL.**

The entry is strongest where it explicitly labels analysis as **Kohler's analysis**.

### [ç] / [x]

The text correctly separates:
- surface phonetic distinction;
- source-specific phonological analysis using /x/ with contextual/morphological information.

It also correctly explains why phonetic transcription may still distinguish [ç] and [x] even when a phonological analysis relates them.

### [ʔ]

The glottal-stop discussion is appropriately treated as conditioned by morphological information and transcription needs.

### /r/

Contextual realizations remain source- and variety-scoped.

### Required editorial safeguard

Keep phrases such as “Kohler analiza…” / “en el análisis de la fuente…”. Do not later rewrite this as “German has only phoneme /x/” without preserving analytical provenance.

---

## DE-005 — Acento léxico

**Verdict: HOLD_RESEARCHED / CONTENT_DIRECTION_PASS.**

The decision not to force EVIDENCE_CHECKED yet is correct.

Independent inspection of IDS Grammis supports the mapped claims:
- word stress is lexically specified;
- German does not place stress invariably on the same syllable position;
- only relatively few cases are meaning-distinguishing;
- limited variation/context effects exist;
- a word form normally has one main lexical stress, with secondary stresses possible in longer words/compounds.

### Blocker

`DE-PROP-CORE-001` is still a branch-local proposed source.

Submit it to source canonicalization, then rewrite DE005-C02/C03 to the canonical `SND-SRC` ID and rerun R33.

### Scope decision

After canonicalization, the **current limited entry** could become EVIDENCE_CHECKED without first solving every rule of German stress assignment, provided the text continues to say that a comprehensive account of complex-word stress remains outside this version.

---

## DE-006 — Procesos contextuales

**Verdict: PASS_SCOPE.**

The four clusters are appropriate as source-scoped contextual patterns:

1. aspiration of /p t k/;
2. contextual /r/ realizations;
3. glottal onset before relevant vowel-initial word/root contexts;
4. [ç]/[x] distribution.

The entry correctly warns that these are patterns from the Illustration rather than universal rules for every style and national standard.

### Safeguard

Later composition should avoid pedagogical absolutes such as:
- “German /p t k/ are always aspirated”;
- “every vowel-initial German word has [ʔ]”;
- “German r is pronounced as X”.

The current source-scoped wording already avoids those errors.

---

## DE-007 — Duden e IPA

**Verdict: PASS.**

Current Duden documentation independently confirms the three claims:

- pronunciation information is shown using the IPA system for words/parts where pronunciation may be difficult;
- Duden provides the symbol/sign-combination table it uses;
- graphical under-dot/under-line conventions indicate stressed short/long vowels in entries without their own IPA transcription, while the page also explains length and stress symbols.

The entry correctly limits Duden to **lexicographic reference**.

No linguistic correction required.

---

## DE-008 — Mapa DE/AT/CH

**Verdict: PASS_STATE / HOLD_RESEARCHED.**

The design is sound and should remain RESEARCHED.

### What is already supported

- Austria: SND-SRC-0030 provides a concrete example of conditioned variation within standard usage.
- Switzerland: SND-SRC-0031 provides regionally differentiated vowel evidence and dialect-to-standard influence.

### What remains missing

- contemporary broad evidence for the Germany standard reference;
- wider Austrian phenomena beyond <-ig>;
- wider Swiss phenomena beyond the studied vowel domain;
- full metadata/canonicalization of DE-PROP-003 if it is retained.

### Rule

Do not create a symmetric DE/AT/CH table merely because the book layout has three columns.

A blank/OPEN cell is preferable to a fabricated national generalization.

---

# Cross-profile review

## PASS — national-standard architecture

`MULTI_REFERENCE` is the right architecture for this stage.

The evidence directly undermines a single-source/single-country model:
- Austrian standard usage shows conditioned variation and competing norms;
- Swiss Standard German shows regionally differentiated phonetic interaction with Alemannic dialects.

## PASS — analysis vs. realization

DE-004 and DE-006 correctly separate:
- phonological analysis;
- phonetic transcription;
- contextual realization.

This distinction must survive editorial simplification.

## PASS — temporal/source caution

Kohler 1990 remains valuable but is dated and narrowly scoped.

The profile should use newer sources to **extend** it, not silently relabel the 1990 Illustration as present-day pan-German pronunciation.

## HOLD — stress source integration

DE-005 has enough content direction for a limited entry but cannot pass R33 while the IDS source remains local.

## HOLD — DE/AT/CH completeness

DE-008 is a map, not a finished comparison chapter.

---

# Source actions

## Canonical metadata correction

- SND-SRC-0031 DOI fix → PR #7351.

## Source candidate for #7320

- `DE-PROP-CORE-001` — Leibniz-Institut für Deutsche Sprache / Grammis, “Wortakzent”, https://grammis.ids-mannheim.de/kontrastive-grammatik/4859
- Suggested tier: institutional linguistic reference.
- Uses: DE-005 lexical stress only.
- Limit: not a complete phonetic/prosodic grammar.

## Existing sources retained

- SND-SRC-0010 — Duden.
- SND-SRC-0019 — Kohler 1990.
- SND-SRC-0030 — Austrian <-ig>.
- SND-SRC-0031 — Swiss Standard German vowels, subject to DOI metadata fix.

---

# Gate result

| Entry | Review result |
|---|---|
| DE-001 | PASS_WITH_METADATA_FIX |
| DE-002 | PASS_SCOPE |
| DE-003 | PASS_SCOPE |
| DE-004 | PASS_WITH_ANALYSIS_LABEL |
| DE-005 | HOLD_RESEARCHED |
| DE-006 | PASS_SCOPE |
| DE-007 | PASS |
| DE-008 | PASS_STATE / HOLD_RESEARCHED |

## Profile-level verdict

**LINGUISTIC_REVIEW PASS for DE-001/002/003/004/006/007.**

**DE-005 and DE-008 remain intentionally below the gate.**

This review does not authorize calling the German profile complete. It validates the current source-bounded material and the MULTI_REFERENCE architecture.
