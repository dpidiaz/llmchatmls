'use strict';

/**
 * MLS BCR R4.3 grouped synchronization planner.
 *
 * Pure planning only: consumes an already reconciled wave plus current GitHub
 * diff information and emits one immutable batch package. No network writes.
 */
const crypto=require('node:crypto');
const farm=require('./r4 snapshot farm.cjs');

const SCHEMA='MLS-BCR-GROUPED-SYNC-1';
const VERSION=1;

function fail(code,msg){const e=new Error(msg||code);e.code=code;e.status=409;throw e;}
function assert(ok,code,msg){if(!ok)fail(code,msg);}
function stable(x){
 if(Array.isArray(x))return '['+x.map(stable).join(',')+']';
 if(x&&typeof x==='object')return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';
 return JSON.stringify(x);
}
function hash(x){return crypto.createHash('sha256').update(stable(x)).digest('hex');}

function buildGroupedSync(wave,deltas,{changedPaths=[],currentHead}={}){
 assert(wave?.schema===farm.WAVE_SCHEMA,'R43_SYNC_WAVE');
 assert(Array.isArray(deltas),'R43_SYNC_DELTAS');
 assert(typeof currentHead==='string'&&/^[0-9a-f]{40}$/i.test(currentHead),'R43_SYNC_HEAD');

 const reconciliation=farm.reconcileWave(wave,deltas);
 assert(reconciliation.complete,'R43_SYNC_WAVE_INCOMPLETE');
 const conflicts=farm.planSyncConflicts(wave,changedPaths);
 assert(conflicts.safe,'R43_SYNC_BASE_CONFLICT');

 const byShard=new Map(deltas.map(d=>[d.shardId,d]));
 const records=[];
 for(const shard of wave.shards){
  const delta=byShard.get(shard.shardId);
  assert(delta,'R43_SYNC_DELTA_MISSING');
  farm.validateDelta(wave,delta);
  for(const unit of shard.units){
   records.push({
    code:unit.code,
    shardId:shard.shardId,
    contentPath:unit.contentPath,
    evidenceArtifactPath:unit.evidenceArtifactPath,
    entry:delta.entries[unit.code],
    checkpoint:delta.checkpoints[unit.code],
    review:delta.reviews[unit.code],
    deltaHash:delta.deltaHash
   });
  }
 }

 const unsigned={
  schema:SCHEMA,
  version:VERSION,
  waveId:wave.waveId,
  waveHash:wave.waveHash,
  snapshotHash:wave.snapshotHash,
  expectedBaseCommit:wave.baseCommit,
  observedCurrentHead:currentHead,
  totalRecords:records.length,
  deltaHashes:wave.shards.map(s=>byShard.get(s.shardId).deltaHash),
  reconciliationHash:reconciliation.reconciliationHash,
  conflictPlan:{
   changedPathCount:conflicts.changedPathCount,
   safe:true
  },
  records
 };
 return {...unsigned,bundleHash:hash(unsigned)};
}

function validateGroupedSync(wave,bundle){
 assert(bundle?.schema===SCHEMA&&bundle.version===VERSION,'R43_SYNC_SCHEMA');
 const unsigned={...bundle};delete unsigned.bundleHash;
 assert(bundle.bundleHash===hash(unsigned),'R43_SYNC_HASH');
 assert(bundle.waveId===wave.waveId&&bundle.waveHash===wave.waveHash,'R43_SYNC_WAVE');
 assert(bundle.snapshotHash===wave.snapshotHash,'R43_SYNC_SNAPSHOT');
 assert(bundle.expectedBaseCommit===wave.baseCommit,'R43_SYNC_BASE');
 assert(bundle.totalRecords===wave.totalUnits,'R43_SYNC_COUNT');
 assert(Array.isArray(bundle.records)&&bundle.records.length===wave.totalUnits,'R43_SYNC_RECORDS');

 const expected=wave.shards.flatMap(s=>s.units.map(u=>({
  code:u.code,shardId:s.shardId,contentPath:u.contentPath,evidenceArtifactPath:u.evidenceArtifactPath
 })));
 for(let i=0;i<expected.length;i++){
  const row=bundle.records[i],e=expected[i];
  assert(row.code===e.code&&row.shardId===e.shardId,'R43_SYNC_ORDER');
  assert(row.contentPath===e.contentPath&&row.evidenceArtifactPath===e.evidenceArtifactPath,'R43_SYNC_PATH');
  assert(row.entry&&row.checkpoint&&row.review,'R43_SYNC_PAYLOAD');
 }
 return true;
}

module.exports={SCHEMA,VERSION,buildGroupedSync,validateGroupedSync};
