'use strict';
// R4.1: pure allocator and durable reservation Issue contract.
// The only remote writer is the existing serialized Global Dispatcher Scheduler.
const core=require('./global dispatcher/core.js');
const r33=require('./global dispatcher/providers/r33.js');

const REQUEST_MARKER='MLS_BUFFERED_REQUEST';
const RESERVATION_MARKER='MLS_BUFFERED_RESERVATION';
const BUFFERED_TITLE='[MLS Buffered]';
const LIVE=new Set(['reserved','staged']);
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
  if(x.mode==='reserve'&&![10,25,50,100].includes(x.size))fail('BUFFER_REQUEST_SIZE','Size must be 10, 25, 50 or 100.');
  if(x.mode==='release'&&(!Number.isSafeInteger(x.targetIssueNumber)||x.targetIssueNumber<1||x.recoveryReviewed!==true||String(x.reason||'').trim().length<12))
    fail('BUFFER_RELEASE_REVIEW_REQUIRED','Release requires issue, explicit recovery review and reason.');
  return x;
}
function requestAuthorized(issue){
  return ['OWNER','MEMBER','COLLABORATOR'].includes(String(issue?.author_association||'').toUpperCase());
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
  if(!title.startsWith(BUFFERED_TITLE+'[RESERVED]')&&!title.startsWith(BUFFERED_TITLE+'[STAGED]'))
    fail('BUFFER_RESERVATION_TITLE');
  if(issue.state&&issue.state!=='open')fail('BUFFER_RESERVATION_NOT_OPEN');
  const r=marker(issue.body,RESERVATION_MARKER);
  if(r?.kind!=='mls_buffer_reservation'||r.version!==1||!LIVE.has(r.status)||
    !Number.isSafeInteger(r.issueNumber)||r.issueNumber!==Number(issue.number)||
    r.recordHash!==recordHash(r))fail('BUFFER_RESERVATION_INVALID');
  const a=normalizeAllocation(r.allocation);
  if(a.assignmentIssueNumber!==r.issueNumber||core.sha256(a)!==r.allocationHash)fail('BUFFER_RESERVATION_TAMPERED');
  if(r.status==='reserved'&&!title.startsWith(BUFFERED_TITLE+'[RESERVED]'))fail('BUFFER_TITLE_STATUS_MISMATCH');
  if(r.status==='staged'){
    if(!title.startsWith(BUFFERED_TITLE+'[STAGED]')||!/^[a-f0-9]{40}$/i.test(r.stage?.commitSha||'')||
      !/^[a-f0-9]{64}$/i.test(r.stage?.packageHash||'')||
      !String(r.stage?.branch||'').startsWith('r41/staged/')||
      r.stage?.checksPassed!==true)fail('BUFFER_STAGING_INVALID');
  }
  return r;
}
function reservations(issues){
  const result=[],codes=new Set();
  for(const issue of issues||[]){
    if(!String(issue?.title||'').startsWith(BUFFERED_TITLE+'[RESERVED]')&&
       !String(issue?.title||'').startsWith(BUFFERED_TITLE+'[STAGED]'))continue;
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
  if(![10,25,50,100].includes(size)||!Number.isSafeInteger(issueNumber)||issueNumber<1)fail('BUFFER_REQUEST_INVALID');
  const c=r33.materializeCandidates(snapshot,{now,count:size,requested:1});
  if(c.length!==size)fail('BUFFER_CAPACITY_BUSY','Only '+c.length+' of '+size+' eligible unowned units.');
  const units=c.flatMap(x=>x.units).map(u=>({code:u.code,language:u.language,contentPath:u.contentPath,evidenceArtifactPath:u.evidenceArtifactPath}));
  const a=normalizeAllocation({allocatedBy:'global-dispatcher',
    assignmentId:'MLS-BUFFER-'+String(issueNumber).padStart(6,'0'),assignmentIssueNumber:issueNumber,
    leaseEpoch:issueNumber,poolId:c[0].poolId,manifestVersion:c[0].manifestVersion,
    baseCommit,contentManifestBlobSha,units});
  return reservation({allocation:a,requestId,createdAt:core.iso(now)});
}
function stage(r,{branch,commitSha,packageHash,checksPassed}){
  if(r.status!=='reserved'||checksPassed!==true||!/^r41\/staged\/[0-9]+$/.test(String(branch||''))||
    !/^[a-f0-9]{40}$/i.test(String(commitSha||''))||!/^[a-f0-9]{64}$/i.test(String(packageHash||'')))
    fail('BUFFER_STAGE_INVALID');
  const next={...r,status:'staged',stage:{branch,commitSha:commitSha.toLowerCase(),packageHash:packageHash.toLowerCase(),checksPassed:true,stagedAt:core.iso()}};
  return {...next,recordHash:recordHash(next)};
}
module.exports={REQUEST_MARKER,RESERVATION_MARKER,BUFFERED_TITLE,parseRequest,requestAuthorized,normalizeAllocation,
  reservation,renderReservation,parseReservation,reservations,allocate,stage,recordHash};
