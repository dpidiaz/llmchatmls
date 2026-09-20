'use strict';

const {execFileSync}=require('node:child_process');
const test=require('node:test');
const assert=require('node:assert/strict');
const nav=require('../scripts/habilitar navegacion ux.js');
const virtuoso=require('../scripts/habilitar virtuoso.js');

const archive='MASTER LANGUAGE SYSTEM REVISION 32 BUNDLE.tar.gz';

function shell(path){
  return execFileSync('tar',['-xOzf',archive,path],{encoding:'utf8'});
}

test('Navigation Orientation keeps the primary navigation contract intact',()=>{
  const original=shell('public/index.html');
  const patched=nav.patchHome(original);

  assert.match(patched,/data-nav="home"[^>]*>⌂ Inicio<\/a>/);
  assert.match(patched,/data-nav="search"[^>]*>⌕ Buscar<\/a>/);
  assert.match(patched,/data-nav="themes"[^>]*>☷ Temas<\/a>/);
  assert.match(patched,/<div class="side-title">Idiomas<\/div>/);
  assert.match(patched,/<summary>Herramientas<\/summary>/);
  assert.doesNotMatch(patched,/<summary>Más opciones<\/summary>/);
  assert.match(patched,/aria-label="Abrir herramientas"/);
  assert.equal(nav.patchHome(patched),patched);
});

test('Navigation Orientation clarifies Buscar versus Explorar on Home without adding features',()=>{
  const original=shell('public/js/app.js');
  const patched=nav.patchApp(original);

  assert.match(patched,/Busca lo que quieres aprender o explora un idioma\. Abre cualquier entrada y lee a tu ritmo\./);
  assert.match(patched,/<h2 class="section-title">Explora por idioma<\/h2>/);
  assert.match(patched,/↺ Seguir leyendo<\/button>/);
  assert.equal(nav.patchApp(patched),patched);
});

test('Navigation Orientation composes safely after the existing Virtuoso navigation patch',()=>{
  const home=nav.patchHome(virtuoso.patchNavigation(shell('public/index.html')));
  const app=nav.patchApp(virtuoso.patchAppNavigation(shell('public/js/app.js')));

  const routed=[...home.matchAll(/href=(["'])\/virtuoso\1/gi)];
  assert.ok(routed.length>=3,'Buscar global debe seguir abriendo Virtuoso');
  assert.doesNotMatch(home,/href=(["'])#search[^"']*\1/i);
  assert.match(app,/onclick="location\.href='\/virtuoso'">⌕ Buscar<\/button>/);
  assert.doesNotMatch(app,/class="btn primary big-action" onclick="location\.hash='#search'"/);
});

test('Navigation Orientation does not appropriate local language search behavior',()=>{
  const patched=nav.patchApp(shell('public/js/app.js'));
  assert.match(patched,/onclick="location\.hash='#search\?lang=\$\{slug\}'">⌕ Buscar aquí<\/button>/);
});

test('Navigation Orientation preserves the secondary tool destinations',()=>{
  const patched=nav.patchHome(shell('public/index.html'));
  for(const route of ['#az','#map','#compare','#favorites','#recent','#settings']){
    assert.ok(patched.includes('href="'+route+'"'),'falta herramienta '+route);
  }
});
