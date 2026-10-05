# Canonical quarantine recovery

This applies only to `mls_canonical_queue`, never R44 durable quarantine.
Production D1 before the change (2026-10-05): 3,847 quarantined,
0 claimable, 130 prepared. GitHub-main authority: 6,151 verified,
3,982 remaining. Category counts: 9 technical/transient, 2,439 source/context,
1,399 editorial review, 0 hash/context, 0 other.

The existing input hash remains the PREPARED lookup contract. A separate
fingerprint combines that input hash with the actual R33 candidate packet
(after handoff correction) and explicit semantic policy versions. A catalog
change outside an entry's candidates does not change its fingerprint.
Do not bump policy versions for formatting, deployment, UI or unrelated fixes.
Only bump them for a material R33 behavior change that could resolve failures.
External source changes at an unchanged URL are not polled: update the registered
source/candidates or a relevant policy version after validating the repair.

Legacy fingerprints establish a baseline without reopening editorial/source
quarantines. Later material changes make those rows recoverable, not immediately
claimable. A D1 global gate releases at most five rows per five minutes across
all runners. Releases enter RETRY with at least five minutes of backoff.
Only explicit transient reasons qualify without changed context: malformed AI
JSON, fetch transport failure, HTTP 408/429/500/502/503/504 and transient asset
HTTP errors. HTTP 403, unknown errors and hash mismatch require changed context
or review. No automatic full-text/access/policy bypass is added.

Same-context technical recovery allows at most two additional releases and fewer
than six attempts before release. Each entry has a lifetime cap of six automatic
releases, even across context changes, after which manual review is required.
The recovery history keeps reason, attempts and both fingerprints. Reopening does
not clear last_error or reset attempts. A later failure updates last_error; the
previous recovery snapshot remains in history. Success retains the last error
for diagnosis; state is authoritative.

PREPARED input/result remain intact across seed revisions and are never claimed.
VERIFIED cannot be downgraded by seed or stale in-flight results. Only the existing
GitHub-main verified-index reconciliation may promote entries to VERIFIED.
Existing R33 integration, AI free-budget enforcement and 100-entry reservations
remain unchanged. Recovery itself invokes no AI or source fetch.

Runner status exposes `canonical.quarantine` with table identity, category/reason/
attempt counts, recoverable and requiresChangeOrReview. Recoverable includes rows
awaiting backoff or the global release gate; it is not Canonical Claimable.
