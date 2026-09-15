// MLS AUTOOPT 1.0. Deterministic metadata only; no provider or generation calls.
const MLS_AUTOOPT_VERSION = '1.0';
function mlsAutooptEnabled(env) { return env.AUTOOPT_ENABLED === true || env.AUTOOPT_ENABLED === 'true'; }
function mlsAutooptFamily(target = {}) {
  const normalize = x => String(x || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const rules = [
    ['variedad_guatemalteca', /\b(voseo|guatemaltec\w*|chapin\w*)\b/],
    ['norma_variacion', /\b(norma|variacion|variante\w*|dialecto\w*)\b/],
    ['conjugacion_verbal', /\b(conjugacion|preterito|futuro|participio|gerundio|verbo\w*|verb\w*|tense\w*)\b/],
    ['pronombres_regimen', /\b(pronombre\w*|regimen|clitico\w*|pronoun\w*)\b/],
    ['concordancia', /\b(concordancia|agreement)\b/],
    ['subordinacion', /\b(subordinad\w*|subordinacion|relativ\w*)\b/],
    ['modalidad_pragmatica', /\b(modalidad|pragmatica|cortesia|deixis)\b/],
    ['escritura_academica', /\b(academic\w*|cita\w*|bibliografia)\b/],
    ['ortografia_morfologia', /\b(ortografia|morfologia|tilde\w*|acent\w*|prefijo\w*|sufijo\w*)\b/],
    ['lexico_construcciones', /\b(lexico|locucion\w*|construccion\w*|colocacion\w*)\b/],
    ['discurso_cohesion', /\b(discurso|cohesion|conector\w*|coherencia)\b/]
  ];
  // Title takes precedence; ambiguous matches deliberately abstain.
  for (const source of [target.title, [target.chapter, target.part].join(' ')]) {
    const matches = rules.filter(([, re]) => re.test(normalize(source)));
    if (matches.length) return matches.length === 1 ? matches[0][0] : 'unknown';
  }
  return 'unknown';
}
function mlsAutooptError(message) {
  const text = String(message || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/actividad o curso/.test(text)) return 'r32_activity_like'; // Suspected, never adjudicated false positive.
  if (/palabras|extension|16000 caracteres/.test(text)) return 'length';
  if (/encabezad|secciones|markdown|html|enlaces|incomplet|truncad/.test(text)) return 'markdown';
  if (/referenc|calibra|revision|codigo|idioma|falta|nivel|coincide|rango/.test(text)) return 'contract';
  if (/regla|linguistic|gramatic|voseo|tuteo/.test(text)) return 'rule';
  return 'other';
}
function mlsAutooptBounds(context, contract = MLS_CHAT_CONTRACT) {
  const p = context.profile || {}, w = p.words || {};
  let min = Number(contract.minimumWords) || 90, max = Number(contract.maximumWords) || 100000;
  if (p.sampleSize > 0 && w.min > 0 && w.max > 0) {
    min = Math.max(min, Math.floor(w.min * 0.5));
    max = Math.min(max, Math.max(min + 1, Math.ceil(w.max * 1.8)));
  }
  return {min, max, conflict:max<min};
}
function mlsAutooptKey(context) {
  return [context.target.language, context.target.level, mlsAutooptFamily(context.target)].join(':');
}
function mlsAutooptSchema() {
  const count = name => `COALESCE(json_extract(NEW.data, '$.${name}'),0)`;
  const kind = k => `(NEW.kind = '${k}')`;
  const published = kind('published'), validation = kind('validation');
  const valid = count('valid'), first = `(${count('attempt')} = 1)`;
  const metrics = {
    validationAttempts: validation, validationFailures: `(${validation} AND NOT ${valid})`,
    successfulFirstPass: `(${validation} AND ${valid} AND ${first})`,
    firstAttempts: `(${validation} AND ${first})`,
    published, publicationsWithAttemptHistory: `(${published} AND ${count('attempt')} > 0)`, firstPassPublished: `(${published} AND ${first})`,
    attemptsForPublished: `(${published} * ${count('attempt')})`,
    wordsSuccessful: `(${published} * ${count('words')})`,
    sectionsSuccessful: `(${published} * ${count('sections')})`,
    referencesSuccessful: `(${published} * ${count('references')})`,
    preservedExisting: kind('preserved'), publicationFailures: kind('publication_failure'),
    deferred: kind('deferred'), needsReview: kind('needs_review'),
    elapsedMsSuccessful: `(${published} * ${count('elapsedMs')})`
  };
  for (const [category, metric] of Object.entries({length:'lengthFailures', r32_activity_like:'r32FalsePositiveLikeFailures',rule:'ruleFailures',markdown:'markdownFailures',contract:'contractFailures',other:'otherFailures'}))
    metrics[metric] = `(${validation} AND json_extract(NEW.data,'$.category') = '${category}')`;
  for (let i=0;i<5;i++) for (const [suffix, condition] of Object.entries({Attempts:validation,Valid:`(${validation} AND ${valid})`,Published:published}))
    metrics['bucket'+i+suffix] = `(${condition} AND ${count('bucket')} = ${i})`;
  for (const [name, flag] of Object.entries({tables:'tables',lists:'lists',examples:'examples'}))
    metrics[name+'Successful'] = `(${published} AND ${count(flag)} > 0)`;
  const updates = Object.entries(metrics).map(([name,expression]) => `'$.${name}',COALESCE(json_extract(stats,'$.${name}'),0)+${expression}`);
  updates.push(`'$.minimumSuccessful',CASE WHEN ${published} THEN MIN(COALESCE(json_extract(stats,'$.minimumSuccessful'),${count('words')}),${count('words')}) ELSE json_extract(stats,'$.minimumSuccessful') END`);
  updates.push(`'$.maximumSuccessful',CASE WHEN ${published} THEN MAX(COALESCE(json_extract(stats,'$.maximumSuccessful'),0),${count('words')}) ELSE json_extract(stats,'$.maximumSuccessful') END`);
  updates.push(`'$.learnedMinimum',CASE WHEN ${published} AND ${count('words')} < COALESCE(json_extract(stats,'$.learnedMinimum'),0) THEN MAX(${count('estimatedMinimum')},${count('words')}) ELSE MAX(COALESCE(json_extract(stats,'$.learnedMinimum'),0),${count('observedMinimum')}) END`);
  updates.push(`'$.consecutiveFirstPassSuccesses',CASE WHEN ${validation} AND NOT ${valid} THEN 0 WHEN ${published} AND ${first} THEN COALESCE(json_extract(stats,'$.consecutiveFirstPassSuccesses'),0)+1 WHEN ${published} THEN 0 ELSE COALESCE(json_extract(stats,'$.consecutiveFirstPassSuccesses'),0) END`);
  return [
    `CREATE TABLE IF NOT EXISTS wiki_autoopt_events (id TEXT PRIMARY KEY, token TEXT NOT NULL, version TEXT NOT NULL, prompt TEXT NOT NULL, run_id TEXT NOT NULL, context_id TEXT NOT NULL, code TEXT NOT NULL, family TEXT NOT NULL, family_key TEXT NOT NULL, kind TEXT NOT NULL, draft_id TEXT, data TEXT NOT NULL, response TEXT, created_at TEXT NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS wiki_autoopt_context ON wiki_autoopt_events(context_id,kind)`,
    `CREATE INDEX IF NOT EXISTS wiki_autoopt_draft ON wiki_autoopt_events(draft_id,kind)`,
    `CREATE INDEX IF NOT EXISTS wiki_autoopt_retention ON wiki_autoopt_events(created_at)`,
    `CREATE TABLE IF NOT EXISTS wiki_autoopt_stats (version TEXT NOT NULL, prompt TEXT NOT NULL, scope TEXT NOT NULL, scope_id TEXT NOT NULL, family TEXT NOT NULL, stats TEXT NOT NULL DEFAULT '{}', updated_at TEXT NOT NULL, PRIMARY KEY(version,prompt,scope,scope_id))`,
    `CREATE TRIGGER IF NOT EXISTS wiki_autoopt_accumulate AFTER INSERT ON wiki_autoopt_events BEGIN
      INSERT OR IGNORE INTO wiki_autoopt_stats VALUES(NEW.version,NEW.prompt,'global','*','*','{}',NEW.created_at);
      INSERT OR IGNORE INTO wiki_autoopt_stats VALUES(NEW.version,NEW.prompt,'family',NEW.family_key,NEW.family,'{}',NEW.created_at);
      INSERT OR IGNORE INTO wiki_autoopt_stats VALUES(NEW.version,NEW.prompt,'run',NEW.run_id,'*','{}',NEW.created_at);
      UPDATE wiki_autoopt_stats SET stats=json_set(stats,${updates.join(',')}),updated_at=NEW.created_at
      WHERE version=NEW.version AND prompt=NEW.prompt AND ((scope='global' AND scope_id='*') OR (scope='family' AND scope_id=NEW.family_key) OR (scope='run' AND scope_id=NEW.run_id));
    END`
  ];
}
const mlsAutooptReady = new WeakMap();
async function mlsAutooptEnsure(env) {
  let ready=mlsAutooptReady.get(env.WIKI_DB);
  if(!ready) {
    ready=env.WIKI_DB.batch(mlsAutooptSchema().map(sql=>env.WIKI_DB.prepare(sql)));
    mlsAutooptReady.set(env.WIKI_DB,ready);
    ready.catch(()=>mlsAutooptReady.delete(env.WIKI_DB));
  }
  await ready;
}
function mlsAutooptRetention() {
  // Bounded incremental cleanup. Active contexts retain receipts for safe retries.
  return [
    `DELETE FROM wiki_autoopt_events WHERE id IN (SELECT e.id FROM wiki_autoopt_events e
      WHERE e.created_at < strftime('%Y-%m-%dT%H:%M:%fZ','now','-90 days')
      AND NOT EXISTS (SELECT 1 FROM wiki_chat_runs r WHERE r.id=e.run_id AND r.status='active')
      ORDER BY e.created_at LIMIT 100)`,
    `DELETE FROM wiki_autoopt_stats WHERE rowid IN (SELECT s.rowid FROM wiki_autoopt_stats s
      WHERE s.scope='run' AND s.updated_at < strftime('%Y-%m-%dT%H:%M:%fZ','now','-90 days')
      AND NOT EXISTS (SELECT 1 FROM wiki_chat_runs r WHERE r.id=s.scope_id AND r.status='active') LIMIT 100)`
  ];
}
function mlsAutooptFeatures(context, markdown, category = '') {
  const text = typeof markdown === 'string' ? markdown.trim() : '';
  const words = text ? text.split(/\s+/u).length : 0;
  const b = mlsAutooptBounds(context);
  return {words, sections:(text.match(/^####\s+.+$/gmu)||[]).length,
    references:context.references.length, referenceCodes:context.references.map(x=>x.code),
    estimatedMinimum:b.min, estimatedTarget:Math.min(b.max,Math.ceil(b.min*1.08)),
    observedMinimum:category==='length' && words<b.min ? b.min : 0,
    bucket:words<300?0:words<600?1:words<1000?2:words<1600?3:4,
    errorCodes:category?[category]:[],
    tables:/^\|.+\|/mu.test(text)?1:0, lists:/^\s*(?:[-*]|\d+\.)\s/mu.test(text)?1:0,
    examples:/^####\s+.*ejemplo/imu.test(text)?1:0, category};
}
function mlsAutooptEvent(env, {id,token,context,runId,contextId,kind,draftId=null,data={},response=null,predicate='1',predicateArgs=[]}) {
  // Numbering happens inside the transaction, not in a read/modify/write cycle.
  const attempt = kind==='validation'
    ? `(SELECT COUNT(*)+1 FROM wiki_autoopt_events WHERE context_id=? AND kind='validation')`
    : `COALESCE((SELECT MIN(json_extract(data,'$.attempt')) FROM wiki_autoopt_events WHERE draft_id=? AND kind='validation' AND json_extract(data,'$.valid')=1),0)`;
  return env.WIKI_DB.prepare(`INSERT OR IGNORE INTO wiki_autoopt_events
    SELECT ?,?,?,?,?,?,?,?,?,?,?,json_set(?,'$.attempt',${attempt}),?,? WHERE ${predicate}`)
    .bind(id,token,MLS_AUTOOPT_VERSION,context.promptVersion,runId,contextId,context.target.code,
      mlsAutooptFamily(context.target),mlsAutooptKey(context),kind,draftId,JSON.stringify(data),
      kind==='validation'?contextId:draftId,response?JSON.stringify(response):null,new Date().toISOString(),...predicateArgs);
}
async function mlsAutooptProfile(env, context) {
  const row = await env.WIKI_DB.prepare("SELECT stats FROM wiki_autoopt_stats WHERE version=? AND prompt=? AND scope='family' AND scope_id=?")
    .bind(MLS_AUTOOPT_VERSION,context.promptVersion,mlsAutooptKey(context)).first();
  const s = row ? JSON.parse(row.stats) : {};
  const bounds = mlsAutooptBounds(context), total=s.validationAttempts||0, publications=s.published||0;
  const min=Math.min(bounds.max,Math.max(bounds.min,s.learnedMinimum||0));
  // A small safety margin; observed successful minimum shrinks gradually toward
  // the authoritative floor as confidence grows, never below it.
  const observed=s.minimumSuccessful||min;
  const excess=Math.max(0,observed-min) * Math.max(0.1,1/(1+publications));
  const target=Math.min(bounds.max,Math.ceil(Math.max(min*(1.08+Math.min(0.08,(s.lengthFailures||0)/Math.max(1,total)*0.04)),min+excess)));
  const recommendations=['Mantener tono enciclopédico; referencias, profile y contrato tienen prioridad.',
    'Preservar variantes legítimas y voseo cuando sea pertinente; no imponer tuteo ni añadir voseo artificialmente.'];
  if(s.r32FalsePositiveLikeFailures) recommendations.push('Evitar lenguaje instructivo y formulaciones pedagógicas; conservar cobertura lingüística, sin ejercicios ni tareas.');
  if(s.lengthFailures) recommendations.push('Respetar el mínimo actual del corpus con un pequeño margen; ampliar explicación lingüística, sin relleno.');
  const patterns=['length','r32_activity_like','rule','markdown','contract','other'].filter((_,i)=>s[['lengthFailures','r32FalsePositiveLikeFailures','ruleFailures','markdownFailures','contractFailures','otherFailures'][i]]>0);
  const round=x=>Math.round(x*1000)/1000;
  const p={version:MLS_AUTOOPT_VERSION,promptVersion:context.promptVersion,family:mlsAutooptFamily(context.target),
    history:total?'observed':'insufficient',confidence:round(publications/(publications+8)),observations:total,publications,
    recommendedWordRange:bounds.conflict?null:{min,target,max:Math.min(bounds.max,Math.ceil(target*1.1))},
    maximumCharacters:16000,
    firstPassSuccessRate:s.firstAttempts?round((s.successfulFirstPass||0)/s.firstAttempts):null,
    historicalAttemptsPerPublish:s.publicationsWithAttemptHistory?round((s.attemptsForPublished||0)/s.publicationsWithAttemptHistory):null,
    deferredRate:s.firstAttempts?round((s.deferred||0)/s.firstAttempts):null,
    r32Risk:!total?'unknown':(s.r32FalsePositiveLikeFailures||0)/total>=0.25?'high':s.r32FalsePositiveLikeFailures?'medium':'low',
    knownFailurePatterns:patterns,recommendations};
  if(bounds.conflict) p.recommendations.push('Requisitos de longitud incompatibles: resolver el contrato/profile; AUTOOPT no puede recomendar una extensión válida.');
  if(publications>=3) {
    const headingMax=Number(context.profile?.headings?.max)||0;
    if(headingMax) p.preferredSectionCount=Math.min(headingMax,Math.max(1,Math.round(s.sectionsSuccessful/publications)));
    p.successfulStructure={tablesRate:round(s.tablesSuccessful/publications),listsRate:round(s.listsSuccessful/publications),examplesRate:round(s.examplesSuccessful/publications)};
  }
  return p;
}
// Export only for administrative SQL tooling; Worker receives this as source.
if (typeof module !== 'undefined' && module.exports) module.exports={mlsAutooptSchema,mlsAutooptRetention};

async function mlsAutooptValidate(env, body) {
  const id='validation:'+await mlsChatHash(JSON.stringify([body.runId,body.contextId,body.code,
    body.articleMarkdown,Array.isArray(body.referenceCodes)?[...new Set(body.referenceCodes)].sort():body.referenceCodes,body.editorialReview]));
  const replay=async row=>{
    const result=JSON.parse(row.response);
    if(!result.valid) mlsChatError(422,result.error);
    return result;
  };
  const previous=await env.WIKI_DB.prepare('SELECT response FROM wiki_autoopt_events WHERE id=?').bind(id).first();
  if(previous) return replay(previous);
  const run=await mlsChatRun(env,body.runId);
  if(!run || run.status!=='active') mlsChatError(409,'El lote no está activo.');
  const item=run.entries.find(x=>x.status==='pending');
  if(!item || item.code!==body.code) mlsChatError(409,'El código no es la siguiente entrada del lote.');
  const saved=await env.WIKI_DB.prepare('SELECT * FROM wiki_chat_contexts WHERE id=? AND run_id=? AND code=?')
    .bind(body.contextId,run.id,item.code).first();
  if(!saved) mlsChatError(409,'Consulta primero el contexto de la siguiente entrada.');
  const context=JSON.parse(saved.context_json);
  let article,error;
  try { article=mlsChatValidateText(context,body.articleMarkdown,body.referenceCodes,body.editorialReview); }
  catch(e) { error=e; }
  const draftId=article?await mlsChatHash(run.id+'\n'+saved.id+'\n'+article.articleMarkdown):null;
  const result=article?{valid:true,draftId,code:item.code,words:article.articleMarkdown.split(/\s+/u).length,
    standard:'MLS R32',promptVersion:context.promptVersion,validation:'deterministic-r32',linguisticReview:'performed-by-chatgpt',published:false}
    :{valid:false,error:error.message};
  const category=error?mlsAutooptError(error.message):'';
  const data={...mlsAutooptFeatures(context,body.articleMarkdown,category),valid:article?1:0};
  const last=await env.WIKI_DB.prepare("SELECT data FROM wiki_autoopt_events WHERE context_id=? AND kind='validation' ORDER BY rowid DESC LIMIT 1").bind(saved.id).first();
  if(last) {
    const before=JSON.parse(last.data);
    data.transformation=data.words>before.words?'expanded':data.words<before.words?'shortened':data.sections!==before.sections?'restructured':'revised';
    data.previousCategory=before.category;
  }
  const token=crypto.randomUUID(),now=new Date().toISOString();
  // Only internally generated SHA256/UUID values are embedded in this guard.
  const gate=`EXISTS (SELECT 1 FROM wiki_autoopt_events WHERE id='${id}' AND token='${token}')`;
  const queries=[mlsAutooptEvent(env,{id,token,context,runId:run.id,contextId:saved.id,kind:'validation',draftId,data,response:result,
    predicate:`EXISTS (SELECT 1 FROM wiki_chat_runs WHERE id=? AND status='active')
      AND EXISTS (SELECT 1 FROM wiki_chat_items WHERE run_id=? AND code=? AND status='pending')`,predicateArgs:[run.id,run.id,item.code]})];
  if(article) {
    queries.push(env.WIKI_DB.prepare(`INSERT OR IGNORE INTO wiki_chat_drafts SELECT ?,?,?,?,?,?,? WHERE ${gate}`)
      .bind(draftId,run.id,item.code,saved.id,article.articleMarkdown,body.editorialReview,now));
  } else if(run.runType==='rescue-chat') {
    queries.push(env.WIKI_DB.prepare(`UPDATE wiki_chat_rescue_claims SET editorial_attempts=editorial_attempts+1,updated_at=?
      WHERE run_id=? AND incident_id=(SELECT id FROM wiki_chat_incidents WHERE code=? AND rescue_state='chat_claimed') AND ${gate}`).bind(now,run.id,item.code));
    const exhausted=`EXISTS (SELECT 1 FROM wiki_chat_rescue_claims c JOIN wiki_chat_incidents i ON i.id=c.incident_id
      WHERE c.run_id=? AND i.code=? AND c.editorial_attempts>=3)`;
    queries.push(env.WIKI_DB.prepare(`UPDATE wiki_chat_items SET status='needs_review' WHERE run_id=? AND code=? AND status='pending' AND ${gate} AND ${exhausted}`).bind(run.id,item.code,run.id,item.code));
    queries.push(env.WIKI_DB.prepare(`UPDATE wiki_chat_rescue_claims SET status='needs_review',updated_at=? WHERE run_id=? AND editorial_attempts>=3 AND ${gate}
      AND incident_id=(SELECT id FROM wiki_chat_incidents WHERE code=? AND rescue_state='chat_claimed')`).bind(now,run.id,item.code));
    queries.push(env.WIKI_DB.prepare(`UPDATE wiki_chat_incidents SET rescue_state='needs_review',runner_eligible=0,updated_at=? WHERE code=? AND rescue_state='chat_claimed' AND ${gate} AND ${exhausted}`).bind(now,item.code,run.id,item.code));
  } else {
    queries.push(env.WIKI_DB.prepare(`INSERT INTO wiki_chat_incidents(id,code,context_id,source_run_id,original_position,reason,reason_code,editorial_attempts,last_validation_error,created_at,updated_at)
      SELECT ?,?,?,?,?,?,'editorial_validation',1,?,?,? WHERE ${gate}
      ON CONFLICT(source_run_id,code) DO UPDATE SET editorial_attempts=editorial_attempts+1,last_validation_error=excluded.last_validation_error,updated_at=excluded.updated_at`)
      .bind(crypto.randomUUID(),item.code,saved.id,run.id,item.position,error.message.slice(0,3000),error.message.slice(0,3000),now,now));
    queries.push(env.WIKI_DB.prepare(`UPDATE wiki_chat_items SET status='deferred' WHERE run_id=? AND code=? AND status='pending' AND ${gate}
      AND EXISTS (SELECT 1 FROM wiki_chat_incidents WHERE source_run_id=? AND code=? AND editorial_attempts>=3)`).bind(run.id,item.code,run.id,item.code));
    queries.push(env.WIKI_DB.prepare(`UPDATE wiki_chat_incidents SET rescue_state='pending',runner_eligible=1,updated_at=? WHERE source_run_id=? AND code=? AND ${gate}
      AND EXISTS (SELECT 1 FROM wiki_chat_items WHERE run_id=? AND code=? AND status='deferred')`).bind(now,run.id,item.code,run.id,item.code));
    queries.push(env.WIKI_DB.prepare(`UPDATE wiki_chat_runs SET status='complete',updated_at=? WHERE id=? AND ${gate}
      AND NOT EXISTS (SELECT 1 FROM wiki_chat_items WHERE run_id=? AND status='pending')`).bind(now,run.id,run.id));
  }
  if(error) {
    // Terminal event copies the validation features and its transaction-assigned attempt.
    queries.push(env.WIKI_DB.prepare(`INSERT OR IGNORE INTO wiki_autoopt_events
      SELECT 'terminal:'||e.context_id,e.token,e.version,e.prompt,e.run_id,e.context_id,e.code,e.family,e.family_key,i.status,NULL,e.data,NULL,e.created_at
      FROM wiki_autoopt_events e JOIN wiki_chat_items i ON i.run_id=e.run_id AND i.code=e.code
      WHERE e.id=? AND e.token=? AND i.status IN ('deferred','needs_review')`).bind(id,token));
  }
  queries.push(...mlsAutooptRetention().map(sql=>env.WIKI_DB.prepare(sql)));
  await env.WIKI_DB.batch(queries);
  const receipt=await env.WIKI_DB.prepare('SELECT response FROM wiki_autoopt_events WHERE id=?').bind(id).first();
  if(!receipt) mlsChatError(409,'El lote cambió mientras se validaba; consulta MLS estado.');
  return replay(receipt);
}

async function mlsAutooptRunMetrics(env, run) {
  if(!run) return null;
  const row=await env.WIKI_DB.prepare("SELECT stats,updated_at FROM wiki_autoopt_stats WHERE version=? AND prompt=? AND scope='run' AND scope_id=?")
    .bind(MLS_AUTOOPT_VERSION,MLS_CHAT_CONTRACT.promptVersion,run.id).first();
  const s=row?JSON.parse(row.stats):{};
  return {version:MLS_AUTOOPT_VERSION,promptVersion:MLS_CHAT_CONTRACT.promptVersion,runId:run.id,runType:run.runType,selected:run.selected,
    ...s,averageAttemptsPerPublication:s.publicationsWithAttemptHistory?s.attemptsForPublished/s.publicationsWithAttemptHistory:null,
    firstPassSuccessRate:s.firstAttempts?s.successfulFirstPass/s.firstAttempts:null,
    observedValidationsPerPublication:s.published?s.validationAttempts/s.published:null,
    updatedAt:row?.updated_at||null};
}
async function mlsAutooptPublicationFailure(env,body) {
  // Deduplicate uncertain repeated failures per validated draft, not per timeout.
  // No exception text, credentials or request headers are retained.
  const d=await env.WIKI_DB.prepare('SELECT * FROM wiki_chat_drafts WHERE id=? AND run_id=?').bind(body.draftId,body.runId).first();
  if(!d) return;
  const item=await env.WIKI_DB.prepare('SELECT status FROM wiki_chat_items WHERE run_id=? AND code=?').bind(d.run_id,d.code).first();
  if(!item || ['published','external'].includes(item.status)) return;
  const saved=await env.WIKI_DB.prepare('SELECT context_json FROM wiki_chat_contexts WHERE id=?').bind(d.context_id).first();
  if(!saved) return;
  const context=JSON.parse(saved.context_json);
  await env.WIKI_DB.batch([mlsAutooptEvent(env,{id:'publication_failure:'+d.id,token:crypto.randomUUID(),context,
    runId:d.run_id,contextId:d.context_id,kind:'publication_failure',draftId:d.id,data:mlsAutooptFeatures(context,d.markdown),
    predicate:"NOT EXISTS (SELECT 1 FROM wiki_articles WHERE code=? AND audit_model=?)",predicateArgs:[d.code,'chat-draft-'+d.id]})]);
}
