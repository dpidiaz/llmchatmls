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

For `MLS R44 siguiente` or `MLS R44 siguientes 10`, read:

`docs/MLS Global Dispatcher/25 R44 Disposable Chat Command.md`

`MLS R44 siguiente` remains the single-ticket compatibility command.

`MLS R44 siguientes 10` is the preferred optimized same-chat command. Execute up to 10 complete R44 tickets sequentially in the current chat. Never prefetch tickets and never hold more than one active lease for the chat. Claim the next ticket only after the previous ticket is confirmed COMPLETE with durable entry receipts / AUDITED_DURABLE (or an idempotent already-durable acknowledgement). Stop the loop immediately on NO_WORK, CAPACITY_BUSY, LEASE_LOST, QUARANTINED, CLIENT_TRANSPORT_UNAVAILABLE_FREE_ONLY, ambiguous unconfirmed completion, or insufficient remaining execution capacity. Preserve every already-confirmed durable checkpoint and never replace recovery of the current ticket with a fresh claim.

Mandatory transport rules:

- **FREE ONLY**: never use TinyFish, a paid browser runner, a paid API, or an automatic paid fallback.
- Prefer the deployed Direct MCP endpoint `https://llmchatmls.dpidiaz.workers.dev/mcp` when the current ChatGPT client exposes custom MCP tools with write capability.
- D1 remains authoritative for claim, lease fencing and durable submit; GitHub is not the R44 claim/submit hot path.
- Never claim a ticket through a transport that the current chat cannot also use to submit the audited result.
- If the current ChatGPT plan/client does not expose writable custom MCP, use the authenticated `MLS Chat Bridge` fallback (`r44ClaimChat` / `r44RenewChat` / `r44SubmitChat`) on `mlschatcontrol`. The lease token must remain server-side in D1; only `bridgeSessionId` may cross the public control branch. If that free bridge is unavailable, stop before claiming and report `CLIENT_TRANSPORT_UNAVAILABLE_FREE_ONLY`. Never substitute a paid transport.
- A ticket is complete only after `AUDITED_DURABLE` (or idempotent `RESULT_ALREADY_SUBMITTED`) with a SHA-256 receipt. `AUDITED` is not R33 `VERIFIED`.

## MLS R44 Fast Lane command

For the exact deployed command `MLS R44 Fast Lane siguiente`, read:

`docs/MLS Global Dispatcher/27 R44 Fast Lane Disposable Chat Multiplexing.md`

Fast Lane is **CHAT ONLY — NO ChatGPT Work** for worker execution. It reuses the existing R44 Cloudflare/D1 allocator, five-minute fenced leases, rebind/reconcile recovery and per-entry durable checkpoints. Do not create a second allocator, GitHub queue or alternate durable store.

Execute a bounded same-chat sequential loop of **up to 10 complete tickets**:

1. Reconcile any existing binding first.
2. If the current ticket is incomplete and ownership is valid, finish only its remaining entries.
3. Confirm every entry via durable receipt and confirm the ticket state is COMPLETE.
4. Only after COMPLETE, clear the completed binding and issue a fresh claim/idempotency key.
5. Continue while the chat remains healthy and has enough capacity to finish another ticket.
6. Stop on NO_WORK, CAPACITY_BUSY, LEASE_LOST, QUARANTINED, receipt failure, ambiguous unconfirmed completion, transport exhaustion, or insufficient execution capacity.

Never prefetch. Never hold two active leases for one chat. Never replace recovery of an interrupted ticket with a new claim. R44 results remain PENDING_CANONICAL_R33_VALIDATION and must never be reported as VERIFIED.

Fast Lane production cutover is complete. `MLS R44 Fast Lane siguiente` is an active production command. Ordinary `MLS R44 siguiente` keeps its existing one-ticket compatibility semantics unless separately changed.

## MLS Unified verification command

For `MLS Unified siguiente` and the explicit-target form `MLS Unified siguiente N`, read:

`docs/MLS Global Dispatcher/28 MLS Unified Verification Pipeline.md`

This command is **ACTIVE in production** and **CHAT ONLY — NO ChatGPT Work**. It remains deliberately distinct from historical `MLS siguiente`, `MLS R44 siguiente`, `MLS R44 Fast Lane siguiente` and `MLS R33 siguiente`.

Goal: move work toward canonical R33 `VERIFIED`, not merely R44 COMPLETE. Production activation was certified by a real +50 VERIFIED integration smoke. Gate policy: 5 → 100; intermediate 15/30/60 gates are optional diagnostics, not mandatory blockers.

**Mandatory per-command throughput:** the default pasted command `MLS Unified siguiente` uses `targetEntries = 100`. The explicit form `MLS Unified siguiente N` sets the cumulative target for **this chat execution only**, where `N` must be a multiple of 5 from 100 through 1000 inclusive. Examples: `MLS Unified siguiente 200`, `MLS Unified siguiente 500`, `MLS Unified siguiente 1000`. Never use this number to mutate global runner concurrency or low-level claim sizes.

A 5-entry R33 microclaim or 5-entry R44 ticket is only an atomic unit; it is **not** the command boundary. After every safely completed claim, immediately continue with the next eligible Unified work in the same chat until at least `targetEntries` entries have been durably checkpointed/certified/integrated during that execution. Do **not** report the command as DONE below the parsed target. Stop below the target only when fewer eligible entries genuinely remain or a verifiable technical/safety blocker prevents further safe work. Never prefetch and never hold overlapping leases merely to reach the target.

Priority order for a fresh Unified loop:

1. **Unified final integration first.** Create a Global Dispatcher claim using `MLS R32 EDITORIAL/unified command.cjs` with stage `integration`. It must be scoped to provider `r33-index-integration` and workPrefix `r33-unified-integration:`. If leased, execute that integration assignment exactly as issued. If NO_WORK or CAPACITY_BUSY, continue to step 2.
2. **Unified R33 certification.** Create a scoped claim with stage `r33`: provider `r33-farm`, workPrefix `r33-unified:`. If leased, process only those entries. Read each R44 handoff identified by the assignment instructions. Evidence must bind the final article content in the same branch/commit. On FINISH, follow the generated autoPull; Unified autoPull must remain scoped to `r33-unified:`.
3. **Produce R44 work.** If no Unified integration or R33 assignment is immediately eligible, execute the existing deployed `MLS R44 Fast Lane siguiente` contract. Do not claim unrelated Global Dispatcher work as a substitute.

Important invariants:

- R44 COMPLETE is never reported as VERIFIED.
- A durable R44→R33 GitHub handoff is required before an entry can enter `r33-unified:`.
- The grouped handoff synchronizer, not disposable R44 workers, publishes R44 results to GitHub.
- Never bypass the handoff by reconstructing a correction from chat memory.
- If R44 outcome is CORRECTED, the R33 worker must reconcile the handoff correction into the assigned canonical `contentPath` before generating final Evidence.
- Final integration must copy content and Evidence from the same pinned worker commit.
- Canonical `MLS R32 EDITORIAL/evidence git/indexes/verified.json` remains the terminal VERIFIED authority.
- Never prefetch R44 tickets or hold more than one R44 lease per chat.
- Respect Global Dispatcher locks/recovery for R33 and integration work.
- FREE ONLY. No paid API or paid browser fallback.
- If an explicit R43→R33 historical handoff is active, its isolation contract remains higher priority; do not bypass it.
- Unified production activation is complete. Do not reinterpret historical `MLS siguiente` as an alias unless a separate migration is explicitly authorized.

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

