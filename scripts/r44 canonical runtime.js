// Canonical preparation only. The existing R33 gate/integration owns VERIFIED.
var canonicalReadyEnvs=new WeakSet();
var canonicalRecoveryLockMs=2*60*1000;
var canonicalRecoveryBatchSize=100;
var canonicalStatusOverlayCache=new WeakMap();
var canonicalAuthorityCache={expiresMs:0,status:null};
async function canonicalAuthorityStatus(now=Date.now()){
  if(canonicalAuthorityCache.status&&canonicalAuthorityCache.expiresMs>now)return canonicalAuthorityCache.status;
  const status=await fetchUnifiedStatus(fetch);
  canonicalAuthorityCache={expiresMs:now+5*60*1000,status};
  return status;
}
// Same-context recovery is deliberately narrow. Technical failures get at most
// two retries. Source/editorial quarantines get one deterministic preflight and,
// only when current registered context is usable, one R33 retry. Context changes
// remain independently recoverable. Six automatic releases is the lifetime cap.
var canonicalTransientSql="(q.last_error='UNIFIED_R33_DRAFT_JSON_INVALID' OR q.last_error='SOURCE_FETCH_FAILED' OR q.last_error IN ('SOURCE_FETCH_HTTP_408','SOURCE_FETCH_HTTP_429','SOURCE_FETCH_HTTP_500','SOURCE_FETCH_HTTP_502','SOURCE_FETCH_HTTP_503','SOURCE_FETCH_HTTP_504') OR q.last_error IN ('CANONICAL_ASSET_500','CANONICAL_ASSET_502','CANONICAL_ASSET_503','CANONICAL_ASSET_504'))";
var canonicalReviewSql="(q.last_error='NO_REGISTERED_SOURCE_CANDIDATE' OR q.last_error LIKE 'SOURCE_%' OR q.last_error LIKE 'MATCHER_%' OR q.last_error LIKE 'CLAIM_%' OR q.last_error LIKE 'COVERAGE_%' OR q.last_error LIKE 'SOURCE_SUPPORT_%' OR q.last_error='NEEDS_CHAT_REVIEW')";
var canonicalRecoverableSql="r.recoveries<6 AND (r.context_hash<>r.failed_context_hash OR ("+canonicalTransientSql+" AND q.attempts<6 AND r.technical_retries<2) OR ("+canonicalReviewSql+" AND q.attempts<6 AND r.technical_retries<1))";
function canonicalQuarantineCategory(reason){
  const s=String(reason||'');
  if(/HASH_MISMATCH/.test(s))return 'hash_context';
  if(/^(UNIFIED_R33_DRAFT_JSON_INVALID|SOURCE_FETCH_FAILED|SOURCE_FETCH_HTTP_(408|429|500|502|503|504)|CANONICAL_ASSET_(500|502|503|504))$/.test(s))return 'technical_transient';
  if(/^(NO_REGISTERED_SOURCE_CANDIDATE|CLAIM_SOURCE_|SOURCE_(FULLTEXT|URL|CONTENT_TYPE|TEXT_TOO_SHORT|NOT_REGISTERED|FETCH))/.test(s))return 'sources_context';
  if(/^(MATCHER_|CLAIM_|COVERAGE_|SOURCE_SUPPORT_|NEEDS_CHAT_REVIEW)/.test(s))return 'editorial_review';
  return 'other';
}
async function canonicalEnsure(env){
  if(canonicalReadyEnvs.has(env))return;
  await env.WIKI_DB.batch([
    env.WIKI_DB.prepare("CREATE TABLE IF NOT EXISTS mls_canonical_durable_inputs(code TEXT PRIMARY KEY,input_hash TEXT NOT NULL,input_json TEXT NOT NULL,receipt_sha256 TEXT NOT NULL)"),
    env.WIKI_DB.prepare("CREATE TABLE IF NOT EXISTS mls_canonical_queue(code TEXT PRIMARY KEY,input_hash TEXT NOT NULL,page INTEGER NOT NULL,revision TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'PENDING',batch_id TEXT,lease_token TEXT,expires_ms INTEGER NOT NULL DEFAULT 0,attempts INTEGER NOT NULL DEFAULT 0,retry_ms INTEGER NOT NULL DEFAULT 0,result_json TEXT,last_error TEXT)"),
    env.WIKI_DB.prepare("CREATE INDEX IF NOT EXISTS mls_canonical_ready ON mls_canonical_queue(revision,state,retry_ms)"),
    env.WIKI_DB.prepare("CREATE TABLE IF NOT EXISTS mls_canonical_meta(id INTEGER PRIMARY KEY CHECK(id=1),revision TEXT NOT NULL,pending INTEGER NOT NULL,waiting_handoff INTEGER NOT NULL)"),
    env.WIKI_DB.prepare("CREATE TABLE IF NOT EXISTS mls_canonical_recovery(code TEXT PRIMARY KEY,context_hash TEXT NOT NULL,failed_context_hash TEXT NOT NULL,recoveries INTEGER NOT NULL DEFAULT 0,technical_retries INTEGER NOT NULL DEFAULT 0)"),
    env.WIKI_DB.prepare("CREATE TABLE IF NOT EXISTS mls_canonical_recovery_clock(id INTEGER PRIMARY KEY CHECK(id=1),next_ms INTEGER NOT NULL)"),
    env.WIKI_DB.prepare("INSERT OR IGNORE INTO mls_canonical_recovery_clock VALUES(1,0)"),
    env.WIKI_DB.prepare("CREATE TABLE IF NOT EXISTS mls_canonical_recovery_history(code TEXT NOT NULL,recovery INTEGER NOT NULL,recovered_ms INTEGER NOT NULL,last_error TEXT,attempts INTEGER NOT NULL,old_context TEXT NOT NULL,new_context TEXT NOT NULL,PRIMARY KEY(code,recovery))")
  ]);
  canonicalReadyEnvs.add(env);
}
async function canonicalAsset(env,path){
  const response=await env.ASSETS.fetch(new Request('https://assets.internal/canonical-runner/'+path));
  if(!response.ok)throw Error('CANONICAL_ASSET_'+response.status);
  return response.json();
}
async function canonicalSeed(env){
  await canonicalEnsure(env);
  const manifest=await canonicalAsset(env,'manifest.json');
  const meta=await env.WIKI_DB.prepare('SELECT revision FROM mls_canonical_meta WHERE id=1').first();
  if(meta?.revision===manifest.revision)return;
  // One D1 transaction publishes a complete snapshot; no half-seeded 5/10-entry batch.
  await env.WIKI_DB.batch([
    // Bootstrap unknown legacy fingerprints without declaring a source change.
    // Keep the old input hash so real input changes still count as material.
    env.WIKI_DB.prepare(`INSERT INTO mls_canonical_recovery(code,context_hash,failed_context_hash)
      SELECT json_extract(value,'$.code'),json_extract(value,'$.inputHash')||':'||COALESCE(json_extract(value,'$.contextHash'),''),
        COALESCE((SELECT input_hash FROM mls_canonical_queue WHERE code=json_extract(value,'$.code')),json_extract(value,'$.inputHash'))||':'||COALESCE(json_extract(value,'$.contextHash'),'')
      FROM json_each(?1) WHERE NOT EXISTS(SELECT 1 FROM mls_canonical_meta WHERE id=1 AND revision=?2)
      ON CONFLICT(code) DO UPDATE SET context_hash=CASE WHEN code IN (SELECT code FROM mls_canonical_durable_inputs) THEN context_hash ELSE excluded.context_hash END`).bind(JSON.stringify(manifest.rows),manifest.revision),
    env.WIKI_DB.prepare(`INSERT INTO mls_canonical_queue(code,input_hash,page,revision,state)
      SELECT json_extract(value,'$.code'),json_extract(value,'$.inputHash'),json_extract(value,'$.page'),?2,
        CASE WHEN json_extract(value,'$.waiting')=1 THEN 'WAITING_HANDOFF' ELSE 'PENDING' END FROM json_each(?1)
      WHERE NOT EXISTS(SELECT 1 FROM mls_canonical_meta WHERE id=1 AND revision=?2)
      ON CONFLICT(code) DO UPDATE SET input_hash=CASE WHEN state IN ('PREPARED','VERIFIED') OR code IN (SELECT code FROM mls_canonical_durable_inputs) THEN input_hash ELSE excluded.input_hash END,
      page=CASE WHEN code IN (SELECT code FROM mls_canonical_durable_inputs) THEN -1 ELSE excluded.page END,revision=excluded.revision,
      state=CASE WHEN state IN ('PREPARED','VERIFIED','QUARANTINED') OR input_hash=excluded.input_hash OR code IN (SELECT code FROM mls_canonical_durable_inputs) THEN state ELSE excluded.state END,
      result_json=CASE WHEN state IN ('PREPARED','VERIFIED') OR input_hash=excluded.input_hash OR code IN (SELECT code FROM mls_canonical_durable_inputs) THEN result_json ELSE NULL END,
      lease_token=CASE WHEN state IN ('PREPARED','VERIFIED') OR input_hash=excluded.input_hash OR code IN (SELECT code FROM mls_canonical_durable_inputs) THEN lease_token ELSE NULL END,
      expires_ms=CASE WHEN state IN ('PREPARED','VERIFIED') OR input_hash=excluded.input_hash OR code IN (SELECT code FROM mls_canonical_durable_inputs) THEN expires_ms ELSE 0 END,
      attempts=CASE WHEN state IN ('PREPARED','VERIFIED','QUARANTINED') OR input_hash=excluded.input_hash OR code IN (SELECT code FROM mls_canonical_durable_inputs) THEN attempts ELSE 0 END,
      retry_ms=CASE WHEN state IN ('PREPARED','VERIFIED') OR input_hash=excluded.input_hash OR code IN (SELECT code FROM mls_canonical_durable_inputs) THEN retry_ms ELSE 0 END`).bind(JSON.stringify(manifest.rows),manifest.revision),
    env.WIKI_DB.prepare('INSERT OR REPLACE INTO mls_canonical_meta VALUES(1,?,?,?)').bind(manifest.revision,manifest.pending,manifest.waitingHandoff)
  ]);
}
// Promote committed receipts through the same allocator. A crash before this
// transaction leaves WAITING_HANDOFF discoverable; replay cannot create a second job.
async function canonicalIngestReceipts(env){
  const rows=await env.WIKI_DB.prepare(`SELECT r.*,e.source_json,t.ordinal_start,t.entries_json
    FROM mls_canonical_queue q JOIN r44_receipts r USING(code)
    JOIN r44_entries e ON e.ticket_id=r.ticket_id AND e.code=r.code
    JOIN r44_tickets t ON t.ticket_id=r.ticket_id
    JOIN r44_ticket_progress p ON p.ticket_id=r.ticket_id
    WHERE q.state='WAITING_HANDOFF' AND p.state='COMPLETE'
    ORDER BY q.code LIMIT 5`).all();
  for(const row of rows.results||[]){
    if(await r44Sha256Text(row.payload_json)!==row.payload_sha256 || await r44Sha256Text(row.receipt_json)!==row.receipt_sha256)
      throw Error('CANONICAL_RECEIPT_HASH_MISMATCH_'+row.code);
    const response=await env.ASSETS.fetch(new Request('https://assets.internal/canonical-input/'+row.code+'.json'));
    if(!response.ok)throw Error('CANONICAL_ASSET_'+response.status);
    const base=await response.json(),raw=JSON.parse(row.payload_json),source=JSON.parse(row.source_json);
    if(base.code!==row.code||source.sha256!==row.source_sha256)throw Error('CANONICAL_CONTEXT_HASH_MISMATCH_'+row.code);
    const input={...base,handoffEntry:{code:row.code,outcome:raw.outcome,
      source:{path:'content/'+String(source.path).replace(/^content\//,''),sha256:source.sha256},
      correctedContent:raw.outcome==='CORRECTED'?raw.correctedContent:null,
      evidence:raw.evidence||null,sources:raw.sources||[],claims:raw.claims||[],notes:String(raw.notes||''),
      ordinal:Number(row.ordinal_start)+JSON.parse(row.entries_json).findIndex(e=>e.code===row.code)}};
    const hash=await canonicalInputHash(input),context=hash+':'+await r44Sha256Text(r44Stable(unifiedR33CanonicalContext(input)));
    await env.WIKI_DB.batch([
      env.WIKI_DB.prepare(`INSERT INTO mls_canonical_durable_inputs SELECT ?,?,?,?
        WHERE EXISTS(SELECT 1 FROM mls_canonical_queue WHERE code=? AND state='WAITING_HANDOFF')
        ON CONFLICT(code) DO NOTHING`).bind(row.code,hash,JSON.stringify(input),row.receipt_sha256,row.code),
      env.WIKI_DB.prepare(`UPDATE mls_canonical_recovery SET context_hash=?,failed_context_hash=? WHERE code=?
        AND EXISTS(SELECT 1 FROM mls_canonical_queue WHERE code=? AND state='WAITING_HANDOFF')`).bind(context,context,row.code,row.code),
      env.WIKI_DB.prepare(`UPDATE mls_canonical_queue SET state='PENDING',input_hash=?,page=-1
        WHERE code=? AND state='WAITING_HANDOFF'
        AND EXISTS(SELECT 1 FROM mls_canonical_durable_inputs WHERE code=? AND input_hash=?)`).bind(hash,row.code,row.code,hash)
    ]);
  }
}
async function canonicalPacket(env,row){
  if(row.page!==-1)return canonicalAsset(env,row.revision+'-'+row.page+'.json');
  const saved=await env.WIKI_DB.prepare('SELECT input_json,input_hash FROM mls_canonical_durable_inputs WHERE code=?').bind(row.code).first();
  return saved?[{inputHash:saved.input_hash,input:JSON.parse(saved.input_json)}]:[];
}
async function canonicalRecoverQuarantine(env,now=Date.now()){
  // No time throttle: the clock is only a crash-safe single-flight mutex.
  // Normal completion releases it immediately, so the next runner invocation
  // may sweep the next 100 rows without waiting for a cron/window.
  const lockUntil=now+canonicalRecoveryLockMs;
  const gate=await env.WIKI_DB.prepare('UPDATE mls_canonical_recovery_clock SET next_ms=? WHERE id=1 AND next_ms<=? RETURNING id').bind(lockUntil,now).first();
  if(!gate)return;
  try{
  const rows=await env.WIKI_DB.prepare(`SELECT q.code,q.page,q.revision,q.input_hash,q.attempts,q.last_error,r.* FROM mls_canonical_queue q JOIN mls_canonical_recovery r USING(code)
    WHERE q.revision=(SELECT revision FROM mls_canonical_meta WHERE id=1) AND q.state='QUARANTINED'
    AND q.lease_token IS NULL AND q.expires_ms=0 AND q.retry_ms<=? AND ${canonicalRecoverableSql}
    ORDER BY q.code LIMIT ${canonicalRecoveryBatchSize}`).bind(now).all();
  const pageCache=new Map();
  for(const row of rows.results||[]){
    const changed=row.context_hash!==row.failed_context_hash;
    const category=canonicalQuarantineCategory(row.last_error);
    if(!changed&&(category==='sources_context'||category==='editorial_review')){
      const pageKey=row.page===-1?row.code:row.page;
      let packet=pageCache.get(pageKey);
      if(!packet){
        try{packet=await canonicalPacket(env,row)}catch(_){packet=[]}
        pageCache.set(pageKey,packet);
      }
      const item=(packet||[]).find(x=>x.input&&x.input.code===row.code&&x.inputHash===row.input_hash);
      let preflight={eligible:false,reason:'CANONICAL_PREFLIGHT_CONTEXT_MISSING'};
      if(item&&await canonicalInputHash(item.input)===row.input_hash){
        preflight=unifiedR33CanonicalPreflight(item.input,row.last_error);
      }
      if(!preflight.eligible){
        // Mark this same-context review as consumed so it cannot spin forever.
        // A later material context change still bypasses this fence.
        await env.WIKI_DB.prepare(`UPDATE mls_canonical_recovery
          SET technical_retries=CASE WHEN technical_retries<1 THEN 1 ELSE technical_retries END
          WHERE code=? AND context_hash=failed_context_hash`).bind(row.code).run();
        continue;
      }
    }
    const delay=0;
    // The history INSERT is the compare-and-swap guard. A stale selection cannot
    // reopen a completed row or overwrite a newer context.
    await env.WIKI_DB.batch([
      env.WIKI_DB.prepare(`INSERT OR IGNORE INTO mls_canonical_recovery_history
        SELECT q.code,r.recoveries+1,?1,q.last_error,q.attempts,r.failed_context_hash,r.context_hash
        FROM mls_canonical_queue q JOIN mls_canonical_recovery r USING(code)
        WHERE q.code=?2 AND q.state='QUARANTINED' AND q.lease_token IS NULL AND q.expires_ms=0
        AND r.recoveries=?3 AND r.context_hash=?4 AND r.failed_context_hash=?5 AND ${canonicalRecoverableSql}`).bind(now,row.code,row.recoveries,row.context_hash,row.failed_context_hash),
      env.WIKI_DB.prepare(`UPDATE mls_canonical_queue SET state='RETRY',retry_ms=?1 WHERE code=?2 AND state='QUARANTINED'
        AND EXISTS(SELECT 1 FROM mls_canonical_recovery_history WHERE code=?2 AND recovery=?3 AND recovered_ms=?4)
        AND EXISTS(SELECT 1 FROM mls_canonical_recovery WHERE code=?2 AND recoveries=?5)`)
        .bind(now+delay,row.code,row.recoveries+1,now,row.recoveries),
      env.WIKI_DB.prepare(`UPDATE mls_canonical_recovery SET recoveries=recoveries+1,technical_retries=?,failed_context_hash=context_hash
        WHERE code=? AND recoveries=? AND EXISTS(SELECT 1 FROM mls_canonical_recovery_history WHERE code=? AND recovery=? AND recovered_ms=?)`)
        .bind(changed?0:row.technical_retries+1,row.code,row.recoveries,row.code,row.recoveries+1,now)
    ]);
  }
  }finally{
    // Release only our own mutex value; never clear a newer stale-lock recovery.
    await env.WIKI_DB.prepare('UPDATE mls_canonical_recovery_clock SET next_ms=0 WHERE id=1 AND next_ms=?').bind(lockUntil).run();
  }
}
async function canonicalRefreshVerified(env){
  await canonicalEnsure(env);
  const meta=await env.WIKI_DB.prepare('SELECT revision FROM mls_canonical_meta WHERE id=1').first();
  if(!meta)return;
  const status=await fetchUnifiedStatus(fetch);
  await env.WIKI_DB.batch([
    env.WIKI_DB.prepare("UPDATE mls_canonical_queue SET state='VERIFIED',result_json=NULL,lease_token=NULL,expires_ms=0 WHERE state!='VERIFIED' AND code IN (SELECT value FROM json_each(?))").bind(JSON.stringify(status.verifiedCodes)),
    env.WIKI_DB.prepare('UPDATE mls_canonical_meta SET pending=? WHERE id=1').bind(status.remaining)
  ]);
}
async function canonicalStatus(env,authorityStatus=null){
  await canonicalEnsure(env);
  const meta=await env.WIKI_DB.prepare('SELECT * FROM mls_canonical_meta WHERE id=1').first();
  if(!meta)return {initialized:false,claimable:0,pending:null,prepared:0};
  const authorityCodes=Array.isArray(authorityStatus?.verifiedCodes)?authorityStatus.verifiedCodes.map(x=>String(x).toUpperCase()):null;
  const authorityEtag=String(authorityStatus?.etag||'');
  if(authorityCodes){
    const cached=canonicalStatusOverlayCache.get(env);
    if(cached&&cached.expiresMs>Date.now()&&cached.etag===authorityEtag)return cached.value;
  }
  const rows=await env.WIKI_DB.prepare(`SELECT state,COUNT(*) n FROM mls_canonical_queue WHERE revision=? GROUP BY state`).bind(meta.revision).all();
  const counts=Object.fromEntries((rows.results||[]).map(r=>[r.state,Number(r.n)]));
  let authorityJson=null,reconciliationPending=0;
  if(authorityCodes){
    authorityJson=JSON.stringify(authorityCodes);
    const stale=await env.WIKI_DB.prepare(`SELECT state,COUNT(*) n FROM mls_canonical_queue
      WHERE revision=? AND state!='VERIFIED' AND code IN (SELECT value FROM json_each(?))
      GROUP BY state`).bind(meta.revision,authorityJson).all();
    for(const row of stale.results||[]){
      const n=Number(row.n||0);reconciliationPending+=n;
      counts[row.state]=Math.max(0,Number(counts[row.state]||0)-n);
    }
    counts.VERIFIED=Number(counts.VERIFIED||0)+reconciliationPending;
  }
  const now=Date.now();
  const eligible=authorityJson
    ?await env.WIKI_DB.prepare("SELECT COUNT(*) n FROM mls_canonical_queue WHERE revision=?1 AND (state IN ('PENDING','READY') OR (state='RETRY' AND retry_ms<=?2) OR (state='LEASED' AND expires_ms<=?3)) AND code NOT IN (SELECT value FROM json_each(?4))").bind(meta.revision,now,now,authorityJson).first()
    :await env.WIKI_DB.prepare("SELECT COUNT(*) n FROM mls_canonical_queue WHERE revision=? AND (state IN ('PENDING','READY') OR (state='RETRY' AND retry_ms<=?) OR (state='LEASED' AND expires_ms<=?))").bind(meta.revision,now,now).first();
  const groups=authorityJson
    ?await env.WIKI_DB.prepare(`SELECT q.last_error,q.attempts,COUNT(*) n,
      SUM(CASE WHEN ${canonicalRecoverableSql} THEN 1 ELSE 0 END) recoverable
      FROM mls_canonical_queue q LEFT JOIN mls_canonical_recovery r USING(code)
      WHERE q.state='QUARANTINED' AND q.revision=?1 AND q.code NOT IN (SELECT value FROM json_each(?2))
      GROUP BY q.last_error,q.attempts`).bind(meta.revision,authorityJson).all()
    :await env.WIKI_DB.prepare(`SELECT q.last_error,q.attempts,COUNT(*) n,
      SUM(CASE WHEN ${canonicalRecoverableSql} THEN 1 ELSE 0 END) recoverable
      FROM mls_canonical_queue q LEFT JOIN mls_canonical_recovery r USING(code)
      WHERE q.state='QUARANTINED' AND q.revision=? GROUP BY q.last_error,q.attempts`).bind(meta.revision).all();
  const byCategory={technical_transient:0,sources_context:0,editorial_review:0,hash_context:0,other:0};
  let recoverable=0;
  const byReason=(groups.results||[]).map(row=>{const category=canonicalQuarantineCategory(row.last_error);byCategory[category]+=Number(row.n);recoverable+=Number(row.recoverable);return {...row,category}});
  const quarantine={source:'mls_canonical_queue',total:counts.QUARANTINED||0,byCategory,byReason,recoverable,requiresChangeOrReview:(counts.QUARANTINED||0)-recoverable,batchSize:canonicalRecoveryBatchSize,intervalMs:0,mode:'IMMEDIATE_SINGLE_FLIGHT'};
  const repair=await unifiedR33RepairStatus(env);
  const value={initialized:true,claimable:Number(eligible.n),pending:Number.isFinite(Number(authorityStatus?.remaining))?Number(authorityStatus.remaining):meta.pending,waitingHandoff:counts.WAITING_HANDOFF||0,prepared:counts.PREPARED||0,counts,quarantine,repair,batchSize:100,verifiedAuthority:'github-main-verified-index',readThroughAuthority:!!authorityCodes,reconciliationPending};
  if(authorityCodes)canonicalStatusOverlayCache.set(env,{etag:authorityEtag,expiresMs:Date.now()+5*60*1000,value});
  return value;
}
async function canonicalInputHash(body){
  return r44Sha256Text(r44Stable({code:body.code,contentPath:body.contentPath,article:body.article,handoffEntry:body.handoffEntry||{},currentEvidenceRevision:Number(body.currentEvidenceRevision||0)}));
}
async function canonicalPrepared(env,body){
  await canonicalEnsure(env);
  const hash=await canonicalInputHash(body);
  const row=await env.WIKI_DB.prepare("SELECT result_json FROM mls_canonical_queue WHERE code=? AND input_hash=? AND state='PREPARED'").bind(body.code,hash).first();
  return row?JSON.parse(row.result_json):null;
}
async function canonicalStep(env){
  await canonicalSeed(env);
  await canonicalIngestReceipts(env);
  await canonicalRecoverQuarantine(env);
  const now=Date.now(),batch=crypto.randomUUID(),token=crypto.randomUUID();
  // A batch contains 100 available entries, consumed across independent alarms to
  // respect the FREE invocation budget. Reservations are not 100 active AI leases.
  // Refill when READY is empty. Slow LEASED entries keep their original fences
  // and batch IDs, but must not hold up idle runners taking the next batch.
  const refill=env.WIKI_DB.prepare(`UPDATE mls_canonical_queue SET state='READY',batch_id=?1 WHERE code IN (
    SELECT code FROM mls_canonical_queue WHERE revision=(SELECT revision FROM mls_canonical_meta WHERE id=1)
    AND (state='PENDING' OR (state='RETRY' AND retry_ms<=?2))
    AND NOT EXISTS(SELECT 1 FROM mls_canonical_queue WHERE revision=(SELECT revision FROM mls_canonical_meta WHERE id=1) AND state='READY')
    ORDER BY code LIMIT 100)`).bind(batch,now);
  const claim=env.WIKI_DB.prepare(`UPDATE mls_canonical_queue SET state='LEASED',lease_token=?1,expires_ms=?2,attempts=attempts+1 WHERE code=(
    SELECT code FROM mls_canonical_queue WHERE revision=(SELECT revision FROM mls_canonical_meta WHERE id=1)
    AND (state='READY' OR (state='LEASED' AND expires_ms<=?3))
    AND (SELECT COUNT(*) FROM mls_canonical_queue WHERE state='LEASED' AND expires_ms>?3)
      +(SELECT COUNT(*) FROM r44_leases l JOIN r44_ticket_progress p USING(ticket_id) WHERE l.expires_ms>?3 AND p.state IN ('LEASED','PARTIAL_DURABLE'))<128
    ORDER BY code LIMIT 1) RETURNING *`).bind(token,now+14*60*1000,now);
  // Keep refill and claim in one transaction: concurrent callers must not all
  // observe the last READY entry, miss it, and sleep despite a pending backlog.
  const results=await env.WIKI_DB.batch([refill,claim]);
  const row=results[1].results?.[0];
  if(!row){
    const repair=await unifiedR33RepairStep(env);
    if(repair.status!=='NO_REPAIR_WORK'){
      if(repair.status==='REPAIR_SOURCE_REGISTERED'||repair.status==='REPAIR_SOURCE_REHYDRATED')await canonicalRecoverQuarantine(env);
      return {status:'REPAIR_QUARANTINE',repair};
    }
    return {status:'NO_WORK',source:'CANONICAL'};
  }
  const context=await env.WIKI_DB.prepare('SELECT context_hash FROM mls_canonical_recovery WHERE code=?').bind(row.code).first();
  const commit=async(state,result,error,retry)=>{
    const saved=await env.WIKI_DB.batch([
      env.WIKI_DB.prepare(`UPDATE mls_canonical_recovery SET failed_context_hash=? WHERE code=? AND EXISTS(
        SELECT 1 FROM mls_canonical_queue WHERE code=? AND input_hash=? AND state='LEASED' AND lease_token=? AND expires_ms>?)`)
        .bind(context.context_hash,row.code,row.code,row.input_hash,token,Date.now()),
      env.WIKI_DB.prepare(`UPDATE mls_canonical_queue SET state=?,result_json=?,last_error=COALESCE(?,last_error),retry_ms=?,lease_token=NULL,expires_ms=0
        WHERE state='LEASED' AND code=? AND input_hash=? AND lease_token=? AND expires_ms>? RETURNING code`).bind(state,result?JSON.stringify(result):null,error||null,retry||0,row.code,row.input_hash,token,Date.now())
    ]);
    if(!saved[1].results?.length)throw Error('CANONICAL_LEASE_LOST');
  };
  try{
    const packet=await canonicalPacket(env,row);
    const item=packet.find(x=>x.input.code===row.code&&x.inputHash===row.input_hash);
    if(!item||await canonicalInputHash(item.input)!==row.input_hash)throw Error('CANONICAL_CONTEXT_HASH_MISMATCH_'+row.code);
    const response=await unifiedR33BuildDraft(env,{...item.input,runId:'CANONICAL-'+row.batch_id});
    const result=await response.json();
    if(result.error)throw Object.assign(Error(result.message||result.error),{unifiedStatus:result.error});
    if(result.status!=='MATCH'){
      await commit('QUARANTINED',null,result.reason||'NEEDS_CHAT_REVIEW');
      return {status:'CANONICAL_QUARANTINED',code:row.code,batchId:row.batch_id};
    }
    await commit('PREPARED',result);
    return {status:'CANONICAL_PREPARED',code:row.code,batchId:row.batch_id,editorialStatus:'PENDING_CANONICAL_R33_VALIDATION'};
  }catch(error){
    const message=wikiErrorMessage(error);
    if(message==='CANONICAL_LEASE_LOST')return {status:'NO_WORK',error:message};
    const kind=workersAiFailureKind(message);
    const pause=error.unifiedStatus==='QUOTA_PAUSED'||kind==='quota'?'QUOTA_PAUSED':error.unifiedStatus==='POLICY_PAUSED'||kind==='paid'?'POLICY_PAUSED':null;
    const nextState=pause?'RETRY':row.attempts>=3||message.includes('HASH_MISMATCH')?'QUARANTINED':'RETRY';
    await commit(nextState,null,message,nextState==='QUARANTINED'?0:Date.now()+300000);
    if(pause){await unifiedRunnerApplyMark(env,{state:pause,last_error:message,errorDelta:1});return {status:pause};}
    return {status:'CANONICAL_RETRY',code:row.code,error:message};
  }
}
