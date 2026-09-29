'use strict';
// MLS R4.1 BCR v1: compact, additive context only. Does not create leases,
// certify claims, open network connections, seal bundles, or deploy.
// Existing R33 + R4.1 canonical validation remains authoritative.
const core=require('./r4 buffered core.cjs');
const VERSION='R4.1-BCR-1.0',PACK_SCHEMA='MLS-R4.1-BCR-PACK-1',
      INDEX_SCHEMA='MLS-R4.1-BCR-SOURCES-1',DELTA_SCHEMA='MLS-R4.1-BCR-DELTA-1';
const RECIPE=Object.freeze({
 schema:'MLS-R4.1-BCR-RECIPE-1',version:VERSION,
 academic:'R33 canonical evidence+APA7, source/claim/localizer independently evaluated per entry',
 status:['UNSOURCED','SOURCED','VERIFIED','REVIEWED'],
 claimPolicy:'AI source suggestions never automatically certify a new claim; only canonical R33 plus academic gate may certify.',
 sourcePolicy:'registry identity pinned; reuse locator as a research hint, never reuse verification result',
 checkpoints:'one immutable checkpoint per unit; hash(entry) and allocationHash must match',
 writing:'one grouped commit per five units, optimistic branch SHA and single writer',
 publication:'25 complete independently validated entries required; no early seal or automatic Cloudflare',
 operation:'SOLO CHAT; FREE ONLY; GitHub canonical; no OpenAI API, paid API, D1 editorial or hidden commercial fallback',
 selection:'opt-in R4.1 only; ordinary MLS siguiente keeps legacy R4',
 recovery:'on 403/429 no retries; export local work explicitly marked unconfirmed'
});
const RECIPE_HASH=core.hash(RECIPE);
function assert(ok,code,detail=''){if(!ok)core.error('BCR_'+code,detail||code);}
function unique(xs){return [...new Set(xs)];}
function validSha(s,n=40){return new RegExp('^[a-f0-9]{'+n+'}$','i').test(String(s||''));}
const isCode=s=>/^MLS-V\d{2}-\d{4}$/.test(String(s||''));
function same(a,b){return core.hash(a)===core.hash(b);}
function allocation(manifest){
 assert(manifest?.schema===core.SCHEMA&&manifest.allocationHash===core.hash(manifest.allocation),'MANIFEST_TAMPERED');
 const a=manifest.allocation;
 assert(a?.allocatedBy==='global-dispatcher'&&a.units?.length===25&&a.assignmentIssueNumber===1872&&
   a.assignmentId==='MLS-BUFFER-001872','NOT_ACTIVE_RESERVATION');
 assert(unique(a.units.map(u=>u.code)).length===25&&a.units.every(u=>isCode(u.code)),'ASSIGNED_CODES_INVALID');
 assert(validSha(a.baseCommit)&&validSha(a.contentManifestBlobSha),'BASE_SHA_INVALID');
 return a;
}
function chunkUnsigned(chunk){const x={...chunk};delete x.chunkHash;return x;}
function verifyChunk(chunk,manifest,{expectedBlock=null}={}){
 const a=allocation(manifest);
 assert(chunk?.schema==='MLS-R4.1-PARTIAL-EXPORT-1'&&
 chunk.issueNumber===a.assignmentIssueNumber&&chunk.assignmentId===a.assignmentId&&
 chunk.allocationHash===manifest.allocationHash&&chunk.totalChunks===5&&
 Number.isSafeInteger(chunk.chunk)&&chunk.chunk>=1&&chunk.chunk<=5,'CHUNK_IDENTITY');
 if(expectedBlock!==null)assert(chunk.chunk===expectedBlock,'CHUNK_OUT_OF_ORDER');
 assert(chunk.chunkHash===core.hash(chunkUnsigned(chunk)),'CHUNK_HASH_INVALID');
 assert(same(chunk.manifest,manifest),'CHUNK_MANIFEST_CONFLICT');
 const units=a.units.slice((chunk.chunk-1)*5,chunk.chunk*5),codes=units.map(u=>u.code);
 assert(codes.length===5&&same(Object.keys(chunk.entries||{}).sort(),codes.slice().sort())&&
 same(Object.keys(chunk.checkpoints||{}).sort(),codes.slice().sort()),'CHUNK_INCOMPLETE');
 for(const u of units){
  const e=chunk.entries[u.code],cp=chunk.checkpoints[u.code];
  assert(e&&e.code===u.code&&e.language===u.language&&e.contentPath===u.contentPath&&
   e.architecture==='github-native'&&e.article?.articleHash,'EVIDENCE_MISMATCH',u.code);
  assert(cp&&cp.schema===core.SCHEMA&&cp.code===u.code&&
   cp.entrySha===core.hash(e)&&cp.allocationHash===manifest.allocationHash&&
   cp.evidenceArtifactPath===u.evidenceArtifactPath,'CHECKPOINT_MISMATCH',u.code);
  // A candidate's claimedStatus does not substitute for an R33 assessment.
  assert(cp.claimedStatus===e.status&&
   ['PENDING_CANONICAL_R33_VALIDATION','R33_CANONICAL_PASS'].includes(cp.assessment),'CHECKPOINT_ASSESSMENT',u.code);
 }
 return {block:chunk.chunk,codes};
}
function bibliography(id,source){
 assert(source&&source.sourceId===id&&/^MLS-SRC-[A-F0-9]{20}$/.test(id),'SOURCE_IDENTITY_MISMATCH',id);
 const m=source.metadata||source;
 assert(m.status==='active'&&['A','B','C'].includes(m.authorityTier)&&m.title&&
  (m.isbn||m.doi||m.canonicalUrl),'SOURCE_REGISTRY_INVALID',id);
 const identity=m.doi?'doi:'+String(m.doi).trim().toLowerCase():
  m.isbn?'isbn:'+String(m.isbn).replace(/[^\dX]/gi,'').toUpperCase():
  'url:'+String(m.canonicalUrl).trim().toLowerCase().replace(/\/$/,'');
 return {sourceId:id,bibliographicKey:identity,
  author:m.authors||[m.institution].filter(Boolean),title:m.title,year:m.publicationYear||null,
  publisher:m.publisher||m.institution||null,doi:m.doi||null,isbn:m.isbn||null,
  url:m.canonicalUrl||null,language:m.language||null,topics:m.topics||[],
  registryBlobSha:source.registryBlobSha||null,
  registryFingerprint:core.hash({id,metadata:m}),sourceStatus:'REGISTERED_REFERENCE_ONLY',
  // Per-entry claims are NOT VERIFIED through reuse.
  passages:[],usedBy:[],entryVerificationInherited:false};
}
function registryFromMap(sourceRegistry,id){
 const raw=sourceRegistry?.[id];
 assert(raw,'SOURCE_REGISTRY_MISSING',id);
 return bibliography(id,raw);
}
function updateIndex(existing,entries,sourceRegistry){
 const idx=existing?structuredClone(existing):{schema:INDEX_SCHEMA,version:1,sources:{}};
 assert(idx.schema===INDEX_SCHEMA,'SOURCE_INDEX_VERSION');
 const fingerprints=new Map(Object.values(idx.sources).map(s=>[s.bibliographicKey,s.sourceId]));
 for(const e of entries){
  for(const link of e.links||[]){
   const id=link.sourceId,meta=registryFromMap(sourceRegistry,id),previous=idx.sources[id];
   if(previous){
    assert(previous.registryFingerprint===meta.registryFingerprint&&
      previous.registryBlobSha===meta.registryBlobSha,'SOURCE_CONTEXT_STALE',id);
   }else{
    assert(!fingerprints.has(meta.bibliographicKey)||fingerprints.get(meta.bibliographicKey)===id,
      'DUPLICATE_BIBLIOGRAPHIC_IDENTITY',id);
    idx.sources[id]=meta;fingerprints.set(meta.bibliographicKey,id);
   }
   assert((e.claims||[]).some(c=>c.claimId===link.claimId),'SOURCE_LINK_ORPHAN',e.code);
   const s=idx.sources[id],passage={locator:link.locator||{},locatorHash:core.hash(link.locator||{})};
   if(!s.passages.some(p=>p.locatorHash===passage.locatorHash))s.passages.push(passage);
   const use={code:e.code,claimId:link.claimId,linkId:link.linkId,locatorHash:passage.locatorHash};
   if(!s.usedBy.some(u=>u.linkId===use.linkId))s.usedBy.push(use);
  }
 }
 return idx;
}
function packHash(pack){const x={...pack};delete x.stateHash;return core.hash(x);}
function verifyState({pack,index,manifest,progress,sourceRegistry}){
 const a=allocation(manifest);
 assert(pack?.schemaVersion===PACK_SCHEMA&&pack.recipeVersion===VERSION&&pack.recipeHash===RECIPE_HASH,
  'EDITORIAL_RECIPE_STALE');
 assert(pack.reservationId===a.assignmentId&&pack.batchSize===25&&pack.blockSize===5&&
  pack.allocationHash===manifest.allocationHash&&pack.allocationBaseCommit===a.baseCommit,
  'CONTEXT_ALLOCATION_CHANGED');
 assert(pack.stateHash===packHash(pack),'CONTEXT_HASH_INVALID');
 assert(index?.schema===INDEX_SCHEMA&&pack.sourceIndexHash===core.hash(index),'SOURCE_INDEX_CORRUPT');
 assert(progress?.allocationHash===manifest.allocationHash&&pack.progressHash===core.hash(progress),
  'PROGRESS_DRIFT');
 const all=a.units.map(u=>u.code),complete=progress.completedCodes||[];
 assert(same(pack.completedCodes,complete)&&same(pack.pendingCodes,progress.pendingCodes)&&
  same(pack.completedCodes,all.slice(0,complete.length)),'CONTEXT_PROGRESS_INCONSISTENT');
 assert(pack.checkpointRefs.length===complete.length&&pack.checkpointRefs.every((cp,i)=>
  cp.code===complete[i]&&cp.entrySha===progress.checkpointHashes[i].entrySha),'CHECKPOINT_INDEX_DRIFT');
 for(const [id,s] of Object.entries(index.sources||{})){
  const refreshed=registryFromMap(sourceRegistry,id);
  assert(refreshed.registryFingerprint===s.registryFingerprint&&
   refreshed.registryBlobSha===s.registryBlobSha,'SOURCE_CONTEXT_STALE',id);
 }
 return true;
}
function makeProgress(manifest,chunks,previous=null){
 const a=allocation(manifest),complete=chunks.flatMap(c=>Object.keys(c.entries)),
  all=a.units.map(u=>u.code);
 assert(same(complete,all.slice(0,complete.length)),'PROGRESS_NOT_PREFIX');
 const checkpoints=chunks.flatMap(c=>Object.values(c.checkpoints).map(x=>({code:x.code,entrySha:x.entrySha})));
 const p={...(previous||{}),schema:'MLS-R4.1-PROGRESS-1',issueNumber:1872,assignmentId:a.assignmentId,
  allocationHash:manifest.allocationHash,chunk:chunks.length,totalChunks:5,assigned:25,
  checkpointed:complete.length,completedCodes:complete,pendingCodes:all.slice(complete.length),
  checkpointHashes:checkpoints,chunkHash:chunks[chunks.length-1].chunkHash,
  status:'PARTIAL_BUFFER_NOT_SEALED',noPackageUntilAll25:true,noInBoxSyncYet:true,
  noIndividualEntryCommits:true,review:{type:'ai',humanReviewed:false}};
 return p;
}
function context({manifest,progress,index,priorHash=null,priorCommit,chunk}){
 const a=allocation(manifest),done=progress.completedCodes;
 assert(validSha(priorCommit),'PREVIOUS_COMMIT_REQUIRED');
 const pack={schemaVersion:PACK_SCHEMA,reservationId:a.assignmentId,issueNumber:1872,batchSize:25,
  blockSize:5,recipeVersion:VERSION,recipeHash:RECIPE_HASH,
  allocationRef:'manifest.json',allocationHash:manifest.allocationHash,
  allocationBaseCommit:a.baseCommit,contentManifestBlobSha:a.contentManifestBlobSha,
  completedCodes:done,pendingCodes:progress.pendingCodes,
  currentBlock:chunk.chunk,lastPersistedBlock:chunk.chunk,nextBlock:chunk.chunk<5?chunk.chunk+1:null,
  checkpointRefs:progress.checkpointHashes.map(x=>({...x,
   path:'checkpoints/'+x.code+'.json',assessment:'PENDING_CANONICAL_R33_VALIDATION'})),
  progressRef:'progress.json',progressHash:core.hash(progress),
  sourceIndexRef:'bcr/source-index.json',sourceIndexHash:core.hash(index),
  lastDeltaRef:'bcr/deltas/block-'+String(chunk.chunk).padStart(2,'0')+'.json',
  previousContextHash:priorHash,previousConfirmedCommit:priorCommit,
  commitConfirmation:'REQUIRES_REMOTE_REF_READBACK',lastChunkHash:chunk.chunkHash,
  conventions:['R33+APA7 per-entry','context is hints, not verification','25/25 required to seal',
    'do not rewrite existing checkpoints','no Cloudflare or paid services'],
  warnings:['Claimed VERIFIED in a partial chunk is NOT final canonical R33 certification.'],
  openTasks:chunk.chunk<5?['Produce next 5 only','Canonical R33 independently for each entry']:
   ['Run canonical R33 on all 25','Verify 25 immutable checkpoint hashes before seal'],
  metrics:{checkpointed:done.length,sourceRegistryItems:Object.keys(index.sources).length,
   contextReused:priorHash!==null,fullArticleBodiesInPack:0}};
 return {...pack,stateHash:packHash(pack)};
}
function makeDelta({pack,chunk,priorPack=null,oldIndex=null,index,previousCommit}){
 const previous=oldIndex?.sources||{},now=index.sources;
 const additions=Object.keys(now).filter(id=>!previous[id]),
 reused=Object.keys(now).filter(id=>previous[id]&&
  now[id].usedBy.length>previous[id].usedBy.length);
 const delta={schemaVersion:DELTA_SCHEMA,reservationId:pack.reservationId,block:chunk.chunk,
  codes:Object.keys(chunk.entries),checkpointHashes:Object.values(chunk.checkpoints)
   .map(x=>({code:x.code,entrySha:x.entrySha})),
  newSourceIds:additions,reusedSourceIds:reused,
  verifiedInherited:0,sourceVerificationPendingPerEntry:true,
  priorContextHash:priorPack?.stateHash||null,newContextHash:pack.stateHash,
  previousConfirmedCommit:previousCommit,gitCommitStatus:'PENDING_REF_READBACK',
  newCommitSha:null,incidents:[],nextBlock:pack.nextBlock};
 return {...delta,deltaHash:core.hash(delta)};
}
function handoff(pack,delta){
 const p=pack, codes=p.pendingCodes.slice(0,5);
 return [
  '# MLS R4.1 BCR handoff', '',
  'Reserva: #'+p.issueNumber+' | Bloque persistido: '+p.lastPersistedBlock+'/5 | Total: '+p.completedCodes.length+'/25.',
  'Context Pack: bcr/context-pack.json | SHA256 lógico: '+p.stateHash,
  'Source Index: bcr/source-index.json | hash: '+p.sourceIndexHash,
  'Último delta: '+p.lastDeltaRef+' | hash: '+delta.deltaHash,
  'Commit padre comprobado antes de escribir: '+p.previousConfirmedCommit,
  '**Commit ACTUAL:** verificar SHA de la referencia remota de la rama tras publicar; no se puede inscribir su propio SHA dentro del commit.',
  'Evidence completos: entries/<code>.json; checkpoints: checkpoints/<code>.json.',
  'Advertencias: '+p.warnings.join(' '),
  'Pendientes siguientes: '+(codes.length?codes.join(', '):'Ninguno; ejecutar validación completa 25/25.'),
  'Siguiente comando: MLS R4.1 continuar reserva #1872 — bloque '+(p.nextBlock||'cierre')+'/05 con BCR. Recuperar solo el último Context Pack, Source Index, Delta, y los 5 artículos nuevos. SIN nueva reserva, sin sync anticipada.'
 ].join('\n')+'\n';
}
function bootstrap({manifest,chunk,progress,sourceRegistry,parentCommit}){
 verifyChunk(chunk,manifest,{expectedBlock:1});
 const codes=Object.keys(chunk.entries),a=allocation(manifest);
 assert(progress?.chunk===1&&progress.checkpointed===5&&
  same(progress.completedCodes,codes)&&same(progress.pendingCodes,a.units.slice(5).map(u=>u.code))&&
  progress.chunkHash===chunk.chunkHash&&same(progress.checkpointHashes,
   Object.values(chunk.checkpoints).map(c=>({code:c.code,entrySha:c.entrySha}))),'BOOTSTRAP_PROGRESS_CONFLICT');
 const idx=updateIndex(null,Object.values(chunk.entries),sourceRegistry);
 const pack=context({manifest,progress,index:idx,priorCommit:parentCommit,chunk});
 const delta=makeDelta({pack,chunk,index:idx,previousCommit:parentCommit});
 verifyState({pack,index:idx,manifest,progress,sourceRegistry});
 return {recipe:RECIPE,pack,index:idx,delta,handoff:handoff(pack,delta),progress,
  files:metadataFiles({recipe:RECIPE,pack,index:idx,delta,handoff:handoff(pack,delta)})};
}
function metadataFiles(state){
 const n=String(state.delta.block).padStart(2,'0');
 return [
 {path:'bcr/recipe.json',value:state.recipe},
 {path:'bcr/context-pack.json',value:state.pack},
 {path:'bcr/source-index.json',value:state.index},
 {path:'bcr/deltas/block-'+n+'.json',value:state.delta},
 {path:'bcr/handoff.md',value:state.handoff}
 ];
}
function advance({manifest,pack,index,progress,chunk,sourceRegistry,expectedParentCommit}){
 verifyState({pack,index,manifest,progress,sourceRegistry});
 assert(validSha(expectedParentCommit),'REMOTE_PARENT_REQUIRED');
 if(chunk.chunk===pack.lastPersistedBlock){
  assert(chunk.chunkHash===pack.lastChunkHash,'REPLAY_CONFLICT');
  return {replayed:true,pack,index,progress,files:[]};
 }
 assert(chunk.chunk===pack.nextBlock,'BLOCK_ORDER_INVALID');
 verifyChunk(chunk,manifest,{expectedBlock:pack.nextBlock});
 const old=progress.completedCodes,now=Object.keys(chunk.entries),assigned=allocation(manifest).units.map(u=>u.code);
 assert(same(now,assigned.slice(old.length,old.length+5)),'UNASSIGNED_BLOCK');
 const nextIndex=updateIndex(index,Object.values(chunk.entries),sourceRegistry);
 const p={...progress,chunk:chunk.chunk,checkpointed:old.length+5,
  completedCodes:[...old,...now],pendingCodes:assigned.slice(old.length+5),
  checkpointHashes:[...progress.checkpointHashes,...Object.values(chunk.checkpoints)
   .map(c=>({code:c.code,entrySha:c.entrySha}))],
  chunkHash:chunk.chunkHash,status:'PARTIAL_BUFFER_NOT_SEALED'};
 const nextPack=context({manifest,progress:p,index:nextIndex,priorHash:pack.stateHash,
  priorCommit:expectedParentCommit,chunk});
 const delta=makeDelta({pack:nextPack,chunk,priorPack:pack,oldIndex:index,
  index:nextIndex,previousCommit:expectedParentCommit});
 verifyState({pack:nextPack,index:nextIndex,manifest,progress:p,sourceRegistry});
 return {replayed:false,recipe:RECIPE,pack:nextPack,index:nextIndex,progress:p,delta,
  handoff:handoff(nextPack,delta),
  files:[...Object.entries(chunk.entries).map(([code,value])=>({path:'entries/'+code+'.json',value})),
   ...Object.entries(chunk.checkpoints).map(([code,value])=>({path:'checkpoints/'+code+'.json',value})),
   {path:'chunk-'+String(chunk.chunk).padStart(2,'0')+'-of-05.json',value:chunk},
   {path:'progress.json',value:p},...metadataFiles({recipe:RECIPE,pack:nextPack,index:nextIndex,delta,handoff:handoff(nextPack,delta)})]};
}
function next(pack,index){
 assert(pack.stateHash===packHash(pack)&&pack.recipeHash===RECIPE_HASH,'CONTEXT_INVALID');
 assert(index.schema===INDEX_SCHEMA&&core.hash(index)===pack.sourceIndexHash,'SOURCE_INDEX_CORRUPT');
 return {reservationId:pack.reservationId,block:pack.nextBlock,codes:pack.pendingCodes.slice(0,5),
  existingSourceHints:Object.values(index.sources).map(x=>({id:x.sourceId,title:x.title,
    citationKey:x.bibliographicKey,passages:x.passages.map(p=>p.locator),
    autoVerifyNewClaims:false})),confirmedParent:pack.previousConfirmedCommit,
  pendingReadback:true,packHash:pack.stateHash,recipeHash:RECIPE_HASH};
}
function canSeal({pack,manifest,checkpoints,assessments}){
 const a=allocation(manifest);
 if(pack.completedCodes.length!==25||pack.pendingCodes.length||pack.lastPersistedBlock!==5)return false;
 if(!same(pack.completedCodes,a.units.map(u=>u.code)))return false;
 return pack.checkpointRefs.every(ref=>checkpoints[ref.code]?.entrySha===ref.entrySha&&
  assessments[ref.code]?.ok===true&&assessments[ref.code]?.canonicalR33===true);
}
function exportUnconfirmed({pack,files,reason}){
 return {schema:'MLS-R4.1-BCR-UNCONFIRMED-1',reservationId:pack.reservationId,
  packHash:pack.stateHash,reason,remotePersisted:false,transferRequired:true,
  noSuccessClaim:true,files};
}
async function commitOptimistic({expectedHead,readHead,writeGrouped,files,metrics={}}){
 assert(validSha(expectedHead),'EXPECTED_REMOTE_SHA');
 const before=await readHead();metrics.remoteReads=(metrics.remoteReads||0)+1;
 assert(before===expectedHead,'CONCURRENT_REMOTE_EDIT');
 let result;
 try{metrics.remoteWrites=(metrics.remoteWrites||0)+1;result=await writeGrouped(files,expectedHead);}
 catch(e){
  if(e.status===403||e.status===429||e.code==='SECONDARY_RATE_LIMIT'){
   const err=new Error('BCR_REMOTE_LIMIT_STOP_NO_RETRY');err.code='BCR_REMOTE_LIMIT_STOP_NO_RETRY';
   err.status=e.status;err.persisted=false;err.transferRequired=true;throw err;
  }
  throw e;
 }
 assert(validSha(result?.sha),'REMOTE_COMMIT_UNCONFIRMED');
 const after=await readHead();metrics.remoteReads++;
 assert(after===result.sha,'REMOTE_READBACK_NOT_CONFIRMED');
 metrics.commits=(metrics.commits||0)+1;
 return {persisted:true,commitSha:result.sha,metrics};
}
module.exports={VERSION,RECIPE,RECIPE_HASH,PACK_SCHEMA,INDEX_SCHEMA,DELTA_SCHEMA,
 packHash,verifyChunk,verifyState,bibliography,updateIndex,bootstrap,advance,
 next,canSeal,exportUnconfirmed,commitOptimistic,metadataFiles,handoff};
