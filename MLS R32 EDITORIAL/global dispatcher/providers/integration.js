'use strict';

const fs=require('node:fs');
const path=require('node:path');
const globalCore=require('../core.js');
const mlsCore=require('../../farm core.js');
const r33Core=require('../../evidence farm core.js');
const mlsProvider=require('./mls farm.js');
const r33Provider=require('./r33.js');
const buffered=require('../../r4 buffered allocation.cjs');
const revisions=require('../../r4 staging supersession.cjs');
const preparedDrain=require('../../prepared drain.cjs');

const DYNAMIC_PROVIDERS=new Set(['mls-farm','r33-farm','r33-index-preparation','r33-index-integration']);
const READY_QUEUE_TARGET=128;
const R44_R33_HANDOFF_INDEX=path.join('MLS R32 EDITORIAL','r44','r33-handoff','index.json');
const R44_R33_HANDOFF_SCHEMA='MLS-R44-R33-HANDOFF-1';

function loadR44R33Handoffs(root='.'){
  const full=path.join(root,R44_R33_HANDOFF_INDEX);
  if(!fs.existsSync(full))return new Map();
  const raw=JSON.parse(fs.readFileSync(full,'utf8'));
  if(raw?.schema!==R44_R33_HANDOFF_SCHEMA||!Array.isArray(raw.entries))throw integrationError('R44_R33_HANDOFF_INVALID','Índice R44→R33 inválido.',503);
  const out=new Map();
  for(const item of raw.entries){
    const code=String(item?.code||'').toUpperCase();
    if(!/^MLS-V\d{2}-\d{4}$/.test(code)||out.has(code))throw integrationError('R44_R33_HANDOFF_CODE_INVALID','Código R44→R33 inválido/duplicado: '+code,503);
    if(!['PASS_NO_CHANGE','CORRECTED'].includes(String(item.outcome||'')))throw integrationError('R44_R33_HANDOFF_OUTCOME_INVALID','Outcome R44→R33 inválido: '+code,503);
    const handoffPath=String(item.handoffPath||'').replace(/\\/g,'/');
    if(!handoffPath||handoffPath.startsWith('/')||handoffPath.includes('..'))throw integrationError('R44_R33_HANDOFF_PATH_INVALID','handoffPath inválido: '+code,503);
    out.set(code,{...item,code,handoffPath});
  }
  return out;
}
function r33UnifiedSnapshot(snapshot,handoffs,{root='.',globalLedger=null,globalAssignments=[]}={}){
  if(!(handoffs instanceof Map)||!handoffs.size)return null;
  const integrated=r33IntegratedCodes(root);
  const corpus=mlsCore.corpusEntries(root);
  let entries=corpus
    .map((entry,index)=>{
      const code=String(entry.code||'').toUpperCase(),h=handoffs.get(code);
      if(!h||integrated.has(code))return null;
      return {
        order:Number(h.ordinal||index+1),
        code,
        language:String(entry.language||''),
        contentPath:String(entry.path||entry.contentPath||''),
        r44Handoff:h
      };
    })
    .filter(Boolean)
    .sort((a,b)=>a.order-b.order||a.code.localeCompare(b.code));
  if(!entries.length)return null;
  // Reorder only eligible durable handoffs; all terminal/reservation/lease fences below remain authoritative.
  const drainCodes=preparedDrain.load(root);
  entries=preparedDrain.prioritize(entries,drainCodes);
  const allowed=new Set(entries.map(x=>x.code));
  const execution={...(snapshot.pool?.execution||{}),
    defaultClaimSize:5,maxClaimSize:10,workerBatchSize:5,parallelWorkerLimit:128,maxConcurrentWorkers:128,
    checkpointSizeMax:1,chatOnly:true,cloudflareEditorialInteractions:0,d1EditorialInteractions:0};
  const pool={
    ...(snapshot.pool||{}),
    poolId:'MLS-R33-R44-UNIFIED-CONTINUATION',
    manifestVersion:'1.0',
    status:'authorized',
    active:true,
    dispatcherOnly:true,
    sourceOfTruth:'github',
    editorialArchitecture:'github-native',
    cloudflareEditorialAllowed:false,
    d1EditorialAllowed:false,
    continuationOf:snapshot.pool?.poolId||null,
    execution,
    entries
  };
  const terminalCodes=codesFromTerminal(globalLedger,'r33-farm').filter(code=>allowed.has(code));
  const ledger={...r33Core.initialLedger(pool),verified:terminalCodes,exceptions:[]};
  const batches=[];
  for(const state of activeProviderAssignments(globalAssignments,'r33-farm')){
    const activeEntries=codesFromLocks(state.resourceLocks).filter(code=>allowed.has(code)).map(code=>({code}));
    if(!activeEntries.length)continue;
    batches.push({poolId:pool.poolId,batchId:'GLOBAL-UNIFIED-'+state.assignmentId,status:'leased',
      acknowledgedAt:state.acknowledgedAt||null,ackDeadlineAt:state.ackDeadlineAt,expiresAt:state.expiresAt,entries:activeEntries});
  }
  const recoveryCodes=Object.values(globalLedger?.recoveries||{})
    .filter(r=>r?.workItem?.provider==='r33-farm')
    .flatMap(r=>codesFromLocks(r.resourceLocks||r.workItem.resourceLocks||[]));
  const bufferedCodes=(snapshot.bufferedReservations||[]).flatMap(r=>(r?.allocation?.units||[]).map(u=>String(u?.code||'').toUpperCase()));
  const reservedCodes=[...new Set([...recoveryCodes,...bufferedCodes].filter(code=>allowed.has(code)&&!terminalCodes.includes(code)))];
  return {...snapshot,pool,ledger,batches,reservedCodes,r43Handoff:null,r43Handoffs:[],handoffCodes:[],
    r44UnifiedHandoffs:handoffs,unifiedFullCorpus:true,preparedDrainCodes:drainCodes};
}
function protectCandidateCodes(snapshot,candidates,now){
  const batches=(snapshot.batches||[]).map(x=>structuredClone(x));
  for(const [index,candidate] of candidates.entries()){
    batches.push({poolId:snapshot.pool.poolId,batchId:'GLOBAL-UNIFIED-PROTECT-'+String(index+1).padStart(3,'0'),status:'leased',
      acknowledgedAt:new Date(now).toISOString(),ackDeadlineAt:new Date(Number(now)+60*60*1000).toISOString(),
      expiresAt:new Date(Number(now)+60*60*1000).toISOString(),entries:candidate.units.map(unit=>({code:unit.code}))});
  }
  return {...snapshot,batches};
}

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
function completedUnitsForState(state){
  const out=[];
  for(const raw of Array.isArray(state?.recoveredCompletedUnits)?state.recoveredCompletedUnits:[]){
    const value=String(raw||'').trim();if(value&&!out.includes(value))out.push(value);
  }
  for(const checkpoint of Array.isArray(state?.checkpoints)?state.checkpoints:[]){
    for(const raw of Array.isArray(checkpoint?.completedUnits)?checkpoint.completedUnits:[]){
      const value=String(raw||'').trim();if(value&&!out.includes(value))out.push(value);
    }
  }
  return out;
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
  const configuredPool=r33Core.loadPool(root);
  const integrated=r33IntegratedCodes(root);
  const configuredComplete=(configuredPool.entries||[]).every(x=>integrated.has(String(x.code||'').toUpperCase()));
  const continuation=configuredComplete&&configuredPool?.execution?.continuationAfterActivePool===true
    ? r33ContinuationPool({root,basePool:configuredPool,verifiedCodes:[...integrated]})
    : null;
  const pool=continuation||configuredPool,ledgers=[],batches=[];
  for(const issue of Array.isArray(issues)?issues:[]){
    const body=String(issue?.body||'');
    const ledger=r33Core.parseLedger(body);if(ledger&&String(ledger.poolId||'')===pool.poolId)ledgers.push(ledger);
    const batch=r33Core.parseFarmState(body);if(batch&&String(batch.poolId||'')===pool.poolId)batches.push(batch);
  }
  if(ledgers.length>1)throw integrationError('R33_LEDGER_CARDINALITY','R33 provider requiere como máximo un ledger activo para '+pool.poolId+'.',503);
  const ledger=ledgers.length===1?ledgers[0]:r33Core.initialLedger(pool);
  // Every open reservation Issue is a durable exclusion, independent of chat TTL.
  const bufferedReservations=buffered.reservations(issues);
  return {pool,ledger,batches,bufferedReservations,r44Handoffs:loadR44R33Handoffs(root),ledgerSynthetic:ledgers.length===0,continuationActive:Boolean(continuation),configuredPoolId:configuredPool.poolId};
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
  // Include unresolved R4 orphan/recovery claims: the allocator must not silently regenerate them.
  const recoveryCodes=Object.values(globalLedger?.recoveries||{})
    .filter(r=>r?.workItem?.provider==='r33-farm')
    .flatMap(r=>codesFromLocks(r.resourceLocks||r.workItem.resourceLocks||[]));

  // Multiple reconciled R4.3 waves may hand off concurrently. Group by immutable
  // handoff identity and preserve disjoint ownership instead of collapsing them.
  const handoffGroups=new Map();
  for(const r of snapshot.bufferedReservations||[]){
    if(r?.snapshotFarm?.ownershipOnly!==true||r?.snapshotFarm?.r33Handoff?.status!=='active')continue;
    const h=r.snapshotFarm.r33Handoff;
    const pending=(r?.allocation?.units||[])
      .map(u=>String(u?.code||''))
      .filter(code=>poolCodes.has(code)&&!terminal.has(code));
    if(!pending.length)continue;
    const key=[h.waveIssueNumber,h.waveId,h.waveHash,h.reconciliationHash].join(':');
    if(!handoffGroups.has(key))handoffGroups.set(key,{
      key,
      waveIssueNumber:Number(h.waveIssueNumber),
      waveId:String(h.waveId),
      waveHash:String(h.waveHash),
      reconciliationHash:String(h.reconciliationHash),
      pendingCodes:[]
    });
    handoffGroups.get(key).pendingCodes.push(...pending);
  }
  const seenHandoffCodes=new Map();
  const r43Handoffs=[...handoffGroups.values()]
    .map(h=>({...h,pendingCodes:[...new Set(h.pendingCodes)]}))
    .sort((a,b)=>a.waveIssueNumber-b.waveIssueNumber||a.waveId.localeCompare(b.waveId));
  for(const h of r43Handoffs){
    for(const code of h.pendingCodes){
      const prior=seenHandoffCodes.get(code);
      if(prior&&prior!==h.key)throw integrationError('R43_R33_HANDOFF_OVERLAP',
        'Código '+code+' pertenece a más de una wave R4.3 activa.',503);
      seenHandoffCodes.set(code,h.key);
    }
  }
  const activeHandoffCodes=new Set(seenHandoffCodes.keys());
  const reservedCodes=[...new Set([...(snapshot.bufferedReservations||[])
    .flatMap(r=>r.allocation.units.map(u=>u.code)),...recoveryCodes]
    .filter(code=>poolCodes.has(code)&&!terminal.has(code)&&!activeHandoffCodes.has(code)))];

  // Backward-compatible singular fields remain populated only when exactly one
  // active handoff exists. Multi-wave scheduling uses r43Handoffs explicitly.
  const r43Handoff=r43Handoffs.length===1?structuredClone(r43Handoffs[0]):null;
  const handoffCodes=r43Handoffs.length===1?[...r43Handoffs[0].pendingCodes]:[];
  return {...snapshot,ledger,batches,reservedCodes,handoffCodes,r43Handoff,r43Handoffs};
}
function r33HandoffSnapshots(snapshot){
  const waves=Array.isArray(snapshot?.r43Handoffs)?snapshot.r43Handoffs:[];
  if(!waves.length)return [];
  return waves.map(h=>({
    ...snapshot,
    r43Handoff:structuredClone(h),
    handoffCodes:[...h.pendingCodes]
  }));
}
function r33CandidateToWork(candidate,now=Date.now()){
  if(!candidate?.eligible)return null;
  const codes=candidate.units.map(x=>x.code),first=codes[0],last=codes.at(-1);
  const handoff=candidate.ownership?.r43Handoff||null;
  const unified=Array.isArray(candidate.r44Unified)&&candidate.r44Unified.length>0;
  const workPrefix=handoff?'r33-handoff:'+String(handoff.waveIssueNumber)+':':unified?'r33-unified:':'r33-farm:';
  const unifiedByCode=new Map((candidate.r44Unified||[]).map(x=>[String(x.code).toUpperCase(),x]));
  const contentPaths=unified?candidate.units.map(x=>x.contentPath).filter(Boolean):[];
  const handoffPaths=unified?[...new Set((candidate.r44Unified||[]).map(x=>x.handoffPath).filter(Boolean))]:[];
  const unifiedContext=unified?candidate.units.map(unit=>{
    const h=unifiedByCode.get(unit.code)||{};
    return {code:unit.code,contentPath:unit.contentPath,handoffPath:h.handoffPath,outcome:h.outcome,resultSha256:h.resultSha256,sourceSha256:h.sourceSha256};
  }):[];
  const baseInstructions='R4 EPHEMERAL WORKER / CONTINUE-UNTIL-PREEMPTED: procesa exclusivamente estas entradas R33. Persiste y valida CADA entrada por separado; ANTES de cada commit ejecuta node scripts/R4-evidence-preflight.cjs <ruta-evidence>; este preflight recalcula articleHash, claimId, linkId y evidenceSnapshotHash con las funciones canónicas y debe terminar ok. Solo entonces crea el commit/checkpoint durable y continúa. No uses un push fallido como mecanismo normal de validación. checkpointSizeMax=1. El Global Dispatcher es el único owner efectivo; no crees un lease R33 Evidence Farm anidado. Al emitir FINISH del microclaim, Worker Events crea automáticamente un claim encadenado (autoPull.requestId/issueNumber). Si la sesión sigue razonando, sigue ese claim, espera su lease y procesa el siguiente microclaim. Repite FINISH → autoPull → siguiente lease indefinidamente mientras exista trabajo. No termines voluntariamente por haber acabado un microclaim. La finalización involuntaria del razonamiento es preemption normal: no intentes evitarla ni dependas de memoria conversacional; el progreso ya checkpointed debe sobrevivir y cualquier claim/lease sembrado debe poder expirar y ser reapeado.';
  const unifiedInstructions=unified?' UNIFIED R44→R33: estas entradas tienen handoff durable R44. Lee cada handoffPath antes de editar. Si outcome=CORRECTED, reconcilia correctedContent del handoff contra el artículo en contentPath y deja en contentPath la versión final que será certificada; no copies ciegamente un objeto parcial. Si outcome=PASS_NO_CHANGE, no alteres contentPath salvo que la validación R33 detecte un error real. Evidence debe calcularse contra el contenido final en la misma rama. El checkpoint puede incluir contentPath + evidenceArtifactPath y ambos quedan ligados al mismo commit. Contexto R44='+JSON.stringify(unifiedContext):'';
  return {
    workId:workPrefix+candidate.poolId+':'+first+':'+last+':'+codes.length,
    version:unified?2:1,
    title:handoff?'R43→R33 Gate #'+handoff.waveIssueNumber+' '+first+'..'+last:unified?'R44→R33 Unified '+first+'..'+last:'R33 Evidence Farm '+first+'..'+last,
    workType:'editorial_batch',status:'ready',priority:handoff?0:candidate.preparedDrain?1:unified?2:25,createdAt:new Date(now).toISOString(),provider:'r33-farm',
    providerVersion:candidate.providerVersion,ownershipMode:'global-single-lease',units:codes,checkpointSizeMax:candidate.checkpointSizeMax,
    resourceLocks:[...candidate.resourceLocks,...contentPaths.map(x=>'path:'+x)],
    allowedPaths:[...candidate.allowedPaths,...contentPaths],
    dependsOn:[],validation:['R33 Editorial Batch Tests'],
    instructions:baseInstructions+unifiedInstructions,
    branchPolicy:{mode:'assignment',prefix:unified?'worker/r33-unified':'worker/r33-farm'},completion:{requiresCommit:true,requiresValidation:true},
    providerSnapshot:candidate.snapshot,gate500Authorized:candidate.gate500Authorized,
    ...(unified?{r44Unified:unifiedContext,handoffPaths}: {})
  };
}
function r33TerminalSourceMap(globalLedger,pool,{root='.'}={}){
 const entriesByCode=new Map((pool?.entries||[]).map(x=>[String(x.code||'').toUpperCase(),x]));
 const allowed=new Set(entriesByCode.keys());
 const selector=revisions.load(root),out=new Map();
 for(const [workId,terminal] of Object.entries(globalLedger?.terminal||{})){
  if(terminal?.provider!=='r33-farm')continue;
  const chosen=revisions.choose(workId,terminal,selector,{mode:'integration'});
  if(chosen.blocked)continue; // Never fall back to an obsolete historical Evidence SHA.
  for(const raw of terminal.completedUnits||[]){
   const code=String(raw).toUpperCase();
   if(!allowed.has(code)||selector.activeHeldCodes.has(code))continue;
   const unified=String(workId).startsWith('r33-unified:');
   const poolEntry=entriesByCode.get(code)||{},r44=poolEntry.r44Handoff||null;
   out.set(code,{code,workId,branch:chosen.branch,commitSha:chosen.commitSha,
     supersessionRevisionId:chosen.revisionId,revisionAssets:chosen.assets||[],
     ...(unified&&poolEntry.contentPath?{
       contentPath:poolEntry.contentPath,
       r44Outcome:String(r44?.outcome||''),
       r44SourceSha256:String(r44?.sourceSha256||''),
       r44ResultSha256:String(r44?.resultSha256||'')
     }:{}),
     completedAt:String(terminal.completedAt||'')});
  }
 }
 return out;
}
function r33StagingManifest(globalLedger,{createdAt=null,root='.'}={}){
 const selector=revisions.load(root),rows=[],assets=new Map(),revisionSelections=[];
 for(const [workId,t] of Object.entries(globalLedger?.terminal||{})){
  if(t?.provider!=='r33-farm'||!Array.isArray(t.completedUnits))continue;
  const s=revisions.choose(workId,t,selector,{mode:'rehearsal'});
  if(s.revisionId){
   revisionSelections.push({workId,revisionId:s.revisionId,branch:s.branch,
     commitSha:s.commitSha,originalCommitSha:s.originalCommitSha,academicHold:s.academicHold});
   for(const asset of s.assets){
    const previous=assets.get(asset.path);
    if(previous&&previous.commitSha!==asset.commitSha)throw integrationError('R4_REVISION_ASSET_CONFLICT',asset.path,409);
    assets.set(asset.path,asset);
   }
  }
  for(const code of t.completedUnits)rows.push({code:String(code).toUpperCase(),workId,
    branch:s.branch,commitSha:s.commitSha,completedAt:t.completedAt||null,
    supersessionRevisionId:s.revisionId,academicHold:s.academicHold});
 }
 rows.sort((a,b)=>a.code.localeCompare(b.code)||a.workId.localeCompare(b.workId));
 const byCode=new Map();
 for(const row of rows){
  const prior=byCode.get(row.code);
  if(prior&&prior.commitSha!==row.commitSha)throw integrationError('R4_STAGING_CONFLICT',row.code,409);
  byCode.set(row.code,row);
 }
 const entries=[...byCode.values()];
 const digest=globalCore.sha256(JSON.stringify(entries.map(({code,workId,branch,commitSha})=>({code,workId,branch,commitSha}))));
 return {kind:'r33_staging_manifest',version:1,createdAt:createdAt||new Date().toISOString(),
  entryCount:entries.length,snapshotHash:digest,entries,revisionSelections,
  assetRefs:[...assets.values()].sort((a,b)=>a.path.localeCompare(b.path))};
}

