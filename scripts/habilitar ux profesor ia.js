'use strict';
const fs=require('node:fs');
const TARGET='public/js/ai.js';
const HELPER='MLS R32 OVERLAY/profesor ia ux.js';
const MARKER='MLSProfessorUX';
function patchAi(source,helper){source=String(source);helper=String(helper);if(source.includes(MARKER))return source;if(!source.trim())throw new Error('El módulo de Profesor IA está vacío.');if(!helper.includes("const VERSION='1.0'"))throw new Error('No se encontró una versión válida de UX del Profesor IA.');return source.replace(/\s*$/,'')+'\n\n// MLS Profesor IA: UX integral.\n'+helper.trim()+'\n';}
function main(){if(!fs.existsSync(TARGET))throw new Error('No se encontró public/js/ai.js.');if(!fs.existsSync(HELPER))throw new Error('No se encontró la fuente UX del Profesor IA.');fs.writeFileSync(TARGET,patchAi(fs.readFileSync(TARGET,'utf8'),fs.readFileSync(HELPER,'utf8')),'utf8');console.log('UX integral del Profesor IA habilitada.');}
module.exports={patchAi,MARKER};
if(require.main===module)main();
