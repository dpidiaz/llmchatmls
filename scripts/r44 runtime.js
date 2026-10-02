var R44_POOL_URL = "https://raw.githubusercontent.com/dpidiaz/llmchatmls/main/MLS%20R32%20EDITORIAL/r44/pool-manifest.json";
var R44_BASE_COMMIT = "2961a29cfcb62caa9972e5dc5552037b001063a3";
var R44_LEASE_MS = 5 * 60 * 1000;
var R44_MAX_ACTIVE = 128;
var R44_POOL_SCHEMA = "MLS-R44-CLOUDFLARE-POOL-2";
var R44_CONCURRENCY_MODE = "PARALLEL_HOT_PATH";
var R44_GITHUB_HOT_PATH_WRITES = false;
var R44_MAX_RESULT_BYTES = 512 * 1024;

async function r44Sha256Text(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function r44EnsureSchema(env) {
  await env.WIKI_DB.batch([
    env.WIKI_DB.prepare("CREATE TABLE IF NOT EXISTS r44_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)"),
    env.WIKI_DB.prepare("CREATE TABLE IF NOT EXISTS r44_tickets (ticket_id TEXT PRIMARY KEY, ordinal_start INTEGER NOT NULL, ordinal_end INTEGER NOT NULL, entries_json TEXT NOT NULL, state TEXT NOT NULL DEFAULT 'queued', worker_id TEXT, lease_token TEXT UNIQUE, lease_expires_at INTEGER, attempts INTEGER NOT NULL DEFAULT 0, result_sha256 TEXT, result_stage TEXT, updated_at TEXT NOT NULL)"),
    env.WIKI_DB.prepare("CREATE INDEX IF NOT EXISTS r44_tickets_state_idx ON r44_tickets(state, ordinal_start)"),
    env.WIKI_DB.prepare("CREATE INDEX IF NOT EXISTS r44_tickets_lease_idx ON r44_tickets(lease_expires_at)"),
    env.WIKI_DB.prepare("CREATE TABLE IF NOT EXISTS r44_results (ticket_id TEXT PRIMARY KEY, lease_token TEXT, worker_id TEXT, stage TEXT NOT NULL, editorial_status TEXT NOT NULL, payload TEXT NOT NULL, sha256 TEXT NOT NULL, source TEXT NOT NULL DEFAULT 'cloudflare-chat', created_at TEXT NOT NULL)"),
    env.WIKI_DB.prepare("CREATE TABLE IF NOT EXISTS r44_entry_cache (code TEXT PRIMARY KEY, sha256 TEXT NOT NULL, content_json TEXT NOT NULL, fetched_at TEXT NOT NULL)"),
    env.WIKI_DB.prepare("CREATE TABLE IF NOT EXISTS r44_preview_articles (code TEXT PRIMARY KEY, ticket_id TEXT NOT NULL, payload_json TEXT NOT NULL, result_sha256 TEXT NOT NULL, updated_at TEXT NOT NULL)"),
    env.WIKI_DB.prepare("CREATE TABLE IF NOT EXISTS r44_events (id INTEGER PRIMARY KEY AUTOINCREMENT, ticket_id TEXT, event_type TEXT NOT NULL, worker_id TEXT, lease_token TEXT, detail TEXT, created_at TEXT NOT NULL)"),
    env.WIKI_DB.prepare("CREATE TABLE IF NOT EXISTS r44_chat_bridge_sessions (session_id TEXT PRIMARY KEY, ticket_id TEXT NOT NULL, worker_id TEXT NOT NULL, lease_token TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)")
  ]);
}
async function r44PoolSeed(env) {
  await r44EnsureSchema(env);
  const metadata = await env.WIKI_DB.prepare("SELECT key,value FROM r44_meta").all();
  const meta = Object.fromEntries((metadata.results || []).map(r => [r.key,r.value]));
  if (meta.pool_schema === R44_POOL_SCHEMA) {
    const ticketCount = Number(meta.pool_ticket_count), ticketSize = Number(meta.pool_ticket_size);
    if (!Number.isSafeInteger(ticketCount) || ticketCount < 1 || !Number.isSafeInteger(ticketSize) || ticketSize < 1) throw new Error("R44_POOL_META_INVALID");
    return {ticketCount,ticketSize};
  }
  const response = await fetch(R44_POOL_URL, { cf: { cacheEverything: true, cacheTtl: 3600 } });
  if (!response.ok) throw new Error("R44_POOL_FETCH_" + response.status);
  const text = await response.text();
  if (await r44Sha256Text(text) !== R44_POOL_SHA256) throw new Error("R44_POOL_HASH_MISMATCH");
  const pool = JSON.parse(text);
  if (!pool || pool.schema !== R44_POOL_SCHEMA || !Array.isArray(pool.tickets) || pool.tickets.length !== pool.ticketCount) {
    throw new Error("R44_POOL_INVALID");
  }
  const before = await env.WIKI_DB.prepare("SELECT ticket_id,ordinal_start,ordinal_end,entries_json FROM r44_tickets ORDER BY ordinal_start").all();
  const present = new Set((before.results || []).map(t=>t.ticket_id));
  r44VerifyPoolRows(pool,before.results || [],false);
  // At most ten 50-ticket statements per invocation. A retry resumes from D1.
  const missing = pool.tickets.filter(t=>!present.has(t.id)).slice(0,500);
  const imports = new Map((pool.imports || []).map(item=>[item.ticketId,item]));
  const now = new Date().toISOString();
  for (let i = 0; i < missing.length; i += 50) {
    const chunk = missing.slice(i, i + 50);
    const values = chunk.map((ticket) => "(" + [
      r44SqlText(ticket.id),
      String(Number(ticket.ordinalStart)),
      String(Number(ticket.ordinalEnd)),
      r44SqlText(JSON.stringify(ticket.entries)),
      r44SqlText(ticket.initialState || "queued"),
      r44SqlText(now),
      imports.has(ticket.id) ? r44SqlText(imports.get(ticket.id).resultSha256) : "NULL",
      imports.has(ticket.id) ? r44SqlText(imports.get(ticket.id).stage || "audited") : "NULL",
      imports.has(ticket.id) ? r44SqlText(imports.get(ticket.id).worker || null) : "NULL"
    ].join(",") + ")").join(",");
    const statement = "INSERT OR IGNORE INTO r44_tickets(ticket_id,ordinal_start,ordinal_end,entries_json,state,updated_at,result_sha256,result_stage,worker_id) VALUES " + values;
    if (statement.length > 95000) throw new Error("R44_POOL_SEED_STATEMENT_TOO_LARGE");
    await env.WIKI_DB.prepare(statement).run();
  }
  for (const item of pool.imports || []) {
    await env.WIKI_DB.prepare("INSERT OR IGNORE INTO r44_results(ticket_id,lease_token,worker_id,stage,editorial_status,payload,sha256,source,created_at) SELECT ?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM r44_tickets WHERE ticket_id=? AND state='audited' AND result_sha256=?)")
      .bind(item.ticketId, null, item.worker || null, item.stage || "audited", item.editorialStatus || "PENDING_CANONICAL_R33_VALIDATION", JSON.stringify({ resultMarkdown: item.resultMarkdown || "", imported: true }), item.resultSha256, item.source || "migration", now,item.ticketId,item.resultSha256).run();
  }
  const after = await env.WIKI_DB.prepare("SELECT ticket_id,ordinal_start,ordinal_end,entries_json FROM r44_tickets ORDER BY ordinal_start").all();
  r44VerifyPoolRows(pool,after.results || [],false);
  if (after.results.length !== pool.ticketCount) throw new Error("R44_POOL_MIGRATION_IN_PROGRESS");
  r44VerifyPoolRows(pool,after.results,true);
  await env.WIKI_DB.batch([
    env.WIKI_DB.prepare("INSERT OR REPLACE INTO r44_meta(key,value) VALUES('pool_schema',?)").bind(pool.schema),
    env.WIKI_DB.prepare("INSERT OR REPLACE INTO r44_meta(key,value) VALUES('pool_generated_at',?)").bind(String(pool.generatedAt || "")),
    env.WIKI_DB.prepare("INSERT OR REPLACE INTO r44_meta(key,value) VALUES('base_commit',?)").bind(String(pool.source && pool.source.emergencyBaseCommit || R44_BASE_COMMIT)),
    env.WIKI_DB.prepare("INSERT OR REPLACE INTO r44_meta(key,value) VALUES('pool_ticket_count',?)").bind(String(pool.ticketCount)),
    env.WIKI_DB.prepare("INSERT OR REPLACE INTO r44_meta(key,value) VALUES('pool_entry_count',?)").bind(String(pool.entryCount)),
    env.WIKI_DB.prepare("INSERT OR REPLACE INTO r44_meta(key,value) VALUES('pool_ticket_size',?)").bind(String(pool.ticketSize)),
    env.WIKI_DB.prepare("INSERT OR REPLACE INTO r44_meta(key,value) VALUES('pool_manifest_sha256',?)").bind(R44_POOL_SHA256),
    env.WIKI_DB.prepare("INSERT OR REPLACE INTO r44_meta(key,value) VALUES('content_manifest_blob',?)").bind(pool.source.contentManifestBlob),
    env.WIKI_DB.prepare("INSERT OR REPLACE INTO r44_meta(key,value) VALUES('cutover_mode','cloudflare-d1')")
  ]);
  return {ticketCount:pool.ticketCount,ticketSize:pool.ticketSize};
}
function r44VerifyPoolRows(pool,rows,complete) {
  const expected = new Map(pool.tickets.map(t=>[t.id,t]));
  const codes = new Set();
  for (const row of rows) {
    const ticket = expected.get(row.ticket_id);
    if (!ticket || row.ordinal_start !== ticket.ordinalStart || row.ordinal_end !== ticket.ordinalEnd || JSON.stringify(JSON.parse(row.entries_json)) !== JSON.stringify(ticket.entries)) throw new Error("R44_POOL_EXISTING_SCOPE_MISMATCH");
    for (const entry of JSON.parse(row.entries_json)) {
      if (codes.has(entry.code)) throw new Error("R44_POOL_DUPLICATE_CODE");
      codes.add(entry.code);
    }
  }
  if (complete && (rows.length !== pool.ticketCount || codes.size !== pool.entryCount)) throw new Error("R44_POOL_UNIVERSE_MISMATCH");
}
function r44Json(data, status = 200) {
  return Response.json(data, { status, headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } });
}
function r44SqlText(value) {
  return "'" + String(value == null ? "" : value).replace(/'/g, "''") + "'";
}
function r44WorkerId(value) {
  const clean = String(value || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80);
  return clean || ("r44-" + crypto.randomUUID().replace(/-/g, ""));
}
function r44WorkerShard(workerId, ticketCount, ticketSize) {
  let hash = 2166136261;
  const value = String(workerId || "");
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return (hash % ticketCount) * ticketSize + 1;
}
async function r44Claim(env, workerId) {
  const pool = await r44PoolSeed(env);
  const now = Date.now();
  const startOrdinal = r44WorkerShard(workerId, pool.ticketCount, pool.ticketSize);
  const existing = await env.WIKI_DB.prepare("SELECT ticket_id,ordinal_start,ordinal_end,entries_json,lease_token,lease_expires_at,attempts FROM r44_tickets WHERE state='leased' AND worker_id=? AND lease_expires_at>? ORDER BY updated_at DESC LIMIT 1").bind(workerId, now).first();
  if (existing) return { status: "LEASE_REUSED", workerId, productionMode: R44_CONCURRENCY_MODE, ticket: existing };
  const active = await env.WIKI_DB.prepare("SELECT COUNT(*) AS n FROM r44_tickets WHERE state='leased' AND lease_expires_at>?").bind(now).first();
  if (Number(active && active.n || 0) >= R44_MAX_ACTIVE) return { status: "CAPACITY_BUSY", workerId, productionMode: R44_CONCURRENCY_MODE, maxActive: R44_MAX_ACTIVE };
  const token = crypto.randomUUID();
  const expires = now + R44_LEASE_MS;
  const stamp = new Date(now).toISOString();
  const result = await env.WIKI_DB.prepare("UPDATE r44_tickets SET state='leased',worker_id=?,lease_token=?,lease_expires_at=?,attempts=attempts+1,updated_at=? WHERE ticket_id=(SELECT ticket_id FROM r44_tickets WHERE state='queued' OR (state='leased' AND lease_expires_at<=?) ORDER BY CASE WHEN ordinal_start >= ? THEN 0 ELSE 1 END, ordinal_start LIMIT 1) AND (state='queued' OR (state='leased' AND lease_expires_at<=?)) RETURNING ticket_id,ordinal_start,ordinal_end,entries_json,lease_token,lease_expires_at,attempts")
    .bind(workerId, token, expires, stamp, now, startOrdinal, now).first();
  if (!result) {
    const counts = await r44Counts(env);
    return { status: counts.queued === 0 && counts.recoverable === 0 ? "NO_WORK" : "CLAIM_RETRY", workerId, counts };
  }
  await env.WIKI_DB.prepare("INSERT INTO r44_events(ticket_id,event_type,worker_id,lease_token,detail,created_at) VALUES(?,?,?,?,?,?)")
    .bind(result.ticket_id, "CLAIM", workerId, token, "ttl=300;mode=parallel;startOrdinal=" + startOrdinal, stamp).run();
  return { status: "CLAIMED", workerId, productionMode: R44_CONCURRENCY_MODE, startOrdinal, ticket: result };
}
async function r44Counts(env) {
  const now = Date.now();
  const rows = await env.WIKI_DB.prepare("SELECT state,COUNT(*) AS n FROM r44_tickets GROUP BY state").all();
  const counts = { queued: 0, leased: 0, audited: 0, verified: 0, quarantined: 0, recoverable: 0 };
  for (const row of rows.results || []) counts[row.state] = Number(row.n || 0);
  const rec = await env.WIKI_DB.prepare("SELECT COUNT(*) AS n FROM r44_tickets WHERE state='leased' AND lease_expires_at<=?").bind(now).first();
  counts.recoverable = Number(rec && rec.n || 0);
  return counts;
}
async function r44LoadEntry(env, entry) {
  const cached = await env.WIKI_DB.prepare("SELECT content_json,sha256 FROM r44_entry_cache WHERE code=?").bind(entry.code).first();
  if (cached && cached.sha256 === entry.sha256) return JSON.parse(cached.content_json);
  const encodedPath = String(entry.path).split("/").map(encodeURIComponent).join("/");
  const url = "https://raw.githubusercontent.com/dpidiaz/llmchatmls/" + R44_BASE_COMMIT + "/content/" + encodedPath;
  const response = await fetch(url, { cf: { cacheEverything: true, cacheTtl: 86400 } });
  if (!response.ok) throw new Error("R44_CONTEXT_FETCH_" + entry.code + "_" + response.status);
  const text = await response.text();
  const hash = await r44Sha256Text(text);
  if (hash !== entry.sha256) throw new Error("R44_CONTEXT_HASH_MISMATCH_" + entry.code);
  JSON.parse(text);
  await env.WIKI_DB.prepare("INSERT OR REPLACE INTO r44_entry_cache(code,sha256,content_json,fetched_at) VALUES(?,?,?,?)")
    .bind(entry.code, entry.sha256, text, new Date().toISOString()).run();
  return JSON.parse(text);
}
async function r44Context(env, token) {
  await r44PoolSeed(env);
  const now = Date.now();
  const row = await env.WIKI_DB.prepare("SELECT ticket_id,worker_id,entries_json,lease_expires_at FROM r44_tickets WHERE state='leased' AND lease_token=? AND lease_expires_at>?").bind(token, now).first();
  if (!row) return null;
  const entries = JSON.parse(row.entries_json);
  const content = await Promise.all(entries.map((entry) => r44LoadEntry(env, entry)));
  return { ticketId: row.ticket_id, workerId: row.worker_id, leaseToken: token, leaseExpiresAt: row.lease_expires_at, entries, content };
}
async function r44Renew(env, token) {
  await r44PoolSeed(env);
  const now = Date.now();
  const expires = now + R44_LEASE_MS;
  const result = await env.WIKI_DB.prepare("UPDATE r44_tickets SET lease_expires_at=?,updated_at=? WHERE state='leased' AND lease_token=? AND lease_expires_at>? RETURNING ticket_id,worker_id,lease_expires_at")
    .bind(expires, new Date(now).toISOString(), token, now).first();
  if (!result) return null;
  return result;
}
function r44SameCodes(expected, submitted) {
  const a = expected.map((x) => String(x.code).toUpperCase()).sort();
  const b = submitted.map((x) => String(x && x.code || "").toUpperCase()).sort();
  return a.length === b.length && a.every((x, i) => x === b[i]);
}
async function r44Submit(request, env) {
  await r44PoolSeed(env);
  const length = Number(request.headers.get("content-length") || 0);
  if (length > R44_MAX_RESULT_BYTES) return r44Json({ error: "RESULT_TOO_LARGE" }, 413);
  const body = await request.json();
  const token = String(body && body.leaseToken || "");
  const payload = body && body.payload;
  if (!token || !payload || !Array.isArray(payload.entries)) return r44Json({ error: "INVALID_RESULT_PAYLOAD" }, 400);
  const normalized = JSON.stringify(payload);
  const sha = await r44Sha256Text(normalized);
  const priorByLease = await env.WIKI_DB.prepare("SELECT ticket_id,sha256 FROM r44_results WHERE lease_token=?").bind(token).first();
  if (priorByLease) return r44Json({ status: priorByLease.sha256 === sha ? "RESULT_ALREADY_SUBMITTED" : "RESULT_CONFLICT", ticketId: priorByLease.ticket_id, sha256: priorByLease.sha256 }, priorByLease.sha256 === sha ? 200 : 409);
  const now = Date.now();
  const ticket = await env.WIKI_DB.prepare("SELECT ticket_id,worker_id,entries_json,lease_expires_at FROM r44_tickets WHERE state='leased' AND lease_token=? AND lease_expires_at>?").bind(token, now).first();
  if (!ticket) return r44Json({ error: "LEASE_INVALID_OR_EXPIRED" }, 409);
  const expected = JSON.parse(ticket.entries_json);
  if (payload.entries.length !== expected.length || !r44SameCodes(expected, payload.entries)) return r44Json({ error: "RESULT_SCOPE_MISMATCH", expected: expected.map((x) => x.code) }, 400);
  const stamp = new Date(now).toISOString();
  const statements = [
    env.WIKI_DB.prepare("INSERT INTO r44_results(ticket_id,lease_token,worker_id,stage,editorial_status,payload,sha256,source,created_at) VALUES(?,?,?,?,?,?,?,?,?)")
      .bind(ticket.ticket_id, token, ticket.worker_id, "audited", "PENDING_CANONICAL_R33_VALIDATION", normalized, sha, "cloudflare-chat", stamp),
    ...payload.entries.map((entry) =>
      env.WIKI_DB.prepare("INSERT OR REPLACE INTO r44_preview_articles(code,ticket_id,payload_json,result_sha256,updated_at) VALUES(?,?,?,?,?)")
        .bind(String(entry.code).toUpperCase(), ticket.ticket_id, JSON.stringify(entry), sha, stamp)
    ),
    env.WIKI_DB.prepare("UPDATE r44_tickets SET state='audited',result_sha256=?,result_stage='audited',lease_token=NULL,lease_expires_at=NULL,updated_at=? WHERE ticket_id=? AND lease_token=?").bind(sha, stamp, ticket.ticket_id, token),
    env.WIKI_DB.prepare("INSERT INTO r44_events(ticket_id,event_type,worker_id,lease_token,detail,created_at) VALUES(?,?,?,?,?,?)").bind(ticket.ticket_id, "RESULT", ticket.worker_id, token, sha, stamp)
  ];
  try {
    await env.WIKI_DB.batch(statements);
  } catch (error) {
    const prior = await env.WIKI_DB.prepare("SELECT ticket_id,sha256 FROM r44_results WHERE lease_token=? OR ticket_id=? LIMIT 1").bind(token, ticket.ticket_id).first();
    if (prior) return r44Json({ status: prior.sha256 === sha ? "RESULT_ALREADY_SUBMITTED" : "RESULT_CONFLICT", ticketId: prior.ticket_id, sha256: prior.sha256 }, prior.sha256 === sha ? 200 : 409);
    throw error;
  }
  return r44Json({ status: "AUDITED_DURABLE", ticketId: ticket.ticket_id, sha256: sha, editorialStatus: "PENDING_CANONICAL_R33_VALIDATION" });
}
async function r44Status(env) {
  await r44PoolSeed(env);
  const counts = await r44Counts(env);
  const metaRows = await env.WIKI_DB.prepare("SELECT key,value FROM r44_meta").all();
  return { status: "ACTIVE", controlPlane: "CLOUDFLARE_D1", productionMode: R44_CONCURRENCY_MODE, globalProductionMutex: false, githubHotPathWrites: R44_GITHUB_HOT_PATH_WRITES, leaseTtlSeconds: 300, maxActiveLeases: R44_MAX_ACTIVE, mcpEndpoint: "/mcp", mcpProtocol: R44_MCP_PROTOCOL, counts, meta: Object.fromEntries((metaRows.results || []).map((r) => [r.key, r.value])) };
}
async function r44Export(env, limit) {
  await r44PoolSeed(env);
  const n = Math.max(1, Math.min(200, Number(limit || 50)));
  const rows = await env.WIKI_DB.prepare("SELECT t.ticket_id,t.ordinal_start,t.ordinal_end,t.entries_json,t.result_sha256,t.result_stage,r.worker_id,r.stage,r.editorial_status,r.payload,r.sha256,r.source,r.created_at FROM r44_tickets t JOIN r44_results r ON r.ticket_id=t.ticket_id WHERE t.state='audited' ORDER BY t.ordinal_start LIMIT ?").bind(n).all();
  return rows.results || [];
}
async function r44Preview(env, code) {
  await r44PoolSeed(env);
  const row = await env.WIKI_DB.prepare("SELECT code,ticket_id,payload_json,result_sha256,updated_at FROM r44_preview_articles WHERE code=?").bind(code).first();
  if (!row) return null;
  return { code: row.code, ticketId: row.ticket_id, resultSha256: row.result_sha256, updatedAt: row.updated_at, entry: JSON.parse(row.payload_json) };
}
function r44WorkerPage() {
  return '<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MLS R44 Worker</title><style>body{font:16px system-ui;max-width:1100px;margin:24px auto;padding:0 16px}button{padding:10px 14px;margin:4px}pre,textarea{width:100%;box-sizing:border-box;background:#f5f5f5;border:1px solid #ccc;padding:12px;white-space:pre-wrap}textarea{min-height:320px}code{font-family:ui-monospace,monospace}</style></head><body><h1>MLS R44 Cloudflare Worker</h1><p>Claim atómico en D1. TTL 5 min con heartbeat automático. Resultado queda AUDITED/PENDING_CANONICAL_R33_VALIDATION.</p><button id="claim">Claim siguiente</button><button id="reload">Recargar contexto</button><div id="state"></div><h2>Contexto congelado</h2><pre id="ctx">Sin claim.</pre><h2>Resultado JSON</h2><p>Debe contener <code>{"entries":[{"code":"MLS-..."} ... ]}</code>. Incluya exactamente las entradas asignadas al ticket (normalmente 5; el ticket final puede contener menos). Cada entrada puede incluir correctedContent, evidence, sources y notes.</p><textarea id="result"></textarea><br><button id="submit">Guardar resultado</button><pre id="out"></pre><script>const params=new URLSearchParams(location.search),state=document.getElementById("state"),ctx=document.getElementById("ctx"),out=document.getElementById("out"),ta=document.getElementById("result");let lease=params.get("lease")||localStorage.getItem("mls-r44-lease")||"";let worker=params.get("worker")||localStorage.getItem("mls-r44-worker")||("r44-"+crypto.randomUUID().replaceAll("-",""));localStorage.setItem("mls-r44-worker",worker);if(lease)localStorage.setItem("mls-r44-lease",lease);async function context(){if(!lease)return;let r=await fetch("/api/r44/context/"+encodeURIComponent(lease),{cache:"no-store"});let j=await r.json();ctx.textContent=JSON.stringify(j,null,2);state.textContent=j.ticketId?("Ticket "+j.ticketId+" — worker "+worker):JSON.stringify(j);return j}async function claim(){let r=await fetch("/api/r44/claim?worker="+encodeURIComponent(worker),{method:"POST",cache:"no-store"});let j=await r.json();out.textContent=JSON.stringify(j,null,2);if(j.ticket&&j.ticket.lease_token){lease=j.ticket.lease_token;localStorage.setItem("mls-r44-lease",lease);await context()}return j}document.getElementById("claim").onclick=claim;document.getElementById("reload").onclick=context;async function submitPayload(payload){if(!lease)return {error:"NO_LEASE"};let r=await fetch("/api/r44/submit",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({leaseToken:lease,payload})});let j=await r.json();out.textContent=JSON.stringify(j,null,2);if(r.ok&&j.status==="AUDITED_DURABLE"){localStorage.removeItem("mls-r44-lease");lease=""}return j}document.getElementById("submit").onclick=async()=>{if(!lease)return alert("Sin lease");let payload;try{payload=JSON.parse(ta.value)}catch(e){return alert("JSON inválido")};await submitPayload(payload)};async function renew(){if(!lease)return {error:"NO_LEASE"};let r=await fetch("/api/r44/renew?lease="+encodeURIComponent(lease),{method:"POST",cache:"no-store"});let j=await r.json();out.textContent=JSON.stringify(j,null,2);return j}async function autoMode(){let mode=params.get("auto")||"";if(mode==="claim"){await claim();return}if(mode==="renew"){await renew();return}if(mode==="submit"){let payload;try{payload=JSON.parse(params.get("payload")||"")}catch(e){out.textContent=JSON.stringify({error:"INVALID_AUTO_PAYLOAD"},null,2);return}await submitPayload(payload);return}await context()}setInterval(async()=>{if(lease)await fetch("/api/r44/renew?lease="+encodeURIComponent(lease),{method:"POST",cache:"no-store"}).catch(()=>{})},120000);autoMode();</script></body></html>';
}


async function r44ChatBridgeAuthorize(request, env) {
  const secret = String(env.MLS_EDITORIAL_CHAT_KEY || "");
  if (secret.length < 32) return { ok: false, status: 503, error: "R44_CHAT_BRIDGE_AUTH_NOT_CONFIGURED" };
  const auth = String(request.headers.get("authorization") || "");
  if (!auth.startsWith("Bearer ") || auth.length > 1024) return { ok: false, status: 401, error: "R44_CHAT_BRIDGE_AUTH_REQUIRED" };
  const a = await r44Sha256Text(auth.slice(7));
  const b = await r44Sha256Text(secret);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff ? { ok: false, status: 401, error: "R44_CHAT_BRIDGE_AUTH_INVALID" } : { ok: true };
}
async function r44ChatBridgeBody(request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > R44_MAX_RESULT_BYTES) throw new Error("R44_CHAT_BRIDGE_BODY_TOO_LARGE");
  try {
    const value = await request.json();
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch (_) {
    throw new Error("R44_CHAT_BRIDGE_JSON_INVALID");
  }
}
async function r44ChatBridgeStatus(request, env) {
  const auth = await r44ChatBridgeAuthorize(request, env);
  if (!auth.ok) return r44Json({ error: auth.error }, auth.status);
  const status = await r44Status(env);
  return r44Json({ ...status, transport: "GITHUB_ACTIONS_FREE_BRIDGE", authenticated: true });
}
async function r44ChatBridgeClaim(request, env) {
  const auth = await r44ChatBridgeAuthorize(request, env);
  if (!auth.ok) return r44Json({ error: auth.error }, auth.status);
  const body = await r44ChatBridgeBody(request);
  const workerId = r44WorkerId(body.workerId);
  const claim = await r44Claim(env, workerId);
  if (!claim.ticket || !claim.ticket.lease_token) {
    return r44Json({ status: claim.status, workerId, counts: claim.counts || null, maxActive: claim.maxActive || null }, claim.status === "CAPACITY_BUSY" ? 429 : 200);
  }
  const leaseToken = claim.ticket.lease_token;
  const context = await r44Context(env, leaseToken);
  if (!context) return r44Json({ error: "LEASE_INVALID_OR_EXPIRED" }, 409);
  const prior = await env.WIKI_DB.prepare("SELECT session_id FROM r44_chat_bridge_sessions WHERE lease_token=?").bind(leaseToken).first();
  const bridgeSessionId = prior && prior.session_id || ("r44b-" + crypto.randomUUID());
  const stamp = new Date().toISOString();
  if (!prior) {
    await env.WIKI_DB.prepare("INSERT INTO r44_chat_bridge_sessions(session_id,ticket_id,worker_id,lease_token,created_at,updated_at) VALUES(?,?,?,?,?,?)")
      .bind(bridgeSessionId, context.ticketId, workerId, leaseToken, stamp, stamp).run();
  } else {
    await env.WIKI_DB.prepare("UPDATE r44_chat_bridge_sessions SET updated_at=? WHERE session_id=?").bind(stamp, bridgeSessionId).run();
  }
  const ticket = { ...claim.ticket };
  delete ticket.lease_token;
  const safeContext = { ...context };
  delete safeContext.leaseToken;
  return r44Json({
    status: claim.status,
    transport: "GITHUB_ACTIONS_FREE_BRIDGE",
    bridgeSessionId,
    workerId,
    ticket,
    context: safeContext,
    leaseTtlSeconds: 300
  });
}
async function r44ChatBridgeSession(env, sessionId) {
  const clean = String(sessionId || "");
  if (!/^r44b-[A-Za-z0-9-]{20,80}$/.test(clean)) return null;
  return env.WIKI_DB.prepare("SELECT session_id,ticket_id,worker_id,lease_token FROM r44_chat_bridge_sessions WHERE session_id=?").bind(clean).first();
}
async function r44ChatBridgeRenew(request, env) {
  const auth = await r44ChatBridgeAuthorize(request, env);
  if (!auth.ok) return r44Json({ error: auth.error }, auth.status);
  const body = await r44ChatBridgeBody(request);
  const session = await r44ChatBridgeSession(env, body.bridgeSessionId);
  if (!session) return r44Json({ error: "R44_CHAT_BRIDGE_SESSION_NOT_FOUND" }, 404);
  const renewed = await r44Renew(env, session.lease_token);
  if (!renewed) return r44Json({ error: "LEASE_INVALID_OR_EXPIRED", bridgeSessionId: session.session_id, ticketId: session.ticket_id }, 409);
  await env.WIKI_DB.prepare("UPDATE r44_chat_bridge_sessions SET updated_at=? WHERE session_id=?").bind(new Date().toISOString(), session.session_id).run();
  return r44Json({ status: "RENEWED", bridgeSessionId: session.session_id, ticketId: session.ticket_id, leaseExpiresAt: renewed.lease_expires_at });
}
async function r44ChatBridgeSubmit(request, env) {
  const auth = await r44ChatBridgeAuthorize(request, env);
  if (!auth.ok) return r44Json({ error: auth.error }, auth.status);
  const body = await r44ChatBridgeBody(request);
  const session = await r44ChatBridgeSession(env, body.bridgeSessionId);
  if (!session) return r44Json({ error: "R44_CHAT_BRIDGE_SESSION_NOT_FOUND" }, 404);
  const ticketId = String(body.ticketId || "");
  const entries = body.entries;
  if (!ticketId || ticketId !== session.ticket_id) return r44Json({ error: "TICKET_SESSION_MISMATCH", ticketId: session.ticket_id }, 409);
  if (!Array.isArray(entries)) return r44Json({ error: "INVALID_RESULT_PAYLOAD" }, 400);

  // If the nominal five-minute window elapsed but nobody reclaimed the exact
  // fenced lease, safely revive that same lease before submit. This never
  // steals a ticket whose lease token has already changed.
  const now = Date.now();
  const active = await env.WIKI_DB.prepare("SELECT lease_expires_at FROM r44_tickets WHERE state='leased' AND ticket_id=? AND lease_token=?").bind(ticketId, session.lease_token).first();
  if (active && Number(active.lease_expires_at || 0) <= now) {
    await env.WIKI_DB.prepare("UPDATE r44_tickets SET lease_expires_at=?,updated_at=? WHERE state='leased' AND ticket_id=? AND lease_token=?")
      .bind(now + R44_LEASE_MS, new Date(now).toISOString(), ticketId, session.lease_token).run();
  }

  const synthetic = new Request("https://r44.internal/api/r44/submit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ leaseToken: session.lease_token, payload: { entries } })
  });
  const response = await r44Submit(synthetic, env);
  const value = await response.json();
  const durable = (value.status === "AUDITED_DURABLE" || value.status === "RESULT_ALREADY_SUBMITTED") && Boolean(value.sha256);
  if (durable) {
    await env.WIKI_DB.prepare("DELETE FROM r44_chat_bridge_sessions WHERE session_id=?").bind(session.session_id).run();
    return r44Json({ ...value, durable: true, bridgeSessionId: session.session_id, receipt: { algorithm: "sha256", sha256: value.sha256 } }, response.status);
  }
  return r44Json({ ...value, durable: false, bridgeSessionId: session.session_id }, response.status);
}

