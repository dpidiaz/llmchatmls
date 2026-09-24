'use strict';

const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');

const FARM_VERSION='1.1';
const FARM_DEFAULT_BATCH=25;
const FARM_MAX_BATCH=100;
const FARM_CLAIM_TTL_MS=90*1000;
const FARM_ACK_TTL_MS=5*60*1000;
const FARM_LEASE_TTL_MS=5*60*1000;
const FARM_REAPER_CADENCE_MINUTES=5;
const FARM_COMMAND_MARKER='MLS_FARM_COMMAND';
const FARM_EVENT_MARKER='MLS_FARM_EVENT';
const FARM_STATE_MARKER='MLS_FARM_STATE';
const FARM_LEDGER_MARKER='MLS_FARM_LEDGER';

const LANGUAGE_ORDER=Object.freeze([
  {slug:'espanol-guatemala',name:'Español de Guatemala',prefix:'V10',mlsPrefix:'MLS-V10',total:930},
  {slug:'ingles',name:'Inglés',prefix:'V01',mlsPrefix:'MLS-V01',total:766},
  {slug:'portugues',name:'Portugués brasileño',prefix:'V02',mlsPrefix:'MLS-V02',total:1199},
  {slug:'italiano',name:'Italiano',prefix:'V03',mlsPrefix:'MLS-V03',total:810},
  {slug:'frances',name:'Francés',prefix:'V04',mlsPrefix:'MLS-V04',total:1159},
  {slug:'aleman',name:'Alemán',prefix:'V05',mlsPrefix:'MLS-V05',total:1101},
  {slug:'japones',name:'Japonés',prefix:'V06',mlsPrefix:'MLS-V06',total:1027},
  {slug:'chino-taiwan',name:'Chino mandarín de Taiwán',prefix:'V07',mlsPrefix:'MLS-V07',total:1016},
  {slug:'coreano',name:'Coreano',prefix:'V08',mlsPrefix:'MLS-V08',total:1094},
  {slug:'ruso',name:'Ruso',prefix:'V09',mlsPrefix:'MLS-V09',total:1031}
]);

