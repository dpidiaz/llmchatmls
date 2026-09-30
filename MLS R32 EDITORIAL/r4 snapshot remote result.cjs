'use strict';
const zlib=require('node:zlib');
const crypto=require('node:crypto');
const farm=require('./r4 snapshot farm.cjs');
const admissionCore=require('./r4 snapshot remote admission.cjs');

const RESULT_MARKER='MLS_BCR_R43_RESULT';
const RESULT_SCHEMA='MLS-BCR-R43-RESULT-1';
const MAX_RESULT_BODY_BYTES=60000;

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

function encodeDelta(wave,delta,{waveIssueNumber}={}){
 farm.validateDelta(wave,delta);
 assert(Number.isSafeInteger(waveIssueNumber)&&waveIssueNumber>0,'R43_REMOTE_WAVE_ISSUE');
 const raw=Buffer.from(JSON.stringify(delta),'utf8');
 const compressed=zlib.deflateRawSync(raw,{level:9});
 const unsigned={
  schema:RESULT_SCHEMA,version:1,waveIssueNumber,waveId:wave.waveId,waveHash:wave.waveHash,
  shardId:delta.shardId,deltaHash:delta.deltaHash,
  encoding:'deflate-raw-base64',rawBytes:raw.length,
  compressedBytes:compressed.length,data:compressed.toString('base64')
 };
 return {...unsigned,resultHash:hash(unsigned)};
}
function renderResultBody(result){
 const body=['## MLS BCR R4.3 durable worker result','',
  'Immutable compressed delta. Produced is not VERIFIED.','',
  renderMarker(RESULT_MARKER,result)].join('\n');
 assert(Buffer.byteLength(body,'utf8')<=MAX_RESULT_BODY_BYTES,'R43_REMOTE_RESULT_TOO_LARGE');
 return body;
}
function decodeResult(issue,wave,admission){
 assert(authorized(issue),'R43_REMOTE_OWNER');
 admissionCore.validateAdmission(admission,wave);
 const r=marker(issue.body,RESULT_MARKER);
 assert(r?.schema===RESULT_SCHEMA&&r.version===1,'R43_REMOTE_RESULT_SCHEMA');
 const unsigned={...r};delete unsigned.resultHash;
 assert(r.resultHash===hash(unsigned),'R43_REMOTE_RESULT_HASH');
 assert(r.waveId===wave.waveId&&r.waveHash===wave.waveHash,'R43_REMOTE_RESULT_WAVE');
 assert(r.waveIssueNumber===admission.assignments[0]?.waveIssueNumber || Number.isSafeInteger(r.waveIssueNumber),'R43_REMOTE_RESULT_WAVE_ISSUE');
 assert(r.encoding==='deflate-raw-base64','R43_REMOTE_RESULT_ENCODING');
 const assigned=admission.assignments.find(x=>x.issueNumber===Number(issue.number));
 assert(assigned&&assigned.shardId===r.shardId,'R43_REMOTE_RESULT_NOT_OWNER');
 const raw=zlib.inflateRawSync(Buffer.from(r.data,'base64'),{maxOutputLength:8*1024*1024});
 assert(raw.length===r.rawBytes,'R43_REMOTE_RESULT_SIZE');
 let delta;try{delta=JSON.parse(raw.toString('utf8'));}catch{fail('R43_REMOTE_RESULT_JSON');}
 farm.validateDelta(wave,delta);
 assert(delta.deltaHash===r.deltaHash&&delta.shardId===assigned.shardId,'R43_REMOTE_RESULT_DELTA');
 return delta;
}
function collectResults(issues,wave,admission){
 const byIssue=new Map((issues||[]).map(i=>[Number(i.number),i])),deltas=[],missing=[];
 for(const row of admission.assignments){
  const issue=byIssue.get(row.issueNumber);
  if(!issue||!String(issue.body||'').includes(RESULT_MARKER)){missing.push(row.shardId);continue;}
  deltas.push(decodeResult(issue,wave,admission));
 }
 return {deltas,missing,reconciliation:farm.reconcileWave(wave,deltas)};
}

module.exports={
 RESULT_MARKER,RESULT_SCHEMA,MAX_RESULT_BODY_BYTES,
 encodeDelta,renderResultBody,decodeResult,collectResults
};
