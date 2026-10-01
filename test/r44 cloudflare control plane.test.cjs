const test = require("node:test");
const assert = require("node:assert/strict");
const { injectR44, RUNTIME } = require("../scripts/habilitar r44 cloudflare.js");

test("R44 injector adds route and is idempotent", () => {
  const fixture = 'const index_default={async fetch(request,env,_ctx){\n    const url = new URL(request.url);\n    return null;\n}};';
  const once = injectR44(fixture);
  const twice = injectR44(once);
  assert.equal(once, twice);
  assert.match(once, /\/api\/r44\//);
  assert.match(once, /handleR44\(request, env, url\)/);
  assert.match(once, /CREATE TABLE IF NOT EXISTS r44_tickets/);
  assert.match(once, /R44_LEASE_MS = 5 \* 60 \* 1000/);
});

test("R44 runtime keeps workers off GitHub writes and results noncanonical", () => {
  assert.match(RUNTIME, /raw\.githubusercontent\.com/);
  assert.doesNotMatch(RUNTIME, /api\.github\.com\/repos/);
  assert.match(RUNTIME, /PENDING_CANONICAL_R33_VALIDATION/);
  assert.match(RUNTIME, /AUDITED_DURABLE/);
  assert.match(RUNTIME, /r44_preview_articles/);
});


test("R44 submission persists atomically and supports durable retries", () => {
  assert.match(RUNTIME, /const priorByLease = await env\.WIKI_DB\.prepare/);
  assert.match(RUNTIME, /const statements = \[/);
  assert.match(RUNTIME, /await env\.WIKI_DB\.batch\(statements\)/);
  assert.match(RUNTIME, /RESULT_ALREADY_SUBMITTED/);
});

test("R44 production hot path is explicitly parallel across disposable chats", () => {
  assert.match(RUNTIME, /R44_MAX_ACTIVE = 128/);
  assert.match(RUNTIME, /R44_CONCURRENCY_MODE = \"PARALLEL_HOT_PATH\"/);
  assert.match(RUNTIME, /R44_GITHUB_HOT_PATH_WRITES = false/);
  assert.match(RUNTIME, /function r44WorkerShard/);
  assert.match(RUNTIME, /ORDER BY CASE WHEN ordinal_start >= \? THEN 0 ELSE 1 END, ordinal_start LIMIT 1/);
  assert.match(RUNTIME, /Promise\.all\(entries\.map\(\(entry\) => r44LoadEntry\(env, entry\)\)\)/);
  assert.match(RUNTIME, /globalProductionMutex: false/);
  assert.match(RUNTIME, /githubHotPathWrites: R44_GITHUB_HOT_PATH_WRITES/);
  assert.doesNotMatch(RUNTIME, /mls-global-dispatcher|BEGIN EXCLUSIVE|r44_global_lock/);
});

test("R44 bootstrap respects D1 bound-parameter and free-invocation limits", () => {
  assert.match(RUNTIME, /function r44SqlText/);
  assert.match(RUNTIME, /const statement = \\"INSERT OR IGNORE INTO r44_tickets/);
  assert.match(RUNTIME, /statement\.length > 95000/);
  assert.doesNotMatch(RUNTIME, /\.bind\(\.\.\.params\)/);
  assert.match(RUNTIME, /i \+= 50/);
});
