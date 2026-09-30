'use strict';

/**
 * MLS R4.3 dedicated-command router.
 *
 * Pure decision layer for the user-visible command "MLS R43 siguiente".
 * It never writes to GitHub. Multiple authoritative waves may coexist; routing
 * preserves worker affinity and otherwise chooses the wave with most actionable
 * capacity so stragglers do not block newer waves.
 */
const farm=require('./r4 snapshot farm.cjs');
const remoteAdmission=require('./r4 snapshot remote admission.cjs');
const remoteResult=require('./r4 snapshot remote result.cjs');
const remoteScheduler=require('./r4 snapshot remote scheduler.cjs');
const takeover=require('./r4 snapshot takeover.cjs');
const waveIssue=require('./r4 snapshot wave issue.cjs');

const ACTIVE=new Set(['collecting','sealed']);

function fail(code,msg){const e=new Error(msg||code);e.code=code;e.status=409;throw e;}
function assert(ok,code,msg){if(!ok)fail(code,msg);}

function authorizedWaveIssues(issues){
 const out=[];
 for(const issue of issues||[]){
  if(issue?.state&&issue.state!=='open')continue;
  if(issue?.user?.login!=='github-actions[bot]')continue;
  if(!String(issue.title||'').startsWith('[MLS BCR R4.3][WAVE]['))continue;
  if(!String(issue.body||'').includes(waveIssue.MARKER))continue;
  const record=waveIssue.parse(issue);
  if(ACTIVE.has(record.status))out.push({issue,record});
 }
 return out.sort((a,b)=>Number(a.issue.number)-Number(b.issue.number));
}

function waveRuntime(row,issues,now){
 const reconstructed=reconstruct(row,issues);
 const {snapshot,wave}=reconstructed;
 if(row.record.status==='collecting'){
  const unique=new Set();
  for(const issue of issues||[]){
   if(!String(issue?.body||'').includes(remoteAdmission.REQUEST_MARKER))continue;
   try{
    const req=remoteAdmission.parseRequest(issue,wave,row.record.waveIssueNumber);
    unique.add(req.requestId);
   }catch{}
  }
  return {
   row,snapshot,wave,
   demand:Math.max(0,row.record.workerCount-unique.size),
   requestCount:unique.size,
   completedCount:0,
   actionableCount:Math.max(0,row.record.workerCount-unique.size)
  };
 }
 remoteAdmission.validateAdmission(row.record.admission,wave);
 const completed=new Set();
 for(const assignment of row.record.admission.assignments){
  if(resultRow(issues,wave,row.record.admission,assignment.issueNumber))completed.add(assignment.shardId);
 }
 const winners=takeover.activeWinners(issues,wave,row.record.admission,now);
 const actionable=row.record.admission.assignments.filter(a=>
  !completed.has(a.shardId)&&!winners.has(a.shardId)).length;
 return {
  row,snapshot,wave,
  demand:actionable,
  requestCount:row.record.admission.assignments.length,
  completedCount:completed.size,
  actionableCount:actionable
 };
}
function affinityWave(rows,issues,{requestId,requestIssueNumber,takeoverId,takeoverIssueNumber,now}={}){
 const matched=[];
 for(const row of rows){
  const {wave}=reconstruct(row,issues);
  let hit=false;
  if(requestId||requestIssueNumber!=null){
   if(row.record.status==='collecting'){
    for(const issue of issues||[]){
     if(requestIssueNumber!=null&&Number(issue.number)!==Number(requestIssueNumber))continue;
     if(!String(issue?.body||'').includes(remoteAdmission.REQUEST_MARKER))continue;
     try{
      const req=remoteAdmission.parseRequest(issue,wave,row.record.waveIssueNumber);
      if((!requestId||req.requestId===requestId)&&
         (requestIssueNumber==null||Number(issue.number)===Number(requestIssueNumber)))hit=true;
     }catch{}
    }
   }else{
    const a=row.record.admission?.assignments||[];
    if(a.some(x=>(!requestId||x.requestId===requestId)&&
      (requestIssueNumber==null||Number(x.issueNumber)===Number(requestIssueNumber))))hit=true;
   }
  }
  if((takeoverId||takeoverIssueNumber!=null)&&row.record.status==='sealed'){
   for(const t of takeover.rows(issues,wave,row.record.admission)){
    if((!takeoverId||t.claim.takeoverId===takeoverId)&&
       (takeoverIssueNumber==null||Number(t.issue.number)===Number(takeoverIssueNumber)))hit=true;
   }
  }
  if(hit)matched.push(row);
 }
 assert(matched.length<=1,'R43_COMMAND_WAVE_AFFINITY',
  'Worker identity matches more than one authoritative R4.3 wave.');
 return matched[0]||null;
}
function activeWave(issues,options={}){
 const rows=authorizedWaveIssues(issues);
 if(!rows.length)return null;
 if(options.waveIssueNumber!=null){
  const exact=rows.filter(x=>Number(x.issue.number)===Number(options.waveIssueNumber));
  assert(exact.length<=1,'R43_COMMAND_WAVE_ISSUE_DUP');
  if(exact.length)return exact[0];
 }
 const affinity=affinityWave(rows,issues,options);
 if(affinity)return affinity;
 const now=options.now||new Date().toISOString();
 const runtime=rows.map(row=>waveRuntime(row,issues,now));
 runtime.sort((a,b)=>
  b.demand-a.demand ||
  Number(a.row.issue.number)-Number(b.row.issue.number));
 return runtime[0]?.row||null;
}

