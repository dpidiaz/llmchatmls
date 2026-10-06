'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const farm=require('../MLS R32 EDITORIAL/farm core.js');
const r33Provider=require('../MLS R32 EDITORIAL/global dispatcher/providers/r33.js');
const integration=require('../MLS R32 EDITORIAL/global dispatcher/providers/integration.js');
const unified=require('../MLS R32 EDITORIAL/unified command.cjs');

const NOW=Date.parse('2026-10-03T06:00:00.000Z');

function baseSnapshot(){
  const pool={
    poolId:'MLS-R33-GITHUB-NATIVE-GATE-1000',
    manifestVersion:'1.0',status:'authorized',active:true,dispatcherOnly:true,
    sourceOfTruth:'github',editorialArchitecture:'github-native',
    cloudflareEditorialAllowed:false,d1EditorialAllowed:false,
    gate500Authorized:true,gate1000Authorized:true,
    execution:{defaultClaimSize:5,maxClaimSize:10,parallelWorkerLimit:128,checkpointSizeMax:1},
    entries:[]
  };
  return {pool,ledger:{poolId:pool.poolId,manifestVersion:'1.0',verified:[],exceptions:[]},batches:[],bufferedReservations:[]};
}
function unverifiedCorpusEntries(count=3){
  const verified=integration.r33IntegratedCodes('.');
  return farm.corpusEntries('.').filter(x=>!verified.has(String(x.code).toUpperCase())).slice(0,count);
}
function handoffFor(entry,ordinal){
  return {
    code:String(entry.code).toUpperCase(),
    ticketId:'R44-FIXTURE-'+ordinal,
    ordinal,
    outcome:ordinal%2?'CORRECTED':'PASS_NO_CHANGE',
    sourcePath:String(entry.path),
    sourceSha256:'a'.repeat(64),
    resultSha256:String(ordinal).padStart(64,'0').slice(-64),
    handoffPath:'MLS R32 EDITORIAL/r44/r33-handoff/tickets/R44-FIXTURE-'+ordinal+'.json',
    r44CreatedAt:'2026-10-03T05:00:00.000Z'
  };
}

test('Unified visible command supports chat-scoped targets from 100 through 1000',()=>{
  assert.equal(unified.EXECUTION_TARGET_ENTRIES,100);
  assert.equal(unified.MIN_EXECUTION_TARGET_ENTRIES,100);
  assert.equal(unified.MAX_EXECUTION_TARGET_ENTRIES,1000);
  assert.equal(unified.EXECUTION_TARGET_STEP,5);
  assert.equal(unified.MAX_MICROCLAIM_ENTRIES,50);

  assert.deepEqual(unified.parseUserCommand('MLS Unified siguiente'),{
    command:'MLS Unified siguiente',targetEntries:100,explicitTarget:false
  });
  assert.deepEqual(unified.parseUserCommand('`MLS Unified siguiente 500`'),{
    command:'MLS Unified siguiente',targetEntries:500,explicitTarget:true
  });
  assert.equal(unified.parseUserCommand('MLS Unified siguiente 1000').targetEntries,1000);
  assert.throws(()=>unified.parseUserCommand('MLS Unified siguiente 95'),/UNIFIED_TARGET_INVALID/);
  assert.throws(()=>unified.parseUserCommand('MLS Unified siguiente 503'),/UNIFIED_TARGET_INVALID/);
  assert.throws(()=>unified.parseUserCommand('MLS Unified siguiente 1005'),/UNIFIED_TARGET_INVALID/);

  const agents=fs.readFileSync('AGENTS.md','utf8');
  const guide=fs.readFileSync(unified.GUIDE,'utf8');
  assert.match(agents,/targetEntries = 100/);
  assert.match(agents,/MLS Unified siguiente N/);
  assert.match(agents,/100 through 1000/);
  assert.match(agents,/\*\*not\*\* the command boundary/i);
  assert.match(guide,/chat-scoped cumulative target/);
  assert.match(guide,/MLS Unified siguiente N/);
  assert.match(guide,/100 through 1000/);
});

test('Unified command creates only scoped integration and R33 claims',()=>{
  const a=unified.createClaim({stage:'integration',requestId:'unified-int-0001',workerId:'unified-worker-0001'});
  assert.equal(a.command.provider,'r33-index-integration');
  assert.equal(a.command.workPrefix,'r33-unified-integration:');
  const b=unified.createClaim({stage:'r33',requestId:'unified-r33-0001',workerId:'unified-worker-0001'});
  assert.equal(b.command.provider,'r33-farm');
  assert.equal(b.command.workPrefix,'r33-unified:');
  assert.ok(b.command.capabilities.includes('mls-unified'));
});

