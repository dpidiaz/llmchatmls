// MLS semantic sample audit. Private, human/ChatGPT-reviewed and zero provider cost.
// It never edits articles, publishes, retries, changes FIFO or certifies linguistic correctness.
const MLS_SEMANTIC_AUDIT_VERSION = '1.0';
const MLS_SEMANTIC_VERDICTS = new Set(['ok','watch','review_required']);
const MLS_SEMANTIC_CATEGORIES = new Set(['accuracy','terminology','examples','ambiguity','variety','factual','other']);
const MLS_SEMANTIC_CONFIDENCE = new Set(['low','medium','high']);
const MLS_SEMANTIC_REVIEWERS = new Set(['chatgpt','human']);
const mlsSemanticReady = new WeakMap();
function mlsSemanticFamily(target={}) {
  if (typeof mlsAutooptFamily === 'function') return mlsAutooptFamily(target);
  return String(target.family || target.grammarFamily || 'unknown');
}
function mlsSemanticSchema() {
  return [
    `CREATE TABLE IF NOT EXISTS wiki_semantic_audits (
      id TEXT PRIMARY KEY, version TEXT NOT NULL, code TEXT NOT NULL, article_generated_at TEXT NOT NULL,
      language TEXT NOT NULL, level TEXT NOT NULL, family TEXT NOT NULL, verdict TEXT NOT NULL,
      categories TEXT NOT NULL DEFAULT '[]', confidence TEXT NOT NULL, notes TEXT NOT NULL,
      reviewer TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      UNIQUE(code, article_generated_at))`,
    `CREATE INDEX IF NOT EXISTS wiki_semantic_audits_language ON wiki_semantic_audits(language, created_at)`,
    `CREATE INDEX IF NOT EXISTS wiki_semantic_audits_family ON wiki_semantic_audits(language, family, created_at)`,
    `CREATE INDEX IF NOT EXISTS wiki_semantic_audits_verdict ON wiki_semantic_audits(verdict, created_at)`
  ];
}
async function mlsSemanticEnsure(env) {
  let ready=mlsSemanticReady.get(env.WIKI_DB);
  if(!ready){
    ready=env.WIKI_DB.batch(mlsSemanticSchema().map(sql=>env.WIKI_DB.prepare(sql)));
    mlsSemanticReady.set(env.WIKI_DB,ready);ready.catch(()=>mlsSemanticReady.delete(env.WIKI_DB));
  }
  await ready;
}
function mlsSemanticValidateRecord(input={}) {
  const verdict=String(input.verdict||'');
  const confidence=String(input.confidence||'');
  const reviewer=String(input.reviewer||'');
  const notes=String(input.notes||'').trim();
  if(!MLS_SEMANTIC_VERDICTS.has(verdict)) mlsChatError(422,'verdict debe ser ok, watch o review_required.');
  if(!MLS_SEMANTIC_CONFIDENCE.has(confidence)) mlsChatError(422,'confidence debe ser low, medium o high.');
  if(!MLS_SEMANTIC_REVIEWERS.has(reviewer)) mlsChatError(422,'reviewer debe ser chatgpt o human.');
  if(notes.length<20||notes.length>3000) mlsChatError(422,'notes debe tener entre 20 y 3000 caracteres.');
  const categories=Array.isArray(input.categories)?[...new Set(input.categories.map(String))]:[];
  if(categories.some(x=>!MLS_SEMANTIC_CATEGORIES.has(x))) mlsChatError(422,'Hay una categoría semántica no permitida.');
  if(verdict!=='ok'&&!categories.length) mlsChatError(422,'watch y review_required requieren al menos una categoría.');
  return {verdict,confidence,reviewer,notes,categories};
}
function mlsSemanticAggregate(rows=[], totalPublished=0) {
  const byVerdict={ok:0,watch:0,review_required:0};
  const byLanguage=new Map(), byFamily=new Map(), byCategory=new Map();
  for(const row of rows){
    if(Object.prototype.hasOwnProperty.call(byVerdict,row.verdict)) byVerdict[row.verdict]++;
    byLanguage.set(row.language,(byLanguage.get(row.language)||0)+1);
    const fk=row.language+'|'+row.family;byFamily.set(fk,(byFamily.get(fk)||0)+1);
    let categories=[];try{categories=JSON.parse(row.categories||'[]');}catch{}
    for(const category of categories)byCategory.set(category,(byCategory.get(category)||0)+1);
  }
  const audited=rows.length;
  return {audited,totalPublished,coverage:totalPublished?Math.round((audited/totalPublished)*10000)/10000:0,
    ok:byVerdict.ok,watch:byVerdict.watch,reviewRequired:byVerdict.review_required,
    byVerdict:Object.entries(byVerdict).map(([name,count])=>({name,count})),
    byLanguage:[...byLanguage].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name)),
    byFamily:[...byFamily].map(([key,count])=>{const [language,...rest]=key.split('|');return {language,family:rest.join('|'),count};}).sort((a,b)=>b.count-a.count||a.language.localeCompare(b.language)||a.family.localeCompare(b.family)),
    byCategory:[...byCategory].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name))};
}
function mlsSemanticStatusFromAggregate(agg) {
  if(agg.reviewRequired>0)return {status:'vigilar',reasons:['La muestra semántica contiene entradas que requieren revisión.'],conclusive:false};
  if(agg.audited<10)return {status:'evidencia insuficiente',reasons:['Aún hay menos de 10 auditorías semánticas vigentes.'],conclusive:false};
  if(agg.watch>0)return {status:'vigilar',reasons:['La muestra semántica contiene observaciones para vigilar.'],conclusive:false};
  return {status:'estable',reasons:['La muestra auditada no contiene hallazgos semánticos graves; esto no certifica el corpus completo.'],conclusive:false};
}
async function mlsSemanticStatus(env) {
  await mlsSemanticEnsure(env);
  const total=await env.WIKI_DB.prepare('SELECT COUNT(*) AS n FROM wiki_articles').first();
  const {results}=await env.WIKI_DB.prepare(`SELECT s.language,s.level,s.family,s.verdict,s.categories,s.confidence,s.created_at
    FROM wiki_semantic_audits s JOIN wiki_articles a ON a.code=s.code AND a.generated_at=s.article_generated_at
    WHERE s.version=? ORDER BY s.created_at DESC`).bind(MLS_SEMANTIC_AUDIT_VERSION).all();
  const aggregate=mlsSemanticAggregate(results||[],Number(total?.n||0));
  return {version:MLS_SEMANTIC_AUDIT_VERSION,diagnosticOnly:true,automaticSampling:false,automaticCorrection:false,automaticPublish:false,
    ...aggregate,alert:mlsSemanticStatusFromAggregate(aggregate)};
}
function mlsSemanticBalanceCandidates(candidates=[], existingRows=[], count=5) {
  const counts={language:new Map(),level:new Map(),family:new Map()};
  for(const row of existingRows||[]){
    counts.language.set(row.language,(counts.language.get(row.language)||0)+1);
    counts.level.set(row.language+'|'+row.level,(counts.level.get(row.language+'|'+row.level)||0)+1);
    counts.family.set(row.language+'|'+row.family,(counts.family.get(row.language+'|'+row.family)||0)+1);
  }
  const enriched=candidates.map(row=>{
    const family=mlsSemanticFamily({title:row.title,chapter:row.chapter,part:row.part,language:row.language,level:row.level});
    const score=(counts.language.get(row.language)||0)*10000+(counts.level.get(row.language+'|'+row.level)||0)*100+(counts.family.get(row.language+'|'+family)||0);
    return {...row,family,score};
  });
  enriched.sort((a,b)=>a.score-b.score||String(a.language).localeCompare(String(b.language))||String(a.level).localeCompare(String(b.level))||String(a.family).localeCompare(String(b.family))||String(a.code).localeCompare(String(b.code)));
  return enriched.slice(0,count);
}
async function mlsSemanticSample(env, body={}) {
  await mlsSemanticEnsure(env);
  const count=Number(body.count||5);if(!Number.isInteger(count)||count<1||count>10)mlsChatError(400,'count debe estar entre 1 y 10.');
  const language=typeof body.language==='string'?body.language.trim():'';
  const params=[];let languageSql='';if(language){languageSql='AND a.language=?';params.push(language);}
  const {results:candidates}=await env.WIKI_DB.prepare(`SELECT a.code,a.language,a.language_name,a.title,a.level,a.part,a.chapter,a.article_markdown,a.generated_at,
      d.run_id AS run_id
    FROM wiki_articles a LEFT JOIN wiki_chat_drafts d ON a.audit_model='chat-draft-' || d.id
    WHERE NOT EXISTS (SELECT 1 FROM wiki_semantic_audits s WHERE s.code=a.code AND s.article_generated_at=a.generated_at) ${languageSql}
    ORDER BY a.generated_at DESC,a.code LIMIT 400`).bind(...params).all();
  const {results:existing}=await env.WIKI_DB.prepare(`SELECT language,level,family FROM wiki_semantic_audits s
    WHERE s.version=? AND EXISTS (SELECT 1 FROM wiki_articles a WHERE a.code=s.code AND a.generated_at=s.article_generated_at)`).bind(MLS_SEMANTIC_AUDIT_VERSION).all();
  const selected=mlsSemanticBalanceCandidates(candidates||[],existing||[],count).map(row=>({
    code:row.code,language:row.language,languageName:row.language_name,title:row.title,level:row.level,part:row.part,chapter:row.chapter,
    family:row.family,runId:row.run_id||null,generatedAt:row.generated_at,articleMarkdown:row.article_markdown
  }));
  return {ok:true,version:MLS_SEMANTIC_AUDIT_VERSION,requested:count,selected:selected.length,language:language||null,
    auditContract:{verdicts:[...MLS_SEMANTIC_VERDICTS],categories:[...MLS_SEMANTIC_CATEGORIES],confidence:[...MLS_SEMANTIC_CONFIDENCE],
      instruction:'Revisar exactitud lingüística y conceptual, terminología, ejemplos, variedad y contradicciones. No editar ni republicar el artículo desde esta auditoría.'},items:selected};
}
async function mlsSemanticRecord(env, body={}) {
  await mlsSemanticEnsure(env);
  const code=String(body.code||'');const generatedAt=String(body.generatedAt||'');
  if(!code||!generatedAt)mlsChatError(400,'Indica code y generatedAt de la muestra recibida.');
  const article=await env.WIKI_DB.prepare(`SELECT code,language,title,level,part,chapter,generated_at FROM wiki_articles WHERE code=? AND generated_at=?`).bind(code,generatedAt).first();
  if(!article)mlsChatError(409,'El artículo cambió o ya no coincide con la versión auditada; solicita una muestra nueva.');
  const valid=mlsSemanticValidateRecord(body);const family=mlsSemanticFamily(article);const now=new Date().toISOString();
  await env.WIKI_DB.prepare(`INSERT INTO wiki_semantic_audits(id,version,code,article_generated_at,language,level,family,verdict,categories,confidence,notes,reviewer,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON CONFLICT(code,article_generated_at) DO UPDATE SET verdict=excluded.verdict,categories=excluded.categories,confidence=excluded.confidence,
      notes=excluded.notes,reviewer=excluded.reviewer,updated_at=excluded.updated_at`)
    .bind(crypto.randomUUID(),MLS_SEMANTIC_AUDIT_VERSION,article.code,article.generated_at,article.language,article.level,family,valid.verdict,
      JSON.stringify(valid.categories),valid.confidence,valid.notes,valid.reviewer,now,now).run();
  return {ok:true,recorded:true,code:article.code,generatedAt:article.generated_at,language:article.language,level:article.level,family,
    verdict:valid.verdict,categories:valid.categories,confidence:valid.confidence,reviewer:valid.reviewer,articleChanged:false};
}
async function handleMlsSemanticAudit(request,env,url) {
  try{
    await mlsChatAuthenticate(request,env);await ensureWikiDb(env);await mlsChatEnsureDb(env);await mlsSemanticEnsure(env);
    const route=url.pathname.replace('/api/wiki/editorial/chat/semantic','')||'/';
    if(route==='/status'&&request.method==='GET')return mlsChatJson({ok:true,...await mlsSemanticStatus(env)});
    if(route==='/sample'&&request.method==='POST')return mlsChatJson(await mlsSemanticSample(env,await mlsChatBody(request)));
    if(route==='/record'&&request.method==='POST')return mlsChatJson(await mlsSemanticRecord(env,await mlsChatBody(request)));
    mlsChatError(404,'Ruta de auditoría semántica no encontrada.');
  }catch(error){if(!error.status)console.error('mls-semantic-audit-failure',error.message);return mlsChatJson({ok:false,error:error.status?error.message:'Auditoría semántica temporalmente no disponible.'},error.status||500);}
}
function mlsSemanticAttachRuntime(){
  if(typeof mlsAutooptHealth==='function'&&!mlsAutooptHealth.__semanticWrapped){
    const base=mlsAutooptHealth;const wrapped=async function(env){const data=await base(env);try{data.semanticAudit=await mlsSemanticStatus(env);}catch{data.semanticAudit={version:MLS_SEMANTIC_AUDIT_VERSION,available:false,audited:0,totalPublished:0,coverage:0,ok:0,watch:0,reviewRequired:0,byLanguage:[],byFamily:[],byCategory:[],alert:{status:'evidencia insuficiente',reasons:['Auditoría semántica no disponible.'],conclusive:false}};if(data.health)data.health.partial=true;}return data;};
    wrapped.__semanticWrapped=true;mlsAutooptHealth=wrapped;
  }
}
mlsSemanticAttachRuntime();
if(typeof module!=='undefined'&&module.exports)module.exports={MLS_SEMANTIC_AUDIT_VERSION,mlsSemanticValidateRecord,mlsSemanticAggregate,mlsSemanticStatusFromAggregate,mlsSemanticBalanceCandidates};
