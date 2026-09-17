'use strict';

const fs = require('fs');

const backendPath = 'src/index.js';
const sourcePath = 'MLS R32 EDITORIAL/chat workflow.js';

const startMarker = 'async function mlsChatStart(env, body) {';
const nextMarker = '\nasync function mlsChatNext(env, id) {';
const installedMarker = 'async function mlsChatFillNormalRun(env, runId) {';

const canonicalHelpers = String.raw`
async function mlsChatReserveNormal(env, runId) {
  const result = await env.WIKI_DB.prepare(
    "INSERT INTO wiki_chat_items(run_id, position, code) " +
    "SELECT ?, (SELECT COUNT(*) FROM wiki_chat_items WHERE run_id = ?) + row_number() OVER (ORDER BY " + WIKI_FIFO_ORDER_SQL + ") - 1, j.code " +
    "FROM wiki_jobs j " +
    "WHERE j.status IN ('pending', 'enqueued', 'queued') " +
    "AND NOT EXISTS (SELECT 1 FROM wiki_articles a WHERE a.code = j.code) " +
    "AND NOT EXISTS (SELECT 1 FROM wiki_chat_items p WHERE p.code = j.code AND p.status = 'pending') " +
    "AND NOT EXISTS (SELECT 1 FROM wiki_chat_items s WHERE s.code = j.code AND s.status IN ('deferred', 'needs_review')) " +
    "AND NOT EXISTS (SELECT 1 FROM wiki_chat_incidents x WHERE x.code = j.code AND x.rescue_state IN ('pending', 'claimed', 'chat_claimed', 'needs_review')) " +
    "ORDER BY " + WIKI_FIFO_ORDER_SQL + " " +
    "LIMIT max(0, (SELECT requested FROM wiki_chat_runs WHERE id = ?) - (SELECT COUNT(*) FROM wiki_chat_items WHERE run_id = ?))"
  ).bind(runId, runId, runId, runId).run();
  return Number(result?.meta?.changes || 0);
}

async function mlsChatMaterializeNormalCandidates(env, runId, now) {
  const run = await env.WIKI_DB.prepare('SELECT requested FROM wiki_chat_runs WHERE id = ?').bind(runId).first();
  if (!run) return 0;
  const selectedRow = await env.WIKI_DB.prepare('SELECT COUNT(*) AS n FROM wiki_chat_items WHERE run_id = ?').bind(runId).first();
  const remaining = Math.max(0, Number(run.requested || 0) - Number(selectedRow?.n || 0));
  if (!remaining) return 0;

  const [jobsResult, articlesResult, pendingResult, specialItemsResult, incidentsResult] = await Promise.all([
    env.WIKI_DB.prepare('SELECT code FROM wiki_jobs').all(),
    env.WIKI_DB.prepare('SELECT code FROM wiki_articles').all(),
    env.WIKI_DB.prepare("SELECT DISTINCT code FROM wiki_chat_items WHERE status = 'pending'").all(),
    env.WIKI_DB.prepare("SELECT DISTINCT code FROM wiki_chat_items WHERE status IN ('deferred', 'needs_review')").all(),
    env.WIKI_DB.prepare("SELECT DISTINCT code FROM wiki_chat_incidents WHERE rescue_state IN ('pending', 'claimed', 'chat_claimed', 'needs_review')").all()
  ]);

  const jobs = new Set((jobsResult.results || []).map(row => String(row.code)));
  const blocked = new Set([
    ...(articlesResult.results || []).map(row => String(row.code)),
    ...(pendingResult.results || []).map(row => String(row.code)),
    ...(specialItemsResult.results || []).map(row => String(row.code)),
    ...(incidentsResult.results || []).map(row => String(row.code))
  ]);

  const candidates = [];
  for (let globalIndex = 0; globalIndex < WIKI_TOTAL_ENTRIES && candidates.length < remaining; globalIndex++) {
    const job = jobFromGlobalIndex(globalIndex);
    if (!job || jobs.has(job.code) || blocked.has(job.code)) continue;
    candidates.push(job);
  }
  if (!candidates.length) return 0;

  const results = await env.WIKI_DB.batch(candidates.map(job => env.WIKI_DB.prepare(
    "INSERT OR IGNORE INTO wiki_jobs(code, language, language_name, n, seed_path, status, updated_at) VALUES (?, ?, ?, ?, ?, 'pending', ?)"
  ).bind(job.code, job.language, job.languageName, job.n, job.seedPath, now)));
  return results.reduce((sum, result) => sum + Number(result?.meta?.changes || 0), 0);
}

async function mlsChatFillNormalRun(env, runId) {
  const now = new Date().toISOString();
  for (let pass = 0; pass < 64; pass++) {
    const run = await env.WIKI_DB.prepare('SELECT requested FROM wiki_chat_runs WHERE id = ?').bind(runId).first();
    if (!run) return;
    const selectedRow = await env.WIKI_DB.prepare('SELECT COUNT(*) AS n FROM wiki_chat_items WHERE run_id = ?').bind(runId).first();
    if (Number(selectedRow?.n || 0) >= Number(run.requested || 0)) return;

    const reserved = await mlsChatReserveNormal(env, runId);
    if (reserved > 0) continue;

    const materialized = await mlsChatMaterializeNormalCandidates(env, runId, now);
    if (materialized <= 0) return;
  }
  throw new Error('No fue posible estabilizar la reserva FIFO canónica tras 64 intentos.');
}
`;

