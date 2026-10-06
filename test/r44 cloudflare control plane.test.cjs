const test = require("node:test");
const assert = require("node:assert/strict");
const { injectR44, RUNTIME } = require("../scripts/habilitar r44 cloudflare.js");

test("R44 injector adds route and is idempotent", () => {
  const fixture = 'const index_default={async fetch(request,env,_ctx){\n    const url = new URL(request.url);\n    return null;\n}};';
  const once = injectR44(fixture);
  const twice = injectR44(once);
  assert.equal(once, twice);
  assert.match(once, /\/api\/r44\//);
  assert.match(once, /handleR44\(request, env, url, _ctx\)/);
  assert.match(once, /CREATE TABLE IF NOT EXISTS r44_tickets/);
  assert.match(once, /R44_LEASE_MS = 5 \* 60 \* 1000/);
});

test("R44 runtime keeps workers off GitHub writes and results noncanonical", () => {
  assert.doesNotMatch(RUNTIME, /raw\.githubusercontent\.com/);
  assert.match(RUNTIME, /env\.ASSETS\.fetch/);
  assert.doesNotMatch(RUNTIME, /api\.github\.com\/repos/);
  assert.match(RUNTIME, /PENDING_CANONICAL_R33_VALIDATION/);
  assert.match(RUNTIME, /AUDITED_DURABLE/);
  assert.match(RUNTIME, /r44_preview_articles/);
});


test("R44 submission persists atomically and supports durable retries", () => {
  assert.match(RUNTIME, /payload.entries.length !== expected.length/);
  assert.doesNotMatch(RUNTIME, /payload.entries.length !== 5/);
  assert.match(RUNTIME, /r44_receipt_fence/);
  assert.match(RUNTIME, /r44_receipt_commit/);
  assert.match(RUNTIME, /await env\.WIKI_DB\.batch\(/);
  assert.match(RUNTIME, /RESULT_ALREADY_SUBMITTED/);
});

test("R44 production hot path is explicitly parallel across disposable chats", () => {
  assert.match(RUNTIME, /R44_MAX_ACTIVE = 128/);
  assert.match(RUNTIME, /R44_CONCURRENCY_MODE = \"PARALLEL_HOT_PATH\"/);
  assert.match(RUNTIME, /R44_GITHUB_HOT_PATH_WRITES = false/);
  assert.match(RUNTIME, /function r44WorkerShard/);
  assert.match(RUNTIME, /CASE WHEN ordinal_start >= \?7 THEN 0 ELSE 1 END, ordinal_start LIMIT 1/);
  assert.match(RUNTIME, /Promise\.all\(entries\.map\(\(entry\) => r44LoadEntry\(env, entry\)\)\)/);
  assert.match(RUNTIME, /globalProductionMutex: false/);
  assert.match(RUNTIME, /githubHotPathWrites: R44_GITHUB_HOT_PATH_WRITES/);
  assert.doesNotMatch(RUNTIME, /mls-global-dispatcher|BEGIN EXCLUSIVE|r44_global_lock/);
});

test("R44 bootstrap respects D1 bound-parameter and free-invocation limits", () => {
  assert.match(RUNTIME, /function r44SqlText/);
  assert.match(RUNTIME, /const statement = "INSERT OR IGNORE INTO r44_tickets/);
  assert.match(RUNTIME, /statement\.length > 95000/);
  assert.doesNotMatch(RUNTIME, /\.bind\(\.\.\.params\)/);
  assert.match(RUNTIME, /i \+= 50/);
});
test("R44 disposable worker exposes an idempotent chat auto bridge", () => {
  assert.match(RUNTIME, /new URLSearchParams\(location\.search\)/);
  assert.match(RUNTIME, /params\.get\("worker"\)/);
  assert.match(RUNTIME, /params\.get\("lease"\)/);
  assert.match(RUNTIME, /mode==="claim"/);
  assert.match(RUNTIME, /mode==="renew"/);
  assert.match(RUNTIME, /mode==="submit"/);
  assert.match(RUNTIME, /params\.get\("payload"\)/);
  assert.match(RUNTIME, /async function submitPayload/);
});


test("R44 server bridge lets read-only chat fetchers drive the D1 hot path", () => {
  assert.match(RUNTIME, /url\.searchParams\.get\("bridge"\)/);
  assert.match(RUNTIME, /bridge === "claim"/);
  assert.match(RUNTIME, /bridge === "renew"/);
  assert.match(RUNTIME, /bridge === "submit"/);
  assert.match(RUNTIME, /const synthetic = new Request/);
  assert.doesNotMatch(RUNTIME, /api\.github\.com\/repos/);
});


test("R44 exposes direct MCP without paid browser transport", () => {
  assert.match(RUNTIME, /R44_MCP_PROTOCOL = "2026-07-28"/);
  assert.match(RUNTIME, /R44_MCP_LEGACY_PROTOCOL = "2025-11-25"/);
  assert.match(RUNTIME, /body\.method === "server\/discover"/);
  assert.match(RUNTIME, /body\.method === "tools\/list"/);
  assert.match(RUNTIME, /body\.method === "tools\/call"/);
  assert.match(RUNTIME, /name: "r44_claim"/);
  assert.match(RUNTIME, /name: "r44_submit"/);
  assert.match(RUNTIME, /return r44McpHandle\(request, env\)/);
  assert.doesNotMatch(RUNTIME, /TinyFish/i);
});

test("R44 MCP submit requires ticket fencing and returns durable SHA-256 receipt", () => {
  assert.match(RUNTIME, /TICKET_LEASE_MISMATCH/);
  assert.match(RUNTIME, /payload: \{ entries \}/);
  assert.match(RUNTIME, /value\.status === "AUDITED_DURABLE"/);
  assert.match(RUNTIME, /value\.status === "RESULT_ALREADY_SUBMITTED"/);
  assert.match(RUNTIME, /receipt: \{ algorithm: "sha256", sha256: value\.sha256 \}/);
  assert.match(RUNTIME, /Do not report completion without a SHA-256 durable receipt/);
});

test("R44 MCP validates modern stateless protocol headers", () => {
  assert.match(RUNTIME, /MCP-Protocol-Version/);
  assert.match(RUNTIME, /Mcp-Method/);
  assert.match(RUNTIME, /Mcp-Name/);
  assert.match(RUNTIME, /HeaderMismatch/);
  assert.match(RUNTIME, /UnsupportedProtocolVersion/);
});


test("R44 free chat bridge keeps lease token server-side and requires editorial auth", () => {
  assert.match(RUNTIME, /r44_chat_bridge_sessions/);
  assert.match(RUNTIME, /MLS_EDITORIAL_CHAT_KEY/);
  assert.match(RUNTIME, /R44_CHAT_BRIDGE_AUTH_REQUIRED/);
  assert.match(RUNTIME, /bridgeSessionId/);
  assert.match(RUNTIME, /delete ticket\.lease_token/);
  assert.match(RUNTIME, /delete safeContext\.leaseToken/);
  assert.match(RUNTIME, /TICKET_SESSION_MISMATCH/);
  assert.match(RUNTIME, /GITHUB_ACTIONS_FREE_BRIDGE/);
  assert.match(RUNTIME, /receipt: \{ algorithm: "sha256", sha256: value\.sha256 \}/);
});


test("R44 MCP mutating tools require the editorial bearer secret", () => {
  assert.match(RUNTIME, /body\.method === "tools\/call"[\s\S]*r44ChatBridgeAuthorize\(request, env\)/);
  assert.match(RUNTIME, /-32001, "Unauthorized"/);
});

test("R44 chat bridge exposes an authenticated non-mutating status probe", () => {
  assert.match(RUNTIME, /async function r44ChatBridgeStatus/);
  assert.match(RUNTIME, /\/api\/r44\/chat-bridge\/status/);
  assert.match(RUNTIME, /authenticated: true/);
});
