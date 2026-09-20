'use strict';

const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');
const compat=require('../scripts/generar datos canonicos compatibles.js');

test('canonical compatibility helpers derive readable metadata from R32 markdown',()=>{
  const md='#### En pocas palabras\n\nUna definición canónica clara.\n\n#### Ejemplos\n\n1. **Ejemplo real.**';
  assert.equal(compat.firstParagraph(md),'Una definición canónica clara.');
  assert.match(compat.firstExample(md),/Ejemplo real/);
  assert.equal(compat.toRoman(25),'XXV');
});

test('predeploy replaces extracted legacy data after canonical runtime build',()=>{
  const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
  const p=pkg.scripts.predeploy;
  const runtime=p.indexOf("node 'scripts/generar runtime canonico.js'");
  const compatStep=p.indexOf("node 'scripts/generar datos canonicos compatibles.js'");
  assert.ok(runtime>=0&&compatStep>runtime,'El reemplazo canónico debe ejecutarse después del runtime canónico.');
});

test('worker editorial no references legacy wiki-seeds path',()=>{
  const overlay=fs.readFileSync('MLS R32 OVERLAY/index.js','utf8');
  assert.doesNotMatch(overlay,/\/data\/wiki-seeds\//);
  assert.match(overlay,/\/data\/canonical\/seeds\//);
});

test('staging targets derive from GitHub canonical content, not legacy seeds',()=>{
  const source=fs.readFileSync('scripts/generar snapshot staging.js','utf8');
  assert.match(source,/path\.join\(root, 'content'\)/);
  assert.doesNotMatch(source,/public', 'data', 'wiki-seeds/);
});

test('canonical compatibility build deletes legacy wiki-seeds and rewrites index and volumes',()=>{
  const source=fs.readFileSync('scripts/generar datos canonicos compatibles.js','utf8');
  assert.match(source,/fs\.rmSync\(oldSeedsRoot/);
  assert.match(source,/public\/data\/wiki-seeds sobrevivió/);
  assert.match(source,/window\.MLS_META=/);
  assert.match(source,/window\.MLS_DATA=/);
});
