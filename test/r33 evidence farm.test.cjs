const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const core=require('../MLS R32 EDITORIAL/evidence farm core.js');

function resultFor(state,code,overrides={}){
  const assignment=state.entries.find(x=>x.code===code);
  return {
    code,
    articleGeneratedAt:'2026-09-23T10:00:00.000Z',
    articleHash:'a'.repeat(64),
    evidenceStatus:'VERIFIED',
    evidenceRevision:2,
    evidenceArtifactPath:core.evidenceEntryPath(assignment),
    evidenceCommitSha:'b'.repeat(40),
    evidenceArtifactHash:'c'.repeat(64),
    reviewedHuman:false,
    ...overrides
  };
}
test('Evidence Farm R2 is GitHub-native and Gate 500 remains blocked',()=>{
  const pool=core.loadPool('.');
  assert.equal(pool.poolId,'MLS-R33-CORRECTION-REPEAT-100');
  assert.equal(pool.editorialArchitecture,'github-native');
  assert.equal(pool.sourceOfTruth,'github');
  assert.equal(pool.cloudflareEditorialAllowed,false);
  assert.equal(pool.d1EditorialAllowed,false);
  assert.equal(pool.gate500Authorized,false);
  assert.equal(pool.entries.length,100);
});
test('Correction Repeat pool remains fresh versus Pilot 20 and Gate 100',()=>{
  const pool=core.loadPool('.'),pilot=JSON.parse(fs.readFileSync('docs/evidence y provenance/04 Pilot 20 Manifest.json','utf8')),gate=JSON.parse(fs.readFileSync('docs/evidence y provenance/13 Gate 100 Manifest.json','utf8'));
  const prior=new Set([...(pilot.entries||[]).map(x=>x.code),...(gate.entries||[]).map(x=>x.code)]);
  assert.equal(pool.entries.some(x=>prior.has(x.code)),false);
});
test('claim defaults to 25 and caps at 50',()=>{
  assert.equal(core.parseCommand(JSON.stringify({operation:'claim',requestId:'request-12345678',workerId:'worker-12345678'})).requested,25);
  assert.equal(core.parseCommand(JSON.stringify({operation:'claim',requested:50,requestId:'request-12345678',workerId:'worker-12345678'})).requested,50);
  assert.throws(()=>core.parseCommand(JSON.stringify({operation:'claim',requested:51,requestId:'request-12345678',workerId:'worker-12345678'})),/1 y 50/);
});
test('lease ACK switches to rolling hour',()=>{
  const pool=core.loadPool('.'),state=core.makeBatchState({issueNumber:900,requestId:'request-12345678',workerId:'worker-12345678',pool,entries:[pool.entries[0]],now:'2026-09-23T10:00:00.000Z',token:'abc'});
  const next=core.applyWorkerEvent(state,{operation:'heartbeat',batchId:state.batchId,leaseToken:'abc'},{createdAt:'2026-09-23T10:02:00.000Z',commentId:1});
  assert.equal(next.expiresAt,'2026-09-23T11:02:00.000Z');
});
test('active leases never overlap',()=>{
  const pool=core.loadPool('.'),ledger=core.initialLedger(pool),terminal=core.terminalCodesFromLedger(ledger,pool),first=core.selectNextEntries(pool,terminal,new Set(),25);
  const batch=core.makeBatchState({issueNumber:901,requestId:'request-12345678',workerId:'worker-12345678',pool,entries:first,now:new Date().toISOString(),token:'abc'});
  const second=core.selectNextEntries(pool,terminal,core.protectedCodesFromBatches([batch]),25);
  assert.equal(first.some(a=>second.some(b=>a.code===b.code)),false);
});
test('verified checkpoint requires exact Git Evidence artifact contract',()=>{
  const pool=core.loadPool('.'),state=core.makeBatchState({issueNumber:904,requestId:'request-12345678',workerId:'worker-12345678',pool,entries:[pool.entries[0],pool.entries[1]],now:'2026-09-23T10:00:00.000Z',token:'abc'}),code=pool.entries[0].code;
  const ev={operation:'checkpoint',batchId:state.batchId,leaseToken:'abc',entries:[{code,leaseEpoch:904,status:'verified',result:resultFor(state,code)}]};
  const once=core.applyWorkerEvent(state,ev,{createdAt:'2026-09-23T10:02:00.000Z',commentId:2}),twice=core.applyWorkerEvent(once,ev,{createdAt:'2026-09-23T10:03:00.000Z',commentId:3});
  assert.equal(Object.keys(twice.results).length,1);
  assert.throws(()=>core.validateResultShape(resultFor(state,code,{evidenceArtifactPath:'wrong/path.json'}),code,'verified',state),e=>e.code==='EVIDENCE_ARTIFACT_PATH_MISMATCH');
  assert.throws(()=>core.validateResultShape(resultFor(state,code,{bridgeResultPath:'legacy.json'}),code,'verified',state),e=>e.code==='BRIDGE_RESULT_FORBIDDEN');
});
test('conflicting retries are rejected',()=>{
  const pool=core.loadPool('.'),state=core.makeBatchState({issueNumber:905,requestId:'request-12345678',workerId:'worker-12345678',pool,entries:[pool.entries[0],pool.entries[1]],now:'2026-09-23T10:00:00.000Z',token:'abc'}),code=pool.entries[0].code;
  const a=core.applyWorkerEvent(state,{operation:'checkpoint',batchId:state.batchId,leaseToken:'abc',entries:[{code,leaseEpoch:905,status:'verified',result:resultFor(state,code)}]},{createdAt:'2026-09-23T10:02:00.000Z',commentId:4});
  assert.throws(()=>core.applyWorkerEvent(a,{operation:'checkpoint',batchId:state.batchId,leaseToken:'abc',entries:[{code,leaseEpoch:905,status:'verified',result:resultFor(state,code,{evidenceRevision:3})}]},{createdAt:'2026-09-23T10:03:00.000Z',commentId:5}),e=>e.code==='RESULT_HASH_CONFLICT');
});
test('Farm never fabricates human REVIEWED',()=>{
  const pool=core.loadPool('.'),state=core.makeBatchState({issueNumber:906,requestId:'request-12345678',workerId:'worker-12345678',pool,entries:[pool.entries[0]],now:'2026-09-23T10:00:00.000Z',token:'abc'}),code=pool.entries[0].code;
  assert.throws(()=>core.validateResultShape(resultFor(state,code,{evidenceStatus:'REVIEWED'}),code,'verified',state),e=>e.code==='NOT_VERIFIED');
  assert.throws(()=>core.validateResultShape(resultFor(state,code,{reviewedHuman:true}),code,'verified',state),e=>e.code==='FALSE_HUMAN_REVIEW');
});
test('cancel preserves accepted checkpoints',()=>{
  const pool=core.loadPool('.'),state=core.makeBatchState({issueNumber:907,requestId:'request-12345678',workerId:'worker-12345678',pool,entries:[pool.entries[0],pool.entries[1]],now:'2026-09-23T10:00:00.000Z',token:'abc'}),code=pool.entries[0].code;
  const partial=core.applyWorkerEvent(state,{operation:'checkpoint',batchId:state.batchId,leaseToken:'abc',entries:[{code,leaseEpoch:907,status:'verified',result:resultFor(state,code)}]},{createdAt:'2026-09-23T10:02:00.000Z',commentId:6});
  const cancelled=core.applyWorkerEvent(partial,{operation:'cancel',batchId:state.batchId,leaseToken:'abc'},{createdAt:'2026-09-23T10:03:00.000Z',commentId:7});
  assert.equal(Object.keys(cancelled.results).length,1);assert.equal(cancelled.cancelRequested,true);
});
test('R33 editorial control plane has no D1, runtime API or Bridge dependency',()=>{
  const files=['scripts/R33 evidence farm scheduler.cjs','scripts/R33 evidence farm worker.cjs','MLS R32 EDITORIAL/evidence farm core.js','MLS R32 EDITORIAL/evidence git.js','.github/workflows/R33 Evidence Farm Scheduler.yml','.github/workflows/R33 Evidence Farm Worker Events.yml'];
  for(const file of files){const source=fs.readFileSync(file,'utf8');assert.doesNotMatch(source,/WIKI_DB|workers\.dev|wrangler|mls chat bridge|\/api\/wiki\/editorial\/evidence/i,file);}
  const protocol=fs.readFileSync('MLS R32 EDITORIAL/R33 Evidence Farm Protocol R2.md','utf8');assert.match(protocol,/GitHub es la única fuente de verdad editorial/i);assert.match(protocol,/No autoriza Gate 500/i);assert.match(protocol,/bridgeResultPath.*prohibido/i);
});
test('explicit cancel wins over timeout expiry',()=>{
  const pool=core.loadPool('.'),state=core.makeBatchState({issueNumber:908,requestId:'request-12345678',workerId:'worker-12345678',pool,entries:[pool.entries[0]],now:'2026-09-23T10:00:00.000Z',token:'abc'});
  const acknowledged=core.applyWorkerEvent(state,{operation:'heartbeat',batchId:state.batchId,leaseToken:'abc'},{createdAt:'2026-09-23T10:01:00.000Z',commentId:8});
  const cancelled=core.applyWorkerEvent(acknowledged,{operation:'cancel',batchId:state.batchId,leaseToken:'abc'},{createdAt:'2026-09-23T10:02:00.000Z',commentId:9});
  assert.equal(core.releaseReasonForBatch(cancelled,true),'WORKER_CANCELLED');
});
