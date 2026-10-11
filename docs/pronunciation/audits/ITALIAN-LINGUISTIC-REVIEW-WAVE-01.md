# MLS-SND — Italian linguistic review wave 01

**Matrix:** `feat/mls-snd-foundation`  
**Core wave:** PR #7317  
**Stress wave:** PR #7306 (reviewed for direction only; remains outside PASS)  
**Date:** 2026-10-11

## Executive verdict

**LINGUISTIC_REVIEW PASS for IT-001/002/003/004/006/007/008.**

**IT-005 and IT-009 remain below the gate because their key sources are still branch-local.**

The Italian profile should remain **REFERENCE_PROVISIONAL**. The reviewed material supports a documented reference system, but not a fiction of one homogeneous pronunciation across Italy.

---

# Entry review

## IT-001 — Italiano de referencia, variedades regionales y “mainstream Italian”

**Verdict: PASS_WITH_SCOPE_WARNING.**

Rogers & d’Arcangeli explicitly distinguish:
- three broad regional varieties of spoken standard Italian;
- a developing “mainstream Italian” that does not match the traditional standard in all respects.

The Illustration speaker is a Rome-raised educated speaker aiming at a cultivated, low-regional-marking pronunciation.

The entry correctly treats this as a documented reference, not as evidence for one neutral national pronunciation.

Keep `REFERENCE_PROVISIONAL`.

---

## IT-002 — Vocales

**Verdict: PASS_SCOPE.**

The entry accurately separates:
- the seven-vowel system of the Illustration;
- phonetic duration from phonological vowel-length contrast;
- stressed /e~ɛ/ and /o~ɔ/ oppositions in the source analysis;
- variable realization of vowel sequences.

### Safeguard

Do not generalize the Illustration's seven-vowel system or lexical distributions to every regional variety.

The wording “no phonemic vowel-length contrast in this analysis” is preferable to an absolute statement about every Italian variety.

---

## IT-003 — Consonantes

**Verdict: PASS_WITH_ANALYSIS_WARNING.**

The entry properly marks several points as analysis-dependent:
- /j, w/ phoneme vs. vocalic-allophone analyses;
- geminates as contrastive units vs. alternative representational treatments;
- /s~z/ and /ts~dz/ restrictions;
- contextual nasal place;
- raddoppiamento fonosintattico.

### Critical safeguard

The claim that raddoppiamento fonosintattico is absent in the north must remain tied to the source's scope; it should not be rewritten as a timeless categorical claim for every northern speaker/register.

---

## IT-004 — Geminación y duración consonántica

**Verdict: PASS_SCOPE.**

SND-SRC-0028 supports:
- controlled singleton vs. geminate materials;
- acoustic duration measurements;
- six adult Standard-Italian speakers raised/resident in Rome;
- lexical gemination as a contrastive phenomenon in the dataset's design.

The entry correctly refuses to reduce gemination to double spelling.

### Hold that remains editorial, not evidential

The profile still needs a final policy for phonological representation (/Cː/ vs. alternative analyses). The database does not force one representation.

---

## IT-005 — Acento léxico

**Verdict: CONTENT_DIRECTION_PASS / HOLD_DRAFTED.**

The current branch design is linguistically sensible:
- “free position” is not treated as randomness;
- penultimate stress is a tendency, not a categorical rule;
- lexical stress is kept distinct from vowel duration;
- orthographic accent is not treated as a complete phonological transcription.

However, the entry must remain `DRAFTED` until:
- `IT-W02-S01` (Treccani, Gili Fivela 2010) is canonicalized;
- `IT-W02-S02` (D’Imperio & Rosenthall 1999) is canonicalized;
- the R33 gate is rerun against canonical IDs.

No promotion in this review.

---

## IT-006 — E y O: pronunciación y ortoepía

**Verdict: PASS_SCOPE.**

The entry correctly combines:
- source-based phonological contrast /e~ɛ/ and /o~ɔ/ in stressed syllables;
- DOP as an orthoepic/lexicographic resource;
- explicit warning against automatic letter-to-sound rules.

A particularly good decision is **not** to invent a complete DOP rule set for O before that specific section is audited.

### Safeguard

DOP norms and a descriptive regional inventory are separate layers. Preserve that distinction in composition.

