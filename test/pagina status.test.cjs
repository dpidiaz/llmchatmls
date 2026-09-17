'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const installer=require('../scripts/habilitar pagina status.js');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'MLS R32 OVERLAY','status.html'),'utf8');

test('pagina status usa la API existente sin reemplazarla',()=>{
  assert.match(html,/\/api\/wiki\/status/);
  assert.match(html,/Ver JSON técnico/);
  assert.match(html,/\/api\/wiki\/recent\?limit=5&revision=r32/);
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

test('instalador crea ruta limpia status sin tocar api wiki status',()=>{
  const base=`async function x(request,env,url){\n    if (url.pathname.startsWith("/api/wiki/")) {\n      return handleWikiApi(request, env, url);\n    }\n    if (env.ASSETS && typeof env.ASSETS.fetch === "function") return env.ASSETS.fetch(request);\n}`;
  const once=installer.patchWorker(base);
  assert.match(once,/url\.pathname === "\/status"/);
  assert.match(once,/\/status\.html/);
  assert.match(once,/url\.pathname\.startsWith\("\/api\/wiki\/"\)/);
  assert.equal(installer.patchWorker(once),once);
});
