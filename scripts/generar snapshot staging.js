'use strict';

const fs = require('fs');
const path = require('path');

const TARGET_SHARD_MAX_BYTES = 700 * 1024;

const LANGUAGES = [
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
];

function normalizeSeed(seed, language, n) {
  const padded = String(n).padStart(4, '0');
  const pick = key => seed?.[key] === undefined || seed?.[key] === null ? undefined : seed[key];
  return {
    code: String(seed?.code || language.prefix + '-' + padded).toUpperCase(),
    language: seed?.language || language.slug,
    languageName: seed?.languageName || language.name,
    n: Number(seed?.n || n),
    title: pick('title'),
    level: pick('level'),
    part: pick('part'),
    chapter: pick('chapter'),
    target: pick('target'),
    definition: pick('definition') || String(seed?.articleMarkdown || '').replace(/^####.*$/gm, '').replace(/[*_`>#]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1200),
    example: pick('example'),
    notes: pick('notes'),
    reference: undefined
  };
}

function buildStagingTargetCatalog(root = process.cwd()) {
  const sourceRoot = path.join(root, 'content');
  const outputRoot = path.join(root, 'public', 'mls-staging-targets');
  if (!fs.existsSync(sourceRoot)) throw new Error('No existe content/ con el corpus canónico R32.');
  fs.rmSync(outputRoot, { recursive: true, force: true });
  fs.mkdirSync(outputRoot, { recursive: true });

  const manifest = {
    standard: 'MLS R32',
    promptVersion: '32.0',
    totalEntries: LANGUAGES.reduce((sum, item) => sum + item.total, 0),
    createdAt: new Date().toISOString(),
    sourceCommit: String(process.env.GITHUB_SHA || process.env.CF_PAGES_COMMIT_SHA || 'local'),
    languages: {}
  };

  for (const language of LANGUAGES) {
    const entries = [];
    for (let n = 1; n <= language.total; n++) {
      const padded = String(n).padStart(4, '0');
      const code = language.prefix + '-' + padded;
      const filename = path.join(sourceRoot, language.slug, code + '.json');
      if (!fs.existsSync(filename)) throw new Error('Falta entrada canónica R32: ' + filename);
      const seed = JSON.parse(fs.readFileSync(filename, 'utf8'));
      const normalized = normalizeSeed(seed, language, n);
      if (!/^MLS-V\d{2}-\d{4}$/.test(normalized.code)) throw new Error('Código inválido en semilla: ' + normalized.code);
      entries.push(normalized);
    }
    const files = [];
    let shardEntries = [];
    let shardBytes = 2;
    let totalBytes = 0;
    let shardIndex = 1;
    const flushShard = () => {
      if (!shardEntries.length) return;
      const safePrefix = language.prefix.replace(/-/g, ' ');
      const relative = safePrefix + ' ' + String(shardIndex).padStart(2, '0') + '.json';
      const content = JSON.stringify(shardEntries);
      const bytes = Buffer.byteLength(content, 'utf8');
      fs.writeFileSync(path.join(outputRoot, relative), content);
      files.push({
        file: relative,
        start: shardEntries[0].n,
        end: shardEntries[shardEntries.length - 1].n,
        count: shardEntries.length,
        bytes
      });
      totalBytes += bytes;
      console.log('MLS Staging target shard', language.slug, relative + ':', bytes, 'bytes');
      shardEntries = [];
      shardBytes = 2;
      shardIndex++;
    };
    for (const entry of entries) {
      const serialized = JSON.stringify(entry);
      const entryBytes = Buffer.byteLength(serialized, 'utf8') + (shardEntries.length ? 1 : 0);
      if (shardEntries.length && shardBytes + entryBytes > TARGET_SHARD_MAX_BYTES) flushShard();
      shardEntries.push(entry);
      shardBytes += entryBytes;
    }
    flushShard();
    manifest.languages[language.slug] = {
      name: language.name,
      prefix: language.prefix,
      total: language.total,
      files,
      bytes: totalBytes
    };
    console.log('MLS Staging target catalog', language.slug + ':', totalBytes, 'bytes in', files.length, 'shards');
  }

  fs.writeFileSync(path.join(outputRoot, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

module.exports = { LANGUAGES, TARGET_SHARD_MAX_BYTES, normalizeSeed, buildStagingTargetCatalog };
if (require.main === module) {
  const manifest = buildStagingTargetCatalog();
  console.log('Catálogo estático MLS Staging generado:', manifest.totalEntries, 'entradas.');
}