---

## IT-007 — S y Z: pronunciación y ortoepía

**Verdict: PASS_SCOPE.**

The entry correctly avoids a rigid “S = sound X / Z = sound Y” table.

Rogers & d’Arcangeli supports contextual restrictions in /s~z/ and /ts~dz/ for the described system.

DOP is used only as a lookup/orthoepic resource.

The uncanonicalized Bertinetto & Loporcaro source is explicitly **not** used to promote extra claims here. That is correct source discipline.

---

## IT-008 — Grafía y pronunciación

**Verdict: PASS.**

The entry establishes only the necessary editorial claim:
Italian orthography is the primary writing layer but is not a complete phonetic transcription.

The DOP evidence for tonic <e> mapping to open/closed qualities is a valid concrete example.

The entry does not incorrectly claim that Italian orthography is generally opaque.

---

## IT-009 — Variación regional

**Verdict: CONTENT_DIRECTION_PASS / HOLD_RESEARCHED.**

The source direction is strong.

Bertinetto & Loporcaro (2005) explicitly compares:
- Standard Italian;
- Florence Italian;
- Milan Italian;
- Rome Italian;

and explicitly distinguishes historical Florentine basis from present-day local varieties.

This is an appropriate source for the architectural claim that standard, supralocal/mainstream and regional varieties must not be collapsed.

### Blocker

`IT-PROP-CORE-001` is still local.

Canonicalize it, rewrite IT009-C03/C04, then rerun claim-level R33 before promotion.

### Scope safeguard

FI/MI/RI are **documented comparators**, not an exhaustive typology of Italian regional speech.

---

# Cross-profile findings

## PASS — orthography, orthoepy and phonetics remain distinct

DOP is never treated as a substitute for phonetic research.

## PASS — duration is not used as a synonym for phonological quantity

IT-002 and IT-004 keep vowel duration, vowel quantity and consonant gemination analytically separate.

## PASS — regionality is not hidden

The profile consistently identifies when a source describes:
- a particular speaker;
- mainstream/supralocal Italian;
- Standard Italian;
- FI/MI/RI;
- a Rome-based experimental sample.

## PASS — analytical alternatives stay visible

The entries avoid presenting one phonological representation as inevitable when the literature allows alternatives.

---

# Source integration actions

## Already canonical

- SND-SRC-0008 — DOP.
- SND-SRC-0017 — Rogers & d’Arcangeli (2004).
- SND-SRC-0028 — GEMMA lexical gemination.

## Candidates requiring canonicalization

### IT-PROP-CORE-001
Bertinetto, P. M., & Loporcaro, M. (2005). *The sound pattern of Standard Italian, as compared with the varieties spoken in Florence, Milan and Rome*. JIPA, 35(2), 131–151. DOI 10.1017/S0025100305002148.

Use: IT-009.

### IT-W02-S01
Gili Fivela, B. (2010). “Accento”. *Enciclopedia dell’Italiano*. Treccani.

Use: IT-005.

### IT-W02-S02
D’Imperio, M., & Rosenthall, S. (1999). Phonetics and phonology of main stress in Italian. *Phonology, 16*(1), 1–28. DOI 10.1017/S0952675799003681.

Use: IT-005.

Canonicalization must be followed by claim-level R33 rerun.

---

# Gate result

| Entry | Review result |
|---|---|
| IT-001 | PASS_WITH_SCOPE_WARNING |
| IT-002 | PASS_SCOPE |
| IT-003 | PASS_WITH_ANALYSIS_WARNING |
| IT-004 | PASS_SCOPE |
| IT-005 | CONTENT_DIRECTION_PASS / HOLD_DRAFTED |
| IT-006 | PASS_SCOPE |
| IT-007 | PASS_SCOPE |
| IT-008 | PASS |
| IT-009 | CONTENT_DIRECTION_PASS / HOLD_RESEARCHED |

## Profile-level verdict

**LINGUISTIC_REVIEW PASS for IT-001/002/003/004/006/007/008.**

IT-005 and IT-009 remain intentionally outside the gate pending source canonicalization.

The correct next step is source integration and targeted re-audit—not filling the remaining gaps from memory or textbook stereotypes.
