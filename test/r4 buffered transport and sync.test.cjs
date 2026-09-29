'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const core=require('../MLS R32 EDITORIAL/r4 buffered core.cjs');
const transport=require('../MLS R32 EDITORIAL/r4 buffered transport.cjs');
const sync=require('../MLS R32 EDITORIAL/r4 buffered sync.cjs');
const allocation=require('../MLS R32 EDITORIAL/r4 buffered allocation.cjs');
const verifier=require('../MLS R32 EDITORIAL/r4 buffered verify.cjs');
const finalize=require('../MLS R32 EDITORIAL/r4 buffered finalize.cjs');
const dispatcher=require('../MLS R32 EDITORIAL/global dispatcher/core.js');
const code=i=>'MLS-V10-'+String(i).padStart(4,'0');
const assign=()=>({allocatedBy:'global-dispatcher',assignmentId:'MLS-BUFFER-008801',assignmentIssueNumber:8801,leaseEpoch:8801,
 poolId:'MLS-R33-TEST-BUFFER',manifestVersion:'1.0',baseCommit:'a'.repeat(40),contentManifestBlobSha:'b'.repeat(40),
 units:Array.from({length:10},(_,i)=>({code:code(i+500),language:'espanol-guatemala',
 contentPath:'content/espanol-guatemala/'+code(i+500)+'.json',
 evidenceArtifactPath:'MLS R32 EDITORIAL/evidence git/entries/espanol-guatemala/'+code(i+500)+'.json'}))});
const entry=u=>({code:u.code,language:u.language,contentPath:u.contentPath,architecture:'github-native',status:'VERIFIED',
 article:{code:u.code,articleHash:'c'.repeat(64)},claims:[],links:[],conflicts:[],verification:{evidenceSnapshotHash:'d'.repeat(64)}});
const assess=async(_root,e)=>({ok:true,derivedStatus:e.status,article:{articleHash:e.article.articleHash},claimsVerified:1,sourcesTotal:1});
function tmp(t){const d=fs.mkdtempSync(path.join(os.tmpdir(),'r41-sync-test-'));t.after(()=>fs.rmSync(d,{recursive:true,force:true}));return d;}
async function pack(t){const d=tmp(t),a=assign();await core.init(d,a);for(const u of a.units)await core.checkpoint(d,entry(u));await sync.seal(d,d,{assess});return {d,a};}
function reservation(a){return allocation.reservation({allocation:a,requestId:'r4-buffer-8801'});}
function issue(r){return {number:r.issueNumber,state:'open',author_association:'OWNER',
 title:'[MLS Buffered][RESERVED] '+r.allocation.assignmentId,body:allocation.renderReservation(r)};}
function fakeApi(open){
 const g=dispatcher.initialLedger(dispatcher.normalizeRegistry({schemaVersion:1,items:[]}));
 g.updatedAt='2026-09-28T04:00:00Z';
 const ledgerIssue={number:709,title:'[MLS Dispatcher Ledger]',state:'open',body:dispatcher.renderLedgerBody(g)};
 const log=[];
 return {get:async p=>{log.push(p);
   if(p.startsWith('/issues?state=open&'))return [ledgerIssue,...open];
   if(p.startsWith('/issues?state=closed&'))return [];
   throw Error('Unexpected GET '+p);
 },patch:async()=>{throw Error('no mutation in preflight');},counts:()=>({httpCalls:log.length}),log};
}
function snapshot(a){return {pool:{poolId:a.poolId,manifestVersion:a.manifestVersion,
 entries:a.units.map(x=>({code:x.code}))},ledger:{verified:[],exceptions:[]},batches:[]};}

