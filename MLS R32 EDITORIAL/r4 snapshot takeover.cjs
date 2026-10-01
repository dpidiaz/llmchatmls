'use strict';
const crypto=require('node:crypto');
const admissionCore=require('./r4 snapshot remote admission.cjs');

const MARKER='MLS_BCR_R43_TAKEOVER';
const SCHEMA='MLS-BCR-R43-TAKEOVER-1';
const DEFAULT_TTL_MS=30*60*1000;

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
function marker(text){
 const re=new RegExp('<!--\\s*'+MARKER+'\\s*\\n([\\s\\S]*?)\\n-->','g');
 const m=[...String(text||'').matchAll(re)];
 assert(m.length===1,'R43_TAKEOVER_MARKER_CARDINALITY');
 try{return JSON.parse(m[0][1]);}catch{fail('R43_TAKEOVER_MARKER_JSON');}
}
function renderMarker(value){return '<!-- '+MARKER+'\n'+JSON.stringify(value)+'\n-->';}

function create(wave,admission,{
 waveIssueNumber,takeoverId,targetShardId,targetRequestIssueNumber,
 claimedAt,ttlMs=DEFAULT_TTL_MS
}={}){
 admissionCore.validateAdmission(admission,wave,{allowPartial:admission?.assignments?.length<wave.workerCount});
 assert(Number.isSafeInteger(waveIssueNumber)&&waveIssueNumber===admission.waveIssueNumber,
  'R43_TAKEOVER_WAVE_ISSUE');
 assert(/^[A-Za-z0-9._:-]{8,160}$/.test(String(takeoverId||'')),'R43_TAKEOVER_ID');
 assert(!Number.isNaN(Date.parse(String(claimedAt||''))),'R43_TAKEOVER_CLAIMED_AT');
 assert(Number.isInteger(ttlMs)&&ttlMs>=5*60*1000&&ttlMs<=60*60*1000,'R43_TAKEOVER_TTL');
 const assignment=admission.assignments.find(x=>x.shardId===targetShardId);
 assert(assignment,'R43_TAKEOVER_SHARD');
 assert(Number(assignment.issueNumber)===Number(targetRequestIssueNumber),'R43_TAKEOVER_REQUEST_ISSUE');
 const expiresAt=new Date(Date.parse(claimedAt)+ttlMs).toISOString();
 const unsigned={
  schema:SCHEMA,version:1,waveIssueNumber,waveId:wave.waveId,waveHash:wave.waveHash,
  takeoverId,targetShardId,targetRequestIssueNumber:Number(targetRequestIssueNumber),
  claimedAt,expiresAt
 };
 return {...unsigned,claimHash:hash(unsigned)};
}
function renderBody(claim){
 return ['## MLS R4.3 fresh-chat takeover','',
  'Temporary single-shard recovery claim. No renew/heartbeat lifecycle.','',
  renderMarker(claim)].join('\n');
}
function parse(issue,wave,admission){
 assert(authorized(issue),'R43_TAKEOVER_OWNER');
 assert(String(issue?.title||'').startsWith('[MLS BCR R4.3][TAKEOVER] '),'R43_TAKEOVER_TITLE');
 admissionCore.validateAdmission(admission,wave);
 const claim=marker(issue.body);
 assert(claim?.schema===SCHEMA&&claim.version===1,'R43_TAKEOVER_SCHEMA');
 const unsigned={...claim};delete unsigned.claimHash;
 assert(claim.claimHash===hash(unsigned),'R43_TAKEOVER_HASH');
 assert(claim.waveIssueNumber===admission.waveIssueNumber,'R43_TAKEOVER_WAVE_ISSUE');
 assert(claim.waveId===wave.waveId&&claim.waveHash===wave.waveHash,'R43_TAKEOVER_WAVE');
 const assignment=admission.assignments.find(x=>x.shardId===claim.targetShardId);
 assert(assignment,'R43_TAKEOVER_SHARD');
 assert(Number(assignment.issueNumber)===Number(claim.targetRequestIssueNumber),'R43_TAKEOVER_REQUEST_ISSUE');
 assert(!Number.isNaN(Date.parse(claim.claimedAt))&&!Number.isNaN(Date.parse(claim.expiresAt)),
  'R43_TAKEOVER_TIME');
 assert(Date.parse(claim.expiresAt)>Date.parse(claim.claimedAt),'R43_TAKEOVER_EXPIRY');
 return claim;
}
function rows(issues,wave,admission){
 const out=[];
 for(const issue of issues||[]){
  if(!String(issue?.body||'').includes(MARKER))continue;
  let claim;try{claim=parse(issue,wave,admission);}catch{continue;}
  out.push({issue,claim});
 }
 return out.sort((a,b)=>Number(a.issue.number)-Number(b.issue.number));
}
function activeWinners(issues,wave,admission,now){
 const t=Date.parse(String(now||''));
 assert(Number.isFinite(t),'R43_TAKEOVER_NOW');
 const winners=new Map();
 for(const row of rows(issues,wave,admission)){
  if(Date.parse(row.claim.expiresAt)<=t)continue;
  if(!winners.has(row.claim.targetShardId))winners.set(row.claim.targetShardId,row);
 }
 return winners;
}
function rowForId(issues,wave,admission,takeoverId){
 const matched=rows(issues,wave,admission).filter(x=>x.claim.takeoverId===takeoverId);
 assert(matched.length<=1,'R43_TAKEOVER_DUPLICATE_ID');
 return matched[0]||null;
}

module.exports={
 MARKER,SCHEMA,DEFAULT_TTL_MS,
 create,renderBody,parse,rows,activeWinners,rowForId
};
