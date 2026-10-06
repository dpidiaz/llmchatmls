'use strict';

const path=require('node:path');
const core=require('../MLS R32 EDITORIAL/global dispatcher/core.js');
const providerIntegration=require('../MLS R32 EDITORIAL/global dispatcher/providers/integration.js');
const recoveryContext=require('../MLS R32 EDITORIAL/global dispatcher/recovery.js');
const buffered=require('../MLS R32 EDITORIAL/r4 buffered allocation.cjs');
const bufferedFinalize=require('../MLS R32 EDITORIAL/r4 buffered finalize.cjs');
const elasticScheduler=require('../MLS R32 EDITORIAL/r4 elastic scheduler.cjs');
const elasticCore=require('../MLS R32 EDITORIAL/r4 elastic core.cjs');
const revisions=require('../MLS R32 EDITORIAL/r4 staging supersession.cjs');
const child=require('node:child_process');
const backoff=require('../MLS R32 EDITORIAL/r4 github backoff.cjs');

const token=process.env.GITHUB_TOKEN||'';
const repository=process.env.GITHUB_REPOSITORY||'';
if(!token||!/^[^/]+\/[^/]+$/.test(repository))throw new Error('GITHUB_TOKEN/GITHUB_REPOSITORY faltante.');
const [owner,repo]=repository.split('/');
const root=path.resolve(__dirname,'..');

const unifiedBase=String(process.env.MLS_UNIFIED_BASE_URL||'https://llmchatmls.dpidiaz.workers.dev').replace(/\/$/,'');
const editorialKey=String(process.env.MLS_EDITORIAL_CHAT_KEY||'');
async function livePreparedDrainCodes(){
  if(!editorialKey)return null;
  try{
    const response=await fetch(unifiedBase+'/api/unified-runner/status',{
      method:'POST',
      headers:{authorization:'Bearer '+editorialKey,'content-type':'application/json',accept:'application/json'},
      body:'{}'
    });
    if(!response.ok)throw Error('HTTP '+response.status);
    const data=await response.json();
    const codes=data&&data.canonical&&Array.isArray(data.canonical.preparedCodes)?data.canonical.preparedCodes:[];
    const valid=codes.map(x=>String(x||'').toUpperCase()).filter(x=>/^MLS-V\d{2}-\d{4}$/.test(x));
    if(valid.length!==codes.length)throw Error('PREPARED_CODE_INVALID');
    console.log('MLS_LIVE_PREPARED_DRAIN '+JSON.stringify({count:valid.length}));
    return new Set(valid);
  }catch(error){
    console.warn('MLS_LIVE_PREPARED_DRAIN_FALLBACK '+String(error&&error.message||error));
    return null;
  }
}

