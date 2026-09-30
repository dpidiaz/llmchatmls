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

test('universal command falls back to R4.2 when no authoritative R4.3 wave exists',()=>{
 assert.deepEqual(command.route([]),{
  backend:'r42',action:'use_r42',
  guide:'docs/MLS Global Dispatcher/19 Comando universal BCR.md'
 });
});

test('user-authored spoof wave cannot hijack the universal command',()=>{
 const f=fixture();
 const spoof={...f.control,user:{login:'attacker'},author_association:'OWNER'};
 assert.equal(command.route([f.issues[0],spoof]).backend,'r42');
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

test('sealed admission gives exact worker context and never silently spills extra chats into R4.2',()=>{
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

 const extra=command.route(sealed.issues);
 assert.equal(extra.backend,'r43');
 assert.equal(extra.action,'pilot_capacity_full');
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
