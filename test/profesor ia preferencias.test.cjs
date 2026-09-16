'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const prefs=require('../MLS R32 OVERLAY/profesor ia preferencias.js');
const installer=require('../scripts/habilitar preferencias profesor ia.js');

test('preferencias tienen defaults seguros y normalización cerrada',()=>{
  assert.equal(prefs.VERSION,'1.0');
  assert.deepEqual(prefs.DEFAULTS,{explanationLanguage:'spanish',depth:'normal'});
  assert.deepEqual(prefs.normalize({explanationLanguage:'xx',depth:'extreme'}),prefs.DEFAULTS);
  assert.deepEqual(prefs.normalize({explanationLanguage:'target',depth:'technical'}),{explanationLanguage:'target',depth:'technical'});
});

test('idioma de explicación no altera el idioma objetivo',()=>{
  const spanish=prefs.directiveFor({explanationLanguage:'spanish',depth:'normal'},{name:'Japonés'});
  const target=prefs.directiveFor({explanationLanguage:'target',depth:'normal'},{name:'Japonés'});
  assert.match(spanish,/Explica principalmente en español claro/i);
  assert.match(spanish,/idioma objetivo \(Japonés\)/i);
  assert.match(target,/Explica principalmente en el idioma objetivo \(Japonés\)/i);
  assert.match(target,/no traduzcas innecesariamente al español/i);
  assert.match(target,/no alteran la variante canónica/i);
});

test('profundidad simple normal y técnica son instrucciones distintas',()=>{
  assert.match(prefs.directiveFor({depth:'simple'},{name:'Portugués brasileño'}),/Profundidad simple/i);
  assert.match(prefs.directiveFor({depth:'normal'},{name:'Portugués brasileño'}),/Profundidad normal/i);
  assert.match(prefs.directiveFor({depth:'technical'},{name:'Portugués brasileño'}),/Profundidad técnica/i);
});

test('augmentEntry no muta el artículo y solo añade preferencias a la copia',()=>{
  const original={body:'Tema',plain:{lead:'Inicio'}};
  const out=prefs.augmentEntry(original,{name:'Chino mandarín de Taiwán'},{explanationLanguage:'target',depth:'technical'});
  assert.equal(original.body,'Tema');
  assert.equal(original.plain.lead,'Inicio');
  assert.equal(out.professorPreferencesVersion,'1.0');
  assert.deepEqual(out.professorPreferences,{explanationLanguage:'target',depth:'technical'});
  assert.match(out.body,/MLS_PROFESSOR_PREFERENCES 1\.0/);
  assert.match(out.plain.lead,/Profundidad técnica/i);
});

test('install envuelve aiTutor una sola vez y mantiene metadata',()=>{
  const calls=[];
  const MLS={aiTutor:{open(entry,meta){calls.push({entry,meta});return 'ok';}}};
  assert.equal(prefs.install(MLS),true);
  assert.equal(prefs.install(MLS),false);
  assert.equal(MLS.aiTutor.professorPreferencesVersion,'1.0');
  assert.equal(MLS.aiTutor.open({body:'Tema'},{name:'Francés'}),'ok');
  assert.equal(calls.length,1);
  assert.equal(calls[0].entry.professorPreferencesVersion,'1.0');
  assert.equal(calls[0].meta.professorPreferencesVersion,'1.0');
});

test('instalador agrega preferencias a ai y lector de forma idempotente',()=>{
  const helper=require('node:fs').readFileSync(require('node:path').join(__dirname,'../MLS R32 OVERLAY/profesor ia preferencias.js'),'utf8');
  const ai="(()=>{window.MLS.aiTutor={open(){return true}}})();\n";
  const aiOnce=installer.patchAi(ai,helper),aiTwice=installer.patchAi(aiOnce,helper);
  assert.match(aiOnce,/MLSProfessorPreferences/);
  assert.equal(aiOnce,aiTwice);

  const reader=`<button class="btn ai-entry-btn" id="aiExplainBtn">✨ Profesor IA</button>\ndocument.getElementById('aiExplainBtn').onclick=()=>MLS.aiTutor?.open(activeTutorEntry,m);`;
  const readerOnce=installer.patchReader(reader),readerTwice=installer.patchReader(readerOnce);
  assert.match(readerOnce,/id="aiPrefsBtn"/);
  assert.match(readerOnce,/openSettingsDialog/);
  assert.equal(readerOnce,readerTwice);
});

test('preferencias no contienen lógica de publicación o FIFO',()=>{
  const source=require('node:fs').readFileSync(require('node:path').join(__dirname,'../MLS R32 OVERLAY/profesor ia preferencias.js'),'utf8');
  assert.doesNotMatch(source,/wiki_jobs|wiki_articles|publish|rescue|FIFO|materialize/i);
});
