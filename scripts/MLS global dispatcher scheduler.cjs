'use strict';

const path=require('node:path');
const core=require('../MLS R32 EDITORIAL/global dispatcher/core.js');

const token=process.env.GITHUB_TOKEN||'';
const repository=process.env.GITHUB_REPOSITORY||'';
if(!token||!/^[^/]+\/[^/]+$/.test(repository))throw new Error('GITHUB_TOKEN/GITHUB_REPOSITORY faltante.');
const [owner,repo]=repository.split('/');
const root=path.resolve(__dirname,'..');

async function gh(method,endpoint,body){
  const response=await fetch('https://api.github.com'+endpoint,{
    method,
    headers:{authorization:'Bearer '+token,accept:'application/vnd.github+json','content-type':'application/json','x-github-api-version':'2022-11-28','user-agent':'mls-global-dispatcher-r1'},
    body:body===undefined?undefined:JSON.stringify(body)
  });
  const text=await response.text();let data=null;try{data=text?JSON.parse(text):null}catch{data=text}
  if(!response.ok){const e=new Error('GitHub '+response.status+': '+(data?.message||text));e.status=response.status;throw e;}
  return data;
}
async function pages(endpoint){
  const out=[];for(let page=1;page<=20;page++){const join=endpoint.includes('?')?'&':'?';const rows=await gh('GET',endpoint+join+'per_page=100&page='+page);if(!Array.isArray(rows))break;out.push(...rows);if(rows.length<100)break;}return out;
}
async function allIssues(state='open'){return (await pages('/repos/'+owner+'/'+repo+'/issues?state='+state)).filter(x=>!x.pull_request);}
async function updateIssue(number,patch){return gh('PATCH','/repos/'+owner+'/'+repo+'/issues/'+number,patch);}
async function createIssue(title,body){return gh('POST','/repos/'+owner+'/'+repo+'/issues',{title,body});}
function dispatcherIssue(issue){return issue&&!issue.pull_request&&String(issue.title||'').startsWith('[MLS Dispatcher]');}
function ledgerIssue(issue){return issue&&!issue.pull_request&&String(issue.title||'')==='[MLS Dispatcher Ledger]';}
function hasCommandMarker(issue){return /<!--\s*MLS_GLOBAL_DISPATCH_COMMAND\b/.test(String(issue?.body||''));}
function hasAssignmentState(issue){return Boolean(core.parseAssignmentState(issue?.body||''));}
function renderResponse(title,payload){return '## '+title+'\n\n'+JSON.stringify(payload,null,2)+'\n';}
async function getMainSha(){const ref=await gh('GET','/repos/'+owner+'/'+repo+'/git/ref/heads/main');return String(ref?.object?.sha||'');}
async function tryBranchHead(branch){
  try{const ref=await gh('GET','/repos/'+owner+'/'+repo+'/git/ref/heads/'+encodeURIComponent(branch));return String(ref?.object?.sha||'');}
  catch(error){if(error.status===404)return null;throw error;}
}
async function createBranch(branch,sha){
  return gh('POST','/repos/'+owner+'/'+repo+'/git/refs',{ref:'refs/heads/'+branch,sha});
}

