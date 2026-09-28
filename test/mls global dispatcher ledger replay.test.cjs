'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../MLS R32 EDITORIAL/global dispatcher/core.js');

function registry(){
  const item=id=>({workId:id,workType:'editorial_batch',status:'ready',priority:id==='first-work'?1:2,
    createdAt:'2026-09-28T00:00:00Z',dependsOn:[],resourceLocks:['entry:'+id],
    allowedPaths:['entries/'+id+'.json'],validation:['R33 Editorial Batch Tests'],
    completion:{requiresCommit:true,requiresValidation:true}});
  return core.normalizeRegistry({schemaVersion:'1.0',items:[item('first-work'),item('next-work')]});
}
function closedDone(issueNumber,workId,closedAt,sha){
  return {kind:'mls_global_assignment',issueNumber,assignmentId:'MLS-GLOBAL-'+issueNumber,
    requestId:'request-'+issueNumber,leaseEpoch:issueNumber,workId,workVersion:1,
    status:'done',provider:'r33-farm',branch:'worker/r33-farm/'+issueNumber,closedAt,
    finalCommitSha:sha,checkpoints:[{completedUnits:['ENTRY-A']},{completedUnits:['ENTRY-A','ENTRY-B']}]};
}

test('packed ledger roundtrips every field and fits under GitHub issue safety limit',()=>{
  const ledger=core.initialLedger(registry());
  ledger.terminal['first-work']={status:'done',assignmentId:'MLS-GLOBAL-10',completedUnits:['ENTRY-A','ENTRY-B']};
  ledger.recoveries['next-work']={kind:'orphan_progress',orphanHeadSha:'b'.repeat(40)};
  ledger.epochs['next-work']=1704;
  for(let i=0;i<2500;i++)ledger.requests['request-'+i]={
    status:'assigned',workId:'next-work',assignmentId:'MLS-GLOBAL-'+i,issueNumber:i,updatedAt:'2026-09-28T16:39:00Z'};
  assert.ok(JSON.stringify(ledger).length>180000);
  const body=core.renderLedgerBody(ledger);
  assert.match(body,/mls_global_dispatch_ledger_packed/);
  assert.ok(Buffer.byteLength(body,'utf8')<250000);
  assert.deepEqual(core.parseLedger(body),ledger);
  assert.equal(core.parseLedger(body.replace(/"sha256":"[a-f0-9]{64}"/, '"sha256":"'+ '0'.repeat(64)+'"')),null);
});

test('original uncompressed ledger remains backwards compatible',()=>{
  const ledger=core.initialLedger(registry());
  const body=core.renderLedgerBody(ledger);
  assert.deepEqual(core.parseLedger(body),ledger);
  assert.doesNotMatch(body,/mls_global_dispatch_ledger_packed/);
});

test('replaying DONE after stale ledger prevents duplicate work and keeps first FINISH canonical',()=>{
  const reg=registry(),ledger=core.initialLedger(reg);
  ledger.updatedAt='2026-09-28T09:05:07.171Z';
  const first=closedDone(1694,'first-work','2026-09-28T16:28:23.308Z','a'.repeat(40));
  const duplicate=closedDone(1704,'first-work','2026-09-28T16:39:33.520Z','b'.repeat(40));
  const replay=core.reconcileClosedAssignmentStates(ledger,[duplicate,first]);
  assert.equal(replay.changed,1);
  assert.equal(replay.conflicts.length,1);
  assert.equal(ledger.terminal['first-work'].assignmentId,'MLS-GLOBAL-1694');
  assert.equal(ledger.terminal['first-work'].commitSha,'a'.repeat(40));
  assert.deepEqual(ledger.terminal['first-work'].completedUnits,['ENTRY-A','ENTRY-B']);
  assert.equal(ledger.requests['request-1694'].status,'done');
  assert.equal(ledger.epochs['first-work'],1694);
  assert.equal(core.selectNextWork(reg,ledger,[],Date.parse('2026-09-28T16:40:00Z')).item.workId,'next-work');
  assert.equal(core.reconcileClosedAssignmentStates(ledger,[first]).changed,0);
});

test('durable recovery can be replayed and is superseded by later DONE',()=>{
  const ledger=core.initialLedger(registry());
  const recovery={kind:'orphan_progress',capturedAt:'2026-09-28T16:10:50Z',orphanHeadSha:'b'.repeat(40)};
  const state={kind:'mls_global_assignment',issueNumber:1680,assignmentId:'MLS-GLOBAL-1680',
    requestId:'request-1680',leaseEpoch:1680,workId:'first-work',closedAt:'2026-09-28T16:10:51Z',
    status:'recovery_required',recoveryCaptured:recovery};
  assert.equal(core.reconcileClosedAssignmentStates(ledger,[state]).changed,1);
  assert.deepEqual(ledger.recoveries['first-work'],recovery);
  const done=closedDone(1692,'first-work','2026-09-28T16:20:51Z','c'.repeat(40));
  assert.equal(core.reconcileClosedAssignmentStates(ledger,[done]).changed,1);
  assert.equal(ledger.recoveries['first-work'],undefined);
  assert.equal(ledger.terminal['first-work'].status,'done');
});
