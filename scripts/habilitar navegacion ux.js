'use strict';

const fs=require('node:fs');

const HOME='public/index.html';
const APP='public/js/app.js';

const HOME_REPLACEMENTS=[
  ['<summary>Más opciones</summary>','<summary>Herramientas</summary>'],
  ['aria-label="Abrir más opciones"','aria-label="Abrir herramientas"']
];

const APP_REPLACEMENTS=[
  [
    '<h1>Gramática de 10 idiomas</h1><p>Busca un tema. Abre cualquier entrada. Lee a tu ritmo.</p>',
    '<h1>Gramática de 10 idiomas</h1><p>Busca lo que quieres aprender o explora un idioma. Abre cualquier entrada y lee a tu ritmo.</p>'
  ],
  ['<h2 class="section-title">Elige un idioma</h2>','<h2 class="section-title">Explora por idioma</h2>']
];

function replaceContract(source,replacements,label){
  let output=String(source||'');
  for(const [before,after] of replacements){
    if(output.includes(after))continue;
    if(!output.includes(before))throw new Error('Navigation UX: no se encontró '+label+' esperado: '+before);
    output=output.replace(before,after);
  }
  return output;
}

function patchHome(html){
  return replaceContract(html,HOME_REPLACEMENTS,'microcopy de navegación');
}

function patchApp(source){
  return replaceContract(source,APP_REPLACEMENTS,'microcopy de Home');
}

function install(){
  if(!fs.existsSync(HOME)||!fs.existsSync(APP)){
    throw new Error('Navigation UX requiere el shell generado de MLS.');
  }
  fs.writeFileSync(HOME,patchHome(fs.readFileSync(HOME,'utf8')),'utf8');
  fs.writeFileSync(APP,patchApp(fs.readFileSync(APP,'utf8')),'utf8');
}

function main(){
  install();
  console.log('MLS Navigation & Orientation R1 habilitado.');
}

module.exports={HOME,APP,HOME_REPLACEMENTS,APP_REPLACEMENTS,patchHome,patchApp,install};
if(require.main===module)main();
