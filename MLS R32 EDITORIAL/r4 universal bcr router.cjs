'use strict';

/**
 * MLS BCR universal command router.
 *
 * Pure decision layer for the user-facing command "MLS BCR siguiente".
 * It performs no GitHub writes and never treats chat memory as ownership.
 */
const waveIssue=require('./r4 snapshot wave issue.cjs');

function fail(code,msg){const e=new Error(msg||code);e.code=code;e.status=409;throw e;}
function assert(ok,code,msg){if(!ok)fail(code,msg);}

function parseWaveCandidates(issues){
 const out=[];
 for(const issue of Array.isArray(issues)?issues:[]){
  if(!String(issue?.body||'').includes(waveIssue.MARKER))continue;
  let record;
  try{record=waveIssue.parse(issue);}catch{continue;}
  if(!['collecting','sealed'].includes(record.status))continue;
  out.push({issue,record});
 }
 return out;
}

function route({issues=[],requestIssueNumber=null}={}){
 const active=parseWaveCandidates(issues);
 assert(active.length<=1,'R43_UNIVERSAL_MULTIPLE_ACTIVE_WAVES');

 if(active.length===0){
  return {
   backend:'r42-elastic',
   action:'request-next',
   reason:'NO_ACTIVE_R43_WAVE'
  };
 }

 const {issue,record}=active[0];

 if(record.status==='collecting'){
  return {
   backend:'r43-snapshot',
   action:'request-admission',
   reason:'R43_WAVE_COLLECTING',
   waveIssueNumber:Number(issue.number),
   waveId:record.waveId,
   waveHash:record.waveHash
  };
 }

 assert(record.status==='sealed','R43_UNIVERSAL_WAVE_STATUS');

 if(Number.isSafeInteger(Number(requestIssueNumber))&&Number(requestIssueNumber)>0){
  const assigned=record.admission?.assignments?.find(
   x=>Number(x.issueNumber)===Number(requestIssueNumber)
  );
  if(assigned){
   return {
    backend:'r43-snapshot',
    action:'resume-assigned-shard',
    reason:'R43_EXISTING_ADMISSION',
    waveIssueNumber:Number(issue.number),
    waveId:record.waveId,
    waveHash:record.waveHash,
    requestIssueNumber:Number(requestIssueNumber),
    shardId:assigned.shardId,
    codes:[...assigned.codes]
   };
  }
 }

 return {
  backend:'r42-elastic',
  action:'request-next',
  reason:'R43_WAVE_SEALED_NOT_ADMITTED',
  excludedWaveIssueNumber:Number(issue.number),
  excludedWaveId:record.waveId
 };
}

module.exports={parseWaveCandidates,route};
