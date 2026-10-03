'use strict';

const fs=require('node:fs');
const core=require('../MLS R32 EDITORIAL/global dispatcher/core.js');
const integration=require('../MLS R32 EDITORIAL/global dispatcher/integration.js');
const recoveryContext=require('../MLS R32 EDITORIAL/global dispatcher/recovery.js');

const token=process.env.GITHUB_TOKEN||'';
const repository=process.env.GITHUB_REPOSITORY||'';
if(!token||!/^[^/]+\/[^/]+$/.test(repository))throw new Error('GITHUB_TOKEN/GITHUB_REPOSITORY faltante.');
const [owner,repo]=repository.split('/');

const githubApiCounts={GET:0,POST:0,PATCH:0,PUT:0,DELETE:0};
if(typeof process.on==='function')process.on('exit',()=>console.log('MLS_R4_GITHUB_API_METRICS '+JSON.stringify({module:'worker-events',calls:githubApiCounts,total:Object.values(githubApiCounts).reduce((a,b)=>a+b,0)})));
async function gh(method,endpoint,body){
  if(Object.hasOwn(githubApiCounts,method))githubApiCounts[method]++;
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
async function createIssue(title,body){return gh('POST','/repos/'+owner+'/'+repo+'/issues',{title,body});}
async function wakeScheduler(){
  return gh('POST','/repos/'+owner+'/'+repo+'/actions/workflows/'+encodeURIComponent('MLS Global Dispatcher Scheduler.yml')+'/dispatches',{ref:'main'});
}
function autoPullRequest(state,comment){
  const workerId=String(state.workerId||'').trim();
  if(!/^[A-Za-z0-9._:-]{8,160}$/.test(workerId))return null;
  const seed=String(state.assignmentId||state.issueNumber||'assignment').replace(/[^A-Za-z0-9._:-]+/g,'-').slice(-70);
  const requestId=('autopull:'+seed+':'+String(comment.id)).slice(0,120);
  const workerLogin=String(state.workerLogin||'').trim();
  const workId=String(state.workId||'');
  const handoffScope=/^r33-handoff:\d+:/.exec(workId);
  const unifiedScope=workId.startsWith('r33-unified:')?'r33-unified:':null;
  return {
    operation:'claim',requestId,workerId,workerLogin:workerLogin||null,
    capabilities:['chat','github','r4-autopull'],
    ...(handoffScope?{provider:'r33-farm',workPrefix:handoffScope[0]}:
      unifiedScope?{provider:'r33-farm',workPrefix:unifiedScope}:{})
  };
}
function encodeRef(ref){return String(ref).split('/').map(encodeURIComponent).join('/');}
async function branchHead(branch){
  const ref=await gh('GET','/repos/'+owner+'/'+repo+'/git/ref/heads/'+encodeRef(branch));
  return String(ref?.object?.sha||'').toLowerCase();
}
function unifiedIntegrationPathAllowed(file,state){
  if(core.pathAllowed(file,state.allowedPaths||[]))return true;
  return file==='content/manifest.json'&&state.provider==='r33-index-integration'&&String(state.workId||'').startsWith('r33-unified-integration:')&&
    (state.allowedPaths||[]).some(p=>String(p).startsWith('content/')&&String(p)!=='content/manifest.json');
}
async function verifyIntegrationCheckpoint(state,commitSha,event={}){
  const policy=state.integration;
  if(!policy)throw core.dispatchError('INTEGRATION_SPEC_REQUIRED','Assignment integration sin spec/policy.',409);
  if(String(policy.mode||'')==='assignment-pr'){
    const stage=String(event.integrationStage||'').toLowerCase();
    if(stage==='noop'){
      const assignedHead=await branchHead(state.branch);
      const mainRef=await gh('GET','/repos/'+owner+'/'+repo+'/git/ref/heads/main');
      const mainSha=String(mainRef?.object?.sha||'').toLowerCase();
      if(assignedHead!==commitSha||mainSha!==commitSha)
        throw core.dispatchError('INTEGRATION_NOOP_MAIN_MISMATCH','No-op integration requires assignment branch HEAD and current main HEAD to equal commitSha.',409);
      return;
    }
    if(stage==='premerge'){
      const head=await branchHead(state.branch);
      if(head!==commitSha)throw core.dispatchError('INTEGRATION_BRANCH_HEAD_MISMATCH','Premerge commit no coincide con HEAD de la rama asignada.',409);
      const base=String(state.recovery?.integrationBaseCommit||state.baseCommit||'').toLowerCase();
      if(!/^[a-f0-9]{40}$/.test(base))throw core.dispatchError('BASE_COMMIT_INVALID','Assignment integration sin base válido.',409);
      const comparison=await gh('GET','/repos/'+owner+'/'+repo+'/compare/'+base+'...'+commitSha);
      if(!['ahead','identical'].includes(String(comparison?.status||'')))throw core.dispatchError('CHECKPOINT_NOT_DESCENDANT','Head integration no desciende del base asignado.',409);
      const files=Array.isArray(comparison?.files)?comparison.files:[];
      if(!files.length)throw core.dispatchError('CHECKPOINT_NO_CHANGES','Integration premerge no contiene cambios.',409);
      const disallowed=files.map(x=>String(x.filename||'')).filter(file=>!unifiedIntegrationPathAllowed(file,state));
      if(disallowed.length)throw core.dispatchError('CHECKPOINT_SCOPE_VIOLATION','Cambios integration fuera de allowedPaths: '+disallowed.slice(0,10).join(', '),409);
      return;
    }
    if(stage!=='postmerge')throw core.dispatchError('INTEGRATION_STAGE_REQUIRED','assignment-pr requiere integrationStage premerge/postmerge.',409);
    const prNumber=Number(event.integrationPrNumber);
    const expectedHeadSha=String(event.integrationHeadSha||'').toLowerCase();
    if(!Number.isInteger(prNumber)||prNumber<1)throw core.dispatchError('INTEGRATION_PR_REQUIRED','checkpoint assignment-pr requiere integrationPrNumber.',409);
    if(!/^[a-f0-9]{40}$/.test(expectedHeadSha))throw core.dispatchError('INTEGRATION_HEAD_REQUIRED','checkpoint assignment-pr requiere integrationHeadSha.',409);
    const assignedHead=await branchHead(state.branch);
    if(!recoveryContext.branchMatches(state,assignedHead,expectedHeadSha,commitSha,prNumber))throw core.dispatchError('INTEGRATION_BRANCH_HEAD_MISMATCH','integrationHeadSha no coincide con HEAD de la rama asignada.',409);
    if(!recoveryContext.acceptedHead(state,expectedHeadSha))throw core.dispatchError('INTEGRATION_PREMERGE_CHECKPOINT_REQUIRED','Falta checkpoint premerge del head exacto.',409);
    if(state.recovery){
      const base=state.recovery.integrationBaseCommit;
      if(!/^[a-f0-9]{40}$/.test(String(base||'')))throw core.dispatchError('BASE_COMMIT_INVALID','Recovery sin base original.',409);
      const comparison=await gh('GET','/repos/'+owner+'/'+repo+'/compare/'+base+'...'+expectedHeadSha);
      if(comparison.status!=='ahead'||!comparison.files?.length||comparison.files.length>=300||comparison.files.some(f=>!unifiedIntegrationPathAllowed(f.filename,state)))throw core.dispatchError('CHECKPOINT_SCOPE_VIOLATION','Recovery ancestry/scope inválido o incompleto.',409);
    }
    const spec=integration.assignmentPrSpec(policy,{prNumber,expectedHeadSha});
    const pr=await gh('GET','/repos/'+owner+'/'+repo+'/pulls/'+prNumber);
    const mainRef=await gh('GET','/repos/'+owner+'/'+repo+'/git/ref/heads/main');
    const mainSha=String(mainRef?.object?.sha||'').toLowerCase();
    let mainContainsCommit=mainSha===commitSha;
    if(!mainContainsCommit){
      const comparison=await gh('GET','/repos/'+owner+'/'+repo+'/compare/'+commitSha+'...'+mainSha);
      mainContainsCommit=['ahead','identical'].includes(String(comparison?.status||''));
    }
    integration.validateMergedCheckpoint(spec,{pr:{number:pr?.number,base:pr?.base?.ref,headSha:pr?.head?.sha,merged:pr?.merged===true,mergeCommitSha:pr?.merge_commit_sha},commitSha,mainContainsCommit});
    return;
  }
  const spec=policy;
  const pr=await gh('GET','/repos/'+owner+'/'+repo+'/pulls/'+Number(spec.prNumber));
  const mainRef=await gh('GET','/repos/'+owner+'/'+repo+'/git/ref/heads/main');
  const mainSha=String(mainRef?.object?.sha||'').toLowerCase();
  let mainContainsCommit=mainSha===commitSha;
  if(!mainContainsCommit){
    const comparison=await gh('GET','/repos/'+owner+'/'+repo+'/compare/'+commitSha+'...'+mainSha);
    mainContainsCommit=['ahead','identical'].includes(String(comparison?.status||''));
  }
  integration.validateMergedCheckpoint(spec,{pr:{number:pr?.number,base:pr?.base?.ref,headSha:pr?.head?.sha,merged:pr?.merged===true,mergeCommitSha:pr?.merge_commit_sha},commitSha,mainContainsCommit});
}
async function verifyCommitScope(state,event){
  if(!['checkpoint','finish'].includes(event.operation))return;
  const commitSha=String(event.commitSha||state.lastCheckpointCommit||'').toLowerCase();
  if(!/^[a-f0-9]{40}$/.test(commitSha))throw core.dispatchError('COMMIT_SHA_INVALID','Evento requiere commit SHA válido.',409);
  if(state.workType==='integration'){await verifyIntegrationCheckpoint(state,commitSha,event);return;}
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
  const commentLogin=String(comment.user?.login||'');
  const trustedUnifiedBot=commentLogin==='github-actions[bot]'&&
    /<!--\s*MLS_UNIFIED_R33_AUTOCHECKPOINT\b/.test(String(comment.body||''))&&
    state.provider==='r33-farm'&&String(state.workId||'').startsWith('r33-unified:');
  if(state.workerLogin&&commentLogin!==String(state.workerLogin)&&!trustedUnifiedBot)return;
  try{
    const workerEvent=core.parseWorkerEvent(comment.body||'');
    core.validateLeaseEvent(state,workerEvent,comment.created_at);
    await verifyCommitScope(state,workerEvent);
    issue=await getIssue(eventIssue.number);
    if(!String(issue.title||'').startsWith('[MLS Dispatcher][LEASED]'))return;
    state=core.parseAssignmentState(issue.body||'');if(!state)return;
    let next=core.applyWorkerEvent(state,workerEvent,{createdAt:comment.created_at,commentId:comment.id});
    let chainedClaim=null;
    if(workerEvent.operation==='finish'&&next.readyToClose===true&&next.provider==='r33-farm'){
      const command=autoPullRequest(next,comment);
      if(command){
        chainedClaim=await createIssue('[MLS Dispatcher][CLAIM] '+command.requestId,core.renderCommandBody(command));
        await wakeScheduler();
        next={...next,autoPull:{
          enabled:true,
          requestId:command.requestId,
          issueNumber:Number(chainedClaim.number),
          createdAt:comment.created_at,
          policy:'continue-until-preempted'
        }};
      }
    }
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
