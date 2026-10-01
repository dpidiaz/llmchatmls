'use strict';
const crypto=require('node:crypto');
const farm=require('./r4 snapshot farm.cjs');

const REQUEST_MARKER='MLS_BCR_R43_REQUEST';
const REQUEST_SCHEMA='MLS-BCR-R43-REQUEST-1';
const REQUEST_VERSION=2;
const LEGACY_REQUEST_VERSION=1;
const ADMISSION_SCHEMA='MLS-BCR-R43-ADMISSION-1';
const MAX_REMOTE_WORKERS=50;
const DEFAULT_CLAIM_TTL_MS=30*60*1000;

function fail(code,msg){const e=new Error(msg||code);e.code=code;e.status=409;throw e;}
function assert(ok,code,msg){if(!ok)fail(code,msg);}
function stable(x){
 if(Array.isArray(x))return '['+x.map(stable).join(',')+']';
 if(x&&typeof x==='object')return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';
 return JSON.stringify(x);
}
function hash(x){return crypto.createHash('sha256').update(stable(x)).digest('hex');}
function authorized(issue){
 return ['OWNER','MEMBER','COLLABORATOR'].includes(String(issue?.author_association||'').toUpperCase());
}
function marker(text,key){
 const re=new RegExp('<!--\\s*'+key+'\\s*\\n([\\s\\S]*?)\\n-->','g');
 const m=[...String(text||'').matchAll(re)];
 assert(m.length===1,'R43_REMOTE_MARKER_CARDINALITY');
 try{return JSON.parse(m[0][1]);}catch{fail('R43_REMOTE_MARKER_JSON');}
}
function renderMarker(key,value){return '<!-- '+key+'\n'+JSON.stringify(value)+'\n-->';}
function admissionHash(value){const unsigned={...value};delete unsigned.admissionHash;return hash(unsigned);}

