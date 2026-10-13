# ZHTW-003 composition readiness — 2026-10-13

## Scope
Evaluate SND-ZHTW-003 only as the currently approved Taiwan Mandarin segmental **evidence map**.

- Base matrix: `7c367d711bc51d84227379ced8e41a997739cc15`
- Editorial candidate blob: `a83a70fa8bba4dc747ca7b437cb537ce778a7e31`

## Precondition check
- EVIDENCE_CHECKED: PASS as map.
- LINGUISTIC_REVIEW: PASS_WITH_SCOPE_WARNING.
- EDITORIAL_REVIEW: PASS_WITH_SCOPE_WARNING.
- No material linguistic rewrite occurred after those gates.

## Blocking analysis
The following remain open but do **not** block composition of the map:
1. definitive phoneme inventory;
2. final analytical choice for the vowel system;
3. quantitative reuse of SND-SRC-0044 without a finer internal locator.

They would block any attempt to publish this same version as a definitive inventory. They do not invalidate the map's documented scope.

## Reader-facing projection
Included:
- scope header;
- §§1–5;
- §9 as source basis.

Excluded:
- §6 operational note on phone tables;
- §7 future-table planning;
- §8 R33 claim table;
- §§10–12 internal gate/review metadata.

This prevents COMPOSITION from exposing planning language or treating internal R33 infrastructure as reader copy.

## Written-only controls
- WRT-01 audio independence: PASS.
- WRT-02 variety/scope: PASS_WITH_SCOPE_WARNING.
- WRT-03 representation layers separated: PASS.
- WRT-04 notation support: PASS with navigation to SND-REP-002/003/007/008.
- WRT-05 no learner tasks/equivalences invented: PASS.
- WRT-06 empirical data vs analytical choice: PASS.
- WRT-07 variation/limits visible: PASS.
- WRT-08 autonomous consultation: PASS.
- WRT-09 no color dependency: PASS.
- WRT-10 R33 traceability: PASS.
- WRT-11 no exercises/evaluation: PASS.
- WRT-12 Unicode/IPA preservation: PASS.
- WRT-13/14 Quick Layer: NOT_APPLICABLE.

## Pronunciation Quick Layer
**NOT_APPLICABLE.** This is a map of segmental categories, realizations and evidence, not a lexical form requiring localized respelling. No easy-pronunciation form is invented.

## Representation/typography
Preserve all approved IPA and especially the distinction between /phonological/ and [phonetic] notation. Zhuyin, Hanyu Pinyin and IPA must remain separate functional layers.

## Result
**PASS → READY_FOR_COMPOSITION as an evidence map.**

Handoff: `composition/handoffs/SND-ZHTW-003.md`.

The gate does not certify a definitive Taiwan Mandarin phoneme inventory.
