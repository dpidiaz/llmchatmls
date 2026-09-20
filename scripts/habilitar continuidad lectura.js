'use strict';

const fs=require('node:fs');

const APP='public/js/app.js';
const RESUME_CALL="window.MLS?.reader?.requestResume('${recent.code}')";
const CTA_PATTERN=/(<button\b[^>]*\bonclick=")location\.hash='#entry=\$\{recent\.code\}'("[^>]*>\s*↺\s*Seguir leyendo\s*<\/button>)/i;

function patchContinueReading(source){
  source=String(source);
  if(source.includes(RESUME_CALL))return source;
  if(!CTA_PATTERN.test(source))throw new Error('No se encontró el CTA Seguir leyendo esperado.');
  CTA_PATTERN.lastIndex=0;
  return source.replace(CTA_PATTERN,`$1${RESUME_CALL};location.hash='#entry=\${recent.code}'$2`);
}

function install(){
  if(!fs.existsSync(APP))throw new Error('El build R32 no contiene public/js/app.js.');
  fs.writeFileSync(APP,patchContinueReading(fs.readFileSync(APP,'utf8')),'utf8');
}

function main(){install();console.log('Continuidad de lectura habilitada.');}

module.exports={RESUME_CALL,CTA_PATTERN,patchContinueReading,install};
if(require.main===module)main();
