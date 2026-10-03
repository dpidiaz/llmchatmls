'use strict';

const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const ROOT=path.resolve(__dirname,'..');
const BASE=String(process.env.R44_BASE_URL||'https://llmchatmls.dpidiaz.workers.dev').replace(/\/$/,'');
const OUT_DIR=path.join(ROOT,'MLS R32 EDITORIAL','r44','r33-handoff');
const TICKET_DIR=path.join(OUT_DIR,'tickets');
const INDEX_PATH=path.join(OUT_DIR,'index.json');
const SCHEMA='MLS-R44-R33-HANDOFF-1';

function stable(value){
  if(Array.isArray(value))return value.map(stable);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));
  return value;
}
function sha256(value){return crypto.createHash('sha256').update(typeof value==='string'?value:JSON.stringify(stable(value))).digest('hex');}
function code(value){
  const v=String(value||'').trim().toUpperCase();
  if(!/^MLS-V\d{2}-\d{4}$/.test(v))throw new Error('INVALID_CODE '+v);
  return v;
}
function sourcePath(raw){
  const p=String(raw||'').replace(/^\/+/, '');
  return p.startsWith('content/')?p:'content/'+p;
}
function readIndex(){
  if(!fs.existsSync(INDEX_PATH))return {schema:SCHEMA,version:1,entries:[]};
  const x=JSON.parse(fs.readFileSync(INDEX_PATH,'utf8'));
  if(x.schema!==SCHEMA||!Array.isArray(x.entries))throw new Error('INVALID_EXISTING_HANDOFF_INDEX');
  return x;
}
async function page(afterOrdinal){
  const url=BASE+'/api/r44/export?limit=200&afterOrdinal='+encodeURIComponent(String(afterOrdinal));
  const r=await fetch(url,{headers:{accept:'application/json'}});
  if(!r.ok)throw new Error('R44_EXPORT_'+r.status);
  const rows=await r.json();
  if(!Array.isArray(rows))throw new Error('R44_EXPORT_INVALID');
  return rows;
}
async function allRows(){
  const out=[];let after=0;
  for(let n=0;n<100;n++){
    const rows=await page(after);
    if(!rows.length)break;
    out.push(...rows);
    const next=Math.max(...rows.map(r=>Number(r.ordinal_end||r.ordinal_start||0)));
    if(!Number.isFinite(next)||next<=after)throw new Error('R44_EXPORT_CURSOR_STALLED');
    after=next;
    if(rows.length<200)break;
  }
  return out;
}
function normalizeTicket(row){
  if(row.durable_state!=='COMPLETE'||!row.payload)return null;
  const sources=JSON.parse(row.entries_json||'[]');
  const byCode=new Map(sources.map((s,i)=>[code(s.code),{...s,ordinal:Number(row.ordinal_start||0)+i}]));
  const payload=JSON.parse(row.payload);
  if(!Array.isArray(payload.entries))throw new Error('R44_PAYLOAD_ENTRIES_MISSING '+row.ticket_id);
  const entries=payload.entries.map(raw=>{
    const c=code(raw.code),source=byCode.get(c);
    if(!source)throw new Error('R44_SOURCE_SCOPE_MISMATCH '+c);
    const outcome=String(raw.outcome||(raw.correctedContent?'CORRECTED':'PASS_NO_CHANGE')).toUpperCase();
    if(!['PASS_NO_CHANGE','CORRECTED'].includes(outcome))throw new Error('R44_OUTCOME_INVALID '+c);
    return {
      code:c,
      outcome,
      source:{path:sourcePath(source.path),sha256:String(source.sha256||'')},
      correctedContent:outcome==='CORRECTED'?(raw.correctedContent||null):null,
      evidence:raw.evidence||null,
      sources:raw.sources||[],
      claims:raw.claims||[],
      notes:String(raw.notes||''),
      ordinal:source.ordinal
    };
  });
  return {
    schema:SCHEMA,
    version:1,
    ticketId:String(row.ticket_id),
    ordinalStart:Number(row.ordinal_start),
    ordinalEnd:Number(row.ordinal_end),
    resultSha256:String(row.result_sha256||row.sha256||''),
    editorialStatus:String(row.editorial_status||'PENDING_CANONICAL_R33_VALIDATION'),
    source:String(row.source||'r44'),
    createdAt:String(row.created_at||''),
    entries
  };
}
async function main(){
  fs.mkdirSync(TICKET_DIR,{recursive:true});
  const prior=readIndex(),byCode=new Map((prior.entries||[]).map(x=>[code(x.code),x]));
  const rows=await allRows();let changed=0,tickets=0;
  for(const row of rows){
    const ticket=normalizeTicket(row);if(!ticket)continue;
    tickets++;
    const rel='MLS R32 EDITORIAL/r44/r33-handoff/tickets/'+ticket.ticketId+'.json';
    const full=path.join(ROOT,rel);
    const text=JSON.stringify(ticket,null,2)+'\n';
    if(!fs.existsSync(full)||fs.readFileSync(full,'utf8')!==text){fs.writeFileSync(full,text);changed++;}
    for(const entry of ticket.entries){
      const next={
        code:entry.code,
        ticketId:ticket.ticketId,
        ordinal:entry.ordinal,
        outcome:entry.outcome,
        sourcePath:entry.source.path,
        sourceSha256:entry.source.sha256,
        resultSha256:ticket.resultSha256,
        handoffPath:rel,
        r44CreatedAt:ticket.createdAt
      };
      const old=byCode.get(entry.code);
      if(old&&old.resultSha256!==next.resultSha256)throw new Error('R44_HANDOFF_RESULT_CONFLICT '+entry.code);
      byCode.set(entry.code,next);
    }
  }
  const entries=[...byCode.values()].sort((a,b)=>a.ordinal-b.ordinal||a.code.localeCompare(b.code));
  const digest=sha256(entries.map(({code,ticketId,resultSha256,outcome,sourcePath,sourceSha256})=>({code,ticketId,resultSha256,outcome,sourcePath,sourceSha256})));
  const nextIndex={schema:SCHEMA,version:1,entryCount:entries.length,snapshotSha256:digest,entries};
  const nextText=JSON.stringify(nextIndex,null,2)+'\n';
  const oldText=fs.existsSync(INDEX_PATH)?fs.readFileSync(INDEX_PATH,'utf8'):'';
  if(oldText!==nextText){fs.writeFileSync(INDEX_PATH,nextText);changed++;}
  console.log(JSON.stringify({ok:true,rows:rows.length,tickets,handoffEntries:entries.length,changedFiles:changed,snapshotSha256:digest}));
}
main().catch(error=>{console.error(error);process.exitCode=1});
