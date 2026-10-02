const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const {Miniflare}=require('miniflare');
const {RUNTIME}=require('../../scripts/habilitar r44 cloudflare.js');

test('D1 engine: migration, checkpoint 1-3, new runtime rebind, stale generation and rollback',async()=>{
 const mf=new Miniflare({workers:[{name:'r44-fixture',modules:true,script:'export default {fetch(){return new Response("fixture")}}',d1Databases:['WIKI_DB'],compatibilityDate:'2026-09-08'}]});
 try {
  const env={WIKI_DB:await mf.getD1Database('WIKI_DB','r44-fixture')};
  const runtime=()=>{const r=vm.createContext({crypto,TextEncoder,Response,Request,Date,Map,Set,JSON,fetch});vm.runInContext(RUNTIME,r);return r;};
  let r=runtime();await r.r44EnsureSchema(env);
  await env.WIKI_DB.prepare("INSERT INTO r44_meta VALUES('pool_schema','MLS-R44-CLOUDFLARE-POOL-2'),('pool_ticket_count','1'),('pool_ticket_size','5')").run();
  const entries=Array.from({length:5},(_,i)=>({code:'FIXTURE-'+(i+1),path:'fixture',sha256:'source-'+i}));
  await env.WIKI_DB.prepare("INSERT INTO r44_tickets(ticket_id,ordinal_start,ordinal_end,entries_json,updated_at) VALUES('FIXTURE',1,5,?,'fixture')").bind(JSON.stringify(entries)).run();
  const claim=await r.r44Claim(env,'fixture-worker','fixture-claim');
  const packet=n=>({ticketId:'FIXTURE',workerId:'fixture-worker',leaseToken:claim.ticket.lease_token,leaseGeneration:claim.ticket.leaseGeneration,idempotencyKey:'entry-'+n,entry:{code:'FIXTURE-'+n,outcome:'PASS_NO_CHANGE'}});
  for(let n=1;n<=3;n++)assert.equal((await r.r44Checkpoint(env,packet(n))).status,'AUDITED_DURABLE');
  r=runtime();const state=await r.r44Rebind(env,{ticketId:'FIXTURE',workerId:'fixture-worker'});
  assert.deepEqual(JSON.parse(JSON.stringify(state.remaining)),['FIXTURE-4','FIXTURE-5']);
  assert.equal((await r.r44Checkpoint(env,packet(3))).status,'ALREADY_DURABLE');
  await env.WIKI_DB.prepare('UPDATE r44_leases SET expires_ms=0 WHERE ticket_id=?').bind('FIXTURE').run();
  const newer=await r.r44Claim(env,'new-worker','new-claim');
  assert.equal(newer.ticket.leaseGeneration,2);
  assert.equal((await r.r44Checkpoint(env,packet(4))).error,'LEASE_INVALID_OR_EXPIRED');
  await env.WIKI_DB.prepare("CREATE TRIGGER fail_fixture BEFORE INSERT ON r44_preview_articles BEGIN SELECT RAISE(ABORT,'fixture rollback'); END").run();
  const last={...packet(4),workerId:'new-worker',leaseToken:newer.ticket.lease_token,leaseGeneration:2,entry:{code:'FIXTURE-4',outcome:'CORRECTED',correctedContent:{fixture:true}}};
  await assert.rejects(()=>r.r44Checkpoint(env,last),/fixture rollback/);
  assert.equal((await env.WIKI_DB.prepare('SELECT COUNT(*) n FROM r44_receipts').first()).n,3);
 } finally {await mf.dispose();}
});
