'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const stagingPath = 'MLS R32 EDITORIAL/staging.js';
const source = fs.readFileSync(stagingPath, 'utf8');
const staging = require('../MLS R32 EDITORIAL/staging.js');
const { patchStagingGuards } = require('../scripts/habilitar staging github.js');

function bodyOf(name) {
  const start = source.indexOf('async function ' + name + '(');
  assert.notEqual(start, -1, 'missing function ' + name);
  const next = source.indexOf('\nasync function ', start + 20);
  return source.slice(start, next < 0 ? source.length : next);
}

test('TEST A — staging operational paths contain no D1 access and report zero D1', () => {
  for (const name of ['mlsStagingStart','mlsStagingStatus','mlsStagingNext','mlsStagingValidate','mlsStagingStage','mlsStagingCancel']) {
    const body = bodyOf(name);
    assert.doesNotMatch(body, /WIKI_DB|ensureWikiDb|mlsChatEnsureDb/);
  }
  const run = {runId:'00000000-0000-0000-0000-000000000001',requestId:'abcdefghijklmnop',snapshotVersion:'s',snapshotCommit:'c',requested:2,status:'complete',entries:[
    {position:0,code:'MLS-V10-0001',status:'staged'},{position:1,code:'MLS-V10-0002',status:'staged'}
  ]};
  const summary = staging.mlsStagingSummarize(run);
  assert.equal(summary.d1RowsRead, 0);
  assert.equal(summary.d1RowsWritten, 0);
  assert.equal(summary.staged, 2);
});

test('TEST B — concurrency uses optimistic non-force ref updates and persistent shards', () => {
  const commit = bodyOf('mlsStagingCommit');
  assert.match(commit, /force:false/);
  assert.match(bodyOf('mlsStagingStart'), /MLS_STAGING_MAX_GITHUB_RETRIES/);
  assert.equal(staging.mlsStagingIndexPath('MLS-V10-0001'), 'mls-staging/index/MLS-V10/0001-0100.json');
  assert.equal(staging.mlsStagingIndexPath('MLS-V10-0101'), 'mls-staging/index/MLS-V10/0101-0200.json');
});

test('TEST C — requestId has a durable idempotency record', () => {
  const start = bodyOf('mlsStagingStart');
  assert.match(start, /requests\/.*requestKey/);
  assert.match(start, /prior\?\.runId/);
  assert.match(start, /reused:true/);
});

test('TEST D — failed validation can be followed by a successful first staged version', () => {
  const doc = staging.mlsStagingAutooptBase('r');
  staging.mlsStagingAutooptApply(doc,{code:'MLS-V10-0001',attempt:1,valid:false,category:'markdown'});
  staging.mlsStagingAutooptApply(doc,{code:'MLS-V10-0001',attempt:2,valid:true,staged:true});
  assert.equal(doc.validationAttempts,2);
  assert.equal(doc.markdownFailures,1);
  assert.equal(doc.staged,1);
  assert.equal(doc.firstPassSuccess,0);
  assert.match(bodyOf('mlsStagingStage'), /validationReceipt/);
  assert.match(bodyOf('mlsStagingStage'), /mlsChatValidateText/);
});

test('TEST E — deferred is terminal for an exhausted entry and is never silently substituted', () => {
  const doc = staging.mlsStagingAutooptBase('r');
  staging.mlsStagingAutooptApply(doc,{code:'MLS-V10-0001',attempt:3,valid:false,category:'rule',terminal:'deferred'});
  assert.equal(doc.deferred,1);
  const failure = bodyOf('mlsStagingValidationFailure');
  assert.match(failure, /target\.validationAttempts>=3\?'deferred'/);
  assert.doesNotMatch(failure, /selected\.push|substitut/i);
});

