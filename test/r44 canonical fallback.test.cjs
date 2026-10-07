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
  const env={WIKI_DB:{prepare(sql){let p=[];return {bind(...args){p=args;return this},runSync(){return /\bRETURNING\b/i.test(sql)?{results:run(sql,p,true)}:run(sql,p,false)},async run(){return run(sql,p,false)},async first(){return run(sql,p,true)[0]||null},async all(){return {results:run(sql,p,true)}}}},async batch(ss){db.exec('BEGIN');try{const out=ss.map(s=>s.runSync());db.exec('COMMIT');return out}catch(e){db.exec('ROLLBACK');throw e}}}};
  const r=vm.createContext({crypto:globalThis.crypto,TextEncoder,Response,Request,URL,Date,Map,Set,JSON});
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
test('idle runners claim the next full batch while one earlier entry is still processing',async()=>{
  const h=harness();await setup(h,0);await assets(h,205);
  let release,entered=false;
  const gate=new Promise(resolve=>release=resolve),codes=[];
  h.r.unifiedR33BuildDraft=async(_env,input)=>{
    codes.push(input.code);
    if(input.code==='MLS-V01-0001'){entered=true;await gate;}
    return Response.json({status:'MATCH',evidence:{code:input.code}});
  };
  const slow=h.r.canonicalStep(h.env);
  try{
    while(!entered)await new Promise(r=>setImmediate(r));
    const original=h.db.prepare("SELECT lease_token,batch_id FROM mls_canonical_queue WHERE code='MLS-V01-0001'").get();
    for(let i=0;i<99;i++)assert.equal((await h.r.canonicalStep(h.env)).status,'CANONICAL_PREPARED');
    assert.equal(h.db.prepare("SELECT COUNT(*) n FROM mls_canonical_queue WHERE state='READY'").get().n,0);
    const next=await Promise.all(Array.from({length:20},()=>h.r.canonicalStep(h.env)));
    assert(next.every(x=>x.status==='CANONICAL_PREPARED'));
    assert.equal(new Set(next.map(x=>x.batchId)).size,1,'concurrent refill must reserve one batch');
    assert.notEqual(next[0].batchId,original.batch_id);
    assert.equal(new Set(codes).size,120,'no duplicate entry processing');
    assert.equal(h.db.prepare("SELECT COUNT(*) n FROM mls_canonical_queue WHERE batch_id=?").get(next[0].batchId).n,100);
    assert.equal(h.db.prepare("SELECT COUNT(*) n FROM mls_canonical_queue WHERE state='PENDING'").get().n,5);
    assert.deepEqual(h.db.prepare("SELECT lease_token,batch_id FROM mls_canonical_queue WHERE code='MLS-V01-0001'").get(),original);
  }finally{release();}
  assert.equal((await slow).status,'CANONICAL_PREPARED');
});

