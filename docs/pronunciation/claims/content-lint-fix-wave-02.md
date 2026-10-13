# MLS-SND work claim — Content lint fix wave 02

**Branch:** `snd/content-lint-fix-wave-02`  
**Base:** `feat/mls-snd-foundation`  
**Type:** QA / structural integrity fix

## Scope

- exclude canonical `SND-SRC-xxxx` identifiers from entry-ID detection;
- require exact three-digit entry suffixes so longer source numbers cannot be truncated into entry IDs;
- detect branch-local source IDs;
- fail on local source IDs cited by entries but absent from a `SOURCE-MAP` / `SOURCES-PROPOSED` file in the validated checkout;
- preserve the existing distinction between structural lint and semantic R33 review.

## Out of scope

- no content rewriting;
- no source canonicalization;
- no state promotion;
- no automatic replacement of local IDs with global IDs.

## Coordination

This wave supersedes the known bug documented on PR #7343. The full source-ID integrity scan in #7374 should use this fixed linter or equivalent logic before declaring a new global PASS.