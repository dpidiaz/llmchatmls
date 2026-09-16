'use strict';
const fs=require('node:fs');

const TARGET='public/js/ai.js';
const HELPER='MLS R32 OVERLAY/profesor ia perfiles.js';
const INSTALL_MARKER='MLSProfessorProfiles';

function patchAi(source,helper){
  if(String(source).includes(INSTALL_MARKER))return String(source);
  if(!String(source).trim())throw new Error('El módulo de Profesor IA está vacío.');
  if(!String(helper).includes("const VERSION='1.0'"))throw new Error('No se encontró una versión válida de perfiles del Profesor IA.');
  return String(source).replace(/\s*$/,'')+'\n\n// MLS Profesor IA: perfiles lingüísticos especializados por enciclopedia.\n'+String(helper).trim()+'\n';
}

function main(){
  if(!fs.existsSync(TARGET))throw new Error('No se encontró public/js/ai.js para especializar Profesor IA.');
  if(!fs.existsSync(HELPER))throw new Error('No se encontró la fuente de perfiles del Profesor IA.');
  const source=fs.readFileSync(TARGET,'utf8'),helper=fs.readFileSync(HELPER,'utf8');
  fs.writeFileSync(TARGET,patchAi(source,helper),'utf8');
  console.log('Profesor IA especializado por idioma habilitado.');
}

module.exports={patchAi,INSTALL_MARKER};
if(require.main===module)main();
