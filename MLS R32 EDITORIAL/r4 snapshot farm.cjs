'use strict';

/**
 * MLS BCR R4.3 Snapshot Farm contracts.
 *
 * Purpose:
 * - freeze one immutable GitHub-derived snapshot;
 * - preassign disjoint shards before chat workers start;
 * - let workers produce append-only deltas without GitHub in the hot path;
 * - reconcile and batch-sync later.
 *
 * This module is additive. It does not allocate from live GitHub state, mutate
 * reservations, certify R33, merge to main or deploy.
 */
const base=require('./r4 buffered core.cjs');

const VERSION=1;
const SNAPSHOT_SCHEMA='MLS-BCR-SNAPSHOT-1';
const WAVE_SCHEMA='MLS-BCR-WAVE-1';
const DELTA_SCHEMA='MLS-BCR-DELTA-1';

function fail(code,msg){
 const e=new Error(msg||code);e.code=code;e.status=409;throw e;
}
function assert(ok,code,msg){if(!ok)fail(code,msg);}
function shaLike(x){return typeof x==='string'&&/^[0-9a-f]{40,64}$/i.test(x);}
function iso(x){return typeof x==='string'&&!Number.isNaN(Date.parse(x));}
function codeLike(x){return typeof x==='string'&&/^MLS-V\d+-\d{4,}$/.test(x);}
function stableHash(value){return base.hash(value);}

function normalizeUnit(unit,index){
 assert(unit&&typeof unit==='object','R43_UNIT_INVALID');
 assert(codeLike(unit.code),'R43_UNIT_CODE');
 assert(typeof unit.language==='string'&&unit.language.length>0,'R43_UNIT_LANGUAGE');
 assert(typeof unit.contentPath==='string'&&unit.contentPath.length>0,'R43_UNIT_CONTENT_PATH');
 assert(typeof unit.evidenceArtifactPath==='string'&&unit.evidenceArtifactPath.length>0,'R43_UNIT_EVIDENCE_PATH');
 return {
  ordinal:index+1,
  code:unit.code,
  language:unit.language,
  contentPath:unit.contentPath,
  evidenceArtifactPath:unit.evidenceArtifactPath
 };
}

function createSnapshot({baseCommit,contentManifestBlobSha,units,createdAt,source='github'}){
 assert(shaLike(baseCommit),'R43_BASE_COMMIT');
 assert(shaLike(contentManifestBlobSha),'R43_CONTENT_MANIFEST_SHA');
 assert(Array.isArray(units)&&units.length>0,'R43_UNITS_EMPTY');
 assert(iso(createdAt),'R43_CREATED_AT');
 assert(source==='github','R43_SNAPSHOT_SOURCE');
 const normalized=units.map(normalizeUnit);
 assert(new Set(normalized.map(x=>x.code)).size===normalized.length,'R43_DUPLICATE_CODE');
 const unsigned={
  schema:SNAPSHOT_SCHEMA,
  version:VERSION,
  source,
  baseCommit,
  contentManifestBlobSha,
  createdAt,
  units:normalized
 };
 return {...unsigned,snapshotHash:stableHash(unsigned)};
}

function validateSnapshot(snapshot){
 assert(snapshot?.schema===SNAPSHOT_SCHEMA&&snapshot.version===VERSION,'R43_SNAPSHOT_SCHEMA');
 const expected=snapshot.snapshotHash;
 const unsigned={...snapshot};delete unsigned.snapshotHash;
 assert(expected===stableHash(unsigned),'R43_SNAPSHOT_HASH');
 assert(shaLike(snapshot.baseCommit),'R43_BASE_COMMIT');
 assert(shaLike(snapshot.contentManifestBlobSha),'R43_CONTENT_MANIFEST_SHA');
 assert(iso(snapshot.createdAt),'R43_CREATED_AT');
 assert(Array.isArray(snapshot.units)&&snapshot.units.length>0,'R43_UNITS_EMPTY');
 const seen=new Set();
 snapshot.units.forEach((u,i)=>{
  const normalized=normalizeUnit({...u},i);
  assert(u.ordinal===normalized.ordinal,'R43_UNIT_ORDINAL');
  assert(!seen.has(u.code),'R43_DUPLICATE_CODE');seen.add(u.code);
 });
 return true;
}

