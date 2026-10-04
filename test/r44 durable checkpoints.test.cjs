const test=require('node:test');
const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const vm=require('node:vm');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {RUNTIME,injectR44}=require('../scripts/habilitar r44 cloudflare.js');
const {R44Client}=require('../scripts/r44 client.js');
function harness(file=':memory:') {
 const db=new DatabaseSync(file);db.exec('PRAGMA foreign_keys=ON');
 let now=1000000, fault=null, beforeBatch=null;
 db.function('unixepoch',{varargs:true},()=>now/1000);
 class Clock extends Date {static now(){return now;}}
 const run=(sql,params,all)=>{
   const stmt=db.prepare(sql);
   const args=/\?\d/.test(sql)?[Object.fromEntries(params.map((v,i)=>[String(i+1),v]))]:params;
   return all?stmt.all(...args):stmt.run(...args);
 };
 const env={WIKI_DB:{prepare(sql){let params=[];return {
   bind(...p){assert(p.length<=100);params=p;return this},
   runSync(){return run(sql,params,false)},
   async run(){return run(sql,params,false)},async all(){return {results:run(sql,params,true)}},async first(){return run(sql,params,true)[0]||null}
 }},async batch(statements){
   if(beforeBatch){const f=beforeBatch;beforeBatch=null;await f();}
   if(fault==='before'){fault=null;throw Error('timeout before commit');}
   db.exec('BEGIN');try{const out=[];for(const s of statements)out.push(s.runSync());db.exec('COMMIT');if(fault==='after'){fault=null;throw Error('timeout after commit');}return out}catch(e){if(db.isTransaction)db.exec('ROLLBACK');throw e}
 }}};
 const r=vm.createContext({crypto:globalThis.crypto,TextEncoder,Response,Request,Date:Clock,Map,Set,JSON,fetch:async()=>{throw Error('UNEXPECTED_NETWORK')}});
 vm.runInContext(RUNTIME,r);
 return {db,env,r,setNow(n){now=n},fault(s){fault=s},race(f){beforeBatch=f},close(){db.close()}};
}
async function seed(h,count=1) {
 await h.r.r44EnsureSchema(h.env);
 h.db.prepare("INSERT INTO r44_meta VALUES('pool_schema','MLS-R44-CLOUDFLARE-POOL-2'),('pool_ticket_count',?),('pool_ticket_size','5')").run(String(count));
 for(let t=1;t<=count;t++) {
  const entries=Array.from({length:5},(_,i)=>({code:`MLS-V0${t}-000${i+1}`,sha256:'source-'+(i+1),path:'fixture.json'}));
  h.db.prepare("INSERT INTO r44_tickets(ticket_id,ordinal_start,ordinal_end,entries_json,updated_at) VALUES(?,?,?,?,?)").run('T'+t,(t-1)*5+1,t*5,JSON.stringify(entries),'fixture');
 }
 await h.r.r44DurableReady(h.env);
}
async function claim(h,worker='w',key='claim1'){return h.r.r44Claim(h.env,worker,key);}
function packet(c,n,outcome='PASS_NO_CHANGE') {return {ticketId:c.ticket.ticket_id,workerId:c.workerId,leaseToken:c.ticket.lease_token,leaseGeneration:c.ticket.leaseGeneration,idempotencyKey:'entry-'+n,
 entry:{code:c.ticket.entries[n-1].code,outcome,...(outcome==='CORRECTED'?{correctedContent:{text:'fixture correction'}}:{})}};}
