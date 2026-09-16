'use strict';
const fs=require('node:fs');

const AI_TARGET='public/js/ai.js';
const READER_TARGET='public/js/reader.js';
const HELPER='MLS R32 OVERLAY/profesor ia acciones rapidas.js';
const AI_MARKER='MLSProfessorQuickActions';
const READER_MARKER='id="aiQuickBtn"';

function patchAi(source,helper){
  source=String(source);helper=String(helper);
  if(source.includes(AI_MARKER))return source;
  if(!source.trim())throw new Error('El módulo de Profesor IA está vacío.');
  if(!helper.includes("const VERSION='1.0'"))throw new Error('No se encontró una versión válida de acciones rápidas.');
  return source.replace(/\s*$/,'')+'\n\n// MLS Profesor IA: acciones rápidas multilingües.\n'+helper.trim()+'\n';
}
function patchReader(source){
  source=String(source);
  if(source.includes(READER_MARKER))return source;
  const explain='<button class="btn ai-entry-btn" id="aiExplainBtn">✨ Profesor IA</button>';
  if(!source.includes(explain))throw new Error('No se encontró el botón Profesor IA en el lector.');
  source=source.replace(explain,explain+'<button class="btn" id="aiQuickBtn" type="button" aria-label="Acciones rápidas del Profesor IA">⚡ Acciones</button>');
  const prefBind="document.getElementById('aiPrefsBtn').onclick=()=>window.MLSProfessorPreferences?.openSettingsDialog?.(m);";
  const explainBind="document.getElementById('aiExplainBtn').onclick=()=>MLS.aiTutor?.open(activeTutorEntry,m);";
  if(source.includes(prefBind))source=source.replace(prefBind,prefBind+"\n    document.getElementById('aiQuickBtn').onclick=()=>window.MLSProfessorQuickActions?.openDialog?.(activeTutorEntry,m);");
  else if(source.includes(explainBind))source=source.replace(explainBind,explainBind+"\n    document.getElementById('aiQuickBtn').onclick=()=>window.MLSProfessorQuickActions?.openDialog?.(activeTutorEntry,m);");
  else throw new Error('No se encontró el enlace del Profesor IA en el lector.');
  return source;
}
function main(){
  if(!fs.existsSync(AI_TARGET))throw new Error('No se encontró public/js/ai.js.');
  if(!fs.existsSync(READER_TARGET))throw new Error('No se encontró public/js/reader.js.');
  if(!fs.existsSync(HELPER))throw new Error('No se encontró la fuente de acciones rápidas.');
  const helper=fs.readFileSync(HELPER,'utf8');
  fs.writeFileSync(AI_TARGET,patchAi(fs.readFileSync(AI_TARGET,'utf8'),helper),'utf8');
  fs.writeFileSync(READER_TARGET,patchReader(fs.readFileSync(READER_TARGET,'utf8')),'utf8');
  console.log('Acciones rápidas multilingües del Profesor IA habilitadas.');
}
module.exports={patchAi,patchReader,AI_MARKER,READER_MARKER};
if(require.main===module)main();
