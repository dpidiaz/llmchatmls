'use strict';

const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const test=require('node:test');
const assert=require('node:assert/strict');
const {patchWorker,patchNavigation,patchAppNavigation,BACKEND_BLOCK,API_MARKER}=require('../scripts/habilitar virtuoso.js');

const archive='MASTER LANGUAGE SYSTEM REVISION 32 BUNDLE.tar.gz';
function shellHome(){return execFileSync('tar',['-xOzf',archive,'public/index.html'],{encoding:'utf8'})}
function shellApp(){return execFileSync('tar',['-xOzf',archive,'public/js/app.js'],{encoding:'utf8'})}

test('all public Buscar entry points open Virtuoso without exposing a separate Virtuoso nav item',()=>{
  const original=shellHome();
  const searchLinks=[...original.matchAll(/<a\b[^>]*href=(["'])#search[^"']*\1[^>]*>[\s\S]*?<\/a>/gi)].map(match=>match[0]);
  assert.ok(searchLinks.length>=3,'se esperan header, sidebar y navegación móvil');
  for(const link of searchLinks)assert.match(link,/Buscar/i);

  const patched=patchNavigation(original);
  const routed=[...patched.matchAll(/<a\b[^>]*href=(["'])\/virtuoso\1[^>]*>[\s\S]*?<\/a>/gi)].map(match=>match[0]);
  const routedBuscar=routed.filter(link=>/Buscar/i.test(link));

  assert.equal(routedBuscar.length,searchLinks.length,'todos los accesos Buscar deben abrir Virtuoso');
  assert.doesNotMatch(patched,/href=(["'])#search[^"']*\1/i);
  assert.doesNotMatch(routed.join('\n'),/>\s*Virtuoso\s*<\/a>/i);
  assert.equal(patchNavigation(patched),patched);
});

test('home hero Buscar CTA opens Virtuoso instead of the old hash search',()=>{
  const original=shellApp();
  assert.match(original,/class="btn primary big-action" onclick="location\.hash='#search'">⌕ Buscar<\/button>/);
  const patched=patchAppNavigation(original);
  assert.match(patched,/class="btn primary big-action" onclick="location\.href='\/virtuoso'">⌕ Buscar<\/button>/);
  assert.doesNotMatch(patched,/class="btn primary big-action" onclick="location\.hash='#search'">⌕ Buscar<\/button>/);
  assert.match(patched,/onclick="location\.hash='#entry=\$\{recent\.code\}'">↺ Seguir leyendo<\/button>/);
  assert.equal(patchAppNavigation(patched),patched);
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
  assert.match(html,/Virtuoso conoce la biblioteca de MLS/);
  assert.match(html,/Profesor IA puede ayudarte a comprenderla y practicarla/);
  assert.match(BACKEND_BLOCK,/Tu función es orientar dentro de la biblioteca, no enseñar el tema ni sustituir al Profesor IA/);
});

test('Virtuoso user-facing copy hides implementation jargon and explains degraded mode in human language',()=>{
  const html=fs.readFileSync('MLS R32 OVERLAY/virtuoso.html','utf8');
  assert.match(html,/te ayuda a encontrar por dónde empezar dentro de la biblioteca/);
  assert.match(html,/Virtuoso no está disponible temporalmente/);
  assert.match(html,/Preparando una selección breve/);
  assert.doesNotMatch(html,/Orientación automática no disponible; se muestran los mejores resultados de la búsqueda híbrida/);
  assert.match(BACKEND_BLOCK,/Coincide con tu consulta dentro de la biblioteca de MLS/);
  assert.match(BACKEND_BLOCK,/Virtuoso no está disponible temporalmente/);
  assert.doesNotMatch(BACKEND_BLOCK,/se muestran los mejores resultados híbridos disponibles/);
});

test('Virtuoso consumes Visual Foundation tokens locally without changing shell navigation',()=>{
  const html=fs.readFileSync('MLS R32 OVERLAY/virtuoso.html','utf8');
  assert.match(html,/--mls-font-sans/);
  assert.match(html,/--mls-surface-canvas-light/);
  assert.match(html,/--mls-radius-xl/);
  assert.match(html,/--mls-control-height/);
  assert.match(html,/--mls-focus-color/);
  assert.match(html,/focus-visible/);
});
