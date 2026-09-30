'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const bootstrap=path.join(process.cwd(),'.github','workflows','MLS R4.3 Snapshot Pilot Bootstrap.yml');
const scheduler=path.join(process.cwd(),'.github','workflows','MLS R4.3 Snapshot Pilot Scheduler.yml');

test('merging R4.3 infrastructure is inert until explicit bootstrap apply',()=>{
 const boot=fs.readFileSync(bootstrap,'utf8');
 const onBlock=boot.slice(boot.indexOf('on:'),boot.indexOf('\npermissions:'));
 assert.match(onBlock,/workflow_dispatch:/);
 assert.match(onBlock,/default: plan/);
 assert.match(onBlock,/APPLY_R43_PILOT_20X5/);
 assert.doesNotMatch(onBlock,/\n\s*push:/);
 assert.doesNotMatch(onBlock,/\n\s*schedule:/);
 assert.doesNotMatch(onBlock,/\n\s*issues:/);
});

test('R4.3 scheduler cannot bootstrap ownership and only reacts to authenticated protocol markers',()=>{
 const flow=fs.readFileSync(scheduler,'utf8');
 assert.match(flow,/issues:\s*\n\s*types: \[opened, edited\]/);
 assert.match(flow,/github\.event\.issue\.author_association/);
 assert.match(flow,/MLS_BCR_R43_REQUEST/);
 assert.match(flow,/MLS_BCR_R43_RESULT/);
 assert.doesNotMatch(flow,/workflow_dispatch:/);
 assert.doesNotMatch(flow,/schedule:/);
 assert.doesNotMatch(flow,/Snapshot Pilot Bootstrap\.cjs/);
});

test('R4.3 activation workflows remain serialized with the existing dispatcher',()=>{
 const boot=fs.readFileSync(bootstrap,'utf8');
 const flow=fs.readFileSync(scheduler,'utf8');
 for(const text of [boot,flow]){
  assert.match(text,/group: mls-global-dispatcher/);
  assert.match(text,/cancel-in-progress: false/);
  assert.match(text,/mls-github-cooldown-/);
 }
});
