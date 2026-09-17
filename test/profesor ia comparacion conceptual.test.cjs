'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const installer=require('../scripts/habilitar comparacion conceptual profesor ia.js');

const helperPath=path.join(__dirname,'..','MLS R32 OVERLAY','profesor ia comparacion conceptual.js');
function apiWithData(byLanguage={}){
  const source=fs.readFileSync(helperPath,'utf8');
  const window={MLS:{data:{byLanguage},aiTutor:{open(entry,meta){return{entry,meta};}}}};
  const context={window,module:{exports:{}},exports:{},console};
  vm.runInNewContext(source,context,{filename:'profesor ia comparacion conceptual.js'});
  return{api:context.module.exports,window};
}
const DATA={
  ingles:[
    {code:'MLS-V01-0001',title:'Present simple',target:'present simple',level:'A1',chapterNum:2},
    {code:'MLS-V01-0002',title:'Present continuous',target:'be + verb-ing',level:'A1',chapterNum:2},
    {code:'MLS-V01-0003',title:'Past simple',target:'past simple',level:'A2',chapterNum:3}
  ],
  portugues:[{code:'MLS-V02-0002',title:'Presente contínuo',target:'estar + gerúndio',level:'A1',chapterNum:2}]
};

test('resuelve solo títulos u objetivos exactos de la misma enciclopedia',()=>{
  const {api}=apiWithData(DATA);
  assert.equal(api.resolveExactConcept('Present continuous','ingles','MLS-V01-0001').code,'MLS-V01-0002');
  assert.equal(api.resolveExactConcept('be + verb-ing','ingles','MLS-V01-0001').code,'MLS-V01-0002');
  assert.equal(api.resolveExactConcept('present continu','ingles','MLS-V01-0001'),null);
  assert.equal(api.resolveExactConcept('Presente contínuo','ingles','MLS-V01-0001'),null);
});

test('excluye la entrada actual y nunca inventa código MLS',()=>{
  const {api}=apiWithData(DATA);
  assert.equal(api.resolveExactConcept('Present simple','ingles','MLS-V01-0001'),null);
  const entry={language:'ingles',code:'MLS-V01-0001',title:'Present simple',body:'BASE',professorQuickAction:{id:'compare',slug:'ingles',detail:'Concepto inexistente'}};
  const directive=api.comparisonDirective(entry,{professorQuickActionId:'compare'});
  assert.match(directive,/no se resolvió/i);
  assert.match(directive,/no inventes código, enlace ni entrada MLS/i);
  assert.doesNotMatch(directive,/MLS-V01-\d{4}/g);
});

test('comparación X Y exige definición contraste ejemplos paralelos y evita falsa equivalencia',()=>{
  const {api}=apiWithData(DATA);
  const entry={language:'ingles',code:'MLS-V01-0001',title:'Present simple',body:'BASE',professorQuickAction:{id:'compare',slug:'ingles',detail:'Present continuous'}};
  const directive=api.comparisonDirective(entry,{professorQuickActionId:'compare'});
  assert.match(directive,/Concepto X .*Present simple/i);
  assert.match(directive,/Concepto Y .*Present continuous/i);
  assert.match(directive,/MLS-V01-0002/);
  assert.match(directive,/definición breve de X/i);
  assert.match(directive,/diferencias por criterios paralelos/i);
  assert.match(directive,/ejemplos paralelos comparables/i);
  assert.match(directive,/No presentes como equivalentes/i);
  assert.match(directive,/variante lingüística y el sistema de escritura canónicos/i);
});

test('difference se mantiene dentro de la entrada y no inventa segundo término',()=>{
  const {api}=apiWithData(DATA);
  const entry={language:'ingles',code:'MLS-V01-0001',title:'Present simple vs present continuous',professorQuickAction:{id:'difference',slug:'ingles'}};
  const directive=api.comparisonDirective(entry,{professorQuickActionId:'difference'});
  assert.match(directive,/realmente presentes/i);
  assert.match(directive,/no inventes un segundo término/i);
});

test('augmentEntry clona y conserva el artículo original',()=>{
  const {api}=apiWithData(DATA);
  const original={language:'ingles',code:'MLS-V01-0001',title:'Present simple',body:'BASE',plain:{lead:'LEAD'},professorQuickAction:{id:'compare',slug:'ingles',detail:'Present continuous'}};
  const out=api.augmentEntry(original,{professorQuickActionId:'compare'});
  assert.equal(original.body,'BASE');
  assert.equal(original.plain.lead,'LEAD');
  assert.equal(out.professorComparisonVersion,'1.0');
  assert.equal(out.professorComparison.resolved.code,'MLS-V01-0002');
  assert.match(out.body,/MLS_PROFESSOR_COMPARISON 1\.0/);
  assert.match(out.plain.lead,/MLS_PROFESSOR_COMPARISON 1\.0/);
});

test('install es idempotente y propaga versión sin romper open',()=>{
  const {api,window}=apiWithData(DATA);
  const first=api.install(window.MLS);
  const wrapped=window.MLS.aiTutor.open;
  const second=api.install(window.MLS);
  assert.equal(first,false,'el helper auto instala al cargarse cuando window.MLS existe');
  assert.equal(second,false);
  assert.equal(window.MLS.aiTutor.open,wrapped);
  assert.equal(window.MLS.aiTutor.professorComparisonVersion,'1.0');
  const result=window.MLS.aiTutor.open({language:'ingles',code:'MLS-V01-0001',title:'Present simple',body:'BASE',professorQuickAction:{id:'compare',slug:'ingles',detail:'Present continuous'}},{professorQuickActionId:'compare'});
  assert.equal(result.entry.professorComparison.resolved.code,'MLS-V01-0002');
  assert.equal(result.meta.professorComparisonVersion,'1.0');
});

test('instalador de build es idempotente',()=>{
  const helper=fs.readFileSync(helperPath,'utf8');
  const base="(()=>{window.MLS={aiTutor:{open(){}}};})();\n";
  const once=installer.patchAi(base,helper),twice=installer.patchAi(once,helper);
  assert.match(once,/MLSProfessorComparison/);
  assert.equal(twice,once);
});
