'use strict';
// Read-only execution of ACTUAL R33 + R4.1 validators against pinned #1872.
// No seal, package, SYNC, Cloudflare, paid API or checkpoint mutation.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const core=require('../MLS R32 EDITORIAL/r4 buffered core.cjs');
const bcr=require('../MLS R32 EDITORIAL/r4 buffered context.cjs');
const academic=require('../MLS R32 EDITORIAL/r4 buffered academic.cjs');
const sync=require('../MLS R32 EDITORIAL/r4 buffered sync.cjs');
const PIN='8c612b789d117c8cfecfd5e835b1227543cda546';
const ALLOCATION='ec604ddfe75078022f44603b7dba2a749c23b2e6cf83b6474f39daf601b619d1';
const BLOCK_PINS=['29b9ca4bd91a351093795c8ed53c134879e5b63e',
 'b0936da0356bd0ec1907d7affca6cac94a0665fb',
 '8cbb6aa4721a8f9243472388e3e6d5fc0f377d05',
 '868ed08bbeff69dd9de8f8ca012fe3afa922196c',PIN];
const assert=(ok,code)=>{if(!ok){const e=new Error(code);e.code=code;throw e;}};
const read=(dir,p)=>core.read(path.join(dir,p));
const git=(root,...args)=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const blob=(root,sha,file)=>git(root,'rev-parse',sha+':'+file);
function validateState(root,dir,expected=PIN){
 assert(expected===PIN,'BUFFER_PIN_MISMATCH');
 assert(git(root,'rev-parse','refs/remotes/origin/r41-bcr-1872')===PIN,'REMOTE_BUFFER_MOVED');
 const manifest=core.manifest(dir),a=manifest.allocation;
 assert(a.allocatedBy==='global-dispatcher'&&a.assignmentId==='MLS-BUFFER-001872'&&
  a.assignmentIssueNumber===1872&&a.units.length===25&&manifest.allocationHash===ALLOCATION,
  'ASSIGNMENT_INVALID');
 assert(blob(root,a.baseCommit,'content/manifest.json')===a.contentManifestBlobSha&&
  blob(root,'HEAD','content/manifest.json')===a.contentManifestBlobSha,
  'CANONICAL_CONTENT_MANIFEST_DRIFT');
 assert(!fs.existsSync(path.join(dir,'package.json')),'PREMATURE_SEAL');
 const status=core.inspect(dir);
 assert(!status.sealed&&status.completed.length===25&&!status.missing.length&&
  !status.invalid.length&&!status.orphans.length,'CHECKPOINT_INTEGRITY_NOT_25');
 const progress=read(dir,'progress.json'),pack=read(dir,'bcr/context-pack.json'),
  index=read(dir,'bcr/source-index.json'),integrity=read(dir,'bcr/integrity-25.json');
 const codes=a.units.map(u=>u.code);
 assert(progress.checkpointed===25&&progress.pendingCodes.length===0&&
  core.hash(progress.completedCodes)===core.hash(codes)&&
  pack.completedCodes.length===25&&pack.lastPersistedBlock===5&&
  pack.nextBlock===null&&pack.pendingCodes.length===0,'BCR_25_PROGRESS_MISMATCH');
 assert(integrity.reservationId===a.assignmentId&&integrity.allocationHash===ALLOCATION&&
  integrity.canonicalR33Passed===false&&integrity.gatePassed===false&&
  integrity.sealAllowed===false,'PREEXISTING_GATE_OR_SEAL');
 const registry={};
 for(const [id,source] of Object.entries(index.sources)){
  assert(/^MLS-SRC-[A-F0-9]{20}$/.test(id)&&source.entryVerificationInherited===false&&
   source.sourceStatus==='REGISTERED_REFERENCE_ONLY','INHERITED_VERIFICATION');
  const rel='MLS R32 EDITORIAL/evidence git/registry/sources/'+id+'.json';
  const old=blob(root,a.baseCommit,rel),current=blob(root,'HEAD',rel);
  assert(old===current&&old===source.registryBlobSha,'SOURCE_REGISTRY_DRIFT:'+id);
  registry[id]={...read(root,rel),registryBlobSha:current};
 }
 bcr.verifyState({pack,index,manifest,progress,sourceRegistry:registry});
 assert(core.hash(read(dir,'bcr/recipe.json'))===bcr.RECIPE_HASH,'RECIPE_MISMATCH');
 const rows=[],claimIds=new Set(),linkIds=new Set(),observedLinks=[];
 let priorHash=null;
 for(let block=1;block<=5;block++){
  const number=String(block).padStart(2,'0');
  const chunk=read(dir,'chunk-'+number+'-of-05.json');
  bcr.verifyChunk(chunk,manifest,{expectedBlock:block});
  assert(integrity.chunkHashes[block-1]?.hash===chunk.chunkHash,'CHUNK_HASH_DRIFT');
  const delta=read(dir,'bcr/deltas/block-'+number+'.json'),unsigned={...delta};
  delete unsigned.deltaHash;
  assert(delta.deltaHash===core.hash(unsigned)&&delta.block===block&&
   delta.priorContextHash===priorHash&&delta.verifiedInherited===0&&
   delta.sourceVerificationPendingPerEntry===true,'DELTA_CHAIN_INVALID');
  priorHash=delta.newContextHash;
  const report=block===1?null:read(dir,'bcr/source-review-block-'+number+'.json');
  if(report)assert(report.block===block&&report.reservationId===a.assignmentId&&
   report.mode==='AI_ONLY_PRIMARY_SOURCE_TEXT'&&report.humanReviewed===false&&
   report.verificationInherited===0&&report.claimReviews.length===15,
   'SECOND_PASS_INCOMPLETE');
  for(const u of a.units.slice((block-1)*5,block*5)){
   const e=chunk.entries[u.code],check=chunk.checkpoints[u.code];
   assert(core.hash(read(dir,'entries/'+u.code+'.json'))===core.hash(e)&&
    core.hash(read(dir,'checkpoints/'+u.code+'.json'))===core.hash(check),
    'ENTRY_OR_CHECKPOINT_DRIFT:'+u.code);
   assert(check.assessment==='PENDING_CANONICAL_R33_VALIDATION'&&
    e.review===null&&e.provenance?.generatedWithAI===true&&e.status==='VERIFIED',
    'FORGED_REVIEW_OR_CERTIFICATION:'+u.code);
   for(const folder of ['entries','checkpoints']){
    const rel='r41-buffer/1872/'+folder+'/'+u.code+'.json';
    assert(blob(root,BLOCK_PINS[block-1],rel)===blob(root,PIN,rel),
     'HISTORICAL_CHECKPOINT_REWRITTEN:'+u.code);
   }
   assert(blob(root,a.baseCommit,u.contentPath)===blob(root,'HEAD',u.contentPath),
    'CANONICAL_ARTICLE_CHANGED:'+u.code);
   assert(e.claims?.length===3&&e.links?.length===3,'CLAIM_COVERAGE_INVALID:'+u.code);
   for(const claim of e.claims){
    assert(!claimIds.has(claim.claimId),'DUPLICATE_CLAIM');claimIds.add(claim.claimId);
    const matches=e.links.filter(l=>l.claimId===claim.claimId&&l.supportType==='supports');
    assert(matches.length===1,'CLAIM_LINK_INVALID:'+u.code);
    const link=matches[0];
    assert(!linkIds.has(link.linkId),'DUPLICATE_LINK');linkIds.add(link.linkId);
    assert(link.sourceId in registry&&typeof link.locator?.section==='string'&&
     link.locator.section.trim().length>0&&
     /^https:\/\/www\.rae\.es\/gram%C3%A1tica\//.test(link.locator?.url||''),
     'SOURCE_LOCATOR_NOT_SPECIFIC:'+u.code);
    if(report){
     const evidence=report.claimReviews.filter(x=>x.claimId===claim.claimId);
     assert(evidence.length===1,'SECOND_PASS_MISSING_CLAIM');
     const r=evidence[0];
     assert(r.code===u.code&&r.linkId===link.linkId&&r.sourceId===link.sourceId&&
      core.hash(r.locator)===core.hash(link.locator)&&
      r.sourceReview==='AI_SOURCE_PASSAGE_MATCH'&&r.humanReviewed===false&&
      typeof(r.relevance||r.rationale)==='string'&&(r.relevance||r.rationale).trim().length>20,
      'SECOND_PASS_MEANING_RECORD_DRIFT:'+u.code);
    }
    observedLinks.push({code:u.code,claimId:claim.claimId,linkId:link.linkId,
     sourceId:link.sourceId,locatorHash:core.hash(link.locator)});
   }
   rows.push({block,code:u.code,entry:e});
  }
 }
 assert(priorHash===pack.stateHash&&rows.length===25&&
  claimIds.size===75&&linkIds.size===75,'FINAL_COVERAGE_OR_CONTEXT_CHAIN');
 const indexed=Object.entries(index.sources).flatMap(([sourceId,s])=>
  s.usedBy.map(r=>({...r,sourceId})));
 assert(indexed.length===75&&observedLinks.every(l=>indexed.some(x=>
  x.code===l.code&&x.claimId===l.claimId&&x.linkId===l.linkId&&
  x.sourceId===l.sourceId&&x.locatorHash===l.locatorHash)),'SOURCE_INDEX_INCOMPLETE');
 return {rows,manifest,pack,index};
}
async function gate(root,dir,expectedSha=PIN){
 const out={schema:'MLS-R4.1-BCR-CANONICAL-GATE-1',reservationId:'MLS-BUFFER-001872',
  bufferSha:expectedSha,checkedAt:new Date().toISOString(),entries:[],
  errors:[],sealed:false,synced:false,cloudflareDeployed:false,
  scope:'Actual R33 canonicalAssessment plus R4.1 academic.inspect and source-index/provenance integrity',
  note:'An automated gate checks documented AI passage decisions and canonical citations. This is not a new independent human review or a live semantic reading of all external passages.',
  status:'BLOCKED'};
 try{
  const state=validateState(root,dir,expectedSha);
  for(const item of state.rows){
   const e=item.entry,row={code:item.code,block:item.block,ok:false,academic:false,
    canonical:false,derivedStatus:null,claimsTotal:e.claims.length,claimsVerified:0,errors:[]};
   try{
    const article=read(root,e.contentPath),academicResult=academic.inspect(e,article);
    row.academic=academicResult.ok;
    if(!academicResult.ok)row.errors.push(...academicResult.errors);
    try{
     const result=await sync.canonicalAssessment(root,e);
     row.canonical=true;row.derivedStatus=result.derivedStatus;
     row.claimsVerified=result.claimsVerified;row.sourcesTotal=result.sourcesTotal;
    }catch(error){row.errors.push('R33:'+(error.code||error.message)+':'+error.message);}
    row.ok=row.academic&&row.canonical&&row.derivedStatus==='VERIFIED'&&
     row.claimsTotal===row.claimsVerified;
    if(!row.ok&&!row.errors.length)row.errors.push('DERIVED_STATUS_CONFLICT');
   }catch(error){row.errors.push('ENTRY:'+(error.code||error.message)+':'+error.message);}
   out.entries.push(row);
   console.log('MLS_R41_GATE_ENTRY '+JSON.stringify(row));
  }
 }catch(error){out.errors.push((error.code||'PREFLIGHT')+':'+error.message);}
 out.passed=out.entries.filter(e=>e.ok).length;
 out.failed=out.entries.filter(e=>!e.ok).length;
 out.status=out.errors.length===0&&out.entries.length===25&&out.passed===25?
  'CANONICAL_PASS_25_NO_SEAL':'CANONICAL_BLOCKED';
 console.log('MLS_R41_1872_CANONICAL_GATE '+JSON.stringify(out));
 if(process.env.MLS_BCR_GATE_REPORT){
  fs.mkdirSync(path.dirname(process.env.MLS_BCR_GATE_REPORT),{recursive:true});
  fs.writeFileSync(process.env.MLS_BCR_GATE_REPORT,JSON.stringify(out,null,2)+'\n');
 }
 if(process.env.GITHUB_STEP_SUMMARY){
  const lines=['## R4.1 #1872 canonical Gate', '',
   '- Pinned buffer: '+expectedSha,'- Outcome: **'+out.status+'**',
   '- Passed entries: '+out.passed+'/25', '- Preflight errors: '+out.errors.join('; '),
   '- No seal, SYNC, main Evidence mutation or Cloudflare.','','| Article | R4.1 | R33 | Errors |',
   '|---|---|---|---|',
   ...out.entries.map(e=>'| '+e.code+' | '+(e.academic?'PASS':'FAIL')+' | '+
    (e.canonical?'PASS':'FAIL')+' | '+e.errors.join('; ')+' |')];
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,lines.join('\n')+'\n');
 }
 if(out.status!=='CANONICAL_PASS_25_NO_SEAL')process.exitCode=2;
 return out;
}
if(require.main===module){
 const [root,dir,sha]=process.argv.slice(2);
 if(!root||!dir){console.error('Usage: node scripts/R4-1-bcr-canonical-gate.cjs <checkout> <read-only buffer> [SHA]');process.exitCode=2;}
 else gate(path.resolve(root),path.resolve(dir),sha||PIN).catch(e=>{console.error(e);process.exitCode=2;});
}
module.exports={PIN,ALLOCATION,BLOCK_PINS,validateState,gate};
