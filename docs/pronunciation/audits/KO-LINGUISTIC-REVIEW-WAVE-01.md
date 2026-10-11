# MLS-SND — Korean linguistic review wave 01

**Review branch:** `snd/korean-linguistic-review-wave-01`  
**Date:** 2026-10-11  
**Scope:** current KO integration path: KO-001 on `feat/mls-snd-foundation`; KO-004/005/006/007/008/010 in PR #7288; KO-009 existing baseline.  
**Not reviewed as current content:** KO-002/003, because the files are not present on the matrix branch and PR #7287 is closed/unmerged.

## Executive verdict

**Overall: PASS_WITH_REMEDIATION / integration HOLD until provenance IDs and notation are repaired.**

The underlying linguistic direction is strong: the profile correctly separates institutional norm, empirical Seoul Korean, prosodic analysis, Hangul, Romanization Revised and IPA. The main blockers are **traceability and notation**, not a need to rewrite the entire profile.

### Blocking remediations before merge of #7288

1. Reconcile all branch-local source IDs used by entries with the source map and then mint/deduplicate canonical `SND-SRC` IDs during integration.
2. Do not use bare square-bracketed Hangul forms such as `[ㄱ, ㄷ, ㅂ]` as if they were MLS phonetic transcription; the MLS-SND transcription guide reserves `[…]` for phonetic representation. Either label these explicitly as **NIKL Hangul pronunciation notation** or provide verified IPA separately.
3. Repair KO-007 source links: it cites `KO-W1-S08/S09/S01`, while the surviving complementary map defines `KO-W1-C08/C09` and contains no `S01`.
4. Split mixed source/editorial claims such as KO010-C03 into an externally sourced fact plus an `ANALYTICAL_CHOICE`/editorial statement.
5. Do not promote KO-005 beyond `RESEARCHED_PARTIAL` until its theoretical claim has a directly checkable full-text locator.

## Provenance audit

The global Source Registry on the matrix branch contains canonical Korean sources:
- SND-SRC-0012 — NIKL Revised Romanization;
- SND-SRC-0020 — Lee (1993), Korean, JIPA;
- SND-SRC-0021 — Schweizer, Ahn & Kwon (2026), Seoul Korean stops.

It **does not contain**:
- KO-SRC-P01;
- KO-SRC-P02;
- KO-W1-C04..C09;
- the older KO-W1-Sxx IDs referenced inside #7288 entries.

Therefore an entry can be linguistically well supported while still failing full R33 provenance closure.

---

# Entry review

## KO-001 — Estándar y habla de Seúl

**Verdict: PASS_WITH_REMEDIATION.**

### Linguistic review

The separation of:
1. institutional standard,
2. contemporary Seoul speech,
3. romanization,

is methodologically sound and should be retained.

NIKL material supports the principle that Standard Pronunciation follows actual standard-language pronunciation while considering tradition/rationality, and current institutional explanation explicitly connects the practical basis of standard pronunciation with modern Seoul speech. This supports using Seoul as an important reference **without equating every contemporary Seoul realization with the norm**.

Schweizer, Ahn & Kwon (2026) independently supports the claim that current Seoul Korean stops show a tonogenesis-like change and strong prosodic-position dependence.

### Remediation

- **BLOCKER:** KO001-C01/C02 cite `KO-SRC-P01`, and C03 also cites `KO-SRC-P02`; those IDs are absent from the current global Source Registry.
- Canonicalize the NIKL Standard Pronunciation Rules and, if still needed, Bang et al. (2018), or rewrite C03 to rely on the already canonical SND-SRC-0021 where sufficient.
- Keep `REFERENCE_PROVISIONAL`; current evidence does not justify collapsing “standard Korean” into all contemporary Seoul speech.

---

## KO-002 — Sistema consonántico

**Verdict: NOT_REVIEWABLE_CURRENTLY / COVERAGE_GAP.**

The matrix branch currently has no KO-002 file. The superseded PR #7287 contained a cautious source-map version, but that PR is closed/unmerged.

### Recommendation

Recover KO-002 through a clean integration path or a new wave. Preserve the cautious design: do **not** freeze a contemporary national consonant table from Lee (1993) alone.

