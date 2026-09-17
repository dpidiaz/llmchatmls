'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const installer=require('../scripts/habilitar pagina status.js');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'MLS R32 OVERLAY','status.html'),'utf8');
const worker=fs.readFileSync(path.join(root,'MLS R32 OVERLAY','index.js'),'utf8');

test('pagina status usa la API existente sin reemplazarla',()=>{
  assert.match(html,/\/api\/wiki\/status/);
  assert.match(html,/Ver JSON técnico/);
  assert.match(html,/\/api\/wiki\/recent\?limit=5&revision=r32/);
  assert.match(worker,/url\.pathname === "\/api\/wiki\/status"/);
});

test('pagina status es user friendly y responsive',()=>{
  for(const term of ['Status','Actualizar ahora','Capacidad de IA hoy','Enciclopedias','Actividad','Detalles técnicos'])assert.match(html,new RegExp(term,'i'));
  assert.match(html,/viewport-fit=cover/);
  assert.match(html,/@media\(max-width:760px\)/);
  assert.match(html,/setInterval\([^]*60000\)/);
});

test('pagina status respeta minimo tipografico aproximado de 11 pt',()=>{
  assert.doesNotMatch(html,/font-size:\.(?:[0-8]\d?|9[01])rem/);
  assert.match(html,/font-size:\.92rem/);
});

test('javascript embebido de status tiene sintaxis valida',()=>{
  const match=html.match(/<script>([\s\S]*?)<\/script>/i);
  assert.ok(match&&match[1],'No se encontró el script de status.');
  assert.doesNotThrow(()=>new Function(match[1]));
});

test('instalador parchea el worker real y sirve status directamente',()=>{
  const once=installer.patchWorker(worker,html);
  assert.match(once,/MLS STATUS PAGE ROUTE 1\.1/);
  assert.match(once,/url\.pathname === "\/status"/);
  assert.match(once,/url\.pathname === "\/status\/"/);
  assert.match(once,/url\.pathname === "\/status\.html"/);
  assert.match(once,/content-type": "text\/html; charset=utf-8"/);
  assert.match(once,/url\.pathname\.startsWith\("\/api\/wiki\/"\)/);
  assert.doesNotMatch(once,/statusUrl\.pathname = "\/status\.html"/);
  assert.equal(installer.patchWorker(once,html),once);
});
