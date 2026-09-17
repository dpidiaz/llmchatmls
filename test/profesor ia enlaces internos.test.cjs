'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const context=require('../scripts/habilitar contexto conversacional profesor ia.js');
const suggestions=require('../scripts/habilitar preguntas sugeridas profesor ia.js');
const links=require('../scripts/habilitar enlaces internos profesor ia.js');

const bundle=path.join(__dirname,'..','MASTER LANGUAGE SYSTEM REVISION 32 BUNDLE.tar.gz');
function baseAi(){return execFileSync('tar',['-xOzf',bundle,'public/js/ai.js'],{encoding:'utf8'});}
function patched(){return links.patchAi(suggestions.patchAi(context.patchAi(baseAi())));}
function runtimeApi(source,data){
  const start=source.indexOf("  const INTERNAL_LINKS_VERSION='1.0';");
  const end=source.indexOf("\n  function status(modal,msg,kind=''){");
  assert.ok(start>=0&&end>start,'bloque de enlaces localizable');
  const block=source.slice(start,end);
  return new Function('MLS',`${block}\nreturn {internalLinkCandidates,internalLinkMatches,linkableForm};`)({data});
}

const data={byLanguage:{
  ingles:[
    {code:'EN-1',language:'ingles',title:'Present perfect',target:'Present perfect tense',chapterNum:'4'},
    {code:'EN-2',language:'ingles',title:'Past simple',target:'Simple past',chapterNum:'4'},
    {code:'EN-3',language:'ingles',title:'Conditionals',target:'Conditional sentences',chapterNum:'8'}
  ],
  japones:[
    {code:'JA-1',language:'japones',title:'は',target:'topic particle',chapterNum:'2'},
    {code:'JA-2',language:'japones',title:'が',target:'subject particle',chapterNum:'2'}
  ]
}};

test('parche se aplica al núcleo combinado e idempotente',()=>{
  const source=patched();
  assert.match(source,/professorInternalLinksVersion:INTERNAL_LINKS_VERSION/);
  assert.match(source,/renderAssistantLinks\(assistant\.body,answer,entry,meta\)/);
  assert.equal(links.patchAi(source),source);
});

test('solo enlaza conceptos existentes de la misma enciclopedia',()=>{
  const api=runtimeApi(patched(),data);
  const answer='El Present perfect contrasta con el Past simple en este caso.';
  const found=api.internalLinkMatches(answer,{language:'ingles',code:'CURRENT',chapterNum:'4'},{slug:'ingles'});
  assert.deepEqual(found.map(x=>x.code),['EN-1','EN-2']);
  const ja=api.internalLinkMatches(answer,{language:'japones',code:'CURRENT',chapterNum:'2'},{slug:'japones'});
  assert.deepEqual(ja,[]);
});

test('target funciona como alias controlado y nunca inventa códigos',()=>{
  const api=runtimeApi(patched(),data);
  const found=api.internalLinkMatches('También se llama Simple past en muchos materiales.',{language:'ingles',code:'CURRENT',chapterNum:'4'},{slug:'ingles'});
  assert.equal(found.length,1);
  assert.equal(found[0].code,'EN-2');
  assert.deepEqual(api.internalLinkMatches('Future perfect progressive',{language:'ingles',code:'CURRENT'},{slug:'ingles'}),[]);
});

test('excluye la entrada actual, evita duplicados y limita a cinco enlaces',()=>{
  const many={byLanguage:{ingles:Array.from({length:8},(_,i)=>({code:`E${i}`,language:'ingles',title:`Concepto ${i}`,target:'',chapterNum:'1'}))}};
  const api=runtimeApi(patched(),many);
  const answer=Array.from({length:8},(_,i)=>`Concepto ${i}`).join(', ');
  const found=api.internalLinkMatches(answer,{language:'ingles',code:'E0',chapterNum:'1'},{slug:'ingles'});
  assert.ok(found.length<=5);
  assert.ok(!found.some(x=>x.code==='E0'));
  assert.equal(new Set(found.map(x=>x.code)).size,found.length);
});

test('formas breves de escrituras CJK siguen siendo enlazables sin abrir coincidencias latinas triviales',()=>{
  const api=runtimeApi(patched(),data);
  assert.equal(api.linkableForm('a'),'');
  assert.equal(api.linkableForm('は'),'は');
  const found=api.internalLinkMatches('は marca el tópico; が puede marcar el sujeto.',{language:'japones',code:'CURRENT',chapterNum:'2'},{slug:'japones'});
  assert.deepEqual(found.map(x=>x.code),['JA-1','JA-2']);
});