var R44_MCP_PROTOCOL = "2026-07-28";
var R44_MCP_LEGACY_PROTOCOL = "2025-11-25";
var R44_MCP_SERVER_INFO = { name: "mls-r44", version: "44.0" };
var R44_MCP_TOOLS = [
  {
    name: "r44_claim",
    title: "Claim next MLS R44 ticket",
    description: "Atomically claim the next R44 ticket in Cloudflare D1 and return its frozen entry context. A ticket normally contains five entries and the lease lasts 300 seconds.",
    inputSchema: {
      type: "object",
      properties: {
        workerId: { type: "string", description: "Optional stable opaque worker id for this chat." }
      },
      additionalProperties: false
    }
  },
  {
    name: "r44_submit",
    title: "Submit audited MLS R44 ticket",
    description: "Persist the audited result for exactly the entries assigned to one R44 lease. Success is durable only when the response contains AUDITED_DURABLE or RESULT_ALREADY_SUBMITTED plus a SHA-256 receipt.",
    inputSchema: {
      type: "object",
      properties: {
        leaseToken: { type: "string" },
        ticketId: { type: "string" },
        entries: {
          type: "array",
          minItems: 1,
          maxItems: 5,
          items: {
            type: "object",
            properties: { code: { type: "string" } },
            required: ["code"],
            additionalProperties: true
          }
        }
      },
      required: ["leaseToken", "ticketId", "entries"],
      additionalProperties: false
    }
  }
];

