'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const alloc=require('../MLS R32 EDITORIAL/r4 buffered allocation.cjs');
const elastic=require('../MLS R32 EDITORIAL/r4 elastic core.cjs');
const engine=require('../MLS R32 EDITORIAL/r4 elastic scheduler.cjs');
const universal=require('../MLS R32 EDITORIAL/r4 universal scheduler.cjs');
const gate=require('../MLS R32 EDITORIAL/r4 universal gate.cjs');
const backoff=require('../MLS R32 EDITORIAL/r4 github backoff.cjs');
const core=require('../MLS R32 EDITORIAL/r4 buffered core.cjs');
const NOW=1800000000000,SHA='a'.repeat(40);
function fixture(id=1881,joined=true){
 const units=Array.from({length:25},(_,i)=>{const code='MLS-V10-'+String(id+i).padStart(4,'0');
  return {code,language:'espanol-guatemala',contentPath:'content/espanol-guatemala/'+code+'.json',
   evidenceArtifactPath:'MLS R32 EDITORIAL/evidence git/entries/espanol-guatemala/'+code+'.json'};});
 let r=alloc.reservation({requestId:'test-reserve-'+id,allocation:{allocatedBy:'global-dispatcher',
  assignmentId:'MLS-BUFFER-'+String(id).padStart(6,'0'),assignmentIssueNumber:id,leaseEpoch:id,
  poolId:'test-pool',manifestVersion:'1',baseCommit:SHA,contentManifestBlobSha:SHA,units}});
 r=elastic.withBlocks(r,elastic.blocks(r).map(b=>({...b,status:joined?'done':'pending'})),joined?{consolidatedSha:SHA}:{});
 return joined?universal.changed(r,{gate:{status:'BLOCKED',failedCodes:units.map(u=>u.code),errors:[]},corrections:{}}):r;
}
function request(number,action='next',more={},when=NOW){return {number,state:'open',user:{login:'owner'},author_association:'OWNER',
 created_at:new Date(when).toISOString(),title:'[MLS Dispatcher][BCR]['+(action==='next'?'REQUEST':action.toUpperCase())+'] '+number,
 body:elastic.renderCommand({kind:'mls_bcr_elastic_command',version:1,requestId:'request-'+number,action,...more})};}
function reservationIssue(res){return {number:res.issueNumber,state:'open',user:{login:'owner'},author_association:'OWNER',
 title:'[MLS Buffered][RESERVED] '+res.allocation.assignmentId,body:alloc.renderReservation(res)};}