async function checkpoint(h,c,n,outcome){return h.r.r44Checkpoint(h.env,packet(c,n,outcome));}
const plain=x=>JSON.parse(JSON.stringify(x));
for(const done of [1,3,4])test(`crash ${done}/5; new session rebind returns only remaining; restart persists`,async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'r44-')),file=path.join(dir,'db.sqlite');
 let h=harness(file);await seed(h);const c=await claim(h);
 for(let n=1;n<=done;n++)assert.equal((await checkpoint(h,c,n)).status,'AUDITED_DURABLE');
 h.close();h=harness(file);
 const rebound=await h.r.r44Rebind(h.env,{ticketId:'T1',workerId:'w',sessionId:'new-session'});
 assert.equal(rebound.status,'LEASE_REUSED');assert.equal(rebound.state,'PARTIAL_DURABLE');
 assert.deepEqual(plain(rebound.remaining),Array.from({length:5-done},(_,i)=>`MLS-V01-000${done+i+1}`));
 assert.equal(h.db.prepare('SELECT COUNT(*) n FROM r44_claims').get().n,1);
 h.close();fs.rmSync(dir,{recursive:true});
});
test('duplicate claim is durable and never claims new ticket after completion',async()=>{
 const h=harness();await seed(h,2);const c=await claim(h);
 const duplicate=await claim(h);assert.equal(duplicate.ticket.lease_token,c.ticket.lease_token);
 for(let n=1;n<=5;n++)await checkpoint(h,c,n);
 assert.equal((await claim(h)).status,'CLAIM_ALREADY_RESOLVED');
 assert.equal(h.db.prepare('SELECT COUNT(*) n FROM r44_claims').get().n,1);
 assert.notEqual((await claim(h,'w','explicit-next')).ticket.ticket_id,c.ticket.ticket_id);h.close();
});
test('rebind repeated never claims or renews; unknown worker has no binding',async()=>{
 const h=harness();await seed(h);const c=await claim(h);const before=h.db.prepare('SELECT * FROM r44_leases').get();
 for(let i=0;i<3;i++)assert.equal((await h.r.r44Rebind(h.env,{ticketId:'T1',workerId:'w'})).status,'LEASE_REUSED');
 assert.deepEqual(h.db.prepare('SELECT * FROM r44_leases').get(),before);
 assert.equal((await h.r.r44Rebind(h.env,{workerId:'unknown'})).status,'NO_BINDING');h.close();
});
test('timeout before and after commit reconciles correctly',async()=>{
 const h=harness();await seed(h);const c=await claim(h);
 h.fault('before');await assert.rejects(()=>checkpoint(h,c,1),/timeout before/);
 assert.equal((await h.r.r44Reconcile(h.env,'T1')).remaining.length,5);
 h.fault('after');const result=await checkpoint(h,c,1);assert.equal(result.status,'ALREADY_DURABLE');
 assert.equal((await h.r.r44Reconcile(h.env,'T1')).remaining.length,4);h.close();
});
for(const outcome of ['PASS_NO_CHANGE','CORRECTED'])test(`duplicate ${outcome}, receipt verification and conflict`,async()=>{
 const h=harness();await seed(h);const c=await claim(h),a=await checkpoint(h,c,1,outcome),b=await checkpoint(h,c,1,outcome);
 assert.equal(b.status,'ALREADY_DURABLE');assert.equal(b.receiptSha256,a.receiptSha256);
 assert.equal(await h.r.r44Sha256Text(h.r.r44Stable(a.receipt)),a.receiptSha256);
 const p=packet(c,1,outcome);p.entry.notes='different';assert.equal((await h.r.r44Checkpoint(h.env,p)).error,'RESULT_CONFLICT');
 assert.equal(h.db.prepare('SELECT COUNT(*) n FROM r44_receipts').get().n,1);
 assert.equal(h.db.prepare('SELECT COUNT(*) n FROM r44_preview_articles').get().n,outcome==='CORRECTED'?1:0);
 assert.throws(()=>h.db.exec("UPDATE r44_receipts SET outcome='CORRECTED'"),/IMMUTABLE/);h.close();
});
test('lease expiry and stale worker after reassignment fenced at commit',async()=>{
 const h=harness();await seed(h);const c=await claim(h);await checkpoint(h,c,1);
 h.setNow(1300001);assert.equal((await checkpoint(h,c,2)).error,'LEASE_INVALID_OR_EXPIRED');
 assert.equal((await h.r.r44Rebind(h.env,{workerId:'w',ticketId:'T1'})).status,'LEASE_LOST');
 const newer=await claim(h,'new','new-claim');assert.equal(newer.ticket.leaseGeneration,c.ticket.leaseGeneration+1);
 assert.equal((await checkpoint(h,c,2)).error,'LEASE_INVALID_OR_EXPIRED');
 assert.equal(await h.r.r44Renew(h.env,c.ticket.lease_token),null);
 assert.equal((await checkpoint(h,newer,2)).status,'AUDITED_DURABLE');h.close();
});
test('reassignment between preflight and commit cannot write receipt or preview',async()=>{
 const h=harness();await seed(h);const c=await claim(h);
 h.race(async()=>{h.setNow(1300001);await claim(h,'other','new');});
 assert.equal((await checkpoint(h,c,1,'CORRECTED')).error,'LEASE_INVALID_OR_EXPIRED');
 assert.equal(h.db.prepare('SELECT COUNT(*) n FROM r44_receipts').get().n,0);assert.equal(h.db.prepare('SELECT COUNT(*) n FROM r44_preview_articles').get().n,0);h.close();
});
test('two workers same ticket and simultaneous same worker claims',async()=>{
 const h=harness();await seed(h);
 const claims=await Promise.all([claim(h,'a','a'),claim(h,'b','b')]);
 assert.equal(claims.filter(c=>c.status==='CLAIMED').length,1);assert.equal(claims.filter(c=>c.status==='NO_WORK').length,1);h.close();
 const j=harness();await seed(j,2);const both=await Promise.all([claim(j,'w','a'),claim(j,'w','b')]);
 assert.equal(both[0].ticket.ticket_id,both[1].ticket.ticket_id);assert.equal(both[0].ticket.lease_token,both[1].ticket.lease_token);j.close();
});
test('auto finalize and backwards compatible submit/export',async()=>{
 const h=harness();await seed(h);const c=await claim(h);await checkpoint(h,c,1);
 const payload={entries:c.ticket.entries.map(e=>({code:e.code,outcome:'PASS_NO_CHANGE'}))};
 const submit=()=>h.r.r44Submit(new Request('https://fixture/api/r44/submit',{method:'POST',body:JSON.stringify({leaseToken:c.ticket.lease_token,payload})}),h.env);
 const first=await (await submit()).json();assert.equal(first.state,'COMPLETE');assert.equal(first.receipts.length,5);
 assert.equal((await (await submit()).json()).status,'RESULT_ALREADY_SUBMITTED');
 const state=await h.r.r44Reconcile(h.env,'T1');assert.equal(state.state,'COMPLETE');assert.equal(state.remaining.length,0);
 const exported=await h.r.r44Export(h.env,50);assert.equal(JSON.parse(exported[0].payload).entries.length,5);assert.equal(await h.r.r44Sha256Text(exported[0].payload),exported[0].sha256);h.close();
});
test('transaction rolls back if downstream preview write fails',async()=>{
 const h=harness();await seed(h);const c=await claim(h);
 h.db.exec("CREATE TRIGGER fail_preview BEFORE INSERT ON r44_preview_articles BEGIN SELECT RAISE(ABORT,'disk failure'); END");
 await assert.rejects(()=>checkpoint(h,c,1,'CORRECTED'),/disk failure/);
 assert.equal(h.db.prepare('SELECT COUNT(*) n FROM r44_receipts').get().n,0);assert.equal((await h.r.r44Reconcile(h.env,'T1')).remaining.length,5);h.close();
});
test('idempotency key collision, wrong generation, wrong scope rejected',async()=>{
 const h=harness();await seed(h);const c=await claim(h);await checkpoint(h,c,1);
 let p=packet(c,2);p.idempotencyKey='entry-1';assert.equal((await h.r.r44Checkpoint(h.env,p)).error,'RESULT_CONFLICT');
 p=packet(c,2);p.leaseGeneration++;assert.equal((await h.r.r44Checkpoint(h.env,p)).error,'LEASE_INVALID_OR_EXPIRED');
 p=packet(c,2);p.entry.code='OUTSIDE';assert.equal((await h.r.r44Checkpoint(h.env,p)).error,'RESULT_SCOPE_MISMATCH');h.close();
});
function storage(){const values=new Map();return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)}}
for(const failure of ['SESSION_NOT_FOUND','TooManyActiveSessions','timeout','5xx','workflow interruption'])test(`client recovery: ${failure}, persisted outbox, no new claim`,async()=>{
 const h=harness();await seed(h);const store=storage(),calls=[],delays=[];let broken=false;
 const fetch=async(url,init)=>{calls.push(url);if(broken&&url==='/api/r44/checkpoint')throw Error(failure);const req=new Request('https://fixture'+url,init);return h.r.handleR44(req,h.env,new URL(req.url));};
 let client=new R44Client({storage:store,fetch,sleep:async ms=>delays.push(ms),random:()=>0});await client.claim();
 broken=true;await assert.rejects(()=>client.checkpoint({code:'MLS-V01-0001',outcome:'PASS_NO_CHANGE'}));
 assert(client.state.outbox);assert.equal(delays.length,4);assert(delays.every(n=>n>0));
 client=new R44Client({storage:store,fetch,sleep:async()=>{}});broken=false;await client.recover();await client.flush();
 assert.equal(calls.filter(c=>c.startsWith('/api/r44/claim')).length,1);assert.equal((await h.r.r44Reconcile(h.env,'T1')).remaining.length,4);h.close();
});
test('client timeout after successful commit verifies receipt on reconcile',async()=>{
 const h=harness();await seed(h);const store=storage();let drop=false;
 const fetch=async(url,init)=>{const req=new Request('https://fixture'+url,init);const result=await h.r.handleR44(req,h.env,new URL(req.url));if(drop&&url==='/api/r44/checkpoint')throw Error('timeout');return result;};
 const client=new R44Client({storage:store,fetch,sleep:async()=>{}});await client.claim();drop=true;
 const saved=await client.checkpoint({code:'MLS-V01-0001',outcome:'PASS_NO_CHANGE'});assert.equal(saved.status,'ALREADY_DURABLE');assert(!client.state.outbox);h.close();
});
test('injector upgrades previously injected runtime idempotently',()=>{
 const fixture='const index_default={async fetch(request,env,_ctx){\n    const url = new URL(request.url);\n}};';
 const once=injectR44(fixture);assert.equal(injectR44(once),once);assert.equal((once.match(/async function r44Checkpoint/g)||[]).length,1);
});
test('lease can expire during commit without reassignment',async()=>{
 const h=harness();await seed(h);const c=await claim(h);h.race(()=>h.setNow(1300001));
 assert.equal((await checkpoint(h,c,1)).error,'LEASE_INVALID_OR_EXPIRED');assert.equal((await h.r.r44Reconcile(h.env,'T1')).remaining.length,5);h.close();
});
test('fenced entry state transitions and quarantine cannot modify durable entry',async()=>{
 const h=harness();await seed(h);const c=await claim(h);const p=packet(c,1);
 for(const state of ['IN_PROGRESS','FAILED_RETRYABLE','PENDING'])assert.equal((await h.r.r44EntryState(h.env,{...p,code:p.entry.code,state})).state,state);
 await checkpoint(h,c,1);assert.equal((await h.r.r44EntryState(h.env,{...p,code:p.entry.code,state:'PENDING'})).http,409);
 const q=packet(c,2);await h.r.r44EntryState(h.env,{...q,code:q.entry.code,state:'QUARANTINED'});
 assert.equal((await h.r.r44Reconcile(h.env,'T1')).state,'QUARANTINED');assert.equal((await checkpoint(h,c,3)).http,409);h.close();
});
test('legacy quarantined structured result reconciles into immutable entry receipts',async()=>{
 const h=harness();await seed(h);const entries=JSON.parse(h.db.prepare("SELECT entries_json FROM r44_tickets WHERE ticket_id='T1'").get().entries_json);
 const payload=JSON.stringify({entries:entries.map(e=>({code:e.code,outcome:'PASS_NO_CHANGE'}))});
 const sha=await h.r.r44Sha256Text(payload);
 h.db.exec("UPDATE r44_ticket_progress SET state='QUARANTINED',migration_note='LEGACY_TICKET_RECEIPT_REQUIRES_ENTRY_RECONCILIATION' WHERE ticket_id='T1'; UPDATE r44_entries SET state='QUARANTINED' WHERE ticket_id='T1'; UPDATE r44_tickets SET state='quarantined' WHERE ticket_id='T1'");
 h.db.prepare("INSERT INTO r44_results(ticket_id,worker_id,stage,editorial_status,payload,sha256,source,created_at) VALUES(?,?,?,?,?,?,?,?)").run('T1','legacy-worker','audited','PENDING_CANONICAL_R33_VALIDATION',payload,sha,'legacy','fixture');
 const result=await h.r.r44LegacyQuarantineReconcile(h.env,5);
 assert.equal(result.reconciled,1);assert.equal(result.requeued,0);assert.equal(result.remainingLegacy,0);
 const state=await h.r.r44Reconcile(h.env,'T1');assert.equal(state.state,'COMPLETE');assert.equal(state.migrationNote,null);assert.equal(state.remaining.length,0);
 assert.equal(h.db.prepare("SELECT COUNT(*) n FROM r44_receipts WHERE ticket_id='T1'").get().n,5);
 assert.equal(h.db.prepare("SELECT COUNT(*) n FROM r44_events WHERE ticket_id='T1' AND event_type='LEGACY_QUARANTINE_RECONCILED'").get().n,1);h.close();
});

