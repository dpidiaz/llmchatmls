'use strict';
// Runs only inside the serial Global Dispatcher Scheduler, after the sync Action has COMPLETED.
const allocation=require('./r4 buffered allocation.cjs');
const core=require('./global dispatcher/core.js');
const providers=require('./global dispatcher/providers/integration.js');
const verifier=require('./r4 buffered verify.cjs');
const sha40=x=>/^[a-f0-9]{40}$/i.test(String(x||''));
function codesFromRecovery(r){return [...(r.completedUnits||[]),...providers.codesFromLocks(r.resourceLocks||r.workItem?.resourceLocks||[])];}
function conflicting(a,b){const set=new Set(a);return b.some(x=>set.has(x));}
async function reconcile({issues,ledgerItem,get,patchIssue,saveLedger}){
  const outcome=[];
  const live=allocation.reservations(issues).filter(r=>r.status==='staged');
  for(const r of live){
    const issue=issues.find(x=>x.number===r.issueNumber);
    const run=await get('/actions/runs/'+r.stage.workflowRunId);
    if(run?.status!=='completed'){
      outcome.push({issue:r.issueNumber,status:'WAITING_FOR_CI'});continue;
    }
    const dispatched=run.event==='workflow_dispatch'&&
      run.path==='.github/workflows/R4.1 Buffered Sync.yml'&&
      run.display_title==='MLS buffer sync #'+r.stage.syncRequestIssueNumber;
    if(run.conclusion!=='success'||run.name!=='R4.1 Buffered Sync'||(run.event!=='issues'&&!dispatched)){
      const q=allocation.quarantine(r,'SYNC_WORKFLOW_NOT_CERTIFIED');
      const title='[MLS Buffered][QUARANTINED] '+r.allocation.assignmentId;
      const body=allocation.renderReservation(q);
      await patchIssue(r.issueNumber,{title,body});
      issue.title=title;issue.body=body;
      outcome.push({issue:r.issueNumber,status:'QUARANTINED'});continue;
    }
    const expectedBranch='r41/staged/'+r.issueNumber;
    if(r.stage.branch!==expectedBranch||!sha40(r.stage.commitSha))throw core.dispatchError('STAGE_BRANCH_INVALID','Invalid staged branch.',409);
    const ref=await get('/git/ref/heads/'+expectedBranch.split('/').map(encodeURIComponent).join('/'));
    if(String(ref?.object?.sha||'').toLowerCase()!==r.stage.commitSha)throw core.dispatchError('STAGE_HEAD_CHANGED','Staging branch diverged.',409);
    const commit=await get('/commits/'+r.stage.commitSha);
    const files=commit?.files,allowed=new Set(r.allocation.units.map(u=>u.evidenceArtifactPath));
    // A subset is valid when some assigned Evidence paths already existed byte-identically on main.
    // An all-identical first import still creates its own empty, traceable batch commit.
    if(!Array.isArray(files)||!commit?.parents||commit.parents.length!==1||
      commit.commit?.message!=='evidence(r4.1): stage immutable buffer '+r.issueNumber||
      files.length>allowed.size||files.some(x=>!allowed.has(String(x.filename||''))||!['added','modified'].includes(x.status)))
      throw core.dispatchError('STAGE_COMMIT_SCOPE_INVALID','Commit identity or changed Evidence paths do not match assigned batch.',409);
    const parent=String(commit.parents[0].sha||'');
    if(!sha40(parent)||parent.toLowerCase()===r.stage.commitSha)throw core.dispatchError('STAGE_PARENT_INVALID');
    const ancestry=await get('/compare/'+r.allocation.baseCommit+'...'+parent);
    if(!['ahead','identical'].includes(ancestry?.status))throw core.dispatchError('STAGE_LINEAGE_CONFLICT','Staged commit not descended from reservation base.',409);
    const codes=r.allocation.units.map(u=>u.code),workId='r33-buffer:'+r.allocation.assignmentId;
    const ledger=ledgerItem.ledger,existing=ledger.terminal?.[workId];
    for(const [id,entry] of Object.entries(ledger.terminal||{})){
      if(id===workId||entry.provider!=='r33-farm')continue;
      if(conflicting(codes,entry.completedUnits||[]))throw core.dispatchError('STAGE_TERMINAL_COLLISION',id,409);
    }
    for(const [id,recovery] of Object.entries(ledger.recoveries||{})){
      if(recovery.workItem?.provider==='r33-farm'&&conflicting(codes,codesFromRecovery(recovery)))
        throw core.dispatchError('STAGE_RECOVERY_COLLISION',id,409);
    }
    if(existing){
      if(existing.commitSha!==r.stage.commitSha||existing.bufferPackageHash!==r.stage.packageHash||
        existing.assignmentId!==r.allocation.assignmentId)throw core.dispatchError('STAGE_TERMINAL_REPLAY_CONFLICT','Terminal already recorded differently.',409);
    }else{
      ledger.terminal[workId]={status:'certified',workVersion:1,assignmentId:r.allocation.assignmentId,
        commitSha:r.stage.commitSha,branch:r.stage.branch,provider:'r33-farm',completedUnits:codes,
        bufferPackageHash:r.stage.packageHash,syncRequestIssueNumber:r.stage.syncRequestIssueNumber,completedAt:core.iso()};
      ledger.epochs[workId]=Math.max(Number(ledger.epochs[workId]||0),r.allocation.leaseEpoch);
      ledgerItem.dirty=true;
      await saveLedger();
    }
    const title='[MLS Buffered][DONE] '+r.allocation.assignmentId;
    const body=allocation.renderReservation(r)+'\n\n## Confirmed terminal integration staging\n'+
      JSON.stringify({status:'certified',stageCommit:r.stage.commitSha,packageHash:r.stage.packageHash,
        workflowRunId:r.stage.workflowRunId,confirmedAt:core.iso()},null,2)+'\n';
    await patchIssue(r.issueNumber,{title,body,state:'closed',state_reason:'completed'});
    issue.title=title;issue.body=body;issue.state='closed';
    outcome.push({issue:r.issueNumber,status:'CERTIFIED_STAGED',commitSha:r.stage.commitSha,entries:codes.length});
  }
  return outcome;
}
async function cleanupSyncRequests({issues,ledgerItem,patchIssue}){
  const result=[];
  for(const issue of issues||[]){
    if(!String(issue?.title||'').startsWith('[MLS Buffered][SYNC]'))continue;
    let request;try{request=verifier.requestFromIssue(issue);}catch{continue;}
    const workId='r33-buffer:MLS-BUFFER-'+String(request.issueNumber).padStart(6,'0');
    const terminal=ledgerItem.ledger.terminal?.[workId];
    if(!terminal||terminal.status!=='certified')continue;
    const superseded=terminal.syncRequestIssueNumber!==request.requestIssueNumber;
    const title='[MLS Buffered]'+(superseded?'[SUPERSEDED] ':'[SYNCED] ')+terminal.assignmentId;
    const body='## R4.1 Buffer synchronization '+(superseded?'superseded by another certified request':'completed')+'\n\n'+JSON.stringify({
      reservationIssueNumber:request.issueNumber,requestIssueNumber:request.requestIssueNumber,
      commitSha:terminal.commitSha,packageHash:terminal.bufferPackageHash,confirmedAt:core.iso()},null,2)+'\n';
    await patchIssue(issue.number,{title,body,state:'closed',state_reason:'completed'});
    issue.title=title;issue.body=body;issue.state='closed';
    result.push({issue:issue.number,status:superseded?'SUPERSEDED_SYNC_REQUEST':'SYNC_REQUEST_CLOSED'});
  }
  return result;
}
module.exports={reconcile,cleanupSyncRequests};
