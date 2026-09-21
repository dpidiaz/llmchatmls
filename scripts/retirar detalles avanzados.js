'use strict';

const fs=require('node:fs');

const APP='public/js/app.js';
const CORE='public/js/core.js';
const MARKER='MLS_REMOVE_DEAD_ADVANCED_DETAILS_V1';

function patchApp(source){
  source=String(source||'');
  if(!source.includes('Detalles avanzados')&&!source.includes('advancedToggle')&&!source.includes('advancedDetails'))return source;

  const card='<section class="setting-row"><div><h2>Detalles avanzados</h2><p>Muestra información técnica, excepciones y fuentes debajo de cada explicación.</p></div><label class="switch"><input id="advancedToggle" type="checkbox" ${MLS.state.advancedDetails?\'checked\':\'\'}><span></span></label></section>';
  if(!source.includes(card))throw new Error('Detalles avanzados: no se encontró la tarjeta obsoleta en app.js.');
  source=source.replace(card,'');

  const bind="document.getElementById('advancedToggle').onchange=ev=>{MLS.state.advancedDetails=ev.target.checked;MLS.save();MLS.toast('Configuración guardada')};";
  if(!source.includes(bind))throw new Error('Detalles avanzados: no se encontró el binding obsoleto en app.js.');
  source=source.replace(bind,'');

  if(/advancedDetails|advancedToggle|Detalles avanzados/.test(source))throw new Error('Detalles avanzados: quedaron referencias inesperadas en app.js.');
  return source;
}

function patchCore(source){
  source=String(source||'');
  if(!/advancedDetails|mlsAdvancedDetails/.test(source))return source;

  const state="advancedDetails:safeJSON('mlsAdvancedDetails',false),";
  if(!source.includes(state))throw new Error('Detalles avanzados: no se encontró el estado obsoleto en core.js.');
  source=source.replace(state,'');

  const save="localStorage.setItem('mlsAdvancedDetails',JSON.stringify(MLS.state.advancedDetails));";
  if(!source.includes(save))throw new Error('Detalles avanzados: no se encontró la persistencia obsoleta en core.js.');
  source=source.replace(save,'');

  if(/advancedDetails|mlsAdvancedDetails/.test(source))throw new Error('Detalles avanzados: quedaron referencias inesperadas en core.js.');
  return source;
}

function install(){
  if(!fs.existsSync(APP))throw new Error('Detalles avanzados: falta '+APP+'. Ejecuta predeploy desde el repositorio.');
  if(!fs.existsSync(CORE))throw new Error('Detalles avanzados: falta '+CORE+'. Ejecuta predeploy desde el repositorio.');
  fs.writeFileSync(APP,patchApp(fs.readFileSync(APP,'utf8')),'utf8');
  fs.writeFileSync(CORE,patchCore(fs.readFileSync(CORE,'utf8')),'utf8');
}

function main(){
  install();
  console.log(MARKER+': tarjeta y estado obsoletos retirados.');
}

module.exports={APP,CORE,MARKER,patchApp,patchCore,install};
if(require.main===module)main();
