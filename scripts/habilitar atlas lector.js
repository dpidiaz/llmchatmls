'use strict';
const fs=require('node:fs');
const path=require('node:path');

const helperPath=path.join(__dirname,'..','MLS R32 OVERLAY','atlas lector helpers.js');
function atlasHelpers(){return fs.readFileSync(helperPath,'utf8').trimEnd()+'\n';}

function patchReader(source){
  if(source.includes('id="mlsAtlasDialog"'))return source;
  const pageMarker='  async function page(code){';
  if(!source.includes(pageMarker))throw new Error('No se encontró el punto de inserción de helpers del atlas.');
  source=source.replace(pageMarker,atlasHelpers()+pageMarker);

  const relatedMarker='    const relatedHTML=related.length';
  if(!source.includes(relatedMarker))throw new Error('No se encontró el bloque de resultados relacionados del lector.');
  source=source.replace(relatedMarker,'    const atlasHTML=atlasBuild(catalog,e,m);\n'+relatedMarker);

  const mobileMarker='      <details class="mobile-local-index"><summary>Ver temas de este capítulo</summary><div class="local-entry-list">${chapterIndex}</div></details>';
  if(!source.includes(mobileMarker))throw new Error('No se encontró el índice móvil del lector.');
  source=source.replace(mobileMarker,mobileMarker+'\n      ${atlasHTML}');

  const actions='<div class="reader-actions simple-actions"><button class="btn primary" id="listenBtn">🔊 Escuchar</button><button class="btn ai-entry-btn" id="aiExplainBtn">✨ Profesor IA</button><button class="btn" id="favBtn">${fav?\'★ Guardado\':\'☆ Guardar\'}</button></div>';
  if(!source.includes(actions))throw new Error('No se encontró la fila de acciones del lector.');
  source=source.replace(actions,'<div class="reader-actions simple-actions"><button class="btn primary" id="listenBtn">🔊 Escuchar</button><button class="btn ai-entry-btn" id="aiExplainBtn">✨ Profesor IA</button><button class="btn atlas-open-btn" id="mlsAtlasOpen">◫ Atlas</button><button class="btn" id="favBtn">${fav?\'★ Guardado\':\'☆ Guardar\'}</button></div>');

  const bindMarker="    document.querySelectorAll('[data-scroll]').forEach(button=>{";
  if(!source.includes(bindMarker))throw new Error('No se encontró el enlace de eventos del lector.');
  source=source.replace(bindMarker,'    atlasBind();\n'+bindMarker);
  return source;
}

function main(){
  const target='public/js/reader.js';
  const source=fs.readFileSync(target,'utf8');
  const patched=patchReader(source);
  fs.writeFileSync(target,patched);
  console.log('Atlas de navegación del lector canónico habilitado.');
}
module.exports={patchReader,atlasHelpers};
if(require.main===module)main();
