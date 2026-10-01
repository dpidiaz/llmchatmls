# MLS R44 — disposable chat command

Visible command:

`MLS R44 siguiente`

## Parallel production contract

R44 production is **not globally serialized**. Up to 128 disposable chats may hold active leases at the same time and work on different assigned tickets independently.

- A worker does not wait for another worker to finish before claiming work.
- Claims are atomically protected per ticket in D1, but worker IDs are deterministically dispersed across the complete pool using its D1 ticket count and ticket size so simultaneous chats do not all contend for the first queued row.
- Context loading for all assigned entries runs in parallel.
- Result persistence is transactional per ticket; there is no repository-wide production mutex.
- GitHub is not in the claim, renew, context, submit, recovery, or preview hot path.
- Canonical GitHub publication happens later in grouped batches and must never pause Cloudflare/D1 production.
- CAPACITY_BUSY means the 128-active-lease ceiling is temporarily full; it is not a global serialization lock.

## Worker contract

SOLO CHAT. FREE ONLY. No GitHub writes. No Work.

1. Open `https://llmchatmls.dpidiaz.workers.dev/r44-worker`.
2. Use one stable opaque worker id for that browser session.
3. Claim one ticket. D1 gives exactly the entries assigned to the ticket (normally 5; the final ticket can contain fewer) and a five-minute lease.
4. Keep the worker page open; it renews the lease every two minutes.
5. Audit/correct exactly the five assigned entries using R33 evidence standards and APA 7.
6. Produce a JSON result with exactly the assigned objects under `entries`; each object must contain its exact `code` and may contain `correctedContent`, `evidence`, `sources`, `claims`, and `notes`.
7. Submit once through the page. A successful response is `AUDITED_DURABLE`.
8. Do not call GitHub to claim, checkpoint, submit, or complete.
9. Do not call Library Emergency v2 for new ownership.
10. `AUDITED_DURABLE` and Cloudflare preview are not R33 VERIFIED.

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
