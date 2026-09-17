'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const context=require('../scripts/habilitar contexto conversacional profesor ia.js');
const suggestions=require('../scripts/habilitar preguntas sugeridas profesor ia.js');

const bundle=path.join(__dirname,'..','MASTER LANGUAGE SYSTEM REVISION 32 BUNDLE.tar.gz');
const LANGS=['espanol-guatemala','ingles','portugues','italiano','frances','aleman','japones','chino-taiwan','coreano','ruso'];
function baseAi(){return execFileSync('tar',['-xOzf',bundle,'public/js/ai.js'],{encoding:'utf8'});}
function patched(){return suggestions.patchAi(context.patchAi(baseAi()));}
function runtimeApi(source){
  const start=source.indexOf("  const SUGGESTIONS_VERSION='1.0';");
  const end=source.indexOf("\n  function status(modal,msg,kind=''){");
  assert.ok(start>=0&&end>start,'bloque de sugerencias localizable');
  const block=source.slice(start,end);
  return new Function(`${block}\nreturn {suggestionsFor,suggestionSlug,suggestionTopic};`)();
}

test('parche sustituye preguntas genéricas por sugerencias contextuales e idempotente',()=>{
  const source=patched();
  assert.match(source,/professorSuggestionsVersion:SUGGESTIONS_VERSION/);
  assert.match(source,/data-ai-suggestions/);
  assert.doesNotMatch(source,/Comparar con español/);
  assert.equal(suggestions.patchAi(source),source);
});

test('las diez enciclopedias reciben 3 a 5 sugerencias propias con el tema actual',()=>{
  const api=runtimeApi(patched());
  for(const slug of LANGS){
    const list=api.suggestionsFor({language:slug,title:'Tema único',target:'FORMA OBJETIVO',level:'B1'},{slug});
    assert.ok(list.length>=3&&list.length<=5,slug);
    assert.ok(list.every(q=>q.includes('FORMA OBJETIVO')),slug);
    assert.equal(new Set(list).size,list.length,slug);
  }
});

test('sugerencias preservan señales lingüísticas específicas sin contaminación',()=>{
  const api=runtimeApi(patched());
  const ja=api.suggestionsFor({language:'japones',title:'は',level:'A1'},{slug:'japones'}).join(' ');
  const zh=api.suggestionsFor({language:'chino-taiwan',title:'了',level:'A2'},{slug:'chino-taiwan'}).join(' ');
  const pt=api.suggestionsFor({language:'portugues',title:'ficar',level:'B1'},{slug:'portugues'}).join(' ');
  const en=api.suggestionsFor({language:'ingles',title:'present perfect',level:'B1'},{slug:'ingles'}).join(' ');
  assert.match(ja,/kanji|kana|cortesía|japonesa/i);
  assert.doesNotMatch(ja,/Taiwán|Hangul/);
  assert.match(zh,/tradicional|Taiwán|tonos/i);
  assert.doesNotMatch(zh,/rōmaji|Hangul/);
  assert.match(pt,/Brasil|brasileñ/i);
  assert.match(en,/US|UK|inglés/i);
});

test('nivel avanzado cambia una sugerencia sin alterar variante canónica',()=>{
  const api=runtimeApi(patched());
  const simple=api.suggestionsFor({language:'aleman',title:'Konjunktiv II',level:'A2'},{slug:'aleman'});
  const advanced=api.suggestionsFor({language:'aleman',title:'Konjunktiv II',level:'C1'},{slug:'aleman'});
  assert.notDeepEqual(simple,advanced);
  assert.match(advanced.join(' '),/matices|declinación|estructura/i);
  assert.match(advanced.join(' '),/Standarddeutsch/i);
});