function r33IntegratedCodes(root='.',verifiedCodes=null){
  if(Array.isArray(verifiedCodes))return new Set(verifiedCodes.map(x=>String(x).toUpperCase()));
  const p=path.join(root,'MLS R32 EDITORIAL','evidence git','indexes','verified.json');
  if(!fs.existsSync(p))return new Set();
  const values=JSON.parse(fs.readFileSync(p,'utf8'));
  return new Set((Array.isArray(values)?values:[]).map(x=>String(x).toUpperCase()));
}
function r33ContinuationPool({root='.',basePool,verifiedCodes=null,corpusEntries=null}={}){
  if(!basePool||basePool?.execution?.continuationAfterActivePool!==true)return null;
  const integrated=r33IntegratedCodes(root,verifiedCodes);
  const corpus=Array.isArray(corpusEntries)?corpusEntries:mlsCore.corpusEntries(root);
  const entries=corpus
    .filter(entry=>!integrated.has(String(entry.code||'').toUpperCase()))
    .map((entry,index)=>({
      order:index+1,
      code:String(entry.code||'').toUpperCase(),
      language:String(entry.language||''),
      contentPath:String(entry.path||entry.contentPath||'')
    }));
  if(!entries.length)return null;
  const execution={...(basePool.execution||{})};
  Object.assign(execution,{
    defaultClaimSize:5,
    maxClaimSize:10,
    workerBatchSize:5,
    integrationWaveSize:500,
    parallelWorkerLimit:128,
    maxConcurrentWorkers:128,
    checkpointSizeMax:1,
    deferredIntegration:true,
    directWaveIntegration:false,
    continuationAfterActivePool:true,
    parallelIntegrationPreparation:false,
    parallelPreparedPrs:false,
    finalMergeSerialized:true,
    serializedIndexIntegrationRequired:true,
    chatOnly:true,
    cloudflareEditorialInteractions:0,
    d1EditorialInteractions:0
  });
  return {
    poolId:'MLS-R33-FULL-CORPUS-CONTINUATION',
    manifestVersion:'1.0',
    status:'authorized',
    active:true,
    dispatcherOnly:true,
    sourceOfTruth:'github',
    editorialArchitecture:'github-native',
    cloudflareEditorialAllowed:false,
    d1EditorialAllowed:false,
    gate500Authorized:Boolean(basePool.gate500Authorized),
    gate1000Authorized:Boolean(basePool.gate1000Authorized),
    continuationOf:basePool.poolId,
    execution,
    entries
  };
}
function r33ContentPaths(sourceRefs){
 return [...new Set((sourceRefs||[]).map(x=>String(x?.contentPath||'').trim()).filter(Boolean))].sort();
}
function r33RevisionAssets(sourceRefs){
 const byPath=new Map();
 for(const ref of sourceRefs||[])for(const asset of ref.revisionAssets||[]){
  const prior=byPath.get(asset.path);
  if(prior&&prior.commitSha!==asset.commitSha)throw integrationError('R4_REVISION_ASSET_CONFLICT',asset.path,409);
  byPath.set(asset.path,asset);
 }
 return [...byPath.values()].sort((a,b)=>a.path.localeCompare(b.path));
}
function r33IntegrationWaves({pool,globalLedger,root='.',waveSize=50,verifiedCodes=null}={}){
  if(!pool||!Array.isArray(pool.entries))return [];
  const size=Number(waveSize);
  if(!Number.isInteger(size)||size<1)throw integrationError('R33_INTEGRATION_WAVE_INVALID','waveSize inválido para R33 integration.',500);
  const sources=r33TerminalSourceMap(globalLedger,pool,{root}),integrated=r33IntegratedCodes(root,verifiedCodes),held=revisions.load(root).activeHeldCodes;
  const remaining=pool.entries.filter(x=>!integrated.has(x.code)&&!held.has(x.code)),waves=[];
  for(let offset=0;offset<remaining.length;offset+=size){
    const units=remaining.slice(offset,offset+size);
    if(!units.length||units.some(x=>!sources.has(x.code)))continue;
    const codes=units.map(x=>x.code),first=codes[0],last=codes.at(-1);
    waves.push({
      units,codes,first,last,
      sourceRefs:units.map(x=>({...sources.get(x.code),evidenceArtifactPath:r33Provider.evidenceArtifactPath(x)}))
    });
  }
  return waves;
}
function r33IndexPreparationWorkId(poolId,wave){
  return 'r33-index-preparation:'+poolId+':'+wave.first+':'+wave.last+':'+wave.codes.length;
}
function r33IndexPreparationWorks({pool,globalLedger,root='.',waveSize=50,verifiedCodes=null}={}){
  if(pool?.execution?.parallelIntegrationPreparation!==true)return [];
  const indexRoot='MLS R32 EDITORIAL/evidence git/indexes';
  return r33IntegrationWaves({pool,globalLedger,root,waveSize,verifiedCodes}).map(wave=>{
    const workId=r33IndexPreparationWorkId(pool.poolId,wave);
    const sourceRefsJson=JSON.stringify(wave.sourceRefs);
    return {
      workId,
      version:1,
      title:'R33 parallel integration preparation '+wave.first+'..'+wave.last,
      workType:'code_task',status:'ready',priority:8,createdAt:new Date().toISOString(),provider:'r33-index-preparation',
      units:wave.codes,sourceRefs:wave.sourceRefs,dependsOn:[],
      resourceLocks:['system:r33-index-preparation:'+wave.first+':'+wave.last,...wave.codes.map(code=>'entry:'+code)],
      allowedPaths:[...wave.sourceRefs.map(x=>x.evidenceArtifactPath),...r33ContentPaths(wave.sourceRefs),...r33RevisionAssets(wave.sourceRefs).map(a=>a.path),indexRoot+'/by-code.json',indexRoot+'/by-language.json',indexRoot+'/by-source.json',indexRoot+'/verified.json'],
      validation:['R33 GitHub Native Tests','R33 Evidence Farm Tests'],
      instructions:'PREPARATION ONLY: integra los Evidence blobs de sourceRefs, cualquier contentPath certificado presente en esos mismos sourceRefs y todos los revisionAssets fijados por SHA en la rama asignada desde main; regenera los 4 índices con npm run r33:indexes:write; ejecuta npm run test:r33-github-native; abre un PR a main y déjalo sin mergear. Esta fase no posee system:main-integration y puede coexistir con otras preparaciones. Checkpoint/finish deben apuntar al HEAD exacto y validation debe registrar el PR preparado. sourceRefs='+sourceRefsJson,
      branchPolicy:{mode:'assignment',prefix:'worker/r33-index-preparation'},
      completion:{requiresCommit:true,requiresValidation:true},
      preparation:{mode:'parallel-pr',base:'main',merge:false,sourceRefs:wave.sourceRefs,contentPaths:r33ContentPaths(wave.sourceRefs),revisionAssets:r33RevisionAssets(wave.sourceRefs)}
    };
  });
}
function r33PreparedIndexIntegrationWork({pool,globalLedger,root='.',waveSize=50,verifiedCodes=null}={}){
  if(pool?.execution?.parallelIntegrationPreparation!==true)return null;
  const waves=r33IntegrationWaves({pool,globalLedger,root,waveSize,verifiedCodes});
  const terminal=globalLedger?.terminal||{};
  for(const wave of waves){
    const preparationWorkId=r33IndexPreparationWorkId(pool.poolId,wave);
    const prepared=terminal[preparationWorkId];
    if(!prepared||String(prepared.status||'').toLowerCase()!=='done'||String(prepared.provider||'')!=='r33-index-preparation')continue;
    const preparedCodes=(Array.isArray(prepared.completedUnits)?prepared.completedUnits:[]).map(x=>String(x).toUpperCase());
    if(preparedCodes.length!==wave.codes.length||wave.codes.some((code,index)=>preparedCodes[index]!==code))continue;
    const preparedCommitSha=String(prepared.commitSha||'').toLowerCase(),preparedBranch=String(prepared.branch||'');
    if(!/^[a-f0-9]{40}$/.test(preparedCommitSha)||!preparedBranch)continue;
    const indexRoot='MLS R32 EDITORIAL/evidence git/indexes';
    return {
      workId:'r33-index-integration:'+pool.poolId+':'+wave.first+':'+wave.last+':'+wave.codes.length,
      version:2,
      title:'R33 serialized final integration '+wave.first+'..'+wave.last,
      workType:'integration',status:'ready',priority:12,createdAt:new Date().toISOString(),provider:'r33-index-integration',
      units:wave.codes,sourceRefs:wave.sourceRefs,dependsOn:[],
      resourceLocks:['system:main-integration','system:r33-index-integration','path:'+indexRoot,...wave.codes.map(code=>'entry:'+code)],
      allowedPaths:[...wave.sourceRefs.map(x=>x.evidenceArtifactPath),...r33ContentPaths(wave.sourceRefs),...r33RevisionAssets(wave.sourceRefs).map(a=>a.path),indexRoot+'/by-code.json',indexRoot+'/by-language.json',indexRoot+'/by-source.json',indexRoot+'/verified.json'],
      validation:['R33 GitHub Native Tests','R33 Evidence Farm Tests'],
      instructions:'FINAL SERIAL PHASE: usa preparedRef como artefacto certificado, pero construye la rama asignada desde el main vigente. Copia exactamente los Evidence blobs y cualquier contentPath certificado preparados, regenera los 4 índices contra ese main, ejecuta npm run test:r33-github-native, abre/usa el PR final y exige checks verdes. Antes del merge envía checkpoint integrationStage=premerge con HEAD exacto; mergea con expected_head_sha; verifica main; envía postmerge y finish. Tras el merge, cierra el PR de preparación si sigue abierto. Solo cuando revisionAssets no esté vacío, incorpora exactamente esos archivos adicionales desde su commitSha fijado junto con Evidence; nunca sobrescribas archivos ajenos ni omitas los assets versionados.',
      branchPolicy:{mode:'assignment',prefix:'worker/r33-index-integration'},
      completion:{requiresCommit:true,requiresValidation:true},
      integration:{mode:'assignment-pr',base:'main',mergeMethod:'merge',requiredChecks:['R33 GitHub Native Tests'],postMergeChecks:['R33 GitHub Native Tests'],sourceRefs:wave.sourceRefs,contentPaths:r33ContentPaths(wave.sourceRefs),revisionAssets:r33RevisionAssets(wave.sourceRefs),preparedRef:{workId:preparationWorkId,branch:preparedBranch,commitSha:preparedCommitSha}}
    };
  }
  return null;
}

