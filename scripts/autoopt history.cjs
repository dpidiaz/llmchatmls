'use strict';
// Administrative only. No route, scheduler, provider, article write or secret access.
const fs=require('node:fs'), path=require('node:path'), crypto=require('node:crypto'), {execFileSync}=require('node:child_process');
const contract=require('../MLS R32 EDITORIAL/contrato editorial.js');
const auto=require('../MLS R32 EDITORIAL/autoopt.js');
const history=require('../MLS R32 EDITORIAL/autoopt history.js');
const VERSION='1.0', PAGE=25, MAX_SOURCES=25000;
const quote=x=>"'"+String(x).replace(/'/g,"''")+"'";
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
const date=x=>typeof x==='string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(x) && Number.isFinite(Date.parse(x));
const identifier=x=>typeof x==='string' && /^[a-zA-Z0-9_-]{8,80}$/.test(x);
async function catalog(query) {
  return new Set((await query("SELECT name FROM sqlite_master WHERE type='table'")).map(r=>r.name));
}
async function *pages(query,sql) {
  for(let offset=0;offset<MAX_SOURCES;offset+=PAGE) {
    const rows=await query(sql+` LIMIT ${PAGE} OFFSET ${offset}`);
    for(const row of rows) yield row;
    if(rows.length<PAGE) return;
  }
  throw Error('Límite de fuentes excedido; no se generó un plan parcial.');
}
function digest(plan) {
  return hash([VERSION,plan.batch,plan.before,plan.database,plan.target,plan.items]);
}
async function preview(query,{batch,before,database,target}) {
  if(!identifier(batch)||!date(before)||!database||!['local','remote'].includes(target)) throw Error('Indique batch, fecha UTC ISO exacta, database y local/remote.');
  const tables=await catalog(query);
  for(const name of ['wiki_articles','wiki_chat_drafts','wiki_chat_contexts','wiki_chat_runs','wiki_chat_incidents'])
    if(!tables.has(name)) throw Error('Falta una tabla editorial requerida: '+name);
  if(tables.has('wiki_autoopt_events')) {
    const [first]=await query('SELECT MIN(created_at) AS date FROM wiki_autoopt_events');
    if(first.date && before>first.date) throw Error('El corte supera la primera observación AUTOOPT conservada. Use un corte anterior.');
  }
  const ledger=new Map(tables.has('wiki_autoopt_history_items')?(await query('SELECT source_id,batch_id FROM wiki_autoopt_history_items')).map(r=>[r.source_id,r.batch_id]):[]);
  const live=new Set(tables.has('wiki_autoopt_events')?(await query('SELECT DISTINCT context_id FROM wiki_autoopt_events')).map(r=>r.context_id):[]);
  const plan={version:VERSION,batch,before,database,target,items:[],report:{scanned:0,excluded:{},groups:{}}};
  const contexts=new Map();
  const exclude=reason=>{plan.report.excluded[reason]=(plan.report.excluded[reason]||0)+1;};
  const sources={
    publication:`SELECT a.code,a.language,a.level,a.title,a.part,a.chapter,a.prompt_version,a.generated_at AS source_at,
      a.article_markdown AS markdown,a.audit_model,d.id AS draft_id,d.context_id,d.run_id,d.created_at AS draft_created,
      (a.article_markdown=d.markdown) AS same_text,c.context_json,r.status AS run_status,r.updated_at AS run_updated
      FROM wiki_articles a LEFT JOIN wiki_chat_drafts d ON a.audit_model='chat-draft-'||d.id AND a.code=d.code
      LEFT JOIN wiki_chat_contexts c ON c.id=d.context_id AND c.code=a.code AND c.run_id=d.run_id
      LEFT JOIN wiki_chat_runs r ON r.id=d.run_id WHERE a.generated_at<${quote(before)} ORDER BY a.code`,
    incident:`SELECT i.id,i.code,i.source_run_id AS run_id,i.context_id,i.reason,i.last_validation_error,
      i.editorial_attempts,i.updated_at AS source_at,c.context_json,r.status AS run_status,r.updated_at AS run_updated
      FROM wiki_chat_incidents i LEFT JOIN wiki_chat_contexts c ON c.id=i.context_id AND c.code=i.code AND c.run_id=i.source_run_id
      LEFT JOIN wiki_chat_runs r ON r.id=i.source_run_id WHERE i.updated_at<${quote(before)} ORDER BY i.id`
  };
  for(const [kind,sql] of Object.entries(sources)) for await(const row of pages(query,sql)) {
    plan.report.scanned++;
    if(!row.context_json || !row.run_status) {exclude('missing_lineage');continue;}
    if(!['complete','cancelled'].includes(row.run_status)) {exclude('run_not_closed');continue;}
    if(!date(row.source_at)||!date(row.run_updated)||row.run_updated>=before) {exclude('uncertain_or_recent_date');continue;}
    if(live.has(row.context_id)) {exclude('already_observed_live');continue;}
    let context;
    try {context=JSON.parse(row.context_json);} catch {exclude('invalid_context');continue;}
    if(context.promptVersion!==contract.promptVersion) {exclude('incompatible_prompt');continue;}
    const t=context.target;
    // MLS also uses G1, etc.; preserve the actual level instead of assuming CEFR.
    if(!t || t.code!==row.code || !/^MLS-V\d{2}-\d{4}$/.test(t.code) || !/^[a-z-]{2,40}$/.test(t.language||'') || !/^[A-Za-z0-9]{1,32}$/.test(t.level||'') || !context.profile?.available || !(context.profile.sampleSize>0) || !Array.isArray(context.references) || !context.references.length || context.references.length>50 || context.references.some(r=>!/^MLS-V\d{2}-\d{4}$/.test(r.code||''))) {exclude('invalid_metadata');continue;}
    const bounds=auto.mlsAutooptBounds(context,contract);
    if(bounds.conflict) {exclude('incompatible_profile');continue;}
    const sourceId=kind+':'+(kind==='publication'?row.code:row.id);
    if(ledger.has(sourceId)&&ledger.get(sourceId)!==batch) {exclude('claimed_by_another_import');continue;}
    let data;
    if(kind==='publication') {
      if(!row.draft_id||!row.same_text||row.source_at!==row.draft_created||row.prompt_version!==context.promptVersion || ['language','level','title','part','chapter'].some(k=>String(row[k]).trim()!==String(t[k]).trim())) {exclude('publication_mismatch');continue;}
      const f=auto.mlsAutooptFeatures(context,row.markdown,'',contract);
      if(f.words<bounds.min||f.words>bounds.max||row.markdown.length>16000||!f.sections) {exclude('outside_current_bounds');continue;}
      data={certainty:'verified-publication-not-linguistic-certification',words:f.words,sections:f.sections,references:f.references,
        referenceCodes:f.referenceCodes,bucket:f.bucket,tables:f.tables,lists:f.lists,examples:f.examples,
        firstPass:null,attempts:null};
    } else {
      const categories=[...new Set([row.reason,row.last_validation_error].filter(Boolean).map(auto.mlsAutooptError))].sort();
      if(!categories.length) {exclude('no_preserved_error');continue;}
      data={certainty:'preserved-error-pattern-not-full-attempt-history',categories,
        activityLike:categories.includes('r32_activity_like')?1:0,lengthError:categories.includes('length')?1:0,
        reportedRejections:Number.isSafeInteger(row.editorial_attempts)?row.editorial_attempts:null,uniqueAttempts:null};
    }
    const item={sourceId,kind,code:row.code,sourceRecord:kind==='publication'?row.code:row.id,sourceAt:row.source_at,
      contextId:row.context_id,runId:row.run_id,runUpdated:row.run_updated,draftId:row.draft_id||null,
      prompt:context.promptVersion,familyKey:auto.mlsAutooptKey(context),profileKey:history.mlsAutooptHistoryProfileKey(context,bounds),
      fingerprint:hash(row),data};
    plan.items.push(item);
    const key=item.familyKey+' / '+item.profileKey;
    contexts.set(key,context);
    const group=plan.report.groups[key]??={publications:0,incidents:0,words_sum:0,sections_sum:0,references_sum:0,activity_like:0,length_errors:0};
    if(kind==='publication') {group.publications++;group.words_sum+=data.words;group.sections_sum+=data.sections;group.references_sum+=data.references;}
    else {group.incidents++;group.activity_like+=data.activityLike;group.length_errors+=data.lengthError;}
  }
  plan.items.sort((a,b)=>a.sourceId.localeCompare(b.sourceId,'en'));
  plan.digest=digest(plan);
  plan.report.eligible=plan.items.length;
  plan.report.publications=plan.items.filter(x=>x.kind==='publication').length;
  plan.report.incidents=plan.items.length-plan.report.publications;
  plan.report.firstPassRate=null;plan.report.attemptsPerPublication=null;
  const currentStats=new Map(tables.has('wiki_autoopt_stats')?(await query(`SELECT scope_id,stats FROM wiki_autoopt_stats WHERE version='1.0' AND prompt=${quote(contract.promptVersion)} AND scope='family'`)).map(r=>[r.scope_id,JSON.parse(r.stats)]):[]);
  for(const [key,context] of contexts) {
    const group=plan.report.groups[key];
    const baseline=auto.mlsAutooptProfileFromStats(context,currentStats.get(auto.mlsAutooptKey(context))||{},contract);
    const proposed=history.mlsAutooptHistoryBlend(baseline,context,group,auto.mlsAutooptBounds(context,contract));
    group.comparison={scope:'live-only versus proposed batch; excludes other historical batches',
      before:baseline.recommendedWordRange,after:proposed.recommendedWordRange,
      historicalWeight:proposed.historicalEvidence?.weight||0,
      firstPassBefore:baseline.firstPassSuccessRate,firstPassAfter:proposed.firstPassSuccessRate};
  }
  return plan;
}
function itemSql(item,plan,hasLive) {
  const b=quote(plan.batch),i=item;
  const liveGuard=hasLive?`AND NOT EXISTS (SELECT 1 FROM wiki_autoopt_events WHERE context_id=${quote(i.contextId)})`:'';
  const sourceGuard=i.kind==='publication'
    ? `EXISTS (SELECT 1 FROM wiki_articles a JOIN wiki_chat_drafts d ON a.audit_model='chat-draft-'||d.id AND a.code=d.code
        WHERE a.code=${quote(i.code)} AND d.id=${quote(i.draftId)} AND a.article_markdown=d.markdown AND a.generated_at=${quote(i.sourceAt)})`
    : `EXISTS (SELECT 1 FROM wiki_chat_incidents WHERE id=${quote(i.sourceRecord)} AND updated_at=${quote(i.sourceAt)})`;
  return `INSERT OR IGNORE INTO wiki_autoopt_history_items
    SELECT ${[i.sourceId,plan.batch,VERSION,i.prompt,i.familyKey,i.profileKey,i.kind,i.sourceAt,i.fingerprint,JSON.stringify(i.data)].map(quote).join(',')}
    WHERE EXISTS (SELECT 1 FROM wiki_autoopt_history_batches WHERE id=${b} AND digest=${quote(plan.digest)} AND state='staged')
    AND EXISTS (SELECT 1 FROM wiki_chat_runs WHERE id=${quote(i.runId)} AND status IN ('complete','cancelled') AND updated_at=${quote(i.runUpdated)})
    AND ${sourceGuard} ${liveGuard}`;
}
async function activate(query,batch) {
  if(!identifier(batch)) throw Error('batch inválido');
  await query(`UPDATE wiki_autoopt_history_batches SET state='active' WHERE id=${quote(batch)} AND expected>0
    AND expected=(SELECT COUNT(*) FROM wiki_autoopt_history_items WHERE batch_id=${quote(batch)})
    AND (state='active' OR (SELECT COUNT(*) FROM wiki_autoopt_history_batches WHERE state='active')<8)`);
  const [row]=await query(`SELECT state FROM wiki_autoopt_history_batches WHERE id=${quote(batch)}`);
  if(row?.state!=='active') throw Error('No se activó: lote incompleto, vacío o límite de ocho lotes activos.');
}
async function apply(query,plan,approvedDigest) {
  if(plan.version!==VERSION || digest(plan)!==approvedDigest || plan.digest!==approvedDigest) throw Error('La aprobación no coincide con el plan.');
  const tables=await catalog(query);
  if(tables.has('wiki_autoopt_history_batches')) {
    const [prior]=await query(`SELECT digest,state FROM wiki_autoopt_history_batches WHERE id=${quote(plan.batch)}`);
    if(prior && prior.digest!==approvedDigest) throw Error('El batch ya identifica otro plan.');
    if(prior?.state==='active') return {reused:true,state:'active'};
    if(prior?.state==='rolled_back') throw Error('Lote revertido: reactivarlo requiere activate explícito.');
  }
  const fresh=await preview(query,plan);
  if(fresh.digest!==plan.digest) throw Error('Las fuentes cambiaron desde la simulación; revise una nueva simulación.');
  for(const sql of history.mlsAutooptHistorySchema()) await query(sql);
  await query(`INSERT OR IGNORE INTO wiki_autoopt_history_batches VALUES (${quote(plan.batch)},${quote(plan.digest)},${quote(plan.before)},${plan.items.length},'staged',${quote(new Date().toISOString())})`);
  // Small resumable batches; items + trigger are atomic, staged evidence invisible.
  for(let start=0;start<plan.items.length;start+=PAGE)
    await query(plan.items.slice(start,start+PAGE).map(item=>itemSql(item,plan,tables.has('wiki_autoopt_events'))).join(';\n'));
  const [count]=await query(`SELECT COUNT(*) n FROM wiki_autoopt_history_items WHERE batch_id=${quote(plan.batch)}`);
  if(count.n!==plan.items.length) throw Error('Importación incompleta; permanece staged y no cambia recomendaciones.');
  return {state:'staged',imported:count.n,next:'Revise inspect y use activate explícitamente.'};
}
async function rollback(query,batch) {
  if(!identifier(batch)) throw Error('batch inválido');
  await query(`UPDATE wiki_autoopt_history_batches SET state='rolled_back' WHERE id=${quote(batch)}`);
}
function wranglerQuery(database,target) {
  return async sql=>{
    let raw;
    // Wrangler exports its package metadata, not the bin subpath, in Node 24.
    const wrangler=path.join(path.dirname(require.resolve('wrangler/package.json')),'bin','wrangler.js');
    try {raw=execFileSync(process.execPath,[wrangler,'d1','execute',database,'--'+target,'--command',sql,'--json'],{encoding:'utf8',maxBuffer:32*1024*1024,stdio:['ignore','pipe','pipe']});}
    catch {throw Error('D1 no pudo ejecutar la operación. Revise autenticación/permisos y conectividad; no se imprimen SQL ni datos privados.');}
    let result;try {result=JSON.parse(raw);} catch {throw Error('Wrangler no devolvió JSON válido.');}
    const chunks=Array.isArray(result)?result:[result];
    if(chunks.some(r=>r.success===false)) throw Error('D1 devolvió un error.');
    return chunks.flatMap(r=>r.results||[]);
  };
}
async function main() {
  const args=process.argv.slice(2), command=args.shift(),opts={};
  while(args.length) {
    const key=args.shift();if(['--local','--remote'].includes(key)) {if(opts.target) throw Error('Use solo local o remote');opts.target=key.slice(2);}
    else if(['--batch','--before','--database','--out','--plan','--approve'].includes(key)&&args[0]&&!args[0].startsWith('--')) opts[key.slice(2)]=args.shift();
    else throw Error('Argumento inválido. Consulte AUTOOPT historial.md.');
  }
  if(command==='schema') {process.stdout.write(history.mlsAutooptHistorySchema().join(';\n')+';\n');return;}
  if(command==='apply') {
    const plan=JSON.parse(fs.readFileSync(opts.plan,'utf8'));
    // Bind writes to the exact database, target, cutoff and sources in the approved preview.
    if(!opts.approve || !['local','remote'].includes(plan.target) || typeof plan.database!=='string' || plan.database.startsWith('-')) throw Error('Plan/destino/aprobación inválidos.');
    console.log(JSON.stringify(await apply(wranglerQuery(plan.database,plan.target),plan,opts.approve)));return;
  }
  if(!opts.database||opts.database.startsWith('-')||!opts.target) throw Error('Indique --database y --local o --remote explícitos.');
  const query=wranglerQuery(opts.database,opts.target);
  if(command==='preview') {
    const plan=await preview(query,opts);
    if(!opts.out) throw Error('Indique --out para conservar el plan compacto.');
    fs.writeFileSync(opts.out,JSON.stringify(plan,null,2)+'\n',{flag:'wx'});
    console.log(JSON.stringify({digest:plan.digest,...plan.report},null,2));
  } else if(command==='activate') {await activate(query,opts.batch);console.log('Lote histórico activo; requiere AUTOOPT_HISTORY_ENABLED=true para asesorar.');}
  else if(command==='rollback') {await rollback(query,opts.batch);console.log('Contribución histórica retirada; aprendizaje nuevo intacto.');}
  else if(command==='inspect') console.log(JSON.stringify(await query('SELECT b.*,s.prompt,s.family_key,s.profile_key,s.publications,s.incidents FROM wiki_autoopt_history_batches b LEFT JOIN wiki_autoopt_history_stats s ON s.batch_id=b.id ORDER BY b.created_at,s.family_key'),null,2));
  else throw Error('Comando inválido. Use preview, apply, inspect, activate, rollback o schema.');
}
module.exports={preview,apply,activate,rollback,itemSql,digest,wranglerQuery};
if(require.main===module) main().catch(error=>{console.error(error.message);process.exitCode=1;});
