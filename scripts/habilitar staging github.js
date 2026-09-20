'use strict';

const fs = require('fs');

function replaceOnce(source, search, replacement, label) {
  if (source.includes(replacement)) return source;
  const index = source.indexOf(search);
  if (index < 0) throw new Error('No se encontró el bloque esperado para ' + label + '.');
  if (source.indexOf(search, index + search.length) >= 0) throw new Error('El bloque de ' + label + ' aparece más de una vez.');
  return source.slice(0, index) + replacement + source.slice(index + search.length);
}

function patchStagingGuards(source) {
  source = replaceOnce(
    source,
    'async function publishWikiArticle(env, article) {\n',
    `async function publishWikiArticle(env, article) {
  if (mlsStagingConfigured(env)) {
    const stagingGuard = await mlsStagingCodeState(env, article.code, { strong: true, failOpen: false });
    if (stagingGuard && ['reserved','drafting','validated','staged','integrated','deployed'].includes(stagingGuard.status)) {
      throw new Error('MLS Staging protege ' + article.code + '; la autogeneración no puede publicarlo en D1.');
    }
  }
`,
    'guardia fuerte antes de publicación Gemma'
  );

  source = replaceOnce(
    source,
    '  const now = (/* @__PURE__ */ new Date()).toISOString();\n  await env.WIKI_DB.prepare(`INSERT OR IGNORE INTO wiki_jobs',
    `  const stagedArticle = await mlsStagingServeArticle(env, job.code);
  if (stagedArticle) {
    return Response.json({ found: true, generated: false, flag: "staged-r32", article: stagedArticle }, {
      headers: { "cache-control": "private, no-store" }
    });
  }
  if (mlsStagingConfigured(env)) {
    const stagingState = await mlsStagingCodeState(env, job.code, { strong: false, failOpen: false });
    if (stagingState && ['reserved','drafting','validated'].includes(stagingState.status)) {
      return Response.json({ found: false, generated: false, flag: "staging-reserved", code: job.code }, {
        status: 202,
        headers: { "cache-control": "no-store", "retry-after": "3" }
      });
    }
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await env.WIKI_DB.prepare(\`INSERT OR IGNORE INTO wiki_jobs`,
    'protección temprana de materialización'
  );

  source = replaceOnce(
    source,
    `    const article = await getWikiArticleD1(env, code);
    if (!article) return Response.json({ found: false, code }, { status: 404, headers: { "cache-control": "no-store" } });`,
    `    let article = await getWikiArticleD1(env, code);
    if (!article) {
      const staged = await mlsStagingServeArticle(env, code);
      if (staged) article = staged;
    }
    if (!article) return Response.json({ found: false, code }, { status: 404, headers: { "cache-control": "no-store" } });`,
    'prioridad staged sobre ausencia R32'
  );

  return source;
}

function main() {
  const target = 'src/index.js';
  let source = fs.readFileSync(target, 'utf8');
  source = patchStagingGuards(source);
  fs.writeFileSync(target, source, 'utf8');
  console.log('Guardias MLS Staging instaladas: staged/reserved bloquean persistencia Gemma sin force push ni fallback.');
}

module.exports = { patchStagingGuards };
if (require.main === module) main();
