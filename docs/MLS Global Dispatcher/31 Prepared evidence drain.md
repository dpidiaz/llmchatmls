# Prepared evidence drain

The 2026-10-05 cohort in `MLS R32 EDITORIAL/r44/prepared-drain.json` records 234
distinct D1 PREPARED codes with no D1 lease. Every code has a durable R44 handoff;
none was in the canonical VERIFIED index at capture.

This is a priority manifest, not a second allocator. The existing Unified R33
provider sorts these codes first and keeps its terminal, recovery, reservation,
historical R43 isolation and active assignment fences. Certification still comes
before the existing serialized integration lane and its two global locks.

The web orchestrator requests `/api/unified-runner/prepared-evidence` for cohort
members. This authenticated endpoint returns only the saved result with an exact
input hash match. Missing or changed context yields review-required, never a new
AI request. Before deployment the endpoint returns 404, also without generating
evidence. Asset reseeding preserves PREPARED evidence and its original hash even
when input changes. Only canonical integration can retire it as VERIFIED.

Canonical runners retain their existing batches of 100. A quarantined malformed
JSON result at attempt 3 may retry once at attempt 4. Missing sources, insufficient
support and other review failures remain quarantined; this change does not certify
them or repeatedly consume quota. The panel separately shows those blocked entries
and missing R44 handoffs.

Snapshot: 4,093 pending = 234 prepared + 3,854 quarantined + 5 awaiting handoff.
The most recent R33 lane error was a GitHub installation API rate limit; the
integration pointer #5203 was already NO_WORK. Prioritization does not remove rate
limits or promise immediate integration. Count queued, certified and integrated
separately, using the canonical VERIFIED index for the last category.
