'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const foundation = require('../../MLS R32 EDITORIAL/evidence foundation.js');
const apa = require('../../MLS R32 EDITORIAL/evidence apa.js');

const root = path.resolve(__dirname, '../..');
const output = path.resolve(root, 'tools/r33-local/workspace/output/r33/MLS-R33-pdf-metadata.jsonl');
const verified = new Set(JSON.parse(fs.readFileSync(path.join(root, 'MLS R32 EDITORIAL/evidence git/indexes/verified.json'), 'utf8')));
const comparison = JSON.parse(fs.readFileSync(path.join(root, 'tools/r33-local/workspace/output/r33/MLS-R33-backup-vs-canonical.json'), 'utf8'));
const backupMatches = new Map(comparison.details.map(row => [row.code, Boolean(row.backup_exact_canonical)]));
const backupTitles = new Map(comparison.details.map(row => [row.code, row.title]));
const contentRoot = path.join(root, 'content');
const evidenceRoot = path.join(root, 'MLS R32 EDITORIAL/evidence git/entries');
const sourceRoot = path.join(root, 'MLS R32 EDITORIAL/evidence git/registry/sources');
const sourceCache = new Map();

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function sha256(value) { return crypto.createHash('sha256').update(value, 'utf8').digest('hex'); }
function sourceById(id) {
  if (sourceCache.has(id)) return sourceCache.get(id);
  const file = path.join(sourceRoot, `${id}.json`);
  if (!fs.existsSync(file)) { sourceCache.set(id, null); return null; }
  const row = readJson(file);
  const value = row.metadata ? { ...row.metadata, sourceId: row.sourceId } : row;
  sourceCache.set(id, value);
  return value;
}

async function main() {
const lines = [];
for (const language of fs.readdirSync(contentRoot).sort()) {
  const directory = path.join(contentRoot, language);
  if (!fs.statSync(directory).isDirectory()) continue;
  for (const name of fs.readdirSync(directory).filter(x => /^MLS-V\d{2}-\d{4}\.json$/.test(x)).sort()) {
    const article = readJson(path.join(directory, name));
    const code = article.code;
    const evidencePath = path.join(evidenceRoot, language, `${code}.json`);
    let evidence = null;
    if (fs.existsSync(evidencePath)) evidence = readJson(evidencePath);
    const articleHash = await foundation.articleHash(article.articleMarkdown || '');
    const versionMatches = Boolean(evidence && evidence.article?.articleHash === articleHash && evidence.article?.articleGeneratedAt === article.generatedAt);
    const canonicalVerified = Boolean(versionMatches && evidence.status === 'VERIFIED' && verified.has(code));
    const sourceIds = versionMatches ? [...new Set((evidence.links || []).map(x => x.sourceId).filter(Boolean))] : [];
    const references = [];
    for (const sourceId of sourceIds) {
      const source = sourceById(sourceId);
      if (!source || (source.status && source.status !== 'active') || source.authorityTier === 'X') continue;
      try {
        const rendered = apa.renderApaReference(source, { locale: language === 'espanol-guatemala' ? 'es-GT' : 'en-US' });
        references.push({ sourceId, text: rendered.markdown, url: rendered.url, citationReady: true });
      } catch (error) {
        references.push({
          sourceId,
          title: source.title || '',
          url: source.canonicalUrl || null,
          citationReady: false,
          errors: error.errors || [error.message]
        });
      }
    }
    references.sort((a, b) => (a.text || a.title || '').localeCompare(b.text || b.title || '', 'und'));
    const related = [];
    const seen = new Set();
    const markdown = String(article.articleMarkdown || '');
    const linkPattern = /\[([^\]]+)\]\(#(?:entry|entrada|entree|entrée)-(\d+)\)/giu;
    for (const match of markdown.matchAll(linkPattern)) {
      const targetNumber = Number(match[2]);
      if (!Number.isInteger(targetNumber) || targetNumber === Number(article.n)) continue;
      const key = `${language}:${targetNumber}`;
      if (seen.has(key)) continue;
      seen.add(key);
      related.push({ label: match[1].replace(/\s+/gu, ' ').trim(), number: targetNumber, language });
    }
    lines.push(JSON.stringify({
      code,
      language,
      languageName: article.languageName,
      number: article.n,
      title: article.title,
      backupTitle: backupTitles.get(code) || null,
      articleHash,
      generatedAt: article.generatedAt,
      evidenceStatus: versionMatches ? evidence.status : 'UNSOURCED',
      evidenceRevision: versionMatches ? evidence.evidenceRevision : null,
      evidenceVersionMatches: versionMatches,
      canonicalVerified,
      backupVersionMatchesCanonical: backupMatches.get(code) === true,
      references,
      related
    }));
  }
}
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${lines.join('\n')}\n`, 'utf8');
console.log(JSON.stringify({ output, entries: lines.length, sourceRecords: sourceCache.size }, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; });
