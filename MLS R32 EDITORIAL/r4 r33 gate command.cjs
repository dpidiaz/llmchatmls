'use strict';

const core=require('./global dispatcher/core.js');

const PROVIDER='r33-farm';
const WORK_PREFIX='r33-handoff:2208:';
const GUIDE='docs/MLS Global Dispatcher/23 R4.3 R33 Gate Worker Command.md';

function fail(code,msg){const e=new Error(msg||code);e.code=code;e.status=409;throw e;}
function assert(ok,code,msg){if(!ok)fail(code,msg);}

function createClaim({requestId,workerId,workerLogin=null}={}){
 assert(/^[A-Za-z0-9._:-]{8,120}$/.test(String(requestId||'')),'R43_R33_CLAIM_REQUEST');
 assert(/^[A-Za-z0-9._:-]{8,160}$/.test(String(workerId||'')),'R43_R33_CLAIM_WORKER');
 if(workerLogin!=null)assert(/^[A-Za-z0-9][A-Za-z0-9-]*(?:\[bot\])?$/.test(String(workerLogin)),
  'R43_R33_CLAIM_LOGIN');
 const command={
  operation:'claim',
  requestId:String(requestId),
  workerId:String(workerId),
  ...(workerLogin?{workerLogin:String(workerLogin)}:{}),
  provider:PROVIDER,
  workPrefix:WORK_PREFIX,
  capabilities:['chat','github','r43-r33-gate']
 };
 return {
  title:'[MLS Dispatcher][CLAIM] '+command.requestId,
  body:core.renderCommandBody(command),
  command
 };
}

function inspectAssignment(issue){
 assert(issue&&Number(issue.number)>0,'R43_R33_ASSIGNMENT_ISSUE');
 const title=String(issue.title||'');
 if(title.startsWith('[MLS Dispatcher][CAPACITY_BUSY]'))return {action:'capacity_busy',issueNumber:Number(issue.number),guide:GUIDE};
 if(title.startsWith('[MLS Dispatcher][NO_WORK]'))return {action:'no_work',issueNumber:Number(issue.number),guide:GUIDE};
 if(title.startsWith('[MLS Dispatcher][STALE]'))return {action:'stale_claim',issueNumber:Number(issue.number),guide:GUIDE};
 if(title.startsWith('[MLS Dispatcher][DUPLICATE]'))return {action:'duplicate_claim',issueNumber:Number(issue.number),guide:GUIDE};
 assert(title.startsWith('[MLS Dispatcher][LEASED]'),'R43_R33_ASSIGNMENT_NOT_LEASED');
 const state=core.parseAssignmentState(issue.body||'');
 assert(state.provider===PROVIDER,'R43_R33_ASSIGNMENT_PROVIDER');
 assert(String(state.workId||'').startsWith(WORK_PREFIX),'R43_R33_ASSIGNMENT_SCOPE');
 const codes=(state.resourceLocks||[])
  .filter(x=>String(x).startsWith('entry:'))
  .map(x=>String(x).slice(6));
 assert(codes.length>0&&codes.length<=10,'R43_R33_ASSIGNMENT_CODES');
 return {
  action:'process_r33',
  issueNumber:Number(issue.number),
  assignmentId:state.assignmentId,
  workId:state.workId,
  branch:state.branch,
  baseCommit:state.baseCommit,
  leaseToken:state.leaseToken,
  leaseEpoch:state.leaseEpoch,
  ackDeadlineAt:state.ackDeadlineAt,
  expiresAt:state.expiresAt,
  codes,
  allowedPaths:[...(state.allowedPaths||[])],
  instructions:state.instructions,
  validationRequired:[...(state.validationRequired||[])],
  guide:GUIDE
 };
}

module.exports={PROVIDER,WORK_PREFIX,GUIDE,createClaim,inspectAssignment};
