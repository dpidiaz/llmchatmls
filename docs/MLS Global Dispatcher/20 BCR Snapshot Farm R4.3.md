# MLS BCR R4.3 — Snapshot Farm

Status: **implementation branch / not active on main**

Branch: `feat/r43-snapshot-farm`

Goal: preserve the single user-facing command **`MLS BCR siguiente`** while
removing GitHub from the per-entry/per-block hot path. GitHub remains the canonical
repository, snapshot source and grouped synchronization destination. R33 academic
validation remains unchanged.

## Why R4.3

R4.2 correctly protects ownership with GitHub-backed REQUEST/LEASE/RENEW/COMPLETE
transactions, but high chat concurrency turns GitHub into a transactional database.
Secondary rate limiting can therefore dominate throughput even when ChatGPT still
has production capacity.

R4.3 changes the coordination unit:

```text
GitHub main
   |
   | one frozen read boundary
   v
immutable snapshot (base SHA + manifest SHA + pending units)
   |
   v
immutable wave manifest
   |
   +--> W0001 -> 5 entries -> delta
   +--> W0002 -> 5 entries -> delta
   +--> ...
   +--> W0100 -> 5 entries -> delta
   |
   v
reconciliation + R33 gates
   |
   v
grouped sync
   |
   v
GitHub
```

No worker needs REQUEST, LEASE, RENEW or COMPLETE transactions while producing a
preassigned shard. The wave itself proves that shards are disjoint.

## Non-negotiable invariants

- SOLO CHAT. Do not hand off to ChatGPT Work.
- FREE ONLY. No OpenAI API or other paid AI APIs.
- No Cloudflare/D1 editorial coordination.
- GitHub stays canonical, but is not the worker hot path.
- A snapshot is immutable and bound to an exact GitHub base commit and content
  manifest blob SHA.
- A wave is immutable and contains all shard assignments before workers start.
- A shard belongs to exactly one ordinal and contains no code present in another
  shard.
- Worker output is append-only as a delta bound to snapshotHash + waveHash +
  shardId.
- Produced is never equivalent to VERIFIED.
- R33 source-to-claim review and canonical validation remain mandatory before
  grouped synchronization/integration.
- Synchronization must compare the frozen base with current GitHub state and
  quarantine conflicts instead of overwriting them.
- No conversational memory is treated as a transactional lock or durable database.

## Single-command requirement

The target UX remains:

```text
MLS BCR siguiente
```

A technical limitation must remain explicit: independent ChatGPT conversations do
not expose a documented shared atomic counter. R4.3 therefore must not pretend that
100 simultaneous fresh chats can safely perform `nextShard++` from memory.

The safe design is to preassign all shards in the immutable wave before production.
The final activation layer must inject or recover a worker's shard identity without
requiring a GitHub claim transaction. Until that mechanism passes a concurrency
pilot, R4.2 remains the live fallback and R4.3 stays opt-in on its branch.

## Roadmap

### Phase 0 — Baseline and rollback boundary

- Freeze R4.2 behavior as the fallback.
- Record base SHA and existing canonical R33 rules.
- Do not alter certified corpus or live leases.

Exit gate: branch is isolated and existing command remains unchanged on main.

### Phase 1 — Snapshot / Wave / Shard contracts

Implement deterministic local contracts:

- `MLS-BCR-SNAPSHOT-1`
- `MLS-BCR-WAVE-1`
- `MLS-BCR-DELTA-1`

A wave can preassign 20, 50 or 100 workers with fixed shard sizes.

Exit gate:

- 100 workers x 5 entries produce 500 unique codes;
- zero overlaps;
- snapshot/wave mutation fails closed;
- no GitHub runtime allocator is required by these pure contracts.

### Phase 2 — Chat-local producer

Teach a worker that already has a shard context to:

1. read only its snapshot slice;
2. research and produce R33 evidence;
3. write entry/checkpoint/review into a delta;
4. checkpoint locally inside the current chat/file context;
5. never call GitHub for lease renewal or block completion.

Exit gate: a worker can complete a 5-entry shard with zero GitHub writes.

### Phase 3 — Reconciler / batch integrator

Combine deltas while checking:

- waveHash / snapshotHash;
- exact shard scope;
- duplicate shard delivery;
- duplicate codes;
- missing shards;
- base-vs-current GitHub conflict detection.

Exit gate: a complete wave yields one conflict-free reconciliation manifest;
partial waves identify exact recovery shards.

### Phase 4 — Controlled pilot 20 x 5

100 entries.

Measure against R4.2:

- wall-clock production throughput;
- GitHub calls per produced entry;
- duplicate rate;
- lost-output rate;
- R33 pass / repair rate;
- source review completeness.

Required quality gate: no weakening of R33 and no higher unexplained defect rate.

### Phase 5 — 50-worker wave

250 entries.

Exit gate: stable recovery and synchronization with no Secondary Rate Limit caused
by worker hot-path traffic.

### Phase 6 — 100-worker wave

500 entries.

Exit gate: all shards remain disjoint, grouped synchronization stays bounded and
the quality metrics remain within the Phase 4 baseline.

### Phase 7 — Make R4.3 the default behind the same command

Only after Phases 4-6 pass:

- `MLS BCR siguiente` routes to Snapshot Farm when a valid wave context exists;
- R4.2 stays available as rollback until one full corpus segment is completed;
- per-worker GitHub REQUEST/LEASE/RENEW/COMPLETE leaves the normal path.

## Current implementation status

As of the first R4.3 branch changes:

- Phase 0: complete (isolated branch, no main mutation).
- Phase 1: implementation started.
- Snapshot hash contract: implemented.
- Static wave/shard partition: implemented.
- Append-only delta contract: implemented.
- Reconciliation of complete/missing/duplicate shards: implemented.
- Concurrency/identity injection for the single-command UX: not yet activated.
- Worker Context autosuficiente: implemented; binds one shard to exact snapshot/wave hashes and forbids GitHub hot-path writes.
- Sync conflict planner: implemented; maps paths changed since the frozen base to exact codes/shards for quarantine.
- Chat-local persistence adapter: pending.
- Shared single-command allocator inside ChatGPT: candidate identified, atomic behavior not yet proven; do not activate by assumption.
- GitHub grouped sync adapter: pending.
- Pilot: pending.

## Files

- `MLS R32 EDITORIAL/r4 snapshot farm.cjs`
- `test/r4 snapshot farm.test.cjs`

This document is the authoritative roadmap for the R4.3 implementation branch
until activation is explicitly merged to main.
