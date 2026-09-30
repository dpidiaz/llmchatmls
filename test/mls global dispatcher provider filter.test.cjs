'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../MLS R32 EDITORIAL/global dispatcher/core.js');

function commandBody(x){return core.renderCommandBody(x);}
function registry(items){return core.normalizeRegistry({
 schemaVersion:'1.0',dispatcherVersion:core.DISPATCH_VERSION,
 items
});}
function item({workId,provider,priority=10,status='ready'}){
 return {
  workId,version:1,title:workId,workType:'editorial_batch',status,priority,
  createdAt:'2026-09-30T10:00:00.000Z',provider,
  resourceLocks:['entry:'+workId],allowedPaths:['tmp/'+workId],dependsOn:[],
  validation:[],branchPolicy:{mode:'assignment',prefix:'worker/'+workId},
  completion:{requiresCommit:true,requiresValidation:true}
 };
}

test('legacy claim without provider preserves command shape',()=>{
 const parsed=core.parseCommand(commandBody({
  operation:'claim',requestId:'legacy-request-001',workerId:'legacy-worker-001',
  capabilities:['chat','github']
 }));
 assert.deepEqual(parsed,{
  operation:'claim',requestId:'legacy-request-001',workerId:'legacy-worker-001',
  workerLogin:null,capabilities:['chat','github']
 });
});

test('claim may explicitly filter r33-farm provider',()=>{
 const parsed=core.parseCommand(commandBody({
  operation:'claim',requestId:'r33-request-0001',workerId:'r33-worker-0001',
  provider:'r33-farm',capabilities:['chat','github']
 }));
 assert.equal(parsed.provider,'r33-farm');
});

test('provider-filtered selection cannot take higher-priority work from another provider',()=>{
 const reg=registry([
  item({workId:'integration-priority-1',provider:'integration',priority:1}),
  item({workId:'r33-handoff-1',provider:'r33-farm',priority:25}),
  item({workId:'global-priority-2',provider:'global',priority:2})
 ]);
 const ledger=core.initialLedger(reg);
 const selected=core.selectNextWork(reg,ledger,[],Date.parse('2026-09-30T10:01:00Z'),'r33-farm');
 assert.equal(selected.item.workId,'r33-handoff-1');
 assert.equal(selected.item.provider,'r33-farm');
});

test('provider filter excludes recoveries from other providers',()=>{
 const reg=registry([
  item({workId:'global-recovery',provider:'global',priority:1}),
  item({workId:'r33-ready',provider:'r33-farm',priority:25})
 ]);
 const ledger=core.initialLedger(reg);
 ledger.recoveries['global-recovery']={
  workId:'global-recovery',workItem:reg.items.find(x=>x.workId==='global-recovery')
 };
 const selected=core.selectNextWork(reg,ledger,[],Date.parse('2026-09-30T10:01:00Z'),'r33-farm');
 assert.equal(selected.item.workId,'r33-ready');
 assert.equal(selected.recovery,null);
});

test('invalid provider filter fails closed',()=>{
 assert.throws(()=>core.parseCommand(commandBody({
  operation:'claim',requestId:'r33-request-0002',workerId:'r33-worker-0002',
  provider:'r33 farm !!!'
 })),{code:'INVALID_PROVIDER_FILTER'});
});


test('workPrefix excludes old R33 recoveries outside the R4.3 handoff scope',()=>{
 const reg=registry([
  item({workId:'r33-farm:legacy:001',provider:'r33-farm',priority:1}),
  item({workId:'r33-handoff:2208:pilot:001',provider:'r33-farm',priority:25})
 ]);
 const ledger=core.initialLedger(reg);
 ledger.recoveries['r33-farm:legacy:001']={
  workId:'r33-farm:legacy:001',
  workItem:reg.items.find(x=>x.workId==='r33-farm:legacy:001')
 };
 const selected=core.selectNextWork(
  reg,ledger,[],Date.parse('2026-09-30T10:01:00Z'),
  'r33-farm','r33-handoff:2208:'
 );
 assert.equal(selected.item.workId,'r33-handoff:2208:pilot:001');
 assert.equal(selected.recovery,null);
});

test('claim parser preserves exact provider and handoff prefix together',()=>{
 const parsed=core.parseCommand(commandBody({
  operation:'claim',requestId:'r33-gate-request-01',workerId:'r33-gate-worker-01',
  provider:'r33-farm',workPrefix:'r33-handoff:2208:',
  capabilities:['chat','github']
 }));
 assert.equal(parsed.provider,'r33-farm');
 assert.equal(parsed.workPrefix,'r33-handoff:2208:');
});

test('invalid workPrefix fails closed',()=>{
 assert.throws(()=>core.parseCommand(commandBody({
  operation:'claim',requestId:'r33-request-0003',workerId:'r33-worker-0003',
  provider:'r33-farm',workPrefix:'bad prefix!'
 })),{code:'INVALID_WORK_PREFIX'});
});

test('R33 handoff worker auto-pull source preserves provider and wave workPrefix',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const source=fs.readFileSync(path.join(process.cwd(),'scripts','MLS global dispatcher worker.cjs'),'utf8');
 assert.match(source,/\^r33-handoff:\\\\d\+:/);
 assert.match(source,/provider:'r33-farm'/);
 assert.match(source,/workPrefix:handoffScope\[0\]/);
});
