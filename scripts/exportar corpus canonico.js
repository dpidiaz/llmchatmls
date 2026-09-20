'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const DB_BINDING = process.env.MLS_WIKI_DB_BINDING || 'WIKI_DB';
const PROMPT_VERSION = process.env.MLS_CANONICAL_PROMPT_VERSION || '32.0';
const PAGE_SIZE = Math.max(10, Math.min(250, Number(process.env.MLS_CANONICAL_PAGE_SIZE) || 100));
const ROOT = path.resolve(process.env.MLS_CANONICAL_ROOT || 'content');
const NEXT_ROOT = ROOT + '.next';

const LANGUAGES = Object.freeze([
  { slug: 'espanol-guatemala', name: 'Español de Guatemala', total: 930, prefix: 'MLS-V10' },
  { slug: 'ingles', name: 'Inglés', total: 766, prefix: 'MLS-V01' },
  { slug: 'portugues', name: 'Portugués brasileño', total: 1199, prefix: 'MLS-V02' },
  { slug: 'italiano', name: 'Italiano', total: 810, prefix: 'MLS-V03' },
  { slug: 'frances', name: 'Francés', total: 1159, prefix: 'MLS-V04' },
  { slug: 'aleman', name: 'Alemán', total: 1101, prefix: 'MLS-V05' },
  { slug: 'japones', name: 'Japonés', total: 1027, prefix: 'MLS-V06' },
  { slug: 'chino-taiwan', name: 'Chino mandarín de Taiwán', total: 1016, prefix: 'MLS-V07' },
  { slug: 'coreano', name: 'Coreano', total: 1094, prefix: 'MLS-V08' },
  { slug: 'ruso', name: 'Ruso', total: 1031, prefix: 'MLS-V09' }
]);

function fail(message) {
  throw new Error(message);
}