function r33IndexIntegrationWork({pool,globalLedger,root='.',waveSize=null,verifiedCodes=null,workPrefix='r33-index-integration:'}={}){
  if(!pool||!Array.isArray(pool.entries))return null;
  const size=Number(waveSize??pool?.execution?.integrationWaveSize??50);
  if(!Number.isInteger(size)||size<1)throw integrationError('R33_INTEGRATION_WAVE_INVALID','waveSize inválido para R33 integration.',500);
  const sources=r33TerminalSourceMap(globalLedger,pool,{root}),integrated=r33IntegratedCodes(root,verifiedCodes),held=revisions.load(root).activeHeldCodes;
  const remaining=pool.entries.filter(x=>!integrated.has(String(x.code||'').toUpperCase())&&!held.has(String(x.code||'').toUpperCase()));
  if(!remaining.length)return null;
  const unifiedCertifiedSubset=String(workPrefix||'').startsWith('r33-unified-integration:');
  const units=(unifiedCertifiedSubset
    ? remaining.filter(x=>sources.has(String(x.code||'').toUpperCase()))
    : remaining
  ).slice(0,size);
  if(!units.length||(!unifiedCertifiedSubset&&units.some(x=>!sources.has(String(x.code||'').toUpperCase()))))return null;
  const codes=units.map(x=>String(x.code).toUpperCase()),first=codes[0],last=codes.at(-1);
  const sourceRefs=units.map(x=>({...sources.get(String(x.code).toUpperCase()),evidenceArtifactPath:r33Provider.evidenceArtifactPath(x)}));
  const indexRoot='MLS R32 EDITORIAL/evidence git/indexes';
  return {
    workId:workPrefix+pool.poolId+':'+first+':'+last+':'+codes.length,
    version:3,
    title:'R33 wave integration '+first+'..'+last,
    workType:'integration',status:'ready',priority:12,createdAt:new Date().toISOString(),provider:'r33-index-integration',
    units:codes,sourceRefs,dependsOn:[],
    resourceLocks:['system:main-integration','system:r33-index-integration','path:'+indexRoot,...codes.map(code=>'entry:'+code)],
    allowedPaths:[...sourceRefs.map(x=>x.evidenceArtifactPath),...r33ContentPaths(sourceRefs),...r33RevisionAssets(sourceRefs).map(a=>a.path),indexRoot+'/by-code.json',indexRoot+'/by-language.json',indexRoot+'/by-source.json',indexRoot+'/verified.json'],
    validation:['R33 GitHub Native Tests','R33 Evidence Farm Tests'],
    instructions:'WAVE FINAL PHASE: construye la rama asignada desde el main vigente y agrega exactamente los Evidence blobs certificados por sourceRefs, cualquier contentPath certificado presente en esos mismos sourceRefs y sus revisionAssets, aunque provengan de múltiples workers/commits. Para cada contentPath aplica reconciliación de tres vías usando r44SourceSha256: compara el archivo actual de main, el archivo del source commit y el hash original R44. Si main coincide con el original y el source commit difiere, aplica el source certificado; si main ya coincide con el source, no reescribas; si main divergió de ambos, detén la integración como conflicto y exige recertificación. Nunca sobrescribas silenciosamente una edición concurrente. El Evidence y cualquier contenido aplicado deben provenir del mismo commitSha. No regeneres índices por worker: copia todos los Evidence/contenido de la wave y ejecuta npm run r33:indexes:write una sola vez al final. Ejecuta npm run test:r33-github-native, abre/usa un único PR final y exige checks verdes. Antes del merge envía checkpoint integrationStage=premerge con HEAD exacto; mergea con expected_head_sha; verifica main; envía postmerge y finish. Solo cuando revisionAssets no esté vacío, incorpora exactamente esos archivos adicionales desde su commitSha fijado junto con Evidence; nunca sobrescribas archivos ajenos ni omitas los assets versionados.',
    branchPolicy:{mode:'assignment',prefix:'worker/r33-index-integration'},
    completion:{requiresCommit:true,requiresValidation:true},
    integration:{
      mode:'assignment-pr',
      waveMode:'aggregate-certified-workers',
      base:'main',
      mergeMethod:'merge',
      allowDirectFallback:unifiedCertifiedSubset,
      requiredChecks:['R33 GitHub Native Tests'],
      postMergeChecks:['R33 GitHub Native Tests'],
      sourceRefs,contentPaths:r33ContentPaths(sourceRefs),revisionAssets:r33RevisionAssets(sourceRefs),
      waveSize:size,
      sourceWorkerCommits:[...new Set(sourceRefs.map(x=>x.commitSha).filter(Boolean))]
    }
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
function materializeProviderItems({issues=[],root='.',now=Date.now(),globalLedger=null,globalAssignments=[],queueTarget=READY_QUEUE_TARGET}={}){
  const items=[],diagnostics=[];
  try{
    const snapshot=projectMlsSnapshot(collectMlsSnapshot(issues,root),{globalLedger,globalAssignments});
    const works=mlsProvider.materializeFarmWorks({...snapshot,at:now,count:queueTarget});
    for(const item of works)items.push(globalCore.normalizeWorkItem(item));
  }catch(error){diagnostics.push({provider:'mls-farm',status:'blocked',error:error.code||'MLS_FARM_PROVIDER_ERROR',message:error.message});}
  try{
    const snapshot=projectR33Snapshot(collectR33Snapshot(issues,root),{globalLedger,globalAssignments});
    const execution=snapshot.pool?.execution||{};
    const unifiedViewForIntegration=r33UnifiedSnapshot(snapshot,snapshot.r44Handoffs||new Map(),{root,globalLedger,globalAssignments});
    if(unifiedViewForIntegration){
      const unifiedIndexItem=r33IndexIntegrationWork({
        pool:unifiedViewForIntegration.pool,
        globalLedger,
        root,
        waveSize:50,
        workPrefix:'r33-unified-integration:'
      });
      if(unifiedIndexItem){
        unifiedIndexItem.priority=1;
        unifiedIndexItem.title='R44→R33 Unified final integration '+unifiedIndexItem.units[0]+'..'+unifiedIndexItem.units.at(-1);
        items.push(globalCore.normalizeWorkItem(unifiedIndexItem));
      }
    }
    if(execution.deferredIntegration===true){
      // R4: certified Evidence accumulates outside main. Integration is rehearsed/published separately.
    }else if(execution.directWaveIntegration===true){
      const indexItem=r33IndexIntegrationWork({
        pool:snapshot.pool,
        globalLedger,
        root,
        waveSize:Number(execution.integrationWaveSize||500)
      });
      if(indexItem)items.push(globalCore.normalizeWorkItem(indexItem));
    }else if(execution.parallelIntegrationPreparation===true){
      const preparationItems=r33IndexPreparationWorks({pool:snapshot.pool,globalLedger,root,waveSize:Number(execution.integrationWaveSize||50)});
      for(const item of preparationItems)items.push(globalCore.normalizeWorkItem(item));
      const indexItem=r33PreparedIndexIntegrationWork({pool:snapshot.pool,globalLedger,root,waveSize:Number(execution.integrationWaveSize||50)});
      if(indexItem)items.push(globalCore.normalizeWorkItem(indexItem));
    }else{
      const indexItem=r33IndexIntegrationWork({pool:snapshot.pool,globalLedger,root,waveSize:Number(execution.integrationWaveSize||50)});
      if(indexItem)items.push(globalCore.normalizeWorkItem(indexItem));
    }
    const activeR33=activeProviderAssignments(globalAssignments,'r33-farm').length;
    const configuredLimit=Number(execution.parallelWorkerLimit??queueTarget);
    const parallelLimit=Number.isInteger(configuredLimit)&&configuredLimit>0?Math.min(queueTarget,configuredLimit):queueTarget;
    const available=Math.max(0,parallelLimit-activeR33);
    const candidates=[];
    if(available>0){
      const handoffSnapshots=r33HandoffSnapshots(snapshot);
      if(handoffSnapshots.length){
        // Preserve historical R4.3 gate isolation: while an explicit R43→R33
        // handoff exists, only those scoped units are materialized.
        const scoped=handoffSnapshots.map(x=>({...x,batches:(x.batches||[]).map(b=>structuredClone(b))}));
        let progressed=true;
        while(candidates.length<available&&progressed){
          progressed=false;
          for(const view of scoped){
            if(candidates.length>=available)break;
            const candidate=r33Provider.materializeCandidate(view,{now,requested:5});
            if(!candidate.eligible)continue;
            candidates.push(candidate);progressed=true;
            const acknowledgedAt=new Date(now).toISOString();
            view.batches.push({
              poolId:candidate.poolId,
              batchId:'GLOBAL-MULTIWAVE-'+String(candidates.length).padStart(3,'0'),
              status:'leased',
              acknowledgedAt,
              ackDeadlineAt:new Date(Number(now)+60*60*1000).toISOString(),
              expiresAt:new Date(Number(now)+60*60*1000).toISOString(),
              entries:candidate.units.map(unit=>({code:unit.code}))
            });
          }
        }
      }else{
        // Unified lane first: only R44 COMPLETE entries with a durable GitHub
        // handoff are eligible. The general R33 lane sees those codes as
        // protected during this same materialization, preventing duplicate work.
        let working=snapshot;
        const unifiedView=r33UnifiedSnapshot(snapshot,snapshot.r44Handoffs||new Map(),{root,globalLedger,globalAssignments});
        if(unifiedView){
          const unifiedCandidates=r33Provider.materializeCandidates(unifiedView,{now,count:available});
          for(const candidate of unifiedCandidates){
            candidate.preparedDrain=candidate.units.some(unit=>unifiedView.preparedDrainCodes.has(unit.code));
            candidate.r44Unified=candidate.units.map(unit=>snapshot.r44Handoffs.get(unit.code)).filter(Boolean);
            if(candidate.r44Unified.length!==candidate.units.length)throw integrationError('R44_R33_HANDOFF_SCOPE_MISMATCH','Candidate Unified sin handoff completo.',503);
            candidates.push(candidate);
          }
          working=protectCandidateCodes(working,unifiedCandidates,now);
        }
        const remaining=Math.max(0,available-candidates.length);
        if(remaining>0)candidates.push(...r33Provider.materializeCandidates(working,{now,count:remaining}));
      }
    }
    for(const candidate of candidates){
      const item=r33CandidateToWork(candidate,now);
      if(item)items.push(globalCore.normalizeWorkItem(item));
    }
  }catch(error){diagnostics.push({provider:'r33-farm',status:'blocked',error:error.code||'R33_PROVIDER_ERROR',message:error.message});}
  return {items,diagnostics,queueTarget};
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
  DYNAMIC_PROVIDERS,READY_QUEUE_TARGET,integrationError,codesFromLocks,codesFromTerminal,activeProviderAssignments,completedUnitsForState,
  collectMlsSnapshot,collectR33Snapshot,projectMlsSnapshot,projectR33Snapshot,loadR44R33Handoffs,r33UnifiedSnapshot,protectCandidateCodes,r33HandoffSnapshots,r33CandidateToWork,r33TerminalSourceMap,r33StagingManifest,r33IntegratedCodes,r33ContinuationPool,
  r33IntegrationWaves,r33IndexPreparationWorkId,r33IndexPreparationWorks,r33PreparedIndexIntegrationWork,r33IndexIntegrationWork,r33ContentPaths,
  recoveryItems,materializeProviderItems,extendRegistry
};
