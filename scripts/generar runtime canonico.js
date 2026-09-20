'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { LANGUAGES, PROMPT_VERSION } = require('./exportar corpus canonico.js');
const { validateCanonicalCorpus } = require('./validar corpus canonico.js');

const SOURCE_ROOT = path.resolve(process.env.MLS_CANONICAL_ROOT || 'content');
const OUTPUT_ROOT = path.resolve(process.env.MLS_CANONICAL_RUNTIME_ROOT || 'public/data/canonical');
const SHARD_SIZE = Math.max(25, Math.min(500, Number(process.env.MLS_CANONICAL_SHARD_SIZE) || 100));

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function padded(n) {
  return String(n).padStart(4, '0');
}

function shardBounds(n, total, shardSize = SHARD_SIZE) {
  const start = Math.floor((Number(n) - 1) / shardSize) * shardSize + 1;
  return { start, end: Math.min(total, start + shardSize - 1) };
}

function shardRelativePath(language, start, end) {
  return 'shards/' + language + '/' + padded(start) + '-' + padded(end) + '.json';
}

function stableJson(value) {
  return JSON.stringify(value, null, 2) + '\n';
}

function readEntry(language, n, sourceRoot = SOURCE_ROOT) {
  const code = language.prefix + '-' + padded(n);
  const file = path.join(sourceRoot, language.slug, code + '.json');
  const article = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (article.code !== code) throw new Error(file + ': code no coincide.');
  if (article.language !== language.slug) throw new Error(file + ': language no coincide.');
  if (article.promptVersion !== PROMPT_VERSION) throw new Error(file + ': promptVersion no coincide.');
  if (!String(article.articleMarkdown || '').trim()) throw new Error(file + ': articleMarkdown vacío.');
  if (/legacy/i.test(String(article.provider || '')) || /legacy/i.test(String(article.auditProvider || ''))) {
    throw new Error(file + ': proveedor legacy detectado.');
  }
  return article;
}

function buildCanonicalRuntime(options = {}) {
  const sourceRoot = path.resolve(options.sourceRoot || SOURCE_ROOT);
  const outputRoot = path.resolve(options.outputRoot || OUTPUT_ROOT);
  const languages = options.languages || LANGUAGES;
  const shardSize = options.shardSize || SHARD_SIZE;
  const shouldValidate = options.validateSource !== false;

  if (shouldValidate && sourceRoot === SOURCE_ROOT) validateCanonicalCorpus();

  fs.rmSync(outputRoot, { recursive: true, force: true });
  fs.mkdirSync(outputRoot, { recursive: true });

  const runtimeManifest = {
    standard: 'MLS R32',
    promptVersion: PROMPT_VERSION,
    generatedFrom: 'GitHub canonical content/',
    shardSize,
    totalEntries: 0,
    languages: {}
  };
  const globalIndex = [];

  for (const language of languages) {
    const catalog = [];
    const shardDescriptors = [];

    for (let start = 1; start <= language.total; start += shardSize) {
      const end = Math.min(language.total, start + shardSize - 1);
      const entries = {};

      for (let n = start; n <= end; n++) {
        const article = readEntry(language, n, sourceRoot);
        entries[article.code] = article;
        const meta = {
          code: article.code,
          language: article.language,
          languageName: article.languageName,
          n: article.n,
          title: article.title,
          level: article.level,
          part: article.part,
          chapter: article.chapter,
          shard: shardRelativePath(language.slug, start, end)
        };
        catalog.push(meta);
        globalIndex.push(meta);
      }

      const shard = {
        standard: 'MLS R32',
        promptVersion: PROMPT_VERSION,
        language: language.slug,
        range: { start, end },
        entries
      };
      const raw = stableJson(shard);
      const rel = shardRelativePath(language.slug, start, end);
      const target = path.join(outputRoot, rel);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, raw, 'utf8');
      shardDescriptors.push({
        start,
        end,
        path: rel,
        sha256: sha256(raw),
        bytes: Buffer.byteLength(raw, 'utf8'),
        entries: end - start + 1
      });
    }

    const catalogRaw = stableJson({
      standard: 'MLS R32',
      promptVersion: PROMPT_VERSION,
      language: language.slug,
      totalEntries: catalog.length,
      entries: catalog
    });
    const catalogRel = 'catalog/' + language.slug + '.json';
    const catalogTarget = path.join(outputRoot, catalogRel);
    fs.mkdirSync(path.dirname(catalogTarget), { recursive: true });
    fs.writeFileSync(catalogTarget, catalogRaw, 'utf8');

    runtimeManifest.languages[language.slug] = {
      name: language.name,
      prefix: language.prefix,
      totalEntries: language.total,
      catalog: catalogRel,
      shards: shardDescriptors
    };
    runtimeManifest.totalEntries += language.total;
  }

  globalIndex.sort((a, b) => a.code.localeCompare(b.code, 'en'));
  const indexRaw = stableJson({
    standard: 'MLS R32',
    promptVersion: PROMPT_VERSION,
    totalEntries: globalIndex.length,
    entries: globalIndex
  });
  fs.writeFileSync(path.join(outputRoot, 'index.json'), indexRaw, 'utf8');

  const manifestRaw = stableJson(runtimeManifest);
  fs.writeFileSync(path.join(outputRoot, 'runtime-manifest.json'), manifestRaw, 'utf8');

  const health = {
    ok: true,
    promptVersion: PROMPT_VERSION,
    totalEntries: runtimeManifest.totalEntries,
    shardSize,
    shardCount: Object.values(runtimeManifest.languages).reduce((sum, item) => sum + item.shards.length, 0),
    catalogCount: Object.keys(runtimeManifest.languages).length,
    indexSha256: sha256(indexRaw),
    manifestSha256: sha256(manifestRaw)
  };
  fs.writeFileSync(path.join(outputRoot, 'runtime-health.json'), stableJson(health), 'utf8');
  process.stdout.write(JSON.stringify(health, null, 2) + '\n');
  return health;
}

module.exports = {
  SHARD_SIZE,
  shardBounds,
  shardRelativePath,
  buildCanonicalRuntime
};

if (require.main === module) {
  try {
    buildCanonicalRuntime();
  } catch (error) {
    console.error('ERROR canonical runtime build:', error.message);
    process.exitCode = 1;
  }
}
