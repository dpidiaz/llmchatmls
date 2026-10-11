# MLS-SND — pt-BR/rio linguistic review wave 01

**Review branch:** `snd/pt-br-linguistic-review-wave-01`  
**Target:** PR #7277 / `snd/pt-br-rio-pilot-wave-01`  
**Date:** 2026-10-11  
**Mode:** independent linguistic/evidential review

## Executive verdict

**LINGUISTIC_REVIEW PASS for the current scoped claims, with preserved holds.**

This verdict does **not** mean that the carioca profile is complete. It means that the claims currently marked EVIDENCE_CHECKED are generally aligned with their stated source scope, and the pilot correctly refuses to over-generalize where evidence is historical, regional, experimental or incomplete.

The main editorial strength of this wave is its explicit separation of:

- `PB_BROAD`;
- `RIO_CARIOCA`;
- `RIO_SUBSCOPE`;
- `FLUMINENSE`.

That separation should survive integration.

## Blocking integration requirement

Most sources in PR #7277 remain branch-local (`PTBR-W01-SRC-xx`). Before matrix integration, every source used by an integrated claim must be deduplicated/promoted through the canonical Source Registry, following PR #7320.

`PTBR-W01-SRC-01` already corresponds to canonical `SND-SRC-0007`.

---

# Entry-by-entry review

## PTBR-001 — PB amplo vs. fala carioca

**Verdict: PASS_WITH_PROVENANCE_REMEDIATION.**

The scope architecture is linguistically sound.

Independent checks confirm that the pilot correctly distinguishes:
- classic NURC material;
- a narrowly delimited Copacabana >56 sample;
- FavRio/peripheral speakers;
- fluminense data outside the capital.

The entry does not collapse these into a single “Rio” population.

### Required remediation

Canonicalize local source IDs before integration. Preserve the explicit subpopulation labels.

---

## PTBR-002 — Inventario vocálico: mapa de evidencia

**Verdict: PASS_STATE / HOLD_PARTIAL.**

The current state is appropriate **as an evidence map**.

The entry correctly refuses to freeze a canonical carioca vowel inventory from:
- an institutional record of Orsini (1995);
- a multi-city PB source;
- one later experimental pretonic-vowel study.

### Hold

Do not promote this entry to a final inventory or full LINGUISTIC_REVIEW closure until:
1. Orsini's full thesis is audited;
2. Callou, Moraes & Leite (1996) is checked directly;
3. tonic/pretonic/posttonic categories are reconciled with contemporary evidence.

No downgrade is needed: the current warning is doing useful work.

---

## PTBR-003 — Nasalidade

**Verdict: PASS_STATE / HOLD_PARTIAL.**

The narrow Shosted (2006) claims are supportable:
- carioca scope;
- three speakers;
- five phonemically nasal vowels in the analysis;
- study of nasal-coda emergence;
- usually velar excrescent nasal in the phenomenon described.

The entry correctly avoids converting Moraes & Wetzels (1992) into a complete carioca phonological rule before full audit.

### Hold

Keep the final phonological analysis OPEN_QUESTION. Do not reduce orthographic <m>/<n> to a phonetic rule.

---

## PTBR-004 — Vogais pretônicas

**Verdict: PASS_WITH_CONFLICT_PRESERVED.**

Independent inspection confirms the source itself contains the numerical discrepancy already recorded by the branch:

- abstract: **1344 tokens**;
- methodology: **1152 occurrences analyzed**.

The branch handles this correctly: neither total is used as a quantitative claim, while source design, speaker scope and research objective remain usable.

### Required rule

The 1344 ↔ 1152 discrepancy must remain **OPEN_QUESTION** until the authors' counting distinction can be established from the article itself. Do not resolve it by choosing one number.

---

## PTBR-005 — Consoantes: mapa de evidencia

**Verdict: PASS_STATE.**

The entry is honest about being a partial map.

The strong carioca evidence currently concerns clusters such as coda /S/, rhotics and coda /l/. The branch correctly refuses to turn those clusters plus a São Paulo/Valinhos IPA Illustration into a total carioca consonant inventory.

No promotion to a complete consonant table is warranted yet.

---

## PTBR-006 — /S/ em coda

**Verdict: PASS.**

Independent checking supports the historical NURC figures recorded by the branch:

- 1970s palatal realization: 85% internal / 72% final;
- 1990s: 91% internal / 76% final.

The source also reports social/geographical conditioning.

The more recent Nanini study is appropriately limited to six Copacabana residents older than 56 and 1,033 post-vocalic /S/ observations.

### Critical safeguard

These values remain **historical/sample-specific**. They are not estimates for all Rio speakers in 2026.

---

## PTBR-007 — Róticas

**Verdict: PASS.**

Callou, Moraes & Leite (1998) supports:
- final /R/ deletion as a variable phenomenon in carioca NURC speech;
- strong relevance of word-final position;
- morphology/verb status as an important conditioning factor;
- an age-grading/stable-variation interpretation rather than a simple claim of inevitable total loss.

The Silva (2026) source is used only to define a newer peripheral/FavRio research scope, not to invent results from an abstract. That restraint is correct.

---

## PTBR-008 — /l/ em coda

**Verdict: PASS_WITH_DATE_SCOPE.**

