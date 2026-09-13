// Installed into the canonical R32 runtime by habilitar chat editorial.js.
// ChatGPT writes the prose. This module never calls an AI provider or generates in the background.
function mlsChatError(status, message) {
  const error = new Error(message); error.status = status; throw error;
}
function mlsChatJson(data, status = 200) {
  return Response.json(data, {status, headers: {'cache-control': 'no-store'}});
}
async function mlsChatHash(text) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}
async function mlsChatAuthenticate(request, env) {
  const secret = env.MLS_EDITORIAL_CHAT_KEY;
  if (typeof secret !== 'string' || secret.length < 32) mlsChatError(503, 'Falta configurar la clave privada MLS_EDITORIAL_CHAT_KEY.');
  const auth = request.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ') || auth.length > 1024) mlsChatError(401, 'Autenticación requerida.');
  const a = await mlsChatHash(auth.slice(7)), b = await mlsChatHash(secret);
  let diff = 0; for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  if (diff) mlsChatError(401, 'Clave editorial no válida.');
}
async function mlsChatBody(request) {
  if (!(request.headers.get('content-type') || '').includes('application/json')) mlsChatError(415, 'Se requiere JSON.');
  const reader = request.body?.getReader();
  if (!reader) mlsChatError(400, 'Falta el cuerpo JSON.');
  const chunks = []; let size = 0;
  while (true) {
    const {done, value} = await reader.read(); if (done) break;
    size += value.byteLength;
    if (size > 60000) { await reader.cancel(); mlsChatError(413, 'Solicitud demasiado grande. Enviar una entrada por vez.'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  try { const value = JSON.parse(new TextDecoder().decode(bytes));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error(); return value;
  } catch { mlsChatError(400, 'JSON no válido.'); }
}
async function mlsChatEnsureDb(env) {
  await env.WIKI_DB.batch([
    env.WIKI_DB.prepare(`CREATE TABLE IF NOT EXISTS wiki_chat_runs (
      id TEXT PRIMARY KEY, request_id TEXT NOT NULL UNIQUE, requested INTEGER NOT NULL,
      status TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`),
    env.WIKI_DB.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS wiki_chat_single_active
      ON wiki_chat_runs(status) WHERE status = 'active'`),
    env.WIKI_DB.prepare(`CREATE TABLE IF NOT EXISTS wiki_chat_items (
      run_id TEXT NOT NULL, position INTEGER NOT NULL, code TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
      PRIMARY KEY(run_id, code), UNIQUE(run_id, position))`),
    env.WIKI_DB.prepare(`CREATE TABLE IF NOT EXISTS wiki_chat_contexts (
      id TEXT PRIMARY KEY, run_id TEXT NOT NULL, code TEXT NOT NULL, context_json TEXT NOT NULL,
      UNIQUE(run_id, code))`),
    env.WIKI_DB.prepare(`CREATE TABLE IF NOT EXISTS wiki_chat_drafts (
      id TEXT PRIMARY KEY, run_id TEXT NOT NULL, code TEXT NOT NULL, context_id TEXT NOT NULL,
      markdown TEXT NOT NULL, review TEXT NOT NULL, created_at TEXT NOT NULL)`)
  ]);
}
async function mlsChatRun(env, id) {
  const run = id === 'active'
    ? await env.WIKI_DB.prepare("SELECT * FROM wiki_chat_runs WHERE status = 'active'").first()
    : await env.WIKI_DB.prepare('SELECT * FROM wiki_chat_runs WHERE id = ?').bind(id).first();
  if (!run) return null;
  const {results} = await env.WIKI_DB.prepare('SELECT position, code, status FROM wiki_chat_items WHERE run_id = ? ORDER BY position').bind(run.id).all();
  return {id: run.id, requested: run.requested, selected: results.length, status: run.status,
    published: results.filter(x => x.status === 'published').length,
    alreadyPublishedElsewhere: results.filter(x => x.status === 'external').length,
    remaining: results.filter(x => x.status === 'pending').length, entries: results};
}
async function mlsChatReconcile(env, id) {
  // A visitor may have materialized one of the selected articles. Never replace it.
  await env.WIKI_DB.batch([
    env.WIKI_DB.prepare(`UPDATE wiki_chat_items SET status = 'external' WHERE run_id = ? AND status = 'pending'
      AND EXISTS (SELECT 1 FROM wiki_articles a WHERE a.code = wiki_chat_items.code)`).bind(id),
    env.WIKI_DB.prepare(`UPDATE wiki_chat_runs SET status = 'complete', updated_at = ? WHERE id = ? AND status = 'active'
      AND NOT EXISTS (SELECT 1 FROM wiki_chat_items WHERE run_id = ? AND status = 'pending')`).bind(new Date().toISOString(), id, id)
  ]);
}
async function mlsChatStart(env, body) {
  const match = /^MLS\s+siguientes\s+(\d{1,3})$/i.exec(String(body.command || '').trim());
  const count = match ? Number(match[1]) : 0;
  if (!Number.isInteger(count) || count < 1 || count > 100) mlsChatError(400, 'Usa MLS siguientes N, con N entre 1 y 100.');
  if (!/^[A-Za-z0-9_-]{16,80}$/.test(body.requestId || '')) mlsChatError(400, 'requestId debe ser un identificador estable de 16–80 caracteres.');
  const previous = await env.WIKI_DB.prepare('SELECT id FROM wiki_chat_runs WHERE request_id = ?').bind(body.requestId).first();
  if (previous) return {reused: true, run: await mlsChatRun(env, previous.id)};
  const active = await mlsChatRun(env, 'active');
  if (active) return {reused: true, message: 'Ya existe un lote activo. Usa MLS continuar o cancélalo explícitamente antes de abrir otro.', run: active};
  const {results} = await env.WIKI_DB.prepare(`SELECT code FROM wiki_jobs
    WHERE status <> 'published' AND NOT EXISTS (SELECT 1 FROM wiki_articles a WHERE a.code = wiki_jobs.code)
    ORDER BY ${WIKI_FIFO_ORDER_SQL} LIMIT ?`).bind(count).all();
  const id = crypto.randomUUID(), now = new Date().toISOString();
  const queries = [env.WIKI_DB.prepare('INSERT INTO wiki_chat_runs VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, body.requestId, count, results.length ? 'active' : 'complete', now, now)];
  queries.push(env.WIKI_DB.prepare(`INSERT INTO wiki_chat_items(run_id, position, code)
    SELECT ?, CAST(key AS INTEGER), json_extract(value, '$.code') FROM json_each(?)`).bind(id, JSON.stringify(results)));
  try { await env.WIKI_DB.batch(queries); }
  catch (error) {
    const concurrent = await mlsChatRun(env, 'active');
    if (concurrent) return {reused: true, run: concurrent};
    throw error;
  }
  return {reused: false, run: await mlsChatRun(env, id)};
}
async function mlsChatNext(env, id) {
  let run = await mlsChatRun(env, id);
  if (!run) mlsChatError(404, 'No hay lote activo. Solicita MLS siguientes N.');
  await mlsChatReconcile(env, run.id); run = await mlsChatRun(env, run.id);
  const item = run.entries.find(x => x.status === 'pending');
  if (run.status !== 'active' || !item) return {run, context: null};
  let saved = await env.WIKI_DB.prepare('SELECT * FROM wiki_chat_contexts WHERE run_id = ? AND code = ?').bind(run.id, item.code).first();
  if (!saved) {
    const context = await getEditorialContextR32(env, item.code, 6);
    if (!context.ok || !context.profile?.available || !context.references?.length) mlsChatError(409, 'No hay calibración publicada suficiente para esta entrada.');
    if (context.promptVersion !== '32.0') mlsChatError(409, 'La versión editorial cambió.');
    const contextJson = JSON.stringify(context);
    if (contextJson.length > 50000) mlsChatError(413, 'Contexto demasiado extenso para Actions; requiere revisión editorial.');
    await env.WIKI_DB.prepare('INSERT OR IGNORE INTO wiki_chat_contexts VALUES (?, ?, ?, ?)')
      .bind(crypto.randomUUID(), run.id, item.code, contextJson).run();
    saved = await env.WIKI_DB.prepare('SELECT * FROM wiki_chat_contexts WHERE run_id = ? AND code = ?').bind(run.id, item.code).first();
  }
  const context = JSON.parse(saved.context_json);
  return {run, contextId: saved.id, context,
    editorialRules: {standard: 'MLS R32', promptVersion: '32.0', systemPrompt: SYSTEM_PROMPT,
      languageModule: LANGUAGE_MODULES[context.target.language], contract: MLS_CHAT_CONTRACT},
    instruction: 'Redactar solo context.target; revisar precisión y estilo; validar el borrador antes de publicar.'};
}
function mlsChatValidateText(context, markdown, referenceCodes, review) {
  if (typeof markdown !== 'string' || markdown.length > 16000) mlsChatError(422, 'El texto debe tener como máximo 16000 caracteres.');
  if (typeof review !== 'string' || review.trim().length < 40 || review.length > 3000) mlsChatError(422, 'Incluye una revisión lingüística y editorial breve del borrador.');
  const expected = context.references.map(r => r.code).sort();
  if (!Array.isArray(referenceCodes) || JSON.stringify([...new Set(referenceCodes)].sort()) !== JSON.stringify(expected))
    mlsChatError(422, 'Debes consultar y declarar todas las referencias del contexto.');
  const calibration = MLS_CHAT_VALIDATORS.validateCalibration({calibration: {mode: 'published-corpus', referenceCodes, profile: context.profile}}, 'ChatGPT');
  const article = MLS_CHAT_VALIDATORS.validateArticle({...context.target, articleMarkdown: markdown}, 0, 'ChatGPT', calibration);
  const issues = basicArticleValidation(article.articleMarkdown);
  if (/<\/?(?:script|iframe|object|embed)\b|javascript\s*:/iu.test(markdown)) issues.push('HTML ejecutable o enlaces no permitidos.');
  if (issues.length) mlsChatError(422, issues.join(' '));
  return article;
}
async function mlsChatValidate(env, body) {
  const run = await mlsChatRun(env, body.runId);
  if (!run || run.status !== 'active') mlsChatError(409, 'El lote no está activo.');
  const item = run.entries.find(x => x.status === 'pending');
  if (!item || item.code !== body.code) mlsChatError(409, 'El código no es la siguiente entrada del lote.');
  const saved = await env.WIKI_DB.prepare('SELECT * FROM wiki_chat_contexts WHERE id = ? AND run_id = ? AND code = ?')
    .bind(body.contextId, run.id, item.code).first();
  if (!saved) mlsChatError(409, 'Consulta primero el contexto de la siguiente entrada.');
  let article;
  try { article = mlsChatValidateText(JSON.parse(saved.context_json), body.articleMarkdown, body.referenceCodes, body.editorialReview); }
  catch (error) { mlsChatError(422, error.message); }
  const id = await mlsChatHash(run.id + '\n' + saved.id + '\n' + article.articleMarkdown);
  await env.WIKI_DB.prepare('INSERT OR IGNORE INTO wiki_chat_drafts VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(id, run.id, item.code, saved.id, article.articleMarkdown, body.editorialReview, new Date().toISOString()).run();
  return {valid: true, draftId: id, code: item.code, words: article.articleMarkdown.split(/\s+/u).length,
    standard: 'MLS R32', promptVersion: '32.0', validation: 'deterministic-r32', linguisticReview: 'performed-by-chatgpt', published: false};
}
async function mlsChatPublish(env, body) {
  const draft = await env.WIKI_DB.prepare('SELECT * FROM wiki_chat_drafts WHERE id = ? AND run_id = ?').bind(body.draftId, body.runId).first();
  if (!draft) mlsChatError(404, 'No existe un borrador validado para este lote.');
  let run = await mlsChatRun(env, draft.run_id);
  const item = run.entries.find(x => x.code === draft.code);
  if (item?.status === 'published') {
    const receipt = await env.WIKI_DB.prepare('SELECT audit_model FROM wiki_articles WHERE code = ?').bind(draft.code).first();
    if (receipt?.audit_model !== 'chat-draft-' + draft.id) mlsChatError(409, 'Esta entrada se publicó con otro borrador; no se sobrescribirá.');
    return {published: true, reused: true, code: draft.code, run};
  }
  if (run.status !== 'active' || run.entries.find(x => x.status === 'pending')?.code !== draft.code) mlsChatError(409, 'El lote no permite publicar ese código ahora.');
  const saved = await env.WIKI_DB.prepare('SELECT * FROM wiki_chat_contexts WHERE id = ?').bind(draft.context_id).first();
  const context = JSON.parse(saved.context_json);
  const a = mlsChatValidateText(context, draft.markdown, context.references.map(x => x.code), draft.review);
  const guard = `EXISTS (SELECT 1 FROM wiki_chat_runs r WHERE r.id = ? AND r.status = 'active')
    AND EXISTS (SELECT 1 FROM wiki_chat_items i WHERE i.run_id = ? AND i.code = ? AND i.status = 'pending'
      AND NOT EXISTS (SELECT 1 FROM wiki_chat_items p WHERE p.run_id = i.run_id AND p.position < i.position AND p.status = 'pending'))`;
  const own = `EXISTS (SELECT 1 FROM wiki_articles a WHERE a.code = ? AND a.article_markdown = ? AND a.generated_at = ? AND a.audit_model = ?)`;
  const audit = 'chat-draft-' + draft.id;
  const queries = [
    env.WIKI_DB.prepare(`INSERT INTO wiki_articles(code, language, language_name, n, title, level, part, chapter,
      article_markdown, provider, model, audit_provider, audit_model, prompt_version, generated_at)
      SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, 'mls-r32', 'editorial-standard-32', 'mls-r32-validator', ?, '32.0', ?
      WHERE ${guard} ON CONFLICT(code) DO NOTHING`).bind(a.code, a.language, a.languageName, a.n, a.title, a.level, a.part, a.chapter,
        a.articleMarkdown, audit, draft.created_at, run.id, run.id, a.code),
    env.WIKI_DB.prepare(`UPDATE wiki_jobs SET status = 'published', provider = 'mls-r32', model = 'editorial-standard-32',
      last_error = NULL, updated_at = ? WHERE code = ? AND ${guard} AND ${own}`)
      .bind(new Date().toISOString(), a.code, run.id, run.id, a.code, a.code, a.articleMarkdown, draft.created_at, audit),
    env.WIKI_DB.prepare(`UPDATE wiki_chat_items SET status = CASE WHEN ${own} THEN 'published' ELSE 'external' END
      WHERE run_id = ? AND code = ? AND status = 'pending' AND ${guard}
      AND EXISTS (SELECT 1 FROM wiki_articles WHERE code = ?)`)
      .bind(a.code, a.articleMarkdown, draft.created_at, audit, run.id, a.code, run.id, run.id, a.code, a.code),
    env.WIKI_DB.prepare(`UPDATE wiki_chat_runs SET status = 'complete', updated_at = ? WHERE id = ? AND status = 'active'
      AND NOT EXISTS (SELECT 1 FROM wiki_chat_items WHERE run_id = ? AND status = 'pending')`).bind(new Date().toISOString(), run.id, run.id)
  ];
  await env.WIKI_DB.batch(queries);
  run = await mlsChatRun(env, run.id);
  const published = run.entries.find(x => x.code === a.code)?.status === 'published';
  return {published, preservedExisting: !published, code: a.code, run,
    articleUrl: '/api/wiki/article/' + a.code};
}
async function handleMlsChat(request, env, url) {
  const route = url.pathname.replace('/api/wiki/editorial/chat', '') || '/';
  if (route === '/openapi.json' && request.method === 'GET') return mlsChatJson(MLS_CHAT_OPENAPI);
  if (route === '/instructions' && request.method === 'GET') return new Response(MLS_CHAT_INSTRUCTIONS, {headers: {'content-type': 'text/plain; charset=utf-8'}});
  try {
    await mlsChatAuthenticate(request, env);
    await ensureWikiDb(env); await mlsChatEnsureDb(env);
    if (route === '/status' && request.method === 'GET') {
      const id = url.searchParams.get('runId') || 'active';
      const run = await mlsChatRun(env, id);
      return mlsChatJson({ok: true, standard: 'MLS R32', promptVersion: '32.0', run, maximum: 100});
    }
    if (route === '/next' && request.method === 'GET') return mlsChatJson(await mlsChatNext(env, url.searchParams.get('runId') || 'active'));
    if (request.method !== 'POST') mlsChatError(405, 'Método no permitido.');
    const body = await mlsChatBody(request);
    if (route === '/start') return mlsChatJson(await mlsChatStart(env, body));
    if (route === '/validate') return mlsChatJson(await mlsChatValidate(env, body));
    if (route === '/publish') return mlsChatJson(await mlsChatPublish(env, body));
    if (route === '/cancel') {
      if (body.confirm !== true || typeof body.runId !== 'string') mlsChatError(400, 'Confirma la cancelación e indica runId.');
      await env.WIKI_DB.prepare("UPDATE wiki_chat_runs SET status = 'cancelled', updated_at = ? WHERE id = ? AND status = 'active'").bind(new Date().toISOString(), body.runId).run();
      return mlsChatJson({run: await mlsChatRun(env, body.runId)});
    }
    mlsChatError(404, 'Ruta no encontrada.');
  } catch (error) {
    if (!error.status) console.error('mls-chat-failure', error.message);
    return mlsChatJson({ok: false, error: error.status ? error.message : 'Error temporal. Consulta MLS estado antes de reintentar.'}, error.status || 500);
  }
}
