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
  const bind = (sql,args=[]) => ({sql,args,bind(...a){return bind(sql,a)},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}},async run(){const r=db.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}}}});
  const env = {MLS_EDITORIAL_CHAT_KEY:'test-secret-only-not-for-production-000000',WIKI_DB:{prepare:bind,async batch(queries){db.exec('BEGIN');try{const results=queries.map((q,i)=>{if(i===failBatchAt)throw Error('simulated failure');const r=db.prepare(q.sql).run(...q.args);return {meta:{changes:Number(r.changes)}}});db.exec('COMMIT');return results;}catch(e){db.exec('ROLLBACK');throw e;}}}};
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
  return {db,env,context,request,rescue,start,draft,setFailure(i){failBatchAt=i}};
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
