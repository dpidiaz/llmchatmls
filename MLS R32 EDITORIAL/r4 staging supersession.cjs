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
  // Only an explicit reviewed release on the exact revision SHA can enable final integration.
  const approval=hold.replacementApproval||{};
  assert(approval.revisionId===r.revisionId&&approval.commitSha===r.replacement.commitSha&&
   typeof approval.reviewer==='string'&&approval.reviewer.trim().length>2&&
   typeof approval.reviewedAt==='string'&&!Number.isNaN(Date.parse(approval.reviewedAt))&&
   approval.independentAcademicReview===true,'SUPERSESSION_EXPLICIT_APPROVAL_REQUIRED',workId);
 }
 return {blocked:false,branch:r.replacement.branch,commitSha:r.replacement.commitSha,
  revisionId:r.revisionId,originalCommitSha:r.original.commitSha,academicHold:hold.status==='active',
  assets:r.materializationAssets.map(p=>({path:p,commitSha:r.replacement.commitSha})),
  selectionStatus:hold.status==='active'?'PINNED_V3_REHEARSAL_ONLY':'PINNED_V3_APPROVED_FOR_INTEGRATION'};
}

/**
 * Gate for opt-in expansion beyond the original ten. This only validates a
 * recorded human attestation; the Scheduler authenticates its GitHub comment.
 * Gate 50/100 requires a separate measured/certified Gate 25 first.
 */
function assertScaledPilotReady(size,selection){
 if(size===10)return [];
 assert(size===25,'R41_SCALE_GATE_NOT_CERTIFIED','Only Gate 25 may follow pilot 10.');
 assert(selection?.entries instanceof Map&&selection.entries.size>0,'R41_PILOT_HISTORY_MISSING');
 const out=[];
 for(const [workId,data] of selection.entries){
  const {record:r,hold}=data,approval=hold?.replacementApproval||{};
  assert(hold.status==='resolved','R41_ACADEMIC_HOLD_ACTIVE',workId);
  assert(approval.independentAcademicReview===true&&approval.revisionId===r.revisionId&&
   approval.commitSha===r.replacement.commitSha&&typeof approval.reviewer==='string'&&approval.reviewer.trim().length>2&&
   typeof approval.reviewerGithub==='string'&&/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(approval.reviewerGithub)&&
   typeof approval.reviewedAt==='string'&&!Number.isNaN(Date.parse(approval.reviewedAt))&&
   Number.isSafeInteger(approval.reviewIssueNumber)&&approval.reviewIssueNumber>0&&
   Number.isSafeInteger(approval.reviewCommentId)&&approval.reviewCommentId>0,
   'R41_HUMAN_ATTESTATION_MISSING',workId);
  out.push({workId,commitSha:r.replacement.commitSha,reviewerGithub:approval.reviewerGithub,
    reviewIssueNumber:approval.reviewIssueNumber,reviewCommentId:approval.reviewCommentId,
    stageBranch:r.replacement.branch});
 }
 return out;
}
module.exports={REGISTRY,HOLD,parseRegistry,load,choose,equalCodes,safeAsset,assertScaledPilotReady};
