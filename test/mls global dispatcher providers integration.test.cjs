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
  assert.deepEqual(work.validation,['R33 Editorial Batch Tests']);
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

test('R33 direct wave integration opens when the first full wave is certified without waiting for the rest of the pool',()=>{
  const pool=r33Pool();
  const partialLedger={terminal:{
    a:{provider:'r33-farm',completedUnits:['MLS-V01-0001'],branch:'worker/r33/1',commitSha:'1'.repeat(40),completedAt:'2026-09-24T05:00:00.000Z'}
  }};
  assert.equal(integration.r33IndexIntegrationWork({pool,globalLedger:partialLedger,waveSize:2,verifiedCodes:[]}),null);

  const firstWaveLedger={terminal:{
    a:{provider:'r33-farm',completedUnits:['MLS-V01-0001'],branch:'worker/r33/1',commitSha:'1'.repeat(40),completedAt:'2026-09-24T05:00:00.000Z'},
    b:{provider:'r33-farm',completedUnits:['MLS-V01-0002'],branch:'worker/r33/2',commitSha:'2'.repeat(40),completedAt:'2026-09-24T05:01:00.000Z'}
  }};
  const work=integration.r33IndexIntegrationWork({pool,globalLedger:firstWaveLedger,waveSize:2,verifiedCodes:[]});
  assert.equal(work.provider,'r33-index-integration');
  assert.equal(work.workType,'integration');
  assert.deepEqual(work.units,['MLS-V01-0001','MLS-V01-0002']);
  assert.equal(work.sourceRefs.length,2);
  assert.ok(work.resourceLocks.includes('system:r33-index-integration'));
  assert.ok(work.resourceLocks.includes('system:main-integration'));
  assert.ok(work.allowedPaths.includes('MLS R32 EDITORIAL/evidence git/indexes/verified.json'));
  assert.equal(work.integration.mode,'assignment-pr');
  assert.equal(work.integration.waveMode,'aggregate-certified-workers');
  assert.equal(work.integration.waveSize,2);
  assert.deepEqual(work.integration.sourceWorkerCommits,['1'.repeat(40),'2'.repeat(40)]);
});

test('Unified integration publishes only certified R33 units even when earlier handoff units are not ready',()=>{
  const pool=r33Pool();
  const ledger={terminal:{
    later:{provider:'r33-farm',completedUnits:['MLS-V01-0002'],branch:'worker/r33-unified/2',commitSha:'2'.repeat(40),completedAt:'2026-10-03T07:41:00.000Z'}
  }};
  assert.equal(integration.r33IndexIntegrationWork({pool,globalLedger:ledger,waveSize:2,verifiedCodes:[]}),null,
    'historical R33 integration keeps the full-wave contract');
  const work=integration.r33IndexIntegrationWork({
    pool,globalLedger:ledger,waveSize:2,verifiedCodes:[],workPrefix:'r33-unified-integration:'
  });
  assert.ok(work);
  assert.deepEqual(work.units,['MLS-V01-0002']);
  assert.match(work.workId,/^r33-unified-integration:/);
  assert.equal(work.sourceRefs.length,1);
  assert.equal(work.sourceRefs[0].code,'MLS-V01-0002');
  assert.ok(!work.resourceLocks.includes('entry:MLS-V01-0001'));
});

test('R33 parallel preparation materializes independent waves while final integration keeps the global merge lock',()=>{
  const pool={...r33Pool(),execution:{...r33Pool().execution,parallelIntegrationPreparation:true,integrationWaveSize:1}};
  const globalLedger={terminal:{
    a:{provider:'r33-farm',completedUnits:['MLS-V01-0001'],branch:'worker/r33/1',commitSha:'1'.repeat(40),completedAt:'2026-09-24T05:00:00.000Z'},
    b:{provider:'r33-farm',completedUnits:['MLS-V01-0002'],branch:'worker/r33/2',commitSha:'2'.repeat(40),completedAt:'2026-09-24T05:01:00.000Z'},
    c:{provider:'r33-farm',completedUnits:['MLS-V01-0003'],branch:'worker/r33/3',commitSha:'3'.repeat(40),completedAt:'2026-09-24T05:02:00.000Z'}
  },recoveries:{}};
  const preparations=integration.r33IndexPreparationWorks({pool,globalLedger,waveSize:1,verifiedCodes:[]});
  assert.equal(preparations.length,3);
  assert.ok(preparations.every(x=>x.provider==='r33-index-preparation'&&x.workType==='code_task'));
  assert.ok(preparations.every(x=>!x.resourceLocks.includes('system:main-integration')&&!x.resourceLocks.includes('system:r33-index-integration')));
  assert.equal(globalCore.lockSetsConflict(preparations[0].resourceLocks,preparations[1].resourceLocks),false);
  assert.ok(preparations[0].allowedPaths.includes('MLS R32 EDITORIAL/evidence git/indexes/verified.json'));

  const first=preparations[0];
  globalLedger.terminal[first.workId]={
    status:'done',provider:'r33-index-preparation',completedUnits:first.units,
    branch:'worker/r33-index-preparation/001000',commitSha:'a'.repeat(40),completedAt:'2026-09-24T05:10:00.000Z'
  };
  const finalWork=integration.r33PreparedIndexIntegrationWork({pool,globalLedger,waveSize:1,verifiedCodes:[]});
  assert.equal(finalWork.provider,'r33-index-integration');
  assert.equal(finalWork.workType,'integration');
  assert.deepEqual(finalWork.units,['MLS-V01-0001']);
  assert.ok(finalWork.resourceLocks.includes('system:main-integration'));
  assert.ok(finalWork.resourceLocks.includes('system:r33-index-integration'));
  assert.equal(finalWork.integration.preparedRef.workId,first.workId);
  assert.equal(finalWork.integration.preparedRef.commitSha,'a'.repeat(40));
  assert.equal(finalWork.priority>first.priority,true,'preparations must be claimable before serialized final integration');
});

