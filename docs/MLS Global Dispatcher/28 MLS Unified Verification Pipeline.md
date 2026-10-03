# MLS Unified Verification Pipeline

Status: **IMPLEMENTATION IN PROGRESS / NOT DEPLOYED**

## Purpose

`MLS Unified siguiente` is the explicit, non-ambiguous command for the end-to-end MLS verification pipeline.

It does not rename or silently reinterpret any historical command during certification.

The target is:

```text
R44 audit/correction
        ↓
durable R44 checkpoint
        ↓
R44 ticket COMPLETE
        ↓
grouped R44→R33 handoff
        ↓
R33 evidence/provenance certification
        ↓
serialized grouped integration
        ↓
canonical Evidence + content + indexes
        ↓
VERIFIED
```

R44 and R33 remain separate validation stages internally. Unified orchestrates them toward one terminal goal.

## Command compatibility

During Unified certification:

- `MLS Unified siguiente` — new end-to-end pipeline command.
- `MLS R44 Fast Lane siguiente` — remains R44-only Fast Lane.
- `MLS R44 siguiente` — remains the one-ticket R44 compatibility command.
- `MLS R33 siguiente` — retains its existing R4.3/Gate semantics.
- `MLS siguiente` — retains the historical Global Dispatcher meaning.

No old command becomes an alias of Unified until a separate, explicit migration is certified.

## User experience

The user opens many disposable chats and pastes exactly:

`MLS Unified siguiente`

The chat must not ask the user for:

- ticket IDs;
- worker IDs;
- pool IDs;
- assignment IDs;
- branches;
- R33 gate IDs;
- leases;
- handoff IDs;
- integration waves.

The system chooses the highest-value eligible stage automatically.

## Scheduling priority

Every new Unified execution follows this order.

### Priority 1 — publish already-certified Unified work

Attempt a Global Dispatcher claim scoped to:

- provider: `r33-index-integration`
- work prefix: `r33-unified-integration:`

If a serialized integration assignment is available, process it first.

This is the step that can move already-certified R33 units into canonical `verified.json`.

If no integration work is eligible or the global integration lock is busy, continue to Priority 2 rather than blocking all workers.

### Priority 2 — certify R44-complete work in R33

Attempt a Global Dispatcher claim scoped to:

- provider: `r33-farm`
- work prefix: `r33-unified:`

Only entries with a durable R44→R33 handoff are eligible.

The R33 worker must validate the exact final article that will be published.

If the R44 handoff says `CORRECTED`, reconcile the handoff's `correctedContent` with the canonical article and write the final corrected article in the assigned `contentPath` on the R33 branch before generating Evidence.

If the handoff says `PASS_NO_CHANGE`, do not change content unless R33 itself finds a real issue.

Evidence, claims, links, Source Registry references, provenance and article hash must correspond to the final article in the same worker commit.

### Priority 3 — produce more R44-complete work

If neither Unified integration nor Unified R33 work is immediately eligible, execute the deployed:

`MLS R44 Fast Lane siguiente`

Use its existing bounded policy:

- up to 10 tickets in the healthy chat;
- no prefetch;
- one live R44 lease at a time;
- per-entry durable checkpoints;
- recovery before new work;
- D1 remains authoritative.

R44 completion does not itself mean VERIFIED.

## R44→R33 durable handoff

Disposable R44 workers continue to perform zero GitHub writes.

A single grouped GitHub Actions synchronizer reads R44 COMPLETE exports from Cloudflare/D1 and commits handoff snapshots to:

`MLS R32 EDITORIAL/r44/r33-handoff/`

Structure:

```text
r33-handoff/
├── index.json
└── tickets/
    ├── R44-....json
    └── ...
```

Schema:

`MLS-R44-R33-HANDOFF-1`

The index records per code:

- R44 ticket;
- ordinal;
- outcome;
- frozen source path/hash;
- R44 result hash;
- handoff artifact path;
- R44 completion time.

Ticket artifacts retain the R44 payload, including correction/evidence notes supplied by R44.

The synchronizer is grouped and runs at most once per five-minute scheduled cycle, plus explicit manual dispatch when needed. It is not invoked per worker checkpoint.

## R44 export pagination

The R44 export endpoint supports:

`/api/r44/export?limit=200&afterOrdinal=<n>`

This allows the grouped synchronizer to traverse the complete audited/COMPLETE backlog rather than repeatedly seeing only the first 200 tickets.

This runtime change requires the normal R44 Cloudflare cutover before Unified can be declared deployed.

## Full-corpus R33 Unified pool

Unified does not wait for the historical Gate 1000 to encompass a code.

The provider builds a synthetic dynamic pool:

`MLS-R33-R44-UNIFIED-CONTINUATION`

Eligibility is the intersection of:

1. code exists in the canonical 10,133-entry corpus;
2. a durable R44 handoff exists;
3. code is not already present in canonical R33 `verified.json`;
4. code is not protected by an active/recovery/reservation ownership.

The historical R33 pool and commands remain intact.

If an explicit R43→R33 handoff wave is active, its isolation rules remain higher priority and Unified does not bypass that historical gate ownership.

## No duplicate R33 ownership

Unified candidates are materialized before general R33 candidates.

Within one scheduler materialization, selected Unified codes are projected as protected batches before general R33 candidates are generated.

