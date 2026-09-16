'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {patchReader,atlasHelpers}=require('../scripts/habilitar atlas lector.js');

function sampleReader(){return `(()=>{\n  async function page(code){\n    const chapterIndex=chapterEntries.map((x,i)=>\`<a class="local-entry \${x.code===code?'active':''}" href="#entry=\${x.code}"><span>\${String(i+1).padStart(2,'0')}</span><div><strong>\${esc(x.title)}</strong>\${x.target?\`<small>\${esc(x.target)}</small>\`:''}</div></a>\`).join('');\n    MLS.app.innerHTML=\`<details class="mobile-local-index"><summary>Ver temas de este capítulo</summary><div class="local-entry-list">\${chapterIndex}</div></details><div class="reader-actions simple-actions"><button class="btn primary" id="listenBtn">🔊 Escuchar</button><button class="btn ai-entry-btn" id="aiExplainBtn">✨ Profesor IA</button><button class="btn" id="favBtn">\${fav?'★ Guardado':'☆ Guardar'}</button></div>\`;\n    document.getElementById('favBtn').onclick=()=>{if(MLS.state.favorites.includes(code))MLS.state.favorites=MLS.state.favorites.filter(x=>x!==code);else MLS.state.favorites.push(code);MLS.save();page(code)};\n  }\n})();`;}

test('el atlas se inserta en el lector sin sustituir navegación existente',()=>{
  const patched=patchReader(sampleReader());
  assert.match(patched,/id="mlsAtlasDialog"/);
  assert.match(patched,/id="mlsAtlasOpen"/);
  assert.match(patched,/atlasBuild\(vol,e,m\)/);
  assert.match(patched,/atlasBind\(\)/);
  assert.match(patched,/Ver temas de este capítulo/);
  assert.match(patched,/Profesor IA/);
  assert.match(patched,/favBtn/);
});

test('el parche del atlas es idempotente',()=>{
  const once=patchReader(sampleReader());
  const twice=patchReader(once);
  assert.equal(twice,once);
  assert.equal((twice.match(/id="mlsAtlasDialog"/g)||[]).length,1);
});

test('helpers declaran búsqueda, filtro de nivel, capítulos y tema actual',()=>{
  const source=atlasHelpers();
  assert.match(source,/mlsAtlasSearch/);
  assert.match(source,/mlsAtlasLevel/);
  assert.match(source,/data-atlas-chapter/);
  assert.match(source,/atlas-entry active/);
  assert.match(source,/No es una ruta obligatoria/);
  assert.doesNotMatch(source,/examen|quiz|progreso obligatorio|ruta obligatoria de aprendizaje/i);
});
