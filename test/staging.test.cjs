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


let functionalFixtureSequence=0;

function installStagingRuntimeGlobals() {
  const nodeCrypto=require('node:crypto');
  if(!global.crypto) global.crypto=nodeCrypto.webcrypto;
  global.mlsChatError=(status,message)=>{const error=new Error(message);error.status=status;throw error;};
  global.mlsChatHash=async value=>nodeCrypto.createHash('sha256').update(String(value)).digest('hex');
  global.jobFromCode=code=>{
    const match=/^MLS-V10-(\d{4})$/.exec(String(code||''));
    return match?{language:'espanol-guatemala',n:Number(match[1])}:null;
  };
  global.editorialProfileR32=references=>({referenceCodes:(references||[]).map(x=>x.code)});
  global.SYSTEM_PROMPT='functional system prompt';
  global.LANGUAGE_MODULES={'espanol-guatemala':'functional language module'};
  global.MLS_CHAT_CONTRACT={standard:'MLS R32',promptVersion:'32.0'};
  global.mlsAutooptFeatures=()=>({fixture:true});
  global.mlsAutooptError=message=>/rule/i.test(String(message))?'rule':'other';
  global.mlsChatValidateText=(context,markdown)=>{
    const text=String(markdown||'');
    if(text.includes('SNAPSHOT MISSING')) throw new Error('snapshot calibration missing');
    if(text.includes('INVALID')) throw new Error('rule failure');
    const target=context.target;
    return {
      articleMarkdown:text.trim(),
      language:target.language,languageName:target.languageName,n:target.n,title:target.title,
      level:target.level,part:target.part,chapter:target.chapter
    };
  };
}

