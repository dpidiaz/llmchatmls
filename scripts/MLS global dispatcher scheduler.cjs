'use strict';

const path=require('node:path');
const core=require('../MLS R32 EDITORIAL/global dispatcher/core.js');
const providerIntegration=require('../MLS R32 EDITORIAL/global dispatcher/providers/integration.js');
const recoveryContext=require('../MLS R32 EDITORIAL/global dispatcher/recovery.js');

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
  const out=[];
  for(let page=1;page<=100;page++){
    const join=endpoint.includes('?')?'&':'?';
    const rows=await gh('GET',endpoint+join+'per_page=100&page='+page);
    if(!Array.isArray(rows))throw core.dispatchError('ISSUE_SCAN_INVALID','GitHub no devolvió una página de issues válida.',503);
    out.push(...rows);
    if(rows.length<100)return out;
  }
  // A partial closed-issue scan would allow reassigning older completed work.
  throw core.dispatchError('ISSUE_SCAN_INCOMPLETE','Se alcanzó el máximo de páginas; se detiene la adjudicación.',503);
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
function encodeRef(ref){return String(ref).split('/').map(encodeURIComponent).join('/');}
async function tryBranchHead(branch){
  try{const ref=await gh('GET','/repos/'+owner+'/'+repo+'/git/ref/heads/'+encodeRef(branch));return String(ref?.object?.sha||'');}
  catch(error){if(error.status===404)return null;throw error;}
}
async function createBranch(branch,sha){
  return gh('POST','/repos/'+owner+'/'+repo+'/git/refs',{ref:'refs/heads/'+branch,sha});
}

