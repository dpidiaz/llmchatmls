# 🇰🇷 Korean pilot — Wave 01 complementary report

**Branch:** `snd/korean-pilot-wave-01`  
**PR:** #7288  
**Coordination:** PR #7287 is primary for KO-001/002/003. This PR supplies the complementary half of the profile.

## IDs worked here

| ID | Estado | Resultado |
|---|---|---|
| SND-KO-004 | EVIDENCE_CHECKED | Seoul vowel change mapped with sample/date limits |
| SND-KO-005 | RESEARCHED_PARTIAL | syllable framework mapped; theoretical representation left open |
| SND-KO-006 | EVIDENCE_CHECKED (NORMATIVE) | coda neutralization, nasalization, tensification |
| SND-KO-007 | EVIDENCE_CHECKED (model) | Accentual Phrase reference model |
| SND-KO-008 | EVIDENCE_CHECKED (NORMATIVE) | Hangul spelling and surface pronunciation separated |
| SND-KO-010 | EVIDENCE_CHECKED | Romanization Revised and IPA separated |

KO-009 was already EVIDENCE_CHECKED in the matrix branch and was not duplicated.

## Cross-branch resolution

A concurrent PR (#7287) produced stronger overlapping drafts for KO-001/002/003. This branch deleted its copies of those files instead of competing for the same paths.

## Sources

New branch-local sources live in `SOURCE-MAP-WAVE-01-COMPLEMENT.md`. They must be deduplicated against #7287 before promotion to the global Source Registry.

## Findings

- Contemporary Seoul vowel studies show age/gender-linked change; historical vowel charts must not be treated as timeless.
- Standard Pronunciation Rules are useful for normative process descriptions but do not by themselves establish spontaneous frequency.
- Seoul prosody requires an explicit model; Accentual Phrase is used as a reference model, not translated as lexical stress.
- Hangul, Romanization Revised and IPA are distinct representation layers.

## Next gate

Ready for independent LINGUISTIC_REVIEW:
- KO-004
- KO-006
- KO-007
- KO-008
- KO-010

Remain open:
- KO-005 requires stronger full-text theoretical localizers before full EVIDENCE_CHECKED.
