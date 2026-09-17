'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const states=require('../MLS R32 OVERLAY/profesor ia estados visuales.js');
const installer=require('../scripts/habilitar estados visuales profesor ia.js');

const helperPath=path.join(__dirname,'..','MLS R32 OVERLAY','profesor ia estados visuales.js');

test('clasifica los siete estados visuales del contrato',()=>{
  assert.equal(states.stateFromSnapshot({}),'ready');
  assert.equal(states.stateFromSnapshot({busy:'1'}),'thinking');
  assert.equal(states.stateFromSnapshot({busy:'1',streamingText:'Respuesta parcial'}),'responding');
  assert.equal(states.stateFromSnapshot({statusClass:'ai-status error',statusText:'Necesitas conexión a Internet'}),'offline');
  assert.equal(states.stateFromSnapshot({statusClass:'ai-status error',statusText:'Se alcanzó temporalmente el límite disponible',hasRetry:true}),'quota');
  assert.equal(states.stateFromSnapshot({statusClass:'ai-status error',statusText:'No recibí respuesta',hasRetry:true}),'retry');
  assert.equal(states.stateFromSnapshot({statusClass:'ai-status error',statusText:'Error temporal'}),'temporary-error');
});

test('cuota y offline tienen prioridad sobre retry genérico',()=>{
  assert.equal(states.stateFromSnapshot({statusClass:'error',statusText:'quota exceeded',hasRetry:true}),'quota');
  assert.equal(states.stateFromSnapshot({statusClass:'error',statusText:'Revisa tu conexión',hasRetry:true}),'offline');
});

test('loading sin busy sigue siendo thinking y streaming con busy responding',()=>{
  assert.equal(states.stateFromSnapshot({statusClass:'ai-status loading'}),'thinking');
  assert.equal(states.stateFromSnapshot({busy:true,streamingText:'hola'}),'responding');
});

test('estilos mantienen superficies claras y retry táctil',()=>{
  assert.match(states.STYLE_TEXT,/background:#eef5f8/i);
  assert.match(states.STYLE_TEXT,/background:#fff1ed/i);
  assert.match(states.STYLE_TEXT,/\[data-ai-retry\]\{min-height:44px/);
  assert.doesNotMatch(states.STYLE_TEXT,/background:\s*#000|color:\s*#fff/i);
});

test('módulo no introduce fetch almacenamiento ni operaciones editoriales',()=>{
  const source=fs.readFileSync(helperPath,'utf8');
  assert.doesNotMatch(source,/\bfetch\s*\(/);
  assert.doesNotMatch(source,/localStorage|sessionStorage|D1|wiki_|publish|FIFO|AUTOOPT|materialize/i);
  assert.match(source,/aria-busy/);
  assert.match(source,/MutationObserver/);
});

test('instalador de build es idempotente',()=>{
  const helper=fs.readFileSync(helperPath,'utf8');
  const base="(()=>{window.MLS={aiTutor:{open(){}}};})();\n";
  const once=installer.patchAi(base,helper),twice=installer.patchAi(once,helper);
  assert.match(once,/MLSProfessorVisualStates/);
  assert.equal(twice,once);
});
