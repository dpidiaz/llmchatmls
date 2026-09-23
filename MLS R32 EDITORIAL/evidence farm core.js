'use strict';

const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');

const EVIDENCE_FARM_VERSION='2.0';
const EVIDENCE_FARM_DEFAULT_BATCH=25;
const EVIDENCE_FARM_MAX_BATCH=50;
const EVIDENCE_FARM_CLAIM_TTL_MS=90*1000;
const EVIDENCE_FARM_ACK_TTL_MS=5*60*1000;
const EVIDENCE_FARM_LEASE_TTL_MS=60*60*1000;
const EVIDENCE_FARM_COMMAND_MARKER='R33_EVIDENCE_FARM_COMMAND';
const EVIDENCE_FARM_EVENT_MARKER='R33_EVIDENCE_FARM_EVENT';
const EVIDENCE_FARM_STATE_MARKER='R33_EVIDENCE_FARM_STATE';
const EVIDENCE_FARM_LEDGER_MARKER='R33_EVIDENCE_FARM_LEDGER';
const DEFAULT_POOL_PATH=path.join('docs','evidence y provenance','15 Evidence Farm Correction Repeat Pool.json');

function farmError(code,message,status=422){const e=new Error(message||code);e.code=code;e.status=status;return e;}
function iso(value=Date.now()){return new Date(value).toISOString();}
function parseDate(value){const n=Date.parse(String(value||''));return Number.isFinite(n)?n:null;}
function plusMs(value,ms){const n=parseDate(value);if(n===null)throw farmError('INVALID_DATE','Fecha inválida.');return iso(n+ms);}
function randomToken(bytes=24){return crypto.randomBytes(bytes).toString('hex');}
function stable(value){
  if(Array.isArray(value))return value.map(stable);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));
  return value;
}
function stableStringify(value){return JSON.stringify(stable(value));}
function sha256(value){return crypto.createHash('sha256').update(typeof value==='string'?value:stableStringify(value)).digest('hex');}
function assertCode(code){
  const value=String(code||'').trim().toUpperCase();
  if(!/^MLS-V\d{2}-\d{4}$/.test(value))throw farmError('INVALID_CODE','Código MLS inválido.');
  return value;
}
function safeSegment(value,max=120){
  const out=String(value||'').normalize('NFKC').replace(/[^A-Za-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,max);
  if(!out)throw farmError('INVALID_PATH_SEGMENT','Segmento de ruta inválido.');
  return out;
}
function parseJsonLoose(text){
  const raw=String(text||'').trim();if(!raw)throw farmError('EMPTY_JSON','JSON vacío.');
  const first=raw.indexOf('{'),last=raw.lastIndexOf('}');if(first<0||last<first)throw farmError('INVALID_JSON','No se encontró JSON.');
  try{return JSON.parse(raw.slice(first,last+1));}catch{throw farmError('INVALID_JSON','JSON inválido.');}
}
function extractMarkedJson(text,marker){
  const raw=String(text||''),re=new RegExp('<!--\\s*'+marker+'\\s*([\\s\\S]*?)-->','m'),m=re.exec(raw);
  if(m)return parseJsonLoose(m[1]);return parseJsonLoose(raw);
}
function renderMarked(marker,value){return '<!-- '+marker+'\n'+JSON.stringify(value,null,2)+'\n-->';}

function normalizePool(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw farmError('INVALID_POOL','Pool R33 inválido.');
  const poolId=String(raw.poolId||'').trim();
  if(!/^[A-Za-z0-9._:-]{8,120}$/.test(poolId))throw farmError('INVALID_POOL_ID','poolId inválido.');
  const entries=Array.isArray(raw.entries)?raw.entries.map((entry,index)=>{
    const code=assertCode(entry?.code);
    const language=String(entry?.language||'').trim();
    const contentPath=String(entry?.contentPath||'').trim();
    if(!language||!contentPath)throw farmError('INVALID_POOL_ENTRY','Entrada incompleta en posición '+(index+1)+'.');
    return {...entry,code,language,contentPath,order:Number(entry.order||index+1)};
  }):[];
  if(!entries.length)throw farmError('EMPTY_POOL','Pool sin entradas.');
  if(new Set(entries.map(x=>x.code)).size!==entries.length)throw farmError('DUPLICATE_POOL_CODE','Pool contiene códigos duplicados.');
  return {
    ...raw,
    poolId,
    manifestVersion:String(raw.manifestVersion||'1.0'),
    status:String(raw.status||'').trim().toLowerCase(),
    active:Boolean(raw.active),
    gate500Authorized:Boolean(raw.gate500Authorized),
    entries
  };
}
function loadPool(root='.',poolPath=DEFAULT_POOL_PATH){
  const full=path.join(root,poolPath);if(!fs.existsSync(full))throw farmError('POOL_NOT_FOUND','No existe el manifiesto Evidence Farm: '+poolPath,500);
  return normalizePool(JSON.parse(fs.readFileSync(full,'utf8')));
}
function poolDigest(pool){return sha256({poolId:pool.poolId,manifestVersion:pool.manifestVersion,entries:pool.entries.map(x=>({code:x.code,contentPath:x.contentPath,order:x.order}))});}

function renderCommandBody(command){return ['## R33 Evidence Farm command','',renderMarked(EVIDENCE_FARM_COMMAND_MARKER,command)].join('\n');}
function parseCommand(body){
  const value=extractMarkedJson(body,EVIDENCE_FARM_COMMAND_MARKER),operation=String(value.operation||'').trim().toLowerCase();
  if(!operation)throw farmError('MISSING_OPERATION','Falta operation.');
  if(operation==='claim'){
    const requested=Number(value.requested??EVIDENCE_FARM_DEFAULT_BATCH);
    if(!Number.isInteger(requested)||requested<1||requested>EVIDENCE_FARM_MAX_BATCH)throw farmError('INVALID_BATCH_SIZE','requested debe estar entre 1 y 50.');
    const requestId=String(value.requestId||'').trim(),workerId=String(value.workerId||'').trim();
    if(!/^[A-Za-z0-9._:-]{8,120}$/.test(requestId))throw farmError('INVALID_REQUEST_ID','requestId inválido.');
    if(!/^[A-Za-z0-9._:-]{8,160}$/.test(workerId))throw farmError('INVALID_WORKER_ID','workerId inválido.');
    return {operation,requested,requestId,workerId};
  }
  if(['status_global','reap'].includes(operation))return {operation};
  throw farmError('UNSUPPORTED_OPERATION','Operación Evidence Farm no soportada.');
}
function parseWorkerEvent(body){
  const x=extractMarkedJson(body,EVIDENCE_FARM_EVENT_MARKER),operation=String(x.operation||'').trim().toLowerCase();
  if(!['heartbeat','checkpoint','finish','cancel'].includes(operation))throw farmError('INVALID_WORKER_EVENT','Evento Evidence Farm inválido.');
  return {...x,operation};
}
function parseFarmState(body){try{const x=extractMarkedJson(body,EVIDENCE_FARM_STATE_MARKER);return x?.kind==='r33_evidence_batch'?x:null;}catch{return null;}}
function parseLedger(body){try{const x=extractMarkedJson(body,EVIDENCE_FARM_LEDGER_MARKER);return x?.kind==='r33_evidence_ledger'?x:null;}catch{return null;}}

function initialLedger(pool){
  return {kind:'r33_evidence_ledger',version:EVIDENCE_FARM_VERSION,poolId:pool.poolId,manifestVersion:pool.manifestVersion,poolDigest:poolDigest(pool),total:pool.entries.length,verified:[],exceptions:[],updatedAt:iso()};
}
function normalizeCodes(values,pool){
  const allowed=new Set(pool.entries.map(x=>x.code));
  return [...new Set((Array.isArray(values)?values:[]).map(assertCode).filter(x=>allowed.has(x)))].sort();
}
function normalizeLedger(ledger,pool){
  if(String(ledger?.poolId||'')!==pool.poolId)throw farmError('LEDGER_POOL_MISMATCH','Ledger pertenece a otro pool.');
  return {...initialLedger(pool),...ledger,verified:normalizeCodes(ledger.verified,pool),exceptions:normalizeCodes(ledger.exceptions,pool)};
}
function terminalCodesFromLedger(ledger,pool){
  const l=normalizeLedger(ledger,pool);return new Set([...l.verified,...l.exceptions]);
}
function addTerminalToLedger(ledger,pool,code,status){
  const l=normalizeLedger(ledger,pool),c=assertCode(code);
  if(!pool.entries.some(x=>x.code===c))throw farmError('CODE_NOT_IN_POOL','Código fuera del pool activo.');
  if(status==='verified')l.verified=normalizeCodes([...l.verified,c],pool);
  else if(status==='exception')l.exceptions=normalizeCodes([...l.exceptions,c],pool);
  else throw farmError('INVALID_TERMINAL_STATUS','Estado terminal Evidence Farm inválido.');
  l.updatedAt=iso();return l;
}
function renderLedgerBody(ledger){
  return ['## R33 Evidence Farm ledger','','**Pool:** `'+ledger.poolId+'`  ','**Verified:** '+ledger.verified.length+'  ','**Exceptions:** '+ledger.exceptions.length+'  ','**Total:** '+ledger.total+'  ','','No edites manualmente el bloque de control.','',renderMarked(EVIDENCE_FARM_LEDGER_MARKER,ledger)].join('\n');
}

function makeBatchState({issueNumber,pool,requestId,workerId,workerLogin=null,entries,now=iso(),token=randomToken()}){
  const claimedAt=iso(now),batchId='R33-EVIDENCE-FARM-'+String(issueNumber).padStart(6,'0'),ackDeadlineAt=plusMs(claimedAt,EVIDENCE_FARM_ACK_TTL_MS);
  return {
    kind:'r33_evidence_batch',version:EVIDENCE_FARM_VERSION,poolId:pool.poolId,manifestVersion:pool.manifestVersion,batchId,issueNumber:Number(issueNumber),requestId,workerId,
    workerLogin:workerLogin?String(workerLogin):null,leaseToken:token,leaseEpoch:Number(issueNumber),status:'leased',claimedAt,acknowledgedAt:null,ackDeadlineAt,
    lastHeartbeatAt:null,expiresAt:ackDeadlineAt,entries:entries.map((x,i)=>({...x,position:i+1,leaseEpoch:Number(issueNumber)})),results:{},conflicts:[],
    readyToClose:false,cancelRequested:false,lastRejectedEvent:null,closedAt:null
  };
}
function renderBatchBody(state){
  const received=Object.keys(state.results||{}).length,pending=Math.max(0,(state.entries||[]).length-received);
  return ['## R33 Evidence Farm batch','','**Pool:** `'+state.poolId+'`  ','**Batch:** `'+state.batchId+'`  ','**Estado:** `'+state.status+'`  ','**Asignadas:** '+state.entries.length+'  ','**Resultados recibidos:** '+received+'  ','**Pendientes:** '+pending+'  ','**Worker acknowledged:** '+(state.acknowledgedAt?'sí':'no')+'  ','**Ack deadline:** '+state.ackDeadlineAt+'  ','**Lease expira:** '+state.expiresAt+'  ','','Evidence canónico: GitHub. Cada checkpoint debe apuntar al artefacto Evidence Git de la entrada y al commit exacto que lo contiene.','','No edites manualmente el bloque de control.','',renderMarked(EVIDENCE_FARM_STATE_MARKER,state)].join('\n');
}
function isClaimStale(createdAt,at=Date.now()){const created=parseDate(createdAt);return created===null||Number(at)-created>EVIDENCE_FARM_CLAIM_TTL_MS;}
function isLeaseExpired(state,at=Date.now()){
  if(!state||state.status!=='leased')return true;
  const expiry=!state.acknowledgedAt&&state.ackDeadlineAt?parseDate(state.ackDeadlineAt):parseDate(state.expiresAt);
  return expiry===null||Number(at)>expiry;
}
function pendingCodes(state){const done=new Set(Object.keys(state.results||{}));return (state.entries||[]).map(x=>x.code).filter(code=>!done.has(code));}
function releaseReasonForBatch(state,expired=isLeaseExpired(state)){
  if(state?.cancelRequested)return 'WORKER_CANCELLED';
  if(expired)return !state?.acknowledgedAt&&state?.ackDeadlineAt?'ACK_TIMEOUT':'LEASE_TIMEOUT';
  return null;
}
function validateLeaseEvent(state,event,createdAt){
  if(!state||state.kind!=='r33_evidence_batch')throw farmError('BATCH_NOT_FOUND','Batch Evidence Farm inválido.',409);
  if(state.status!=='leased'||state.readyToClose||state.cancelRequested)throw farmError('LEASE_NOT_ACTIVE','El lease ya no está activo.',409);
  if(String(event.batchId||'')!==state.batchId||String(event.leaseToken||'')!==state.leaseToken)throw farmError('LEASE_TOKEN_MISMATCH','batchId/leaseToken no coincide.',409);
  const when=parseDate(createdAt);if(when===null)throw farmError('INVALID_EVENT_TIME','Timestamp de comentario inválido.',409);
  if(isLeaseExpired(state,when))throw farmError('LEASE_EXPIRED','El evento llegó después del vencimiento del lease.',409);
  return when;
}
function evidenceEntryPath(assignment){
  if(!assignment)throw farmError('ASSIGNMENT_NOT_FOUND','No existe asignación para la entrada.',409);
  return ['MLS R32 EDITORIAL','evidence git','entries',safeSegment(assignment.language),assertCode(assignment.code)+'.json'].join('/');
}
function validateResultShape(result,code,status,state){
  if(!result||typeof result!=='object'||Array.isArray(result))throw farmError('INVALID_RESULT','Falta result estructurado para '+code);
  if(String(result.code||'').toUpperCase()!==code)throw farmError('RESULT_CODE_MISMATCH','result.code no coincide.');
  if(!/^\d{4}-\d{2}-\d{2}T/.test(String(result.articleGeneratedAt||'')))throw farmError('RESULT_VERSION_MISSING','Falta articleGeneratedAt para '+code);
  if(!/^[a-f0-9]{64}$/i.test(String(result.articleHash||'')))throw farmError('RESULT_HASH_MISSING','Falta articleHash SHA-256 para '+code);
  if(!Number.isInteger(Number(result.evidenceRevision))||Number(result.evidenceRevision)<0)throw farmError('EVIDENCE_REVISION_MISSING','Falta evidenceRevision para '+code);
  const evidenceStatus=String(result.evidenceStatus||'').toUpperCase();
  const assignment=(state.entries||[]).find(x=>x.code===code),expectedPath=evidenceEntryPath(assignment);
  const artifactPath=String(result.evidenceArtifactPath||'');
  if(artifactPath!==expectedPath)throw farmError('EVIDENCE_ARTIFACT_PATH_MISMATCH','evidenceArtifactPath no coincide con la entrada asignada.');
  if(!/^[a-f0-9]{40}$/i.test(String(result.evidenceCommitSha||'')))throw farmError('EVIDENCE_COMMIT_MISSING','Falta evidenceCommitSha Git de 40 caracteres.');
  if(!/^[a-f0-9]{64}$/i.test(String(result.evidenceArtifactHash||'')))throw farmError('EVIDENCE_ARTIFACT_HASH_MISSING','Falta evidenceArtifactHash SHA-256.');
  if(status==='verified'&&evidenceStatus!=='VERIFIED')throw farmError('NOT_VERIFIED','Un checkpoint verified requiere evidenceStatus VERIFIED.');
  if(status==='exception'){
    if(!String(result.errorCode||'').trim())throw farmError('EXCEPTION_CODE_MISSING','Una excepción requiere errorCode.');
    if(evidenceStatus==='REVIEWED')throw farmError('FALSE_HUMAN_REVIEW','Evidence Farm no puede fabricar estado REVIEWED humano.');
  }
  if(result.reviewedHuman===true)throw farmError('FALSE_HUMAN_REVIEW','Evidence Farm no puede declarar revisión humana.');
  if('bridgeResultPath' in result)throw farmError('BRIDGE_RESULT_FORBIDDEN','R33 GitHub-native no acepta bridgeResultPath.');
  return true;
}
function resultDigest(result){return sha256(stableStringify(result));}
function applyWorkerEvent(state,event,{createdAt,commentId}){
  const next=structuredClone(state),when=validateLeaseEvent(next,event,createdAt),at=iso(when);
  if(!next.acknowledgedAt)next.acknowledgedAt=at;
  if(event.operation==='cancel'){next.cancelRequested=true;next.lastHeartbeatAt=at;next.expiresAt=at;return next;}
  if(event.operation==='heartbeat'){next.lastHeartbeatAt=at;next.expiresAt=plusMs(at,EVIDENCE_FARM_LEASE_TTL_MS);return next;}
  if(event.operation==='finish'){
    next.lastHeartbeatAt=at;next.expiresAt=plusMs(at,EVIDENCE_FARM_LEASE_TTL_MS);next.readyToClose=pendingCodes(next).length===0;
    if(!next.readyToClose)next.lastRejectedEvent={operation:'finish',reason:'PENDING_RESULTS',at};return next;
  }
  const entries=Array.isArray(event.entries)?event.entries:[];
  if(entries.length<1||entries.length>10)throw farmError('INVALID_CHECKPOINT_SIZE','Un checkpoint debe contener entre 1 y 10 entradas.');
  const assigned=new Map((next.entries||[]).map(x=>[x.code,x]));
  for(const raw of entries){
    const code=assertCode(raw.code),assignment=assigned.get(code);if(!assignment)throw farmError('CODE_NOT_IN_BATCH','La entrada no pertenece al lote: '+code,409);
    if(Number(raw.leaseEpoch)!==Number(assignment.leaseEpoch))throw farmError('LEASE_EPOCH_MISMATCH','leaseEpoch obsoleto para '+code,409);
    const status=String(raw.status||'').toLowerCase();if(!['verified','exception'].includes(status))throw farmError('INVALID_RESULT_STATUS','status debe ser verified o exception.');
    validateResultShape(raw.result,code,status,next);
    const hash=resultDigest(raw.result),existing=next.results[code];
    if(existing){
      if(existing.hash!==hash){next.conflicts.push({code,type:'RESULT_HASH_CONFLICT',existingHash:existing.hash,incomingHash:hash,commentId:Number(commentId),at});throw farmError('RESULT_HASH_CONFLICT','Ya existe un resultado distinto para '+code,409);}
      continue;
    }
    next.results[code]={status,hash,commentId:Number(commentId),receivedAt:at,evidenceStatus:String(raw.result.evidenceStatus||'').toUpperCase(),evidenceRevision:Number(raw.result.evidenceRevision),evidenceArtifactPath:String(raw.result.evidenceArtifactPath),evidenceCommitSha:String(raw.result.evidenceCommitSha),evidenceArtifactHash:String(raw.result.evidenceArtifactHash)};
  }
  next.lastHeartbeatAt=at;next.expiresAt=plusMs(at,EVIDENCE_FARM_LEASE_TTL_MS);next.readyToClose=pendingCodes(next).length===0;return next;
}
function protectedCodesFromBatches(states){
  const out=new Set();for(const state of states){if(!state||state.status!=='leased'||isLeaseExpired(state))continue;for(const entry of state.entries||[])out.add(entry.code);}return out;
}
function selectNextEntries(pool,terminal,protectedCodes,requested){
  return pool.entries.filter(x=>!terminal.has(x.code)&&!protectedCodes.has(x.code)).slice(0,requested);
}
function farmProgress({pool,ledger,batches}){
  const terminal=terminalCodesFromLedger(ledger,pool),active=(batches||[]).filter(x=>x?.status==='leased'&&!isLeaseExpired(x)),protectedCodes=protectedCodesFromBatches(active);
  const partialResults=active.reduce((n,x)=>n+Object.keys(x.results||{}).length,0),l=normalizeLedger(ledger,pool);
  return {version:EVIDENCE_FARM_VERSION,poolId:pool.poolId,total:pool.entries.length,terminal:terminal.size,verified:l.verified.length,exceptions:l.exceptions.length,leased:protectedCodes.size,activeBatches:active.length,partialResults,pending:Math.max(0,pool.entries.length-terminal.size-protectedCodes.size),gate500Authorized:Boolean(pool.gate500Authorized),cloudflareInteractions:0,d1RowsRead:0,d1RowsWritten:0};
}

module.exports={
  EVIDENCE_FARM_VERSION,EVIDENCE_FARM_DEFAULT_BATCH,EVIDENCE_FARM_MAX_BATCH,EVIDENCE_FARM_CLAIM_TTL_MS,EVIDENCE_FARM_ACK_TTL_MS,EVIDENCE_FARM_LEASE_TTL_MS,
  EVIDENCE_FARM_COMMAND_MARKER,EVIDENCE_FARM_EVENT_MARKER,EVIDENCE_FARM_STATE_MARKER,EVIDENCE_FARM_LEDGER_MARKER,DEFAULT_POOL_PATH,
  farmError,iso,sha256,assertCode,safeSegment,renderMarked,renderCommandBody,parseCommand,parseWorkerEvent,parseFarmState,parseLedger,normalizePool,loadPool,poolDigest,
  initialLedger,normalizeLedger,terminalCodesFromLedger,addTerminalToLedger,renderLedgerBody,makeBatchState,renderBatchBody,isClaimStale,isLeaseExpired,pendingCodes,releaseReasonForBatch,
  validateResultShape,resultDigest,applyWorkerEvent,protectedCodesFromBatches,selectNextEntries,farmProgress,evidenceEntryPath
};
