'use strict';

const PROVIDER_ID='r33-farm';
const PROVIDER_VERSION='1.0';
const DEFAULT_REQUESTED=25;
const MAX_REQUESTED=50;
const CHECKPOINT_SIZE_MAX=10;

function providerError(code,message,status=409){
  const error=new Error(message||code);error.code=code;error.status=status;return error;
}
function assertObject(value,code,message){
  if(!value||typeof value!=='object'||Array.isArray(value))throw providerError(code,message);
  return value;
}
function assertCode(value){
  const code=String(value||'').trim().toUpperCase();
  if(!/^MLS-V\d{2}-\d{4}$/.test(code))throw providerError('INVALID_CODE','Código MLS inválido: '+String(value||''));
  return code;
}
function assertLanguage(value){
  const language=String(value||'').trim();
  if(!/^[A-Za-z0-9._-]{2,80}$/.test(language))throw providerError('INVALID_LANGUAGE','language inválido para R33 provider.');
  return language;
}
function parseTime(value,field){
  const parsed=Date.parse(String(value||''));
  if(!Number.isFinite(parsed))throw providerError('INVALID_'+field.toUpperCase(),'Timestamp inválido: '+field+'.');
  return parsed;
}
function normalizeRequested(value,pool){
  const configuredDefault=Number(pool?.execution?.defaultClaimSize??DEFAULT_REQUESTED);
  const configuredMax=Number(pool?.execution?.maxClaimSize??MAX_REQUESTED);
  const max=Math.min(MAX_REQUESTED,Number.isInteger(configuredMax)&&configuredMax>0?configuredMax:MAX_REQUESTED);
  const requested=Number(value??(Number.isInteger(configuredDefault)&&configuredDefault>0?configuredDefault:DEFAULT_REQUESTED));
  if(!Number.isInteger(requested)||requested<1||requested>max)throw providerError('INVALID_REQUESTED','requested debe estar entre 1 y '+max+'.');
  return requested;
}
function normalizePool(raw){
  const pool=assertObject(raw,'INVALID_POOL','Pool R33 inválido.');
  const poolId=String(pool.poolId||'').trim();
  const manifestVersion=String(pool.manifestVersion||'').trim();
  if(!/^[A-Za-z0-9._:-]{8,120}$/.test(poolId))throw providerError('INVALID_POOL_ID','poolId R33 inválido.');
  if(!manifestVersion)throw providerError('INVALID_MANIFEST_VERSION','manifestVersion faltante.');
  if(String(pool.status||'').toLowerCase()!=='authorized'||pool.active!==true)throw providerError('POOL_NOT_AUTHORIZED','El pool R33 no está autorizado/activo.',423);
  if(pool.sourceOfTruth!=null&&String(pool.sourceOfTruth).toLowerCase()!=='github')throw providerError('SOURCE_OF_TRUTH_NOT_GITHUB','R33 provider requiere GitHub como source of truth.',423);
  if(pool.cloudflareEditorialAllowed===true||pool.d1EditorialAllowed===true)throw providerError('EDITORIAL_RUNTIME_FORBIDDEN','R33 provider no permite Cloudflare/D1 editorial.',423);
  if(!Array.isArray(pool.entries)||!pool.entries.length)throw providerError('EMPTY_POOL','Pool R33 sin entradas.');
  const entries=pool.entries.map((entry,index)=>{
    assertObject(entry,'INVALID_POOL_ENTRY','Entrada R33 inválida.');
    const code=assertCode(entry.code),language=assertLanguage(entry.language),contentPath=String(entry.contentPath||'').trim();
    if(!contentPath||contentPath.startsWith('/')||contentPath.includes('..'))throw providerError('INVALID_CONTENT_PATH','contentPath inválido para '+code+'.');
    const order=Number(entry.order??index+1);
    if(!Number.isFinite(order))throw providerError('INVALID_ORDER','order inválido para '+code+'.');
    return {...entry,code,language,contentPath,order};
  }).sort((a,b)=>a.order-b.order||a.code.localeCompare(b.code));
  const codes=new Set();
  for(const entry of entries){if(codes.has(entry.code))throw providerError('DUPLICATE_POOL_CODE','Código duplicado en pool: '+entry.code);codes.add(entry.code);}
  return {...pool,poolId,manifestVersion,entries};
}
function normalizeCodeArray(values,name,poolCodes){
  if(values==null)return [];
  if(!Array.isArray(values))throw providerError('INVALID_'+name.toUpperCase(),name+' debe ser array.');
  const out=[];
  for(const raw of values){const code=assertCode(raw);if(!poolCodes.has(code))throw providerError('LEDGER_CODE_NOT_IN_POOL',name+' contiene código fuera del pool: '+code);if(!out.includes(code))out.push(code);}
  return out;
}
function normalizeLedger(raw,pool){
  const ledger=assertObject(raw,'INVALID_LEDGER','Ledger R33 inválido.');
  if(String(ledger.poolId||'')!==pool.poolId)throw providerError('LEDGER_POOL_MISMATCH','Ledger R33 pertenece a otro pool.');
  if(ledger.manifestVersion!=null&&String(ledger.manifestVersion)!==pool.manifestVersion)throw providerError('LEDGER_MANIFEST_MISMATCH','Ledger R33 usa otra versión del manifiesto.');
  const poolCodes=new Set(pool.entries.map(x=>x.code));
  const verified=normalizeCodeArray(ledger.verified,'verified',poolCodes),exceptions=normalizeCodeArray(ledger.exceptions,'exceptions',poolCodes);
  const verifiedSet=new Set(verified);
  for(const code of exceptions)if(verifiedSet.has(code))throw providerError('LEDGER_TERMINAL_CONFLICT','Código simultáneamente verified y exception: '+code);
  return {...ledger,verified,exceptions};
}
function batchActive(batch,nowMs){
  if(!batch||batch.status!=='leased')return false;
  const expiryValue=!batch.acknowledgedAt&&batch.ackDeadlineAt?batch.ackDeadlineAt:batch.expiresAt;
  if(!expiryValue)return false;
  let expiry;try{expiry=parseTime(expiryValue,'lease_expiry');}catch{return false;}
  return nowMs<=expiry;
}
function collectProtectedCodes(rawBatches,pool,terminal,nowMs){
  if(rawBatches==null)return {codes:new Set(),batchIds:[]};
  if(!Array.isArray(rawBatches))throw providerError('INVALID_BATCHES','batches debe ser array.');
  const poolCodes=new Set(pool.entries.map(x=>x.code)),codes=new Set(),batchIds=[];
  for(const batch of rawBatches){
    if(!batchActive(batch,nowMs))continue;
    if(String(batch.poolId||'')!==pool.poolId)throw providerError('ACTIVE_BATCH_POOL_MISMATCH','Batch activo pertenece a otro pool.');
    if(!Array.isArray(batch.entries))throw providerError('INVALID_ACTIVE_BATCH','Batch activo sin entries.');
    const batchId=String(batch.batchId||'').trim();if(!batchId)throw providerError('INVALID_ACTIVE_BATCH','Batch activo sin batchId.');
    batchIds.push(batchId);
    for(const entry of batch.entries){
      const code=assertCode(entry?.code);
      if(!poolCodes.has(code))throw providerError('ACTIVE_BATCH_CODE_NOT_IN_POOL','Batch activo protege código fuera del pool: '+code);
      if(terminal.has(code))throw providerError('TERMINAL_CODE_STILL_LEASED','Snapshot inconsistente: código terminal todavía leaseado: '+code);
      if(codes.has(code))throw providerError('DOUBLE_OWNERSHIP_DETECTED','Código protegido por más de un batch activo: '+code);
      codes.add(code);
    }
  }
  return {codes,batchIds};
}
function evidenceArtifactPath(entry){return 'MLS R32 EDITORIAL/evidence git/entries/'+entry.language+'/'+entry.code+'.json';}
function materializeCandidate(snapshot,options={}){
  const input=assertObject(snapshot,'INVALID_SNAPSHOT','Snapshot R33 inválido.');
  const pool=normalizePool(input.pool),ledger=normalizeLedger(input.ledger,pool);
  const nowMs=options.now==null?Date.now():Number(options.now);
  if(!Number.isFinite(nowMs))throw providerError('INVALID_NOW','now inválido.');
  const requested=normalizeRequested(options.requested??input.requested,pool);
  const terminal=new Set([...ledger.verified,...ledger.exceptions]);
  const protectedState=collectProtectedCodes(input.batches??input.activeBatches??[],pool,terminal,nowMs);
  const units=pool.entries.filter(entry=>!terminal.has(entry.code)&&!protectedState.codes.has(entry.code)).slice(0,requested).map(entry=>({
    code:entry.code,language:entry.language,contentPath:entry.contentPath,order:entry.order,evidenceArtifactPath:evidenceArtifactPath(entry)
  }));
  const remaining=pool.entries.length-terminal.size-protectedState.codes.size;
  return {
    provider:PROVIDER_ID,
    providerVersion:PROVIDER_VERSION,
    eligible:units.length>0,
    reason:units.length?'READY':'NO_WORK',
    poolId:pool.poolId,
    manifestVersion:pool.manifestVersion,
    requested,
    units,
    resourceLocks:units.flatMap(unit=>['entry:'+unit.code,'path:'+unit.evidenceArtifactPath]),
    allowedPaths:units.map(unit=>unit.evidenceArtifactPath),
    checkpointSizeMax:CHECKPOINT_SIZE_MAX,
    ownership:{mode:'global-single-owner',nestedLease:false,reservationCreated:false},
    snapshot:{terminal:terminal.size,protected:protectedState.codes.size,pending:Math.max(0,remaining),activeBatchIds:protectedState.batchIds.slice().sort()},
    gate500Authorized:Boolean(pool.gate500Authorized),
    cloudflareEditorialInteractions:0,
    d1EditorialReads:0,
    d1EditorialWrites:0
  };
}

module.exports={
  PROVIDER_ID,PROVIDER_VERSION,DEFAULT_REQUESTED,MAX_REQUESTED,CHECKPOINT_SIZE_MAX,
  providerError,assertCode,batchActive,evidenceArtifactPath,materializeCandidate
};
