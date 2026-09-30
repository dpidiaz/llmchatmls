'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');
const farm=require('../MLS R32 EDITORIAL/r4 snapshot farm.cjs');
const store=require('../MLS R32 EDITORIAL/r4 snapshot local store.cjs');
const allocator=require('../MLS R32 EDITORIAL/r4 chat allocator.cjs');
const sync=require('../MLS R32 EDITORIAL/r4 snapshot sync.cjs');
const reservations=require('../MLS R32 EDITORIAL/r4 snapshot reservations.cjs');
const metrics=require('../MLS R32 EDITORIAL/r4 snapshot metrics.cjs');
const remoteAdmission=require('../MLS R32 EDITORIAL/r4 snapshot remote admission.cjs');
const remoteResult=require('../MLS R32 EDITORIAL/r4 snapshot remote result.cjs');
const waveIssue=require('../MLS R32 EDITORIAL/r4 snapshot wave issue.cjs');
const remoteScheduler=require('../MLS R32 EDITORIAL/r4 snapshot remote scheduler.cjs');
const buffered=require('../MLS R32 EDITORIAL/r4 buffered allocation.cjs');
const elasticR42=require('../MLS R32 EDITORIAL/r4 elastic core.cjs');

const BASE='a'.repeat(40),CONTENT='b'.repeat(40);
function units(n=500,start=753){
 return Array.from({length:n},(_,i)=>{
  const code='MLS-V10-'+String(start+i).padStart(4,'0');
  return {
   code,
   language:'espanol-guatemala',
   contentPath:'content/espanol-guatemala/'+code+'.json',
   evidenceArtifactPath:'MLS R32 EDITORIAL/evidence git/entries/espanol-guatemala/'+code+'.json'
  };
 });
}
function snapshot(n=500){
 return farm.createSnapshot({
  baseCommit:BASE,
  contentManifestBlobSha:CONTENT,
  units:units(n),
  createdAt:'2026-09-30T02:00:00.000Z'
 });
}
function r33Snapshot(n=500,start=753){
 const entries=units(n,start).map((u,i)=>({
  code:u.code,language:u.language,contentPath:u.contentPath,order:i+1
 }));
 return {
  pool:{
   poolId:'MLS-R33-FULL-CORPUS-CONTINUATION',
   manifestVersion:'1.0',
   status:'authorized',active:true,sourceOfTruth:'github',
   cloudflareEditorialAllowed:false,d1EditorialAllowed:false,
   execution:{defaultClaimSize:5,maxClaimSize:10},
   entries
  },
  ledger:{
   poolId:'MLS-R33-FULL-CORPUS-CONTINUATION',
   manifestVersion:'1.0',verified:[],exceptions:[]
  },
  batches:[],reservedCodes:[]
 };
}
function reservationIssue(r){
 return {
  number:r.issueNumber,state:'open',
  title:'[MLS Buffered][RESERVED] '+r.allocation.assignmentId,
  author_association:'OWNER',user:{login:'owner'},
  body:buffered.renderReservation(r)
 };
}
function payload(wave,shardId){
 const shard=wave.shards.find(x=>x.shardId===shardId);
 const entries={},checkpoints={},reviews={};
 for(const code of shard.codes){
  entries[code]={code,status:'PRODUCED',claims:[{claimId:'claim-'+code}]};
  checkpoints[code]={code,assessment:'PENDING_CANONICAL_R33_VALIDATION'};
  reviews[code]={code,reviewType:'ai',claims:[{verdict:'supported'}]};
 }
 return {entries,checkpoints,reviews};
}

test('100x5 wave preassigns 500 disjoint codes without any runtime allocator',()=>{
 const s=snapshot(500);
 const wave=farm.createWave(s,{
  waveId:'BCR-R43-PILOT-100',
  workerCount:100,
  shardSize:5,
  createdAt:'2026-09-30T02:01:00.000Z'
 });
 assert.equal(farm.validateWave(s,wave),true);
 assert.equal(wave.shards.length,100);
 assert.equal(wave.totalUnits,500);
 assert.deepEqual(wave.shards[0].codes,[
  'MLS-V10-0753','MLS-V10-0754','MLS-V10-0755','MLS-V10-0756','MLS-V10-0757'
 ]);
 assert.deepEqual(wave.shards[99].codes,[
  'MLS-V10-1248','MLS-V10-1249','MLS-V10-1250','MLS-V10-1251','MLS-V10-1252'
 ]);
 const codes=wave.shards.flatMap(x=>x.codes);
 assert.equal(new Set(codes).size,500);
});

test('snapshot and wave hashes fail closed after mutation',()=>{
 const s=snapshot(100);
 assert.equal(farm.validateSnapshot(s),true);
 const bad=structuredClone(s);
 bad.units[0].contentPath='tampered.json';
 assert.throws(()=>farm.validateSnapshot(bad),{code:'R43_SNAPSHOT_HASH'});

 const wave=farm.createWave(s,{
  waveId:'BCR-R43-HASH',
  workerCount:20,
  shardSize:5,
  createdAt:'2026-09-30T02:02:00.000Z'
 });
 const badWave=structuredClone(wave);
 badWave.shards[0].codes[0]='MLS-V10-9999';
 assert.throws(()=>farm.validateWave(s,badWave),{code:'R43_WAVE_HASH'});
});

