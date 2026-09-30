'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const script=fs.readFileSync(path.join(process.cwd(),'scripts','MLS R4.3 R33 Handoff.cjs'),'utf8');
const flow=fs.readFileSync(path.join(process.cwd(),'.github','workflows','MLS R4.3 R33 Handoff.yml'),'utf8');

test('R4.3 R33 handoff is fixed to reconciled pilot #2208',()=>{
 assert.match(script,/waveIssueNumber===2208/);
 assert.match(script,/record\.status==='reconciled'/);
 assert.match(script,/record\.reconciliation\?\.complete===true/);
 assert.match(script,/record\.totalUnits===100&&record\.workerCount===20&&record\.shardSize===5/);
 assert.match(script,/record\.reconciliation\.completedUnits\.length===100/);
 assert.match(script,/record\.reconciliation\.conflicts\.length===0/);
 assert.match(script,/markR33Handoff/);
});

test('R4.3 R33 handoff workflow uses exact authorized trigger and global writer mutex',()=>{
 assert.match(flow,/\[MLS R4\.3\]\[R33\]\[HANDOFF\] 2208/);
 assert.match(flow,/MLS_R43_R33_HANDOFF_V1/);
 assert.match(flow,/APPLY_R43_R33_HANDOFF_2208/);
 assert.match(flow,/OWNER/);
 assert.match(flow,/MEMBER/);
 assert.match(flow,/COLLABORATOR/);
 assert.match(flow,/mls-global-dispatcher/);
 assert.match(flow,/mls-global-dispatcher-skip-\{0\}/);
 assert.match(flow,/cancel-in-progress: false/);
 assert.doesNotMatch(flow,/workflow_dispatch:|schedule:|push:/);
});
