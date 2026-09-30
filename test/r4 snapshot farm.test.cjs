'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const farm=require('../MLS R32 EDITORIAL/r4 snapshot farm.cjs');

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