---

## KO-003 — Oclusivas contemporáneas

**Verdict: NOT_REVIEWABLE_CURRENTLY / HIGH-VALUE_RECOVERY_CANDIDATE.**

The matrix branch currently has no KO-003 file. The closed #7287 version was substantively strong and used SND-SRC-0021.

### Independent source check

Schweizer, Ahn & Kwon (2026) directly supports:
- aspirated/lax/tense three-way stop categories in Seoul Korean;
- phrase-initial vs. word-medial differences;
- burst duration and f0 as major phrase-initial cues;
- closure duration, closure voicing and burst duration as important word-medial cues;
- strong dependence of phonetic implementation on prosodic position;
- the contemporary shift in the lax–aspirated contrast toward post-stop f0.

### Recommendation

Recover a clean KO-003 based primarily on canonical SND-SRC-0021; use Bang et al. (2018) only after canonical source registration.

---

## KO-004 — Vocales de Seoul Korean

**Verdict: PASS_WITH_REMEDIATION.**

### Claim audit

**KO004-C01 — PASS.**  
Kang & Kong (2016) explicitly analyzes seven monophthongs `/e a ʌ o u ɨ i/` from spontaneous speech in the Seoul Corpus, with 30 speakers divided among teens, 20s and 40s.

**KO004-C02 — PASS.**  
The abstract directly reports raised /o/, greater F2 for /u, ɨ/, and stronger tendencies among younger and female speakers.

**KO004-C03 — PASS.**  
The authors explicitly state that their acoustic evidence supports a chain-like vowel shift rather than an /o/–/u/ merger.

**KO004-C04 — PASS.**  
Igeta, Sonu & Arai (2014) reports close/partly overlapping /o/–/u/ distributions in production and perceptual confusion effects in young adult Seoul Korean.

### Remediation

- **BLOCKER:** entry uses `KO-W1-S04/S05`; surviving source map defines `KO-W1-C04/C05`.
- Preserve the explicit statement that the vowel symbols shown are **the study's analysis**, not a frozen MLS contemporary inventory.
- After source-ID repair, this entry is ready for `LINGUISTIC_REVIEW` acceptance.

---

## KO-005 — Estructura silábica

**Verdict: PASS_STATE / HOLD at RESEARCHED_PARTIAL.**

The current restraint is correct.

Cho (2015) is a plausible source for syllable-position-sensitive processes, but the entry itself acknowledges that the theoretical claim about internal sub-syllabic representation still lacks a final locator.

### Remediation

- Source ID `KO-W1-S06` no longer matches the complementary source map (`KO-W1-C06`).
- Do not mark KO005-C02 VERIFIED until a directly accessible theoretical source and locator are attached.
- Do not create a canonical MLS syllable tree merely for visual uniformity.

No promotion recommended.

---

## KO-006 — Procesos contextuales

**Verdict: PASS_WITH_BLOCKING_NOTATION_REMEDIATION.**

### Claim audit

**KO006-C01 — PASS, NORMATIVE.**  
NIKL Standard Pronunciation Rule 9 supports coda neutralization toward the representative final values corresponding to ㄱ/ㄷ/ㅂ in the stated environments.

**KO006-C02 — PASS, NORMATIVE.**  
Rule 18 explicitly states the nasalization pattern before ㄴ/ㅁ and NIKL identifies it as 비음화.

**KO006-C03 — PASS, NORMATIVE.**  
Rule 23 explicitly prescribes tensification of following ㄱ/ㄷ/ㅂ/ㅅ/ㅈ after the stated obstruent-final classes.

### Blocking notation issue

The prose currently uses forms such as `[ㄱ, ㄷ, ㅂ]`. Under the MLS-SND transcription guide, square brackets mean **phonetic representation**, with IPA as the shared phonetic notation. NIKL's Hangul pronunciation notation is a distinct representation layer.

Fix one of two ways:

- preferred: “NIKL represents the resulting final categories with Hangul ㄱ, ㄷ, ㅂ” and keep them outside MLS phonetic brackets; or
- explicitly label a quotation as “NIKL notation: [ㄱ, ㄷ, ㅂ]”, then provide IPA separately only after a source-backed mapping is chosen.

