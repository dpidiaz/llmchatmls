'use strict';

const fs=require('node:fs');
const core=require('../MLS R32 EDITORIAL/evidence farm core.js');

const token=process.env.GITHUB_TOKEN||'';
const repository=process.env.GITHUB_REPOSITORY||'';
if(!token||!/^[^/]+\/[^/]+$/.test(repository))throw new Error('GITHUB_TOKEN/GITHUB_REPOSITORY faltante.');
const [owner,repo]=repository.split('/');

async function gh(method,endpoint,body){
  const response=await fetch('https://api.github.com'+endpoint,{
    method,
    headers:{authorization:'Bearer '+token,accept:'application/vnd.github+json','content-type':'application/json','x-github-api-version':'2022-11-28','user-agent':'r33-evidence-farm-r1'},
    body:body===undefined?undefined:JSON.stringify(body)
  });
  const text=await response.text();let data=null;try{data=text?JSON.parse(text):null}catch{data=text}
  if(!response.ok){const e=new Error('GitHub '+response.status+': '+(data?.message||text));e.status=response.status;throw e;}
  return data;
}
async function updateIssue(number,patch){return gh('PATCH','/repos/'+owner+'/'+repo+'/issues/'+number,patch);}

async function main(){
  const event=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')),issue=event.issue,comment=event.comment;
  if(!issue||!comment||!String(issue.title||'').startsWith('[R33 Evidence Farm][LEASED]'))return;
  const state=core.parseFarmState(issue.body||'');if(!state)return;
  if(state.workerLogin&&String(comment.user?.login||'')!==String(state.workerLogin))return;
  try{
    const farmEvent=core.parseWorkerEvent(comment.body||''),next=core.applyWorkerEvent(state,farmEvent,{createdAt:comment.created_at,commentId:comment.id});
    await updateIssue(issue.number,{body:core.renderBatchBody(next)});
  }catch(error){
    const next={...state,lastRejectedEvent:{operation:'comment',commentId:Number(comment.id),reason:error.code||'EVIDENCE_FARM_EVENT_REJECTED',message:error.message,at:comment.created_at}};
    await updateIssue(issue.number,{body:core.renderBatchBody(next)});
    if(error.status>=500)throw error;
  }
}
main().catch(error=>{console.error(error);process.exitCode=1});