test('Unified R33 pool is full-corpus based and only admits durable R44 handoffs',()=>{
  const corpus=unverifiedCorpusEntries(3);
  assert.equal(corpus.length,3);
  const outside=corpus.find(x=>!baseSnapshot().pool.entries.some(p=>p.code===x.code))||corpus[0];
  const handoffs=new Map([[String(outside.code).toUpperCase(),handoffFor(outside,9001)]]);
  const view=integration.r33UnifiedSnapshot(baseSnapshot(),handoffs,{root:'.',globalLedger:{terminal:{},recoveries:{}},globalAssignments:[]});
  assert(view);
  assert.equal(view.pool.poolId,'MLS-R33-R44-UNIFIED-CONTINUATION');
  assert.deepEqual(view.pool.entries.map(x=>x.code),[String(outside.code).toUpperCase()]);
  assert.equal(view.pool.entries[0].contentPath,String(outside.path));
  assert.equal(view.unifiedFullCorpus,true);
});

test('Unified candidate carries R44 correction context and canonical content path',()=>{
  const entry=unverifiedCorpusEntries(1)[0];
  const h=handoffFor(entry,9002),handoffs=new Map([[String(entry.code).toUpperCase(),h]]);
  const view=integration.r33UnifiedSnapshot(baseSnapshot(),handoffs,{root:'.',globalLedger:{terminal:{},recoveries:{}},globalAssignments:[]});
  const candidate=r33Provider.materializeCandidate(view,{now:NOW,requested:1});
  assert.equal(candidate.eligible,true);
  candidate.r44Unified=candidate.units.map(x=>handoffs.get(x.code));
  const work=integration.r33CandidateToWork(candidate,NOW);
  assert.match(work.workId,/^r33-unified:/);
  assert.equal(work.provider,'r33-farm');
  assert.equal(work.priority,2);
  assert.ok(work.allowedPaths.includes(String(entry.path)));
  assert.ok(work.resourceLocks.includes('path:'+String(entry.path)));
  assert.match(work.instructions,/UNIFIED R44→R33/);
  assert.match(work.instructions,/CORRECTED/);
});

test('protectCandidateCodes prevents the general R33 lane from taking a Unified code in the same allocation pass',()=>{
  const pool={
    poolId:'MLS-R33-TEST-PROTECT',manifestVersion:'1',status:'authorized',active:true,sourceOfTruth:'github',
    cloudflareEditorialAllowed:false,d1EditorialAllowed:false,execution:{defaultClaimSize:1,maxClaimSize:10},
    entries:[
      {order:1,code:'MLS-V01-9001',language:'ingles',contentPath:'content/a.json'},
      {order:2,code:'MLS-V01-9002',language:'ingles',contentPath:'content/b.json'}
    ]
  };
  const snapshot={pool,ledger:{poolId:'MLS-R33-TEST-PROTECT',manifestVersion:'1',verified:[],exceptions:[]},batches:[],reservedCodes:[]};
  const selected={poolId:'MLS-R33-TEST-PROTECT',units:[pool.entries[0]]};
  const protectedView=integration.protectCandidateCodes(snapshot,[selected],NOW);
  const general=r33Provider.materializeCandidate(protectedView,{now:NOW,requested:1});
  assert.deepEqual(general.units.map(x=>x.code),['MLS-V01-9002']);
});

test('Unified final integration carries certified contentPath beside Evidence and indexes',()=>{
  const entry=unverifiedCorpusEntries(1)[0],code=String(entry.code).toUpperCase(),r44=handoffFor(entry,9100);
  const pool={...baseSnapshot().pool,poolId:'MLS-R33-R44-UNIFIED-CONTINUATION',entries:[{order:1,code,language:entry.language,contentPath:entry.path,r44Handoff:r44}]};
  const globalLedger={terminal:{
    ['r33-unified:'+code]:{
      provider:'r33-farm',completedUnits:[code],branch:'worker/r33-unified/1',
      commitSha:'1'.repeat(40),completedAt:'2026-10-03T06:00:00.000Z'
    }
  },recoveries:{}};
  const work=integration.r33IndexIntegrationWork({
    pool,globalLedger,root:'.',waveSize:50,verifiedCodes:[],workPrefix:'r33-unified-integration:'
  });
  assert(work);
  assert.match(work.workId,/^r33-unified-integration:/);
  assert.ok(work.allowedPaths.includes(String(entry.path)));
  assert.equal(work.sourceRefs[0].contentPath,String(entry.path));
  assert.ok(work.integration.contentPaths.includes(String(entry.path)));
  assert.match(work.instructions,/reconciliación de tres vías/);
  assert.match(work.instructions,/recertificación/);
  assert.equal(work.sourceRefs[0].r44Outcome,r44.outcome);
  assert.equal(work.sourceRefs[0].r44SourceSha256,r44.sourceSha256);
  assert.equal(work.sourceRefs[0].r44ResultSha256,r44.resultSha256);

});

