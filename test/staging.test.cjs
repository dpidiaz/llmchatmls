'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const stagingPath = path.join(process.cwd(), 'MLS R32 EDITORIAL', 'staging.js');
const source = fs.readFileSync(stagingPath, 'utf8');
const staging = require(stagingPath);
const { patchStagingGuards } = require(path.join(process.cwd(), 'scripts', 'habilitar staging github.js'));
const generator = require(path.join(process.cwd(), 'scripts', 'generar snapshot staging.js'));

function bodyOf(name) {
  const asyncMarker = 'async function ' + name + '(';
  const plainMarker = 'function ' + name + '(';
  let start = source.indexOf(asyncMarker);
  if (start < 0) start = source.indexOf(plainMarker);
  assert.notEqual(start, -1, 'missing function ' + name);
  const nextAsync = source.indexOf('\nasync function ', start + 20);
  const nextPlain = source.indexOf('\nfunction ', start + 20);
  const candidates = [nextAsync, nextPlain].filter(x => x > start);
  return source.slice(start, candidates.length ? Math.min(...candidates) : source.length);
}

test('TEST A — staging operational paths are runtime-guarded from D1 and report zero D1', () => {
  for (const name of ['mlsStagingStart','mlsStagingStatus','mlsStagingNext','mlsStagingValidate','mlsStagingStage','mlsStagingCancel']) {
    const body = bodyOf(name);
    assert.doesNotMatch(body, /WIKI_DB|ensureWikiDb|mlsChatEnsureDb/);
  }
  const handler = bodyOf('handleMlsStaging');
  for (const name of ['mlsStagingStatus','mlsStagingNext','mlsStagingStart','mlsStagingValidate','mlsStagingStage','mlsStagingCancel']) {
    assert.match(handler, new RegExp(name + '\\(zeroD1Env'));
  }
  assert.match(handler, /mlsStagingIntegrate\(env,/);
  assert.match(handler, /mlsStagingCreateSnapshot\(request,env,/);

  const guarded = staging.mlsStagingNoD1Env({WIKI_DB:{forbidden:true},SAFE:42});
  assert.equal(guarded.SAFE,42);
  assert.throws(()=>guarded.WIKI_DB);

  const run={runId:'00000000-0000-4000-8000-000000000001',requestId:'abcdefghijklmnop',snapshotVersion:'s',snapshotCommit:'c',requested:2,status:'complete',entries:[
    {position:0,code:'MLS-V10-0001',status:'staged'},{position:1,code:'MLS-V10-0002',status:'staged'}
  ]};
  const summary=staging.mlsStagingSummarize(run);
  assert.equal(summary.d1RowsRead,0);
  assert.equal(summary.d1RowsWritten,0);
  assert.equal(summary.staged,2);
  assert.equal('published' in summary,false);
});

test('TEST B — concurrency uses optimistic non-force ref updates and persistent shards', () => {
  const commit=bodyOf('mlsStagingCommit');
  assert.match(commit,/force:false/);
  assert.match(bodyOf('mlsStagingStart'),/MLS_STAGING_MAX_GITHUB_RETRIES/);
  assert.equal(staging.mlsStagingIndexPath('MLS-V10-0001'),'mls-staging/index/MLS-V10/0001-0100.json');
  assert.equal(staging.mlsStagingIndexPath('MLS-V10-0101'),'mls-staging/index/MLS-V10/0101-0200.json');
});

test('TEST C — requestId has a durable idempotency record', () => {
  const start=bodyOf('mlsStagingStart');
  assert.match(start,/requests\/.*requestKey/);
  assert.match(start,/prior\?\.runId/);
  assert.match(start,/reused:true/);
});

test('TEST D — failed validation can be corrected and only validated content can be staged', () => {
  const doc=staging.mlsStagingAutooptBase('r');
  staging.mlsStagingAutooptApply(doc,{code:'MLS-V10-0001',attempt:1,valid:false,category:'markdown'});
  staging.mlsStagingAutooptApply(doc,{code:'MLS-V10-0001',attempt:2,valid:true,staged:true});
  assert.equal(doc.validationAttempts,2);
  assert.equal(doc.markdownFailures,1);
  assert.equal(doc.staged,1);
  assert.equal(doc.firstPassSuccess,0);
  const stage=bodyOf('mlsStagingStage');
  assert.match(stage,/validationReceipt/);
  assert.match(stage,/mlsChatValidateText/);
  assert.match(stage,/published:false/);
});

test('TEST E — deferred is terminal for exhausted entry and no silent substitute is selected', () => {
  const doc=staging.mlsStagingAutooptBase('r');
  staging.mlsStagingAutooptApply(doc,{code:'MLS-V10-0001',attempt:3,valid:false,category:'rule',terminal:'deferred'});
  assert.equal(doc.deferred,1);
  const failure=bodyOf('mlsStagingValidationFailure');
  assert.match(failure,/target\.validationAttempts>=3\?'deferred'/);
  assert.doesNotMatch(failure,/selected\.push|substitut/i);
});

test('TEST F — needs_review is terminal and never counted as staged', () => {
  const doc=staging.mlsStagingAutooptBase('r');
  staging.mlsStagingAutooptApply(doc,{code:'MLS-V10-0001',attempt:1,valid:false,category:'contract',terminal:'needs_review'});
  assert.equal(doc.needsReview,1);
  assert.equal(doc.staged,0);
  assert.match(bodyOf('mlsStagingValidationFailure'),/needs_review/);
});

test('TEST G/H — Gemma serves staged R32 and blocks reserved/staged before persistent D1 write', () => {
  const overlay=fs.readFileSync(path.join(process.cwd(),'MLS R32 OVERLAY','index.js'),'utf8');
  const patched=patchStagingGuards(overlay);
  assert.match(patched,/mlsStagingServeArticle\(env, job\.code\)/);
  assert.match(patched,/staging-reserved/);
  assert.match(patched,/mlsStagingCodeState\(env, article\.code, \{ strong: true, failOpen: false \}\)/);
  assert.match(patched,/autogeneración no puede publicarlo en D1/);
});

test('TEST I — reconciliation measures real D1 driver metadata', () => {
  const metrics={d1RowsRead:0,d1RowsWritten:0};
  staging.mlsStagingD1Add(metrics,{meta:{rows_read:2,rows_written:0}});
  staging.mlsStagingD1Add(metrics,[{meta:{rows_read:0,rows_written:1}},{meta:{rows_read:2,rows_written:1}}]);
  assert.deepEqual(metrics,{d1RowsRead:4,d1RowsWritten:2});
  const integrate=bodyOf('mlsStagingIntegrate');
  assert.match(integrate,/wiki_articles/);
  assert.match(integrate,/mlsStagingD1Add/);
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

test('TEST L/M — normal Actions remain intact and staging is strictly additive', () => {
  const api=JSON.parse(fs.readFileSync(path.join(process.cwd(),'MLS R32 EDITORIAL','chat openapi.json'),'utf8'));
  const operationIds=Object.values(api.paths).flatMap(p=>Object.values(p)).map(op=>op.operationId).filter(Boolean);
  for(const id of ['iniciarLoteMLS','siguienteContextoMLS','validarBorradorMLS','publicarBorradorMLS','estadoMLS','cancelarLoteMLS'])
    assert.ok(operationIds.includes(id),id);
  for(const id of ['iniciarLoteStagingMLS','siguienteContextoStagingMLS','validarBorradorStagingMLS','stagearBorradorMLS','estadoStagingMLS','cancelarLoteStagingMLS','reconciliarStagingMLS'])
    assert.ok(operationIds.includes(id),id);
  assert.notEqual(operationIds.indexOf('stagearBorradorMLS'),operationIds.indexOf('publicarBorradorMLS'));
});

test('TEST N — GitHub failure has no staging fallback to D1', () => {
  const handler=bodyOf('handleMlsStaging');
  assert.match(handler,/No se usó D1 como fallback/);
  for(const name of ['mlsStagingStart','mlsStagingNext','mlsStagingValidate','mlsStagingStage','mlsStagingCancel'])
    assert.doesNotMatch(bodyOf(name),/WIKI_DB/);
});

test('Status reports exact codes and range formatting preserves gaps', () => {
  const entries=[
    {code:'MLS-V10-0001'},{code:'MLS-V10-0002'},{code:'MLS-V10-0004'},
    {code:'MLS-V01-0001'},{code:'MLS-V01-0002'}
  ];
  assert.deepEqual(staging.mlsStagingRanges(entries),[
    'MLS-V10-0001…MLS-V10-0002','MLS-V10-0004','MLS-V01-0001…MLS-V01-0002'
  ]);
});

test('AUTOOPT staging never invents learnedMinimum', () => {
  const doc=staging.mlsStagingAutooptBase('run');
  assert.equal(doc.learnedMinimum,undefined);
  staging.mlsStagingAutooptApply(doc,{attempt:1,valid:true,staged:true});
  assert.equal(doc.learnedMinimum,undefined);
});

test('Snapshot/build contract expects exactly 10 languages and 10,133 targets', () => {
  assert.equal(generator.LANGUAGES.length,10);
  assert.equal(generator.LANGUAGES.reduce((sum,x)=>sum+x.total,0),10133);
  const out=generator.normalizeSeed({title:'Tema',level:'A1',chapter:'Alfabeto'},{slug:'espanol-guatemala',name:'Español de Guatemala',prefix:'MLS-V10'},20);
  assert.equal(out.code,'MLS-V10-0020');
  assert.equal(out.language,'espanol-guatemala');
  assert.equal(out.n,20);
});

test('predeploy installs staging after chat runtime and generates catalog last', () => {
  const pkg=JSON.parse(fs.readFileSync(path.join(process.cwd(),'package.json'),'utf8'));
  const pre=pkg.scripts.predeploy;
  assert.ok(pre.includes("node 'scripts/habilitar chat editorial.js'"));
  assert.ok(pre.includes("node 'scripts/habilitar staging github.js'"));
  assert.ok(pre.includes("node 'scripts/generar snapshot staging.js'"));
  assert.ok(pre.indexOf('habilitar chat editorial.js')<pre.indexOf('habilitar staging github.js'));
  assert.ok(pre.indexOf('habilitar staging github.js')<pre.indexOf('generar snapshot staging.js'));
});

test('production workflow deploy steps are restricted to main branch dispatches', () => {
  const workflow=fs.readFileSync(path.join(process.cwd(),'.github','workflows','produccion.yml'),'utf8');
  const guard="github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main'";
  assert.ok(workflow.split(guard).length-1>=3);
});

test('production workflow captures a versioned snapshot after deploy', () => {
  const workflow=fs.readFileSync(path.join(process.cwd(),'.github','workflows','produccion.yml'),'utf8');
  assert.match(workflow,/Crear snapshot MLS Staging del deploy/);
  assert.match(workflow,/\/api\/wiki\/editorial\/staging\/snapshot/);
  assert.match(workflow,/sourceCommit/);
  assert.match(workflow,/GITHUB_SHA/);
});

test('staging.js parses as standalone JavaScript', () => {
  assert.doesNotThrow(()=>new Function(source));
});