test('R33 prepared integration rejects terminal preparation metadata that does not match the exact wave',()=>{
  const pool={...r33Pool(),execution:{...r33Pool().execution,parallelIntegrationPreparation:true,integrationWaveSize:1}};
  const globalLedger={terminal:{
    a:{provider:'r33-farm',completedUnits:['MLS-V01-0001'],branch:'worker/r33/1',commitSha:'1'.repeat(40)},
    b:{provider:'r33-farm',completedUnits:['MLS-V01-0002'],branch:'worker/r33/2',commitSha:'2'.repeat(40)},
    c:{provider:'r33-farm',completedUnits:['MLS-V01-0003'],branch:'worker/r33/3',commitSha:'3'.repeat(40)}
  },recoveries:{}};
  const first=integration.r33IndexPreparationWorks({pool,globalLedger,waveSize:1,verifiedCodes:[]})[0];
  globalLedger.terminal[first.workId]={
    status:'done',provider:'r33-index-preparation',completedUnits:['MLS-V01-0002'],
    branch:'worker/r33-index-preparation/001000',commitSha:'a'.repeat(40)
  };
  assert.equal(integration.r33PreparedIndexIntegrationWork({pool,globalLedger,waveSize:1,verifiedCodes:[]}),null);
});

test('R33 full-corpus continuation applies the R4 128-way microclaim pipeline',()=>{
  const base={...r33Pool(),gate1000Authorized:true,execution:{...r33Pool().execution,continuationAfterActivePool:true}};
  const corpus=[
    {code:'MLS-V01-0001',language:'ingles',path:'content/ingles/MLS-V01-0001.json'},
    {code:'MLS-V01-0002',language:'ingles',path:'content/ingles/MLS-V01-0002.json'},
    {code:'MLS-V01-0003',language:'ingles',path:'content/ingles/MLS-V01-0003.json'},
    {code:'MLS-V01-0004',language:'ingles',path:'content/ingles/MLS-V01-0004.json'}
  ];
  const pool=integration.r33ContinuationPool({basePool:base,verifiedCodes:['MLS-V01-0001','MLS-V01-0003'],corpusEntries:corpus});
  assert.equal(pool.poolId,'MLS-R33-FULL-CORPUS-CONTINUATION');
  assert.equal(pool.status,'authorized');
  assert.equal(pool.active,true);
  assert.equal(pool.continuationOf,base.poolId);
  assert.deepEqual(pool.entries.map(x=>x.code),['MLS-V01-0002','MLS-V01-0004']);
  assert.equal(pool.execution.defaultClaimSize,5);
  assert.equal(pool.execution.maxClaimSize,10);
  assert.equal(pool.execution.workerBatchSize,5);
  assert.equal(pool.execution.parallelWorkerLimit,128);
  assert.equal(pool.execution.maxConcurrentWorkers,128);
  assert.equal(pool.execution.checkpointSizeMax,1);
  assert.equal(pool.execution.integrationWaveSize,500);
  assert.equal(pool.execution.deferredIntegration,true);
  assert.equal(pool.execution.directWaveIntegration,false);
  assert.equal(pool.execution.parallelIntegrationPreparation,false);
  assert.equal(pool.execution.finalMergeSerialized,true);
  assert.equal(integration.r33ContinuationPool({basePool:base,verifiedCodes:corpus.map(x=>x.code),corpusEntries:corpus}),null);
});

