# MLS R44 — disposable chat command

Visible commands:

`MLS R44 siguiente` — process exactly one ticket.

`MLS R44 siguientes 10` — preferred optimized mode; process up to 10 tickets sequentially in this same chat.

## Parallel production contract

R44 production is **not globally serialized**. Up to 128 disposable chats may hold active leases at the same time and work on different assigned tickets independently.

- A worker does not wait for another worker to finish before claiming work.
- Claims are atomically protected per ticket in D1, but worker IDs are deterministically dispersed across the complete pool using its D1 ticket count and ticket size so simultaneous chats do not all contend for the first queued row.
- Context loading for all assigned entries runs in parallel.
- Result persistence is transactional per ticket; there is no repository-wide production mutex.
- GitHub is not in the claim, renew, context, submit, recovery, or preview hot path.
- Canonical GitHub publication happens later in grouped batches and must never pause Cloudflare/D1 production.
- CAPACITY_BUSY means the 128-active-lease ceiling is temporarily full; it is not a global serialization lock.

## Same-chat sequential multi-pull (10 tickets)

For `MLS R44 siguientes 10`, run a bounded in-chat loop of at most 10 complete tickets.

1. Claim exactly one ticket.
2. Audit/checkpoint all assigned entries and recover/retry that same ticket as required.
3. Confirm the ticket is COMPLETE and every durable write has a verified receipt. A full-ticket compatibility submit may finish with `AUDITED_DURABLE` or `RESULT_ALREADY_SUBMITTED`; entry-checkpoint mode may finish through the normalized COMPLETE state with all entry receipts durable.
4. Only then clear the completed binding and create the next explicit claim with a fresh claim/idempotency key.
5. Repeat until 10 tickets are complete or a stop condition is reached.

Invariants:

- Never prefetch the next ticket.
- Never hold two active leases for one chat.
- Never open a fresh claim to recover an interrupted or ambiguous current ticket.
- Use renew only for the currently owned ticket and only when needed.
- Preserve already-confirmed entry checkpoints if the chat or transport is interrupted.
- Stop immediately on `NO_WORK`, `CAPACITY_BUSY`, `LEASE_LOST`, `QUARANTINED`, `CLIENT_TRANSPORT_UNAVAILABLE_FREE_ONLY`, an unconfirmed ambiguous completion that cannot be reconciled safely, or insufficient remaining execution capacity to finish another ticket.
- A stop after fewer than 10 tickets is a successful bounded run, not a reason to pre-claim work.
- This loop is synchronous inside the current ChatGPT turn/conversation only. It is never background execution and never ChatGPT Work.
- The singular `MLS R44 siguiente` command remains one-ticket behavior for backward compatibility.

The bundled client already enforces the key ownership transition: `next()` first calls `recover()`, requires `state === "COMPLETE"`, clears only the completed binding, and then issues a fresh claim. The optimized command must preserve that ordering.

## Worker contract

SOLO CHAT. FREE ONLY. No GitHub writes. No Work. No paid browser transport.

Primary transport: MCP Streamable HTTP at `https://llmchatmls.dpidiaz.workers.dev/mcp`.

Mutating MCP calls (`tools/call`) require `Authorization: Bearer <MLS_EDITORIAL_CHAT_KEY>`. Discovery and `tools/list` remain non-mutating and may be read without claiming a ticket.

1. Call MCP tool `r44_claim` with one stable opaque `workerId` for the chat.
2. D1 atomically assigns one ticket and returns its exact entries (normally 5; the final ticket can contain fewer), frozen content, `ticketId`, `leaseToken`, and a five-minute lease.
3. Audit/correct exactly the assigned entries using R33 evidence standards and APA 7.
4. Call MCP tool `r44_submit` with that exact `ticketId`, `leaseToken`, and `entries` array. Each object must contain its exact `code` and may contain `correctedContent`, `evidence`, `sources`, `claims`, and `notes`.
5. Completion is durable only when the tool returns `AUDITED_DURABLE` (or idempotent `RESULT_ALREADY_SUBMITTED`) together with the SHA-256 receipt.
6. Do not call GitHub to claim, checkpoint, submit, or complete.
7. Do not call Library Emergency v2 for new ownership.
8. Do not use TinyFish or another paid browser runner for R44.
9. `AUDITED_DURABLE` and Cloudflare preview are not R33 VERIFIED.

The existing `/r44-worker` page and `?bridge=claim|renew|submit` routes remain compatibility paths, not the default ChatGPT transport.

### FREE fallback for ChatGPT clients without writable custom MCP

If the current ChatGPT plan/client cannot call write-capable custom MCP tools, use the repository's existing **MLS Chat Bridge** on branch `mlschatcontrol` as a transport-only fallback:

- `r44StatusChat` -> authenticated POST `/api/r44/chat-bridge/status` (non-mutating connectivity/status probe)
- `r44ClaimChat` -> authenticated POST `/api/r44/chat-bridge/claim`
- `r44RenewChat` -> authenticated POST `/api/r44/chat-bridge/renew`
- `r44SubmitChat` -> authenticated POST `/api/r44/chat-bridge/submit`

GitHub Actions supplies the already-provisioned `MLS_EDITORIAL_CHAT_KEY`. The response committed to the public control branch contains only a `bridgeSessionId`; the R44 `leaseToken` stays in D1 and is never written to GitHub. D1 remains authoritative for claim, lease fencing and durable submit.

This fallback is **FREE ONLY** and may be used only while standard GitHub-hosted runners for this public repository remain unbilled. Never substitute TinyFish or another paid runner.

Example result shape:

```json
{
  "entries": [
    {
      "code": "MLS-Vxx-xxxx",
      "correctedContent": {},
      "sources": [],
      "claims": [],
      "notes": ""
    }
  ],
  "summary": "",
  "editorialStatus": "PENDING_CANONICAL_R33_VALIDATION"
}
```

The array must contain all assigned codes exactly once.


## Durable entry protocol (44.1)

Checkpoint every completed entry using r44_checkpoint (MCP) or POST /api/r44/chat-bridge/checkpoint (authenticated bridge). Keep worker, ticket, generation and idempotency keys. SESSION_NOT_FOUND requires rebind/reconcile of the same ticket; recovery never claims new work. Only confirmed receipts authorize AUDITED_DURABLE. Full-ticket submit remains a compatibility operation. See [durable checkpoints](26%20R44%20Durable%20Entry%20Checkpoints.md).
