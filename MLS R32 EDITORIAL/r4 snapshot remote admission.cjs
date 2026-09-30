'use strict';
const crypto=require('node:crypto');
const farm=require('./r4 snapshot farm.cjs');

const REQUEST_MARKER='MLS_BCR_R43_REQUEST';
const REQUEST_SCHEMA='MLS-BCR-R43-REQUEST-1';
const ADMISSION_SCHEMA='MLS-BCR-R43-ADMISSION-1';
const MAX_REMOTE_WORKERS=50;

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

function createRequest(wave,{waveIssueNumber,requestId,createdAt}){
 assert(wave?.schema===farm.WAVE_SCHEMA,'R43_REMOTE_WAVE');
 assert(wave.workerCount<=MAX_REMOTE_WORKERS,'R43_REMOTE_WORKER_CAP');
 assert(Number.isSafeInteger(waveIssueNumber)&&waveIssueNumber>0,'R43_REMOTE_WAVE_ISSUE');
 assert(/^[A-Za-z0-9._:-]{8,160}$/.test(String(requestId||'')),'R43_REMOTE_REQUEST_ID');
 assert(!Number.isNaN(Date.parse(String(createdAt||''))),'R43_REMOTE_CREATED_AT');
 const unsigned={schema:REQUEST_SCHEMA,version:1,waveIssueNumber,waveId:wave.waveId,
  waveHash:wave.waveHash,requestId,createdAt};
 return {...unsigned,requestHash:hash(unsigned)};
}
function renderRequestBody(request){
 return ['## MLS BCR R4.3 remote fallback request','',
  'One-shot admission only. No lease renewal/checkpoint lifecycle.','',
  renderMarker(REQUEST_MARKER,request)].join('\n');
}
function parseRequest(issue,wave,waveIssueNumber=null){
 assert(authorized(issue),'R43_REMOTE_OWNER');
 assert(String(issue?.title||'').startsWith('[MLS BCR R4.3][REQUEST] '),'R43_REMOTE_TITLE');
 const r=marker(issue.body,REQUEST_MARKER);
 assert(r?.schema===REQUEST_SCHEMA&&r.version===1,'R43_REMOTE_REQUEST_SCHEMA');
 const unsigned={...r};delete unsigned.requestHash;
 assert(r.requestHash===hash(unsigned),'R43_REMOTE_REQUEST_HASH');
 assert(r.waveId===wave.waveId&&r.waveHash===wave.waveHash,'R43_REMOTE_REQUEST_WAVE');
 if(waveIssueNumber!=null)assert(r.waveIssueNumber===waveIssueNumber,'R43_REMOTE_REQUEST_WAVE_ISSUE');
 return r;
}
function sealAdmission(wave,issues,{sealedAt,waveIssueNumber=null}={}){
 assert(wave?.schema===farm.WAVE_SCHEMA,'R43_REMOTE_WAVE');
 assert(wave.workerCount<=MAX_REMOTE_WORKERS,'R43_REMOTE_WORKER_CAP');
 assert(!Number.isNaN(Date.parse(String(sealedAt||''))),'R43_REMOTE_SEALED_AT');
 const seen=new Set(),rows=[];
 for(const issue of [...issues].sort((a,b)=>Number(a.number)-Number(b.number))){
  let r;try{r=parseRequest(issue,wave,waveIssueNumber);}catch{continue;}
  if(seen.has(r.requestId))continue;
  seen.add(r.requestId);
  rows.push({issueNumber:Number(issue.number),requestId:r.requestId,requestHash:r.requestHash});
  if(rows.length===wave.workerCount)break;
 }
 assert(rows.length===wave.workerCount,'R43_REMOTE_ADMISSION_INCOMPLETE');
 const assignments=rows.map((row,i)=>({...row,shardId:wave.shards[i].shardId,codes:[...wave.shards[i].codes]}));
 const unsigned={schema:ADMISSION_SCHEMA,version:1,waveId:wave.waveId,
  waveHash:wave.waveHash,sealedAt,assignments};
 return {...unsigned,admissionHash:hash(unsigned)};
}
function validateAdmission(admission,wave){
 assert(admission?.schema===ADMISSION_SCHEMA&&admission.version===1,'R43_REMOTE_ADMISSION_SCHEMA');
 const unsigned={...admission};delete unsigned.admissionHash;
 assert(admission.admissionHash===hash(unsigned),'R43_REMOTE_ADMISSION_HASH');
 assert(admission.waveId===wave.waveId&&admission.waveHash===wave.waveHash,'R43_REMOTE_ADMISSION_WAVE');
 assert(admission.assignments.length===wave.workerCount,'R43_REMOTE_ADMISSION_COUNT');
 for(let i=0;i<admission.assignments.length;i++){
  assert(admission.assignments[i].shardId===wave.shards[i].shardId,'R43_REMOTE_ADMISSION_ORDER');
 }
 return true;
}
function assignmentFor(admission,requestId){
 const row=admission?.assignments?.find(x=>x.requestId===requestId);
 assert(row,'R43_REMOTE_NOT_ADMITTED');
 return structuredClone(row);
}

module.exports={
 REQUEST_MARKER,REQUEST_SCHEMA,ADMISSION_SCHEMA,MAX_REMOTE_WORKERS,
 createRequest,renderRequestBody,parseRequest,sealAdmission,validateAdmission,assignmentFor
};
