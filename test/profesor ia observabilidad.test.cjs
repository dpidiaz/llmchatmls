'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const obs=require('../MLS R32 OVERLAY/profesor ia observabilidad.js');
const installer=require('../scripts/habilitar observabilidad profesor ia.js');

test('observabilidad usa solo métricas agregadas permitidas',()=>{
  const meta=obs.metaFrom({language:'ingles',professorQuickAction:{id:'examples'},professorPreferences:{depth:'technical',length:'brief'}},{});
  assert.deepEqual(meta,{language:'ingles',action:'examples',depth:'technical',length:'brief'});
  let stats=obs.blank();
  stats=obs.recordInto(stats,'open',meta);
  stats=obs.recordInto(stats,'request',meta);
  stats=obs.recordInto(stats,'success',meta,1200);
  assert.equal(stats.totals.opens,1);
  assert.equal(stats.totals.requests,1);
  assert.equal(stats.totals.successes,1);
  assert.equal(stats.totals.totalMs,1200);
  assert.equal(obs.averageMs(stats),1200);
  assert.equal(stats.dimensions.language.ingles.successes,1);
});

test('observabilidad no conserva pregunta respuesta título ni código',()=>{
  const stats=obs.recordInto(obs.blank(),'open',obs.metaFrom({language:'ingles',code:'MLS-V01-9999',title:'SECRET TITLE',professorPreferences:{depth:'normal',length:'normal'}},{question:'SECRET QUESTION'}));
  const text=JSON.stringify(stats);
  assert.doesNotMatch(text,/SECRET|MLS-V01-9999|question|title|response|conversation/i);
});

test('claves quedan acotadas y normalizadas',()=>{
  assert.equal(obs.safeKey(' Inglés US / UK ','neutral'),'inglés-us-uk');
  assert.ok(obs.safeKey('x'.repeat(200),'none').length<=40);
});

test('eventos desconocidos no alteran métricas',()=>{
  const before=obs.blank(),after=obs.recordInto(before,'unknown',{language:'ingles'});
  assert.deepEqual(after,before);
});

test('módulo no envía telemetría ni usa backend',()=>{
  const source=fs.readFileSync(path.join(__dirname,'..','MLS R32 OVERLAY','profesor ia observabilidad.js'),'utf8');
  assert.doesNotMatch(source,/fetch\(|XMLHttpRequest|sendBeacon|WebSocket|D1|wiki_|publish|FIFO|AUTOOPT/i);
  assert.match(source,/localStorage/);
});

test('instalador agrega observabilidad una sola vez',()=>{
  const helper=fs.readFileSync(path.join(__dirname,'..','MLS R32 OVERLAY','profesor ia observabilidad.js'),'utf8');
  const base='window.MLS={aiTutor:{open:function(){}}};\n';
  const once=installer.patchAi(base,helper);
  assert.match(once,/MLSProfessorObservability/);
  assert.equal(installer.patchAi(once,helper),once);
});