test('legacy quarantine admin route is wired and authenticated',async()=>{
 const h=harness();await seed(h);h.env.MLS_EDITORIAL_CHAT_KEY='k'.repeat(40);
 const req=new Request('https://fixture/api/r44/admin/reconcile-legacy-quarantine',{method:'POST',headers:{authorization:'Bearer '+'k'.repeat(40),'content-type':'application/json'},body:JSON.stringify({limit:1})});
 const res=await h.r.r44DurableRoute(req,h.env,new URL(req.url));assert(res);assert.equal(res.status,200);
 const body=await res.json();assert.equal(body.status,'LEGACY_QUARANTINE_RECONCILE');h.close();
});

test('legacy unstructured sentinel is requeued for fresh R44 instead of fabricating receipts',async()=>{
 const h=harness();await seed(h);const payload=JSON.stringify({resultMarkdown:'legacy sentinel',imported:true});const sha=await h.r.r44Sha256Text(payload);
 h.db.exec("UPDATE r44_ticket_progress SET state='QUARANTINED',migration_note='LEGACY_TICKET_RECEIPT_REQUIRES_ENTRY_RECONCILIATION' WHERE ticket_id='T1'; UPDATE r44_entries SET state='QUARANTINED' WHERE ticket_id='T1'; UPDATE r44_tickets SET state='quarantined' WHERE ticket_id='T1'");
 h.db.prepare("INSERT INTO r44_results(ticket_id,worker_id,stage,editorial_status,payload,sha256,source,created_at) VALUES(?,?,?,?,?,?,?,?)").run('T1','legacy-worker','audited','PENDING_CANONICAL_R33_VALIDATION',payload,sha,'legacy','fixture');
 const result=await h.r.r44LegacyQuarantineReconcile(h.env,5);
 assert.equal(result.reconciled,0);assert.equal(result.requeued,1);assert.equal(result.remainingLegacy,0);
 assert.equal(h.db.prepare("SELECT state FROM r44_ticket_progress WHERE ticket_id='T1'").get().state,'CLAIMABLE');
 assert.equal(h.db.prepare("SELECT COUNT(*) n FROM r44_receipts WHERE ticket_id='T1'").get().n,0);
 assert.equal(h.db.prepare("SELECT COUNT(*) n FROM r44_results WHERE ticket_id='T1'").get().n,0);
 assert.equal((await claim(h,'fresh-worker','fresh-claim')).status,'CLAIMED');h.close();
});

