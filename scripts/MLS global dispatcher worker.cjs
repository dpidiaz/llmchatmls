'use strict';

const fs=require('node:fs');
const core=require('../MLS R32 EDITORIAL/global dispatcher/core.js');

const token=process.env.GITHUB_TOKEN||'';
const repository=process.env.GITHUB_REPOSITORY||'';
if(!token||!/^[^/]+\/[^/]+$/.test(repository))throw new Error('GITHUB_TOKEN/GITHUB_REPOSITORY faltante.');
const [owner,repo]=repository.split('/');

async function gh(method,endpoint,body){
  const response=await fetch('https://api.github.com'+endpoint,{
    method,
    headers:{authorization:'Bearer '+token,accept:'application/vnd.github+json','content-type':'application/json','x-github-api-version':'2022-11-28','user-agent':'mls-global-dispatcher-worker-r1'},
    body:body===undefined?undefined:JSON.stringify(body)
  });
  const text=await response.text();let data=null;try{data=text?JSON.parse(text):null}catch{data=text}
  if(!response.ok){const e=new Error('GitHub '+response.status+': '+(data?.message||text));e.status=response.status;throw e;}
  return data;
}
async function getIssue(number){return gh('GET','/repos/'+owner+'/'+repo+'/issues/'+number);}
async function updateIssue(number,patch){return gh('PATCH','/repos/'+owner+'/'+repo+'/issues/'+number,patch);}
function encodeRef(ref){return String(ref).split('/').map(encodeURIComponent).join('/');}
async function branchHead(branch){
  const ref=await gh('GET','/repos/'+owner+'/'+repo+'/git/ref/heads/'+encodeRef(branch));
  return String(ref?.object?.sha||'').toLowerCase();
}
async function verifyCommitScope(state,event){
  if(!['checkpoint','finish'].includes(event.operation))return;
  const commitSha=String(event.commitSha||state.lastCheckpointCommit||'').toLowerCase();
  if(!/^[a-f0-9]{40}$/.test(commitSha))throw core.dispatchError('COMMIT_SHA_INVALID','Evento requiere commit SHA válido.',409);
  const head=await branchHead(state.branch);
  if(head!==commitSha)throw core.dispatchError('BRANCH_HEAD_MISMATCH','El checkpoint/final debe apuntar al HEAD exacto de la rama asignada.',409);
  if(event.operation==='finish')return;
  const previous=String(state.lastCheckpointCommit||state.baseCommit||'').toLowerCase();
  if(!/^[a-f0-9]{40}$/.test(previous))throw core.dispatchError('BASE_COMMIT_INVALID','Assignment sin base/checkpoint válido.',409);
  if(previous===commitSha)return;
  const comparison=await gh('GET','/repos/'+owner+'/'+repo+'/compare/'+previous+'...'+commitSha);
  const status=String(comparison?.status||'');
  if(!['ahead','identical'].includes(status))throw core.dispatchError('CHECKPOINT_NOT_DESCENDANT','El commit no desciende del checkpoint/base vigente.',409);
  const files=Array.isArray(comparison?.files)?comparison.files:[];
  if(!files.length)throw core.dispatchError('CHECKPOINT_NO_CHANGES','Nuevo checkpoint no contiene cambios.',409);
  const disallowed=files.map(x=>String(x.filename||'')).filter(file=>!core.pathAllowed(file,state.allowedPaths||[]));
  if(disallowed.length)throw core.dispatchError('CHECKPOINT_SCOPE_VIOLATION','Cambios fuera de allowedPaths: '+disallowed.slice(0,10).join(', '),409);
}
async function main(){
  const payload=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')),eventIssue=payload.issue,comment=payload.comment;
  if(!eventIssue||!comment)return;
  let issue=await getIssue(eventIssue.number);
  if(!String(issue.title||'').startsWith('[MLS Dispatcher][LEASED]'))return;
  let state=core.parseAssignmentState(issue.body||'');if(!state)return;
  if(state.workerLogin&&String(comment.user?.login||'')!==String(state.workerLogin))return;
  try{
    const workerEvent=core.parseWorkerEvent(comment.body||'');
    core.validateLeaseEvent(state,workerEvent,comment.created_at);
    await verifyCommitScope(state,workerEvent);
    issue=await getIssue(eventIssue.number);
    if(!String(issue.title||'').startsWith('[MLS Dispatcher][LEASED]'))return;
    state=core.parseAssignmentState(issue.body||'');if(!state)return;
    const next=core.applyWorkerEvent(state,workerEvent,{createdAt:comment.created_at,commentId:comment.id});
    await updateIssue(issue.number,{body:core.renderAssignmentBody(next)});
  }catch(error){
    issue=await getIssue(eventIssue.number);
    state=core.parseAssignmentState(issue.body||'');
    if(!state||state.status!=='leased')return;
    const next={...state,lastRejectedEvent:{operation:'comment',commentId:Number(comment.id),reason:error.code||'DISPATCH_EVENT_REJECTED',message:error.message,at:comment.created_at}};
    await updateIssue(issue.number,{body:core.renderAssignmentBody(next)});
    if(error.status>=500)throw error;
  }
}
main().catch(error=>{console.error(error);process.exitCode=1});
