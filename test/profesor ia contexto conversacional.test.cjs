'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const mod=require('../scripts/habilitar contexto conversacional profesor ia.js');

const bundle=path.join(__dirname,'..','MASTER LANGUAGE SYSTEM REVISION 32 BUNDLE.tar.gz');
function baseAi(){return execFileSync('tar',['-xOzf',bundle,'public/js/ai.js'],{encoding:'utf8'});}
function runtimeApi(patched){
  const start=patched.indexOf('  const sessions=new Map();');
  const end=patched.indexOf('\n\n  function online');
  assert.ok(start>=0&&end>start,'bloque conversacional localizable');
  const block=patched.slice(start,end);
  return new Function('window',`${block}\nreturn {conversationKey,boundedHistory};`)({sessionStorage:null});
}

test('contexto conversacional se aplica al ai.js real del bundle e idempotente',()=>{
  const original=baseAi(),patched=mod.patchAi(original);
  assert.match(patched,/const CONVERSATION_VERSION='1\.0'/);
  assert.match(patched,/const MAX_HISTORY=10/);
  assert.match(patched,/const MAX_HISTORY_CHARS=8000/);
  assert.match(patched,/sessionStorage/);
  assert.match(patched,/data-ai-clear/);
  assert.match(patched,/Limpiar conversación/);
  assert.match(patched,/professorConversationVersion:CONVERSATION_VERSION/);
  assert.equal(mod.patchAi(patched),patched);
});

test('la clave aísla idioma y entrada',()=>{
  const api=runtimeApi(mod.patchAi(baseAi()));
  const en1=api.conversationKey({language:'ingles',code:'MLS-X-0001'},{slug:'ingles'});
  const es1=api.conversationKey({language:'espanol-guatemala',code:'MLS-X-0001'},{slug:'espanol-guatemala'});
  const en2=api.conversationKey({language:'ingles',code:'MLS-X-0002'},{slug:'ingles'});
  assert.notEqual(en1,es1);
  assert.notEqual(en1,en2);
  assert.match(en1,/ingles:MLS-X-0001$/);
});

test('historial queda acotado por mensajes y caracteres',()=>{
  const api=runtimeApi(mod.patchAi(baseAi()));
  const many=Array.from({length:14},(_,i)=>({role:i%2?'assistant':'user',content:`m${i} `+'x'.repeat(200)}));
  const bounded=api.boundedHistory(many);
  assert.equal(bounded.length,10);
  assert.equal(bounded.at(-1).content,many.at(-1).content);
  assert.ok(bounded.reduce((n,m)=>n+m.content.length,0)<=8000);
  const huge=api.boundedHistory([{role:'assistant',content:'z'.repeat(9000)}]);
  assert.equal(huge.length,1);
  assert.equal(huge[0].content.length,8000);
});

test('no añade persistencia backend ni localStorage',()=>{
  const patched=mod.patchAi(baseAi());
  assert.doesNotMatch(patched,/localStorage/);
  assert.doesNotMatch(patched,/\/api\/.*conversation|D1|wiki_/i);
  assert.match(patched,/sessionStorageSafe/);
  assert.match(patched,/clearSession\(entry,meta\)/);
});
