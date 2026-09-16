'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const quick=require('../MLS R32 OVERLAY/profesor ia acciones rapidas.js');
const installer=require('../scripts/habilitar acciones rapidas profesor ia.js');

const LANGUAGES=['espanol-guatemala','ingles','portugues','italiano','frances','aleman','japones','chino-taiwan','coreano','ruso'];

test('acciones rápidas versión 1.0 y núcleo común estable',()=>{
  assert.equal(quick.VERSION,'1.0');
  assert.ok(quick.COMMON.length>=10);
  for(const id of ['simplify','deepen','examples','when','compare','difference','mistakes','summary','alternative','pronunciation'])assert.ok(quick.COMMON.some(x=>x.id===id),id);
});

test('las diez enciclopedias tienen acciones específicas aisladas',()=>{
  assert.deepEqual(Object.keys(quick.SPECIFIC),LANGUAGES);
  for(const slug of LANGUAGES){
    assert.ok(quick.SPECIFIC[slug].length>=3,slug);
    const ids=quick.SPECIFIC[slug].map(x=>x.id);
    assert.equal(new Set(ids).size,ids.length,slug+' ids duplicados');
  }
});

test('acciones específicas no contaminan otros idiomas',()=>{
  assert.ok(quick.actionsFor('espanol-guatemala').some(x=>x.id==='gt-voseo'));
  assert.ok(!quick.actionsFor('portugues').some(x=>x.id==='gt-voseo'));
  assert.ok(quick.actionsFor('japones').some(x=>x.id==='ja-reading'));
  assert.ok(!quick.actionsFor('chino-taiwan').some(x=>x.id==='ja-reading'));
  assert.ok(quick.actionsFor('chino-taiwan').some(x=>x.id==='zh-zhuyin'));
  assert.ok(!quick.actionsFor('coreano').some(x=>x.id==='zh-zhuyin'));
  assert.ok(quick.actionsFor('ruso').some(x=>x.id==='ru-stress'));
});

test('invariantes lingüísticos críticos aparecen en instrucciones específicas',()=>{
  assert.match(quick.findAction('gt-voseo','espanol-guatemala').instruction,/voseo guatemalteco/i);
  assert.match(quick.findAction('pt-br-use','portugues').instruction,/portugués de Brasil/i);
  assert.match(quick.findAction('ja-reading','japones').instruction,/kanji y kana/i);
  assert.match(quick.findAction('zh-tones','chino-taiwan').instruction,/caracteres tradicionales/i);
  assert.match(quick.findAction('ko-batchim','coreano').instruction,/Hangul/i);
  assert.match(quick.findAction('ru-stress','ruso').instruction,/cirílico/i);
  assert.match(quick.findAction('de-order','aleman').instruction,/Standarddeutsch/i);
});

test('directiveFor protege perfil, variante, escritura y naturaleza enciclopédica',()=>{
  const action=quick.findAction('examples','japones');
  const text=quick.directiveFor(action,'japones','');
  assert.match(text,/MLS_PROFESSOR_QUICK_ACTION 1\.0/);
  assert.match(text,/perfil lingüístico activo/i);
  assert.match(text,/variante canónica/i);
  assert.match(text,/sistema de escritura/i);
  assert.match(text,/No modifiques el artículo publicado/i);
  assert.match(text,/curso, ejercicio o examen/i);
});

test('comparación incorpora el concepto indicado por el usuario',()=>{
  const action=quick.findAction('compare','ingles');
  assert.equal(action.needsDetail,true);
  const text=quick.directiveFor(action,'ingles','past perfect');
  assert.match(text,/past perfect/);
});

test('augmentEntry clona sin mutar y añade solo la acción elegida',()=>{
  const original={language:'chino-taiwan',body:'原文',plain:{lead:'說明'}};
  const out=quick.augmentEntry(original,{slug:'chino-taiwan'},'zh-zhuyin','');
  assert.equal(original.body,'原文');
  assert.equal(original.plain.lead,'說明');
  assert.notEqual(out,original);
  assert.equal(out.professorQuickActionsVersion,'1.0');
  assert.equal(out.professorQuickAction.id,'zh-zhuyin');
  assert.match(out.body,/zhuyin/i);
  assert.match(out.plain.lead,/MLS_PROFESSOR_QUICK_ACTION 1\.0/);
});

test('idioma desconocido usa solo núcleo común y no inventa reglas regionales',()=>{
  const actions=quick.actionsFor('idioma-inexistente');
  assert.equal(actions.length,quick.COMMON.length);
  assert.ok(!actions.some(x=>/gt-|pt-|ja-|zh-|ko-|ru-/.test(x.id)));
});

test('instalador agrega helper y botón de forma idempotente',()=>{
  const fs=require('node:fs');
  const helper=fs.readFileSync(require('node:path').join(__dirname,'../MLS R32 OVERLAY/profesor ia acciones rapidas.js'),'utf8');
  const ai="(()=>{window.MLS.aiTutor={open(){return true}}})();\n";
  const aiOnce=installer.patchAi(ai,helper),aiTwice=installer.patchAi(aiOnce,helper);
  assert.match(aiOnce,/MLSProfessorQuickActions/);
  assert.equal(aiTwice,aiOnce);

  const reader=`<button class="btn ai-entry-btn" id="aiExplainBtn">✨ Profesor IA</button>\n<script>\ndocument.getElementById('aiExplainBtn').onclick=()=>MLS.aiTutor?.open(activeTutorEntry,m);\ndocument.getElementById('aiPrefsBtn').onclick=()=>window.MLSProfessorPreferences?.openSettingsDialog?.(m);\n</script>`;
  const once=installer.patchReader(reader),twice=installer.patchReader(once);
  assert.match(once,/id="aiQuickBtn"/);
  assert.match(once,/MLSProfessorQuickActions/);
  assert.equal(twice,once);
});