function reconstruct(row,issues){
 const needed=new Set(row.record.reservationIssueNumbers.map(Number));
 const reservationIssues=(issues||[]).filter(i=>needed.has(Number(i.number)));
 assert(reservationIssues.length===needed.size,'R43_COMMAND_RESERVATIONS_INCOMPLETE');
 return remoteScheduler.reconstruct(row.record,reservationIssues);
}

function requestRows(issues,wave,waveIssueNumber,requestId){
 const rows=[];
 for(const issue of issues||[]){
  if(!String(issue?.body||'').includes(remoteAdmission.REQUEST_MARKER))continue;
  let request;try{request=remoteAdmission.parseRequest(issue,wave,waveIssueNumber);}catch{continue;}
  if(request.requestId===requestId)rows.push({issue,request});
 }
 rows.sort((a,b)=>Number(a.issue.number)-Number(b.issue.number));
 return rows;
}

function resultRow(issues,wave,admission,requestIssueNumber){
 const issue=(issues||[]).find(i=>Number(i.number)===Number(requestIssueNumber));
 if(!issue||!String(issue.body||'').includes(remoteResult.RESULT_MARKER))return null;
 const delta=remoteResult.decodeResult(issue,wave,admission);
 return {issue,delta};
}

function route(issues,{
 requestId=null,requestIssueNumber=null,
 takeoverId=null,takeoverIssueNumber=null,
 waveIssueNumber=null,
 now=new Date().toISOString()
}={}){
 const live=activeWave(issues,{requestId,requestIssueNumber,takeoverId,takeoverIssueNumber,waveIssueNumber,now});
 if(!live)return {
  backend:'r43',
  action:'no_active_r43_wave',
  guide:'docs/MLS Global Dispatcher/22 R4.3 Worker Command.md'
 };

 assert(live.record.route==='remote','R43_COMMAND_ROUTE_NOT_LIVE',
  'Only the certified remote wave route can handle MLS R43 siguiente.');
 const {snapshot,wave}=reconstruct(live,issues);
 const base={
  backend:'r43',
  waveIssueNumber:Number(live.issue.number),
  waveId:wave.waveId,
  waveHash:wave.waveHash,
  snapshotHash:snapshot.snapshotHash,
  status:live.record.status,
  guide:'docs/MLS Global Dispatcher/22 R4.3 Worker Command.md'
 };

 if(live.record.status==='collecting'){
  if(takeoverId)return {...base,action:'takeover_not_available'};
  if(!requestId)return {...base,action:'create_request'};
  assert(/^[A-Za-z0-9._:-]{8,160}$/.test(requestId),'R43_COMMAND_REQUEST_ID');
  const requests=requestRows(issues,wave,live.record.waveIssueNumber,requestId);
  assert(requests.length<=1,'R43_COMMAND_REQUEST_DUPLICATE');
  if(!requests.length)return {...base,action:'create_request',requestId};
  const request=requests[0];
  if(requestIssueNumber!=null)assert(Number(request.issue.number)===Number(requestIssueNumber),
   'R43_COMMAND_REQUEST_ISSUE_MISMATCH');
  return {
   ...base,action:'await_admission',requestId,
   requestIssueNumber:Number(request.issue.number)
  };
 }

 remoteAdmission.validateAdmission(live.record.admission,wave);
 const admission=live.record.admission;
 const winners=takeover.activeWinners(issues,wave,admission,now);
 const completed=new Set();
 for(const row of admission.assignments){
  if(resultRow(issues,wave,admission,row.issueNumber))completed.add(row.shardId);
 }
 const sealedBase={
  ...base,
  admissionCount:admission.assignments.length,
  durableResultCount:completed.size,
  missingShardIds:admission.assignments
   .filter(row=>!completed.has(row.shardId))
   .map(row=>row.shardId)
 };

 if(!requestId&&!takeoverId){
  const available=admission.assignments.find(row=>
   !completed.has(row.shardId)&&!winners.has(row.shardId));
  if(!available){
   if(completed.size===admission.assignments.length)
    return {...sealedBase,action:'await_reconciliation'};
   return {...sealedBase,action:'takeover_capacity_full'};
  }
  return {
   ...sealedBase,action:'create_takeover',
   targetShardId:available.shardId,
   targetRequestIssueNumber:Number(available.issueNumber),
   takeoverTtlMs:takeover.DEFAULT_TTL_MS
  };
 }

 if(takeoverId){
  assert(/^[A-Za-z0-9._:-]{8,160}$/.test(takeoverId),'R43_COMMAND_TAKEOVER_ID');
  const claimRow=takeover.rowForId(issues,wave,admission,takeoverId);
  if(!claimRow){
   const available=admission.assignments.find(row=>
    !completed.has(row.shardId)&&!winners.has(row.shardId));
   if(!available)return {...sealedBase,action:'takeover_capacity_full',takeoverId};
   return {
    ...sealedBase,action:'create_takeover',takeoverId,
    targetShardId:available.shardId,
    targetRequestIssueNumber:Number(available.issueNumber),
    takeoverTtlMs:takeover.DEFAULT_TTL_MS
   };
  }
  if(takeoverIssueNumber!=null)assert(Number(claimRow.issue.number)===Number(takeoverIssueNumber),
   'R43_COMMAND_TAKEOVER_ISSUE_MISMATCH');
  if(Date.parse(claimRow.claim.expiresAt)<=Date.parse(now))return {
   ...sealedBase,action:'takeover_expired',takeoverId,
   takeoverIssueNumber:Number(claimRow.issue.number),
   shardId:claimRow.claim.targetShardId
  };
  const winner=winners.get(claimRow.claim.targetShardId);
  if(!winner||Number(winner.issue.number)!==Number(claimRow.issue.number))return {
   ...sealedBase,action:'takeover_retry',takeoverId,
   takeoverIssueNumber:Number(claimRow.issue.number),
   shardId:claimRow.claim.targetShardId
  };
  const assignment=admission.assignments.find(x=>x.shardId===claimRow.claim.targetShardId);
  assert(assignment,'R43_COMMAND_TAKEOVER_ASSIGNMENT');
  const submitted=resultRow(issues,wave,admission,assignment.issueNumber);
  if(submitted)return {
   ...sealedBase,action:'result_already_submitted',
   requestId:assignment.requestId,
   requestIssueNumber:Number(assignment.issueNumber),
   takeoverId,takeoverIssueNumber:Number(claimRow.issue.number),
   shardId:assignment.shardId,deltaHash:submitted.delta.deltaHash
  };
  const context=farm.createWorkerContext(snapshot,wave,assignment.shardId);
  farm.validateWorkerContext(snapshot,wave,context);
  return {
   ...sealedBase,action:'produce_shard',
   requestId:assignment.requestId,
   requestIssueNumber:Number(assignment.issueNumber),
   takeoverId,takeoverIssueNumber:Number(claimRow.issue.number),
   takeoverExpiresAt:claimRow.claim.expiresAt,
   assignment:structuredClone(assignment),
   workerContext:context
  };
 }

 assert(/^[A-Za-z0-9._:-]{8,160}$/.test(requestId),'R43_COMMAND_REQUEST_ID');
 const assignment=admission.assignments.find(x=>x.requestId===requestId);
 if(!assignment)return {...sealedBase,action:'request_not_admitted',requestId};
 if(requestIssueNumber!=null)assert(Number(assignment.issueNumber)===Number(requestIssueNumber),
  'R43_COMMAND_REQUEST_ISSUE_MISMATCH');
 const requestIssue=(issues||[]).find(i=>Number(i.number)===Number(assignment.issueNumber));
 assert(requestIssue,'R43_COMMAND_REQUEST_ISSUE_MISSING');
 const submitted=resultRow(issues,wave,admission,assignment.issueNumber);
 if(submitted)return {
  ...sealedBase,action:'result_already_submitted',requestId,
  requestIssueNumber:Number(assignment.issueNumber),
  shardId:assignment.shardId,
  deltaHash:submitted.delta.deltaHash
 };
 const takeoverWinner=winners.get(assignment.shardId);
 if(takeoverWinner)return {
  ...sealedBase,action:'superseded_by_takeover',requestId,
  requestIssueNumber:Number(assignment.issueNumber),
  shardId:assignment.shardId,
  takeoverIssueNumber:Number(takeoverWinner.issue.number),
  takeoverExpiresAt:takeoverWinner.claim.expiresAt
 };
 const original=remoteAdmission.parseRequest(requestIssue,wave,live.record.waveIssueNumber);
 assert(original.requestId===requestId,'R43_COMMAND_ADMISSION_REQUEST_DRIFT');

 const context=farm.createWorkerContext(snapshot,wave,assignment.shardId);
 farm.validateWorkerContext(snapshot,wave,context);
 return {
  ...sealedBase,action:'produce_shard',requestId,
  requestIssueNumber:Number(requestIssue.number),
  assignment:structuredClone(assignment),
  workerContext:context
 };
}

