'use strict';

const fs = require('fs');

function replaceOnce(text, search, replacement, label) {
  if (!text.includes(search)) throw new Error(`No se encontró el bloque esperado para ${label}.`);
  return text.replace(search, replacement);
}

const backendPath = 'src/index.js';
let backend = fs.readFileSync(backendPath, 'utf8');

if (!backend.includes('/api/wiki/editorial/pending')) {
  const marker = "async function handleWikiApi(request, env, url) {\n  await ensureWikiDb(env);";
  const replacement = `async function getEditorialPendingR32(env, requestedLimit) {\n  const limit = Math.max(1, Math.min(50, Number(requestedLimit) || 10));\n  const rows = await env.WIKI_DB.prepare(\`SELECT code, language, language_name AS languageName, n, status\n    FROM wiki_jobs\n    WHERE status <> 'published'\n    ORDER BY \${WIKI_FIFO_ORDER_SQL}\n    LIMIT ?\`).bind(limit).all();\n  const entries = [];\n  for (const row of rows.results || []) {\n    try {\n      const seed = await loadWikiSeed(env, String(row.code));\n      entries.push({\n        code: seed.code || row.code,\n        language: seed.language || row.language,\n        languageName: seed.languageName || row.languageName,\n        n: Number(seed.n || row.n),\n        status: row.status,\n        level: seed.level || '',\n        part: seed.part || '',\n        chapter: seed.chapter || '',\n        title: seed.title || '',\n        target: seed.target || '',\n        definition: seed.definition || '',\n        example: seed.example || '',\n        notes: seed.notes || '',\n        reference: seed.reference || ''\n      });\n    } catch (error) {\n      entries.push({\n        code: row.code,\n        language: row.language,\n        languageName: row.languageName,\n        n: Number(row.n),\n        status: row.status,\n        seedError: error?.message || 'No fue posible cargar la semilla.'\n      });\n    }\n  }\n  return {\n    standard: 'MLS R32',\n    promptVersion: WIKI_PROMPT_VERSION,\n    fifo: true,\n    limit,\n    count: entries.length,\n    entries\n  };\n}\n__name(getEditorialPendingR32, \"getEditorialPendingR32\");\nasync function handleWikiApi(request, env, url) {\n  await ensureWikiDb(env);\n  if (url.pathname === '/api/wiki/editorial/pending') {\n    if (request.method !== 'GET') return new Response('Method not allowed', { status: 405, headers: { allow: 'GET' } });\n    return Response.json(await getEditorialPendingR32(env, url.searchParams.get('limit')), { headers: { 'cache-control': 'no-store' } });\n  }\n  if (url.pathname === '/api/wiki/editorial/contract') {\n    if (request.method !== 'GET') return new Response('Method not allowed', { status: 405, headers: { allow: 'GET' } });\n    return Response.json({\n      standard: 'MLS R32',\n      promptVersion: WIKI_PROMPT_VERSION,\n      mode: 'ENCICLOPEDIA',\n      function: 'EXPLICAR → ACLARAR → AMPLIAR → RESPONDER',\n      principle: 'LA EXPLICACIÓN MÁS SENCILLA QUE SIGA SIENDO VERDADERA',\n      targetWords: { A1: '180–300', A2: '180–300', B1: '250–450', B2: '250–450', C1: '350–600', C2: '350–600' },\n      minimumWords: 90,\n      requiresFourthLevelHeading: true\n    }, { headers: { 'cache-control': 'no-store' } });\n  }`;
  backend = replaceOnce(backend, marker, replacement, 'rutas editoriales R32');
}

fs.writeFileSync(backendPath, backend);
console.log('Flujo editorial R32 habilitado.');
