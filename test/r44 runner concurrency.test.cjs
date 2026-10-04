const test=require('node:test');
const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const vm=require('node:vm');
const fs=require('node:fs');
const {RUNTIME,injectR44}=require('../scripts/habilitar r44 cloudflare.js');

function harness(){
  const db=new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys=ON');
  let queries=0;
  const run=(sql,p,all)=>{queries++;const stmt=db.prepare(sql);const args=/\?\d/.test(sql)?[Object.fromEntries(p.map((v,i)=>[String(i+1),v]))]:p;return all?stmt.all(...args):stmt.run(...args)};
  const env={WIKI_DB:{prepare(sql){let p=[];return {bind(...args){p=args;return this},runSync(){return run(sql,p,false)},async run(){return run(sql,p,false)},async first(){return run(sql,p,true)[0]||null},async all(){return {results:run(sql,p,true)}}}},async batch(ss){db.exec('BEGIN');try{const out=ss.map(s=>s.runSync());db.exec('COMMIT');return out}catch(e){db.exec('ROLLBACK');throw e}}}};
  const r=vm.createContext({crypto:globalThis.crypto,TextEncoder,Response,Request,Date,Map,Set,JSON});
  vm.runInContext(RUNTIME,r);
  r.wikiErrorMessage=e=>e.message;
  r.workersAiFailureKind=message=>message.includes('quota')?'quota':message.includes('paid')?'paid':'other';
  r.unifiedRunnerAuthorize=async()=>({ok:true});
  r.r44LoadEntry=async(_env,entry)=>entry;
  r.unifiedRunnerAuditEntry=async(_env,entry)=>({code:entry.code,outcome:'PASS_NO_CHANGE'});
  return {db,env,r,reset(){queries=0},get queries(){return queries}};
}
async function setup(h,count=150){
  await h.r.r44EnsureSchema(h.env);
  h.db.prepare("INSERT INTO r44_meta VALUES('pool_schema','MLS-R44-CLOUDFLARE-POOL-2'),('pool_ticket_count',?),('pool_ticket_size','5')").run(String(count));
  for(let t=1;t<=count;t++){
    const entries=Array.from({length:5},(_,i)=>({code:`MLS-V${t}-000${i+1}`,sha256:'sha',path:'fixture.json'}));
    h.db.prepare('INSERT INTO r44_tickets(ticket_id,ordinal_start,ordinal_end,entries_json,updated_at) VALUES(?,?,?,?,?)').run('T'+t,(t-1)*5+1,t*5,JSON.stringify(entries),'fixture');
  }
  await h.r.r44DurableReady(h.env);
  await h.r.unifiedRunnerEnsure(h.env);
  h.db.exec("UPDATE mls_unified_runner SET state='RUNNING'");
}
function control(h,body){return h.r.unifiedRunnerControl(new Request('https://test/control',{method:'POST',body:JSON.stringify(body)}),h.env)}

