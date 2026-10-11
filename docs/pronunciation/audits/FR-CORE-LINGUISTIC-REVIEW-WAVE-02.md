# MLS-SND — French core linguistic review wave 02

**Target:** PR #7324  
**Scope:** FR-003…FR-008  
**Date:** 2026-10-11  
**Existing complementary review:** PR #7348 covers FR-001/002/009.

## Executive verdict

**LINGUISTIC_REVIEW PASS for FR-003…FR-008 within the narrow source scope declared by the entries.**

No branch-local source IDs need canonicalization in this wave.

The main condition of this PASS is that the entries remain what they currently are: **small source-bounded nuclei**, not exhaustive modern rules for French.

---

# Entry review

## FR-003 — Vocales nasales

**Verdict: PASS_WITH_SCOPE_WARNING.**

The entry correctly separates:

- the traditional four-way nasal-vowel inventory summarized by Fougeron & Smith;
- the actual contrast pattern of the young Parisian speaker used in the Illustration;
- the broader fact that speakers may not maintain every traditional contrast.

This is linguistically preferable to teaching a frozen four-vowel table as universal modern French.

The warning that nasal vowels should not be explained as simply “the corresponding oral vowel + nasalization” is also well motivated by the source discussion and by later articulatory work.

### Safeguard

Do not promote the speaker-specific merger/loss pattern to all metropolitan, northern or francophone varieties without separate evidence.

---

## FR-004 — Schwa

**Verdict: PASS_SCOPE / INTENTIONALLY_MINIMAL.**

The entry validates only a narrow nucleus:

- schwa is represented in the vowel system of the speaker;
- the source describes it as central with some rounding.

The refusal to formulate deletion/elision rules from this source is correct.

### Required preservation

Do not let later editorial shortening turn this into:
> “French schwa is pronounced [ə] when written e.”

The current text correctly keeps orthography, phonological category and surface realization separate.

### Next research layer

Deletion/retention, speech style, regional variation and phonotactic effects require dedicated contemporary evidence.

---

## FR-005 — Consonantes finales

**Verdict: PASS_WITH_TERMINOLOGY_GUARD.**

The entry successfully dismantles the pedagogical absolute “final consonants are not pronounced.”

It distinguishes:
- stable/realized final consonants;
- contextually appearing latent final consonants;
- segment-specific variation such as the source speaker's rhotic behavior.

The source supports the basic link to enchaînement and liaison.

### Terminology guard

“Final consonant” must continue to mean a phonological/phonetic object in a lexical form, not “any final letter in French spelling.”

The current text already avoids this confusion.

---

## FR-006 — Liaison

**Verdict: PASS_SCOPE.**

The initial definition is appropriate for this stage:
- a final underlying consonant absent before a consonant may surface before a vowel within the relevant rhythmic/prosodic domain.

The entry correctly distinguishes liaison from enchaînement.

### Critical limit

The current PASS does **not** validate:
- obligatory/facultative/forbidden liaison classes;
- stylistic frequencies;
- modern regional distributions;
- a complete syntactic theory of liaison.

Those remain explicitly outside the entry.

### Editorial warning

Do not rewrite this later as a simple spelling rule:
> “pronounce the final consonant when the next word begins with a vowel.”

That formulation would erase lexical, grammatical, prosodic and sociolinguistic conditioning.

---

## FR-007 — Enchaînement

**Verdict: PASS_WITH_PHONETIC_GUARD.**

The Fougeron & Smith definition is accurately represented:
- a final consonant already present in the pronounced form is associated with/resyllabified toward the following vowel-initial word.

The distinction from liaison is clear and useful.

### Phonetic guard

Later research shows that word-final consonants in traditional enchaînement contexts need not become acoustically identical to lexical word-initial consonants.

Therefore MLS-SND should retain wording such as:
- “se resilabifica”;
- “funciona como ataque en el análisis”;

and avoid stronger claims such as:
- “se convierte fonéticamente en una consonante inicial idéntica.”

The current entry does not make that stronger claim and therefore passes.

---

## FR-008 — Acento, prominencia y grupo prosódico

**Verdict: PASS_SCOPE.**

The entry correctly uses the 1993 source to reject an overly word-centered account of French prominence in connected speech.

The important distinction is:
- a familiar pedagogical description may mention word-final stress;
- in connected speech, prominence is organized at a larger prosodic grouping such as the sense/accentual group described by the source.

### Safeguards

Do not translate this into:
- English-style lexical stress;
- a universal complete model of French prosodic hierarchy;
- a full inventory of boundary tones/intonational contours.

Those require newer dedicated sources.

---

# Cross-entry review

## PASS — the entries know what they do not know

The strongest feature of FR-003…008 is restraint.

Each entry explicitly separates:
- a verified core claim;
- later questions requiring PFC or specialized literature.

This is preferable to expanding the chapter with unsourced textbook generalizations.

## PASS — liaison vs. enchaînement

The distinction is consistently preserved across FR-005/006/007.

This cross-entry consistency should become a terminology invariant for MLS-SND.

## PASS — orthography is not pronunciation

None of these entries derives final-consonant behavior, schwa or connected-speech processes directly from spelling.

## PASS — source age/speaker scope

The 1993 Illustration is not silently upgraded to a contemporary pan-francophone standard.

## Future evidence priorities

1. contemporary schwa deletion/retention;
2. liaison distribution by syntax/register/variety;
3. modern acoustic work on enchaînement/liaison boundaries;
4. contemporary nasal-vowel contrasts by reference variety;
5. modern prosodic hierarchy/intonation for the profile's chosen reference.

These are **expansion tasks**, not blockers for the narrow entries reviewed here.

---

# Gate result

| Entry | Review result |
|---|---|
| FR-003 | PASS_WITH_SCOPE_WARNING |
| FR-004 | PASS_SCOPE / INTENTIONALLY_MINIMAL |
| FR-005 | PASS_WITH_TERMINOLOGY_GUARD |
| FR-006 | PASS_SCOPE |
| FR-007 | PASS_WITH_PHONETIC_GUARD |
| FR-008 | PASS_SCOPE |

## Profile implication

Together with PR #7348:

- FR-001 — reviewed
- FR-002 — reviewed
- FR-003…008 — PASS in this review
- FR-009 — reviewed

The French profile now has an independent linguistic-review path for all current IDs, while still retaining research gaps for later expansion.

**Recommended next gate after integration: EDITORIAL_REVIEW, not additional unsourced expansion.**
