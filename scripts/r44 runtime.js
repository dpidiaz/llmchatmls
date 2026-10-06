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
async function r44Claim(env, workerId, idempotencyKey) {
  return r44DurableClaim(env,workerId,idempotencyKey || ('legacy-worker:'+workerId));
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
async function r44Context(env, token) { return r44DurableContext(env,token); }
async function r44Renew(env, token, generation) { return r44DurableRenew(env,token,generation); }
function r44SameCodes(expected, submitted) {
  const a = expected.map((x) => String(x.code).toUpperCase()).sort();
  const b = submitted.map((x) => String(x && x.code || "").toUpperCase()).sort();
  return a.length === b.length && a.every((x, i) => x === b[i]);
}
async function r44Submit(request, env) { return r44DurableSubmit(request,env); }
async function r44Status(env) {
  await r44DurableReady(env);
  const counts = await r44Counts(env);
  const durableCounts = (await env.WIKI_DB.prepare("SELECT state,COUNT(*) AS n FROM r44_ticket_progress GROUP BY state").all()).results;
  const metaRows = await env.WIKI_DB.prepare("SELECT key,value FROM r44_meta").all();
  return { status: "ACTIVE", controlPlane: "CLOUDFLARE_D1", productionMode: R44_CONCURRENCY_MODE, globalProductionMutex: false, githubHotPathWrites: R44_GITHUB_HOT_PATH_WRITES, leaseTtlSeconds: 300, maxActiveLeases: R44_MAX_ACTIVE, mcpEndpoint: "/mcp", mcpProtocol: R44_MCP_PROTOCOL, counts, durableCounts, meta: Object.fromEntries((metaRows.results || []).map((r) => [r.key, r.value])) };
}
async function r44Export(env, limit, afterOrdinal) { return r44DurableExport(env,limit,afterOrdinal); }
async function r44Preview(env, code) {
  await r44PoolSeed(env);
  const row = await env.WIKI_DB.prepare("SELECT code,ticket_id,payload_json,result_sha256,updated_at FROM r44_preview_articles WHERE code=?").bind(code).first();
  if (!row) return null;
  return { code: row.code, ticketId: row.ticket_id, resultSha256: row.result_sha256, updatedAt: row.updated_at, entry: JSON.parse(row.payload_json) };
}
function r44LegacyWorkerPage() {
  return '<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta name="viewport" content="width=device-width,initial-scale=1"><title>MLS R44 Worker</title><style>body{font:16px system-ui;max-width:1100px;margin:24px auto;padding:0 16px}button{padding:10px 14px;margin:4px}pre,textarea{width:100%;box-sizing:border-box;background:#f5f5f5;border:1px solid #ccc;padding:12px;white-space:pre-wrap}textarea{min-height:320px}code{font-family:ui-monospace,monospace}</style></head><body><h1>MLS R44 Cloudflare Worker</h1><p>Claim atómico en D1. TTL 5 min con heartbeat automático. Resultado queda AUDITED/PENDING_CANONICAL_R33_VALIDATION.</p><button id="claim">Claim siguiente</button><button id="reload">Recargar contexto</button><div id="state"></div><h2>Contexto congelado</h2><pre id="ctx">Sin claim.</pre><h2>Resultado JSON</h2><p>Debe contener <code>{"entries":[{"code":"MLS-..."} ... ]}</code>. Incluya exactamente las entradas asignadas al ticket (normalmente 5; el ticket final puede contener menos). Cada entrada puede incluir correctedContent, evidence, sources y notes.</p><textarea id="result"></textarea><br><button id="submit">Guardar resultado</button><pre id="out"></pre><script>const params=new URLSearchParams(location.search),state=document.getElementById("state"),ctx=document.getElementById("ctx"),out=document.getElementById("out"),ta=document.getElementById("result");let lease=params.get("lease")||localStorage.getItem("mls-r44-lease")||"";let worker=params.get("worker")||localStorage.getItem("mls-r44-worker")||("r44-"+crypto.randomUUID().replaceAll("-",""));localStorage.setItem("mls-r44-worker",worker);if(lease)localStorage.setItem("mls-r44-lease",lease);async function context(){if(!lease)return;let r=await fetch("/api/r44/context/"+encodeURIComponent(lease),{cache:"no-store"});let j=await r.json();ctx.textContent=JSON.stringify(j,null,2);state.textContent=j.ticketId?("Ticket "+j.ticketId+" — worker "+worker):JSON.stringify(j);return j}async function claim(){let r=await fetch("/api/r44/claim?worker="+encodeURIComponent(worker),{method:"POST",cache:"no-store"});let j=await r.json();out.textContent=JSON.stringify(j,null,2);if(j.ticket&&j.ticket.lease_token){lease=j.ticket.lease_token;localStorage.setItem("mls-r44-lease",lease);await context()}return j}document.getElementById("claim").onclick=claim;document.getElementById("reload").onclick=context;async function submitPayload(payload){if(!lease)return {error:"NO_LEASE"};let r=await fetch("/api/r44/submit",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({leaseToken:lease,payload})});let j=await r.json();out.textContent=JSON.stringify(j,null,2);if(r.ok&&j.status==="AUDITED_DURABLE"){localStorage.removeItem("mls-r44-lease");lease=""}return j}document.getElementById("submit").onclick=async()=>{if(!lease)return alert("Sin lease");let payload;try{payload=JSON.parse(ta.value)}catch(e){return alert("JSON inválido")};await submitPayload(payload)};async function renew(){if(!lease)return {error:"NO_LEASE"};let r=await fetch("/api/r44/renew?lease="+encodeURIComponent(lease),{method:"POST",cache:"no-store"});let j=await r.json();out.textContent=JSON.stringify(j,null,2);return j}async function autoMode(){let mode=params.get("auto")||"";if(mode==="claim"){await claim();return}if(mode==="renew"){await renew();return}if(mode==="submit"){let payload;try{payload=JSON.parse(params.get("payload")||"")}catch(e){out.textContent=JSON.stringify({error:"INVALID_AUTO_PAYLOAD"},null,2);return}await submitPayload(payload);return}await context()}setInterval(async()=>{if(lease)await fetch("/api/r44/renew?lease="+encodeURIComponent(lease),{method:"POST",cache:"no-store"}).catch(()=>{})},120000);autoMode();</script></body></html>';
}


function r44WorkerPage() {
  return '<!doctype html><html lang="es"><meta charset="utf-8"><title>MLS R44 Cloudflare Worker</title><style>body{font:16px system-ui;max-width:960px;margin:2rem auto}textarea,pre{width:100%;white-space:pre-wrap}textarea{height:240px}button{margin:8px;padding:12px}</style><h1>MLS R44</h1><p>Guarda cada entrada al terminarla. La confirmación requiere un recibo durable; R33 sigue pendiente.</p><button id="claim">Obtener ticket</button><button id="recover">Recuperar ticket</button><button id="next">Siguiente tras completar</button><pre id="context"></pre><p>Una entrada JSON con code y outcome: PASS_NO_CHANGE o CORRECTED.</p><textarea id="entry"></textarea><button id="save">Guardar entrada</button><button id="retry">Reconciliar y reintentar pendiente</button><pre id="out"></pre><script>'+R44_CLIENT_SOURCE+'\nconst client=new R44Client({storage:localStorage});const out=document.getElementById("out");async function show(action){try{const result=await action();out.textContent=JSON.stringify(result,null,2);if(client.state.ticketId && !(await client.recover()).lease?.active)return;if(client.state.ticketId){const r=await client.request("/api/r44/context/"+encodeURIComponent(client.state.leaseToken));document.getElementById("context").textContent=JSON.stringify(r,null,2)}}catch(e){out.textContent="EXECUTION_UNCONFIRMED: "+e.message}}document.getElementById("claim").onclick=()=>show(()=>client.claim());document.getElementById("recover").onclick=()=>show(()=>client.recover());document.getElementById("next").onclick=()=>show(()=>client.next());document.getElementById("save").onclick=()=>show(()=>client.checkpoint(JSON.parse(document.getElementById("entry").value)));document.getElementById("retry").onclick=()=>show(()=>client.flush());setInterval(()=>{if(client.state.ticketId&&client.state.lastConfirmed?.state!=="COMPLETE")client.renew().catch(()=>{})},120000);if(client.state.ticketId)show(()=>client.recover());</script></html>';
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
  const claim = await r44Claim(env, workerId, body.idempotencyKey);
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
  if (safeContext.lease) { safeContext.lease={...safeContext.lease};delete safeContext.lease.leaseToken; }
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

  // Expired leases cannot be revived by transport recovery.
  const synthetic = new Request("https://r44.internal/api/r44/submit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ leaseToken: session.lease_token, payload: { entries } })
  });
  const response = await r44Submit(synthetic, env);
  const value = await response.json();
  const durable = (value.status === "AUDITED_DURABLE" || value.status === "RESULT_ALREADY_SUBMITTED") && Boolean(value.sha256);
  if (durable) {
    // Retain binding so a timed-out submit can replay and read the durable receipt.
    return r44Json({ ...value, durable: true, bridgeSessionId: session.session_id, receipt: { algorithm: "sha256", sha256: value.sha256 } }, response.status);
  }
  return r44Json({ ...value, durable: false, bridgeSessionId: session.session_id }, response.status);
}

