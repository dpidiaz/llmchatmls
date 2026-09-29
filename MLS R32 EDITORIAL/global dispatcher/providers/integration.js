'use strict';

const fs=require('node:fs');
const path=require('node:path');
const globalCore=require('../core.js');
const mlsCore=require('../../farm core.js');
const r33Core=require('../../evidence farm core.js');
const mlsProvider=require('./mls farm.js');
const r33Provider=require('./r33.js');
const buffered=require('../../r4 buffered allocation.cjs');

const DYNAMIC_PROVIDERS=new Set(['mls-farm','r33-farm','r33-index-preparation','r33-index-integration']);
const READY_QUEUE_TARGET=128;

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
  return {pool,ledger,batches,bufferedReservations,ledgerSynthetic:ledgers.length===0,continuationActive:Boolean(continuation),configuredPoolId:configuredPool.poolId};
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
  const reservedCodes=[...new Set((snapshot.bufferedReservations||[])
    .flatMap(r=>r.allocation.units.map(u=>u.code)).filter(code=>poolCodes.has(code)))];
  return {...snapshot,ledger,batches,reservedCodes};
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
    validation:['R33 Editorial Batch Tests'],
    instructions:'R4 EPHEMERAL WORKER / CONTINUE-UNTIL-PREEMPTED: procesa exclusivamente estas entradas R33. Persiste y valida CADA entrada por separado; ANTES de cada commit ejecuta node scripts/R4-evidence-preflight.cjs <ruta-evidence>; este preflight recalcula articleHash, claimId, linkId y evidenceSnapshotHash con las funciones canónicas y debe terminar ok. Solo entonces crea el commit/checkpoint durable y continúa. No uses un push fallido como mecanismo normal de validación. checkpointSizeMax=1. El Global Dispatcher es el único owner efectivo; no crees un lease R33 Evidence Farm anidado. Al emitir FINISH del microclaim, Worker Events crea automáticamente un claim encadenado (autoPull.requestId/issueNumber). Si la sesión sigue razonando, sigue ese claim, espera su lease y procesa el siguiente microclaim. Repite FINISH → autoPull → siguiente lease indefinidamente mientras exista trabajo. No termines voluntariamente por haber acabado un microclaim. La finalización involuntaria del razonamiento es preemption normal: no intentes evitarla ni dependas de memoria conversacional; el progreso ya checkpointed debe sobrevivir y cualquier claim/lease sembrado debe poder expirar y ser reapeado.',
    branchPolicy:{mode:'assignment',prefix:'worker/r33-farm'},completion:{requiresCommit:true,requiresValidation:true},
    providerSnapshot:candidate.snapshot,gate500Authorized:candidate.gate500Authorized
  };
}
function r33TerminalSourceMap(globalLedger,pool){
  const allowed=new Set((pool?.entries||[]).map(x=>String(x.code||'').toUpperCase())),out=new Map();
  for(const entry of Object.values(globalLedger?.terminal||{})){
    if(String(entry?.provider||'')!=='r33-farm')continue;
    for(const raw of Array.isArray(entry?.completedUnits)?entry.completedUnits:[]){
      const code=String(raw||'').toUpperCase();
      if(!allowed.has(code))continue;
      out.set(code,{code,branch:String(entry.branch||''),commitSha:String(entry.commitSha||''),completedAt:String(entry.completedAt||'')});
    }
  }
  return out;
}
function r33StagingManifest(globalLedger,{createdAt=null}={}){
  const rows=[];
  for(const [workId,terminal] of Object.entries(globalLedger?.terminal||{})){
    if(!terminal||terminal.provider!=='r33-farm'||!Array.isArray(terminal.completedUnits))continue;
    for(const code of terminal.completedUnits){
      rows.push({
        code:String(code).toUpperCase(),
        workId,
        branch:String(terminal.branch||''),
        commitSha:String(terminal.commitSha||''),
        completedAt:terminal.completedAt||null
      });
    }
  }
  rows.sort((a,b)=>a.code.localeCompare(b.code)||a.workId.localeCompare(b.workId));
  const byCode=new Map();
  for(const row of rows){
    const prior=byCode.get(row.code);
    if(prior&&prior.commitSha!==row.commitSha)throw integrationError('R4_STAGING_CONFLICT','Más de un commit certificado para '+row.code+'.',409);
    byCode.set(row.code,row);
  }
  const entries=[...byCode.values()];
  const digest=globalCore.sha256(JSON.stringify(entries.map(({code,workId,branch,commitSha})=>({code,workId,branch,commitSha}))));
  return {
    kind:'r33_staging_manifest',version:1,
    createdAt:createdAt||new Date().toISOString(),
    entryCount:entries.length,
    snapshotHash:digest,
    entries
  };
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
function r33IntegrationWaves({pool,globalLedger,root='.',waveSize=50,verifiedCodes=null}={}){
  if(!pool||!Array.isArray(pool.entries))return [];
  const size=Number(waveSize);
  if(!Number.isInteger(size)||size<1)throw integrationError('R33_INTEGRATION_WAVE_INVALID','waveSize inválido para R33 integration.',500);
  const sources=r33TerminalSourceMap(globalLedger,pool),integrated=r33IntegratedCodes(root,verifiedCodes);
  const remaining=pool.entries.filter(x=>!integrated.has(x.code)),waves=[];
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
      allowedPaths:[...wave.sourceRefs.map(x=>x.evidenceArtifactPath),indexRoot+'/by-code.json',indexRoot+'/by-language.json',indexRoot+'/by-source.json',indexRoot+'/verified.json'],
      validation:['R33 GitHub Native Tests','R33 Evidence Farm Tests'],
      instructions:'PREPARATION ONLY: integra exactamente los Evidence blobs de sourceRefs en la rama asignada desde main; regenera los 4 índices con npm run r33:indexes:write; ejecuta npm run test:r33-github-native; abre un PR a main y déjalo sin mergear. Esta fase no posee system:main-integration y puede coexistir con otras preparaciones. Checkpoint/finish deben apuntar al HEAD exacto y validation debe registrar el PR preparado. sourceRefs='+sourceRefsJson,
      branchPolicy:{mode:'assignment',prefix:'worker/r33-index-preparation'},
      completion:{requiresCommit:true,requiresValidation:true},
      preparation:{mode:'parallel-pr',base:'main',merge:false,sourceRefs:wave.sourceRefs}
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
      allowedPaths:[...wave.sourceRefs.map(x=>x.evidenceArtifactPath),indexRoot+'/by-code.json',indexRoot+'/by-language.json',indexRoot+'/by-source.json',indexRoot+'/verified.json'],
      validation:['R33 GitHub Native Tests','R33 Evidence Farm Tests'],
      instructions:'FINAL SERIAL PHASE: usa preparedRef como artefacto certificado, pero construye la rama asignada desde el main vigente. Copia exactamente los 50 Evidence blobs preparados, regenera los 4 índices contra ese main, ejecuta npm run test:r33-github-native, abre/usa el PR final y exige checks verdes. Antes del merge envía checkpoint integrationStage=premerge con HEAD exacto; mergea con expected_head_sha; verifica main; envía postmerge y finish. Tras el merge, cierra el PR de preparación si sigue abierto. No modifiques Sources ni contenido canónico.',
      branchPolicy:{mode:'assignment',prefix:'worker/r33-index-integration'},
      completion:{requiresCommit:true,requiresValidation:true},
      integration:{mode:'assignment-pr',base:'main',mergeMethod:'merge',requiredChecks:['R33 GitHub Native Tests'],postMergeChecks:['R33 GitHub Native Tests'],sourceRefs:wave.sourceRefs,preparedRef:{workId:preparationWorkId,branch:preparedBranch,commitSha:preparedCommitSha}}
    };
  }
  return null;
}

