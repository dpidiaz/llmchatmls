'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const farm=require('../MLS R32 EDITORIAL/r4 snapshot farm.cjs');
const store=require('../MLS R32 EDITORIAL/r4 snapshot local store.cjs');
const allocator=require('../MLS R32 EDITORIAL/r4 chat allocator.cjs');
const sync=require('../MLS R32 EDITORIAL/r4 snapshot sync.cjs');
const reservations=require('../MLS R32 EDITORIAL/r4 snapshot reservations.cjs');
const metrics=require('../MLS R32 EDITORIAL/r4 snapshot metrics.cjs');

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