async function ensureLedger(registry){
  const issues=await allIssues('open');
  for(const issue of issues.filter(ledgerIssue)){
    const raw=core.parseLedger(issue.body||'');if(raw)return {issue,ledger:core.normalizeLedger(raw,registry),dirty:false};
  }
  const ledger=core.initialLedger(registry);
  const issue=await createIssue('[MLS Dispatcher Ledger]',core.renderLedgerBody(ledger));
  return {issue,ledger,dirty:false};
}
async function saveLedger(item){
  if(!item.dirty)return;
  item.ledger.updatedAt=core.iso();
  await updateIssue(item.issue.number,{body:core.renderLedgerBody(item.ledger)});
  item.dirty=false;
}
function touchRequest(ledgerItem,requestId,patch){
  if(!requestId)return;
  ledgerItem.ledger.requests[requestId]={...(ledgerItem.ledger.requests[requestId]||{}),...patch,updatedAt:core.iso()};
  ledgerItem.dirty=true;
}
function setTerminal(ledgerItem,state,status='done'){
  ledgerItem.ledger.terminal[state.workId]={
    status,workVersion:state.workVersion,assignmentId:state.assignmentId,commitSha:state.finalCommitSha||state.lastCheckpointCommit||null,
    branch:state.branch,completedAt:core.iso()
  };
  delete ledgerItem.ledger.recoveries[state.workId];
  ledgerItem.ledger.epochs[state.workId]=Math.max(Number(ledgerItem.ledger.epochs[state.workId]||0),Number(state.leaseEpoch||0));
  touchRequest(ledgerItem,state.requestId,{status,workId:state.workId,assignmentId:state.assignmentId,issueNumber:state.issueNumber});
  ledgerItem.dirty=true;
}
async function recoveryFor(state){
  const head=await tryBranchHead(state.branch);
  const base=String(state.baseCommit||'');
  const checkpoint=String(state.lastCheckpointCommit||'');
  const hasBranchProgress=Boolean(head&&base&&head!==base);
  const hasCheckpointProgress=Boolean(checkpoint&&checkpoint!==base);
  const orphan=Boolean(head&&head!==(checkpoint||base));
  if(!hasBranchProgress&&!hasCheckpointProgress)return null;
  return {
    kind:orphan?'orphan_progress':'checkpoint_progress',
    workId:state.workId,workVersion:state.workVersion,branch:state.branch,baseCommit:base,
    lastCheckpointCommit:checkpoint||null,orphanHeadSha:orphan?head:null,resumeCommit:head||checkpoint||base,
    previousAssignmentId:state.assignmentId,previousEpoch:state.leaseEpoch,resourceLocks:state.resourceLocks||[],
    allowedPaths:state.allowedPaths||[],capturedAt:core.iso()
  };
}
async function finalizeAssignment(issue,state,ledgerItem,nowMs){
  const expired=core.isLeaseExpired(state,nowMs);
  if(state.readyToClose){
    const next={...state,status:'done',closedAt:core.iso(nowMs),releaseReason:null};
    setTerminal(ledgerItem,next,'done');
    await updateIssue(issue.number,{title:'[MLS Dispatcher][DONE] '+state.assignmentId+' '+state.workId,body:core.renderAssignmentBody(next),state:'closed',state_reason:'completed'});
    return {closed:true,state:next,recovery:false};
  }
  if(!state.cancelRequested&&!expired&&state.status==='leased')return {closed:false,state};
  const recovery=await recoveryFor(state);
  const reason=core.releaseReasonForAssignment(state,expired);
  let finalStatus=state.cancelRequested?'cancelled':'expired';
  if(recovery){
    ledgerItem.ledger.recoveries[state.workId]=recovery;
    ledgerItem.dirty=true;
    finalStatus='recovery_required';
  }
  ledgerItem.ledger.epochs[state.workId]=Math.max(Number(ledgerItem.ledger.epochs[state.workId]||0),Number(state.leaseEpoch||0));
  touchRequest(ledgerItem,state.requestId,{status:finalStatus,workId:state.workId,assignmentId:state.assignmentId,issueNumber:state.issueNumber});
  const next={...state,status:finalStatus,closedAt:core.iso(nowMs),releaseReason:reason,recoveryCaptured:recovery||null};
  await updateIssue(issue.number,{title:'[MLS Dispatcher]['+finalStatus.toUpperCase()+'] '+state.assignmentId+' '+state.workId,body:core.renderAssignmentBody(next),state:'closed',state_reason:'completed'});
  return {closed:true,state:next,recovery:Boolean(recovery)};
}
async function sweep(registry,ledgerItem,nowMs=Date.now()){
  const issues=await allIssues('open'),active=[],closed=[];
  for(const issue of issues){
    if(!dispatcherIssue(issue))continue;
    const state=core.parseAssignmentState(issue.body||'');if(!state)continue;
    const result=await finalizeAssignment(issue,state,ledgerItem,nowMs);
    if(result.closed)closed.push({issueNumber:issue.number,assignmentId:state.assignmentId,workId:state.workId,status:result.state.status,recovery:result.recovery});
    else active.push({issue,state});
  }
  await saveLedger(ledgerItem);
  return {active,closed};
}
async function closeCommand(issue,title,payload,stateReason='completed'){
  await updateIssue(issue.number,{title,body:renderResponse(title,payload),state:'closed',state_reason:stateReason});
}
async function reject(issue,error){
  await closeCommand(issue,'[MLS Dispatcher][REJECTED] '+issue.number,{ok:false,error:error.code||'DISPATCH_ERROR',message:error.message},'not_planned');
}
function duplicateAssignment(command,activeStates,ledger){
  const active=activeStates.find(x=>x.requestId===command.requestId);
  if(active)return {status:'assigned',workId:active.workId,assignmentId:active.assignmentId,issueNumber:active.issueNumber};
  return ledger.requests?.[command.requestId]||null;
}

