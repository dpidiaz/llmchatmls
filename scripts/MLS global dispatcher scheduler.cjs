'use strict';

const path=require('node:path');
const core=require('../MLS R32 EDITORIAL/global dispatcher/core.js');
const providerIntegration=require('../MLS R32 EDITORIAL/global dispatcher/providers/integration.js');
const recoveryContext=require('../MLS R32 EDITORIAL/global dispatcher/recovery.js');
const durable=require('../MLS R32 EDITORIAL/global dispatcher/durable.js');
let transaction=null;

const token=process.env.GITHUB_TOKEN||'';
const repository=process.env.GITHUB_REPOSITORY||'';
if(!token||!/^[^/]+\/[^/]+$/.test(repository))throw new Error('GITHUB_TOKEN/GITHUB_REPOSITORY faltante.');
const [owner,repo]=repository.split('/');
const root=path.resolve(__dirname,'..');

const remote=durable.githubClient({token,repository});
async function gh(method,endpoint,body){return transaction?transaction.call(method,endpoint,body):remote(method,endpoint,body);}
async function allIssues(){return transaction?transaction.issues(repository):(await durable.pages(gh,'/repos/'+repository+'/issues?state=open')).filter(x=>!x.pull_request);}
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
  try{return await gh('POST','/repos/'+owner+'/'+repo+'/git/refs',{ref:'refs/heads/'+branch,sha});}
  catch(error){if(error.status===422&&await tryBranchHead(branch)===sha)return;throw error;}
}

