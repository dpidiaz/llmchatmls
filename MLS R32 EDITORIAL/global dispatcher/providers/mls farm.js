'use strict';

const farm=require('../../farm core.js');

const PROVIDER_ID='mls-farm';
const PROVIDER_VERSION='1.0';
const CHECKPOINT_SIZE_MAX=10;
const PREFETCH_MAX=100;

function providerError(code,message,status=409){
  const error=new Error(message||code);
  error.code=code;
  error.status=status;
  return error;
}

function asArray(value,name){
  if(!Array.isArray(value))throw providerError('INVALID_'+name.toUpperCase(),name+' debe ser array.');
  return value;
}

function normalizeAt(value){
  const n=value instanceof Date?value.getTime():typeof value==='number'?value:Date.parse(String(value||''));
  if(!Number.isFinite(n))throw providerError('INVALID_SNAPSHOT_TIME','at debe ser una fecha válida.');
  return n;
}

function normalizeRequested(value){
  const requested=value==null?farm.FARM_DEFAULT_BATCH:Number(value);
  if(!Number.isInteger(requested)||requested<1||requested>farm.FARM_MAX_BATCH){
    throw providerError('INVALID_BATCH_SIZE','requested debe estar entre 1 y '+farm.FARM_MAX_BATCH+'.');
  }
  return requested;
}

function normalizeCorpus(corpus){
  const seen=new Set();
  return asArray(corpus,'corpus').map((raw,index)=>{
    if(!raw||typeof raw!=='object'||Array.isArray(raw))throw providerError('INVALID_CORPUS_ENTRY','Entrada de corpus inválida en posición '+(index+1)+'.');
    let code;
    try{code=farm.assertCode(raw.code);}catch(error){throw providerError(error.code||'INVALID_CODE',error.message);}
    if(seen.has(code))throw providerError('DUPLICATE_CORPUS_CODE','Código duplicado en corpus: '+code+'.');
    seen.add(code);
    let parts;
    try{parts=farm.codeParts(code);}catch(error){throw providerError(error.code||'INVALID_CODE',error.message);}
    const entryPath=String(raw.path||'').trim();
    if(!entryPath||entryPath.startsWith('/')||entryPath.includes('..'))throw providerError('INVALID_CORPUS_PATH','Ruta inválida para '+code+'.');
    if(raw.language&&String(raw.language)!==parts.slug)throw providerError('CORPUS_LANGUAGE_MISMATCH','Idioma inconsistente para '+code+'.');
    return {...raw,code,language:parts.slug,languageName:raw.languageName||parts.name,n:parts.n,path:entryPath};
  });
}

function normalizeLedgers(ledgers){
  const seen=new Set();
  return asArray(ledgers,'ledgers').map((raw,index)=>{
    let ledger;
    try{ledger=farm.normalizeLedger(raw);}catch(error){throw providerError(error.code||'INVALID_LEDGER',error.message);}
    if(seen.has(ledger.prefix))throw providerError('DUPLICATE_LEDGER','Ledger duplicado para '+ledger.prefix+' en posición '+(index+1)+'.');
    seen.add(ledger.prefix);
    return ledger;
  });
}

function normalizeBatches(batches,atMs){
  return asArray(batches,'batches').map((raw,index)=>{
    if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.kind!=='batch'){
      throw providerError('INVALID_BATCH_STATE','Batch Farm inválido en posición '+(index+1)+'.');
    }
    if(!Array.isArray(raw.entries))throw providerError('INVALID_BATCH_ENTRIES','entries debe ser array en batch '+(raw.batchId||index+1)+'.');
    const local=new Set();
    const entries=raw.entries.map((entry)=>{
      if(!entry||typeof entry!=='object'||Array.isArray(entry))throw providerError('INVALID_BATCH_ENTRY','Entrada inválida en batch '+(raw.batchId||index+1)+'.');
      let code;
      try{code=farm.assertCode(entry.code);}catch(error){throw providerError(error.code||'INVALID_CODE',error.message);}
      if(local.has(code))throw providerError('DUPLICATE_BATCH_CODE','Código duplicado dentro de batch '+(raw.batchId||index+1)+': '+code+'.');
      local.add(code);
      return {...entry,code};
    });
    const status=String(raw.status||'').trim().toLowerCase();
    if(!status)throw providerError('INVALID_BATCH_STATUS','Batch sin status en posición '+(index+1)+'.');
    if(status==='leased'){
      const expirySource=!raw.acknowledgedAt&&raw.ackDeadlineAt?raw.ackDeadlineAt:raw.expiresAt;
      if(farm.parseDate(expirySource)===null)throw providerError('INVALID_LEASE_EXPIRY','Lease Farm sin expiración válida: '+(raw.batchId||index+1)+'.');
    }
    const active=status==='leased'&&!farm.isLeaseExpired({...raw,entries},atMs);
    return {...raw,status,entries,active};
  });
}