function r44McpHeaders(extra = {}) {
  return {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    ...extra
  };
}
function r44McpResponse(value, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(value), { status, headers: r44McpHeaders(extraHeaders) });
}
function r44McpError(id, code, message, data, status = 400) {
  const error = { code, message };
  if (data !== undefined) error.data = data;
  return r44McpResponse({ jsonrpc: "2.0", id: id ?? null, error }, status);
}
function r44McpMeta() {
  return { "io.modelcontextprotocol/serverInfo": R44_MCP_SERVER_INFO };
}
function r44McpResult(id, result) {
  return r44McpResponse({ jsonrpc: "2.0", id, result });
}
function r44McpToolResult(value, modern, isError = false) {
  const result = {
    content: [{ type: "text", text: JSON.stringify(value) }],
    structuredContent: value
  };
  if (isError) result.isError = true;
  if (modern) {
    result.resultType = "complete";
    result._meta = r44McpMeta();
  }
  return result;
}
function r44McpModernMeta(body) {
  const meta = body && body.params && body.params._meta;
  return meta && typeof meta === "object" ? meta : {};
}
function r44McpValidateModernHeaders(request, body) {
  const meta = r44McpModernMeta(body);
  const version = String(meta["io.modelcontextprotocol/protocolVersion"] || "");
  const headerVersion = String(request.headers.get("MCP-Protocol-Version") || "");
  const headerMethod = String(request.headers.get("Mcp-Method") || "");
  if (version !== R44_MCP_PROTOCOL || headerVersion !== R44_MCP_PROTOCOL || headerMethod !== body.method) {
    return { ok: false, message: "MCP modern headers or protocol metadata do not match the request body." };
  }
  if (body.method === "tools/call") {
    const expectedName = String(body.params && body.params.name || "");
    const headerName = String(request.headers.get("Mcp-Name") || "");
    if (!expectedName || headerName !== expectedName) {
      return { ok: false, message: "Mcp-Name must match params.name for tools/call." };
    }
  }
  return { ok: true };
}
async function r44McpCallTool(name, args, env, modern) {
  if (name === "r44_claim") {
    const workerId = r44WorkerId(args && args.workerId);
    const claim = await r44Claim(env, workerId);
    if (claim.ticket && claim.ticket.entries_json) claim.ticket.entries = JSON.parse(claim.ticket.entries_json);
    const leaseToken = claim.ticket && claim.ticket.lease_token || "";
    if (claim.ticket) delete claim.ticket.entries_json;
    const context = leaseToken ? await r44Context(env, leaseToken) : null;
    return r44McpToolResult({ status: claim.status, claim, context }, modern, claim.status === "CLAIM_RETRY");
  }
  if (name === "r44_submit") {
    const leaseToken = String(args && args.leaseToken || "");
    const ticketId = String(args && args.ticketId || "");
    const entries = args && args.entries;
    if (!leaseToken || !ticketId || !Array.isArray(entries)) {
      return r44McpToolResult({ error: "INVALID_RESULT_PAYLOAD" }, modern, true);
    }
    const prior = await env.WIKI_DB.prepare("SELECT ticket_id,sha256 FROM r44_results WHERE lease_token=?").bind(leaseToken).first();
    if (prior && prior.ticket_id !== ticketId) {
      return r44McpToolResult({ error: "TICKET_LEASE_MISMATCH", ticketId: prior.ticket_id }, modern, true);
    }
    if (!prior) {
      const active = await env.WIKI_DB.prepare("SELECT ticket_id FROM r44_tickets WHERE state='leased' AND lease_token=?").bind(leaseToken).first();
      if (active && active.ticket_id !== ticketId) {
        return r44McpToolResult({ error: "TICKET_LEASE_MISMATCH", ticketId: active.ticket_id }, modern, true);
      }
    }
    const synthetic = new Request("https://r44.internal/api/r44/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ leaseToken, payload: { entries } })
    });
    const response = await r44Submit(synthetic, env);
    const value = await response.json();
    const durable = (value.status === "AUDITED_DURABLE" || value.status === "RESULT_ALREADY_SUBMITTED") && Boolean(value.sha256);
    const result = durable
      ? { ...value, durable: true, receipt: { algorithm: "sha256", sha256: value.sha256 } }
      : { ...value, durable: false };
    return r44McpToolResult(result, modern, !durable);
  }
  return null;
}
async function r44McpHandle(request, env) {
  if (request.method !== "POST") {
    return r44McpResponse({ error: "MCP_POST_REQUIRED" }, 405, { allow: "POST, OPTIONS" });
  }
  let body;
  try {
    body = await request.json();
  } catch (_) {
    return r44McpError(null, -32700, "Parse error", undefined, 400);
  }
  if (!body || Array.isArray(body) || body.jsonrpc !== "2.0" || typeof body.method !== "string") {
    return r44McpError(body && body.id, -32600, "Invalid Request", undefined, 400);
  }
  const id = Object.prototype.hasOwnProperty.call(body, "id") ? body.id : null;
  const meta = r44McpModernMeta(body);
  const bodyVersion = String(meta["io.modelcontextprotocol/protocolVersion"] || "");
  const headerVersion = String(request.headers.get("MCP-Protocol-Version") || "");
  const modern = body.method === "server/discover" || bodyVersion === R44_MCP_PROTOCOL || headerVersion === R44_MCP_PROTOCOL;

  if (modern) {
    const valid = r44McpValidateModernHeaders(request, body);
    if (!valid.ok) return r44McpError(id, -32020, "HeaderMismatch", { detail: valid.message }, 400);
  } else if (body.method !== "initialize" && headerVersion && headerVersion !== R44_MCP_LEGACY_PROTOCOL) {
    return r44McpError(id, -32022, "UnsupportedProtocolVersion", { supportedVersions: [R44_MCP_PROTOCOL, R44_MCP_LEGACY_PROTOCOL] }, 400);
  }

  if (body.method === "server/discover") {
    return r44McpResult(id, {
      resultType: "complete",
      supportedVersions: [R44_MCP_PROTOCOL, R44_MCP_LEGACY_PROTOCOL],
      capabilities: { tools: {} },
      instructions: "Use r44_claim to obtain one D1-fenced R44 ticket, audit exactly its assigned entries, then call r44_submit with the returned ticketId and leaseToken. Do not report completion without a SHA-256 durable receipt.",
      ttlMs: 300000,
      cacheScope: "public",
      _meta: r44McpMeta()
    });
  }
  if (body.method === "initialize") {
    const requested = String(body.params && body.params.protocolVersion || R44_MCP_LEGACY_PROTOCOL);
    const negotiated = requested === R44_MCP_LEGACY_PROTOCOL ? requested : R44_MCP_LEGACY_PROTOCOL;
    return r44McpResult(id, {
      protocolVersion: negotiated,
      capabilities: { tools: { listChanged: false } },
      serverInfo: R44_MCP_SERVER_INFO,
      instructions: "Claim with r44_claim and submit with r44_submit. D1 is authoritative."
    });
  }
  if (body.method === "notifications/initialized") {
    return new Response(null, { status: 202, headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } });
  }
  if (body.method === "tools/list") {
    const result = { tools: R44_MCP_TOOLS };
    if (modern) {
      result.resultType = "complete";
      result.ttlMs = 300000;
      result.cacheScope = "public";
      result._meta = r44McpMeta();
    }
    return r44McpResult(id, result);
  }
  if (body.method === "tools/call") {
    const auth = await r44ChatBridgeAuthorize(request, env);
    if (!auth.ok) return r44McpError(id, -32001, "Unauthorized", { detail: auth.error }, auth.status);
    const name = String(body.params && body.params.name || "");
    const args = body.params && body.params.arguments || {};
    const result = await r44McpCallTool(name, args, env, modern);
    if (!result) return r44McpError(id, -32602, "Unknown tool", { name }, 400);
    return r44McpResult(id, result);
  }
  if (id === null) {
    return new Response(null, { status: 202, headers: { "cache-control": "no-store", "access-control-allow-origin": "*" } });
  }
  return r44McpError(id, -32601, "Method not found", { method: body.method }, 404);
}

