// R44 durable entry protocol. SQL is embedded by the build injector.
async function r44DurableReady(env) {
  let version;
  try { version = await env.WIKI_DB.prepare("SELECT value FROM r44_meta WHERE key='durable_entry_schema'").first(); }
  catch(error) { if(!String(error.message).includes('no such table'))throw error; }
  if(version)return;
  let poolReady=false;
  try { const pool=await env.WIKI_DB.prepare("SELECT value FROM r44_meta WHERE key='pool_schema'").first();poolReady=pool && pool.value===R44_POOL_SCHEMA; }
  catch(error) { if(!String(error.message).includes('no such table'))throw error; }
  await r44PoolSeed(env);
  // Keep the final legacy-pool bootstrap and normalized migration in separate
  // invocations so their combined statements cannot exceed the free query limit.
  if(!poolReady)throw new Error('R44_POOL_MIGRATION_IN_PROGRESS');
  await env.WIKI_DB.batch(R44_DURABLE_SQL.map(sql => env.WIKI_DB.prepare(sql)));
}
function r44Stable(value) {
  if (Array.isArray(value)) return '[' + value.map(r44Stable).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + r44Stable(value[k])).join(',') + '}';
  return JSON.stringify(value);
}
function r44Key(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 200 ? value : null;
}
async function r44Reconcile(env, ticketId) {
  await r44DurableReady(env);
  // One SELECT is an authoritative snapshot; no mixed reads during concurrent commits.
  const row = await env.WIKI_DB.prepare(`SELECT p.*,l.worker_id,l.lease_token,l.generation,l.expires_ms,
    (SELECT json_group_array(json_object('code',e.code,'state',e.state,'source',json(e.source_json),
      'receipt',json(r.receipt_json),'receiptSha256',r.receipt_sha256))
     FROM (SELECT * FROM r44_entries WHERE ticket_id=p.ticket_id ORDER BY ordinal) e
     LEFT JOIN r44_receipts r ON r.ticket_id=e.ticket_id AND r.code=e.code) AS entries_json
    FROM r44_ticket_progress p JOIN r44_leases l USING(ticket_id) WHERE p.ticket_id=?`).bind(ticketId).first();
  if (!row) return null;
  const entries = JSON.parse(row.entries_json);
  const live = row.expires_ms > Date.now() && !['COMPLETE','QUARANTINED'].includes(row.state);
  return { ticketId, state: row.state, migrationNote: row.migration_note,
    editorialStatus: 'PENDING_CANONICAL_R33_VALIDATION', entries,
    remaining: entries.filter(e => e.state !== 'AUDITED_DURABLE').map(e => e.code),
    lease: { workerId: row.worker_id, leaseToken: row.lease_token, leaseGeneration: row.generation,
      leaseExpiresAt: row.expires_ms, active: live } };
}
async function r44DurableClaim(env, workerId, key) {
  await r44DurableReady(env);
  if (!r44Key(key)) throw new Error('INVALID_IDEMPOTENCY_KEY');
  const now = Date.now(), token = crypto.randomUUID();
  const pool = await env.WIKI_DB.prepare("SELECT value FROM r44_meta WHERE key='pool_ticket_count'").first();
  const size = await env.WIKI_DB.prepare("SELECT value FROM r44_meta WHERE key='pool_ticket_size'").first();
  const start = r44WorkerShard(workerId, Number(pool.value), Number(size.value));
  // Selection, acquisition, generation bump and claim receipt share one SQLite transaction.
  await env.WIKI_DB.prepare(`INSERT INTO r44_claims(worker_id,idempotency_key,ticket_id,lease_token,created_ms,expires_ms)
    SELECT ?1,?2,l.ticket_id,?3,?4,?5 FROM r44_leases l
    JOIN r44_ticket_progress p USING(ticket_id) JOIN r44_tickets t USING(ticket_id)
    WHERE p.state IN ('CLAIMABLE','LEASED','PARTIAL_DURABLE')
    AND ((l.worker_id=?1 AND l.expires_ms>?4) OR (l.expires_ms<=?4
      AND NOT EXISTS(SELECT 1 FROM r44_leases a JOIN r44_ticket_progress b USING(ticket_id)
        WHERE a.worker_id=?1 AND a.expires_ms>?4 AND b.state IN ('LEASED','PARTIAL_DURABLE'))
      AND (SELECT COUNT(*) FROM r44_leases a JOIN r44_ticket_progress b USING(ticket_id)
        WHERE a.expires_ms>?4 AND b.state IN ('LEASED','PARTIAL_DURABLE'))<?6))
    AND NOT EXISTS(SELECT 1 FROM r44_claims WHERE worker_id=?1 AND idempotency_key=?2)
    ORDER BY CASE WHEN l.worker_id=?1 AND l.expires_ms>?4 THEN 0 ELSE 1 END,
      CASE WHEN ordinal_start >= ?7 THEN 0 ELSE 1 END, ordinal_start LIMIT 1
    ON CONFLICT(worker_id,idempotency_key) DO NOTHING`).bind(workerId,key,token,now,now+R44_LEASE_MS,R44_MAX_ACTIVE,start).run();
  const claim = await env.WIKI_DB.prepare('SELECT * FROM r44_claims WHERE worker_id=? AND idempotency_key=?').bind(workerId,key).first();
  if (!claim) {
    const active = await env.WIKI_DB.prepare("SELECT COUNT(*) n FROM r44_leases l JOIN r44_ticket_progress p USING(ticket_id) WHERE l.expires_ms>? AND p.state IN ('LEASED','PARTIAL_DURABLE')").bind(now).first();
    return {status: active.n >= R44_MAX_ACTIVE ? 'CAPACITY_BUSY' : 'NO_WORK',workerId};
  }
  const current = await r44Reconcile(env,claim.ticket_id);
  const valid = current.lease.active && current.lease.leaseToken === claim.lease_token;
  return {status: valid ? (claim.lease_token===token ? 'CLAIMED' : 'LEASE_REUSED') : 'CLAIM_ALREADY_RESOLVED',
    workerId,idempotencyKey:key,productionMode:R44_CONCURRENCY_MODE,remaining:current.remaining,
    ticket:{ticket_id:claim.ticket_id,lease_token:claim.lease_token,leaseGeneration:claim.generation,
      lease_expires_at:current.lease.leaseExpiresAt,state:current.state,entries:current.entries.map(e=>e.source)}};
}
async function r44Rebind(env, body) {
  await r44DurableReady(env);
  let ticketId = body.ticketId;
  if (!ticketId && body.workerId) {
    const row = await env.WIKI_DB.prepare('SELECT ticket_id FROM r44_leases WHERE worker_id=? ORDER BY renewed_ms DESC,ticket_id LIMIT 1').bind(body.workerId).first();
    ticketId = row && row.ticket_id;
  }
  const result = ticketId ? await r44Reconcile(env,ticketId) : null;
  if (!result) return {status:'NO_BINDING'};
  const owned = result.lease.workerId === body.workerId && (!body.leaseToken || result.lease.leaseToken===body.leaseToken);
  return {...result,status:result.state==='COMPLETE'?'COMPLETE':owned&&result.lease.active?'LEASE_REUSED':'LEASE_LOST'};
}
async function r44DurableContext(env, token, limit = Infinity) {
  await r44DurableReady(env);
  const lease = await env.WIKI_DB.prepare('SELECT ticket_id FROM r44_leases WHERE lease_token=? AND expires_ms>?').bind(token,Date.now()).first();
  if (!lease) return null;
  const state = await r44Reconcile(env,lease.ticket_id);
  if (!state.lease.active) return null;
  const entries = state.entries.filter(e=>e.state!=='AUDITED_DURABLE').slice(0,limit).map(e=>e.source);
  const content = await Promise.all(entries.map((entry) => r44LoadEntry(env, entry)));
  return {...state,...state.lease,entries,content};
}
async function r44DurableRenew(env, token, generation) {
  await r44DurableReady(env);
  const now=Date.now();
  const row=await env.WIKI_DB.prepare(`UPDATE r44_leases SET expires_ms=?,renewed_ms=?
    WHERE lease_token=? AND expires_ms>MAX(?,CAST(unixepoch('subsec')*1000 AS INTEGER)) AND (? IS NULL OR generation=?)
    AND ticket_id IN (SELECT ticket_id FROM r44_ticket_progress WHERE state IN ('LEASED','PARTIAL_DURABLE'))
    RETURNING ticket_id,worker_id,expires_ms AS lease_expires_at,generation AS leaseGeneration`)
    .bind(now+R44_LEASE_MS,now,token,now,generation??null,generation??null).first();
  return row;
}
async function r44EntryState(env,body) {
  await r44DurableReady(env);
  if(!['PENDING','IN_PROGRESS','FAILED_RETRYABLE','QUARANTINED'].includes(body.state) || !Number.isSafeInteger(body.leaseGeneration)) return {http:400,error:'INVALID_ENTRY_STATE'};
  const row=await env.WIKI_DB.prepare(`UPDATE r44_entries SET state=?1 WHERE ticket_id=?2 AND code=?3 AND state!='AUDITED_DURABLE'
    AND EXISTS(SELECT 1 FROM r44_leases l JOIN r44_ticket_progress p USING(ticket_id)
      WHERE l.ticket_id=?2 AND l.worker_id=?4 AND l.lease_token=?5 AND l.generation=?6
      AND l.expires_ms>CAST(unixepoch('subsec')*1000 AS INTEGER) AND p.state IN ('LEASED','PARTIAL_DURABLE'))
    RETURNING code,state`).bind(body.state,body.ticketId,body.code,body.workerId,body.leaseToken,body.leaseGeneration).first();
  return row?{status:'ENTRY_STATE_UPDATED',...row}:{http:409,error:'LEASE_OR_ENTRY_STATE_CONFLICT'};
}
async function r44Checkpoint(env, body, legacy=false) {
  await r44DurableReady(env);
  const entry=body.entry;
  if (!entry || !r44Key(body.idempotencyKey) || !body.leaseToken || (!legacy && (!body.workerId || !Number.isSafeInteger(body.leaseGeneration))))
    return {http:400,error:'INVALID_CHECKPOINT'};
  const lease=await env.WIKI_DB.prepare('SELECT * FROM r44_leases WHERE lease_token=?').bind(body.leaseToken).first();
  const ticketId=body.ticketId || (lease && lease.ticket_id);
  if (!ticketId) return {http:409,error:'LEASE_INVALID_OR_EXPIRED'};
  const source=await env.WIKI_DB.prepare('SELECT source_json FROM r44_entries WHERE ticket_id=? AND code=?').bind(ticketId,String(entry.code || '').toUpperCase()).first();
  if (!source) return {http:400,error:'RESULT_SCOPE_MISMATCH'};
  const normalized={...entry,code:String(entry.code).toUpperCase()};
  const outcome=entry.outcome || (legacy ? (entry.correctedContent ? 'CORRECTED':'PASS_NO_CHANGE') : null);
  if (!['PASS_NO_CHANGE','CORRECTED'].includes(outcome) || (outcome==='CORRECTED' && (!entry.correctedContent || typeof entry.correctedContent!=='object')) || (outcome==='PASS_NO_CHANGE' && entry.correctedContent))
    return {http:400,error:'INVALID_OUTCOME'};
  normalized.outcome=outcome;
  const payload=r44Stable(normalized), sha=await r44Sha256Text(payload);
  const previous=async()=>env.WIKI_DB.prepare('SELECT * FROM r44_receipts WHERE ticket_id=? AND (code=? OR idempotency_key=?)').bind(ticketId,normalized.code,body.idempotencyKey).all();
  const duplicate=rows=>{
    if (rows.length!==1 || rows[0].code!==normalized.code || rows[0].payload_sha256!==sha) return {http:409,error:'RESULT_CONFLICT'};
    const r=rows[0];
    return {status:'ALREADY_DURABLE',ticketId,receipt:JSON.parse(r.receipt_json),receiptSha256:r.receipt_sha256,editorialStatus:'PENDING_CANONICAL_R33_VALIDATION'};
  };
  let prior=await previous();
  if (prior.results.length) return duplicate(prior.results);
  if (!lease || lease.ticket_id!==ticketId) return {http:409,error:'LEASE_INVALID_OR_EXPIRED'};
  const generation=legacy?lease.generation:body.leaseGeneration, workerId=legacy?lease.worker_id:body.workerId;
  const committedMs=Date.now(), receiptId=crypto.randomUUID(), sourceSha=JSON.parse(source.source_json).sha256;
  const receipt={schema:'MLS-R44-ENTRY-RECEIPT-1',receiptId,ticketId,code:normalized.code,
    idempotencyKey:body.idempotencyKey,workerId,leaseGeneration:generation,outcome,
    payloadSha256:sha,sourceSha256:sourceSha,committedMs,editorialStatus:'PENDING_CANONICAL_R33_VALIDATION'};
  const receiptJson=r44Stable(receipt),receiptSha=await r44Sha256Text(receiptJson);
  try {
    // Receipt trigger checks the fence and atomically changes entry, preview and ticket.
    await env.WIKI_DB.batch([env.WIKI_DB.prepare(`INSERT INTO r44_receipts
      (receipt_id,ticket_id,code,idempotency_key,worker_id,lease_token,generation,outcome,payload_json,payload_sha256,source_sha256,receipt_json,receipt_sha256,committed_ms)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(receiptId,ticketId,normalized.code,body.idempotencyKey,workerId,body.leaseToken,generation,outcome,payload,sha,sourceSha,receiptJson,receiptSha,committedMs)]);
  } catch(error) {
    prior=await previous();
    if(prior.results.length) return duplicate(prior.results);
    if(String(error.message).includes('LEASE_INVALID_OR_EXPIRED')) return {http:409,error:'LEASE_INVALID_OR_EXPIRED'};
    throw error;
  }
  return {status:'AUDITED_DURABLE',ticketId,receipt,receiptSha256:receiptSha,editorialStatus:'PENDING_CANONICAL_R33_VALIDATION'};
}
async function r44DurableSubmit(request,env) {
  const text=await request.text();
  if(new TextEncoder().encode(text).length>R44_MAX_RESULT_BYTES) return r44Json({error:'RESULT_TOO_LARGE'},413);
  const body=JSON.parse(text);
  if(!body.payload || !Array.isArray(body.payload.entries) || !body.leaseToken) return r44Json({error:'INVALID_RESULT_PAYLOAD'},400);
  await r44DurableReady(env);
  const lease=await env.WIKI_DB.prepare('SELECT ticket_id FROM r44_leases WHERE lease_token=?').bind(body.leaseToken).first();
  // Pre-migration durable full-ticket retries retain the original digest contract.
  if(!lease) {
    const prior=await env.WIKI_DB.prepare('SELECT ticket_id,sha256 FROM r44_results WHERE lease_token=?').bind(body.leaseToken).first();
    if(prior) {const same=prior.sha256===await r44Sha256Text(JSON.stringify(body.payload));return r44Json({status:same?'RESULT_ALREADY_SUBMITTED':'RESULT_CONFLICT',ticketId:prior.ticket_id,sha256:prior.sha256},same?200:409);}
    return r44Json({error:'LEASE_INVALID_OR_EXPIRED'},409);
  }
  const state=await r44Reconcile(env,lease.ticket_id);
  const expected=state.entries.map(e=>e.source),payload=body.payload;
  if(payload.entries.length !== expected.length || !r44SameCodes(expected,payload.entries)) return r44Json({error:'RESULT_SCOPE_MISMATCH'},400);
  const envelope=JSON.stringify(payload),envelopeSha=await r44Sha256Text(envelope);
  const priorEnvelope=await env.WIKI_DB.prepare('SELECT sha256 FROM r44_results WHERE ticket_id=?').bind(lease.ticket_id).first();
  if(priorEnvelope && priorEnvelope.sha256!==envelopeSha)return r44Json({status:'RESULT_CONFLICT',ticketId:lease.ticket_id,sha256:priorEnvelope.sha256},409);
  if(priorEnvelope)return r44Json({status:'RESULT_ALREADY_SUBMITTED',ticketId:lease.ticket_id,sha256:priorEnvelope.sha256,
    state:state.state,legacyReceiptOnly:!!state.migrationNote,
    receipts:state.entries.filter(e=>e.receipt).map(e=>({receipt:e.receipt,receiptSha256:e.receiptSha256})),
    editorialStatus:'PENDING_CANONICAL_R33_VALIDATION'});
  const receipts=[];
  for(const entry of payload.entries) {
    const result=await r44Checkpoint(env,{...body,ticketId:lease.ticket_id,entry,idempotencyKey:lease.ticket_id+':'+String(entry.code).toUpperCase()+':legacy-v1'},true);
    if(result.error) return r44Json({...result,receipts},result.http);
    receipts.push(result);
  }
  // Preserve legacy envelope metadata for old exporters. Entry durability is already
  // authoritative; interruption here is repaired by replaying this same submit.
  await env.WIKI_DB.prepare(`INSERT INTO r44_results(ticket_id,lease_token,worker_id,stage,editorial_status,payload,sha256,source,created_at)
    SELECT ?,?,?,'audited','PENDING_CANONICAL_R33_VALIDATION',?,?,'cloudflare-chat',?
    WHERE EXISTS(SELECT 1 FROM r44_ticket_progress WHERE ticket_id=? AND state='COMPLETE')
    ON CONFLICT(ticket_id) DO NOTHING`).bind(lease.ticket_id,body.leaseToken,state.lease.workerId,envelope,envelopeSha,new Date().toISOString(),lease.ticket_id).run();
  const savedEnvelope=await env.WIKI_DB.prepare('SELECT sha256 FROM r44_results WHERE ticket_id=?').bind(lease.ticket_id).first();
  if(savedEnvelope.sha256!==envelopeSha)return r44Json({status:'RESULT_CONFLICT',ticketId:lease.ticket_id,sha256:savedEnvelope.sha256},409);
  return r44Json({status:receipts.every(r=>r.status==='ALREADY_DURABLE')?'RESULT_ALREADY_SUBMITTED':'AUDITED_DURABLE',
    ticketId:lease.ticket_id,sha256:envelopeSha,receipts,
    editorialStatus:'PENDING_CANONICAL_R33_VALIDATION',state:(await r44Reconcile(env,lease.ticket_id)).state});
}
async function r44DurableExport(env,limit,afterOrdinal=0) {
  await r44DurableReady(env);
  const n=Math.max(1,Math.min(200,Number(limit)||50));
  const after=Number.isSafeInteger(Number(afterOrdinal))&&Number(afterOrdinal)>=0?Number(afterOrdinal):0;
  const rows=await env.WIKI_DB.prepare(`SELECT t.*,r.worker_id AS result_worker,r.stage,r.editorial_status,r.payload,r.sha256,r.source,r.created_at,p.state AS durable_state
    FROM r44_tickets t LEFT JOIN r44_results r USING(ticket_id) JOIN r44_ticket_progress p USING(ticket_id)
    WHERE t.state='audited' AND t.ordinal_start>? ORDER BY t.ordinal_start LIMIT ?`).bind(after,n).all();
  for(const row of rows.results) {
    if(row.durable_state==='COMPLETE' && !row.payload) {
      const entries=await env.WIKI_DB.prepare('SELECT r.payload_json,r.committed_ms FROM r44_receipts r JOIN r44_entries e USING(ticket_id,code) WHERE r.ticket_id=? ORDER BY e.ordinal').bind(row.ticket_id).all();
      row.payload=JSON.stringify({entries:entries.results.map(e=>JSON.parse(e.payload_json)),editorialStatus:'PENDING_CANONICAL_R33_VALIDATION'});
      row.sha256=await r44Sha256Text(row.payload);row.result_sha256=row.sha256;row.stage='audited';row.editorial_status='PENDING_CANONICAL_R33_VALIDATION';row.source='cloudflare-entry-checkpoints';
      row.created_at=new Date(Math.max(...entries.results.map(e=>e.committed_ms))).toISOString();
    }
    row.result_sha256=row.sha256;
  }
  return rows.results;
}

async function r44LegacyQuarantineReconcile(env, limit = 5) {
  await r44DurableReady(env);
  const n = Math.max(1, Math.min(5, Number(limit) || 1));
  const rows = await env.WIKI_DB.prepare(`SELECT p.ticket_id,p.migration_note,t.ordinal_start,t.state AS legacy_state,
    r.payload,r.sha256,r.worker_id AS result_worker
    FROM r44_ticket_progress p
    JOIN r44_tickets t USING(ticket_id)
    LEFT JOIN r44_results r USING(ticket_id)
    WHERE p.state='QUARANTINED'
      AND p.migration_note='LEGACY_TICKET_RECEIPT_REQUIRES_ENTRY_RECONCILIATION'
    ORDER BY t.ordinal_start LIMIT ?`).bind(n).all();
  const results = [];
  for (const row of rows.results || []) {
    const ticketId = row.ticket_id;
    try {
      if (!row.payload || !row.sha256) {
        await env.WIKI_DB.prepare("UPDATE r44_ticket_progress SET migration_note='LEGACY_RECONCILIATION_BLOCKED_RESULT_MISSING' WHERE ticket_id=? AND state='QUARANTINED'").bind(ticketId).run();
        results.push({ticketId,status:'BLOCKED',reason:'LEGACY_RESULT_MISSING'});
        continue;
      }
      const digest = await r44Sha256Text(row.payload);
      if (digest !== row.sha256) {
        await env.WIKI_DB.prepare("UPDATE r44_ticket_progress SET migration_note='LEGACY_RECONCILIATION_BLOCKED_HASH_MISMATCH' WHERE ticket_id=? AND state='QUARANTINED'").bind(ticketId).run();
        results.push({ticketId,status:'BLOCKED',reason:'LEGACY_RESULT_HASH_MISMATCH'});
        continue;
      }
      let payload;
      try { payload = JSON.parse(row.payload); }
      catch (_) {
        await env.WIKI_DB.prepare("UPDATE r44_ticket_progress SET migration_note='LEGACY_RECONCILIATION_BLOCKED_JSON_INVALID' WHERE ticket_id=? AND state='QUARANTINED'").bind(ticketId).run();
        results.push({ticketId,status:'BLOCKED',reason:'LEGACY_RESULT_JSON_INVALID'});
        continue;
      }
      const sourceRows = await env.WIKI_DB.prepare(
        "SELECT code,source_json,state FROM r44_entries WHERE ticket_id=? ORDER BY ordinal"
      ).bind(ticketId).all();
      const sources = (sourceRows.results || []).map(x => JSON.parse(x.source_json));
      const structured = payload && Array.isArray(payload.entries) && r44SameCodes(sources,payload.entries);
      if (!structured) {
        // Some migration imports retained only an unstructured legacy sentinel.
        // They cannot be promoted into per-entry receipts without inventing results.
        // Re-open them for a fresh normal R44 audit, while retaining an audit event.
        const now = Date.now();
        await env.WIKI_DB.batch([
          env.WIKI_DB.prepare("DELETE FROM r44_results WHERE ticket_id=?").bind(ticketId),
          env.WIKI_DB.prepare("DELETE FROM r44_claims WHERE ticket_id=?").bind(ticketId),
          env.WIKI_DB.prepare("UPDATE r44_entries SET state='PENDING' WHERE ticket_id=? AND state!='AUDITED_DURABLE'").bind(ticketId),
          env.WIKI_DB.prepare("UPDATE r44_ticket_progress SET state='CLAIMABLE',migration_note='LEGACY_UNSTRUCTURED_REQUEUED_FOR_FRESH_R44' WHERE ticket_id=?").bind(ticketId),
          env.WIKI_DB.prepare("UPDATE r44_leases SET worker_id=NULL,lease_token=NULL,expires_ms=0,renewed_ms=? WHERE ticket_id=?").bind(now,ticketId),
          env.WIKI_DB.prepare("UPDATE r44_tickets SET state='queued',worker_id=NULL,lease_token=NULL,lease_expires_at=0,result_sha256=NULL,result_stage=NULL,updated_at=? WHERE ticket_id=?").bind(new Date(now).toISOString(),ticketId),
          env.WIKI_DB.prepare("INSERT INTO r44_events(ticket_id,event_type,detail,created_at) VALUES(?,?,?,?)")
            .bind(ticketId,'LEGACY_QUARANTINE_REQUEUED',row.sha256,new Date(now).toISOString())
        ]);
        results.push({ticketId,status:'REQUEUED_FRESH_R44',reason:'LEGACY_RESULT_NOT_ENTRY_STRUCTURED'});
        continue;
      }

      const workerId = 'r44-legacy-reconciler-v1';
      const leaseToken = crypto.randomUUID();
      const now = Date.now();
      await env.WIKI_DB.batch([
        env.WIKI_DB.prepare("UPDATE r44_entries SET state='PENDING' WHERE ticket_id=? AND state='QUARANTINED'").bind(ticketId),
        env.WIKI_DB.prepare("UPDATE r44_ticket_progress SET state='LEASED' WHERE ticket_id=? AND state='QUARANTINED' AND migration_note='LEGACY_TICKET_RECEIPT_REQUIRES_ENTRY_RECONCILIATION'").bind(ticketId),
        env.WIKI_DB.prepare("UPDATE r44_leases SET worker_id=?,lease_token=?,generation=generation+1,expires_ms=?,renewed_ms=? WHERE ticket_id=?")
          .bind(workerId,leaseToken,now+300000,now,ticketId),
        env.WIKI_DB.prepare("UPDATE r44_tickets SET state='leased',worker_id=?,lease_token=?,lease_expires_at=?,updated_at=? WHERE ticket_id=?")
          .bind(workerId,leaseToken,now+300000,new Date(now).toISOString(),ticketId)
      ]);
      const lease = await env.WIKI_DB.prepare("SELECT generation FROM r44_leases WHERE ticket_id=?").bind(ticketId).first();
      if (!lease) throw new Error('LEGACY_RECONCILE_LEASE_MISSING');
      for (const raw of payload.entries) {
        const entry = {...raw,code:String(raw.code || '').toUpperCase()};
        if (!entry.outcome) entry.outcome = entry.correctedContent ? 'CORRECTED' : 'PASS_NO_CHANGE';
        const checkpoint = await r44Checkpoint(env,{
          ticketId,
          workerId,
          leaseToken,
          leaseGeneration:lease.generation,
          idempotencyKey:ticketId+':'+entry.code+':legacy-reconcile-v1',
          entry
        },false);
        if (checkpoint.error) throw new Error('LEGACY_RECONCILE_CHECKPOINT_'+checkpoint.error);
      }
      const finalState = await r44Reconcile(env,ticketId);
      if (!finalState || finalState.state !== 'COMPLETE') throw new Error('LEGACY_RECONCILE_NOT_COMPLETE');
      await env.WIKI_DB.batch([
        env.WIKI_DB.prepare("UPDATE r44_ticket_progress SET migration_note=NULL WHERE ticket_id=? AND state='COMPLETE'").bind(ticketId),
        env.WIKI_DB.prepare("INSERT INTO r44_events(ticket_id,event_type,worker_id,lease_token,detail,created_at) VALUES(?,?,?,?,?,?)")
          .bind(ticketId,'LEGACY_QUARANTINE_RECONCILED',workerId,leaseToken,row.sha256,new Date().toISOString())
      ]);
      results.push({ticketId,status:'RECONCILED_COMPLETE',entries:payload.entries.length});
    } catch (error) {
      results.push({ticketId,status:'ERROR',reason:String(error && error.message || error).slice(0,500)});
    }
  }
  const remaining = await env.WIKI_DB.prepare(`SELECT COUNT(*) AS n FROM r44_ticket_progress
    WHERE state='QUARANTINED' AND migration_note='LEGACY_TICKET_RECEIPT_REQUIRES_ENTRY_RECONCILIATION'`).first();
  const quarantined = await env.WIKI_DB.prepare("SELECT COUNT(*) AS n FROM r44_ticket_progress WHERE state='QUARANTINED'").first();
  return {
    status:'LEGACY_QUARANTINE_RECONCILE',
    attempted:results.length,
    reconciled:results.filter(x=>x.status==='RECONCILED_COMPLETE').length,
    requeued:results.filter(x=>x.status==='REQUEUED_FRESH_R44').length,
    blocked:results.filter(x=>x.status==='BLOCKED'||x.status==='ERROR').length,
    remainingLegacy:Number(remaining && remaining.n || 0),
    quarantinedTotal:Number(quarantined && quarantined.n || 0),
    results
  };
}

async function r44LegacyQuarantineReconcileRoute(request,env) {
  const auth = await r44ChatBridgeAuthorize(request,env);
  if(!auth.ok)return r44Json({error:auth.error},auth.status);
  const body = await r44ChatBridgeBody(request);
  const limit = body.limit === undefined ? 5 : Number(body.limit);
  if(!Number.isInteger(limit)||limit<1||limit>5)return r44Json({error:'R44_LEGACY_RECONCILE_LIMIT_INVALID'},400);
  return r44Json(await r44LegacyQuarantineReconcile(env,limit));
}

async function r44DurableRoute(request,env,url) {
  if(url.pathname==='/api/r44/admin/reconcile-legacy-quarantine' && request.method==='POST')return r44LegacyQuarantineReconcileRoute(request,env);
  if(url.pathname==='/api/r44/chat-bridge/rebind' && request.method==='POST')return r44BridgeRecover(request,env);
  if(url.pathname==='/api/r44/chat-bridge/checkpoint' && request.method==='POST')return r44BridgeCheckpoint(request,env);
  if(url.pathname==='/api/r44/entry-state' && request.method==='POST') {const result=await r44EntryState(env,await request.json());return r44Json(result,result.http||200);}
  if(url.pathname==='/api/r44/reconcile' && request.method==='GET') {
    const state=await r44Reconcile(env,url.searchParams.get('ticketId'));
    if(state && state.lease)delete state.lease.leaseToken;
    return r44Json(state||{error:'TICKET_NOT_FOUND'},state?200:404);
  }
  if(url.pathname==='/api/r44/rebind' && request.method==='POST') {const state=await r44Rebind(env,await request.json());if(state.lease)delete state.lease.leaseToken;return r44Json(state);}
  if(url.pathname==='/api/r44/checkpoint' && request.method==='POST') {
    const text=await request.text();
    if(new TextEncoder().encode(text).length>R44_MAX_RESULT_BYTES) return r44Json({error:'RESULT_TOO_LARGE'},413);
    const result=await r44Checkpoint(env,JSON.parse(text));return r44Json(result,result.http||200);
  }
  if(url.pathname==='/api/r44/receipt' && request.method==='GET') {
    await r44DurableReady(env);
    const r=await env.WIKI_DB.prepare('SELECT receipt_json,receipt_sha256 FROM r44_receipts WHERE receipt_id=?').bind(url.searchParams.get('receiptId')).first();
    return r44Json(r?{receipt:JSON.parse(r.receipt_json),receiptSha256:r.receipt_sha256}:{error:'RECEIPT_NOT_FOUND'},r?200:404);
  }
  return null;
}
async function r44BridgeRecover(request,env) {
  const auth=await r44ChatBridgeAuthorize(request,env);
  if(!auth.ok)return r44Json({error:auth.error},auth.status);
  const body=await r44ChatBridgeBody(request);
  const state=await r44Rebind(env,{ticketId:body.ticketId,workerId:body.workerId});
  let bridgeSessionId=null;
  if(state.status==='LEASE_REUSED') {
    const token=state.lease.leaseToken,stamp=new Date().toISOString();
    await env.WIKI_DB.prepare('INSERT INTO r44_chat_bridge_sessions(session_id,ticket_id,worker_id,lease_token,created_at,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(lease_token) DO NOTHING')
      .bind('r44b-'+crypto.randomUUID(),state.ticketId,body.workerId,token,stamp,stamp).run();
    bridgeSessionId=(await env.WIKI_DB.prepare('SELECT session_id FROM r44_chat_bridge_sessions WHERE lease_token=?').bind(token).first()).session_id;
  }
  if(state.lease)delete state.lease.leaseToken;
  return r44Json({...state,bridgeSessionId,transport:'GITHUB_ACTIONS_FREE_BRIDGE'});
}
async function r44BridgeCheckpoint(request,env) {
  const auth=await r44ChatBridgeAuthorize(request,env);
  if(!auth.ok)return r44Json({error:auth.error},auth.status);
  const body=await r44ChatBridgeBody(request);
  const session=await r44ChatBridgeSession(env,body.bridgeSessionId);
  if(!session)return r44Json({error:'R44_CHAT_BRIDGE_SESSION_NOT_FOUND'},404);
  if(body.ticketId!==session.ticket_id)return r44Json({error:'TICKET_SESSION_MISMATCH'},409);
  const result=await r44Checkpoint(env,{...body,workerId:session.worker_id,leaseToken:session.lease_token});
  return r44Json(result,result.http||200);
}
