# MLS R44 — Fast Lane disposable chat multiplexing

Status: **IMPLEMENTATION IN PROGRESS / NOT DEPLOYED**

This document defines the design and rollout contract. Implementation on an isolated feature branch is now authorized. It does **not** by itself authorize production cutover, deployment, D1 data mutation, corpus changes, R33 promotion, or production-state changes.

## Purpose

R44 already supports disposable chat workers, atomic D1 claims, five-minute leases, rebind/recovery, per-entry durable checkpoints, a 128-active-lease ceiling, and a GitHub-free production hot path.

Fast Lane does not replace those mechanisms.

Fast Lane defines the incremental behavior required so that the user can open many disposable chats, paste the same command in every chat, and let the control plane assign different work automatically without manual worker, ticket, lease, branch, or recovery administration.

The target user experience is:

```text
open chat
↓
MLS R44 siguiente
↓
claim distinct eligible work
↓
audit assigned entries
↓
checkpoint each durable result
↓
finish ticket
↓
optionally continue with another ticket while the session remains healthy
```

The user controls only the number of chats opened.

## Existing production baseline

Fast Lane must preserve the contracts already documented in:

- [24 — R44 Cloudflare Native Control Plane](./24%20R44%20Cloudflare%20Native%20Control%20Plane.md)
- [25 — R44 Disposable Chat Command](./25%20R44%20Disposable%20Chat%20Command.md)
- [26 — R44 Durable Entry Checkpoints](./26%20R44%20Durable%20Entry%20Checkpoints.md)

The current baseline includes:

- Cloudflare Worker + D1 as the R44 hot control plane.
- GitHub retained as canonical source/history and grouped publication destination.
- Disposable workers performing zero GitHub writes in the production hot path.
- Atomic ticket claim in D1.
- Five-minute lease TTL with generation fencing.
- Rebind/reconcile recovery without silently claiming unrelated work.
- Per-entry durable checkpoints with immutable receipts.
- Partial-durable recovery after chat/session failure.
- Maximum 128 simultaneous active leases.
- `QUARANTINED` as a real exception state, never an automatic success state.
- R44 output remaining `PENDING_CANONICAL_R33_VALIDATION`; R44 durability is not R33 VERIFIED.
- `MLS R44 siguiente` currently meaning one ticket.
- `MLS R44 siguientes 10` currently meaning a bounded sequential loop of up to ten tickets in one chat.

Fast Lane must evolve this baseline rather than build a parallel control plane.

## Product goal

The final operational command remains:

`MLS R44 siguiente`

The desired future interpretation is:

> Claim eligible R44 work atomically, process the assigned ticket, persist every completed entry durably, confirm ticket completion, and—subject to bounded session policy—continue to the next eligible ticket without requiring another user message.

The same literal command must be safe to paste into many disposable chats concurrently.

Desired property:

```text
same command + many chats
=
different tickets + zero intentional duplication + automatic recovery
```

## Development command

During implementation and certification, use a separate command namespace:

`MLS R44 Fast Lane siguiente`

This command exists only to develop and test the behavior without changing the meaning of production `MLS R44 siguiente` before certification.

After all gates pass, production may adopt the Fast Lane semantics while preserving backward-compatible safety guarantees.

## Non-goals

Fast Lane does not:

- merge R44 and R33 into one certification step;
- mark R44 results VERIFIED;
- rewrite canonical corpus content directly;
- remove D1 lease fencing;
- remove per-entry durable checkpoints;
- remove quarantine;
- move transactional claim/checkpoint work back to GitHub;
- require ChatGPT Work for production workers;
- introduce a paid OpenAI API dependency;
- prefetch unrelated tickets while one ticket is still active;
- allow one chat to hold multiple active leases concurrently;
- authorize more than the configured production lease ceiling;
- authorize a production rollout merely by merging this document.

## Single-command multiplexing contract

