'use strict';

const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');

const DISPATCH_VERSION='1.0';
const CLAIM_TTL_MS=90*1000;
const ACK_TTL_MS=5*60*1000;
const LEASE_TTL_MS=10*60*1000;
const REAPER_CADENCE_MINUTES=5;
const COMMAND_MARKER='MLS_GLOBAL_DISPATCH_COMMAND';
const EVENT_MARKER='MLS_GLOBAL_DISPATCH_EVENT';
const ASSIGNMENT_MARKER='MLS_GLOBAL_DISPATCH_ASSIGNMENT';
const LEDGER_MARKER='MLS_GLOBAL_DISPATCH_LEDGER';
const DEFAULT_REGISTRY_PATH=path.join('MLS R32 EDITORIAL','global dispatcher','work registry.json');

function dispatchError(code,message,status=422){const e=new Error(message||code);e.code=code;e.status=status;return e;}
function iso(value=Date.now()){return new Date(value).toISOString();}
function parseDate(value){const n=Date.parse(String(value||''));return Number.isFinite(n)?n:null;}
function plusMs(value,ms){const n=parseDate(value);if(n===null)throw dispatchError('INVALID_DATE','Fecha inválida.');return iso(n+ms);}
function randomToken(bytes=24){return crypto.randomBytes(bytes).toString('hex');}
function stable(value){
  if(Array.isArray(value))return value.map(stable);
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));
  return value;
}
function stableStringify(value){return JSON.stringify(stable(value));}
function sha256(value){return crypto.createHash('sha256').update(typeof value==='string'?value:stableStringify(value)).digest('hex');}
function safeSegment(value,max=80){
  const out=String(value||'').normalize('NFKC').replace(/[^A-Za-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,max);
  if(!out)throw dispatchError('INVALID_SEGMENT','Identificador inválido.');
  return out;
}
function parseJsonLoose(text){
  const raw=String(text||'').trim();if(!raw)throw dispatchError('EMPTY_JSON','JSON vacío.');
  const first=raw.indexOf('{'),last=raw.lastIndexOf('}');if(first<0||last<first)throw dispatchError('INVALID_JSON','No se encontró JSON.');
  try{return JSON.parse(raw.slice(first,last+1));}catch{throw dispatchError('INVALID_JSON','JSON inválido.');}
}
function extractMarkedJson(text,marker){
  const raw=String(text||''),re=new RegExp('<!--\\s*'+marker+'\\s*([\\s\\S]*?)-->','m'),m=re.exec(raw);
  if(m)return parseJsonLoose(m[1]);return parseJsonLoose(raw);
}
function renderMarked(marker,value){return '<!-- '+marker+'\n'+JSON.stringify(value,null,2)+'\n-->';}

function normalizeStringArray(values,name){
  if(values==null)return [];
  if(!Array.isArray(values))throw dispatchError('INVALID_'+name.toUpperCase(),name+' debe ser array.');
  return [...new Set(values.map(x=>String(x||'').trim()).filter(Boolean))];
}
function normalizeWorkItem(raw,index=0){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw dispatchError('INVALID_WORK_ITEM','Work item inválido.');
  const workId=String(raw.workId||'').trim();
  if(!/^[A-Za-z0-9._:-]{4,120}$/.test(workId))throw dispatchError('INVALID_WORK_ID','workId inválido en posición '+(index+1)+'.');
  const workType=String(raw.workType||'').trim().toLowerCase();
  if(!['editorial_batch','code_task','validation','integration','deployment','recovery'].includes(workType))throw dispatchError('INVALID_WORK_TYPE','workType inválido para '+workId+'.');
  const status=String(raw.status||'ready').trim().toLowerCase();
  if(!['draft','blocked','ready','active','recovery_required','done','cancelled'].includes(status))throw dispatchError('INVALID_WORK_STATUS','status inválido para '+workId+'.');
  const priority=Number(raw.priority??30);
  if(!Number.isInteger(priority)||priority<0||priority>9999)throw dispatchError('INVALID_PRIORITY','priority inválida para '+workId+'.');
  const resourceLocks=normalizeStringArray(raw.resourceLocks,'resourceLocks');
  if(!resourceLocks.length)throw dispatchError('MISSING_LOCKS','resourceLocks vacío para '+workId+'.');
  const allowedPaths=normalizeStringArray(raw.allowedPaths,'allowedPaths');
  const dependsOn=normalizeStringArray(raw.dependsOn,'dependsOn');
  const validation=normalizeStringArray(raw.validation,'validation');
  return {
    ...raw,
    workId,workType,status,priority,resourceLocks,allowedPaths,dependsOn,validation,
    version:Number(raw.version||1),
    title:String(raw.title||workId).trim(),
    createdAt:String(raw.createdAt||'1970-01-01T00:00:00.000Z'),
    provider:String(raw.provider||'global').trim().toLowerCase(),
    instructions:String(raw.instructions||'').trim(),
    branchPolicy:raw.branchPolicy&&typeof raw.branchPolicy==='object'?raw.branchPolicy:{mode:'assignment',prefix:'worker/'+safeSegment(workId)},
    completion:raw.completion&&typeof raw.completion==='object'?raw.completion:{requiresCommit:true,requiresValidation:true}
  };
}
function normalizeRegistry(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw dispatchError('INVALID_REGISTRY','Work Registry inválido.');
  const items=(Array.isArray(raw.items)?raw.items:[]).map(normalizeWorkItem);
  if(new Set(items.map(x=>x.workId)).size!==items.length)throw dispatchError('DUPLICATE_WORK_ID','Work Registry contiene workId duplicado.');
  const ids=new Set(items.map(x=>x.workId));
  for(const item of items)for(const dep of item.dependsOn)if(!ids.has(dep))throw dispatchError('UNKNOWN_DEPENDENCY',item.workId+' depende de workId inexistente '+dep+'.');
  return {...raw,schemaVersion:String(raw.schemaVersion||'1.0'),dispatcherVersion:String(raw.dispatcherVersion||DISPATCH_VERSION),items};
}
function loadRegistry(root='.',registryPath=DEFAULT_REGISTRY_PATH){
  const full=path.join(root,registryPath);if(!fs.existsSync(full))throw dispatchError('REGISTRY_NOT_FOUND','No existe Work Registry: '+registryPath,500);
  return normalizeRegistry(JSON.parse(fs.readFileSync(full,'utf8')));
}
function registryDigest(registry){return sha256({schemaVersion:registry.schemaVersion,items:registry.items.map(x=>({workId:x.workId,version:x.version,status:x.status,priority:x.priority,dependsOn:x.dependsOn,resourceLocks:x.resourceLocks,allowedPaths:x.allowedPaths}))});}

function renderCommandBody(command){return ['## MLS Global Dispatcher command','',renderMarked(COMMAND_MARKER,command)].join('\n');}
function parseCommand(body){
  const x=extractMarkedJson(body,COMMAND_MARKER),operation=String(x.operation||'').trim().toLowerCase();
  if(!['claim','status_global','reap'].includes(operation))throw dispatchError('UNSUPPORTED_OPERATION','Operación Global Dispatcher no soportada.');
  if(operation==='claim'){
    const requestId=String(x.requestId||'').trim(),workerId=String(x.workerId||'').trim();
    if(!/^[A-Za-z0-9._:-]{8,120}$/.test(requestId))throw dispatchError('INVALID_REQUEST_ID','requestId inválido.');
    if(!/^[A-Za-z0-9._:-]{8,160}$/.test(workerId))throw dispatchError('INVALID_WORKER_ID','workerId inválido.');
    return {operation,requestId,workerId,capabilities:normalizeStringArray(x.capabilities||['chat','github'],'capabilities')};
  }
  return {operation};
}
function parseWorkerEvent(body){
  const x=extractMarkedJson(body,EVENT_MARKER),operation=String(x.operation||'').trim().toLowerCase();
  if(!['heartbeat','checkpoint','finish','cancel'].includes(operation))throw dispatchError('INVALID_WORKER_EVENT','Evento Global Dispatcher inválido.');
  return {...x,operation};
}
function parseAssignmentState(body){try{const x=extractMarkedJson(body,ASSIGNMENT_MARKER);return x?.kind==='mls_global_assignment'?x:null;}catch{return null;}}
function parseLedger(body){try{const x=extractMarkedJson(body,LEDGER_MARKER);return x?.kind==='mls_global_dispatch_ledger'?x:null;}catch{return null;}}

function initialLedger(registry){
  return {kind:'mls_global_dispatch_ledger',version:DISPATCH_VERSION,registryDigest:registryDigest(registry),terminal:{},recoveries:{},requests:{},epochs:{},updatedAt:iso()};
}
function normalizeLedger(raw,registry){
  const base=initialLedger(registry),x=raw&&typeof raw==='object'?raw:{};
  return {...base,...x,terminal:{...(x.terminal||{})},recoveries:{...(x.recoveries||{})},requests:{...(x.requests||{})},epochs:{...(x.epochs||{})},registryDigest:registryDigest(registry)};
}
function renderLedgerBody(ledger){
  const terminalCount=Object.keys(ledger.terminal||{}).length,recoveryCount=Object.keys(ledger.recoveries||{}).length;
  return ['## MLS Global Dispatcher ledger','','**Terminales:** '+terminalCount+'  ','**Recoveries pendientes:** '+recoveryCount+'  ','**Actualizado:** '+ledger.updatedAt+'  ','','No edites manualmente el bloque de control.','',renderMarked(LEDGER_MARKER,ledger)].join('\n');
}

function isClaimStale(createdAt,at=Date.now()){const created=parseDate(createdAt);return created===null||Number(at)-created>CLAIM_TTL_MS;}
function isLeaseExpired(state,at=Date.now()){
  if(!state||state.status!=='leased')return true;
  const expiry=!state.acknowledgedAt&&state.ackDeadlineAt?parseDate(state.ackDeadlineAt):parseDate(state.expiresAt);
  return expiry===null||Number(at)>expiry;
}
function normalizeLock(lock){return String(lock||'').trim().replace(/\/+$/,'');}
function locksConflict(a,b){
  const x=normalizeLock(a),y=normalizeLock(b);if(!x||!y)return false;if(x===y)return true;
  if(x.startsWith('path:')&&y.startsWith('path:')){
    const px=x.slice(5),py=y.slice(5);
    return px===py||px.startsWith(py+'/')||py.startsWith(px+'/');
  }
  return false;
}
function lockSetsConflict(a,b){for(const x of a||[])for(const y of b||[])if(locksConflict(x,y))return true;return false;}
function activeAssignments(states,at=Date.now()){return (states||[]).filter(x=>x?.status==='leased'&&!isLeaseExpired(x,at)&&!x.cancelRequested&&!x.readyToClose);}
function activeLocks(states,at=Date.now()){return activeAssignments(states,at).flatMap(x=>x.resourceLocks||[]);}
function terminalStatus(ledger,workId){return ledger?.terminal?.[workId]?.status||null;}
function dependenciesSatisfied(item,ledger){
  return item.dependsOn.every(id=>['done','certified'].includes(String(terminalStatus(ledger,id)||'').toLowerCase()));
}
function workIsActive(workId,states,at=Date.now()){return activeAssignments(states,at).some(x=>x.workId===workId);}
function selectNextWork(registry,ledger,states,at=Date.now()){
  const locks=activeLocks(states,at);
  const candidates=[];
  for(const item of registry.items){
    if(terminalStatus(ledger,item.workId))continue;
    if(workIsActive(item.workId,states,at))continue;
    const recovery=ledger.recoveries?.[item.workId]||null;
    if(!recovery&&item.status!=='ready')continue;
    if(!dependenciesSatisfied(item,ledger))continue;
    if(lockSetsConflict(item.resourceLocks,locks))continue;
    candidates.push({item,recovery,recoveryRank:recovery?0:1});
  }
  candidates.sort((a,b)=>a.recoveryRank-b.recoveryRank||a.item.priority-b.item.priority||String(a.item.createdAt).localeCompare(String(b.item.createdAt))||a.item.workId.localeCompare(b.item.workId));
  return candidates[0]||null;
}
function assignmentBranch(item,issueNumber){
  const prefix=String(item.branchPolicy?.prefix||('worker/'+safeSegment(item.workId))).replace(/^\/+|\/+$/g,'');
  return prefix+'/'+String(Number(issueNumber)).padStart(6,'0');
}
function makeAssignmentState({issueNumber,item,requestId,workerId,workerLogin=null,baseCommit,branch,recovery=null,now=iso(),token=randomToken()}){
  const claimedAt=iso(now),ackDeadlineAt=plusMs(claimedAt,ACK_TTL_MS),epoch=Number(issueNumber);
  return {
    kind:'mls_global_assignment',version:DISPATCH_VERSION,assignmentId:'MLS-GLOBAL-'+String(issueNumber).padStart(6,'0'),
    issueNumber:Number(issueNumber),requestId,workerId,workerLogin:workerLogin?String(workerLogin):null,
    workId:item.workId,workVersion:item.version,workType:item.workType,title:item.title,provider:item.provider,
    instructions:item.instructions,dependencies:item.dependsOn,resourceLocks:item.resourceLocks,allowedPaths:item.allowedPaths,
    validationRequired:item.validation,completion:item.completion,branch,baseCommit:String(baseCommit||''),leaseToken:token,leaseEpoch:epoch,
    status:'leased',claimedAt,acknowledgedAt:null,ackDeadlineAt,lastHeartbeatAt:null,expiresAt:ackDeadlineAt,
    checkpoints:[],lastCheckpointCommit:recovery?.lastCheckpointCommit||null,lastCheckpointHash:null,
    recovery:recovery||null,readyToClose:false,cancelRequested:false,finalCommitSha:null,lastRejectedEvent:null,closedAt:null
  };
}
function renderAssignmentBody(state){
  const recovery=state.recovery?'\n**Recovery:** `'+String(state.recovery.kind||'recovery')+'`  ':'';
  return ['## MLS Global Dispatcher assignment','','**Assignment:** `'+state.assignmentId+'`  ','**Work:** `'+state.workId+'` — '+state.title+'  ','**Tipo:** `'+state.workType+'`  ','**Branch:** `'+state.branch+'`  ','**Estado:** `'+state.status+'`  ','**ACK deadline:** '+state.ackDeadlineAt+'  ','**Lease expira:** '+state.expiresAt+'  ',recovery,'','### Instrucciones','',state.instructions||'Ejecuta el work item dentro del scope asignado.','','### Perímetro de escritura','',...(state.allowedPaths||[]).map(x=>'- `'+x+'`'),'','### Locks','',...(state.resourceLocks||[]).map(x=>'- `'+x+'`'),'','Regla: commit → validate → checkpoint. No escribas directamente a `main`.','','No edites manualmente el bloque de control.','',renderMarked(ASSIGNMENT_MARKER,state)].join('\n');
}
function validateLeaseEvent(state,event,createdAt){
  if(!state||state.kind!=='mls_global_assignment')throw dispatchError('ASSIGNMENT_NOT_FOUND','Assignment inválido.',409);
  if(state.status!=='leased'||state.readyToClose||state.cancelRequested)throw dispatchError('LEASE_NOT_ACTIVE','El assignment ya no tiene lease activo.',409);
  if(String(event.assignmentId||'')!==state.assignmentId||String(event.leaseToken||'')!==state.leaseToken)throw dispatchError('LEASE_TOKEN_MISMATCH','assignmentId/leaseToken no coincide.',409);
  if(Number(event.leaseEpoch??state.leaseEpoch)!==Number(state.leaseEpoch))throw dispatchError('LEASE_EPOCH_MISMATCH','leaseEpoch obsoleto.',409);
  const when=parseDate(createdAt);if(when===null)throw dispatchError('INVALID_EVENT_TIME','Timestamp inválido.',409);
  if(isLeaseExpired(state,when))throw dispatchError('LEASE_EXPIRED','El evento llegó después del vencimiento.',409);
  return when;
}
function checkpointPayload(event){
  const commitSha=String(event.commitSha||'').toLowerCase();
  if(!/^[a-f0-9]{40}$/.test(commitSha))throw dispatchError('CHECKPOINT_COMMIT_MISSING','checkpoint requiere commitSha de 40 hex.');
  const validation=event.validation&&typeof event.validation==='object'?event.validation:{status:'not_run'};
  const status=String(validation.status||'not_run').toLowerCase();
  if(!['passed','failed','not_run'].includes(status))throw dispatchError('INVALID_VALIDATION_STATUS','validation.status inválido.');
  const completedUnits=normalizeStringArray(event.completedUnits||[],'completedUnits'),pendingUnits=normalizeStringArray(event.pendingUnits||[],'pendingUnits');
  return {commitSha,validation:{...validation,status},completedUnits,pendingUnits,notes:String(event.notes||'').trim()};
}
function checkpointDigest(cp){return sha256(cp);}
function applyWorkerEvent(state,event,{createdAt,commentId}){
  const next=structuredClone(state),when=validateLeaseEvent(next,event,createdAt),at=iso(when);
  if(!next.acknowledgedAt)next.acknowledgedAt=at;
  if(event.operation==='cancel'){next.cancelRequested=true;next.lastHeartbeatAt=at;next.expiresAt=at;return next;}
  if(event.operation==='heartbeat'){next.lastHeartbeatAt=at;next.expiresAt=plusMs(at,LEASE_TTL_MS);return next;}
  if(event.operation==='checkpoint'){
    const cp=checkpointPayload(event),hash=checkpointDigest(cp);
    const existing=(next.checkpoints||[]).find(x=>x.commitSha===cp.commitSha);
    if(existing){
      if(existing.hash!==hash)throw dispatchError('CHECKPOINT_CONFLICT','Ya existe un checkpoint distinto para ese commit.',409);
      next.lastHeartbeatAt=at;next.expiresAt=plusMs(at,LEASE_TTL_MS);return next;
    }
    next.checkpoints=[...(next.checkpoints||[]),{...cp,hash,commentId:Number(commentId),acceptedAt:at}].slice(-50);
    next.lastCheckpointCommit=cp.commitSha;next.lastCheckpointHash=hash;next.lastHeartbeatAt=at;next.expiresAt=plusMs(at,LEASE_TTL_MS);return next;
  }
  const commitSha=String(event.commitSha||next.lastCheckpointCommit||'').toLowerCase();
  if(next.completion?.requiresCommit!==false){
    if(!/^[a-f0-9]{40}$/.test(commitSha)||commitSha!==String(next.lastCheckpointCommit||'').toLowerCase())throw dispatchError('FINISH_CHECKPOINT_REQUIRED','finish requiere el último commit checkpointed.',409);
  }
  if(next.completion?.requiresValidation!==false){
    const last=(next.checkpoints||[]).at(-1);if(!last||last.validation?.status!=='passed')throw dispatchError('FINISH_VALIDATION_REQUIRED','finish requiere validación pasada en el último checkpoint.',409);
  }
  next.finalCommitSha=commitSha||null;next.lastHeartbeatAt=at;next.expiresAt=plusMs(at,LEASE_TTL_MS);next.readyToClose=true;return next;
}
function releaseReasonForAssignment(state,expired=isLeaseExpired(state)){
  if(state?.cancelRequested)return 'WORKER_CANCELLED';
  if(expired)return !state?.acknowledgedAt&&state?.ackDeadlineAt?'ACK_TIMEOUT':'LEASE_TIMEOUT';
  return null;
}
function pathAllowed(file,allowedPaths){
  const f=String(file||'').replace(/^\/+/,'');
  return (allowedPaths||[]).some(raw=>{
    const p=String(raw||'').replace(/^\/+/,'');
    if(!p)return false;
    if(p.endsWith('/'))return f.startsWith(p);
    return f===p||f.startsWith(p+'/');
  });
}
function dispatchProgress(registry,ledger,states,at=Date.now()){
  const active=activeAssignments(states,at);
  const terminal=Object.keys(ledger.terminal||{}).length,recoveries=Object.keys(ledger.recoveries||{}).length;
  const ready=registry.items.filter(x=>!terminalStatus(ledger,x.workId)&&!workIsActive(x.workId,states,at)&&dependenciesSatisfied(x,ledger)&&(x.status==='ready'||ledger.recoveries?.[x.workId])).length;
  return {version:DISPATCH_VERSION,totalWorkItems:registry.items.length,terminal,activeAssignments:active.length,recoveries,ready,cloudflareEditorialInteractions:0,d1EditorialReads:0,d1EditorialWrites:0};
}

module.exports={
  DISPATCH_VERSION,CLAIM_TTL_MS,ACK_TTL_MS,LEASE_TTL_MS,REAPER_CADENCE_MINUTES,COMMAND_MARKER,EVENT_MARKER,ASSIGNMENT_MARKER,LEDGER_MARKER,DEFAULT_REGISTRY_PATH,
  dispatchError,iso,parseDate,plusMs,sha256,safeSegment,renderMarked,renderCommandBody,parseCommand,parseWorkerEvent,parseAssignmentState,parseLedger,
  normalizeWorkItem,normalizeRegistry,loadRegistry,registryDigest,initialLedger,normalizeLedger,renderLedgerBody,isClaimStale,isLeaseExpired,
  normalizeLock,locksConflict,lockSetsConflict,activeAssignments,activeLocks,terminalStatus,dependenciesSatisfied,workIsActive,selectNextWork,assignmentBranch,
  makeAssignmentState,renderAssignmentBody,validateLeaseEvent,checkpointPayload,checkpointDigest,applyWorkerEvent,releaseReasonForAssignment,pathAllowed,dispatchProgress
};
