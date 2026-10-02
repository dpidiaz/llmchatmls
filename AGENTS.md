# Agent instructions for MASTER LANGUAGE SYSTEM

## MLS BCR universal command (R4.2)

For `MLS BCR siguiente`, read `docs/MLS Global Dispatcher/19 Comando universal BCR.md`.
This is the sole user-facing BCR command and enables SAME-CHAT CONTINUOUS MULTI-PULL.
Create one authenticated NEXT request; recover the authoritative receipt and
perform the assigned production or repair in the current disposable chat. Renew
and complete internally using the documented envelopes. When COMPLETE is confirmed
COMPLETED (or idempotently confirmed DONE), if THIS SAME CHAT is still executing and
has enough remaining capacity to own another complete work unit, immediately
create a fresh OWNER-authored NEXT with a NEW requestId. Re-read the independent
lease, process it, renew as needed, COMPLETE and repeat without requiring the user
to type the command again. Never open the NEXT before the previous claim is
confirmed DONE. Never prefetch or hold two active leases for one chat. On
CAPACITY_BUSY, STALE, NO_WORK, cooldown, insufficient execution budget or
uncertain completion, stop creating NEXT; preserve any committed checkpoints,
explain the last confirmed state, and let the Dispatcher recover outstanding work.
This is an IN-CHAT loop only, NEVER autonomous background execution, never bot-
minted work or another conversation. Never send the user back to the original conversation. Actions performs
deterministic Gate, seal and sync; academic source-to-claim review requires an
actual AI chat consultation, never an invented PASS. Up to 50 exclusive
BCR chat leases plus one serialized Actions dispatcher, five-minute fenced epochs,
durable checkpoints,
FREE ONLY, no Work handoff, no paid API and no Cloudflare deployment.
Infrastructure changes are reviewed on a separate branch/PR; this command does
not authorize merging infrastructure or deploying production.

This repository is the canonical source for MLS project contracts and operational documentation.


## MLS R44 commands

For `MLS R44 siguiente`, read:

`docs/MLS Global Dispatcher/25 R44 Disposable Chat Command.md`

Mandatory transport rules:

- **FREE ONLY**: never use TinyFish, a paid browser runner, a paid API, or an automatic paid fallback.
- Prefer the deployed Direct MCP endpoint `https://llmchatmls.dpidiaz.workers.dev/mcp` when the current ChatGPT client exposes custom MCP tools with write capability.
- D1 remains authoritative for claim, lease fencing and durable submit; GitHub is not the R44 claim/submit hot path.
- Never claim a ticket through a transport that the current chat cannot also use to submit the audited result.
- If the current ChatGPT plan/client does not expose writable custom MCP, use the authenticated `MLS Chat Bridge` fallback (`r44ClaimChat` / `r44RenewChat` / `r44SubmitChat`) on `mlschatcontrol`. The lease token must remain server-side in D1; only `bridgeSessionId` may cross the public control branch. If that free bridge is unavailable, stop before claiming and report `CLIENT_TRANSPORT_UNAVAILABLE_FREE_ONLY`. Never substitute a paid transport.
- A ticket is complete only after `AUDITED_DURABLE` (or idempotent `RESULT_ALREADY_SUBMITTED`) with a SHA-256 receipt. `AUDITED` is not R33 `VERIFIED`.

## MLS Watchdog commands

When the user issues any command beginning with `MLS` and containing `watchdogs` or `watchdog group`, read and follow:

`docs/watchdogs/MLS Watchdog Protocol R1.md`

Machine-readable command names are in:

`docs/watchdogs/MLS Watchdog Commands.json`

Logical group records are in:

`docs/watchdogs/MLS Watchdog Registry.json`

Important invariants:

- watchdog groups are chat-scoped;
- never operate on another chat's group unless the user uses the explicit global command;
- never identify a group by 00, 20 or 40 alone;
- use the GROUP ID as the isolation key;
- activation and reactivation must not intentionally leave a partial group;
- do not store raw ChatGPT conversation IDs, task IDs, credentials or private runtime identifiers in this public repository;
- the Scheduled task service is authoritative for live task state;
- GitHub stores the durable protocol and privacy-safe logical registry;
- preserve unrelated Scheduled tasks.

If the protocol conflicts with informal remembered wording, the repository protocol wins.


## MLS Farm commands

When the user issues a command beginning with `MLS Farm`, read and follow:

`MLS R32 EDITORIAL/MLS Farm Protocol R1.md`

Important invariants:

- create only canonical `MLS_FARM_COMMAND` envelopes;
- do not revive legacy unmarked claims;
- acknowledge a lease immediately with a worker heartbeat;
- do not leave a live claim or lease behind when the chat turn ends;
- preserve ledger terminal states and active lease overlap protection;
- `MLS Farm siguientes N` is explicitly **chat-only**: execute the complete Farm lifecycle in the current ChatGPT conversation and **never hand off, redirect, or suggest ChatGPT Work** for this command unless the user explicitly overrides this rule in that same request.

## MLS R4.1 Buffered Farm commands (experimental, opt-in)

For a user request explicitly invoking `MLS Buffered`, `MLS R4.1`, `Buffered Evidence Farm`, or `MLS sincronizar`, read:

`docs/MLS Global Dispatcher/10 R4.1 Buffered Evidence Farm.md`

Mandatory guardrails:

- R4.1 is an opt-in experimental route; **do not silently reinterpret ordinary `MLS siguiente`** or mutate the existing Dispatcher/production pathway before separately approved activation.
- `MLS Buffered` allocations originate from valid, collaborator-authored `[MLS Buffered][REQUEST]` Issues handled by the serialized Global Dispatcher Scheduler. No chat can mint authoritative assignment IDs, fabricate GitHub lease events or claim a unit from conversational memory.
- Per-entry editorial checkpoints are persisted in explicit local files; only sealed exportable bundles survive transfer between independent ChatGPT conversations. Never state that session memory is a durable transaction store.
- A buffer `VERIFIED` or `REVIEWED` claim requires canonical R33 validation with sources and identity hashes. Staging/push alone is not certification, integration to main or deployment.
- Only an authorized `[MLS Buffered][SYNC]` Issue may request the bounded, single-writer grouped GitHub sync. On HTTP 403/429 respect remote limits and preserve the buffer/reservation; never launch mass retries from workers.
- Do not use ChatGPT Work, OpenAI API, other paid AI APIs (including latent options/feature flags), Cloudflare/D1 editorial writes or deployment by default. FREE ONLY is non-negotiable.
- Branch `feat/mls-r4-1-buffered-farm` and PR #1860 remain Draft; do not merge to `main`, migrate existing claims or deploy Cloudflare without explicit separate authorization.

