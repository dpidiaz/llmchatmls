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
 assert.match(source,/R43_BOOT_PREVIEW_DRIFT/);
 assert.match(source,/\[403,429\]/);
 assert.doesNotMatch(source,/while\s*\([^)]*(403|429)/);
});

test('bootstrap and Global Dispatcher share exactly the same repository-wide concurrency group',()=>{
 const boot=fs.readFileSync(workflow,'utf8');
 const dispatcher=fs.readFileSync(dispatcherWorkflow,'utf8');
 assert.match(boot,/concurrency:\s*\n\s*group: mls-global-dispatcher/);
 assert.match(dispatcher,/concurrency:\s*\n\s*group: mls-global-dispatcher/);
 assert.match(boot,/default: plan/);
 assert.match(boot,/APPLY_R43_PILOT_20X5/);
 assert.match(boot,/ref: main/);
 assert.match(boot,/cancel-in-progress: false/);
});

test('bootstrap apply finalizes placeholders only after rechecking live main and preview identity',()=>{
 const source=fs.readFileSync(script,'utf8');
 const placeholderIndex=source.indexOf("createPlaceholder(");
 const mainAfterIndex=source.indexOf("const mainAfter=await mainHead()");
 const actualPlanIndex=source.indexOf("const actual=await computePlan");
 const firstPatchIndex=source.indexOf("await api('PATCH'");
 assert.ok(placeholderIndex>=0);
 assert.ok(mainAfterIndex>placeholderIndex);
 assert.ok(actualPlanIndex>mainAfterIndex);
 assert.ok(firstPatchIndex>actualPlanIndex);
 assert.match(source,/JSON\.stringify\(actual\.protectedCodes\)===JSON\.stringify\(preview\.protectedCodes\)/);
});
