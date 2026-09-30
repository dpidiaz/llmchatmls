'use strict';

/**
 * MLS BCR R4.3 pilot metrics and advancement gate.
 * Pure evaluation: no GitHub/ChatGPT side effects.
 */
const farm=require('./r4 snapshot farm.cjs');

function fail(code,msg){const e=new Error(msg||code);e.code=code;e.status=409;throw e;}
function assert(ok,code,msg){if(!ok)fail(code,msg);}
function n(x,name){assert(Number.isFinite(Number(x))&&Number(x)>=0,'R43_METRIC_'+name);return Number(x);}
function pct(a,b){return b?Number((100*a/b).toFixed(2)):0;}
function percentile(values,p){
 if(!values.length)return null;
 const sorted=[...values].sort((a,b)=>a-b);
 const i=Math.min(sorted.length-1,Math.max(0,Math.ceil(p*sorted.length)-1));
 return sorted[i];
}

function evaluate(wave,{
 entriesAttempted,
 durableDeltas,
 acceptedDuplicateOwnership=0,
 allocatorCasConflicts=0,
 lostAcceptedDeltas=0,
 r33FirstPassSuccesses=0,
 r33Repairs=0,
 unresolvedR33Failures=0,
 githubWritesDuringProduction=0,
 githubInitializationWrites=0,
 githubSyncWrites=0,
 r33ValidatorBypasses=0,
 overwrittenBaseConflicts=0,
 shardDurationsSeconds=[]
}={}){
 assert(wave?.schema===farm.WAVE_SCHEMA,'R43_METRIC_WAVE');
 const total=wave.totalUnits;
 const attempted=n(entriesAttempted,'ATTEMPTED');
 const durable=n(durableDeltas,'DURABLE');
 const duplicates=n(acceptedDuplicateOwnership,'DUPLICATES');
 const cas=n(allocatorCasConflicts,'CAS');
 const lost=n(lostAcceptedDeltas,'LOST');
 const first=n(r33FirstPassSuccesses,'R33_FIRST');
 const repairs=n(r33Repairs,'R33_REPAIRS');
 const unresolved=n(unresolvedR33Failures,'R33_UNRESOLVED');
 const workerWrites=n(githubWritesDuringProduction,'WORKER_WRITES');
 const initWrites=n(githubInitializationWrites,'INIT_WRITES');
 const syncWrites=n(githubSyncWrites,'SYNC_WRITES');
 const bypasses=n(r33ValidatorBypasses,'R33_BYPASS');
 const overwrites=n(overwrittenBaseConflicts,'BASE_OVERWRITE');
 assert(Array.isArray(shardDurationsSeconds)&&shardDurationsSeconds.every(x=>Number.isFinite(Number(x))&&Number(x)>=0),'R43_METRIC_DURATIONS');
 const durations=shardDurationsSeconds.map(Number);

 const blockers=[];
 if(attempted!==total)blockers.push('INCOMPLETE_ATTEMPT_COUNT');
 if(durable!==total)blockers.push('INCOMPLETE_DURABLE_COUNT');
 if(duplicates!==0)blockers.push('DUPLICATE_OWNERSHIP_ACCEPTED');
 if(lost!==0)blockers.push('LOST_ACCEPTED_DELTA');
 if(workerWrites!==0)blockers.push('GITHUB_WORKER_HOT_PATH_WRITE');
 if(bypasses!==0)blockers.push('R33_VALIDATOR_BYPASS');
 if(overwrites!==0)blockers.push('BASE_CONFLICT_OVERWRITTEN');
 if(unresolved!==0)blockers.push('UNRESOLVED_R33_FAILURE');
 if(first+repairs<total)blockers.push('R33_ACCOUNTING_INCOMPLETE');

 const mean=durations.length?durations.reduce((a,b)=>a+b,0)/durations.length:null;
 return {
  schema:'MLS-BCR-R43-PILOT-METRICS-1',
  waveId:wave.waveId,
  waveHash:wave.waveHash,
  totalEntries:total,
  entriesAttempted:attempted,
  durableDeltas:durable,
  allocatorCasConflicts:cas,
  acceptedDuplicateOwnership:duplicates,
  lostAcceptedDeltas:lost,
  r33:{
   firstPassSuccesses:first,
   repairs,
   unresolvedFailures:unresolved,
   firstPassRatePct:pct(first,total),
   repairRatePct:pct(repairs,total),
   validatorBypasses:bypasses
  },
  github:{
   workerProductionWrites:workerWrites,
   initializationWrites:initWrites,
   syncWrites,
   writesPerEntry:Number(((initWrites+syncWrites+workerWrites)/total).toFixed(4))
  },
  timing:{
   observedShards:durations.length,
   meanShardSeconds:mean===null?null:Number(mean.toFixed(2)),
   p95ShardSeconds:percentile(durations,0.95)
  },
  overwrittenBaseConflicts:overwrites,
  blockers,
  advancementAllowed:blockers.length===0
 };
}

module.exports={evaluate};
