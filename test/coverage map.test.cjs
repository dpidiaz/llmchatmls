const test=require('node:test');
const assert=require('node:assert/strict');
global.mlsAutooptFamily=t=>String(t.title||'').includes('Verb')?'conjugacion_verbal':'pronombres_regimen';
const coverage=require('../MLS R32 EDITORIAL/coverage map.js');
const langs=[{slug:'espanol-guatemala',name:'Español de Guatemala',total:10},{slug:'ingles',name:'Inglés',total:5}];
const articles=[
  {code:'ES1',language:'espanol-guatemala',title:'Verb A',level:'A1',part:'P1',chapter:'C1',generated_at:'g1'},
  {code:'ES2',language:'espanol-guatemala',title:'Verb B',level:'A1',part:'P1',chapter:'C1',generated_at:'g2'},
  {code:'ES3',language:'espanol-guatemala',title:'Pronombre',level:'B1',part:'P2',chapter:'C2',generated_at:'g3'},
  {code:'EN1',language:'ingles',title:'Verb C',level:'A1',part:'P1',chapter:'C1',generated_at:'g4'}
];
const audits=[
  {code:'ES1',article_generated_at:'g1',verdict:'ok'},
  {code:'ES3',article_generated_at:'g3',verdict:'review_required'},
  {code:'EN1',article_generated_at:'g4',verdict:'watch'}
];

test('coverage map: exact completion by language uses canonical totals',()=>{
  const x=coverage.mlsCoverageAggregate(articles,audits,langs);
  const es=x.exact.byLanguage.find(v=>v.language==='espanol-guatemala');
  assert.equal(es.total,10);assert.equal(es.published,3);assert.equal(es.pending,7);assert.equal(es.completion,0.3);
  assert.equal(x.exact.planned,15);assert.equal(x.exact.published,4);assert.equal(x.exact.pending,11);
});

test('coverage map: pending never becomes negative',()=>{
  const rows=Array.from({length:7},(_,i)=>({code:'E'+i,language:'ingles',title:'Verb',level:'A1',generated_at:String(i)}));
  const x=coverage.mlsCoverageAggregate(rows,[],[{slug:'ingles',name:'Inglés',total:5}]);
  assert.equal(x.exact.byLanguage[0].pending,0);assert.equal(x.exact.pending,0);
});

test('coverage map: levels A1-C2 remain separated per language and include zero evidence',()=>{
  const x=coverage.mlsCoverageAggregate(articles,audits,langs);
  assert.equal(x.observed.levels.length,12);
  assert.equal(x.observed.levels.find(v=>v.language==='ingles'&&v.level==='C2').published,0);
  assert.equal(x.observed.levels.find(v=>v.language==='ingles'&&v.level==='C2').evidence,'sin evidencia');
});

test('coverage map: families and chapters do not merge languages',()=>{
  const x=coverage.mlsCoverageAggregate(articles,audits,langs);
  assert.equal(x.observed.families.filter(v=>v.family==='conjugacion_verbal').length,2);
  assert.equal(x.observed.chapters.filter(v=>v.chapter==='C1').length,2);
  const esPron=x.observed.families.find(v=>v.language==='espanol-guatemala'&&v.family==='pronombres_regimen');
  assert.equal(esPron.reviewRequired,1);
});

test('coverage map: semantic audits are version exact',()=>{
  const x=coverage.mlsCoverageAggregate(articles,[...audits,{code:'ES2',article_generated_at:'old',verdict:'watch'}],langs);
  const es=x.exact.byLanguage.find(v=>v.language==='espanol-guatemala');
  assert.equal(es.semanticAudited,2);
});

test('coverage map: evidence thresholds are deterministic',()=>{
  assert.equal(coverage.mlsCoverageEvidence(0),'sin evidencia');
  assert.equal(coverage.mlsCoverageEvidence(1),'baja');
  assert.equal(coverage.mlsCoverageEvidence(5),'media');
  assert.equal(coverage.mlsCoverageEvidence(20),'alta');
});

test('coverage map: observational dimensions explicitly lack planned denominator',()=>{
  const x=coverage.mlsCoverageAggregate(articles,audits,langs);
  assert.equal(x.observed.denominatorAvailable,false);
  assert.match(x.observed.note,/no equivalen a porcentaje de completitud/i);
});

test('coverage map: module exposes no mutation action',()=>{
  const names=Object.keys(coverage).join(' ');
  assert.equal(/publish|delete|rescue|retry|start/i.test(names),false);
});

delete global.mlsAutooptFamily;