test('legacy migration preserves rows and active lease; no fabricated entry receipts',async()=>{
 const h=harness();await seed(h,3);
 // Recreate pre-migration fixture using a fresh database with legacy tables only.
 const j=harness();await j.r.r44EnsureSchema(j.env);
 for(const table of ['r44_meta','r44_tickets']){const rows=h.db.prepare('SELECT * FROM '+table).all();for(const row of rows){if(row.key==='durable_entry_schema')continue;j.db.prepare('INSERT INTO '+table+'('+Object.keys(row).join(',')+') VALUES('+Object.keys(row).map(()=>'?').join(',')+')').run(...Object.values(row));}}
 j.db.exec("UPDATE r44_tickets SET state='leased',worker_id='legacy',lease_token='old-token',lease_expires_at=1300000 WHERE ticket_id='T1';UPDATE r44_tickets SET state='audited',result_sha256='old-sha' WHERE ticket_id='T2';UPDATE r44_tickets SET state='verified' WHERE ticket_id='T3'");
 const before=JSON.stringify(j.db.prepare('SELECT * FROM r44_tickets').all());await j.r.r44DurableReady(j.env);
 assert.equal(JSON.stringify(j.db.prepare('SELECT * FROM r44_tickets').all()),before);
 assert.equal((await j.r.r44Rebind(j.env,{workerId:'legacy',ticketId:'T1'})).status,'LEASE_REUSED');
 assert.equal((await j.r.r44Reconcile(j.env,'T2')).migrationNote,'LEGACY_TICKET_RECEIPT_REQUIRES_ENTRY_RECONCILIATION');
 assert.equal(j.db.prepare('SELECT COUNT(*) n FROM r44_receipts').get().n,0);
 await j.r.r44DurableReady(j.env);assert.equal(JSON.stringify(j.db.prepare('SELECT * FROM r44_tickets').all()),before);h.close();j.close();
});
test('legacy envelope metadata and full payload conflicts retained',async()=>{
 const h=harness();await seed(h);const c=await claim(h);const body={leaseToken:c.ticket.lease_token,payload:{entries:c.ticket.entries.map(e=>({code:e.code})),summary:'retain this metadata'}};
 const submit=()=>h.r.r44Submit(new Request('https://fixture',{method:'POST',body:JSON.stringify(body)}),h.env);
 const first=await(await submit()).json();const row=(await h.r.r44Export(h.env,1))[0];assert.equal(row.sha256,first.sha256);assert.equal(JSON.parse(row.payload).summary,'retain this metadata');
 body.payload.summary='changed';assert.equal((await submit()).status,409);h.close();
});
test('simultaneous identical checkpoints produce one receipt and one event',async()=>{
 const h=harness();await seed(h);const c=await claim(h);
 const results=await Promise.all([checkpoint(h,c,1),checkpoint(h,c,1)]);
 assert(results.every(r=>['AUDITED_DURABLE','ALREADY_DURABLE'].includes(r.status)));assert.equal(results[0].receiptSha256,results[1].receiptSha256);
 assert.equal(h.db.prepare("SELECT COUNT(*) n FROM r44_events WHERE event_type='ENTRY_CHECKPOINT'").get().n,1);h.close();
});
test('capacity ceiling holds at 128 live leases',async()=>{
 const h=harness();await seed(h,129);for(let i=0;i<128;i++)assert.equal((await claim(h,'worker-'+i,'claim')).status,'CLAIMED');
 assert.equal((await claim(h,'overflow','claim')).status,'CAPACITY_BUSY');h.close();
});
test('HTTP 429 honors Retry-After, HTTP 503 retries identical request',async()=>{
 const waits=[],bodies=[];let count=0;
 const client=new R44Client({storage:storage(),sleep:async ms=>waits.push(ms),fetch:async(_url,init)=>{bodies.push(init.body);count++;return count<3?Response.json({error:'retry'},{status:count===1?429:503,headers:{'retry-after':'2'}}):Response.json({status:'ok'})}});
 assert.equal((await client.request('/api/r44/rebind',{ticketId:'T1'})).status,'ok');assert.deepEqual(waits,[2000,2000]);assert.equal(new Set(bodies).size,1);
});
test('HTTP conflict is not retried and unconfirmed claim recovers without new key',async()=>{
 let calls=0;const store=storage();const client=new R44Client({storage:store,sleep:async()=>{},fetch:async()=>{calls++;return Response.json({error:'RESULT_CONFLICT'},{status:409})}});
 await assert.rejects(()=>client.request('/api/r44/checkpoint',{}),/RESULT_CONFLICT/);assert.equal(calls,1);
 assert.equal((await client.recover()).status,'EXECUTION_UNCONFIRMED');assert.equal(calls,1);
});
test('receipt tampering never confirms durable progress',async()=>{
 const h=harness();await seed(h);const c=await claim(h),receipt=await checkpoint(h,c,1);
 const client=new R44Client({storage:storage()});client.state.ticketId='T1';receipt.receipt.outcome='CORRECTED';await assert.rejects(()=>client.verify(receipt),/RECEIPT_HASH_MISMATCH/);h.close();
});
test('page script parses and complete ticket confirmation remains visible',()=>{
 const h=harness();const html=h.r.r44WorkerPage();const source=html.split('<script>')[1].split('</script>')[0];assert.doesNotThrow(()=>new vm.Script(source));h.close();
});
test('authenticated bridge session loss rebinds checkpoint 1-3 without claim and hides token',async()=>{
 const h=harness();await seed(h);const c=await claim(h);h.env.MLS_EDITORIAL_CHAT_KEY='fixture-only-secret-not-a-real-token-123456';
 for(let i=1;i<=3;i++)await checkpoint(h,c,i);
 const request=body=>new Request('https://fixture/api/r44/chat-bridge/rebind',{method:'POST',headers:{authorization:'Bearer '+h.env.MLS_EDITORIAL_CHAT_KEY,'content-type':'application/json'},body:JSON.stringify(body)});
 const body={ticketId:'T1',workerId:'w'};
 const denied=await h.r.r44BridgeRecover(new Request('https://fixture',{method:'POST',body:JSON.stringify(body)}),h.env);assert.equal(denied.status,401);
 const first=await(await h.r.r44BridgeRecover(request(body),h.env)).json();assert.deepEqual(first.remaining,['MLS-V01-0004','MLS-V01-0005']);assert(!JSON.stringify(first).includes(c.ticket.lease_token));
 await h.env.WIKI_DB.prepare('DELETE FROM r44_chat_bridge_sessions').run();
 const second=await(await h.r.r44BridgeRecover(request(body),h.env)).json();assert.notEqual(second.bridgeSessionId,first.bridgeSessionId);
 assert.equal(h.db.prepare('SELECT COUNT(*) n FROM r44_claims').get().n,1);
 const cp={...packet(c,4),bridgeSessionId:second.bridgeSessionId};delete cp.leaseToken;
 assert.equal((await(await h.r.r44BridgeCheckpoint(request(cp),h.env)).json()).status,'AUDITED_DURABLE');h.close();
});
test('MCP lists per-entry checkpoint, rebind and authoritative reconciliation',()=>{
 const h=harness();for(const name of ['r44_checkpoint','r44_rebind','r44_reconcile'])assert(h.r.R44_MCP_TOOLS.some(t=>t.name===name));h.close();
});