function createRequestEnvelope(issues,{requestId,createdAt,waveIssueNumber=null}){
 const live=activeWave(issues,{waveIssueNumber,now:createdAt});
 assert(live,'R43_COMMAND_NO_ACTIVE_WAVE');
 assert(live.record.status==='collecting','R43_COMMAND_ADMISSION_CLOSED');
 const {wave}=reconstruct(live,issues);
 const request=remoteAdmission.createRequest(wave,{
  waveIssueNumber:Number(live.issue.number),requestId,createdAt
 });
 return {
  title:'[MLS BCR R4.3][REQUEST] '+requestId,
  body:remoteAdmission.renderRequestBody(request),
  request
 };
}

function createTakeoverEnvelope(issues,{takeoverId,claimedAt,now=claimedAt}){
 const state=route(issues,{takeoverId,now});
 assert(state.action==='create_takeover','R43_COMMAND_TAKEOVER_NOT_READY');
 const live=authorizedWaveIssues(issues).find(x=>Number(x.issue.number)===Number(state.waveIssueNumber));
 assert(live,'R43_COMMAND_WAVE_NOT_FOUND');
 const {wave}=reconstruct(live,issues);
 const claim=takeover.create(wave,live.record.admission,{
  waveIssueNumber:state.waveIssueNumber,
  takeoverId,
  targetShardId:state.targetShardId,
  targetRequestIssueNumber:state.targetRequestIssueNumber,
  claimedAt
 });
 return {
  title:'[MLS BCR R4.3][TAKEOVER] '+takeoverId,
  body:takeover.renderBody(claim),
  claim
 };
}

