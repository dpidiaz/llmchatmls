'use strict';
// R4.1 pinned deferred supersession selector. Does not modify ledger, refs, Issues or release an academic hold.
const fs=require('node:fs'),path=require('node:path');
const REGISTRY='MLS R32 EDITORIAL/evidence git/staging-supersessions.json';
const HOLD='MLS R32 EDITORIAL/evidence git/quality-holds.json';
const SHA40=/^[a-f0-9]{40}$/i,SHA64=/^[a-f0-9]{64}$/i,CODE=/^MLS-V\d{2}-\d{4}$/;
function error(code,detail=''){const e=new Error(code+(detail?': '+detail:''));e.code=code;throw e;}
function assert(ok,code,detail){if(!ok)error(code,detail);}
function equalCodes(a,b){return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&
 a.slice().sort().every((x,i)=>x===b.slice().sort()[i]);}
function safeAsset(p,codes){
 if(typeof p!=='string'||p.includes('\\')||p.split('/').includes('..'))return false;
 if(/^content\/[A-Za-z0-9._/-]+\.json$/.test(p)){
   return codes.some(c=>p.endsWith('/'+c+'.json'));
 }
 return /^MLS R32 EDITORIAL\/evidence git\/registry\/sources\/MLS-SRC-[A-F0-9]{16,32}\.json$/.test(p);
}

/*
 * AI-only editorial evidence protocol. VERIFIED means an AI-assisted source
 * cross-check and canonical validations were recorded; never human REVIEWED.
 * No paid API, no named-person attestation, no automatic production deploy.
 */
const AI_PROTOCOL='MLS_R41_AI_EVIDENCE_V1';
function assertAiApproval(r,approval){
 const a=approval||{},second=r.academicSecondPass||{},replacement=r.replacement||{};
 assert(a.protocol===AI_PROTOCOL&&a.revisionId===r.revisionId&&a.commitSha===replacement.commitSha&&
   a.stageBranch===replacement.branch&&a.generatedWithAI===true&&a.humanReviewed===false&&
   a.reviewerType==='ai'&&a.sourceReviewMode==='primary_source_text_and_exact_sections'&&
   a.entriesChecked===r.codes.length&&a.claimsChecked===second.checkedClaims&&
   a.sourceLinksChecked===second.sourceLinks&&a.reportPath===second.reportPath&&
   a.validationRunId===replacement.ciRunId&&
   a.pdfVisualStatus==='not_verified_text_passages_checked'&&
   typeof a.verifiedAt==='string'&&!Number.isNaN(Date.parse(a.verifiedAt))&&
   a.limitsAcknowledged===true,
   'R41_AI_EVIDENCE_APPROVAL_INVALID',r.workId);
 return a;
}

