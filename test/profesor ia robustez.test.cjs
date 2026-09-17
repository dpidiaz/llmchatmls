'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const context=require('../scripts/habilitar contexto conversacional profesor ia.js');
const suggestions=require('../scripts/habilitar preguntas sugeridas profesor ia.js');
const links=require('../scripts/habilitar enlaces internos profesor ia.js');
const robust=require('../scripts/habilitar robustez profesor ia.js');

const bundle=path.join(__dirname,'..','MASTER LANGUAGE SYSTEM REVISION 32 BUNDLE.tar.gz');
function baseAi(){return execFileSync('tar',['-xOzf',bundle,'public/js/ai.js'],{encoding:'utf8'});}
function patched(){return robust.patchAi(links.patchAi(suggestions.patchAi(context.patchAi(baseAi()))));}
function classifier(source){
  const start=source.indexOf("  const ROBUSTNESS_VERSION='1.0';");
  const end=source.indexOf('  async function ask(entry,meta,question,modal');
  assert.ok(start>=0&&end>start,'bloque de robustez localizable');
  const block=source.slice(start,end);
  return new Function(`${block}\nreturn classifyProfessorError;`)();
}

test('parche añade robustez al núcleo combinado e idempotente',()=>{
  const source=patched();
  assert.match(source,/professorRobustnessVersion:ROBUSTNESS_VERSION/);
  assert.match(source,/const REQUEST_TIMEOUT_MS=45000/);
  assert.match(source,/new AbortController\(\)/);
  assert.match(source,/data-ai-cancel/);
  assert.match(source,/dataset\.aiRetry='1'/);
  assert.match(source,/hashchange/);
  assert.equal(robust.patchAi(source),source);
});

test('clasifica cuota proveedor timeout cancelación red y vacío con mensajes amistosos',()=>{
  const classify=classifier(patched());
  assert.match(classify({status:429,message:'quota exceeded'}),/límite/i);
  assert.match(classify({status:503,message:'provider unavailable'}),/no está disponible temporalmente/i);
  assert.match(classify({kind:'timeout',message:'AbortError'}),/tardó demasiado/i);
  assert.match(classify({kind:'cancel',message:'AbortError'}),/cancelada/i);
  assert.match(classify(new Error('Failed to fetch')),/conectar|conexión/i);
  assert.match(classify(new Error('La IA no devolvió una respuesta útil.')),/respuesta útil/i);
});

test('evita doble envío y preserva pregunta visual para reintento sin duplicarla',()=>{
  const source=patched();
  assert.match(source,/if\(modal\.dataset\.aiBusy==='1'\)return/);
  assert.match(source,/if\(!reuseUser\)addMessage\(messages,'user',q\)/);
  assert.match(source,/reuseUser:!automatic&&!!q/);
  assert.match(source,/history\.pop\(\);persistSession\(entry,meta,history\)/);
});

test('cierre o cambio de entrada aborta la petición y evita contaminar otra entrada',()=>{
  const source=patched();
  assert.match(source,/abortModal\(previous,'entry-change'\)/);
  assert.match(source,/onHashChange=\(\)=>close\('entry-change'\)/);
  assert.match(source,/if\(!modal\.isConnected&&\(reason==='close'\|\|reason==='entry-change'\)\)return/);
  assert.match(source,/if\(controller\.signal\.aborted\|\|!modal\.isConnected\)return/);
});

test('robustez del tutor no toca editorial D1 materialización ni artículos',()=>{
  const source=patched();
  const robustness=source.slice(source.indexOf("const ROBUSTNESS_VERSION='1.0'"),source.indexOf('  function open(entry,meta){'));
  assert.doesNotMatch(robustness,/wiki_|D1|materialize|publish|FIFO|AUTOOPT/i);
  assert.match(robustness,/fetch\('\/api\/chat'/);
});
