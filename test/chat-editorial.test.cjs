const test = require('node:test');
const assert = require('node:assert/strict');
const {DatabaseSync} = require('node:sqlite');
const {webcrypto} = require('node:crypto');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const {buildChatRuntime} = require('../scripts/habilitar chat editorial.js');
const runtime = fs.readFileSync(path.join(root, 'MLS R32 OVERLAY/index.js'),'utf8');
const basicStart = runtime.indexOf('function basicArticleValidation(');
const basicEnd = runtime.indexOf('__name(basicArticleValidation',basicStart);
const fixture = JSON.parse(fs.readFileSync(path.join(root,'MLS R32 EDITORIAL/lotes/MLS R32 prueba V10 0021.json')));
const originalArticle = fixture.articles[0];
const code = n => 'MLS-V10-' + String(n).padStart(4,'0');
function setup(options = {}) {
  const db = new DatabaseSync(':memory:');
  for(const name of ['wiki_jobs','wiki_articles']) {
    const start=runtime.indexOf('CREATE TABLE IF NOT EXISTS '+name+' (');
    db.exec(runtime.slice(start,runtime.indexOf('`',start)));
  }
  for(let n=1;n<=(options.jobs || 110);n++) db.prepare("INSERT INTO wiki_jobs(code,language,language_name,n,seed_path,updated_at) VALUES (?,'espanol-guatemala','Español de Guatemala',?,'fixture','before')").run(code(n),n);
  let failBatchAt = -1;
  const operations={statements:0,calls:0};
  const bind = (sql,args=[]) => ({sql,args,bind(...a){return bind(sql,a)},async first(){operations.statements++;operations.calls++;return db.prepare(sql).get(...args)||null},async all(){operations.statements++;operations.calls++;return {results:db.prepare(sql).all(...args)}},async run(){operations.statements++;operations.calls++;const r=db.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}}}});
  const env = {AUTOOPT_ENABLED:options.autoopt?'true':'false',MLS_EDITORIAL_CHAT_KEY:'test-secret-only-not-for-production-000000',WIKI_DB:{prepare:bind,async batch(queries){operations.statements+=queries.length;operations.calls++;db.exec('BEGIN');try{const results=queries.map((q,i)=>{if(i===failBatchAt)throw Error('simulated failure');const r=db.prepare(q.sql).run(...q.args);return {meta:{changes:Number(r.changes)}}});db.exec('COMMIT');return results;}catch(e){db.exec('ROLLBACK');throw e;}}}};
  const context = {console:{error(){}},crypto:webcrypto,TextEncoder,TextDecoder,Request,Response,
    WIKI_FIFO_ORDER_SQL:'n',WIKI_PROMPT_VERSION:'32.0',SYSTEM_PROMPT:'Fixture editorial rules',LANGUAGE_MODULES:{'espanol-guatemala':'Fixture module'},
    async ensureWikiDb(){},editorialProfileR32(rows){return {available:true,sampleSize:rows.length}},async getEditorialContextR32(_env,c){return {ok:true,standard:'MLS R32',promptVersion:'32.0',target:{...originalArticle,code:c,n:Number(c.slice(-4))},references:options.references || fixture.calibration.referenceCodes.map(c=>({code:c,articleMarkdown:'Fixture published reference.'})),profile:fixture.calibration.profile}}};
  vm.createContext(context);vm.runInContext(runtime.slice(basicStart,basicEnd)+'\n'+buildChatRuntime(root),context);
  const request = async (route,body,token=env.MLS_EDITORIAL_CHAT_KEY) => {
    const url = new URL('https://example.com/api/wiki/editorial/chat/'+route);
    const r=await context.handleMlsChat(new Request(url,{method:body===undefined?'GET':'POST',headers:{authorization:'Bearer '+token,'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})}),env,url);
    return {status:r.status,data:await r.json()};
  };
  const rescue = async (route,body) => {
    const url = new URL('https://example.com/api/wiki/editorial/rescue/'+route);
    const r=await context.handleMlsRescue(new Request(url,{method:body===undefined?'GET':'POST',headers:{'content-type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})}),env,url);
    return {status:r.status,data:await r.json()};
  };
  const start = n => request('start',{command:'MLS siguientes '+n,requestId:'request-fixture-'+n});
  const draft = async runId => {
    const next=await request('next?runId='+runId);assert.equal(next.status,200);
    const x=next.data;
    return request('validate',{runId,contextId:x.contextId,code:x.context.target.code,articleMarkdown:originalArticle.articleMarkdown,
      referenceCodes:fixture.calibration.referenceCodes,editorialReview:'Fixture review verifies grammar, examples, headings and corpus calibration.'});
  };
  return {db,env,context,request,rescue,start,draft,operations,setFailure(i){failBatchAt=i}};
}
for(const count of [10,30,50,100]) test('exactly '+count+' publications, persisted continuation, no overflow',async()=>{
  const s=setup();const first=await s.start(count);assert.equal(first.status,200);const id=first.data.run.id;
  for(let i=0;i<count;i++){
    const status=await s.request('status');assert.equal(status.data.run.remaining,count-i);
    const d=await s.draft(id);assert.equal(d.status,200);assert.equal(d.data.valid,true);
    const p=await s.request('publish',{runId:id,draftId:d.data.draftId});assert.equal(p.status,200);assert.equal(p.data.published,true);
    if(i===0){const repeat=await s.request('publish',{runId:id,draftId:d.data.draftId});assert.equal(repeat.data.reused,true);}
  }
  const last=await s.request('status?runId='+id);assert.equal(last.data.run.status,'complete');assert.equal(last.data.run.published,count);
  assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM wiki_articles').get().n,count);
  assert.equal(s.db.prepare('SELECT status FROM wiki_jobs WHERE code=?').get(code(count+1)).status,'pending');
  const repeat=await s.start(count);assert.equal(repeat.data.run.id,id);assert.equal(repeat.data.reused,true);
  assert.equal((await s.request('next?runId='+id)).data.context,null);
});
test('authentication fails closed; public schema accessible',async()=>{
  const s=setup();assert.equal((await s.request('start',{command:'MLS siguientes 10',requestId:'test-request-123456'},'wrong')).status,401);
  assert.equal(s.db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name='wiki_chat_runs'").get().n,0);
  s.env.MLS_EDITORIAL_CHAT_KEY='';assert.equal((await s.request('status')).status,503);
  assert.equal((await s.request('openapi.json')).status,200);
});
test('size, concurrent runs, missing context, bad draft, FIFO and cancel guards',async()=>{
  const s=setup();assert.equal((await s.start(401)).status,400);assert.equal((await s.start(0)).status,400);
  const a=await s.start(10);const id=a.data.run.id;const b=await s.start(30);assert.notEqual(b.data.run.id,id);
  assert.equal((await s.request('validate',{runId:id,code:code(2)})).status,409);
  const next=(await s.request('next?runId='+id)).data;
  const body={runId:id,code:code(1),contextId:next.contextId,articleMarkdown:'short',referenceCodes:fixture.calibration.referenceCodes,editorialReview:'Fixture review checks all linguistic and editorial properties.'};
  assert.equal((await s.request('validate',body)).status,422);
  body.articleMarkdown=originalArticle.articleMarkdown;body.referenceCodes=[];assert.equal((await s.request('validate',body)).status,422);
  const d=await s.draft(id);await s.request('cancel',{runId:id,confirm:true});
  assert.equal((await s.request('publish',{runId:id,draftId:d.data.draftId})).status,409);
  assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM wiki_articles').get().n,0);
});
test('atomic rollback on failed publication; retry uses the same draft',async()=>{
  const s=setup();const id=(await s.start(1)).data.run.id;const d=(await s.draft(id)).data;
  // Direct call avoids faulting schema initialization, and targets the actual publication transaction.
  s.setFailure(1);await assert.rejects(s.context.mlsChatPublish(s.env,{runId:id,draftId:d.draftId}));
  assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM wiki_articles').get().n,0);
  assert.equal(s.db.prepare('SELECT status FROM wiki_jobs WHERE code=?').get(code(1)).status,'pending');
  s.setFailure(-1);assert.equal((await s.request('publish',{runId:id,draftId:d.draftId})).data.published,true);
});
test('concurrent external publication is preserved and counted separately',async()=>{
  const s=setup();const id=(await s.start(1)).data.run.id;const d=(await s.draft(id)).data;
  s.db.prepare("INSERT INTO wiki_articles(code,language,language_name,n,title,article_markdown,provider,model,prompt_version,generated_at) VALUES (?,'espanol-guatemala','Español de Guatemala',1,'Existing','Existing text','external','external','32.0','before')").run(code(1));
  const p=await s.request('publish',{runId:id,draftId:d.draftId});assert.equal(p.data.published,false);assert.equal(p.data.preservedExisting,true);
  assert.equal(s.db.prepare('SELECT article_markdown FROM wiki_articles').get().article_markdown,'Existing text');
  assert.equal(p.data.run.alreadyPublishedElsewhere,1);
});
test('oversized Action context reduces complete references instead of blocking the run',async()=>{
  const references=fixture.calibration.referenceCodes.map((c,i)=>({code:c,articleMarkdown:('Reference '+i+' ').repeat(1600)}));
  const s=setup({references});const id=(await s.start(1)).data.run.id;
  const next=await s.request('next?runId='+id);
  assert.equal(next.status,200);assert.ok(next.data.context.references.length>=1);
  assert.ok(next.data.context.references.length<references.length);
  assert.equal(next.data.context.adaptiveCalibration,true);
  assert.ok(JSON.stringify(next.data.context).length<=36000);
});
test('Farm atomically reserves three concurrent 400-entry runs without intersections',async()=>{
  const s=setup({jobs:1300});
  const start=id=>s.request('start',{command:'MLS siguientes 400',requestId:id});
  const [a,b,c]=await Promise.all([start('farm-request-00000001'),start('farm-request-00000002'),start('farm-request-00000003')]);
  assert.equal(a.data.run.selected,400);assert.equal(b.data.run.selected,400);assert.equal(c.data.run.selected,400);
  const groups=[a,b,c].map(x=>new Set(x.data.run.entries.map(e=>e.code)));
  assert.equal(new Set([...groups[0],...groups[1],...groups[2]]).size,1200);
  const repeated=await start('farm-request-00000001');assert.equal(repeated.data.reused,true);assert.equal(repeated.data.run.id,a.data.run.id);
  const nextA=await s.request('next?runId='+a.data.run.id);const nextB=await s.request('next?runId='+b.data.run.id);
  assert.notEqual(nextA.data.context.target.code,nextB.data.context.target.code);
});
test('three deterministic editorial rejections defer only that item and preserve the next one',async()=>{
  const s=setup();const run=(await s.start(2)).data.run;
  for(let n=0;n<3;n++) {
    const next=(await s.request('next?runId='+run.id)).data;
    const r=await s.request('validate',{runId:run.id,contextId:next.contextId,code:next.context.target.code,articleMarkdown:'short',referenceCodes:fixture.calibration.referenceCodes,editorialReview:'Fixture review verifies grammar, examples, headings and corpus calibration.'});
    assert.equal(r.status,422);
  }
  const state=(await s.request('status?runId='+run.id)).data.run;assert.equal(state.deferred,1);assert.equal(state.pending,1);
  const next=(await s.request('next?runId='+run.id)).data;assert.equal(next.context.target.code,code(2));
  const incident=s.db.prepare('SELECT editorial_attempts,rescue_state,runner_eligible FROM wiki_chat_incidents').get();assert.equal(incident.editorial_attempts,3);assert.equal(incident.rescue_state,'pending');assert.equal(incident.runner_eligible,1);
});
test('cancel releases only its pending reservations',async()=>{
  const s=setup();const a=(await s.request('start',{command:'MLS siguientes 10',requestId:'cancel-farm-request-01'})).data.run;const b=(await s.request('start',{command:'MLS siguientes 10',requestId:'cancel-farm-request-02'})).data.run;
  await s.request('cancel',{runId:a.id,confirm:true});
  assert.equal((await s.request('status?runId='+a.id)).data.run.status,'cancelled');
  assert.equal((await s.request('status?runId='+b.id)).data.run.remaining,10);
  assert.equal(s.db.prepare("SELECT COUNT(*) AS n FROM wiki_chat_items WHERE run_id=? AND status='released'").get(a.id).n,10);
});
test('two rescue runners atomically claim different deferred incidents',async()=>{
  const s=setup();const run=(await s.start(2)).data.run;
  for(let item=0;item<2;item++) for(let n=0;n<3;n++) {
    const next=(await s.request('next?runId='+run.id)).data;
    await s.request('validate',{runId:run.id,contextId:next.contextId,code:next.context.target.code,articleMarkdown:'short',referenceCodes:fixture.calibration.referenceCodes,editorialReview:'Fixture review verifies grammar, examples, headings and corpus calibration.'});
  }
  const [a,b]=await Promise.all([s.rescue('claim',{language:'espanol-guatemala',claimId:'rescue-claim-0001'}),s.rescue('claim',{language:'espanol-guatemala',claimId:'rescue-claim-0002'})]);
  assert.equal(a.status,200);assert.equal(b.status,200);assert.equal(a.data.freeOnly,true);assert.notEqual(a.data.incident.code,b.data.incident.code);
  await s.rescue('finish',{incidentId:a.data.incident.id,claimId:a.data.claimId,outcome:'infrastructure'});
  assert.equal(s.db.prepare('SELECT runner_attempts,rescue_state FROM wiki_chat_incidents WHERE id=?').get(a.data.incident.id).runner_attempts,0);
});
test('chat rescue reserves deferred incidents only and cancellation releases them',async()=>{
  const s=setup();const original=(await s.start(2)).data.run;
  for(let item=0;item<2;item++) for(let n=0;n<3;n++) { const next=(await s.request('next?runId='+original.id)).data; await s.request('validate',{runId:original.id,contextId:next.contextId,code:next.context.target.code,articleMarkdown:'short',referenceCodes:fixture.calibration.referenceCodes,editorialReview:'Fixture review verifies grammar, examples, headings and corpus calibration.'}); }
  const a=await s.request('start',{command:'MLS rescate siguientes 2',requestId:'chat-rescue-request-01'});assert.equal(a.status,200);assert.equal(a.data.run.runType,'rescue-chat');assert.equal(a.data.run.selected,2);
  const next=await s.request('next?runId='+a.data.run.id);assert.ok([code(1),code(2)].includes(next.data.context.target.code));
  await s.request('cancel',{runId:a.data.run.id,confirm:true});assert.equal(s.db.prepare("SELECT COUNT(*) AS n FROM wiki_chat_incidents WHERE rescue_state='pending'").get().n,2);
});
test('Cloudflare inference retries an empty response before failing regeneration',async()=>{
  const source=fs.readFileSync(path.join(root,'MLS R32 OVERLAY/index.js'),'utf8');
  const begin=source.indexOf('async function runCloudflareProvider(');
  const end=source.indexOf('__name(runCloudflareProvider',begin);
  let calls=0,released=0,settled=0;const usage=[];
  const sandbox={setTimeout,MODEL_ID:'model',NoProviderAvailableError:Error,WorkersQuotaExceededError:Error,ZeroCostPolicyError:Error,workersAiFailureKind(){return 'other'},
    wikiStore(){return {async reserveCloudflareBudget(){return {ok:true,reserved:0}},async settleCloudflareBudget(){settled++},async releaseCloudflareBudget(){released++},async markQuotaExhausted(){}}},
    secondsUntilNextUtcDay(){return 60},wikiTextResult(result){return result.text||''},wikiUsageResult(){return {promptTokens:10,completionTokens:20}},
    cloudflareNeurons(){return 1},async recordProviderUsage(_env,_id,prompt,completion,error){usage.push({prompt,completion,error})},
    wikiErrorMessage(error){return error?.message||String(error)},isWorkersAIDailyQuotaError(){return false}};
  vm.createContext(sandbox);vm.runInContext(source.slice(begin,end),sandbox);
  const env={AI:{async run(){calls++;return calls===1?{text:''}:{text:'Artículo regenerado'}}}};
  const result=await sandbox.runCloudflareProvider(env,{id:'cloudflare',model:'model'},[],100,0.1);
  assert.equal(result.text,'Artículo regenerado');assert.equal(calls,2);
  assert.equal(released,0);assert.equal(settled,1);
  assert.deepEqual(usage,[{prompt:0,completion:0,error:true},{prompt:10,completion:20,error:false}]);
});
test('Cloudflare capacity errors switch models without repeating the saturated model',async()=>{
  const source=fs.readFileSync(path.join(root,'MLS R32 OVERLAY/index.js'),'utf8');
  const begin=source.indexOf('async function runCloudflareProvider(');
  const end=source.indexOf('__name(runCloudflareProvider',begin);
  let calls=0,released=0;
  const sandbox={setTimeout,MODEL_ID:'model',NoProviderAvailableError:Error,WorkersQuotaExceededError:Error,ZeroCostPolicyError:Error,workersAiFailureKind(message){return String(message).includes('3040')?'capacity':'other'},
    wikiStore(){return {async reserveCloudflareBudget(){return {ok:true,reserved:0}},async settleCloudflareBudget(){},async releaseCloudflareBudget(){released++},async markQuotaExhausted(){}}},
    secondsUntilNextUtcDay(){return 60},wikiTextResult(){return ''},wikiUsageResult(){return {promptTokens:0,completionTokens:0}},
    cloudflareNeurons(){return 0},async recordProviderUsage(){},wikiErrorMessage(error){return error?.message||String(error)},isWorkersAIDailyQuotaError(){return false}};
  vm.createContext(sandbox);vm.runInContext(source.slice(begin,end),sandbox);
  const env={AI:{async run(){calls++;throw Error('3040: out of capacity')}}};
  await assert.rejects(sandbox.runCloudflareProvider(env,{id:'cloudflare-gemma',model:'model'},[],100,0.1),/3040/);
  assert.equal(calls,1);assert.equal(released,1);
});
test('Cloudflare daily quota errors are reported honestly and persisted',async()=>{
  const source=fs.readFileSync(path.join(root,'MLS R32 OVERLAY/index.js'),'utf8');
  const begin=source.indexOf('async function runCloudflareProvider(');
  const end=source.indexOf('__name(runCloudflareProvider',begin);
  let calls=0,marked=0,released=0;
  class ProviderUnavailable extends Error { constructor(message,delaySeconds){super(message);this.delaySeconds=delaySeconds} }
  const sandbox={setTimeout,MODEL_ID:'model',NoProviderAvailableError:ProviderUnavailable,WorkersQuotaExceededError:ProviderUnavailable,ZeroCostPolicyError:Error,workersAiFailureKind(message){return String(message).includes('3036')?'quota':'other'},
    wikiStore(){return {async reserveCloudflareBudget(){return {ok:true,reserved:0}},async settleCloudflareBudget(){},async releaseCloudflareBudget(){released++},async markQuotaExhausted(){marked++}}},
    secondsUntilNextUtcDay(){return 3600},wikiTextResult(){return ''},wikiUsageResult(){return {promptTokens:0,completionTokens:0}},
    cloudflareNeurons(){return 0},async recordProviderUsage(){},wikiErrorMessage(error){return error?.message||String(error)},
    isWorkersAIDailyQuotaError(message){return message.includes('3036')}};
  vm.createContext(sandbox);vm.runInContext(source.slice(begin,end),sandbox);
  const env={AI:{async run(){calls++;throw Error('3036: used up your daily free allocation')}}};
  await assert.rejects(sandbox.runCloudflareProvider(env,{id:'cloudflare-gemma',model:'model'},[],100,0.1),/FREE agotado/);
  assert.equal(calls,1);assert.equal(marked,1);assert.equal(released,1);
});

// AUTOOPT uses this suite's existing D1/SQLite adapter and actual R32 validators.
async function autooptCase(count=2) {
  const s=setup({autoopt:true});const id=(await s.start(count)).data.run.id;
  const next=(await s.request('next?runId='+id)).data;
  const body={runId:id,contextId:next.contextId,code:next.context.target.code,
    articleMarkdown:originalArticle.articleMarkdown,referenceCodes:fixture.calibration.referenceCodes,
    editorialReview:'Verified linguistic rules, examples, headings and corpus calibration.'};
  const stats=(scope='run',scopeId=id,prompt='32.0')=>{
    const r=s.db.prepare('SELECT stats FROM wiki_autoopt_stats WHERE scope=? AND scope_id=? AND prompt=?').get(scope,scopeId,prompt);
    return r?JSON.parse(r.stats):{};
  };
  return {...s,id,next,body,stats};
}
test('AUTOOPT: first pass, publication, dynamic next and disabled behavior',async()=>{
  const s=await autooptCase();
  assert.equal(s.next.autoopt.history,'insufficient');assert.equal(s.next.autoopt.firstPassSuccessRate,null);
  const d=(await s.request('validate',s.body)).data;assert.equal(d.valid,true);
  assert.equal(s.stats().validationAttempts,1);assert.equal(s.stats().successfulFirstPass,1);
  assert.equal(s.db.prepare('SELECT COUNT(*) n FROM wiki_articles').get().n,0);
  assert.equal((await s.request('publish',{runId:s.id,draftId:d.draftId})).data.published,true);
  assert.equal(s.stats().published,1);assert.equal(s.stats().firstPassPublished,1);
  const n=(await s.request('next?runId='+s.id)).data;
  assert.equal(n.context.target.code,code(2));assert.equal(n.autoopt.observations,1);
  assert.equal(n.autoopt.historicalAttemptsPerPublish,1);assert(n.autoopt.confidence>0);
  s.env.AUTOOPT_ENABLED='false';assert.equal((await s.request('next?runId='+s.id)).data.autoopt,undefined);
  const before=s.stats().validationAttempts;const legacy=await s.draft(s.id);assert.equal(legacy.data.valid,true);
  assert.equal(s.stats().validationAttempts,before);
});
test('AUTOOPT: length failure then valid retry and learned profile',async t=>{
  const s=await autooptCase();
  // A real canonical lower bound 579, not a mocked validator message.
  const ctx=JSON.parse(s.db.prepare('SELECT context_json FROM wiki_chat_contexts WHERE id=?').get(s.body.contextId).context_json);
  ctx.profile.words={min:1158,max:2000};
  s.db.prepare('UPDATE wiki_chat_contexts SET context_json=? WHERE id=?').run(JSON.stringify(ctx),s.body.contextId);
  const text=n=>'#### Explicación\n'+Array(n-2).fill('fenómeno').join(' ');
  const first=await s.request('validate',{...s.body,articleMarkdown:text(526)});
  assert.equal(first.status,422);assert.match(first.data.error,/579/);
  const after=(await s.request('next?runId='+s.id)).data.autoopt;
  assert.equal(after.recommendedWordRange.min,579);assert(after.recommendedWordRange.target>579);
  assert.equal(after.knownFailurePatterns[0],'length');assert.equal(s.stats().learnedMinimum,579);
  const d=(await s.request('validate',{...s.body,articleMarkdown:text(640)})).data;
  assert.equal(d.valid,true);assert.equal((await s.request('publish',{runId:s.id,draftId:d.draftId})).data.published,true);
  assert.equal(s.stats().validationAttempts,2);assert.equal(s.stats().attemptsForPublished,2);
  assert.equal(s.stats().minimumSuccessful,640);assert.equal(s.stats().firstPassPublished,0);
  const n=(await s.request('next?runId='+s.id)).data;
  assert.equal(n.autoopt.historicalAttemptsPerPublish,2);
  assert.equal(n.autoopt.recommendedWordRange.min,579);
  t.diagnostic('EVOLUTION '+JSON.stringify({afterFailure:after,next:n.autoopt}));
  const feature=JSON.parse(s.db.prepare("SELECT data FROM wiki_autoopt_events WHERE kind='validation' AND draft_id IS NOT NULL").get().data);
  assert.equal(feature.transformation,'expanded');assert.equal(feature.previousCategory,'length');
});
test('AUTOOPT: three distinct activity-like failures defer; never bypass R32 or replace FIFO',async()=>{
  const s=await autooptCase();
  for(let i=0;i<3;i++){
    const r=await s.request('validate',{...s.body,articleMarkdown:originalArticle.articleMarkdown+'\nCompleta este ejercicio. '+i});
    assert.equal(r.status,422);assert.match(r.data.error,/actividad o curso/);
  }
  const m=s.stats();assert.equal(m.validationFailures,3);assert.equal(m.r32FalsePositiveLikeFailures,3);assert.equal(m.deferred,1);
  assert.equal(s.db.prepare('SELECT COUNT(*) n FROM wiki_chat_drafts').get().n,0);
  assert.equal(s.db.prepare('SELECT COUNT(*) n FROM wiki_articles').get().n,0);
  const n=(await s.request('next?runId='+s.id)).data;assert.equal(n.context.target.code,code(2));
  assert.equal(n.run.selected,2);assert.equal(n.run.deferred,1);assert.equal(n.autoopt.r32Risk,'high');
  assert(n.autoopt.recommendations.some(x=>x.includes('lenguaje instructivo')));
});
test('AUTOOPT: concurrent identical validation retries count only once, including failures',async()=>{
  const s=await autooptCase();
  const invalid={...s.body,articleMarkdown:'#### Breve\nInsuficiente.'};
  const failures=await Promise.all([s.request('validate',invalid),s.request('validate',invalid)]);
  assert(failures.every(x=>x.status===422));assert.equal(s.stats().validationAttempts,1);
  assert.equal(s.db.prepare('SELECT editorial_attempts FROM wiki_chat_incidents').get().editorial_attempts,1);
  const valid=await Promise.all([s.request('validate',s.body),s.request('validate',s.body)]);
  assert(valid.every(x=>x.data.valid));assert.equal(valid[0].data.draftId,valid[1].data.draftId);
  assert.equal(s.stats().validationAttempts,2);
  const pubs=await Promise.all(valid.map(x=>s.request('publish',{runId:s.id,draftId:x.data.draftId})));
  assert(pubs.every(x=>x.data.published));assert.equal(s.stats().published,1);
  assert.equal((await s.request('validate',s.body)).data.draftId,valid[0].data.draftId);
  assert.equal(s.stats().validationAttempts,2);
});
test('AUTOOPT: two concurrent runs isolate metrics, aggregate exact totals and persist between calls',async()=>{
  const s=await autooptCase();
  const other=(await s.request('start',{command:'MLS siguientes 2',requestId:'other-concurrent-run-0001'})).data.run.id;
  const results=await Promise.all([s.draft(s.id),s.draft(other)]);assert(results.every(x=>x.data.valid));
  await Promise.all(results.map((x,i)=>s.request('publish',{runId:i?other:s.id,draftId:x.data.draftId})));
  assert.equal(s.stats().published,1);assert.equal(s.stats('run',other).published,1);
  assert.equal(s.stats('global','*').published,2);
  const positions=s.db.prepare("SELECT code FROM wiki_chat_items WHERE status='published' ORDER BY code").all().map(x=>x.code);
  assert.deepEqual(positions,[code(1),code(3)]);
});
test('AUTOOPT: preservedExisting never reinforces editorial success',async()=>{
  const s=await autooptCase();const d=(await s.request('validate',s.body)).data;
  // Copy the existing fixture publication helper's SQL shape, with external provenance.
  s.db.prepare(`INSERT INTO wiki_articles(code,language,language_name,n,title,level,part,chapter,article_markdown,provider,model,audit_provider,audit_model,prompt_version,generated_at)
    VALUES (?,?,?,?,?,?,?,?,?,'external','external','external','external','32.0','before')`).run(
      s.body.code,originalArticle.language,originalArticle.languageName,1,originalArticle.title,originalArticle.level,originalArticle.part,originalArticle.chapter,'existing prose');
  const p=await s.request('publish',{runId:s.id,draftId:d.draftId});assert.equal(p.data.preservedExisting,true);
  assert.equal(s.stats().preservedExisting,1);assert.equal(s.stats().published,0);
  assert.equal(s.stats().minimumSuccessful,null);
  assert.equal(s.db.prepare('SELECT article_markdown FROM wiki_articles').get().article_markdown,'existing prose');
});
test('AUTOOPT: version partition, deterministic unknown, authoritative bounds and structure',async()=>{
  const s=await autooptCase();
  assert.equal(s.context.mlsAutooptFamily({title:'Tema genérico'}),'unknown');
  assert.equal(s.context.mlsAutooptFamily({title:'Conjugación del pretérito'}),'conjugacion_verbal');
  assert.equal(s.context.mlsAutooptFamily({title:'Concordancia de pronombres'}),'unknown');
  const ctx={...s.next.context,promptVersion:'33.0'};
  await s.env.WIKI_DB.batch([s.context.mlsAutooptEvent(s.env,{id:'future',token:'fixture',context:ctx,runId:s.id,contextId:'future',kind:'validation',data:{valid:1,words:1000}})]);
  assert.equal(s.stats('global','*','33.0').validationAttempts,1);assert.equal(s.stats().validationAttempts,undefined);
  assert.equal((await s.context.mlsAutooptProfile(s.env,s.next.context)).history,'insufficient');
  const bounds=s.context.mlsAutooptBounds({...ctx,profile:{sampleSize:1,words:{min:100,max:500}}},{minimumWords:200,maximumWords:250});
  assert.equal(bounds.min,200);assert.equal(bounds.max,250);
});
test('AUTOOPT: transaction failures roll back drafts, publication and learning together',async()=>{
  const s=await autooptCase();
  // Invoke operation directly so the failure is inside its batch, not schema setup.
  s.setFailure(1);
  await assert.rejects(s.context.mlsChatValidate(s.env,s.body),/simulated failure/);
  assert.equal(s.stats().validationAttempts,undefined);assert.equal(s.db.prepare('SELECT COUNT(*) n FROM wiki_chat_drafts').get().n,0);
  s.setFailure(-1);const d=await s.context.mlsChatValidate(s.env,s.body);
  s.setFailure(4);await assert.rejects(s.context.mlsChatPublish(s.env,{runId:s.id,draftId:d.draftId}),/simulated failure/);
  assert.equal(s.stats().published,0);assert.equal(s.db.prepare('SELECT COUNT(*) n FROM wiki_articles').get().n,0);
  s.setFailure(-1);assert.equal((await s.context.mlsChatPublish(s.env,{runId:s.id,draftId:d.draftId})).published,true);
  assert.equal(s.stats().published,1);
});
test('AUTOOPT: needs_review remains separate and is never requeued by learning',async()=>{
  const s=await autooptCase(1);
  for(let i=0;i<3;i++) await s.request('validate',{...s.body,articleMarkdown:'short '+i});
  const rescue=(await s.request('start',{command:'MLS rescate siguientes 1',requestId:'autoopt-rescue-request-0001'})).data.run.id;
  const next=(await s.request('next?runId='+rescue)).data;
  for(let i=0;i<3;i++) assert.equal((await s.request('validate',{...s.body,runId:rescue,contextId:next.contextId,articleMarkdown:'short rescue '+i})).status,422);
  const stats=s.stats('run',rescue);assert.equal(stats.needsReview,1);assert.equal(stats.deferred,0);
  assert.equal(s.db.prepare('SELECT rescue_state FROM wiki_chat_incidents').get().rescue_state,'needs_review');
  assert.equal((await s.request('next?runId='+rescue)).data.context,null);
});
test('AUTOOPT: reset is isolated, retains idempotency and schema matches generated migration',async()=>{
  const {execFileSync}=require('node:child_process');
  const s=await autooptCase();const d=(await s.request('validate',s.body)).data;
  const cli=(...args)=>execFileSync(process.execPath,[path.join(root,'scripts/autoopt admin.cjs'),...args],{encoding:'utf8'});
  assert.equal(cli('schema'),fs.readFileSync(path.join(root,'MLS R32 EDITORIAL/AUTOOPT schema.sql'),'utf8'));
  const articles=s.db.prepare('SELECT COUNT(*) n FROM wiki_articles').get().n;
  s.db.exec(cli('reset','all'));assert.equal(s.stats().validationAttempts,undefined);
  assert.equal((await s.request('validate',s.body)).data.draftId,d.draftId);
  assert.equal(s.stats().validationAttempts,undefined);
  assert.equal(s.db.prepare('SELECT COUNT(*) n FROM wiki_chat_drafts').get().n,1);
  assert.equal(s.db.prepare('SELECT COUNT(*) n FROM wiki_articles').get().n,articles);
  s.db.exec(cli('inspect'));s.db.exec(cli('reset','family','unknown'));s.db.exec(cli('reset','prompt','32.0'));
});
test('AUTOOPT: receipt retention protects active runs and rejects expired closed validation retries',async()=>{
  const s=await autooptCase(1);const d=(await s.request('validate',s.body)).data;
  s.db.exec("UPDATE wiki_autoopt_events SET created_at='2000-01-01T00:00:00.000Z'");
  for(const sql of s.context.mlsAutooptRetention()) s.db.exec(sql);
  assert.equal(s.db.prepare('SELECT COUNT(*) n FROM wiki_autoopt_events').get().n,1);
  await s.request('publish',{runId:s.id,draftId:d.draftId});
  s.db.exec("UPDATE wiki_autoopt_events SET created_at='2000-01-01T00:00:00.000Z'");
  for(const sql of s.context.mlsAutooptRetention()) s.db.exec(sql);
  assert.equal(s.db.prepare('SELECT COUNT(*) n FROM wiki_autoopt_events').get().n,0);
  assert.equal((await s.request('validate',s.body)).status,409);
  assert.equal((await s.request('publish',{runId:s.id,draftId:d.draftId})).data.reused,true);
  assert.equal(s.stats().published,1);
});
test('AUTOOPT: publication failures are recorded once and status exposes run metrics',async()=>{
  const s=await autooptCase();const d=(await s.request('validate',s.body)).data;
  s.setFailure(4);assert.equal((await s.request('publish',{runId:s.id,draftId:d.draftId})).status,500);
  // Disable injection for the explicit failure receipt retry; the route's original failure receipt already ran.
  s.setFailure(-1);
  await s.context.mlsAutooptPublicationFailure(s.env,{runId:s.id,draftId:d.draftId});
  assert.equal(s.stats().publicationFailures,1);
  assert.equal((await s.request('publish',{runId:s.id,draftId:d.draftId})).data.published,true);
  const status=(await s.request('status?runId='+s.id)).data.autoopt;
  assert.equal(status.selected,2);assert.equal(status.averageAttemptsPerPublication,1);
});
test('AUTOOPT: compact structures, positive confidence and gradual overlength reduction',async()=>{
  const s=await autooptCase(4),targets=[];
  for(let i=0;i<3;i++) {
    const d=(await s.draft(s.id)).data;await s.request('publish',{runId:s.id,draftId:d.draftId});
    targets.push((await s.request('next?runId='+s.id)).data.autoopt);
  }
  assert(targets[2].recommendedWordRange.target<=targets[0].recommendedWordRange.target);
  assert(targets[2].confidence>targets[0].confidence);
  assert(targets[2].successfulStructure);assert(targets[2].preferredSectionCount>0);
  assert(JSON.stringify(targets[2]).length<2200);
});
test('AUTOOPT: measured fixture benchmark (fixed writer, not claimed production gains)',async t=>{
  const reports=[];
  for(const enabled of [false,true]) {
    const s=setup({autoopt:enabled});const id=(await s.start(2)).data.run.id;
    const initial={...s.operations};
    for(let i=0;i<2;i++) {
      const next=(await s.request('next?runId='+id)).data;
      const body={runId:id,contextId:next.contextId,code:next.context.target.code,articleMarkdown:originalArticle.articleMarkdown,
        referenceCodes:fixture.calibration.referenceCodes,editorialReview:'Verified linguistic accuracy and corpus calibration for benchmark.'};
      if(i) for(let retry=0;retry<2;retry++) assert.equal((await s.request('validate',{...body,articleMarkdown:'short'})).status,422);
      const d=(await s.request('validate',body)).data;assert.equal(d.valid,true);
      assert.equal((await s.request('publish',{runId:id,draftId:d.draftId})).data.published,true);
    }
    reports.push({autoopt:enabled,validationCalls:4,uniqueValidationAttempts:enabled?3:4,publications:2,
      validationsPerPublication:enabled?1.5:2,firstPassPublicationRate:0.5,
      meanWords:originalArticle.articleMarkdown.trim().split(/\s+/u).length,
      statements:s.operations.statements-initial.statements,calls:s.operations.calls-initial.calls});
  }
  t.diagnostic(JSON.stringify(reports));
});
test('AUTOOPT: actual workerd D1 persists across runtime restart and serializes concurrent events',async()=>{
  const {Miniflare,convertV4MiniflareOptions}=require('miniflare');
  const dir=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'mls autoopt '));
  const script=`
    const WIKI_FIFO_ORDER_SQL='n', WIKI_PROMPT_VERSION='32.0', SYSTEM_PROMPT='fixture', LANGUAGE_MODULES={'espanol-guatemala':'fixture'};
    const fixture=${JSON.stringify(fixture)},originalArticle=fixture.articles[0];
    async function ensureWikiDb() {}
    function editorialProfileR32() { return fixture.calibration.profile; }
    async function getEditorialContextR32(env,code) { return {ok:true,promptVersion:'32.0',target:{...originalArticle,code,n:Number(code.slice(-4))},profile:fixture.calibration.profile,references:fixture.calibration.referenceCodes.map(code=>({code,articleMarkdown:'fixture'}))}; }
    ${runtime.slice(basicStart,basicEnd)}
    ${buildChatRuntime(root)}
    export default {fetch(request,env){return handleMlsChat(request,env,new URL(request.url));}};
  `;
  const options={name:'autooptfixture',modules:true,script,compatibilityDate:'2026-08-18',d1Databases:['WIKI_DB'],d1Persist:dir,
    bindings:{AUTOOPT_ENABLED:'true',MLS_EDITORIAL_CHAT_KEY:'local-d1-fixture-key-with-at-least-32-chars'}};
  let mf=new Miniflare(convertV4MiniflareOptions?{...convertV4MiniflareOptions(options),resourcePersistencePath:dir}:options);
  const call=async(route,body)=>{
    const r=await mf.dispatchFetch('https://fixture.local/api/wiki/editorial/chat/'+route,{method:body?'POST':'GET',
      headers:{authorization:'Bearer '+options.bindings.MLS_EDITORIAL_CHAT_KEY,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
    return {status:r.status,data:await r.json()};
  };
  try {
    let db=await mf.getD1Database('WIKI_DB');
    for(const name of ['wiki_jobs','wiki_articles']) {
      const start=runtime.indexOf('CREATE TABLE IF NOT EXISTS '+name+' (');
      await db.prepare(runtime.slice(start,runtime.indexOf('`',start))).run();
    }
    for(let n=1;n<=4;n++) await db.prepare("INSERT INTO wiki_jobs(code,language,language_name,n,seed_path,updated_at) VALUES (?,'espanol-guatemala','Español de Guatemala',?,'fixture','before')").bind(code(n),n).run();
    const a=(await call('start',{command:'MLS siguientes 2',requestId:'workerd-first-request-0001'})).data.run.id;
    const b=(await call('start',{command:'MLS siguientes 2',requestId:'workerd-second-request-0001'})).data.run.id;
    const next=(await call('next?runId='+a)).data;
    const body={runId:a,contextId:next.contextId,code:next.context.target.code,articleMarkdown:originalArticle.articleMarkdown,
      referenceCodes:fixture.calibration.referenceCodes,editorialReview:'Verified actual R32 fixture grammar, structure, examples and corpus.'};
    const ds=await Promise.all([call('validate',body),call('validate',body)]);assert(ds.every(x=>x.data.valid),JSON.stringify(ds));
    const pubs=await Promise.all(ds.map(x=>call('publish',{runId:a,draftId:x.data.draftId})));assert(pubs.every(x=>x.data.published));
    await mf.dispose();mf=new Miniflare(convertV4MiniflareOptions?{...convertV4MiniflareOptions(options),resourcePersistencePath:dir}:options);db=await mf.getD1Database('WIKI_DB');
    const resumed=await call('next?runId='+a);assert.equal(resumed.status,200,JSON.stringify(resumed));const profile=resumed.data.autoopt;assert(profile,JSON.stringify(resumed));assert.equal(profile.publications,1);assert.equal(profile.observations,1);
    const nextB=(await call('next?runId='+b)).data;
    const invalid={...body,runId:b,contextId:nextB.contextId,code:nextB.context.target.code,articleMarkdown:'short'};
    const rejects=await Promise.all([call('validate',invalid),call('validate',invalid)]);assert(rejects.every(x=>x.status===422));
    const global=JSON.parse((await db.prepare("SELECT stats FROM wiki_autoopt_stats WHERE scope='global'").first()).stats);
    assert.equal(global.validationAttempts,2);assert.equal(global.published,1);assert.equal(global.validationFailures,1);
    // Force a real D1 transaction rollback after a write to the statistics table.
    await assert.rejects(db.batch([db.prepare("UPDATE wiki_autoopt_stats SET stats='{}'"),db.prepare('INSERT INTO nonexistent_table VALUES (1)')]));
    assert.equal(JSON.parse((await db.prepare("SELECT stats FROM wiki_autoopt_stats WHERE scope='global'").first()).stats).published,1);
  } finally {await mf.dispose();fs.rmSync(dir,{recursive:true,force:true});}
});
test('AUTOOPT: enabled cancellation, empty status and unknown context preserve boundaries',async()=>{
  const s=setup({autoopt:true});assert.equal((await s.request('status')).data.autoopt,undefined);
  const id=(await s.start(1)).data.run.id;
  const next=(await s.request('next?runId='+id)).data;
  const unknown={...next.context,target:{...next.context.target,title:'Tema general',part:'General',chapter:'General'}};
  const p=await s.context.mlsAutooptProfile(s.env,unknown);
  assert.equal(p.family,'unknown');assert.equal(p.history,'insufficient');
  const d=(await s.draft(id)).data;
  await s.request('cancel',{runId:id,confirm:true});
  assert.equal((await s.request('publish',{runId:id,draftId:d.draftId})).status,409);
  assert.equal(s.db.prepare('SELECT COUNT(*) n FROM wiki_articles').get().n,0);
  assert.equal((await s.request('next?runId='+id)).data.context,null);
});
