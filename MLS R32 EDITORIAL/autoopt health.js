// AUTOOPT health diagnostics. Read-only aggregates only; no content, prompts or credentials.
const MLS_AUTOOPT_HEALTH_MIN_FIRST_ATTEMPTS = 8;
const MLS_AUTOOPT_HEALTH_MIN_PUBLICATIONS = 5;
const MLS_AUTOOPT_HEALTH_COUNTERS = [
  'validationAttempts','validationFailures','successfulFirstPass','firstAttempts','published',
  'publicationsWithAttemptHistory','firstPassPublished','attemptsForPublished','wordsSuccessful',
  'preservedExisting','publicationFailures','deferred','needsReview','lengthFailures',
  'r32FalsePositiveLikeFailures','ruleFailures','markdownFailures','contractFailures','otherFailures'
];
function mlsAutooptHealthNumber(value) { const n=Number(value); return Number.isFinite(n)?n:0; }
function mlsAutooptHealthScope(scopeId) {
  const parts=String(scopeId||'').split(':');
  return {language:parts[0]||'unknown',level:parts[1]||'unknown',family:parts.slice(2).join(':')||'unknown'};
}
function mlsAutooptHealthMerge(target, source={}) {
  for(const key of MLS_AUTOOPT_HEALTH_COUNTERS) target[key]=(target[key]||0)+mlsAutooptHealthNumber(source[key]);
  const min=mlsAutooptHealthNumber(source.minimumSuccessful); if(min>0) target.minimumSuccessful=target.minimumSuccessful?Math.min(target.minimumSuccessful,min):min;
  const max=mlsAutooptHealthNumber(source.maximumSuccessful); if(max>0) target.maximumSuccessful=Math.max(target.maximumSuccessful||0,max);
  return target;
}
function mlsAutooptHealthMetrics(stats={}, includeStreak=true) {
  const s={}; for(const key of MLS_AUTOOPT_HEALTH_COUNTERS) s[key]=mlsAutooptHealthNumber(stats[key]);
  const round=value=>value===null?null:Math.round(value*1000)/1000;
  return {
    validations:s.validationAttempts,publications:s.published,firstAttemptSuccesses:s.successfulFirstPass,
    firstPassSuccessRate:s.firstAttempts?round(s.successfulFirstPass/s.firstAttempts):null,
    attemptsPerPublication:s.publicationsWithAttemptHistory?round(s.attemptsForPublished/s.publicationsWithAttemptHistory):null,
    deferred:s.deferred,needsReview:s.needsReview,r32Failures:s.validationFailures,activityLikeFailures:s.r32FalsePositiveLikeFailures,
    lengthFailures:s.lengthFailures,ruleFailures:s.ruleFailures,markdownFailures:s.markdownFailures,contractFailures:s.contractFailures,
    otherFailures:s.otherFailures,publicationFailures:s.publicationFailures,preservedExisting:s.preservedExisting,
    rejectionRate:s.validationAttempts?round(s.validationFailures/s.validationAttempts):null,
    deferredRate:s.firstAttempts?round(s.deferred/s.firstAttempts):null,
    currentFirstPassStreak:includeStreak?mlsAutooptHealthNumber(stats.consecutiveFirstPassSuccesses):null,
    successfulWords:{min:mlsAutooptHealthNumber(stats.minimumSuccessful)||null,max:mlsAutooptHealthNumber(stats.maximumSuccessful)||null,
      average:s.published?Math.round((s.wordsSuccessful/s.published)*10)/10:null},
    sample:{firstAttempts:s.firstAttempts,publications:s.published,validationAttempts:s.validationAttempts}
  };
}
function mlsAutooptHealthAlert(metrics) {
  const sample=metrics.sample||{}, reasons=[];
  const enough=(sample.firstAttempts||0)>=MLS_AUTOOPT_HEALTH_MIN_FIRST_ATTEMPTS || (sample.publications||0)>=MLS_AUTOOPT_HEALTH_MIN_PUBLICATIONS;
  if(metrics.needsReview>0) reasons.push('Hay entradas en needs review.');
  if((sample.firstAttempts||0)>=MLS_AUTOOPT_HEALTH_MIN_FIRST_ATTEMPTS && metrics.deferred>=2 && (metrics.deferredRate||0)>=0.15) reasons.push('Deferred proporcionalmente alto en la muestra viva.');
  if((sample.validationAttempts||0)>=10 && (metrics.rejectionRate||0)>=0.30) reasons.push('Rechazos R32 proporcionalmente altos en la muestra viva.');
  if((sample.firstAttempts||0)>=10 && metrics.firstPassSuccessRate!==null && metrics.firstPassSuccessRate<0.70) reasons.push('La tasa de primer intento vivo cayó por debajo de 70 %.');
  if(reasons.length) return {status:'vigilar',reasons,conclusive:false};
  if(!enough) return {status:'evidencia insuficiente',reasons:['La muestra viva aún no alcanza el umbral diagnóstico.'],conclusive:false};
  return {status:'estable',reasons:['No hay señales diagnósticas de regresión con la muestra viva disponible.'],conclusive:false};
}
function mlsAutooptHealthGroups(rows, mode) {
  const groups=new Map();
  for(const row of rows||[]) {
    const scope=mlsAutooptHealthScope(row.scope_id), meta={language:scope.language}; let key;
    if(mode==='language') key=scope.language; else if(mode==='family'){key=scope.language+'|'+scope.family;meta.family=scope.family;} else {key=scope.language+'|'+scope.level;meta.level=scope.level;}
    if(!groups.has(key)) groups.set(key,{meta,stats:{},updatedAt:null});
    const group=groups.get(key); let stats={}; try{stats=JSON.parse(row.stats||'{}');}catch{}
    mlsAutooptHealthMerge(group.stats,stats); if(row.updated_at&&(!group.updatedAt||row.updated_at>group.updatedAt))group.updatedAt=row.updated_at;
  }
  return [...groups.values()].map(group=>{const metrics=mlsAutooptHealthMetrics(group.stats,false);return {...group.meta,updatedAt:group.updatedAt,metrics,alert:mlsAutooptHealthAlert(metrics)};})
    .sort((a,b)=>String(a.language).localeCompare(String(b.language))||String(a.family||a.level||'').localeCompare(String(b.family||b.level||'')));
}
function mlsAutooptHealthEmptyLive() {
  const metrics=mlsAutooptHealthMetrics({});
  return {eventCount:0,lastObservationAt:null,metrics,alert:mlsAutooptHealthAlert(metrics),byLanguage:[],byFamily:[],byLevel:[],byPrompt:[]};
}
async function mlsAutooptHealthLive(env) {
  const currentPrompt=MLS_CHAT_CONTRACT.promptVersion;
  const count=await env.WIKI_DB.prepare('SELECT COUNT(*) AS n, MAX(created_at) AS last_at FROM wiki_autoopt_events WHERE version=?').bind(MLS_AUTOOPT_VERSION).first();
  const current=await env.WIKI_DB.prepare("SELECT stats,updated_at FROM wiki_autoopt_stats WHERE version=? AND prompt=? AND scope='global' AND scope_id='*'").bind(MLS_AUTOOPT_VERSION,currentPrompt).first();
  const {results:familyRows}=await env.WIKI_DB.prepare("SELECT scope_id,family,stats,updated_at FROM wiki_autoopt_stats WHERE version=? AND prompt=? AND scope='family'").bind(MLS_AUTOOPT_VERSION,currentPrompt).all();
  const {results:promptRows}=await env.WIKI_DB.prepare("SELECT prompt,stats,updated_at FROM wiki_autoopt_stats WHERE version=? AND scope='global' AND scope_id='*' ORDER BY prompt").bind(MLS_AUTOOPT_VERSION).all();
  let currentStats={}; try{currentStats=current?JSON.parse(current.stats||'{}'):{};}catch{}
  const metrics=mlsAutooptHealthMetrics(currentStats);
  return {eventCount:mlsAutooptHealthNumber(count?.n),lastObservationAt:count?.last_at||null,updatedAt:current?.updated_at||null,metrics,alert:mlsAutooptHealthAlert(metrics),
    byLanguage:mlsAutooptHealthGroups(familyRows,'language'),byFamily:mlsAutooptHealthGroups(familyRows,'family'),byLevel:mlsAutooptHealthGroups(familyRows,'level'),
    byPrompt:(promptRows||[]).map(row=>{let stats={};try{stats=JSON.parse(row.stats||'{}');}catch{}const m=mlsAutooptHealthMetrics(stats);return {promptVersion:row.prompt,updatedAt:row.updated_at||null,metrics:m,alert:mlsAutooptHealthAlert(m)};})};
}
function mlsAutooptHealthHistoryAggregate(rows, mode) {
  const map=new Map();
  for(const row of rows||[]) {
    const scope=mlsAutooptHealthScope(row.family_key), meta={language:scope.language}; let key;
    if(mode==='language')key=scope.language;else if(mode==='family'){key=scope.language+'|'+scope.family;meta.family=scope.family;}else if(mode==='level'){key=scope.language+'|'+scope.level;meta.level=scope.level;}
    else if(mode==='profile'){key=row.family_key+'|'+row.profile_key;meta.level=scope.level;meta.family=scope.family;meta.profile=row.profile_key;}else{key=row.prompt;delete meta.language;meta.promptVersion=row.prompt;}
    if(!map.has(key))map.set(key,{meta,publications:0,incidents:0,words:0,sections:0,references:0,activityLike:0,length:0});
    const x=map.get(key);x.publications+=mlsAutooptHealthNumber(row.publications);x.incidents+=mlsAutooptHealthNumber(row.incidents);x.words+=mlsAutooptHealthNumber(row.words_sum);
    x.sections+=mlsAutooptHealthNumber(row.sections_sum);x.references+=mlsAutooptHealthNumber(row.references_sum);x.activityLike+=mlsAutooptHealthNumber(row.activity_like);x.length+=mlsAutooptHealthNumber(row.length_errors);
  }
  return [...map.values()].map(x=>({...x.meta,publications:x.publications,incidents:x.incidents,meanPublishedWords:x.publications?Math.round((x.words/x.publications)*10)/10:null,
    activityLikeIncidents:x.activityLike,lengthIncidents:x.length,firstPassSuccessRate:null,attemptsPerPublication:null,linguisticCorrectness:'not-certified'}));
}
function mlsAutooptHealthEmptyHistory(enabled) {
  return {enabled,available:enabled,evidenceCount:0,activeBatchCount:0,activeBatches:[],boundedMaxWeight:0.2,firstPassSuccessRate:null,attemptsPerPublication:null,
    byLanguage:[],byFamily:[],byLevel:[],byProfile:[],byPrompt:[],note:'La evidencia histórica tiene peso acotado y no equivale a intentos vivos.'};
}
async function mlsAutooptHealthHistory(env) {
  const enabled=mlsAutooptHistoryEnabled(env);if(!enabled)return mlsAutooptHealthEmptyHistory(false);
  try {
    const batches=await env.WIKI_DB.prepare("SELECT id,cutoff,expected,created_at FROM wiki_autoopt_history_batches WHERE state='active' ORDER BY created_at").all();
    const count=await env.WIKI_DB.prepare(`SELECT COUNT(*) AS n FROM wiki_autoopt_history_items i JOIN wiki_autoopt_history_batches b ON b.id=i.batch_id AND b.state='active' WHERE i.version=?`).bind(MLS_AUTOOPT_HISTORY_VERSION).first();
    const {results}=await env.WIKI_DB.prepare(`SELECT s.prompt,s.family_key,s.profile_key,s.publications,s.incidents,s.words_sum,s.sections_sum,s.references_sum,s.activity_like,s.length_errors
      FROM wiki_autoopt_history_stats s JOIN wiki_autoopt_history_batches b ON b.id=s.batch_id AND b.state='active' WHERE s.version=?`).bind(MLS_AUTOOPT_HISTORY_VERSION).all();
    const current=(results||[]).filter(row=>row.prompt===MLS_CHAT_CONTRACT.promptVersion);
    return {enabled:true,available:true,evidenceCount:mlsAutooptHealthNumber(count?.n),activeBatchCount:(batches.results||[]).length,
      activeBatches:(batches.results||[]).map(x=>({id:x.id,cutoff:x.cutoff,expected:x.expected,createdAt:x.created_at})),boundedMaxWeight:0.2,firstPassSuccessRate:null,attemptsPerPublication:null,
      byLanguage:mlsAutooptHealthHistoryAggregate(current,'language'),byFamily:mlsAutooptHealthHistoryAggregate(current,'family'),byLevel:mlsAutooptHealthHistoryAggregate(current,'level'),
      byProfile:mlsAutooptHealthHistoryAggregate(current,'profile'),byPrompt:mlsAutooptHealthHistoryAggregate(results||[],'prompt'),
      note:'La evidencia histórica tiene peso acotado, no reconstruye intentos y no certifica exactitud lingüística.'};
  } catch {console.error('mls-autoopt-health-history-unavailable');return {...mlsAutooptHealthEmptyHistory(true),available:false,note:'El historial está habilitado pero sus agregados no están disponibles; el aprendizaje vivo continúa sin bloquearse.'};}
}
async function mlsAutooptHealth(env) {
  const enabled=mlsAutooptEnabled(env),historyEnabled=mlsAutooptHistoryEnabled(env);let live=mlsAutooptHealthEmptyLive(),liveAvailable=!enabled,partial=false;
  if(enabled){try{live=await mlsAutooptHealthLive(env);liveAvailable=true;}catch{console.error('mls-autoopt-health-live-unavailable');partial=true;}}
  const history=await mlsAutooptHealthHistory(env);if(historyEnabled&&!history.available)partial=true;
  return {ok:true,generatedAt:new Date().toISOString(),autoopt:{enabled,historyEnabled,version:MLS_AUTOOPT_VERSION,promptVersion:MLS_CHAT_CONTRACT.promptVersion},live:{...live,available:liveAvailable},history,
    health:{status:live.alert.status,reasons:live.alert.reasons,diagnosticOnly:true,partial},samplePolicy:{minimumFirstAttempts:MLS_AUTOOPT_HEALTH_MIN_FIRST_ATTEMPTS,
      minimumPublications:MLS_AUTOOPT_HEALTH_MIN_PUBLICATIONS,watchFirstPassBelow:0.70,watchRejectionAtOrAbove:0.30,watchDeferredAtOrAbove:0.15},
    privacy:{aggregatedOnly:true,contentExposed:false,promptsExposed:false,secretsExposed:false}};
}
async function handleMlsAutooptHealth(request,env) {
  if(request.method!=='GET') return mlsChatJson({ok:false,error:'Método no permitido.'},405);
  try {await mlsChatAuthenticate(request,env);return mlsChatJson(await mlsAutooptHealth(env));}
  catch(error){if(!error.status)console.error('mls-autoopt-health-failure');return mlsChatJson({ok:false,error:error.status?error.message:'Panel AUTOOPT temporalmente no disponible.'},error.status||500);}
}
if (typeof module !== 'undefined' && module.exports) module.exports={mlsAutooptHealthMetrics,mlsAutooptHealthAlert,mlsAutooptHealthGroups,mlsAutooptHealthHistoryAggregate};
