'use strict';

const buffered=require('../MLS R32 EDITORIAL/r4 buffered allocation.cjs');
const reservations=require('../MLS R32 EDITORIAL/r4 snapshot reservations.cjs');
const waveIssue=require('../MLS R32 EDITORIAL/r4 snapshot wave issue.cjs');
const backoff=require('../MLS R32 EDITORIAL/r4 github backoff.cjs');

const repo=process.env.GITHUB_REPOSITORY;
const token=process.env.GITHUB_TOKEN;
const cooldown=process.env.MLS_GITHUB_COOLDOWN_FILE||'.mls-github-cooldown.json';
const waveIssueNumber=Number(process.env.MLS_R43_R33_HANDOFF_WAVE_ISSUE||0);
const confirm=String(process.env.MLS_R43_R33_HANDOFF_CONFIRM||'');
const CONFIRM='APPLY_R43_R33_HANDOFF_2208';

function fail(code,message){const e=new Error(message||code);e.code=code;throw e;}
function assert(ok,code,message){if(!ok)fail(code,message);}
assert(repo&&repo.includes('/'),'R43_R33_HANDOFF_REPO');
assert(token,'R43_R33_HANDOFF_TOKEN');
assert(waveIssueNumber===2208,'R43_R33_HANDOFF_WAVE_ISSUE');
assert(confirm===CONFIRM,'R43_R33_HANDOFF_CONFIRM');

async function gh(method,path,body=null){
 backoff.check(cooldown);
 const r=await fetch('https://api.github.com/repos/'+repo+path,{
  method,
  headers:{
   authorization:'Bearer '+token,
   accept:'application/vnd.github+json',
   'content-type':'application/json',
   'x-github-api-version':'2022-11-28',
   'user-agent':'mls-r43-r33-handoff'
  },
  body:body==null?undefined:JSON.stringify(body)
 });
 if(r.status===403||r.status===429){
  backoff.record(cooldown,r);
  const e=new Error('GitHub rate limit/cooldown response '+r.status);
  e.code='GITHUB_COOLDOWN';throw e;
 }
 if(!r.ok)throw new Error(method+' '+path+' failed: '+r.status+' '+await r.text());
 return await r.json();
}
async function issue(number){return await gh('GET','/issues/'+number);}

async function main(){
 const control=await issue(waveIssueNumber);
 assert(control.user?.login==='github-actions[bot]','R43_R33_HANDOFF_WAVE_OWNER');
 const record=waveIssue.parse(control);
 assert(record.status==='reconciled','R43_R33_HANDOFF_NOT_RECONCILED');
 assert(record.reconciliation?.complete===true,'R43_R33_HANDOFF_RECONCILIATION');
 assert(record.totalUnits===100&&record.workerCount===20&&record.shardSize===5,'R43_R33_HANDOFF_SCOPE');
 assert(Array.isArray(record.reconciliation.completedUnits)&&record.reconciliation.completedUnits.length===100,
  'R43_R33_HANDOFF_UNITS');
 assert(Array.isArray(record.reconciliation.conflicts)&&record.reconciliation.conflicts.length===0,
  'R43_R33_HANDOFF_CONFLICTS');
 assert(Array.isArray(record.reservationIssueNumbers)&&record.reservationIssueNumbers.length===4,
  'R43_R33_HANDOFF_RESERVATIONS');

 const activatedAt=new Date().toISOString(),patched=[],reused=[];
 for(const number of record.reservationIssueNumbers){
  const current=await issue(number);
  assert(current.user?.login==='github-actions[bot]','R43_R33_HANDOFF_RESERVATION_OWNER');
  const parsed=buffered.parseReservation(current);
  assert(parsed.snapshotFarm?.waveId===record.waveId,'R43_R33_HANDOFF_RESERVATION_WAVE');
  const next=reservations.markR33Handoff(parsed,{
   waveIssueNumber,
   waveId:record.waveId,
   waveHash:record.waveHash,
   reconciliationHash:record.reconciliation.reconciliationHash,
   at:activatedAt
  });
  if(next.recordHash===parsed.recordHash){reused.push(number);continue;}
  await gh('PATCH','/issues/'+number,{
   title:current.title,
   body:buffered.renderReservation(next)
  });
  const check=await issue(number),saved=buffered.parseReservation(check);
  assert(saved.recordHash===next.recordHash,'R43_R33_HANDOFF_NOT_PERSISTED');
  assert(saved.snapshotFarm?.r33Handoff?.status==='active','R43_R33_HANDOFF_NOT_ACTIVE');
  patched.push(number);
 }
 console.log(JSON.stringify({
  ok:true,
  waveIssueNumber,
  waveId:record.waveId,
  waveHash:record.waveHash,
  reconciliationHash:record.reconciliation.reconciliationHash,
  patched,
  reused,
  reservationIssueNumbers:record.reservationIssueNumbers
 },null,2));
}
main().catch(error=>{
 console.error(JSON.stringify({ok:false,error:error.code||'R43_R33_HANDOFF_FAILED',message:error.message}));
 process.exitCode=1;
});
