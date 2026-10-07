'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const child=require('node:child_process');

test('Unified Evidence checkpoints and finish support the full 50-entry batch sequence',()=>{
  const submit=require('../scripts/MLS unified r33 evidence submit.cjs');
  const batch=require('../scripts/MLS unified r33 evidence batch.cjs');
  assert.equal(batch.MAX_BATCH,50);
  assert.equal(submit.validateSequence(batch.MAX_BATCH,batch.MAX_BATCH,'CHECKPOINT_SEQUENCE_INVALID'),50);
  assert.equal(submit.validateSequence(batch.MAX_BATCH+1,batch.MAX_BATCH+1,'FINISH_SEQUENCE_INVALID'),51);
  assert.throws(()=>submit.validateSequence(batch.MAX_BATCH+1,batch.MAX_BATCH,'CHECKPOINT_SEQUENCE_INVALID'),/CHECKPOINT_SEQUENCE_INVALID/);
  assert.throws(()=>submit.validateSequence(batch.MAX_BATCH+2,batch.MAX_BATCH+1,'FINISH_SEQUENCE_INVALID'),/FINISH_SEQUENCE_INVALID/);
  const source=fs.readFileSync('scripts/MLS unified r33 evidence batch.cjs','utf8');
  assert.match(source,/singleMode\('checkpoint-event',\[bundlePath,sha,String\(runId\),String\(index\+1\)\]/);
  assert.match(source,/finish-event',\[lastBundlePath,lastSha,String\(runId\),String\(batch\.entries\.length\+1\)\]/);
});

test('Unified R33 Evidence submit is issue-scoped, authorized and preflights before commit',()=>{
  const workflow=fs.readFileSync('.github/workflows/MLS Unified R33 Evidence Submit.yml','utf8');
  assert.match(workflow,/issue_comment:/);
  assert.match(workflow,/\[MLS Dispatcher\]\[LEASED\]/);
  assert.match(workflow,/MLS_UNIFIED_R33_EVIDENCE_SUBMIT/);
  assert.match(workflow,/author_association == 'OWNER'/);
  assert.match(workflow,/author_association == 'MEMBER'/);
  assert.match(workflow,/author_association == 'COLLABORATOR'/);
  assert.match(workflow,/node scripts\/R4-evidence-preflight\.cjs "\$EVIDENCE_PATH"/);
  const preflight=workflow.indexOf('R4-evidence-preflight.cjs');
  const commit=workflow.indexOf('git commit -m');
  const validate=workflow.indexOf("node --test 'test/r33 evidence editorial batch.test.cjs'");
  const push=workflow.indexOf('git push origin');
  assert.ok(preflight>0&&commit>preflight&&validate>commit&&push>validate);
  assert.match(workflow,/git diff --cached --name-only/);
});

test('Unified Evidence submit script fails closed on assignment scope and lease',()=>{
  const source=fs.readFileSync('scripts/MLS unified r33 evidence submit.cjs','utf8');
  assert.match(source,/AUTHORIZED=new Set\(\['OWNER','MEMBER','COLLABORATOR'\]\)/);
  assert.match(source,/state\.provider!=='r33-farm'/);
  assert.match(source,/startsWith\('r33-unified:'\)/);
  assert.match(source,/startsWith\('worker\/r33-unified\/'\)/);
  assert.match(source,/UNIFIED_EVIDENCE_CODE_OUT_OF_SCOPE/);
  assert.match(source,/UNIFIED_EVIDENCE_CONTENT_PATH_INVALID/);
  assert.match(source,/UNIFIED_EVIDENCE_LEASE_EXPIRED/);
  assert.doesNotMatch(source,/eval\(|Function\(/);
});


test('Unified Evidence submit carries only referenced fenced repair sources',()=>{
  const workflow=fs.readFileSync('.github/workflows/MLS Unified R33 Evidence Submit.yml','utf8');
  const source=fs.readFileSync('scripts/MLS unified r33 evidence submit.cjs','utf8');
  assert.match(source,/UNIFIED_EVIDENCE_REPAIR_SOURCE_UNREFERENCED/);
  assert.match(source,/UNIFIED_EVIDENCE_REPAIR_SOURCE_ID_MISMATCH/);
  assert.match(source,/SOURCE_PREFIX='MLS R32 EDITORIAL\/evidence git\/registry\/sources\/'/);
  assert.match(source,/foundation\.normalizeSourceMetadata/);
  assert.match(workflow,/registry\/sources/);
  assert.match(workflow,/MLS-SRC-\*\.json/);
});

test('legacy r33-unified lease may publish only its referenced deterministic repair source',()=>{
  const core=require('../MLS R32 EDITORIAL/global dispatcher/core.js');
  const submit=require('../scripts/MLS unified r33 evidence submit.cjs');
  const code='MLS-V01-0001';
  const evidencePath='MLS R32 EDITORIAL/evidence git/entries/ingles/'+code+'.json';
  const contentPath='content/ingles/'+code+'.json';
  const sourceId='MLS-SRC-0123456789ABCDEF0123';
  const sourcePath='MLS R32 EDITORIAL/evidence git/registry/sources/'+sourceId+'.json';
  const state={
    kind:'mls_global_assignment',version:'1.0',assignmentId:'MLS-GLOBAL-000001',issueNumber:1,
    workerId:'mls-unified-web-r33',workerLogin:'github-actions[bot]',
    workId:'r33-unified:fixture',workVersion:2,workType:'editorial_batch',title:'fixture',provider:'r33-farm',
    instructions:'fixture',dependencies:[],resourceLocks:['entry:'+code,'path:'+evidencePath,'path:'+contentPath],
    allowedPaths:[evidencePath,contentPath],validationRequired:[],completion:{requiresCommit:true,requiresValidation:true},
    integration:null,branch:'worker/r33-unified/000001',baseCommit:'0'.repeat(40),leaseToken:'fixture',
    leaseEpoch:1,status:'leased',claimedAt:new Date(Date.now()-1000).toISOString(),acknowledgedAt:new Date(Date.now()-1000).toISOString(),
    ackDeadlineAt:new Date(Date.now()+60000).toISOString(),lastHeartbeatAt:null,expiresAt:new Date(Date.now()+60000).toISOString(),
    checkpoints:[],lastCheckpointCommit:null,lastCheckpointHash:null,recovery:null,readyToClose:false,cancelRequested:false,
    finalCommitSha:null,lastRejectedEvent:null,closedAt:null
  };
  assert.equal(core.pathAllowed(sourcePath,state.allowedPaths),false);
  assert.equal(submit.repairSourcePathAllowed(sourcePath,state,code,sourceId),true);
  assert.equal(submit.repairSourcePathAllowed(sourcePath,{...state,provider:'global'},code,sourceId),false);
  assert.equal(submit.repairSourcePathAllowed(sourcePath.replace(sourceId,'MLS-SRC-FFFFFFFFFFFFFFFFFFFF'),state,code,sourceId),false);
  const issue={title:'[MLS Dispatcher][LEASED] fixture',body:core.renderAssignmentBody(state)};
  const comment={user:{login:'github-actions[bot]'},author_association:'NONE'};
  const payload={
    assignmentId:state.assignmentId,leaseEpoch:1,code,
    evidence:{code,status:'VERIFIED',contentPath,language:'ingles',links:[{sourceId}]},
    content:null,
    sources:[{sourceId,metadata:{sourceType:'institutional_webpage',authorityTier:'B',status:'active',title:'Fixture source',canonicalUrl:'https://example.org/source'}}]
  };
  const validated=submit.validate(issue,comment,payload);
  assert.equal(validated.sources[0].sourcePath,sourcePath);
});

test('syntax-checks the submission runner',()=>{
  child.execFileSync(process.execPath,['--check','scripts/MLS unified r33 evidence submit.cjs'],{stdio:'pipe'});
});


test('Evidence writer does not append a literal backslash-n after JSON',()=>{
  const source=fs.readFileSync('scripts/MLS unified r33 evidence submit.cjs','utf8');
  assert.match(source,/String\.fromCharCode\(10\)/);
  assert.doesNotMatch(source,/JSON\.stringify\(bundle\.evidence,null,2\)\+'\\\\n'/);
});


test('Unified auto-checkpoint remains fenced to bot, assignment and branch head',()=>{
  const workflow=fs.readFileSync('.github/workflows/MLS Unified R33 Evidence Submit.yml','utf8');
  const submit=fs.readFileSync('scripts/MLS unified r33 evidence submit.cjs','utf8');
  const worker=fs.readFileSync('scripts/MLS global dispatcher worker.cjs','utf8');
  const workerWorkflow=fs.readFileSync('.github/workflows/MLS Global Dispatcher Worker Events.yml','utf8');
  assert.match(workflow,/issues: write/);
  assert.match(workflow,/checkpoint-event "\$BUNDLE_PATH" "\$COMMIT_SHA" "\$GITHUB_RUN_ID"/);
  assert.ok(workflow.indexOf('git push origin')<workflow.indexOf('Prepare fenced durable checkpoint event'));
  assert.match(submit,/UNIFIED_EVIDENCE_CHECKPOINT_STATE_MISMATCH/);
  assert.match(submit,/UNIFIED_EVIDENCE_CHECKPOINT_HEAD_MISMATCH/);
  assert.match(submit,/MLS_UNIFIED_R33_AUTOCHECKPOINT/);
  assert.match(submit,/completed=\[\.\.\.new Set\(\[\.\.\.previous,bundle\.code\]\)\]/);
  assert.match(worker,/commentLogin==='github-actions\[bot\]'/);
  assert.match(worker,/MLS_UNIFIED_R33_AUTOCHECKPOINT/);
  assert.match(worker,/state\.provider==='r33-farm'/);
  assert.match(workerWorkflow,/contains\(github\.event\.comment\.body, 'MLS_GLOBAL_DISPATCH_EVENT'\)/);
});


test('Unified Evidence workflow applies checkpoint and finish through canonical Worker Events handler inline',()=>{
  const workflow=fs.readFileSync('.github/workflows/MLS Unified R33 Evidence Submit.yml','utf8');
  const submit=fs.readFileSync('scripts/MLS unified r33 evidence submit.cjs','utf8');
  assert.match(workflow,/actions: write/);
  assert.match(workflow,/git checkout --detach origin\/main/);
  assert.match(workflow,/node 'scripts\/MLS global dispatcher worker\.cjs'/);
  assert.match(workflow,/finish-event "\$BUNDLE_PATH" "\$COMMIT_SHA" "\$GITHUB_RUN_ID"/);
  assert.match(workflow,/finish_needed == 'true'/);
  assert.match(submit,/function writeSyntheticEvent/);
  assert.match(submit,/checkpointEvent/);
  assert.match(submit,/finishEvent/);
  assert.match(submit,/UNIFIED_EVIDENCE_FINISH_STATE_MISMATCH/);
  assert.doesNotMatch(submit,/issues\/.*\/comments.*method:'POST'/);
});

test('Unified Evidence submit supports idempotent preflight replay without a second commit',()=>{
  const workflow=fs.readFileSync('.github/workflows/MLS Unified R33 Evidence Submit.yml','utf8');
  assert.match(workflow,/no_change=true/);
  assert.match(workflow,/NO_CHANGE:/);
  assert.match(workflow,/if \[ "\$NO_CHANGE" != "true" \]/);
});


test('Unified inline handler binds synthetic events only to the worker subprocess',()=>{
  const workflow=fs.readFileSync('.github/workflows/MLS Unified R33 Evidence Submit.yml','utf8');
  assert.match(workflow,/SYNTHETIC_EVENT_PATH: \$\{\{ steps\.checkpoint\.outputs\.event_path \}\}/);
  assert.match(workflow,/GITHUB_EVENT_PATH="\$SYNTHETIC_EVENT_PATH" node 'scripts\/MLS global dispatcher worker\.cjs'/);
  assert.match(workflow,/SYNTHETIC_EVENT_PATH: \$\{\{ steps\.finish\.outputs\.event_path \}\}/);
  assert.doesNotMatch(workflow,/\n\s+GITHUB_EVENT_PATH: \$\{\{ steps\.(?:checkpoint|finish)\.outputs\.event_path \}\}/);
});
