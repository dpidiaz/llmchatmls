# MLS-SND — QA report: content lint fix wave 02

**Date:** 2026-10-11
**Branch:** `snd/content-lint-fix-wave-02`

## Bugs addressed

### 1. Source IDs misread as entry IDs

Old entry regex could match `SND-SRC-002` inside the valid source ID `SND-SRC-0023`, producing bogus `UNDECLARED_INTERNAL_ID` warnings.

Fix:

`SND-(?!SRC-)[A-Z0-9]+-\d{3}(?!\d)`

This explicitly excludes the `SRC` namespace and prevents a three-digit entry ID from consuming the prefix of a longer numeric identifier.

### 2. Dangling branch-local source IDs

Wave-local IDs are allowed during research but must exist in a source map and must not survive canonical integration unresolved.

The linter now recognizes:

- recommended wave IDs such as `JA-W04-S01` and `KO-W1-C04`;
- legacy local candidates such as `FND005-CAND-001` and `REP-PROP-002`.

If an entry cites one of these IDs and the checkout contains no declaration in a `SOURCE-MAP` or `SOURCES-PROPOSED` file, lint emits:

`DANGLING_LOCAL_SOURCE_ID` (ERROR).

## Synthetic regex tests

All cases passed:

| value | entry ID | canonical source | local source |
|---|---:|---:|---:|
| `SND-SRC-0023` | no | yes | no |
| `SND-SRC-00234` | no | no | no |
| `SND-RU-008` | yes | no | no |
| `SND-ZHTW-010` | yes | no | no |
| `JA-W04-S01` | no | no | yes |
| `KO-W1-C04` | no | no | yes |
| `FND005-CAND-001` | no | no | yes |
| `REP-PROP-002` | no | no | yes |
| `ENUS005-C03` | no | no | no |

## Dangling-source synthetic test

Declared local IDs: `JA-W04-S01`, `KO-W1-C04`.

Entry references: `JA-W04-S01`, `KO-W1-C05`, `FND005-CAND-001`.

Correctly detected as dangling:

- `KO-W1-C05`;
- `FND005-CAND-001`.

## Gate

**PATCH_READY.**

A full checkout run remains required before a new global source-ID integrity PASS. That full scan belongs to #7374 / the integration QA lane.