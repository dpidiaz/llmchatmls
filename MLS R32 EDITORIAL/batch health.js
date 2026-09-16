// Salud editorial por lote. Solo lectura: resume resultados ya existentes y AUTOOPT vivo.
const MLS_BATCH_HEALTH_VERSION='1.0';
const MLS_BATCH_HEALTH_DEFAULT_LIMIT=12;
const MLS_BATCH_HEALTH_MAX_LIMIT=50;
function mlsBatchNum(v){const n=Number(v);return Number.isFinite(n)?n:0;}
function mlsBatchParseStats(text){try{return JSON.parse(text||'{}')||{};}catch{return {};}}
function mlsBatchDuration(createdAt,updatedAt){const a=Date.parse(createdAt||''),b=Date.parse(updatedAt||'');return Number.isFinite(a)&&Number.isFinite(b)&&b>=a?b-a:null;}
function mlsBatchDelta(a,b){return a==null||b==null?null:Math.round((a-b)*1000)/1000;}
function mlsBatchDecorate(run,stats={}){
  const metrics=mlsAutooptHealthMetrics(stats,false),selected=mlsBatchNum(run.selected),published=mlsBatchNum(run.published),deferred=mlsBatchNum(run.deferred),external=mlsBatchNum(run.external),pending=mlsBatchNum(run.pending);
  const completion=selected?Math.round(((published+deferred+external)/selected)*1000)/1000:null;
  const itemDeferredRate=selected?Math.round((deferred/selected)*1000)/1000:null;
  const alert=mlsAutooptHealthAlert(metrics);
  return {id:run.id,runType:run.run_type||'normal',status:run.status,requested:mlsBatchNum(run.requested),selected,published,deferred,preservedExisting:external,pending,
    createdAt:run.created_at,updatedAt:run.updated_at,durationMs:mlsBatchDuration(run.created_at,run.updated_at),completion,itemDeferredRate,metrics,alert,
    diagnosticOnly:true};
}
function mlsBatchCompare(current,previous){if(!previous)return null;return {previousRunId:previous.id,firstPassRateDelta:mlsBatchDelta(current.metrics.firstPassSuccessRate,previous.metrics.firstPassSuccessRate),attemptsPerPublicationDelta:mlsBatchDelta(current.metrics.attemptsPerPublication,previous.metrics.attemptsPerPublication),deferredRateDelta:mlsBatchDelta(current.itemDeferredRate,previous.itemDeferredRate),durationMsDelta:current.durationMs==null||previous.durationMs==null?null:current.durationMs-previous.durationMs};}
function mlsBatchAttachComparisons(runs=[]){const previousByType=new Map();return runs.map(run=>{const previous=previousByType.get(run.runType)||null;const out={...run,comparisonToPrevious:mlsBatchCompare(run,previous)};previousByType.set(run.runType,run);return out;});}
async function mlsBatchHealthCollect(env,limit=MLS_BATCH_HEALTH_DEFAULT_LIMIT){
  await mlsChatEnsureDb(env);if(mlsAutooptEnabled(env))await mlsAutooptEnsure(env);
  const safe=Math.max(1,Math.min(MLS_BATCH_HEALTH_MAX_LIMIT,Math.trunc(Number(limit)||MLS_BATCH_HEALTH_DEFAULT_LIMIT)));
  const {results:runs}=await env.WIKI_DB.prepare(`SELECT r.id,r.requested,r.status,r.created_at,r.updated_at,COALESCE(m.run_type,'normal') AS run_type,
    COUNT(i.code) AS selected,
    SUM(CASE WHEN i.status='published' THEN 1 ELSE 0 END) AS published,
    SUM(CASE WHEN i.status='deferred' THEN 1 ELSE 0 END) AS deferred,
    SUM(CASE WHEN i.status='external' THEN 1 ELSE 0 END) AS external,
    SUM(CASE WHEN i.status='pending' THEN 1 ELSE 0 END) AS pending
    FROM wiki_chat_runs r LEFT JOIN wiki_chat_run_meta m ON m.run_id=r.id LEFT JOIN wiki_chat_items i ON i.run_id=r.id
    GROUP BY r.id,r.requested,r.status,r.created_at,r.updated_at,m.run_type ORDER BY r.created_at DESC LIMIT ?`).bind(safe).all();
  const {results:statsRows}=mlsAutooptEnabled(env)?await env.WIKI_DB.prepare(`SELECT scope_id,stats,updated_at FROM wiki_autoopt_stats WHERE version=? AND prompt=? AND scope='run' ORDER BY updated_at DESC LIMIT ?`).bind(MLS_AUTOOPT_VERSION,MLS_CHAT_CONTRACT.promptVersion,Math.max(safe*4,50)).all():{results:[]};
  const stats=new Map((statsRows||[]).map(x=>[x.scope_id,mlsBatchParseStats(x.stats)]));
  // Query returns newest first; comparisons must be calculated chronologically and then restored newest-first.
  const chronological=(runs||[]).slice().reverse().map(row=>mlsBatchDecorate(row,stats.get(row.id)||{}));
  const compared=mlsBatchAttachComparisons(chronological).reverse();
  const active=compared.filter(x=>x.status==='active').length,watch=compared.filter(x=>x.alert?.status==='vigilar').length,complete=compared.filter(x=>x.status==='complete').length;
  return {ok:true,version:MLS_BATCH_HEALTH_VERSION,generatedAt:new Date().toISOString(),promptVersion:MLS_CHAT_CONTRACT.promptVersion,diagnosticOnly:true,limit:safe,summary:{returned:compared.length,active,complete,watch},runs:compared,
    note:'Las comparaciones son entre lotes consecutivos del mismo tipo dentro de la ventana devuelta. No son rankings ni cambian la ejecución editorial.'};
}
async function handleMlsBatchHealth(request,env){if(request.method!=='GET')return mlsChatJson({ok:false,error:'Método no permitido.'},405);try{await mlsChatAuthenticate(request,env);const url=new URL(request.url);return mlsChatJson(await mlsBatchHealthCollect(env,url.searchParams.get('limit')));}catch(error){if(!error.status)console.error('mls-batch-health-failure',error.message);return mlsChatJson({ok:false,error:error.status?error.message:'Salud por lote temporalmente no disponible.'},error.status||500);}}
function mlsBatchHealthAttach(){if(typeof mlsAutooptHealth==='function'&&!mlsAutooptHealth.__batchHealthWrapped){const base=mlsAutooptHealth;const wrapped=async function(env){const data=await base(env);try{data.batchHealth=await mlsBatchHealthCollect(env,12);}catch{data.batchHealth={version:MLS_BATCH_HEALTH_VERSION,available:false,summary:{returned:0,active:0,complete:0,watch:0},runs:[]};if(data.health)data.health.partial=true;}return data;};wrapped.__batchHealthWrapped=true;mlsAutooptHealth=wrapped;}}
mlsBatchHealthAttach();
if(typeof module!=='undefined'&&module.exports)module.exports={MLS_BATCH_HEALTH_VERSION,mlsBatchDuration,mlsBatchDelta,mlsBatchDecorate,mlsBatchCompare,mlsBatchAttachComparisons};