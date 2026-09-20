'use strict';

const fs=require('node:fs');

const APP='public/js/app.js';
const ORIGINAL='<button class="btn" onclick="location.hash=\'#entry=${recent.code}\'">↺ Seguir leyendo</button>';
const PATCHED='<button class="btn" onclick="window.MLS?.reader?.requestResume(\'${recent.code}\');location.hash=\'#entry=${recent.code}\'">↺ Seguir leyendo</button>';

function patchContinueReading(source){
  source=String(source);
  if(source.includes(PATCHED))return source;
  if(!source.includes(ORIGINAL))throw new Error('No se encontró el CTA Seguir leyendo esperado.');
  return source.replace(ORIGINAL,PATCHED);
}

function install(){
  if(!fs.existsSync(APP))throw new Error('El build R32 no contiene public/js/app.js.');
  fs.writeFileSync(APP,patchContinueReading(fs.readFileSync(APP,'utf8')),'utf8');
}

function main(){install();console.log('Continuidad de lectura habilitada.');}

module.exports={ORIGINAL,PATCHED,patchContinueReading,install};
if(require.main===module)main();
