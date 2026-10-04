# MLS Unified: 5–50 logical runners

The panel stores exactly one of 5, 10, 15, 20, 25, 30, 35, 40, 45 or 50 in
`mls_unified_runner_config` in the existing WIKI_DB D1 database. The default is 5.
Use **Aplicar concurrencia** to save; the next five-minute cron wakes the selected
slots. Existing selected slots continue between cron invocations. Reducing the
selection lets an entry already being audited checkpoint, then retires its slot.
Pause/stop prevents subsequent entry execution. Remaining partial tickets retain
their durable receipts and return through the existing R44 recovery mechanism.

`configured_runners` is the requested capacity. `active_runners` counts unexpired
D1 execution locks, including any slots draining after a reduction. Idle, paused,
quota-limited or capacity-limited slots do not count as executing. A process lost
without releasing its lock can remain counted until its 14-minute lock expires.
The panel preserves an unsaved selection during automatic status refreshes.

## Scheduling and compatibility

The SQLite-backed `MLS_UNIFIED_RUNNERS` Durable Object binding arms one independent
alarm per logical slot. Its local storage contains only scheduling metadata
(slot number and retry key), never editorial content, claims or lease authority.
The existing cron reconciles/wakes slots after failure or deployment. There are
no browser execution loops, external queues, paid APIs or paid fallbacks.

Slot 1 keeps `mls-unified-web-runner-v1`; slots 2–50 use stable
`mls-unified-runner-002` through `mls-unified-runner-050`. Per-slot atomic D1 locks
replace the singleton execution lock. A pre-existing legacy lock must expire or
be released before new slots acquire work. Existing counters and configuration
are preserved through additive, idempotent D1 schema initialization.

All claims still use `r44DurableClaim`, its atomic capacity check, generation
fencing and durable receipts. Other R44 clients consume the same 128-slot lease
budget. Each logical runner holds at most one live ticket. An invocation handles
at most one remaining entry; its next alarm resumes the live ticket before any
fresh ticket can be claimed. Manual `/step` now also checkpoints one entry and
accepts an optional integer `runnerId` (default 1). R33 certification and final
integration continue using their existing canonical Dispatcher lanes.

The authenticated `/control` endpoint adds `{ "action": "configure", "runners": 25 }`.
Noninteger values, strings, missing values and values outside the ten choices
are rejected with HTTP 400; authorization is checked before mutation. Existing
start/resume/pause/stop/complete actions remain available.

## FREE ONLY and validation

SQLite Durable Objects are available on Workers Free. The existing shared AI
budget and quota/policy pauses remain authoritative. Fifty configured runners
do not promise fifty continuously busy runners or unlimited free throughput.
See Cloudflare's [Durable Object Free limits](https://developers.cloudflare.com/durable-objects/platform/pricing/)
and [D1 invocation limits](https://developers.cloudflare.com/d1/platform/limits/).
Independent alarms avoid aggregating the database work of fifty runners inside
one cron invocation. The new SQLite fixture verifies the cold single-entry
control path remains below 50 D1 statements (article retrieval and AI are mocked).

`test/r44 runner concurrency.test.cjs` covers accepted/rejected settings,
authorization, persistent identities, 50 simultaneous independent claims,
duplicate-slot exclusion, downsizing, partial recovery, stale/legacy locks,
quota/policy pauses, cron/alarm execution without a browser, and a shared capacity
test with 120 existing chat leases plus only 8 admitted runner leases.

Deployment must include the new SQLite Durable Object migration
`unified-logical-runners-v2` in the overlay Wrangler configuration and the injected
`UnifiedLogicalRunner` export. Use the normal build/cutover workflow; do not deploy
only the HTML. D1's new tables initialize lazily. Production deployment and a real
Cloudflare alarm/AI smoke test are separate from local SQLite validation.