test('Unified auto-pull hands R33 finish to serialized integration and keeps both lanes scoped',()=>{
  const worker=fs.readFileSync('scripts/MLS global dispatcher worker.cjs','utf8');
  assert.match(worker,/unifiedScope=workId\.startsWith\('r33-unified:'\)\?'r33-unified:'/);
  assert.match(worker,/unifiedIntegrationScope=workId\.startsWith\('r33-unified-integration:'\)\?'r33-unified-integration:'/);
  assert.match(worker,/handoffScope\?\{provider:'r33-farm',workPrefix:handoffScope\[0\]\}/);
  assert.match(worker,/const targetWorkerId=unifiedScope\?'mls-unified-web-integration':workerId/);
  assert.match(worker,/unifiedScope\?\{provider:'r33-index-integration',workPrefix:'r33-unified-integration:'\}/);
  assert.match(worker,/unifiedIntegrationScope\?\{provider:'r33-index-integration',workPrefix:unifiedIntegrationScope\}/);
  assert.match(worker,/integrationAutoPull=next\.provider==='r33-index-integration'/);
});

test('R44 handoff sync is grouped, paged and never writes per worker',()=>{
  const script=fs.readFileSync('scripts/r44 r33 handoff sync.cjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/MLS Unified R44 R33 Handoff.yml','utf8');
  assert.match(script,/afterOrdinal=/);
  assert.match(script,/limit=200/);
  assert.match(script,/MLS-R44-R33-HANDOFF-1/);
  assert.match(workflow,/cron: '\*\/5 \* \* \* \*'/);
  assert.match(workflow,/Commit grouped handoff snapshot/);
  assert.doesNotMatch(script,/api\.github\.com|GITHUB_TOKEN/);
});


test('R33 Editorial Batch Tests accepts Unified worker branches',()=>{
  const workflow=fs.readFileSync('.github/workflows/R33 Editorial Batch Tests.yml','utf8');
  assert.match(workflow,/worker\/r33-farm\/\*\*/);
  assert.match(workflow,/worker\/r33-unified\/\*\*/);
});


test('Gate 100 materializes 100 disjoint Unified workers under the 128-worker ceiling',()=>{
  const corpus=unverifiedCorpusEntries(520);
  assert.ok(corpus.length>=500,'Need at least 500 unverified corpus entries for Gate 100.');
  const handoffs=new Map(corpus.map((entry,index)=>[
    String(entry.code).toUpperCase(),
    handoffFor(entry,10000+index)
  ]));
  const view=integration.r33UnifiedSnapshot(
    baseSnapshot(),
    handoffs,
    {root:'.',globalLedger:{terminal:{},recoveries:{}},globalAssignments:[]}
  );
  assert(view);
  assert.equal(view.pool.execution.parallelWorkerLimit,128);
  const candidates=r33Provider.materializeCandidates(view,{now:NOW,count:100,requested:5});
  assert.equal(candidates.length,100);

  const allCodes=candidates.flatMap(candidate=>candidate.units.map(unit=>unit.code));
  assert.equal(allCodes.length,500);
  assert.equal(new Set(allCodes).size,500);

  const works=candidates.map(candidate=>{
    candidate.r44Unified=candidate.units.map(unit=>handoffs.get(unit.code));
    return integration.r33CandidateToWork(candidate,NOW);
  });
  assert.equal(new Set(works.map(work=>work.workId)).size,100);
  assert.ok(works.every(work=>work.workId.startsWith('r33-unified:')));
  assert.ok(works.every(work=>work.provider==='r33-farm'));
  assert.ok(works.every(work=>work.units.length===5));

  const locks=works.flatMap(work=>work.resourceLocks.filter(lock=>lock.startsWith('entry:')));
  assert.equal(locks.length,500);
  assert.equal(new Set(locks).size,500);
});