function backend(res,requests){
 const issues=[reservationIssue(res),...requests],refs={['r41/buffer/'+res.issueNumber]:SHA};
 const writes=[];let fail=null,concurrent=0,peak=0;
 const api={
  async get(route){
   if(route.startsWith('/issues/'))return structuredClone(issues.find(i=>i.number===Number(route.split('/')[2])));
   if(route.startsWith('/git/ref/heads/')){const sha=refs[route.slice(15)];if(!sha){const e=Error('missing');e.status=404;throw e;}return {object:{sha}};}
   if(route.startsWith('/compare/'))return {status:'identical',files:[]};
   throw Error('Unexpected GET '+route);
  },
  async patch(route,body){
   concurrent++;peak=Math.max(peak,concurrent);await new Promise(resolve=>setImmediate(resolve));
   Object.assign(issues.find(i=>i.number===Number(route.split('/')[2])),body);writes.push({route,body});concurrent--;
   if(fail?.(route,body)){fail=null;const e=Error('injected lost response');e.status=503;throw e;}
   return {};
  },
  async post(route,body){
   concurrent++;peak=Math.max(peak,concurrent);await new Promise(resolve=>setImmediate(resolve));
   assert.equal(route,'/git/refs');assert.equal(refs[body.ref.slice(11)],undefined);
   refs[body.ref.slice(11)]=body.sha;writes.push({route,body});concurrent--;
   if(fail?.(route,body)){fail=null;const e=Error('injected lost response');e.status=503;throw e;}
   return {};
  }
 };
 return {api,issues,refs,writes,failWhen:f=>{fail=f;},peak:()=>peak,
  current:()=>alloc.parseReservation(issues[0])};
}
async function tick(db,now=NOW){
 const reservations=[db.current()];
 return universal.drain({api:db.api,io:engine,root:process.cwd(),reservations,issues:db.issues,now,technical:false});
}
test('repair lease instructs continued SAME-CHAT multi-pull only after confirmed completion',()=>{
 const f=fixture(),l={issue:3000,branch:'r42/repair/1881/3000',
  baseSha:SHA,expiresAt:new Date(NOW+elastic.TTL_MS).toISOString(),
  codes:f.universal.gate.failedCodes.slice(0,5),path:'r42-repair/1881/3000/',
  workerLogin:'owner'};
 const body=universal.claimBody(f,l);
 assert.match(body,/MULTI-PULL EN ESTE MISMO CHAT/);
 assert.match(body,/claim=DONE/);
 assert.match(body,/requestId NUEVO/);
 assert.match(body,/El Dispatcher no crea chats ni leases desatendidos/);
});
test('90 concurrent arrivals: one exclusive repair does not consume 89 production candidates',async()=>{
 const db=backend(fixture(),Array.from({length:90},(_,i)=>request(3000+i)));
 // GitHub's workflow mutex drains simultaneous arrival inventory serially.
 for(let i=0;i<18;i++)await tick(db);
 const r=db.current();assert.equal(r.universal.lease.issue,3000);
 assert.equal(Object.keys(db.refs).length,2);
 assert.equal(db.peak(),1);
 assert.equal(elastic.MAX_ACTIVE,50);
 assert.equal(db.issues.filter(i=>i.title.includes('[LEASED]')).length,1);
 // The other requests remain eligible for independent elastic production.
 assert.equal(db.issues.filter(i=>i.title.includes('[REQUEST]')).length,89);
 assert.equal(db.issues.filter(i=>i.title.includes('[CAPACITY_BUSY]')).length,0);
});
test('lost branch response replays same durable lease without a second branch or claim',async()=>{
 const db=backend(fixture(),[request(3000)]);db.failWhen(route=>route==='/git/refs');
 await assert.rejects(()=>tick(db),/lost response/);
 assert.equal(db.current().universal.lease.issue,3000);
 await tick(db);assert.equal(Object.keys(db.refs).length,2);
 assert.match(db.issues[1].title,/LEASED/);
 assert.equal(db.writes.filter(w=>w.route==='/git/refs').length,1);
});
test('lost reservation PATCH readback reconstructs missing branch from saved intent',async()=>{
 const db=backend(fixture(),[request(3000)]);db.failWhen(route=>route==='/issues/1881');
 await assert.rejects(()=>tick(db),/lost response/);
 assert.equal(Object.keys(db.refs).length,1);
 await tick(db);assert.equal(Object.keys(db.refs).length,2);assert.match(db.issues[1].title,/LEASED/);
});
test('lost claim reply does not extend TTL or allocate another claim',async()=>{
 const db=backend(fixture(),[request(3000)]);db.failWhen(route=>route==='/issues/3000');
 await assert.rejects(()=>tick(db),/lost response/);
 const before=db.current().universal.lease.expiresAt;await tick(db,NOW+1000);
 assert.equal(db.current().universal.lease.expiresAt,before);assert.equal(Object.keys(db.refs).length,2);
});
test('expired repair preserves checkpoint branch; next chat receives new epoch and stale heartbeat fails',async()=>{
 const db=backend(fixture(),[request(3000)]);await tick(db);
 const expired=NOW+elastic.TTL_MS+1;db.issues.push(request(3001,'next',{},expired));
 await tick(db,expired);const r=db.current();assert.equal(r.universal.lease.issue,3001);
 assert.equal(r.universal.lease.path,'r42-repair/1881/3000/');
 assert.equal(r.universal.lease.branch,'r42/repair/1881/3001');
 db.issues.push(request(3002,'renew',{task:'repair',block:0,reservationIssueNumber:1881,claimIssueNumber:3000},expired));
 await tick(db,expired);assert.match(db.issues.at(-1).title,/REJECTED/);
 assert.equal(db.current().universal.lease.issue,3001);
});
test('heartbeat extends five minutes only once, even if result reply is lost',async()=>{
 const db=backend(fixture(),[request(3000)]);await tick(db);
 db.issues.push(request(3001,'renew',{task:'repair',block:0,reservationIssueNumber:1881,claimIssueNumber:3000},NOW+1000));
 db.failWhen(route=>route==='/issues/3001');
 await assert.rejects(()=>tick(db,NOW+1000),/lost response/); // Preserve ambiguous response; no false rejection.
 assert.equal(Date.parse(db.current().universal.lease.expiresAt),NOW+1000+elastic.TTL_MS);
});
test('fifty-worker settlement burst does not reap a repair whose pre-expiry RENEW waits behind ten events',async()=>{
 const db=backend(fixture(),[request(3000)]);await tick(db);
 const sent=NOW+elastic.TTL_MS-1000,overdue=NOW+elastic.TTL_MS+3*60*1000;
 for(let n=0;n<10;n++)db.issues.push(request(3001+n,'renew',{
  task:'repair',block:0,reservationIssueNumber:1881,claimIssueNumber:999999},sent));
 const real=request(3011,'renew',{task:'repair',block:0,reservationIssueNumber:1881,claimIssueNumber:3000},sent);
 db.issues.push(real);
 await tick(db,overdue);
 assert.equal(db.current().universal.lease.issue,3000);
 assert.equal(real.state,'open');
 assert.match(real.title,/\[RENEW\]/);
 assert.equal(db.issues.filter(i=>/\[REJECTED\]/.test(i.title)).length,10);
 await tick(db,overdue+1000);
 assert.equal(db.current().universal.lease.issue,3000);
 assert.equal(db.current().universal.lease.expiresAt,new Date(overdue+1000+elastic.TTL_MS).toISOString());
 assert.match(real.title,/\[RENEWED\]/);
});
test('same requestId on another issue receives receipt, not ownership',async()=>{
 const db=backend(fixture(),[request(3000)]);await tick(db);
 const duplicate=request(3001);duplicate.body=db.issues[1].body; // Restore original command, same key.
 duplicate.body=elastic.renderCommand({kind:'mls_bcr_elastic_command',version:1,action:'next',requestId:'request-3000'});
 db.issues.push(duplicate);await tick(db);assert.match(duplicate.title,/REPLAY/);
 assert.equal(db.current().universal.lease.issue,3000);
});
test('recovery has priority over an earlier empty production reservation',()=>{
 const first=fixture(1881,false),second=fixture(2000,false);
 second.elastic.blocks[3].recovery={headSha:SHA};
 const selected=elastic.freeBlock([first,second],NOW);
 assert.equal(selected.reservation.issueNumber,2000);assert.equal(selected.block.block,4);
});
test('repair perimeter rejects deletion, foreign code and path traversal',()=>{
 const lease={codes:['MLS-V10-1881'],path:'r42-repair/1881/3000/'};
 assert.doesNotThrow(()=>universal.checkScope([{filename:lease.path+'entries/MLS-V10-1881.json',status:'added'}],lease));
 for(const f of [{filename:'main.json',status:'added'},
  {filename:lease.path+'entries/MLS-V10-1881.json',status:'removed'},
  {filename:lease.path+'../entries/MLS-V10-1881.json',status:'modified'}])
  assert.throws(()=>universal.checkScope([f],lease),/REPAIR_FOREIGN/);
});
test('403/429 cooldown persists Retry-After, primary reset and exponential bounded backoff',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mls-backoff-test-')),file=path.join(dir,'cooldown.json');
 try{
  const response={status:403,headers:{get:n=>({'retry-after':'120','x-ratelimit-remaining':'0','x-ratelimit-reset':String((NOW+300000)/1000)})[n]??null}};
  const r=backoff.record(file,response,NOW,()=>0);assert.equal(r.until,NOW+300000);
  assert.throws(()=>backoff.check(file,NOW+1),e=>e.status===429&&e.code==='GITHUB_COOLDOWN');
  assert.doesNotThrow(()=>backoff.check(file,NOW+300001));
  const next=backoff.record(file,{status:429,headers:{get:()=>null}},NOW+400000,()=>0);
  assert.equal(next.until,NOW+520000);assert.equal(next.attempts,2);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('scheduler waits until a persisted GitHub cooldown expires before resuming',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mls-backoff-wait-test-')),file=path.join(dir,'cooldown.json');
 try{
  fs.writeFileSync(file,JSON.stringify({schema:'MLS-GITHUB-COOLDOWN-1',until:NOW+30000,attempts:1,status:403}));
  let current=NOW,waited=0,logged='';
  const delay=await backoff.wait(file,{now:()=>current,sleep:async ms=>{waited=ms;current+=ms;},log:message=>{logged=message;}});
  assert.equal(delay,30000);assert.equal(waited,30000);assert.equal(current,NOW+30000);
  assert.match(logged,/scheduler will resume in 30s/);
  assert.doesNotThrow(()=>backoff.check(file,current));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('GitHub client retries the same rejected rate-limited operation after its persisted cooldown',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mls-backoff-retry-test-')),file=path.join(dir,'cooldown.json');
 try{
  let current=NOW,calls=0,waited=0;
  const value=await backoff.retry(file,async()=>{
   calls++;
   if(calls===1){fs.writeFileSync(file,JSON.stringify({schema:'MLS-GITHUB-COOLDOWN-1',until:NOW+45000,attempts:1,status:403}));const e=new Error('rate limit exceeded');e.retryAfterCooldown=true;throw e;}
   return 'resumed';
  },{maxRetries:2,waitOptions:{now:()=>current,sleep:async ms=>{waited+=ms;current+=ms;},log:()=>{}}});
  assert.equal(value,'resumed');assert.equal(calls,2);assert.equal(waited,45000);
  await assert.rejects(()=>backoff.retry(file,async()=>{const e=new Error('Resource not accessible by integration');e.status=403;throw e;},{waitOptions:{now:()=>current,sleep:async()=>{},log:()=>{}}}),/Resource not accessible/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('missing, copied or forged source reviews cannot become academic PASS',()=>{
 const entry={code:'MLS-V10-1881',claims:[{claimId:'c'}],links:[{claimId:'c',linkId:'l',sourceId:'s',locator:{section:'1'}}]};
 assert.deepEqual(gate.reviewErrors(entry,null),['SOURCE_REVIEW_REQUIRED']);
 const review={schema:'MLS-BCR-SOURCE-REVIEW-1',code:entry.code,entryHash:core.hash(entry),reviewType:'ai',humanReviewed:false,
  claims:[{claimId:'c',linkId:'l',sourceId:'s',locatorHash:core.hash({section:'1'}),verdict:'supported',
   rationale:'Recorded passage-specific reasoning by the reviewing chat.',sourceUrl:'https://example.org/1',accessedAt:'2026-09-29T00:00:00Z'}]};
 assert.deepEqual(gate.reviewErrors(entry,review),[]);
 review.claims[0].locatorHash='copied';assert.ok(gate.reviewErrors(entry,review).length);
 review.humanReviewed=true;assert.deepEqual(gate.reviewErrors(entry,review),['SOURCE_REVIEW_REQUIRED']);
});
test('sealed sync dispatch is reconstructed after saved intent and never uses a paid service',async()=>{
 const r=universal.changed(fixture(),{sync:{issue:3000,workerLogin:'owner',attempts:0}}),req=request(3000);
 const db=backend(r,[req]);let dispatches=0;
 const api={...db.api,get:async route=>route.includes('/actions/workflows/')?{workflow_runs:[]}:db.api.get(route),
  post:async(route,body)=>{assert.match(route,/R4\.1%20Buffered%20Sync.yml\/dispatches$/);assert.deepEqual(body,{ref:'main',inputs:{request_issue:'3000'}});dispatches++;}};
 await universal.dispatchSync({api,io:engine,res:r,issues:db.issues,now:NOW});
 assert.equal(dispatches,1);assert.match(req.title,/\[SYNC\]/);
 await universal.dispatchSync({api,io:engine,res:db.current(),issues:db.issues,now:NOW+1000});
 assert.equal(dispatches,1);
});

test('actual canonical validators gate 25 EXISTING entries, reject a changed claim, then seal/export an offline fixture',async t=>{
 const sync=require('../MLS R32 EDITORIAL/r4 buffered sync.cjs');
 const transport=require('../MLS R32 EDITORIAL/r4 buffered transport.cjs');
 const root=path.resolve(__dirname,'..'),source=path.join(root,'MLS R32 EDITORIAL/evidence git/entries/espanol-guatemala');
 const sample=[];
 for(const f of fs.readdirSync(source).sort()){
  const e=core.read(path.join(source,f));if(e.review!==null||e.provenance?.generatedWithAI!==true)continue;
  const r=await gate.assessEntry(root,e,null);
  if(r.canonical&&r.academic)sample.push(e);
  if(sample.length===25)break;
 }
 assert.equal(sample.length,25);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mls-gate-real-test-'));t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const head=gate.git(root,'rev-parse','HEAD'),manifest=gate.git(root,'rev-parse','HEAD:content/manifest.json');
 // Explicit offline-pilot assignment cannot be synchronized by verifyLive.
 await core.init(dir,{allocatedBy:'offline-pilot',pilotOnly:true,assignmentId:'MLS-PILOT-UNIVERSAL-25',
  assignmentIssueNumber:99990002,leaseEpoch:99990002,poolId:'OFFLINE-TEST',manifestVersion:'1',baseCommit:head,
  contentManifestBlobSha:manifest,units:sample.map(e=>({code:e.code,language:e.language,contentPath:e.contentPath,
   evidenceArtifactPath:'MLS R32 EDITORIAL/evidence git/entries/'+e.language+'/'+e.code+'.json'}))});
 const reviews={};
 for(const e of sample){
  await core.checkpoint(dir,e);
  // Synthetic records exercise record validation, NOT new external source reviews.
  reviews[e.code]={schema:'MLS-BCR-SOURCE-REVIEW-1',code:e.code,entryHash:core.hash(e),reviewType:'ai',humanReviewed:false,
   claims:e.claims.filter(c=>(c.materiality||'substantial')==='substantial').map(c=>{
    const l=e.links.find(l=>l.claimId===c.claimId);
    return {claimId:c.claimId,linkId:l.linkId,sourceId:l.sourceId,locatorHash:core.hash(l.locator),
     verdict:'supported',sourceUrl:l.locator.url||'https://example.org/offline-test',accessedAt:'2026-01-01T00:00:00Z',
     rationale:'OFFLINE TEST FIXTURE ONLY: no new source consultation or production attestation.'};})};
 }
 const missing=await gate.assessBuffer(root,dir,{bufferSha:head});assert.equal(missing.status,'BLOCKED');
 assert.equal(missing.passed,0);
 const passed=await gate.assessBuffer(root,dir,{bufferSha:head,reviews});assert.equal(passed.status,'PASS');assert.equal(passed.passed,25);
 const corrupt=structuredClone(sample[0]);corrupt.claims[0].summary+=' changed without recomputing canonical identity';
 const rejected=await gate.assessEntry(root,corrupt,reviews[corrupt.code]);assert.equal(rejected.ok,false);assert.equal(rejected.canonical,false);
 await sync.seal(dir,root);const bundle=transport.assemble(dir);transport.validateBundle(bundle);
 assert.equal(bundle.package.entries.length,25);
 await assert.rejects(()=>sync.plan(dir,root),e=>e.code==='OFFLINE_PILOT_CANNOT_SYNC');
 console.log('UNIVERSAL_OFFLINE_GATE '+JSON.stringify({existingCanonicalEntries:25,newAcademicProduction:0,
  newSourceConsultations:0,syntheticReviewRecords:true,networkWrites:0}));
});

