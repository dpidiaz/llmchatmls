'use strict';

const waveIssue=require('../MLS R32 EDITORIAL/r4 snapshot wave issue.cjs');
const remoteScheduler=require('../MLS R32 EDITORIAL/r4 snapshot remote scheduler.cjs');
const remoteResult=require('../MLS R32 EDITORIAL/r4 snapshot remote result.cjs');

function fail(code,message){const e=new Error(message||code);e.code=code;throw e;}
function assert(ok,code,message){if(!ok)fail(code,message);}

const repo=process.env.GITHUB_REPOSITORY;
const token=process.env.GITHUB_TOKEN;
const waveIssueNumber=Number(process.env.MLS_R43_R33_AUDIT_WAVE_ISSUE||0);
assert(repo&&repo.includes('/'),'R43_R33_AUDIT_REPO');
assert(token,'R43_R33_AUDIT_TOKEN');
assert(Number.isSafeInteger(waveIssueNumber)&&waveIssueNumber>0,'R43_R33_AUDIT_WAVE_ISSUE');

async function ghIssue(number){
 const r=await fetch('https://api.github.com/repos/'+repo+'/issues/'+number,{
  method:'GET',
  headers:{
   authorization:'Bearer '+token,
   accept:'application/vnd.github+json',
   'x-github-api-version':'2022-11-28',
   'user-agent':'mls-r43-r33-audit'
  }
 });
 if(!r.ok)throw new Error('GitHub GET issue '+number+' failed: '+r.status);
 return await r.json();
}
function keys(x){return x&&typeof x==='object'&&!Array.isArray(x)?Object.keys(x).sort():[];}
function bool(x,k){return Boolean(x&&Object.prototype.hasOwnProperty.call(x,k));}

async function main(){
 const control=await ghIssue(waveIssueNumber);
 assert(control.user?.login==='github-actions[bot]','R43_R33_AUDIT_WAVE_OWNER');
 const record=waveIssue.parse(control);
 assert(record.status==='reconciled','R43_R33_AUDIT_NOT_RECONCILED');
 assert(record.reconciliation?.complete===true,'R43_R33_AUDIT_RECONCILIATION');

 const reservationIssues=await Promise.all(record.reservationIssueNumbers.map(ghIssue));
 const {snapshot,wave}=remoteScheduler.reconstruct(record,reservationIssues);
 const resultIssues=await Promise.all(record.admission.assignments.map(x=>ghIssue(x.issueNumber)));
 const collected=remoteResult.collectResults(resultIssues,wave,record.admission);

 assert(collected.reconciliation.complete===true,'R43_R33_AUDIT_RESULTS_INCOMPLETE');
 assert(collected.reconciliation.reconciliationHash===record.reconciliation.reconciliationHash,
  'R43_R33_AUDIT_RECONCILIATION_DRIFT');

 const assessmentCounts={},entryStatusCounts={},reviewTypeCounts={};
 const entryKeySets=new Set(),checkpointKeySets=new Set(),reviewKeySets=new Set();
 let articleLike=0,evidenceFieldsPresent=0;
 const samples=[];

 for(const delta of collected.deltas){
  for(const code of delta.codes){
   const entry=delta.entries[code],checkpoint=delta.checkpoints[code],review=delta.reviews[code];
   entryKeySets.add(keys(entry).join(','));
   checkpointKeySets.add(keys(checkpoint).join(','));
   reviewKeySets.add(keys(review).join(','));
   const assessment=String(checkpoint?.assessment||checkpoint?.status||'MISSING');
   assessmentCounts[assessment]=(assessmentCounts[assessment]||0)+1;
   const status=String(entry?.status||'MISSING');
   entryStatusCounts[status]=(entryStatusCounts[status]||0)+1;
   const reviewType=String(review?.reviewType||review?.reviewerType||'MISSING');
   reviewTypeCounts[reviewType]=(reviewTypeCounts[reviewType]||0)+1;
   if(bool(entry,'articleMarkdown')&&bool(entry,'generatedAt')&&bool(entry,'code'))articleLike++;
   if(bool(entry,'claims')||bool(entry,'links')||bool(entry,'sources')||bool(entry,'evidence'))evidenceFieldsPresent++;
   if(samples.length<5)samples.push({
    code,
    entryKeys:keys(entry),
    checkpointKeys:keys(checkpoint),
    reviewKeys:keys(review),
    entryStatus:status,
    assessment,
    reviewType,
    articleLike:bool(entry,'articleMarkdown')&&bool(entry,'generatedAt'),
    evidenceFieldNames:['claims','links','sources','evidence'].filter(k=>bool(entry,k))
   });
  }
 }

 const report={
  schema:'MLS-BCR-R43-R33-AUDIT-1',
  waveIssueNumber,
  waveId:record.waveId,
  waveHash:record.waveHash,
  reconciliationHash:record.reconciliation.reconciliationHash,
  totalUnits:wave.totalUnits,
  deltas:collected.deltas.length,
  articleLike,
  evidenceFieldsPresent,
  assessmentCounts,
  entryStatusCounts,
  reviewTypeCounts,
  entryKeySets:[...entryKeySets].sort(),
  checkpointKeySets:[...checkpointKeySets].sort(),
  reviewKeySets:[...reviewKeySets].sort(),
  samples
 };
 console.log(JSON.stringify(report,null,2));
}

main().catch(error=>{
 console.error(JSON.stringify({ok:false,error:error.code||'R43_R33_AUDIT_FAILED',message:error.message}));
 process.exitCode=1;
});