test('portable ten-entry package survives export, import and identical replay',async t=>{
 const {d}=await pack(t),destination=path.join(tmp(t),'copy'),file=path.join(tmp(t),'bundle.json');
 const exported=transport.exportTo(d,file);
 assert.equal(exported.entries,10);
 const imported=await transport.importFrom(destination,file);
 assert.equal(imported.imported,true);
 assert.equal(transport.assemble(destination).bundleHash,exported.bundleHash);
 assert.equal((await transport.importFrom(destination,file)).replayed,true);
 assert.equal(core.inspect(destination).completed.length,10);
});
test('altered bundle never creates a partially trusted destination',async t=>{
 const {d}=await pack(t),root=tmp(t),file=path.join(root,'bundle.json');
 transport.exportTo(d,file);
 const b=JSON.parse(fs.readFileSync(file,'utf8'));
 b.entries[code(500)].claims=[{summary:'Invented'}];
 fs.writeFileSync(file,JSON.stringify(b));
 const target=path.join(root,'target');
 await assert.rejects(transport.importFrom(target,file),e=>e.code==='BUNDLE_HASH_INVALID');
 assert.equal(fs.existsSync(target),false);
});
test('remote preflight compares live reservation, terminal and recoveries, without mutating',async t=>{
 const {d,a}=await pack(t),r=reservation(a),client=fakeApi([issue(r)]);
 const inject={plan:async()=>({branch:'r41/staged/8801',toCreate:a.units.map(u=>({code:u.code})),alreadyPresent:[]}),
 collect:()=>snapshot(a)};
 const ok=await verifier.verifyLive(d,d,8801,client,inject);
 assert.equal(ok.codes.length,10);assert.equal(ok.packageHash,transport.assemble(d).package.packageHash);
 assert.ok(client.log.every(path=>path.startsWith('/issues?')));
 const other={...issue(r),number:8802,title:'[MLS Buffered][RESERVED] MLS-BUFFER-008802'};
 await assert.rejects(verifier.verifyLive(d,d,8801,fakeApi([issue(r),other]),inject));
 const badLedger=fakeApi([issue(r)]);
 const original=badLedger.get.bind(badLedger);
 badLedger.get=async p=>{const rows=await original(p);
 if(p.startsWith('/issues?state=open&')){const led=rows[0];const l=dispatcher.parseLedger(led.body);l.recoveries.x={
  workItem:{provider:'r33-farm',resourceLocks:['entry:'+code(500)]},resourceLocks:['entry:'+code(500)]};
  led.body=dispatcher.renderLedgerBody(l);}
 return rows;};
 await assert.rejects(verifier.verifyLive(d,d,8801,badLedger,inject),e=>e.code==='CODE_HAS_PENDING_RECOVERY');
});
test('secondary rate-limit is reported once without any retry',async()=>{
 let calls=0;
 const client=verifier.api('owner/repo','test-token',async()=>{calls++;
  return {status:403,ok:false,headers:{get:k=>k==='retry-after'?'60':null},
   text:async()=>JSON.stringify({message:'secondary rate limit'})};});
 await assert.rejects(client.get('/issues/8801'),e=>e.code==='SYNC_BLOCKED'&&e.retryAfter==='60');
 assert.equal(calls,1);
});
test('successful independent workflow run finalizes ledger and closes reservation',async()=>{
 const a=assign(),r=reservation(a),s=allocation.stage(r,{branch:'r41/staged/8801',commitSha:'c'.repeat(40),
  packageHash:'d'.repeat(64),checksPassed:true,workflowRunId:5555,syncRequestIssueNumber:9901});
 const i={...issue(s),title:'[MLS Buffered][STAGED] '+a.assignmentId};
 const syncIssue={number:9901,title:'[MLS Buffered][SYNC] pack-8801',author_association:'OWNER',state:'open',
  body:'<!-- MLS_BUFFERED_SYNC_REQUEST\n'+JSON.stringify({kind:'mls_buffer_sync_request',version:1,
   reservationIssueNumber:8801,inboxBranch:'r41/inbox/8801'})+'\n-->'};
 const issued=[i,syncIssue];
 const ledgerItem={ledger:{terminal:{},recoveries:{},epochs:{}},dirty:false},closed=[];
 const get=async p=>{
  if(p.startsWith('/actions/runs/'))return {name:'R4.1 Buffered Sync',status:'completed',conclusion:'success',event:'issues'};
  if(p.startsWith('/git/ref/'))return {object:{sha:'c'.repeat(40)}};
  if(p.startsWith('/commits/'))return {parents:[{sha:'a'.repeat(40)}],
   files:a.units.map(u=>({filename:u.evidenceArtifactPath,status:'added'}))};
  if(p.startsWith('/compare/'))return {status:'identical'};
  throw Error(p);
 };
 const out=await finalize.reconcile({issues:issued,ledgerItem,get,
  patchIssue:async(n,x)=>closed.push({n,...x}),saveLedger:async()=>{ledgerItem.dirty=false;}});
 assert.equal(out[0].status,'CERTIFIED_STAGED');
 const terminal=ledgerItem.ledger.terminal['r33-buffer:'+a.assignmentId];
 assert.equal(terminal.provider,'r33-farm');assert.equal(terminal.completedUnits.length,10);
 assert.equal(closed[0].state,'closed');
 const cleaned=await finalize.cleanupSyncRequests({issues:issued,ledgerItem,patchIssue:async(n,p)=>closed.push({n,...p})});
 assert.equal(cleaned[0].status,'SYNC_REQUEST_CLOSED');
 assert.equal(closed[1].n,9901);
 assert.equal(closed[1].state,'closed');
});
test('failed CI is quarantined without clearing durable ownership',async()=>{
 const a=assign(),r=reservation(a),s=allocation.stage(r,{branch:'r41/staged/8801',commitSha:'c'.repeat(40),
  packageHash:'d'.repeat(64),checksPassed:true,workflowRunId:5555,syncRequestIssueNumber:9901});
 const issueRow={...issue(s),title:'[MLS Buffered][STAGED] '+a.assignmentId},patches=[];
 const ledgerItem={ledger:{terminal:{},recoveries:{},epochs:{}},dirty:false};
 const result=await finalize.reconcile({issues:[issueRow],ledgerItem,
  get:async()=>({status:'completed',conclusion:'failure',name:'R4.1 Buffered Sync',event:'issues'}),
  patchIssue:async(n,x)=>patches.push(x),saveLedger:async()=>{throw Error('must never persist terminal');}});
 assert.equal(result[0].status,'QUARANTINED');assert.equal(Object.keys(ledgerItem.ledger.terminal).length,0);
 assert.equal(patches[0].title,'[MLS Buffered][QUARANTINED] '+a.assignmentId);
 assert.equal(allocation.reservations([issueRow]).length,1);
});