function createResultEnvelope(issues,{
 requestId=null,requestIssueNumber=null,
 takeoverId=null,takeoverIssueNumber=null,
 delta,now=new Date().toISOString()
}){
 const state=route(issues,{requestId,requestIssueNumber,takeoverId,takeoverIssueNumber,now});
 assert(state.action==='produce_shard','R43_COMMAND_RESULT_NOT_READY');
 assert(delta?.shardId===state.assignment.shardId,'R43_COMMAND_RESULT_WRONG_SHARD');
 const live=authorizedWaveIssues(issues).find(x=>Number(x.issue.number)===Number(state.waveIssueNumber));
 assert(live,'R43_COMMAND_WAVE_NOT_FOUND');
 const {wave}=reconstruct(live,issues);
 farm.validateDelta(wave,delta);
 const result=remoteResult.encodeDelta(wave,delta,{waveIssueNumber:state.waveIssueNumber});
 return {
  issueNumber:state.requestIssueNumber,
  title:'[MLS BCR R4.3][RESULT] '+state.requestId,
  body:remoteResult.renderResultBody(result),
  result
 };
}

module.exports={
 ACTIVE,authorizedWaveIssues,activeWave,route,
 createRequestEnvelope,createTakeoverEnvelope,createResultEnvelope
};