async function ensureLedger(registry){
  const issues=await allIssues('open'),matches=issues.filter(ledgerIssue);
  if(matches.length>1)throw core.dispatchError('LEDGER_CARDINALITY','Más de un ledger Global Dispatcher; adjudicación detenida.',503);
  if(matches.length===1){
    const issue=matches[0],raw=core.parseLedger(issue.body||'');
    if(!raw)throw core.dispatchError('LEDGER_UNREADABLE','Ledger existente ilegible: nunca crear un ledger vacío sustituto.',503);
    return {issue,ledger:core.normalizeLedger(raw,registry),persistedHash:core.sha256(raw),dirty:false};
  }
  const ledger=core.initialLedger(registry);
  const issue=await createIssue('[MLS Dispatcher Ledger]',core.renderLedgerBody(ledger));
  return {issue,ledger,persistedHash:core.sha256(ledger),dirty:false};
}
async function saveLedger(item){
  if(!item.dirty)return;
  // Single scheduler concurrency group plus a live read guard. A stale writer must fail closed.
  const live=await gh('GET','/repos/'+owner+'/'+repo+'/issues/'+item.issue.number);
  const old=core.parseLedger(live.body||'');
  if(!old||core.sha256(old)!==item.persistedHash)throw core.dispatchError('LEDGER_WRITE_CONFLICT','El ledger cambió desde su lectura; no sobrescribir terminales.',409);
  const proposed={...item.ledger,updatedAt:core.iso()};
  const body=core.renderLedgerBody(proposed); // byte-limit preflight BEFORE PATCH
  if(core.sha256(core.parseLedger(body))!==core.sha256(proposed))throw core.dispatchError('LEDGER_ROUNDTRIP_FAILED','La compresión no conserva exactamente el ledger.',503);
  await updateIssue(item.issue.number,{body});
  const readback=await gh('GET','/repos/'+owner+'/'+repo+'/issues/'+item.issue.number);
  const persisted=core.parseLedger(readback.body||'');
  if(!persisted||core.sha256(persisted)!==core.sha256(proposed))throw core.dispatchError('LEDGER_PERSISTENCE_MISMATCH','PATCH no persistió exactamente el ledger; detener la cola.',503);
  item.ledger=proposed;item.persistedHash=core.sha256(proposed);item.issue=readback;item.dirty=false;
}
function touchRequest(ledgerItem,requestId,patch){
  if(!requestId)return;
  ledgerItem.ledger.requests[requestId]={...(ledgerItem.ledger.requests[requestId]||{}),...patch,updatedAt:core.iso()};
  ledgerItem.dirty=true;
}
function setTerminal(ledgerItem,state,status='done'){
  ledgerItem.ledger.terminal[state.workId]={
    status,workVersion:state.workVersion,assignmentId:state.assignmentId,commitSha:state.finalCommitSha||state.lastCheckpointCommit||null,
    provider:state.provider||'global',completedUnits:providerIntegration.completedUnitsForState(state),
    branch:state.branch,completedAt:state.closedAt||core.iso()
  };
  delete ledgerItem.ledger.recoveries[state.workId];
  ledgerItem.ledger.epochs[state.workId]=Math.max(Number(ledgerItem.ledger.epochs[state.workId]||0),Number(state.leaseEpoch||0));
  touchRequest(ledgerItem,state.requestId,{status,workId:state.workId,assignmentId:state.assignmentId,issueNumber:state.issueNumber});
  ledgerItem.dirty=true;
}
async function recoveryFor(state){
  const head=await tryBranchHead(state.branch);
  return core.classifyRecoveryState(state,head);
}
async function recoveryResume(recovery,item){
  const checkpoint=String(recovery?.lastCheckpointCommit||recovery?.baseCommit||'');
  const orphan=String(recovery?.orphanHeadSha||'');
  if(!checkpoint)throw core.dispatchError('RECOVERY_BASE_MISSING','Recovery sin commit base para '+item.workId,409);
  if(!orphan)return {resumeCommit:checkpoint,orphanReused:false,orphanScopeValidated:false};
  const comparison=await gh('GET','/repos/'+owner+'/'+repo+'/compare/'+checkpoint+'...'+orphan);
  const files=Array.isArray(comparison?.files)?comparison.files.map(x=>String(x.filename||'')):[];
  const ancestryOk=['ahead','identical'].includes(String(comparison?.status||''));
  const scopeOk=files.every(file=>core.pathAllowed(file,item.allowedPaths||[]));
  if(!ancestryOk||!scopeOk){
    return {resumeCommit:checkpoint,orphanReused:false,orphanScopeValidated:true,orphanRejectedReason:!ancestryOk?'ORPHAN_NOT_DESCENDANT':'ORPHAN_SCOPE_VIOLATION'};
  }
  return {resumeCommit:orphan,orphanReused:true,orphanScopeValidated:true,orphanFileCount:files.length};
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
    recovery.workItem={
      workId:state.workId,version:state.workVersion,title:state.title,workType:state.workType,status:'recovery_required',priority:0,
      createdAt:state.claimedAt,dependsOn:state.dependencies||[],resourceLocks:state.resourceLocks||[],allowedPaths:state.allowedPaths||[],
      validation:state.validationRequired||[],provider:state.provider||'global',instructions:state.instructions||'',completion:state.completion||{requiresCommit:true,requiresValidation:true},
      integration:state.integration?structuredClone(state.integration):null,
      branchPolicy:{mode:'assignment',prefix:String(state.branch||('worker/'+state.workId)).replace(/\/\d{6}$/,'')}
    };
    recovery.completedUnits=providerIntegration.completedUnitsForState(state);
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
async function reconcileClosedDone(ledgerItem){
  // Closed assignment issues are durable independent evidence when issue #709 lags behind.
  // Oldest DONE wins on a duplicate workId; newer divergent commits are quarantined/logged.
  const closed=await allIssues('closed');
  const history=closed.filter(issue=>String(issue.title||'').startsWith('[MLS Dispatcher][DONE]'))
    .map(issue=>({issue,state:core.parseAssignmentState(issue.body||'')}))
    .filter(({state})=>state&&state.status==='done'&&state.workId&&state.assignmentId)
    .sort((a,b)=>Number(a.issue.number)-Number(b.issue.number));
  let recovered=0;const conflicts=[];
  for(const {issue,state} of history){
    const commitSha=state.finalCommitSha||state.lastCheckpointCommit||null;
    const previous=ledgerItem.ledger.terminal[state.workId]||null;
    const priorIssue=Number(String(previous?.assignmentId||'').match(/\d+$/)?.[0]||0);
    const preferEarlier=previous?.status==='done'&&priorIssue>Number(issue.number);
    if(!previous||preferEarlier){
      if(previous&&previous.commitSha!==commitSha)conflicts.push({workId:state.workId,canonical:state.assignmentId,duplicate:previous.assignmentId,canonicalCommit:commitSha,duplicateCommit:previous.commitSha});
      setTerminal(ledgerItem,state,'done');
      recovered++;
    }else if(previous?.status==='done'&&previous.commitSha!==commitSha){
      conflicts.push({workId:state.workId,canonical:previous.assignmentId,duplicate:state.assignmentId,canonicalCommit:previous.commitSha,duplicateCommit:commitSha});
    }
    const canonical=ledgerItem.ledger.terminal[state.workId]?.assignmentId===state.assignmentId;
    const status=canonical?'done':'duplicate_done';
    const request=ledgerItem.ledger.requests?.[state.requestId];
    if(state.requestId&&(!request||request.status!==status||request.assignmentId!==state.assignmentId))
      touchRequest(ledgerItem,state.requestId,{status,workId:state.workId,assignmentId:state.assignmentId,issueNumber:state.issueNumber});
    const epoch=Math.max(Number(ledgerItem.ledger.epochs[state.workId]||0),Number(state.leaseEpoch||0));
    if(epoch!==Number(ledgerItem.ledger.epochs[state.workId]||0)){ledgerItem.ledger.epochs[state.workId]=epoch;ledgerItem.dirty=true;}
    if(ledgerItem.ledger.recoveries[state.workId]){delete ledgerItem.ledger.recoveries[state.workId];ledgerItem.dirty=true;}
  }
  if(conflicts.length)console.warn(JSON.stringify({warning:'DUPLICATE_DONE_COMMIT_CONFLICT',conflicts}));
  await saveLedger(ledgerItem);
  return {recovered,conflicts};
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
  // Older schedulers discarded unchanged recovery generations on cancellation/expiry.
  // Rebuild only the latest inactive integration generation with durable recovery history.
  const latest=new Map();
  for(const request of Object.values(ledgerItem.ledger.requests||{})){
    if(request.workId&&(!latest.has(request.workId)||Number(request.issueNumber)>Number(latest.get(request.workId).issueNumber)))latest.set(request.workId,request);
  }
  for(const [workId,request] of latest){
    if(!['cancelled','expired','recovery_required'].includes(request.status)||ledgerItem.ledger.terminal[workId]||ledgerItem.ledger.recoveries[workId]||active.some(x=>x.state.workId===workId))continue;
    const historicalIssue=await gh('GET','/repos/'+owner+'/'+repo+'/issues/'+Number(request.issueNumber));
    const state=core.parseAssignmentState(historicalIssue.body||'');
    if(!state||state.workType!=='integration'||!state.recovery||state.workId!==workId||state.issueNumber!==Number(request.issueNumber)||!['cancelled','expired','recovery_required'].includes(state.status))continue;
    const captured=await recoveryFor(state);
    if(!captured)continue;
    const item=core.normalizeWorkItem({workId,version:state.workVersion,title:state.title,workType:state.workType,status:'recovery_required',priority:0,createdAt:state.claimedAt,dependsOn:state.dependencies||[],resourceLocks:state.resourceLocks,allowedPaths:state.allowedPaths,validation:state.validationRequired||[],provider:state.provider,instructions:state.instructions,completion:state.completion,branchPolicy:{mode:'assignment',prefix:String(state.branch).replace(/\/\d{6}$/,'')}});
    const restored=await recoveryContext.restore(captured,item,async number=>core.parseAssignmentState((await gh('GET','/repos/'+owner+'/'+repo+'/issues/'+number)).body||''));
    restored.workItem={...item,integration:restored.integration};
    restored.completedUnits=providerIntegration.completedUnitsForState(state);
    ledgerItem.ledger.recoveries[workId]=restored;
    ledgerItem.dirty=true;
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

async function drainPendingCommands(baseRegistry,ledgerItem){
  const history=await reconcileClosedDone(ledgerItem);
  const now=Date.now(),s=await sweep(baseRegistry,ledgerItem,now),activeStates=s.active.map(x=>x.state);
  const providerIssues=await allIssues('open');
  let cachedRegistry=null;
  function runtimeRegistry(refresh=false){
    if(cachedRegistry&&!refresh)return cachedRegistry;
    const dynamic=providerIntegration.materializeProviderItems({issues:providerIssues,root,now,globalLedger:ledgerItem.ledger,globalAssignments:activeStates});
    if(dynamic.diagnostics.length)console.warn(JSON.stringify({providerDiagnostics:dynamic.diagnostics}));
    cachedRegistry=providerIntegration.extendRegistry(baseRegistry,{items:dynamic.items,globalLedger:ledgerItem.ledger});
    return cachedRegistry;
  }
  function progressFor(registry){
    const staging=providerIntegration.r33StagingManifest(ledgerItem.ledger,{createdAt:core.iso(now)});
    return {
      ...core.dispatchProgress(registry,ledgerItem.ledger,activeStates,now),
      queueTarget:providerIntegration.READY_QUEUE_TARGET,
      staging:{entryCount:staging.entryCount,snapshotHash:staging.snapshotHash}
    };
  }
  const issues=providerIssues.filter(x=>dispatcherIssue(x)&&!hasAssignmentState(x)&&hasCommandMarker(x)).sort((a,b)=>Number(a.number)-Number(b.number));
  const drained=[];
  let mainSha=null;
  for(const issue of issues){
    let command;
    try{command=core.parseCommand(issue.body||'');}catch(error){await reject(issue,error);drained.push({issueNumber:issue.number,status:'rejected'});continue;}
    if(command.operation==='status_global'){
      const registry=runtimeRegistry();
      const progress=progressFor(registry);
      await closeCommand(issue,'[MLS Dispatcher][STATUS] global',{ok:true,progress,reaped:s.closed});
      drained.push({issueNumber:issue.number,status:'status'});continue;
    }
    if(command.operation==='reap'){
      const registry=runtimeRegistry();
      const progress=progressFor(registry);
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
    let registry=runtimeRegistry();
    let selected=core.selectNextWork(registry,ledgerItem.ledger,activeStates,now);
    if(!selected){
      registry=runtimeRegistry(true);
      selected=core.selectNextWork(registry,ledgerItem.ledger,activeStates,now);
    }
    if(!selected){
      const progress=progressFor(registry);
      const activeR33=activeStates.filter(state=>state&&state.status==='leased'&&!state.readyToClose&&!state.cancelRequested&&state.provider==='r33-farm').length;
      if(activeR33>0){
        touchRequest(ledgerItem,command.requestId,{status:'capacity_busy',issueNumber:issue.number});
        await closeCommand(issue,'[MLS Dispatcher][CAPACITY_BUSY] '+command.requestId,{ok:true,assigned:false,retryable:true,reason:'WORK_TEMPORARILY_LEASED',requestId:command.requestId,activeR33,progress});
        drained.push({issueNumber:issue.number,status:'capacity_busy'});continue;
      }
      touchRequest(ledgerItem,command.requestId,{status:'no_work',issueNumber:issue.number});
      await closeCommand(issue,'[MLS Dispatcher][NO_WORK] '+command.requestId,{ok:true,assigned:false,requestId:command.requestId,reason:'CORPUS_EXHAUSTED_OR_NO_ELIGIBLE_BACKLOG',progress});
      drained.push({issueNumber:issue.number,status:'no_work'});continue;
    }
    let item=selected.item;
    let recovery=selected.recovery,branch,baseCommit;
    if(recovery){
      if(item.workType==='integration'){
        try{
          recovery=await recoveryContext.restore(recovery,item,async number=>{
            const issue=await gh('GET','/repos/'+owner+'/'+repo+'/issues/'+number);
            return core.parseAssignmentState(issue.body||'');
          });
          item={...item,integration:recovery.integration};
        }catch(error){await reject(issue,error);drained.push({issueNumber:issue.number,status:'recovery_blocked',workId:item.workId});continue;}
      }
      const previousBranch=String(recovery.branch||''),previousHead=previousBranch?await tryBranchHead(previousBranch):null;
      if(!previousBranch||!previousHead){
        const error=core.dispatchError('RECOVERY_BRANCH_MISSING','Recovery sin rama accesible para '+item.workId,409);
        await reject(issue,error);drained.push({issueNumber:issue.number,status:'recovery_blocked',workId:item.workId});continue;
      }
      const resume=await recoveryResume(recovery,item);
      baseCommit=resume.resumeCommit;
      branch=core.assignmentBranch(item,issue.number);
      const existing=await tryBranchHead(branch);
      if(existing){
        const error=core.dispatchError('ASSIGNMENT_BRANCH_EXISTS','La rama generacional de recovery ya existe: '+branch,409);
        await reject(issue,error);drained.push({issueNumber:issue.number,status:'branch_exists',workId:item.workId});continue;
      }
      await createBranch(branch,baseCommit);
      recovery={...recovery,...resume,previousBranch,recoveryBranch:branch};
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
    const issueLogin=String(issue.user?.login||'').trim();
    const delegatedLogin=String(command.workerLogin||'').trim();
    const trustedAutoPull=issueLogin==='github-actions[bot]'&&String(command.requestId||'').startsWith('autopull:');
    const workerLogin=trustedAutoPull&&delegatedLogin?delegatedLogin:(issueLogin||null);
    const state=core.makeAssignmentState({
      issueNumber:issue.number,item,requestId:command.requestId,workerId:command.workerId,workerLogin,
      baseCommit,branch,recovery,now:core.iso(now)
    });
    if(recovery?.completedUnits?.length)state.recoveredCompletedUnits=[...new Set(recovery.completedUnits.map(String))];
    ledgerItem.ledger.epochs[item.workId]=Number(state.leaseEpoch);
    delete ledgerItem.ledger.recoveries[item.workId];
    touchRequest(ledgerItem,command.requestId,{status:'assigned',workId:item.workId,assignmentId:state.assignmentId,issueNumber:issue.number,branch});
    // Persist and independently verify reservation BEFORE publishing a usable lease.
    await saveLedger(ledgerItem);
    await updateIssue(issue.number,{title:'[MLS Dispatcher][LEASED] '+state.assignmentId+' '+item.workId,body:core.renderAssignmentBody(state)});
    activeStates.push(state);
    drained.push({issueNumber:issue.number,status:'assigned',workId:item.workId,assignmentId:state.assignmentId,branch,ackDeadlineAt:state.ackDeadlineAt,recovery:Boolean(recovery)});
  }
  await saveLedger(ledgerItem);
  return {drained,reaped:s.closed,history};
}

async function main(){
  const baseRegistry=core.loadRegistry(root),ledgerItem=await ensureLedger(baseRegistry),result=await drainPendingCommands(baseRegistry,ledgerItem);
  if(result.drained.length||result.reaped.length)console.log(JSON.stringify({ok:true,...result}));
}
main().catch(error=>{console.error(error);process.exitCode=1});
