'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const farm=require('../MLS R32 EDITORIAL/farm core.js');
const globalCore=require('../MLS R32 EDITORIAL/global dispatcher/core.js');
const mlsProvider=require('../MLS R32 EDITORIAL/global dispatcher/providers/mls farm.js');
const r33Provider=require('../MLS R32 EDITORIAL/global dispatcher/providers/r33.js');
const integration=require('../MLS R32 EDITORIAL/global dispatcher/providers/integration.js');

const NOW=Date.parse('2026-09-24T04:40:00.000Z');
function mlsEntry(n){
  const code='MLS-V10-'+String(n).padStart(4,'0');
  return {code,language:'espanol-guatemala',languageName:'Español de Guatemala',n,path:'content/espanol-guatemala/'+code+'.json'};
}
function mlsLedger(){
  const lang=farm.LANGUAGE_ORDER.find(x=>x.prefix==='V10');
  return farm.initialLedger(lang,[]);
}
function activeGlobal(provider,assignmentId,codes){
  return {assignmentId,provider,status:'leased',readyToClose:false,cancelRequested:false,acknowledgedAt:'2026-09-24T04:39:00.000Z',ackDeadlineAt:'2026-09-24T04:44:00.000Z',expiresAt:'2026-09-24T04:49:00.000Z',resourceLocks:codes.map(code=>'entry:'+code)};
}
function r33Pool(){
  return {poolId:'MLS-R33-GITHUB-NATIVE-BENCHMARK-100',manifestVersion:'1.0',status:'authorized',active:true,sourceOfTruth:'github',cloudflareEditorialAllowed:false,d1EditorialAllowed:false,gate500Authorized:false,execution:{defaultClaimSize:1,maxClaimSize:50},entries:[
    {order:1,code:'MLS-V01-0001',language:'ingles',contentPath:'content/ingles/MLS-V01-0001.json'},
    {order:2,code:'MLS-V01-0002',language:'ingles',contentPath:'content/ingles/MLS-V01-0002.json'},
    {order:3,code:'MLS-V01-0003',language:'ingles',contentPath:'content/ingles/MLS-V01-0003.json'}
  ]};
}

test('MLS provider projects Global terminal + active ownership and advances FIFO without nested lease',()=>{
  const corpus=[mlsEntry(1),mlsEntry(2),mlsEntry(3)];
  const globalLedger={terminal:{done:{provider:'mls-farm',completedUnits:[corpus[0].code]}},recoveries:{}};
  const snapshot=integration.projectMlsSnapshot({corpus,ledgers:[mlsLedger()],batches:[]},{globalLedger,globalAssignments:[activeGlobal('mls-farm','MLS-GLOBAL-1',[corpus[1].code])]});
  const work=mlsProvider.materializeFarmWork({...snapshot,requested:1,at:NOW});
  assert.deepEqual(work.units,[corpus[2].code]);
  assert.equal(work.ownershipMode,'global-single-lease');
  assert.equal(snapshot.batches.at(-1).batchId,'GLOBAL-MLS-GLOBAL-1');
});

test('R33 provider projects Global terminal + active ownership and keeps Gate 500 authorization metadata untouched',()=>{
  const pool=r33Pool(),ledger={poolId:pool.poolId,manifestVersion:'1.0',verified:[],exceptions:[]};
  const globalLedger={terminal:{done:{provider:'r33-farm',completedUnits:['MLS-V01-0001']}},recoveries:{}};
  const snapshot=integration.projectR33Snapshot({pool,ledger,batches:[]},{globalLedger,globalAssignments:[activeGlobal('r33-farm','MLS-GLOBAL-2',['MLS-V01-0002'])]});
  const candidate=r33Provider.materializeCandidate(snapshot,{now:NOW,requested:1});
  assert.deepEqual(candidate.units.map(x=>x.code),['MLS-V01-0003']);
  assert.equal(candidate.ownership.nestedLease,false);
  assert.equal(candidate.gate500Authorized,false);
  const work=integration.r33CandidateToWork(candidate,NOW);
  assert.equal(globalCore.normalizeWorkItem(work).provider,'r33-farm');
});