test('concurrent callers exhaust a small READY tail and immediately claim the next batch',async()=>{
  const h=harness();await setup(h,0);await assets(h,205);await h.r.canonicalSeed(h.env);
  h.db.exec("UPDATE mls_canonical_queue SET state='READY',batch_id='previous' WHERE code IN (SELECT code FROM mls_canonical_queue ORDER BY code LIMIT 3)");
  const results=await Promise.all(Array.from({length:20},()=>h.r.canonicalStep(h.env)));
  assert(results.every(x=>x.status==='CANONICAL_PREPARED'),'no false NO_WORK at the batch boundary');
  assert.equal(new Set(results.map(x=>x.code)).size,20);
  const batches=results.filter(x=>x.batchId!=='previous').map(x=>x.batchId);
  assert.equal(new Set(batches).size,1);
  assert.equal(h.db.prepare('SELECT COUNT(*) n FROM mls_canonical_queue WHERE batch_id=?').get(batches[0]).n,100);
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

test('repair quarantine lane registers a live auditable source and reopens only that entry',async()=>{
  const h=harness();await setup(h,0);await assets(h,1);await h.r.canonicalSeed(h.env);
  h.r.MLS_R33_SOURCE_CATALOG=[];
  h.db.exec("UPDATE mls_canonical_queue SET state='QUARANTINED',attempts=2,last_error='SOURCE_URL_UNAVAILABLE',lease_token=NULL,expires_ms=0,retry_ms=0 WHERE code='MLS-V01-0001'");
  h.r.unifiedR33RepairDiscover=async()=>({parsed:{status:'CANDIDATES',candidates:[{url:'https://example.org/grammar',title:'Example',sourceType:'institutional_webpage'}]},result:{model:'fixture'}});
  h.r.unifiedR33FetchSourceDocument=async candidate=>({ok:true,sourceId:candidate.sourceId,url:candidate.metadata.canonicalUrl,text:'Example grammar source with enough substantive content for a validated repair candidate.'.repeat(8),title:candidate.metadata.title});
  h.r.unifiedR33RepairOverlap=()=>3;
  const out=await h.r.canonicalStep(h.env);
  assert.equal(out.status,'REPAIR_QUARANTINE');
  assert.equal(out.repair.status,'REPAIR_SOURCE_REGISTERED');
  assert.equal(h.db.prepare("SELECT COUNT(*) n FROM mls_r33_repair_sources WHERE code='MLS-V01-0001' AND state='ACTIVE'").get().n,1);
  assert.equal(h.db.prepare("SELECT state FROM mls_canonical_queue WHERE code='MLS-V01-0001'").get().state,'RETRY');
});

test('repair quarantine discovery is bounded to twelve diverse source attempts',async()=>{
  const h=harness();await setup(h,0);await assets(h,1);await h.r.canonicalSeed(h.env);
  h.db.exec("UPDATE mls_canonical_queue SET state='QUARANTINED',attempts=2,last_error='SOURCE_NO_AUDITABLE_REGISTERED_CANDIDATE',lease_token=NULL,expires_ms=0,retry_ms=0 WHERE code='MLS-V01-0001'");
  h.r.unifiedR33RepairDiscover=async()=>({parsed:{status:'NO_SAFE_SOURCE',candidates:[]},result:{model:'fixture'}});
  h.r.unifiedR33RepairRegisteredRescue=async()=>({ok:false,reason:'REPAIR_NO_REGISTERED_FULLTEXT_RESCUE'});
  for(let i=0;i<12;i++)assert.equal((await h.r.unifiedR33RepairStep(h.env)).status,'REPAIR_NO_SAFE_SOURCE');
  assert.equal((await h.r.unifiedR33RepairStep(h.env)).status,'NO_REPAIR_WORK');
  const row=h.db.prepare("SELECT state,attempts FROM mls_r33_repair_queue WHERE code='MLS-V01-0001'").get();
  assert.equal(row.state,'BLOCKED');assert.equal(row.attempts,12);
});

test('repair source links allow one validated source to support multiple canonical entries',async()=>{
  const h=harness();await setup(h,0);const packets=await assets(h,2);await h.r.canonicalSeed(h.env);await h.r.unifiedR33RepairEnsure(h.env);
  h.r.unifiedR33FetchSourceDocument=async candidate=>({ok:true,sourceId:candidate.sourceId,url:candidate.metadata.canonicalUrl,text:'English grammar substantive source text '.repeat(20),title:candidate.metadata.title});
  h.r.unifiedR33RepairOverlap=()=>4;
  const candidate={url:'https://example.org/shared-grammar',title:'Shared grammar source',sourceType:'institutional_webpage'};
  for(let i=0;i<2;i++){
    const code='MLS-V01-000'+(i+1),lease='lease-'+i;
    h.db.prepare("UPDATE mls_canonical_queue SET state='QUARANTINED',last_error='SOURCE_NO_AUDITABLE_REGISTERED_CANDIDATE' WHERE code=?").run(code);
    h.db.prepare("INSERT OR REPLACE INTO mls_r33_repair_queue(code,state,reason,attempts,lease_token,expires_ms,updated_ms) VALUES(?,?,?,?,?,?,?)")
      .run(code,'LEASED','SOURCE_NO_AUDITABLE_REGISTERED_CANDIDATE',1,lease,Date.now()+60000,Date.now());
    const input=packets[0].find(x=>x.input.code===code).input;
    const saved=await h.r.unifiedR33RepairRegister(h.env,input,{code,reason:'SOURCE_NO_AUDITABLE_REGISTERED_CANDIDATE',lease_token:lease},candidate,{model:'fixture'});
    assert.equal(saved.ok,true);
  }
  assert.equal(h.db.prepare("SELECT COUNT(*) n FROM mls_r33_repair_sources").get().n,1);
  assert.equal(h.db.prepare("SELECT COUNT(*) n FROM mls_r33_repair_source_links").get().n,2);
  assert.equal((await h.r.unifiedR33RepairSources(h.env,'MLS-V01-0001')).length,1);
  assert.equal((await h.r.unifiedR33RepairSources(h.env,'MLS-V01-0002')).length,1);
});

test('repair v2 rehydrates legacy DONE source pointers without new inference',async()=>{
  const h=harness();await setup(h,0);await assets(h,1);await h.r.canonicalSeed(h.env);await h.r.unifiedR33RepairEnsure(h.env);
  const code='MLS-V01-0001',sourceId='MLS-SRC-AAAAAAAAAAAAAAAAAAAA';
  const source={schemaVersion:'1.0',sourceId,metadata:{sourceType:'institutional_webpage',authorityTier:'A',status:'active',title:'Grammar source',institution:'Example',canonicalUrl:'https://example.org/grammar',language:'en'},repairValidatedFulltext:true,repairPublishRequired:true};
  h.db.prepare("INSERT OR REPLACE INTO mls_r33_repair_sources(source_id,code,source_json,source_sha256,url,authority_tier,provenance_json,created_ms,state) VALUES(?,?,?,?,?,?,?,?,?)")
    .run(sourceId,code,JSON.stringify(source),'sha','https://example.org/grammar','A','{}',Date.now(),'ACTIVE');
  h.db.prepare("INSERT OR REPLACE INTO mls_r33_repair_queue(code,state,reason,attempts,last_error,last_source_id,updated_ms) VALUES(?,?,?,?,?,?,?)")
    .run(code,'DONE','SOURCE_NO_AUDITABLE_REGISTERED_CANDIDATE',3,null,sourceId,Date.now());
  h.db.prepare("UPDATE mls_canonical_queue SET state='QUARANTINED',last_error='SOURCE_NO_AUDITABLE_REGISTERED_CANDIDATE' WHERE code=?").run(code);
  h.db.prepare("DELETE FROM mls_r33_repair_source_links WHERE code=?").run(code);
  const before=h.db.prepare("SELECT context_hash FROM mls_canonical_recovery WHERE code=?").get(code).context_hash;
  const out=await h.r.unifiedR33RepairRehydrateDone(h.env);
  assert.equal(out.status,'REPAIR_SOURCE_REHYDRATED');
  assert.equal(h.db.prepare("SELECT COUNT(*) n FROM mls_r33_repair_source_links WHERE code=? AND source_id=?").get(code,sourceId).n,1);
  const after=h.db.prepare("SELECT context_hash FROM mls_canonical_recovery WHERE code=?").get(code).context_hash;
  assert.notEqual(after,before);
  assert.equal(h.db.prepare("SELECT last_error FROM mls_r33_repair_queue WHERE code=?").get(code).last_error,'REHYDRATED_V2');
});

test('repair v2 rehydration atomically fans out distinct DONE rows',async()=>{
  const h=harness();await setup(h,0);await assets(h,2);await h.r.canonicalSeed(h.env);await h.r.unifiedR33RepairEnsure(h.env);
  const sourceId='MLS-SRC-CCCCCCCCCCCCCCCCCCCC';
  const source={schemaVersion:'1.0',sourceId,metadata:{sourceType:'institutional_webpage',authorityTier:'A',status:'active',title:'Shared grammar source',institution:'Example',canonicalUrl:'https://example.org/shared',language:'en'},repairValidatedFulltext:true,repairPublishRequired:true};
  h.db.prepare("INSERT OR REPLACE INTO mls_r33_repair_sources(source_id,code,source_json,source_sha256,url,authority_tier,provenance_json,created_ms,state) VALUES(?,?,?,?,?,?,?,?,?)")
    .run(sourceId,'MLS-V01-0001',JSON.stringify(source),'sha','https://example.org/shared','A','{}',Date.now(),'ACTIVE');
  for(const code of ['MLS-V01-0001','MLS-V01-0002']){
    h.db.prepare("UPDATE mls_canonical_queue SET state='QUARANTINED',last_error='SOURCE_NO_AUDITABLE_REGISTERED_CANDIDATE' WHERE code=?").run(code);
    h.db.prepare("INSERT OR REPLACE INTO mls_r33_repair_queue(code,state,reason,attempts,last_error,last_source_id,updated_ms) VALUES(?,?,?,?,?,?,?)")
      .run(code,'DONE','SOURCE_NO_AUDITABLE_REGISTERED_CANDIDATE',3,null,sourceId,Date.now());
    h.db.prepare("INSERT OR IGNORE INTO mls_r33_repair_source_links(code,source_id,created_ms) VALUES(?,?,?)").run(code,sourceId,Date.now());
  }
  const out=await Promise.all([h.r.unifiedR33RepairRehydrateDone(h.env),h.r.unifiedR33RepairRehydrateDone(h.env)]);
  assert(out.every(x=>x.status==='REPAIR_SOURCE_REHYDRATED'));
  assert.equal(new Set(out.map(x=>x.code)).size,2,'concurrent rehydration must lease distinct codes');
  assert.equal(h.db.prepare("SELECT COUNT(*) n FROM mls_r33_repair_queue WHERE state='DONE' AND last_error='REHYDRATED_V2'").get().n,2);
});

test('repair v2 rescues a blocked entry with live full text from an existing registered source',async()=>{
  const h=harness();await setup(h,0);const packets=await assets(h,1);await h.r.canonicalSeed(h.env);await h.r.unifiedR33RepairEnsure(h.env);
  const code='MLS-V01-0001',sourceId='MLS-SRC-BBBBBBBBBBBBBBBBBBBB';
  h.r.MLS_R33_SOURCE_CATALOG=[{schemaVersion:'1.0',sourceId,metadata:{language:'en',title:'English grammar reference',sourceType:'book',authorityTier:'A',status:'active',publisher:'Example Press',canonicalUrl:'https://example.org/fulltext-book'}}];
  h.db.prepare("UPDATE mls_canonical_queue SET state='QUARANTINED',last_error='SOURCE_NO_AUDITABLE_REGISTERED_CANDIDATE' WHERE code=?").run(code);
  h.db.prepare("INSERT OR REPLACE INTO mls_r33_repair_queue(code,state,reason,attempts,last_error,updated_ms) VALUES(?,?,?,?,?,?)")
    .run(code,'BLOCKED','SOURCE_NO_AUDITABLE_REGISTERED_CANDIDATE',3,'REPAIR_NO_SAFE_SOURCE',Date.now());
  h.r.unifiedR33RepairFetchRegisteredDocument=async candidate=>({ok:true,sourceId:candidate.sourceId,url:candidate.metadata.canonicalUrl,text:'English grammar reference nouns verbs clauses agreement '.repeat(20),title:candidate.metadata.title});
  h.r.unifiedR33RepairOverlap=()=>5;
  const out=await h.r.unifiedR33RepairStep(h.env);
  assert.equal(out.status,'REPAIR_SOURCE_REGISTERED');
  const overlays=await h.r.unifiedR33RepairSources(h.env,code);
  assert.equal(overlays.length,1);
  assert.equal(overlays[0].repairValidatedFulltext,true);
  assert.equal(overlays[0].repairPublishRequired,false);
  const eligible=h.r.unifiedR33SourceCandidates(packets[0][0].input.article,{}, {autoAuditableOnly:true,extraCatalog:overlays});
  assert.equal(eligible.some(x=>x.sourceId===sourceId&&x.repairValidatedFulltext===true),true);
  assert.equal(h.r.unifiedR33SourceAutoAuditable({sourceId,metadata:h.r.MLS_R33_SOURCE_CATALOG[0].metadata}),false,'normal static book remains excluded until live repair validation');
});


test('prepared-only drain never regenerates evidence on cache miss or changed context',async()=>{
  const h=harness();await setup(h,0);const packets=await assets(h,2);
  await h.r.canonicalStep(h.env);
  h.r.unifiedR33BuildDraft=async()=>{throw Error('AI MUST NOT RUN')};
  const input=packets[0][0].input;
  const call=body=>h.r.unifiedRunnerR33Draft(new Request('https://test/prepared-evidence',{method:'POST',body:JSON.stringify(body)}),h.env,null,true);
  const hit=await (await call(input)).json();
  assert.equal(hit.preparedByRunner,true);
  assert.equal((await (await call({...input,currentEvidenceRevision:9})).json()).reason,'PREPARED_CONTEXT_MISMATCH_OR_MISSING');
  assert.equal((await (await call(packets[0][1].input)).json()).reason,'PREPARED_CONTEXT_MISMATCH_OR_MISSING');
  assert.equal(h.db.prepare("SELECT COUNT(*) n FROM mls_canonical_queue WHERE state='PREPARED'").get().n,1);
});

test('new asset revision preserves prepared evidence and its original context hash',async()=>{
  const h=harness();await setup(h,0);const packets=await assets(h,1);
  await h.r.canonicalStep(h.env);
  const before=h.db.prepare('SELECT input_hash,result_json FROM mls_canonical_queue').get();
  const input={...packets[0][0].input,currentEvidenceRevision:2};
  h.env.ASSETS={async fetch(){return Response.json({revision:'changed',pending:1,waitingHandoff:0,rows:[{code:input.code,inputHash:await h.r.canonicalInputHash(input),page:0}]})}};
  await h.r.canonicalSeed(h.env);
  const after=h.db.prepare('SELECT state,input_hash,result_json FROM mls_canonical_queue').get();
  assert.equal(after.state,'PREPARED');assert.equal(after.input_hash,before.input_hash);assert.equal(after.result_json,before.result_json);
  assert.equal(await h.r.canonicalPrepared(h.env,input),null);
});

test('canonical malformed JSON recovery is bounded and leaves source quarantine intact',async()=>{
  const h=harness();await setup(h,0);await assets(h,2);await h.r.canonicalSeed(h.env);
  h.r.MLS_R33_SOURCE_CATALOG=[{sourceId:'book-only',metadata:{language:'en',title:'Fixture',sourceType:'book',authorityTier:'A',canonicalUrl:'https://books.example/product'}}];
  h.db.exec("UPDATE mls_canonical_queue SET state='QUARANTINED',attempts=4,last_error='UNIFIED_R33_DRAFT_JSON_INVALID' WHERE code='MLS-V01-0001'");
  h.db.exec("UPDATE mls_canonical_queue SET state='QUARANTINED',attempts=3,last_error='SOURCE_FULLTEXT_REQUIRED' WHERE code='MLS-V01-0002'");
  h.r.unifiedR33BuildDraft=async()=>{throw Error('UNIFIED_R33_DRAFT_JSON_INVALID')};
  for(let i=0;i<2;i++){
    await h.r.canonicalRecoverQuarantine(h.env);
    const waiting=h.db.prepare("SELECT state,retry_ms,last_error FROM mls_canonical_queue WHERE code='MLS-V01-0001'").get();
    assert.equal(waiting.state,'RETRY');assert(waiting.retry_ms<=Date.now(),'quarantine recovery must be immediately claimable');
    assert.equal(waiting.last_error,'UNIFIED_R33_DRAFT_JSON_INVALID');
    assert.equal((await h.r.canonicalStatus(h.env)).claimable,1);
    await h.r.canonicalStep(h.env);
  }
  assert.equal(h.db.prepare("SELECT attempts FROM mls_canonical_queue WHERE code='MLS-V01-0001'").get().attempts,6);
  h.db.exec('UPDATE mls_canonical_recovery_clock SET next_ms=0; UPDATE mls_canonical_queue SET retry_ms=0');
  h.r.unifiedR33RepairDiscover=async()=>({parsed:{status:'NO_SAFE_SOURCE',candidates:[]},result:{model:'fixture'}});
  assert.equal((await h.r.canonicalStep(h.env)).status,'REPAIR_QUARANTINE');
  assert.equal(h.db.prepare("SELECT attempts FROM mls_canonical_queue WHERE code='MLS-V01-0002'").get().attempts,3);
  assert.equal(h.db.prepare('SELECT COUNT(*) n FROM mls_canonical_recovery_history').get().n,2);
});

async function reseed(h,packets,revision,contextFor=()=> 'sources-v1'){
  const rows=await Promise.all(packets.flat().map(async item=>({code:item.input.code,inputHash:await h.r.canonicalInputHash(item.input),page:0,contextHash:contextFor(item.input.code)})));
  h.env.ASSETS={async fetch(req){return Response.json(new URL(req.url).pathname.endsWith('manifest.json')?{revision,pending:rows.length,waitingHandoff:0,rows}:packets.flat())}};
  await h.r.canonicalSeed(h.env);
}
test('legacy bootstrap gets one same-context preflight recovery; unrelated deploy cannot duplicate it; material change reopens one row',async()=>{
  const h=harness();await setup(h,0);const packets=await assets(h,2);await h.r.canonicalSeed(h.env);
  h.r.MLS_R33_SOURCE_CATALOG=[{sourceId:'fixture-source',metadata:{language:'en',title:'Example',sourceType:'institutional_webpage',authorityTier:'A',canonicalUrl:'https://example.org/source'}}];
  h.db.exec("UPDATE mls_canonical_queue SET state='QUARANTINED',attempts=1,last_error='MATCHER_REQUESTED_REVIEW'; DELETE FROM mls_canonical_recovery");
  await reseed(h,packets,'baseline');
  await h.r.canonicalRecoverQuarantine(h.env);
  assert.equal(h.db.prepare("SELECT COUNT(*) n FROM mls_canonical_queue WHERE state='RETRY'").get().n,2);
  assert.equal(h.db.prepare("SELECT SUM(recoveries) n FROM mls_canonical_recovery").get().n,2);
  // Simulate the bounded same-context R33 retry failing editorial review again.
  h.db.exec("UPDATE mls_canonical_queue SET state='QUARANTINED',retry_ms=0,last_error='MATCHER_REQUESTED_REVIEW'");
  assert.equal((await h.r.canonicalStatus(h.env)).quarantine.recoverable,0);
  await reseed(h,packets,'unrelated-deploy');
  assert.equal((await h.r.canonicalStatus(h.env)).quarantine.recoverable,0);
  await reseed(h,packets,'source-fixed',code=>code.endsWith('0001')?'sources-v2':'sources-v1');
  assert.equal((await h.r.canonicalStatus(h.env)).quarantine.recoverable,1);
  h.db.exec('UPDATE mls_canonical_recovery_clock SET next_ms=0');
  await h.r.canonicalRecoverQuarantine(h.env);
  assert.equal(h.db.prepare("SELECT state FROM mls_canonical_queue WHERE code='MLS-V01-0001'").get().state,'RETRY');
  assert.equal(h.db.prepare("SELECT state FROM mls_canonical_queue WHERE code='MLS-V01-0002'").get().state,'QUARANTINED');
});
test('quarantine recovery has no time throttle: consecutive 100-entry sweeps run immediately and never include R44 quarantines',async()=>{
  const h=harness();await setup(h,1);await assets(h,120);await h.r.canonicalSeed(h.env);
  h.db.exec("UPDATE mls_canonical_queue SET state='QUARANTINED',attempts=1,last_error='SOURCE_FETCH_HTTP_503'; UPDATE r44_ticket_progress SET state='QUARANTINED'");
  const r44Before=h.db.prepare('SELECT * FROM r44_ticket_progress').all();
  await h.r.canonicalRecoverQuarantine(h.env);
  assert.equal(h.db.prepare("SELECT COUNT(*) n FROM mls_canonical_queue WHERE state='RETRY'").get().n,100);
  assert.equal(h.db.prepare("SELECT next_ms FROM mls_canonical_recovery_clock WHERE id=1").get().next_ms,0,'single-flight mutex must release immediately');
  await h.r.canonicalRecoverQuarantine(h.env);
  assert.equal(h.db.prepare("SELECT COUNT(*) n FROM mls_canonical_queue WHERE state='RETRY'").get().n,120,'second sweep must not wait for a time window');
  const status=await h.r.canonicalStatus(h.env);
  assert.equal(status.quarantine.source,'mls_canonical_queue');assert.equal(status.quarantine.total,0);
  assert.equal(status.quarantine.batchSize,100);
  assert.equal(status.quarantine.intervalMs,0);
  assert.equal(status.quarantine.mode,'IMMEDIATE_SINGLE_FLIGHT');
  assert.deepEqual(h.db.prepare('SELECT * FROM r44_ticket_progress').all(),r44Before);
});
test('same-context editorial quarantine gets one cheap preflight retry and then fences repeated failure',async()=>{
  const h=harness();await setup(h,0);const packets=await assets(h,1);await h.r.canonicalSeed(h.env);
  h.r.MLS_R33_SOURCE_CATALOG=[{sourceId:'fixture-source',metadata:{language:'en',title:'Example',sourceType:'institutional_webpage',authorityTier:'A',canonicalUrl:'https://example.org/source'}}];
  h.db.exec("UPDATE mls_canonical_queue SET state='QUARANTINED',attempts=1,last_error='MATCHER_REQUESTED_REVIEW' WHERE code='MLS-V01-0001'");
  assert.equal((await h.r.canonicalStatus(h.env)).quarantine.recoverable,1);
  await h.r.canonicalRecoverQuarantine(h.env);
  assert.equal(h.db.prepare("SELECT state FROM mls_canonical_queue WHERE code='MLS-V01-0001'").get().state,'RETRY');
  assert.equal(h.db.prepare("SELECT technical_retries FROM mls_canonical_recovery WHERE code='MLS-V01-0001'").get().technical_retries,1);
  h.r.unifiedR33BuildDraft=async()=>Response.json({status:'NEEDS_CHAT_REVIEW',reason:'MATCHER_REQUESTED_REVIEW'});
  assert.equal((await h.r.canonicalStep(h.env)).status,'CANONICAL_QUARANTINED');
  h.db.exec('UPDATE mls_canonical_recovery_clock SET next_ms=0');
  await h.r.canonicalRecoverQuarantine(h.env);
  assert.equal(h.db.prepare("SELECT state FROM mls_canonical_queue WHERE code='MLS-V01-0001'").get().state,'QUARANTINED');
  assert.equal((await h.r.canonicalStatus(h.env)).quarantine.recoverable,0);
  await reseed(h,packets,'source-context-changed',()=> 'sources-v2');
  assert.equal((await h.r.canonicalStatus(h.env)).quarantine.recoverable,1,'material context change must reopen recovery');
});

test('input and policy changes never degrade VERIFIED or regenerate PREPARED',async()=>{
  const h=harness();await setup(h,0);const packets=await assets(h,2);
  await h.r.canonicalStep(h.env);await h.r.canonicalStep(h.env);
  h.db.exec("UPDATE mls_canonical_queue SET state='VERIFIED' WHERE code='MLS-V01-0002'");
  const before=h.db.prepare('SELECT code,state,input_hash,result_json,attempts FROM mls_canonical_queue ORDER BY code').all();
  packets[0].forEach(item=>item.input.article.title='material input edit');
  await reseed(h,packets,'changed-terminal',()=> 'policy-v2');
  h.r.unifiedR33BuildDraft=async()=>{throw Error('AI MUST NOT RUN')};
  assert.equal((await h.r.canonicalStep(h.env)).status,'NO_WORK');
  assert.deepEqual(h.db.prepare('SELECT code,state,input_hash,result_json,attempts FROM mls_canonical_queue ORDER BY code').all(),before);
});
test('403, unknown errors and hash mismatches remain quarantined without changed context',async()=>{
  const h=harness();await setup(h,0);await assets(h,3);await h.r.canonicalSeed(h.env);
  ['SOURCE_FETCH_HTTP_403','UNKNOWN_FAILURE','CANONICAL_CONTEXT_HASH_MISMATCH_X'].forEach((error,i)=>h.db.prepare("UPDATE mls_canonical_queue SET state='QUARANTINED',last_error=? WHERE code=?").run(error,'MLS-V01-000'+(i+1)));
  await h.r.canonicalRecoverQuarantine(h.env);
  const status=await h.r.canonicalStatus(h.env);
  assert.equal(status.quarantine.recoverable,0);assert.equal(status.quarantine.requiresChangeOrReview,3);
  assert.equal(status.quarantine.byCategory.hash_context,1);
  assert.equal(status.quarantine.byCategory.sources_context,1);
  assert.equal(status.quarantine.byCategory.other,1);
});
test('registered DOI and exact handoff locator make source text fetchable without changing source identity',async()=>{
  const h=harness();h.r.URL=URL;
  h.r.MLS_R33_SOURCE_CATALOG=[
    {sourceId:'journal',metadata:{language:'en',title:'Grammar Journal',sourceType:'journal_article',authorityTier:'B',doi:'10.1234/example'}},
    {sourceId:'book',metadata:{language:'en',title:'Grammar Book',sourceType:'book',authorityTier:'B'}}
  ];
  const article={language:'ingles',title:'Grammar',articleMarkdown:'Grammar morphology syntax'};
  const candidates=h.r.unifiedR33SourceCandidates(article,{sources:[{sourceId:'book',url:'https://example.org/book-text'}]});
  const journal=candidates.find(x=>x.sourceId==='journal'),book=candidates.find(x=>x.sourceId==='book');
  assert.equal(journal.fetchUrl,'https://doi.org/10.1234/example');
  assert.equal(journal.fetchLocatorSource,'doi');
  assert.equal(book.fetchUrl,'https://example.org/book-text');
  assert.equal(book.fetchLocatorSource,'handoff');
  h.r.fetch=async()=>new Response('<html><body>'+('substantive grammar evidence '.repeat(30))+'</body></html>',{status:200,headers:{'content-type':'text/html'}});
  assert.equal((await h.r.unifiedR33FetchSourceDocument(journal)).ok,true);
  assert.equal((await h.r.unifiedR33FetchSourceDocument(book)).ok,true);
  const withoutMatch=h.r.unifiedR33SourceCandidates(article,{sources:[{sourceId:'someone-else',url:'https://example.org/not-this-source'}]}).find(x=>x.sourceId==='book');
  assert.equal(withoutMatch.fetchUrl,null,'handoff URL must never cross sourceId identity');
});

test('source locator quarantine gets one extra bounded retry and then fences',async()=>{
  const h=harness();await setup(h,0);await assets(h,1);await h.r.canonicalSeed(h.env);h.r.URL=URL;
  h.r.MLS_R33_SOURCE_CATALOG=[{sourceId:'fixture-source',metadata:{language:'en',title:'Example',sourceType:'institutional_webpage',authorityTier:'A',canonicalUrl:'https://example.org/source'}}];
  h.db.exec("UPDATE mls_canonical_queue SET state='QUARANTINED',attempts=2,last_error='SOURCE_URL_UNAVAILABLE' WHERE code='MLS-V01-0001'; UPDATE mls_canonical_recovery SET technical_retries=1,failed_context_hash=context_hash WHERE code='MLS-V01-0001'");
  assert.equal((await h.r.canonicalStatus(h.env)).quarantine.recoverable,1);
  await h.r.canonicalRecoverQuarantine(h.env);
  assert.equal(h.db.prepare("SELECT state FROM mls_canonical_queue WHERE code='MLS-V01-0001'").get().state,'RETRY');
  assert.equal(h.db.prepare("SELECT technical_retries FROM mls_canonical_recovery WHERE code='MLS-V01-0001'").get().technical_retries,2);
  h.db.exec("UPDATE mls_canonical_queue SET state='QUARANTINED',retry_ms=0,last_error='SOURCE_URL_UNAVAILABLE',lease_token=NULL,expires_ms=0 WHERE code='MLS-V01-0001'");
  assert.equal((await h.r.canonicalStatus(h.env)).quarantine.recoverable,0);
});

test('unfetchable source locator quarantine consumes the extra retry without spinning',async()=>{
  const h=harness();await setup(h,0);await assets(h,1);await h.r.canonicalSeed(h.env);h.r.URL=URL;
  h.r.MLS_R33_SOURCE_CATALOG=[{sourceId:'book-only',metadata:{language:'en',title:'Example',sourceType:'book',authorityTier:'B'}}];
  h.db.exec("UPDATE mls_canonical_queue SET state='QUARANTINED',attempts=2,last_error='SOURCE_FULLTEXT_REQUIRED' WHERE code='MLS-V01-0001'; UPDATE mls_canonical_recovery SET technical_retries=1,failed_context_hash=context_hash WHERE code='MLS-V01-0001'");
  assert.equal((await h.r.canonicalStatus(h.env)).quarantine.recoverable,1);
  await h.r.canonicalRecoverQuarantine(h.env);
  assert.equal(h.db.prepare("SELECT state FROM mls_canonical_queue WHERE code='MLS-V01-0001'").get().state,'QUARANTINED');
  assert.equal(h.db.prepare("SELECT technical_retries FROM mls_canonical_recovery WHERE code='MLS-V01-0001'").get().technical_retries,2);
  assert.equal((await h.r.canonicalStatus(h.env)).quarantine.recoverable,0);
});

test('candidate fingerprint ignores unrelated language sources and reacts to selected source URL or policy',()=>{
  const {hash}=require('../scripts/r44 canonical assets.cjs');
  const h=harness();
  h.r.MLS_R33_SOURCE_CATALOG=[{sourceId:'english',metadata:{language:'en',title:'Grammar',sourceType:'institutional_webpage',authorityTier:'A',canonicalUrl:'https://example.org/old'}}];
  const input={article:{code:'MLS-V01-0001',language:'ingles',title:'Grammar'},handoffEntry:{}};
  const fingerprint=()=>hash(h.r.unifiedR33CanonicalContext(input));
  const before=fingerprint();
  h.r.MLS_R33_SOURCE_CATALOG.push({sourceId:'unrelated',metadata:{language:'ja',title:'Japanese'}});
  assert.equal(fingerprint(),before);
  h.r.MLS_R33_SOURCE_CATALOG[0].metadata.canonicalUrl='https://example.org/fulltext';
  assert.notEqual(fingerprint(),before);
  const sourceChanged=fingerprint();h.r.MLS_CANONICAL_R33_POLICY.support=2;
  assert.notEqual(fingerprint(),sourceChanged);
});
test('R33 auto-auditable selection excludes books, missing URLs and private URLs',()=>{
  const h=harness();h.r.URL=URL;
  const candidate=(sourceType,canonicalUrl)=>({sourceId:'fixture',metadata:{sourceType,canonicalUrl}});
  assert.equal(h.r.unifiedR33SourceAutoAuditable(candidate('book',null)),false);
  assert.equal(h.r.unifiedR33SourceAutoAuditable(candidate('book','https://www.amazon.com/example')),false);
  assert.equal(h.r.unifiedR33SourceAutoAuditable(candidate('reference_entry',null)),false);
  assert.equal(h.r.unifiedR33SourceAutoAuditable(candidate('institutional_webpage','http://127.0.0.1/private')),false);
  assert.equal(h.r.unifiedR33SourceAutoAuditable(candidate('institutional_webpage','https://example.org/source')),true);
});

test('R33 source quarantine preflight retries only when an auditable source exists',()=>{
  const h=harness();h.r.URL=URL;
  const input={article:{code:'MLS-V01-0001',language:'ingles',title:'English grammar',articleMarkdown:'English grammar'},handoffEntry:{}};
  h.r.MLS_R33_SOURCE_CATALOG=[{sourceId:'book',metadata:{language:'en',title:'English grammar',sourceType:'book',authorityTier:'A',canonicalUrl:'https://books.example/product'}}];
  let preflight=h.r.unifiedR33CanonicalPreflight(input,'SOURCE_FULLTEXT_REQUIRED');
  assert.equal(preflight.eligible,false);assert.equal(preflight.fetchableCandidateCount,0);
  h.r.MLS_R33_SOURCE_CATALOG.push({sourceId:'institutional',metadata:{language:'en',title:'English grammar',sourceType:'institutional_webpage',authorityTier:'A',canonicalUrl:'https://example.org/grammar'}});
  preflight=h.r.unifiedR33CanonicalPreflight(input,'SOURCE_FULLTEXT_REQUIRED');
  assert.equal(preflight.eligible,true);assert.equal(preflight.fetchableCandidateCount,1);
});

test('R33 ranks auditable sources before the top-16 cutoff',()=>{
  const h=harness();h.r.URL=URL;
  h.r.MLS_R33_SOURCE_CATALOG=Array.from({length:16},(_,i)=>({
    sourceId:'book-'+i,
    metadata:{language:'en',title:'English grammar',sourceType:'book',authorityTier:'A',canonicalUrl:'https://books.example/'+i}
  }));
  h.r.MLS_R33_SOURCE_CATALOG.push({
    sourceId:'institutional-source',
    metadata:{language:'en',title:'Grammar reference',sourceType:'institutional_webpage',authorityTier:'B',canonicalUrl:'https://example.org/grammar'}
  });
  const input={article:{code:'MLS-V01-0001',language:'ingles',title:'English grammar',articleMarkdown:'English grammar'},handoffEntry:{}};
  const candidates=h.r.unifiedR33SourceCandidates(input.article,input.handoffEntry,{autoAuditableOnly:true});
  assert.equal(candidates.length,1);
  assert.equal(candidates[0].sourceId,'institutional-source');
});

test('R33 mapper receives only auto-auditable registered candidates',async()=>{
  const h=harness();h.r.URL=URL;let prompt='';
  h.r.MLS_R33_SOURCE_CATALOG=[
    {sourceId:'book-source',metadata:{language:'en',title:'English grammar',sourceType:'book',authorityTier:'A',canonicalUrl:'https://www.amazon.com/example'}},
    {sourceId:'institutional-source',metadata:{language:'en',title:'English grammar',sourceType:'institutional_webpage',authorityTier:'A',canonicalUrl:'https://example.org/grammar'}}
  ];
  h.r.unifiedR33RunProvider=async(_env,_provider,messages)=>{prompt=messages[0].content;return {text:JSON.stringify({status:'NEEDS_CHAT_REVIEW',confidence:0,claims:[],rationale:'fixture'})}};
  const response=await h.r.unifiedR33BuildDraft({},{
    code:'MLS-V01-0001',contentPath:'content/fixture.json',
    article:{code:'MLS-V01-0001',language:'ingles',title:'English grammar',articleMarkdown:'English grammar uses nouns and verbs.'},
    handoffEntry:{}
  });
  assert.equal(response.status,200);
  assert.match(prompt,/institutional-source/);
  assert.doesNotMatch(prompt,/book-source/);
});

test('R33 returns explicit review reason when registered sources exist but none is auditable',async()=>{
  const h=harness();h.r.URL=URL;let providerCalls=0;
  h.r.MLS_R33_SOURCE_CATALOG=[{sourceId:'book-source',metadata:{language:'en',title:'English grammar',sourceType:'book',authorityTier:'A',canonicalUrl:'https://www.amazon.com/example'}}];
  h.r.unifiedR33RunProvider=async()=>{providerCalls++;throw Error('AI MUST NOT RUN')};
  const response=await h.r.unifiedR33BuildDraft({},{
    code:'MLS-V01-0001',contentPath:'content/fixture.json',
    article:{code:'MLS-V01-0001',language:'ingles',title:'English grammar',articleMarkdown:'English grammar uses nouns and verbs.'},
    handoffEntry:{}
  });
  const data=await response.json();
  assert.equal(data.reason,'SOURCE_NO_AUDITABLE_REGISTERED_CANDIDATE');
  assert.equal(providerCalls,0);
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




test('canonical status reads through GitHub authority without mutating D1',async()=>{
  const h=harness();await setup(h,0);await assets(h,2);
  await h.r.canonicalStep(h.env);
  h.db.exec("UPDATE mls_canonical_queue SET state='QUARANTINED',last_error='SOURCE_FULLTEXT_REQUIRED' WHERE code='MLS-V01-0002'");
  const before=h.db.prepare("SELECT code,state FROM mls_canonical_queue ORDER BY code").all();
  const status=await h.r.canonicalStatus(h.env,{verifiedCodes:['MLS-V01-0001','MLS-V01-0002'],verifiedCount:2,remaining:0,etag:'fixture-etag'});
  assert.equal(status.prepared,0);
  assert.equal(status.quarantine.total,0);
  assert.equal(status.counts.VERIFIED,2);
  assert.equal(status.pending,0);
  assert.equal(status.claimable,0);
  assert.equal(status.readThroughAuthority,true);
  assert.equal(status.reconciliationPending,2);
  assert.deepEqual(h.db.prepare("SELECT code,state FROM mls_canonical_queue ORDER BY code").all(),before,'read-through status must not write D1');
  const runtime=fs.readFileSync('scripts/r44 runtime.js','utf8');
  assert.doesNotMatch(runtime,/Number\(budget\?\.d1Usage\?\.writesRemaining\)===0/);
  assert.match(runtime,/try\{authorityStatus=await canonicalAuthorityStatus\(\);\}catch\(_\)\{\}/);
  assert.match(runtime,/canonicalStatus\(env,authorityStatus\)/);
});

async function receiptPrimaryFixture(h){
  await setup(h,1);
  const entries=JSON.parse(h.db.prepare('SELECT entries_json FROM r44_tickets').get().entries_json);
  for(const entry of entries){const old=entry.code;entry.code=old.replace('MLS-V1-','MLS-V01-');h.db.prepare('UPDATE r44_entries SET code=?,source_json=? WHERE code=?').run(entry.code,JSON.stringify(entry),old)}
  h.db.prepare('UPDATE r44_tickets SET entries_json=?').run(JSON.stringify(entries));
  const rows=entries.map(e=>({code:e.code,inputHash:'waiting',contextHash:'waiting',page:-1,waiting:true}));
  h.env.ASSETS={async fetch(req){
    const url=new URL(req.url);
    if(url.pathname.endsWith('/manifest.json'))return Response.json({revision:'primary',pending:5,waitingHandoff:5,rows});
    const code=url.pathname.split('/').at(-1).replace('.json','');
    return Response.json({code,contentPath:'content/fixture.json',article:{code,articleMarkdown:'fixture'},currentEvidenceRevision:0});
  }};
  h.r.fetch=async()=>{throw Error('GitHub 403 Secondary Rate Limit')};
  h.r.unifiedR33BuildDraft=async(_env,input)=>Response.json({status:'MATCH',evidence:{code:input.code}});
  const claim=await h.r.r44Claim(h.env,'receipt-worker','receipt-claim');
  const packet=entry=>({ticketId:'T1',workerId:'receipt-worker',leaseToken:claim.ticket.lease_token,leaseGeneration:claim.ticket.leaseGeneration,idempotencyKey:'receipt:'+entry.code,entry:{code:entry.code,outcome:'PASS_NO_CHANGE'}});
  return {entries,packet};
}

test('GitHub 403: COMPLETE D1 receipts prepare once without a published handoff',async()=>{
  const h=harness(),{entries,packet}=await receiptPrimaryFixture(h);
  for(const entry of entries.slice(0,4))await h.r.r44Checkpoint(h.env,packet(entry));
  assert.equal((await h.r.canonicalStep(h.env)).status,'NO_WORK','partial ticket cannot enter R33');
  await h.r.r44Checkpoint(h.env,packet(entries[4]));
  const results=await Promise.all(entries.map(()=>h.r.canonicalStep(h.env)));
  assert(results.every(x=>x.status==='CANONICAL_PREPARED'));
  assert.equal(new Set(results.map(x=>x.code)).size,5);
  assert.equal(h.db.prepare('SELECT COUNT(*) n FROM mls_canonical_durable_inputs').get().n,5);
  assert.equal((await h.r.canonicalStep(h.env)).status,'NO_WORK');
  assert.equal(h.db.prepare("SELECT COUNT(*) n FROM mls_canonical_queue WHERE state='VERIFIED'").get().n,0);
  const stored=h.db.prepare('SELECT input_json FROM mls_canonical_durable_inputs LIMIT 1').get();
  assert.equal((await h.r.canonicalPrepared(h.env,JSON.parse(stored.input_json))).status,'MATCH');
});

test('receipt promotion crash rolls back and retry recovers; tampering never prepares',async()=>{
  const h=harness(),{entries,packet}=await receiptPrimaryFixture(h);
  for(const entry of entries)await h.r.r44Checkpoint(h.env,packet(entry));
  await h.r.canonicalSeed(h.env);
  h.db.exec("CREATE TRIGGER crash_primary BEFORE UPDATE OF state ON mls_canonical_queue WHEN NEW.state='PENDING' BEGIN SELECT RAISE(ABORT,'fixture crash'); END");
  await assert.rejects(()=>h.r.canonicalIngestReceipts(h.env),/fixture crash/);
  assert.equal(h.db.prepare('SELECT COUNT(*) n FROM mls_canonical_durable_inputs').get().n,0);
  h.db.exec('DROP TRIGGER crash_primary');
  await h.r.canonicalIngestReceipts(h.env);
  assert.equal(h.db.prepare('SELECT COUNT(*) n FROM mls_canonical_durable_inputs').get().n,5);
  const h2=harness(),f2=await receiptPrimaryFixture(h2);
  for(const entry of f2.entries)await h2.r.r44Checkpoint(h2.env,f2.packet(entry));
  await h2.r.canonicalSeed(h2.env);
  assert.throws(()=>h2.db.prepare('UPDATE r44_receipts SET payload_sha256=?').run('tampered'),/RECEIPT_IMMUTABLE/);
  // Simulate corrupt storage independently of the API's immutability guard.
  h2.db.exec('DROP TRIGGER r44_receipt_immutable');
  h2.db.prepare('UPDATE r44_receipts SET payload_sha256=?').run('tampered');
  await assert.rejects(()=>h2.r.canonicalIngestReceipts(h2.env),/RECEIPT_HASH_MISMATCH/);
  assert.equal(h2.db.prepare('SELECT COUNT(*) n FROM mls_canonical_durable_inputs').get().n,0);
});

test('scheduled wakeup never consults unavailable GitHub authority',async()=>{
  const h=harness();await setup(h,0);let wakes=0;
  h.env.ASSETS={};
  h.r.canonicalRefreshVerified=async()=>{throw Error('must not read GitHub')};
  h.env.MLS_UNIFIED_RUNNERS={idFromName:x=>x,get:()=>({fetch:async()=>{wakes++;return new Response('{}')}})};
  assert.equal((await h.r.unifiedRunnerScheduled(h.env)).status,'SCHEDULED');
  assert(wakes>0);
});


test('cold R44 context uses hash-checked Cloudflare Assets then D1, never GitHub',async()=>{
  const h=harness();await setup(h,0);
  h.r=vm.createContext({crypto:globalThis.crypto,TextEncoder,Response,Request,Date,Map,Set,JSON});
  vm.runInContext(RUNTIME,h.r);
  const text=JSON.stringify({code:'MLS-V01-0001',articleMarkdown:'frozen'}),sha=await h.r.r44Sha256Text(text);
  let reads=0;h.r.fetch=async()=>{throw Error('GitHub 403')};
  h.env.ASSETS={fetch:async()=>{reads++;return Response.json({[sha]:text})}};
  const entry={code:'MLS-V01-0001',sha256:sha,path:'unused'};
  assert.equal((await h.r.r44LoadEntry(h.env,entry)).code,entry.code);
  assert.equal((await h.r.r44LoadEntry(h.env,entry)).code,entry.code);
  assert.equal(reads,1);
  h.db.exec('DELETE FROM r44_entry_cache');
  h.env.ASSETS={fetch:async()=>Response.json({[sha]:text+'tampered'})};
  await assert.rejects(()=>h.r.r44LoadEntry(h.env,entry),/HASH_MISMATCH/);
  assert.equal(h.db.prepare('SELECT COUNT(*) n FROM r44_entry_cache').get().n,0);
});

test('Unified main publishers serialize while branch-isolated R33 evidence serializes per assignment; durable cooldown blocks before publication',async()=>{
  const {run}=require('../scripts/r44 sink guard.cjs');
  for(const name of ['MLS Unified Web Runner','MLS Unified R44 R33 Handoff']){
    const workflow=fs.readFileSync('.github/workflows/'+name+'.yml','utf8');
    assert.match(workflow,/group: mls-unified-github-writer/);
    assert.match(workflow,/cancel-in-progress: false/);
  }
  const integrationWorkflow=fs.readFileSync('.github/workflows/MLS Unified R33 Integration Execute.yml','utf8');
  assert.match(integrationWorkflow,/group: mls-unified-main-integration/);
  assert.match(integrationWorkflow,/cancel-in-progress: false/);
  const evidenceWorkflow=fs.readFileSync('.github/workflows/MLS Unified R33 Evidence Submit.yml','utf8');
  const batchEvidenceWorkflow=fs.readFileSync('.github/workflows/MLS Unified R33 Evidence Batch Submit.yml','utf8');
  assert.match(evidenceWorkflow,/group: mls-unified-r33-/);
  assert.match(evidenceWorkflow,/github\.event\.inputs\.issue_number \|\| github\.event\.issue\.number/);
  assert.match(evidenceWorkflow,/cancel-in-progress: false/);
  assert.match(batchEvidenceWorkflow,/group: mls-unified-r33-/);
  assert.match(batchEvidenceWorkflow,/github\.event\.inputs\.issue_number/);
  assert.match(batchEvidenceWorkflow,/cancel-in-progress: false/);
  const env={MLS_EDITORIAL_CHAT_KEY:'fixture'};
  await assert.rejects(()=>run('check',env,async()=>Response.json({githubGate:{state:'DEGRADED',retry_at:Date.now()+60000}})),/COOLDOWN/);
  assert.equal((await run('check',env,async()=>Response.json({githubGate:{state:'NORMAL'}}))).ok,true);
  await assert.rejects(()=>run('check',env,async()=>new Response('',{status:503})),/GATE_UNAVAILABLE/);
});
