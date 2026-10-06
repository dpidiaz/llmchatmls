# Cloudflare primary consolidation

Status: implementation pending deployment and production verification. This document does not certify a production cutover.

## Durable execution

Claims, renewals, epochs, entry receipts and recovery continue to use the existing R44 D1 allocator. Frozen input is packaged in Cloudflare Assets at build time and cached in D1 after hash validation. Production bootstrap and cache misses no longer fetch GitHub. The build verifies the original frozen bytes; MLS-V10-0870 and MLS-V10-0871 have pre-existing frozen hash discrepancies and remain unavailable, never silently repaired or accepted.

Cloudflare cron and Durable Object alarms wake independently of GitHub Actions. Machine status is D1-only. The authenticated browser monitor can still read canonical GitHub authority for display; that display is outside the execution path.

The deployed canonical snapshot includes WAITING_HANDOFF rows for pending articles without a published handoff. Once their R44 ticket is COMPLETE, immutable D1 receipts are normalized using the same handoff fields as the grouped exporter. A transaction persists the exact input in mls_canonical_durable_inputs and promotes the existing mls_canonical_queue row to PENDING. No second allocator is created. Concurrent promotion is idempotent by code and input hash, and an interrupted transaction leaves the receipt eligible for replay.

R33 preparation consumes these inputs through the existing fenced canonical leases, retry/quarantine rules and FREE ONLY checks. PREPARED retains its result and input identity until canonical publication succeeds. A deployment must preserve live lease fences and prepared inputs. A changed canonical article or Evidence revision requires reconciliation; the writer must not regenerate Evidence as a fallback.

## Secondary publication

The Web Runner, grouped handoff exporter, Evidence submitter and final integration jobs share the GitHub Actions concurrency group mls-unified-github-writer. Only one of these jobs writes at a time. Jobs retain their existing assignment/epoch and exact-content checks. Scheduled reconciliation replays durable work after failed or superseded job runs; GitHub Actions pending jobs are not the durable queue.

The secondary jobs consult the D1 cooldown before publication. A failed writer leaves its durable source intact and requests bounded backoff. The handoff exporter makes one publication attempt per run. The existing Web Runner records secondary-rate-limit responses and Retry-After. Canonical authority refresh is now an authenticated secondary reconciliation endpoint, not a prerequisite for waking Cloudflare workers.

The writer requests prepared Evidence only. Missing or changed context remains WAITING_PREPARATION rather than manufacturing certification or invoking AI in the sink. Canonical R33 validation and integration into main remain mandatory. The main verified.json index is the terminal authority; D1 receipts, PREPARED, and a proposed Evidence object's fields are not a VERIFIED result.

## Preserved contracts and remaining dependencies

- FREE ONLY, no TinyFish or paid fallback; existing quota/policy pauses remain.
- Existing five-entry R44 tickets and R33 microclaims, no overlapping chat leases, 128 global capacity ceiling and configured runner limits remain.
- MLS Unified siguiente N still accepts multiples of five from 100 through 1000; N does not resize a claim or global concurrency.
- GitHub remains required for source builds/deployment inputs, grouped handoff publication, canonical Dispatcher publication claims/events, R33 checks, integration and the authoritative index. Those publication leases are separate from D1 preparation leases.
- The GitHub Chat Bridge remains a compatibility transport for clients without direct writable MCP. Such clients still depend on GitHub to initiate requests; the independently running Cloudflare workers do not.
- New canonical article/source revisions require rebuilding the Cloudflare snapshot. Existing immutable snapshots continue to run during a GitHub outage.
- Unrelated historical MLS workflows retain their own serialization. The shared writer group covers the four Unified publication workflows, not every repository writer.

## Validation and rollout

Run the R44 tests, real D1 integration test, canonical build, dry-run deployment and existing cutover smoke. New behavior tests cover GitHub-unavailable receipt promotion, five concurrent preparations, transactional crash/replay, immutable/tampered receipts, and wakeup without GitHub. Existing tests cover 100 concurrent slots, capacity, lease expiry, recovery and noncanonical preparation.

Runtime and Assets changes require a Cloudflare deployment. Deploy through the existing cutover workflow only after CI succeeds; retain its Access, D1 and production status smoke. Do not label this migration deployed solely because a branch or PR exists.