function createWave(snapshot,{waveId,workerCount=20,shardSize=5,createdAt}){
 validateSnapshot(snapshot);
 assert(typeof waveId==='string'&&/^[A-Za-z0-9._:-]{3,120}$/.test(waveId),'R43_WAVE_ID');
 assert(Number.isInteger(workerCount)&&workerCount>0&&workerCount<=100,'R43_WORKER_COUNT');
 assert(Number.isInteger(shardSize)&&shardSize>0&&shardSize<=25,'R43_SHARD_SIZE');
 assert(iso(createdAt),'R43_WAVE_CREATED_AT');
 const needed=workerCount*shardSize;
 assert(snapshot.units.length>=needed,'R43_SNAPSHOT_CAPACITY');
 const selected=snapshot.units.slice(0,needed);
 const shards=[];
 for(let i=0;i<workerCount;i++){
  const units=selected.slice(i*shardSize,(i+1)*shardSize);
  shards.push({
   shardId:'W'+String(i+1).padStart(4,'0'),
   ordinal:i+1,
   codes:units.map(x=>x.code),
   units
  });
 }
 const unsigned={
  schema:WAVE_SCHEMA,
  version:VERSION,
  waveId,
  createdAt,
  snapshotHash:snapshot.snapshotHash,
  baseCommit:snapshot.baseCommit,
  contentManifestBlobSha:snapshot.contentManifestBlobSha,
  workerCount,
  shardSize,
  totalUnits:needed,
  shards
 };
 return {...unsigned,waveHash:stableHash(unsigned)};
}

function validateWave(snapshot,wave){
 validateSnapshot(snapshot);
 assert(wave?.schema===WAVE_SCHEMA&&wave.version===VERSION,'R43_WAVE_SCHEMA');
 const unsigned={...wave};delete unsigned.waveHash;
 assert(wave.waveHash===stableHash(unsigned),'R43_WAVE_HASH');
 assert(wave.snapshotHash===snapshot.snapshotHash,'R43_WAVE_SNAPSHOT_MISMATCH');
 assert(wave.baseCommit===snapshot.baseCommit,'R43_WAVE_BASE_MISMATCH');
 assert(Number.isInteger(wave.workerCount)&&wave.workerCount===wave.shards?.length,'R43_WAVE_WORKERS');
 assert(Number.isInteger(wave.shardSize)&&wave.shardSize>0,'R43_WAVE_SHARD_SIZE');
 assert(wave.totalUnits===wave.workerCount*wave.shardSize,'R43_WAVE_TOTAL');
 const shardIds=new Set(),codes=new Set(),snapshotCodes=new Set(snapshot.units.map(x=>x.code));
 for(const [i,shard] of wave.shards.entries()){
  assert(shard.shardId==='W'+String(i+1).padStart(4,'0'),'R43_SHARD_ID');
  assert(shard.ordinal===i+1,'R43_SHARD_ORDINAL');
  assert(Array.isArray(shard.codes)&&shard.codes.length===wave.shardSize,'R43_SHARD_CODES');
  assert(Array.isArray(shard.units)&&shard.units.length===wave.shardSize,'R43_SHARD_UNITS');
  assert(!shardIds.has(shard.shardId),'R43_DUPLICATE_SHARD');shardIds.add(shard.shardId);
  for(const code of shard.codes){
   assert(snapshotCodes.has(code),'R43_CODE_NOT_IN_SNAPSHOT');
   assert(!codes.has(code),'R43_CODE_OVERLAP');codes.add(code);
  }
  assert(shard.units.every((u,n)=>u.code===shard.codes[n]),'R43_SHARD_UNIT_DRIFT');
 }
 return true;
}

