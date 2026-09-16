'use strict';
const fs=require('fs');

function addPreflightOpenApi(runtime){
  const begin=runtime.indexOf('var MLS_CHAT_OPENAPI = ');
  const end=runtime.indexOf(';\nvar MLS_CHAT_INSTRUCTIONS = ',begin);
  if(begin<0||end<0)throw Error('No se encontró MLS_CHAT_OPENAPI generado.');
  const jsonStart=begin+'var MLS_CHAT_OPENAPI = '.length;
  const api=JSON.parse(runtime.slice(jsonStart,end));
  api.info.version='32.0.6';
  api.paths['/api/wiki/editorial/chat/preflight/status']={get:{operationId:'estadoPreflightMLS',summary:'Comprobar salud y disponibilidad antes de iniciar un lote editorial.', 'x-openai-isConsequential':false,responses:{'200':{description:'Preflight read-only: cola, lotes, deferred, AUTOOPT, auditoría semántica y ruta Cloudflare.'},'401':{description:'Clave ausente o incorrecta.'}}}};
  return runtime.slice(0,jsonStart)+JSON.stringify(api)+runtime.slice(end);
}
function addPreflightInstructions(runtime){
  const marker='var MLS_CHAT_INSTRUCTIONS = ';
  const begin=runtime.indexOf(marker),end=runtime.indexOf(';\n',begin);
  if(begin<0||end<0)throw Error('No se encontró MLS_CHAT_INSTRUCTIONS generado.');
  const start=begin+marker.length;
  const current=JSON.parse(runtime.slice(start,end));
  const addition=`\n\nPreflight obligatorio y de solo lectura: reconoce «MLS preflight». Antes de cada «MLS siguientes N» llama estadoPreflightMLS. Antes de «MLS rescate siguientes N» también llama estadoPreflightMLS. Si el modo solicitado devuelve canStart=false, informa la causa y no abras un lote vacío. Si devuelve watch pero canStart=true, menciona brevemente la advertencia y continúa porque la orden del usuario ya autoriza el lote. La salud de Workers AI pertenece a la ruta Cloudflare y no bloquea los lotes editoriales escritos por ChatGPT. No conviertas el preflight en una autorización automática ni modifiques cola, FIFO, artículos, deferred o AUTOOPT desde este diagnóstico.`;
  return runtime.slice(0,start)+JSON.stringify(current+addition)+runtime.slice(end);
}
function patchPanel(html){
  const anchor='<section class="card"><h2>Historial separado de evidencia viva</h2>';
  const section=`<section class="card"><h2>Preflight antes de lotes</h2><p class="note">Diagnóstico de solo lectura. Separa la disponibilidad del flujo editorial de la salud de Workers AI; la cuota Cloudflare no bloquea los lotes escritos por ChatGPT.</p><div id="preflightGeneral" class="grid"></div><p id="preflightReasons" class="note"></p></section>`;
  if(!html.includes('id="preflightGeneral"'))html=html.replace(anchor,section+'\n'+anchor);
  const renderAnchor="  $('historyGeneral').innerHTML=";
  const render=`  const pf=data.preflight||{overall:{status:'watch',reasons:['Preflight no disponible.']},normalBatch:{canStart:false,availableEntries:0},rescueBatch:{canStart:false,availableEntries:0},editorialChat:{status:'watch'},cloudflareGeneration:{status:'watch'}};\n  $('preflightGeneral').innerHTML=metric('Estado',esc(pf.overall?.status||'desconocido'))+metric('Normales disponibles',num(pf.normalBatch?.availableEntries))+metric('Deferred disponibles',num(pf.rescueBatch?.availableEntries))+metric('Flujo editorial',esc(pf.editorialChat?.status||'desconocido'))+metric('Workers AI',esc(pf.cloudflareGeneration?.status||'desconocido'));\n  $('preflightReasons').textContent=(pf.overall?.reasons||[]).join(' ')||'Sin advertencias editoriales generales.';\n`;
  if(!html.includes("$('preflightGeneral').innerHTML"))html=html.replace(renderAnchor,render+renderAnchor);
  return html;
}
function main(){
  const target='src/index.js';let runtime=fs.readFileSync(target,'utf8');
  if(runtime.includes('async function handleMlsPreflight('))throw Error('Preflight ya instalado.');
  const route='    if (url.pathname.startsWith("/api/wiki/editorial/chat/")) return handleMlsChat(request, env, url);';
  if(!runtime.includes(route))throw Error('No se encontró la ruta editorial genérica.');
  runtime=runtime.replace(route,'    if (url.pathname === "/api/wiki/editorial/chat/preflight/status") return handleMlsPreflight(request, env);\n'+route);
  runtime=addPreflightOpenApi(runtime);
  runtime=addPreflightInstructions(runtime);
  runtime+='\n'+fs.readFileSync('MLS R32 EDITORIAL/preflight.js','utf8').replace(/^if\(typeof module.*$/gm,'');
  fs.writeFileSync(target,runtime);
  const panel='public/autoopt.html';if(fs.existsSync(panel))fs.writeFileSync(panel,patchPanel(fs.readFileSync(panel,'utf8')));
  console.log('Preflight editorial privado habilitado.');
}
module.exports={addPreflightOpenApi,addPreflightInstructions,patchPanel};
if(require.main===module)main();