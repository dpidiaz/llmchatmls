'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');

const command=require('../MLS R32 EDITORIAL/r4 snapshot command.cjs');
const farm=require('../MLS R32 EDITORIAL/r4 snapshot farm.cjs');
const reservations=require('../MLS R32 EDITORIAL/r4 snapshot reservations.cjs');
const buffered=require('../MLS R32 EDITORIAL/r4 buffered allocation.cjs');
const remoteAdmission=require('../MLS R32 EDITORIAL/r4 snapshot remote admission.cjs');
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

test('universal MLS BCR command completes a full 20x5 Snapshot Farm lifecycle without leases',()=>{
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
 const collectingIssues=[...reservationIssues,collectingControl];

 const requests=[];
 for(let i=0;i<20;i++){
  const requestId='e2e-worker-'+String(i+1).padStart(4,'0');
  const envelope=command.createRequestEnvelope(collectingIssues,{
   requestId,createdAt:new Date(Date.parse('2026-09-30T08:02:00.000Z')+i*1000).toISOString()
  });
  requests.push({
   number:13010+i,state:'open',author_association:'OWNER',user:{login:'owner'},
   title:envelope.title,body:envelope.body,requestId
  });
 }
 assert.equal(new Set(requests.map(x=>x.requestId)).size,20);

 const admission=remoteAdmission.sealAdmission(composed.wave,requests,{
  sealedAt:'2026-09-30T08:03:00.000Z',waveIssueNumber:13005
 });
 const sealedRecord=waveIssue.seal(
  record,composed.snapshot,composed.wave,admission,'2026-09-30T08:03:00.000Z'
 );
 const sealedControl={...collectingControl,
  title:waveIssue.title(sealedRecord),body:waveIssue.render(sealedRecord)};
 const sealedIssues=[...reservationIssues,sealedControl,...requests];

 const contexts=[],resultIssues=[];
 for(const req of requests){
  const state=command.route(sealedIssues,{
   requestId:req.requestId,requestIssueNumber:req.number
  });
  assert.equal(state.action,'produce_shard');
  assert.equal(state.workerContext.policy.remoteWritesDuringProduction,false);
  assert.equal(state.workerContext.codes.length,5);
  contexts.push(state.workerContext);

  const delta=farm.createDelta(composed.wave,{
   shardId:state.workerContext.shardId,
   ...payload(state.workerContext),
   completedAt:'2026-09-30T08:04:00.000Z'
  });
  const envelope=command.createResultEnvelope(sealedIssues,{
   requestId:req.requestId,requestIssueNumber:req.number,delta
  });
  resultIssues.push({...req,title:envelope.title,body:envelope.body});
 }

 assert.equal(new Set(contexts.map(x=>x.shardId)).size,20);
 const allCodes=contexts.flatMap(x=>x.codes);
 assert.equal(allCodes.length,100);
 assert.equal(new Set(allCodes).size,100);
 assert.deepEqual(contexts.map(x=>x.shardId),composed.wave.shards.map(x=>x.shardId));

 const reconciled=remoteScheduler.reconcileIfComplete({
  waveControlIssue:sealedControl,reservationIssues,resultIssues,
  now:'2026-09-30T08:05:00.000Z'
 });
 assert.equal(reconciled.changed,true);
 assert.equal(reconciled.reason,'RECONCILED');
 assert.equal(reconciled.record.status,'reconciled');
 assert.equal(reconciled.reconciliation.complete,true);
 assert.equal(reconciled.reconciliation.completedShards.length,20);
 assert.equal(reconciled.reconciliation.completedUnits.length,100);
});
