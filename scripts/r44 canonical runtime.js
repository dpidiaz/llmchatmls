// Canonical preparation only. The existing R33 gate/integration owns VERIFIED.
var canonicalReadyEnvs=new WeakSet();
async function canonicalEnsure(env){
  if(canonicalReadyEnvs.has(env))return;
  await env.WIKI_DB.batch([
    env.WIKI_DB.prepare("CREATE TABLE IF NOT EXISTS mls_canonical_queue(code TEXT PRIMARY KEY,input_hash TEXT NOT NULL,page INTEGER NOT NULL,revision TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'PENDING',batch_id TEXT,lease_token TEXT,expires_ms INTEGER NOT NULL DEFAULT 0,attempts INTEGER NOT NULL DEFAULT 0,retry_ms INTEGER NOT NULL DEFAULT 0,result_json TEXT,last_error TEXT)"),
    env.WIKI_DB.prepare("CREATE INDEX IF NOT EXISTS mls_canonical_ready ON mls_canonical_queue(revision,state,retry_ms)"),
    env.WIKI_DB.prepare("CREATE TABLE IF NOT EXISTS mls_canonical_meta(id INTEGER PRIMARY KEY CHECK(id=1),revision TEXT NOT NULL,pending INTEGER NOT NULL,waiting_handoff INTEGER NOT NULL)")
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
    env.WIKI_DB.prepare(`INSERT INTO mls_canonical_queue(code,input_hash,page,revision)
      SELECT json_extract(value,'$.code'),json_extract(value,'$.inputHash'),json_extract(value,'$.page'),?2 FROM json_each(?1)
      WHERE NOT EXISTS(SELECT 1 FROM mls_canonical_meta WHERE id=1 AND revision=?2)
      ON CONFLICT(code) DO UPDATE SET input_hash=CASE WHEN state='PREPARED' THEN input_hash ELSE excluded.input_hash END,page=excluded.page,revision=excluded.revision,
      state=CASE WHEN state='PREPARED' OR input_hash=excluded.input_hash THEN state ELSE 'PENDING' END,
      result_json=CASE WHEN state='PREPARED' OR input_hash=excluded.input_hash THEN result_json ELSE NULL END,
      lease_token=CASE WHEN input_hash=excluded.input_hash THEN lease_token ELSE NULL END,
      expires_ms=CASE WHEN input_hash=excluded.input_hash THEN expires_ms ELSE 0 END,
      attempts=CASE WHEN input_hash=excluded.input_hash THEN attempts ELSE 0 END,
      retry_ms=CASE WHEN input_hash=excluded.input_hash THEN retry_ms ELSE 0 END`).bind(JSON.stringify(manifest.rows),manifest.revision),
    env.WIKI_DB.prepare('INSERT OR REPLACE INTO mls_canonical_meta VALUES(1,?,?,?)').bind(manifest.revision,manifest.pending,manifest.waitingHandoff)
  ]);
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
async function canonicalStatus(env){
  await canonicalEnsure(env);
  const meta=await env.WIKI_DB.prepare('SELECT * FROM mls_canonical_meta WHERE id=1').first();
  if(!meta)return {initialized:false,claimable:0,pending:null,prepared:0};
  const rows=await env.WIKI_DB.prepare(`SELECT state,COUNT(*) n FROM mls_canonical_queue WHERE revision=? GROUP BY state`).bind(meta.revision).all();
  const counts=Object.fromEntries((rows.results||[]).map(r=>[r.state,Number(r.n)]));
  const eligible=await env.WIKI_DB.prepare("SELECT COUNT(*) n FROM mls_canonical_queue WHERE revision=? AND (state IN ('PENDING','READY') OR (state='RETRY' AND retry_ms<=?) OR (state='LEASED' AND expires_ms<=?))").bind(meta.revision,Date.now(),Date.now()).first();
  return {initialized:true,claimable:Number(eligible.n),pending:meta.pending,waitingHandoff:meta.waiting_handoff,prepared:counts.PREPARED||0,counts,batchSize:100,verifiedAuthority:'github-main-verified-index'};
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
  // One bounded recovery of malformed AI JSON. Missing sources/rejected evidence
  // remain quarantined. Attempt 4 cannot be requeued by this recovery.
  await env.WIKI_DB.prepare(`UPDATE mls_canonical_queue SET state='RETRY',retry_ms=0
    WHERE revision=(SELECT revision FROM mls_canonical_meta WHERE id=1)
    AND state='QUARANTINED' AND last_error='UNIFIED_R33_DRAFT_JSON_INVALID'
    AND attempts=3 AND lease_token IS NULL AND expires_ms=0`).run();
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
  if(!row)return {status:'NO_WORK',source:'CANONICAL'};
  const commit=async(state,result,error,retry)=>{
    const saved=await env.WIKI_DB.prepare(`UPDATE mls_canonical_queue SET state=?,result_json=?,last_error=?,retry_ms=?,lease_token=NULL,expires_ms=0
      WHERE code=? AND input_hash=? AND lease_token=? AND expires_ms>? RETURNING code`).bind(state,result?JSON.stringify(result):null,error||null,retry||0,row.code,row.input_hash,token,Date.now()).first();
    if(!saved)throw Error('CANONICAL_LEASE_LOST');
  };
  try{
    const packet=await canonicalAsset(env,row.revision+'-'+row.page+'.json');
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
    await commit(pause?'RETRY':row.attempts>=3||message.includes('HASH_MISMATCH')?'QUARANTINED':'RETRY',null,message,Date.now()+300000);
    if(pause){await unifiedRunnerApplyMark(env,{state:pause,last_error:message,errorDelta:1});return {status:pause};}
    return {status:'CANONICAL_RETRY',code:row.code,error:message};
  }
}