The historical Callou evidence supports the branch's claim that vocalization in the NURC Rio samples remained practically stable between the 1970s and 1990s and was interpreted as already implemented in the sampled community.

The entry correctly does **not** convert this into a 2026 city-wide rate.

Keep `DATE_SCOPE_WARNING`.

---

## PTBR-009 — Acento e ritmo

**Verdict: PASS_WITH_VARIETY_SCOPE_WARNING.**

Independent inspection of Moraes (2003) confirms:
- four speakers in production;
- ten listeners in the perceptual test;
- F0, duration and amplitude measurements;
- two major secondary-prominence strategies;
- no single invariant acoustic correlate in the reported experiment.

Crucially, the methods section inspected does **not** identify the dialectal origin of the four speakers.

Therefore the branch is correct to label this evidence `PB_BROAD/EXPERIMENTAL` rather than `RIO_CARIOCA`.

Institutional affiliation of the researcher is not evidence of speaker provenance.

### Hold

A carioca-specific accent/rhythm description still needs an explicitly delimited Rio sample.

---

## PTBR-010 — Entonación carioca

**Verdict: PASS_SCOPE_ONLY.**

Frota & Moraes (2016) explicitly use Rio de Janeiro as the Brazilian Portuguese variety in their comparison and cover:
- demarcation;
- highlighting/prominence;
- utterance-type distinctions;
- intonational grouping;
- tonal events/boundaries;
- question types.

This is enough to validate the current **scope and functional framework**.

It is **not** enough, from the material audited in this wave, to publish exact declarative/interrogative contour formulas as carioca rules.

Moraes & Rilliard (2018) remains a methodological PB source, not automatic Rio evidence.

### Hold

Keep concrete contour claims OPEN_QUESTION until the full chapter and relevant data are audited.

---

# Cross-profile findings

## PASS — scope discipline

The pilot consistently avoids four common errors:

1. treating PB_BROAD as automatically carioca;
2. treating fluminense as synonymous with the city of Rio;
3. treating NURC 1970s/1990s percentages as current city-wide frequency;
4. treating a university/researcher location as proof of speaker dialect.

## PASS — historical data handling

Historical NURC evidence is useful and correctly dated.

The volume may use it to explain documented patterns and change, but not as a silent estimate of present-day Rio.

## PASS — open questions remain open

The following should **not** be “fixed” merely to make the profile appear complete:

- 1344 vs. 1152 in Machado et al. (2010);
- final carioca vowel inventory;
- full nasal phonological analysis;
- full consonant inventory;
- contemporary city-wide coda /l/ rates;
- carioca-specific accent/rhythm generalization;
- exact intonation contours.

## PASS — analytical notation caution

The pilot's /S/, /R/ and /L/ labels function as source-/analysis-level abstractions in places. They should not be presented to readers as if each slash label had one invariant phonetic realization.

The final composition should make this explicit wherever these labels appear outside specialist discussion.

---

# Source canonicalization requirements

## Already canonical

- PTBR-W01-SRC-01 → `SND-SRC-0007` (Callou 2009).

## Candidates requiring deduplication/canonical IDs

- PTBR-W01-SRC-02 — Nanini (2022).
- PTBR-W01-SRC-03 — Callou, Moraes & Leite (1998).
- PTBR-W01-SRC-04 — Silva (2026).
- PTBR-W01-SRC-05 — Brandão (2008).
- PTBR-W01-SRC-06 — Machado et al. (2010).
- PTBR-W01-SRC-07 — Frota & Moraes (2016).
- PTBR-W01-SRC-08 — Moraes & Rilliard (2018).
- PTBR-W01-SRC-09 — Orsini (1995).
- PTBR-W01-SRC-10 — Moraes & Wetzels (1992).
- PTBR-W01-SRC-11 — Shosted (2006).
- PTBR-W01-SRC-12 — Moraes (2003).
- PTBR-W01-SRC-13 — NURC-RJ bibliography page: retain only as discovery/catalogue aid, not a substitute for primary evidence.

Canonicalization itself must not promote any OPEN_QUESTION.

---

# Gate result

| Entry | Review result |
|---|---|
| PTBR-001 | PASS_WITH_PROVENANCE_REMEDIATION |
| PTBR-002 | PASS_STATE / HOLD_PARTIAL |
| PTBR-003 | PASS_STATE / HOLD_PARTIAL |
| PTBR-004 | PASS_WITH_CONFLICT_PRESERVED |
| PTBR-005 | PASS_STATE |
| PTBR-006 | PASS |
| PTBR-007 | PASS |
| PTBR-008 | PASS_WITH_DATE_SCOPE |
| PTBR-009 | PASS_WITH_VARIETY_SCOPE_WARNING |
| PTBR-010 | PASS_SCOPE_ONLY |

## Profile-level verdict

**LINGUISTIC_REVIEW PASS for the current limited claims.**

This pass validates the scope discipline and the claims presently made. It does **not** authorize:
- calling the profile complete;
- removing warnings;
- filling the open inventories by analogy;
- turning historical NURC rates into current Rio frequencies;
- publishing exact intonation contours not yet audited.

Before matrix integration:
1. canonicalize/deduplicate source IDs through #7320;
2. rewrite local IDs to canonical `SND-SRC`;
3. preserve all explicit holds and OPEN_QUESTION states;
4. run source-ID integrity on the integrated version.
