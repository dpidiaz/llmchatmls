'use strict';

const core=require('./core.js');
const integration=require('./integration.js');
const sameSet=(a,b)=>JSON.stringify([...(a||[])].sort())===JSON.stringify([...(b||[])].sort());
function fail(message){throw core.dispatchError('RECOVERY_CONTEXT_INVALID',message,409);}

// Read durable assignment history, including recoveries created before context was retained.
async function restore(recovery,item,readAssignment){
  const seen=new Set(),states=[];
  let id=recovery.previousAssignmentId;
  for(let depth=0;id;depth++){
    if(depth>=50||seen.has(id))fail('Recovery lineage cyclic or too deep.');
    seen.add(id);
    const match=/^MLS-GLOBAL-(\d+)$/.exec(id);
    if(!match)fail('Invalid historical assignment ID.');
    const state=await readAssignment(Number(match[1]));
    if(!state||state.assignmentId!==id||Number(state.issueNumber)!==Number(match[1])||state.workId!==item.workId||state.workVersion!==item.version||state.workType!=='integration'||
      !sameSet(state.allowedPaths,item.allowedPaths)||!sameSet(state.resourceLocks,item.resourceLocks))fail('Historical assignment identity/scope mismatch.');
    if(!states.length&&state.branch!==recovery.branch)fail('Recovery branch mismatch.');
    states.push(state);
    id=state.recovery?.previousAssignmentId;
  }
  if(!states.length)fail('Missing durable integration history.');
  const origin=states.at(-1),policy=origin.integration;
  if(!policy)fail('Missing original integration policy.');
  if(item.integration&&core.sha256(item.integration)!==core.sha256(policy))fail('Work item integration policy drift.');
  if(policy.mode==='assignment-pr')integration.assignmentPrSpec(policy,{prNumber:1,expectedHeadSha:'a'.repeat(40)});
  else integration.normalizeSpec(policy);
  const checkpoints=[];
  for(const state of [...states].reverse()){
    if(state.integration&&core.sha256(state.integration)!==core.sha256(policy))fail('Integration policy drift.');
    for(const cp of state.checkpoints||[]){
      if(!cp.acceptedAt||!cp.commentId||core.checkpointDigest(core.checkpointPayload(cp))!==cp.hash)fail('Invalid accepted checkpoint.');
      const existing=checkpoints.find(x=>x.commitSha===cp.commitSha);
      if(existing&&existing.hash!==cp.hash)fail('Conflicting historical checkpoint.');
      if(!existing)checkpoints.push(structuredClone(cp));
    }
  }
  return {...recovery,integration:structuredClone(policy),integrationBaseCommit:origin.baseCommit,checkpoints};
}

function acceptedHead(state,head){
  return (state.checkpoints||[]).some(cp=>cp.commitSha===head&&cp.validation?.status==='passed'&&cp.integrationStage!=='postmerge');
}
function branchMatches(state,assignedHead,expectedHead,mergeSha,prNumber){
  if(assignedHead===expectedHead)return true;
  // A recovery may start at an already accepted postmerge checkpoint, never an arbitrary commit.
  return Boolean(state.recovery&&assignedHead===mergeSha&&state.recovery.resumeCommit===mergeSha&&
    (state.checkpoints||[]).some(cp=>cp.commitSha===mergeSha&&cp.integrationStage==='postmerge'&&
      cp.integrationHeadSha===expectedHead&&Number(cp.integrationPrNumber)===prNumber&&cp.validation?.status==='passed'));
}
module.exports={restore,acceptedHead,branchMatches};
