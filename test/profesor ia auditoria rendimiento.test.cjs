'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const overlay=path.join(__dirname,'..','MLS R32 OVERLAY');
function professorFiles(){return fs.readdirSync(overlay).filter(name=>/^profesor ia .*\.js$/i.test(name)).map(name=>path.join(overlay,name));}

test('capas del Profesor mantienen presupuesto estático razonable',()=>{
  const files=professorFiles(),bytes=files.reduce((sum,file)=>sum+fs.statSync(file).size,0);
  assert.ok(files.length>=8,'faltan capas esperadas del Profesor IA');
  assert.ok(bytes<=262144,`capas del Profesor IA exceden 256 KiB: ${bytes}`);
});

test('capas del Profesor no usan polling permanente',()=>{
  for(const file of professorFiles())assert.doesNotMatch(fs.readFileSync(file,'utf8'),/setInterval\s*\(/,path.basename(file));
});

test('observadores visuales y de métricas se instalan una sola vez por modal',()=>{
  const states=fs.readFileSync(path.join(overlay,'profesor ia estados visuales.js'),'utf8');
  const obs=fs.readFileSync(path.join(overlay,'profesor ia observabilidad.js'),'utf8');
  assert.match(states,/__mlsProfessorVisualStatesObserved/);
  assert.match(obs,/__mlsProfessorObservabilityObserved/);
  assert.match(obs,/__mlsProfessorObservabilityInstalled/);
});

test('service worker usa network first para código y elimina caches anteriores',()=>{
  const source=fs.readFileSync(path.join(overlay,'sw.js'),'utf8');
  assert.match(source,/needsFreshCode/);
  assert.match(source,/networkFirst\(event\.request\)/);
  assert.match(source,/caches\.delete/);
});

test('observabilidad no fuerza renders ni temporizadores periódicos',()=>{
  const source=fs.readFileSync(path.join(overlay,'profesor ia observabilidad.js'),'utf8');
  assert.doesNotMatch(source,/requestAnimationFrame|setInterval\s*\(/);
  assert.match(source,/MutationObserver/);
});