function farmError(code,message,status=422){
  const e=new Error(message||code);e.code=code;e.status=status;return e;
}
function iso(value=Date.now()){return new Date(value).toISOString();}
function parseDate(value){const n=Date.parse(String(value||''));return Number.isFinite(n)?n:null;}
function plusMs(value,ms){const n=parseDate(value);if(n===null)throw farmError('INVALID_DATE','Fecha inválida.');return iso(n+ms);}
function randomToken(bytes=24){return crypto.randomBytes(bytes).toString('hex');}
function sha256(value){return crypto.createHash('sha256').update(typeof value==='string'?value:stableStringify(value)).digest('hex');}
function stable(value){
  if(Array.isArray(value))return value.map(stable);
  if(value&&typeof value==='object'){
    return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));
  }
  return value;
}
function stableStringify(value){return JSON.stringify(stable(value));}
function assertCode(code){
  const value=String(code||'').trim().toUpperCase();
  if(!/^MLS-V\d{2}-\d{4}$/.test(value))throw farmError('INVALID_CODE','Código MLS inválido.');
  return value;
}
function codeParts(code){
  const value=assertCode(code),m=/^MLS-(V\d{2})-(\d{4})$/.exec(value);
  const language=LANGUAGE_ORDER.find(x=>x.prefix===m[1]);
  if(!language)throw farmError('UNKNOWN_LANGUAGE_PREFIX','Prefijo MLS fuera del corpus Farm.');
  const n=Number(m[2]);
  if(n<1||n>language.total)throw farmError('CODE_OUT_OF_RANGE','Código fuera del rango canónico.');
  return {...language,code:value,n};
}
function corpusEntries(root='.'){
  const out=[];
  for(const lang of LANGUAGE_ORDER){
    const dir=path.join(root,'content',lang.slug);
    const names=fs.readdirSync(dir).filter(x=>/^MLS-V\d{2}-\d{4}\.json$/.test(x)).sort();
    for(const name of names){
      const code=name.slice(0,-5),parts=codeParts(code);
      if(parts.slug!==lang.slug)throw farmError('CORPUS_LANGUAGE_MISMATCH','Ruta/código inconsistente: '+name,500);
      out.push({code,language:lang.slug,languageName:lang.name,n:parts.n,path:'content/'+lang.slug+'/'+name});
    }
  }
  return out;
}
function parseJsonLoose(text){
  const raw=String(text||'').trim();
  if(!raw)throw farmError('EMPTY_JSON','JSON vacío.');
  const first=raw.indexOf('{'),last=raw.lastIndexOf('}');
  if(first<0||last<first)throw farmError('INVALID_JSON','No se encontró JSON.');
  try{return JSON.parse(raw.slice(first,last+1));}catch{throw farmError('INVALID_JSON','JSON inválido.');}
}
function extractMarkedJson(text,marker){
  const raw=String(text||'');
  const re=new RegExp('<!--\\s*'+marker+'\\s*([\\s\\S]*?)-->','m');
  const m=re.exec(raw);
  if(m)return parseJsonLoose(m[1]);
  return parseJsonLoose(raw);
}
function renderMarked(marker,value){return '<!-- '+marker+'\n'+JSON.stringify(value,null,2)+'\n-->';}
function renderCommandBody(command){
  return ['## MLS Farm command','',renderMarked(FARM_COMMAND_MARKER,command)].join('\n');
}
function renderBatchBody(state){
  const terminal=Object.keys(state.results||{}).length;
  const pending=Math.max(0,(state.entries||[]).length-terminal);
  return [
    '## MLS Farm batch',
    '',
    '**Batch:** `'+state.batchId+'`  ',
    '**Estado:** `'+state.status+'`  ',
    '**Asignadas:** '+state.entries.length+'  ',
    '**Resultados recibidos:** '+terminal+'  ',
    '**Pendientes:** '+pending+'  ',
    '**Worker acknowledged:** '+(state.acknowledgedAt?'sí':'no')+'  ',
    '**Ack deadline:** '+(state.ackDeadlineAt||'legacy')+'  ',
    '**Lease expira:** '+state.expiresAt+'  ',
    '',
    'Este issue es estado operativo de MLS Farm. No edites manualmente el bloque de control.',
    '',
    renderMarked(FARM_STATE_MARKER,state)
  ].join('\n');
}
function renderLedgerBody(ledger){
  return [
    '## MLS Farm ledger '+ledger.prefix,
    '',
    'Estado compacto terminal para '+ledger.languageName+'. Pendiente y leased son implícitos.',
    '',
    renderMarked(FARM_LEDGER_MARKER,ledger)
  ].join('\n');
}
function parseCommand(body){
  const value=extractMarkedJson(body,FARM_COMMAND_MARKER);
  const operation=String(value.operation||'').trim().toLowerCase();
  if(!operation)throw farmError('MISSING_OPERATION','Falta operation.');
  if(operation==='claim'){
    const requested=Number(value.requested??FARM_DEFAULT_BATCH);
    if(!Number.isInteger(requested)||requested<1||requested>FARM_MAX_BATCH)
      throw farmError('INVALID_BATCH_SIZE','requested debe estar entre 1 y 100.');
    const requestId=String(value.requestId||'').trim();
    const workerId=String(value.workerId||'').trim();
    if(!/^[A-Za-z0-9._:-]{8,120}$/.test(requestId))throw farmError('INVALID_REQUEST_ID','requestId inválido.');
    if(!/^[A-Za-z0-9._:-]{8,160}$/.test(workerId))throw farmError('INVALID_WORKER_ID','workerId inválido.');
    return {operation,requested,requestId,workerId};
  }
  if(['status_global','reap'].includes(operation))return {operation};
  throw farmError('UNSUPPORTED_OPERATION','Operación Farm no soportada.');
}
function parseFarmState(body){try{const x=extractMarkedJson(body,FARM_STATE_MARKER);return x?.kind==='batch'?x:null;}catch{return null;}}
function parseLedger(body){try{const x=extractMarkedJson(body,FARM_LEDGER_MARKER);return x?.kind==='ledger'?x:null;}catch{return null;}}
function parseWorkerEvent(body){
  const x=extractMarkedJson(body,FARM_EVENT_MARKER);
  const operation=String(x.operation||'').trim().toLowerCase();
  if(!['heartbeat','checkpoint','finish','cancel'].includes(operation))throw farmError('INVALID_WORKER_EVENT','Evento Farm inválido.');
  return {...x,operation};
}
function initialLedger(language,preserved=[]){
  return {
    kind:'ledger',version:FARM_VERSION,prefix:language.prefix,language:language.slug,languageName:language.name,
    total:language.total,submitted:[],needsReview:[],integrated:[],preservedExisting:[...new Set(preserved)].sort((a,b)=>a-b),
    updatedAt:iso()
  };
}
function normalizeNums(values,max){
  return [...new Set((Array.isArray(values)?values:[]).map(Number).filter(n=>Number.isInteger(n)&&n>=1&&n<=max))].sort((a,b)=>a-b);
}
function normalizeLedger(ledger){
  const language=LANGUAGE_ORDER.find(x=>x.prefix===ledger?.prefix);
  if(!language)throw farmError('INVALID_LEDGER','Ledger sin prefijo válido.');
  return {
    ...initialLedger(language,[]),...ledger,
    submitted:normalizeNums(ledger.submitted,language.total),
    needsReview:normalizeNums(ledger.needsReview,language.total),
    integrated:normalizeNums(ledger.integrated,language.total),
    preservedExisting:normalizeNums(ledger.preservedExisting,language.total)
  };
}
function terminalCodesFromLedgers(ledgers){
  const out=new Set();
  for(const raw of ledgers){
    const ledger=normalizeLedger(raw);
    for(const field of ['submitted','needsReview','integrated','preservedExisting']){
      for(const n of ledger[field])out.add('MLS-'+ledger.prefix+'-'+String(n).padStart(4,'0'));
    }
  }
  return out;
}
function addTerminalToLedger(ledger,code,status){
  const l=normalizeLedger(ledger),p=codeParts(code);
  if(p.prefix!==l.prefix)throw farmError('LEDGER_PREFIX_MISMATCH','Código no pertenece al ledger.');
  const field=status==='needs_review'?'needsReview':status==='integrated'?'integrated':'submitted';
  l[field]=normalizeNums([...l[field],p.n],l.total);
  l.updatedAt=iso();
  return l;
}
function makeBatchState({issueNumber,requestId,workerId,workerLogin=null,entries,now=iso(),token=randomToken()}){
  const claimedAt=iso(now),batchId='MLS-FARM-'+String(issueNumber).padStart(6,'0');
  const ackDeadlineAt=plusMs(claimedAt,FARM_ACK_TTL_MS);
  return {
    kind:'batch',version:FARM_VERSION,batchId,issueNumber:Number(issueNumber),requestId,workerId,workerLogin:workerLogin?String(workerLogin):null,
    leaseToken:token,leaseEpoch:Number(issueNumber),status:'leased',claimedAt,acknowledgedAt:null,ackDeadlineAt,lastHeartbeatAt:null,
    expiresAt:ackDeadlineAt,entries:entries.map((x,i)=>({...x,position:i+1,leaseEpoch:Number(issueNumber)})),
    results:{},conflicts:[],readyToClose:false,cancelRequested:false,lastRejectedEvent:null,closedAt:null
  };
}
function isClaimStale(createdAt,at=Date.now()){
  const created=parseDate(createdAt);
  return created===null||Number(at)-created>FARM_CLAIM_TTL_MS;
}
function isLeaseExpired(state,at=Date.now()){
  if(!state||state.status!=='leased')return true;
  const expiry=!state.acknowledgedAt&&state.ackDeadlineAt?parseDate(state.ackDeadlineAt):parseDate(state.expiresAt);
  return expiry===null||Number(at)>expiry;
}
function pendingCodes(state){const done=new Set(Object.keys(state.results||{}));return (state.entries||[]).map(x=>x.code).filter(code=>!done.has(code));}
function validateLeaseEvent(state,event,createdAt){
  if(!state||state.kind!=='batch')throw farmError('BATCH_NOT_FOUND','Batch Farm inválido.',409);
  if(state.status!=='leased'||state.readyToClose||state.cancelRequested)throw farmError('LEASE_NOT_ACTIVE','El lease ya no está activo.',409);
  if(String(event.batchId||'')!==state.batchId||String(event.leaseToken||'')!==state.leaseToken)
    throw farmError('LEASE_TOKEN_MISMATCH','batchId/leaseToken no coincide.',409);
  const when=parseDate(createdAt);
  if(when===null)throw farmError('INVALID_EVENT_TIME','Timestamp de comentario inválido.',409);
  if(isLeaseExpired(state,when))throw farmError('LEASE_EXPIRED','El evento llegó después del vencimiento del lease.',409);
  return when;
}
function validateResultShape(result,code){
  if(!result||typeof result!=='object'||Array.isArray(result))throw farmError('INVALID_RESULT','Falta result estructurado para '+code);
  if(String(result.code||'').toUpperCase()!==code)throw farmError('RESULT_CODE_MISMATCH','result.code no coincide.');
  if(!/^\d{4}-\d{2}-\d{2}T/.test(String(result.articleGeneratedAt||'')))throw farmError('RESULT_VERSION_MISSING','Falta articleGeneratedAt para '+code);
  if(!/^[a-f0-9]{64}$/i.test(String(result.articleHash||'')))throw farmError('RESULT_HASH_MISSING','Falta articleHash SHA-256 para '+code);
  for(const field of ['sources','claims','links','conflicts'])if(!Array.isArray(result[field]))throw farmError('RESULT_SCHEMA_INVALID',field+' debe ser array para '+code);
  if(result.provenance!==undefined&&(typeof result.provenance!=='object'||result.provenance===null||Array.isArray(result.provenance)))throw farmError('RESULT_SCHEMA_INVALID','provenance inválido para '+code);
  return true;
}
function resultDigest(result){return sha256(stableStringify(result));}
function applyWorkerEvent(state,event,{createdAt,commentId}){
  const next=structuredClone(state),when=validateLeaseEvent(next,event,createdAt),at=iso(when);
  if(!next.acknowledgedAt)next.acknowledgedAt=at;
  if(event.operation==='cancel'){
    next.cancelRequested=true;next.lastHeartbeatAt=at;next.expiresAt=at;return next;
  }
  if(event.operation==='heartbeat'){
    next.lastHeartbeatAt=at;next.expiresAt=plusMs(at,FARM_LEASE_TTL_MS);return next;
  }
  if(event.operation==='finish'){
    next.lastHeartbeatAt=at;next.expiresAt=plusMs(at,FARM_LEASE_TTL_MS);
    next.readyToClose=pendingCodes(next).length===0;
    if(!next.readyToClose)next.lastRejectedEvent={operation:'finish',reason:'PENDING_RESULTS',at};
    return next;
  }
  const entries=Array.isArray(event.entries)?event.entries:[];
  if(entries.length<1||entries.length>10)throw farmError('INVALID_CHECKPOINT_SIZE','Un checkpoint debe contener entre 1 y 10 entradas.');
  const assigned=new Map((next.entries||[]).map(x=>[x.code,x]));
  for(const raw of entries){
    const code=assertCode(raw.code),assignment=assigned.get(code);
    if(!assignment)throw farmError('CODE_NOT_IN_BATCH','La entrada no pertenece al lote: '+code,409);
    if(Number(raw.leaseEpoch)!==Number(assignment.leaseEpoch))throw farmError('LEASE_EPOCH_MISMATCH','leaseEpoch obsoleto para '+code,409);
    const status=String(raw.status||'').toLowerCase();
    if(!['submitted','needs_review'].includes(status))throw farmError('INVALID_RESULT_STATUS','status debe ser submitted o needs_review.');
    validateResultShape(raw.result,code);
    const hash=resultDigest(raw.result),existing=next.results[code];
    if(existing){
      if(existing.hash!==hash){
        next.conflicts.push({code,type:'RESULT_HASH_CONFLICT',existingHash:existing.hash,incomingHash:hash,commentId:Number(commentId),at});
        throw farmError('RESULT_HASH_CONFLICT','Ya existe un resultado distinto para '+code,409);
      }
      continue;
    }
    next.results[code]={status,hash,commentId:Number(commentId),receivedAt:at};
  }
  next.lastHeartbeatAt=at;next.expiresAt=plusMs(at,FARM_LEASE_TTL_MS);
  next.readyToClose=pendingCodes(next).length===0;
  return next;
}
function protectedCodesFromBatches(states){
  const out=new Set();
  for(const state of states){
    if(!state||state.status!=='leased'||isLeaseExpired(state))continue;
    for(const entry of state.entries||[])out.add(entry.code);
  }
  return out;
}
function selectNextEntries(corpus,terminal,protectedCodes,requested){
  return corpus.filter(x=>!terminal.has(x.code)&&!protectedCodes.has(x.code)).slice(0,requested);
}
function farmProgress({corpus,ledgers,batches}){
  const terminal=terminalCodesFromLedgers(ledgers),active=(batches||[]).filter(x=>x?.status==='leased'&&!isLeaseExpired(x));
  const protectedCodes=protectedCodesFromBatches(active);
  const partialSubmitted=active.reduce((n,x)=>n+Object.keys(x.results||{}).length,0);
  const counts={submitted:0,needsReview:0,integrated:0,preservedExisting:0};
  for(const l0 of ledgers){
    const l=normalizeLedger(l0);counts.submitted+=l.submitted.length;counts.needsReview+=l.needsReview.length;counts.integrated+=l.integrated.length;counts.preservedExisting+=l.preservedExisting.length;
  }
  return {
    version:FARM_VERSION,total:corpus.length,terminal:terminal.size,leased:protectedCodes.size,activeBatches:active.length,
    partialSubmitted,pending:Math.max(0,corpus.length-terminal.size-protectedCodes.size),...counts,
    cloudflareInteractions:0,d1RowsRead:0,d1RowsWritten:0
  };
}
function preservedPilotCodes(root='.'){
  const p=path.join(root,'docs','evidence y provenance','04 Pilot 20 Manifest.json');
  if(!fs.existsSync(p))return [];
  const j=JSON.parse(fs.readFileSync(p,'utf8'));
  return (j.entries||[]).map(x=>assertCode(x.code));
}

module.exports={
  FARM_VERSION,FARM_DEFAULT_BATCH,FARM_MAX_BATCH,FARM_CLAIM_TTL_MS,FARM_ACK_TTL_MS,FARM_LEASE_TTL_MS,FARM_REAPER_CADENCE_MINUTES,
  FARM_COMMAND_MARKER,FARM_EVENT_MARKER,FARM_STATE_MARKER,FARM_LEDGER_MARKER,LANGUAGE_ORDER,
  farmError,iso,parseDate,plusMs,randomToken,sha256,stableStringify,assertCode,codeParts,corpusEntries,
  parseJsonLoose,extractMarkedJson,renderMarked,renderCommandBody,renderBatchBody,renderLedgerBody,parseCommand,parseFarmState,parseLedger,parseWorkerEvent,
  initialLedger,normalizeLedger,terminalCodesFromLedgers,addTerminalToLedger,makeBatchState,isClaimStale,isLeaseExpired,pendingCodes,
  validateLeaseEvent,validateResultShape,resultDigest,applyWorkerEvent,protectedCodesFromBatches,selectNextEntries,farmProgress,preservedPilotCodes
};
