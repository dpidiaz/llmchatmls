# Agent instructions for MASTER LANGUAGE SYSTEM

## MLS BCR universal command (R4.2)

For `MLS BCR siguiente`, read `docs/MLS Global Dispatcher/19 Comando universal BCR.md`.
This is the sole user-facing BCR command. Create one authenticated NEXT request;
recover the authoritative receipt and perform the assigned production or repair
in the current disposable chat. Renew and complete internally using the documented
envelopes. Never send the user back to the original conversation. Actions performs
deterministic Gate, seal and sync; academic source-to-claim review requires an
actual AI chat consultation, never an invented PASS. One active BCR chat writer
plus the serialized Actions writer, five-minute fenced leases, durable checkpoints,
FREE ONLY, no Work handoff, no paid API and no Cloudflare deployment.
Infrastructure changes are reviewed on a separate branch/PR; this command does
not authorize merging infrastructure or deploying production.

This repository is the canonical source for MLS project contracts and operational documentation.

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