async function handleR44(request, env, url) {
  try {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-methods": "GET,POST,OPTIONS", "access-control-allow-headers": "content-type,accept,mcp-protocol-version,mcp-method,mcp-name,authorization" } });
    if (url.pathname === "/mcp") return r44McpHandle(request, env);
    if (url.pathname === "/api/r44/chat-bridge/status" && request.method === "POST") return r44ChatBridgeStatus(request, env);
    if (url.pathname === "/api/r44/chat-bridge/claim" && request.method === "POST") return r44ChatBridgeClaim(request, env);
    if (url.pathname === "/api/r44/chat-bridge/renew" && request.method === "POST") return r44ChatBridgeRenew(request, env);
    if (url.pathname === "/api/r44/chat-bridge/submit" && request.method === "POST") return r44ChatBridgeSubmit(request, env);
    if (url.pathname === "/r44-worker" && request.method === "GET" && url.searchParams.get("bridge")) {
      const bridge = url.searchParams.get("bridge");
      if (bridge === "claim") {
        const workerId = r44WorkerId(url.searchParams.get("worker"));
        const claim = await r44Claim(env, workerId);
        if (claim.ticket && claim.ticket.entries_json) claim.ticket.entries = JSON.parse(claim.ticket.entries_json);
        const leaseToken = claim.ticket && claim.ticket.lease_token || "";
        if (claim.ticket) delete claim.ticket.entries_json;
        const context = leaseToken ? await r44Context(env, leaseToken) : null;
        return r44Json({ bridge: "claim", claim, context });
      }
      if (bridge === "renew") {
        const leaseToken = String(url.searchParams.get("lease") || "");
        const renewed = await r44Renew(env, leaseToken);
        return renewed ? r44Json({ bridge: "renew", status: "RENEWED", ...renewed }) : r44Json({ bridge: "renew", error: "LEASE_INVALID_OR_EXPIRED" }, 409);
      }
      if (bridge === "submit") {
        const leaseToken = String(url.searchParams.get("lease") || "");
        let payload;
        try { payload = JSON.parse(String(url.searchParams.get("payload") || "")); } catch (_) { return r44Json({ bridge: "submit", error: "INVALID_BRIDGE_PAYLOAD" }, 400); }
        const synthetic = new Request(request.url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ leaseToken, payload }) });
        return r44Submit(synthetic, env);
      }
      return r44Json({ error: "R44_BRIDGE_MODE_INVALID" }, 400);
    }
    if (url.pathname === "/r44-worker") return new Response(r44WorkerPage(), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
    if (url.pathname === "/api/r44/status" && request.method === "GET") return r44Json(await r44Status(env));
    if (url.pathname === "/api/r44/claim" && request.method === "POST") {
      const workerId = r44WorkerId(url.searchParams.get("worker"));
      const claim = await r44Claim(env, workerId);
      if (claim.ticket && claim.ticket.entries_json) claim.ticket.entries = JSON.parse(claim.ticket.entries_json);
      if (claim.ticket) delete claim.ticket.entries_json;
      return r44Json(claim, claim.status === "CAPACITY_BUSY" ? 429 : 200);
    }
    const contextMatch = url.pathname.match(/^\/api\/r44\/context\/([A-Za-z0-9-]+)$/);
    if (contextMatch && request.method === "GET") {
      const context = await r44Context(env, contextMatch[1]);
      return context ? r44Json(context) : r44Json({ error: "LEASE_INVALID_OR_EXPIRED" }, 409);
    }
    if (url.pathname === "/api/r44/renew" && request.method === "POST") {
      const renewed = await r44Renew(env, String(url.searchParams.get("lease") || ""));
      return renewed ? r44Json({ status: "RENEWED", ...renewed }) : r44Json({ error: "LEASE_INVALID_OR_EXPIRED" }, 409);
    }
    if (url.pathname === "/api/r44/submit" && request.method === "POST") return r44Submit(request, env);
    if (url.pathname === "/api/r44/export" && request.method === "GET") return r44Json(await r44Export(env, url.searchParams.get("limit")));
    const previewMatch = url.pathname.match(/^\/api\/r44\/preview\/(MLS-V\d{2}-\d{4})$/i);
    if (previewMatch && request.method === "GET") {
      const preview = await r44Preview(env, previewMatch[1].toUpperCase());
      return preview ? r44Json(preview) : r44Json({ found: false, code: previewMatch[1].toUpperCase() }, 404);
    }
    return r44Json({ error: "R44_ROUTE_NOT_FOUND" }, 404);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return r44Json({ error: "R44_CONTROL_PLANE_ERROR", message }, message === "R44_POOL_MIGRATION_IN_PROGRESS" ? 503 : 500);
  }
}
// MLS R44 CLOUDFLARE CONTROL PLANE END