test('Fast Lane completes multiple tickets sequentially with fresh claims and no prefetch',async()=>{
 const h=harness();await seed(h,4);const store=storage(),calls=[];
 const fetch=async(url,init)=>{calls.push(url);const req=new Request('https://fixture'+url,init);return h.r.handleR44(req,h.env,new URL(req.url));};
 const client=new R44Client({storage:store,fetch,sleep:async()=>{}});
 const seen=[];
 const result=await client.fastLane({maxTickets:3,processTicket:async({client,ticketId,remaining})=>{
  seen.push(ticketId);
  for(const code of remaining)await client.checkpoint({code,outcome:'PASS_NO_CHANGE'});
 }});
 assert.equal(result.count,3);assert.equal(result.reason,'LIMIT_REACHED');
 assert.equal(new Set(seen).size,3);assert.equal(calls.filter(x=>x.startsWith('/api/r44/claim')).length,3);
 assert.equal(h.db.prepare("SELECT COUNT(*) n FROM r44_ticket_progress WHERE state='COMPLETE'").get().n,3);
 assert.equal(h.db.prepare("SELECT COUNT(*) n FROM r44_ticket_progress WHERE state='CLAIMABLE'").get().n,1);
 h.close();
});

test('Fast Lane caller stop does not prefetch another ticket',async()=>{
 const h=harness();await seed(h,3);const calls=[];
 const fetch=async(url,init)=>{calls.push(url);const req=new Request('https://fixture'+url,init);return h.r.handleR44(req,h.env,new URL(req.url));};
 const client=new R44Client({storage:storage(),fetch,sleep:async()=>{}});
 const result=await client.fastLane({maxTickets:10,processTicket:async({client,remaining})=>{
  for(const code of remaining)await client.checkpoint({code,outcome:'PASS_NO_CHANGE'});
 },shouldContinue:async()=>false});
 assert.equal(result.count,1);assert.equal(result.reason,'CALLER_STOP');
 assert.equal(calls.filter(x=>x.startsWith('/api/r44/claim')).length,1);
 assert.equal(h.db.prepare("SELECT COUNT(*) n FROM r44_ticket_progress WHERE state='LEASED' OR state='PARTIAL_DURABLE'").get().n,0);
 h.close();
});

