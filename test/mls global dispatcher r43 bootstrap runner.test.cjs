'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');

const script=path.join(process.cwd(),'scripts','MLS R4.3 Snapshot Pilot Bootstrap.cjs');
const workflow=path.join(process.cwd(),'.github','workflows','MLS R4.3 Snapshot Pilot Bootstrap.yml');
const dispatcherWorkflow=path.join(process.cwd(),'.github','workflows','MLS Global Dispatcher Scheduler.yml');

test('guarded bootstrap runner is syntactically valid and apply requires the exact pilot token',()=>{
 cp.execFileSync(process.execPath,['--check',script],{stdio:'pipe'});
 const source=fs.readFileSync(script,'utf8');
 assert.match(source,/const CONFIRM='APPLY_R43_PILOT_20X5'/);
 assert.match(source,/assert\(confirm===CONFIRM/);
 assert.match(source,/workerCount:20,shardSize:5/);
 assert.match(source,/if\(mode==='plan'\)/);
 assert.match(source,/if\(mode==='apply'\)/);
 assert.match(source,/R43_BOOT_MAIN_DRIFT/);
 assert.match(source,/R43_BOOT_RESERVATION_BASE_DRIFT/);
 assert.match(source,/R43_BOOT_RESERVATION_MANIFEST_DRIFT/);
 assert.match(source,/R43_BOOT_WRITE_BUDGET/);
 assert.match(source,/createOrReusePlaceholder/);
 assert.match(source,/idempotent:true/);
 assert.match(source,/\[403,429\]/);
 assert.doesNotMatch(source,/while\s*\([^)]*(403|429)/);
});

test('bootstrap and Global Dispatcher share exactly the same repository-wide concurrency group',()=>{
 const boot=fs.readFileSync(workflow,'utf8');
 const dispatcher=fs.readFileSync(dispatcherWorkflow,'utf8');
 assert.match(boot,/mls-global-dispatcher/);
 assert.match(boot,/mls-global-dispatcher-skip-\{0\}/);
 assert.match(dispatcher,/mls-global-dispatcher/);
 assert.match(dispatcher,/mls-global-dispatcher-skip-\{0\}/);
 assert.match(boot,/default: plan/);
 assert.match(boot,/APPLY_R43_PILOT_20X5/);
 assert.match(boot,/ref: main/);
 assert.match(boot,/cancel-in-progress: false/);
});

test('bootstrap apply reuses partial reservations and refuses to seal a wave after main drift',()=>{
 const source=fs.readFileSync(script,'utf8');
 const reservationIndex=source.indexOf('async function persistReservation');
 const mainAfterIndex=source.indexOf('const mainAfter=await mainHead()');
 const controlIndex=source.indexOf('const control=waveIssue.create');
 const wavePatchIndex=source.indexOf("await api('PATCH','/issues/'+wavePlaceholder.number");
 assert.ok(reservationIndex>=0);
 assert.ok(mainAfterIndex>reservationIndex);
 assert.ok(controlIndex>mainAfterIndex);
 assert.ok(wavePatchIndex>controlIndex);
 assert.match(source,/existingBySlot/);
 assert.match(source,/R43_BOOT_RESERVATION_BASE_DRIFT/);
 assert.match(source,/R43_BOOT_RESERVATION_MANIFEST_DRIFT/);
 assert.match(source,/assert\(mainAfter===main,'R43_BOOT_MAIN_DRIFT'\)/);
 assert.match(source,/assert\(writeCount<=10,'R43_BOOT_WRITE_BUDGET'\)/);
});
