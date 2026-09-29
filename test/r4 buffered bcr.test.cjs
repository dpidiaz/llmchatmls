'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const core=require('../MLS R32 EDITORIAL/r4 buffered core.cjs');
const bcr=require('../MLS R32 EDITORIAL/r4 buffered context.cjs');
const id='MLS-SRC-'+('A'.repeat(20));
const sha=n=>String(n).repeat(40),code=n=>'MLS-V10-'+String(n).padStart(4,'0');
const SOURCE={sourceId:id,registryBlobSha:sha('a'),metadata:{
 sourceType:'book',authorityTier:'A',status:'active',title:'Gramática de prueba',
 authors:['Institución editorial'],publicationYear:2009,publisher:'Editorial de prueba',
 isbn:'9788467032079',canonicalUrl:'https://example.edu/book',language:'es',
 topics:['gramática','cuantificación']}};
function fixture(){
 const allocation={allocatedBy:'global-dispatcher',assignmentId:'MLS-BUFFER-009172',
 assignmentIssueNumber:9172,leaseEpoch:9172,poolId:'TEST',manifestVersion:'1.0',
 baseCommit:sha('b'),contentManifestBlobSha:sha('c'),
 units:Array.from({length:25},(_,i)=>({code:code(5000+i),language:'espanol-guatemala',
 contentPath:'content/espanol-guatemala/'+code(5000+i)+'.json',
 evidenceArtifactPath:'MLS R32 EDITORIAL/evidence git/entries/espanol-guatemala/'+code(5000+i)+'.json'}))};
 const manifest={schema:core.SCHEMA,allocation,allocationHash:core.hash(allocation),
 authority:'REMOTE_RECONCILIATION_PENDING'};
 return {manifest,sourceRegistry:{[id]:structuredClone(SOURCE)}};
}
function chunk(f,block,{partial=false,foreign=false}={}){
 const units=f.manifest.allocation.units.slice((block-1)*5,block*5),entries={},checkpoints={};
 for(const u of (partial?units.slice(0,3):units)){
  const c=foreign?'MLS-V10-9999':u.code;
  const claimId='MLS-CLM-'+c,linkId='MLS-LNK-'+c;
  const entry={schemaVersion:'1.0',architecture:'github-native',code:c,language:u.language,
   contentPath:u.contentPath,status:'VERIFIED',article:{code:c,articleHash:'a'.repeat(64)},
   claims:[{claimId,sectionKey:'En pocas palabras',summary:'Example grammatical claim',materiality:'substantial'}],
   links:[{linkId,claimId,sourceId:id,supportType:'supports',locator:{section:'19.2a',url:'https://example.edu/book#19.2a'}}],
   conflicts:[],verification:{verifiedAt:'2026-09-29T01:00:00Z'},review:null};
  entries[c]=entry;
  checkpoints[c]={schema:core.SCHEMA,code:c,entrySha:core.hash(entry),
   evidenceArtifactPath:u.evidenceArtifactPath,allocationHash:f.manifest.allocationHash,
   assessment:'PENDING_CANONICAL_R33_VALIDATION',claimedStatus:'VERIFIED'};
 }
 const unsigned={schema:'MLS-R4.1-PARTIAL-EXPORT-1',issueNumber:9172,
 assignmentId:'MLS-BUFFER-009172',allocationHash:f.manifest.allocationHash,
 chunk:block,totalChunks:5,manifest:f.manifest,entries,checkpoints,
 policy:{complete:false,sealAllowed:false}};
 return {...unsigned,chunkHash:core.hash(unsigned)};
}
function progress(f,c){
 return {schema:'MLS-R4.1-PROGRESS-1',issueNumber:9172,assignmentId:'MLS-BUFFER-009172',
 allocationHash:f.manifest.allocationHash,chunk:1,totalChunks:5,assigned:25,checkpointed:5,
 completedCodes:Object.keys(c.entries),pendingCodes:f.manifest.allocation.units.slice(5).map(u=>u.code),
 checkpointHashes:Object.values(c.checkpoints).map(p=>({code:p.code,entrySha:p.entrySha})),
 chunkHash:c.chunkHash,status:'PARTIAL_BUFFER_NOT_SEALED'};
}
function started(){
 const f=fixture(),first=chunk(f,1),p=progress(f,first);
 return {...f,first,initial:bcr.bootstrap({manifest:f.manifest,chunk:first,progress:p,
 sourceRegistry:f.sourceRegistry,parentCommit:sha('b')})};
}
function second(x){
 return bcr.advance({manifest:x.manifest,pack:x.initial.pack,index:x.initial.index,
 progress:x.initial.progress,chunk:chunk(x,2),sourceRegistry:x.sourceRegistry,
 expectedParentCommit:sha('d')});
}
test('T01 first block deterministically initializes fixed recipe and compact context',()=>{
 const x=started(),p=x.initial.pack;
 assert.equal(p.schemaVersion,bcr.PACK_SCHEMA);
 assert.equal(p.recipeHash,bcr.RECIPE_HASH);
 assert.equal(p.lastPersistedBlock,1);assert.equal(p.nextBlock,2);
 assert.equal(p.completedCodes.length,5);assert.equal(p.pendingCodes.length,20);
 assert.equal(p.stateHash,bcr.packHash(p));
 assert.equal(x.initial.files.length,5);
 assert.ok(x.initial.files.some(z=>z.path==='bcr/handoff.md'));
});
test('T02 later blocks resume from the pack, delta and index without old complete articles',()=>{
 const x=started(),plan=bcr.next(x.initial.pack,x.initial.index),r=second(x);
 assert.equal(plan.block,2);assert.deepEqual(plan.codes,x.manifest.allocation.units.slice(5,10).map(u=>u.code));
 assert.equal(r.pack.completedCodes.length,10);assert.equal(r.pack.previousContextHash,x.initial.pack.stateHash);
 assert.equal(r.delta.priorContextHash,x.initial.pack.stateHash);
 assert.ok(JSON.stringify(r.pack).length<12000);
 assert.equal(r.pack.metrics.fullArticleBodiesInPack,0);
 assert.equal(r.progress.checkpointed,10);assert.equal(r.files.filter(z=>z.path.startsWith('entries/')).length,5);
});
test('T03 source re-use never automatically promotes new claims to VERIFIED',()=>{
 const x=started(),r=second(x),source=Object.values(r.index.sources)[0];
 assert.equal(source.entryVerificationInherited,false);
 assert.equal(r.delta.verifiedInherited,0);
 assert.equal(r.delta.sourceVerificationPendingPerEntry,true);
 assert.equal(r.pack.checkpointRefs.length,10);
 assert.ok(r.pack.checkpointRefs.every(z=>z.assessment==='PENDING_CANONICAL_R33_VALIDATION'));
 assert.equal(bcr.canSeal({pack:r.pack,manifest:x.manifest,checkpoints:{},assessments:{}}),false);
});
test('T04 five checkpoint files can be committed in one optimistic grouped write',async()=>{
 const x=started(),r=second(x),before=sha('d'),after=sha('e');
 let reads=0,writes=0,groupedFiles=0;
 const metrics={},out=await bcr.commitOptimistic({expectedHead:before,metrics,files:r.files,
 readHead:async()=>++reads===1?before:after,
 writeGrouped:async files=>{writes++;groupedFiles=files.length;return {sha:after};}});
 assert.equal(writes,1);assert.equal(metrics.commits,1);assert.equal(metrics.remoteReads,2);
 assert.equal(out.commitSha,after);assert.equal(groupedFiles,5+5+1+1+5);
});
test('T05 repeated confirmed block replays idempotently, never duplicates entries',()=>{
 const x=started(),r=second(x);
 const replay=bcr.advance({manifest:x.manifest,pack:r.pack,index:r.index,progress:r.progress,
  chunk:chunk(x,2),sourceRegistry:x.sourceRegistry,expectedParentCommit:sha('e')});
 assert.equal(replay.replayed,true);assert.deepEqual(replay.files,[]);
 assert.equal(replay.pack.completedCodes.length,10);
});
test('T06 partial crash cannot erase existing completed checkpoints',()=>{
 const x=started(),damaged=chunk(x,2,{partial:true});
 assert.throws(()=>bcr.advance({manifest:x.manifest,pack:x.initial.pack,
 index:x.initial.index,progress:x.initial.progress,chunk:damaged,sourceRegistry:x.sourceRegistry,
 expectedParentCommit:sha('d')}),e=>e.code==='BCR_CHUNK_INCOMPLETE');
 assert.equal(x.initial.pack.completedCodes.length,5);assert.equal(x.initial.progress.checkpointed,5);
});
test('T07 one HTTP 403 stops without retry and flags local export as unconfirmed',async()=>{
 const x=started(),r=second(x);let writes=0,reads=0;
 await assert.rejects(bcr.commitOptimistic({expectedHead:sha('d'),files:r.files,
 readHead:async()=>{reads++;return sha('d');},
 writeGrouped:async()=>{writes++;const err=new Error('secondary');err.status=403;throw err;}}),
 e=>e.code==='BCR_REMOTE_LIMIT_STOP_NO_RETRY'&&!e.persisted&&e.transferRequired);
 assert.equal(writes,1);assert.equal(reads,1);
 const exp=bcr.exportUnconfirmed({pack:r.pack,files:r.files,reason:'HTTP 403'});
 assert.equal(exp.remotePersisted,false);assert.equal(exp.transferRequired,true);
});
test('T08 optimistic concurrency rejects a changed ref before any write',async()=>{
 const x=started();let writes=0;
 await assert.rejects(bcr.commitOptimistic({expectedHead:sha('d'),
 readHead:async()=>sha('e'),files:second(x).files,
 writeGrouped:async()=>{writes++;return {sha:sha('f')};}}),e=>e.code==='BCR_CONCURRENT_REMOTE_EDIT');
 assert.equal(writes,0);
});
test('T09 recipe/schema and source registry changes invalidate context',()=>{
 const x=started(),p=structuredClone(x.initial.pack);
 p.recipeHash=sha('a');p.stateHash=bcr.packHash(p);
 assert.throws(()=>bcr.verifyState({pack:p,index:x.initial.index,manifest:x.manifest,
 progress:x.initial.progress,sourceRegistry:x.sourceRegistry}),e=>e.code==='BCR_EDITORIAL_RECIPE_STALE');
 const altered=structuredClone(x.sourceRegistry);altered[id].metadata.publisher='Changed publisher';
 assert.throws(()=>bcr.verifyState({pack:x.initial.pack,index:x.initial.index,manifest:x.manifest,
 progress:x.initial.progress,sourceRegistry:altered}),e=>e.code==='BCR_SOURCE_CONTEXT_STALE');
});
test('T10 cannot seal an incomplete batch or 25 without individually passed canonical R33',()=>{
 const x=started(),p=x.initial.pack;
 assert.equal(bcr.canSeal({pack:p,manifest:x.manifest,checkpoints:{},assessments:{}}),false);
 let state=x.initial;for(let i=2;i<=5;i++){
   const r=bcr.advance({manifest:x.manifest,pack:state.pack,index:state.index,
    progress:state.progress,chunk:chunk(x,i),sourceRegistry:x.sourceRegistry,
    expectedParentCommit:sha(String(i))});
   state=r;
 }
 assert.equal(state.pack.completedCodes.length,25);
 const cp=Object.fromEntries(state.pack.checkpointRefs.map(x=>[x.code,{entrySha:x.entrySha}]));
 assert.equal(bcr.canSeal({pack:state.pack,manifest:x.manifest,checkpoints:cp,assessments:{}}),false);
 const assessed=Object.fromEntries(state.pack.completedCodes.map(c=>[c,{ok:true,canonicalR33:true}]));
 assert.equal(bcr.canSeal({pack:state.pack,manifest:x.manifest,checkpoints:cp,assessments:assessed}),true);
});
test('T11 BCR is additive: legacy R4 worker and ordinary R4.1 core are not modified',()=>{
 const legacy=fs.readFileSync(path.join(__dirname,'../scripts/MLS global dispatcher worker.cjs'),'utf8');
 const old=fs.readFileSync(path.join(__dirname,'../MLS R32 EDITORIAL/r4 buffered core.cjs'),'utf8');
 assert.doesNotMatch(legacy,/r4 buffered context\.cjs/);
 assert.match(old,/function checkpoint\(d,e\)/);
 assert.match(old,/function inspect\(d\)/);
 assert.equal(bcr.RECIPE.selection.includes('ordinary MLS siguiente keeps legacy R4'),true);
});
test('T12 BCR requires no paid API, Cloudflare editorial task or D1 service',()=>{
 const moduleSource=fs.readFileSync(path.join(__dirname,'../MLS R32 EDITORIAL/r4 buffered context.cjs'),'utf8');
 const cliSource=fs.readFileSync(path.join(__dirname,'../scripts/R4-1-bcr.cjs'),'utf8');
 assert.doesNotMatch(moduleSource+cliSource,/api\.openai\.com|apiKey|CLOUDFLARE_API_TOKEN|D1_DATABASE/);
 assert.doesNotMatch(moduleSource+cliSource,/https\.request|fetch\(/);
 assert.match(bcr.RECIPE.operation,/FREE ONLY/);
});
test('T13 compact recovery preserves provenance and separate claim/locator references',()=>{
 const x=started(),r=second(x),src=Object.values(r.index.sources)[0];
 assert.equal(src.usedBy.length,10);assert.equal(src.passages.length,1);
 assert.equal(src.sourceId,id);
 assert.equal(src.registryBlobSha,SOURCE.registryBlobSha);
 assert.equal(r.pack.sourceIndexHash,core.hash(r.index));
 assert.doesNotMatch(JSON.stringify(r.pack),/Example grammatical claim/);
 assert.equal(Object.values(r.index.sources).every(z=>z.usedBy.every(u=>u.claimId&&u.locatorHash)),true);
});
test('T14 an exportable package is not claimed as GitHub-persisted until ref readback',async()=>{
 const x=started(),r=second(x),e=bcr.exportUnconfirmed({pack:r.pack,files:r.files,reason:'offline'});
 assert.equal(e.remotePersisted,false);assert.equal(e.noSuccessClaim,true);
 assert.equal(e.transferRequired,true);assert.equal(e.packHash,r.pack.stateHash);
 let count=0;
 await assert.rejects(bcr.commitOptimistic({expectedHead:sha('d'),files:r.files,
 readHead:async()=>{count++;return count===1?sha('d'):sha('f');},
 writeGrouped:async()=>({sha:sha('e')})}),e=>e.code==='BCR_REMOTE_READBACK_NOT_CONFIRMED');
});
