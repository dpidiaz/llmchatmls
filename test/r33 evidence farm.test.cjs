const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const core=require('../MLS R32 EDITORIAL/evidence farm core.js');

function resultFor(state,code,overrides={}){
  return {
    code,
    articleGeneratedAt:'2026-09-23T10:00:00.000Z',
    articleHash:'a'.repeat(64),
    evidenceStatus:'VERIFIED',
    evidenceRevision:1,
    bridgeResultPath:core.bridgeResultPrefix(state)+'verify.json',
    reviewedHuman:false,
    ...overrides
  };
}

test('Evidence Farm pool is authorized Correction Repeat 100 and does not authorize Gate 500',()=>{
  const pool=core.loadPool('.');
  assert.equal(pool.poolId,'MLS-R33-CORRECTION-REPEAT-100');
  assert.equal(pool.active,true);
  assert.equal(pool.status,'authorized');
  assert.equal(pool.entries.length,100);
  assert.equal(pool.gate500Authorized,false);
  assert.equal(new Set(pool.entries.map(x=>x.code)).size,100);
});

test('Correction Repeat pool is fresh versus Pilot 20 and Gate 100',()=>{
  const pool=core.loadPool('.');
  const pilot=JSON.parse(fs.readFileSync('docs/evidence y provenance/04 Pilot 20 Manifest.json','utf8'));
  const gate=JSON.parse(fs.readFileSync('docs/evidence y provenance/13 Gate 100 Manifest.json','utf8'));
  const prior=new Set([...(pilot.entries||[]).map(x=>x.code),...(gate.entries||[]).map(x=>x.code)]);
  assert.equal(pool.entries.some(x=>prior.has(x.code)),false);
  const byLanguage=new Map();
  for(const entry of pool.entries)byLanguage.set(entry.language,(byLanguage.get(entry.language)||0)+1);
  assert.equal(byLanguage.size,10);
  for(const count of byLanguage.values())assert.equal(count,10);
});

test('Evidence Farm claim defaults to 25 and caps at 50',()=>{
  assert.deepEqual(core.parseCommand(JSON.stringify({operation:'claim',requestId:'request-12345678',workerId:'worker-12345678'})),{
    operation:'claim',requested:25,requestId:'request-12345678',workerId:'worker-12345678'
  });
  assert.equal(core.parseCommand(JSON.stringify({operation:'claim',requested:50,requestId:'request-12345678',workerId:'worker-12345678'})).requested,50);
  assert.throws(()=>core.parseCommand(JSON.stringify({operation:'claim',requested:51,requestId:'request-12345678',workerId:'worker-12345678'})),/1 y 50/);
});

test('Evidence Farm lease ACK switches from five-minute deadline to rolling hour',()=>{
  const pool=core.loadPool('.');
  const state=core.makeBatchState({issueNumber:900,requestId:'request-12345678',workerId:'worker-12345678',pool,entries:[pool.entries[0]],now:'2026-09-23T10:00:00.000Z',token:'abc'});
  assert.equal(state.expiresAt,'2026-09-23T10:05:00.000Z');
  const next=core.applyWorkerEvent(state,{operation:'heartbeat',batchId:state.batchId,leaseToken:'abc'},{createdAt:'2026-09-23T10:02:00.000Z',commentId:1});
  assert.equal(next.acknowledgedAt,'2026-09-23T10:02:00.000Z');
  assert.equal(next.expiresAt,'2026-09-23T11:02:00.000Z');
});

test('Multiple claims cannot overlap active leases',()=>{
  const pool=core.loadPool('.');
  const ledger=core.initialLedger(pool);
  const terminal=core.terminalCodesFromLedger(ledger,pool);
  const first=core.selectNextEntries(pool,terminal,new Set(),25);
  const batch=core.makeBatchState({issueNumber:901,requestId:'request-12345678',workerId:'worker-12345678',pool,entries:first,now:new Date().toISOString(),token:'abc'});
  const second=core.selectNextEntries(pool,terminal,core.protectedCodesFromBatches([batch]),25);
  assert.equal(first.length,25);
  assert.equal(second.length,25);
  assert.equal(first.some(a=>second.some(b=>a.code===b.code)),false);
});

