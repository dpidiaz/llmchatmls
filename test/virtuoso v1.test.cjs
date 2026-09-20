'use strict';

const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const test=require('node:test');
const assert=require('node:assert/strict');
const {patchWorker,patchNavigation,BACKEND_BLOCK,API_MARKER}=require('../scripts/habilitar virtuoso.js');

const archive='MASTER LANGUAGE SYSTEM REVISION 32 BUNDLE.tar.gz';
function shellHome(){return execFileSync('tar',['-xOzf',archive,'public/index.html'],{encoding:'utf8'})}

test('Virtuoso navigation patch attaches to the real search navigation link',()=>{
  const original=shellHome();
  const patched=patchNavigation(original);
  assert.match(patched,/href=["']\/virtuoso["']/);
  assert.match(patched,/Virtuoso/);
  assert.equal(patchNavigation(patched),patched);
});

test('Virtuoso backend routes page and API through the current worker',()=>{
  const worker=fs.readFileSync('MLS R32 OVERLAY/index.js','utf8');
  const html=fs.readFileSync('MLS R32 OVERLAY/virtuoso.html','utf8');
  const patched=patchWorker(worker,html);
  assert.ok(patched.includes(API_MARKER));
  assert.match(patched,/url\.pathname === "\/api\/virtuoso"/);
  assert.match(patched,/url\.pathname === "\/virtuoso"/);
  assert.match(patched,/handleVirtuosoRequest\(request, env\)/);
  assert.equal(patchWorker(patched,html),patched);
});

test('Virtuoso validates candidates against the canonical language catalog before Gemma',()=>{
  assert.match(BACKEND_BLOCK,/VIRTUOSO_MAX_CANDIDATES = 12/);
  assert.match(BACKEND_BLOCK,/VIRTUOSO_MAX_RECOMMENDATIONS = 5/);
  assert.match(BACKEND_BLOCK,/\/data\/canonical\/catalog\//);
  assert.match(BACKEND_BLOCK,/catalog\.entries/);
  assert.match(BACKEND_BLOCK,/code\.startsWith\(language\.prefix/);
  assert.match(BACKEND_BLOCK,/const allowed = new Map\(validated\.map/);
  assert.match(BACKEND_BLOCK,/if \(!entry \|\| used\.has\(code\)\) continue/);
  assert.doesNotMatch(BACKEND_BLOCK,/WIKI_DB/);
  assert.doesNotMatch(BACKEND_BLOCK,/wiki_articles/);
});

test('Virtuoso uses fixed Gemma 4 only for reranking, disables thinking, and degrades deterministically',()=>{
  assert.match(BACKEND_BLOCK,/VIRTUOSO_MODEL_ID = "@cf\/google\/gemma-4-26b-a4b-it"/);
  assert.match(BACKEND_BLOCK,/env\.AI\.run\(VIRTUOSO_MODEL_ID/);
  assert.doesNotMatch(BACKEND_BLOCK,/env\.AI\.run\(MODEL_ID/);
  assert.match(BACKEND_BLOCK,/chat_template_kwargs: \{ enable_thinking: false \}/);
  assert.match(BACKEND_BLOCK,/stream: false/);
  assert.match(BACKEND_BLOCK,/model: VIRTUOSO_MODEL_ID/);
  assert.match(BACKEND_BLOCK,/Virtuoso Gemma fallback/);
  assert.match(BACKEND_BLOCK,/virtuosoFallback/);
  assert.match(BACKEND_BLOCK,/deepLink: "\/#entry=" \+ entry\.code/);
  assert.match(BACKEND_BLOCK,/Solo puedes recomendar códigos de la lista CANÓNICA/);
});

test('Virtuoso page uses the same lexical and semantic indexes and requires target language',()=>{
  const html=fs.readFileSync('MLS R32 OVERLAY/virtuoso.html','utf8');
  assert.match(html,/id="language" required/);
  assert.match(html,/Selecciona un idioma/);
  assert.match(html,/\/data\/search\//);
  assert.match(html,/\/data\/semantic\/manifest\.json/);
  assert.match(html,/\/api\/search\/embedding/);
  assert.match(html,/\/api\/virtuoso/);
  assert.match(html,/slice\(0,12\)/);
  assert.match(html,/meta\.language!==slug/);
  assert.doesNotMatch(html,/>Todos los idiomas</);
});

test('Virtuoso remains orientation, not Professor IA',()=>{
  const html=fs.readFileSync('MLS R32 OVERLAY/virtuoso.html','utf8');
  assert.match(html,/Profesor IA sigue siendo quien enseña y practica/);
  assert.match(BACKEND_BLOCK,/Tu función es orientar dentro de la biblioteca, no enseñar el tema ni sustituir al Profesor IA/);
});