test('R4 deferred integration materializes Evidence workers but no index integration work',()=>{
  const result=integration.materializeProviderItems({
    issues:[],root:'.',now:NOW,
    globalLedger:{terminal:{},recoveries:{}},globalAssignments:[],queueTarget:128
  });
  assert.ok(result.items.some(x=>x.provider==='r33-farm'));
  assert.equal(result.items.some(x=>x.provider==='r33-index-integration'),false);
  assert.equal(result.items.some(x=>x.provider==='r33-index-preparation'),false);
  assert.equal(result.queueTarget,128);
});

test('R4 staging manifest is deterministic and rejects conflicting certified commits',()=>{
  const ledger={terminal:{
    b:{provider:'r33-farm',completedUnits:['MLS-V01-0002'],branch:'worker/b',commitSha:'2'.repeat(40),completedAt:'2026-09-24T05:02:00.000Z'},
    a:{provider:'r33-farm',completedUnits:['MLS-V01-0001'],branch:'worker/a',commitSha:'1'.repeat(40),completedAt:'2026-09-24T05:01:00.000Z'}
  }};
  const one=integration.r33StagingManifest(ledger,{createdAt:'2026-09-24T06:00:00.000Z'});
  const two=integration.r33StagingManifest({terminal:{a:ledger.terminal.a,b:ledger.terminal.b}},{createdAt:'2026-09-24T06:01:00.000Z'});
  assert.equal(one.entryCount,2);
  assert.deepEqual(one.entries.map(x=>x.code),['MLS-V01-0001','MLS-V01-0002']);
  assert.equal(one.snapshotHash,two.snapshotHash);
  const conflict={terminal:{...ledger.terminal,c:{provider:'r33-farm',completedUnits:['MLS-V01-0001'],branch:'worker/c',commitSha:'3'.repeat(40)}}};
  assert.throws(()=>integration.r33StagingManifest(conflict),error=>error.code==='R4_STAGING_CONFLICT');
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

test('R33 editorial work remains materializable while index integration is active',()=>{
  const result=integration.materializeProviderItems({
    issues:[],
    root:'.',
    now:NOW,
    globalLedger:{terminal:{},recoveries:{}},
    globalAssignments:[activeGlobal('r33-index-integration','MLS-GLOBAL-INTEGRATION',[])]
  });
  assert.ok(result.items.some(x=>x.provider==='r33-farm'));
  assert.equal(result.diagnostics.some(x=>x.provider==='r33-farm'),false);
});

test('R4 finish auto-pulls the next claim, preserves worker identity, and explicitly wakes the scheduler',()=>{
  const worker=fs.readFileSync('scripts/MLS global dispatcher worker.cjs','utf8');
  const scheduler=fs.readFileSync('scripts/MLS global dispatcher scheduler.cjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/MLS Global Dispatcher Worker Events.yml','utf8');
  assert.match(worker,/operation==='finish'&&next\.readyToClose===true&&\(next\.provider==='r33-farm'\|\|integrationAutoPull\)/);
  assert.match(worker,/unifiedIntegrationScope\?\{provider:'r33-index-integration',workPrefix:unifiedIntegrationScope\}/);
  assert.match(worker,/\[MLS Dispatcher\]\[CLAIM\]/);
  assert.match(worker,/workerLogin:workerLogin\|\|null/);
  assert.match(worker,/wakeScheduler\(\)/);
  assert.match(worker,/continue-until-preempted/);
  assert.match(scheduler,/trustedAutoPull=issueLogin==='github-actions\[bot\]'/);
  assert.match(scheduler,/trustedAutoPull&&delegatedLogin\?delegatedLogin/);
  assert.match(workflow,/actions:\s*write/);
});

test('R4 scheduler distinguishes temporary saturation from true NO_WORK',()=>{
  const scheduler=fs.readFileSync('scripts/MLS global dispatcher scheduler.cjs','utf8');
  assert.match(scheduler,/CAPACITY_BUSY/);
  assert.match(scheduler,/WORK_TEMPORARILY_LEASED/);
  assert.match(scheduler,/CORPUS_EXHAUSTED_OR_NO_ELIGIBLE_BACKLOG/);
  assert.match(scheduler,/activeR33>0/);
});

test('scheduler integrates providers through snapshots only and never issues nested Farm commands',()=>{
  const scheduler=fs.readFileSync('scripts/MLS global dispatcher scheduler.cjs','utf8');
  assert.match(scheduler,/providers\/integration\.js/);
  assert.match(scheduler,/materializeProviderItems/);
  assert.match(scheduler,/extendRegistry/);
  assert.doesNotMatch(scheduler,/MLS_FARM_COMMAND|R33_EVIDENCE_FARM_COMMAND/);
  assert.doesNotMatch(scheduler,/workers\.dev|wrangler|WIKI_DB|\/api\/wiki\/editorial/i);
});
