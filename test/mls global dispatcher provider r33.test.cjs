'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const provider=require('../MLS R32 EDITORIAL/global dispatcher/providers/r33.js');

const NOW=Date.parse('2026-09-24T04:20:00.000Z');
function pool(){
  return {
    poolId:'MLS-R33-GITHUB-NATIVE-BENCHMARK-100',manifestVersion:'1.0',status:'authorized',active:true,
    sourceOfTruth:'github',cloudflareEditorialAllowed:false,d1EditorialAllowed:false,gate500Authorized:false,
    execution:{defaultClaimSize:2,maxClaimSize:50},
    entries:[
      {order:1,code:'MLS-V01-0001',language:'ingles',contentPath:'content/ingles/MLS-V01-0001.json'},
      {order:2,code:'MLS-V01-0002',language:'ingles',contentPath:'content/ingles/MLS-V01-0002.json'},
      {order:3,code:'MLS-V01-0003',language:'ingles',contentPath:'content/ingles/MLS-V01-0003.json'},
      {order:4,code:'MLS-V01-0004',language:'ingles',contentPath:'content/ingles/MLS-V01-0004.json'}
    ]
  };
}
function ledger(extra={}){return {poolId:'MLS-R33-GITHUB-NATIVE-BENCHMARK-100',manifestVersion:'1.0',verified:[],exceptions:[],...extra};}
function activeBatch(code,id='R33-EVIDENCE-FARM-000001'){
  return {poolId:'MLS-R33-GITHUB-NATIVE-BENCHMARK-100',batchId:id,status:'leased',acknowledgedAt:'2026-09-24T04:19:00.000Z',expiresAt:'2026-09-24T04:29:00.000Z',entries:[{code}]};
}

test('expone FIFO elegible y deja ownership exclusivamente al Global Dispatcher',()=>{
  const out=provider.materializeCandidate({pool:pool(),ledger:ledger({verified:['MLS-V01-0001']}),batches:[activeBatch('MLS-V01-0002')]},{now:NOW});
  assert.equal(out.provider,'r33-farm');
  assert.equal(out.eligible,true);
  assert.deepEqual(out.units.map(x=>x.code),['MLS-V01-0003','MLS-V01-0004']);
  assert.deepEqual(out.ownership,{mode:'global-single-owner',nestedLease:false,reservationCreated:false});
  assert.equal(out.checkpointSizeMax,10);
  assert.equal(out.cloudflareEditorialInteractions,0);
  assert.equal(out.d1EditorialReads,0);
  assert.equal(out.d1EditorialWrites,0);
  assert.ok(out.resourceLocks.includes('entry:MLS-V01-0003'));
  assert.ok(out.allowedPaths.includes('MLS R32 EDITORIAL/evidence git/entries/ingles/MLS-V01-0003.json'));
});

test('un batch expirado no protege códigos y el adaptador no crea lease anidado',()=>{
  const expired={...activeBatch('MLS-V01-0001'),expiresAt:'2026-09-24T04:19:59.000Z'};
  const out=provider.materializeCandidate({pool:pool(),ledger:ledger(),batches:[expired]},{now:NOW,requested:1});
  assert.deepEqual(out.units.map(x=>x.code),['MLS-V01-0001']);
  assert.equal(out.ownership.nestedLease,false);
  assert.equal(out.ownership.reservationCreated,false);
});

test('respeta ACK deadline antes del primer heartbeat',()=>{
  const batch={poolId:'MLS-R33-GITHUB-NATIVE-BENCHMARK-100',batchId:'R33-EVIDENCE-FARM-000002',status:'leased',acknowledgedAt:null,ackDeadlineAt:'2026-09-24T04:21:00.000Z',expiresAt:'2026-09-24T04:21:00.000Z',entries:[{code:'MLS-V01-0001'}]};
  const out=provider.materializeCandidate({pool:pool(),ledger:ledger(),batches:[batch]},{now:NOW,requested:1});
  assert.deepEqual(out.units.map(x=>x.code),['MLS-V01-0002']);
});

test('falla cerrado ante doble ownership especializado activo',()=>{
  assert.throws(()=>provider.materializeCandidate({pool:pool(),ledger:ledger(),batches:[activeBatch('MLS-V01-0002','A'),activeBatch('MLS-V01-0002','B')]},{now:NOW}),error=>error.code==='DOUBLE_OWNERSHIP_DETECTED');
});

test('falla cerrado ante ledger contradictorio o pool no autorizado',()=>{
  assert.throws(()=>provider.materializeCandidate({pool:pool(),ledger:ledger({verified:['MLS-V01-0001'],exceptions:['MLS-V01-0001']}),batches:[]},{now:NOW}),error=>error.code==='LEDGER_TERMINAL_CONFLICT');
  const blocked={...pool(),active:false};
  assert.throws(()=>provider.materializeCandidate({pool:blocked,ledger:ledger(),batches:[]},{now:NOW}),error=>error.code==='POOL_NOT_AUTHORIZED');
});

test('no materializa trabajo cuando todo es terminal o protegido',()=>{
  const out=provider.materializeCandidate({pool:pool(),ledger:ledger({verified:['MLS-V01-0001','MLS-V01-0002','MLS-V01-0003'],exceptions:[]}),batches:[activeBatch('MLS-V01-0004')]},{now:NOW});
  assert.equal(out.eligible,false);
  assert.equal(out.reason,'NO_WORK');
  assert.deepEqual(out.units,[]);
  assert.deepEqual(out.resourceLocks,[]);
});