Global Dispatcher entry locks remain authoritative across active assignments.

Therefore a code selected as:

`r33-unified:...`

must not simultaneously be selected as:

`r33-farm:...`

## R33 worker contract

Unified R33 work still uses provider `r33-farm` internally so existing:

- lease/recovery;
- checkpoint;
- worker-event;
- provenance;
- validation;
- terminal ledger;
- source revision;
- integration machinery

remain reusable.

The work ID prefix is what isolates the lane:

`r33-unified:`

Worker branch prefix:

`worker/r33-unified`

Each Evidence unit remains checkpointed individually.

Before each Evidence checkpoint:

`node scripts/R4-evidence-preflight.cjs <evidence-artifact-path>`

must pass.

## Same-chat R33 auto-pull

After a Unified R33 FINISH, the worker event auto-pull must generate another claim scoped to:

- provider `r33-farm`;
- work prefix `r33-unified:`.

It must never silently escape into general `r33-farm:` backlog.

The loop remains in-chat and ends naturally on preemption, no work, capacity limits, error, or insufficient safe execution capacity.

## Unified final integration

R33 worker completion is not yet canonical VERIFIED.

When the earliest eligible Unified integration wave is fully certified, the provider materializes:

`r33-unified-integration:...`

Provider:

`r33-index-integration`

This work owns the serialized main-integration lock.

For each source ref, the integration may include:

- Evidence artifact;
- certified `contentPath` when the Unified worker changed or certified content there;
- revision assets;
- R33 indexes.

The integration must copy each content file from the same pinned worker commit that produced the Evidence for that code.

Then it regenerates:

- `by-code.json`
- `by-language.json`
- `by-source.json`
- `verified.json`

and passes the R33 GitHub-native test suite.

Only after successful canonical merge and regenerated index is the code truly VERIFIED.

## Correction consistency rule

A corrected R44 article and its R33 Evidence must never come from different revisions.

Unified enforces:

```text
R44 handoff
   ↓
R33 worker branch
   ├── final contentPath
   └── Evidence for that exact content
             ↓
       one worker commit
             ↓
       grouped integration
```

Integration must not copy Evidence from one SHA and article content from another SHA.

## Recovery

### R44 failure

Existing D1 per-entry receipts survive.

Lease expiry permits another R44 worker to recover only unfinished entries.

### Handoff sync failure

R44 durable state remains authoritative.

No R44 result is lost.

The next grouped sync re-reads completed results using ordinal pagination.

Git publication uses bounded pull/rebase/push retries.

### R33 worker failure

Global Dispatcher recovery preserves checkpointed worker commits and completed units.

A later filtered `r33-unified:` claim can recover the same work item.

### Integration failure

The global main-integration lock and existing R33 integration recovery rules apply.

No code becomes VERIFIED merely because a worker branch exists.

## FREE ONLY / CHAT ONLY

Unified production workers are CHAT ONLY.

No ChatGPT Work handoff is required for the command.

Do not introduce:

- paid OpenAI API;
- paid browser automation fallback;
- paid AI provider;
- per-worker GitHub publication from R44.

R33 remains GitHub-native; R44 remains Cloudflare/D1 hot-path native.

## Observability

Unified should be able to distinguish at least:

- R44 CLAIMABLE;
- R44 PARTIAL_DURABLE;
- R44 COMPLETE;
- handoff synchronized;
- R33 Unified leased;
- R33 Unified checkpointed/done;
- Unified integration ready;
- Unified integration active;
- canonical VERIFIED.

The primary project progress number remains canonical `verified.json`, not R44 COMPLETE or R33 worker DONE.

## Certification gates

Before declaring Unified production-certified, run:

1. single-code corrected R44→R33→VERIFIED fixture;
2. PASS_NO_CHANGE fixture;
3. crash after R44 checkpoint;
4. handoff resync idempotency;
5. crash during R33 microclaim and recovery;
6. simultaneous Unified/general R33 allocator test proving no overlap;
7. final integration with content + Evidence from the same SHA;
8. 5 concurrent Unified chats;
9. 15 concurrent Unified chats;
10. 30 concurrent Unified chats;
11. 60 concurrent Unified chats;
12. 100 concurrent Unified chats.

No gate may advance with known durable work loss or duplicate active ownership.

## Deployment sequence

1. Merge code/documentation after CI.
2. Deploy the R44 paged-export runtime through the existing R44 cutover workflow.
3. Verify production R44 status/MCP/bridge.
4. Run the grouped handoff workflow.
5. Confirm a GitHub handoff snapshot is generated.
6. Verify the Global Dispatcher materializes `r33-unified:` work.
7. Verify `r33-unified-integration:` can publish a fixture into VERIFIED.
8. Only then mark `MLS Unified siguiente` ACTIVE.
9. Keep `MLS siguiente` unchanged until a separate alias migration is authorized.

## Definition of DONE

Unified is DONE when the same visible command can be pasted into many disposable chats and the system automatically spends available capacity on the nearest safe step toward canonical VERIFIED, while:

- R44 and R33 standards remain distinct;
- no code is certified before R33;
- R44 corrections survive into the R33-certified canonical article;
- no active duplicate ownership exists;
- every durable checkpoint survives chat death;
- final publication remains serialized/grouped;
- `verified.json` is the terminal authority;
- historical commands remain compatible.