test('dynamic recoveries are rehydrated while authorized Gate 500 activation stays ready',()=>{
  const base=globalCore.loadRegistry('.');
  const gateBefore=base.items.find(x=>x.workId==='gate500');
  assert.equal(gateBefore.status,'ready');
  assert.equal(gateBefore.authorization?.authorized,true);
  const recoveryItem={workId:'mls-farm:MLS-V10-0001:MLS-V10-0001:1',version:1,title:'recover',workType:'editorial_batch',status:'ready',priority:30,createdAt:'2026-09-24T04:00:00.000Z',provider:'mls-farm',resourceLocks:['entry:MLS-V10-0001'],allowedPaths:['content/espanol-guatemala/MLS-V10-0001.json'],dependsOn:[],validation:[],instructions:'recover',completion:{requiresCommit:true,requiresValidation:false}};
  const globalLedger={recoveries:{[recoveryItem.workId]:{workItem:recoveryItem}},terminal:{}};
  const registry=integration.extendRegistry(base,{items:[],globalLedger});
  assert.ok(registry.items.some(x=>x.workId===recoveryItem.workId));
  assert.equal(registry.items.find(x=>x.workId==='gate500').status,'ready');
  assert.equal(base.items.find(x=>x.workId==='gate500').status,'ready','base registry must not be mutated');
});

test('R33 index integration waits for a full wave and materializes exact source refs',()=>{
  const pool=r33Pool();
  const partialLedger={terminal:{
    a:{provider:'r33-farm',completedUnits:['MLS-V01-0001'],branch:'worker/r33/1',commitSha:'1'.repeat(40),completedAt:'2026-09-24T05:00:00.000Z'}
  }};
  assert.equal(integration.r33IndexIntegrationWork({pool,globalLedger:partialLedger,waveSize:2,verifiedCodes:[]}),null);

  const fullLedger={terminal:{
    a:{provider:'r33-farm',completedUnits:['MLS-V01-0001'],branch:'worker/r33/1',commitSha:'1'.repeat(40),completedAt:'2026-09-24T05:00:00.000Z'},
    b:{provider:'r33-farm',completedUnits:['MLS-V01-0002'],branch:'worker/r33/2',commitSha:'2'.repeat(40),completedAt:'2026-09-24T05:01:00.000Z'}
  }};
  const work=integration.r33IndexIntegrationWork({pool,globalLedger:fullLedger,waveSize:2,verifiedCodes:[]});
  assert.equal(work.provider,'r33-index-integration');
  assert.equal(work.workType,'integration');
  assert.deepEqual(work.units,['MLS-V01-0001','MLS-V01-0002']);
  assert.equal(work.sourceRefs.length,2);
  assert.ok(work.resourceLocks.includes('system:r33-index-integration'));
  assert.ok(work.resourceLocks.includes('system:main-integration'));
  assert.ok(work.allowedPaths.includes('MLS R32 EDITORIAL/evidence git/indexes/verified.json'));
  assert.equal(work.integration.mode,'assignment-pr');
});

test('completed units survive multiple checkpoints and recovery generations',()=>{
  const state={
    recoveredCompletedUnits:['MLS-V01-0001'],
    checkpoints:[
      {completedUnits:['MLS-V01-0002','MLS-V01-0003']},
      {completedUnits:['MLS-V01-0003','MLS-V01-0004']}
    ]
  };
  assert.deepEqual(integration.completedUnitsForState(state),['MLS-V01-0001','MLS-V01-0002','MLS-V01-0003','MLS-V01-0004']);
});

test('R33 provider bootstraps from a synthetic empty ledger while MLS Farm still fails closed without ledgers',()=>{
  const result=integration.materializeProviderItems({issues:[],root:'.',now:NOW,globalLedger:{terminal:{},recoveries:{}},globalAssignments:[]});
  assert.ok(result.items.some(x=>x.provider==='r33-farm'));
  assert.ok(result.diagnostics.some(x=>x.provider==='mls-farm'));
  assert.equal(result.diagnostics.some(x=>x.provider==='r33-farm'),false);
  const snapshot=integration.collectR33Snapshot([],'.');
  assert.equal(snapshot.ledgerSynthetic,true);
  assert.equal(snapshot.ledger.poolId,snapshot.pool.poolId);
  assert.deepEqual(snapshot.ledger.verified,[]);
});

test('scheduler integrates providers through snapshots only and never issues nested Farm commands',()=>{
  const scheduler=fs.readFileSync('scripts/MLS global dispatcher scheduler.cjs','utf8');
  assert.match(scheduler,/providers\/integration\.js/);
  assert.match(scheduler,/materializeProviderItems/);
  assert.match(scheduler,/extendRegistry/);
  assert.doesNotMatch(scheduler,/MLS_FARM_COMMAND|R33_EVIDENCE_FARM_COMMAND/);
  assert.doesNotMatch(scheduler,/workers\.dev|wrangler|WIKI_DB|\/api\/wiki\/editorial/i);
});