function createRequest(wave,{waveIssueNumber,requestId,createdAt,claimTtlMs=DEFAULT_CLAIM_TTL_MS}={}){
 assert(wave?.schema===farm.WAVE_SCHEMA,'R43_REMOTE_WAVE');
 assert(wave.workerCount<=MAX_REMOTE_WORKERS,'R43_REMOTE_WORKER_CAP');
 assert(Number.isSafeInteger(waveIssueNumber)&&waveIssueNumber>0,'R43_REMOTE_WAVE_ISSUE');
 assert(/^[A-Za-z0-9._:-]{8,160}$/.test(String(requestId||'')),'R43_REMOTE_REQUEST_ID');
 const createdMs=Date.parse(String(createdAt||''));
 assert(Number.isFinite(createdMs),'R43_REMOTE_CREATED_AT');
 assert(Number.isInteger(claimTtlMs)&&claimTtlMs>=5*60*1000&&claimTtlMs<=60*60*1000,'R43_REMOTE_CLAIM_TTL');
 const unsigned={
  schema:REQUEST_SCHEMA,version:REQUEST_VERSION,waveIssueNumber,waveId:wave.waveId,
  waveHash:wave.waveHash,requestId,createdAt,
  productionClaimExpiresAt:new Date(createdMs+claimTtlMs).toISOString()
 };
 return {...unsigned,requestHash:hash(unsigned)};
}
function renderRequestBody(request){
 return ['## MLS BCR R4.3 incremental worker claim','',
  'Immediate shard ownership. No heartbeat or renew lifecycle.','',
  renderMarker(REQUEST_MARKER,request)].join('\n');
}
function parseRequest(issue,wave,waveIssueNumber=null){
 assert(authorized(issue),'R43_REMOTE_OWNER');
 const title=String(issue?.title||'');
 assert(title.startsWith('[MLS BCR R4.3][REQUEST] ')||title.startsWith('[MLS BCR R4.3][RESULT] '),'R43_REMOTE_TITLE');
 const r=marker(issue.body,REQUEST_MARKER);
 assert(r?.schema===REQUEST_SCHEMA&&[LEGACY_REQUEST_VERSION,REQUEST_VERSION].includes(r.version),'R43_REMOTE_REQUEST_SCHEMA');
 const unsigned={...r};delete unsigned.requestHash;
 assert(r.requestHash===hash(unsigned),'R43_REMOTE_REQUEST_HASH');
 assert(r.waveId===wave.waveId&&r.waveHash===wave.waveHash,'R43_REMOTE_REQUEST_WAVE');
 if(waveIssueNumber!=null)assert(r.waveIssueNumber===waveIssueNumber,'R43_REMOTE_REQUEST_WAVE_ISSUE');
 assert(!Number.isNaN(Date.parse(String(r.createdAt||''))),'R43_REMOTE_CREATED_AT');
 if(r.version===REQUEST_VERSION){
  const expiry=Date.parse(String(r.productionClaimExpiresAt||''));
  const created=Date.parse(r.createdAt);
  assert(Number.isFinite(expiry)&&expiry>created&&expiry-created<=60*60*1000,'R43_REMOTE_CLAIM_EXPIRY');
 }
 return r;
}
function assignmentRows(wave,issues,{waveIssueNumber}={}){
 assert(wave?.schema===farm.WAVE_SCHEMA,'R43_REMOTE_WAVE');
 assert(wave.workerCount<=MAX_REMOTE_WORKERS,'R43_REMOTE_WORKER_CAP');
 assert(Number.isSafeInteger(waveIssueNumber)&&waveIssueNumber>0,'R43_REMOTE_WAVE_ISSUE');
 const seen=new Set(),rows=[];
 for(const issue of [...(issues||[])].sort((a,b)=>Number(a.number)-Number(b.number))){
  let r;try{r=parseRequest(issue,wave,waveIssueNumber);}catch{continue;}
  if(seen.has(r.requestId))continue;
  seen.add(r.requestId);
  rows.push({
   issueNumber:Number(issue.number),requestId:r.requestId,requestHash:r.requestHash,
   requestVersion:r.version,createdAt:r.createdAt,
   productionClaimExpiresAt:r.version===REQUEST_VERSION?r.productionClaimExpiresAt:null
  });
  if(rows.length===wave.workerCount)break;
 }
 return rows.map((row,i)=>({...row,shardId:wave.shards[i].shardId,codes:[...wave.shards[i].codes]}));
}
function materializeAdmission(wave,issues,{waveIssueNumber,at=null}={}){
 const assignments=assignmentRows(wave,issues,{waveIssueNumber});
 const complete=assignments.length===wave.workerCount;
 const unsigned={
  schema:ADMISSION_SCHEMA,version:1,waveIssueNumber,waveId:wave.waveId,
  waveHash:wave.waveHash,sealedAt:complete&&at?String(at):null,complete,assignments
 };
 return {...unsigned,admissionHash:hash(unsigned)};
}
function sealAdmission(wave,issues,{sealedAt,waveIssueNumber=null}={}){
 assert(!Number.isNaN(Date.parse(String(sealedAt||''))),'R43_REMOTE_SEALED_AT');
 const assignments=assignmentRows(wave,issues,{waveIssueNumber});
 assert(assignments.length===wave.workerCount,'R43_REMOTE_ADMISSION_INCOMPLETE');
 const unsigned={schema:ADMISSION_SCHEMA,version:1,waveIssueNumber,waveId:wave.waveId,
  waveHash:wave.waveHash,sealedAt,complete:true,assignments};
 return {...unsigned,admissionHash:hash(unsigned)};
}
function validateAdmission(admission,wave,{allowPartial=false}={}){
 assert(admission?.schema===ADMISSION_SCHEMA&&admission.version===1,'R43_REMOTE_ADMISSION_SCHEMA');
 assert(admission.admissionHash===admissionHash(admission),'R43_REMOTE_ADMISSION_HASH');
 assert(admission.waveId===wave.waveId&&admission.waveHash===wave.waveHash,'R43_REMOTE_ADMISSION_WAVE');
 assert(Number.isSafeInteger(admission.waveIssueNumber)&&admission.waveIssueNumber>0,'R43_REMOTE_ADMISSION_WAVE_ISSUE');
 assert(Array.isArray(admission.assignments)&&admission.assignments.length<=wave.workerCount,'R43_REMOTE_ADMISSION_COUNT');
 if(!allowPartial)assert(admission.assignments.length===wave.workerCount,'R43_REMOTE_ADMISSION_COUNT');
 if(admission.complete!=null)assert(Boolean(admission.complete)===(admission.assignments.length===wave.workerCount),'R43_REMOTE_ADMISSION_COMPLETE');
 for(let i=0;i<admission.assignments.length;i++){
  const row=admission.assignments[i];
  assert(row.shardId===wave.shards[i].shardId,'R43_REMOTE_ADMISSION_ORDER');
  assert(Array.isArray(row.codes)&&row.codes.length===wave.shards[i].codes.length&&
   row.codes.every((code,j)=>code===wave.shards[i].codes[j]),'R43_REMOTE_ADMISSION_CODES');
  assert(Number.isSafeInteger(row.issueNumber)&&row.issueNumber>0,'R43_REMOTE_ADMISSION_ISSUE');
 }
 return true;
}
function assignmentFor(admission,requestId){
 const row=admission?.assignments?.find(x=>x.requestId===requestId);
 assert(row,'R43_REMOTE_NOT_ADMITTED');
 return structuredClone(row);
}
function originalClaimActive(assignment,now=Date.now()){
 if(!assignment||assignment.requestVersion!==REQUEST_VERSION||!assignment.productionClaimExpiresAt)return false;
 const t=typeof now==='number'?now:Date.parse(String(now));
 return Number.isFinite(t)&&t<Date.parse(assignment.productionClaimExpiresAt);
}

module.exports={
 REQUEST_MARKER,REQUEST_SCHEMA,REQUEST_VERSION,LEGACY_REQUEST_VERSION,
 ADMISSION_SCHEMA,MAX_REMOTE_WORKERS,DEFAULT_CLAIM_TTL_MS,
 createRequest,renderRequestBody,parseRequest,assignmentRows,materializeAdmission,
 sealAdmission,validateAdmission,assignmentFor,originalClaimActive
};
