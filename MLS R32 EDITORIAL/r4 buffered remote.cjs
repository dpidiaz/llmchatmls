'use strict';
const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const core=require('./r4 buffered core.cjs');
const sync=require('./r4 buffered sync.cjs');
const verify=require('./r4 buffered verify.cjs');
const allocation=require('./r4 buffered allocation.cjs');

async function prepare(dir,root,issueNumber,client,{canonicalRoot=root}={}){
  const approved=await verify.verifyLive(dir,root,issueNumber,client,{canonicalRoot});
  for(const item of approved.plan.toCreate){
    const entry=core.read(core.ef(dir,item.code));
    if(core.hash(entry)!==item.sha256)core.error('ENTRY_HASH_CHANGED',item.code);
    const target=path.resolve(root,item.path),base=path.resolve(root);
    if(!target.startsWith(base+path.sep))core.error('WRITE_OUT_OF_SCOPE');
    fs.mkdirSync(path.dirname(target),{recursive:true});
    try{fs.writeFileSync(target,JSON.stringify(entry,null,2)+'\n',{flag:'wx'});}
    catch(error){if(error.code==='EEXIST'&&core.hash(core.read(target))===item.sha256)continue;throw error;}
  }
  // A full recheck covers all existing and newly inserted entries before Git commit.
  const plan=await sync.plan(dir,root);
  if(plan.toCreate.length)core.error('INCOMPLETE_IMPORT','Some files were not written.');
  return {approved:true,packageHash:approved.packageHash,
    imported:approved.plan.toCreate.length,alreadyPresent:approved.plan.alreadyPresent.length,
    remoteReadCalls:approved.remoteReads,status:'LOCAL_FILES_PREPARED_NOT_PUSHED'};
}
async function markStaged(dir,root,issueNumber,branch,commitSha,client,workflowRunId,syncRequestIssueNumber,{canonicalRoot=root}={}){
  const approved=await verify.verifyLive(dir,root,issueNumber,client,{canonicalRoot});
  const expected='r41/staged/'+issueNumber;
  if(branch!==expected||approved.plan.branch!==branch||!Number.isSafeInteger(workflowRunId)||workflowRunId<1)
    core.error('STAGE_BRANCH_OR_RUN_MISMATCH');
  const actual=cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim().toLowerCase();
  if(actual!==String(commitSha).toLowerCase())core.error('LOCAL_COMMIT_CHANGED');
  const remote=await client.get('/git/ref/heads/'+branch.split('/').map(encodeURIComponent).join('/'));
  if(String(remote?.object?.sha||'').toLowerCase()!==actual)core.error('REMOTE_REF_NOT_CONFIRMED');
  const r=approved.reservation;
  if(r.status==='staged'&&r.stage.commitSha===actual&&r.stage.packageHash===approved.packageHash&&
     r.stage.workflowRunId===workflowRunId)
    return {replayed:true,commitSha:actual,packageHash:approved.packageHash,remoteRestCalls:client.counts().httpCalls};
  const staged=allocation.stage(r,{branch,commitSha:actual,packageHash:approved.packageHash,
    checksPassed:true,workflowRunId,syncRequestIssueNumber});
  await client.patch('/issues/'+issueNumber,{
    title:'[MLS Buffered][STAGED] '+staged.allocation.assignmentId,
    body:allocation.renderReservation(staged)});
  return {staged:true,commitSha:actual,packageHash:approved.packageHash,
    status:'STAGED_AWAITING_COMPLETED_WORKFLOW_AND_DISPATCHER_RECONCILIATION',remoteRestCalls:client.counts().httpCalls};
}
module.exports={prepare,markStaged};