### Other remediation

- `KO-W1-S07` must be reconciled to the surviving local/canonical source ID.
- Retain **NORMATIVE** scope. These rules do not by themselves prove spontaneous-speech frequencies.

---

## KO-007 — Prosodia de Seoul Korean

**Verdict: PASS_WITH_REMEDIATION.**

### Claim audit

**KO007-C01 — PASS.**  
Jun (1998) explicitly identifies the Accentual Phrase in standard (Seoul) Korean and places it immediately above the Word in the discussed intonational hierarchy.

**KO007-C02 — PASS with wording discipline.**  
Lee & Cho (2020) describes Seoul Korean focus through prosodic phrasing and contrasts its edge-prominence organization with English-style head prominence. This supports the warning not to translate *Accentual Phrase* as if it meant lexical stress.

**KO007-C03 — SUBSTANTIVELY SUPPORTABLE, SOURCE LINK BROKEN.**  
Contemporary Seoul stop research supports interactions between post-stop f0 and prosodic position, but the entry cites `KO-W1-S01`, absent from the surviving complementary source map. SND-SRC-0021 can support a narrower version of this claim directly.

### Remediation

- Repair `S08/S09/S01` IDs.
- Replace KO007-C03 with canonical SND-SRC-0021 unless the Choi et al. source is promoted canonically.
- Section 4's compound statement mentioning “foco, longitud y segmento inicial” needs claim-level sourcing; **“longitud” should be removed or sourced specifically**.
- Keep the entry framed as a **reference model**, not an assertion that every Korean variety shares the same prosodic organization.

---

## KO-008 — Hangul y pronunciación

**Verdict: PASS_WITH_REMEDIATION.**

The core distinction is valid: official pronunciation rules demonstrate that Hangul spelling and context-conditioned standard pronunciation are distinct representational levels.

### Claim audit

- KO008-C01 — PASS, NORMATIVE via Rule 9.
- KO008-C02 — PASS, NORMATIVE via Rule 18.
- KO008-C03 — PASS, NORMATIVE via Rule 23.

### Remediation

- Repair `KO-W1-S07` to the integrated source ID.
- Keep the examples clearly tagged as normative pronunciation rules.
- If square-bracketed Hangul examples are later added, apply the notation rule described under KO-006.

---

## KO-009 — Romanización Revisada

**Verdict: PASS.**

Existing matrix entry is appropriately scoped and already uses canonical SND-SRC-0012.

The NIKL directly supports:
- basis in standard pronunciation;
- use of Roman letters without added symbols as a design principle;
- non-representation of vowel length.

The sequence `hangul → Romanización Revisada → IPA` is correctly labeled as MLS editorial design rather than NIKL policy.

No blocking linguistic remediation found in this wave.

---

## KO-010 — Romanización Revisada vs. IPA

**Verdict: PASS_WITH_MINOR_REMEDIATION.**

KO010-C01 and C02 are directly supported by SND-SRC-0012.

KO010-C03 currently combines two different proposition types:

1. **external fact:** IPA is maintained as the international phonetic alphabet by the International Phonetic Association;
2. **editorial decision:** MLS-SND uses IPA as its common phonetic layer.

### Remediation

Split C03 into:
- a sourced factual claim linked to SND-SRC-0001;
- an `ANALYTICAL_CHOICE` or editorial note for MLS usage.

This keeps R33 from making the IPA source appear to endorse MLS's internal architecture.

---

# Cross-entry review

## What is working

1. **Norm vs. speech is separated.**
2. **Seoul is scoped rather than universalized.**
3. **Sound change is treated diachronically instead of freezing older descriptions.**
4. **Romanization is not treated as phonetic transcription.**
5. **KO-005 correctly refuses premature closure.**
6. **The profile is compatible with the project's “description before prescription” principle.**

## What must be fixed

### A. Broken branch-local source IDs — BLOCKING
#7288's entries still point to old `KO-W1-Sxx` identifiers after the complementary source map was renamed to `KO-W1-Cxx`.

