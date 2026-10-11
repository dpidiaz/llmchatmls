# MLS-SND — Status reconciliation audit v2

**Date:** 2026-10-11  
**Branch:** `snd/status-reconciliation-wave-02`  
**Basis:** SOURCE-ID-INTEGRITY-02 (#7374)

## Canonical snapshot reconciled

- physical entries: **79**;
- canonical sources: **56**;
- `LINGUISTIC_REVIEW`: **42**;
- `EVIDENCE_CHECKED`: **30**;
- `SOURCE_MAPPED`: **2**;
- `DRAFTED`: **2**;
- `RESEARCHED`: **1**;
- `RESEARCHED_PARTIAL`: **1**;
- `IN_PROGRESS`: **1**;
- `EDITORIAL_REVIEW`: **0**;
- `READY_FOR_COMPOSITION`: **0**.

## Integrity gate

`SOURCE-ID-INTEGRITY-02`: **PASS 79/79**.

- broken canonical source refs: 0;
- local source IDs in canonical entries: 0;
- promoted entries without canonical source refs: 0.

## ID-level drift corrected

| ID | stale state | physical verified state |
|---|---|---|
| FND-010 | EVIDENCE_CHECKED | LINGUISTIC_REVIEW |
| FND-017 | EVIDENCE_CHECKED | LINGUISTIC_REVIEW |
| REP-003 | SOURCE_MAPPED / previously listed missing | EVIDENCE_CHECKED |
| REP-004 | SOURCE_MAPPED / previously listed missing | EVIDENCE_CHECKED |
| ESGT-003 | INVENTORY / STATUS DRAFTED | EVIDENCE_CHECKED |
| ESGT-004 | INVENTORY | DRAFTED |
| ESGT-009 | INVENTORY / STATUS RESEARCHED | EVIDENCE_CHECKED |
| ESGT-010 | INVENTORY / STATUS RESEARCHED | EVIDENCE_CHECKED |
| PTBR-001 | DRAFTED | EVIDENCE_CHECKED |

## Validation

Post-write checks confirm STATUS and Master Inventory now agree on all nine corrected IDs and on REP-003/004 presence.

## Non-claim

This reconciliation does not create new gate passes; it records states already present in canonical entry files.