const githubApiCounts={GET:0,POST:0,PATCH:0,PUT:0,DELETE:0};
if(typeof process.on==='function')process.on('exit',()=>console.log('MLS_R4_GITHUB_API_METRICS '+JSON.stringify({module:'scheduler',calls:githubApiCounts,total:Object.values(githubApiCounts).reduce((a,b)=>a+b,0)})));
async function gh(method,endpoint,body){
  backoff.check(process.env.MLS_GITHUB_COOLDOWN_FILE);
  if(Object.hasOwn(githubApiCounts,method))githubApiCounts[method]++;
  const response=await fetch('https://api.github.com'+endpoint,{
    method,
    headers:{authorization:'Bearer '+token,accept:'application/vnd.github+json','content-type':'application/json','x-github-api-version':'2022-11-28','user-agent':'mls-global-dispatcher-r1'},
    body:body===undefined?undefined:JSON.stringify(body)
  });
  const text=await response.text();let data=null;try{data=text?JSON.parse(text):null}catch{data=text}
  if(!response.ok){const e=new Error('GitHub '+response.status+': '+(data?.message||text));e.status=response.status;
    if([403,429].includes(response.status))e.cooldown=backoff.record(process.env.MLS_GITHUB_COOLDOWN_FILE,response);
    throw e;}
  return data;
}
async function pages(endpoint){
  const out=[];for(let page=1;page<=20;page++){const join=endpoint.includes('?')?'&':'?';const rows=await gh('GET',endpoint+join+'per_page=100&page='+page);
    if(!Array.isArray(rows))throw core.dispatchError('GITHUB_PAGE_INVALID');out.push(...rows);if(rows.length<100)return out;}
  throw core.dispatchError('GITHUB_PAGE_LIMIT','Incomplete inventory: no allocation allowed.',503);
}
async function allIssues(state='open'){return (await pages('/repos/'+owner+'/'+repo+'/issues?state='+state)).filter(x=>!x.pull_request);}
async function updateIssue(number,patch){return gh('PATCH','/repos/'+owner+'/'+repo+'/issues/'+number,patch);}
async function createIssue(title,body){return gh('POST','/repos/'+owner+'/'+repo+'/issues',{title,body});}
function dispatcherIssue(issue){return issue&&!issue.pull_request&&String(issue.title||'').startsWith('[MLS Dispatcher]');}
function ledgerIssue(issue){return issue&&!issue.pull_request&&String(issue.title||'')==='[MLS Dispatcher Ledger]';}
function hasCommandMarker(issue){return /<!--\s*MLS_GLOBAL_DISPATCH_COMMAND\b/.test(String(issue?.body||''));}
const DISPATCH_AUTHORIZED_ASSOCIATIONS=new Set(['OWNER','MEMBER','COLLABORATOR']);
function dispatcherCommandAuthorized(issue,command){
  const association=String(issue?.author_association||'').toUpperCase();
  if(DISPATCH_AUTHORIZED_ASSOCIATIONS.has(association))return true;
  const login=String(issue?.user?.login||'');
  return login==='github-actions[bot]'&&command?.operation==='claim'&&String(command?.requestId||'').startsWith('autopull:');
}
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
  const issues=await allIssues('open');
  if(issues.filter(ledgerIssue).length!==1)throw core.dispatchError('GLOBAL_LEDGER_CARDINALITY','Exactly one canonical ledger is required; never mint a replacement automatically.',503);
  for(const issue of issues.filter(ledgerIssue)){
    const raw=core.parseLedger(issue.body||'');
    // A corrupt or truncated ledger is never permission to create an empty one.
    if(!raw)throw core.dispatchError('LEDGER_CORRUPT','Ledger #'+issue.number+' inválido: deteniendo adjudicaciones.',503);
    return {issue,ledger:core.normalizeLedger(raw,registry),dirty:false,baselineHash:core.sha256(issue.body||'')};
  }
  const ledger=core.initialLedger(registry);
  const issue=await createIssue('[MLS Dispatcher Ledger]',core.renderLedgerBody(ledger));
  return {issue,ledger,dirty:false,baselineHash:core.sha256(issue.body||'')};
}
async function saveLedger(item){
  if(!item.dirty)return;
  // The workflow is serialized, but verify GitHub persistence and refuse stale writes.
  const before=await gh('GET','/repos/'+owner+'/'+repo+'/issues/'+item.issue.number);
  if(core.sha256(before.body||'')!==item.baselineHash)throw core.dispatchError('LEDGER_WRITE_CONFLICT','El ledger cambió desde la lectura inicial.',409);
  item.ledger.updatedAt=core.iso();
  const body=core.renderLedgerBody(item.ledger); // Size-checked before PATCH.
  await updateIssue(item.issue.number,{body});
  const after=await gh('GET','/repos/'+owner+'/'+repo+'/issues/'+item.issue.number);
  const persisted=core.parseLedger(after.body||'');
  if(!persisted||core.sha256(persisted)!==core.sha256(item.ledger))
    throw core.dispatchError('LEDGER_WRITE_NOT_PERSISTED','GitHub no persistió exactamente el ledger. Detener adjudicaciones.',503);
  item.issue=after;item.baselineHash=core.sha256(after.body||'');
  item.dirty=false;
}
async function reconcileCompletedIssues(item){
  const saved=core.parseDate(item.ledger.updatedAt);
  if(saved===null)throw core.dispatchError('LEDGER_TIMESTAMP_INVALID','Ledger sin updatedAt verificable.',503);
  // Re-read authoritative closed DONE issues, including items lost from saturated ledger #709.
  const since=encodeURIComponent(core.iso(Math.max(0,saved-10*60*1000))),done=[];
  let exhausted=false;
  for(let page=1;page<=30;page++){
    const rows=await gh('GET','/repos/'+owner+'/'+repo+'/issues?state=closed&sort=updated&direction=asc&since='+since+'&per_page=100&page='+page);
    if(!Array.isArray(rows))throw core.dispatchError('DONE_SCAN_INVALID','Respuesta no verificable al reconciliar DONE.',503);
    for(const issue of rows){
      if(issue.pull_request||!String(issue.title||'').startsWith('[MLS Dispatcher][DONE]'))continue;
      const state=core.parseAssignmentState(issue.body||'');
      if(!state||state.status!=='done'||state.issueNumber!==issue.number)
        throw core.dispatchError('DONE_STATE_INVALID','Issue DONE #'+issue.number+' sin bloque durable válido.',503);
      done.push(state);
    }
    if(rows.length<100){exhausted=true;break;}
  }
  if(!exhausted)throw core.dispatchError('DONE_SCAN_INCOMPLETE','Más de 3000 issues actualizados; sin adjudicaciones hasta reconciliar.',503);
  const changed=core.reconcileDurableDone(item.ledger,done,providerIntegration.completedUnitsForState);
  if(changed){item.dirty=true;await saveLedger(item);}
  return {examined:done.length,reconciled:changed};
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
  if(!ancestryOk||!scopeOk){
    return {resumeCommit:checkpoint,orphanReused:false,orphanScopeValidated:true,orphanRejectedReason:!ancestryOk?'ORPHAN_NOT_DESCENDANT':'ORPHAN_SCOPE_VIOLATION'};
  }
  return {resumeCommit:orphan,orphanReused:true,orphanScopeValidated:true,orphanFileCount:files.length};
}
async function finalizeAssignment(issue,state,ledgerItem,nowMs){
  const prior=ledgerItem.ledger.terminal?.[state.workId];
  if(prior&&['done','certified'].includes(prior.status)&&prior.assignmentId!==state.assignmentId){
    // Duplicate generation must never overwrite a prior terminal or create a recovery.
    const next={...state,status:'cancelled',closedAt:core.iso(nowMs),releaseReason:'DUPLICATE_TERMINAL',cancelRequested:true};
    touchRequest(ledgerItem,state.requestId,{status:'duplicate',workId:state.workId,assignmentId:state.assignmentId,issueNumber:state.issueNumber});
    await updateIssue(issue.number,{title:'[MLS Dispatcher][DUPLICATE] '+state.assignmentId+' '+state.workId,body:core.renderAssignmentBody(next),state:'closed',state_reason:'not_planned'});
    return {closed:true,state:next,recovery:false};
  }
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

async function verifyPilot25AiEvidence(approvals){
 // Existing serial Dispatcher guard; no personal reviewer signature is needed.
 for(const approval of approvals){
  if(approval.protocol!=='MLS_R41_AI_EVIDENCE_V1')
   throw core.dispatchError('R41_AI_PROTOCOL_MISMATCH','Evidence protocol mismatch.',409);
  const stage=await gh('GET','/repos/'+owner+'/'+repo+'/git/ref/heads/'+approval.stageBranch);
  if(String(stage?.object?.sha||'').toLowerCase()!==approval.commitSha.toLowerCase())
   throw core.dispatchError('R41_APPROVED_STAGE_MOVED','Pinned AI-reviewed stage changed.',409);
  const run=await gh('GET','/repos/'+owner+'/'+repo+'/actions/runs/'+approval.validationRunId);
  if(run?.status!=='completed'||run?.conclusion!=='success'||
     String(run?.head_sha||'').toLowerCase()!==approval.commitSha.toLowerCase())
   throw core.dispatchError('R41_CANONICAL_CI_UNVERIFIED','Exact v3 commit has no matching successful validation run.',409);
 }
}

async function processBufferedRequests(issues,globalLedger,activeStates,now){
  const requests=issues.filter(issue=>buffered.requestAuthorized(issue)&&String(issue.title||'').startsWith('[MLS Buffered][REQUEST]'))
    .sort((a,b)=>Number(a.number)-Number(b.number));
  const result=[];
  for(const issue of requests){
    try{
      if(!buffered.requestAuthorized(issue))throw core.dispatchError('BUFFER_AUTHOR_UNAUTHORIZED','Only repository owner/member/collaborator can reserve units.',403);
      const command=buffered.parseRequest(issue);
      if(command.mode==='release'){
        const target=issues.find(row=>Number(row.number)===command.targetIssueNumber);
        if(!target||target.state!=='open')throw core.dispatchError('BUFFER_RELEASE_TARGET_MISSING','No open reservation with this issue number.',409);
        const old=buffered.parseReservation(target);
        // A successfully staged commit must first complete the immutable CI/ledger reconciliation.
        if(old.status==='staged')throw core.dispatchError('STAGED_RELEASE_REQUIRES_RECONCILIATION',
          'Do not release an in-flight STAGED batch before the serial finalizer has persisted its outcome.',409);
        const nextTitle='[MLS Buffered][RELEASED] '+old.allocation.assignmentId;
        const detail=buffered.renderReservation(old)+'\n\n## Explicit release / recovery review\n'+
          JSON.stringify({requestIssue:issue.number,reason:command.reason,recoveryReviewed:true,releasedAt:core.iso(now)},null,2)+'\n';
        await updateIssue(target.number,{title:nextTitle,body:detail,state:'closed',state_reason:'not_planned'});
        target.title=nextTitle;target.state='closed';target.body=detail;
        await updateIssue(issue.number,{title:'[MLS Buffered][COMPLETED] release '+command.requestId,
          body:renderResponse('Buffer release accepted',{targetIssueNumber:target.number,requestId:command.requestId}),state:'closed',state_reason:'completed'});
        result.push({requestIssue:issue.number,operation:'release',targetIssueNumber:target.number});
        continue;
      }
      // Gate 25 requires a resolved, source-precise AI protocol and live immutable CI checks.
      const approvals=revisions.assertScaledPilotReady(command.size,revisions.load(root));
      if(approvals.length)await verifyPilot25AiEvidence(approvals);
      // The same serialized scheduler performs normal claims and durable buffered reservations.
      const snapshot=providerIntegration.projectR33Snapshot(
        providerIntegration.collectR33Snapshot(issues,root),{globalLedger,globalAssignments:activeStates});
      const checkoutHead=child.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
      const mainHead=await getMainSha();
      if(checkoutHead!==mainHead)throw core.dispatchError('BUFFER_CHECKOUT_STALE','Refresh main checkout before granting reservation.',409);
      const contentManifestBlobSha=child.execFileSync('git',['rev-parse','HEAD:content/manifest.json'],{cwd:root,encoding:'utf8'}).trim();
      const reservation=buffered.allocate(snapshot,{size:command.size,issueNumber:issue.number,
        requestId:command.requestId,baseCommit:mainHead,contentManifestBlobSha,now});
      const title='[MLS Buffered][RESERVED] '+reservation.allocation.assignmentId;
      const body=buffered.renderReservation(reservation);
      await updateIssue(issue.number,{title,body});
      issue.title=title;issue.body=body;issue.state='open';
      result.push({requestIssue:issue.number,operation:'reserve',assignmentId:reservation.allocation.assignmentId,
        count:reservation.allocation.units.length,allocationHash:reservation.allocationHash});
    }catch(error){
      if([403,429].includes(error.status)&&!String(error.code||'').startsWith('BUFFER_AUTHOR_'))throw error;
      const title='[MLS Buffered][REJECTED] '+String(issue.number);
      await updateIssue(issue.number,{title,body:renderResponse('Buffer request rejected',{
        ok:false,reason:error.code||'BUFFER_REQUEST_ERROR',message:error.message}),state:'closed',state_reason:'not_planned'});
      issue.title=title;issue.state='closed';
      result.push({requestIssue:issue.number,status:'rejected',reason:error.code||'BUFFER_REQUEST_ERROR'});
    }
  }
  return result;
}

async function drainPendingCommands(baseRegistry,ledgerItem){
  // Repair stale ledger before any reaper, queue materialization, or new lease.
  const reconciliation=await reconcileCompletedIssues(ledgerItem);
  const now=Date.now(),s=await sweep(baseRegistry,ledgerItem,now),activeStates=s.active.map(x=>x.state);
  const providerIssues=await allIssues('open');
  const preparedDrainCodes=await livePreparedDrainCodes();
  const bufferedResults=await processBufferedRequests(providerIssues,ledgerItem.ledger,activeStates,now);
  const stagedResults=await bufferedFinalize.reconcile({issues:providerIssues,ledgerItem,
    get:endpoint=>gh('GET','/repos/'+owner+'/'+repo+endpoint),
    patchIssue:(number,patch)=>updateIssue(number,patch),saveLedger:()=>saveLedger(ledgerItem)});
  const bufferedCleanup=await bufferedFinalize.cleanupSyncRequests({issues:providerIssues,ledgerItem,
    patchIssue:(number,patch)=>updateIssue(number,patch)});
  // Additive R4.2: process disposable block workers under this SAME serialized
  // Dispatcher mutex. R4.2 may admit up to 10 NEXT/tick (2 for maintenance),
  // with up to 50 isolated leases; GitHub Actions remains one serial writer.
  const repoPath='/repos/'+owner+'/'+repo;
  const elasticResults=await elasticScheduler.drain({issues:providerIssues,root,
    globalLedger:ledgerItem.ledger,activeStates,now,technical:true,
    api:{get:route=>gh('GET',repoPath+route),post:(route,body)=>gh('POST',repoPath+route,body),
      patch:(route,body)=>gh('PATCH',repoPath+route,body)}});
  let cachedRegistry=null;
  function runtimeRegistry(refresh=false){
    if(cachedRegistry&&!refresh)return cachedRegistry;
    const dynamic=providerIntegration.materializeProviderItems({issues:providerIssues,root,now,globalLedger:ledgerItem.ledger,globalAssignments:activeStates,preparedDrainCodes});
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
    if(!dispatcherCommandAuthorized(issue,command)){
      const error=core.dispatchError('DISPATCH_AUTHOR_UNAUTHORIZED','Only repository owner/member/collaborator or a trusted autopull bot may submit Dispatcher commands.',403);
      await reject(issue,error);drained.push({issueNumber:issue.number,status:'rejected_unauthorized'});continue;
    }
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
    let selected=core.selectNextWork(registry,ledgerItem.ledger,activeStates,now,command.provider||null,command.workPrefix||null);
    if(!selected){
      registry=runtimeRegistry(true);
      selected=core.selectNextWork(registry,ledgerItem.ledger,activeStates,now,command.provider||null,command.workPrefix||null);
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
    await updateIssue(issue.number,{title:'[MLS Dispatcher][LEASED] '+state.assignmentId+' '+item.workId,body:core.renderAssignmentBody(state)});
    ledgerItem.ledger.epochs[item.workId]=Number(state.leaseEpoch);
    delete ledgerItem.ledger.recoveries[item.workId];
    touchRequest(ledgerItem,command.requestId,{status:'assigned',workId:item.workId,assignmentId:state.assignmentId,issueNumber:issue.number,branch});
    await saveLedger(ledgerItem);
    activeStates.push(state);
    drained.push({issueNumber:issue.number,status:'assigned',workId:item.workId,assignmentId:state.assignmentId,branch,ackDeadlineAt:state.ackDeadlineAt,recovery:Boolean(recovery)});
  }
  await saveLedger(ledgerItem);
  return {drained,reaped:s.closed,reconciliation,buffered:bufferedResults,bufferedStaged:stagedResults,bufferedCleanup,elastic:elasticResults};
}

async function main(){
  const baseRegistry=core.loadRegistry(root),ledgerItem=await ensureLedger(baseRegistry),result=await drainPendingCommands(baseRegistry,ledgerItem);
  if(result.drained.length||result.reaped.length||result.buffered.length||result.bufferedStaged.length||result.bufferedCleanup.length||Object.values(result.elastic||{}).some(v=>Array.isArray(v)&&v.length))console.log(JSON.stringify({ok:true,...result}));
  // GitHub concurrency retains one pending workflow at most. An explicit NEXT
  // dispatch after a productive partial drain prevents a large burst from
  // depending on dozens of coalesced Issue-opened workflow events or cron.
  // Never spin if no lease was actually admitted or if GitHub cooldown blocks.
  if(elasticCore.shouldRequeue({pending:result.elastic?.pending,
    leased:result.elastic?.leased?.length,
    pendingSettlements:result.elastic?.pendingSettlements,
    settlementProgress:result.elastic?.settlementProgress})){
    await gh('POST','/repos/'+owner+'/'+repo+'/actions/workflows/MLS%20Global%20Dispatcher%20Scheduler.yml/dispatches',{ref:'main'});
    console.log('MLS_BCR_BACKLOG_REQUEUED '+JSON.stringify({pending:result.elastic.pending,
      leased:result.elastic.leased.length,pendingSettlements:result.elastic.pendingSettlements,
      settlementProgress:result.elastic.settlementProgress}));
  }
  return result;
}
main().catch(error=>{console.error(error);process.exitCode=1});
