'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const child=require('node:child_process');

test('Unified integration copies source registry records referenced by certified Evidence',()=>{
  const source=fs.readFileSync('scripts/MLS unified r33 integration execute.cjs','utf8');
  const provider=fs.readFileSync('MLS R32 EDITORIAL/global dispatcher/providers/integration.js','utf8');
  assert.match(source,/function copyEvidenceSources/);
  assert.match(source,/registry\/sources\/.*sourceId/);
  assert.match(source,/copyEvidenceSources\(ref\.commitSha,ref\.evidenceArtifactPath\)/);
  assert.match(provider,/R33_SOURCE_REGISTRY_PREFIX/);
  assert.match(provider,/allowedPaths:\[\.\.\.candidate\.allowedPaths,\.\.\.contentPaths,R33_SOURCE_REGISTRY_PREFIX\]/);
});

test('Unified integration executor is authorized, serialized and keeps canonical ordering',()=>{
  const workflow=fs.readFileSync('.github/workflows/MLS Unified R33 Integration Execute.yml','utf8');
  assert.match(workflow,/issue_comment:/);
  assert.match(workflow,/MLS_UNIFIED_R33_INTEGRATION_EXECUTE/);
  assert.match(workflow,/group: mls-unified-main-integration/);
  assert.match(workflow,/cancel-in-progress: false/);
  assert.match(workflow,/pull-requests: write/);
  const materialize=workflow.indexOf('Materialize pinned certified sources');
  const indexes=workflow.indexOf('Regenerate canonical R33 indexes');
  const tests=workflow.indexOf('Run R33 integration tests');
  const commit=workflow.indexOf('Commit and push integration branch');
  const wait=workflow.indexOf('Wait for required R33 PR check');
  const premerge=workflow.indexOf('Record premerge checkpoint');
  const merge=workflow.indexOf('Merge with expected head SHA');
  const postmerge=workflow.indexOf('Record postmerge checkpoint');
  const finish=workflow.indexOf('Record finish event');
  assert.ok(materialize>0&&indexes>materialize&&tests>indexes&&commit>tests&&wait>commit&&premerge>wait&&merge>premerge&&postmerge>merge&&finish>postmerge);
});

test('Unified integration executor validates exact leased scope and fails closed on content drift',()=>{
  const source=fs.readFileSync('scripts/MLS unified r33 integration execute.cjs','utf8');
  assert.match(source,/state\.provider!=='r33-index-integration'/);
  assert.match(source,/startsWith\('r33-unified-integration:'\)/);
  assert.match(source,/associationAuthorized=AUTHORIZED\.has\(association\)/);
  assert.match(source,/state\.workerLogin&&!associationAuthorized&&login!==String\(state\.workerLogin\)/);
  assert.match(source,/workerLogin:String\(state\.workerLogin\|\|''\)/);
  assert.match(source,/user:\{login:bundle\.workerLogin\|\|bundle\.commentLogin\}/);
  const workerAuth=fs.readFileSync('scripts/MLS global dispatcher worker.cjs','utf8');
  assert.match(workerAuth,/authorizedIntegrationOperator/);
  assert.match(workerAuth,/MLS_UNIFIED_R33_INTEGRATION_AUTOCHECKPOINT/);
  assert.match(source,/UNIFIED_INTEGRATION_CONTENT_DRIFT/);
  assert.match(source,/r44SourceSha256/);
  assert.match(source,/R33 GitHub Native Tests/);
  assert.match(source,/merge_method:'merge',sha:headSha/);
  assert.match(source,/integrationStage:'premerge'/);
  assert.match(source,/integrationStage:'postmerge'/);
  assert.match(source,/ACTIONS_PULL_REQUEST_CREATION_DISABLED/);
  assert.match(source,/integrationStage:'premerge-direct'/);
  assert.match(source,/integrationStage:'postmerge-direct'/);
  assert.match(source,/commentAssociation:String\(eventComment\.author_association\|\|''\)/);
  assert.match(source,/author_association:bundle\.commentAssociation/);
  assert.match(source,/directPostmergeCheckpointMatches/);
  assert.match(source,/UNIFIED_INTEGRATION_DIRECT_RECOVERY_IDENTITY_MISMATCH/);
  assert.match(source,/DIRECT_POSTMERGE_ACK/);
  assert.match(source,/DIRECT_FINISH_ACK/);
  assert.match(source,/UNIFIED_INTEGRATION_DIRECT_MAIN_DIVERGED/);
  assert.match(source,/UNIFIED_INTEGRATION_DIRECT_MAIN_OVERLAP/);
  assert.match(source,/UNIFIED_INTEGRATION_DIRECT_MAIN_VERIFY_FAILED/);
  const worker=fs.readFileSync('scripts/MLS global dispatcher worker.cjs','utf8');
  assert.match(worker,/mainContainsCommit/);
  assert.match(worker,/INTEGRATION_DIRECT_DRIFT_SCOPE_INCOMPLETE/);
  assert.match(worker,/INTEGRATION_DIRECT_MAIN_DIVERGED/);
  assert.match(worker,/INTEGRATION_DIRECT_MAIN_OVERLAP/);
  assert.match(worker,/parents\[1\]!==expectedHeadSha/);
  assert.doesNotMatch(worker,/parents\[0\]!==base\|\|parents\[1\]!==expectedHeadSha/);
  child.execFileSync(process.execPath,['--check','scripts/MLS unified r33 integration execute.cjs'],{stdio:'pipe'});
  child.execFileSync(process.execPath,['--check','scripts/MLS global dispatcher worker.cjs'],{stdio:'pipe'});
});


