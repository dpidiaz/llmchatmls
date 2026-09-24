'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const core=require('../MLS R32 EDITORIAL/global dispatcher/core.js');

function registry(){
  return core.normalizeRegistry({
    schemaVersion:'1.0',
    items:[
      {workId:'alpha-work',workType:'code_task',status:'ready',priority:20,createdAt:'2026-09-23T00:00:00Z',dependsOn:[],resourceLocks:['path:a'],allowedPaths:['a/'],validation:['tests'],completion:{requiresCommit:true,requiresValidation:true}},
      {workId:'beta-work',workType:'code_task',status:'ready',priority:30,createdAt:'2026-09-23T00:00:00Z',dependsOn:[],resourceLocks:['path:b'],allowedPaths:['b/'],validation:['tests'],completion:{requiresCommit:true,requiresValidation:true}},
      {workId:'alpha-child',workType:'validation',status:'ready',priority:10,createdAt:'2026-09-23T00:00:00Z',dependsOn:[],resourceLocks:['path:a/child'],allowedPaths:['reports/'],validation:['tests'],completion:{requiresCommit:true,requiresValidation:true}},
      {workId:'dependent',workType:'validation',status:'ready',priority:5,createdAt:'2026-09-23T00:00:00Z',dependsOn:['alpha-work'],resourceLocks:['system:dependent'],allowedPaths:['reports/'],validation:['tests'],completion:{requiresCommit:true,requiresValidation:true}}
    ]
  });
}
function assignment(item,issueNumber,now='2026-09-23T10:00:00.000Z'){
  return core.makeAssignmentState({issueNumber,item,requestId:'request-'+String(issueNumber).padStart(8,'0'),workerId:'worker-'+String(issueNumber).padStart(8,'0'),baseCommit:'a'.repeat(40),branch:'worker/'+item.workId+'/'+issueNumber,now,token:'token-'+issueNumber});
}

test('canonical registry is GitHub-only and Gate 500 activation is explicitly authorized',()=>{
  const r=core.loadRegistry('.');
  assert.equal(r.sourceOfTruth,'github');
  assert.ok(r.items.length>=5);
  const gate=r.items.find(x=>x.workId==='gate500');
  assert.ok(gate);
  assert.equal(gate.status,'ready');
  assert.equal(gate.authorization?.authorized,true);
});

test('timing is ACK 5m, rolling lease 10m, reaper 5m',()=>{
  assert.equal(core.ACK_TTL_MS,5*60*1000);
  assert.equal(core.LEASE_TTL_MS,10*60*1000);
  assert.equal(core.REAPER_CADENCE_MINUTES,5);
  const r=registry(),s=assignment(r.items[0],100);
  assert.equal(s.ackDeadlineAt,'2026-09-23T10:05:00.000Z');
  const next=core.applyWorkerEvent(s,{operation:'heartbeat',assignmentId:s.assignmentId,leaseToken:s.leaseToken,leaseEpoch:s.leaseEpoch},{createdAt:'2026-09-23T10:02:00.000Z',commentId:1});
  assert.equal(next.expiresAt,'2026-09-23T10:12:00.000Z');
});

test('hierarchical path locks prevent overlapping assignments',()=>{
  assert.equal(core.locksConflict('path:a','path:a/child'),true);
  assert.equal(core.locksConflict('path:a','path:b'),false);
  const r=registry(),ledger=core.initialLedger(r);
  const first=core.selectNextWork(r,ledger,[],Date.parse('2026-09-23T10:00:00Z'));
  assert.equal(first.item.workId,'alpha-child');
  const active=assignment(first.item,101);
  const second=core.selectNextWork(r,ledger,[active],Date.parse('2026-09-23T10:01:00Z'));
  assert.equal(second.item.workId,'beta-work');
  const active2=assignment(second.item,102);
  const third=core.selectNextWork(r,ledger,[active,active2],Date.parse('2026-09-23T10:01:00Z'));
  assert.equal(third,null);
});

