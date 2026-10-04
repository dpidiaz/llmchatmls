'use strict';
// R4.1: pure allocator and durable reservation Issue contract.
// The only remote writer is the existing serialized Global Dispatcher Scheduler.
const core=require('./global dispatcher/core.js');
const r33=require('./global dispatcher/providers/r33.js');

const REQUEST_MARKER='MLS_BUFFERED_REQUEST';
const RESERVATION_MARKER='MLS_BUFFERED_RESERVATION';
const BUFFERED_TITLE='[MLS Buffered]';
const LIVE=new Set(['reserved','staged','quarantined']);
// Durable production ceiling. Larger campaigns must use independent reservations.
const ALLOWED_NEW_BATCH_SIZES=Object.freeze([10,25]);
const MAX_NEW_BATCH_SIZE=25;
function fail(code,message){throw core.dispatchError(code,message||code,409);}
function marker(text,name){
  const body=String(text||'');
  const matches=[...body.matchAll(new RegExp('<!--\\s*'+name+'\\s*\\n([\\s\\S]*?)\\n-->','g'))];
  if(matches.length!==1)fail('BUFFER_MARKER_INVALID','Expected exactly one '+name+' marker.');
  try{return JSON.parse(matches[0][1]);}catch{fail('BUFFER_JSON_INVALID','Invalid JSON inside '+name);}
}
function parseRequest(issue){
  if(!String(issue?.title||'').startsWith(BUFFERED_TITLE+'[REQUEST]'))fail('BUFFER_REQUEST_TITLE');
  const x=marker(issue.body,REQUEST_MARKER);
  if(x?.kind!=='mls_buffer_request'||x.version!==1)fail('BUFFER_REQUEST_SCHEMA');
  if(!/^[A-Za-z0-9._:-]{8,120}$/.test(String(x.requestId||'')))fail('BUFFER_REQUEST_ID');
  if(!['reserve','release'].includes(x.mode))fail('BUFFER_REQUEST_MODE');
  if(x.mode==='reserve'&&!ALLOWED_NEW_BATCH_SIZES.includes(x.size))fail('BUFFER_REQUEST_SIZE','Maximum 25 per reservation (supported: 10 or 25); split larger campaigns into independently verified lots.');
  if(x.mode==='release'&&(!Number.isSafeInteger(x.targetIssueNumber)||x.targetIssueNumber<1||x.recoveryReviewed!==true||String(x.reason||'').trim().length<12))
    fail('BUFFER_RELEASE_REVIEW_REQUIRED','Release requires issue, explicit recovery review and reason.');
  return x;
}
function requestAuthorized(issue){
  if(['OWNER','MEMBER','COLLABORATOR'].includes(String(issue?.author_association||'').toUpperCase()))return true;
  // R4.2's serialized scheduler may create additional immutable 25-unit reserves.
  // Trust only GitHub's real Actions bot identity and the RESERVED marker. This
  // does NOT grant a bot-authored [REQUEST] the ability to allocate user work.
  return issue?.user?.login==='github-actions[bot]' &&
    /^\[MLS Buffered\]\[(RESERVED|STAGED|QUARANTINED)\]/.test(String(issue.title||'')) &&
    /<!--\s*MLS_BUFFERED_RESERVATION\b/.test(String(issue.body||''));
}
function normalizeAllocation(raw){
  if(raw?.allocatedBy!=='global-dispatcher'||!String(raw.assignmentId||'').startsWith('MLS-BUFFER-'))fail('BUFFER_ALLOCATION_ORIGIN');
  if(!Number.isSafeInteger(raw.assignmentIssueNumber)||raw.assignmentIssueNumber<1||
      !Number.isSafeInteger(raw.leaseEpoch)||raw.leaseEpoch!==raw.assignmentIssueNumber)fail('BUFFER_ALLOCATION_EPOCH');
  if(!/^[a-f0-9]{40}$/i.test(raw.baseCommit||'')||!/^[a-f0-9]{40}$/i.test(raw.contentManifestBlobSha||''))
    fail('BUFFER_ALLOCATION_SHA');
  if(!raw.poolId||!raw.manifestVersion||!Array.isArray(raw.units)||!raw.units.length||raw.units.length>100)
    fail('BUFFER_ALLOCATION_SCHEMA');
  const used=new Set();
  const units=raw.units.map(u=>{
    const code=r33.assertCode(u.code);
    if(used.has(code)||!/^[A-Za-z0-9._-]{2,80}$/.test(String(u.language||'')))fail('BUFFER_DUPLICATE_UNIT');
    used.add(code);
    if(!/^content\/[A-Za-z0-9._/-]+$/.test(u.contentPath||'')||String(u.contentPath).split('/').includes('..'))fail('BUFFER_CONTENT_PATH');
    const evidenceArtifactPath=r33.evidenceArtifactPath(u);
    if(u.evidenceArtifactPath!==evidenceArtifactPath)fail('BUFFER_EVIDENCE_PATH');
    return {code,language:u.language,contentPath:u.contentPath,evidenceArtifactPath};
  });
  return {allocatedBy:'global-dispatcher',assignmentId:raw.assignmentId,assignmentIssueNumber:raw.assignmentIssueNumber,
    leaseEpoch:raw.leaseEpoch,poolId:raw.poolId,manifestVersion:raw.manifestVersion,
    baseCommit:raw.baseCommit.toLowerCase(),contentManifestBlobSha:raw.contentManifestBlobSha.toLowerCase(),units};
}
function recordHash(record){
  const x={...record};delete x.recordHash;return core.sha256(x);
}
function reservation({allocation,requestId,createdAt=core.iso()}){
  const a=normalizeAllocation(allocation);
  const record={kind:'mls_buffer_reservation',version:1,status:'reserved',issueNumber:a.assignmentIssueNumber,
    requestId,createdAt,allocation:a,allocationHash:core.sha256(a)};
  return {...record,recordHash:recordHash(record)};
}
function renderReservation(r){
  return ['## MLS R4.1 Buffered Evidence reservation','',
    '**Estado:** '+r.status+'  ','**Issue:** #'+r.issueNumber+'  ',
    '**Assignment:** '+r.allocation.assignmentId+'  ',
    '**Entradas:** '+r.allocation.units.length+'  ',
    '', 'Esta reserva protege todos los códigos hasta reconciliación final o liberación explícita.',
    '',core.renderMarked(RESERVATION_MARKER,r)].join('\n');
}
function parseReservation(issue){
  const title=String(issue?.title||'');
  if(!title.startsWith(BUFFERED_TITLE+'[RESERVED]')&&!title.startsWith(BUFFERED_TITLE+'[STAGED]')&&
     !title.startsWith(BUFFERED_TITLE+'[QUARANTINED]'))
    fail('BUFFER_RESERVATION_TITLE');
  if(issue.state&&issue.state!=='open')fail('BUFFER_RESERVATION_NOT_OPEN');
  const r=marker(issue.body,RESERVATION_MARKER);
  if(r?.kind!=='mls_buffer_reservation'||r.version!==1||!LIVE.has(r.status)||
    !Number.isSafeInteger(r.issueNumber)||r.issueNumber!==Number(issue.number)||
    r.recordHash!==recordHash(r))fail('BUFFER_RESERVATION_INVALID');
  const a=normalizeAllocation(r.allocation);
  if(a.assignmentIssueNumber!==r.issueNumber||core.sha256(a)!==r.allocationHash)fail('BUFFER_RESERVATION_TAMPERED');
  if(r.status==='reserved'&&!title.startsWith(BUFFERED_TITLE+'[RESERVED]'))fail('BUFFER_TITLE_STATUS_MISMATCH');
  if(r.status==='staged'||r.status==='quarantined'){
    if(!title.startsWith(BUFFERED_TITLE+(r.status==='staged'?'[STAGED]':'[QUARANTINED]'))||
      !/^[a-f0-9]{40}$/i.test(r.stage?.commitSha||'')||
      !/^[a-f0-9]{64}$/i.test(r.stage?.packageHash||'')||
      !String(r.stage?.branch||'').startsWith('r41/staged/')||
      r.stage?.checksPassed!==true||!Number.isSafeInteger(r.stage?.workflowRunId)||r.stage.workflowRunId<1||
      !Number.isSafeInteger(r.stage?.syncRequestIssueNumber)||r.stage.syncRequestIssueNumber<1)fail('BUFFER_STAGING_INVALID');
  }
  return r;
}
function reservations(issues){
  const result=[],codes=new Set(),seenIssues=new Set();
  for(const issue of issues||[]){
    // Public repositories must not let unauthorized, user-created Issues block R33 allocation.
    if(!requestAuthorized(issue))continue;
    if(!String(issue?.title||'').startsWith(BUFFERED_TITLE+'[RESERVED]')&&
       !String(issue?.title||'').startsWith(BUFFERED_TITLE+'[STAGED]')&&
       !String(issue?.title||'').startsWith(BUFFERED_TITLE+'[QUARANTINED]'))continue;
    // Paginated GitHub issue inventories can repeat an issue when the open set shifts
    // while pages are being read. Ignore only the same durable issue identity; overlap
    // across two distinct reservation issues must still fail below.
    const issueNumber=Number(issue?.number);
    if(Number.isSafeInteger(issueNumber)&&issueNumber>0){
      if(seenIssues.has(issueNumber))continue;
      seenIssues.add(issueNumber);
    }
    const r=parseReservation(issue);
    for(const u of r.allocation.units){
      if(codes.has(u.code))fail('DOUBLE_BUFFERED_OWNERSHIP',u.code);
      codes.add(u.code);
    }
    result.push(r);
  }
  return result;
}
function allocate(snapshot,{size,issueNumber,requestId,baseCommit,contentManifestBlobSha,now=Date.now()}){
  if(!ALLOWED_NEW_BATCH_SIZES.includes(size)||size>MAX_NEW_BATCH_SIZE||!Number.isSafeInteger(issueNumber)||issueNumber<1)fail('BUFFER_REQUEST_INVALID');
  const c=r33.materializeCandidates(snapshot,{now,count:size,requested:1});
  if(c.length!==size)fail('BUFFER_CAPACITY_BUSY','Only '+c.length+' of '+size+' eligible unowned units.');
  const units=c.flatMap(x=>x.units).map(u=>({code:u.code,language:u.language,contentPath:u.contentPath,evidenceArtifactPath:u.evidenceArtifactPath}));
  const a=normalizeAllocation({allocatedBy:'global-dispatcher',
    assignmentId:'MLS-BUFFER-'+String(issueNumber).padStart(6,'0'),assignmentIssueNumber:issueNumber,
    leaseEpoch:issueNumber,poolId:c[0].poolId,manifestVersion:c[0].manifestVersion,
    baseCommit,contentManifestBlobSha,units});
  return reservation({allocation:a,requestId,createdAt:core.iso(now)});
}
function stage(r,{branch,commitSha,packageHash,checksPassed,workflowRunId,syncRequestIssueNumber}){
  if(!LIVE.has(r.status)||checksPassed!==true||!/^r41\/staged\/[0-9]+$/.test(String(branch||''))||
    !/^[a-f0-9]{40}$/i.test(String(commitSha||''))||!/^[a-f0-9]{64}$/i.test(String(packageHash||''))||
    !Number.isSafeInteger(workflowRunId)||workflowRunId<1||
    !Number.isSafeInteger(syncRequestIssueNumber)||syncRequestIssueNumber<1)
    fail('BUFFER_STAGE_INVALID');
  if(r.stage&&(r.stage.branch!==branch||r.stage.commitSha!==commitSha.toLowerCase()||r.stage.packageHash!==packageHash.toLowerCase()))
    fail('BUFFER_RESTAGE_CONFLICT');
  const next={...r,status:'staged',stage:{branch,commitSha:commitSha.toLowerCase(),packageHash:packageHash.toLowerCase(),checksPassed:true,workflowRunId,syncRequestIssueNumber,stagedAt:core.iso()}};
  delete next.quarantine;
  return {...next,recordHash:recordHash(next)};
}
function quarantine(r,reason){
  if(r.status!=='staged'||!r.stage||!String(reason||'').trim())fail('BUFFER_QUARANTINE_INVALID');
  const next={...r,status:'quarantined',quarantine:{reason:String(reason).slice(0,180),at:core.iso()}};
  return {...next,recordHash:recordHash(next)};
}
module.exports={REQUEST_MARKER,RESERVATION_MARKER,BUFFERED_TITLE,ALLOWED_NEW_BATCH_SIZES,MAX_NEW_BATCH_SIZE,parseRequest,requestAuthorized,normalizeAllocation,
  reservation,renderReservation,parseReservation,reservations,allocate,stage,quarantine,recordHash};
