'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  LANGUAGES,
  PROMPT_VERSION,
  rowsFromWranglerJson,
  normalizeArticle,
  validateArticle
} = require('../scripts/exportar corpus canonico.js');

test('rowsFromWranglerJson accepts Wrangler result arrays', () => {
  assert.deepEqual(rowsFromWranglerJson([{ results: [{ code: 'A' }] }]), [{ code: 'A' }]);
  assert.deepEqual(rowsFromWranglerJson({ result: { results: [{ code: 'B' }] } }), [{ code: 'B' }]);
});

test('normalizeArticle maps D1 snake_case fields', () => {
  const article = normalizeArticle({
    code: 'mls-v10-0001',
    language: 'espanol-guatemala',
    language_name: 'Español de Guatemala',
    n: 1,
    title: 'Título',
    level: 'A1',
    part: 'Parte',
    chapter: 'Capítulo',
    article_markdown: '#### Explicación\n\nContenido.',
    provider: 'cloudflare-gemma',
    model: 'model',
    audit_provider: 'cloudflare-gemma',
    audit_model: 'model',
    prompt_version: PROMPT_VERSION,
    generated_at: '2026-09-19T00:00:00.000Z'
  });
  assert.equal(article.code, 'MLS-V10-0001');
  assert.equal(article.languageName, 'Español de Guatemala');
  assert.equal(article.articleMarkdown, '#### Explicación\n\nContenido.');
  assert.equal(article.promptVersion, PROMPT_VERSION);
});

test('validateArticle accepts canonical R32 identity and rejects legacy providers', () => {
  const language = LANGUAGES.find(item => item.slug === 'espanol-guatemala');
  const article = {
    code: 'MLS-V10-0001',
    language: language.slug,
    languageName: language.name,
    n: 1,
    title: 'Título',
    level: 'A1',
    part: 'Parte',
    chapter: 'Capítulo',
    articleMarkdown: '#### Explicación\n\nContenido canónico.',
    provider: 'cloudflare-gemma',
    model: 'model',
    auditProvider: 'cloudflare-gemma',
    auditModel: 'model',
    promptVersion: PROMPT_VERSION,
    generatedAt: '2026-09-19T00:00:00.000Z'
  };
  assert.equal(validateArticle(article, language).code, article.code);
  assert.throws(
    () => validateArticle({ ...article, provider: 'cloudflare-legacy' }, language),
    /legacy/
  );
});