Every disposable chat uses the same visible command.

The control plane must derive or receive a stable opaque worker identity for that chat and then call the existing allocator.

The user must not provide:

- ticket ID;
- worker ID;
- lease token;
- generation;
- language;
- shard;
- branch;
- checkpoint ID;
- recovery command.

The allocator remains authoritative for work selection.

If multiple chats issue the same command concurrently:

```text
Chat A → claim → Ticket X
Chat B → claim → Ticket Y
Chat C → claim → Ticket Z
```

No chat may intentionally choose its own ticket.

## Ephemeral worker identity

Each disposable chat needs one stable opaque worker identity for the lifetime of that chat session.

The identity is used only for:

- claim ownership;
- lease reuse;
- recovery;
- reconciliation;
- metrics;
- tracing.

The user must not need to know or copy it.

A new disposable chat receives a new worker identity.

A restarted/recovered execution for the same logical chat must preserve the original identity when the client has durable local state.

## Atomic allocation

Fast Lane reuses the existing D1 claim transaction.

Required properties:

- claim selection and ownership remain atomic;
- a ticket has at most one active owner;
- duplicate concurrent claims from one worker reuse the same live allocation where applicable;
- a worker never receives a second active lease while still owning one;
- the 128-live-lease ceiling remains enforced;
- completed/quarantined tickets are not silently reassigned;
- expired ownership is recovered only through existing lease-generation rules.

Fast Lane must not introduce a new GitHub-backed allocator.

## Bounded multi-ticket loop

Fast Lane changes orchestration, not the ticket durability model.

After one ticket becomes confirmed COMPLETE:

1. verify all assigned entry checkpoints have durable receipts;
2. verify the authoritative ticket state is COMPLETE;
3. clear only the completed local binding;
4. create a fresh explicit claim/idempotency key;
5. claim the next eligible ticket;
6. continue only if session budget and health permit.

A session may process multiple tickets, but the loop must be bounded.

Initial implementation should support a configurable limit such as:

- maximum ticket count per session;
- maximum wall-clock execution budget;
- maximum completed-entry count;
- or a combination of these.

The first certification target should prefer conservative limits.

### No prefetch

Fast Lane must preserve the current invariant:

> Never claim the next ticket before the current ticket is confirmed COMPLETE.

This prevents one chat from hoarding multiple leases and keeps failed disposable chats cheap to recover.

## Lease, recovery and rebind

Existing lease behavior remains authoritative.

If a chat disappears:

- already durable entries remain durable;
- unconfirmed work remains unconfirmed;
- the active lease eventually expires;
- a later worker may recover unfinished work according to allocator rules;
- generation fencing rejects stale writes.

If transport/session state is lost while the lease may still be valid:

1. preserve worker/ticket/checkpoint identity;
2. rebind/reconcile the same ticket;
3. read authoritative receipts and remaining codes;
4. replay only the exact unconfirmed checkpoint when valid;
5. stop on `LEASE_LOST`.

Recovery must never claim unrelated work as a side effect.

## Per-entry durability

Fast Lane must continue using the R44 44.1 checkpoint model.

Every completed entry is saved individually.

A chat may die after entries 1–3 of a five-entry ticket; another execution should resume from entries 4–5 after authoritative reconciliation.

Example:

```text
entry 1 → AUDITED_DURABLE
entry 2 → AUDITED_DURABLE
entry 3 → AUDITED_DURABLE
chat dies
entry 4 → pending
entry 5 → pending

recovery
↓
preserve 1–3
resume 4–5
```

A session success message is never the acceptance boundary; the persisted receipt is.

## R44 versus R33 boundary

Fast Lane accelerates R44 production only.

The state transition remains:

```text
R44 audit/correction
↓
AUDITED_DURABLE
↓
ticket COMPLETE
↓
PENDING_CANONICAL_R33_VALIDATION
↓
later R33 canonical validation
↓
VERIFIED
```