test('Fast Lane resumes partial durable ticket without claiming unrelated work',async()=>{
 const h=harness();await seed(h,2);const store=storage(),calls=[];
 const fetch=async(url,init)=>{calls.push(url);const req=new Request('https://fixture'+url,init);return h.r.handleR44(req,h.env,new URL(req.url));};
 let client=new R44Client({storage:store,fetch,sleep:async()=>{}});
 const first=await client.claim();for(const code of first.ticket.entries.slice(0,3).map(e=>e.code))await client.checkpoint({code,outcome:'PASS_NO_CHANGE'});
 client=new R44Client({storage:store,fetch,sleep:async()=>{}});
 const result=await client.fastLane({maxTickets:1,processTicket:async({client,remaining})=>{
  assert.equal(remaining.length,2);for(const code of remaining)await client.checkpoint({code,outcome:'PASS_NO_CHANGE'});
 }});
 assert.equal(result.count,1);assert.equal(calls.filter(x=>x.startsWith('/api/r44/claim')).length,1);
 assert.equal((await h.r.r44Reconcile(h.env,first.ticket.ticket_id)).state,'COMPLETE');
 h.close();
});

test('Fast Lane stops fail-closed when processor leaves current ticket incomplete',async()=>{
 const h=harness();await seed(h,2);const calls=[];
 const fetch=async(url,init)=>{calls.push(url);const req=new Request('https://fixture'+url,init);return h.r.handleR44(req,h.env,new URL(req.url));};
 const client=new R44Client({storage:storage(),fetch,sleep:async()=>{}});
 const result=await client.fastLane({maxTickets:2,processTicket:async({client,remaining})=>{
  await client.checkpoint({code:remaining[0],outcome:'PASS_NO_CHANGE'});
 }});
 assert.equal(result.status,'FAST_LANE_STOPPED');assert.equal(result.reason,'PARTIAL_DURABLE');assert.equal(result.count,0);
 assert.equal(calls.filter(x=>x.startsWith('/api/r44/claim')).length,1);
 assert.equal(h.db.prepare("SELECT COUNT(*) n FROM r44_ticket_progress WHERE state='PARTIAL_DURABLE'").get().n,1);
 h.close();
});

