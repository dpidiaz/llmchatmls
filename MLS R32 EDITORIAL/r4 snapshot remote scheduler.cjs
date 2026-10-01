'use strict';
const farm=require('./r4 snapshot farm.cjs');
const buffered=require('./r4 buffered allocation.cjs');
const remote=require('./r4 snapshot remote admission.cjs');
const waveIssue=require('./r4 snapshot wave issue.cjs');

function fail(code,msg){const e=new Error(msg||code);e.code=code;e.status=409;throw e;}
function assert(ok,code,msg){if(!ok)fail(code,msg);}

function reconstruct(record,reservationIssues){
 const byNumber=new Map((reservationIssues||[]).map(i=>[Number(i.number),i]));
 const units=[];
 for(const number of record.reservationIssueNumbers){
  const issue=byNumber.get(Number(number));
  assert(issue,'R43_SCHED_RESERVATION_MISSING');
  const r=buffered.parseReservation(issue);
  assert(r.status==='reserved','R43_SCHED_RESERVATION_STATUS');
  assert(r.allocation.baseCommit===record.baseCommit,'R43_SCHED_RESERVATION_BASE');
  assert(r.allocation.contentManifestBlobSha===record.contentManifestBlobSha,'R43_SCHED_RESERVATION_MANIFEST');
  units.push(...r.allocation.units);
 }
 assert(units.length===record.totalUnits,'R43_SCHED_UNIT_COUNT');
 assert(new Set(units.map(x=>x.code)).size===units.length,'R43_SCHED_UNIT_OVERLAP');
 const snapshot=farm.createSnapshot({
  baseCommit:record.baseCommit,
  contentManifestBlobSha:record.contentManifestBlobSha,
  units,
  createdAt:record.snapshotCreatedAt,
  source:'github'
 });
 const wave=farm.createWave(snapshot,{
  waveId:record.waveId,
  workerCount:record.workerCount,
  shardSize:record.shardSize,
  createdAt:record.waveCreatedAt
 });
 assert(snapshot.snapshotHash===record.snapshotHash,'R43_SCHED_SNAPSHOT_HASH');
 assert(wave.waveHash===record.waveHash,'R43_SCHED_WAVE_HASH');
 waveIssue.validate(record,snapshot,wave);
 return {snapshot,wave};
}

function sealIfReady({waveControlIssue,reservationIssues,requestIssues,now}){
 const record=waveIssue.parse(waveControlIssue);
 assert(record.status==='collecting','R43_SCHED_WAVE_NOT_COLLECTING');
 assert(record.route==='remote','R43_SCHED_ROUTE');
 const {snapshot,wave}=reconstruct(record,reservationIssues);
 const valid=[];
 for(const issue of requestIssues||[]){
  try{
   const req=remote.parseRequest(issue,wave,record.waveIssueNumber);
   valid.push({issue,req});
  }catch{}
 }
 const unique=new Map();
 for(const row of valid.sort((a,b)=>Number(a.issue.number)-Number(b.issue.number))){
  if(!unique.has(row.req.requestId))unique.set(row.req.requestId,row.issue);
 }
 if(unique.size<record.workerCount){
  return {
   changed:false,
   reason:'WAITING_REQUESTS',
   validRequests:unique.size,
   requiredRequests:record.workerCount,
   record,snapshot,wave
  };
 }
 const admission=remote.sealAdmission(wave,[...unique.values()],{
  sealedAt:now,waveIssueNumber:record.waveIssueNumber
 });
 const sealed=waveIssue.seal(record,snapshot,wave,admission,now);
 return {
  changed:true,
  reason:'SEALED',
  validRequests:unique.size,
  requiredRequests:record.workerCount,
  record:sealed,snapshot,wave,
  patch:{title:waveIssue.title(sealed),body:waveIssue.render(sealed)}
 };
}

function reconcileIfComplete({waveControlIssue,reservationIssues,resultIssues,now}){
 const record=waveIssue.parse(waveControlIssue);
 assert(record.status==='sealed','R43_SCHED_WAVE_NOT_SEALED');
 const {snapshot,wave}=reconstruct(record,reservationIssues);
 const remoteResult=require('./r4 snapshot remote result.cjs');
 const collected=remoteResult.collectResults(resultIssues,wave,record.admission);
 if(!collected.reconciliation.complete){
  return {
   changed:false,reason:'WAITING_RESULTS',
   missing:[...collected.missing],
   invalid:[...(collected.invalid||[])],
   record,snapshot,wave,reconciliation:collected.reconciliation
  };
 }
 const done=waveIssue.reconcile(record,snapshot,wave,collected.reconciliation,now);
 return {
  changed:true,reason:'RECONCILED',missing:[],
  record:done,snapshot,wave,reconciliation:collected.reconciliation,
  patch:{title:waveIssue.title(done),body:waveIssue.render(done)}
 };
}

module.exports={reconstruct,sealIfReady,reconcileIfComplete};
