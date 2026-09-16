// MLS preflight: diagnóstico privado y de solo lectura antes de iniciar lotes.
// No reserva entradas, no inicia lotes, no llama IA, no publica y no modifica FIFO.
const MLS_PREFLIGHT_VERSION='1.0';
function mlsPreflightNumber(v){const n=Number(v);return Number.isFinite(n)?n:0;}
function mlsPreflightStatusRank(status){return status==='blocked'?2:status==='watch'?1:0;}
function mlsPreflightWorst(items){let status='ready';for(const item of items||[]){if(mlsPreflightStatusRank(item?.status)>mlsPreflightStatusRank(status))status=item.status;}return status;}
function mlsPreflightAssess(input={}){
  const queue=input.queue||{}, editorial=input.editorial||{}, cloudflare=input.cloudflare||{}, autoopt=input.autoopt||{}, semantic=input.semantic||{};
  const pending=mlsPreflightNumber(queue.pending), deferred=mlsPreflightNumber(editorial.deferredPending), activeRuns=mlsPreflightNumber(editorial.activeRuns), pendingReservations=mlsPreflightNumber(editorial.pendingReservations);
  const normalReasons=[], rescueReasons=[], editorialReasons=[], cloudflareReasons=[];
  let normalStatus='ready', rescueStatus='ready', editorialStatus='ready', cloudflareStatus='ready';
  if(pending<=0){normalStatus='blocked';normalReasons.push('No hay entradas normales pendientes disponibles.');}
  if(deferred<=0){rescueStatus='blocked';rescueReasons.push('No hay incidencias deferred pendientes para rescate.');}
  if(activeRuns>0){editorialStatus='watch';editorialReasons.push(`Hay ${activeRuns} lote(s) editorial(es) activo(s); Farm permite concurrencia, pero conviene vigilar reservas.`);}
  if(pendingReservations>0){editorialStatus='watch';editorialReasons.push(`Hay ${pendingReservations} reserva(s) editoriales pendientes.`);}
  if(autoopt.status==='vigilar'){editorialStatus='watch';editorialReasons.push('AUTOOPT marca señales editoriales para vigilar.');}
  if(semantic.reviewRequired>0){editorialStatus='watch';editorialReasons.push(`La auditoría semántica registra ${semantic.reviewRequired} entrada(s) con revisión requerida.`);}
  if(cloudflare.available===false){cloudflareStatus='blocked';cloudflareReasons.push('La ruta Cloudflare de generación no está disponible.');}
  else if(cloudflare.quotaExhausted||cloudflare.circuitOpen){cloudflareStatus='blocked';cloudflareReasons.push('La cuota o circuito de Workers AI está bloqueado temporalmente.');}
  else if(cloudflare.remainingNeurons!==null&&cloudflare.estimatedArticleNeurons>0&&cloudflare.remainingNeurons<cloudflare.estimatedArticleNeurons){cloudflareStatus='watch';cloudflareReasons.push('El presupuesto restante de Workers AI es menor que el coste estimado de una entrada.');}
  const overall=mlsPreflightWorst([{status:editorialStatus},{status:normalStatus==='blocked'&&rescueStatus==='blocked'?'blocked':'ready'}]);
  return {overall:{status:overall,reasons:[...editorialReasons,...(normalStatus==='blocked'&&rescueStatus==='blocked'?['No hay trabajo normal ni deferred disponible.']:[])]},
    normalBatch:{status:normalStatus,canStart:normalStatus!=='blocked',availableEntries:pending,reasons:normalReasons},
    rescueBatch:{status:rescueStatus,canStart:rescueStatus!=='blocked',availableEntries:deferred,reasons:rescueReasons},
    editorialChat:{status:editorialStatus,reasons:editorialReasons,activeRuns,pendingReservations},
    cloudflareGeneration:{status:cloudflareStatus,reasons:cloudflareReasons,...cloudflare},
    note:'La salud de Workers AI es informativa para generación Cloudflare y no bloquea los lotes editoriales escritos por ChatGPT.'};
}
async function mlsPreflightCollect(env){
  await ensureWikiDb(env);await mlsChatEnsureDb(env);
  const queueRows=await env.WIKI_DB.prepare(`SELECT status,COUNT(*) AS n FROM wiki_jobs GROUP BY status`).all();
  const queue={};for(const row of queueRows.results||[])queue[String(row.status||'unknown')]=mlsPreflightNumber(row.n);
  const normalPending=await env.WIKI_DB.prepare(`SELECT COUNT(*) AS n FROM wiki_jobs j WHERE j.status <> 'published' AND NOT EXISTS (SELECT 1 FROM wiki_articles a WHERE a.code=j.code) AND NOT EXISTS (SELECT 1 FROM wiki_chat_items i WHERE i.code=j.code AND i.status='pending')`).first();
  const runs=await env.WIKI_DB.prepare(`SELECT COUNT(*) AS n FROM wiki_chat_runs WHERE status='active'`).first();
  const reservations=await env.WIKI_DB.prepare(`SELECT COUNT(*) AS n FROM wiki_chat_items WHERE status='pending'`).first();
  const deferred=await env.WIKI_DB.prepare(`SELECT COUNT(*) AS n FROM wiki_chat_incidents i WHERE i.rescue_state='pending' AND i.runner_eligible=1 AND NOT EXISTS (SELECT 1 FROM wiki_articles a WHERE a.code=i.code) AND NOT EXISTS (SELECT 1 FROM wiki_chat_rescue_claims c WHERE c.incident_id=i.id AND c.status='pending')`).first();
  let autoopt={status:'evidencia insuficiente',partial:true};try{const h=await mlsAutooptHealth(env);autoopt={status:h.health?.status||'evidencia insuficiente',partial:!!h.health?.partial,reasons:h.health?.reasons||[]};}catch{}
  let semantic={audited:0,watch:0,reviewRequired:0};try{const s=await mlsSemanticStatus(env);semantic={audited:s.audited||0,watch:s.watch||0,reviewRequired:s.reviewRequired||0};}catch{}
  let cloudflare={available:!!env.AI,quotaExhausted:false,circuitOpen:false,dailyNeurons:null,reservedNeurons:null,targetNeurons:typeof WIKI_CLOUDFLARE_NEURON_TARGET==='number'?WIKI_CLOUDFLARE_NEURON_TARGET:null,remainingNeurons:null,estimatedArticleNeurons:null};
  try{const status=await wikiStore(env).getStatus();const target=mlsPreflightNumber(status.dailyNeuronTarget);const used=mlsPreflightNumber(status.dailyNeurons),reserved=mlsPreflightNumber(status.dailyReservedNeurons);cloudflare={...cloudflare,available:!!env.AI,dailyNeurons:used,reservedNeurons:reserved,targetNeurons:target||cloudflare.targetNeurons,remainingNeurons:Math.max(0,(target||0)-used-reserved),estimatedArticleNeurons:mlsPreflightNumber(status.estimatedArticleNeurons),quotaExhausted:!!status.quotaExhaustedDate,circuitOpen:status.workersAiCircuit?.status==='quota_exhausted',circuit:status.workersAiCircuit||null};}catch{cloudflare.available=false;}
  const assessment=mlsPreflightAssess({queue:{...queue,pending:mlsPreflightNumber(normalPending?.n)},editorial:{activeRuns:mlsPreflightNumber(runs?.n),pendingReservations:mlsPreflightNumber(reservations?.n),deferredPending:mlsPreflightNumber(deferred?.n)},cloudflare,autoopt,semantic});
  return {ok:true,version:MLS_PREFLIGHT_VERSION,generatedAt:new Date().toISOString(),promptVersion:MLS_CHAT_CONTRACT.promptVersion,strictZeroCost:true,diagnosticOnly:true,queue:{...queue,availableNormal:mlsPreflightNumber(normalPending?.n)},semantic,autoopt,...assessment};
}
async function handleMlsPreflight(request,env){
  if(request.method!=='GET')return mlsChatJson({ok:false,error:'Método no permitido.'},405);
  try{await mlsChatAuthenticate(request,env);return mlsChatJson(await mlsPreflightCollect(env));}
  catch(error){if(!error.status)console.error('mls-preflight-failure',error.message);return mlsChatJson({ok:false,error:error.status?error.message:'Preflight temporalmente no disponible.'},error.status||500);}
}
function mlsPreflightAttachRuntime(){if(typeof mlsAutooptHealth==='function'&&!mlsAutooptHealth.__preflightWrapped){const base=mlsAutooptHealth;const wrapped=async function(env){const data=await base(env);try{data.preflight=await mlsPreflightCollect(env);}catch{data.preflight={version:MLS_PREFLIGHT_VERSION,available:false,overall:{status:'watch',reasons:['Preflight no disponible.']}};if(data.health)data.health.partial=true;}return data;};wrapped.__preflightWrapped=true;mlsAutooptHealth=wrapped;}}
mlsPreflightAttachRuntime();
if(typeof module!=='undefined'&&module.exports)module.exports={MLS_PREFLIGHT_VERSION,mlsPreflightAssess,mlsPreflightWorst};