# MLS R44 — Cloudflare-native control plane

Status: prepared for production deployment from `main`.

## Reconciliation boundary

R44 reconciles the three control planes as of 2026-10-01:

- GitHub canonical repo: `dpidiaz/llmchatmls`.
- Frozen Emergency boundary: `2961a29cfcb62caa9972e5dc5552037b001063a3`.
- Frozen `content/manifest.json` blob: `643b3c9cab84a0372f9e52127fe78ad0e9fab938`.
- Frozen/current verified-index blob: `e19bc5f617a93f4b1ec50eb96815783ba6b8920e`.
- VERIFIED count: 1,725 both at freeze and at reconciliation.
- Emergency pool: 800 tickets × 5 = 4,000 entries.
- Current GitHub main at reconciliation: `7e5ad872cdbf78b2993b12e707b254fafe53fe6f`.
- Current verified index is byte-identical to the frozen index, so none of the 4,000 emergency entries became VERIFIED after freeze.

ChatGPT Library state imported:

- `R43-EMERGENCY-0293`: durable final sentinel present; imported into R44 as `audited` / `PENDING_CANONICAL_R33_VALIDATION`.
- `R43-EMERGENCY-0208`: lease only, no claim/result/DONE/final; requeued in D1.
- No other durable Emergency v2 result existed in the reconciliation read.

## Authority after cutover

- GitHub remains canonical source/history and grouped publication destination.
- Cloudflare Worker + D1 become the hot control plane for claim, TTL, recovery, context cache, preview and durable worker results.
- Disposable workers do **zero GitHub writes**.
- Frozen entry content is read by Cloudflare from GitHub raw pinned to the frozen commit and verified against the SHA-256 in the frozen content manifest.
- ChatGPT Library Emergency v2 is retained only as migration evidence/fallback history.

## Runtime

Endpoints:

- `GET /api/r44/status`
- `POST /api/r44/claim?worker=<opaque>`
- `GET /api/r44/context/<leaseToken>`
- `POST /api/r44/renew?lease=<leaseToken>`
- `POST /api/r44/submit`
- `GET /api/r44/export?limit=50`
- `GET /api/r44/preview/<MLS-code>`
- `GET /r44-worker` — browser UI for disposable chats.

Lease TTL is 5 minutes; the worker page renews every 2 minutes. Maximum simultaneous active leases is 128.

D1 tables are bootstrapped lazily in the existing `WIKI_DB` binding. The pool is seeded once from this repository's R44 pool manifest.

## Editorial boundary

A submitted ticket becomes `audited`, never automatically `VERIFIED`. Results are durable in D1 and entry payloads are immediately available through the Cloudflare preview endpoint. Canonical R33 validation and grouped GitHub publication remain a later bounded step.

## GitHub traffic policy

Legacy high-frequency schedulers are manual-only under R44. GitHub is not a transactional queue. Publication should happen in grouped batches after R33 validation, not as per-worker Issues/commits.

## R44 Full Pending Corpus — POOL-2

Frozen corpus: **10,133**; frozen VERIFIED: **1,725**; pending: **8,408**. The existing 4,000 entries / 800 Emergency tickets are unchanged. Append **4,408** entries in **882** tickets, for **1,682** tickets total. New IDs run from `R44-CORPUS-0801` (ordinals 4001–4005) to `R44-CORPUS-1682` (8406–8408, three entries). New tickets have no legacy sourceBucket.

`node "scripts/r44 full pending corpus.cjs"` verifies the frozen Git blobs, exact legacy tickets/imports, unique codes, exclusion of VERIFIED, frozen paths/hashes, original manifest order, prefix counts and final universe. `--write` reproduces the append-only manifest. Build and CI fail on any mismatch. Frozen Git history must be available; CI checks out full history.

POOL-1 → POOL-2 uses INSERT OR IGNORE only for ticket rows. It never updates an existing ticket during seed. Result imports also use INSERT OR IGNORE and cannot reset leases, audits or newer results. Existing events, previews and caches are untouched. At most ten static escaped 50-ticket inserts execute per invocation; partial migration returns a retryable 503 and resumes from existing D1 rows. SQL parameters stay below 100 and the entire invocation stays below 50 queries, including bootstrap and status. No new paid service or plan is introduced.

Before committing POOL-2 metadata, D1 is checked against every expected ticket ID, ordinal and entry (including code/path/hash), with 8,408 unique codes and no unexpected rows. Metadata records schema, ticket/entry counts, ticket size, frozen base commit, content manifest blob and pool SHA-256. The build pins the fetched pool to its SHA-256. A completed seed is idempotent.

Worker sharding now computes a ticket position modulo the D1 metadata ticket count and converts it to an entry start ordinal using ticket size. It spans 1–8406 with wraparound. Submit requires exactly the codes assigned to the ticket (normally 5; the final ticket can contain fewer); `r44SameCodes` remains authoritative.

Concurrency remains PARALLEL_HOT_PATH, globalProductionMutex=false, githubHotPathWrites=false, 128 active leases, 300-second TTL and approximately 120-second heartbeat. Atomic ticket claims, expired-lease recovery, worker lease reuse and idempotent submissions remain. GitHub grouped canonical publication policy is unchanged.

Deployment verification sums queued + leased + audited + verified + quarantined = 1682. Recoverable is a subset of leased and is not added twice. Never require audited=1: preserve actual production progress. Local SQLite tests cover interrupted migration, immutable prior data, new-ticket claims, full-range sharding and three-entry submit without claiming production tickets.
