# MLS-SND integration claim — Editorial foundations clean reapply 01b

**Branch:** `snd/integrate-editorial-foundations-wave-01b`  
**Base:** latest `feat/mls-snd-foundation` at branch creation  
**Type:** clean reapply / gate integration

## Inputs

- #7326 — editorial review foundations wave 01, 6/6 PASS.
- #7329 — editorial review foundations wave 02, 4/4 PASS.
- #7385 — earlier integration attempt now superseded by this clean reapply.

## Exact-version control

Before reapply, all 10 current canonical input blobs still matched the exact versions reviewed in #7326/#7329.

After reapply, all 10 output blobs match the reviewed output blobs exactly.

## IDs

`FND-002/003/004/006/007/008/009/011/013/015` → `EDITORIAL_REVIEW` on this branch.

## Exclusions

- no READY_FOR_COMPOSITION promotion;
- no STATUS / Master Inventory edit;
- no linguistic/evidence/source/IPA changes.

Global state files should be recalculated once after integration rather than edited here.