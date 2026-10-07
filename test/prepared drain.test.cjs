'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const drain=require('../MLS R32 EDITORIAL/prepared drain.cjs');
const integration=require('../MLS R32 EDITORIAL/global dispatcher/providers/integration.js');
const r33=require('../MLS R32 EDITORIAL/global dispatcher/providers/r33.js');
test('prepared cohort has 234 unique durable handoffs and enters existing fenced R33 queue first',()=>{
  const codes=drain.load('.');assert.equal(codes.size,234);
  const handoffs=integration.loadR44R33Handoffs('.');
  for(const code of codes)assert(handoffs.has(code),code);
  const snapshot={pool:{poolId:'MLS-R33-TEST-PREPARED',manifestVersion:'1',status:'authorized',active:true,execution:{}},bufferedReservations:[]};
  const view=integration.r33UnifiedSnapshot(snapshot,handoffs,{root:'.',globalLedger:{terminal:{},recoveries:{}},globalAssignments:[]});
  const remaining=[...codes].filter(code=>!integration.r33IntegratedCodes('.').has(code));
  assert.deepEqual(new Set(view.pool.entries.slice(0,remaining.length).map(x=>x.code)),new Set(remaining));
  const first=view.pool.entries[0].code;
  view.reservedCodes=[first];
  const candidate=r33.materializeCandidate(view,{now:Date.now(),requested:5});
  assert(candidate.units.every(x=>codes.has(x.code)&&x.code!==first));
  const protectedView=integration.protectCandidateCodes(view,[candidate],Date.now());
  const second=r33.materializeCandidate(protectedView,{now:Date.now(),requested:5});
  assert(second.units.every(x=>!candidate.units.some(y=>y.code===x.code)));
});


test('prepared drain ignores legacy R33 terminals and recoveries but honors Unified fences',()=>{
  const codes=drain.load('.');
  const handoffs=integration.loadR44R33Handoffs('.');
  const code=[...codes][0];
  const snapshot={pool:{poolId:'MLS-R33-TEST-PREPARED',manifestVersion:'1',status:'authorized',active:true,execution:{}},bufferedReservations:[]};
  const legacyLedger={
    terminal:{'r33-farm:legacy-batch':{provider:'r33-farm',completedUnits:[code],branch:'worker/legacy',commitSha:'a'.repeat(40)}},
    recoveries:{legacy:{workItem:{provider:'r33-farm',workId:'r33-farm:legacy-batch'},resourceLocks:['entry:'+code]}}
  };
  const view=integration.r33UnifiedSnapshot(snapshot,handoffs,{root:'.',globalLedger:legacyLedger,globalAssignments:[]});
  assert.equal(view.pool.unifiedR44Only,true);
  const candidate=r33.materializeCandidate(view,{now:Date.now(),requested:5});
  assert.ok(candidate.units.some(x=>x.code===code),'legacy R33 state must not fence a PREPARED Unified code');
  const sources=integration.r33TerminalSourceMap(legacyLedger,view.pool,{root:'.'});
  assert.equal(sources.has(code),false,'legacy R33 terminal must not source Unified integration');

  const unifiedLedger={
    terminal:{['r33-unified:'+code]:{provider:'r33-farm',completedUnits:[code],branch:'worker/r33-unified/test',commitSha:'b'.repeat(40)}},
    recoveries:{}
  };
  const unifiedView=integration.r33UnifiedSnapshot(snapshot,handoffs,{root:'.',globalLedger:unifiedLedger,globalAssignments:[]});
  const unifiedCandidate=r33.materializeCandidate(unifiedView,{now:Date.now(),requested:5});
  assert.ok(unifiedCandidate.units.every(x=>x.code!==code),'Unified terminal must remain authoritative');
  const unifiedSources=integration.r33TerminalSourceMap(unifiedLedger,unifiedView.pool,{root:'.'});
  assert.equal(unifiedSources.has(code),true,'Unified terminal remains eligible as integration source');
});

test('Unified candidate protection consumes an overlapping legacy reservation before general R33 materialization',()=>{
  const code='MLS-V01-0696';
  const entry={code,language:'italiano',contentPath:'content/italiano/'+code+'.json',order:1};
  const pool={poolId:'MLS-R33-TEST-PREPARED',manifestVersion:'1',status:'authorized',active:true,execution:{},entries:[entry]};
  const snapshot={pool,ledger:{poolId:pool.poolId,manifestVersion:pool.manifestVersion,verified:[],exceptions:[]},batches:[],reservedCodes:[code]};
  const candidate={poolId:pool.poolId,units:[{...entry,evidenceArtifactPath:r33.evidenceArtifactPath(entry)}]};
  const protectedView=integration.protectCandidateCodes(snapshot,[candidate],Date.now(),{supersededCodes:[code]});
  assert.deepEqual(protectedView.reservedCodes,[]);
  assert.doesNotThrow(()=>r33.materializeCandidate(protectedView,{now:Date.now(),requested:1}));
});