test('dependencies block work until terminal dependency exists',()=>{
  const r=registry(),ledger=core.initialLedger(r);
  assert.equal(core.dependenciesSatisfied(r.items.find(x=>x.workId==='dependent'),ledger),false);
  ledger.terminal['alpha-work']={status:'done'};
  assert.equal(core.dependenciesSatisfied(r.items.find(x=>x.workId==='dependent'),ledger),true);
});

test('recovery outranks normal work regardless of normal priority',()=>{
  const r=registry(),ledger=core.initialLedger(r);
  ledger.recoveries['beta-work']={kind:'checkpoint_progress',branch:'worker/beta',baseCommit:'a'.repeat(40),lastCheckpointCommit:'b'.repeat(40)};
  const selected=core.selectNextWork(r,ledger,[],Date.parse('2026-09-23T10:00:00Z'));
  assert.equal(selected.item.workId,'beta-work');
  assert.ok(selected.recovery);
});

test('unacknowledged assignment expires after five-minute ACK deadline',()=>{
  const r=registry(),s=assignment(r.items[0],106);
  assert.equal(core.isLeaseExpired(s,Date.parse('2026-09-23T10:05:00.000Z')),false);
  assert.equal(core.isLeaseExpired(s,Date.parse('2026-09-23T10:05:00.001Z')),true);
  assert.equal(core.releaseReasonForAssignment(s,true),'ACK_TIMEOUT');
});

test('recovery classifier preserves orphan commits and checkpoint progress',()=>{
  const r=registry(),s=assignment(r.items[0],107);
  assert.equal(core.classifyRecoveryState(s,'a'.repeat(40),'2026-09-23T10:06:00.000Z'),null);

  const orphan=core.classifyRecoveryState(s,'b'.repeat(40),'2026-09-23T10:06:00.000Z');
  assert.equal(orphan.kind,'orphan_progress');
  assert.equal(orphan.lastCheckpointCommit,null);
  assert.equal(orphan.orphanHeadSha,'b'.repeat(40));
  assert.equal(orphan.resumeCommit,'b'.repeat(40));

  const checkpointed={...s,lastCheckpointCommit:'b'.repeat(40)};
  const cp=core.classifyRecoveryState(checkpointed,'b'.repeat(40),'2026-09-23T10:06:00.000Z');
  assert.equal(cp.kind,'checkpoint_progress');
  assert.equal(cp.orphanHeadSha,null);
  assert.equal(cp.resumeCommit,'b'.repeat(40));

  const later=core.classifyRecoveryState(checkpointed,'c'.repeat(40),'2026-09-23T10:06:00.000Z');
  assert.equal(later.kind,'orphan_progress');
  assert.equal(later.orphanHeadSha,'c'.repeat(40));
  assert.equal(later.resumeCommit,'c'.repeat(40));
});

test('zombie event is rejected after lease expiry',()=>{
  const r=registry(),s=assignment(r.items[0],103);
  const ack=core.applyWorkerEvent(s,{operation:'heartbeat',assignmentId:s.assignmentId,leaseToken:s.leaseToken,leaseEpoch:s.leaseEpoch},{createdAt:'2026-09-23T10:01:00.000Z',commentId:2});
  assert.throws(()=>core.applyWorkerEvent(ack,{operation:'heartbeat',assignmentId:ack.assignmentId,leaseToken:ack.leaseToken,leaseEpoch:ack.leaseEpoch},{createdAt:'2026-09-23T10:11:00.001Z',commentId:3}),e=>e.code==='LEASE_EXPIRED');
});

test('checkpoint is idempotent and conflicting retry fails closed',()=>{
  const r=registry(),s=assignment(r.items[0],104);
  const ev={operation:'checkpoint',assignmentId:s.assignmentId,leaseToken:s.leaseToken,leaseEpoch:s.leaseEpoch,commitSha:'b'.repeat(40),validation:{status:'passed'},completedUnits:['x'],pendingUnits:[]};
  const once=core.applyWorkerEvent(s,ev,{createdAt:'2026-09-23T10:01:00.000Z',commentId:4});
  const twice=core.applyWorkerEvent(once,ev,{createdAt:'2026-09-23T10:02:00.000Z',commentId:5});
  assert.equal(twice.checkpoints.length,1);
  assert.throws(()=>core.applyWorkerEvent(twice,{...ev,notes:'different'},{createdAt:'2026-09-23T10:03:00.000Z',commentId:6}),e=>e.code==='CHECKPOINT_CONFLICT');
});

