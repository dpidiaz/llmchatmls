const test=require('node:test');
const assert=require('node:assert/strict');
global.mlsChatError=(status,message)=>{const e=new Error(message);e.status=status;throw e;};
const audit=require('../MLS R32 EDITORIAL/semantic audit.js');

test('semantic audit: valid record contract accepts diagnostic result',()=>{
  const x=audit.mlsSemanticValidateRecord({verdict:'watch',confidence:'high',reviewer:'chatgpt',notes:'El ejemplo principal puede inducir una generalización lingüística incorrecta.',categories:['examples','accuracy','examples']});
  assert.equal(x.verdict,'watch');assert.equal(x.confidence,'high');assert.deepEqual(x.categories,['examples','accuracy']);
});

test('semantic audit: watch and review required need categories',()=>{
  assert.throws(()=>audit.mlsSemanticValidateRecord({verdict:'review_required',confidence:'medium',reviewer:'human',notes:'Existe un problema conceptual que requiere revisión editorial completa.',categories:[]}),/categoría/);
});

test('semantic audit: aggregate keeps languages and families separate',()=>{
  const rows=[
    {language:'espanol-guatemala',level:'B1',family:'conjugacion_verbal',verdict:'ok',categories:'[]'},
    {language:'ingles',level:'B1',family:'conjugacion_verbal',verdict:'watch',categories:'["examples"]'},
    {language:'ingles',level:'B2',family:'conjugacion_verbal',verdict:'review_required',categories:'["accuracy"]'}
  ];
  const x=audit.mlsSemanticAggregate(rows,100);
  assert.equal(x.audited,3);assert.equal(x.coverage,0.03);assert.equal(x.reviewRequired,1);
  assert.equal(x.byLanguage.length,2);assert.equal(x.byFamily.length,2);
});

test('semantic audit: review required elevates diagnostic status',()=>{
  const x=audit.mlsSemanticStatusFromAggregate({audited:20,watch:0,reviewRequired:1});
  assert.equal(x.status,'vigilar');assert.equal(x.conclusive,false);
});

test('semantic audit: small clean sample remains insufficient',()=>{
  const x=audit.mlsSemanticStatusFromAggregate({audited:4,watch:0,reviewRequired:0});
  assert.equal(x.status,'evidencia insuficiente');
});

test('semantic audit: balancing favors less audited language level and family',()=>{
  global.mlsAutooptFamily=t=>t.title.includes('Verb')?'conjugacion_verbal':'pronombres_regimen';
  const candidates=[
    {code:'EN1',language:'ingles',level:'B1',title:'Verb forms',chapter:'',part:''},
    {code:'ES1',language:'espanol-guatemala',level:'B1',title:'Verb forms',chapter:'',part:''},
    {code:'EN2',language:'ingles',level:'B2',title:'Pronombres',chapter:'',part:''}
  ];
  const existing=[{language:'ingles',level:'B1',family:'conjugacion_verbal'}];
  const selected=audit.mlsSemanticBalanceCandidates(candidates,existing,2);
  assert.equal(selected.length,2);assert.notEqual(selected[0].code,'EN1');
  delete global.mlsAutooptFamily;
});

test('semantic audit: module exposes no mutation or publication operation',()=>{
  const names=Object.keys(audit).join(' ');
  assert.equal(/publish|delete|retry|rescue/i.test(names),false);
});
