'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const {createRequire}=require('node:module');
const core=require('../MLS R32 EDITORIAL/global dispatcher/core.js');
const recovery=require('../MLS R32 EDITORIAL/global dispatcher/recovery.js');
const base='a'.repeat(40),head='b'.repeat(40),merge='c'.repeat(40);
const item=core.normalizeWorkItem({workId:'integration-recovery',workType:'integration',status:'ready',version:1,allowedPaths:['evidence/'],resourceLocks:['system:main-integration'],integration:{mode:'assignment-pr',base:'main',requiredChecks:['R33'],postMergeChecks:['R33'],sourceRefs:[{commitSha:head}]}});
function initial(){
  let s=core.makeAssignmentState({issueNumber:100,item,requestId:'request-test',workerId:'worker-test',baseCommit:base,branch:'worker/test/000100',now:'2026-09-26T00:00:00Z',token:'old'});
  return core.applyWorkerEvent(s,{operation:'checkpoint',assignmentId:s.assignmentId,leaseToken:s.leaseToken,leaseEpoch:100,commitSha:head,validation:{status:'passed',prNumber:980},completedUnits:['evidence'],pendingUnits:['postmerge']},{createdAt:'2026-09-26T00:01:00Z',commentId:1});
}
async function recovered(original=initial(),branchHead=head){
  const r=await recovery.restore(core.classifyRecoveryState(original,branchHead),item,async()=>original);
  return core.makeAssignmentState({issueNumber:101,item:{...item,integration:r.integration},requestId:'request-new',workerId:'worker-new',baseCommit:branchHead,branch:'worker/test/000101',recovery:{...r,resumeCommit:branchHead},now:'2026-09-26T00:02:00Z',token:'new'});
}
function worker(state,{assignedHead=head,merged=true,prHead=head,contains=true,files=[{filename:'evidence/a.json'}]}={}){
  const file=path.resolve('scripts/MLS global dispatcher worker.cjs');
  const context=vm.createContext({require:createRequire(file),process:{env:{GITHUB_TOKEN:'test',GITHUB_REPOSITORY:'owner/repo'}},console});
  vm.runInContext(fs.readFileSync(file,'utf8').replace(/main\(\)\.catch\([\s\S]*$/,''),context);
  context.ghMock=async(method,url)=>{
    if(url.includes('/git/ref/heads/main'))return {object:{sha:contains?merge:'d'.repeat(40)}};
    if(url.includes('/git/ref/heads/'))return {object:{sha:assignedHead}};
    if(url.includes('/pulls/'))return {number:980,base:{ref:'main'},head:{sha:prHead},merged,merge_commit_sha:merge};
    if(url.includes('/compare/'+base))return {status:'ahead',files};
    if(url.includes('/compare/'))return {status:contains?'ahead':'diverged'};
    throw Error(url);
  };
  vm.runInContext('gh=ghMock',context);
  return {verify:()=>context.verifyIntegrationCheckpoint(state,merge,{integrationStage:'postmerge',integrationPrNumber:980,integrationHeadSha:head}),context};
}
test('postmerge recovery retains exact accepted premerge evidence and validates original PR',async()=>{
  const state=await recovered();
  assert.deepEqual(state.integration,item.integration);
  assert.equal(state.checkpoints[0].commitSha,head);
  assert.equal(state.recovery.integrationBaseCommit,base);
  await worker(state).verify();
  assert.throws(()=>core.validateLeaseEvent(state,{assignmentId:state.assignmentId,leaseToken:'old',leaseEpoch:100},'2026-09-26T00:03:00Z'),/no coincide/);
});
test('legacy generation with null policy is restored from matching durable ancestors',async()=>{
  const origin=initial(),broken=await recovered(origin);
  broken.integration=null;broken.checkpoints=[];
  const r=core.classifyRecoveryState(broken,head);
  assert.ok(r,'unchanged recovery branch must not discard progress');
  const restored=await recovery.restore(r,item,async n=>n===101?broken:origin);
  assert.equal(restored.checkpoints.length,1);
  assert.equal(restored.integrationBaseCommit,base);
  assert.deepEqual(restored.integration,item.integration);
});
test('recovery after accepted postmerge supports finish and repeated interruptions',async()=>{
  let state=await recovered();
  const event={operation:'checkpoint',assignmentId:state.assignmentId,leaseToken:state.leaseToken,leaseEpoch:101,commitSha:merge,integrationStage:'postmerge',integrationPrNumber:980,integrationHeadSha:head,validation:{status:'passed'},pendingUnits:[]};
  state=core.applyWorkerEvent(state,event,{createdAt:'2026-09-26T00:03:00Z',commentId:2});
  const origin=initial(),r=core.classifyRecoveryState(state,head);
  // The branch still has the premerge head; do not replace an accepted merge with it.
  assert.equal(r.lastCheckpointCommit,merge);
  const restored=await recovery.restore(r,item,async n=>n===101?state:origin);
  const next=core.makeAssignmentState({issueNumber:102,item,baseCommit:merge,branch:'worker/test/000102',recovery:{...restored,resumeCommit:merge},now:'2026-09-26T00:04:00Z'});
  await worker(next,{assignedHead:merge}).verify();
  const done=core.applyWorkerEvent(next,{...event,operation:'finish',assignmentId:next.assignmentId,leaseToken:next.leaseToken,leaseEpoch:102},{createdAt:'2026-09-26T00:05:00Z',commentId:3});
  assert.equal(done.readyToClose,true);
});
test('recovered postmerge fails closed on head drift, absent checkpoint, scope and PR mismatch',async()=>{
  const state=await recovered();
  await assert.rejects(worker(state,{assignedHead:base}).verify(),/HEAD/);
  await assert.rejects(worker({...state,checkpoints:[]}).verify(),/checkpoint/);
  await assert.rejects(worker(state,{files:[{filename:'outside/file'}]}).verify(),/scope/);
  await assert.rejects(worker(state,{prHead:base}).verify(),/head/);
  await assert.rejects(worker(state,{merged:false}).verify(),/merged/);
  await assert.rejects(worker(state,{contains:false}).verify(),/main/);
  await assert.rejects(worker(state,{assignedHead:merge}).verify(),/HEAD/);
});
test('scheduler expiration persists integration context and a second recovery remains resumable',async()=>{
  const file=path.resolve('scripts/MLS global dispatcher scheduler.cjs');
  const context=vm.createContext({require:createRequire(file),__dirname:path.dirname(file),structuredClone,process:{env:{GITHUB_TOKEN:'test',GITHUB_REPOSITORY:'owner/repo'}},console});
  vm.runInContext(fs.readFileSync(file,'utf8').replace(/main\(\)\.catch\([\s\S]*$/,''),context);
  context.ghMock=async(method,url)=>method==='GET'?{object:{sha:head}}:{};
  vm.runInContext('gh=ghMock',context);
  const state=initial(),ledger={ledger:{recoveries:{},epochs:{},requests:{}},dirty:false};
  const result=await context.finalizeAssignment({number:100},state,ledger,Date.parse('2026-09-26T01:00:00Z'));
  assert.equal(result.state.status,'recovery_required');
  const captured=ledger.ledger.recoveries[item.workId];
  assert.equal(JSON.stringify(captured.workItem.integration),JSON.stringify(item.integration));
  assert.equal(captured.checkpoints[0].hash,state.checkpoints[0].hash);
  const next=await recovered(state);
  await context.finalizeAssignment({number:101},next,ledger,Date.parse('2026-09-26T01:00:00Z'));
  assert.equal(ledger.ledger.recoveries[item.workId].previousAssignmentId,next.assignmentId);
  assert.equal(ledger.ledger.recoveries[item.workId].checkpoints.length,1);
});
test('historical scope, policy, checkpoint tampering and cycles are rejected',async()=>{
  for(const mutate of [s=>s.allowedPaths=['other/'],s=>s.integration=null,s=>s.checkpoints[0].hash='bad',s=>s.recovery={previousAssignmentId:s.assignmentId}]){
    const s=initial(),r=core.classifyRecoveryState(s,head);mutate(s);
    await assert.rejects(recovery.restore(r,item,async()=>s));
  }
});
test('crash before premerge checkpoint preserves original base for new certification',async()=>{
  const s=initial();s.checkpoints=[];s.lastCheckpointCommit=null;
  const state=await recovered(s);
  const {context}=worker(state);
  await context.verifyIntegrationCheckpoint(state,head,{integrationStage:'premerge'});
  assert.equal(state.checkpoints.length,0);
  await assert.rejects(worker(state).verify(),/checkpoint/);
});