test('append-only shard deltas reconcile a complete 20x5 pilot',()=>{
 const s=snapshot(100);
 const wave=farm.createWave(s,{
  waveId:'BCR-R43-PILOT-20',
  workerCount:20,
  shardSize:5,
  createdAt:'2026-09-30T02:03:00.000Z'
 });
 const deltas=wave.shards.map((shard,i)=>farm.createDelta(wave,{
  shardId:shard.shardId,
  ...payload(wave,shard.shardId),
  completedAt:new Date(Date.parse('2026-09-30T02:04:00.000Z')+i*1000).toISOString()
 }));
 for(const delta of deltas)assert.equal(farm.validateDelta(wave,delta),true);
 const result=farm.reconcileWave(wave,deltas);
 assert.equal(result.complete,true);
 assert.equal(result.completedShards.length,20);
 assert.equal(result.completedUnits.length,100);
 assert.deepEqual(result.missingShards,[]);
 assert.deepEqual(result.conflicts,[]);
});

test('reconciliation reports missing shards and duplicate delivery without corrupting scope',()=>{
 const s=snapshot(15);
 const wave=farm.createWave(s,{
  waveId:'BCR-R43-RECOVERY',
  workerCount:3,
  shardSize:5,
  createdAt:'2026-09-30T02:05:00.000Z'
 });
 const one=farm.createDelta(wave,{
  shardId:'W0001',...payload(wave,'W0001'),completedAt:'2026-09-30T02:06:00.000Z'
 });
 const result=farm.reconcileWave(wave,[one,structuredClone(one)]);
 assert.equal(result.complete,false);
 assert.deepEqual(result.missingShards,['W0002','W0003']);
 assert.equal(result.conflicts.length,1);
 assert.equal(result.conflicts[0].type,'duplicate-shard');
 assert.equal(result.completedUnits.length,5);
});

test('a delta cannot write outside its preassigned shard',()=>{
 const s=snapshot(10);
 const wave=farm.createWave(s,{
  waveId:'BCR-R43-SCOPE',
  workerCount:2,
  shardSize:5,
  createdAt:'2026-09-30T02:07:00.000Z'
 });
 const data=payload(wave,'W0001');
 data.entries['MLS-V10-0758']=data.entries['MLS-V10-0753'];
 delete data.entries['MLS-V10-0753'];
 assert.throws(()=>farm.createDelta(wave,{
  shardId:'W0001',...data,completedAt:'2026-09-30T02:08:00.000Z'
 }),{code:'R43_DELTA_ENTRIES_SCOPE'});
});

test('worker context is self-contained and forbids GitHub hot-path writes',()=>{
 const s=snapshot(20);
 const wave=farm.createWave(s,{
  waveId:'BCR-R43-WORKER',workerCount:4,shardSize:5,
  createdAt:'2026-09-30T02:09:00.000Z'
 });
 const context=farm.createWorkerContext(s,wave,'W0003');
 assert.equal(farm.validateWorkerContext(s,wave,context),true);
 assert.deepEqual(context.codes,wave.shards[2].codes);
 assert.equal(context.policy.githubHotPath,false);
 assert.equal(context.policy.remoteWritesDuringProduction,false);
 assert.equal(context.policy.r33Required,true);
 assert.equal(context.policy.producedIsVerified,false);
 const tampered=structuredClone(context);tampered.codes[0]='MLS-V10-9999';
 assert.throws(()=>farm.validateWorkerContext(s,wave,tampered),{code:'R43_WORKER_HASH'});
});

test('sync conflict planner quarantines only paths changed since the frozen base',()=>{
 const s=snapshot(10);
 const wave=farm.createWave(s,{
  waveId:'BCR-R43-SYNC',workerCount:2,shardSize:5,
  createdAt:'2026-09-30T02:10:00.000Z'
 });
 const clean=farm.planSyncConflicts(wave,['README.md']);
 assert.equal(clean.safe,true);assert.deepEqual(clean.collisions,[]);
 const target=wave.shards[1].units[2];
 const blocked=farm.planSyncConflicts(wave,[target.evidenceArtifactPath,'docs/other.md']);
 assert.equal(blocked.safe,false);
 assert.equal(blocked.collisions.length,1);
 assert.equal(blocked.collisions[0].code,target.code);
 assert.equal(blocked.collisions[0].shardId,'W0002');
 assert.deepEqual(blocked.collisions[0].paths,[target.evidenceArtifactPath]);
});


