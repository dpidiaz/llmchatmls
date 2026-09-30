'use strict';

/**
 * MLS BCR R4.3 Chat allocator contract.
 *
 * The state is designed to live in a versioned ChatGPT Library file. External
 * storage must use compare-and-swap (expected version). This module provides the
 * deterministic state transition and an internal revision fence; it does not
 * perform network or GitHub operations.
 */
const crypto=require('node:crypto');
const farm=require('./r4 snapshot farm.cjs');

const SCHEMA='MLS-BCR-CHAT-ALLOCATOR-1';
const VERSION=1;

function fail(code,msg){const e=new Error(msg||code);e.code=code;e.status=409;throw e;}
function assert(ok,code,msg){if(!ok)fail(code,msg);}
function stable(x){
 if(Array.isArray(x))return '['+x.map(stable).join(',')+']';
 if(x&&typeof x==='object')return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';
 return JSON.stringify(x);
}
function hash(x){return crypto.createHash('sha256').update(stable(x)).digest('hex');}
function iso(x){return typeof x==='string'&&!Number.isNaN(Date.parse(x));}
function token(x){return typeof x==='string'&&/^[A-Za-z0-9._:-]{8,160}$/.test(x);}

function seal(unsigned){return {...unsigned,stateHash:hash(unsigned)};}
function createAllocator(wave,{createdAt,claimTtlMs=30*60*1000}){
 assert(wave?.schema===farm.WAVE_SCHEMA,'R43_ALLOC_WAVE');
 assert(iso(createdAt),'R43_ALLOC_CREATED_AT');
 assert(Number.isInteger(claimTtlMs)&&claimTtlMs>=5*60*1000,'R43_ALLOC_TTL');
 return seal({
  schema:SCHEMA,version:VERSION,waveId:wave.waveId,waveHash:wave.waveHash,
  createdAt,claimTtlMs,revision:0,
  shards:wave.shards.map(x=>({shardId:x.shardId,status:'free',claim:null}))
 });
}
function validate(state,wave){
 assert(state?.schema===SCHEMA&&state.version===VERSION,'R43_ALLOC_SCHEMA');
 const unsigned={...state};delete unsigned.stateHash;
 assert(state.stateHash===hash(unsigned),'R43_ALLOC_HASH');
 assert(state.waveId===wave.waveId&&state.waveHash===wave.waveHash,'R43_ALLOC_WAVE');
 assert(Number.isInteger(state.revision)&&state.revision>=0,'R43_ALLOC_REVISION');
 assert(state.shards?.length===wave.shards.length,'R43_ALLOC_SHARDS');
 const ids=new Set();
 for(const [i,row] of state.shards.entries()){
  assert(row.shardId===wave.shards[i].shardId,'R43_ALLOC_ORDER');
  assert(!ids.has(row.shardId),'R43_ALLOC_DUPLICATE');ids.add(row.shardId);
  assert(['free','claimed','completed'].includes(row.status),'R43_ALLOC_STATUS');
  if(row.status==='free')assert(row.claim===null,'R43_ALLOC_FREE_CLAIM');
  else{
   assert(row.claim&&token(row.claim.claimId)&&iso(row.claim.claimedAt),'R43_ALLOC_CLAIM');
   assert(iso(row.claim.expiresAt),'R43_ALLOC_EXPIRY');
   if(row.status==='completed')assert(iso(row.claim.completedAt)&&token(row.claim.deltaHash),'R43_ALLOC_COMPLETE');
  }
 }
 return true;
}
function reap(state,wave,now){
 validate(state,wave);assert(iso(now),'R43_ALLOC_NOW');
 const t=Date.parse(now),next=structuredClone(state);delete next.stateHash;
 let changed=false;
 for(const row of next.shards){
  if(row.status==='claimed'&&Date.parse(row.claim.expiresAt)<=t){
   row.status='free';row.claim=null;changed=true;
  }
 }
 if(!changed)return state;
 next.revision++;
 return seal(next);
}
function claimNext(state,wave,{expectedRevision,claimId,claimedAt}){
 validate(state,wave);
 assert(expectedRevision===state.revision,'R43_ALLOC_STALE_REVISION');
 assert(token(claimId),'R43_ALLOC_CLAIM_ID');
 assert(iso(claimedAt),'R43_ALLOC_CLAIMED_AT');
 const cleaned=reap(state,wave,claimedAt);
 assert(cleaned.revision===expectedRevision || cleaned.revision===expectedRevision+1,'R43_ALLOC_REAP_DRIFT');
 if(cleaned.revision!==expectedRevision){
  fail('R43_ALLOC_RETRY_AFTER_REAP');
 }
 const idx=cleaned.shards.findIndex(x=>x.status==='free');
 if(idx<0)return {state:cleaned,claim:null};
 const next=structuredClone(cleaned);delete next.stateHash;
 const claimedMs=Date.parse(claimedAt);
 next.shards[idx]={
  shardId:next.shards[idx].shardId,status:'claimed',
  claim:{
   claimId,claimedAt,
   expiresAt:new Date(claimedMs+next.claimTtlMs).toISOString()
  }
 };
 next.revision++;
 return {state:seal(next),claim:{
  shardId:next.shards[idx].shardId,
  claimId,
  revision:next.revision
 }};
}
function complete(state,wave,{expectedRevision,shardId,claimId,deltaHash,completedAt}){
 validate(state,wave);
 assert(expectedRevision===state.revision,'R43_ALLOC_STALE_REVISION');
 assert(token(deltaHash),'R43_ALLOC_DELTA_HASH');
 assert(iso(completedAt),'R43_ALLOC_COMPLETED_AT');
 const idx=state.shards.findIndex(x=>x.shardId===shardId);
 assert(idx>=0,'R43_ALLOC_SHARD');
 const row=state.shards[idx];
 assert(row.status==='claimed'&&row.claim?.claimId===claimId,'R43_ALLOC_NOT_OWNER');
 assert(Date.parse(completedAt)<=Date.parse(row.claim.expiresAt),'R43_ALLOC_CLAIM_EXPIRED');
 const next=structuredClone(state);delete next.stateHash;
 next.shards[idx].status='completed';
 next.shards[idx].claim={...next.shards[idx].claim,deltaHash,completedAt};
 next.revision++;
 return seal(next);
}

module.exports={SCHEMA,VERSION,createAllocator,validate,reap,claimNext,complete};