function createFunctionalGitHubFixture(targetCount=8) {
  functionalFixtureSequence++;
  const prefix='fixture'+functionalFixtureSequence;
  let counter=0;
  const nextId=kind=>prefix+kind+(++counter);
  const blobs=new Map(),trees=new Map(),commits=new Map();
  const refs={main:prefix+'c0','mls-staging':prefix+'c0'};
  const snapshotVersion='functional-snapshot';
  const snapshotCommit=refs['mls-staging'];
  const targets=Array.from({length:targetCount},(_,index)=>{
    const n=index+1;
    return {code:'MLS-V10-'+String(n).padStart(4,'0'),language:'espanol-guatemala',languageName:'Español de Guatemala',
      n,title:'Tema '+n,level:'A1',part:'Fundamentos',chapter:'Capítulo',target:'Objetivo '+n};
  });
  const reference={code:'MLS-V10-9999',language:'espanol-guatemala',languageName:'Español de Guatemala',n:9999,
    title:'Referencia',level:'A1',part:'Fundamentos',chapter:'Capítulo',articleMarkdown:'# Referencia\n\nTexto.',promptVersion:'32.0'};
  const initialFiles={
    'mls-staging/snapshots/latest.json':JSON.stringify({
      snapshotVersion,
      manifestPath:'mls-staging/snapshots/'+snapshotVersion+'/manifest.json',
      sourceCommit:'functional'
    }),
    ['mls-staging/snapshots/'+snapshotVersion+'/manifest.json']:JSON.stringify({
      version:1,standard:'MLS R32',promptVersion:'32.0',snapshotVersion,sourceCommit:'functional',
      canonicalCodes:[],languageOrder:['espanol-guatemala'],editorialRules:{},autoopt:{stats:{}}
    }),
    ['mls-staging/snapshots/'+snapshotVersion+'/targets/espanol-guatemala.json']:JSON.stringify(targets),
    ['mls-staging/snapshots/'+snapshotVersion+'/references/espanol-guatemala.json']:JSON.stringify([reference])
  };
  const rootTree=new Map();
  for(const [filePath,content] of Object.entries(initialFiles)){
    const sha=nextId('b');blobs.set(sha,content);rootTree.set(filePath,sha);
  }
  const rootTreeSha=nextId('t');trees.set(rootTreeSha,rootTree);
  commits.set(snapshotCommit,{sha:snapshotCommit,tree:rootTreeSha,parents:[]});

  function jsonResponse(data,status=200){
    return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});
  }
  async function githubFetch(input,init={}){
    const url=new URL(typeof input==='string'?input:input.url);
    const base='/repos/test/repo';
    if(!url.pathname.startsWith(base)) return jsonResponse({message:'unexpected host'},500);
    const apiPath=url.pathname.slice(base.length);
    const method=String(init.method||'GET').toUpperCase();
    const body=init.body?JSON.parse(init.body):null;

    if(apiPath==='/commits'&&method==='GET'){
      const requestedPath=url.searchParams.get('path');
      const manifestPath='mls-staging/snapshots/'+snapshotVersion+'/manifest.json';
      if(requestedPath===manifestPath) return jsonResponse([{sha:snapshotCommit}]);
      return jsonResponse([]);
    }

    let match=/^\/git\/ref\/heads\/(.+)$/.exec(apiPath);
    if(match&&method==='GET'){
      const branch=decodeURIComponent(match[1]);
      const sha=refs[branch];
      return sha?jsonResponse({ref:'refs/heads/'+branch,object:{sha}}):jsonResponse({message:'Not Found'},404);
    }
    if(apiPath==='/git/refs'&&method==='POST'){
      const branch=String(body.ref||'').replace(/^refs\/heads\//,'');
      if(refs[branch]) return jsonResponse({message:'Reference already exists'},422);
      refs[branch]=body.sha;return jsonResponse({ref:body.ref,object:{sha:body.sha}},201);
    }
    match=/^\/git\/refs\/heads\/(.+)$/.exec(apiPath);
    if(match&&method==='PATCH'){
      const branch=decodeURIComponent(match[1]);
      const commit=commits.get(body.sha);
      if(!commit||commit.parents[0]!==refs[branch]) return jsonResponse({message:'Update is not a fast forward'},422);
      refs[branch]=body.sha;return jsonResponse({ref:'refs/heads/'+branch,object:{sha:body.sha}});
    }
    match=/^\/git\/commits\/(.+)$/.exec(apiPath);
    if(match&&method==='GET'){
      const commit=commits.get(decodeURIComponent(match[1]));
      return commit?jsonResponse({sha:commit.sha,tree:{sha:commit.tree},parents:commit.parents.map(sha=>({sha}))}):jsonResponse({message:'Not Found'},404);
    }
    if(apiPath==='/git/blobs'&&method==='POST'){
      const sha=nextId('b');blobs.set(sha,String(body.content||''));return jsonResponse({sha},201);
    }
    match=/^\/git\/blobs\/(.+)$/.exec(apiPath);
    if(match&&method==='GET'){
      const content=blobs.get(decodeURIComponent(match[1]));
      return content===undefined?jsonResponse({message:'Not Found'},404):jsonResponse({sha:match[1],encoding:'base64',content:Buffer.from(content).toString('base64')});
    }
    if(apiPath==='/git/trees'&&method==='POST'){
      const baseTree=trees.get(body.base_tree);
      if(!baseTree) return jsonResponse({message:'Base tree missing'},422);
      const nextTree=new Map(baseTree);
      for(const entry of body.tree||[]) nextTree.set(entry.path,entry.sha);
      const sha=nextId('t');trees.set(sha,nextTree);return jsonResponse({sha},201);
    }
    if(apiPath==='/git/commits'&&method==='POST'){
      const sha=nextId('c');
      commits.set(sha,{sha,tree:body.tree,parents:[...(body.parents||[])]});
      return jsonResponse({sha},201);
    }
    match=/^\/contents\/(.+)$/.exec(apiPath);
    if(match&&method==='GET'){
      const ref=url.searchParams.get('ref');
      const commit=commits.get(ref);
      if(!commit) return jsonResponse({message:'Unknown ref'},404);
      const tree=trees.get(commit.tree);
      const filePath=decodeURIComponent(match[1]);
      const blobSha=tree.get(filePath);
      if(!blobSha) return jsonResponse({message:'Not Found'},404);
      const content=blobs.get(blobSha);
      return jsonResponse({type:'file',sha:blobSha,encoding:'base64',content:Buffer.from(content).toString('base64')});
    }
    return jsonResponse({message:'Unhandled '+method+' '+apiPath},500);
  }

  const d1={
    calls:0,
    articles:new Map(),
    jobs:new Map(),
    prepare(sql){
      const statement={
        sql,args:[],
        bind(...args){this.args=args;return this;},
        async all(){
          d1.calls++;
          if(/^SELECT code,audit_model FROM wiki_articles WHERE code IN/.test(sql)){
            const results=this.args.filter(code=>d1.articles.has(code)).map(code=>({code,audit_model:d1.articles.get(code).audit_model}));
            return {results,meta:{rows_read:this.args.length,rows_written:0}};
          }
          throw new Error('Unhandled D1 all: '+sql);
        }
      };
      return statement;
    },
    async batch(statements){
      const out=[];
      for(const statement of statements){
        d1.calls++;
        if(/^INSERT INTO wiki_articles/.test(statement.sql)){
          const code=statement.args[0];
          let written=0;
          if(!d1.articles.has(code)){
            d1.articles.set(code,{code,article_markdown:statement.args[8],audit_model:statement.args[9]});written=1;
          }
          out.push({meta:{rows_read:0,rows_written:written}});
        }else if(/^UPDATE wiki_jobs SET/.test(statement.sql)){
          out.push({meta:{rows_read:1,rows_written:1}});
        }else throw new Error('Unhandled D1 batch: '+statement.sql);
      }
      return out;
    }
  };
  const env={
    MLS_STAGING_GITHUB_OWNER:'test',MLS_STAGING_GITHUB_REPO:'repo',MLS_STAGING_GITHUB_BRANCH:'mls-staging',
    MLS_STAGING_GITHUB_TOKEN:'fixture-token',MLS_EDITORIAL_CHAT_KEY:'functional-secret',
    WIKI_DB:d1
  };
  return {env,d1,githubFetch,targets,refs,blobs,trees,commits};
}

