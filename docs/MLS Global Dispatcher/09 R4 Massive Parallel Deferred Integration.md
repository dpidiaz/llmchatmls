# 09 — R4 Massive Parallel / Deferred Integration

## Operating model

R4 treats ChatGPT chats as ephemeral producers. Human availability arrives in bursts; a burst may launch 1, 30, 80, 100 or 128 chats. The system optimizes for irreversible accumulated progress rather than long-lived assignments.

`corpus → dynamic allocation → 5-entry microclaims → per-entry checkpoint → certified immutable Evidence → deferred staging → rehearsal → final publication`

## Invariants

- The corpus/ledger is the source of work. A ready queue is only an optimization.
- Default R33 microclaim: 5 entries; configured maximum: 10.
- Checkpoint contract: one completed entry per durable checkpoint.
- Maximum configured R33 concurrency: 128 workers.
- Expired leases are reaped before command draining; later bursts can recover abandoned pending work.
- Completed units survive recovery generations.
- `CAPACITY_BUSY` means work is temporarily leased; it is not `NO_WORK`.
- `NO_WORK` is reserved for no eligible/recoverable work.
- Evidence workers never regenerate global indexes.
- Main integration is deferred while `deferredIntegration=true`.
- Cloudflare/D1 editorial interactions remain zero.

## Serialization budget

Serialization is an exception. The current GitHub scheduler keeps one allocator concurrency group to fence competing ledger/issue mutations, but one scheduler invocation drains all pending claims in a burst. Editorial Evidence work is not serialized by this group.

The target final-publication critical section is at most two global operations:

1. freeze/verify the final manifest;
2. publish the already-prepared snapshot.

Heavy validation, index construction and rehearsal belong outside that critical section.

## Deferred integration

R4 intentionally allows `certified/staged >> integrated`. This is healthy during corpus production. Evidence remains addressable by worker branch + commit SHA in terminal dispatcher history. Periodic integration by batch size is disabled.

Integration rehearsals must prove that staged Evidence can form a valid candidate snapshot without modifying `main`. The final corpus publication occurs only after normal production and quarantine resolution are complete, unless a concrete technical requirement justifies an intermediate publication.

## Worker lifecycle

A worker processes only its leased microclaim. After every completed entry it commits and checkpoints before starting the next. If the session remains healthy after the microclaim, it should immediately request another claim. If it dies, durable completed units remain; pending units become recoverable after lease expiry/reap.

## Continue until preempted

Finishing a microclaim is not a worker termination condition. A valid R33 `finish` event automatically creates the next Dispatcher claim with the same worker identity, records the chain in `autoPull`, and explicitly dispatches the Scheduler. A still-running chat follows the chained claim and continues with the next microclaim.

This converts runtime termination into ordinary preemption:

- completed entries are already durable;
- a partially completed microclaim is recovered at entry granularity;
- a seeded claim or lease left behind by a dead chat is allowed to expire and is reaped;
- another worker can reclaim the remaining corpus without conversational context.

The system never attempts to keep a ChatGPT reasoning process alive. It makes worker death cheap and expected.

## Capacity semantics

- `assigned`: useful work leased.
- `CAPACITY_BUSY`: corpus work exists or is in flight, but no independent unit is presently claimable.
- `NO_WORK`: no eligible/recoverable work remains.
- infrastructure errors must remain distinct from both.

## Future optimization gates

Do not add sharded indexes, external databases or paid infrastructure until measurement demonstrates a bottleneck. Preserve GitHub-native, Chat-only, FREE ONLY operation.
