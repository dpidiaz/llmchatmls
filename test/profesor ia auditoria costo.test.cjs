'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

function read(...parts){return fs.readFileSync(path.join(__dirname,'..',...parts),'utf8');}
function professorOverlayFiles(){const dir=path.join(__dirname,'..','MLS R32 OVERLAY');return fs.readdirSync(dir).filter(name=>/^profesor ia .*\.js$/i.test(name)).map(name=>path.join(dir,name));}

test('presupuesto de contexto del Profesor IA queda acotado',()=>{
  const source=read('scripts','habilitar optimizacion prompt profesor ia.js');
  assert.match(source,/MAX_CLIENT_CONTEXT_CHARS=11500/);
  assert.match(source,/slice\(0,MAX_CLIENT_CONTEXT_CHARS\)/);
});

test('historial conversacional queda limitado a 10 mensajes y 8000 caracteres',()=>{
  const source=read('scripts','habilitar contexto conversacional profesor ia.js');
  assert.match(source,/MAX_HISTORY=10/);
  assert.match(source,/MAX_HISTORY_CHARS=8000/);
  assert.match(source,/sessionStorage/);
});

test('capas del Profesor no añaden llamadas de red propias',()=>{
  for(const file of professorOverlayFiles()){
    const source=fs.readFileSync(file,'utf8');
    assert.doesNotMatch(source,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket/,path.basename(file));
  }
});

test('materialización permanece Cloudflare only y sin proveedores externos configurados',()=>{
  const source=read('scripts','usar Cloudflare.js');
  assert.match(source,/externalProvidersConfigured: \[\]/);
  assert.match(source,/cloudflareOnly: true/);
  assert.match(source,/approvedExternalModels: \{\}/);
  assert.doesNotMatch(source,/openai|anthropic/i);
});

test('observabilidad no introduce costo de servidor',()=>{
  const source=read('MLS R32 OVERLAY','profesor ia observabilidad.js');
  assert.doesNotMatch(source,/fetch\(|D1|api\//i);
});