test('finish requires passed checkpoint and exact checkpointed commit',()=>{
  const r=registry(),s=assignment(r.items[0],105);
  assert.throws(()=>core.applyWorkerEvent(s,{operation:'finish',assignmentId:s.assignmentId,leaseToken:s.leaseToken,leaseEpoch:s.leaseEpoch,commitSha:'b'.repeat(40)},{createdAt:'2026-09-23T10:01:00.000Z',commentId:7}),e=>e.code==='FINISH_CHECKPOINT_REQUIRED');
  const cp=core.applyWorkerEvent(s,{operation:'checkpoint',assignmentId:s.assignmentId,leaseToken:s.leaseToken,leaseEpoch:s.leaseEpoch,commitSha:'b'.repeat(40),validation:{status:'passed'}},{createdAt:'2026-09-23T10:01:00.000Z',commentId:8});
  const done=core.applyWorkerEvent(cp,{operation:'finish',assignmentId:cp.assignmentId,leaseToken:cp.leaseToken,leaseEpoch:cp.leaseEpoch,commitSha:'b'.repeat(40)},{createdAt:'2026-09-23T10:02:00.000Z',commentId:9});
  assert.equal(done.readyToClose,true);
});

test('allowedPaths guard accepts descendants but rejects neighboring paths',()=>{
  assert.equal(core.pathAllowed('a/file.js',['a/']),true);
  assert.equal(core.pathAllowed('a/deep/file.js',['a/']),true);
  assert.equal(core.pathAllowed('ab/file.js',['a/']),false);
  assert.equal(core.pathAllowed('exact.txt',['exact.txt']),true);
});

test('assignment branch is never main and uses unique issue number',()=>{
  const r=registry(),branch=core.assignmentBranch(r.items[0],777);
  assert.notEqual(branch,'main');
  assert.match(branch,/000777$/);
});

test('workflow is single-writer and worker events are serialized per assignment issue',()=>{
  const scheduler=fs.readFileSync('.github/workflows/MLS Global Dispatcher Scheduler.yml','utf8');
  const worker=fs.readFileSync('.github/workflows/MLS Global Dispatcher Worker Events.yml','utf8');
  assert.match(scheduler,/group: mls-global-dispatcher/);
  assert.match(scheduler,/cron: '\*\/5 \* \* \* \*'/);
  assert.match(scheduler,/contents: write/);
  assert.match(worker,/group: mls-global-assignment-\$\{\{ github\.event\.issue\.number \}\}/);
  assert.match(worker,/contents: read/);
});

test('worker refetches live issue and verifies branch head plus allowed paths',()=>{
  const source=fs.readFileSync('scripts/MLS global dispatcher worker.cjs','utf8');
  assert.match(source,/let issue=await getIssue/);
  assert.match(source,/BRANCH_HEAD_MISMATCH/);
  assert.match(source,/CHECKPOINT_SCOPE_VIOLATION/);
  assert.match(source,/core\.pathAllowed/);
  assert.match(source,/compare\//);
  const schedulerSource=fs.readFileSync('scripts/MLS global dispatcher scheduler.cjs','utf8');
  assert.match(schedulerSource,/core\.classifyRecoveryState/);
});

test('dispatcher editorial control plane contains no Cloudflare or D1 dependency',()=>{
  const files=['MLS R32 EDITORIAL/global dispatcher/core.js','scripts/MLS global dispatcher scheduler.cjs','scripts/MLS global dispatcher worker.cjs','.github/workflows/MLS Global Dispatcher Scheduler.yml','.github/workflows/MLS Global Dispatcher Worker Events.yml'];
  for(const file of files){
    const source=fs.readFileSync(file,'utf8');
    assert.doesNotMatch(source,/workers\.dev|wrangler|WIKI_DB|\/api\/wiki\/editorial/i,file);
  }
});
