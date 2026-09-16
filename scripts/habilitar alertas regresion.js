'use strict';
const fs=require('fs');

function addRegressionOpenApi(runtime){
  const begin=runtime.indexOf('var MLS_CHAT_OPENAPI = '),end=runtime.indexOf(';\nvar MLS_CHAT_INSTRUCTIONS = ',begin);
  if(begin<0||end<0)throw Error('No se encontró MLS_CHAT_OPENAPI generado.');
  const start=begin+'var MLS_CHAT_OPENAPI = '.length,api=JSON.parse(runtime.slice(start,end));
  api.info.version='32.0.7';
  api.paths['/api/wiki/editorial/chat/regression/status']={get:{operationId:'estadoRegresionMLS',summary:'Consultar alertas de regresión editorial por ventana temporal, idioma, nivel y familia.', 'x-openai-isConsequential':false,responses:{'200':{description:'Comparación diagnóstica entre los últimos 7 días y los 21 días anteriores.'},'401':{description:'Clave ausente o incorrecta.'}}}};
  return runtime.slice(0,start)+JSON.stringify(api)+runtime.slice(end);
}
function addRegressionInstructions(runtime){
  const marker='var MLS_CHAT_INSTRUCTIONS = ',begin=runtime.indexOf(marker),end=runtime.indexOf(';\n',begin);
  if(begin<0||end<0)throw Error('No se encontró MLS_CHAT_INSTRUCTIONS generado.');
  const start=begin+marker.length,current=JSON.parse(runtime.slice(start,end));
  const addition=`\n\nAlertas de regresión: reconoce «MLS alertas regresión», «MLS estado regresión» y «MLS regresión». Usa estadoRegresionMLS y explica la ventana reciente de 7 días frente al baseline de 21 días anteriores. Distingue siempre «vigilar», «estable» y «evidencia insuficiente». No presentes una muestra insuficiente como estabilidad. Una alerta es diagnóstica, no una orden de corregir, regenerar, publicar, rescatar ni cambiar FIFO. Si el preflight reporta regresión, informa la advertencia sin debilitar R32 ni cancelar automáticamente un lote autorizado.`;
  return runtime.slice(0,start)+JSON.stringify(current+addition)+runtime.slice(end);
}
function patchPanel(html){
  const anchor='<section class="card"><h2>Historial separado de evidencia viva</h2>';
  const section=`<section class="card"><h2>Alertas de regresión</h2><p class="note">Compara los últimos 7 días con los 21 días anteriores. Detecta cambios de tendencia; no cambia R32 ni toma acciones automáticas.</p><div id="regressionGeneral" class="grid"></div><p id="regressionReasons" class="note"></p><div class="tablewrap"><table><thead><tr><th>Idioma</th><th>Familia</th><th>Estado</th><th>Primer intento Δ</th><th>Rechazo Δ</th><th>Deferred Δ</th></tr></thead><tbody id="regressionFamilies"></tbody></table></div></section>`;
  if(!html.includes('id="regressionGeneral"'))html=html.replace(anchor,section+'\n'+anchor);
  const renderAnchor="  $('historyGeneral').innerHTML=";
  const render=`  const rg=data.regressionAlerts||{overall:{status:'evidencia insuficiente',reasons:['Sin datos suficientes.'],recent:{},baseline:{},deltas:{}},byFamily:[]};\n  $('regressionGeneral').innerHTML=metric('Estado',esc(rg.overall?.status||'desconocido'))+metric('Primer intento reciente',pct(rg.overall?.recent?.firstPassRate))+metric('Primer intento baseline',pct(rg.overall?.baseline?.firstPassRate))+metric('Rechazo reciente',pct(rg.overall?.recent?.rejectionRate))+metric('Deferred reciente',pct(rg.overall?.recent?.deferredRate));\n  $('regressionReasons').textContent=(rg.overall?.reasons||[]).join(' ');\n  $('regressionFamilies').innerHTML=(rg.byFamily||[]).filter(x=>x.status==='vigilar').slice(0,40).map(x=>\`<tr><td>\${esc(x.language)}</td><td>\${esc(x.family)}</td><td>\${esc(x.status)}</td><td>\${x.deltas?.firstPassRate==null?'—':pct(x.deltas.firstPassRate)}</td><td>\${x.deltas?.rejectionRate==null?'—':pct(x.deltas.rejectionRate)}</td><td>\${x.deltas?.deferredRate==null?'—':pct(x.deltas.deferredRate)}</td></tr>\`).join('')||'<tr><td colspan="6">Sin regresiones familiares con muestra suficiente.</td></tr>';\n`;
  if(!html.includes("$('regressionGeneral').innerHTML"))html=html.replace(renderAnchor,render+renderAnchor);
  return html;
}
function main(){
  const target='src/index.js';let runtime=fs.readFileSync(target,'utf8');
  if(runtime.includes('async function handleMlsRegression('))throw Error('Alertas de regresión ya instaladas.');
  const route='    if (url.pathname.startsWith("/api/wiki/editorial/chat/")) return handleMlsChat(request, env, url);';
  if(!runtime.includes(route))throw Error('No se encontró la ruta editorial genérica.');
  runtime=runtime.replace(route,'    if (url.pathname === "/api/wiki/editorial/chat/regression/status") return handleMlsRegression(request, env);\n'+route);
  runtime=addRegressionOpenApi(runtime);runtime=addRegressionInstructions(runtime);
  runtime+='\n'+fs.readFileSync('MLS R32 EDITORIAL/regression alerts.js','utf8').replace(/^if\(typeof module.*$/gm,'');
  fs.writeFileSync(target,runtime);
  const panel='public/autoopt.html';if(fs.existsSync(panel))fs.writeFileSync(panel,patchPanel(fs.readFileSync(panel,'utf8')));
  console.log('Alertas finas de regresión editorial habilitadas.');
}
module.exports={addRegressionOpenApi,addRegressionInstructions,patchPanel};
if(require.main===module)main();