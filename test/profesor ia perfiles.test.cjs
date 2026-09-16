'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const profiles=require('../MLS R32 OVERLAY/profesor ia perfiles.js');
const installer=require('../scripts/habilitar profesor ia perfiles.js');

test('existen exactamente los diez perfiles canónicos',()=>{
  const expected=['espanol-guatemala','ingles','portugues','italiano','frances','aleman','japones','chino-taiwan','coreano','ruso'];
  assert.deepEqual(Object.keys(profiles.PROFILES),expected);
  assert.equal(profiles.VERSION,'1.0');
});

test('español de Guatemala preserva voseo sin imponerlo',()=>{
  const text=profiles.directiveFor('espanol-guatemala');
  assert.match(text,/voseo guatemalteco como legítimo/i);
  assert.match(text,/No fuerces voseo/i);
  assert.match(text,/vos, tú y usted/i);
});

test('portugués permanece brasileño y separado de europeo',()=>{
  const text=profiles.directiveFor('portugues');
  assert.match(text,/portugués de Brasil/i);
  assert.match(text,/no sustituyas formas brasileñas por portugués europeo/i);
});

test('chino de Taiwán conserva tradicionales y no simplifica',()=>{
  const text=profiles.directiveFor('chino-taiwan');
  assert.match(text,/caracteres tradicionales/i);
  assert.match(text,/No conviertas silenciosamente a caracteres simplificados/i);
  assert.match(text,/Zhuyin o pinyin/i);
});

test('japonés, coreano y ruso conservan escritura canónica',()=>{
  assert.match(profiles.directiveFor('japones'),/kanji y kana como escritura principal/i);
  assert.match(profiles.directiveFor('japones'),/Rōmaji es apoyo opcional y limitado/i);
  assert.match(profiles.directiveFor('coreano'),/Hangul como escritura principal/i);
  assert.match(profiles.directiveFor('coreano'),/romanización es apoyo opcional y limitado/i);
  assert.match(profiles.directiveFor('ruso'),/cirílico como escritura principal/i);
  assert.match(profiles.directiveFor('ruso'),/transliteración es solo apoyo puntual/i);
});

test('núcleo común conserva enciclopedia y permite preguntas vecinas',()=>{
  const text=profiles.directiveFor('ingles');
  assert.match(text,/enciclopedia lingüística, no como un curso/i);
  assert.match(text,/puedes ampliar conceptos vecinos/i);
  assert.match(text,/No impongas ejercicios, exámenes, repasos, progresión ni tareas/i);
  assert.match(text,/Responde por defecto en español claro/i);
  assert.match(text,/No contradigas silenciosamente la entrada publicada/i);
});

test('perfil desconocido cae a neutral sin inventar variante',()=>{
  const p=profiles.profileFor('idioma-inexistente');
  assert.equal(p.label,'Perfil lingüístico neutral');
  assert.match(profiles.directiveFor('idioma-inexistente'),/No asumas una variante regional no identificada/i);
});

test('augmentEntry no modifica el artículo original y marca versión',()=>{
  const original={language:'chino-taiwan',body:'原文',definition:'定义',plain:{lead:'说明'}};
  const out=profiles.augmentEntry(original,{slug:'chino-taiwan'});
  assert.equal(original.body,'原文');
  assert.equal(original.plain.lead,'说明');
  assert.equal(out.professorProfileVersion,'1.0');
  assert.match(out.body,/MLS_PROFESSOR_PROFILE 1\.0/);
  assert.match(out.body,/caracteres tradicionales/i);
  assert.match(out.plain.lead,/MLS_PROFESSOR_PROFILE 1\.0/);
});

test('install envuelve Profesor IA una sola vez y entrega perfil correcto',()=>{
  const calls=[];
  const MLS={aiTutor:{open(entry,meta){calls.push({entry,meta});return 'ok';}}};
  assert.equal(profiles.install(MLS),true);
  assert.equal(profiles.install(MLS),false);
  assert.equal(MLS.aiTutor.professorProfileVersion,'1.0');
  assert.equal(MLS.aiTutor.open({language:'portugues',body:'Tema'},{slug:'portugues'}),'ok');
  assert.equal(calls.length,1);
  assert.equal(calls[0].entry.professorProfile.label,'Portugués brasileño');
  assert.equal(calls[0].meta.professorProfileSlug,'portugues');
});

test('instalador agrega helper al ai.js de forma idempotente',()=>{
  const source="(()=>{window.MLS.aiTutor={open(){return true}}})();\n";
  const helper=require('node:fs').readFileSync(require('node:path').join(__dirname,'../MLS R32 OVERLAY/profesor ia perfiles.js'),'utf8');
  const once=installer.patchAi(source,helper),twice=installer.patchAi(once,helper);
  assert.match(once,/MLSProfessorProfiles/);
  assert.equal(twice,once);
  assert.match(once,/Profesor IA: perfiles lingüísticos especializados/);
});