async function withFunctionalFixture(fn,targetCount=8){
  installStagingRuntimeGlobals();
  const fixture=createFunctionalGitHubFixture(targetCount);
  const previousFetch=global.fetch;
  global.fetch=fixture.githubFetch;
  try{return await fn(fixture);}
  finally{global.fetch=previousFetch;}
}

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

test('FUNCTIONAL A/B/C/D/I/J/K — concurrent reservations, idempotency, validation, staging and reconciliation', async () => {
  await withFunctionalFixture(async ({env,d1})=>{
    const zero=staging.mlsStagingNoD1Env(env);
    const [first,second]=await Promise.all([
      staging.mlsStagingStart(zero,{command:'MLS staging siguientes 2',requestId:'functionalrequest0001'}),
      staging.mlsStagingStart(zero,{command:'MLS staging siguientes 2',requestId:'functionalrequest0002'})
    ]);
    const firstCodes=first.run.codes.map(x=>x.code);
    const secondCodes=second.run.codes.map(x=>x.code);
    assert.equal(firstCodes.length,2);
    assert.equal(secondCodes.length,2);
    assert.deepEqual(firstCodes.filter(code=>secondCodes.includes(code)),[]);
    assert.equal(d1.calls,0);

    const reused=await staging.mlsStagingStart(zero,{command:'MLS staging siguientes 2',requestId:'functionalrequest0001'});
    assert.equal(reused.reused,true);
    assert.equal(reused.run.runId,first.run.runId);
    assert.equal(d1.calls,0);

    const next=await staging.mlsStagingNext(zero,first.run.runId);
    const code=next.context.target.code;
    const referenceCodes=next.context.references.map(x=>x.code);
    const editorialReview='Revisión editorial funcional suficientemente extensa para validar el contrato.';
    await assert.rejects(
      staging.mlsStagingValidate(zero,{runId:first.run.runId,contextId:next.contextId,code,articleMarkdown:'INVALID borrador',referenceCodes,editorialReview}),
      error=>error.status===422
    );
    let status=await staging.mlsStagingStatus(zero,first.run.runId);
    assert.equal(status.run.codes.find(x=>x.code===code).status,'drafting');

    const valid=await staging.mlsStagingValidate(zero,{runId:first.run.runId,contextId:next.contextId,code,
      articleMarkdown:'# Tema\n\nContenido válido funcional.',referenceCodes,editorialReview});
    assert.equal(valid.status,'validated');
    status=await staging.mlsStagingStatus(zero,first.run.runId);
    assert.equal(status.run.codes.find(x=>x.code===code).status,'validated');
    assert.equal(d1.calls,0);

    const staged=await staging.mlsStagingStage(zero,{runId:first.run.runId,contextId:next.contextId,code,
      articleMarkdown:'# Tema\n\nContenido válido funcional.',referenceCodes,editorialReview,validationReceipt:valid.validationReceipt});
    assert.equal(staged.staged,true);
    assert.equal(staged.published,false);
    assert.equal(d1.calls,0);

    const next2=await staging.mlsStagingNext(zero,first.run.runId);
    const code2=next2.context.target.code;
    const refs2=next2.context.references.map(x=>x.code);
    const valid2=await staging.mlsStagingValidate(zero,{runId:first.run.runId,contextId:next2.contextId,code:code2,
      articleMarkdown:'# Tema 2\n\nSegundo contenido válido funcional.',referenceCodes:refs2,editorialReview});
    await staging.mlsStagingStage(zero,{runId:first.run.runId,contextId:next2.contextId,code:code2,
      articleMarkdown:'# Tema 2\n\nSegundo contenido válido funcional.',referenceCodes:refs2,editorialReview,validationReceipt:valid2.validationReceipt});
    assert.equal(d1.calls,0);

    d1.articles.set(code2,{code:code2,article_markdown:'contenido externo',audit_model:'external-existing'});
    const integrated=await staging.mlsStagingIntegrate(env,{limit:2});
    assert.equal(integrated.staged,2);
    assert.equal(integrated.integrated,1);
    assert.equal(integrated.preservedExisting,1);
    assert.ok(integrated.d1RowsRead>0);
    assert.ok(integrated.d1RowsWritten>0);
    assert.equal(d1.articles.get(code2).article_markdown,'contenido externo');

    const again=await staging.mlsStagingIntegrate(env,{limit:2});
    assert.equal(again.staged,0);
    assert.equal(again.integrated,0);
    assert.equal(again.preservedExisting,0);
  },8);
});

