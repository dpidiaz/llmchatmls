'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');

const scriptPath=path.join(process.cwd(),'scripts','MLS R4.3 R33 Handoff.cjs');
const handoffFlowPath=path.join(process.cwd(),'.github','workflows','MLS R4.3 R33 Handoff.yml');
const schedulerFlowPath=path.join(process.cwd(),'.github','workflows','MLS R4.3 Snapshot Pilot Scheduler.yml');
const script=fs.readFileSync(scriptPath,'utf8');
const handoffFlow=fs.readFileSync(handoffFlowPath,'utf8');
const schedulerFlow=fs.readFileSync(schedulerFlowPath,'utf8');

test('R4.3 R33 handoff is generic, reconciled-wave bound and 5-entry shard safe',()=>{
 cp.execFileSync(process.execPath,['--check',scriptPath],{stdio:'pipe'});
 assert.match(script,/resolveWaveIssueNumber/);
 assert.match(script,/GITHUB_EVENT_PATH/);
 assert.match(script,/MLS_R43_R33_HANDOFF_WAVE_ISSUE/);
 assert.match(script,/record\.status!=='reconciled'/);
 assert.match(script,/WAVE_NOT_RECONCILED/);
 assert.match(script,/record\.reconciliation\?\.complete===true/);
 assert.match(script,/record\.shardSize===5/);
 assert.match(script,/record\.workerCount\*record\.shardSize===record\.totalUnits/);
 assert.match(script,/new Set\(record\.reconciliation\.completedUnits\.map\(String\)\)\.size===record\.totalUnits/);
 assert.match(script,/record\.reconciliation\.conflicts\.length===0/);
 assert.match(script,/record\.totalUnits<=500/);
 assert.match(script,/markR33Handoff/);
 assert.doesNotMatch(script,/waveIssueNumber===2208|APPLY_R43_R33_HANDOFF_2208/);
});

test('R4.3 scheduler performs automatic handoff in the same serialized workflow',()=>{
 assert.match(schedulerFlow,/Reconcile R4\.3 pilot wave/);
 assert.match(schedulerFlow,/Auto-handoff reconciled R4\.3 wave to R33/);
 assert.match(schedulerFlow,/MLS R4\.3 R33 Handoff\.cjs/);
 assert.match(schedulerFlow,/mls-global-dispatcher/);
 assert.match(schedulerFlow,/cancel-in-progress: false/);
 assert.match(schedulerFlow,/contents: read/);
 assert.match(schedulerFlow,/issues: write/);
 assert.doesNotMatch(schedulerFlow,/contents: write|pull-requests: write|actions: write/);
});

test('standalone R4.3 R33 handoff is recovery-only workflow_dispatch fallback',()=>{
 assert.match(handoffFlow,/workflow_dispatch:/);
 assert.match(handoffFlow,/wave_issue:/);
 assert.match(handoffFlow,/MLS_R43_R33_HANDOFF_WAVE_ISSUE: \$\{\{ inputs\.wave_issue \}\}/);
 assert.match(handoffFlow,/mls-global-dispatcher/);
 assert.match(handoffFlow,/cancel-in-progress: false/);
 assert.match(handoffFlow,/contents: read/);
 assert.match(handoffFlow,/issues: write/);
 assert.match(handoffFlow,/ref: main/);
 assert.doesNotMatch(handoffFlow,/issues:\s*\n\s*types:|schedule:|push:/);
 assert.doesNotMatch(handoffFlow,/2208|APPLY_R43_R33_HANDOFF/);
});
