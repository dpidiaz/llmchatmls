'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const remover=require('../scripts/retirar detalles avanzados.js');

test('patchApp elimina tarjeta y binding obsoletos sin tocar otros ajustes',()=>{
  const source=`function settingsPage(){MLS.app.innerHTML=\`<section class="setting-row"><div><h2>Profesor IA</h2></div></section><section class="setting-row"><div><h2>Detalles avanzados</h2><p>Muestra información técnica, excepciones y fuentes debajo de cada explicación.</p></div><label class="switch"><input id="advancedToggle" type="checkbox" \${MLS.state.advancedDetails?'checked':''}><span></span></label></section><section class="setting-row"><div><h2>Tamaño de letra</h2></div></section>\`;document.getElementById('advancedToggle').onchange=ev=>{MLS.state.advancedDetails=ev.target.checked;MLS.save();MLS.toast('Configuración guardada')};document.getElementById('textSize').onchange=()=>{}}`;
  const out=remover.patchApp(source);
  assert.doesNotMatch(out,/Detalles avanzados|advancedToggle|advancedDetails/);
  assert.match(out,/Profesor IA/);
  assert.match(out,/Tamaño de letra/);
  assert.match(out,/textSize/);
});

test('patchCore elimina carga y persistencia de mlsAdvancedDetails',()=>{
  const source=`MLS.state={mapPrefs:{},advancedDetails:safeJSON('mlsAdvancedDetails',false),textSize:safeJSON('mlsTextSize','large'),theme:safeJSON('mlsThemeMode','light')};MLS.save=()=>{localStorage.setItem('mlsMapPrefs','x');localStorage.setItem('mlsAdvancedDetails',JSON.stringify(MLS.state.advancedDetails));localStorage.setItem('mlsTextSize',JSON.stringify(MLS.state.textSize));};`;
  const out=remover.patchCore(source);
  assert.doesNotMatch(out,/advancedDetails|mlsAdvancedDetails/);
  assert.match(out,/mlsTextSize/);
  assert.match(out,/mlsThemeMode/);
});

test('parches son idempotentes una vez eliminado el control',()=>{
  const cleanApp='<h2>Profesor IA</h2><h2>Tamaño de letra</h2>';
  const cleanCore="MLS.state={textSize:'large',theme:'light'};";
  assert.equal(remover.patchApp(cleanApp),cleanApp);
  assert.equal(remover.patchCore(cleanCore),cleanCore);
});

test('predeploy retira Detalles avanzados después de materializar el bundle',()=>{
  const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
  const command=pkg.scripts.predeploy;
  const removePos=command.indexOf("retirar detalles avanzados.js");
  assert.ok(removePos>0);
  assert.ok(removePos>command.indexOf("MASTER LANGUAGE SYSTEM REVISION 32 BUNDLE.tar.gz"));
  assert.ok(removePos>command.indexOf("habilitar presupuesto compartido workers ai.js"));
  assert.match(pkg.scripts['test:chat-editorial'],/detalles avanzados removal\.test\.cjs/);
});