var R44_MCP_PROTOCOL = "2026-07-28";
var R44_MCP_LEGACY_PROTOCOL = "2025-11-25";
var R44_MCP_SERVER_INFO = { name: "mls-r44", version: "44.1" };
var R44_MCP_TOOLS = [
  {
    name: "r44_claim",
    title: "Claim next MLS R44 ticket",
    description: "Atomically claim the next R44 ticket in Cloudflare D1 and return its frozen entry context. A ticket normally contains five entries and the lease lasts 300 seconds.",
    inputSchema: {
      type: "object",
      properties: {
        workerId: { type: "string", description: "Stable opaque worker id; retain for recovery." },
        idempotencyKey: { type: "string", description: "Stable claim key; use a new key only for an explicit new allocation." }
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

R44_MCP_TOOLS.push(
  {name:"r44_checkpoint",title:"Checkpoint one R44 entry",description:"Persist one entry and return its verifiable durable receipt. Keep the same key on retry.",inputSchema:{type:"object",properties:{ticketId:{type:"string"},workerId:{type:"string"},leaseToken:{type:"string"},leaseGeneration:{type:"integer"},idempotencyKey:{type:"string"},entry:{type:"object"}},required:["ticketId","workerId","leaseToken","leaseGeneration","idempotencyKey","entry"],additionalProperties:false}},
  {name:"r44_rebind",title:"Recover the same R44 ticket",description:"Read existing ownership and receipts; never claim or renew work.",inputSchema:{type:"object",properties:{ticketId:{type:"string"},workerId:{type:"string"},leaseToken:{type:"string"}},required:["ticketId","workerId"],additionalProperties:false}},
  {name:"r44_reconcile",title:"Reconcile authoritative R44 progress",description:"Return authoritative receipts and only remaining entry codes.",inputSchema:{type:"object",properties:{ticketId:{type:"string"}},required:["ticketId"],additionalProperties:false}}
);
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
  if (["r44_checkpoint","r44_rebind","r44_reconcile"].includes(name)) {
    const value = name === "r44_checkpoint" ? await r44Checkpoint(env,args) : name === "r44_rebind" ? await r44Rebind(env,args) : await r44Reconcile(env,args.ticketId);
    return r44McpToolResult(value,modern,!!(value && value.error));
  }
  if (name === "r44_claim") {
    const workerId = r44WorkerId(args && args.workerId);
    const claim = await r44Claim(env, workerId, args && args.idempotencyKey);
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
      instructions: "Use a stable claim key with r44_claim. Checkpoint each entry immediately with r44_checkpoint. On session loss use r44_rebind and r44_reconcile, never a new claim. Do not report completion without a SHA-256 durable receipt.",
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


var MLS_UNIFIED_RUNNER_SCHEMA = "3";
var unifiedRunnerReady = new WeakSet();
function unifiedRunnerCount(n) { return Number.isInteger(n) && (n === 1 || n === 100 || (n >= 5 && n <= 50 && n % 5 === 0)); }
var MLS_UNIFIED_RUNNER_WORKER = "mls-unified-web-runner-v1";

async function unifiedRunnerEnsure(env) {
  if (unifiedRunnerReady.has(env.WIKI_DB)) return;
  await env.WIKI_DB.batch([
    env.WIKI_DB.prepare("CREATE TABLE IF NOT EXISTS mls_unified_runner (id INTEGER PRIMARY KEY CHECK(id=1), state TEXT NOT NULL, worker_id TEXT NOT NULL, started_at TEXT, updated_at TEXT NOT NULL, processed_entries INTEGER NOT NULL DEFAULT 0, corrected_entries INTEGER NOT NULL DEFAULT 0, error_count INTEGER NOT NULL DEFAULT 0, last_ticket TEXT, last_code TEXT, last_error TEXT, last_step_at TEXT, step_token TEXT, busy_until INTEGER, schema_version TEXT NOT NULL)"),
    env.WIKI_DB.prepare("INSERT OR IGNORE INTO mls_unified_runner(id,state,worker_id,updated_at,schema_version) VALUES(1,'STOPPED',?,?,?)").bind(MLS_UNIFIED_RUNNER_WORKER,new Date().toISOString(),MLS_UNIFIED_RUNNER_SCHEMA),
    env.WIKI_DB.prepare("CREATE TABLE IF NOT EXISTS mls_unified_runner_lane (stage TEXT PRIMARY KEY CHECK(stage IN ('r33','integration')), state TEXT NOT NULL, issue_number INTEGER, assignment_id TEXT, last_code TEXT, last_error TEXT, detail_json TEXT, updated_at TEXT NOT NULL)")
  ]);
  await env.WIKI_DB.batch([
    env.WIKI_DB.prepare("CREATE TABLE IF NOT EXISTS mls_unified_runner_config (id INTEGER PRIMARY KEY CHECK(id=1), desired INTEGER NOT NULL CHECK(desired IN (1,100) OR (desired BETWEEN 5 AND 50 AND desired%5=0)))"),
    env.WIKI_DB.prepare("INSERT OR IGNORE INTO mls_unified_runner_config VALUES(1,5)"),
    env.WIKI_DB.prepare("CREATE TABLE IF NOT EXISTS mls_unified_runner_slots (id INTEGER PRIMARY KEY CHECK(id BETWEEN 1 AND 100), worker_id TEXT NOT NULL UNIQUE, step_token TEXT, busy_until INTEGER, updated_at TEXT, last_step_key TEXT)")
  ]);
  const schema = await env.WIKI_DB.prepare('SELECT schema_version FROM mls_unified_runner WHERE id=1').first();
  if (schema.schema_version !== MLS_UNIFIED_RUNNER_SCHEMA) {
    // Replace only the two CHECK constraints, preserving identities and live locks
    // in the same D1 transaction. Repeated/concurrent migration is safe.
    await env.WIKI_DB.batch([
      env.WIKI_DB.prepare("CREATE TABLE mls_unified_runner_config_v3 (id INTEGER PRIMARY KEY CHECK(id=1), desired INTEGER NOT NULL CHECK(desired IN (1,100) OR (desired BETWEEN 5 AND 50 AND desired%5=0)))"),
      env.WIKI_DB.prepare('INSERT INTO mls_unified_runner_config_v3 SELECT * FROM mls_unified_runner_config'),
      env.WIKI_DB.prepare('DROP TABLE mls_unified_runner_config'),
      env.WIKI_DB.prepare('ALTER TABLE mls_unified_runner_config_v3 RENAME TO mls_unified_runner_config'),
      env.WIKI_DB.prepare("CREATE TABLE mls_unified_runner_slots_v3 (id INTEGER PRIMARY KEY CHECK(id BETWEEN 1 AND 100), worker_id TEXT NOT NULL UNIQUE, step_token TEXT, busy_until INTEGER, updated_at TEXT, last_step_key TEXT)"),
      env.WIKI_DB.prepare('INSERT INTO mls_unified_runner_slots_v3 SELECT * FROM mls_unified_runner_slots'),
      env.WIKI_DB.prepare('DROP TABLE mls_unified_runner_slots'),
      env.WIKI_DB.prepare('ALTER TABLE mls_unified_runner_slots_v3 RENAME TO mls_unified_runner_slots'),
      env.WIKI_DB.prepare('UPDATE mls_unified_runner SET schema_version=? WHERE id=1').bind(MLS_UNIFIED_RUNNER_SCHEMA)
    ]);
  }
  // One statement seeds all slots; slot 1 preserves the old worker identity.
  await env.WIKI_DB.prepare("WITH RECURSIVE slots(n) AS (SELECT 1 UNION ALL SELECT n+1 FROM slots WHERE n<100) INSERT OR IGNORE INTO mls_unified_runner_slots(id,worker_id) SELECT n,CASE WHEN n=1 THEN ? ELSE 'mls-unified-runner-'||printf('%03d',n) END FROM slots").bind(MLS_UNIFIED_RUNNER_WORKER).run();
  unifiedRunnerReady.add(env.WIKI_DB);
}
async function unifiedRunnerRead(env) {
  await unifiedRunnerEnsure(env);
  return env.WIKI_DB.prepare("SELECT r.*,c.desired AS configured_runners,(SELECT COUNT(*) FROM mls_unified_runner_slots WHERE step_token IS NOT NULL AND busy_until>?) AS active_runners FROM mls_unified_runner r JOIN mls_unified_runner_config c ON c.id=r.id WHERE r.id=1").bind(Date.now()).first();
}
var MLS_UNIFIED_ACCESS_TEAM_ORIGIN = "https://flat-wave-7385.cloudflareaccess.com";
var MLS_UNIFIED_ACCESS_AUD = "2e8cca974ae20d4a4812a6259207e203154b294c1587b32babe93031e1177dd6";

function unifiedRunnerBase64UrlBytes(value) {
  const normalized=String(value||"").replace(/-/g,"+").replace(/_/g,"/");
  const padded=normalized+"=".repeat((4-normalized.length%4)%4);
  const binary=atob(padded);
  return Uint8Array.from(binary,function(ch){return ch.charCodeAt(0)});
}
function unifiedRunnerBase64UrlJson(value) {
  return JSON.parse(new TextDecoder().decode(unifiedRunnerBase64UrlBytes(value)));
}
async function unifiedRunnerAccessJwtAuthorize(request) {
  const token=String(request.headers.get("cf-access-jwt-assertion")||"").trim();
  if(!token)return null;
  try{
    const parts=token.split(".");
    if(parts.length!==3)return null;
    const header=unifiedRunnerBase64UrlJson(parts[0]);
    const payload=unifiedRunnerBase64UrlJson(parts[1]);
    if(header.alg!=="RS256"||!header.kid)return null;
    const aud=Array.isArray(payload.aud)?payload.aud:[payload.aud];
    if(!aud.includes(MLS_UNIFIED_ACCESS_AUD))return null;
    const issuer=String(payload.iss||"").replace(/\/$/,"");
    if(issuer!==MLS_UNIFIED_ACCESS_TEAM_ORIGIN)return null;
    const now=Math.floor(Date.now()/1000);
    if(!Number.isFinite(Number(payload.exp))||Number(payload.exp)<=now)return null;
    if(payload.nbf!=null&&Number(payload.nbf)>now+60)return null;
    const response=await fetch(MLS_UNIFIED_ACCESS_TEAM_ORIGIN+"/cdn-cgi/access/certs",{cf:{cacheEverything:true,cacheTtl:3600}});
    if(!response.ok)return null;
    const jwks=await response.json();
    const jwk=(jwks.keys||[]).find(function(key){return key.kid===header.kid});
    if(!jwk)return null;
    const key=await crypto.subtle.importKey("jwk",jwk,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]);
    const signed=new TextEncoder().encode(parts[0]+"."+parts[1]);
    const signature=unifiedRunnerBase64UrlBytes(parts[2]);
    const valid=await crypto.subtle.verify("RSASSA-PKCS1-v1_5",key,signature,signed);
    if(!valid)return null;
    return {ok:true,status:200,auth:"cloudflare-access-jwt",aud:MLS_UNIFIED_ACCESS_AUD,email:String(payload.email||"")};
  }catch(_){return null}
}
async function unifiedRunnerAuthorize(request, env, ctx) {
  const bearer = String(request.headers.get("authorization") || "").trim();
  if (bearer) return r44ChatBridgeAuthorize(request, env);
  if (ctx && ctx.access) {
    let identity = null;
    try { identity = await ctx.access.getIdentity(); } catch (_) {}
    return {
      ok:true,
      status:200,
      auth:"cloudflare-access",
      aud:String(ctx.access.aud || ""),
      email:String(identity && identity.email || "")
    };
  }
  const jwtAuth=await unifiedRunnerAccessJwtAuthorize(request);
  if(jwtAuth)return jwtAuth;
  return {ok:false,status:401,error:"UNIFIED_RUNNER_ACCESS_REQUIRED"};
}
async function unifiedRunnerControl(request, env, ctx) {
  const auth = await unifiedRunnerAuthorize(request, env, ctx);
  if (!auth.ok) return r44Json({error:auth.error},auth.status);
  const body = await r44ChatBridgeBody(request);
  const action = String(body.action || "").toLowerCase();
  const map = {start:"RUNNING",resume:"RUNNING",pause:"PAUSED",stop:"STOPPED",complete:"COMPLETE"};
  const next = map[action];
  if (!next && action !== "configure") return r44Json({error:"UNIFIED_RUNNER_ACTION_INVALID"},400);
  if ((action === "configure" || body.runners !== undefined) && !unifiedRunnerCount(body.runners)) return r44Json({error:"UNIFIED_RUNNER_COUNT_INVALID"},400);
  await unifiedRunnerEnsure(env);
  if (body.runners !== undefined) await env.WIKI_DB.prepare("UPDATE mls_unified_runner_config SET desired=? WHERE id=1").bind(body.runners).run();
  if (action === "configure") return r44Json({ok:true,action,runner:await unifiedRunnerRead(env)});
  const now = new Date().toISOString();
  await env.WIKI_DB.prepare("UPDATE mls_unified_runner SET state=?, started_at=CASE WHEN ?='RUNNING' AND started_at IS NULL THEN ? ELSE started_at END, updated_at=?, last_error=CASE WHEN ? IN ('RUNNING','COMPLETE') THEN NULL ELSE last_error END WHERE id=1")
    .bind(next,next,now,now,next).run();
  return r44Json({ok:true,action,state:next,runner:await unifiedRunnerRead(env)});
}
async function unifiedRunnerStatus(request, env, ctx) {
  const auth = await unifiedRunnerAuthorize(request, env, ctx);
  if (!auth.ok) return r44Json({error:auth.error},auth.status);
  const runner = await unifiedRunnerRead(env);
  const r44 = await r44Status(env);
  let budget = null;
  try { budget = await wikiStore(env).getCloudflareBudget(); } catch (_) {}
  const laneRows=await env.WIKI_DB.prepare("SELECT * FROM mls_unified_runner_lane ORDER BY stage").all();
  const lanes=Object.fromEntries((laneRows.results||[]).map(row=>[row.stage,{...row,detail:(()=>{try{return row.detail_json?JSON.parse(row.detail_json):null}catch{return null}})()}]));
  let authorityStatus=null;
  // Status is read-through against canonical GitHub authority even when D1 still has
  // write budget. This makes /runner reflect merged VERIFIED entries immediately
  // (bounded by canonicalAuthorityStatus' 5-minute cache) without mutating D1.
  try{authorityStatus=await canonicalAuthorityStatus();}catch(_){}
  return r44Json({ok:true,runner,r44,budget,lanes,canonical:await canonicalStatus(env,authorityStatus),freeOnly:true,chatCompatible:true,auth:{mode:auth.auth||"editorial-key",email:auth.email||null,aud:auth.aud||null},canonicalVerifiedAuthority:"MLS R32 EDITORIAL/evidence git/indexes/verified.json"});
}
function unifiedRunnerSeed(article) {
  return {
    code:String(article.code || "").toUpperCase(),
    language:String(article.language || ""),
    languageName:String(article.languageName || article.language || ""),
    level:String(article.level || ""),
    part:String(article.part || ""),
    chapter:String(article.chapter || ""),
    title:String(article.title || ""),
    target:String(article.target || ""),
    definition:String(article.definition || ""),
    example:String(article.example || ""),
    notes:String(article.notes || "")
  };
}
async function unifiedRunnerAuditMarkdown(env, article, markdown, suffix) {
  const seed = unifiedRunnerSeed(article);
  const deterministic = basicArticleValidation(markdown);
  const messages = [
    {role:"system",content:WIKI_COMPACT_AUDIT_PROMPT},
    {role:"system",content:"CONTROL DEL IDIOMA\n\n"+(LANGUAGE_MODULES[seed.language] || "")},
    {role:"user",content:"ENTRADA:\n"+wikiSeedAsText(seed)+"\n\nARTÍCULO:\n"+markdown+"\n\nPROBLEMAS DETERMINISTAS DETECTADOS:\n"+(deterministic.join("\n") || "ninguno")}
  ];
  const provider = {id:"cloudflare-auditor",kind:"cloudflare",model:"@cf/ibm-granite/granite-4.0-h-micro"};
  const result = await runCloudflareProvider(env,provider,messages,600,0.02);
  const decision = parseAuditDecision(result.text);
  if (deterministic.length) {
    decision.status = "FIX";
    decision.risk = Math.max(decision.risk,0.7);
    decision.issues = Array.from(new Set(deterministic.concat(decision.issues || []))).slice(0,8);
  }
  return {seed,decision,result,suffix};
}
async function unifiedRunnerAuditEntry(env, article) {
  if (!article || typeof article !== "object" || Array.isArray(article)) throw new Error("UNIFIED_R44_ARTICLE_INVALID");
  const code = String(article.code || "").toUpperCase();
  const original = String(article.articleMarkdown || "").trim();
  if (!/^MLS-V\d{2}-\d{4}$/.test(code) || !original) throw new Error("UNIFIED_R44_ARTICLE_SHAPE_INVALID_"+code);
  const first = await unifiedRunnerAuditMarkdown(env,article,original,"initial");
  if (first.decision.status !== "FIX") {
    return {
      code,
      outcome:"PASS_NO_CHANGE",
      evidence:{auditRisk:first.decision.risk,issues:first.decision.issues,auditProvider:first.result.provider,auditModel:first.result.model},
      notes:["Cloudflare Unified R44 automatic audit passed without content change."]
    };
  }
  const correctionMessages = [
    {role:"system",content:WIKI_CORRECTION_PROMPT},
    {role:"system",content:"MÓDULO DEL IDIOMA ACTUAL\n\n"+(LANGUAGE_MODULES[first.seed.language] || "")},
    {role:"user",content:"SEMILLA:\n"+wikiSeedAsText(first.seed)+"\n\nARTÍCULO ORIGINAL:\n"+original+"\n\nCORRECCIONES NECESARIAS:\n"+first.decision.issues.map(function(x,i){return String(i+1)+". "+x;}).join("\n")}
  ];
  const correctionProvider = {id:"cloudflare",kind:"cloudflare",model:MODEL_ID};
  const correction = await runCloudflareProvider(env,correctionProvider,correctionMessages,3600,0.05);
  const corrected = String(correction.text || "").trim();
  if (!corrected) throw new Error("UNIFIED_R44_CORRECTION_EMPTY_"+code);
  const second = await unifiedRunnerAuditMarkdown(env,article,corrected,"post-correction");
  if (second.decision.status === "FIX") {
    throw new Error("UNIFIED_R44_CORRECTION_REJECTED_"+code+"_"+second.decision.issues.join(" | ").slice(0,700));
  }
  return {
    code,
    outcome:"CORRECTED",
    correctedContent:Object.assign({},article,{articleMarkdown:corrected}),
    evidence:{
      initialRisk:first.decision.risk,
      initialIssues:first.decision.issues,
      auditProvider:first.result.provider,
      auditModel:first.result.model,
      correctionProvider:correction.provider,
      correctionModel:correction.model,
      postCorrectionRisk:second.decision.risk
    },
    notes:["Cloudflare Unified R44 automatic audit corrected the article and passed a second audit."]
  };
}
async function unifiedRunnerApplyMark(env, patch) {
  await unifiedRunnerEnsure(env);
  const fields = [], values = [];
  for (const key of ["state","last_ticket","last_code","last_error","last_step_at"]) {
    if (Object.prototype.hasOwnProperty.call(patch,key)) { fields.push(key+"=?"); values.push(patch[key]); }
  }
  if (patch.processedDelta) fields.push("processed_entries=processed_entries+"+Math.max(0,Number(patch.processedDelta)||0));
  if (patch.correctedDelta) fields.push("corrected_entries=corrected_entries+"+Math.max(0,Number(patch.correctedDelta)||0));
  if (patch.errorDelta) fields.push("error_count=error_count+"+Math.max(0,Number(patch.errorDelta)||0));
  fields.push("updated_at=?"); values.push(new Date().toISOString());
  values.push(1);
  const stmt = env.WIKI_DB.prepare("UPDATE mls_unified_runner SET "+fields.join(", ")+" WHERE id=?");
  await stmt.bind.apply(stmt,values).run();
}
async function unifiedRunnerStep(env, stepKey, runnerId = 1) {
  const runner = await unifiedRunnerRead(env);
  if (runner.state !== "RUNNING") return {status:"RUNNER_NOT_RUNNING",state:runner.state};
  if (!Number.isInteger(runnerId) || runnerId < 1 || runnerId > runner.configured_runners) return {status:"RUNNER_DISABLED"};
  const key = String(stepKey || "");
  if (!/^[A-Za-z0-9._:-]{8,120}$/.test(key)) return {status:"INVALID_STEP_KEY"};
  const now = Date.now(), stepToken = crypto.randomUUID();
  const locked = await env.WIKI_DB.prepare("UPDATE mls_unified_runner_slots SET step_token=?1,busy_until=?2,updated_at=?3,last_step_key=?6 WHERE id=?5 AND (busy_until IS NULL OR busy_until<=?4) AND (last_step_key IS NULL OR last_step_key<>?6) AND id<=(SELECT desired FROM mls_unified_runner_config WHERE id=1) AND EXISTS(SELECT 1 FROM mls_unified_runner WHERE id=1 AND state='RUNNING' AND (busy_until IS NULL OR busy_until<=?4)) RETURNING worker_id")
    .bind(stepToken,now+14*60*1000,new Date(now).toISOString(),now,runnerId,key).first();
  if (!locked) return {status:"RUNNER_BUSY"};
  const release = async()=>env.WIKI_DB.prepare("UPDATE mls_unified_runner_slots SET step_token=NULL,busy_until=NULL,updated_at=? WHERE id=? AND step_token=?").bind(new Date().toISOString(),runnerId,stepToken).run();
  let context = null;
  const receipts = [];
  try {
    const claim = await r44DurableClaim(env,locked.worker_id,"unified:"+key);
    if (!["CLAIMED","LEASE_REUSED"].includes(claim.status) || !claim.ticket || !claim.ticket.lease_token) {
      await unifiedRunnerApplyMark(env,{last_step_at:new Date().toISOString(),last_error:null});
      if (claim.status === "NO_WORK") return await canonicalStep(env);
      return {status:claim.status || "NO_WORK",claim};
    }
    const token = claim.ticket.lease_token;
    context = await r44DurableContext(env,token,1,true);
    if (!context) throw new Error("UNIFIED_R44_CONTEXT_MISSING");
    const entries = Array.isArray(context.entries) ? context.entries : [];
    const content = Array.isArray(context.content) ? context.content : [];
    if (!entries.length) return await canonicalStep(env);
    if (content.length !== entries.length) throw new Error("UNIFIED_R44_CONTEXT_ALIGNMENT");
    for (let i=0;i<Math.min(entries.length,1);i++) {
      const source = entries[i];
      const article = content[i];
      const owned = await env.WIKI_DB.prepare("SELECT s.id FROM mls_unified_runner_slots s JOIN mls_unified_runner r ON r.id=1 JOIN mls_unified_runner_config c ON c.id=1 WHERE s.id=? AND s.step_token=? AND s.busy_until>? AND r.state='RUNNING' AND s.id<=c.desired").bind(runnerId,stepToken,Date.now()).first();
      if (!owned) return {status:"RUNNER_DISABLED"};
      const renewed = await r44Renew(env,token,context.leaseGeneration);
      if (!renewed) throw new Error("UNIFIED_R44_LEASE_RENEW_FAILED");
      const result = await unifiedRunnerAuditEntry(env,article);
      const checkpoint = await r44Checkpoint(env,{
        ticketId:context.ticketId,
        workerId:context.workerId,
        leaseToken:token,
        leaseGeneration:context.leaseGeneration,
        idempotencyKey:"unified:"+key+":"+String(source.code || result.code),
        entry:result
      },false);
      if (checkpoint.error) throw new Error("UNIFIED_R44_CHECKPOINT_"+checkpoint.error);
      receipts.push(checkpoint);
      await unifiedRunnerApplyMark(env,{
        last_ticket:context.ticketId,
        last_code:result.code,
        last_step_at:new Date().toISOString(),
        last_error:null,
        processedDelta:1,
        correctedDelta:result.outcome === "CORRECTED" ? 1 : 0
      });
    }
    const finalState = await r44Reconcile(env,context.ticketId);
    return {status:finalState && finalState.state === "COMPLETE" ? "TICKET_COMPLETE" : "ENTRY_DURABLE",ticketId:context.ticketId,entries:receipts.length,receipts,state:finalState && finalState.state};
  } catch (error) {
    const message = wikiErrorMessage(error);
    const quota = (typeof WorkersQuotaExceededError !== "undefined" && error instanceof WorkersQuotaExceededError) || workersAiFailureKind(message) === "quota";
    const paid = (typeof ZeroCostPolicyError !== "undefined" && error instanceof ZeroCostPolicyError) || workersAiFailureKind(message) === "paid";
    // R44 is only one lane of MLS Unified. A ticket/article failure must not stop
    // R33 certification or serialized integration of already durable R44 work.
    // Only FREE-only policy/quota failures pause the global runner here; fatal
    // scheduler/control-plane failures are still handled by unifiedRunnerScheduled.
    const pauseState = quota ? "QUOTA_PAUSED" : paid ? "POLICY_PAUSED" : null;
    if (pauseState) {
      await unifiedRunnerApplyMark(env,{state:pauseState,last_error:message,last_step_at:new Date().toISOString(),errorDelta:1});
      return {status:pauseState,ticketId:context && context.ticketId || null,error:message,receipts};
    }
    const failed=context && context.entries && context.entries[0];
    if (failed) await r44EntryState(env,{ticketId:context.ticketId,workerId:context.workerId,leaseToken:context.leaseToken,leaseGeneration:context.leaseGeneration,code:failed.code,state:"FAILED_RETRYABLE"});
    await unifiedRunnerApplyMark(env,{last_error:"R44 lane: "+message,last_step_at:new Date().toISOString(),errorDelta:1});
    return {status:"R44_DEGRADED",ticketId:context && context.ticketId || null,error:message,receipts};
  } finally {
    await release().catch(function(){});
  }
}
async function unifiedRunnerStepRequest(request, env, ctx) {
  const auth = await unifiedRunnerAuthorize(request, env, ctx);
  if (!auth.ok) return r44Json({error:auth.error},auth.status);
  const body = await r44ChatBridgeBody(request);
  const result = await unifiedRunnerStep(env,String(body.stepKey || ""),body.runnerId === undefined ? 1 : body.runnerId);
  const status = result.status === "ERROR" ? 500 : result.status === "QUOTA_PAUSED" ? 429 : 200;
  return r44Json(result,status);
}
async function unifiedRunnerScheduled(env) {
  try {
    let runner = await unifiedRunnerRead(env);
    const legacyR44Error = String(runner.last_error || "");
    if (runner.state === "ERROR" && /^(?:R44_CONTEXT_(?:HASH_MISMATCH|FETCH)_|UNIFIED_R44_(?:ARTICLE|CORRECTION|CONTEXT|LEASE_RENEW|CHECKPOINT)_)/.test(legacyR44Error)) {
      const now = new Date().toISOString();
      await env.WIKI_DB.prepare("UPDATE mls_unified_runner SET state='RUNNING',last_error=?,updated_at=? WHERE id=1 AND state='ERROR'")
        .bind("R44 lane: "+legacyR44Error,now).run();
      runner = await unifiedRunnerRead(env);
    }
    if (runner.state === "QUOTA_PAUSED") {
      const pausedDay = String(runner.updated_at || "").slice(0,10);
      const today = new Date().toISOString().slice(0,10);
      if (pausedDay && pausedDay !== today) {
        await env.WIKI_DB.prepare("UPDATE mls_unified_runner SET state='RUNNING',last_error=NULL,updated_at=? WHERE id=1 AND state='QUOTA_PAUSED'").bind(new Date().toISOString()).run();
        runner = await unifiedRunnerRead(env);
      }
    }
    if (runner.state !== "RUNNING") return {status:"SKIPPED",state:runner.state};
    if (!env.MLS_UNIFIED_RUNNERS) throw new Error("UNIFIED_RUNNER_BINDING_MISSING");
    // A read-only grouped refresh retires entries only after canonical integration.
    if (env.ASSETS) await canonicalRefreshVerified(env).catch(error=>unifiedRunnerApplyMark(env,{last_error:'Canonical status: '+wikiErrorMessage(error)}));
    // Only arm alarms here. Each logical runner executes in its own invocation,
    // keeping D1/AI request budgets independent of the selected concurrency.
    const results = [];
    // Wake at most 25 objects here; each object wakes up to three peers in its
    // own invocation, keeping the cron comfortably below FREE subrequest limits.
    const roots=Math.min(25,runner.configured_runners);
    for (let first=1;first<=roots;first+=5) {
      results.push(...await Promise.all(Array.from({length:Math.min(5,roots-first+1)},async(_,offset)=>{
        const id=first+offset;
        const stub=env.MLS_UNIFIED_RUNNERS.get(env.MLS_UNIFIED_RUNNERS.idFromName("runner-"+id));
        const response=await stub.fetch("https://runner.internal/wake",{method:"POST",body:JSON.stringify({runnerId:id,wakeThrough:runner.configured_runners})});
        if (!response.ok) throw new Error("UNIFIED_RUNNER_WAKE_FAILED");
        return id;
      })));
    }
    return {status:"SCHEDULED",runners:runner.configured_runners};
  } catch (error) {
    await unifiedRunnerApplyMark(env,{state:"ERROR",last_error:wikiErrorMessage(error),last_step_at:new Date().toISOString(),errorDelta:1}).catch(function(){});
    throw error;
  }
}

async function unifiedRunnerReport(request,env,ctx) {
  const auth=await unifiedRunnerAuthorize(request,env,ctx);
  if(!auth.ok) return r44Json({error:auth.error},auth.status);
  const body=await r44ChatBridgeBody(request);
  const stage=String(body.stage||"").toLowerCase();
  if(stage!=="r33"&&stage!=="integration") return r44Json({error:"UNIFIED_RUNNER_REPORT_STAGE_INVALID"},400);
  const state=String(body.state||"").toUpperCase().slice(0,80);
  if(!state) return r44Json({error:"UNIFIED_RUNNER_REPORT_STATE_REQUIRED"},400);
  const issueNumber=body.issueNumber==null?null:Number(body.issueNumber);
  if(issueNumber!==null&&(!Number.isInteger(issueNumber)||issueNumber<1)) return r44Json({error:"UNIFIED_RUNNER_REPORT_ISSUE_INVALID"},400);
  const assignmentId=body.assignmentId==null?null:String(body.assignmentId).slice(0,120);
  const lastCode=body.code==null?null:String(body.code).toUpperCase().slice(0,40);
  const lastError=body.error==null?null:String(body.error).slice(0,2000);
  const detail=body.detail==null?null:JSON.stringify(body.detail).slice(0,12000);
  const now=new Date().toISOString();
  await unifiedRunnerEnsure(env);
  await env.WIKI_DB.prepare("INSERT INTO mls_unified_runner_lane(stage,state,issue_number,assignment_id,last_code,last_error,detail_json,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(stage) DO UPDATE SET state=excluded.state,issue_number=excluded.issue_number,assignment_id=excluded.assignment_id,last_code=excluded.last_code,last_error=excluded.last_error,detail_json=excluded.detail_json,updated_at=excluded.updated_at")
    .bind(stage,state,issueNumber,assignmentId,lastCode,lastError,detail,now).run();
  if(body.pauseRunner===true){
    await env.WIKI_DB.prepare("UPDATE mls_unified_runner SET state='REVIEW_PAUSED',last_error=?,updated_at=? WHERE id=1 AND state='RUNNING'")
      .bind(lastError||("R33 review required"+(lastCode?" for "+lastCode:"")),now).run();
  }
  return r44Json({ok:true,stage,state,runner:await unifiedRunnerRead(env)});
}

async function handleUnifiedRunner(request, env, url, ctx) {
  const browserPath=url.pathname.startsWith("/api/unified-runner/browser/");
  const pathname = browserPath
    ? url.pathname.replace("/api/unified-runner/browser/","/api/unified-runner/")
    : url.pathname;
  if(browserPath && pathname==="/api/unified-runner/session" && request.method==="GET"){
    const auth=await unifiedRunnerAuthorize(request,env,ctx);
    if(!auth.ok)return r44Json({error:auth.error},auth.status);
    return Response.redirect(new URL("/runner.html#unified",request.url).toString(),302);
  }
  if (pathname === "/api/unified-runner/status" && request.method === "POST") return unifiedRunnerStatus(request,env,ctx);
  if (pathname === "/api/unified-runner/control" && request.method === "POST") return unifiedRunnerControl(request,env,ctx);
  if (pathname === "/api/unified-runner/step" && request.method === "POST") return unifiedRunnerStepRequest(request,env,ctx);
  if (pathname === "/api/unified-runner/r33-evidence" && request.method === "POST") return unifiedRunnerR33Draft(request,env,ctx);
  if (pathname === "/api/unified-runner/prepared-evidence" && request.method === "POST") return unifiedRunnerR33Draft(request,env,ctx,true);
  if (pathname === "/api/unified-runner/report" && request.method === "POST") return unifiedRunnerReport(request,env,ctx);
  return r44Json({error:"UNIFIED_RUNNER_ROUTE_NOT_FOUND"},404);
}

async function handleR44(request, env, url, ctx) {
  if (url.pathname.startsWith("/api/unified-runner/")) return handleUnifiedRunner(request, env, url, ctx);
  try {
    const durable = await r44DurableRoute(request, env, url);
    if (durable) return durable;
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
        const claim = await r44Claim(env, workerId, url.searchParams.get("idempotencyKey"));
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
    if (url.pathname === "/r44-worker") return new Response(url.searchParams.has("auto") ? r44LegacyWorkerPage() : r44WorkerPage(), { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
    if (url.pathname === "/api/r44/status" && request.method === "GET") return r44Json(await r44Status(env));
    if (url.pathname === "/api/r44/claim" && request.method === "POST") {
      const workerId = r44WorkerId(url.searchParams.get("worker"));
      const claim = await r44Claim(env, workerId, url.searchParams.get("idempotencyKey"));
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
      const renewed = await r44Renew(env, String(url.searchParams.get("lease") || ""), url.searchParams.has("leaseGeneration") ? Number(url.searchParams.get("leaseGeneration")) : undefined);
      return renewed ? r44Json({ status: "RENEWED", ...renewed }) : r44Json({ error: "LEASE_INVALID_OR_EXPIRED" }, 409);
    }
    if (url.pathname === "/api/r44/submit" && request.method === "POST") return r44Submit(request, env);
    if (url.pathname === "/api/r44/export" && request.method === "GET") return r44Json(await r44Export(env, url.searchParams.get("limit"), url.searchParams.get("afterOrdinal")));
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
// Alarms provide scheduling only. D1 remains the sole configuration, lock,
// claim, fencing and receipt authority. No external or paid fallback.
class UnifiedLogicalRunner {
  constructor(state, env) { this.storage=state.storage; this.env=env; }
  async fetch(request) {
    const body=await request.json();
    if (!Number.isInteger(body.runnerId) || body.runnerId<1 || body.runnerId>100) return new Response("Invalid runner",{status:400});
    if (body.wakeThrough !== undefined && (!unifiedRunnerCount(body.wakeThrough) || body.runnerId>25 || body.runnerId>body.wakeThrough)) return new Response("Invalid fanout",{status:400});
    const prior=await this.storage.get("runnerId");
    if (prior && prior!==body.runnerId) return new Response("Identity conflict",{status:409});
    if (!prior) await this.storage.put("runnerId",body.runnerId);
    if (await this.storage.getAlarm() === null) await this.storage.setAlarm(Date.now()+1000);
    for (let peer=body.runnerId+25;peer<=Number(body.wakeThrough||0);peer+=25) {
      const stub=this.env.MLS_UNIFIED_RUNNERS.get(this.env.MLS_UNIFIED_RUNNERS.idFromName('runner-'+peer));
      const response=await stub.fetch('https://runner.internal/wake',{method:'POST',body:JSON.stringify({runnerId:peer})});
      if(!response.ok)throw new Error('UNIFIED_RUNNER_WAKE_FAILED');
    }
    return new Response("Scheduled");
  }
  async alarm() {
    const id=await this.storage.get("runnerId");
    if (!id) return;
    // A retry reuses the same key; it cannot start fresh work after completion.
    let key=await this.storage.get("stepKey");
    if (!key) { key="alarm:"+crypto.randomUUID(); await this.storage.put("stepKey",key); }
    const result=await unifiedRunnerStep(this.env,key,id);
    await this.storage.delete("stepKey");
    if (["ENTRY_DURABLE","TICKET_COMPLETE","R44_DEGRADED","CANONICAL_PREPARED","CANONICAL_RETRY","CANONICAL_QUARANTINED","RUNNER_BUSY","NO_WORK","CAPACITY_BUSY","CLAIM_ALREADY_RESOLVED"].includes(result.status)) {
      await this.storage.setAlarm(Date.now()+(["ENTRY_DURABLE","TICKET_COMPLETE","R44_DEGRADED","CANONICAL_PREPARED","CANONICAL_RETRY","CANONICAL_QUARANTINED"].includes(result.status)?1000:300000));
    }
  }
}
// MLS R44 CLOUDFLARE CONTROL PLANE END