for(const workers of [5,15,30,60,100])test(`Fast Lane concurrency gate ${workers}: distinct tickets and durable completion`,async()=>{
 const h=harness();await seed(h,workers);const ticketIds=[];
 const clients=Array.from({length:workers},()=>{
  const fetch=async(url,init)=>{const req=new Request('https://fixture'+url,init);return h.r.handleR44(req,h.env,new URL(req.url));};
  return new R44Client({storage:storage(),fetch,sleep:async()=>{}});
 });
 const results=await Promise.all(clients.map(client=>client.fastLane({maxTickets:1,processTicket:async({client,ticketId,remaining})=>{
  ticketIds.push(ticketId);for(const code of remaining)await client.checkpoint({code,outcome:'PASS_NO_CHANGE'});
 }})));
 assert(results.every(r=>r.count===1));assert.equal(new Set(ticketIds).size,workers);
 assert.equal(h.db.prepare("SELECT COUNT(*) n FROM r44_ticket_progress WHERE state='COMPLETE'").get().n,workers);
 assert.equal(h.db.prepare("SELECT COUNT(*) n FROM r44_receipts").get().n,workers*5);
 h.close();
});


test('R44 export pagination advances by ordinal without repeating completed tickets',async()=>{
 const h=harness();await seed(h,3);
 for(let t=1;t<=3;t++){
  const claimed=await claim(h,'page-worker-'+t,'page-claim-'+t);
  for(let n=1;n<=5;n++)await checkpoint(h,claimed,n);
 }
 const first=await h.r.r44Export(h.env,2,0);
 assert.deepEqual(first.map(x=>x.ticket_id),['T1','T2']);
 const after=Number(first.at(-1).ordinal_end);
 const second=await h.r.r44Export(h.env,2,after);
 assert.deepEqual(second.map(x=>x.ticket_id),['T3']);
 assert.equal(new Set([...first,...second].map(x=>x.ticket_id)).size,3);
 h.close();
});