function parseRegistry(reg,inventory){
 if(!reg)return {entries:new Map(),activeHeldCodes:new Set()};
 assert(reg.kind==='mls_r33_staging_supersessions'&&reg.schemaVersion==='1.0'&&Array.isArray(reg.entries),
   'SUPERSESSION_REGISTRY_INVALID');
 assert(inventory?.kind==='mls_r33_publication_quality_holds'&&Array.isArray(inventory.holds),
   'SUPERSESSION_HOLD_INVENTORY_INVALID');
 const holds=new Map(),activeHeldCodes=new Set();
 for(const h of inventory.holds){
  assert(!holds.has(h.workId),'SUPERSESSION_DUPLICATE_HOLD',h.workId);
  holds.set(h.workId,h);
  if(h.status==='active')for(const c of h.codes||[])activeHeldCodes.add(c);
 }
 const entries=new Map(),used=new Set();
 for(const r of reg.entries){
  const workId=String(r.workId||''),original=r.original||{},replacement=r.replacement||{};
  assert(!entries.has(workId)&&/^r33-buffer:MLS-BUFFER-\d{6}$/.test(workId)&&r.assignmentId===workId.slice(11),
   'SUPERSESSION_WORK_ID',workId);
  assert(SHA40.test(original.commitSha)&&SHA40.test(replacement.commitSha)&&SHA64.test(original.packageHash)&&
   /^r41\/staged\/\d+$/.test(original.branch)&&/^r41\/staged\/\d+-v\d+$/.test(replacement.branch)&&
   original.commitSha!==replacement.commitSha,'SUPERSESSION_SHA_OR_REF_INVALID',workId);
  assert(/^MLS-R41-\d{4}-REV\d+$/.test(r.revisionId)&&
    replacement.branch.endsWith('-v'+r.revisionId.split('REV')[1]),'SUPERSESSION_REVISION_INVALID',workId);
  assert(Array.isArray(r.codes)&&r.codes.length>0&&new Set(r.codes).size===r.codes.length&&r.codes.every(c=>CODE.test(c)),
    'SUPERSESSION_CODES_INVALID',workId);
  for(const code of r.codes){assert(!used.has(code),'SUPERSESSION_DOUBLE_OWNERSHIP',code);used.add(code);}
  assert(Array.isArray(r.materializationAssets)&&r.materializationAssets.length<=20&&
    new Set(r.materializationAssets).size===r.materializationAssets.length&&
    r.materializationAssets.every(p=>safeAsset(p,r.codes)), 'SUPERSESSION_ASSET_SCOPE',workId);
  assert(replacement.ciRunId>0&&r.finalIntegration?.preferredRevision===r.revisionId&&
    r.finalIntegration?.forbidOriginalFallback===true&&r.finalIntegration?.blockWhileQualityHoldActive===true&&
    r.finalIntegration?.approvedForPublication===false&&r.academicSecondPass?.humanReviewed===false,
    'SUPERSESSION_UNSAFE_FLAGS',workId);
  const hold=holds.get(workId);
  assert(!!hold&&hold.commitSha===original.commitSha&&hold.packageHash===original.packageHash&&
    equalCodes(hold.codes,r.codes),'SUPERSESSION_ORIGINAL_HOLD_MISMATCH',workId);
  assert(['active','resolved'].includes(hold.status),'SUPERSESSION_UNKNOWN_HOLD_STATE',workId);
  if(hold.status==='resolved')assertAiApproval(r,hold.replacementApproval);
  entries.set(workId,{record:r,hold});
 }
 return {entries,activeHeldCodes};
}
function load(root='.'){
 const file=path.join(root,REGISTRY);
 if(!fs.existsSync(file))return {entries:new Map(),activeHeldCodes:new Set()};
 const reg=JSON.parse(fs.readFileSync(file,'utf8'));
 const inventory=JSON.parse(fs.readFileSync(path.join(root,HOLD),'utf8'));
 return parseRegistry(reg,inventory);
}
function choose(workId,terminal,selection,{mode='rehearsal'}={}){
 const data=selection.entries.get(workId);
 if(!data)return {blocked:false,branch:String(terminal?.branch||''),commitSha:String(terminal?.commitSha||''),
   academicHold:false,assets:[],revisionId:null,originalCommitSha:null};
 const {record:r,hold}=data;
 assert(terminal?.provider==='r33-farm'&&terminal.status==='certified'&&
    terminal.assignmentId===r.assignmentId&&terminal.branch===r.original.branch&&
    terminal.commitSha===r.original.commitSha&&terminal.bufferPackageHash===r.original.packageHash&&
    equalCodes(terminal.completedUnits,r.codes),'SUPERSESSION_LIVE_TERMINAL_CONFLICT',workId);
 if(hold.status==='active'){
  if(mode==='integration')return {blocked:true,academicHold:true,revisionId:r.revisionId,
   originalCommitSha:r.original.commitSha,branch:r.replacement.branch,commitSha:r.replacement.commitSha};
 }else{
  // Source-precise AI verification may clear the quality hold without claiming human REVIEWED.
  assertAiApproval(r,hold.replacementApproval);
 }
 return {blocked:false,branch:r.replacement.branch,commitSha:r.replacement.commitSha,
  revisionId:r.revisionId,originalCommitSha:r.original.commitSha,academicHold:hold.status==='active',
  assets:r.materializationAssets.map(p=>({path:p,commitSha:r.replacement.commitSha})),
  selectionStatus:hold.status==='active'?'PINNED_V3_REHEARSAL_ONLY':'PINNED_V3_APPROVED_FOR_INTEGRATION'};
}

/**
 * First expansion is allowed by immutable AI academic evidence, NOT a human
 * sign-off. Gate 50/100 are permanently discontinued: larger campaigns are
 * composed of separate 10/25-entry batches with separate ownership and seals.
 * Runtime Scheduler re-checks the pinned stage ref and successful Actions run.
 */
function assertScaledPilotReady(size,selection){
 if(size===10)return [];
 assert(size===25,'R41_BATCH_SIZE_LIMIT_25','Single batches above 25 are prohibited; split campaigns into independent reservations.');
 assert(selection?.entries instanceof Map&&selection.entries.size>0,'R41_PILOT_HISTORY_MISSING');
 const out=[];
 for(const [workId,data] of selection.entries){
  const {record:r,hold}=data;
  assert(hold?.status==='resolved','R41_ACADEMIC_HOLD_ACTIVE',workId);
  const a=assertAiApproval(r,hold.replacementApproval);
  out.push({workId,commitSha:a.commitSha,stageBranch:a.stageBranch,
   validationRunId:a.validationRunId,reportPath:a.reportPath,protocol:a.protocol});
 }
 return out;
}
module.exports={REGISTRY,HOLD,AI_PROTOCOL,parseRegistry,load,choose,equalCodes,safeAsset,assertAiApproval,assertScaledPilotReady};