function inspectFarmSnapshot({corpus,ledgers,batches,at}){
  const atMs=normalizeAt(at);
  const cleanCorpus=normalizeCorpus(corpus);
  const cleanLedgers=normalizeLedgers(ledgers);
  const cleanBatches=normalizeBatches(batches,atMs);
  const corpusCodes=new Set(cleanCorpus.map(entry=>entry.code));
  let terminal;
  try{terminal=farm.terminalCodesFromLedgers(cleanLedgers);}catch(error){throw providerError(error.code||'INVALID_LEDGER',error.message);}

  const owners=new Map();
  for(const batch of cleanBatches){
    if(!batch.active)continue;
    for(const entry of batch.entries){
      if(!corpusCodes.has(entry.code))throw providerError('LEASED_CODE_OUTSIDE_CORPUS','Batch activo contiene código fuera del corpus: '+entry.code+'.');
      if(terminal.has(entry.code))throw providerError('TERMINAL_LEASE_CONFLICT','Código terminal mantiene lease activo: '+entry.code+'.');
      const previous=owners.get(entry.code);
      if(previous)throw providerError('DOUBLE_OWNERSHIP','Ownership Farm duplicado para '+entry.code+': '+previous+' y '+(batch.batchId||'batch-'+batch.issueNumber)+'.');
      owners.set(entry.code,batch.batchId||'batch-'+batch.issueNumber);
    }
  }

  return {
    atMs,
    corpus:cleanCorpus,
    ledgers:cleanLedgers,
    batches:cleanBatches,
    terminal,
    activeCodes:new Set(owners.keys())
  };
}

function eligibleFarmEntries({corpus,ledgers,batches,requested=farm.FARM_DEFAULT_BATCH,at}){
  const limit=normalizeRequested(requested);
  const snapshot=inspectFarmSnapshot({corpus,ledgers,batches,at});
  const entries=snapshot.corpus.filter(entry=>!snapshot.terminal.has(entry.code)&&!snapshot.activeCodes.has(entry.code)).slice(0,limit);
  return {entries,snapshot};
}

function materializeFarmWork({corpus,ledgers,batches,requested=farm.FARM_DEFAULT_BATCH,at}){
  const {entries,snapshot}=eligibleFarmEntries({corpus,ledgers,batches,requested,at});
  if(entries.length===0)return null;
  const units=entries.map(entry=>entry.code);
  const first=units[0],last=units[units.length-1];
  return {
    workId:'mls-farm:'+first+':'+last+':'+units.length,
    version:1,
    title:'MLS Farm '+first+'..'+last,
    workType:'editorial_batch',
    status:'ready',
    priority:30,
    createdAt:new Date(snapshot.atMs).toISOString(),
    provider:PROVIDER_ID,
    providerVersion:PROVIDER_VERSION,
    ownershipMode:'global-single-lease',
    units,
    checkpointSizeMax:CHECKPOINT_SIZE_MAX,
    resourceLocks:units.map(code=>'entry:'+code),
    allowedPaths:entries.map(entry=>entry.path),
    dependsOn:[],
    validation:[],
    instructions:'Procesa exclusivamente las entradas asignadas por MLS Farm. El Global Dispatcher es el único owner efectivo; no crees un segundo lease Farm.',
    branchPolicy:{mode:'assignment',prefix:'worker/mls-farm'},
    completion:{requiresCommit:true,requiresValidation:false},
    providerSnapshot:{terminal:snapshot.terminal.size,activeLeases:snapshot.activeCodes.size}
  };
}

function normalizePrefetchCount(value){
  const count=Number(value??50);
  if(!Number.isInteger(count)||count<1||count>PREFETCH_MAX)throw providerError('INVALID_PREFETCH_COUNT','count debe estar entre 1 y '+PREFETCH_MAX+'.');
  return count;
}
function materializeFarmWorks({corpus,ledgers,batches,requested=farm.FARM_DEFAULT_BATCH,count=50,at}){
  const limit=normalizePrefetchCount(count),atMs=normalizeAt(at);
  const workingBatches=Array.isArray(batches)?batches.map(x=>structuredClone(x)):[];
  const out=[];
  for(let index=0;index<limit;index++){
    const work=materializeFarmWork({corpus,ledgers,batches:workingBatches,requested,at:atMs});
    if(!work)break;
    out.push(work);
    const acknowledgedAt=new Date(atMs).toISOString(),expiresAt=new Date(atMs+60*60*1000).toISOString();
    workingBatches.push({kind:'batch',batchId:'GLOBAL-PREFETCH-'+String(index+1).padStart(3,'0'),status:'leased',acknowledgedAt,ackDeadlineAt:expiresAt,expiresAt,entries:work.units.map(code=>({code}))});
  }
  return out;
}

module.exports={
  PROVIDER_ID,PROVIDER_VERSION,CHECKPOINT_SIZE_MAX,PREFETCH_MAX,
  providerError,normalizeAt,normalizeRequested,normalizeCorpus,normalizeLedgers,normalizeBatches,
  inspectFarmSnapshot,eligibleFarmEntries,materializeFarmWork,materializeFarmWorks
};
