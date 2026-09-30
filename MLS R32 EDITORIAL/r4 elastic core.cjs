'use strict';
// R4.2 additive, chat-disposable BCR scheduling contracts. GitHub remains authoritative.
// The Scheduler, not a chat, is the only allocator. Never certifies Evidence by reuse.
const buffered=require('./r4 buffered allocation.cjs');
const bcr=require('./r4 buffered context.cjs');
const core=require('./r4 buffered core.cjs');
const dispatcherCore=require('./global dispatcher/core.js');
const REQUEST_MARKER='MLS_BCR_ELASTIC_COMMAND';
const STATUS_MARKER='MLS_BCR_ELASTIC_CLAIM';
const VERSION=1;
// Fifty isolated BCR leases across independent 25-entry reservations; Actions stays serialized.
// Bound each scheduler tick and reserve creation separately to avoid burst writes.
const BLOCK_SIZE=5, BLOCKS=5, MAX_ACTIVE=50, MAX_REQUESTS_PER_TICK=10;
const MAX_NEW_RESERVATIONS_PER_TICK=2, MAX_MAINTENANCE_PER_TICK=2;
const TTL_MS=5*60*1000;
function fail(code,msg){const e=new Error(msg||code);e.code=code;e.status=409;throw e;}
function assert(ok,code){if(!ok)fail(code);}
function marked(text,key){
 const m=[...String(text||'').matchAll(new RegExp('<!--\\s*'+key+'\\s*\\n([\\s\\S]*?)\\n-->','g'))];
 assert(m.length===1,'R42_MARKER_CARDINALITY');
 try{return JSON.parse(m[0][1]);}catch{fail('R42_MARKER_JSON');}
}
function command(issue){
 assert(buffered.requestAuthorized(issue),'R42_REQUEST_OWNER_REQUIRED');
 const x=marked(issue.body,REQUEST_MARKER);
 assert(x?.kind==='mls_bcr_elastic_command'&&x.version===VERSION &&
 /^[A-Za-z0-9._:-]{8,120}$/.test(x.requestId||''),'R42_REQUEST_INVALID');
 const title=String(issue.title||'');
 if(x.action==='next')assert(title.startsWith('[MLS Dispatcher][BCR][REQUEST]'),'R42_REQUEST_TITLE');
 else if(x.action==='renew'){
  assert(title.startsWith('[MLS Dispatcher][BCR][RENEW]') &&
   Number.isSafeInteger(x.claimIssueNumber)&&x.claimIssueNumber>0 &&
   Number.isSafeInteger(x.reservationIssueNumber)&&x.reservationIssueNumber>0 &&
   Number.isSafeInteger(x.block)&&((x.task==='repair'&&x.block===0)||(!x.task&&x.block>=1&&x.block<=BLOCKS)),
   'R42_RENEW_INVALID');
 }
 else if(x.action==='complete'){
  assert(title.startsWith('[MLS Dispatcher][BCR][COMPLETE]') &&
   Number.isSafeInteger(x.claimIssueNumber)&&x.claimIssueNumber>0 &&
   Number.isSafeInteger(x.reservationIssueNumber)&&x.reservationIssueNumber>0 &&
   Number.isSafeInteger(x.block)&&((x.task==='repair'&&x.block===0)||(!x.task&&x.block>=1&&x.block<=BLOCKS)) &&
   /^[a-f0-9]{40}$/.test(x.headSha||''),'R42_COMPLETE_INVALID');
 }else fail('R42_ACTION_UNSUPPORTED');
 return x;
}
function renderCommand(command){return dispatcherCore.renderMarked(REQUEST_MARKER,command);}
function preblock(res,recipe,rootSha){
 const allocation=res.allocation,codes=allocation.units.map(u=>u.code);
 assert(codes.length===25&&new Set(codes).size===25&&allocation.baseCommit===rootSha,
  'R42_ALLOCATION_NOT_25');
 const manifest={schema:core.SCHEMA,allocation,allocationHash:res.allocationHash,
  authority:'REMOTE_RECONCILIATION_PENDING'};
 const progress={schema:'MLS-R4.1-PROGRESS-1',issueNumber:res.issueNumber,
  assignmentId:allocation.assignmentId,allocationHash:manifest.allocationHash,
  chunk:0,totalChunks:BLOCKS,assigned:25,checkpointed:0,completedCodes:[],
  pendingCodes:codes,checkpointHashes:[],chunkHash:null,status:'PARTIAL_BUFFER_NOT_SEALED',
  noPackageUntilAll25:true,noInBoxSyncYet:true,noIndividualEntryCommits:true,
  review:{type:'ai',humanReviewed:false}};
 const index={schema:bcr.INDEX_SCHEMA,version:1,sources:{}};
 const pack={schemaVersion:bcr.PACK_SCHEMA,reservationId:allocation.assignmentId,
  issueNumber:res.issueNumber,batchSize:25,blockSize:BLOCK_SIZE,
  recipeVersion:bcr.VERSION,recipeHash:bcr.RECIPE_HASH,allocationRef:'manifest.json',
  allocationHash:manifest.allocationHash,allocationBaseCommit:rootSha,
  contentManifestBlobSha:allocation.contentManifestBlobSha,completedCodes:[],pendingCodes:codes,
  currentBlock:0,lastPersistedBlock:0,nextBlock:1,checkpointRefs:[],
  progressRef:'progress.json',progressHash:core.hash(progress),
  sourceIndexRef:'bcr/source-index.json',sourceIndexHash:core.hash(index),
  lastDeltaRef:'bcr/deltas/block-00.json',previousContextHash:null,
  previousConfirmedCommit:rootSha,commitConfirmation:'REQUIRES_REMOTE_REF_READBACK',
  lastChunkHash:null,conventions:['R33+APA7 per-entry','context is hints, not verification',
   '25/25 required to seal','do not rewrite existing checkpoints','no Cloudflare or paid services'],
  warnings:['Claimed VERIFIED in a partial chunk is NOT final canonical R33 certification.'],
  openTasks:['Produce next 5 only','Canonical R33 independently for each entry'],
  metrics:{checkpointed:0,sourceRegistryItems:0,contextReused:false,fullArticleBodiesInPack:0}};
 pack.stateHash=bcr.packHash(pack);
 const delta={schemaVersion:bcr.DELTA_SCHEMA,reservationId:allocation.assignmentId,block:0,
  codes:[],checkpointHashes:[],newSourceIds:[],reusedSourceIds:[],verifiedInherited:0,
  sourceVerificationPendingPerEntry:true,priorContextHash:null,newContextHash:pack.stateHash,
  previousConfirmedCommit:rootSha,gitCommitStatus:'PENDING_REF_READBACK',newCommitSha:null,
  incidents:[],nextBlock:1};
 delta.deltaHash=core.hash(delta);
 const plan={schema:'MLS-R4.1-BCR-BLOCK-PLAN-1',reservationId:pack.reservationId,
  issueNumber:res.issueNumber,allocationHash:manifest.allocationHash,
  origin:'SERIAL_DISPATCHER_ELASTIC',baseCommit:rootSha,totalBlocks:5,blockSize:5,
  blocks:Array.from({length:5},(_,i)=>({block:i+1,codes:codes.slice(i*5,(i+1)*5),
   state:'PENDING',academicVerification:'PER_ENTRY_REQUIRED',checkpointed:0})),
  noPreassignedArticleClaims:true,noSourceVerificationInherited:true,noSealBefore25:true};
 const handoff=['# MLS R4.2 elastic BCR handoff','',
  'Reserva: #'+res.issueNumber+'; estado inicial 0/25, sin Evidence heredado.',
  'AllocationHash: '+manifest.allocationHash,'ContextHash: '+pack.stateHash,
  'Los chats son descartables: usar siempre MLS BCR siguiente. El Dispatcher adjudica un bloque exclusivo.',
  'Los cinco bloques pertenecen a ramas independientes; ningún worker edita el Context Pack central.',
  'Gate R33 individual, APA7, source references reales, FREE ONLY, no OpenAI API, sin Cloudflare.'
 ].join('\n')+'\n';
 assert(bcr.verifyState({pack,index,manifest,progress,sourceRegistry:{}})===true,'R42_BOOTSTRAP_INVALID');
 const dir='r41-buffer/'+res.issueNumber+'/';
 const files=[
 {path:dir+'manifest.json',value:manifest},{path:dir+'progress.json',value:progress},
 {path:dir+'bcr/recipe.json',value:recipe},{path:dir+'bcr/context-pack.json',value:pack},
 {path:dir+'bcr/source-index.json',value:index},{path:dir+'bcr/deltas/block-00.json',value:delta},
 {path:dir+'bcr/block-plan.json',value:plan},{path:dir+'bcr/handoff.md',value:handoff}];
 return {manifest,progress,index,pack,plan,files};
}
function blocks(res){
 assert(res.status==='reserved'&&!res.stage,'R42_RESERVATION_NOT_PENDING');
 if(res.elastic){
  assert(res.elastic.schema==='MLS-R4.2-ELASTIC-1'&&Array.isArray(res.elastic.blocks)&&
   res.elastic.blocks.length===5&&res.elastic.blocks.every((b,i)=>b.block===i+1 &&
    ['pending','leased','done'].includes(b.status)&&
    core.hash(b.codes)===core.hash(res.allocation.units.slice(i*5,i*5+5).map(u=>u.code))),'R42_STATE_INVALID');
  return structuredClone(res.elastic.blocks);
 }
 return Array.from({length:5},(_,i)=>({block:i+1,status:'pending',epoch:0,
  codes:res.allocation.units.slice(i*5,i*5+5).map(u=>u.code)}));
}
function withBlocks(res,rows,patch={}){
 const next={...res,elastic:{schema:'MLS-R4.2-ELASTIC-1',version:1,
  ...(res.elastic||{}),blocks:rows,...patch}};
 return {...next,recordHash:buffered.recordHash(next)};
}
function activeCount(reservations,now=Date.now()){
 return reservations.flatMap(r=>r.elastic?.blocks||[]).filter(b=>
  b.status==='leased'&&Date.parse(b.expiresAt)>now).length;
}
function freeBlock(reservations,now=Date.now()){
 const candidates=[];
 for(const res of reservations.slice().sort((a,b)=>a.issueNumber-b.issueNumber)){
  if(res.status!=='reserved'||res.stage||res.elastic?.consolidatedSha)continue;
  for(const block of blocks(res)){
   if(block.status==='pending'||(block.status==='leased'&&Date.parse(block.expiresAt)<=now)){
    candidates.push({reservation:res,block,recovery:Boolean(block.recovery)||block.status==='leased'});
   }
  }
 }
 return candidates.find(x=>x.recovery)||candidates[0]||null;
}
function lease(res,block,issue,{branch,baseSha,now=Date.now(),workerLogin=null}){
 assert(block.status==='pending'||(block.status==='leased'&&Date.parse(block.expiresAt)<=now),
  'R42_BLOCK_ALREADY_LEASED');
 assert(/^[a-f0-9]{40}$/.test(baseSha||'') &&
  branch==='r42/work/'+res.issueNumber+'/'+String(block.block).padStart(2,'0')+'/'+issue.number,
  'R42_LEASE_BRANCH');
 const rows=blocks(res),previous=rows[block.block-1];
 assert(previous&&previous.epoch===block.epoch&&previous.status===block.status&&
  (previous.status==='pending'||(previous.status==='leased'&&Date.parse(previous.expiresAt)<=now)),
  'R42_BLOCK_ALREADY_LEASED');
 const record={...previous,status:'leased',epoch:issue.number,claimIssueNumber:issue.number,
  workerLogin:String(workerLogin||issue.user?.login||''),requestId:command(issue).requestId,
  branch,baseSha,leasedAt:new Date(now).toISOString(),expiresAt:new Date(now+TTL_MS).toISOString(),
  priorRecovery:previous.status==='leased'?{branch:previous.branch,baseSha:previous.baseSha,
   claimIssueNumber:previous.claimIssueNumber}:null};
 rows[block.block-1]=record;
 return {reservation:withBlocks(res,rows),claim:{
  kind:'mls_bcr_elastic_claim',version:VERSION,status:'leased',
  reservationIssueNumber:res.issueNumber,assignmentId:res.allocation.assignmentId,
  allocationHash:res.allocationHash,block:block.block,codes:record.codes,
  claimIssueNumber:issue.number,leaseEpoch:issue.number,branch,baseSha,workerLogin:record.workerLogin,
  expiresAt:record.expiresAt,sourceCommit:res.allocation.baseCommit,checkpointSizeMax:1,
  noSealNoSyncNoCloudflare:true,reviewType:'ai',humanReviewed:false}};
}
function markDone(res,block,claim,headSha,chunkHash){
 assert(block.status==='leased'&&block.claimIssueNumber===claim&&
 /^[a-f0-9]{40}$/.test(headSha||'')&&/^[a-f0-9]{64}$/.test(chunkHash||''),
 'R42_STALE_COMPLETION');
 const rows=blocks(res);rows[block.block-1]={...rows[block.block-1],
  status:'done',commitSha:headSha,chunkHash,completedAt:new Date().toISOString()};
 return withBlocks(res,rows);
}
function gitBlobJson(value){
 const s=JSON.stringify(value,null,2)+'\n',bytes=Buffer.from(s);
 const crypto=require('node:crypto');
 return crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
}
function validateChunkSubmission({manifest,block,chunk,changedFiles}){
 const verified=bcr.verifyChunk(chunk,manifest,{expectedBlock:block.block});
 assert(verified.codes.join('|')===block.codes.join('|'),'R42_BLOCK_CODE_DRIFT');
 const dir='r42-buffer/'+manifest.allocation.assignmentIssueNumber+'/blocks/'+
  String(block.block).padStart(2,'0')+'/';
 const expected=new Map();
 expected.set(dir+'chunk-'+String(block.block).padStart(2,'0')+'-of-05.json',gitBlobJson(chunk));
 for(const code of block.codes){
  const entry=chunk.entries[code],cp=chunk.checkpoints[code];
  assert(entry.review===null&&entry.provenance?.generatedWithAI===true &&
   entry.verification?.reviewerType==='chatgpt'&&
   (entry.claims||[]).length>=1&&(entry.links||[]).length>=1 &&
   entry.links.every(l=>entry.claims.some(c=>c.claimId===l.claimId)),
   'R42_ENTRY_PROVENANCE_OR_CLAIMS');
  expected.set(dir+'entries/'+code+'.json',gitBlobJson(entry));
  expected.set(dir+'checkpoints/'+code+'.json',gitBlobJson(cp));
 }
 assert(expected.size===11 && Array.isArray(changedFiles)&&changedFiles.length===11 &&
  changedFiles.every(f=>expected.get(f.filename)===f.sha&&['added','modified'].includes(f.status)),
  'R42_COMMIT_PATH_OR_BLOB_DRIFT');
 return {codes:block.codes,chunkHash:chunk.chunkHash,files:expected.size};
}
module.exports={VERSION,BLOCK_SIZE,BLOCKS,MAX_ACTIVE,MAX_REQUESTS_PER_TICK,
 MAX_NEW_RESERVATIONS_PER_TICK,MAX_MAINTENANCE_PER_TICK,TTL_MS,
 REQUEST_MARKER,STATUS_MARKER,command,renderCommand,preblock,blocks,withBlocks,
 activeCount,freeBlock,lease,markDone,gitBlobJson,validateChunkSubmission};

