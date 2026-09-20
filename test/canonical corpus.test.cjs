'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');

global.mlsChatError = (status,message) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};
global.mlsChatHash = async value => crypto.createHash('sha256').update(String(value)).digest('hex');

const canonical = require(path.join(process.cwd(),'MLS R32 EDITORIAL','staging.js'));

test('canonical path uses language and numeric filename', () => {
  assert.equal(
    canonical.mlsCanonicalEntryPath({language:'portugues',n:493}),
    'content/portugues/0493.json'
  );
});

test('canonical normalize preserves R32 article and creates stable hash', async () => {
  const row = {
    code:'MLS-V02-0493',
    language:'portugues',
    language_name:'Português brasileiro',
    n:493,
    title:'Substantivos',
    level:'A1',
    part:'Gramática',
    chapter:'Nomes',
    article_markdown:'# Substantivos\n\nConteúdo.',
    provider:'workers-ai',
    model:'fixture',
    audit_provider:'workers-ai',
    audit_model:'fixture-audit',
    prompt_version:'32.0',
    generated_at:'2026-09-19T00:00:00.000Z'
  };
  const a = await canonical.mlsCanonicalNormalizeArticle(row);
  const b = await canonical.mlsCanonicalNormalizeArticle(row);
  assert.equal(a.code,row.code);
  assert.equal(a.articleMarkdown,row.article_markdown);
  assert.equal(a.editorial.promptVersion,'32.0');
  assert.match(a.contentHash,/^[0-9a-f]{64}$/);
  assert.equal(a.contentHash,b.contentHash);
});

test('canonical repo defaults to dedicated branch', () => {
  const repo = canonical.mlsCanonicalRepo({
    MLS_STAGING_GITHUB_OWNER:'dpidiaz',
    MLS_STAGING_GITHUB_REPO:'llmchatmls'
  });
  assert.equal(repo.branch,'mls-canonical');
});


test('canonical route build patch stays syntactically escaped', () => {
  const fs = require('node:fs');
  const patchSource = fs.readFileSync(
    path.join(process.cwd(),'scripts','habilitar chat editorial.js'),
    'utf8'
  );
  assert.match(
    patchSource,
    /canonical\\"\)\) return handleMlsCanonical\(request, env, url\);\\\\n/
  );
});
