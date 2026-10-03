'use strict';

const fs=require('node:fs');
const path=require('node:path');

const workspace=process.env.GITHUB_WORKSPACE||process.cwd();
const core=require(path.join(workspace,'MLS R32 EDITORIAL','global dispatcher','core.js'));
const MARKER='MLS_UNIFIED_R33_EVIDENCE_SUBMIT';
const AUTHORIZED=new Set(['OWNER','MEMBER','COLLABORATOR']);

function fail(code,message){const e=new Error(message||code);e.code=code;throw e;}
function extractMarked(text){
  const m=new RegExp('<!--\\s*'+MARKER+'\\s*([\\s\\S]*?)-->','m').exec(String(text||''));
  if(!m)fail('UNIFIED_EVIDENCE_MARKER_MISSING');
  try{return JSON.parse(m[1].trim())}catch{fail('UNIFIED_EVIDENCE_JSON_INVALID')}
}
async function gh(endpoint){
  const token=process.env.GITHUB_TOKEN||'';
  const repository=process.env.GITHUB_REPOSITORY||'';
  if(!token||repository.split('/').length!==2||repository.startsWith('/')||repository.endsWith('/'))fail('GITHUB_CONTEXT_MISSING');
  const response=await fetch('https://api.github.com'+endpoint,{
    headers:{authorization:'Bearer '+token,accept:'application/vnd.github+json','x-github-api-version':'2022-11-28','user-agent':'mls-unified-r33-evidence-submit'}
  });
  const body=await response.json();
  if(!response.ok)fail('GITHUB_'+response.status,body?.message||'GitHub request failed');
  return body;
}
function validate(issue,comment,payload){
  if(!AUTHORIZED.has(String(comment?.author_association||'').toUpperCase()))fail('UNIFIED_EVIDENCE_AUTHOR_UNAUTHORIZED');
  if(!String(issue?.title||'').startsWith('[MLS Dispatcher][LEASED]'))fail('UNIFIED_EVIDENCE_NOT_LEASED');
  const state=core.parseAssignmentState(issue?.body||'');
  if(!state||state.status!=='leased')fail('UNIFIED_EVIDENCE_STATE_INVALID');
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
  const expires=Date.parse(String(state.expiresAt||''));
  if(!Number.isFinite(expires)||Date.now()>expires)fail('UNIFIED_EVIDENCE_LEASE_EXPIRED');
  return {state,code,evidencePath,contentPath,evidence};
}
function appendOutput(name,value){
  const out=process.env.GITHUB_OUTPUT;
  if(!out)fail('GITHUB_OUTPUT_MISSING');
  fs.appendFileSync(out,name+'='+String(value).replace(/\r?\n/g,' ')+'\n');
}
async function prepare(){
  const event=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8'));
  if(!event.issue||!event.comment)fail('UNIFIED_EVIDENCE_EVENT_INVALID');
  const repository=process.env.GITHUB_REPOSITORY;
  const issue=await gh('/repos/'+repository+'/issues/'+event.issue.number);
  const payload=extractMarked(event.comment.body||'');
  const validated=validate(issue,event.comment,payload);
  const bundlePath=path.join(process.env.RUNNER_TEMP||workspace,'mls-unified-r33-evidence-submit.json');
  fs.writeFileSync(bundlePath,JSON.stringify({
    issueNumber:Number(issue.number),
    commentId:Number(event.comment.id),
    branch:validated.state.branch,
    assignmentId:validated.state.assignmentId,
    leaseEpoch:validated.state.leaseEpoch,
    code:validated.code,
    evidencePath:validated.evidencePath,
    contentPath:validated.contentPath,
    evidence:validated.evidence
  },null,2)+'\n');
  appendOutput('branch',validated.state.branch);
  appendOutput('code',validated.code);
  appendOutput('evidence_path',validated.evidencePath);
  appendOutput('bundle_path',bundlePath);
}
function apply(){
  const bundlePath=process.argv[3]||path.join(process.env.RUNNER_TEMP||workspace,'mls-unified-r33-evidence-submit.json');
  const bundle=JSON.parse(fs.readFileSync(bundlePath,'utf8'));
  const target=path.resolve(workspace,bundle.evidencePath);
  const root=path.resolve(workspace)+path.sep;
  if(!target.startsWith(root))fail('UNIFIED_EVIDENCE_TARGET_ESCAPE');
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,JSON.stringify(bundle.evidence,null,2)+'\\n');
  process.stdout.write(JSON.stringify({ok:true,code:bundle.code,evidencePath:bundle.evidencePath})+'\n');
}
async function main(){
  const mode=String(process.argv[2]||'');
  if(mode==='prepare')return prepare();
  if(mode==='apply')return apply();
  fail('UNIFIED_EVIDENCE_MODE_INVALID');
}
if(require.main===module)main().catch(error=>{console.error(error.code||'UNIFIED_EVIDENCE_SUBMIT_ERROR',error.message);process.exitCode=2});
module.exports={MARKER,AUTHORIZED,extractMarked,validate};
