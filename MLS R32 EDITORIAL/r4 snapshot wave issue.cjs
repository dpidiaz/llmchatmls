'use strict';
const crypto=require('node:crypto');
const farm=require('./r4 snapshot farm.cjs');
const remote=require('./r4 snapshot remote admission.cjs');

const MARKER='MLS_BCR_R43_WAVE';
const SCHEMA='MLS-BCR-R43-WAVE-ISSUE-1';

function fail(code,msg){const e=new Error(msg||code);e.code=code;e.status=409;throw e;}
function assert(ok,code,msg){if(!ok)fail(code,msg);}
function stable(x){
 if(Array.isArray(x))return '['+x.map(stable).join(',')+']';
 if(x&&typeof x==='object')return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';
 return JSON.stringify(x);
}
function hash(x){return crypto.createHash('sha256').update(stable(x)).digest('hex');}
function marker(text){
 const re=new RegExp('<!--\\s*'+MARKER+'\\s*\\n([\\s\\S]*?)\\n-->','g');
 const m=[...String(text||'').matchAll(re)];
 assert(m.length===1,'R43_WAVE_MARKER_CARDINALITY');
 try{return JSON.parse(m[0][1]);}catch{fail('R43_WAVE_MARKER_JSON');}
}
function title(record){
 return '[MLS BCR R4.3][WAVE]['+String(record.status).toUpperCase()+'] '+record.waveId;
}
function create({waveIssueNumber,reservationIssueNumbers,snapshot,wave,createdAt,route='remote'}){
 farm.validateWave(snapshot,wave);
 assert(Number.isSafeInteger(waveIssueNumber)&&waveIssueNumber>0,'R43_WAVE_ISSUE_NUMBER');
 assert(Array.isArray(reservationIssueNumbers)&&reservationIssueNumbers.length>0,'R43_WAVE_RESERVATIONS');
 assert(new Set(reservationIssueNumbers).size===reservationIssueNumbers.length,'R43_WAVE_RESERVATION_DUP');
 assert(reservationIssueNumbers.every(x=>Number.isSafeInteger(x)&&x>0),'R43_WAVE_RESERVATION_NUMBER');
 assert(!Number.isNaN(Date.parse(String(createdAt||''))),'R43_WAVE_CREATED_AT');
 assert(['chatgpt-library','remote'].includes(route),'R43_WAVE_ROUTE');
 if(route==='remote')assert(wave.workerCount<=remote.MAX_REMOTE_WORKERS,'R43_WAVE_REMOTE_CAP');
 const unsigned={
  schema:SCHEMA,version:1,status:'collecting',
  waveIssueNumber,waveId:wave.waveId,waveHash:wave.waveHash,
  snapshotHash:snapshot.snapshotHash,baseCommit:snapshot.baseCommit,
  contentManifestBlobSha:snapshot.contentManifestBlobSha,
  snapshotCreatedAt:snapshot.createdAt,waveCreatedAt:wave.createdAt,
  workerCount:wave.workerCount,shardSize:wave.shardSize,totalUnits:wave.totalUnits,
  reservationIssueNumbers:[...reservationIssueNumbers],
  route,createdAt,admission:null,reconciliation:null
 };
 return {...unsigned,recordHash:hash(unsigned)};
}
function validate(record,snapshot,wave){
 assert(record?.schema===SCHEMA&&record.version===1,'R43_WAVE_SCHEMA');
 const unsigned={...record};delete unsigned.recordHash;
 assert(record.recordHash===hash(unsigned),'R43_WAVE_HASH');
 farm.validateWave(snapshot,wave);
 assert(record.waveId===wave.waveId&&record.waveHash===wave.waveHash,'R43_WAVE_IDENTITY');
 assert(record.snapshotHash===snapshot.snapshotHash,'R43_WAVE_SNAPSHOT');
 assert(record.baseCommit===snapshot.baseCommit,'R43_WAVE_BASE');
 assert(record.snapshotCreatedAt===snapshot.createdAt&&record.waveCreatedAt===wave.createdAt,'R43_WAVE_TIMES');
 assert(record.workerCount===wave.workerCount&&record.totalUnits===wave.totalUnits,'R43_WAVE_COUNTS');
 assert(['collecting','sealed','reconciled','blocked'].includes(record.status),'R43_WAVE_STATUS');
 if(record.status==='sealed'||record.status==='reconciled'){
  remote.validateAdmission(record.admission,wave);
 }
 return true;
}
function seal(record,snapshot,wave,admission,sealedAt){
 validate(record,snapshot,wave);
 assert(record.status==='collecting','R43_WAVE_NOT_COLLECTING');
 remote.validateAdmission(admission,wave);
 assert(!Number.isNaN(Date.parse(String(sealedAt||''))),'R43_WAVE_SEALED_AT');
 const unsigned={...record,status:'sealed',admission:structuredClone(admission),sealedAt};
 delete unsigned.recordHash;
 return {...unsigned,recordHash:hash(unsigned)};
}
function reconcile(record,snapshot,wave,reconciliation,reconciledAt){
 validate(record,snapshot,wave);
 assert(record.status==='sealed','R43_WAVE_NOT_SEALED');
 assert(reconciliation?.waveId===wave.waveId&&reconciliation.waveHash===wave.waveHash,'R43_WAVE_RECONCILIATION');
 assert(reconciliation.complete===true,'R43_WAVE_RECONCILIATION_INCOMPLETE');
 assert(!Number.isNaN(Date.parse(String(reconciledAt||''))),'R43_WAVE_RECONCILED_AT');
 const unsigned={...record,status:'reconciled',reconciliation:structuredClone(reconciliation),reconciledAt};
 delete unsigned.recordHash;
 return {...unsigned,recordHash:hash(unsigned)};
}
function render(record){
 return ['## MLS BCR R4.3 Snapshot Wave','',
  '**Estado:** '+record.status+'  ',
  '**Wave:** '+record.waveId+'  ',
  '**Workers:** '+record.workerCount+'  ',
  '**Entradas:** '+record.totalUnits+'  ',
  '**Route:** '+record.route+'  ','',
  'Snapshot and wave identities are immutable. Produced is not VERIFIED.','',
  '<!-- '+MARKER+'\n'+JSON.stringify(record)+'\n-->'].join('\n');
}
function parse(issue){
 assert(Number(issue?.number)>0,'R43_WAVE_ISSUE');
 const r=marker(issue.body);
 assert(Number(r.waveIssueNumber)===Number(issue.number),'R43_WAVE_ISSUE_MISMATCH');
 assert(String(issue.title||'')===title(r),'R43_WAVE_TITLE');
 return r;
}

module.exports={MARKER,SCHEMA,title,create,validate,seal,reconcile,render,parse};