Fast Lane must not report `VERIFIED` unless the canonical R33 pipeline actually records that state.

## Few-writer principle

Production disposable workers already perform no GitHub writes, and Fast Lane must preserve that architecture.

The scaling principle is:

```text
many workers
+
few grouped global writers
```

not:

```text
many workers
+
many writes to the same Git ref
```

Canonical GitHub publication should remain grouped and outside the worker hot path.

Any future publication optimization must be separately specified and must not be implicitly authorized by Fast Lane.

## Observability

Fast Lane certification requires live metrics sufficient to answer:

- active workers;
- live leases;
- claims per minute;
- tickets completed per hour;
- entries checkpointed per hour;
- partial-durable tickets;
- lease expirations;
- recoveries/rebinds;
- stale-generation rejections;
- quarantined tickets;
- duplicate-result conflicts;
- `CAPACITY_BUSY` frequency;
- bridge/MCP transport failures;
- GitHub 403/409 errors in non-hot-path publication/integration;
- average tickets completed per disposable session.

The primary throughput metric should be entries/hour and tickets/hour, not raw command count.

## Error and stop conditions

A Fast Lane session must stop safely on conditions including:

- `NO_WORK`;
- `CAPACITY_BUSY`;
- `LEASE_LOST`;
- `QUARANTINED`;
- unreconciled ambiguous completion;
- failed receipt verification;
- repeated transport failure beyond bounded retry policy;
- insufficient remaining session budget to safely finish another ticket.

A partial bounded run is successful if all confirmed work is durable.

## Concurrency certification gates

Do not move directly to maximum concurrency.

Required gates:

### Gate 1 — 5 chats

Validate:

- distinct allocations;
- zero duplicate active ownership;
- normal checkpoint completion;
- one forced chat interruption and recovery.

### Gate 2 — 15 chats

Validate:

- allocator dispersion;
- stable claim latency;
- bounded recovery;
- no systematic contention growth.

### Gate 3 — 30 chats

Validate:

- sustained multi-ticket loops;
- no lease hoarding;
- stable D1 transactional behavior;
- observability completeness.

### Gate 4 — 60 chats

Validate:

- recovery under churn;
- `CAPACITY_BUSY` semantics;
- transport fallback behavior;
- no increase in duplicate-result conflicts.

### Gate 5 — 100 chats

Validate:

- sustained throughput;
- session disposal/replacement;
- no work loss;
- no state corruption;
- no dependence on GitHub hot-path writes.

A future optional 128-worker ceiling test may be performed only after Gate 5 is stable.

## Gate advancement criteria

Advance only when all of the following remain true:

- intentional duplicate active ownership = 0;
- durable work lost = 0;
- stale writes rejected correctly;
- incomplete chats recover correctly;
- quarantine is isolated rather than hidden;
- throughput increases meaningfully with added concurrency;
- error growth is bounded;
- no new GitHub transactional hot path appears.

## Backward compatibility

Until Fast Lane is certified:

- `MLS R44 siguiente` keeps its existing one-ticket semantics;
- `MLS R44 siguientes 10` keeps its existing bounded-ten semantics.

After certification, if `MLS R44 siguiente` adopts bounded auto-continuation, recovery and durability semantics must remain compatible with existing clients.

Any semantic expansion must be documented before cutover.

## Risks

### GitHub secondary rate limits / 403

Disposable workers must not return to per-entry or per-ticket GitHub writes.

Grouped publication/integration should remain decoupled from worker throughput.

### Git ref contention / 409

Avoid multiple workers pushing to one mutable Git ref.

R44 production must continue to use D1 for transactional state.

### Lease hoarding

Disallow prefetch and multiple active leases per chat.

### Ambiguous completion

Never infer success from transport completion. Reconcile receipts/state.

### Worker disappearance

Assume disposable chats can die at any time. Durable checkpoints and lease recovery are mandatory.