test('TEST F — needs_review is terminal and not counted as staged', () => {
  const doc = staging.mlsStagingAutooptBase('r');
  staging.mlsStagingAutooptApply(doc,{code:'MLS-V10-0001',attempt:1,valid:false,category:'contract',terminal:'needs_review'});
  assert.equal(doc.needsReview,1);
  assert.equal(doc.staged,0);
  assert.match(bodyOf('mlsStagingValidationFailure'), /needs_review/);
});

test('TEST G/H — Gemma guard serves staged content and blocks reserved/staged before persistent write', () => {
  const overlay = fs.readFileSync('MLS R32 OVERLAY/index.js','utf8');
  const patched = patchStagingGuards(overlay);
  assert.match(patched, /mlsStagingServeArticle\(env, job\.code\)/);
  assert.match(patched, /staging-reserved/);
  assert.match(patched, /mlsStagingCodeState\(env, article\.code, \{ strong: true, failOpen: false \}\)/);
  assert.match(patched, /autogeneración no puede publicarlo en D1/);
});

test('TEST I — reconciliation reports real D1 metadata by summing driver rows_read and rows_written', () => {
  const metrics={d1RowsRead:0,d1RowsWritten:0};
  staging.mlsStagingD1Add(metrics,{meta:{rows_read:2,rows_written:0}});
  staging.mlsStagingD1Add(metrics,[{meta:{rows_read:0,rows_written:1}},{meta:{rows_read:2,rows_written:1}}]);
  assert.deepEqual(metrics,{d1RowsRead:4,d1RowsWritten:2});
  const integrate=bodyOf('mlsStagingIntegrate');
  assert.doesNotMatch(integrate,/ensureWikiDb|mlsChatEnsureDb/);
});

test('TEST J — repeated reconciliation is idempotent by audit receipt and ON CONFLICT DO NOTHING', () => {
  const integrate=bodyOf('mlsStagingIntegrate');
  assert.match(integrate,/audit_model/);
  assert.match(integrate,/ON CONFLICT\(code\) DO NOTHING/);
  assert.match(integrate,/row\?\.audit_model===metadata\.auditModel\?'integrated':'preservedExisting'/);
});

test('TEST K — existing foreign canonical content is preserved', () => {
  const integrate=bodyOf('mlsStagingIntegrate');
  assert.match(integrate,/preservedExisting/);
  assert.doesNotMatch(integrate,/DO UPDATE SET article_markdown/);
});

test('TEST L/M — legacy normal Actions remain present and staging is additive', () => {
  const api=JSON.parse(fs.readFileSync('MLS R32 EDITORIAL/chat openapi.json','utf8'));
  const operationIds=Object.values(api.paths).flatMap(path=>Object.values(path)).map(op=>op.operationId).filter(Boolean);
  for(const id of ['iniciarLoteMLS','siguienteContextoMLS','validarBorradorMLS','publicarBorradorMLS','estadoMLS','cancelarLoteMLS']) assert.ok(operationIds.includes(id),id);
  for(const id of ['iniciarLoteStagingMLS','siguienteContextoStagingMLS','validarBorradorStagingMLS','stagearBorradorMLS','estadoStagingMLS','cancelarLoteStagingMLS','reconciliarStagingMLS']) assert.ok(operationIds.includes(id),id);
});

test('TEST N — GitHub failure has no staging fallback to D1', () => {
  const handler=bodyOf('handleMlsStaging');
  assert.match(handler,/No se usó D1 como fallback/);
  for(const name of ['mlsStagingStart','mlsStagingNext','mlsStagingValidate','mlsStagingStage','mlsStagingCancel']) {
    assert.doesNotMatch(bodyOf(name),/WIKI_DB/);
  }
});

test('Snapshot/build contract — exactly 10 languages and 10,133 targets are expected', () => {
  const generator=require('../scripts/generar snapshot staging.js');
  assert.equal(generator.LANGUAGES.length,10);
  assert.equal(generator.LANGUAGES.reduce((sum,x)=>sum+x.total,0),10133);
});

test('staging.js parses as standalone JavaScript', () => {
  assert.doesNotThrow(()=>new Function(source));
});
