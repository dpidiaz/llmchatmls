'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');

const command=require('../MLS R32 EDITORIAL/r4 snapshot command.cjs');
const farm=require('../MLS R32 EDITORIAL/r4 snapshot farm.cjs');
const reservations=require('../MLS R32 EDITORIAL/r4 snapshot reservations.cjs');
const buffered=require('../MLS R32 EDITORIAL/r4 buffered allocation.cjs');
const remoteScheduler=require('../MLS R32 EDITORIAL/r4 snapshot remote scheduler.cjs');
const waveIssue=require('../MLS R32 EDITORIAL/r4 snapshot wave issue.cjs');

const BASE='a'.repeat(40),CONTENT='b'.repeat(40);

function source(n=100,start=3000){
 const entries=Array.from({length:n},(_,i)=>{
  const code='MLS-V10-'+String(start+i).padStart(4,'0');
  return {order:i+1,code,language:'espanol-guatemala',
   contentPath:'content/espanol-guatemala/'+code+'.json'};
 });
 return {
  pool:{poolId:'MLS-R33-FULL-CORPUS-CONTINUATION',manifestVersion:'1.0',
   status:'authorized',active:true,sourceOfTruth:'github',
   cloudflareEditorialAllowed:false,d1EditorialAllowed:false,
   execution:{defaultClaimSize:5,maxClaimSize:10},entries},
  ledger:{poolId:'MLS-R33-FULL-CORPUS-CONTINUATION',
   manifestVersion:'1.0',verified:[],exceptions:[]},
  batches:[],reservedCodes:[]
 };
}
function reservationIssue(r){
 return {number:r.issueNumber,state:'open',title:'[MLS Buffered][RESERVED] '+r.allocation.assignmentId,
  author_association:'OWNER',user:{login:'github-actions[bot]'},body:buffered.renderReservation(r)};
}
function payload(context){
 const entries={},checkpoints={},reviews={};
 for(const code of context.codes){
  entries[code]={code,status:'PRODUCED',claims:[{claimId:'claim-'+code}]};
  checkpoints[code]={code,assessment:'PENDING_CANONICAL_R33_VALIDATION'};
  reviews[code]={code,reviewType:'ai',claims:[{verdict:'supported'}]};
 }
 return {entries,checkpoints,reviews};
}

test('MLS R43 siguiente starts every worker immediately before the wave seals',()=>{
 const composed=reservations.compose(source(),{
  reservationIssueNumbers:[13001,13002,13003,13004],
  baseCommit:BASE,contentManifestBlobSha:CONTENT,
  now:Date.parse('2026-09-30T08:00:00.000Z'),
  waveId:'BCR-R43-COMMAND-E2E-20X5',workerCount:20,shardSize:5,
  createdAt:'2026-09-30T08:00:00.000Z'
 });
 const record=waveIssue.create({
  waveIssueNumber:13005,reservationIssueNumbers:[13001,13002,13003,13004],
  snapshot:composed.snapshot,wave:composed.wave,
  createdAt:'2026-09-30T08:01:00.000Z',route:'remote'
 });
 const reservationIssues=composed.reservations.map(reservationIssue);
 const collectingControl={number:13005,state:'open',user:{login:'github-actions[bot]'},
  title:waveIssue.title(record),body:waveIssue.render(record)};
 let issues=[...reservationIssues,collectingControl];

 const contexts=[];
 for(let i=0;i<20;i++){
  const requestId='e2e-worker-'+String(i+1).padStart(4,'0');
  const createdAt=new Date(Date.parse('2026-09-30T08:02:00.000Z')+i*1000).toISOString();

  const fresh=command.route(issues,{now:createdAt});
  assert.equal(fresh.action,'create_request');
  assert.equal(fresh.waveIssueNumber,13005);

  const requestEnvelope=command.createRequestEnvelope(issues,{
   requestId,waveIssueNumber:fresh.waveIssueNumber,createdAt
  });
  const requestIssue={
   number:13010+i,state:'open',author_association:'OWNER',user:{login:'owner'},
   title:requestEnvelope.title,body:requestEnvelope.body,requestId
  };
  issues.push(requestIssue);

  const admitted=command.route(issues,{
   requestId,requestIssueNumber:requestIssue.number,
   now:new Date(Date.parse(createdAt)+1000).toISOString()
  });
  assert.equal(admitted.status,'collecting');
  assert.equal(admitted.action,'produce_shard');
  assert.equal(admitted.workerContext.shardId,composed.wave.shards[i].shardId);
  assert.equal(admitted.workerContext.policy.remoteWritesDuringProduction,false);
  assert.equal(admitted.workerContext.codes.length,5);
  contexts.push(admitted.workerContext);

  const delta=farm.createDelta(composed.wave,{
   shardId:admitted.workerContext.shardId,
   ...payload(admitted.workerContext),
   completedAt:new Date(Date.parse(createdAt)+2000).toISOString()
  });
  const resultEnvelope=command.createResultEnvelope(issues,{
   requestId,requestIssueNumber:requestIssue.number,delta,
   now:new Date(Date.parse(createdAt)+2000).toISOString()
  });
  assert.equal(resultEnvelope.title,requestEnvelope.title);
  assert.match(resultEnvelope.body,/MLS_BCR_R43_REQUEST/);
  assert.match(resultEnvelope.body,/MLS_BCR_R43_RESULT/);
  issues=issues.map(x=>x.number===requestIssue.number
   ?{...requestIssue,title:resultEnvelope.title,body:resultEnvelope.body}
   :x);
 }

 assert.equal(new Set(contexts.map(x=>x.shardId)).size,20);
 const allCodes=contexts.flatMap(x=>x.codes);
 assert.equal(allCodes.length,100);
 assert.equal(new Set(allCodes).size,100);
 assert.deepEqual(contexts.map(x=>x.shardId),composed.wave.shards.map(x=>x.shardId));

 // Every worker may finish before sealing; preserving REQUEST markers lets the
 // scheduler still materialize the same deterministic admission afterwards.
 const sealed=remoteScheduler.sealIfReady({
  waveControlIssue:collectingControl,
  reservationIssues,
  requestIssues:issues,
  now:'2026-09-30T08:23:00.000Z'
 });
 assert.equal(sealed.changed,true);
 assert.equal(sealed.reason,'SEALED');
 assert.equal(sealed.record.admission.assignments.length,20);
 assert.deepEqual(
  sealed.record.admission.assignments.map(x=>x.issueNumber),
  Array.from({length:20},(_,i)=>13010+i)
 );

 const sealedControl={...collectingControl,title:sealed.patch.title,body:sealed.patch.body};
 const reconciled=remoteScheduler.reconcileIfComplete({
  waveControlIssue:sealedControl,reservationIssues,resultIssues:issues,
  now:'2026-09-30T08:24:00.000Z'
 });
 assert.equal(reconciled.changed,true);
 assert.equal(reconciled.reason,'RECONCILED');
 assert.equal(reconciled.record.status,'reconciled');
 assert.equal(reconciled.reconciliation.complete,true);
 assert.equal(reconciled.reconciliation.completedShards.length,20);
 assert.equal(reconciled.reconciliation.completedUnits.length,100);
});
