'use strict';
const crypto=require('node:crypto');

/**
 * MLS R4.3 dedicated-command router.
 *
 * "MLS R43 siguiente" is incremental: a newly created request owns its shard
 * immediately. No worker waits for the wave to reach workerCount before
 * production. Multiple authoritative waves may coexist; routing preserves
 * worker affinity and recovers abandoned legacy/expired claims without overlap.
 */
const farm=require('./r4 snapshot farm.cjs');
const remoteAdmission=require('./r4 snapshot remote admission.cjs');
const remoteResult=require('./r4 snapshot remote result.cjs');
const remoteScheduler=require('./r4 snapshot remote scheduler.cjs');
const takeover=require('./r4 snapshot takeover.cjs');
const waveIssue=require('./r4 snapshot wave issue.cjs');

const ACTIVE=new Set(['collecting','sealed']);

const EMERGENCY_GUIDE='docs/MLS Global Dispatcher/22 R4.3 Worker Command.md#emergency-anti-idle-fallback';
const EMERGENCY_TICKET_SIZE=5;
const EMERGENCY_CORPUS=Object.freeze([
 {prefix:'MLS-V01',count:766},{prefix:'MLS-V02',count:1199},
 {prefix:'MLS-V03',count:810},{prefix:'MLS-V04',count:1159},
 {prefix:'MLS-V05',count:1101},{prefix:'MLS-V06',count:1027},
 {prefix:'MLS-V07',count:1016},{prefix:'MLS-V08',count:1094},
 {prefix:'MLS-V09',count:1031},{prefix:'MLS-V10',count:930}
]);
const EMERGENCY_TOTAL=EMERGENCY_CORPUS.reduce((n,x)=>n+x.count,0);
const EMERGENCY_IDLE_ACTIONS=new Set([
 'no_active_r43_wave','await_seal','takeover_capacity_full','await_reconciliation',
 'request_not_admitted','takeover_retry','takeover_expired','superseded_by_takeover'
]);

