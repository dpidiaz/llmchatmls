const test=require('node:test');
const assert=require('node:assert/strict');
const regression=require('../MLS R32 EDITORIAL/regression alerts.js');

const NOW=Date.parse('2026-09-16T18:00:00.000Z');
const ago=d=>new Date(NOW-d*86400000).toISOString();
function validation({days=1,language='espanol-guatemala',level='A1',family='conjugacion_verbal',attempt=1,valid=true}={}){return {family_key:[language,level,family].join(':'),kind:'validation',data:JSON.stringify({attempt,valid}),created_at:ago(days)};}
function simple(kind,{days=1,language='espanol-guatemala',level='A1',family='conjugacion_verbal'}={}){return {family_key:[language,level,family].join(':'),kind,data:'{}',created_at:ago(days)};}
function firstAttempts(count,{days,validCount=count,language='espanol-guatemala',family='conjugacion_verbal'}={}){return Array.from({length:count},(_,i)=>validation({days,language,family,valid:i<validCount}));}

test('regression: insufficient evidence is not called stable',()=>{
  const x=regression.mlsRegressionAggregate([...firstAttempts(4,{days:2}),...firstAttempts(5,{days:10})],NOW);
  assert.equal(x.overall.status,'evidencia insuficiente');
  assert.equal(x.overall.sampleSufficient,false);
});

test('regression: stable window stays stable with sufficient comparable sample',()=>{
  const rows=[...firstAttempts(8,{days:2,validCount:7}),...firstAttempts(12,{days:10,validCount:10})];
  const x=regression.mlsRegressionAggregate(rows,NOW);
  assert.equal(x.overall.sampleSufficient,true);
  assert.equal(x.overall.status,'estable');
});

test('regression: material first pass drop is flagged',()=>{
  const rows=[...firstAttempts(8,{days:2,validCount:4}),...firstAttempts(12,{days:10,validCount:11})];
  const x=regression.mlsRegressionAggregate(rows,NOW);
  assert.equal(x.overall.status,'vigilar');
  assert.ok(x.overall.deltas.firstPassRate<=-0.15);
  assert.match(x.overall.reasons.join(' '),/Primer intento cayó/i);
});

test('regression: rejection rise and deferred rise are compared against baseline',()=>{
  const recent=[...firstAttempts(10,{days:1,validCount:6}),simple('deferred',{days:1}),simple('deferred',{days:1})];
  const baseline=[...firstAttempts(20,{days:12,validCount:19})];
  const x=regression.mlsRegressionAggregate([...recent,...baseline],NOW);
  assert.equal(x.overall.status,'vigilar');
  assert.ok(x.overall.deltas.rejectionRate>=0.15);
  assert.ok(x.overall.deltas.deferredRate>=0.10);
});

test('regression: languages and families never merge',()=>{
  const rows=[
    ...firstAttempts(8,{days:1,validCount:4,language:'espanol-guatemala',family:'conjugacion_verbal'}),
    ...firstAttempts(12,{days:12,validCount:12,language:'espanol-guatemala',family:'conjugacion_verbal'}),
    ...firstAttempts(8,{days:1,validCount:8,language:'ingles',family:'conjugacion_verbal'}),
    ...firstAttempts(12,{days:12,validCount:12,language:'ingles',family:'conjugacion_verbal'})
  ];
  const x=regression.mlsRegressionAggregate(rows,NOW);
  const es=x.byFamily.find(v=>v.language==='espanol-guatemala'&&v.family==='conjugacion_verbal');
  const en=x.byFamily.find(v=>v.language==='ingles'&&v.family==='conjugacion_verbal');
  assert.equal(es.status,'vigilar');assert.equal(en.status,'estable');
});

test('regression: needs review elevates recent diagnostic even with small sample',()=>{
  const x=regression.mlsRegressionAggregate([simple('needs_review',{days:1})],NOW);
  assert.equal(x.overall.status,'vigilar');
  assert.match(x.overall.reasons.join(' '),/needs review/i);
});

test('regression: old events outside 28 day comparison are ignored',()=>{
  const x=regression.mlsRegressionAggregate([validation({days:40,valid:false})],NOW);
  assert.equal(x.overall.recent.validations,0);assert.equal(x.overall.baseline.validations,0);
});

test('regression: module exports diagnosis only',()=>{
  const names=Object.keys(regression).join(' ');
  assert.equal(/publish|delete|rescue|retry|start|generate/i.test(names),false);
});