'use strict';

const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const test=require('node:test');
const assert=require('node:assert/strict');
const {patchSearch}=require('../scripts/habilitar busqueda full text.js');
const {patchSemanticSearch,MARKER}=require('../scripts/habilitar busqueda semantica.js');

const archive='MASTER LANGUAGE SYSTEM REVISION 32 BUNDLE.tar.gz';
function shellSearch(){return execFileSync('tar',['-xOzf',archive,'public/js/search.js'],{encoding:'utf8'})}

test('semantic patch layers after canonical full-text and keeps lexical fallback',()=>{
  const lexical=patchSearch(shellSearch());
  const hybrid=patchSemanticSearch(lexical);
  assert.ok(hybrid.includes(MARKER));
  assert.match(hybrid,/semanticQueryVector/);
  assert.match(hybrid,/semanticTop/);
  assert.match(hybrid,/loadFullTextIndex/);
  assert.match(hybrid,/catch\(error\)\{console\.warn\("MLS semantic manifest fallback"/);
  assert.match(hybrid,/Búsqueda inteligente: contenido completo \+ significado/);
  assert.match(hybrid,/id="deepCheck" checked/);
  assert.equal(patchSemanticSearch(hybrid),hybrid);
});

test('semantic search remains language-first before loading semantic indexes',()=>{
  const hybrid=patchSemanticSearch(patchSearch(shellSearch()));
  assert.match(hybrid,/const slugs=lang\?\[lang\]:MLS_META\.map\(m=>m\.slug\)/);
  assert.match(hybrid,/loadSemanticIndex\(slug,manifest\)/);
  assert.match(hybrid,/fullTextPasses\(r,lang,level,part,chapter\)/);
  assert.match(hybrid,/rawLang==='all'\?'':rawLang/);
});

test('semantic query endpoint uses only Workers AI bge-m3 and no external provider',()=>{
  const worker=fs.readFileSync('MLS R32 OVERLAY/index.js','utf8');
  assert.match(worker,/MLS_SEMANTIC_EMBEDDING_MODEL = "@cf\/baai\/bge-m3"/);
  assert.match(worker,/url\.pathname === "\/api\/search\/embedding"/);
  assert.match(worker,/env\.AI\.run\(MLS_SEMANTIC_EMBEDDING_MODEL/);
  assert.match(worker,/semanticUnavailable: true/);
  assert.doesNotMatch(worker,/openai\.com.*search\/embedding/i);
  assert.doesNotMatch(worker,/anthropic.*search\/embedding/i);
});

test('semantic generation is never part of normal predeploy',()=>{
  const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
  assert.match(pkg.scripts.predeploy,/habilitar busqueda semantica\.js/);
  assert.doesNotMatch(pkg.scripts.predeploy,/generar indice semantico\.js/);
  assert.equal(pkg.scripts['semantic:generate'],"node 'scripts/generar indice semantico.js'");
});


test('semantic manifest gate prevents query embeddings until a complete index is published',()=>{
  const hybrid=patchSemanticSearch(patchSearch(shellSearch()));
  assert.match(hybrid,/loadSemanticManifest/);
  assert.match(hybrid,/data\/semantic\/manifest\.json/);
  assert.match(hybrid,/if\(response\.status===404\)return null/);
  assert.match(hybrid,/const semanticSlugs=manifest\?slugs\.filter/);
  assert.match(hybrid,/if\(semanticSlugs\.length\)\{/);
  const manifestPos=hybrid.indexOf('const manifest=await loadSemanticManifest()');
  const queryPos=hybrid.indexOf('const queryVector=await semanticQueryVector(q)');
  assert.ok(manifestPos>=0&&queryPos>manifestPos);
});

test('semantic publish step is part of predeploy but generation is not',()=>{
  const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
  assert.match(pkg.scripts.predeploy,/publicar indice semantico\.js/);
  assert.doesNotMatch(pkg.scripts.predeploy,/generar indice semantico\.js/);
});


test('semantic query whitespace normalization keeps the real whitespace regex',()=>{
  const hybrid=patchSemanticSearch(patchSearch(shellSearch()));
  assert.match(hybrid,/replace\(\/\\s\+\/g,' '\)/);
  assert.doesNotMatch(hybrid,/replace\(\/s\+\/g,' '\)/);
});