### Over-aggressive auto-continuation

Bound every session. A chat should stop rather than claim work it may not safely finish.

### Misreporting final project progress

R44 COMPLETE is not R33 VERIFIED. Metrics must keep those stages separate.

## Roadmap

### Phase A — contract and instrumentation

1. Freeze this specification.
2. Define the exact future semantics of `MLS R44 siguiente`.
3. Add/read observability required for certification.
4. Confirm current allocator, checkpoint and recovery invariants through tests.

No production command behavior changes in this phase.

### Phase B — Fast Lane development command

1. Add `MLS R44 Fast Lane siguiente` as an explicitly non-production command path.
2. Reuse the existing claim/checkpoint/rebind APIs.
3. Implement a bounded multi-ticket orchestration loop.
4. Preserve no-prefetch and one-live-lease-per-chat invariants.
5. Add fail-closed stop conditions.

### Phase C — recovery and churn certification

1. Kill workers mid-ticket.
2. Kill workers between durable checkpoint and response acknowledgement.
3. Exercise rebind/reconcile.
4. Verify no confirmed entry is repeated or lost.
5. Verify stale generations cannot mutate state.

### Phase D — concurrency gates

Run 5 → 15 → 30 → 60 → 100 disposable chats.

Collect throughput, latency, error, recovery and quarantine metrics at every gate.

### Phase E — production compatibility review

1. Compare Fast Lane behavior against docs 24–26.
2. Confirm no GitHub hot-path regression.
3. Confirm FREE ONLY constraints.
4. Confirm R44/R33 boundary.
5. Confirm existing singular and ten-ticket commands remain safe.

### Phase F — explicit cutover authorization

Only after a separate user authorization:

1. choose the final bounded policy;
2. update command documentation;
3. deploy the certified orchestration change;
4. run production smoke tests;
5. preserve an immediate fail-closed rollback path.

This document alone does not authorize Phase F.

## Definition of DONE

Fast Lane is DONE only when:

- many disposable chats can paste the same command concurrently;
- each active chat receives distinct eligible work under atomic allocation;
- no user-managed worker/ticket/lease IDs are required;
- one chat can safely process multiple tickets sequentially under a bounded policy;
- no chat owns multiple tickets at once;
- every durable entry has a verified receipt;
- interrupted chats resume/recover without losing confirmed work;
- stale generations cannot write;
- quarantined cases remain isolated and visible;
- production worker hot path performs zero GitHub writes;
- throughput scales positively across certification gates;
- R44 COMPLETE is never mislabeled as R33 VERIFIED;
- backward compatibility is documented and tested;
- deployment occurs only after explicit authorization.

## Rollback / fail-closed policy

Fast Lane must fail closed.

If rollout produces ownership ambiguity, duplicate conflicts, receipt failures, unexpected GitHub hot-path traffic, or state inconsistency:

1. stop new Fast Lane multi-ticket claims;
2. preserve all existing D1 data and durable receipts;
3. keep existing R44 single-ticket behavior available where safe;
4. reconcile active/partial tickets;
5. do not delete additive state;
6. investigate before re-enabling Fast Lane.

Rollback must not erase durable checkpoints.

## Future first implementation action

When the user explicitly authorizes implementation, the first action should be:

> inspect the existing R44 client/runtime command-dispatch path and identify the smallest change that can add a bounded sequential claim-after-COMPLETE loop behind `MLS R44 Fast Lane siguiente` while reusing the current D1 allocator, checkpoint, rebind and reconcile primitives unchanged.

Do not begin with a new allocator, new database, new queue, or GitHub workflow unless current primitives are proven insufficient.

## Governing principle

Every implementation decision should satisfy:

> Can the user open many disposable chats, paste exactly the same command in each one, and obtain higher throughput without proportional growth in manual coordination, duplicate work, Git contention, or lost durable progress?

If not, reconsider the design.
