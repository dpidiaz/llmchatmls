const test=require('node:test');
const assert=require('node:assert/strict');
const {mlsPreflightAssess,mlsPreflightWorst}=require('../MLS R32 EDITORIAL/preflight.js');

test('preflight: normal and rescue readiness stay independent',()=>{
  const x=mlsPreflightAssess({queue:{pending:12},editorial:{deferredPending:0,activeRuns:0,pendingReservations:0},cloudflare:{available:true,remainingNeurons:9000,estimatedArticleNeurons:150},autoopt:{status:'estable'},semantic:{reviewRequired:0}});
  assert.equal(x.normalBatch.status,'ready');
  assert.equal(x.normalBatch.canStart,true);
  assert.equal(x.rescueBatch.status,'blocked');
  assert.equal(x.rescueBatch.canStart,false);
  assert.notEqual(x.overall.status,'blocked');
});

test('preflight: concurrent Farm activity is watch, not blocker',()=>{
  const x=mlsPreflightAssess({queue:{pending:30},editorial:{deferredPending:2,activeRuns:3,pendingReservations:25},cloudflare:{available:true,remainingNeurons:9000,estimatedArticleNeurons:150},autoopt:{status:'estable'},semantic:{reviewRequired:0}});
  assert.equal(x.editorialChat.status,'watch');
  assert.equal(x.normalBatch.canStart,true);
  assert.equal(x.rescueBatch.canStart,true);
  assert.match(x.editorialChat.reasons.join(' '),/Farm permite concurrencia/i);
});

test('preflight: AUTOOPT and semantic warnings never silently block a batch',()=>{
  const x=mlsPreflightAssess({queue:{pending:5},editorial:{deferredPending:1,activeRuns:0,pendingReservations:0},cloudflare:{available:true,remainingNeurons:9000,estimatedArticleNeurons:150},autoopt:{status:'vigilar'},semantic:{reviewRequired:2}});
  assert.equal(x.editorialChat.status,'watch');
  assert.equal(x.normalBatch.canStart,true);
  assert.equal(x.rescueBatch.canStart,true);
  assert.match(x.editorialChat.reasons.join(' '),/AUTOOPT/i);
  assert.match(x.editorialChat.reasons.join(' '),/revisión requerida/i);
});

test('preflight: Cloudflare quota is isolated from ChatGPT editorial batches',()=>{
  const x=mlsPreflightAssess({queue:{pending:9},editorial:{deferredPending:0,activeRuns:0,pendingReservations:0},cloudflare:{available:true,quotaExhausted:true,circuitOpen:true,remainingNeurons:0,estimatedArticleNeurons:150},autoopt:{status:'estable'},semantic:{reviewRequired:0}});
  assert.equal(x.cloudflareGeneration.status,'blocked');
  assert.equal(x.normalBatch.canStart,true);
  assert.match(x.note,/no bloquea los lotes editoriales/i);
});

test('preflight: no available normal or deferred work blocks overall',()=>{
  const x=mlsPreflightAssess({queue:{pending:0},editorial:{deferredPending:0,activeRuns:0,pendingReservations:0},cloudflare:{available:true},autoopt:{status:'estable'},semantic:{reviewRequired:0}});
  assert.equal(x.overall.status,'blocked');
  assert.equal(x.normalBatch.canStart,false);
  assert.equal(x.rescueBatch.canStart,false);
});

test('preflight: status ordering is deterministic',()=>{
  assert.equal(mlsPreflightWorst([{status:'ready'},{status:'watch'}]),'watch');
  assert.equal(mlsPreflightWorst([{status:'watch'},{status:'blocked'}]),'blocked');
  assert.equal(mlsPreflightWorst([{status:'ready'}]),'ready');
});

test('preflight module exports diagnostics only',()=>{
  const names=Object.keys(require('../MLS R32 EDITORIAL/preflight.js')).join(' ');
  assert.equal(/start|publish|delete|retry|rescue/i.test(names),false);
});