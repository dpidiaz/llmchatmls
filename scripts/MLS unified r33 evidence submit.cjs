'use strict';

const fs=require('node:fs');
const path=require('node:path');

const workspace=process.env.GITHUB_WORKSPACE||process.cwd();
const core=require(path.join(workspace,'MLS R32 EDITORIAL','global dispatcher','core.js'));
const foundation=require(path.join(workspace,'MLS R32 EDITORIAL','evidence foundation.js'));
const SOURCE_PREFIX='MLS R32 EDITORIAL/evidence git/registry/sources/';
const MARKER='MLS_UNIFIED_R33_EVIDENCE_SUBMIT';
const AUTHORIZED=new Set(['OWNER','MEMBER','COLLABORATOR']);
const MAX_BATCH=Number(process.env.MLS_UNIFIED_R33_MAX_BATCH||50);

function fail(code,message){const e=new Error(message||code);e.code=code;throw e;}
function validateSequence(value,max,errorCode){
  const sequence=Number(value);
  if(!Number.isInteger(sequence)||sequence<0||sequence>max)fail(errorCode);
  return sequence;
}
function extractMarked(text){
  const m=new RegExp('<!--\\s*'+MARKER+'\\s*([\\s\\S]*?)-->','m').exec(String(text||''));
  if(!m)fail('UNIFIED_EVIDENCE_MARKER_MISSING');
  try{return JSON.parse(m[1].trim())}catch{fail('UNIFIED_EVIDENCE_JSON_INVALID')}
}
function githubContext(){
  const token=process.env.GITHUB_TOKEN||'';
  const repository=process.env.GITHUB_REPOSITORY||'';
  if(!token||repository.split('/').length!==2||repository.startsWith('/')||repository.endsWith('/'))fail('GITHUB_CONTEXT_MISSING');
  return {token,repository};
}
async function gh(endpoint,{method='GET',body}={}){
  const {token}=githubContext();
  const response=await fetch('https://api.github.com'+endpoint,{
    method,
    headers:{authorization:'Bearer '+token,accept:'application/vnd.github+json','content-type':'application/json','x-github-api-version':'2022-11-28','user-agent':'mls-unified-r33-evidence-submit'},
    body:body===undefined?undefined:JSON.stringify(body)
  });
  const text=await response.text();let data=null;try{data=text?JSON.parse(text):null}catch{data=text}
  if(!response.ok)fail('GITHUB_'+response.status,data?.message||text||'GitHub request failed');
  return data;
}
function encodeRef(ref){return String(ref).split('/').map(encodeURIComponent).join('/');}
function repairSourcePathAllowed(sourcePath,state,code,sourceId){
  if(core.pathAllowed(sourcePath,state.allowedPaths||[]))return true;
  return state.provider==='r33-farm' &&
    String(state.workId||'').startsWith('r33-unified:') &&
    String(state.branch||'').startsWith('worker/r33-unified/') &&
    (state.resourceLocks||[]).includes('entry:'+code) &&
    sourcePath===SOURCE_PREFIX+sourceId+'.json';
}
function validate(issue,comment,payload){
  if(!String(issue?.title||'').startsWith('[MLS Dispatcher][LEASED]'))fail('UNIFIED_EVIDENCE_NOT_LEASED');
  const state=core.parseAssignmentState(issue?.body||'');
  if(!state||state.status!=='leased')fail('UNIFIED_EVIDENCE_STATE_INVALID');
  const login=String(comment?.user?.login||'');
  const botAuthorized=login==='github-actions[bot]'&&state.workerLogin===login&&state.provider==='r33-farm'&&String(state.workId||'').startsWith('r33-unified:');
  if(!AUTHORIZED.has(String(comment?.author_association||'').toUpperCase())&&!botAuthorized)fail('UNIFIED_EVIDENCE_AUTHOR_UNAUTHORIZED');
  if(state.provider!=='r33-farm'||!String(state.workId||'').startsWith('r33-unified:'))fail('UNIFIED_EVIDENCE_SCOPE_INVALID');
  if(!String(state.branch||'').startsWith('worker/r33-unified/'))fail('UNIFIED_EVIDENCE_BRANCH_INVALID');
  if(state.workerLogin&&String(comment?.user?.login||'')!==String(state.workerLogin))fail('UNIFIED_EVIDENCE_WORKER_LOGIN_MISMATCH');
  if(String(payload?.assignmentId||'')!==String(state.assignmentId))fail('UNIFIED_EVIDENCE_ASSIGNMENT_MISMATCH');
  if(Number(payload?.leaseEpoch)!==Number(state.leaseEpoch))fail('UNIFIED_EVIDENCE_EPOCH_MISMATCH');
  const code=String(payload?.code||'').toUpperCase();
  if(!/^MLS-V\d{2}-\d{4}$/.test(code))fail('UNIFIED_EVIDENCE_CODE_INVALID');
  if(!(state.resourceLocks||[]).includes('entry:'+code))fail('UNIFIED_EVIDENCE_CODE_OUT_OF_SCOPE');
  const evidence=payload?.evidence;
  if(!evidence||typeof evidence!=='object'||Array.isArray(evidence))fail('UNIFIED_EVIDENCE_PAYLOAD_INVALID');
  if(String(evidence.code||'').toUpperCase()!==code)fail('UNIFIED_EVIDENCE_CODE_MISMATCH');
  if(String(evidence.status||'')!=='VERIFIED')fail('UNIFIED_EVIDENCE_STATUS_INVALID');
  const evidencePath=(state.allowedPaths||[]).find(p=>String(p).startsWith('MLS R32 EDITORIAL/evidence git/entries/')&&String(p).endsWith('/'+code+'.json'));
  if(!evidencePath)fail('UNIFIED_EVIDENCE_PATH_MISSING');
  const contentPath=String(evidence.contentPath||'');
  if(!contentPath||(state.allowedPaths||[]).includes(contentPath)===false||!contentPath.startsWith('content/'))fail('UNIFIED_EVIDENCE_CONTENT_PATH_INVALID');
  const content=payload?.content??null;
  if(content!==null){
    if(!content||typeof content!=='object'||Array.isArray(content))fail('UNIFIED_EVIDENCE_CONTENT_INVALID');
    if(String(content.code||'').toUpperCase()!==code)fail('UNIFIED_EVIDENCE_CONTENT_CODE_MISMATCH');
    if(String(content.language||'')!==String(evidence.language||''))fail('UNIFIED_EVIDENCE_CONTENT_LANGUAGE_MISMATCH');
    if(typeof content.articleMarkdown!=='string'||!content.articleMarkdown.trim())fail('UNIFIED_EVIDENCE_CONTENT_MARKDOWN_MISSING');
  }
  const sources=Array.isArray(payload?.sources)?payload.sources:[];
  if(sources.length>8)fail('UNIFIED_EVIDENCE_REPAIR_SOURCES_TOO_MANY');
  const referenced=new Set((evidence.links||[]).map(x=>String(x?.sourceId||'')));
  const normalizedSources=sources.map(raw=>{
    if(!raw||typeof raw!=='object'||Array.isArray(raw))fail('UNIFIED_EVIDENCE_REPAIR_SOURCE_INVALID');
    const sourceId=String(raw.sourceId||'').toUpperCase(),metadata=raw.metadata;
    if(!/^MLS-SRC-[A-F0-9]{20}$/.test(sourceId))fail('UNIFIED_EVIDENCE_REPAIR_SOURCE_ID_INVALID');
    if(!metadata||typeof metadata!=='object'||Array.isArray(metadata))fail('UNIFIED_EVIDENCE_REPAIR_SOURCE_METADATA_INVALID');
    if(!['institutional_webpage','reference_entry','report'].includes(String(metadata.sourceType||'')))fail('UNIFIED_EVIDENCE_REPAIR_SOURCE_TYPE_INVALID');
    if(String(metadata.status||'active')!=='active'||!String(metadata.title||'').trim()||!String(metadata.canonicalUrl||'').trim())fail('UNIFIED_EVIDENCE_REPAIR_SOURCE_METADATA_INCOMPLETE');
    if(!referenced.has(sourceId))fail('UNIFIED_EVIDENCE_REPAIR_SOURCE_UNREFERENCED');
    const sourcePath=SOURCE_PREFIX+sourceId+'.json';
    if(!repairSourcePathAllowed(sourcePath,state,code,sourceId))fail('UNIFIED_EVIDENCE_REPAIR_SOURCE_PATH_OUT_OF_SCOPE');
    return {sourceId,metadata,sourcePath};
  });
  const expires=Date.parse(String(state.expiresAt||''));
  if(!Number.isFinite(expires)||Date.now()>expires)fail('UNIFIED_EVIDENCE_LEASE_EXPIRED');
  return {state,code,evidencePath,contentPath,evidence,content,sources:normalizedSources};
}
function appendOutput(name,value){
  const out=process.env.GITHUB_OUTPUT;
  if(!out)fail('GITHUB_OUTPUT_MISSING');
  fs.appendFileSync(out,name+'='+String(value).replace(/\r?\n/g,' ')+'\n');
}
async function prepare(){
  const event=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8'));
  const repository=process.env.GITHUB_REPOSITORY;
  let eventIssue=event.issue||null,eventComment=event.comment||null;
  if(!eventIssue||!eventComment){
    const issueNumber=Number(process.env.MLS_UNIFIED_ISSUE_NUMBER||0);
    const commentId=Number(process.env.MLS_UNIFIED_COMMENT_ID||0);
    if(!Number.isInteger(issueNumber)||issueNumber<1||!Number.isInteger(commentId)||commentId<1)fail('UNIFIED_EVIDENCE_EVENT_INVALID');
    eventIssue={number:issueNumber};
    eventComment=await gh('/repos/'+repository+'/issues/comments/'+commentId);
  }
  const issue=await gh('/repos/'+repository+'/issues/'+eventIssue.number);
  const payload=extractMarked(eventComment.body||'');
  const validated=validate(issue,eventComment,payload);
  const bundlePath=path.join(process.env.RUNNER_TEMP||workspace,'mls-unified-r33-evidence-submit.json');
  fs.writeFileSync(bundlePath,JSON.stringify({
    issueNumber:Number(issue.number),
    commentId:Number(eventComment.id),
    branch:validated.state.branch,
    assignmentId:validated.state.assignmentId,
    leaseEpoch:validated.state.leaseEpoch,
    code:validated.code,
    evidencePath:validated.evidencePath,
    contentPath:validated.contentPath,
    evidence:validated.evidence,
    content:validated.content,
    sources:validated.sources
  },null,2)+'\n');
  appendOutput('branch',validated.state.branch);
  appendOutput('code',validated.code);
  appendOutput('evidence_path',validated.evidencePath);
  appendOutput('content_path',validated.contentPath);
  appendOutput('bundle_path',bundlePath);
}
function safeTarget(repoPath,code){
  const target=path.resolve(workspace,String(repoPath||''));
  const root=path.resolve(workspace)+path.sep;
  if(!target.startsWith(root))fail(code);
  return target;
}
async function apply(){
  const bundlePath=process.argv[3]||path.join(process.env.RUNNER_TEMP||workspace,'mls-unified-r33-evidence-submit.json');
  const bundle=JSON.parse(fs.readFileSync(bundlePath,'utf8'));
  const writtenSources=[];
  for(const source of bundle.sources||[]){
    const normalized=await foundation.normalizeSourceMetadata(source.metadata||{});
    if(normalized.sourceId!==source.sourceId)fail('UNIFIED_EVIDENCE_REPAIR_SOURCE_ID_MISMATCH');
    const sourceTarget=safeTarget(source.sourcePath,'UNIFIED_EVIDENCE_REPAIR_SOURCE_TARGET_ESCAPE');
    if(fs.existsSync(sourceTarget)){
      const existing=JSON.parse(fs.readFileSync(sourceTarget,'utf8')),current=await foundation.normalizeSourceMetadata(existing.metadata||{});
      if(current.sourceId!==source.sourceId)fail('UNIFIED_EVIDENCE_REPAIR_SOURCE_IDENTITY_CONFLICT');
    }else{
      fs.mkdirSync(path.dirname(sourceTarget),{recursive:true});
      fs.writeFileSync(sourceTarget,JSON.stringify({schemaVersion:'1.0',sourceId:source.sourceId,metadata:source.metadata,migratedFrom:'cloudflare-d1:MLS-R33-REPAIR-SOURCE-1:'+bundle.code},null,2)+String.fromCharCode(10));
      writtenSources.push(source.sourcePath);
    }
  }
  if(bundle.content){
    const contentTarget=safeTarget(bundle.contentPath,'UNIFIED_EVIDENCE_CONTENT_TARGET_ESCAPE');
    fs.mkdirSync(path.dirname(contentTarget),{recursive:true});
    fs.writeFileSync(contentTarget,JSON.stringify(bundle.content,null,2)+String.fromCharCode(10));
  }
  const target=safeTarget(bundle.evidencePath,'UNIFIED_EVIDENCE_TARGET_ESCAPE');
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,JSON.stringify(bundle.evidence,null,2)+String.fromCharCode(10));
  process.stdout.write(JSON.stringify({ok:true,code:bundle.code,evidencePath:bundle.evidencePath,contentPath:bundle.content?bundle.contentPath:null,sourcePaths:writtenSources})+'\n');
}
function syntheticEventPath(kind){
  return path.join(process.env.RUNNER_TEMP||workspace,'mls-unified-r33-'+kind+'-event.json');
}
function writeSyntheticEvent(kind,issueNumber,commentBody,commentId){
  const eventPath=syntheticEventPath(kind);
  fs.writeFileSync(eventPath,JSON.stringify({
    issue:{number:Number(issueNumber)},
    comment:{
      id:Number(commentId),
      body:commentBody,
      created_at:new Date().toISOString(),
      user:{login:'github-actions[bot]'}
    }
  },null,2)+String.fromCharCode(10));
  appendOutput('event_path',eventPath);
  return eventPath;
}
async function checkpointEvent(){
  const bundlePath=process.argv[3];
  const commitSha=String(process.argv[4]||'').toLowerCase();
  const runId=Number(process.argv[5]||0);
  if(!bundlePath||!/^[a-f0-9]{40}$/.test(commitSha)||!Number.isInteger(runId)||runId<1)fail('UNIFIED_EVIDENCE_CHECKPOINT_ARGS');
  const bundle=JSON.parse(fs.readFileSync(bundlePath,'utf8'));
  const {repository}=githubContext();
  const issue=await gh('/repos/'+repository+'/issues/'+Number(bundle.issueNumber));
  const state=core.parseAssignmentState(issue?.body||'');
  if(!state||state.status!=='leased'||state.assignmentId!==bundle.assignmentId||Number(state.leaseEpoch)!==Number(bundle.leaseEpoch))
    fail('UNIFIED_EVIDENCE_CHECKPOINT_STATE_MISMATCH');
  if(state.provider!=='r33-farm'||!String(state.workId||'').startsWith('r33-unified:')||state.branch!==bundle.branch)
    fail('UNIFIED_EVIDENCE_CHECKPOINT_SCOPE_MISMATCH');
  const ref=await gh('/repos/'+repository+'/git/ref/heads/'+encodeRef(state.branch));
  if(String(ref?.object?.sha||'').toLowerCase()!==commitSha)fail('UNIFIED_EVIDENCE_CHECKPOINT_HEAD_MISMATCH');
  const assignedCodes=(state.resourceLocks||[]).filter(x=>String(x).startsWith('entry:')).map(x=>String(x).slice(6));
  const previous=(state.checkpoints||[]).at(-1)?.completedUnits||[];
  const completed=[...new Set([...previous,bundle.code])].filter(code=>assignedCodes.includes(code));
  const pending=assignedCodes.filter(code=>!completed.includes(code));
  const event={
    operation:'checkpoint',
    assignmentId:state.assignmentId,
    leaseToken:state.leaseToken,
    leaseEpoch:state.leaseEpoch,
    commitSha,
    validation:{status:'passed',workflow:'MLS Unified R33 Evidence Submit',runId},
    completedUnits:completed,
    pendingUnits:pending,
    notes:'Unified inline auto-checkpoint after canonical preflight and R33 tests.'
  };
  const marker='<!-- MLS_UNIFIED_R33_AUTOCHECKPOINT\\n'+JSON.stringify({code:bundle.code,runId,kind:'checkpoint'})+'\\n-->';
  const body=marker+'\\n\\n<!-- MLS_GLOBAL_DISPATCH_EVENT\\n'+JSON.stringify(event,null,2)+'\\n-->';
  const sequence=validateSequence(process.argv[6]||0,MAX_BATCH,'UNIFIED_EVIDENCE_CHECKPOINT_SEQUENCE_INVALID');
  const commentId=sequence>0?runId*100+sequence*2+1:runId*10+1;
  const eventPath=writeSyntheticEvent('checkpoint',bundle.issueNumber,body,commentId);
  process.stdout.write(JSON.stringify({ok:true,eventPath,code:bundle.code,commitSha,completedUnits:completed,pendingUnits:pending})+String.fromCharCode(10));
}
async function finishEvent(){
  const bundlePath=process.argv[3];
  const commitSha=String(process.argv[4]||'').toLowerCase();
  const runId=Number(process.argv[5]||0);
  if(!bundlePath||!/^[a-f0-9]{40}$/.test(commitSha)||!Number.isInteger(runId)||runId<1)fail('UNIFIED_EVIDENCE_FINISH_ARGS');
  const bundle=JSON.parse(fs.readFileSync(bundlePath,'utf8'));
  const {repository}=githubContext();
  const issue=await gh('/repos/'+repository+'/issues/'+Number(bundle.issueNumber));
  const state=core.parseAssignmentState(issue?.body||'');
  if(!state||state.status!=='leased'||state.assignmentId!==bundle.assignmentId||Number(state.leaseEpoch)!==Number(bundle.leaseEpoch))
    fail('UNIFIED_EVIDENCE_FINISH_STATE_MISMATCH');
  const last=(state.checkpoints||[]).at(-1);
  const pending=last?.pendingUnits||[];
  if(String(state.lastCheckpointCommit||'').toLowerCase()!==commitSha||pending.length){
    appendOutput('finish_needed','false');
    process.stdout.write(JSON.stringify({ok:true,finishNeeded:false,pendingUnits:pending})+String.fromCharCode(10));
    return;
  }
  const event={
    operation:'finish',
    assignmentId:state.assignmentId,
    leaseToken:state.leaseToken,
    leaseEpoch:state.leaseEpoch,
    commitSha
  };
  const marker='<!-- MLS_UNIFIED_R33_AUTOCHECKPOINT\\n'+JSON.stringify({code:bundle.code,runId,kind:'finish'})+'\\n-->';
  const body=marker+'\\n\\n<!-- MLS_GLOBAL_DISPATCH_EVENT\\n'+JSON.stringify(event,null,2)+'\\n-->';
  const sequence=validateSequence(process.argv[6]||0,MAX_BATCH+1,'UNIFIED_EVIDENCE_FINISH_SEQUENCE_INVALID');
  const commentId=sequence>0?runId*100+sequence*2+2:runId*10+2;
  const eventPath=writeSyntheticEvent('finish',bundle.issueNumber,body,commentId);
  appendOutput('finish_needed','true');
  process.stdout.write(JSON.stringify({ok:true,finishNeeded:true,eventPath,commitSha})+String.fromCharCode(10));
}
async function main(){
  const mode=String(process.argv[2]||'');
  if(mode==='prepare')return prepare();
  if(mode==='apply')return apply();
  if(mode==='checkpoint-event')return checkpointEvent();
  if(mode==='finish-event')return finishEvent();
  fail('UNIFIED_EVIDENCE_MODE_INVALID');
}
if(require.main===module)main().catch(error=>{console.error(error.code||'UNIFIED_EVIDENCE_SUBMIT_ERROR',error.message);process.exitCode=2});
module.exports={MARKER,AUTHORIZED,MAX_BATCH,validateSequence,extractMarked,repairSourcePathAllowed,validate};
