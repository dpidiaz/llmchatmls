# R44: durable entry checkpoints

R44 persists one entry at a time. Session loss does not undo a committed entry.
The acceptance boundary is a database receipt, never a success message from a
session, browser, workflow or chat. R44 always returns
`PENDING_CANONICAL_R33_VALIDATION`; it does not certify or publish R33 content.

## Production deployment record — 2026-10-02

R44 44.1 was deployed and verified on 2026-10-02.

- Implementation: [PR #2741](https://github.com/dpidiaz/llmchatmls/pull/2741).
- Merged commit: [e021774c3eb0cc60af597a80d0d50e29d0dd5517](https://github.com/dpidiaz/llmchatmls/commit/e021774c3eb0cc60af597a80d0d50e29d0dd5517).
- Successful deployment: [Cloudflare Cutover run 37071794913, attempt 2](https://github.com/dpidiaz/llmchatmls/actions/runs/37071794913/attempts/2).
- Worker version: `a3770ecd-ad0f-4e57-b6e8-17863b2929c9`.
- Target: [llmchatmls.dpidiaz.workers.dev](https://llmchatmls.dpidiaz.workers.dev).
- Final verification at approximately 22:26 UTC recorded
  `R44_DURABLE_ENTRY_STATUS_VERIFIED` and `R44_CLOUDFLARE_CUTOVER_OK`.
- Production status confirmed `ACTIVE`, `durable_entry_schema=1`, 300-second
  leases and the 128-worker ceiling. MCP discovery/tool listing and the
  authenticated bridge status probe passed.

The first post-upload check still received the previous runtime during
propagation and failed the new schema assertion. A subsequent direct production
read confirmed the new runtime and completed migration. Attempt 2 finished
successfully, including the authenticated smoke checks.

### Historical migration snapshot and outstanding work

At the deployment verification, the normalized snapshot contained **1,682
tickets**: 1,365 CLAIMABLE, 71 LEASED and **246 QUARANTINED**. All 71 recorded
leases were expired/recoverable at that observation; LEASED is a progress state,
not proof of currently valid ownership. These are historical counts, not live
metrics.

The 246 quarantined tickets retained their original audited results and global
receipts. Their normalized quarantine means individual entry receipts still
require administrative reconciliation; it does not mean their old results
were deleted or that new work is blocked. Do not reissue or fabricate receipts
for those tickets. No historical reconciliation was performed by this deployment.

Canonical `content/`, the frozen pool and the R33 ledger were not changed.
The normal production build regenerated derived site assets from canonical
sources. R44 results remain `PENDING_CANONICAL_R33_VALIDATION`.

### Implementation map

| Files | Responsibility |
| --- | --- |
| `scripts/r44 durable.js` | Normalized checkpoints, claim idempotency, reconciliation, rebind and authenticated bridge recovery |
| `scripts/r44 client.js` | Persistent binding/outbox, receipt verification and bounded retry |
| `scripts/r44 runtime.js` | Existing route compatibility, MCP tools, bridge integration and worker UI |
| `scripts/habilitar r44 cloudflare.js` | Build injection of runtime, SQL and client; replacement of prior injected code |
| `migrations/0044_entry_checkpoints.sql` | Additive tables, uniqueness constraints, fencing and atomic receipt triggers |
| `scripts/r44 verify status.cjs` | Production schema and normalized-count assertions |
| `test/r44 durable checkpoints.test.cjs` | Crash/restart, concurrency, recovery and bridge tests |
| `test/r44 cloudflare control plane.test.cjs`, `test/r44 full pending corpus.test.cjs` | Existing-contract and frozen-pool regression tests |
| `test/integration/r44-d1.test.cjs` | D1 engine test through Wrangler's platform proxy |
| `package.json` | `test:r44` command |
| `.github/workflows/MLS R44 Cloudflare Cutover.yml`, `.github/workflows/MLS R44 Generate Full Pending.yml` | Validation and deployment checks |
| `MLS R32 EDITORIAL/r44/CUTOVER_REQUEST.json` | Explicit production cutover request |
| Dispatcher documents 24, 25 and this document | Editorial boundary, transport protocol and durable-entry contract |

## API

Existing `/api/r44/status`, `/claim`, `/context/:leaseToken`, `/renew`, `/submit`,
`/export`, `/preview/:code` and `/r44-worker` remain available.

| Operation | Request | Result |
| --- | --- | --- |
| POST `/claim?worker=W&idempotencyKey=K` | Stable worker and claim key, saved before sending | Same allocation for every replay of K, including after completion/expiry |
| POST `/checkpoint` | ticketId, workerId, leaseToken, leaseGeneration, idempotencyKey, entry | AUDITED_DURABLE or ALREADY_DURABLE with receipt and receiptSha256 |
| GET `/reconcile?ticketId=T` | Ticket identity | Single-statement authoritative snapshot, entries, receipts, lease and remaining codes |
| POST `/rebind` | workerId, ticketId; optional previous leaseToken | LEASE_REUSED, COMPLETE, LEASE_LOST or NO_BINDING; never acquires/renews a lease |
| GET `/receipt?receiptId=R` | Receipt identity | Persisted receipt and SHA-256 |
| POST `/entry-state` | ticketId, workerId, leaseToken, leaseGeneration, code, state | Fenced PENDING, IN_PROGRESS, FAILED_RETRYABLE or QUARANTINED transition |
| POST `/renew?lease=L&leaseGeneration=G` | Current token and generation | Five-minute extension; old clients may omit generation because tokens are unique per generation |

### Authenticated MCP and bridge

Existing MCP and bridge authentication was preserved when integrating with
current main. MCP now exposes `r44_checkpoint`, `r44_rebind` and
`r44_reconcile`, alongside compatible `r44_claim` and `r44_submit`.
MCP tool calls continue to require the configured editorial bearer credential.

The authenticated backend also provides:

- POST `/api/r44/chat-bridge/rebind`: workerId and ticketId recover the existing
  assignment and, when ownership is still valid, restore a bridgeSessionId.
  This operation never claims or revives expired work.
- POST `/api/r44/chat-bridge/checkpoint`: bridgeSessionId, ticketId,
  leaseGeneration, idempotencyKey and entry persist one entry. The backend
  resolves the lease token; it must not be copied to a public control branch.
- Existing bridge submit retains its binding after success, allowing retry after
  response loss. It no longer revives an expired lease.

Public reconciliation/rebind responses omit the lease token. Bridge context
also removes the nested lease token. External bridge callers must adopt these
new operations to obtain per-entry persistence; the legacy full-ticket operation
remains supported. The external `mlschatcontrol` repository was not changed by
PR #2741.

Checkpoint example:

```json
{
  "ticketId": "ticket-from-claim",
  "workerId": "stable-worker",
  "leaseToken": "token-from-claim",
  "leaseGeneration": 1,
  "idempotencyKey": "stable-entry-attempt-key",
  "entry": {"code": "MLS-V01-0001", "outcome": "PASS_NO_CHANGE", "notes": "review evidence"}
}
```

`CORRECTED` requires an object in `correctedContent`. `PASS_NO_CHANGE` rejects
correctedContent and stores audit metadata/receipt without rewriting the source,
cache or preview. Payload object keys are canonicalized before hashing.
Duplicate content for an already durable entry returns its original receipt,
including its original key; changed content or a key used by a different entry
returns RESULT_CONFLICT. A durable entry is immutable through these APIs.

The receipt identifies ticket, code, original source hash, normalized payload
hash, outcome, worker, generation, idempotency key and server timestamp. Hash its
recursively key-sorted JSON using SHA-256 and compare receiptSha256. The bundled
client verifies both receipt integrity and the submitted payload hash before
showing success. These are integrity hashes, not digital signatures or R33 seals.

## State and transaction model

`r44_ticket_progress` is the normalized ticket state authority:
CLAIMABLE / LEASED / PARTIAL_DURABLE / COMPLETE / QUARANTINED.
`r44_entries` stores PENDING / IN_PROGRESS / AUDITED_DURABLE /
FAILED_RETRYABLE / QUARANTINED. Leases, claims and receipts have separate tables.
The old `r44_tickets` table retains frozen pool identity and legacy projections.

SQLite constraints enforce one entry code across the pool, one receipt per entry,
one receipt key per ticket, one claim key per worker and one lease per ticket.
Claim selection and its trigger execute as one statement. Live leases for a
worker are reused even if it sends two different claim keys concurrently.
The 128-live-lease ceiling is checked in that same statement.

Each checkpoint uses D1 batch with a receipt insertion. Its BEFORE trigger checks
token, worker, generation, DB-clock expiry, source identity and writable entry
state **inside** the transaction. Its AFTER trigger commits the entry, optional
corrected preview, event, renewed five-minute lease, and derived ticket state.
Any failure rolls all these changes back. The server marks COMPLETE only when
all entries are AUDITED_DURABLE. It never needs a client finalize request.

An expired lease may retain LEASED/PARTIAL_DURABLE as its persisted progress state;
`lease.active=false` is authoritative for ownership. A new explicit claim may
reassign the unfinished ticket with an incremented generation. Rebind never
revives expired ownership. QUARANTINED requires administrative resolution and
is not eligible for automatic claim or recovery writes.


## Legacy quarantine reconciliation

Tickets carrying `migration_note=LEGACY_TICKET_RECEIPT_REQUIRES_ENTRY_RECONCILIATION` are migration quarantines, not automatically editorial failures. They originated from full-ticket R44 results that predate per-entry durable receipts.

Production recovery is fail-closed and authenticated through:

`POST /api/r44/admin/reconcile-legacy-quarantine`

For each eligible quarantined ticket the reconciler:

1. verifies the persisted legacy result SHA-256;
2. parses the persisted payload and verifies exact code scope against the frozen ticket entries;
3. when the payload contains a valid per-entry result set, creates normal fenced `MLS-R44-ENTRY-RECEIPT-1` receipts through the existing checkpoint path and requires terminal `COMPLETE`;
4. when the historical artifact is a valid but unstructured sentinel, removes that obsolete result projection and safely requeues the ticket for a fresh normal R44 audit rather than fabricating receipts;
5. leaves hash/JSON-corrupt artifacts quarantined with an explicit `LEGACY_RECONCILIATION_BLOCKED_*` note;
6. preserves genuine non-migration quarantine states.

The recovery runner operates in bounded batches of at most five tickets and stops when the D1 daily write headroom drops below the configured safety floor. The MLS Unified five-minute workflow performs one bounded recovery batch per run so safe recovery continues without requiring manual ticket IDs.

## Recovery and messaging

The bundled HTTP client persists worker, claim key, ticket, token, generation and
the exact pending checkpoint in localStorage before sending. Its hot path has
no GitHub writes and creates no sessions or workflows. The state can also be
preserved by a bridge in its durable task storage when no browser is used.

On SESSION_NOT_FOUND, TooManyActiveSessions, timeout, 5xx or workflow interruption:

1. Preserve the binding, entry payload and keys. Do not claim new work.
2. Restore transport/session if the caller uses one, then rebind the same ticket.
3. Read the authoritative receipts and remaining list. Verify receipts.
4. Replay only the exact unconfirmed checkpoint, with the same key, if the lease
   remains valid. A repeated committed checkpoint is a read-only acknowledgement.
5. On LEASE_LOST stop writes. Only explicit allocation can establish new ownership.

Retries are bounded to five attempts with exponential jitter and Retry-After
support for 429/5xx. HTTP conflicts are not retried. An interrupted claim can be
explicitly replayed with the saved claim key; recover() never performs a claim.
The next-ticket action is explicit and requires confirmed COMPLETE.

Never emit AUDITED_DURABLE without a matching verified receipt. On ambiguous
transport failures emit EXECUTION_UNCONFIRMED and preserve the outbox. This does
not mean previously confirmed entries were lost. The authenticated backend can
restore a bridge binding through its rebind route; external transport adapters
must call that route while preserving worker/ticket identity. The direct HTTP
client avoids the session dependency entirely.

## Migration and compatibility

`migrations/0044_entry_checkpoints.sql` is additive and idempotent. The injector
embeds its statement list; the runtime applies it transactionally after the
legacy schema and frozen pool are ready. `r44_meta.durable_entry_schema=1` records
completion in the same batch. Normal requests then need only a version read.
On an existing ready installation it can alternatively be applied as a reviewed
D1 migration before switching traffic. Do not apply it to an empty database
before the legacy schema and pool have been initialized.

Existing queued entries become PENDING. Active legacy tokens are preserved as
generation 1, and unfinished tickets retain ownership. Historical audited or
verified tickets keep their original legacy rows, exports and global receipts;
their normalized state is QUARANTINED with
LEGACY_TICKET_RECEIPT_REQUIRES_ENTRY_RECONCILIATION. They are not reissued and no
entry receipts are fabricated. Review the old evidence separately before any
administrative conversion to per-entry receipts. No corpus or R33 ledger is changed.

The legacy full-ticket submit still requires the exact assigned code set. It
checkpoints entries individually, preserving progress if the submit stops midway.
Replaying the full payload skips entries already saved. Full envelope metadata
and its original JSON digest are retained in r44_results after completion; an
interruption of that compatibility projection is repaired by replaying submit.
The exporter can reconstruct a completed ticket from receipts even before that
projection exists. Partial tickets never appear as completed exports.

Legacy calls without a claim key use `legacy-worker:<workerId>` as a stable key.
After that allocation is complete they return CLAIM_ALREADY_RESOLVED, not a new
ticket. Clients must provide a fresh explicit key to advance. This deliberate
recovery-safety change prevents old retry behavior from allocating unrelated work.

Switch all writers to the new runtime together. Do not run an old writer or roll
back only the application: old code does not enforce normalized fences. Preserve
the additive tables and investigate/reconcile any interrupted rollout before
enabling writes. There is no destructive down-migration.

## Validation and remaining limits

Run `npm run test:r44` with Node 24+. Tests execute the actual injected runtime
against SQLite, including persistent database reopen, transaction rollback,
claim races, receipt conflicts, client recovery and legacy pool preservation.
The critical crash-3/5 test asserts remaining codes 4 and 5 after reopen/rebind.
An offline frozen-source directory may be supplied through R44_FROZEN_DIR; the
existing validator checks the Git blob hashes before accepting those files.

The released revision passed **50 R44 tests**, plus the additional D1 engine
integration test through Wrangler's platform proxy. The D1 test applies the
migration to a disposable fixture, commits entries 1–3, creates a new runtime,
asserts remaining [4,5], rejects a stale generation after reassignment, and
checks rollback after a forced preview failure. R33 and Global Dispatcher CI
checks also passed; the deployment workflow validated canonical data and built
the production worker.

Production verification covered the migrated status, normalized counts, worker
page, MCP discovery/tool listing and authenticated bridge status. It did not
claim or submit a production ticket for testing. The D1 fixture test is an
emulated engine test, not a separately provisioned remote staging database.

Remaining limitations: the 246 historical ticket-only results need individual
reconciliation; external callers must use checkpoint/rebind to benefit from
incremental progress; and mixed old/new writers or application-only rollback
are unsafe. Keep the additive tables and fences. Worker IDs and receipt hashes
are not authentication or digital signatures, and no R33 certification is
implied by R44 durability.

D1 transaction semantics: https://developers.cloudflare.com/d1/worker-api/d1-database/#batch