async function drainPendingCommands(registry,ledgerItem){
  const now=Date.now(),s=await sweep(registry,ledgerItem,now),activeStates=s.active.map(x=>x.state);
  const issues=(await allIssues('open')).filter(x=>dispatcherIssue(x)&&!hasAssignmentState(x)&&hasCommandMarker(x)).sort((a,b)=>Number(a.number)-Number(b.number));
  const drained=[];
  let mainSha=null;
  for(const issue of issues){
    let command;
    try{command=core.parseCommand(issue.body||'');}catch(error){await reject(issue,error);drained.push({issueNumber:issue.number,status:'rejected'});continue;}
    if(command.operation==='status_global'){
      const progress=core.dispatchProgress(registry,ledgerItem.ledger,activeStates,now);
      await closeCommand(issue,'[MLS Dispatcher][STATUS] global',{ok:true,progress,reaped:s.closed});
      drained.push({issueNumber:issue.number,status:'status'});continue;
    }
    if(command.operation==='reap'){
      const progress=core.dispatchProgress(registry,ledgerItem.ledger,activeStates,now);
      await closeCommand(issue,'[MLS Dispatcher][REAP] complete',{ok:true,reaped:s.closed,progress});
      drained.push({issueNumber:issue.number,status:'reap'});continue;
    }
    const duplicate=duplicateAssignment(command,activeStates,ledgerItem.ledger);
    if(duplicate){
      await closeCommand(issue,'[MLS Dispatcher][DUPLICATE] '+command.requestId,{ok:true,duplicate:true,requestId:command.requestId,...duplicate});
      drained.push({issueNumber:issue.number,status:'duplicate'});continue;
    }
    if(core.isClaimStale(issue.created_at,now)){
      touchRequest(ledgerItem,command.requestId,{status:'stale',issueNumber:issue.number});
      await closeCommand(issue,'[MLS Dispatcher][STALE] '+command.requestId,{ok:false,error:'STALE_CLAIM',requestId:command.requestId,claimTtlMs:core.CLAIM_TTL_MS,createdAt:issue.created_at},'not_planned');
      drained.push({issueNumber:issue.number,status:'stale'});continue;
    }
    const selected=core.selectNextWork(registry,ledgerItem.ledger,activeStates,now);
    if(!selected){
      touchRequest(ledgerItem,command.requestId,{status:'no_work',issueNumber:issue.number});
      const progress=core.dispatchProgress(registry,ledgerItem.ledger,activeStates,now);
      await closeCommand(issue,'[MLS Dispatcher][NO_WORK] '+command.requestId,{ok:true,assigned:false,requestId:command.requestId,progress});
      drained.push({issueNumber:issue.number,status:'no_work'});continue;
    }
    const {item,recovery}=selected;
    let branch,baseCommit;
    if(recovery){
      branch=String(recovery.branch||'');baseCommit=String(recovery.baseCommit||'');
      const head=branch?await tryBranchHead(branch):null;
      if(!branch||!head){
        const error=core.dispatchError('RECOVERY_BRANCH_MISSING','Recovery sin rama accesible para '+item.workId,409);
        await reject(issue,error);drained.push({issueNumber:issue.number,status:'recovery_blocked',workId:item.workId});continue;
      }
    }else{
      if(!mainSha)mainSha=await getMainSha();
      baseCommit=mainSha;branch=core.assignmentBranch(item,issue.number);
      const existing=await tryBranchHead(branch);
      if(existing){
        const error=core.dispatchError('ASSIGNMENT_BRANCH_EXISTS','La rama del assignment ya existe: '+branch,409);
        await reject(issue,error);drained.push({issueNumber:issue.number,status:'branch_exists',workId:item.workId});continue;
      }
      await createBranch(branch,baseCommit);
    }
    const state=core.makeAssignmentState({
      issueNumber:issue.number,item,requestId:command.requestId,workerId:command.workerId,workerLogin:issue.user?.login||null,
      baseCommit,branch,recovery,now:core.iso(now)
    });
    await updateIssue(issue.number,{title:'[MLS Dispatcher][LEASED] '+state.assignmentId+' '+item.workId,body:core.renderAssignmentBody(state)});
    ledgerItem.ledger.epochs[item.workId]=Number(state.leaseEpoch);
    delete ledgerItem.ledger.recoveries[item.workId];
    touchRequest(ledgerItem,command.requestId,{status:'assigned',workId:item.workId,assignmentId:state.assignmentId,issueNumber:issue.number,branch});
    await saveLedger(ledgerItem);
    activeStates.push(state);
    drained.push({issueNumber:issue.number,status:'assigned',workId:item.workId,assignmentId:state.assignmentId,branch,ackDeadlineAt:state.ackDeadlineAt,recovery:Boolean(recovery)});
  }
  await saveLedger(ledgerItem);
  return {drained,reaped:s.closed};
}

async function main(){
  const registry=core.loadRegistry(root),ledgerItem=await ensureLedger(registry),result=await drainPendingCommands(registry,ledgerItem);
  if(result.drained.length||result.reaped.length)console.log(JSON.stringify({ok:true,...result}));
}
main().catch(error=>{console.error(error);process.exitCode=1});