function createDelta(wave,{shardId,entries,checkpoints,reviews,completedAt}){
 assert(wave?.schema===WAVE_SCHEMA,'R43_WAVE_REQUIRED');
 const shard=wave.shards?.find(x=>x.shardId===shardId);
 assert(shard,'R43_SHARD_UNKNOWN');
 assert(iso(completedAt),'R43_DELTA_COMPLETED_AT');
 for(const [name,value] of Object.entries({entries,checkpoints,reviews})){
  assert(value&&typeof value==='object'&&!Array.isArray(value),'R43_DELTA_'+name.toUpperCase());
  assert(Object.keys(value).length===shard.codes.length,'R43_DELTA_'+name.toUpperCase()+'_COUNT');
  assert(Object.keys(value).every(code=>shard.codes.includes(code)),'R43_DELTA_'+name.toUpperCase()+'_SCOPE');
 }
 const unsigned={
  schema:DELTA_SCHEMA,
  version:VERSION,
  waveId:wave.waveId,
  waveHash:wave.waveHash,
  snapshotHash:wave.snapshotHash,
  baseCommit:wave.baseCommit,
  shardId,
  codes:[...shard.codes],
  completedAt,
  entries,
  checkpoints,
  reviews
 };
 return {...unsigned,deltaHash:stableHash(unsigned)};
}

function validateDelta(wave,delta){
 assert(delta?.schema===DELTA_SCHEMA&&delta.version===VERSION,'R43_DELTA_SCHEMA');
 const unsigned={...delta};delete unsigned.deltaHash;
 assert(delta.deltaHash===stableHash(unsigned),'R43_DELTA_HASH');
 assert(delta.waveId===wave.waveId&&delta.waveHash===wave.waveHash,'R43_DELTA_WAVE');
 assert(delta.snapshotHash===wave.snapshotHash&&delta.baseCommit===wave.baseCommit,'R43_DELTA_SNAPSHOT');
 const shard=wave.shards?.find(x=>x.shardId===delta.shardId);
 assert(shard,'R43_SHARD_UNKNOWN');
 assert(JSON.stringify(delta.codes)===JSON.stringify(shard.codes),'R43_DELTA_CODES');
 for(const name of ['entries','checkpoints','reviews']){
  assert(delta[name]&&typeof delta[name]==='object'&&!Array.isArray(delta[name]),'R43_DELTA_'+name.toUpperCase());
  assert(Object.keys(delta[name]).length===shard.codes.length,'R43_DELTA_'+name.toUpperCase()+'_COUNT');
  assert(shard.codes.every(code=>Object.prototype.hasOwnProperty.call(delta[name],code)),'R43_DELTA_'+name.toUpperCase()+'_MISSING');
 }
 return true;
}

function reconcileWave(wave,deltas){
 assert(wave?.schema===WAVE_SCHEMA,'R43_WAVE_REQUIRED');
 assert(Array.isArray(deltas),'R43_DELTAS_ARRAY');
 const byShard=new Map(),codeOwner=new Map(),conflicts=[];
 for(const delta of deltas){
  validateDelta(wave,delta);
  if(byShard.has(delta.shardId)){
   conflicts.push({type:'duplicate-shard',shardId:delta.shardId,
    deltaHashes:[byShard.get(delta.shardId).deltaHash,delta.deltaHash]});
   continue;
  }
  byShard.set(delta.shardId,delta);
  for(const code of delta.codes){
   if(codeOwner.has(code))conflicts.push({type:'duplicate-code',code,
    shardIds:[codeOwner.get(code),delta.shardId]});
   else codeOwner.set(code,delta.shardId);
  }
 }
 const completedShards=[...byShard.keys()].sort();
 const missingShards=wave.shards.map(x=>x.shardId).filter(x=>!byShard.has(x));
 const unsigned={
  schema:'MLS-BCR-WAVE-RECONCILIATION-1',
  waveId:wave.waveId,
  waveHash:wave.waveHash,
  completedShards,
  missingShards,
  completedUnits:[...codeOwner.keys()].sort(),
  conflicts,
  deltaHashes:completedShards.map(id=>byShard.get(id).deltaHash)
 };
 return {...unsigned,reconciliationHash:stableHash(unsigned),
  complete:missingShards.length===0&&conflicts.length===0};
}

module.exports={
 VERSION,SNAPSHOT_SCHEMA,WAVE_SCHEMA,DELTA_SCHEMA,
 createSnapshot,validateSnapshot,createWave,validateWave,
 createDelta,validateDelta,reconcileWave
};