test('Unified integration executor treats an already-applied wave as a validated no-op',()=>{
  const workflow=fs.readFileSync('.github/workflows/MLS Unified R33 Integration Execute.yml','utf8');
  const source=fs.readFileSync('scripts/MLS unified r33 integration execute.cjs','utf8');
  const worker=fs.readFileSync('scripts/MLS global dispatcher worker.cjs','utf8');
  assert.match(workflow,/id: scope/);
  assert.match(workflow,/steps\.scope\.outputs\.has_changes == 'false'/);
  assert.match(workflow,/noop-checkpoint-event/);
  assert.match(workflow,/noop-finish-event/);
  assert.match(workflow,/steps\.scope\.outputs\.has_changes == 'true'/);
  assert.match(source,/output\('has_changes',files\.length\?'true':'false'\)/);
  assert.doesNotMatch(source,/UNIFIED_INTEGRATION_NO_STAGED_CHANGES/);
  assert.match(source,/UNIFIED_INTEGRATION_NOOP_MAIN_MOVED/);
  assert.match(source,/UNIFIED_INTEGRATION_NOOP_FINISH_MAIN_MOVED/);
  assert.match(source,/checkpoint\?\.integrationStage/);
  assert.match(source,/checkpointSha!==mainSha\|\|checkpointSha!==branchSha/);
  assert.doesNotMatch(source,/lastCheckpointCommit\|\|'\'\)\.toLowerCase\(\)!==String\(state\.baseCommit/);
  assert.match(worker,/stage==='noop'/);
  assert.match(worker,/INTEGRATION_NOOP_MAIN_MISMATCH/);
});

test('Unified integration inline handlers bind synthetic event paths only to worker subprocess',()=>{
  const workflow=fs.readFileSync('.github/workflows/MLS Unified R33 Integration Execute.yml','utf8');
  assert.match(workflow,/SYNTHETIC_EVENT_PATH: \$\{\{ steps\.noop_checkpoint\.outputs\.event_path \}\}/);
  assert.match(workflow,/SYNTHETIC_EVENT_PATH: \$\{\{ steps\.noop_finish\.outputs\.event_path \}\}/);
  assert.match(workflow,/SYNTHETIC_EVENT_PATH: \$\{\{ steps\.premerge\.outputs\.event_path \}\}/);
  assert.match(workflow,/SYNTHETIC_EVENT_PATH: \$\{\{ steps\.postmerge\.outputs\.event_path \}\}/);
  assert.match(workflow,/SYNTHETIC_EVENT_PATH: \$\{\{ steps\.finish\.outputs\.event_path \}\}/);
  assert.doesNotMatch(workflow,/\n\s+GITHUB_EVENT_PATH: \$\{\{ steps\.(?:noop_checkpoint|noop_finish|premerge|postmerge|finish)\.outputs\.event_path \}\}/);
  assert.match(workflow,/direct-premerge-event/);
  assert.match(workflow,/direct-merge/);
  assert.match(workflow,/direct-postmerge-event/);
  assert.match(workflow,/direct-finish-event/);
  assert.match(workflow,/direct-postmerge-reconcile/);
  assert.match(workflow,/Require persisted direct fallback postmerge ACK/);
  assert.match(workflow,/Verify direct fallback finish was persisted/);
  const inline=(workflow.match(/GITHUB_EVENT_PATH="\$SYNTHETIC_EVENT_PATH" node 'scripts\/MLS global dispatcher worker\.cjs'/g)||[]).length;
  assert.equal(inline,9);
});

test('direct postmerge ACK is idempotent and requires exact complete scope',()=>{
  const source=require('../scripts/MLS unified r33 integration execute.cjs');
  const merge='70f527d42a5d751b033d893584f065c150cb469c';
  const head='eb4ecda6ccf2dd48e2b80c7f0589d9c6ed75353d';
  const units=Array.from({length:50},(_,i)=>'MLS-V01-'+String(i+1).padStart(4,'0'));
  const state={status:'leased',lastCheckpointCommit:merge,checkpoints:[{
    commitSha:merge,integrationStage:'postmerge-direct',integrationHeadSha:head,
    validation:{status:'passed'},completedUnits:units,pendingUnits:[]
  }]};
  assert.equal(source.directPostmergeCheckpointMatches(state,merge,head,units),true);
  assert.equal(source.directPostmergeCheckpointMatches(state,merge,head,units),true,'repeating verification is a no-op');
  assert.equal(source.directPostmergeCheckpointMatches(state,merge,head,units.slice(1)),false,'49/50 must fail closed');
  assert.equal(source.directPostmergeCheckpointMatches(state,head,head,units),false,'different merge SHA must fail closed');
  assert.equal(source.directPostmergeCheckpointMatches(state,merge,'0'.repeat(40),units),false,'different integration head must fail closed');
  assert.equal(source.directPostmergeCheckpointMatches({...state,checkpoints:[{...state.checkpoints[0],integrationStage:'postmerge'}]},merge,head,units),false,'incompatible stage must fail closed');
  assert.equal(source.directPostmergeCheckpointMatches({...state,checkpoints:[{...state.checkpoints[0],pendingUnits:['MLS-V01-0050']}]},merge,head,units),false,'partial wave must fail closed');
});
