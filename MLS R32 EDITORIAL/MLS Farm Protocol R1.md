# MLS Farm Protocol R1

This file is the durable operational contract for MLS Farm.

## Canonical command envelope

Every new operational command MUST use the marked envelope:

<!-- MLS_FARM_COMMAND
{
  "operation": "claim",
  "requested": 50,
  "requestId": "unique-request-id",
  "workerId": "unique-worker-id"
}
-->

Supported operations are `claim`, `status_global`, and `reap`.

Unmarked/raw JSON operational Issues are legacy input. The Scheduler MUST NOT convert them into leases. It closes them as stale legacy commands.

## Claim lifecycle

A claim is only eligible for leasing for 90 seconds after the GitHub Issue was created.

If the Scheduler reaches it after that TTL, it closes the command as `STALE_CLAIM` with zero assigned entries.

A worker must therefore never assume that an open claim will eventually become a lease.

## Lease acknowledgement

A newly created lease starts in an unacknowledged phase.

- Acknowledgement deadline: 5 minutes after `claimedAt`.
- Until acknowledgement, `expiresAt` is the acknowledgement deadline.
- The first accepted `heartbeat`, `checkpoint`, `finish`, or `cancel` event sets `acknowledgedAt`.
- After acknowledgement, the normal rolling lease TTL is 5 minutes from the last accepted worker event.
- An unacknowledged lease that times out is expired and all non-terminal assigned codes are released.

The worker should send a heartbeat immediately after it observes a valid lease.

## Worker events

Worker events use the `MLS_FARM_EVENT` marker and MUST carry the exact `batchId` and `leaseToken`.

Supported events:

- `heartbeat`: acknowledges or extends the lease.
- `checkpoint`: submits 1 to 10 assigned results and extends the lease.
- `finish`: closes only when no assigned results are pending.
- `cancel`: requests immediate release of unfinished assignments.

Checkpoints remain idempotent. A second different result hash for the same code is rejected as a conflict.

## Scheduler recovery

The Scheduler drains all marked pending commands, not only the Issue that woke it.

It also:

- sweeps expired/cancelled/finished batches;
- persists accepted terminal results to the language ledgers before releasing unfinished work;
- closes stale legacy operational Issues without executing them;
- processes orphaned marked `status_global` and `reap` commands idempotently;
- runs a scheduled recovery sweep every 5 minutes.

## Execution environment invariant

The natural-language command `MLS Farm siguientes N` includes an explicit execution constraint:

> **CHAT ONLY — NO CHATGPT WORK.**

When this command is issued, the agent MUST keep execution in the current ChatGPT conversation. It MUST NOT hand off, redirect, or suggest moving the task to ChatGPT Work merely because repository operations, long processing, or multiple tool calls are involved. This constraint is part of the command itself and does not need to be repeated by the user each time.

Only an explicit override in the same user request may change this rule.

## Chat worker rule

A ChatGPT turn is not a persistent background worker.

Therefore a chat must not finish while assuming an unacknowledged claim or lease will continue by itself.

When using `MLS Farm siguientes N`:

1. create one canonical marked claim;
2. observe the Issue until it is leased or closed stale;
3. once leased, send an immediate heartbeat acknowledgement;
4. process the assigned entries with checkpoints;
5. finish the batch when pending reaches zero;
6. if the turn cannot continue safely, send `cancel` rather than abandoning a live lease.

## Safety invariants

- Terminal ledger entries are never re-leased.
- Active, non-expired lease entries are protected from overlapping allocation.
- Expiring or cancelling a batch releases only unfinished codes.
- Accepted partial results survive batch expiration and are merged into the ledger.
- MLS Farm control-plane operations do not require Cloudflare D1.
