# MLS R4.1 BCR handoff — reservation #1881

**State:** valid pre-block (0/25), Dispatcher-assigned reservation RESERVED.
**Origin:** issue #1881 | scheduler run #36622115680 | snapshot main 89e8e13b6a69fc2d7c8af9a42261079f5aac69ae
**AllocationHash:** 200ab57fa7673a15c6504f389a840115b146c993969ee002b9e12ba8363b6a8b
**BCR recipeHash:** 5f5fdf4fa20dd560546b40321e53a6d857e170603f3f0c519937dff74c748aba
**Context stateHash:** bf2ae3565c0ae709a3069d0d73378c5bdaa31a1cb07c01cb1123009b790b4e8b
**Source Index hash:** f113d23cad6a0d6e758107461df96a2ca22773661e2374533532eca0ff728525 (0 used sources; add per independently reviewed claim).
**Delta 00:** bcr/deltas/block-00.json | hash 54b0b4e4a09fcf9fbdcdd28b70aaca7f0b5b7875f4113996a318ff023faee97c
**Previous confirmed parent:** 89e8e13b6a69fc2d7c8af9a42261079f5aac69ae
**Current buffer HEAD:** use the GitHub SHA returned after the single grouped bootstrap commit; no circular self-SHA in files.
**Progress:** 0/25; block 01/05 is ready but Evidence/checkpoints have NOT been generated.
**Block 01 allocated:** MLS-V10-0416, MLS-V10-0417, MLS-V10-0420, MLS-V10-0421, MLS-V10-0422.
Topic: Tiempo y aspecto verbal (present deictic/generalizing, retrospective/prospective present, perfect recent events, aspectual restrictions, canté/he cantado). Article titles must be reread from the pinned allocation snapshot, not inferred from this handoff.
**Canonical next step:** recover manifest/progress/recipe/Context Pack/Source Index/Delta 00 and these five allocated articles; verify reservation Issue and branch HEAD, then construct a valid chunk-01-of-05 and use BCR.advance (initial pack has lastPersistedBlock:0, nextBlock:1). One grouped five-entry/checkpoint commit only after verifying each claim with sources. Never call the legacy BCR.bootstrap operation here; that adapter is for migrating a *completed* block 01.
**Do not:** create new reservation; take another worker's code; reuse VERIFIED by bibliography; manufacture human REVIEWED; seal/SYNC or Cloudflare; pay for API/Work.
**Failure rule:** any 403/429, stale recipe/source, duplicate, registry conflict or branch move → stop and preserve all existing checkpoints.
