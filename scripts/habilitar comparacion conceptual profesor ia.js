'use strict';
const fs=require('node:fs');
const TARGET='public/js/ai.js';
const HELPER='MLS R32 OVERLAY/profesor ia comparacion conceptual.js';
const MARKER='MLSProfessorComparison';
function patchAi(source,helper){source=String(source);helper=String(helper);if(source.includes(MARKER))return source;if(!source.trim())throw new Error('El módulo de Profesor IA está vacío.');if(!helper.includes("const VERSION='1.0'"))throw new Error('No se encontró una versión válida de comparación conceptual.');return source.replace(/\s*$/,'')+'\n\n// MLS Profesor IA: comparación conceptual especializada.\n'+helper.trim()+'\n';}
function main(){if(!fs.existsSync(TARGET))throw new Error('No se encontró public/js/ai.js.');if(!fs.existsSync(HELPER))throw new Error('No se encontró la fuente de comparación conceptual.');fs.writeFileSync(TARGET,patchAi(fs.readFileSync(TARGET,'utf8'),fs.readFileSync(HELPER,'utf8')),'utf8');console.log('Comparación conceptual especializada del Profesor IA habilitada.');}
module.exports={patchAi,MARKER};
if(require.main===module)main();