test('configuration accepts exactly 5..50 by five, persists, rejects invalid and unauthenticated writes',async()=>{
  const h=harness();await setup(h);
  for(let runners=5;runners<=50;runners+=5){assert.equal((await control(h,{action:'configure',runners})).status,200);assert.equal((await h.r.unifiedRunnerRead(h.env)).configured_runners,runners)}
  for(const runners of [0,1,4,6,51,128,'10',null,5.5])assert.equal((await control(h,{action:'configure',runners})).status,400);
  h.r.unifiedRunnerReady=new WeakSet();
  assert.equal((await h.r.unifiedRunnerRead(h.env)).configured_runners,50);
  assert.equal(h.db.prepare('SELECT COUNT(DISTINCT worker_id) n FROM mls_unified_runner_slots').get().n,50);
  h.r.unifiedRunnerAuthorize=async()=>({ok:false,error:'UNAUTHORIZED',status:401});
  assert.equal((await control(h,{action:'configure',runners:5})).status,401);
  assert.equal((await h.r.unifiedRunnerRead(h.env)).configured_runners,50);
});
test('50 simultaneous slots checkpoint different tickets; duplicate slot cannot execute; shrink drains safely',async()=>{
  const h=harness();await setup(h);await control(h,{action:'configure',runners:50});
  let release;const barrier=new Promise(r=>release=r);let entered=0;
  h.r.unifiedRunnerAuditEntry=async(_env,entry)=>{entered++;await barrier;return {code:entry.code,outcome:'PASS_NO_CHANGE'}};
  const pending=Array.from({length:50},(_,i)=>h.r.unifiedRunnerStep(h.env,'parallel:'+i,i+1));
  for(let i=0;i<1000&&entered<50;i++)await new Promise(r=>setImmediate(r));
  assert.equal(entered,50);
  assert.equal((await h.r.unifiedRunnerRead(h.env)).active_runners,50);
  assert.equal((await h.r.unifiedRunnerStep(h.env,'duplicate:slot',1)).status,'RUNNER_BUSY');
  await control(h,{action:'configure',runners:5});
  assert.equal((await h.r.unifiedRunnerStep(h.env,'disabled:slot',50)).status,'RUNNER_DISABLED');
  release();const results=await Promise.all(pending);
  assert(results.every(r=>r.status==='ENTRY_DURABLE'));
  assert.equal(new Set(results.map(r=>r.ticketId)).size,50);
  assert.equal(h.db.prepare('SELECT COUNT(*) n FROM r44_receipts').get().n,50);
  assert.equal((await h.r.unifiedRunnerRead(h.env)).active_runners,0);
  const again=await h.r.unifiedRunnerStep(h.env,'recover:slot',1);
  assert.equal(again.ticketId,results[0].ticketId);
  assert.equal(h.db.prepare('SELECT COUNT(*) n FROM r44_receipts WHERE ticket_id=?').get(again.ticketId).n,2);
});
test('global allocator includes other clients and caps concurrent claims at 128',async()=>{
  const h=harness();await setup(h);await control(h,{action:'configure',runners:50});
  for(let i=0;i<120;i++)assert.equal((await h.r.r44DurableClaim(h.env,'chat-'+i,'claim-'+i)).status,'CLAIMED');
  const out=await Promise.all(Array.from({length:50},(_,i)=>h.r.unifiedRunnerStep(h.env,'capacity:'+i,i+1)));
  assert.equal(out.filter(r=>r.status==='ENTRY_DURABLE').length,8);
  assert.equal(out.filter(r=>r.status==='CAPACITY_BUSY').length,42);
  assert.equal(h.db.prepare('SELECT COUNT(*) n FROM r44_leases WHERE expires_ms>?').get(Date.now()).n,128);
});
test('single entry cold execution stays below 50 D1 queries and repeated key never advances',async()=>{
  const h=harness();await setup(h);h.r.unifiedRunnerReady=new WeakSet();h.reset();
  const first=await h.r.unifiedRunnerStep(h.env,'query:budget',1);
  assert.equal(first.status,'ENTRY_DURABLE');assert(h.queries<=50,`D1 queries: ${h.queries}`);
  assert.equal((await h.r.unifiedRunnerStep(h.env,'query:budget',1)).status,'RUNNER_BUSY');
  assert.equal(h.db.prepare('SELECT COUNT(*) n FROM r44_receipts').get().n,1);
});
test('legacy lock, stopped state, expired locks and FREE-only errors gate execution',async()=>{
  const h=harness();await setup(h);
  h.db.prepare('UPDATE mls_unified_runner SET busy_until=?').run(Date.now()+10000);
  assert.equal((await h.r.unifiedRunnerStep(h.env,'legacy:lock',1)).status,'RUNNER_BUSY');
  h.db.exec('UPDATE mls_unified_runner SET busy_until=NULL');
  h.db.exec("UPDATE mls_unified_runner_slots SET busy_until=1,step_token='stale' WHERE id=1");
  h.r.unifiedRunnerAuditEntry=async()=>{throw Error('quota exhausted')};
  assert.equal((await h.r.unifiedRunnerStep(h.env,'quota:test',1)).status,'QUOTA_PAUSED');
  assert.equal((await h.r.unifiedRunnerStep(h.env,'quota:next',2)).status,'RUNNER_NOT_RUNNING');
  await control(h,{action:'resume'});
  h.r.unifiedRunnerAuditEntry=async()=>{throw Error('R44_CONTEXT_HASH_MISMATCH_MLS-V10-0870')};
  assert.equal((await h.r.unifiedRunnerStep(h.env,'r44:degraded',2)).status,'R44_DEGRADED');
  assert.equal((await h.r.unifiedRunnerRead(h.env)).state,'RUNNING');
  assert.match((await h.r.unifiedRunnerRead(h.env)).last_error,/R44 lane: R44_CONTEXT_HASH_MISMATCH/);
  h.r.unifiedRunnerAuditEntry=async()=>{throw Error('paid provider prohibited')};
  assert.equal((await h.r.unifiedRunnerStep(h.env,'policy:test',2)).status,'POLICY_PAUSED');
  assert.equal((await h.r.unifiedRunnerRead(h.env)).active_runners,0);
});
test('cron arms 50 independent server alarms, alarms resume entries and stop when disabled',async()=>{
  const h=harness();await setup(h);await control(h,{action:'configure',runners:50});
  const Klass=vm.runInContext('UnifiedLogicalRunner',h.r),objects=new Map();
  h.env.MLS_UNIFIED_RUNNERS={idFromName:n=>n,get(n){if(!objects.has(n)){const values=new Map();let alarm=null;const storage={async get(k){return values.get(k)},async put(k,v){values.set(k,v)},async delete(k){values.delete(k)},async getAlarm(){return alarm},async setAlarm(v){alarm=v}};objects.set(n,{object:new Klass({storage},h.env),values,get alarm(){return alarm},clear(){alarm=null}})}return {fetch:(url,init)=>objects.get(n).object.fetch(new Request(url,init))}}};
  assert.equal((await h.r.unifiedRunnerScheduled(h.env)).runners,50);
  assert.equal(objects.size,50);assert([...objects.values()].every(x=>x.alarm));
  const one=objects.get('runner-1');one.clear();await one.object.alarm();assert(one.alarm);
  assert.equal(h.db.prepare('SELECT COUNT(*) n FROM r44_receipts').get().n,1);
  await control(h,{action:'configure',runners:5});
  const fifty=objects.get('runner-50');fifty.clear();await fifty.object.alarm();assert.equal(fifty.alarm,null);
  await control(h,{action:'stop'});one.clear();await one.object.alarm();assert.equal(one.alarm,null);
});
test('build exports the SQLite alarm class once and panel has exactly the ten options',()=>{
  const original=fs.readFileSync('MLS R32 OVERLAY/index.js','utf8'),built=injectR44(original);
  assert.equal(injectR44(built),built);
  assert.equal((built.match(/export \{ UnifiedLogicalRunner \}/g)||[]).length,1);
  const html=fs.readFileSync('public/runner.html','utf8');
  const select=html.match(/<select id="unifiedRunners">([\s\S]*?)<\/select>/)[1];
  assert.deepEqual([...select.matchAll(/value="(\d+)"/g)].map(m=>Number(m[1])),[5,10,15,20,25,30,35,40,45,50]);
  for(const m of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
  const config=JSON.parse(fs.readFileSync('MLS R32 OVERLAY/wrangler.jsonc'));
  assert(config.migrations.some(m=>m.new_sqlite_classes?.includes('UnifiedLogicalRunner')));
});