test('Bridge paths are namespaced by pool, batch and worker',()=>{
  const pool=core.loadPool('.');
  const a=core.makeBatchState({issueNumber:902,requestId:'request-12345678',workerId:'chat-A-12345678',pool,entries:[pool.entries[0]],now:'2026-09-23T10:00:00.000Z',token:'abc'});
  const b=core.makeBatchState({issueNumber:903,requestId:'request-87654321',workerId:'chat-B-87654321',pool,entries:[pool.entries[1]],now:'2026-09-23T10:00:00.000Z',token:'def'});
  const pa=core.bridgeCommandPath(a,'proposal-1'),pb=core.bridgeCommandPath(b,'proposal-1');
  assert.notEqual(pa,pb);
  assert.match(pa,/mls chat bridge\/commands\/r33-farm\/MLS-R33-CORRECTION-REPEAT-100\/R33-EVIDENCE-FARM-000902\/chat-A-12345678\/proposal-1\.json/);
});

test('Verified checkpoint is idempotent and requires matching Bridge namespace',()=>{
  const pool=core.loadPool('.');
  const state=core.makeBatchState({issueNumber:904,requestId:'request-12345678',workerId:'worker-12345678',pool,entries:[pool.entries[0],pool.entries[1]],now:'2026-09-23T10:00:00.000Z',token:'abc'});
  const code=pool.entries[0].code;
  const ev={operation:'checkpoint',batchId:state.batchId,leaseToken:'abc',entries:[{code,leaseEpoch:904,status:'verified',result:resultFor(state,code)}]};
  const once=core.applyWorkerEvent(state,ev,{createdAt:'2026-09-23T10:02:00.000Z',commentId:2});
  const twice=core.applyWorkerEvent(once,ev,{createdAt:'2026-09-23T10:03:00.000Z',commentId:3});
  assert.equal(Object.keys(twice.results).length,1);
  assert.deepEqual(core.pendingCodes(twice),[pool.entries[1].code]);
  assert.throws(()=>core.validateResultShape(resultFor(state,code,{bridgeResultPath:'mls chat bridge/results/command 9999.json'}),code,'verified',state),e=>e.code==='BRIDGE_NAMESPACE_MISMATCH');
});

test('Conflicting retry for same Evidence code is rejected',()=>{
  const pool=core.loadPool('.');
  const state=core.makeBatchState({issueNumber:905,requestId:'request-12345678',workerId:'worker-12345678',pool,entries:[pool.entries[0],pool.entries[1]],now:'2026-09-23T10:00:00.000Z',token:'abc'});
  const code=pool.entries[0].code;
  const a=core.applyWorkerEvent(state,{operation:'checkpoint',batchId:state.batchId,leaseToken:'abc',entries:[{code,leaseEpoch:905,status:'verified',result:resultFor(state,code)}]},{createdAt:'2026-09-23T10:02:00.000Z',commentId:4});
  assert.throws(()=>core.applyWorkerEvent(a,{operation:'checkpoint',batchId:state.batchId,leaseToken:'abc',entries:[{code,leaseEpoch:905,status:'verified',result:resultFor(state,code,{evidenceRevision:2})}]},{createdAt:'2026-09-23T10:03:00.000Z',commentId:5}),e=>e.code==='RESULT_HASH_CONFLICT');
});

test('Evidence Farm never accepts fabricated human REVIEWED state',()=>{
  const pool=core.loadPool('.');
  const state=core.makeBatchState({issueNumber:906,requestId:'request-12345678',workerId:'worker-12345678',pool,entries:[pool.entries[0]],now:'2026-09-23T10:00:00.000Z',token:'abc'});
  const code=pool.entries[0].code;
  assert.throws(()=>core.validateResultShape(resultFor(state,code,{evidenceStatus:'REVIEWED'}),code,'verified',state),e=>e.code==='NOT_VERIFIED');
  assert.throws(()=>core.validateResultShape(resultFor(state,code,{reviewedHuman:true}),code,'verified',state),e=>e.code==='FALSE_HUMAN_REVIEW');
});