test('chat-local store persists worker context and deltas without GitHub and replays idempotently',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'mls-r43-'));
 try{
  const s=snapshot(10);
  const wave=farm.createWave(s,{
   waveId:'BCR-R43-LOCAL',workerCount:2,shardSize:5,
   createdAt:'2026-09-30T02:11:00.000Z'
  });
  const context=farm.createWorkerContext(s,wave,'W0001');
  const first=store.saveWorkerContext(root,s,wave,context);
  assert.equal(first.created,true);
  assert.deepEqual(store.loadWorkerContext(root,wave.waveId,'W0001'),context);
  const replay=store.saveWorkerContext(root,s,wave,context);
  assert.equal(replay.created,false);

  const delta=farm.createDelta(wave,{
   shardId:'W0001',...payload(wave,'W0001'),completedAt:'2026-09-30T02:12:00.000Z'
  });
  const saved=store.saveDelta(root,wave,delta);
  assert.equal(saved.created,true);
  assert.equal(store.saveDelta(root,wave,delta).created,false);
  assert.equal(store.loadDeltas(root,wave).length,1);

  const rec=store.reconcileToDisk(root,wave);
  assert.equal(rec.reconciliation.complete,false);
  assert.deepEqual(rec.reconciliation.missingShards,['W0002']);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('chat-local immutable store refuses conflicting overwrite for the same shard',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'mls-r43-conflict-'));
 try{
  const s=snapshot(5);
  const wave=farm.createWave(s,{
   waveId:'BCR-R43-LOCAL-CONFLICT',workerCount:1,shardSize:5,
   createdAt:'2026-09-30T02:13:00.000Z'
  });
  const delta=farm.createDelta(wave,{
   shardId:'W0001',...payload(wave,'W0001'),completedAt:'2026-09-30T02:14:00.000Z'
  });
  store.saveDelta(root,wave,delta);
  const file=store.paths(root,wave.waveId,'W0001').delta;
  const changed=structuredClone(delta);
  changed.entries[changed.codes[0]].status='TAMPERED';
  fs.writeFileSync(file,JSON.stringify(changed,null,2)+'\n');
  assert.throws(()=>store.saveDelta(root,wave,delta),{code:'R43_LOCAL_IMMUTABLE_CONFLICT'});
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('allocator claims 100 shards exactly once using revision fences',()=>{
 const s=snapshot(500);
 const wave=farm.createWave(s,{
  waveId:'BCR-R43-ALLOC-100',workerCount:100,shardSize:5,
  createdAt:'2026-09-30T02:15:00.000Z'
 });
 let state=allocator.createAllocator(wave,{
  createdAt:'2026-09-30T02:15:01.000Z',claimTtlMs:30*60*1000
 });
 const claimed=[];
 for(let i=0;i<100;i++){
  const out=allocator.claimNext(state,wave,{
   expectedRevision:state.revision,
   claimId:'chat-'+String(i+1).padStart(4,'0')+'-claim',
   claimedAt:new Date(Date.parse('2026-09-30T02:16:00.000Z')+i*1000).toISOString()
  });
  assert.ok(out.claim);claimed.push(out.claim.shardId);state=out.state;
 }
 assert.equal(new Set(claimed).size,100);
 assert.deepEqual(claimed,wave.shards.map(x=>x.shardId));
 const empty=allocator.claimNext(state,wave,{
  expectedRevision:state.revision,claimId:'chat-overflow-claim',
  claimedAt:'2026-09-30T02:20:00.000Z'
 });
 assert.equal(empty.claim,null);
});

test('allocator rejects stale concurrent CAS readers instead of duplicating a shard',()=>{
 const s=snapshot(10);
 const wave=farm.createWave(s,{
  waveId:'BCR-R43-CAS',workerCount:2,shardSize:5,
  createdAt:'2026-09-30T02:21:00.000Z'
 });
 const state0=allocator.createAllocator(wave,{createdAt:'2026-09-30T02:21:01.000Z'});
 const a=allocator.claimNext(state0,wave,{
  expectedRevision:0,claimId:'chat-A-claim',claimedAt:'2026-09-30T02:22:00.000Z'
 });
 assert.equal(a.claim.shardId,'W0001');
 assert.throws(()=>allocator.claimNext(a.state,wave,{
  expectedRevision:0,claimId:'chat-B-claim',claimedAt:'2026-09-30T02:22:00.500Z'
 }),{code:'R43_ALLOC_STALE_REVISION'});
 const b=allocator.claimNext(a.state,wave,{
  expectedRevision:a.state.revision,claimId:'chat-B-claim',
  claimedAt:'2026-09-30T02:22:01.000Z'
 });
 assert.equal(b.claim.shardId,'W0002');
});

test('allocator completion is fenced to the exact live claimant and delta',()=>{
 const s=snapshot(5);
 const wave=farm.createWave(s,{
  waveId:'BCR-R43-COMPLETE',workerCount:1,shardSize:5,
  createdAt:'2026-09-30T02:23:00.000Z'
 });
 let state=allocator.createAllocator(wave,{createdAt:'2026-09-30T02:23:01.000Z'});
 const out=allocator.claimNext(state,wave,{
  expectedRevision:state.revision,claimId:'chat-owner-claim',
  claimedAt:'2026-09-30T02:24:00.000Z'
 });
 state=out.state;
 assert.throws(()=>allocator.complete(state,wave,{
  expectedRevision:state.revision,shardId:'W0001',claimId:'chat-foreign-claim',
  deltaHash:'d'.repeat(64),completedAt:'2026-09-30T02:25:00.000Z'
 }),{code:'R43_ALLOC_NOT_OWNER'});
 const done=allocator.complete(state,wave,{
  expectedRevision:state.revision,shardId:'W0001',claimId:'chat-owner-claim',
  deltaHash:'d'.repeat(64),completedAt:'2026-09-30T02:25:00.000Z'
 });
 assert.equal(done.shards[0].status,'completed');
 assert.equal(done.shards[0].claim.deltaHash,'d'.repeat(64));
});

test('expired chat claim is reaped locally and becomes recoverable without GitHub',()=>{
 const s=snapshot(5);
 const wave=farm.createWave(s,{
  waveId:'BCR-R43-REAP',workerCount:1,shardSize:5,
  createdAt:'2026-09-30T02:26:00.000Z'
 });
 let state=allocator.createAllocator(wave,{
  createdAt:'2026-09-30T02:26:01.000Z',claimTtlMs:5*60*1000
 });
 state=allocator.claimNext(state,wave,{
  expectedRevision:state.revision,claimId:'chat-expiring-claim',
  claimedAt:'2026-09-30T02:27:00.000Z'
 }).state;
 const reaped=allocator.reap(state,wave,'2026-09-30T02:32:00.000Z');
 assert.equal(reaped.shards[0].status,'free');
 assert.equal(reaped.shards[0].claim,null);
 assert.equal(reaped.revision,state.revision+1);
});


test('grouped sync emits one immutable 20x5 batch after complete reconciliation',()=>{
 const s=snapshot(100);
 const wave=farm.createWave(s,{
  waveId:'BCR-R43-GROUPED-SYNC',workerCount:20,shardSize:5,
  createdAt:'2026-09-30T02:33:00.000Z'
 });
 const deltas=wave.shards.map((shard,i)=>farm.createDelta(wave,{
  shardId:shard.shardId,...payload(wave,shard.shardId),
  completedAt:new Date(Date.parse('2026-09-30T02:34:00.000Z')+i*1000).toISOString()
 }));
 const bundle=sync.buildGroupedSync(wave,deltas,{
  changedPaths:['README.md'],currentHead:'c'.repeat(40)
 });
 assert.equal(sync.validateGroupedSync(wave,bundle),true);
 assert.equal(bundle.totalRecords,100);
 assert.equal(bundle.records.length,100);
 assert.equal(bundle.expectedBaseCommit,BASE);
 assert.equal(bundle.observedCurrentHead,'c'.repeat(40));
 assert.equal(new Set(bundle.records.map(x=>x.code)).size,100);
});

test('grouped sync fails closed when one target path changed since snapshot',()=>{
 const s=snapshot(10);
 const wave=farm.createWave(s,{
  waveId:'BCR-R43-SYNC-CONFLICT',workerCount:2,shardSize:5,
  createdAt:'2026-09-30T02:35:00.000Z'
 });
 const deltas=wave.shards.map((shard,i)=>farm.createDelta(wave,{
  shardId:shard.shardId,...payload(wave,shard.shardId),
  completedAt:new Date(Date.parse('2026-09-30T02:36:00.000Z')+i*1000).toISOString()
 }));
 assert.throws(()=>sync.buildGroupedSync(wave,deltas,{
  changedPaths:[wave.shards[0].units[0].contentPath],currentHead:'c'.repeat(40)
 }),{code:'R43_SYNC_BASE_CONFLICT'});
});

test('grouped sync refuses partial waves even when changed paths are clean',()=>{
 const s=snapshot(10);
 const wave=farm.createWave(s,{
  waveId:'BCR-R43-SYNC-PARTIAL',workerCount:2,shardSize:5,
  createdAt:'2026-09-30T02:37:00.000Z'
 });
 const delta=farm.createDelta(wave,{
  shardId:'W0001',...payload(wave,'W0001'),completedAt:'2026-09-30T02:38:00.000Z'
 });
 assert.throws(()=>sync.buildGroupedSync(wave,[delta],{
  changedPaths:[],currentHead:'c'.repeat(40)
 }),{code:'R43_SYNC_WAVE_INCOMPLETE'});
});


test('pilot 20x5 composes four existing 25-entry durable reservations with no overlap',()=>{
 const source=r33Snapshot(150);
 const issueNumbers=[3001,3002,3003,3004];
 const out=reservations.compose(source,{
  reservationIssueNumbers:issueNumbers,
  baseCommit:BASE,contentManifestBlobSha:CONTENT,
  now:Date.parse('2026-09-30T02:39:00.000Z'),
  waveId:'BCR-R43-PILOT-20-REAL',
  workerCount:20,shardSize:5,
  createdAt:'2026-09-30T02:39:00.000Z'
 });
 assert.deepEqual(out.sizes,[25,25,25,25]);
 assert.equal(out.reservations.length,4);
 assert.equal(out.protectedCodes.length,100);
 assert.equal(new Set(out.protectedCodes).size,100);
 assert.equal(out.wave.workerCount,20);
 assert.equal(out.wave.totalUnits,100);
 assert.equal(out.snapshot.units.length,100);
 assert.deepEqual(out.reservations.map(x=>x.issueNumber),issueNumbers);
});

test('100-worker wave composes twenty 25-entry durable reservations and preserves uniqueness',()=>{
 const source=r33Snapshot(550);
 const issueNumbers=Array.from({length:20},(_,i)=>4001+i);
 const out=reservations.compose(source,{
  reservationIssueNumbers:issueNumbers,
  baseCommit:BASE,contentManifestBlobSha:CONTENT,
  now:Date.parse('2026-09-30T02:40:00.000Z'),
  waveId:'BCR-R43-WAVE-100',
  workerCount:100,shardSize:5,
  createdAt:'2026-09-30T02:40:00.000Z'
 });
 assert.equal(out.sizes.length,20);
 assert.ok(out.sizes.every(x=>x===25));
 assert.equal(out.protectedCodes.length,500);
 assert.equal(new Set(out.protectedCodes).size,500);
 assert.equal(out.wave.shards.length,100);
 assert.equal(out.wave.totalUnits,500);
});


test('pilot metrics allow advancement only when quality and hot-path safety gates are clean',()=>{
 const s=snapshot(100);
 const wave=farm.createWave(s,{
  waveId:'BCR-R43-METRICS-PASS',workerCount:20,shardSize:5,
  createdAt:'2026-09-30T02:41:00.000Z'
 });
 const report=metrics.evaluate(wave,{
  entriesAttempted:100,durableDeltas:100,
  acceptedDuplicateOwnership:0,allocatorCasConflicts:7,lostAcceptedDeltas:0,
  r33FirstPassSuccesses:91,r33Repairs:9,unresolvedR33Failures:0,
  githubWritesDuringProduction:0,githubInitializationWrites:4,githubSyncWrites:3,
  r33ValidatorBypasses:0,overwrittenBaseConflicts:0,
  shardDurationsSeconds:Array.from({length:20},(_,i)=>100+i)
 });
 assert.equal(report.advancementAllowed,true);
 assert.deepEqual(report.blockers,[]);
 assert.equal(report.r33.firstPassRatePct,91);
 assert.equal(report.r33.repairRatePct,9);
 assert.equal(report.github.workerProductionWrites,0);
 assert.equal(report.timing.observedShards,20);
});

test('pilot metrics block scale-up on any quality loss, worker GitHub write or unresolved R33 failure',()=>{
 const s=snapshot(100);
 const wave=farm.createWave(s,{
  waveId:'BCR-R43-METRICS-BLOCK',workerCount:20,shardSize:5,
  createdAt:'2026-09-30T02:42:00.000Z'
 });
 const report=metrics.evaluate(wave,{
  entriesAttempted:100,durableDeltas:99,
  acceptedDuplicateOwnership:1,lostAcceptedDeltas:1,
  r33FirstPassSuccesses:90,r33Repairs:9,unresolvedR33Failures:1,
  githubWritesDuringProduction:1,githubInitializationWrites:4,githubSyncWrites:3,
  r33ValidatorBypasses:1,overwrittenBaseConflicts:1
 });
 assert.equal(report.advancementAllowed,false);
 for(const code of [
  'INCOMPLETE_DURABLE_COUNT','DUPLICATE_OWNERSHIP_ACCEPTED','LOST_ACCEPTED_DELTA',
  'GITHUB_WORKER_HOT_PATH_WRITE','R33_VALIDATOR_BYPASS',
  'BASE_CONFLICT_OVERWRITTEN','UNRESOLVED_R33_FAILURE','R33_ACCOUNTING_INCOMPLETE'
 ])assert.ok(report.blockers.includes(code));
});


function remoteIssue(number,wave,requestId,waveIssueNumber=9000){
 const request=remoteAdmission.createRequest(wave,{
  waveIssueNumber,requestId,createdAt:new Date(Date.parse('2026-09-30T03:00:00.000Z')+number*10).toISOString()
 });
 return {
  number,state:'open',author_association:'OWNER',user:{login:'owner'},
  title:'[MLS BCR R4.3][REQUEST] '+requestId,
  body:remoteAdmission.renderRequestBody(request)
 };
}

test('remote fallback seals 20 one-shot requests into 20 stable unique shard assignments',()=>{
 const s=snapshot(100);
 const wave=farm.createWave(s,{
  waveId:'BCR-R43-REMOTE-20',workerCount:20,shardSize:5,
  createdAt:'2026-09-30T03:01:00.000Z'
 });
 const issues=Array.from({length:20},(_,i)=>remoteIssue(5001+i,wave,'remote-'+String(i+1).padStart(4,'0')));
 const admission=remoteAdmission.sealAdmission(wave,issues,{sealedAt:'2026-09-30T03:02:00.000Z',waveIssueNumber:9000});
 assert.equal(remoteAdmission.validateAdmission(admission,wave),true);
 assert.equal(admission.assignments.length,20);
 assert.equal(new Set(admission.assignments.map(x=>x.shardId)).size,20);
 assert.equal(new Set(admission.assignments.flatMap(x=>x.codes)).size,100);
 assert.deepEqual(admission.assignments.map(x=>x.shardId),wave.shards.map(x=>x.shardId));
});

test('remote fallback assignment is FIFO by immutable GitHub issue number, not chat clock',()=>{
 const s=snapshot(10);
 const wave=farm.createWave(s,{
  waveId:'BCR-R43-REMOTE-FIFO',workerCount:2,shardSize:5,
  createdAt:'2026-09-30T03:03:00.000Z'
 });
 const lateNumber=remoteIssue(6002,wave,'remote-fifo-B');
 const earlyNumber=remoteIssue(6001,wave,'remote-fifo-A');
 const admission=remoteAdmission.sealAdmission(wave,[lateNumber,earlyNumber],{
  sealedAt:'2026-09-30T03:04:00.000Z',waveIssueNumber:9000
 });
 assert.equal(remoteAdmission.assignmentFor(admission,'remote-fifo-A').shardId,'W0001');
 assert.equal(remoteAdmission.assignmentFor(admission,'remote-fifo-B').shardId,'W0002');
});

test('remote result compresses one 5-entry delta into one bounded issue body and round-trips exactly',()=>{
 const s=snapshot(5);
 const wave=farm.createWave(s,{
  waveId:'BCR-R43-REMOTE-RESULT',workerCount:1,shardSize:5,
  createdAt:'2026-09-30T03:05:00.000Z'
 });
 const issue=remoteIssue(7001,wave,'remote-result-0001');
 const admission=remoteAdmission.sealAdmission(wave,[issue],{sealedAt:'2026-09-30T03:06:00.000Z',waveIssueNumber:9000});
 const p=payload(wave,'W0001');
 for(const code of wave.shards[0].codes){
  p.entries[code].article={summary:'Detailed grammatical evidence '.repeat(80)};
  p.reviews[code].rationale='Specific source support '.repeat(80);
 }
 const delta=farm.createDelta(wave,{
  shardId:'W0001',...p,completedAt:'2026-09-30T03:07:00.000Z'
 });
 const envelope=remoteResult.encodeDelta(wave,delta,{waveIssueNumber:9000});
 const body=remoteResult.renderResultBody(envelope);
 assert.ok(Buffer.byteLength(body,'utf8')<=remoteResult.MAX_RESULT_BODY_BYTES);
 const resultIssue={...issue,body};
 assert.deepEqual(remoteResult.decodeResult(resultIssue,wave,admission),delta);
 const collected=remoteResult.collectResults([resultIssue],wave,admission);
 assert.equal(collected.missing.length,0);
 assert.equal(collected.reconciliation.complete,true);
});

test('remote result cannot be submitted from another admitted worker issue',()=>{
 const s=snapshot(10);
 const wave=farm.createWave(s,{
  waveId:'BCR-R43-REMOTE-OWNER',workerCount:2,shardSize:5,
  createdAt:'2026-09-30T03:08:00.000Z'
 });
 const issues=[remoteIssue(8001,wave,'remote-owner-A'),remoteIssue(8002,wave,'remote-owner-B')];
 const admission=remoteAdmission.sealAdmission(wave,issues,{sealedAt:'2026-09-30T03:09:00.000Z',waveIssueNumber:9000});
 const delta=farm.createDelta(wave,{
  shardId:'W0001',...payload(wave,'W0001'),completedAt:'2026-09-30T03:10:00.000Z'
 });
 const body=remoteResult.renderResultBody(remoteResult.encodeDelta(wave,delta,{waveIssueNumber:9000}));
 assert.throws(()=>remoteResult.decodeResult({...issues[1],body},wave,admission),{
  code:'R43_REMOTE_RESULT_NOT_OWNER'
 });
});

test('remote fallback deliberately refuses a 100-worker wave to protect GitHub secondary limits',()=>{
 const s=snapshot(500);
 const wave=farm.createWave(s,{
  waveId:'BCR-R43-REMOTE-100-REFUSED',workerCount:100,shardSize:5,
  createdAt:'2026-09-30T03:11:00.000Z'
 });
 assert.throws(()=>remoteAdmission.createRequest(wave,{
  waveIssueNumber:9000,requestId:'remote-refused-0001',createdAt:'2026-09-30T03:12:00.000Z'
 }),{code:'R43_REMOTE_WORKER_CAP'});
});


test('wave control issue binds snapshot, reservations and remote admission immutably',()=>{
 const source=r33Snapshot(100);
 const composed=reservations.compose(source,{
  reservationIssueNumbers:[9101,9102,9103,9104],
  baseCommit:BASE,contentManifestBlobSha:CONTENT,
  now:Date.parse('2026-09-30T03:13:00.000Z'),
  waveId:'BCR-R43-WAVE-ISSUE',workerCount:20,shardSize:5,
  createdAt:'2026-09-30T03:13:00.000Z'
 });
 const record=waveIssue.create({
  waveIssueNumber:9200,
  reservationIssueNumbers:[9101,9102,9103,9104],
  snapshot:composed.snapshot,wave:composed.wave,
  createdAt:'2026-09-30T03:14:00.000Z',route:'remote'
 });
 assert.equal(waveIssue.validate(record,composed.snapshot,composed.wave),true);
 const rendered={number:9200,title:waveIssue.title(record),body:waveIssue.render(record)};
 assert.deepEqual(waveIssue.parse(rendered),record);

 const issues=Array.from({length:20},(_,i)=>remoteIssue(
  9301+i,composed.wave,'wave-bound-'+String(i+1).padStart(4,'0'),9200
 ));
 const admission=remoteAdmission.sealAdmission(composed.wave,issues,{
  sealedAt:'2026-09-30T03:15:00.000Z',waveIssueNumber:9200
 });
 const sealed=waveIssue.seal(record,composed.snapshot,composed.wave,admission,'2026-09-30T03:15:00.000Z');
 assert.equal(sealed.status,'sealed');
 assert.equal(waveIssue.validate(sealed,composed.snapshot,composed.wave),true);
 assert.equal(sealed.admission.assignments.length,20);
});

test('wave control issue reaches reconciled only after all 20 deltas are complete',()=>{
 const source=r33Snapshot(100);
 const composed=reservations.compose(source,{
  reservationIssueNumbers:[9401,9402,9403,9404],
  baseCommit:BASE,contentManifestBlobSha:CONTENT,
  now:Date.parse('2026-09-30T03:16:00.000Z'),
  waveId:'BCR-R43-WAVE-RECONCILE',workerCount:20,shardSize:5,
  createdAt:'2026-09-30T03:16:00.000Z'
 });
 let record=waveIssue.create({
  waveIssueNumber:9500,reservationIssueNumbers:[9401,9402,9403,9404],
  snapshot:composed.snapshot,wave:composed.wave,
  createdAt:'2026-09-30T03:17:00.000Z',route:'remote'
 });
 const requests=Array.from({length:20},(_,i)=>remoteIssue(
  9601+i,composed.wave,'reconcile-'+String(i+1).padStart(4,'0'),9500
 ));
 const admission=remoteAdmission.sealAdmission(composed.wave,requests,{
  sealedAt:'2026-09-30T03:18:00.000Z',waveIssueNumber:9500
 });
 record=waveIssue.seal(record,composed.snapshot,composed.wave,admission,'2026-09-30T03:18:00.000Z');
 const deltas=composed.wave.shards.map((shard,i)=>farm.createDelta(composed.wave,{
  shardId:shard.shardId,...payload(composed.wave,shard.shardId),
  completedAt:new Date(Date.parse('2026-09-30T03:19:00.000Z')+i*1000).toISOString()
 }));
 const reconciliation=farm.reconcileWave(composed.wave,deltas);
 assert.equal(reconciliation.complete,true);
 const done=waveIssue.reconcile(record,composed.snapshot,composed.wave,reconciliation,'2026-09-30T03:20:00.000Z');
 assert.equal(done.status,'reconciled');
 assert.equal(done.reconciliation.completedShards.length,20);
 assert.equal(waveIssue.validate(done,composed.snapshot,composed.wave),true);
});


test('remote scheduler performs zero wave writes at 19/20 and exactly one seal patch at 20/20',()=>{
 const source=r33Snapshot(100);
 const composed=reservations.compose(source,{
  reservationIssueNumbers:[9701,9702,9703,9704],
  baseCommit:BASE,contentManifestBlobSha:CONTENT,
  now:Date.parse('2026-09-30T03:21:00.000Z'),
  waveId:'BCR-R43-SCHED-SEAL',workerCount:20,shardSize:5,
  createdAt:'2026-09-30T03:21:00.000Z'
 });
 const record=waveIssue.create({
  waveIssueNumber:9800,reservationIssueNumbers:[9701,9702,9703,9704],
  snapshot:composed.snapshot,wave:composed.wave,
  createdAt:'2026-09-30T03:22:00.000Z',route:'remote'
 });
 const control={number:9800,state:'open',title:waveIssue.title(record),body:waveIssue.render(record)};
 const reservationIssues=composed.reservations.map(reservationIssue);
 const requests=Array.from({length:20},(_,i)=>remoteIssue(
  9810+i,composed.wave,'sched-seal-'+String(i+1).padStart(4,'0'),9800
 ));
 const waiting=remoteScheduler.sealIfReady({
  waveControlIssue:control,reservationIssues,requestIssues:requests.slice(0,19),
  now:'2026-09-30T03:23:00.000Z'
 });
 assert.equal(waiting.changed,false);
 assert.equal(waiting.reason,'WAITING_REQUESTS');
 assert.equal(waiting.validRequests,19);
 assert.equal(waiting.patch,undefined);

 const sealed=remoteScheduler.sealIfReady({
  waveControlIssue:control,reservationIssues,requestIssues:requests,
  now:'2026-09-30T03:24:00.000Z'
 });
 assert.equal(sealed.changed,true);
 assert.equal(sealed.reason,'SEALED');
 assert.equal(sealed.record.admission.assignments.length,20);
 assert.equal(sealed.patch.title,'[MLS BCR R4.3][WAVE][SEALED] BCR-R43-SCHED-SEAL');
 assert.ok(sealed.patch.body.includes(waveIssue.MARKER));
});

test('remote scheduler ignores a request bound to another wave issue instead of shifting assignment order',()=>{
 const source=r33Snapshot(10);
 const composed=reservations.compose(source,{
  reservationIssueNumbers:[9901],
  baseCommit:BASE,contentManifestBlobSha:CONTENT,
  now:Date.parse('2026-09-30T03:25:00.000Z'),
  waveId:'BCR-R43-SCHED-BIND',workerCount:2,shardSize:5,
  createdAt:'2026-09-30T03:25:00.000Z'
 });
 const record=waveIssue.create({
  waveIssueNumber:9910,reservationIssueNumbers:[9901],
  snapshot:composed.snapshot,wave:composed.wave,
  createdAt:'2026-09-30T03:26:00.000Z',route:'remote'
 });
 const control={number:9910,state:'open',title:waveIssue.title(record),body:waveIssue.render(record)};
 const requests=[
  remoteIssue(9920,composed.wave,'wrong-wave-request',9999),
  remoteIssue(9921,composed.wave,'right-wave-0001',9910),
  remoteIssue(9922,composed.wave,'right-wave-0002',9910)
 ];
 const out=remoteScheduler.sealIfReady({
  waveControlIssue:control,reservationIssues:composed.reservations.map(reservationIssue),
  requestIssues:requests,now:'2026-09-30T03:27:00.000Z'
 });
 assert.equal(out.changed,true);
 assert.deepEqual(out.record.admission.assignments.map(x=>x.issueNumber),[9921,9922]);
});

test('remote scheduler reconciles only after every admitted result is durably present',()=>{
 const source=r33Snapshot(100);
 const composed=reservations.compose(source,{
  reservationIssueNumbers:[10001,10002,10003,10004],
  baseCommit:BASE,contentManifestBlobSha:CONTENT,
  now:Date.parse('2026-09-30T03:28:00.000Z'),
  waveId:'BCR-R43-SCHED-RESULTS',workerCount:20,shardSize:5,
  createdAt:'2026-09-30T03:28:00.000Z'
 });
 let record=waveIssue.create({
  waveIssueNumber:10010,reservationIssueNumbers:[10001,10002,10003,10004],
  snapshot:composed.snapshot,wave:composed.wave,
  createdAt:'2026-09-30T03:29:00.000Z',route:'remote'
 });
 const requests=Array.from({length:20},(_,i)=>remoteIssue(
  10020+i,composed.wave,'sched-result-'+String(i+1).padStart(4,'0'),10010
 ));
 const admission=remoteAdmission.sealAdmission(composed.wave,requests,{
  sealedAt:'2026-09-30T03:30:00.000Z',waveIssueNumber:10010
 });
 record=waveIssue.seal(record,composed.snapshot,composed.wave,admission,'2026-09-30T03:30:00.000Z');
 const sealedControl={number:10010,state:'open',title:waveIssue.title(record),body:waveIssue.render(record)};
 const results=requests.map((req,i)=>{
  const shard=composed.wave.shards[i];
  const delta=farm.createDelta(composed.wave,{
   shardId:shard.shardId,...payload(composed.wave,shard.shardId),
   completedAt:new Date(Date.parse('2026-09-30T03:31:00.000Z')+i*1000).toISOString()
  });
  return {...req,body:remoteResult.renderResultBody(remoteResult.encodeDelta(composed.wave,delta,{waveIssueNumber:10010}))};
 });
 const waiting=remoteScheduler.reconcileIfComplete({
  waveControlIssue:sealedControl,reservationIssues:composed.reservations.map(reservationIssue),
  resultIssues:results.slice(0,19),now:'2026-09-30T03:32:00.000Z'
 });
 assert.equal(waiting.changed,false);
 assert.equal(waiting.reason,'WAITING_RESULTS');
 assert.deepEqual(waiting.missing,['W0020']);

 const done=remoteScheduler.reconcileIfComplete({
  waveControlIssue:sealedControl,reservationIssues:composed.reservations.map(reservationIssue),
  resultIssues:results,now:'2026-09-30T03:33:00.000Z'
 });
 assert.equal(done.changed,true);
 assert.equal(done.reason,'RECONCILED');
 assert.equal(done.record.status,'reconciled');
 assert.equal(done.reconciliation.completedShards.length,20);
});


test('pilot scheduler script is syntactically valid and has one Wave Issue PATCH point',()=>{
 const script=path.join(process.cwd(),'scripts','MLS R4.3 Snapshot Pilot Scheduler.cjs');
 cp.execFileSync(process.execPath,['--check',script],{stdio:'pipe'});
 const source=fs.readFileSync(script,'utf8');
 assert.equal((source.match(/api\('PATCH'/g)||[]).length,1);
 assert.match(source,/recordHash!==record\.recordHash/);
 assert.match(source,/maxPages=20/);
 assert.match(source,/for\(let page=1;page<=maxPages;page\+\+\)/);
 assert.match(source,/Issue inventory exceeds safe pagination bound/);
 assert.doesNotMatch(source,/setInterval|setTimeout|while\s*\(true\)/);
});

test('pilot scheduler workflow is serialized, issue-scoped and minimally permissioned',()=>{
 const file=path.join(process.cwd(),'.github','workflows','MLS R4.3 Snapshot Pilot Scheduler.yml');
 const source=fs.readFileSync(file,'utf8');
 assert.match(source,/issues:\s*\n\s*types: \[opened, edited\]/);
 assert.match(source,/contents: read/);
 assert.match(source,/issues: write/);
 assert.match(source,/group: mls-global-dispatcher/);
 assert.match(source,/MLS_GITHUB_COOLDOWN_FILE/);
 assert.match(source,/actions\/cache\/restore@v4/);
 assert.match(source,/actions\/cache\/save@v4/);
 assert.match(source,/restore-keys: mls-github-cooldown-/);
 assert.match(source,/cancel-in-progress: false/);
 assert.match(source,/MLS_BCR_R43_REQUEST/);
 assert.match(source,/MLS_BCR_R43_RESULT/);
 assert.doesNotMatch(source,/pull-requests: write|contents: write|actions: write/);
});


test('R4.2 cannot lease or synthesize blocks from R4.3 ownership-only reservations',()=>{
 const source=r33Snapshot(50);
 const tagged=reservations.compose(source,{
  reservationIssueNumbers:[11001],
  baseCommit:BASE,contentManifestBlobSha:CONTENT,
  now:Date.parse('2026-09-30T03:34:00.000Z'),
  waveId:'BCR-R43-OWNERSHIP-FENCE',workerCount:5,shardSize:5,
  createdAt:'2026-09-30T03:34:00.000Z'
 }).reservations[0];
 assert.equal(tagged.snapshotFarm.schema,reservations.RESERVATION_SCHEMA);
 assert.equal(tagged.snapshotFarm.ownershipOnly,true);
 assert.deepEqual(elasticR42.blocks(tagged),[]);
 assert.equal(elasticR42.freeBlock([tagged],Date.parse('2026-09-30T03:35:00.000Z')),null);

 const normal=buffered.allocate(source,{
  size:25,issueNumber:11002,requestId:'normal-r42-reservation',
  baseCommit:BASE,contentManifestBlobSha:CONTENT,
  now:Date.parse('2026-09-30T03:34:01.000Z')
 });
 const chosen=elasticR42.freeBlock([tagged,normal],Date.parse('2026-09-30T03:35:00.000Z'));
 assert.equal(chosen.reservation.issueNumber,11002);
 assert.equal(chosen.block.block,1);
});


test('canonical pilot bootstrap is syntactically valid, bounded and crash-resumable',()=>{
 const script=path.join(process.cwd(),'scripts','MLS R4.3 Snapshot Pilot Bootstrap.cjs');
 cp.execFileSync(process.execPath,['--check',script],{stdio:'pipe'});
 const source=fs.readFileSync(script,'utf8');
 assert.match(source,/for\(let slot=1;slot<=4;slot\+\+\)/);
 assert.match(source,/snapshotReservations\.markSnapshotReservation/);
 assert.match(source,/integration\.collectR33Snapshot/);
 assert.match(source,/integration\.projectR33Snapshot/);
 assert.match(source,/writeCount<=10/);
 assert.match(source,/createOrReusePlaceholder/);
 assert.match(source,/R43_BOOT_RESERVATION_BASE_DRIFT/);
 assert.match(source,/R43_BOOT_CHECKOUT_STALE/);
 assert.match(source,/idempotent:true/);
 assert.match(source,/backoff\.check/);
 assert.doesNotMatch(source,/\/git\/refs|\/git\/trees|\/git\/commits/);
 assert.doesNotMatch(source,/Cloudflare|D1|OPENAI|api\.openai/i);
});

test('canonical pilot bootstrap workflow supports plan\/apply and shares the dispatcher mutex',()=>{
 const file=path.join(process.cwd(),'.github','workflows','MLS R4.3 Snapshot Pilot Bootstrap.yml');
 const source=fs.readFileSync(file,'utf8');
 assert.match(source,/workflow_dispatch:/);
 assert.match(source,/options:\s*\n\s*- plan\s*\n\s*- apply/);
 assert.match(source,/APPLY_R43_PILOT_20X5/);
 assert.match(source,/contents: read/);
 assert.match(source,/issues: write/);
 assert.match(source,/group: mls-global-dispatcher/);
 assert.match(source,/cancel-in-progress: false/);
 assert.match(source,/ref: main/);
 assert.match(source,/MLS_R43_BOOTSTRAP_MODE/);
 assert.match(source,/MLS_R43_WAVE_ID/);
 assert.match(source,/MLS_GITHUB_COOLDOWN_FILE/);
 assert.doesNotMatch(source,/contents: write|actions: write|pull-requests: write/);
 assert.match(source,/issues:\s*\n\s*types: \[opened\]/);
 assert.doesNotMatch(source,/schedule:/);
});
