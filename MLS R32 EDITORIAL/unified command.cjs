'use strict';

const core=require('./global dispatcher/core.js');

const GUIDE='docs/MLS Global Dispatcher/28 MLS Unified Verification Pipeline.md';
const EXECUTION_TARGET_ENTRIES=100;
const MIN_EXECUTION_TARGET_ENTRIES=100;
const MAX_EXECUTION_TARGET_ENTRIES=1000;
const EXECUTION_TARGET_STEP=5;
const MAX_MICROCLAIM_ENTRIES=50;
const STAGES={
  integration:{provider:'r33-index-integration',workPrefix:'r33-unified-integration:',action:'process_integration'},
  r33:{provider:'r33-farm',workPrefix:'r33-unified:',action:'process_r33'}
};

function fail(code,msg){const e=new Error(msg||code);e.code=code;e.status=409;throw e;}
function assert(ok,code,msg){if(!ok)fail(code,msg);}

function executionTarget(value=EXECUTION_TARGET_ENTRIES){
  const n=Number(value);
  assert(Number.isInteger(n),'UNIFIED_TARGET_INVALID','targetEntries debe ser un entero.');
  assert(n>=MIN_EXECUTION_TARGET_ENTRIES&&n<=MAX_EXECUTION_TARGET_ENTRIES,
    'UNIFIED_TARGET_INVALID','targetEntries debe estar entre '+MIN_EXECUTION_TARGET_ENTRIES+' y '+MAX_EXECUTION_TARGET_ENTRIES+'.');
  assert(n%EXECUTION_TARGET_STEP===0,'UNIFIED_TARGET_INVALID',
    'targetEntries debe ser múltiplo de '+EXECUTION_TARGET_STEP+'.');
  return n;
}
function parseUserCommand(text){
  const raw=String(text||'').trim();
  const normalized=raw.startsWith('`')&&raw.endsWith('`')?raw.slice(1,-1).trim():raw;
  const match=/^MLS\s+Unified\s+siguiente(?:\s+(\d+))?$/i.exec(normalized);
  assert(match,'UNIFIED_COMMAND_INVALID','Use MLS Unified siguiente o MLS Unified siguiente N.');
  const explicitTarget=match[1]!=null;
  return {
    command:'MLS Unified siguiente',
    targetEntries:executionTarget(explicitTarget?match[1]:EXECUTION_TARGET_ENTRIES),
    explicitTarget
  };
}
function stageSpec(stage){
  const spec=STAGES[String(stage||'').toLowerCase()];
  assert(spec,'UNIFIED_STAGE_INVALID','stage debe ser integration o r33.');
  return spec;
}
function createClaim({stage,requestId,workerId,workerLogin=null}={}){
  const spec=stageSpec(stage);
  assert(/^[A-Za-z0-9._:-]{8,120}$/.test(String(requestId||'')),'UNIFIED_CLAIM_REQUEST');
  assert(/^[A-Za-z0-9._:-]{8,160}$/.test(String(workerId||'')),'UNIFIED_CLAIM_WORKER');
  if(workerLogin!=null)assert(/^[A-Za-z0-9][A-Za-z0-9-]*(?:\[bot\])?$/.test(String(workerLogin)),
    'UNIFIED_CLAIM_LOGIN');
  const command={
    operation:'claim',
    requestId:String(requestId),
    workerId:String(workerId),
    ...(workerLogin?{workerLogin:String(workerLogin)}:{}),
    provider:spec.provider,
    workPrefix:spec.workPrefix,
    capabilities:['chat','github','mls-unified']
  };
  return {title:'[MLS Dispatcher][CLAIM] '+command.requestId,body:core.renderCommandBody(command),command};
}
function inspectAssignment(issue,{stage}={}){
  const spec=stageSpec(stage);
  assert(issue&&Number(issue.number)>0,'UNIFIED_ASSIGNMENT_ISSUE');
  const title=String(issue.title||'');
  for(const [prefix,action] of [
    ['[MLS Dispatcher][CAPACITY_BUSY]','capacity_busy'],
    ['[MLS Dispatcher][NO_WORK]','no_work'],
    ['[MLS Dispatcher][STALE]','stale_claim'],
    ['[MLS Dispatcher][DUPLICATE]','duplicate_claim'],
    ['[MLS Dispatcher][REJECTED]','rejected']
  ])if(title.startsWith(prefix))return {action,issueNumber:Number(issue.number),stage,guide:GUIDE};
  assert(title.startsWith('[MLS Dispatcher][LEASED]'),'UNIFIED_ASSIGNMENT_NOT_LEASED');
  const state=core.parseAssignmentState(issue.body||'');
  assert(state&&state.provider===spec.provider,'UNIFIED_ASSIGNMENT_PROVIDER');
  assert(String(state.workId||'').startsWith(spec.workPrefix),'UNIFIED_ASSIGNMENT_SCOPE');
  const codes=(state.resourceLocks||[])
    .filter(x=>String(x).startsWith('entry:'))
    .map(x=>String(x).slice(6));
  assert(codes.length>0&&codes.length<=MAX_MICROCLAIM_ENTRIES,'UNIFIED_ASSIGNMENT_CODES');
  return {
    action:spec.action,
    stage,
    issueNumber:Number(issue.number),
    assignmentId:state.assignmentId,
    workId:state.workId,
    workType:state.workType,
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
    integration:state.integration||null,
    guide:GUIDE
  };
}
module.exports={
  GUIDE,
  EXECUTION_TARGET_ENTRIES,
  MIN_EXECUTION_TARGET_ENTRIES,
  MAX_EXECUTION_TARGET_ENTRIES,
  EXECUTION_TARGET_STEP,
  MAX_MICROCLAIM_ENTRIES,
  STAGES,
  executionTarget,
  parseUserCommand,
  stageSpec,
  createClaim,
  inspectAssignment
};