test('Cancel preserves received results and leaves unfinished codes releasable',()=>{
  const pool=core.loadPool('.');
  const state=core.makeBatchState({issueNumber:907,requestId:'request-12345678',workerId:'worker-12345678',pool,entries:[pool.entries[0],pool.entries[1]],now:'2026-09-23T10:00:00.000Z',token:'abc'});
  const code=pool.entries[0].code;
  const partial=core.applyWorkerEvent(state,{operation:'checkpoint',batchId:state.batchId,leaseToken:'abc',entries:[{code,leaseEpoch:907,status:'verified',result:resultFor(state,code)}]},{createdAt:'2026-09-23T10:02:00.000Z',commentId:6});
  const cancelled=core.applyWorkerEvent(partial,{operation:'cancel',batchId:state.batchId,leaseToken:'abc'},{createdAt:'2026-09-23T10:03:00.000Z',commentId:7});
  assert.equal(cancelled.cancelRequested,true);
  assert.deepEqual(core.pendingCodes(cancelled),[pool.entries[1].code]);
  assert.equal(Object.keys(cancelled.results).length,1);
});

test('Evidence Farm control plane stays GitHub-only and Bridge workflow retries concurrent saves',()=>{
  const scheduler=fs.readFileSync('scripts/R33 evidence farm scheduler.cjs','utf8');
  const worker=fs.readFileSync('scripts/R33 evidence farm worker.cjs','utf8');
  const sy=fs.readFileSync('.github/workflows/R33 Evidence Farm Scheduler.yml','utf8');
  const wy=fs.readFileSync('.github/workflows/R33 Evidence Farm Worker Events.yml','utf8');
  for(const source of [scheduler,worker,sy,wy])assert.doesNotMatch(source,/WIKI_DB|workers\.dev|cloudflare/i);
  assert.match(sy,/cron: '\*\/5 \* \* \* \*'/);
  assert.match(wy,/r33-evidence-farm-batch-/);
  const bridge=fs.readFileSync('.github/workflows/MLS chat bridge.yml','utf8');
  assert.match(bridge,/for attempt in 1 2 3 4/);
  assert.match(bridge,/commands\/\*\*\/\*\.json/);
});

test('Protocol keeps Gate 500 blocked and requires namespaced Bridge paths',()=>{
  const protocol=fs.readFileSync('MLS R32 EDITORIAL/R33 Evidence Farm Protocol R1.md','utf8');
  assert.match(protocol,/No autoriza Gate 500/i);
  assert.match(protocol,/r33-farm\/<poolId>\/<batchId>\/<workerId>/);
  assert.match(protocol,/R33 siguientes N/);
});


test('Explicit worker cancel wins over timeout-style expiry when reaped',()=>{
  const pool=core.loadPool('.');
  const state=core.makeBatchState({issueNumber:908,requestId:'request-12345678',workerId:'worker-12345678',pool,entries:[pool.entries[0]],now:'2026-09-23T10:00:00.000Z',token:'abc'});
  const acknowledged=core.applyWorkerEvent(state,{operation:'heartbeat',batchId:state.batchId,leaseToken:'abc'},{createdAt:'2026-09-23T10:01:00.000Z',commentId:8});
  const cancelled=core.applyWorkerEvent(acknowledged,{operation:'cancel',batchId:state.batchId,leaseToken:'abc'},{createdAt:'2026-09-23T10:02:00.000Z',commentId:9});
  assert.equal(core.isLeaseExpired(cancelled,Date.parse('2026-09-23T10:02:01.000Z')),true);
  assert.equal(core.releaseReasonForBatch(cancelled,true),'WORKER_CANCELLED');
});