test('FUNCTIONAL E/F — third retry becomes deferred and snapshot failures become needs_review', async () => {
  await withFunctionalFixture(async ({env,d1})=>{
    const zero=staging.mlsStagingNoD1Env(env);
    const deferredRun=await staging.mlsStagingStart(zero,{command:'MLS staging siguientes 1',requestId:'functionaldeferred01'});
    const next=await staging.mlsStagingNext(zero,deferredRun.run.runId);
    const body={runId:deferredRun.run.runId,contextId:next.contextId,code:next.context.target.code,
      articleMarkdown:'INVALID borrador',referenceCodes:next.context.references.map(x=>x.code),
      editorialReview:'Revisión editorial funcional suficientemente extensa para validar el contrato.'};
    for(let i=0;i<3;i++) await assert.rejects(staging.mlsStagingValidate(zero,body),error=>error.status===422);
    let status=await staging.mlsStagingStatus(zero,deferredRun.run.runId);
    assert.equal(status.run.codes[0].status,'deferred');

    const reviewRun=await staging.mlsStagingStart(zero,{command:'MLS staging siguientes 1',requestId:'functionalreview0001'});
    const nextReview=await staging.mlsStagingNext(zero,reviewRun.run.runId);
    await assert.rejects(staging.mlsStagingValidate(zero,{runId:reviewRun.run.runId,contextId:nextReview.contextId,code:nextReview.context.target.code,
      articleMarkdown:'SNAPSHOT MISSING',referenceCodes:nextReview.context.references.map(x=>x.code),
      editorialReview:'Revisión editorial funcional suficientemente extensa para validar el contrato.'}),error=>error.status===422);
    status=await staging.mlsStagingStatus(zero,reviewRun.run.runId);
    assert.equal(status.run.codes[0].status,'needs_review');
    assert.equal(d1.calls,0);
  },5);
});

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
  const validate=bodyOf('mlsStagingValidate');
  assert.match(validate,/target\.status='validated'/);
  assert.match(validate,/mlsStagingIndexPath\(item\.code\)/);
  assert.match(validate,/mlsStagingAutooptApply/);
  const stage=bodyOf('mlsStagingStage');
  assert.match(stage,/validationReceipt/);
  assert.match(stage,/mlsChatValidateText/);
  assert.match(stage,/existing\?\.status!=='validated'/);
  assert.match(stage,/published:false/);
});

