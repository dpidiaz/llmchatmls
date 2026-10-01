# MLS R44 — disposable chat command

Visible command:

`MLS R44 siguiente`

## Worker contract

SOLO CHAT. FREE ONLY. No GitHub writes. No Work.

1. Open `https://llmchatmls.dpidiaz.workers.dev/r44-worker`.
2. Use one stable opaque worker id for that browser session.
3. Claim one ticket. D1 gives exactly five frozen entries and a five-minute lease.
4. Keep the worker page open; it renews the lease every two minutes.
5. Audit/correct exactly the five assigned entries using R33 evidence standards and APA 7.
6. Produce a JSON result with exactly five objects under `entries`; each object must contain its exact `code` and may contain `correctedContent`, `evidence`, `sources`, `claims`, and `notes`.
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

The array must contain all five assigned codes exactly once.
