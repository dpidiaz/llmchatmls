'use strict';
// Executes the canonical validators. Source-review records are attestations by a
// chat, never a claim that this deterministic program read external literature.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const core=require('./r4 buffered core.cjs');
const academic=require('./r4 buffered academic.cjs');
const sync=require('./r4 buffered sync.cjs');
const bcr=require('./r4 buffered context.cjs');
function assert(ok,code){if(!ok)core.error(code);}
function git(root,...args){return cp.execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024,stdio:['ignore','pipe','pipe']}).trim();}
function readGit(root,sha,file){
 assert(/^[a-f0-9]{40}$/.test(sha),'UNIVERSAL_INVALID_SHA');
 assert(typeof file==='string'&&!file.startsWith('/')&&!file.includes('\\')&&!file.split('/').includes('..'),'UNIVERSAL_INVALID_PATH');
 assert(git(root,'ls-tree',sha,'--',file).startsWith('100644 blob '),'UNIVERSAL_NOT_REGULAR_BLOB');
 return JSON.parse(git(root,'show',sha+':'+file));
}
function reviewErrors(entry,review){
 const errors=[];
 if(review?.schema!=='MLS-BCR-SOURCE-REVIEW-1'||review.code!==entry.code||
    review.entryHash!==core.hash(entry)||review.reviewType!=='ai'||review.humanReviewed!==false||
    !Array.isArray(review.claims))return ['SOURCE_REVIEW_REQUIRED'];
 const substantial=(entry.claims||[]).filter(c=>(c.materiality||'substantial')==='substantial');
 if(new Set(review.claims.map(x=>x.claimId)).size!==review.claims.length)errors.push('SOURCE_REVIEW_DUPLICATE');
 for(const claim of substantial){
  const rows=review.claims.filter(x=>x.claimId===claim.claimId);
  const row=rows[0],link=(entry.links||[]).find(l=>l.linkId===row?.linkId&&l.claimId===claim.claimId);
  if(rows.length!==1||!link||row.sourceId!==link.sourceId||row.locatorHash!==core.hash(link.locator)||
    row.verdict!=='supported'||typeof row.rationale!=='string'||row.rationale.trim().length<30||
    !/^https:\/\//.test(row.sourceUrl||'')||(link.locator?.url&&row.sourceUrl!==link.locator.url)||
    !Number.isFinite(Date.parse(row.accessedAt||''))||Date.parse(row.accessedAt)>Date.now())
   errors.push('SOURCE_REVIEW_INCOMPLETE:'+claim.claimId);
 }
 return errors;
}
async function assessEntry(root,entry,review){
 const row={code:entry.code,entryHash:core.hash(entry),canonical:false,academic:false,
  sourceReviewRecorded:false,errors:[]};
 try{
  const article=core.read(path.join(root,entry.contentPath));
  const a=academic.inspect(entry,article);row.academic=a.ok;row.errors.push(...a.errors);
  assert(entry.review===null&&entry.provenance?.generatedWithAI===true,'AI_ONLY_PROVENANCE_REQUIRED');
  try{const c=await sync.canonicalAssessment(root,entry);row.canonical=c.ok;
   row.derivedStatus=c.derivedStatus;row.claimsVerified=c.claimsVerified;
  }catch(e){row.errors.push('R33:'+(e.code||e.message));}
  const re=reviewErrors(entry,review);row.sourceReviewRecorded=re.length===0;row.errors.push(...re);
 }catch(e){row.errors.push(e.code||e.message);}
 row.ok=row.canonical&&row.academic&&row.sourceReviewRecorded&&row.errors.length===0;
 return row;
}
async function assessBuffer(root,dir,{bufferSha,canonicalSha=git(root,'rev-parse','HEAD'),reviews={}}={}){
 const out={schema:'MLS-BCR-UNIVERSAL-GATE-1',bufferSha,canonicalSha,entries:[],errors:[],
  externalSourcesReadByAutomation:false,sourceReviewScope:'Recorded AI source-to-claim decisions; not a new semantic review',
  sealed:false,synced:false,status:'BLOCKED'};
 try{
  const m=core.manifest(dir),state=core.inspect(dir);out.allocationHash=m.allocationHash;
  assert(m.allocation.units.length===25,'GATE_REQUIRES_25');
  assert(state.completed.length===25&&!state.missing.length&&!state.invalid.length&&!state.orphans.length,'CHECKPOINT_INTEGRITY_FAILED');
  assert(git(root,'rev-parse','HEAD:content/manifest.json')===m.allocation.contentManifestBlobSha,'CORPUS_MANIFEST_DRIFT');
  const ids=new Set();
  for(const u of m.allocation.units){
   const entry=core.read(core.ef(dir,u.code));
   const row=await assessEntry(root,entry,reviews[u.code]);
   for(const id of [...(entry.claims||[]).map(c=>c.claimId),...(entry.links||[]).map(l=>l.linkId)]){
    if(ids.has(id)){row.errors.push('DUPLICATE_ID:'+id);row.ok=false;}ids.add(id);
   }
   out.entries.push(row);
  }
 }catch(e){out.errors.push(e.code||e.message);}
 out.passed=out.entries.filter(x=>x.ok).length;
 out.status=out.errors.length===0&&out.entries.length===25&&out.passed===25?'PASS':'BLOCKED';
 out.failedCodes=out.entries.filter(x=>!x.ok).map(x=>x.code);
 out.reportHash=core.hash(out);return out;
}
// Read only pinned JSON blobs; never execute code supplied on a worker branch.
async function materialize(root,res,dir){
 const sha=res.elastic.consolidatedSha,prefix='r41-buffer/'+res.issueNumber+'/';
 const m=readGit(root,sha,prefix+'manifest.json');
 assert(m.allocationHash===res.allocationHash&&core.hash(m.allocation)===res.allocationHash,'BUFFER_ALLOCATION_DRIFT');
 await core.init(dir,m.allocation);
 const reviews={},entries={};
 for(let block=1;block<=5;block++){
  const chunk=readGit(root,sha,prefix+'chunk-'+String(block).padStart(2,'0')+'-of-05.json');
  bcr.verifyChunk(chunk,m,{expectedBlock:block});
  assert(chunk.chunkHash===res.elastic.blocks[block-1].chunkHash,'CONSOLIDATED_CHUNK_DRIFT');
  for(const [code,entry] of Object.entries(chunk.entries)){
   assert(core.hash(readGit(root,sha,prefix+'entries/'+code+'.json'))===core.hash(entry),'BUFFER_ENTRY_DRIFT');
   assert(core.hash(readGit(root,sha,prefix+'checkpoints/'+code+'.json'))===core.hash(chunk.checkpoints[code]),'BUFFER_CHECKPOINT_DRIFT');
   entries[code]=entry;
  }
 }
 const index=readGit(root,sha,prefix+'bcr/source-index.json'),registry={};
 for(const id of Object.keys(index.sources)){
  assert(/^MLS-SRC-[A-F0-9]{20}$/.test(id),'SOURCE_ID_INVALID');
  const rel='MLS R32 EDITORIAL/evidence git/registry/sources/'+id+'.json';
  registry[id]={...core.read(path.join(root,rel)),registryBlobSha:git(root,'rev-parse','HEAD:'+rel)};
 }
 bcr.verifyState({manifest:m,index,pack:readGit(root,sha,prefix+'bcr/context-pack.json'),
  progress:readGit(root,sha,prefix+'progress.json'),sourceRegistry:registry});
 for(const u of m.allocation.units){
  const correction=res.universal?.corrections?.[u.code];
  if(correction){
   const base=correction.path;
   assert(/^r42-repair\/[0-9]+\/[0-9]+\/$/.test(base)&&base.startsWith('r42-repair/'+res.issueNumber+'/'),'REPAIR_PATH_INVALID');
   entries[u.code]=readGit(root,correction.sha,base+'entries/'+u.code+'.json');
   assert(core.hash(entries[u.code])===correction.entryHash,'REPAIR_HASH_CHANGED');
   const checkpoint=readGit(root,correction.sha,base+'checkpoints/'+u.code+'.json');
   assert(checkpoint.entrySha===correction.entryHash&&checkpoint.allocationHash===m.allocationHash&&checkpoint.code===u.code,'REPAIR_CHECKPOINT_INVALID');
   reviews[u.code]=readGit(root,correction.sha,base+'reviews/'+u.code+'.json');
  }
  await core.checkpoint(dir,entries[u.code]);
 }
 return {manifest:core.manifest(dir),reviews};
}
module.exports={git,readGit,assert,reviewErrors,assessEntry,assessBuffer,materialize};
