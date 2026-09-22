const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const core=require('../MLS R32 EDITORIAL/farm core.js');

test('Farm corpus is canonical 10,133 in existing FIFO language order',()=>{
  const corpus=core.corpusEntries('.');
  assert.equal(corpus.length,10133);
  assert.equal(corpus[0].code,'MLS-V10-0001');
  assert.equal(corpus[929].code,'MLS-V10-0930');
  assert.equal(corpus[930].code,'MLS-V01-0001');
  assert.equal(new Set(corpus.map(x=>x.code)).size,10133);
});

test('Farm claim parser defaults to 25 and caps at 100',()=>{
  assert.deepEqual(core.parseCommand(JSON.stringify({operation:'claim',requestId:'request-12345678',workerId:'worker-12345678'})),{
    operation:'claim',requested:25,requestId:'request-12345678',workerId:'worker-12345678'
  });
  assert.equal(core.parseCommand(JSON.stringify({operation:'claim',requested:100,requestId:'request-12345678',workerId:'worker-12345678'})).requested,100);
  assert.throws(()=>core.parseCommand(JSON.stringify({operation:'claim',requested:101,requestId:'request-12345678',workerId:'worker-12345678'})),/1 y 100/);
});

test('Farm lease is exactly 60 minutes since last accepted progress',()=>{
  const state=core.makeBatchState({issueNumber:55,requestId:'request-12345678',workerId:'worker-12345678',entries:[{code:'MLS-V10-0001',language:'espanol-guatemala',n:1,path:'x'}],now:'2026-09-22T06:00:00.000Z',token:'abc'});
  assert.equal(state.expiresAt,'2026-09-22T07:00:00.000Z');
  const next=core.applyWorkerEvent(state,{operation:'heartbeat',batchId:state.batchId,leaseToken:'abc'},{createdAt:'2026-09-22T06:20:00.000Z',commentId:1});
  assert.equal(next.expiresAt,'2026-09-22T07:20:00.000Z');
});

test('Farm rejects zombie worker event after lease expiry',()=>{
  const state=core.makeBatchState({issueNumber:56,requestId:'request-12345678',workerId:'worker-12345678',entries:[{code:'MLS-V10-0001',language:'espanol-guatemala',n:1,path:'x'}],now:'2026-09-22T06:00:00.000Z',token:'abc'});
  assert.throws(()=>core.applyWorkerEvent(state,{operation:'heartbeat',batchId:state.batchId,leaseToken:'abc'},{createdAt:'2026-09-22T07:00:00.001Z',commentId:2}),e=>e.code==='LEASE_EXPIRED');
});

test('Farm checkpoint is idempotent and terminal work survives expiration accounting',()=>{
  const entries=[
    {code:'MLS-V10-0001',language:'espanol-guatemala',n:1,path:'a'},
    {code:'MLS-V10-0002',language:'espanol-guatemala',n:2,path:'b'}
  ];
  const state=core.makeBatchState({issueNumber:57,requestId:'request-12345678',workerId:'worker-12345678',entries,now:'2026-09-22T06:00:00.000Z',token:'abc'});
  const ev={operation:'checkpoint',batchId:state.batchId,leaseToken:'abc',entries:[{code:'MLS-V10-0001',leaseEpoch:57,status:'submitted',result:{code:'MLS-V10-0001',sources:[],claims:[],links:[]}}]};
  const once=core.applyWorkerEvent(state,ev,{createdAt:'2026-09-22T06:10:00.000Z',commentId:3});
  const twice=core.applyWorkerEvent(once,ev,{createdAt:'2026-09-22T06:11:00.000Z',commentId:4});
  assert.equal(Object.keys(twice.results).length,1);
  assert.deepEqual(core.pendingCodes(twice),['MLS-V10-0002']);
});

test('Farm rejects conflicting second result for same code',()=>{
  const state=core.makeBatchState({issueNumber:58,requestId:'request-12345678',workerId:'worker-12345678',entries:[{code:'MLS-V10-0001',language:'espanol-guatemala',n:1,path:'a'}],now:'2026-09-22T06:00:00.000Z',token:'abc'});
  const a=core.applyWorkerEvent(state,{operation:'checkpoint',batchId:state.batchId,leaseToken:'abc',entries:[{code:'MLS-V10-0001',leaseEpoch:58,status:'submitted',result:{code:'MLS-V10-0001',x:1}}]},{createdAt:'2026-09-22T06:10:00.000Z',commentId:5});
  assert.throws(()=>core.applyWorkerEvent(a,{operation:'checkpoint',batchId:state.batchId,leaseToken:'abc',entries:[{code:'MLS-V10-0001',leaseEpoch:58,status:'submitted',result:{code:'MLS-V10-0001',x:2}}]},{createdAt:'2026-09-22T06:11:00.000Z',commentId:6}),e=>e.code==='RESULT_HASH_CONFLICT');
});

test('Farm ledger excludes submitted, review and preserved entries from future claims',()=>{
  let ledger=core.initialLedger(core.LANGUAGE_ORDER[0],[1]);
  ledger=core.addTerminalToLedger(ledger,'MLS-V10-0002','submitted');
  ledger=core.addTerminalToLedger(ledger,'MLS-V10-0003','needs_review');
  const terminal=core.terminalCodesFromLedgers([ledger]);
  assert.deepEqual([...terminal].sort(),['MLS-V10-0001','MLS-V10-0002','MLS-V10-0003']);
});

test('Farm exact allocation skips terminal and currently leased entries',()=>{
  const corpus=core.corpusEntries('.').slice(0,30);
  const terminal=new Set(['MLS-V10-0001']);
  const active=core.makeBatchState({issueNumber:59,requestId:'request-12345678',workerId:'worker-12345678',entries:[corpus[1]],now:new Date().toISOString(),token:'abc'});
  const selected=core.selectNextEntries(corpus,terminal,core.protectedCodesFromBatches([active]),25);
  assert.equal(selected.length,25);
  assert.equal(selected.some(x=>x.code==='MLS-V10-0001'),false);
  assert.equal(selected.some(x=>x.code===corpus[1].code),false);
});

test('Farm preserved Pilot 20 entries are discoverable without Cloudflare',()=>{
  const preserved=core.preservedPilotCodes('.');
  assert.equal(preserved.length,20);
  assert.ok(preserved.includes('MLS-V10-0020'));
});

test('Farm workflows use GitHub Issues, per-batch concurrency and scheduled 15-minute reaping',()=>{
  const scheduler=fs.readFileSync('.github/workflows/MLS Farm Scheduler.yml','utf8');
  const worker=fs.readFileSync('.github/workflows/MLS Farm Worker Events.yml','utf8');
  assert.match(scheduler,/issues:\s*\n\s*types:/);
  assert.match(scheduler,/cron: '\*\/15 \* \* \* \*'/);
  assert.match(scheduler,/group: mls-farm-scheduler/);
  assert.match(worker,/issue_comment:/);
  assert.match(worker,/group: mls-farm-batch-\$\{\{ github\.event\.issue\.number \}\}/);
  for(const source of [scheduler,worker,fs.readFileSync('scripts/MLS farm scheduler.cjs','utf8'),fs.readFileSync('scripts/MLS farm worker.cjs','utf8')]){
    assert.doesNotMatch(source,/WIKI_DB|D1|cloudflare|workers\.dev/i);
  }
});