const canonicalStart = String.raw`async function mlsChatStart(env, body) {
  const command = String(body.command || '').trim();
  const rescue = /^MLS\s+rescate\s+siguientes\s+(\d{1,3})$/i.exec(command);
  const match = rescue || /^MLS\s+siguientes\s+(\d{1,3})$/i.exec(command);
  const count = match ? Number(match[1]) : 0;
  if (!Number.isInteger(count) || count < 1 || count > 400) mlsChatError(400, 'Usa MLS siguientes N o MLS rescate siguientes N, con N entre 1 y 400.');
  if (!/^[A-Za-z0-9_-]{16,80}$/.test(body.requestId || '')) mlsChatError(400, 'requestId debe ser un identificador estable de 16–80 caracteres.');
  const previous = await env.WIKI_DB.prepare('SELECT id FROM wiki_chat_runs WHERE request_id = ?').bind(body.requestId).first();
  if (previous) return {reused: true, run: await mlsChatRun(env, previous.id)};

  const id = crypto.randomUUID(), now = new Date().toISOString();
  const runType = rescue ? 'rescue-chat' : 'normal';
  const createQueries = [
    env.WIKI_DB.prepare('INSERT INTO wiki_chat_runs VALUES (?, ?, ?, ?, ?, ?)').bind(id, body.requestId, count, 'active', now, now),
    env.WIKI_DB.prepare('INSERT INTO wiki_chat_run_meta(run_id, run_type) VALUES (?, ?)').bind(id, runType)
  ];

  if (rescue) {
    createQueries.push(
      env.WIKI_DB.prepare(`INSERT INTO wiki_chat_items(run_id, position, code)
        SELECT ?, row_number() OVER (ORDER BY i.created_at) - 1, i.code FROM wiki_chat_incidents i
        WHERE i.rescue_state = 'pending' AND i.runner_eligible = 1
          AND NOT EXISTS (SELECT 1 FROM wiki_articles a WHERE a.code = i.code)
          AND NOT EXISTS (SELECT 1 FROM wiki_chat_rescue_claims c WHERE c.incident_id = i.id AND c.status = 'pending')
        ORDER BY i.created_at LIMIT ?`).bind(id, count),
      env.WIKI_DB.prepare(`INSERT INTO wiki_chat_rescue_claims(incident_id, run_id, created_at, updated_at)
        SELECT i.id, ?, ?, ? FROM wiki_chat_incidents i JOIN wiki_chat_items x ON x.code = i.code AND x.run_id = ?`).bind(id, now, now, id),
      env.WIKI_DB.prepare(`UPDATE wiki_chat_incidents SET rescue_state = 'chat_claimed', runner_eligible = 0, updated_at = ?
        WHERE EXISTS (SELECT 1 FROM wiki_chat_rescue_claims c WHERE c.incident_id = wiki_chat_incidents.id AND c.run_id = ? AND c.status = 'pending')`).bind(now, id)
    );
  }

  try {
    await env.WIKI_DB.batch(createQueries);
    if (!rescue) await mlsChatFillNormalRun(env, id);
    await env.WIKI_DB.prepare(`UPDATE wiki_chat_runs SET status = 'complete', updated_at = ? WHERE id = ?
      AND NOT EXISTS (SELECT 1 FROM wiki_chat_items WHERE run_id = ?)`).bind(new Date().toISOString(), id, id).run();
  } catch (error) {
    const concurrent = await env.WIKI_DB.prepare('SELECT id FROM wiki_chat_runs WHERE request_id = ?').bind(body.requestId).first();
    if (concurrent) {
      if (!rescue) await mlsChatFillNormalRun(env, concurrent.id);
      return {reused: true, run: await mlsChatRun(env, concurrent.id)};
    }
    throw error;
  }
  return {reused: false, run: await mlsChatRun(env, id)};
}`;

function patchCanonicalFifo(source) {
  if (source.includes(installedMarker)) return source;
  const start = source.indexOf(startMarker);
  const next = source.indexOf(nextMarker, start);
  if (start < 0 || next < 0) throw new Error('No se encontró mlsChatStart para instalar FIFO canónico.');
  return source.slice(0, start) + canonicalHelpers + '\n' + canonicalStart + source.slice(next);
}

function main() {
  let source = fs.readFileSync(backendPath, 'utf8');
  source = patchCanonicalFifo(source);
  fs.writeFileSync(backendPath, source, 'utf8');
  console.log('FIFO canónico habilitado: materialización bajo demanda sin tocar publicaciones ni estados especiales.');
}

module.exports = {patchCanonicalFifo, canonicalHelpers, canonicalStart, sourcePath};
if (require.main === module) main();