function sqlText(value) {
  return "'" + String(value ?? '').replace(/\u0000/g, '').replace(/'/g, "''") + "'";
}

function rowsFromWranglerJson(payload) {
  const blocks = Array.isArray(payload) ? payload : [payload];
  const rows = [];
  for (const block of blocks) {
    if (Array.isArray(block?.results)) rows.push(...block.results);
    else if (Array.isArray(block?.result?.results)) rows.push(...block.result.results);
  }
  return rows;
}

function runD1(sql) {
  const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const result = spawnSync(
    command,
    ['wrangler', 'd1', 'execute', DB_BINDING, '--remote', '--yes', '--json', '--command', sql],
    { encoding: 'utf8', env: process.env, maxBuffer: 128 * 1024 * 1024 }
  );
  if (result.error) throw result.error;
  if (result.status !== 0) {
    fail('Wrangler D1 falló (' + result.status + '): ' + String(result.stderr || result.stdout || '').trim());
  }
  let payload;
  try {
    payload = JSON.parse(result.stdout || '[]');
  } catch (error) {
    fail('Wrangler D1 no devolvió JSON válido: ' + error.message);
  }
  return rowsFromWranglerJson(payload);
}

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function normalizeArticle(row) {
  return {
    code: String(row.code || '').trim().toUpperCase(),
    language: String(row.language || '').trim(),
    languageName: String(row.languageName ?? row.language_name ?? '').trim(),
    n: Number(row.n),
    title: String(row.title || '').trim(),
    level: String(row.level || '').trim(),
    part: String(row.part || '').trim(),
    chapter: String(row.chapter || '').trim(),
    articleMarkdown: String(row.articleMarkdown ?? row.article_markdown ?? '').trim(),
    provider: String(row.provider || '').trim(),
    model: String(row.model || '').trim(),
    auditProvider: String(row.auditProvider ?? row.audit_provider ?? '').trim(),
    auditModel: String(row.auditModel ?? row.audit_model ?? '').trim(),
    promptVersion: String(row.promptVersion ?? row.prompt_version ?? '').trim(),
    generatedAt: String(row.generatedAt ?? row.generated_at ?? '').trim()
  };
}

function validateArticle(article, language) {
  const expectedCode = language.prefix + '-' + String(article.n).padStart(4, '0');
  if (!Number.isInteger(article.n) || article.n < 1 || article.n > language.total) {
    fail(article.code + ': n fuera de rango para ' + language.slug + '.');
  }
  if (article.code !== expectedCode) fail(article.code + ': código no coincide con n/idioma; se esperaba ' + expectedCode + '.');
  if (article.language !== language.slug) fail(article.code + ': idioma incorrecto: ' + article.language + '.');
  if (article.promptVersion !== PROMPT_VERSION) fail(article.code + ': promptVersion ' + article.promptVersion + ' no es ' + PROMPT_VERSION + '.');
  if (!article.title) fail(article.code + ': falta title.');
  if (!article.languageName) fail(article.code + ': falta languageName.');
  if (!article.articleMarkdown) fail(article.code + ': falta articleMarkdown.');
  if (article.provider === 'cloudflare-legacy' || article.auditProvider === 'cloudflare-legacy') {
    fail(article.code + ': se detectó proveedor legacy; no puede entrar al corpus canónico.');
  }
  return article;
}

function stableFile(article) {
  return JSON.stringify(article, null, 2) + '\n';
}

function queryCounts() {
  return runD1(
    'SELECT language, COUNT(*) AS count FROM wiki_articles WHERE prompt_version = ' +
    sqlText(PROMPT_VERSION) +
    ' GROUP BY language ORDER BY language'
  );
}

function queryPage(language, lastN) {
  const sql =
    'SELECT code, language, language_name AS languageName, n, title, level, part, chapter, ' +
    'article_markdown AS articleMarkdown, provider, model, audit_provider AS auditProvider, ' +
    'audit_model AS auditModel, prompt_version AS promptVersion, generated_at AS generatedAt ' +
    'FROM wiki_articles WHERE prompt_version = ' + sqlText(PROMPT_VERSION) +
    ' AND language = ' + sqlText(language.slug) +
    ' AND n > ' + Number(lastN || 0) +
    ' ORDER BY n ASC LIMIT ' + PAGE_SIZE;
  return runD1(sql);
}

function queryPresentNs(language) {
  return runD1(
    'SELECT n FROM wiki_articles WHERE prompt_version = ' + sqlText(PROMPT_VERSION) +
    ' AND language = ' + sqlText(language.slug) +
    ' ORDER BY n ASC'
  ).map(row => Number(row.n)).filter(Number.isInteger);
}

function missingCodes(language) {
  const present = new Set(queryPresentNs(language));
  const missing = [];
  for (let n = 1; n <= language.total; n++) {
    if (!present.has(n)) missing.push(language.prefix + '-' + String(n).padStart(4, '0'));
  }
  return missing;
}

function assertCompleteCounts(rows) {
  const actual = new Map(rows.map(row => [String(row.language), Number(row.count)]));
  const problems = [];
  for (const language of LANGUAGES) {
    const count = actual.get(language.slug) || 0;
    if (count !== language.total) {
      const missing = count < language.total ? missingCodes(language) : [];
      const detail = missing.length ? ' faltan [' + missing.join(', ') + ']' : '';
      problems.push(language.slug + ': ' + count + '/' + language.total + detail);
    }
  }
  for (const language of actual.keys()) {
    if (!LANGUAGES.some(item => item.slug === language)) problems.push('idioma inesperado: ' + language);
  }
  if (problems.length) fail('D1 todavía no contiene el corpus R32 completo: ' + problems.join('; '));
}

function atomicReplace(nextRoot, root) {
  const backup = root + '.previous';
  fs.rmSync(backup, { recursive: true, force: true });
  let movedOld = false;
  try {
    if (fs.existsSync(root)) {
      fs.renameSync(root, backup);
      movedOld = true;
    }
    fs.renameSync(nextRoot, root);
    fs.rmSync(backup, { recursive: true, force: true });
  } catch (error) {
    if (!fs.existsSync(root) && movedOld && fs.existsSync(backup)) fs.renameSync(backup, root);
    throw error;
  }
}

function exportCanonicalCorpus() {
  assertCompleteCounts(queryCounts());
  fs.rmSync(NEXT_ROOT, { recursive: true, force: true });
  fs.mkdirSync(NEXT_ROOT, { recursive: true });

  const manifestEntries = [];
  const manifestLanguages = {};
  const seen = new Set();

  try {
    for (const language of LANGUAGES) {
      const languageRoot = path.join(NEXT_ROOT, language.slug);
      fs.mkdirSync(languageRoot, { recursive: true });
      let lastN = 0;
      let count = 0;

      while (true) {
        const rows = queryPage(language, lastN);
        if (!rows.length) break;
        for (const row of rows) {
          const article = validateArticle(normalizeArticle(row), language);
          if (seen.has(article.code)) fail('Código duplicado: ' + article.code);
          seen.add(article.code);
          const file = stableFile(article);
          const relativePath = language.slug + '/' + article.code + '.json';
          fs.writeFileSync(path.join(NEXT_ROOT, relativePath), file, 'utf8');
          manifestEntries.push({
            code: article.code,
            language: article.language,
            n: article.n,
            title: article.title,
            level: article.level,
            path: relativePath,
            sha256: sha256(file),
            bytes: Buffer.byteLength(file, 'utf8')
          });
          count++;
          lastN = article.n;
        }
        if (rows.length < PAGE_SIZE) break;
      }

      if (count !== language.total) fail(language.slug + ': exportó ' + count + '/' + language.total + ' entradas.');
      manifestLanguages[language.slug] = {
        name: language.name,
        prefix: language.prefix,
        total: language.total
      };
      process.stdout.write('✓ ' + language.slug + ': ' + count + ' entradas\n');
    }

    const totalExpected = LANGUAGES.reduce((sum, item) => sum + item.total, 0);
    if (manifestEntries.length !== totalExpected) {
      fail('Total exportado ' + manifestEntries.length + ' no coincide con ' + totalExpected + '.');
    }

    manifestEntries.sort((a, b) => a.code.localeCompare(b.code, 'en'));
    const manifest = {
      standard: 'MLS R32',
      promptVersion: PROMPT_VERSION,
      source: 'Cloudflare D1 wiki_articles',
      totalEntries: totalExpected,
      languages: manifestLanguages,
      entries: manifestEntries
    };
    fs.writeFileSync(path.join(NEXT_ROOT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
    fs.writeFileSync(path.join(NEXT_ROOT, 'corpus-health.json'), JSON.stringify({
      ok: true,
      promptVersion: PROMPT_VERSION,
      totalEntries: totalExpected,
      byLanguage: Object.fromEntries(LANGUAGES.map(item => [item.slug, item.total]))
    }, null, 2) + '\n', 'utf8');

    atomicReplace(NEXT_ROOT, ROOT);
    process.stdout.write('Corpus canónico exportado: ' + totalExpected + ' entradas en ' + ROOT + '\n');
    return manifest;
  } catch (error) {
    fs.rmSync(NEXT_ROOT, { recursive: true, force: true });
    throw error;
  }
}

module.exports = {
  LANGUAGES,
  PROMPT_VERSION,
  rowsFromWranglerJson,
  normalizeArticle,
  validateArticle,
  sha256,
  exportCanonicalCorpus
};

if (require.main === module) {
  try {
    exportCanonicalCorpus();
  } catch (error) {
    console.error('ERROR canonical export:', error.message);
    process.exitCode = 1;
  }
}
