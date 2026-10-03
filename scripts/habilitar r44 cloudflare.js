const fs = require("fs");

const TARGET = "src/index.js";
const ROUTE_MARKER = "    const url = new URL(request.url);";
const ROUTE = [
  ROUTE_MARKER,
  '    if (url.pathname === "/r44-worker" || url.pathname.startsWith("/api/r44/") || url.pathname.startsWith("/api/unified-runner/") || url.pathname === "/mcp") {',
  "      return handleR44(request, env, url);",
  "    }"
].join("\n");
const RUNTIME_MARKER = "// MLS R44 CLOUDFLARE CONTROL PLANE END";
const poolBytes = fs.readFileSync(require("node:path").join(__dirname, "../MLS R32 EDITORIAL/r44/pool-manifest.json"));
const poolSha = require("node:crypto").createHash("sha256").update(poolBytes).digest("hex");
const durableSql = fs.readFileSync(require("node:path").join(__dirname,"../migrations/0044_entry_checkpoints.sql"),"utf8").split('-- statement boundary').map(s=>s.trim()).filter(Boolean);
const durableSource = fs.readFileSync(require("node:path").join(__dirname,"r44 durable.js"),"utf8");
const clientSource = fs.readFileSync(require("node:path").join(__dirname,"r44 client.js"),"utf8");
const unifiedR33Source = fs.readFileSync(require("node:path").join(__dirname,"unified runner r33 runtime.js"),"utf8");
const sourceRegistryDir=require("node:path").join(__dirname,"../MLS R32 EDITORIAL/evidence git/registry/sources");
const evidenceApa=require("../MLS R32 EDITORIAL/evidence apa.js");
const sourceCatalog=fs.readdirSync(sourceRegistryDir)
  .filter(name=>name.endsWith(".json")).sort()
  .map(name=>JSON.parse(fs.readFileSync(require("node:path").join(sourceRegistryDir,name),"utf8")))
  .filter(raw=>raw&&raw.metadata&&evidenceApa.validateApaSource(raw.metadata).citationReady);
const RUNTIME = 'var MLS_R33_SOURCE_CATALOG = '+JSON.stringify(sourceCatalog)+';\n'+'var R44_DURABLE_SQL = '+JSON.stringify(durableSql)+';\nvar R44_CLIENT_SOURCE = '+JSON.stringify(clientSource)+';\n'+durableSource+'\n'+unifiedR33Source+'\n'+`var R44_POOL_SHA256 = "${poolSha}";\n` + fs.readFileSync(require("node:path").join(__dirname, "r44 runtime.js"), "utf8").replace('pool-manifest.json"', `pool-manifest.json?sha256=${poolSha}"`);

function injectR44(code) {
  let next = String(code);
  if (next.includes('if (url.pathname === "/r44-worker" || url.pathname.startsWith("/api/r44/")) {') && !next.includes('url.pathname === "/mcp"')) {
    next = next.replace('if (url.pathname === "/r44-worker" || url.pathname.startsWith("/api/r44/")) {', 'if (url.pathname === "/r44-worker" || url.pathname.startsWith("/api/r44/") || url.pathname === "/mcp") {');
  }
  if (next.includes('url.pathname.startsWith("/api/r44/")') && !next.includes('url.pathname.startsWith("/api/unified-runner/")')) {
    next = next.replace(
      'url.pathname.startsWith("/api/r44/") || url.pathname === "/mcp"',
      'url.pathname.startsWith("/api/r44/") || url.pathname.startsWith("/api/unified-runner/") || url.pathname === "/mcp"'
    );
  }
  if (!next.includes('url.pathname.startsWith("/api/r44/")')) {
    if (!next.includes(ROUTE_MARKER)) throw new Error("R44 route marker not found");
    next = next.replace(ROUTE_MARKER, ROUTE);
  }
  if (!next.includes("MLS Unified scheduled runner")) {
    const fetchMarker = "var index_default = {\n  async fetch(request, env, _ctx) {";
    const scheduled = "var index_default = {\n  // MLS Unified scheduled runner\n  async scheduled(_controller, env, ctx) {\n    ctx.waitUntil(unifiedRunnerScheduled(env));\n  },\n  async fetch(request, env, _ctx) {";
    if (!next.includes(fetchMarker)) throw new Error("Unified scheduled hook marker not found");
    next = next.replace(fetchMarker, scheduled);
  }
  const start = next.indexOf('var R44_DURABLE_SQL =');
  const legacyStart = next.indexOf('var R44_POOL_SHA256 =');
  const begin = start >= 0 ? start : legacyStart;
  const end = next.indexOf(RUNTIME_MARKER);
  if (begin >= 0 && end >= begin) next = next.slice(0,begin) + RUNTIME.trimEnd() + next.slice(end+RUNTIME_MARKER.length);
  else if (!next.includes(RUNTIME_MARKER)) next += "\n\n" + RUNTIME + "\n";

  return next;
}
if (require.main === module) {
  require('./r44 full pending corpus.cjs').validate();
  const before = fs.readFileSync(TARGET, "utf8");
  const after = injectR44(before);
  fs.writeFileSync(TARGET, after);
  console.log(after === before ? "R44 control plane already present." : "R44 Cloudflare control plane enabled.");
}
module.exports = { injectR44, RUNTIME };
