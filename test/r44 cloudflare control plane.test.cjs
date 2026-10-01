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