### B. KO-001 provenance gap — BLOCKING
The matrix version uses `KO-SRC-P01/P02` that are absent from the global Source Registry.

### C. Square brackets + Hangul — BLOCKING FOR COMPOSITION
MLS square brackets are phonetic notation. NIKL Hangul pronunciation notation must be labeled as such or kept outside the MLS IPA bracket convention.

### D. KO-002/003 missing from current matrix path — COVERAGE GAP
Recover these deliberately rather than assuming closed #7287 has been integrated.

### E. Model vs. fact
Prosodic categories such as Accentual Phrase must retain their analytical-source provenance.

---

# Integration recommendation

1. **Do not merge #7288 yet.**
2. Repair all local source IDs in #7288.
3. Canonicalize/deduplicate the NIKL Standard Pronunciation Rules, Kang & Kong 2016, Igeta et al. 2014, Jun 1998, and Lee & Cho 2020 as needed.
4. Resolve KO-006's bracket notation.
5. Fix KO-007 C03 and the unsourced compound wording in §4.
6. Split KO-010 C03.
7. Recover KO-002/003 through a clean PR based on their strongest reviewed drafts.
8. Re-run a narrow R33 provenance check.
9. Then move KO-001/004/006/007/008/009/010 to **LINGUISTIC_REVIEW passed** if no new contradiction emerges.
10. Keep KO-005 partial until the theoretical source gate is met.

## Final status

| Entry | Review verdict |
|---|---|
| KO-001 | PASS_WITH_REMEDIATION |
| KO-002 | NOT_REVIEWABLE / COVERAGE_GAP |
| KO-003 | NOT_REVIEWABLE / RECOVERY_CANDIDATE |
| KO-004 | PASS_WITH_REMEDIATION |
| KO-005 | PASS_STATE / HOLD_PARTIAL |
| KO-006 | PASS_WITH_BLOCKING_NOTATION_REMEDIATION |
| KO-007 | PASS_WITH_REMEDIATION |
| KO-008 | PASS_WITH_REMEDIATION |
| KO-009 | PASS |
| KO-010 | PASS_WITH_MINOR_REMEDIATION |

**Profile-level verdict:** linguistically promising and internally well designed, but **not yet ready for integration as a closed Korean profile** until provenance IDs and representation notation are repaired.


# Post-review remediation status

After this review was issued, PR #7288 applied the non-global remediations identified here:

- KO-004 source refs: `KO-W1-S04/S05` → `KO-W1-C04/C05`;
- KO-005 source ref: `KO-W1-S06` → `KO-W1-C06`;
- KO-006 source ref repaired and bare Hangul pronunciation forms removed from MLS phonetic brackets;
- KO-007 source refs repaired; KO007-C03 narrowed and linked to canonical SND-SRC-0021; unsupported compound mention of “longitud” removed;
- KO-008 source ref repaired;
- KO-010 C03 split into an external IPA fact plus an MLS `ANALYTICAL_CHOICE`.

## Remaining blockers after remediation

1. Promote/deduplicate the branch-local `KO-W1-Cxx` sources into canonical global `SND-SRC` IDs during integration, then rewrite entry references accordingly.
2. Repair KO-001 provenance: `KO-SRC-P01/P02` are still not canonical in the matrix Source Registry.
3. Keep KO-005 `RESEARCHED_PARTIAL` until its theoretical/localizer gate is satisfied.
4. Recover KO-002/003 through a clean current integration path.

**Updated profile verdict:** content-level remediation substantially passed; **global provenance/integration HOLD remains**.


## Addendum — KO-005 gate closed

After the original review, an open-access *Phonology* article by Jongho Jun (2015, online 2016) supplied a directly checkable theoretical locator. In the analysis around (13b)–(16), the paper explicitly notes that both onset and nucleus syllabifications of /j/ have been proposed in Korean phonology. PR #7288 therefore narrowed KO005-C02 to that concrete issue, added local source `KO-W1-C10`, and promoted KO-005 to **EVIDENCE_CHECKED**.

Remaining caveat: `KO-W1-C10` still requires canonical global Source Registry integration before matrix merge.
