'use strict';
const fs=require('node:fs');
const remoteAdmission=require('../MLS R32 EDITORIAL/r4 snapshot remote admission.cjs');
const remoteResult=require('../MLS R32 EDITORIAL/r4 snapshot remote result.cjs');
const waveIssue=require('../MLS R32 EDITORIAL/r4 snapshot wave issue.cjs');
const scheduler=require('../MLS R32 EDITORIAL/r4 snapshot remote scheduler.cjs');

const AUTHORIZED_ASSOCIATIONS=new Set(['OWNER','MEMBER','COLLABORATOR']);

function die(msg){throw new Error(msg);}
function extractMarker(body,key){
 const re=new RegExp('<!--\\s*'+key+'\\s*\\n([\\s\\S]*?)\\n-->','g');
 const hits=[...String(body||'').matchAll(re)];
 if(hits.length!==1)return null;
 try{return JSON.parse(hits[0][1]);}catch{return null;}
}
function waveIssueNumberFromBody(body){
 const req=extractMarker(body,remoteAdmission.REQUEST_MARKER);
 if(Number.isSafeInteger(req?.waveIssueNumber)&&req.waveIssueNumber>0)return req.waveIssueNumber;
 const result=extractMarker(body,remoteResult.RESULT_MARKER);
 if(Number.isSafeInteger(result?.waveIssueNumber)&&result.waveIssueNumber>0)return result.waveIssueNumber;
 return null;
}
async function main(){
 const eventPath=process.env.GITHUB_EVENT_PATH,token=process.env.GITHUB_TOKEN,repository=process.env.GITHUB_REPOSITORY;
 if(!eventPath||!token||!repository)die('Missing GitHub Actions environment.');
 const event=JSON.parse(fs.readFileSync(eventPath,'utf8')),trigger=event.issue;
 if(!trigger||trigger.pull_request)return;
 if(!AUTHORIZED_ASSOCIATIONS.has(String(trigger.author_association||'').toUpperCase()))
  die('R4.3 trigger Issue is not authorized.');
 const waveNumber=waveIssueNumberFromBody(trigger.body);
 if(!waveNumber){
  console.log('Not an R4.3 worker request/result; no action.');
  return;
 }
 const [owner,repo]=repository.split('/');
 async function api(method,path,body){
  const res=await fetch('https://api.github.com/repos/'+owner+'/'+repo+path,{
   method,headers:{
    Accept:'application/vnd.github+json',
    Authorization:'Bearer '+token,
    'X-GitHub-Api-Version':'2022-11-28',
    'User-Agent':'mls-r43-snapshot-pilot'
   },
   ...(body?{body:JSON.stringify(body)}:{})
  });
  if(!res.ok){
   const text=await res.text();
   const e=new Error('GitHub '+method+' '+path+' '+res.status+' '+text.slice(0,500));
   e.status=res.status;throw e;
  }
  if(res.status===204)return null;
  return res.json();
 }
 const control=await api('GET','/issues/'+waveNumber);
 if(control?.user?.login!=='github-actions[bot]')die('R4.3 Wave control Issue is not authoritative.');
 if(control.state!=='open'){
  console.log('Wave control Issue is closed; no action.');
  return;
 }
 const record=waveIssue.parse(control);
 if(!['collecting','sealed'].includes(record.status)){
  console.log('Wave status '+record.status+' needs no scheduler work.');
  return;
 }
 const reservationIssues=await Promise.all(record.reservationIssueNumbers.map(n=>api('GET','/issues/'+n)));
 async function recentIssues(){
  const out=[],since=encodeURIComponent(record.createdAt),maxPages=20;
  for(let page=1;page<=maxPages;page++){
   const rows=await api('GET','/issues?state=open&since='+since+'&per_page=100&page='+page+'&sort=updated&direction=asc');
   if(!Array.isArray(rows))die('R4.3 Issue inventory response is invalid.');
   for(const row of rows)if(!row.pull_request)out.push(row);
   if(rows.length<100)return out;
  }
  die('R4.3 Issue inventory exceeds safe pagination bound; refusing truncated reconciliation.');
 }
 const candidates=await recentIssues();
 const now=new Date().toISOString();
 let decision;
 if(record.status==='collecting'){
  decision=scheduler.sealIfReady({
   waveControlIssue:control,reservationIssues,requestIssues:candidates,now
  });
 }else{
  decision=scheduler.reconcileIfComplete({
   waveControlIssue:control,reservationIssues,resultIssues:candidates,now
  });
 }
 console.log(JSON.stringify({
  waveIssueNumber:waveNumber,status:record.status,
  decision:decision.reason,changed:decision.changed,
  validRequests:decision.validRequests,
  missing:decision.missing
 }));
 if(!decision.changed)return;
 // concurrency at workflow level makes this the sole writer. Re-read before patch
 // so a replay cannot overwrite a state transition made by an earlier queued run.
 const live=await api('GET','/issues/'+waveNumber);
 const liveRecord=waveIssue.parse(live);
 if(liveRecord.recordHash!==record.recordHash){
  console.log('Wave changed since read; replay will reconcile from newer state.');
  return;
 }
 await api('PATCH','/issues/'+waveNumber,decision.patch);
 console.log('Wave control Issue updated exactly once for '+decision.reason+'.');
}
main().catch(err=>{
 console.error(err&&err.stack||err);
 process.exitCode=1;
});
