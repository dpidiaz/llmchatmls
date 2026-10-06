const test=require('node:test');
const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const vm=require('node:vm');
const fs=require('node:fs');
const {RUNTIME}=require('../scripts/habilitar r44 cloudflare.js');
const {validate,POOL_PATH}=require('../scripts/r44 full pending corpus.cjs');
const pool=JSON.parse(fs.readFileSync(POOL_PATH));
function harness() {
  const db=new DatabaseSync(':memory:');
  let queries=0, writes=0, failAt=Infinity;
  const env={WIKI_DB:{prepare(sql){
    assert(Buffer.byteLength(sql)<100000);
    let params=[];
    const run=(all)=>{
      queries++;
      if(sql.startsWith('INSERT OR IGNORE INTO r44_tickets') && ++writes===failAt) throw Error('INTERRUPTED');
      const stmt=db.prepare(sql);
      return all?stmt.all(...params):stmt.run(...params);
    };
    return {bind(...p){assert(p.length<=100);params=p;return this},async run(){return run(false)},async all(){return {results:run(true)}},async first(){return run(true)[0]||null}};
  },async batch(statements){db.exec('BEGIN');try{const out=[];for(const s of statements)out.push(await s.run());db.exec('COMMIT');return out}catch(e){db.exec('ROLLBACK');throw e}}}};
  env.ASSETS={fetch:async()=>new Response(fs.readFileSync(POOL_PATH))};
  const context=vm.createContext({crypto:globalThis.crypto,TextEncoder,Response,Request,Date,Map,Set,JSON,fetch:async()=>{throw Error('GitHub must not be used')}});
  vm.runInContext(RUNTIME,context);
  return {db,env,r:context,reset(){queries=0},get queries(){return queries},interrupt(n){failAt=writes+n}};
}
async function seed(h){for(let i=0;i<5;i++){h.reset();try{await h.r.r44PoolSeed(h.env);assert(h.queries<=50);return}catch(e){assert(h.queries<=50);if(e.message!=='R44_POOL_MIGRATION_IN_PROGRESS')throw e}}throw Error('Not seeded')}
function snapshot(db,table){return JSON.stringify(db.prepare(`SELECT * FROM ${table} ORDER BY 1`).all())}
test('frozen derivation, exact legacy preservation and complete pending universe',()=>{
  assert.deepEqual(validate(),pool);
  assert.equal(pool.tickets[292].initialState,'audited');
  assert.equal(pool.imports[0].ticketId,'R43-EMERGENCY-0293');
  assert.equal(pool.tickets[1680].ordinalStart,8401);
  assert.equal(pool.tickets[1680].ordinalEnd,8405);
  assert.equal(pool.tickets[1681].ordinalStart,8406);
  assert.equal(pool.tickets[1681].ordinalEnd,8408);
  assert.equal(pool.tickets[1681].entries.length,3);
  assert(pool.tickets.slice(800).every(t=>!('sourceBucket' in t)&&t.initialState==='queued'));
});
test('POOL-2 resumes interrupted seed, preserves all existing rows and is idempotent',async()=>{
  const h=harness();await h.r.r44EnsureSchema(h.env);
  const insert=h.db.prepare('INSERT INTO r44_tickets(ticket_id,ordinal_start,ordinal_end,entries_json,state,updated_at) VALUES(?,?,?,?,?,?)');
  for(const t of pool.tickets.slice(0,800))insert.run(t.id,t.ordinalStart,t.ordinalEnd,JSON.stringify(t.entries),t.initialState,'original');
  h.db.exec("INSERT INTO r44_meta VALUES('pool_schema','MLS-R44-CLOUDFLARE-POOL-1'); UPDATE r44_tickets SET state='leased',worker_id='live',lease_token='live',lease_expires_at=9999999999999,attempts=4 WHERE ticket_id='R43-EMERGENCY-0001'; UPDATE r44_tickets SET state='leased',lease_token='expired',lease_expires_at=1 WHERE ticket_id='R43-EMERGENCY-0002'; UPDATE r44_tickets SET state='verified' WHERE ticket_id='R43-EMERGENCY-0003'; UPDATE r44_tickets SET state='quarantined' WHERE ticket_id='R43-EMERGENCY-0004'; UPDATE r44_tickets SET state='audited',result_sha256='newer-audit' WHERE ticket_id='R43-EMERGENCY-0005'; UPDATE r44_tickets SET result_sha256='preserve-imported',result_stage='audited' WHERE ticket_id='R43-EMERGENCY-0293'; INSERT INTO r44_results(ticket_id,stage,editorial_status,payload,sha256,created_at) VALUES('R43-EMERGENCY-0293','audited','PENDING','original','preserve-imported','original'); INSERT INTO r44_entry_cache VALUES('keep','sha','{}','original'); INSERT INTO r44_preview_articles VALUES('keep','ticket','{}','sha','original'); INSERT INTO r44_events(event_type,created_at) VALUES('keep','original');");
  const oldTickets=snapshot(h.db,'r44_tickets');
  const tables=['r44_results','r44_entry_cache','r44_preview_articles','r44_events'];
  const before=tables.map(t=>snapshot(h.db,t));
  h.interrupt(3);await assert.rejects(()=>h.r.r44PoolSeed(h.env),/INTERRUPTED/);
  assert.equal(h.db.prepare("SELECT value FROM r44_meta WHERE key='pool_schema'").get().value,'MLS-R44-CLOUDFLARE-POOL-1');
  await seed(h);
  assert.equal(JSON.stringify(h.db.prepare('SELECT * FROM r44_tickets WHERE ordinal_start<=4000 ORDER BY 1').all()),oldTickets);
  assert.deepEqual(tables.map(t=>snapshot(h.db,t)),before);
  assert.equal(h.db.prepare('SELECT count(*) n FROM r44_tickets').get().n,1682);
  assert.equal(h.db.prepare("SELECT count(DISTINCT json_extract(j.value,'$.code')) n FROM r44_tickets,json_each(entries_json) j").get().n,8408);
  const after=snapshot(h.db,'r44_tickets'),meta=snapshot(h.db,'r44_meta');
  await seed(h);assert.equal(snapshot(h.db,'r44_tickets'),after);assert.equal(snapshot(h.db,'r44_meta'),meta);
  assert.deepEqual(tables.map(t=>snapshot(h.db,t)),before);
});
test('incorrect existing scope prevents POOL-2 completion without resetting data',async()=>{
  const h=harness();await h.r.r44EnsureSchema(h.env);
  h.db.exec("INSERT INTO r44_tickets(ticket_id,ordinal_start,ordinal_end,entries_json,state,updated_at) VALUES('unexpected',1,5,'[]','audited','keep')");
  await assert.rejects(()=>h.r.r44PoolSeed(h.env),/SCOPE_MISMATCH/);
  assert.equal(h.db.prepare('SELECT state FROM r44_tickets').get().state,'audited');
  assert.equal(h.db.prepare("SELECT value FROM r44_meta WHERE key='pool_schema'").get(),undefined);
});
test('new and final tickets claimable; exact three-entry submit durable and idempotent',async()=>{
  const h=harness();await seed(h);
  assert.equal(h.db.prepare("SELECT state FROM r44_tickets WHERE ticket_id='R43-EMERGENCY-0293'").get().state,'audited');
  const starts=new Set();
  let finalWorker,firstWorker;
  for(let i=0;i<30000;i++) {
    const worker=`worker-${i}`,start=h.r.r44WorkerShard(worker,pool.ticketCount,pool.ticketSize);
    starts.add(start);if(start===8406)finalWorker=worker;if(start===4001)firstWorker=worker;
  }
  assert.equal(starts.size,pool.ticketCount);assert.equal(Math.min(...starts),1);assert.equal(Math.max(...starts),8406);
  const first=await h.r.r44Claim(h.env,firstWorker);assert.equal(first.ticket.ticket_id,'R44-CORPUS-0801');
  const claim=await h.r.r44Claim(h.env,finalWorker);assert.equal(claim.ticket.ticket_id,'R44-CORPUS-1682');
  const reused=await h.r.r44Claim(h.env,finalWorker);assert.equal(reused.status,'LEASE_REUSED');
  const token=claim.ticket.lease_token,entries=pool.tickets.at(-1).entries.map(e=>({code:e.code}));
  const submit=async(items)=>h.r.r44Submit(new Request('https://test/api/r44/submit',{method:'POST',body:JSON.stringify({leaseToken:token,payload:{entries:items}})}),h.env);
  assert.equal((await submit(entries.slice(0,2))).status,400);
  assert.equal((await submit([...entries,{code:'extra'}])).status,400);
  assert.equal((await submit([entries[0],entries[0],entries[2]])).status,400);
  assert.equal((await submit(entries)).status,200);
  assert.equal((await (await submit(entries)).json()).status,'RESULT_ALREADY_SUBMITTED');
  const normal=pool.tickets[800].entries.map(e=>({code:e.code}));
  const normalResult=await h.r.r44Submit(new Request('https://test/api/r44/submit',{method:'POST',body:JSON.stringify({leaseToken:first.ticket.lease_token,payload:{entries:normal}})}),h.env);
  assert.equal(normalResult.status,200);
  assert.equal(h.db.prepare("SELECT count(*) n FROM r44_preview_articles WHERE ticket_id='R44-CORPUS-1682'").get().n,0);
  assert.equal(h.db.prepare("SELECT count(*) n FROM r44_receipts WHERE ticket_id='R44-CORPUS-1682'").get().n,3);
  assert.equal((await h.r.r44Claim(h.env,finalWorker)).status,'CLAIM_ALREADY_RESOLVED');
  const wrapped=await h.r.r44Claim(h.env,finalWorker,'explicit-next');assert.equal(wrapped.ticket.entries[0].code,pool.tickets[0].entries[0].code);
  const status=await h.r.r44Status(h.env);assert.equal(status.leaseTtlSeconds,300);assert.equal(status.maxActiveLeases,128);assert.equal(status.globalProductionMutex,false);assert.equal(status.githubHotPathWrites,false);assert.equal(status.productionMode,'PARALLEL_HOT_PATH');
});