async function ensureLedger(registry){
  const issues=await allIssues('open');
  const ledgers=issues.filter(ledgerIssue);
  if(ledgers.length!==1)throw new Error('Exactly one existing dispatcher ledger required');
  for(const issue of ledgers){
    const raw=core.parseLedger(issue.body||'');if(raw)return {issue,ledger:core.normalizeLedger(raw,registry),dirty:false};
  }
  throw new Error('Existing dispatcher ledger required for safe migration');
}
async function saveLedger(item){
  if(!item.dirty)return;
  item.ledger.updatedAt=core.iso();
  await updateIssue(item.issue.number,{body:core.renderLedgerBody(item.ledger)});
  item.dirty=false;
}
function touchRequest(ledgerItem,requestId,patch){
  if(!requestId)return;
  const previous=ledgerItem.ledger.requests[requestId]||{};
  if(Object.entries(patch).every(([k,v])=>JSON.stringify(previous[k])===JSON.stringify(v)))return;
  ledgerItem.ledger.requests[requestId]={...previous,...patch,updatedAt:core.iso()};
  ledgerItem.dirty=true;
}
function setTerminal(ledgerItem,state,status='done'){
  ledgerItem.ledger.terminal[state.workId]={
    status,workVersion:state.workVersion,assignmentId:state.assignmentId,commitSha:state.finalCommitSha||state.lastCheckpointCommit||null,
    provider:state.provider||'global',completedUnits:providerIntegration.completedUnitsForState(state),
    branch:state.branch,completedAt:core.iso()
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
  if(!ancestryOk||!scopeOk||files.length>=300){
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
  const recovery=await recoveryFor(state)||{
    kind:'unchanged',workId:state.workId,workVersion:state.workVersion,branch:state.branch,baseCommit:state.baseCommit,
    previousAssignmentId:state.assignmentId,previousEpoch:state.leaseEpoch,lastCheckpointCommit:state.lastCheckpointCommit,
    checkpoints:state.checkpoints||[],integration:state.integration,integrationBaseCommit:state.recovery?.integrationBaseCommit||state.baseCommit
  };
  const reason=core.releaseReasonForAssignment(state,expired);
  let finalStatus=state.cancelRequested?'cancelled':'expired';
  if(recovery){
    recovery.workItem={
      workId:state.workId,version:state.workVersion,title:state.title,workType:state.workType,status:'recovery_required',priority:0,
      createdAt:state.claimedAt,dependsOn:state.dependencies||[],resourceLocks:state.resourceLocks||[],allowedPaths:state.allowedPaths||[],
      validation:state.validationRequired||[],provider:state.provider||'global',instructions:state.instructions||'',completion:state.completion||{requiresCommit:true,requiresValidation:true},
      integration:state.integration?structuredClone(state.integration):null,
      branchPolicy:{mode:'assignment',prefix:String(state.branch||('worker/'+state.workId)).replace(/\/\d{6}(?:\/epoch-\d+(?:-[a-f0-9]+)?)?$/,'')}
    };
    recovery.completedUnits=providerIntegration.completedUnitsForState(state);
    recovery.ownerRequestId=state.cancelRequested?null:state.requestId;
    recovery.durableLineage=true;
    ledgerItem.ledger.recoveries[state.workId]=recovery;
    ledgerItem.dirty=true;
    finalStatus='recovery_required';
  }
  ledgerItem.ledger.epochs[state.workId]=Math.max(Number(ledgerItem.ledger.epochs[state.workId]||0),Number(state.leaseEpoch||0));
  if(!state.cancelRequested){
    const previous=ledgerItem.ledger.requests[state.requestId]||{};
    const command=previous.command||{operation:'claim',requestId:state.requestId,workerId:state.workerId};
    touchRequest(ledgerItem,state.requestId,{status:'queued',command,workId:state.workId,issueNumber:state.issueNumber,generation:Number(state.leaseEpoch)+1,previousAssignment:state});
    await updateIssue(issue.number,{title:'[MLS Dispatcher][QUEUED] '+state.requestId,body:core.renderCommandBody(command),state:'open'});
    return {closed:true,state:{...state,status:'requeued'},recovery:true};
  }
  finalStatus='cancelled';
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
    if(duplicate&&!(duplicate.status==='queued'&&Number(duplicate.issueNumber)===Number(issue.number))){
      await closeCommand(issue,'[MLS Dispatcher][DUPLICATE] '+command.requestId,{ok:true,duplicate:true,requestId:command.requestId,...duplicate});
      drained.push({issueNumber:issue.number,status:'duplicate'});continue;
    }
    touchRequest(ledgerItem,command.requestId,{status:'queued',command,issueNumber:issue.number});
    await updateIssue(issue.number,{title:'[MLS Dispatcher][QUEUED] '+command.requestId});
    const comments=await durable.pages(gh,'/repos/'+repository+'/issues/'+issue.number+'/comments');
    const cancellation=comments.find(c=>{
      if(c.user?.login!==issue.user?.login)return false;
      try{const e=core.parseWorkerEvent(c.body);return e.operation==='cancel'&&e.requestId===command.requestId;}catch{return false;}
    });
    if(cancellation){
      touchRequest(ledgerItem,command.requestId,{status:'cancelled',cancelCommentId:cancellation.id});
      for(const r of Object.values(ledgerItem.ledger.recoveries))if(r.ownerRequestId===command.requestId)r.ownerRequestId=null;
      await closeCommand(issue,'[MLS Dispatcher][CANCELLED] '+command.requestId,{requestId:command.requestId,explicitCancelCommentId:cancellation.id},'not_planned');
      continue;
    }
    let registry=runtimeRegistry();
    let selected=core.selectNextWork(registry,ledgerItem.ledger,activeStates,now,command.requestId);
    if(!selected){
      registry=runtimeRegistry(true);
      selected=core.selectNextWork(registry,ledgerItem.ledger,activeStates,now,command.requestId);
    }
    if(!selected){
      const progress=progressFor(registry);
      // A missing candidate is not proof of corpus exhaustion (locks, capacity, provider failure).
      const complete=providerIntegration.corpusComplete({root,issues:providerIssues,registry,ledger:ledgerItem.ledger,states:activeStates});
      if(complete){
        touchRequest(ledgerItem,command.requestId,{status:'corpus_complete'});
        await closeCommand(issue,'[MLS Dispatcher][CORPUS_COMPLETE] '+command.requestId,{ok:true,requestId:command.requestId,progress});
      }
      drained.push({issueNumber:issue.number,status:complete?'corpus_complete':'queued'});continue;
    }
    let item=selected.item;
    let recovery=selected.recovery,branch,baseCommit;
    const request=ledgerItem.ledger.requests[command.requestId];
    const epoch=Math.max(Number(request.generation||issue.number),Number(ledgerItem.ledger.epochs[item.workId]||0)+1);
    const branchName=()=>core.assignmentBranch(item,issue.number)+'/epoch-'+epoch+'-'+baseCommit.slice(0,12);
    if(recovery){
      if(item.workType==='integration'){
        try{
          // New generations retain their full accepted lineage in the atomic ledger.
          if(!recovery.durableLineage)recovery=await recoveryContext.restore(recovery,item,async number=>{
            const issue=await gh('GET','/repos/'+owner+'/'+repo+'/issues/'+number);
            return core.parseAssignmentState(issue.body||'');
          });
          item={...item,integration:recovery.integration};
        }catch(error){touchRequest(ledgerItem,command.requestId,{blockedReason:error.code});drained.push({issueNumber:issue.number,status:'recovery_blocked',workId:item.workId});continue;}
      }
      const previousBranch=String(recovery.branch||''),previousHead=previousBranch?await tryBranchHead(previousBranch):null;
      if(!previousBranch||!previousHead){
        const error=core.dispatchError('RECOVERY_BRANCH_MISSING','Recovery sin rama accesible para '+item.workId,409);
        touchRequest(ledgerItem,command.requestId,{blockedReason:error.code});drained.push({issueNumber:issue.number,status:'recovery_blocked',workId:item.workId});continue;
      }
      const resume=await recoveryResume(recovery,item);
      baseCommit=resume.resumeCommit;
      branch=branchName();
      const existing=await tryBranchHead(branch);
      if(existing&&existing!==baseCommit){
        const error=core.dispatchError('ASSIGNMENT_BRANCH_EXISTS','La rama generacional de recovery ya existe: '+branch,409);
        touchRequest(ledgerItem,command.requestId,{blockedReason:error.code});drained.push({issueNumber:issue.number,status:'branch_exists',workId:item.workId});continue;
      }
      if(!existing)await createBranch(branch,baseCommit);
      recovery={...recovery,...resume,previousBranch,recoveryBranch:branch};
    }else{
      if(!mainSha)mainSha=await getMainSha();
      baseCommit=mainSha;branch=branchName();
      const existing=await tryBranchHead(branch);
      if(existing&&existing!==baseCommit){
        const error=core.dispatchError('ASSIGNMENT_BRANCH_EXISTS','La rama del assignment ya existe: '+branch,409);
        touchRequest(ledgerItem,command.requestId,{blockedReason:error.code});drained.push({issueNumber:issue.number,status:'branch_exists',workId:item.workId});continue;
      }
      if(!existing)await createBranch(branch,baseCommit);
    }
    const issueLogin=String(issue.user?.login||'').trim();
    const delegatedLogin=String(command.workerLogin||'').trim();
    const trustedAutoPull=issueLogin==='github-actions[bot]'&&String(command.requestId||'').startsWith('autopull:');
    const workerLogin=trustedAutoPull&&delegatedLogin?delegatedLogin:(issueLogin||null);
    const state=core.makeAssignmentState({
      issueNumber:issue.number,item,requestId:command.requestId,workerId:command.workerId,workerLogin,
      baseCommit,branch,recovery,now:core.iso(),epoch
    });
    state.publicationPending=true;
    if(recovery?.completedUnits?.length)state.recoveredCompletedUnits=[...new Set(recovery.completedUnits.map(String))];
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
  const store=new durable.GitStore(remote,repository);
  // Repair publication before reaping. Unpublished leases retain their reservation.
  await durable.project(store,remote,repository);
  const result=await durable.transact(store,remote,async tx=>{
    transaction=tx;
    // Replay every durable worker comment before considering expiry, including after a restart/403.
    const worker=require('./MLS global dispatcher worker.cjs');
    await worker.replay(gh,await allIssues());
    const baseRegistry=core.loadRegistry(root),ledgerItem=await ensureLedger(baseRegistry);
    return drainPendingCommands(baseRegistry,ledgerItem);
  });
  transaction=null;
  await durable.project(store,remote,repository);
  console.log(JSON.stringify({ok:true,...result}));
}
module.exports={main};
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1});
