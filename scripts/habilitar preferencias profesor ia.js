'use strict';
const fs=require('node:fs');

const AI_TARGET='public/js/ai.js';
const READER_TARGET='public/js/reader.js';
const HELPER='MLS R32 OVERLAY/profesor ia preferencias.js';
const AI_MARKER='MLSProfessorPreferences';
const READER_MARKER='id="aiPrefsBtn"';

function patchAi(source,helper){
  if(String(source).includes(AI_MARKER))return String(source);
  if(!String(source).trim())throw new Error('El módulo de Profesor IA está vacío.');
  if(!String(helper).includes("const VERSION='1.0'"))throw new Error('No se encontró una versión válida de preferencias del Profesor IA.');
  return String(source).replace(/\s*$/,'')+'\n\n// MLS Profesor IA: preferencias de explicación.\n'+String(helper).trim()+'\n';
}
function patchReader(source){
  source=String(source);
  if(source.includes(READER_MARKER))return source;
  const button='<button class="btn ai-entry-btn" id="aiExplainBtn">✨ Profesor IA</button>';
  if(!source.includes(button))throw new Error('No se encontró el botón Profesor IA en el lector.');
  source=source.replace(button,button+'<button class="btn" id="aiPrefsBtn" type="button" aria-label="Preferencias del Profesor IA">⚙ Profesor</button>');
  const bind="document.getElementById('aiExplainBtn').onclick=()=>MLS.aiTutor?.open(activeTutorEntry,m);";
  if(!source.includes(bind))throw new Error('No se encontró el enlace del Profesor IA en el lector.');
  source=source.replace(bind,bind+"\n    document.getElementById('aiPrefsBtn').onclick=()=>window.MLSProfessorPreferences?.openSettingsDialog?.(m);");
  return source;
}
function main(){
  if(!fs.existsSync(AI_TARGET))throw new Error('No se encontró public/js/ai.js.');
  if(!fs.existsSync(READER_TARGET))throw new Error('No se encontró public/js/reader.js.');
  if(!fs.existsSync(HELPER))throw new Error('No se encontró la fuente de preferencias del Profesor IA.');
  const helper=fs.readFileSync(HELPER,'utf8');
  fs.writeFileSync(AI_TARGET,patchAi(fs.readFileSync(AI_TARGET,'utf8'),helper),'utf8');
  fs.writeFileSync(READER_TARGET,patchReader(fs.readFileSync(READER_TARGET,'utf8')),'utf8');
  console.log('Preferencias del Profesor IA habilitadas.');
}
module.exports={patchAi,patchReader,AI_MARKER,READER_MARKER};
if(require.main===module)main();
