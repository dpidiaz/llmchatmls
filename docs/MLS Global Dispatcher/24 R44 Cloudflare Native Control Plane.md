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
- `GET /api/r44/claim?worker=<opaque>`
- `GET /api/r44/context/<leaseToken>`
- `GET /api/r44/renew?lease=<leaseToken>`
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
