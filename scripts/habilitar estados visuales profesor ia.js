'use strict';
const fs=require('node:fs');
const TARGET='public/js/ai.js';
const HELPER='MLS R32 OVERLAY/profesor ia estados visuales.js';
const MARKER='MLSProfessorVisualStates';
function patchAi(source,helper){source=String(source);helper=String(helper);if(source.includes(MARKER))return source;if(!source.trim())throw new Error('El módulo de Profesor IA está vacío.');if(!helper.includes("const VERSION='1.0'"))throw new Error('No se encontró una versión válida de estados visuales del Profesor IA.');return source.replace(/\s*$/,'')+'\n\n// MLS Profesor IA: estados visuales explícitos.\n'+helper.trim()+'\n';}
function main(){if(!fs.existsSync(TARGET))throw new Error('No se encontró public/js/ai.js.');if(!fs.existsSync(HELPER))throw new Error('No se encontró la fuente de estados visuales del Profesor IA.');fs.writeFileSync(TARGET,patchAi(fs.readFileSync(TARGET,'utf8'),fs.readFileSync(HELPER,'utf8')),'utf8');console.log('Estados visuales del Profesor IA habilitados.');}
module.exports={patchAi,MARKER};
if(require.main===module)main();
