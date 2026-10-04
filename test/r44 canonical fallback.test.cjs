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
  h.db.prepare("INSERT INTO r44_meta VALUES('pool_schema','MLS-R44-CLOUDFLARE-POOL-2'),('pool_ticket_count',?),('pool_ticket_size','5')").run(String(Math.max(1,count)));
  for(let t=1;t<=count;t++){
    const entries=Array.from({length:5},(_,i)=>({code:`MLS-V${t}-000${i+1}`,sha256:'sha',path:'fixture.json'}));
    h.db.prepare('INSERT INTO r44_tickets(ticket_id,ordinal_start,ordinal_end,entries_json,updated_at) VALUES(?,?,?,?,?)').run('T'+t,(t-1)*5+1,t*5,JSON.stringify(entries),'fixture');
  }
  await h.r.r44DurableReady(h.env);
  await h.r.unifiedRunnerEnsure(h.env);
  h.db.exec("UPDATE mls_unified_runner SET state='RUNNING'");
}
function control(h,body){return h.r.unifiedRunnerControl(new Request('https://test/control',{method:'POST',body:JSON.stringify(body)}),h.env)}
async function assets(h,count=205){
  const packets=[],rows=[];
  for(let i=0;i<count;i++){
    const code='MLS-V01-'+String(i+1).padStart(4,'0');
    const input={code,contentPath:'content/ingles/'+code+'.json',article:{code,articleMarkdown:'example'},handoffEntry:{outcome:'PASS_NO_CHANGE'},currentEvidenceRevision:0};
    const inputHash=await h.r.canonicalInputHash(input),page=Math.floor(i/100);
    (packets[page]??=[]).push({inputHash,input});rows.push({code,inputHash,page});
  }
  h.env.ASSETS={async fetch(req){const file=new URL(req.url).pathname.split('/').at(-1);return Response.json(file==='manifest.json'?{revision:'fixture',pending:count,waitingHandoff:0,rows}:packets[Number(file.match(/-(\d+)\.json$/)[1])])}};
  h.r.unifiedR33BuildDraft=async()=>Response.json({status:'MATCH',evidence:{fixture:true}});
  return packets;
}
test('NO_WORK falls back to 100-entry canonical batch, fenced leases do not duplicate work',async()=>{
  const h=harness();await setup(h,0);await assets(h);
  let release;const gate=new Promise(resolve=>release=resolve);
  const codes=[];
  h.r.unifiedR33BuildDraft=async(_env,input)=>{codes.push(input.code);await gate;return Response.json({status:'MATCH',evidence:{code:input.code}})};
  const a=h.r.unifiedRunnerStep(h.env,'canonical:first',1);
  const b=h.r.unifiedRunnerStep(h.env,'canonical:second',2);
  while(codes.length<2)await new Promise(r=>setImmediate(r));
  assert.equal(new Set(codes).size,2);
  assert.equal(h.db.prepare("SELECT COUNT(*) n FROM mls_canonical_queue WHERE batch_id IS NOT NULL").get().n,100);
  assert.equal(h.db.prepare("SELECT COUNT(*) n FROM mls_canonical_queue WHERE state='PENDING'").get().n,105);
  release();assert((await Promise.all([a,b])).every(x=>x.status==='CANONICAL_PREPARED'));
  assert.equal((await h.r.canonicalStatus(h.env)).prepared,2);
  assert.equal((await h.r.unifiedRunnerRead(h.env)).state,'RUNNING');
});
test('individual canonical failures continue, quota pauses, prepared results bind exact input',async()=>{
  const h=harness();await setup(h,0);const packets=await assets(h,4);
  h.r.unifiedR33BuildDraft=async()=>{throw Error('temporary source error')};
  assert.equal((await h.r.canonicalStep(h.env)).status,'CANONICAL_RETRY');
  h.r.unifiedR33BuildDraft=async()=>Response.json({status:'NEEDS_CHAT_REVIEW',reason:'SOURCE_FULLTEXT_REQUIRED'});
  assert.equal((await h.r.canonicalStep(h.env)).status,'CANONICAL_QUARANTINED');
  h.r.unifiedR33BuildDraft=async()=>Response.json({status:'MATCH',evidence:{fixture:true}});
  const ok=await h.r.canonicalStep(h.env);assert.equal(ok.status,'CANONICAL_PREPARED');
  const input=packets[0].find(p=>p.input.code===ok.code).input;
  assert.equal((await h.r.canonicalPrepared(h.env,input)).status,'MATCH');
  assert.equal(await h.r.canonicalPrepared(h.env,{...input,currentEvidenceRevision:1}),null);
  h.r.unifiedR33BuildDraft=async()=>Response.json({error:'QUOTA_PAUSED',message:'quota exhausted'}, {status:429});
  assert.equal((await h.r.canonicalStep(h.env)).status,'QUOTA_PAUSED');
  assert.equal((await h.r.unifiedRunnerRead(h.env)).state,'QUOTA_PAUSED');
  assert.equal(h.db.prepare("SELECT COUNT(*) n FROM mls_canonical_queue WHERE state='LEASED'").get().n,0);
});
test('expired canonical result cannot commit and expired entry is reclaimable',async()=>{
  const h=harness();await setup(h,0);await assets(h,1);
  h.r.unifiedR33BuildDraft=async()=>{h.db.exec("UPDATE mls_canonical_queue SET expires_ms=1");return Response.json({status:'MATCH'})};
  assert.equal((await h.r.canonicalStep(h.env)).error,'CANONICAL_LEASE_LOST');
  h.r.unifiedR33BuildDraft=async()=>Response.json({status:'MATCH'});
  assert.equal((await h.r.canonicalStep(h.env)).status,'CANONICAL_PREPARED');
});
test('R44 bad context is isolated; subsequent runner step advances to the next entry',async()=>{
  const h=harness();await setup(h,1);
  h.r.r44LoadEntry=async()=>{throw Error('R44_CONTEXT_HASH_MISMATCH_MLS-V10-0870')};
  assert.equal((await h.r.unifiedRunnerStep(h.env,'r44:bad-context',1)).status,'R44_DEGRADED');
  assert.equal(h.db.prepare("SELECT COUNT(*) n FROM r44_entries WHERE state='FAILED_RETRYABLE'").get().n,1);
  h.r.r44LoadEntry=async(_env,entry)=>entry;
  assert.equal((await h.r.unifiedRunnerStep(h.env,'r44:next-entry',1)).status,'ENTRY_DURABLE');
  assert.equal(h.db.prepare('SELECT code FROM r44_receipts').get().code,'MLS-V1-0002');
});


