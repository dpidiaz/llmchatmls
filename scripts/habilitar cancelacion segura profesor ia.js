'use strict';
const fs=require('node:fs');

const TARGET='public/js/ai.js';
const MARKER="const CANCELLATION_VERSION='1.0';";
const REQUIRED=[
  ["const requestControllers=new WeakMap();",'controlador por modal'],
  ['new AbortController()','AbortController por petición'],
  ["abortModal(previous,'entry-change')",'aborto al reemplazar entrada'],
  ["onHashChange=()=>close('entry-change')",'aborto al cambiar hash'],
  ["if(controller.signal.aborted||!modal.isConnected)return;",'bloqueo de streaming tardío'],
  ["if(!modal.isConnected&&(reason==='close'||reason==='entry-change'))return;",'bloqueo de error tardío'],
  ["if(modal.dataset.aiBusy==='1')return;",'protección contra doble envío'],
  ["if(requestControllers.get(modal)===active)requestControllers.delete(modal);",'limpieza del controlador activo']
];

function assertContract(source){
  const text=String(source||'');
  for(const [needle,label] of REQUIRED){
    if(!text.includes(needle))throw new Error(`Contrato de cancelación incompleto: falta ${label}.`);
  }
  return true;
}

function patchAi(source){
  source=String(source);
  if(source.includes(MARKER))return source;
  assertContract(source);
  const robustness="  const ROBUSTNESS_VERSION='1.0';";
  if(!source.includes(robustness))throw new Error('No se encontró ROBUSTNESS_VERSION para declarar cancelación segura.');
  source=source.replace(robustness,robustness+"\n  const CANCELLATION_VERSION='1.0';");
  const exposed='professorRobustnessVersion:ROBUSTNESS_VERSION,classifyProfessorError';
  if(!source.includes(exposed))throw new Error('No se encontró la superficie pública del Profesor IA para exponer cancelación.');
  source=source.replace(exposed,'professorRobustnessVersion:ROBUSTNESS_VERSION,classifyProfessorError,professorCancellationVersion:CANCELLATION_VERSION');
  return source;
}

function main(){
  if(!fs.existsSync(TARGET))throw new Error('No se encontró public/js/ai.js después de extraer el bundle R32.');
  fs.writeFileSync(TARGET,patchAi(fs.readFileSync(TARGET,'utf8')),'utf8');
  console.log('Contrato de cancelación segura del Profesor IA habilitado.');
}

module.exports={patchAi,assertContract,MARKER,REQUIRED};
if(require.main===module)main();
