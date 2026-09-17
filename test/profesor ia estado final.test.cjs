'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=(...p)=>fs.readFileSync(path.join(root,...p),'utf8');

test('estado final documenta arquitectura completa y límites',()=>{
  const doc=read('MLS R32 EDITORIAL','PROFESOR IA ESTADO FINAL.md');
  for(const term of ['Contexto conversacional','Comparación conceptual','Pronunciación','Observabilidad','Costo','Rendimiento','Matriz de regresión','Límites conocidos','Riesgos técnicos'])assert.match(doc,new RegExp(term,'i'));
  assert.match(doc,/10 mensajes y 8000 caracteres/);
  assert.match(doc,/11500 caracteres/);
  assert.match(doc,/no se envía telemetría/i);
});

test('capas finales críticas existen y declaran versión 1.0',()=>{
  const files=['profesor ia estados visuales.js','profesor ia observabilidad.js','profesor ia preferencias.js','profesor ia pronunciacion.js','profesor ia comparacion conceptual.js'];
  for(const name of files){const source=read('MLS R32 OVERLAY',name);assert.match(source,/VERSION='1\.0'/,name);}
});

test('predeploy instala observabilidad después de estados visuales',()=>{
  const pkg=JSON.parse(read('package.json')),cmd=pkg.scripts.predeploy;
  const states=cmd.indexOf("habilitar estados visuales profesor ia.js"),obs=cmd.indexOf("habilitar observabilidad profesor ia.js");
  assert.ok(states>=0&&obs>states);
});

test('suite global incluye cierre, costo, rendimiento y observabilidad',()=>{
  const cmd=JSON.parse(read('package.json')).scripts['test:chat-editorial'];
  for(const name of ['profesor ia observabilidad.test.cjs','profesor ia auditoria costo.test.cjs','profesor ia auditoria rendimiento.test.cjs','profesor ia estado final.test.cjs'])assert.match(cmd,new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
});
