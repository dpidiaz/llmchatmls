'use strict';

const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const child=require('node:child_process');

const workspace=process.env.GITHUB_WORKSPACE||process.cwd();
const core=require(path.join(workspace,'MLS R32 EDITORIAL','global dispatcher','core.js'));
const MARKER='MLS_UNIFIED_R33_INTEGRATION_EXECUTE';
const AUTHORIZED=new Set(['OWNER','MEMBER','COLLABORATOR']);

function fail(code,message){const e=new Error(message||code);e.code=code;throw e;}
function extractMarked(text){
  const m=new RegExp('<!--\\s*'+MARKER+'\\s*([\\s\\S]*?)-->','m').exec(String(text||''));
  if(!m)fail('UNIFIED_INTEGRATION_MARKER_MISSING');
  try{return JSON.parse(m[1].trim())}catch{fail('UNIFIED_INTEGRATION_JSON_INVALID')}
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
    headers:{authorization:'Bearer '+token,accept:'application/vnd.github+json','content-type':'application/json','x-github-api-version':'2022-11-28','user-agent':'mls-unified-r33-integration-execute'},
    body:body===undefined?undefined:JSON.stringify(body)
  });
  const text=await response.text();let data=null;try{data=text?JSON.parse(text):null}catch{data=text}
  if(!response.ok)fail('GITHUB_'+response.status,data?.message||text||'GitHub request failed');
  return data;
}
function output(name,value){
  const out=process.env.GITHUB_OUTPUT;if(!out)fail('GITHUB_OUTPUT_MISSING');
  fs.appendFileSync(out,name+'='+String(value).replace(/\r?\n/g,' ')+'\n');
}
function run(file,args,options={}){
  return child.execFileSync(file,args,{cwd:workspace,encoding:'utf8',stdio:options.capture?'pipe':'inherit',env:process.env});
}
function sha256(data){return crypto.createHash('sha256').update(data).digest('hex');}
function safeRepoPath(raw){
  const p=String(raw||'').replace(/\\/g,'/').replace(/^\/+/, '');
  if(!p||p.includes('..')||path.isAbsolute(p))fail('UNIFIED_INTEGRATION_PATH_INVALID',p);
  const full=path.resolve(workspace,p),root=path.resolve(workspace)+path.sep;
  if(!full.startsWith(root))fail('UNIFIED_INTEGRATION_PATH_ESCAPE',p);
  return {p,full};
}
function validateState(issue,comment,payload){
  if(!String(issue?.title||'').startsWith('[MLS Dispatcher][LEASED]'))fail('UNIFIED_INTEGRATION_NOT_LEASED');
  const state=core.parseAssignmentState(issue?.body||'');
  if(!state||state.status!=='leased'||state.cancelRequested||state.readyToClose)fail('UNIFIED_INTEGRATION_STATE_INVALID');
  const login=String(comment?.user?.login||'');
  const botAuthorized=login==='github-actions[bot]'&&state.workerLogin===login&&state.provider==='r33-index-integration'&&String(state.workId||'').startsWith('r33-unified-integration:');
  if(!AUTHORIZED.has(String(comment?.author_association||'').toUpperCase())&&!botAuthorized)fail('UNIFIED_INTEGRATION_AUTHOR_UNAUTHORIZED');
  if(state.provider!=='r33-index-integration'||!String(state.workId||'').startsWith('r33-unified-integration:'))fail('UNIFIED_INTEGRATION_SCOPE_INVALID');
  if(!String(state.branch||'').startsWith('worker/r33-index-integration/'))fail('UNIFIED_INTEGRATION_BRANCH_INVALID');
  if(state.workerLogin&&String(comment?.user?.login||'')!==String(state.workerLogin))fail('UNIFIED_INTEGRATION_WORKER_LOGIN_MISMATCH');
  if(String(payload?.assignmentId||'')!==String(state.assignmentId)||Number(payload?.leaseEpoch)!==Number(state.leaseEpoch))fail('UNIFIED_INTEGRATION_FENCE_MISMATCH');
  const expires=Date.parse(String(state.expiresAt||''));if(!Number.isFinite(expires)||Date.now()>expires)fail('UNIFIED_INTEGRATION_LEASE_EXPIRED');
  const spec=state.integration;
  if(!spec||spec.mode!=='assignment-pr'||spec.base!=='main'||!Array.isArray(spec.sourceRefs)||!spec.sourceRefs.length)fail('UNIFIED_INTEGRATION_SPEC_INVALID');
  return state;
}
async function prepare(){
  const event=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8'));
  const {repository}=githubContext();
  let eventIssue=event.issue||null,eventComment=event.comment||null;
  if(!eventIssue||!eventComment){
    const issueNumber=Number(process.env.MLS_UNIFIED_ISSUE_NUMBER||0);
    const commentId=Number(process.env.MLS_UNIFIED_COMMENT_ID||0);
    if(!Number.isInteger(issueNumber)||issueNumber<1||!Number.isInteger(commentId)||commentId<1)fail('UNIFIED_INTEGRATION_EVENT_INVALID');
    eventIssue={number:issueNumber};
    eventComment=await gh('/repos/'+repository+'/issues/comments/'+commentId);
  }
  const issue=await gh('/repos/'+repository+'/issues/'+eventIssue.number);
  const payload=extractMarked(eventComment.body||'');
  const state=validateState(issue,eventComment,payload);
  const bundlePath=path.join(process.env.RUNNER_TEMP||workspace,'mls-unified-r33-integration.json');
  fs.writeFileSync(bundlePath,JSON.stringify({
    issueNumber:Number(issue.number),commentId:Number(eventComment.id),commentLogin:String(eventComment.user?.login||''),
    assignmentId:state.assignmentId,leaseEpoch:state.leaseEpoch,branch:state.branch,baseCommit:state.baseCommit,
    workId:state.workId,allowedPaths:state.allowedPaths||[],integration:state.integration
  },null,2)+'\n');
  output('branch',state.branch);output('bundle_path',bundlePath);output('assignment_id',state.assignmentId);
}
function fetchSourceRef(ref){
  const branch=String(ref.branch||'');
  const commit=String(ref.commitSha||'').toLowerCase();
  if(!/^[a-f0-9]{40}$/.test(commit))fail('UNIFIED_INTEGRATION_SOURCE_SHA_INVALID',ref.code);
  if(!/^worker\/[A-Za-z0-9._\/-]+$/.test(branch))fail('UNIFIED_INTEGRATION_SOURCE_BRANCH_INVALID',branch);
  try{run('git',['fetch','--no-tags','origin','refs/heads/'+branch+':refs/remotes/origin/'+branch]);}
  catch{fail('UNIFIED_INTEGRATION_SOURCE_FETCH_FAILED',branch)}
  try{run('git',['cat-file','-e',commit+'^{commit}'],{capture:true});}
  catch{fail('UNIFIED_INTEGRATION_SOURCE_COMMIT_MISSING',commit)}
}
function blobAt(commit,repoPath){
  safeRepoPath(repoPath);
  try{return Buffer.from(run('git',['show',commit+':'+repoPath],{capture:true}),'utf8');}
  catch{fail('UNIFIED_INTEGRATION_SOURCE_BLOB_MISSING',commit+':'+repoPath)}
}
function copyExact(commit,repoPath){
  const {full}=safeRepoPath(repoPath),data=blobAt(commit,repoPath);
  fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,data);
}
function syncCanonicalManifest(sourceRefs){
  const manifestPath='content/manifest.json';
  const {full}=safeRepoPath(manifestPath);
  const manifest=JSON.parse(fs.readFileSync(full,'utf8'));
  if(!Array.isArray(manifest.entries))fail('UNIFIED_INTEGRATION_MANIFEST_INVALID');
  let changed=0;
  for(const ref of sourceRefs||[]){
    if(!ref.contentPath)continue;
    const contentPath=String(ref.contentPath).replace(/\\/g,'/');
    if(!contentPath.startsWith('content/'))fail('UNIFIED_INTEGRATION_MANIFEST_CONTENT_PATH_INVALID',ref.code);
    const relative=contentPath.slice('content/'.length);
    const {full:contentFull}=safeRepoPath(contentPath);
    const raw=fs.readFileSync(contentFull);
    const code=String(ref.code||'').toUpperCase();
    const item=manifest.entries.find(x=>String(x.code||'').toUpperCase()===code);
    if(!item)fail('UNIFIED_INTEGRATION_MANIFEST_ENTRY_MISSING',code);
    if(String(item.path||'')!==relative)fail('UNIFIED_INTEGRATION_MANIFEST_PATH_MISMATCH',code);
    const nextHash=sha256(raw),nextBytes=raw.length;
    if(item.sha256!==nextHash||Number(item.bytes)!==nextBytes){
      item.sha256=nextHash;item.bytes=nextBytes;changed++;
    }
  }
  if(changed)fs.writeFileSync(full,JSON.stringify(manifest,null,2)+'\n');
  return changed;
}
function integrationPathAllowed(file,allowedPaths){
  if(core.pathAllowed(file,allowedPaths||[]))return true;
  return file==='content/manifest.json'&&(allowedPaths||[]).some(p=>String(p).startsWith('content/')&&String(p)!=='content/manifest.json');
}
function applySources(){
  const bundle=JSON.parse(fs.readFileSync(process.argv[3],'utf8')),spec=bundle.integration;
  const fetched=new Set();
  for(const ref of spec.sourceRefs){
    const key=String(ref.branch)+'@'+String(ref.commitSha);
    if(!fetched.has(key)){fetchSourceRef(ref);fetched.add(key);}
    copyExact(ref.commitSha,ref.evidenceArtifactPath);
    if(ref.contentPath){
      const {p,full}=safeRepoPath(ref.contentPath);
      const current=fs.readFileSync(full),source=blobAt(ref.commitSha,p);
      const currentHash=sha256(current),sourceHash=sha256(source),original=String(ref.r44SourceSha256||'').toLowerCase();
      if(!/^[a-f0-9]{64}$/.test(original))fail('UNIFIED_INTEGRATION_R44_HASH_MISSING',ref.code);
      if(currentHash===sourceHash){}
      else if(currentHash===original)fs.writeFileSync(full,source);
      else fail('UNIFIED_INTEGRATION_CONTENT_DRIFT',ref.code+': current main diverges from R44 source and certified source');
    }
    for(const asset of ref.revisionAssets||[]){
      const assetCommit=String(asset.commitSha||ref.commitSha).toLowerCase();
      if(!/^[a-f0-9]{40}$/.test(assetCommit))fail('UNIFIED_INTEGRATION_ASSET_SHA_INVALID',asset.path);
      copyExact(assetCommit,asset.path);
    }
  }
  const manifestUpdates=syncCanonicalManifest(spec.sourceRefs);
  process.stdout.write(JSON.stringify({ok:true,sourceRefs:spec.sourceRefs.length,manifestUpdates})+'\n');
}
function validateStaged(){
  const bundle=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
  const files=run('git',['diff','--cached','--name-only'],{capture:true}).split(/\r?\n/).filter(Boolean);
  const bad=files.filter(file=>!integrationPathAllowed(file,bundle.allowedPaths||[]));
  if(bad.length)fail('UNIFIED_INTEGRATION_SCOPE_VIOLATION',bad.join(', '));
  output('has_changes',files.length?'true':'false');
  process.stdout.write(JSON.stringify({ok:true,hasChanges:files.length>0,files})+'\n');
}
async function openPr(){
  const bundle=JSON.parse(fs.readFileSync(process.argv[3],'utf8')),headSha=String(process.argv[4]||'').toLowerCase();
  if(!/^[a-f0-9]{40}$/.test(headSha))fail('UNIFIED_INTEGRATION_HEAD_INVALID');
  const {repository}=githubContext(),owner=repository.split('/')[0];
  const existing=await gh('/repos/'+repository+'/pulls?state=open&head='+encodeURIComponent(owner+':'+bundle.branch)+'&base=main');
  let pr=Array.isArray(existing)?existing.find(x=>String(x?.head?.ref||'')===bundle.branch&&String(x?.base?.ref||'')==='main'):null;
  if(!pr){
    pr=await gh('/repos/'+repository+'/pulls',{method:'POST',body:{
      title:'r33(unified): integrate '+bundle.workId,
      head:bundle.branch,base:'main',
      body:'Automated serialized MLS Unified R33 integration for '+bundle.assignmentId+'.\n\nSource refs are pinned by commit SHA; indexes/tests are generated before merge.'
    }});
  }
  if(String(pr?.head?.sha||'').toLowerCase()!==headSha)fail('UNIFIED_INTEGRATION_PR_HEAD_MISMATCH','Existing/opened PR head does not match the expected assignment head.');
  output('pr_number',pr.number);output('head_sha',headSha);
  process.stdout.write(JSON.stringify({ok:true,prNumber:pr.number,headSha,reused:Boolean(existing?.length)})+'\n');
}
async function waitCheck(){
  const headSha=String(process.argv[3]||'').toLowerCase();
  if(!/^[a-f0-9]{40}$/.test(headSha))fail('UNIFIED_INTEGRATION_WAIT_HEAD_INVALID');
  const {repository}=githubContext(),deadline=Date.now()+12*60*1000;
  while(Date.now()<deadline){
    const runs=await gh('/repos/'+repository+'/actions/runs?head_sha='+headSha+'&event=pull_request&per_page=50');
    const matches=(runs.workflow_runs||[]).filter(r=>r.name==='R33 GitHub Native Tests');
    const latest=matches.sort((a,b)=>Number(b.id)-Number(a.id))[0];
    if(latest?.status==='completed'){
      if(latest.conclusion!=='success')fail('UNIFIED_INTEGRATION_REQUIRED_CHECK_FAILED','R33 GitHub Native Tests: '+latest.conclusion);
      output('check_run_id',latest.id);return;
    }
    await new Promise(resolve=>setTimeout(resolve,8000));
  }
  fail('UNIFIED_INTEGRATION_REQUIRED_CHECK_TIMEOUT');
}
function syntheticPath(kind){return path.join(process.env.RUNNER_TEMP||workspace,'mls-unified-integration-'+kind+'.json');}
function writeEvent(kind,bundle,event,commentId){
  const p=syntheticPath(kind);
  const marker='<!-- MLS_UNIFIED_R33_INTEGRATION_AUTOCHECKPOINT\n'+JSON.stringify({kind,assignmentId:bundle.assignmentId})+'\n-->';
  const body=marker+'\n\n<!-- MLS_GLOBAL_DISPATCH_EVENT\n'+JSON.stringify(event,null,2)+'\n-->';
  fs.writeFileSync(p,JSON.stringify({issue:{number:bundle.issueNumber},comment:{
    id:Number(commentId),body,created_at:new Date().toISOString(),user:{login:bundle.commentLogin}
  }},null,2)+'\n');
  output('event_path',p);return p;
}
async function noopCheckpointEvent(){
  const bundle=JSON.parse(fs.readFileSync(process.argv[3],'utf8')),runId=Number(process.argv[4]);
  const {repository}=githubContext();
  const issue=await gh('/repos/'+repository+'/issues/'+bundle.issueNumber);
  const state=core.parseAssignmentState(issue.body||'');
  if(!state||state.assignmentId!==bundle.assignmentId||state.status!=='leased')fail('UNIFIED_INTEGRATION_NOOP_STATE_INVALID');
  const mainRef=await gh('/repos/'+repository+'/git/ref/heads/main');
  const mainSha=String(mainRef?.object?.sha||'').toLowerCase();
  if(!/^[a-f0-9]{40}$/.test(mainSha))fail('UNIFIED_INTEGRATION_NOOP_MAIN_INVALID');
  const branchRef=await gh('/repos/'+repository+'/git/ref/heads/'+state.branch.split('/').map(encodeURIComponent).join('/'));
  const branchSha=String(branchRef?.object?.sha||'').toLowerCase();
  if(branchSha!==mainSha)fail('UNIFIED_INTEGRATION_NOOP_MAIN_MOVED','No-op requires assignment branch HEAD to equal current main HEAD.');
  writeEvent('noop-checkpoint',bundle,{operation:'checkpoint',assignmentId:state.assignmentId,leaseToken:state.leaseToken,leaseEpoch:state.leaseEpoch,
    commitSha:mainSha,integrationStage:'noop',
    validation:{status:'passed',workflow:'MLS Unified R33 Integration Execute',runId},
    completedUnits:state.resourceLocks.filter(x=>String(x).startsWith('entry:')).map(x=>String(x).slice(6)),pendingUnits:[],
    notes:'Unified idempotent no-op integration: pinned sources and regenerated indexes already match canonical main.'},runId*10+4);
}
async function noopFinishEvent(){
  const bundle=JSON.parse(fs.readFileSync(process.argv[3],'utf8')),runId=Number(process.argv[4]);
  const {repository}=githubContext();
  const issue=await gh('/repos/'+repository+'/issues/'+bundle.issueNumber);
  const state=core.parseAssignmentState(issue.body||'');
  if(!state||state.assignmentId!==bundle.assignmentId||state.status!=='leased'||String(state.lastCheckpointCommit||'').toLowerCase()!==String(state.baseCommit||'').toLowerCase())
    fail('UNIFIED_INTEGRATION_NOOP_FINISH_STATE_INVALID');
  writeEvent('noop-finish',bundle,{operation:'finish',assignmentId:state.assignmentId,leaseToken:state.leaseToken,leaseEpoch:state.leaseEpoch,
    commitSha:String(state.lastCheckpointCommit).toLowerCase(),integrationStage:'noop'},runId*10+5);
}
async function premergeEvent(){
  const bundle=JSON.parse(fs.readFileSync(process.argv[3],'utf8')),headSha=String(process.argv[4]||'').toLowerCase();
  const prNumber=Number(process.argv[5]),runId=Number(process.argv[6]);
  const {repository}=githubContext(),issue=await gh('/repos/'+repository+'/issues/'+bundle.issueNumber);
  const state=core.parseAssignmentState(issue.body||'');
  if(!state||state.assignmentId!==bundle.assignmentId||state.status!=='leased')fail('UNIFIED_INTEGRATION_PREMERGE_STATE_INVALID');
  writeEvent('premerge',bundle,{operation:'checkpoint',assignmentId:state.assignmentId,leaseToken:state.leaseToken,leaseEpoch:state.leaseEpoch,
    commitSha:headSha,integrationStage:'premerge',integrationPrNumber:prNumber,integrationHeadSha:headSha,
    validation:{status:'passed',workflow:'MLS Unified R33 Integration Execute',runId},
    completedUnits:state.resourceLocks.filter(x=>String(x).startsWith('entry:')).map(x=>String(x).slice(6)),pendingUnits:[],
    notes:'Unified serialized integration premerge checkpoint after source pinning, index regeneration and R33 tests.'},runId*10+1);
}
async function mergePr(){
  const bundle=JSON.parse(fs.readFileSync(process.argv[3],'utf8')),prNumber=Number(process.argv[4]),headSha=String(process.argv[5]||'').toLowerCase();
  const {repository}=githubContext();
  const result=await gh('/repos/'+repository+'/pulls/'+prNumber+'/merge',{method:'PUT',body:{merge_method:'merge',sha:headSha}});
  if(result?.merged!==true||!/^[a-f0-9]{40}$/.test(String(result.sha||'')))fail('UNIFIED_INTEGRATION_MERGE_FAILED',result?.message||'merge failed');
  output('merge_sha',String(result.sha).toLowerCase());
}
async function postmergeEvent(){
  const bundle=JSON.parse(fs.readFileSync(process.argv[3],'utf8')),mergeSha=String(process.argv[4]||'').toLowerCase();
  const prNumber=Number(process.argv[5]),headSha=String(process.argv[6]||'').toLowerCase(),runId=Number(process.argv[7]);
  const {repository}=githubContext(),issue=await gh('/repos/'+repository+'/issues/'+bundle.issueNumber);
  const state=core.parseAssignmentState(issue.body||'');
  if(!state||state.assignmentId!==bundle.assignmentId||state.status!=='leased')fail('UNIFIED_INTEGRATION_POSTMERGE_STATE_INVALID');
  writeEvent('postmerge',bundle,{operation:'checkpoint',assignmentId:state.assignmentId,leaseToken:state.leaseToken,leaseEpoch:state.leaseEpoch,
    commitSha:mergeSha,integrationStage:'postmerge',integrationPrNumber:prNumber,integrationHeadSha:headSha,
    validation:{status:'passed',workflow:'MLS Unified R33 Integration Execute',runId},
    completedUnits:state.resourceLocks.filter(x=>String(x).startsWith('entry:')).map(x=>String(x).slice(6)),pendingUnits:[],
    notes:'Unified serialized integration postmerge checkpoint verified on main.'},runId*10+2);
}
async function finishEvent(){
  const bundle=JSON.parse(fs.readFileSync(process.argv[3],'utf8')),mergeSha=String(process.argv[4]||'').toLowerCase();
  const prNumber=Number(process.argv[5]),headSha=String(process.argv[6]||'').toLowerCase(),runId=Number(process.argv[7]);
  const {repository}=githubContext(),issue=await gh('/repos/'+repository+'/issues/'+bundle.issueNumber);
  const state=core.parseAssignmentState(issue.body||'');
  if(!state||state.assignmentId!==bundle.assignmentId||state.status!=='leased'||String(state.lastCheckpointCommit||'').toLowerCase()!==mergeSha)
    fail('UNIFIED_INTEGRATION_FINISH_STATE_INVALID');
  writeEvent('finish',bundle,{operation:'finish',assignmentId:state.assignmentId,leaseToken:state.leaseToken,leaseEpoch:state.leaseEpoch,
    commitSha:mergeSha,integrationStage:'postmerge',integrationPrNumber:prNumber,integrationHeadSha:headSha},runId*10+3);
}
async function main(){
  const mode=String(process.argv[2]||'');
  if(mode==='prepare')return prepare();
  if(mode==='apply-sources')return applySources();
  if(mode==='validate-staged')return validateStaged();
  if(mode==='open-pr')return openPr();
  if(mode==='wait-check')return waitCheck();
  if(mode==='noop-checkpoint-event')return noopCheckpointEvent();
  if(mode==='noop-finish-event')return noopFinishEvent();
  if(mode==='premerge-event')return premergeEvent();
  if(mode==='merge-pr')return mergePr();
  if(mode==='postmerge-event')return postmergeEvent();
  if(mode==='finish-event')return finishEvent();
  fail('UNIFIED_INTEGRATION_MODE_INVALID');
}
if(require.main===module)main().catch(error=>{console.error(error.code||'UNIFIED_INTEGRATION_ERROR',error.message);process.exitCode=2});
module.exports={MARKER,AUTHORIZED,extractMarked,validateState};