function emergencyCodeAt(index){
 let n=((Number(index)%EMERGENCY_TOTAL)+EMERGENCY_TOTAL)%EMERGENCY_TOTAL;
 for(const row of EMERGENCY_CORPUS){
  if(n<row.count)return row.prefix+'-'+String(n+1).padStart(4,'0');
  n-=row.count;
 }
 throw new Error('R43_EMERGENCY_CORPUS_INDEX');
}
function emergencyAudit(seed,{reason='github_control_plane_unavailable'}={}){
 const value=String(seed||crypto.randomUUID());
 const digest=crypto.createHash('sha256').update(value).digest();
 const start=digest.readUInt32BE(0)%EMERGENCY_TOTAL;
 const codes=Array.from({length:EMERGENCY_TICKET_SIZE},(_,i)=>emergencyCodeAt(start+i));
 return {
  backend:'r43',action:'emergency_audit',emergency:true,
  fallbackFrom:reason,
  emergencyTaskId:'R43-AUDIT-'+digest.toString('hex').slice(0,20),
  codes,
  guide:EMERGENCY_GUIDE,
  libraryPool:'/MLS BCR R43/emergency/mls_r43_emergency_pool.zip',
  policy:{
   githubWritesRequired:false,githubCanonical:true,readOnlyAudit:true,
   cloudflareEditorial:false,d1Editorial:false,paidApis:false,
   producedDoesNotMeanVerified:true
  }
 };
}


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
function reconstruct(row,issues){
 const needed=new Set(row.record.reservationIssueNumbers.map(Number));
 const reservationIssues=(issues||[]).filter(i=>needed.has(Number(i.number)));
 assert(reservationIssues.length===needed.size,'R43_COMMAND_RESERVATIONS_INCOMPLETE');
 return remoteScheduler.reconstruct(row.record,reservationIssues);
}
function admissionFor(row,issues,wave,now){
 if(row.record.status==='sealed'){
  remoteAdmission.validateAdmission(row.record.admission,wave);
  return row.record.admission;
 }
 const admission=remoteAdmission.materializeAdmission(wave,issues,{
  waveIssueNumber:row.record.waveIssueNumber,at:now
 });
 remoteAdmission.validateAdmission(admission,wave,{allowPartial:true});
 return admission;
}
function resultRow(issues,wave,admission,requestIssueNumber){
 const issue=(issues||[]).find(i=>Number(i.number)===Number(requestIssueNumber));
 if(!issue||!String(issue.body||'').includes(remoteResult.RESULT_MARKER))return null;
 const delta=remoteResult.decodeResult(issue,wave,admission,{
  allowPartial:admission.assignments.length<wave.workerCount
 });
 return {issue,delta};
}
function runtimeState(row,issues,now){
 const {snapshot,wave}=reconstruct(row,issues);
 const admission=admissionFor(row,issues,wave,now);
 const completed=new Set();
 for(const assignment of admission.assignments){
  if(resultRow(issues,wave,admission,assignment.issueNumber))completed.add(assignment.shardId);
 }
 const winners=takeover.activeWinners(issues,wave,admission,now);
 const recoverable=admission.assignments.filter(a=>
  !completed.has(a.shardId)&&!winners.has(a.shardId)&&
  !remoteAdmission.originalClaimActive(a,now));
 const unassigned=Math.max(0,wave.workerCount-admission.assignments.length);
 return {
  row,snapshot,wave,admission,completed,winners,recoverable,unassigned,
  demand:recoverable.length+unassigned,
  actionableCount:recoverable.length+unassigned
 };
}
function affinityWave(rows,issues,{requestId,requestIssueNumber,takeoverId,takeoverIssueNumber,now}={}){
 const matched=[];
 for(const row of rows){
  const {wave}=reconstruct(row,issues);
  let hit=false;
  if(requestId||requestIssueNumber!=null){
   for(const issue of issues||[]){
    if(requestIssueNumber!=null&&Number(issue.number)!==Number(requestIssueNumber))continue;
    if(!String(issue?.body||'').includes(remoteAdmission.REQUEST_MARKER))continue;
    try{
     const req=remoteAdmission.parseRequest(issue,wave,row.record.waveIssueNumber);
     if((!requestId||req.requestId===requestId)&&
        (requestIssueNumber==null||Number(issue.number)===Number(requestIssueNumber)))hit=true;
    }catch{}
   }
  }
  if(takeoverId||takeoverIssueNumber!=null){
   const admission=admissionFor(row,issues,wave,now);
   for(const t of takeover.rows(issues,wave,admission)){
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
 const runtime=rows.map(row=>runtimeState(row,issues,now));
 runtime.sort((a,b)=>
  b.demand-a.demand ||
  Number(a.row.issue.number)-Number(b.row.issue.number));
 return runtime[0]?.row||null;
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
function baseState(live,state){
 return {
  backend:'r43',
  waveIssueNumber:Number(live.issue.number),
  waveId:state.wave.waveId,
  waveHash:state.wave.waveHash,
  snapshotHash:state.snapshot.snapshotHash,
  status:live.record.status,
  admissionCount:state.admission.assignments.length,
  requiredAdmissionCount:state.wave.workerCount,
  durableResultCount:state.completed.size,
  missingShardIds:state.admission.assignments
   .filter(row=>!state.completed.has(row.shardId))
   .map(row=>row.shardId),
  guide:'docs/MLS Global Dispatcher/22 R4.3 Worker Command.md'
 };
}
function takeoverDecision(base,state){
 const available=state.recoverable[0]||null;
 if(!available)return null;
 return {
  ...base,action:'create_takeover',
  targetShardId:available.shardId,
  targetRequestIssueNumber:Number(available.issueNumber),
  takeoverTtlMs:takeover.DEFAULT_TTL_MS
 };
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

 const state=runtimeState(live,issues,now);
 const {snapshot,wave,admission,completed,winners}=state;
 const base=baseState(live,state);

 if(!requestId&&!takeoverId){
  const recovery=takeoverDecision(base,state);
  if(recovery)return recovery;
  if(live.record.status==='collecting'&&admission.assignments.length<wave.workerCount)
   return {...base,action:'create_request'};
  if(live.record.status==='collecting'){
   if(completed.size===admission.assignments.length)
    return {...base,action:'await_seal'};
   return {...base,action:'takeover_capacity_full'};
  }
  if(completed.size===admission.assignments.length)
   return {...base,action:'await_reconciliation'};
  return {...base,action:'takeover_capacity_full'};
 }

 if(takeoverId){
  assert(/^[A-Za-z0-9._:-]{8,160}$/.test(takeoverId),'R43_COMMAND_TAKEOVER_ID');
  const claimRow=takeover.rowForId(issues,wave,admission,takeoverId);
  if(!claimRow){
   const recovery=takeoverDecision(base,state);
   if(recovery)return {...recovery,takeoverId};
   return {...base,action:'takeover_capacity_full',takeoverId};
  }
  if(takeoverIssueNumber!=null)assert(Number(claimRow.issue.number)===Number(takeoverIssueNumber),
   'R43_COMMAND_TAKEOVER_ISSUE_MISMATCH');
  if(Date.parse(claimRow.claim.expiresAt)<=Date.parse(now))return {
   ...base,action:'takeover_expired',takeoverId,
   takeoverIssueNumber:Number(claimRow.issue.number),
   shardId:claimRow.claim.targetShardId
  };
  const winner=winners.get(claimRow.claim.targetShardId);
  if(!winner||Number(winner.issue.number)!==Number(claimRow.issue.number))return {
   ...base,action:'takeover_retry',takeoverId,
   takeoverIssueNumber:Number(claimRow.issue.number),
   shardId:claimRow.claim.targetShardId
  };
  const assignment=admission.assignments.find(x=>x.shardId===claimRow.claim.targetShardId);
  assert(assignment,'R43_COMMAND_TAKEOVER_ASSIGNMENT');
  const submitted=resultRow(issues,wave,admission,assignment.issueNumber);
  if(submitted)return {
   ...base,action:'result_already_submitted',
   requestId:assignment.requestId,
   requestIssueNumber:Number(assignment.issueNumber),
   takeoverId,takeoverIssueNumber:Number(claimRow.issue.number),
   shardId:assignment.shardId,deltaHash:submitted.delta.deltaHash
  };
  const context=farm.createWorkerContext(snapshot,wave,assignment.shardId);
  farm.validateWorkerContext(snapshot,wave,context);
  return {
   ...base,action:'produce_shard',
   requestId:assignment.requestId,
   requestIssueNumber:Number(assignment.issueNumber),
   takeoverId,takeoverIssueNumber:Number(claimRow.issue.number),
   takeoverExpiresAt:claimRow.claim.expiresAt,
   assignment:structuredClone(assignment),
   workerContext:context
  };
 }

 assert(/^[A-Za-z0-9._:-]{8,160}$/.test(requestId),'R43_COMMAND_REQUEST_ID');
 const requests=requestRows(issues,wave,live.record.waveIssueNumber,requestId);
 assert(requests.length<=1,'R43_COMMAND_REQUEST_DUPLICATE');
 if(!requests.length)return {...base,action:'create_request',requestId};
 const request=requests[0];
 if(requestIssueNumber!=null)assert(Number(request.issue.number)===Number(requestIssueNumber),
  'R43_COMMAND_REQUEST_ISSUE_MISMATCH');
 const assignment=admission.assignments.find(x=>x.requestId===requestId);
 if(!assignment)return {...base,action:'request_not_admitted',requestId,
  requestIssueNumber:Number(request.issue.number)};
 const submitted=resultRow(issues,wave,admission,assignment.issueNumber);
 if(submitted)return {
  ...base,action:'result_already_submitted',requestId,
  requestIssueNumber:Number(assignment.issueNumber),
  shardId:assignment.shardId,deltaHash:submitted.delta.deltaHash
 };
 const takeoverWinner=winners.get(assignment.shardId);
 if(takeoverWinner)return {
  ...base,action:'superseded_by_takeover',requestId,
  requestIssueNumber:Number(assignment.issueNumber),
  shardId:assignment.shardId,
  takeoverIssueNumber:Number(takeoverWinner.issue.number),
  takeoverExpiresAt:takeoverWinner.claim.expiresAt
 };
 const context=farm.createWorkerContext(snapshot,wave,assignment.shardId);
 farm.validateWorkerContext(snapshot,wave,context);
 return {
  ...base,action:'produce_shard',requestId,
  requestIssueNumber:Number(assignment.issueNumber),
  productionClaimExpiresAt:assignment.productionClaimExpiresAt||null,
  assignment:structuredClone(assignment),
  workerContext:context
 };
}

function createRequestEnvelope(issues,{requestId,createdAt,waveIssueNumber=null}){
 const live=activeWave(issues,{waveIssueNumber,now:createdAt});
 assert(live,'R43_COMMAND_NO_ACTIVE_WAVE');
 assert(live.record.status==='collecting','R43_COMMAND_ADMISSION_CLOSED');
 const {wave}=reconstruct(live,issues);
 const admission=remoteAdmission.materializeAdmission(wave,issues,{
  waveIssueNumber:Number(live.issue.number),at:createdAt
 });
 assert(admission.assignments.length<wave.workerCount,'R43_COMMAND_ADMISSION_FULL');
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
 const reconstructed=reconstruct(live,issues);
 const admission=admissionFor(live,issues,reconstructed.wave,now);
 const claim=takeover.create(reconstructed.wave,admission,{
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
 const requestIssue=(issues||[]).find(i=>Number(i.number)===Number(state.requestIssueNumber));
 assert(requestIssue,'R43_COMMAND_REQUEST_ISSUE_MISSING');
 const request=remoteAdmission.parseRequest(requestIssue,wave,state.waveIssueNumber);
 const body=remoteAdmission.renderRequestBody(request)+'\n\n'+remoteResult.renderResultBody(result);
 assert(Buffer.byteLength(body,'utf8')<=remoteResult.MAX_RESULT_BODY_BYTES,'R43_COMMAND_RESULT_BODY_TOO_LARGE');
 return {
  issueNumber:state.requestIssueNumber,
  title:'[MLS BCR R4.3][REQUEST] '+state.requestId,
  body,result,request
 };
}

function routeOrEmergency(issues,options={}){
 const primary=route(issues,options);
 if(!EMERGENCY_IDLE_ACTIONS.has(primary.action))return primary;
 const seed=options.emergencyId||options.requestId||options.takeoverId||
  [primary.waveId||'no-wave',options.now||new Date().toISOString(),crypto.randomUUID()].join(':');
 return {...primary,...emergencyAudit(seed,{reason:primary.action}),
  primaryAction:primary.action};
}

module.exports={
 ACTIVE,EMERGENCY_GUIDE,EMERGENCY_TICKET_SIZE,EMERGENCY_TOTAL,
 authorizedWaveIssues,activeWave,route,routeOrEmergency,emergencyAudit,
 createRequestEnvelope,createTakeoverEnvelope,createResultEnvelope
};