function r33IndexIntegrationWork({pool,globalLedger,root='.',waveSize=null,verifiedCodes=null}={}){
  if(!pool||!Array.isArray(pool.entries))return null;
  const size=Number(waveSize??pool?.execution?.integrationWaveSize??50);
  if(!Number.isInteger(size)||size<1)throw integrationError('R33_INTEGRATION_WAVE_INVALID','waveSize inválido para R33 integration.',500);
  const sources=r33TerminalSourceMap(globalLedger,pool),integrated=r33IntegratedCodes(root,verifiedCodes);
  const remaining=pool.entries.filter(x=>!integrated.has(String(x.code||'').toUpperCase()));
  if(!remaining.length)return null;
  const units=remaining.slice(0,size);
  if(!units.length||units.some(x=>!sources.has(String(x.code||'').toUpperCase())))return null;
  const codes=units.map(x=>String(x.code).toUpperCase()),first=codes[0],last=codes.at(-1);
  const sourceRefs=units.map(x=>({...sources.get(String(x.code).toUpperCase()),evidenceArtifactPath:r33Provider.evidenceArtifactPath(x)}));
  const indexRoot='MLS R32 EDITORIAL/evidence git/indexes';
  return {
    workId:'r33-index-integration:'+pool.poolId+':'+first+':'+last+':'+codes.length,
    version:3,
    title:'R33 wave integration '+first+'..'+last,
    workType:'integration',status:'ready',priority:12,createdAt:new Date().toISOString(),provider:'r33-index-integration',
    units:codes,sourceRefs,dependsOn:[],
    resourceLocks:['system:main-integration','system:r33-index-integration','path:'+indexRoot,...codes.map(code=>'entry:'+code)],
    allowedPaths:[...sourceRefs.map(x=>x.evidenceArtifactPath),indexRoot+'/by-code.json',indexRoot+'/by-language.json',indexRoot+'/by-source.json',indexRoot+'/verified.json'],
    validation:['R33 GitHub Native Tests','R33 Evidence Farm Tests'],
    instructions:'WAVE FINAL PHASE: construye la rama asignada desde el main vigente y agrega exactamente los Evidence blobs certificados por sourceRefs, aunque provengan de múltiples workers/commits. No regeneres índices por worker: copia todos los Evidence de la wave y ejecuta npm run r33:indexes:write una sola vez al final. Ejecuta npm run test:r33-github-native, abre/usa un único PR final y exige checks verdes. Antes del merge envía checkpoint integrationStage=premerge con HEAD exacto; mergea con expected_head_sha; verifica main; envía postmerge y finish. No modifiques Sources ni contenido canónico.',
    branchPolicy:{mode:'assignment',prefix:'worker/r33-index-integration'},
    completion:{requiresCommit:true,requiresValidation:true},
    integration:{
      mode:'assignment-pr',
      waveMode:'aggregate-certified-workers',
      base:'main',
      mergeMethod:'merge',
      requiredChecks:['R33 GitHub Native Tests'],
      postMergeChecks:['R33 GitHub Native Tests'],
      sourceRefs,
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
    const candidates=available>0?r33Provider.materializeCandidates(snapshot,{now,count:available}):[];
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
  collectMlsSnapshot,collectR33Snapshot,projectMlsSnapshot,projectR33Snapshot,r33CandidateToWork,r33TerminalSourceMap,r33StagingManifest,r33IntegratedCodes,r33ContinuationPool,
  r33IntegrationWaves,r33IndexPreparationWorkId,r33IndexPreparationWorks,r33PreparedIndexIntegrationWork,r33IndexIntegrationWork,
  recoveryItems,materializeProviderItems,extendRegistry
};
