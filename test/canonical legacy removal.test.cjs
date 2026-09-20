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
  assert.match(overlay,/\/data\/canonical\/editorial-seeds\//);
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


test('compatibility index stays below Cloudflare asset safety margin',()=>{
  const source=fs.readFileSync('scripts/generar datos canonicos compatibles.js','utf8');
  assert.match(source,/MAX_COMPAT_INDEX_BYTES=20\*1024\*1024/);
  assert.match(source,/INDEX_DEFINITION_CHARS=240/);
  assert.match(source,/INDEX_SEARCH_BODY_CHARS=160/);
  assert.match(source,/indexBytes>MAX_COMPAT_INDEX_BYTES/);
});


test('legacy API fallback is permanently disabled and D1 reads only R32',()=>{
  const overlay=fs.readFileSync('MLS R32 OVERLAY/index.js','utf8');
  assert.doesNotMatch(overlay,/const legacy = await wikiStore\(env\)\.getArticle/);
  assert.doesNotMatch(overlay,/provider:\s*["']cloudflare-legacy["']/);
  assert.match(overlay,/WHERE code = \? AND prompt_version = \?/);
  assert.match(overlay,/FROM wiki_articles WHERE prompt_version = \?/);
});

test('editorial fallback data uses ten canonical language catalogs, never per-entry seed assets',()=>{
  const overlay=fs.readFileSync('MLS R32 OVERLAY/index.js','utf8');
  const generator=fs.readFileSync('scripts/generar datos canonicos compatibles.js','utf8');
  assert.match(overlay,/\/data\/canonical\/editorial-seeds\//);
  assert.doesNotMatch(overlay,/\/data\/canonical\/seeds\//);
  assert.match(generator,/editorialSeedsRoot/);
  assert.match(generator,/editorialSeeds\[article\.code\]/);
  assert.match(generator,/editorialSeedCatalogs:ordered\.length/);
  assert.match(generator,/fs\.rmSync\(perEntrySeedsRoot/);
});