test('TEST E — deferred is terminal for exhausted entry and no silent substitute is selected', () => {
  const doc=staging.mlsStagingAutooptBase('r');
  staging.mlsStagingAutooptApply(doc,{code:'MLS-V10-0001',attempt:3,valid:false,category:'rule',terminal:'deferred'});
  assert.equal(doc.deferred,1);
  const failure=bodyOf('mlsStagingValidationFailure');
  assert.match(failure,/target\.validationAttempts>=3\?'deferred'/);
  assert.match(failure,/target\.status=terminal\|\|'drafting'/);
  assert.match(failure,/mlsStagingIndexPath\(item\.code\)/);
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

test('selection never silently reuses unresolved or preserved staging states', () => {
  const select=bodyOf('mlsStagingSelect');
  assert.match(select,/state && state\.status!=='cancelled'/);
  assert.doesNotMatch(select,/\['reserved','drafting','validated','staged','integrated','deployed'\]/);
});

test('workflow YAML has one production, snapshot and verification step only', () => {
  const workflow=fs.readFileSync(path.join(process.cwd(),'.github','workflows','produccion.yml'),'utf8');
  assert.equal((workflow.match(/name: Desplegar en produccion/g)||[]).length,1);
  assert.equal((workflow.match(/name: Crear snapshot MLS Staging del deploy/g)||[]).length,1);
  assert.equal((workflow.match(/name: Verificar Action editorial sin crear lotes/g)||[]).length,1);
  assert.doesNotMatch(workflow,/response%|\\\\n%\{http_code\}/);
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

test('GitHub App private keys accept both PKCS1 and PKCS8 PEM', async () => {
  const nodeCrypto=require('node:crypto');
  if(!global.crypto) global.crypto=nodeCrypto.webcrypto;
  const {privateKey}=nodeCrypto.generateKeyPairSync('rsa',{modulusLength:2048});
  const pkcs1=privateKey.export({type:'pkcs1',format:'pem'}).toString();
  const pkcs8=privateKey.export({type:'pkcs8',format:'pem'}).toString();
  const algorithm={name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'};
  await assert.doesNotReject(()=>global.crypto.subtle.importKey('pkcs8',staging.mlsStagingPrivateKeyDer(pkcs1),algorithm,false,['sign']));
  await assert.doesNotReject(()=>global.crypto.subtle.importKey('pkcs8',staging.mlsStagingPrivateKeyDer(pkcs8),algorithm,false,['sign']));
});

test('snapshot manifest cache reads GitHub once and never recurses into itself', () => {
  const body=bodyOf('mlsStagingSnapshotManifest');
  assert.match(body,/mlsStagingReadJson/);
  const selfCalls=(body.match(/mlsStagingSnapshotManifest\(/g)||[]).length;
  assert.equal(selfCalls,1);
});

test('snapshot checks GitHub and free subrequest budget before any D1 bootstrap access', () => {
  const body=bodyOf('mlsStagingCreateSnapshot');
  const headIndex=body.indexOf('mlsStagingHead(env)');
  const manifestIndex=body.indexOf("mlsStagingSnapshotAsset(env,request,'manifest.json')");
  const budgetIndex=body.indexOf('projectedExternalSubrequestBudget>49');
  const d1Index=body.indexOf('ensureWikiDb(env)');
  assert.ok(headIndex>=0);
  assert.ok(manifestIndex>=0);
  assert.ok(budgetIndex>=0);
  assert.ok(d1Index>=0);
  assert.ok(headIndex<manifestIndex);
  assert.ok(manifestIndex<budgetIndex);
  assert.ok(budgetIndex<d1Index);
  assert.match(body,/projectedGithubFiles=targetFileCount\+languages\.length\+2/);
  assert.match(body,/files\.length!==projectedGithubFiles/);
});

test('target catalog is compact and does not copy whole seed objects', () => {
  const generatorSource=fs.readFileSync(path.join(process.cwd(),'scripts','generar snapshot staging.js'),'utf8');
  assert.doesNotMatch(generatorSource,/\.\.\.seed/);
  assert.match(generatorSource,/TARGET_SHARD_MAX_BYTES = 700 \* 1024/);
  assert.match(generatorSource,/files,/);
  const out=generator.normalizeSeed({
    title:'Tema',level:'A1',part:'Parte',chapter:'Capítulo',target:'x',definition:'d',example:'e',notes:'n',reference:'r',unused:'do not copy'
  },{slug:'espanol-guatemala',name:'Español de Guatemala',prefix:'MLS-V10'},20);
  assert.equal(out.unused,undefined);
  assert.deepEqual(Object.keys(out),[
    'code','language','languageName','n','title','level','part','chapter','target','definition','example','notes','reference'
  ]);
});

test('new snapshot pointer resolves immutable commit through GitHub history and stays within free budget', () => {
  const resolve=bodyOf('mlsStagingResolveSnapshotCommit');
  assert.match(resolve,/\/commits\?sha=/);
  assert.match(resolve,/manifestPath/);
  const snapshot=bodyOf('mlsStagingCreateSnapshot');
  assert.equal((snapshot.match(/mlsStagingCommit\(env,files/g)||[]).length,1);
  assert.match(snapshot,/externalSubrequestBudget=files\.length\+8/);
  assert.match(snapshot,/projectedExternalSubrequestBudget>49/);
  assert.match(snapshot,/snapshots\/latest\.json/);
  assert.doesNotMatch(snapshot,/MLS staging point latest/);
});

test('snapshot runtime reads target shards from the pinned manifest', () => {
  const targets=bodyOf('mlsStagingSnapshotTargets');
  assert.match(targets,/descriptor\?\.files/);
  assert.ok(targets.includes("+'/targets/'+file"));
  const snapshot=bodyOf('mlsStagingCreateSnapshot');
  assert.match(snapshot,/descriptor\.files/);
  assert.match(snapshot,/maxReferenceBytes=900\*1024/);
  assert.match(snapshot,/referenceCounts/);
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

test('bootstrap workflow installs staging credentials once and only from main', () => {
  const workflow=fs.readFileSync(path.join(process.cwd(),'.github','workflows','bootstrap staging.yml'),'utf8');
  assert.match(workflow,/workflow_dispatch/);
  assert.match(workflow,/github\.ref == 'refs\/heads\/main'/);
  assert.equal((workflow.match(/wrangler secret bulk/g)||[]).length,2);
  assert.equal((workflow.match(/wrangler secret put/g)||[]).length,0);
  assert.match(workflow,/MLS_STAGING_GITHUB_APP_ID/);
  assert.match(workflow,/MLS_STAGING_GITHUB_INSTALLATION_ID/);
  assert.match(workflow,/MLS_STAGING_GITHUB_APP_PRIVATE_KEY/);
  assert.match(workflow,/MLS_STAGING_GITHUB_TOKEN/);
  assert.match(workflow,/MLS_STAGING_GITHUB_TOKEN: null/);
  assert.match(workflow,/MLS_STAGING_GITHUB_APP_ID: null/);
  assert.match(workflow,/MLS_STAGING_GITHUB_INSTALLATION_ID: null/);
  assert.match(workflow,/MLS_STAGING_GITHUB_APP_PRIVATE_KEY: null/);
  assert.match(workflow,/Crear snapshot inicial MLS Staging/);
  assert.match(workflow,/verify-chat-deployment\.cjs/);
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
