// Deterministic, zero-cost diagnostics for deferred editorial incidents.
// This module never generates, publishes, retries or changes FIFO by itself.
const MLS_DEFERRED_RESCUE_VERSION = '1.0';
const MLS_DEFERRED_RULES = [
  {category:'provider',retryable:true,confidence:'alta',re:/\b(provider|workers ai|cloudflare ai|quota|capacity|timeout|temporar|network|upstream|fetch|429|503|rate limit)\b/i,
    action:'Reintentar más tarde sin cambiar el prompt editorial ni reducir R32.'},
  {category:'references',retryable:true,confidence:'alta',re:/\b(referenc|referencecodes|calibra|published[- ]corpus|declarar todas las referencias)\b/i,
    action:'Regenerar usando y declarando exactamente las referencias exigidas por el contexto.'},
  {category:'length',retryable:true,confidence:'alta',re:/\b(palabras?|words?|extension|extensi[oó]n|caracteres|length|demasiado corto|demasiado largo|m[ií]nimo|m[aá]ximo)\b/i,
    action:'Regenerar conservando estructura y contenido útil, corrigiendo únicamente la extensión exigida.'},
  {category:'format',retryable:true,confidence:'alta',re:/\b(markdown|html|script|iframe|object|embed|javascript|formato|format)\b/i,
    action:'Normalizar el formato y eliminar Markdown, HTML o elementos prohibidos por el contrato editorial.'},
  {category:'structure',retryable:true,confidence:'media',re:/\b(secci[oó]n|secciones|encabezad|heading|estructura|orden|truncad|incomplet)\b/i,
    action:'Reconstruir las secciones obligatorias y el orden editorial sin alterar el estándar R32.'},
  {category:'semantic-risk',retryable:false,confidence:'media',re:/\b(sem[aá]ntic|conceptual|ling[uü][ií]stic|gram[aá]tic|precisi[oó]n|incorrect|contradic|factual)\b/i,
    action:'Enviar a revisión semántica humana o por muestra antes de autorizar un nuevo intento.'},
  {category:'contract',retryable:true,confidence:'media',re:/\b(contrato|contract|r32|actividad|curso|ejercicio|quiz|cta|regla|rule|voseo|tuteo|idioma|nivel|coincide|rango)\b/i,
    action:'Regenerar respetando estrictamente la regla R32 incumplida; no debilitar el contrato.'}
];
function mlsDeferredText(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
}
function mlsDeferredContext(contextLike) {
  if (!contextLike) return {};
  if (typeof contextLike === 'object') return contextLike;
  try { return JSON.parse(contextLike); } catch { return {}; }
}
function mlsDeferredFamily(target={}) {
  if (typeof mlsAutooptFamily === 'function') return mlsAutooptFamily(target);
  return String(target.family || target.grammarFamily || 'unknown');
}
function mlsDeferredClassify(input={}) {
  const originalReason = String(input.reason || input.last_validation_error || '');
  const combined = [input.reason_code,input.reason,input.last_validation_error].filter(Boolean).join(' ');
  const normalized = mlsDeferredText(combined);
  const match = MLS_DEFERRED_RULES.find(rule => rule.re.test(normalized));
  if (!match) return {category:'unknown',reasonCode:String(input.reason_code || 'unknown'),originalReason,
    evidence:originalReason || 'No hay evidencia suficiente para clasificar la incidencia.',suggestedAction:'Mantener deferred y solicitar revisión humana antes de rescatar.',
    confidence:'baja',retryable:false};
  return {category:match.category,reasonCode:String(input.reason_code || match.category),originalReason,
    evidence:originalReason || String(input.last_validation_error || combined).slice(0,1000),suggestedAction:match.action,
    confidence:match.confidence,retryable:match.retryable};
}
function mlsDeferredDiagnose(row={}, contextLike={}) {
  const context = mlsDeferredContext(contextLike || row.context_json);
  const target = context.target || {};
  const diagnosis = mlsDeferredClassify(row);
  return {
    entryId:String(row.code || target.code || 'unknown'),
    language:String(target.language || row.language || 'unknown'),
    family:mlsDeferredFamily(target),
    status:String(row.rescue_state || row.status || 'deferred'),
    ...diagnosis,
    editorialAttempts:Number(row.editorial_attempts || 0),
    runnerAttempts:Number(row.runner_attempts || 0),
    createdAt:row.created_at || null,
    updatedAt:row.updated_at || null,
    version:MLS_DEFERRED_RESCUE_VERSION
  };
}
function mlsDeferredAggregate(diagnostics=[]) {
  const countBy = key => {
    const map=new Map();
    for(const d of diagnostics){const value=String(d[key]||'unknown');map.set(value,(map.get(value)||0)+1);}
    return [...map.entries()].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
  };
  const familyMap=new Map();
  for(const d of diagnostics){const key=d.language+'|'+d.family;familyMap.set(key,(familyMap.get(key)||0)+1);}
  return {
    total:diagnostics.length,
    retryable:diagnostics.filter(x=>x.retryable).length,
    notRetryable:diagnostics.filter(x=>!x.retryable).length,
    byCategory:countBy('category'),
    byLanguage:countBy('language'),
    byFamily:[...familyMap.entries()].map(([key,count])=>{const [language,...rest]=key.split('|');return {language,family:rest.join('|'),count};}).sort((a,b)=>b.count-a.count||a.language.localeCompare(b.language)||a.family.localeCompare(b.family)),
    byState:countBy('status'),
    unknown:diagnostics.filter(x=>x.category==='unknown').length
  };
}
async function mlsDeferredOpenDiagnostics(env) {
  const {results}=await env.WIKI_DB.prepare(`SELECT i.id,i.code,i.reason,i.reason_code,i.editorial_attempts,i.last_validation_error,
    i.created_at,i.updated_at,i.rescue_state,i.runner_attempts,c.context_json
    FROM wiki_chat_incidents i LEFT JOIN wiki_chat_contexts c ON c.id=i.context_id
    WHERE i.rescue_state IN ('pending','claimed','chat_claimed','needs_review')
      AND NOT EXISTS (SELECT 1 FROM wiki_articles a WHERE a.code=i.code)
    ORDER BY i.created_at`).all();
  return (results||[]).map(row=>mlsDeferredDiagnose(row,row.context_json));
}
async function mlsDeferredHealth(env) {
  const diagnostics=await mlsDeferredOpenDiagnostics(env);
  return {version:MLS_DEFERRED_RESCUE_VERSION,diagnosticOnly:true,automaticRescue:false,automaticPublish:false,fifoChanged:false,
    ...mlsDeferredAggregate(diagnostics),items:diagnostics.slice(0,100)};
}
async function mlsDeferredDiagnosisForCode(env, code) {
  const row=await env.WIKI_DB.prepare(`SELECT i.id,i.code,i.reason,i.reason_code,i.editorial_attempts,i.last_validation_error,
    i.created_at,i.updated_at,i.rescue_state,i.runner_attempts,c.context_json
    FROM wiki_chat_incidents i LEFT JOIN wiki_chat_contexts c ON c.id=i.context_id
    WHERE i.code=? AND i.rescue_state IN ('pending','claimed','chat_claimed','needs_review')
    ORDER BY i.updated_at DESC LIMIT 1`).bind(code).first();
  return row?mlsDeferredDiagnose(row,row.context_json):null;
}
function mlsDeferredAttachRuntime() {
  if (typeof mlsAutooptHealth === 'function' && !mlsAutooptHealth.__deferredWrapped) {
    const baseHealth=mlsAutooptHealth;
    const wrapped=async function(env){
      const data=await baseHealth(env);
      try { data.deferredIntelligence=await mlsDeferredHealth(env); }
      catch { data.deferredIntelligence={version:MLS_DEFERRED_RESCUE_VERSION,available:false,diagnosticOnly:true,total:0,byCategory:[],byLanguage:[],byFamily:[],items:[]}; if(data.health)data.health.partial=true; }
      return data;
    };
    wrapped.__deferredWrapped=true; mlsAutooptHealth=wrapped;
  }
  if (typeof mlsChatNext === 'function' && !mlsChatNext.__deferredWrapped) {
    const baseNext=mlsChatNext;
    const wrapped=async function(env,id){
      const data=await baseNext(env,id);
      if(data?.run?.runType==='rescue-chat' && data?.context?.target?.code){
        try { data.rescueDiagnosis=await mlsDeferredDiagnosisForCode(env,data.context.target.code); }
        catch { data.rescueDiagnosis=null; }
        if(data.rescueDiagnosis) data.instruction += ' Usar rescueDiagnosis como guía diagnóstica; no rebajar R32 ni publicar sin validación normal.';
      }
      return data;
    };
    wrapped.__deferredWrapped=true; mlsChatNext=wrapped;
  }
}
mlsDeferredAttachRuntime();
if (typeof module !== 'undefined' && module.exports) module.exports={MLS_DEFERRED_RESCUE_VERSION,mlsDeferredClassify,mlsDeferredDiagnose,mlsDeferredAggregate};
