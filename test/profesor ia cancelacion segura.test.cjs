'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const context=require('../scripts/habilitar contexto conversacional profesor ia.js');
const suggestions=require('../scripts/habilitar preguntas sugeridas profesor ia.js');
const links=require('../scripts/habilitar enlaces internos profesor ia.js');
const robust=require('../scripts/habilitar robustez profesor ia.js');
const cancellation=require('../scripts/habilitar cancelacion segura profesor ia.js');

const bundle=path.join(__dirname,'..','MASTER LANGUAGE SYSTEM REVISION 32 BUNDLE.tar.gz');
function baseAi(){return execFileSync('tar',['-xOzf',bundle,'public/js/ai.js'],{encoding:'utf8'});}
function robustAi(){return robust.patchAi(links.patchAi(suggestions.patchAi(context.patchAi(baseAi()))));}
function patched(){return cancellation.patchAi(robustAi());}

test('declara version y certifica todas las defensas de cancelacion',()=>{
  const source=patched();
  assert.match(source,/const CANCELLATION_VERSION='1\.0'/);
  assert.match(source,/professorCancellationVersion:CANCELLATION_VERSION/);
  for(const [needle] of cancellation.REQUIRED)assert.ok(source.includes(needle),needle);
  assert.equal(cancellation.assertContract(source),true);
});

test('contrato falla cerrado si desaparece una defensa critica',()=>{
  const source=robustAi();
  for(const [needle,label] of cancellation.REQUIRED){
    const broken=source.replace(needle,'/* defensa eliminada */');
    assert.throws(()=>cancellation.assertContract(broken),new RegExp(label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'),label);
  }
});

test('cambio de entrada aborta antes de retirar modal anterior',()=>{
  const source=patched();
  const abortAt=source.indexOf("abortModal(previous,'entry-change')");
  const removeAt=source.indexOf('previous.remove()',abortAt);
  assert.ok(abortAt>=0&&removeAt>abortAt);
  assert.match(source,/onHashChange=\(\)=>close\('entry-change'\)/);
});

test('respuesta tardia no llega a DOM ni historial de otra entrada',()=>{
  const source=patched();
  assert.match(source,/if\(controller\.signal\.aborted\|\|!modal\.isConnected\)return;answer\+=piece/);
  assert.match(source,/if\(controller\.signal\.aborted\|\|!modal\.isConnected\)return;\s*renderAssistantLinks/);
  assert.match(source,/if\(!modal\.isConnected&&\(reason==='close'\|\|reason==='entry-change'\)\)return/);
});

test('cancelacion y reintento no permiten doble peticion',()=>{
  const source=patched();
  assert.match(source,/if\(modal\.dataset\.aiBusy==='1'\)return/);
  assert.match(source,/requestControllers\.set\(modal,active\)/);
  assert.match(source,/requestControllers\.delete\(modal\)/);
  assert.match(source,/reuseUser:!automatic&&!!q/);
});

test('capa de contrato no introduce red almacenamiento ni mutaciones editoriales',()=>{
  const file=require('node:fs').readFileSync(path.join(__dirname,'..','scripts','habilitar cancelacion segura profesor ia.js'),'utf8');
  assert.doesNotMatch(file,/fetch\(|localStorage|sessionStorage|D1|wiki_|materialize|publish|FIFO|AUTOOPT/i);
});

test('parche es idempotente',()=>{
  const once=patched();
  assert.equal(cancellation.patchAi(once),once);
});
