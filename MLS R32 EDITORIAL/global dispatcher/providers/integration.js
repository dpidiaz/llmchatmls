'use strict';

const globalCore=require('../core.js');
const mlsCore=require('../../farm core.js');
const r33Core=require('../../evidence farm core.js');
const mlsProvider=require('./mls farm.js');
const r33Provider=require('./r33.js');

const DYNAMIC_PROVIDERS=new Set(['mls-farm','r33-farm']);

function integrationError(code,message,status=409){
  const error=new Error(message||code);error.code=code;error.status=status;return error;
}
function codesFromLocks(locks){
  const out=[];
  for(const raw of Array.isArray(locks)?locks:[]){
    const match=/^entry:(MLS-V\d{2}-\d{4})$/i.exec(String(raw||'').trim());
    if(match&&!out.includes(match[1].toUpperCase()))out.push(match[1].toUpperCase());
  }
  return out;
}
function codesFromTerminal(ledger,provider){
  const out=[];
  for(const [workId,entry] of Object.entries(ledger?.terminal||{})){
    const providerMatch=String(entry?.provider||'')===provider||String(workId).startsWith(provider+':');
    if(!providerMatch)continue;
    for(const code of Array.isArray(entry?.completedUnits)?entry.completedUnits:[]){
      const value=String(code||'').toUpperCase();
      if(/^MLS-V\d{2}-\d{4}$/.test(value)&&!out.includes(value))out.push(value);
    }
  }
  return out;
}
function activeProviderAssignments(states,provider){
  return (Array.isArray(states)?states:[]).filter(state=>state&&state.status==='leased'&&!state.readyToClose&&!state.cancelRequested&&String(state.provider||'')===provider);
}
function collectMlsSnapshot(issues,root='.'){
  const ledgers=[],batches=[];
  for(const issue of Array.isArray(issues)?issues:[]){
    const body=String(issue?.body||'');
    const ledger=mlsCore.parseLedger(body);if(ledger)ledgers.push(ledger);
    const batch=mlsCore.parseFarmState(body);if(batch)batches.push(batch);
  }
  if(!ledgers.length)throw integrationError('MLS_FARM_LEDGER_MISSING','No se encontró estado ledger de MLS Farm.',503);
  return {corpus:mlsCore.corpusEntries(root),ledgers,batches};
}
function collectR33Snapshot(issues,root='.'){
  const pool=r33Core.loadPool(root),ledgers=[],batches=[];
  for(const issue of Array.isArray(issues)?issues:[]){
    const body=String(issue?.body||'');
    const ledger=r33Core.parseLedger(body);if(ledger&&String(ledger.poolId||'')===pool.poolId)ledgers.push(ledger);
    const batch=r33Core.parseFarmState(body);if(batch&&String(batch.poolId||'')===pool.poolId)batches.push(batch);
  }
  if(ledgers.length!==1)throw integrationError('R33_LEDGER_CARDINALITY','R33 provider requiere exactamente un ledger activo para '+pool.poolId+'.',503);
  return {pool,ledger:ledgers[0],batches};
}
function projectMlsSnapshot(snapshot,{globalLedger,globalAssignments}={}){
  const corpusCodes=new Set((snapshot.corpus||[]).map(x=>String(x.code)));
  let ledgers=(snapshot.ledgers||[]).map(x=>structuredClone(x));
  for(const code of codesFromTerminal(globalLedger,'mls-farm')){
    if(!corpusCodes.has(code))continue;
    const parts=mlsCore.codeParts(code),index=ledgers.findIndex(x=>String(x.prefix||'')===parts.prefix);
    if(index<0)throw integrationError('MLS_FARM_LEDGER_PREFIX_MISSING','Falta ledger MLS Farm para '+parts.prefix+'.',503);
    const existing=mlsCore.terminalCodesFromLedgers([ledgers[index]]);
    if(!existing.has(code))ledgers[index]=mlsCore.addTerminalToLedger(ledgers[index],code,'submitted');
  }
  const batches=(snapshot.batches||[]).map(x=>structuredClone(x));
  for(const state of activeProviderAssignments(globalAssignments,'mls-farm')){
    const entries=codesFromLocks(state.resourceLocks).filter(code=>corpusCodes.has(code)).map(code=>({code}));
    if(!entries.length)continue;
    batches.push({kind:'batch',batchId:'GLOBAL-'+state.assignmentId,status:'leased',acknowledgedAt:state.acknowledgedAt||null,ackDeadlineAt:state.ackDeadlineAt,expiresAt:state.expiresAt,entries});
  }
  return {...snapshot,ledgers,batches};
}
function projectR33Snapshot(snapshot,{globalLedger,globalAssignments}={}){
  const poolCodes=new Set((snapshot.pool?.entries||[]).map(x=>String(x.code)));
  const ledger=structuredClone(snapshot.ledger),terminal=new Set([...(ledger.verified||[]),...(ledger.exceptions||[])]);
  ledger.verified=Array.isArray(ledger.verified)?ledger.verified.slice():[];
  for(const code of codesFromTerminal(globalLedger,'r33-farm')){
    if(poolCodes.has(code)&&!terminal.has(code)){ledger.verified.push(code);terminal.add(code);}
  }
  const batches=(snapshot.batches||[]).map(x=>structuredClone(x));
  for(const state of activeProviderAssignments(globalAssignments,'r33-farm')){
    const entries=codesFromLocks(state.resourceLocks).filter(code=>poolCodes.has(code)).map(code=>({code}));
    if(!entries.length)continue;
    batches.push({poolId:snapshot.pool.poolId,batchId:'GLOBAL-'+state.assignmentId,status:'leased',acknowledgedAt:state.acknowledgedAt||null,ackDeadlineAt:state.ackDeadlineAt,expiresAt:state.expiresAt,entries});
  }
  return {...snapshot,ledger,batches};
}
function r33CandidateToWork(candidate,now=Date.now()){
  if(!candidate?.eligible)return null;
  const codes=candidate.units.map(x=>x.code),first=codes[0],last=codes.at(-1);
  return {
    workId:'r33-farm:'+candidate.poolId+':'+first+':'+last+':'+codes.length,
    version:1,
    title:'R33 Evidence Farm '+first+'..'+last,
    workType:'editorial_batch',status:'ready',priority:25,createdAt:new Date(now).toISOString(),provider:'r33-farm',
    providerVersion:candidate.providerVersion,ownershipMode:'global-single-lease',units:codes,checkpointSizeMax:candidate.checkpointSizeMax,
    resourceLocks:candidate.resourceLocks,allowedPaths:candidate.allowedPaths,dependsOn:[],
    validation:['R33 GitHub Native Tests','R33 Evidence Farm Tests'],
    instructions:'Procesa exclusivamente estas entradas R33. El Global Dispatcher es el único owner efectivo; no crees un lease R33 Evidence Farm anidado.',
    branchPolicy:{mode:'assignment',prefix:'worker/r33-farm'},completion:{requiresCommit:true,requiresValidation:true},
    providerSnapshot:candidate.snapshot,gate500Authorized:candidate.gate500Authorized
  };
}
function recoveryItems(globalLedger){
  const items=[];
  for(const recovery of Object.values(globalLedger?.recoveries||{})){
    const item=recovery?.workItem;
    if(!item||!DYNAMIC_PROVIDERS.has(String(item.provider||'')))continue;
    items.push(globalCore.normalizeWorkItem({...item,status:'recovery_required'}));
  }
  return items;
}
function materializeProviderItems({issues=[],root='.',now=Date.now(),globalLedger=null,globalAssignments=[]}={}){
  const items=[],diagnostics=[];
  try{
    const snapshot=projectMlsSnapshot(collectMlsSnapshot(issues,root),{globalLedger,globalAssignments});
    const item=mlsProvider.materializeFarmWork({...snapshot,at:now});
    if(item)items.push(globalCore.normalizeWorkItem(item));
  }catch(error){diagnostics.push({provider:'mls-farm',status:'blocked',error:error.code||'MLS_FARM_PROVIDER_ERROR',message:error.message});}
  try{
    const snapshot=projectR33Snapshot(collectR33Snapshot(issues,root),{globalLedger,globalAssignments});
    const candidate=r33Provider.materializeCandidate(snapshot,{now});
    const item=r33CandidateToWork(candidate,now);
    if(item)items.push(globalCore.normalizeWorkItem(item));
  }catch(error){diagnostics.push({provider:'r33-farm',status:'blocked',error:error.code||'R33_PROVIDER_ERROR',message:error.message});}
  return {items,diagnostics};
}
function extendRegistry(baseRegistry,{items=[],globalLedger=null}={}){
  const base=globalCore.normalizeRegistry(baseRegistry),combined=[],seen=new Set(base.items.map(x=>x.workId));
  combined.push(...base.items);
  for(const item of recoveryItems(globalLedger)){
    if(seen.has(item.workId))continue;seen.add(item.workId);combined.push(item);
  }
  for(const raw of items){
    const item=globalCore.normalizeWorkItem(raw);
    if(seen.has(item.workId))continue;seen.add(item.workId);combined.push(item);
  }
  return globalCore.normalizeRegistry({...base,items:combined});
}

module.exports={
  DYNAMIC_PROVIDERS,integrationError,codesFromLocks,codesFromTerminal,activeProviderAssignments,
  collectMlsSnapshot,collectR33Snapshot,projectMlsSnapshot,projectR33Snapshot,r33CandidateToWork,
  recoveryItems,materializeProviderItems,extendRegistry
};
