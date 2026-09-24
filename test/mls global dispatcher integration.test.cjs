'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const integration=require('../MLS R32 EDITORIAL/global dispatcher/integration.js');

const head='7b261c8a77239738172f2141db4fb7bace95a9e0';
const merge='1'.repeat(40);
const spec={
  prNumber:699,
  base:'main',
  expectedHeadSha:head,
  mergeMethod:'merge',
  requiredChecks:['R33 GitHub Native Tests'],
  postMergeChecks:['R33 GitHub Native Tests'],
  certifiedByWorkId:'r33-benchmark-pr-699-certification'
};
function goodSnapshot(){
  return {pr:{number:699,state:'open',base:'main',headSha:head,draft:false,mergeable:true,merged:false},checks:[{name:'R33 GitHub Native Tests',conclusion:'success'}]};
}

test('preflight exige head exacto y expected_head_sha',()=>{
  const pre=integration.evaluatePreMerge(spec,goodSnapshot());
  assert.equal(pre.ok,true);
  assert.equal(pre.alreadyMerged,false);
  assert.equal(pre.mergeRequest.expected_head_sha,head);
  assert.equal(pre.mergeRequest.merge_method,'merge');
});

test('head drift falla cerrado',()=>{
  const s=goodSnapshot();s.pr.headSha='2'.repeat(40);
  assert.throws(()=>integration.evaluatePreMerge(spec,s),e=>e.code==='INTEGRATION_HEAD_DRIFT');
});

test('check ausente o rojo falla cerrado',()=>{
  const missing=goodSnapshot();missing.checks=[];
  assert.throws(()=>integration.evaluatePreMerge(spec,missing),e=>e.code==='INTEGRATION_CHECK_MISSING');
  const failed=goodSnapshot();failed.checks=[{name:'R33 GitHub Native Tests',conclusion:'failure'}];
  assert.throws(()=>integration.evaluatePreMerge(spec,failed),e=>e.code==='INTEGRATION_CHECK_FAILED');
});

test('PR draft, cerrado o no mergeable no puede integrarse',()=>{
  const draft=goodSnapshot();draft.pr.draft=true;
  assert.throws(()=>integration.evaluatePreMerge(spec,draft),e=>e.code==='INTEGRATION_PR_DRAFT');
  const closed=goodSnapshot();closed.pr.state='closed';
  assert.throws(()=>integration.evaluatePreMerge(spec,closed),e=>e.code==='INTEGRATION_PR_NOT_OPEN');
  const conflict=goodSnapshot();conflict.pr.mergeable=false;
  assert.throws(()=>integration.evaluatePreMerge(spec,conflict),e=>e.code==='INTEGRATION_NOT_MERGEABLE');
});

test('merge ya completado es idempotente si conserva head certificado',()=>{
  const s=goodSnapshot();s.pr.state='closed';s.pr.merged=true;s.pr.mergeCommitSha=merge;
  const pre=integration.evaluatePreMerge(spec,s);
  assert.equal(pre.alreadyMerged,true);
  const post=integration.evaluatePostMerge(spec,{pre,prAfter:s.pr,mainContainsMerge:true,postChecks:[{name:'R33 GitHub Native Tests',conclusion:'success'}]});
  assert.equal(post.ok,true);assert.equal(post.idempotent,true);assert.equal(post.mergeCommitSha,merge);
});

test('post-merge exige SHA verificable, main contiene merge y checks verdes',()=>{
  const pre=integration.evaluatePreMerge(spec,goodSnapshot());
  const prAfter={number:699,base:'main',headSha:head,merged:true,mergeCommitSha:merge};
  assert.throws(()=>integration.evaluatePostMerge(spec,{pre,mergeResult:{merged:true,sha:merge},prAfter,mainContainsMerge:false,postChecks:[{name:'R33 GitHub Native Tests',conclusion:'success'}]}),e=>e.code==='INTEGRATION_MAIN_NOT_VERIFIED');
  const post=integration.evaluatePostMerge(spec,{pre,mergeResult:{merged:true,sha:merge},prAfter,mainContainsMerge:true,postChecks:[{name:'R33 GitHub Native Tests',conclusion:'success'}]});
  assert.equal(post.ok,true);assert.equal(post.mergeCommitSha,merge);
});

const fs=require('node:fs');
const core=require('../MLS R32 EDITORIAL/global dispatcher/core.js');

test('registry exposes PR #699 integration spec with global main lock',()=>{
  const registry=core.loadRegistry('.');
  const item=registry.items.find(x=>x.workId==='r33-benchmark-pr-699-integration');
  assert.equal(item.status,'ready');
  assert.equal(item.priority,5);
  assert.ok(item.resourceLocks.includes('system:main-integration'));
  const spec=integration.normalizeSpec(item.integration);
  assert.equal(spec.prNumber,699);
  assert.equal(spec.expectedHeadSha,head);
  assert.deepEqual(spec.requiredChecks,['R33 GitHub Native Tests']);
});

test('assignment-pr policy becomes a fixed head-pinned integration spec',()=>{
  const policy={mode:'assignment-pr',base:'main',mergeMethod:'merge',requiredChecks:['R33 GitHub Native Tests'],postMergeChecks:['R33 GitHub Native Tests']};
  const dynamic=integration.assignmentPrSpec(policy,{prNumber:812,expectedHeadSha:'3'.repeat(40)});
  assert.equal(dynamic.prNumber,812);
  assert.equal(dynamic.expectedHeadSha,'3'.repeat(40));
  assert.equal(dynamic.base,'main');
  assert.deepEqual(dynamic.requiredChecks,['R33 GitHub Native Tests']);
  assert.throws(()=>integration.assignmentPrSpec({...policy,mode:'wrong'},{prNumber:812,expectedHeadSha:'3'.repeat(40)}),e=>e.code==='INTEGRATION_POLICY_INVALID');
});

test('merged checkpoint validates PR/head/merge/main without branch scope',()=>{
  const pr={number:699,base:'main',headSha:head,merged:true,mergeCommitSha:merge};
  const ok=integration.validateMergedCheckpoint(spec,{pr,commitSha:merge,mainContainsCommit:true});
  assert.equal(ok.ok,true);
  assert.equal(ok.mergeCommitSha,merge);
  assert.throws(()=>integration.validateMergedCheckpoint(spec,{pr:{...pr,headSha:'2'.repeat(40)},commitSha:merge,mainContainsCommit:true}),e=>e.code==='INTEGRATION_HEAD_DRIFT');
  assert.throws(()=>integration.validateMergedCheckpoint(spec,{pr,commitSha:'2'.repeat(40),mainContainsCommit:true}),e=>e.code==='INTEGRATION_MERGE_SHA_MISMATCH');
  assert.throws(()=>integration.validateMergedCheckpoint(spec,{pr,commitSha:merge,mainContainsCommit:false}),e=>e.code==='INTEGRATION_MAIN_NOT_VERIFIED');
});

test('worker routes integration checkpoints through merged-PR verifier',()=>{
  const source=fs.readFileSync('scripts/MLS global dispatcher worker.cjs','utf8');
  assert.match(source,/state\.workType==='integration'/);
  assert.match(source,/verifyIntegrationCheckpoint/);
  assert.match(source,/validateMergedCheckpoint/);
  assert.match(source,/assignmentPrSpec/);
  assert.match(source,/integrationPrNumber/);
  assert.match(source,/integrationHeadSha/);
  assert.match(source,/integrationStage/);
  assert.match(source,/INTEGRATION_PREMERGE_CHECKPOINT_REQUIRED/);
  assert.match(source,/CHECKPOINT_SCOPE_VIOLATION/);
});
