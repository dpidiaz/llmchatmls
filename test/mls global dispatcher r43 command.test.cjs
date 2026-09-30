'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');

const command=require('../MLS R32 EDITORIAL/r4 snapshot command.cjs');
const farm=require('../MLS R32 EDITORIAL/r4 snapshot farm.cjs');
const reservations=require('../MLS R32 EDITORIAL/r4 snapshot reservations.cjs');
const buffered=require('../MLS R32 EDITORIAL/r4 buffered allocation.cjs');
const remoteAdmission=require('../MLS R32 EDITORIAL/r4 snapshot remote admission.cjs');
const waveIssue=require('../MLS R32 EDITORIAL/r4 snapshot wave issue.cjs');

const BASE='a'.repeat(40),CONTENT='b'.repeat(40);

function source(n=20,start=2000){
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
function fixture({waveId='BCR-R43-COMMAND',waveIssueNumber=12002,start=2000}={}){
 const composed=reservations.compose(source(20,start),{
  reservationIssueNumbers:[12001],baseCommit:BASE,contentManifestBlobSha:CONTENT,
  now:Date.parse('2026-09-30T07:00:00.000Z'),waveId,workerCount:2,shardSize:5,
  createdAt:'2026-09-30T07:00:00.000Z'
 });
 const record=waveIssue.create({
  waveIssueNumber,reservationIssueNumbers:[12001],
  snapshot:composed.snapshot,wave:composed.wave,
  createdAt:'2026-09-30T07:01:00.000Z',route:'remote'
 });
 const control={number:waveIssueNumber,state:'open',user:{login:'github-actions[bot]'},
  author_association:'NONE',title:waveIssue.title(record),body:waveIssue.render(record)};
 return {composed,record,control,issues:[reservationIssue(composed.reservations[0]),control]};
}
function requestIssue(base,number,requestId,at='2026-09-30T07:02:00.000Z'){
 const envelope=command.createRequestEnvelope(base.issues,{requestId,createdAt:at});
 return {number,state:'open',author_association:'OWNER',user:{login:'owner'},
  title:envelope.title,body:envelope.body};
}
function seal(base,requests,at='2026-09-30T07:03:00.000Z'){
 const admission=remoteAdmission.sealAdmission(base.composed.wave,requests,{
  sealedAt:at,waveIssueNumber:base.record.waveIssueNumber
 });
 const record=waveIssue.seal(base.record,base.composed.snapshot,base.composed.wave,admission,at);
 const control={...base.control,title:waveIssue.title(record),body:waveIssue.render(record)};
 return {...base,record,control,issues:[
  reservationIssue(base.composed.reservations[0]),control,...requests
 ]};
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

test('MLS R43 siguiente never falls back to R4.2 when no authoritative wave exists',()=>{
 assert.deepEqual(command.route([]),{
  backend:'r43',action:'no_active_r43_wave',
  guide:'docs/MLS Global Dispatcher/22 R4.3 Worker Command.md'
 });
});

test('user-authored spoof wave cannot hijack MLS R43 siguiente or force R4.2',()=>{
 const f=fixture();
 const spoof={...f.control,user:{login:'attacker'},author_association:'OWNER'};
 const state=command.route([f.issues[0],spoof]);
 assert.equal(state.backend,'r43');
 assert.equal(state.action,'no_active_r43_wave');
});

test('collecting wave routes same command to one R4.3 request and recovers it idempotently',()=>{
 const f=fixture();
 const first=command.route(f.issues);
 assert.equal(first.backend,'r43');
 assert.equal(first.action,'create_request');
 assert.equal(first.waveIssueNumber,12002);

 const req=requestIssue(f,12010,'chat-command-0001');
 const state=command.route([...f.issues,req],{
  requestId:'chat-command-0001',requestIssueNumber:12010
 });
 assert.equal(state.action,'await_admission');
 assert.equal(state.requestIssueNumber,12010);
});

test('sealed admission gives exact worker context and fresh chats receive takeover work instead of R4.2',()=>{
 const f=fixture();
 const a=requestIssue(f,12010,'chat-command-0001');
 const b=requestIssue(f,12011,'chat-command-0002','2026-09-30T07:02:01.000Z');
 const sealed=seal(f,[a,b]);
 const state=command.route(sealed.issues,{
  requestId:'chat-command-0001',requestIssueNumber:12010
 });
 assert.equal(state.backend,'r43');
 assert.equal(state.action,'produce_shard');
 assert.equal(state.assignment.shardId,'W0001');
 assert.deepEqual(state.workerContext.codes,sealed.composed.wave.shards[0].codes);
 assert.equal(state.workerContext.policy.remoteWritesDuringProduction,false);

 const extra=command.route(sealed.issues,{now:'2026-09-30T07:04:00.000Z'});
 assert.equal(extra.backend,'r43');
 assert.equal(extra.action,'create_takeover');
 assert.equal(extra.targetShardId,'W0001');
 assert.equal(extra.targetRequestIssueNumber,12010);
});

test('result submission is fenced to assigned shard and retry sees already-submitted delta',()=>{
 const f=fixture();
 const a=requestIssue(f,12010,'chat-command-0001');
 const b=requestIssue(f,12011,'chat-command-0002','2026-09-30T07:02:01.000Z');
 const sealed=seal(f,[a,b]);
 const wave=sealed.composed.wave;

 const wrong=farm.createDelta(wave,{
  shardId:'W0002',...payload(wave,'W0002'),completedAt:'2026-09-30T07:04:00.000Z'
 });
 assert.throws(()=>command.createResultEnvelope(sealed.issues,{
  requestId:'chat-command-0001',requestIssueNumber:12010,delta:wrong
 }),{code:'R43_COMMAND_RESULT_WRONG_SHARD'});

 const delta=farm.createDelta(wave,{
  shardId:'W0001',...payload(wave,'W0001'),completedAt:'2026-09-30T07:04:00.000Z'
 });
 const envelope=command.createResultEnvelope(sealed.issues,{
  requestId:'chat-command-0001',requestIssueNumber:12010,delta
 });
 const submittedIssue={...a,title:envelope.title,body:envelope.body};
 const after=sealed.issues.map(i=>i.number===12010?submittedIssue:i);
 const state=command.route(after,{
  requestId:'chat-command-0001',requestIssueNumber:12010
 });
 assert.equal(state.action,'result_already_submitted');
 assert.equal(state.shardId,'W0001');
 assert.equal(state.deltaHash,delta.deltaHash);
});

test('multiple authoritative live waves fail closed instead of choosing one',()=>{
 const a=fixture({waveId:'BCR-R43-CARD-A',waveIssueNumber:12100,start:2100});
 const record2=waveIssue.create({
  waveIssueNumber:12101,reservationIssueNumbers:[12001],
  snapshot:a.composed.snapshot,wave:a.composed.wave,
  createdAt:'2026-09-30T07:05:00.000Z',route:'remote'
 });
 const second={number:12101,state:'open',user:{login:'github-actions[bot]'},
  title:waveIssue.title(record2),body:waveIssue.render(record2)};
 assert.throws(()=>command.route([a.issues[0],a.control,second]),{
  code:'R43_COMMAND_WAVE_CARDINALITY'
 });
});


test('fresh chat takeover can produce an admitted shard and supersedes the lost original chat',()=>{
 const f=fixture();
 const a=requestIssue(f,12010,'chat-command-0001');
 const b=requestIssue(f,12011,'chat-command-0002','2026-09-30T07:02:01.000Z');
 const sealed=seal(f,[a,b]);

 const env=command.createTakeoverEnvelope(sealed.issues,{
  takeoverId:'takeover-fresh-0001',
  claimedAt:'2026-09-30T07:05:00.000Z'
 });
 assert.equal(env.claim.targetShardId,'W0001');
 assert.equal(env.claim.targetRequestIssueNumber,12010);
 const takeoverIssue={
  number:12020,state:'open',author_association:'OWNER',user:{login:'owner'},
  title:env.title,body:env.body
 };
 const issues=[...sealed.issues,takeoverIssue];

 const state=command.route(issues,{
  takeoverId:'takeover-fresh-0001',takeoverIssueNumber:12020,
  now:'2026-09-30T07:06:00.000Z'
 });
 assert.equal(state.action,'produce_shard');
 assert.equal(state.shardId,undefined);
 assert.equal(state.assignment.shardId,'W0001');
 assert.equal(state.requestIssueNumber,12010);
 assert.equal(state.takeoverIssueNumber,12020);
 assert.deepEqual(state.workerContext.codes,sealed.composed.wave.shards[0].codes);

 const original=command.route(issues,{
  requestId:'chat-command-0001',requestIssueNumber:12010,
  now:'2026-09-30T07:06:00.000Z'
 });
 assert.equal(original.action,'superseded_by_takeover');
 assert.equal(original.takeoverIssueNumber,12020);
});

test('simultaneous fresh chats racing for one shard resolve by lower takeover Issue number',()=>{
 const f=fixture();
 const a=requestIssue(f,12010,'chat-command-0001');
 const b=requestIssue(f,12011,'chat-command-0002','2026-09-30T07:02:01.000Z');
 const sealed=seal(f,[a,b]);

 // Both envelopes are created from the same stale view, so both target W0001.
 const ea=command.createTakeoverEnvelope(sealed.issues,{
  takeoverId:'takeover-race-0001',claimedAt:'2026-09-30T07:05:00.000Z'
 });
 const eb=command.createTakeoverEnvelope(sealed.issues,{
  takeoverId:'takeover-race-0002',claimedAt:'2026-09-30T07:05:00.100Z'
 });
 assert.equal(ea.claim.targetShardId,'W0001');
 assert.equal(eb.claim.targetShardId,'W0001');

 const ia={number:12020,state:'open',author_association:'OWNER',user:{login:'owner'},title:ea.title,body:ea.body};
 const ib={number:12021,state:'open',author_association:'OWNER',user:{login:'owner'},title:eb.title,body:eb.body};
 const issues=[...sealed.issues,ia,ib];

 const winner=command.route(issues,{
  takeoverId:'takeover-race-0001',takeoverIssueNumber:12020,
  now:'2026-09-30T07:06:00.000Z'
 });
 const loser=command.route(issues,{
  takeoverId:'takeover-race-0002',takeoverIssueNumber:12021,
  now:'2026-09-30T07:06:00.000Z'
 });
 assert.equal(winner.action,'produce_shard');
 assert.equal(winner.assignment.shardId,'W0001');
 assert.equal(loser.action,'takeover_retry');
 assert.equal(loser.shardId,'W0001');

 const next=command.route(issues,{now:'2026-09-30T07:06:00.000Z'});
 assert.equal(next.action,'create_takeover');
 assert.equal(next.targetShardId,'W0002');
});

test('expired takeover releases the shard for another fresh chat without renew traffic',()=>{
 const f=fixture();
 const a=requestIssue(f,12010,'chat-command-0001');
 const b=requestIssue(f,12011,'chat-command-0002','2026-09-30T07:02:01.000Z');
 const sealed=seal(f,[a,b]);
 const env=command.createTakeoverEnvelope(sealed.issues,{
  takeoverId:'takeover-expire-0001',claimedAt:'2026-09-30T07:05:00.000Z'
 });
 const claimIssue={number:12020,state:'open',author_association:'OWNER',user:{login:'owner'},title:env.title,body:env.body};
 const issues=[...sealed.issues,claimIssue];

 const expired=command.route(issues,{
  takeoverId:'takeover-expire-0001',takeoverIssueNumber:12020,
  now:'2026-09-30T07:36:00.000Z'
 });
 assert.equal(expired.action,'takeover_expired');
 assert.equal(expired.shardId,'W0001');

 const recovered=command.route(issues,{now:'2026-09-30T07:36:00.000Z'});
 assert.equal(recovered.action,'create_takeover');
 assert.equal(recovered.targetShardId,'W0001');
});

test('fresh-chat takeover publishes its result to the original admitted request Issue',()=>{
 const f=fixture();
 const a=requestIssue(f,12010,'chat-command-0001');
 const b=requestIssue(f,12011,'chat-command-0002','2026-09-30T07:02:01.000Z');
 const sealed=seal(f,[a,b]);
 const env=command.createTakeoverEnvelope(sealed.issues,{
  takeoverId:'takeover-result-0001',claimedAt:'2026-09-30T07:05:00.000Z'
 });
 const claimIssue={number:12020,state:'open',author_association:'OWNER',user:{login:'owner'},title:env.title,body:env.body};
 const issues=[...sealed.issues,claimIssue];
 const wave=sealed.composed.wave;
 const delta=farm.createDelta(wave,{
  shardId:'W0001',...payload(wave,'W0001'),completedAt:'2026-09-30T07:10:00.000Z'
 });

 const result=command.createResultEnvelope(issues,{
  takeoverId:'takeover-result-0001',takeoverIssueNumber:12020,
  delta,now:'2026-09-30T07:10:00.000Z'
 });
 assert.equal(result.issueNumber,12010);
 assert.equal(result.title,'[MLS BCR R4.3][RESULT] chat-command-0001');
});


test('sealed status reports admission and durable-result counts separately',()=>{
 const f=fixture();
 const a=requestIssue(f,12010,'chat-command-0001');
 const b=requestIssue(f,12011,'chat-command-0002','2026-09-30T07:02:01.000Z');
 const sealed=seal(f,[a,b]);
 const wave=sealed.composed.wave;

 const zero=command.route(sealed.issues,{now:'2026-09-30T07:04:00.000Z'});
 assert.equal(zero.status,'sealed');
 assert.equal(zero.admissionCount,2);
 assert.equal(zero.durableResultCount,0);
 assert.deepEqual(zero.missingShardIds,['W0001','W0002']);
 assert.equal(zero.action,'create_takeover');

 const d1=farm.createDelta(wave,{
  shardId:'W0001',...payload(wave,'W0001'),completedAt:'2026-09-30T07:05:00.000Z'
 });
 const e1=command.createResultEnvelope(sealed.issues,{
  requestId:'chat-command-0001',requestIssueNumber:12010,delta:d1
 });
 const i1={...a,title:e1.title,body:e1.body};
 const oneIssues=sealed.issues.map(i=>i.number===12010?i1:i);
 const one=command.route(oneIssues,{now:'2026-09-30T07:06:00.000Z'});
 assert.equal(one.admissionCount,2);
 assert.equal(one.durableResultCount,1);
 assert.deepEqual(one.missingShardIds,['W0002']);
 assert.equal(one.action,'create_takeover');
 assert.equal(one.targetShardId,'W0002');

 const d2=farm.createDelta(wave,{
  shardId:'W0002',...payload(wave,'W0002'),completedAt:'2026-09-30T07:07:00.000Z'
 });
 const e2=command.createResultEnvelope(oneIssues,{
  requestId:'chat-command-0002',requestIssueNumber:12011,delta:d2
 });
 const i2={...b,title:e2.title,body:e2.body};
 const twoIssues=oneIssues.map(i=>i.number===12011?i2:i);
 const two=command.route(twoIssues,{now:'2026-09-30T07:08:00.000Z'});
 assert.equal(two.admissionCount,2);
 assert.equal(two.durableResultCount,2);
 assert.deepEqual(two.missingShardIds,[]);
 assert.equal(two.action,'await_reconciliation');
});
