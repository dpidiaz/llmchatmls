'use strict';
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const assert=require('node:assert/strict');
const {patchReader,atlasHelpers}=require('../scripts/habilitar atlas lector.js');

const readerSource=()=>fs.readFileSync(path.join(__dirname,'..','MLS R32 OVERLAY','reader.js'),'utf8');

test('el atlas se inserta en el lector real sin sustituir navegación existente',()=>{
  const patched=patchReader(readerSource());
  assert.match(patched,/id="mlsAtlasDialog"/);
  assert.match(patched,/id="mlsAtlasOpen"/);
  assert.match(patched,/atlasBuild\(vol,e,m\)/);
  assert.match(patched,/atlasBind\(\)/);
  assert.match(patched,/Ver temas de este capítulo/);
  assert.match(patched,/Profesor IA/);
  assert.match(patched,/favBtn/);
  assert.match(patched,/← Anterior/);
  assert.match(patched,/Siguiente →/);
});

test('el parche del atlas es idempotente',()=>{
  const once=patchReader(readerSource());
  const twice=patchReader(once);
  assert.equal(twice,once);
  assert.equal((twice.match(/id="mlsAtlasDialog"/g)||[]).length,1);
});

test('helpers declaran búsqueda, filtro de nivel, capítulos y tema actual',()=>{
  const source=atlasHelpers();
  assert.match(source,/mlsAtlasSearch/);
  assert.match(source,/mlsAtlasLevel/);
  assert.match(source,/data-atlas-chapter/);
  assert.match(source,/item\.code===e\.code\?'active'/);
  assert.match(source,/No es una ruta obligatoria/);
  assert.doesNotMatch(source,/examen|quiz|progreso obligatorio|ruta obligatoria de aprendizaje/i);
});
