'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const child=require('node:child_process');

test('Unified integration executor is authorized, serialized and keeps canonical ordering',()=>{
  const workflow=fs.readFileSync('.github/workflows/MLS Unified R33 Integration Execute.yml','utf8');
  assert.match(workflow,/issue_comment:/);
  assert.match(workflow,/MLS_UNIFIED_R33_INTEGRATION_EXECUTE/);
  assert.match(workflow,/group: mls-unified-r33-integration/);
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
  assert.match(source,/UNIFIED_INTEGRATION_CONTENT_DRIFT/);
  assert.match(source,/r44SourceSha256/);
  assert.match(source,/R33 GitHub Native Tests/);
  assert.match(source,/merge_method:'merge',sha:headSha/);
  assert.match(source,/integrationStage:'premerge'/);
  assert.match(source,/integrationStage:'postmerge'/);
  child.execFileSync(process.execPath,['--check','scripts/MLS unified r33 integration execute.cjs'],{stdio:'pipe'});
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
