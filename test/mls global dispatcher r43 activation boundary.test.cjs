'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const bootstrap=path.join(process.cwd(),'.github','workflows','MLS R4.3 Snapshot Pilot Bootstrap.yml');
const scheduler=path.join(process.cwd(),'.github','workflows','MLS R4.3 Snapshot Pilot Scheduler.yml');

test('R4.3 bootstrap activation remains explicit and has no automatic push/schedule trigger',()=>{
 const boot=fs.readFileSync(bootstrap,'utf8');
 const onBlock=boot.slice(boot.indexOf('on:'),boot.indexOf('\npermissions:'));
 assert.match(onBlock,/workflow_dispatch:/);
 assert.match(onBlock,/default: plan/);
 assert.match(onBlock,/issues:\s*\n\s*types: \[opened\]/);
 assert.doesNotMatch(onBlock,/\n\s*push:/);
 assert.doesNotMatch(onBlock,/\n\s*schedule:/);
});

test('Issue-triggered bootstrap is fixed to the authorized 20x5 apply command',()=>{
 const boot=fs.readFileSync(bootstrap,'utf8');
 assert.match(boot,/github\.event_name == 'issues'/);
 assert.match(boot,/github\.event\.action == 'opened'/);
 assert.match(boot,/OWNER/);
 assert.match(boot,/MEMBER/);
 assert.match(boot,/COLLABORATOR/);
 assert.match(boot,/github\.event\.issue\.author_association/);
 assert.match(boot,/\[MLS R4\.3\]\[BOOTSTRAP\]\[APPLY\] BCR-R43-PILOT-20X5/);
 assert.match(boot,/MLS_R43_BOOTSTRAP_APPLY_V1/);
 assert.match(boot,/APPLY_R43_PILOT_20X5/);
 assert.match(boot,/github\.event_name == 'issues' && 'apply' \|\| inputs\.mode/);
 assert.match(boot,/github\.event_name == 'issues' && 'BCR-R43-PILOT-20X5' \|\| inputs\.wave_id/);
 assert.match(boot,/github\.event_name == 'issues' && 'APPLY_R43_PILOT_20X5' \|\| inputs\.confirm/);
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
  assert.match(text,/mls-global-dispatcher/);
  assert.match(text,/mls-global-dispatcher-skip-\{0\}/);
  assert.match(text,/github\.run_id/);
  assert.match(text,/cancel-in-progress: false/);
  assert.match(text,/mls-github-cooldown-/);
 }
});
