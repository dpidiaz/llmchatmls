'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const {
  semanticNeighbors,levelGap,auditNeighbors,languageOutput
}=require('../scripts/generar vecinos semanticos.js');

function vector(values){return Float32Array.from(values)}
function fixture(){
  return [
    {code:'MLS-V01-0001',title:'A',level:'A1',part:'P1',chapter:'C1',vector:vector([1,0,0])},
    {code:'MLS-V01-0002',title:'B',level:'A1',part:'P1',chapter:'C1',vector:vector([0.95,0.05,0])},
    {code:'MLS-V01-0003',title:'C',level:'A2',part:'P1',chapter:'C2',vector:vector([0.8,0.2,0])},
    {code:'MLS-V01-0004',title:'D',level:'C2',part:'P2',chapter:'C3',vector:vector([0,0,1])}
  ];
}

test('semantic neighbors exclude self, respect topK, and rank deterministically',()=>{
  const entries=fixture();
  const neighbors=semanticNeighbors(entries,2);
  assert.deepEqual(neighbors.get('MLS-V01-0001').map(x=>x.code),['MLS-V01-0002','MLS-V01-0003']);
  assert.equal(neighbors.get('MLS-V01-0001').some(x=>x.code==='MLS-V01-0001'),false);
  assert.equal(neighbors.get('MLS-V01-0001').length,2);
  const again=semanticNeighbors(entries,2);
  assert.deepEqual(
    [...neighbors].map(([code,hits])=>[code,hits.map(x=>[x.code,x.score])]),
    [...again].map(([code,hits])=>[code,hits.map(x=>[x.code,x.score])])
  );
});

test('level gap is conservative and only defined for CEFR labels',()=>{
  assert.equal(levelGap('A1','A2'),1);
  assert.equal(levelGap('A1','C1'),4);
  assert.equal(levelGap('A1',''),null);
  assert.equal(levelGap('X','B1'),null);
});

test('neighbor audit exposes quality signals without changing ranking',()=>{
  const entries=fixture();
  const neighbors=semanticNeighbors(entries,2);
  const audit=auditNeighbors(entries,neighbors);
  assert.equal(audit.entries,4);
  assert.equal(audit.neighborLinks,8);
  assert.ok(audit.sameChapterPct>=0&&audit.sameChapterPct<=100);
  assert.ok(audit.samePartPct>=0&&audit.samePartPct<=100);
  assert.ok(audit.scoreMax<=1.0001);
  assert.ok(audit.scoreMin>=-1.0001);
});

test('language output stores canonical codes only, without similarity scores in runtime payload',()=>{
  const entries=fixture();
  const neighbors=semanticNeighbors(entries,2);
  const semantic={meta:{model:'@cf/baai/bge-m3',version:'1.0',corpusBuildId:'build-test'}};
  const payload=languageOutput('ingles',semantic,entries,neighbors,2);
  assert.equal(payload.language,'ingles');
  assert.equal(payload.corpusBuildId,'build-test');
  assert.equal(payload.semanticModel,'@cf/baai/bge-m3');
  assert.deepEqual(payload.neighbors['MLS-V01-0001'],['MLS-V01-0002','MLS-V01-0003']);
  assert.equal(typeof payload.neighbors['MLS-V01-0001'][0],'string');
  assert.equal(JSON.stringify(payload).includes('"score"'),false);
});
