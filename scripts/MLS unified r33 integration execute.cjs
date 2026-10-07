'use strict';

const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const child=require('node:child_process');

const workspace=process.env.GITHUB_WORKSPACE||process.cwd();
const core=require(path.join(workspace,'MLS R32 EDITORIAL','global dispatcher','core.js'));
const recoveryContext=require(path.join(workspace,'MLS R32 EDITORIAL','global dispatcher','recovery.js'));
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
  if(!response.ok){
    const e=new Error(data?.message||text||'GitHub request failed');
    e.code='GITHUB_'+response.status;e.status=response.status;e.data=data;throw e;
  }
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
  const association=String(comment?.author_association||'').toUpperCase();
  const associationAuthorized=AUTHORIZED.has(association);
  const botAuthorized=login==='github-actions[bot]'&&state.workerLogin===login&&state.provider==='r33-index-integration'&&String(state.workId||'').startsWith('r33-unified-integration:');
  if(!associationAuthorized&&!botAuthorized)fail('UNIFIED_INTEGRATION_AUTHOR_UNAUTHORIZED');
  if(state.provider!=='r33-index-integration'||!String(state.workId||'').startsWith('r33-unified-integration:'))fail('UNIFIED_INTEGRATION_SCOPE_INVALID');
  if(!String(state.branch||'').startsWith('worker/r33-index-integration/'))fail('UNIFIED_INTEGRATION_BRANCH_INVALID');
  if(state.workerLogin&&!associationAuthorized&&login!==String(state.workerLogin))fail('UNIFIED_INTEGRATION_WORKER_LOGIN_MISMATCH');
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
    commentAssociation:String(eventComment.author_association||'').toUpperCase(),
    workerLogin:String(state.workerLogin||''),assignmentId:state.assignmentId,leaseEpoch:state.leaseEpoch,branch:state.branch,baseCommit:state.baseCommit,
    workId:state.workId,allowedPaths:state.allowedPaths||[],integration:state.integration
  },null,2)+'\n');
  output('branch',state.branch);output('bundle_path',bundlePath);output('assignment_id',state.assignmentId);
}
function fetchSourceRef(ref){
  const branch=String(ref.branch||'');
  const commit=String(ref.commitSha||'').toLowerCase();
  if(!/^[a-f0-9]{40}$/.test(commit))fail('UNIFIED_INTEGRATION_SOURCE_SHA_INVALID',ref.code);
  const sourceBranchAllowed=/^worker\/[A-Za-z0-9._\/-]+$/.test(branch)||/^r41\/staged\/[A-Za-z0-9._\/-]+$/.test(branch);
  if(!sourceBranchAllowed)fail('UNIFIED_INTEGRATION_SOURCE_BRANCH_INVALID',branch);
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
function copyEvidenceSources(commit,evidencePath){
  let evidence;
  try{evidence=JSON.parse(blobAt(commit,evidencePath).toString('utf8'))}catch{fail('UNIFIED_INTEGRATION_EVIDENCE_JSON_INVALID',evidencePath)}
  const ids=[...new Set((evidence.links||[]).map(x=>String(x?.sourceId||'').toUpperCase()).filter(x=>/^MLS-SRC-[A-F0-9]{20}$/.test(x)))];
  const copied=[];
  for(const sourceId of ids){
    const sourcePath='MLS R32 EDITORIAL/evidence git/registry/sources/'+sourceId+'.json';
    try{copyExact(commit,sourcePath);copied.push(sourcePath)}catch(error){
      if(fs.existsSync(safeRepoPath(sourcePath).full))continue;
      throw error;
    }
  }
  return copied;
}
function syncCanonicalManifest(sourceRefs){
  const manifestPath='content/manifest.json';
  const {full}=safeRepoPath(manifestPath);
  const manifest=JSON.parse(fs.readFileSync(full,'utf8'));
  if(!Array.isArray(manifest.entries))fail('UNIFIED_INTEGRATION_MANIFEST_INVALID');
  const contentPaths=new Map();
  for(const ref of sourceRefs||[]){
    if(ref.contentPath){
      const contentPath=String(ref.contentPath).replace(/\\/g,'/');
      contentPaths.set(contentPath,String(ref.code||'').toUpperCase()||null);
    }
    for(const asset of ref.revisionAssets||[]){
      const assetPath=String(asset?.path||'').replace(/\\/g,'/');
      if(assetPath.startsWith('content/')&&assetPath.endsWith('.json')&&assetPath!==manifestPath&&!contentPaths.has(assetPath)){
        contentPaths.set(assetPath,null);
      }
    }
  }
  let changed=0;
  for(const [contentPath,expectedCode] of contentPaths){
    if(!contentPath.startsWith('content/'))fail('UNIFIED_INTEGRATION_MANIFEST_CONTENT_PATH_INVALID',expectedCode||contentPath);
    const relative=contentPath.slice('content/'.length);
    const {full:contentFull}=safeRepoPath(contentPath);
    const raw=fs.readFileSync(contentFull);
    const item=manifest.entries.find(x=>String(x.path||'')===relative);
    if(!item)fail('UNIFIED_INTEGRATION_MANIFEST_ENTRY_MISSING',expectedCode||relative);
    if(expectedCode&&String(item.code||'').toUpperCase()!==expectedCode)fail('UNIFIED_INTEGRATION_MANIFEST_PATH_MISMATCH',expectedCode);
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
    copyEvidenceSources(ref.commitSha,ref.evidenceArtifactPath);
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
  const staged=run('git',['diff','--cached','--name-only'],{capture:true}).split(/\r?\n/).filter(Boolean);
  const branchDelta=run('git',['diff','--name-only','origin/main...HEAD'],{capture:true}).split(/\r?\n/).filter(Boolean);
  const files=[...new Set([...branchDelta,...staged])];
  const bad=files.filter(file=>!integrationPathAllowed(file,bundle.allowedPaths||[]));
  if(bad.length)fail('UNIFIED_INTEGRATION_SCOPE_VIOLATION',bad.join(', '));
  output('has_changes',files.length?'true':'false');
  output('needs_commit',staged.length?'true':'false');
  process.stdout.write(JSON.stringify({ok:true,hasChanges:files.length>0,files})+'\n');
}
async function openPr(){
  const bundle=JSON.parse(fs.readFileSync(process.argv[3],'utf8')),headSha=String(process.argv[4]||'').toLowerCase();
  if(!/^[a-f0-9]{40}$/.test(headSha))fail('UNIFIED_INTEGRATION_HEAD_INVALID');
  const {repository}=githubContext(),owner=repository.split('/')[0];
  const existing=await gh('/repos/'+repository+'/pulls?state=open&head='+encodeURIComponent(owner+':'+bundle.branch)+'&base=main');
  let pr=Array.isArray(existing)?existing.find(x=>String(x?.head?.ref||'')===bundle.branch&&String(x?.base?.ref||'')==='main'):null;
  if(!pr){
    try{
      pr=await gh('/repos/'+repository+'/pulls',{method:'POST',body:{
        title:'r33(unified): integrate '+bundle.workId,
        head:bundle.branch,base:'main',
        body:'Automated serialized MLS Unified R33 integration for '+bundle.assignmentId+'.\n\nSource refs are pinned by commit SHA; indexes/tests are generated before merge.'
      }});
    }catch(error){
      const message=String(error?.message||'');
      if(error?.code==='GITHUB_403'&&/not permitted to create or approve pull requests/i.test(message)&&bundle.integration?.allowDirectFallback===true){
        output('mode','direct');output('head_sha',headSha);
        process.stdout.write(JSON.stringify({ok:true,mode:'direct',headSha,reason:'ACTIONS_PULL_REQUEST_CREATION_DISABLED'})+'\n');
        return;
      }
      throw error;
    }
  }
  if(String(pr?.head?.sha||'').toLowerCase()!==headSha)fail('UNIFIED_INTEGRATION_PR_HEAD_MISMATCH','Existing/opened PR head does not match the expected assignment head.');
  output('mode','pr');output('pr_number',pr.number);output('head_sha',headSha);
  process.stdout.write(JSON.stringify({ok:true,mode:'pr',prNumber:pr.number,headSha,reused:Boolean(existing?.length)})+'\n');
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
    id:Number(commentId),body,created_at:new Date().toISOString(),author_association:bundle.commentAssociation,
    user:{login:bundle.workerLogin||bundle.commentLogin}
  }},null,2)+'\n');
  output('event_path',p);return p;
}
function directPostmergeCheckpointMatches(state,mergeSha,headSha,expectedUnits){
  const merge=String(mergeSha||'').toLowerCase(),head=String(headSha||'').toLowerCase();
  const cp=(state?.checkpoints||[]).find(x=>String(x.commitSha||'').toLowerCase()===merge);
  const completed=new Set((cp?.completedUnits||[]).map(String));
  const expected=new Set((expectedUnits||[]).map(String));
  return !!cp&&cp===state.checkpoints.at(-1)&&state.status==='leased'&&
    String(state.lastCheckpointCommit||'').toLowerCase()===merge&&
    String(cp.integrationStage||'').toLowerCase()==='postmerge-direct'&&
    String(cp.integrationHeadSha||'').toLowerCase()===head&&
    String(cp.validation?.status||'').toLowerCase()==='passed'&&
    !(cp.pendingUnits||[]).length&&completed.size===expected.size&&[...expected].every(x=>completed.has(x));
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
  let checkpointSha=mainSha,integrationStage='noop',integrationHeadSha=null;
  if(branchSha!==mainSha){
    const premerge=(state.checkpoints||[]).find(x=>String(x.integrationStage||'').toLowerCase()==='premerge-direct'&&
      String(x.integrationHeadSha||'').toLowerCase()===branchSha&&String(x.validation?.status||'').toLowerCase()==='passed'&&!(x.pendingUnits||[]).length);
    const expectedUnits=state.resourceLocks.filter(x=>String(x).startsWith('entry:')).map(x=>String(x).slice(6));
    const completed=new Set((premerge?.completedUnits||[]).map(String));
    if(!premerge||completed.size!==expectedUnits.length||!expectedUnits.every(code=>completed.has(code)))
      fail('UNIFIED_INTEGRATION_NOOP_MAIN_MOVED','Assignment branch is behind Main and has no complete accepted direct premerge checkpoint.');
    const baseSha=String(state.recovery?.integrationBaseCommit||state.baseCommit||'').toLowerCase();
    if(!/^[a-f0-9]{40}$/.test(baseSha))fail('UNIFIED_INTEGRATION_NOOP_BASE_INVALID');
    const history=await gh('/repos/'+repository+'/compare/'+baseSha+'...'+mainSha);
    const merged=(history?.commits||[]).find(commit=>{
      const parents=(commit?.parents||[]).map(parent=>String(parent?.sha||'').toLowerCase());
      return parents.length===2&&parents[1]===branchSha;
    });
    if(!merged)fail('UNIFIED_INTEGRATION_NOOP_MERGE_NOT_FOUND','Main does not contain the exact assignment head as a direct merge parent.');
    checkpointSha=String(merged.sha||'').toLowerCase();
    const afterMerge=await gh('/repos/'+repository+'/compare/'+checkpointSha+'...'+mainSha);
    if(!['ahead','identical'].includes(String(afterMerge?.status||'').toLowerCase())||
      (afterMerge?.files||[]).some(file=>integrationPathAllowed(file.filename,state.allowedPaths||[])))
      fail('UNIFIED_INTEGRATION_NOOP_MAIN_OVERLAP','Main changed an allowed assignment path after its exact merge.');
    integrationStage='postmerge-direct';integrationHeadSha=branchSha;
  }
  const existing=(state.checkpoints||[]).find(x=>String(x?.commitSha||'').toLowerCase()===checkpointSha);
  if(existing){
    const expectedUnits=state.resourceLocks.filter(x=>String(x).startsWith('entry:')).map(x=>String(x).slice(6));
    const completed=new Set(existing.completedUnits||[]);
    if(String(existing?.integrationStage||'').toLowerCase()!==integrationStage||String(existing?.validation?.status||'').toLowerCase()!=='passed'||(existing.pendingUnits||[]).length||
      expectedUnits.some(code=>!completed.has(code)))
      fail('UNIFIED_INTEGRATION_NOOP_EXISTING_CHECKPOINT_INVALID','Existing same-commit checkpoint is not a complete passed integration checkpoint.');
    writeEvent('noop-checkpoint',bundle,{operation:'heartbeat',assignmentId:state.assignmentId,leaseToken:state.leaseToken,leaseEpoch:state.leaseEpoch},runId*10+4);
    return;
  }
  writeEvent('noop-checkpoint',bundle,{operation:'checkpoint',assignmentId:state.assignmentId,leaseToken:state.leaseToken,leaseEpoch:state.leaseEpoch,
    commitSha:checkpointSha,integrationStage,integrationHeadSha,
    validation:{status:'passed',workflow:'MLS Unified R33 Integration Execute',runId},
    completedUnits:state.resourceLocks.filter(x=>String(x).startsWith('entry:')).map(x=>String(x).slice(6)),pendingUnits:[],
    notes:integrationStage==='noop'?'Unified idempotent no-op integration: pinned sources and regenerated indexes already match canonical main.':'Recovered exact direct merge after the assignment branch was already integrated into Main.'},runId*10+4);
}
async function noopFinishEvent(){
  const bundle=JSON.parse(fs.readFileSync(process.argv[3],'utf8')),runId=Number(process.argv[4]);
  const {repository}=githubContext();
  const issue=await gh('/repos/'+repository+'/issues/'+bundle.issueNumber);
  const state=core.parseAssignmentState(issue.body||'');
  const checkpoint=(state?.checkpoints||[]).at(-1);
  const checkpointSha=String(state?.lastCheckpointCommit||'').toLowerCase();
  const checkpointStage=String(checkpoint?.integrationStage||'').toLowerCase();
  if(!state||state.assignmentId!==bundle.assignmentId||state.status!=='leased'||!/^[a-f0-9]{40}$/.test(checkpointSha)||
    !['noop','postmerge','postmerge-direct'].includes(checkpointStage)||String(checkpoint?.validation?.status||'').toLowerCase()!=='passed'||
    (checkpoint?.pendingUnits||[]).length)
    fail('UNIFIED_INTEGRATION_NOOP_FINISH_STATE_INVALID');
  const mainRef=await gh('/repos/'+repository+'/git/ref/heads/main');
  const branchRef=await gh('/repos/'+repository+'/git/ref/heads/'+state.branch.split('/').map(encodeURIComponent).join('/'));
  const mainSha=String(mainRef?.object?.sha||'').toLowerCase(),branchSha=String(branchRef?.object?.sha||'').toLowerCase();
  const checkpointHead=String(checkpoint?.integrationHeadSha||'').toLowerCase();
  if(checkpointStage==='postmerge-direct'){
    const afterMerge=await gh('/repos/'+repository+'/compare/'+checkpointSha+'...'+mainSha);
    if(branchSha!==checkpointHead||!['ahead','identical'].includes(String(afterMerge?.status||'').toLowerCase()))
      fail('UNIFIED_INTEGRATION_NOOP_FINISH_MAIN_MOVED','Direct-merge finish requires the exact assignment head and its merge to remain in current Main.');
  }else if(checkpointSha!==mainSha||checkpointSha!==branchSha){
    fail('UNIFIED_INTEGRATION_NOOP_FINISH_MAIN_MOVED','No-op finish requires the accepted checkpoint, assignment branch HEAD and current main HEAD to match.');
  }
  writeEvent('noop-finish',bundle,{operation:'finish',assignmentId:state.assignmentId,leaseToken:state.leaseToken,leaseEpoch:state.leaseEpoch,
    commitSha:checkpointSha,integrationStage:checkpointStage,integrationHeadSha:checkpointHead},runId*10+5);
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
async function directPremergeEvent(){
  const bundle=JSON.parse(fs.readFileSync(process.argv[3],'utf8')),headSha=String(process.argv[4]||'').toLowerCase(),runId=Number(process.argv[5]);
  if(bundle.integration?.allowDirectFallback!==true)fail('UNIFIED_INTEGRATION_DIRECT_FALLBACK_NOT_ALLOWED');
  if(!/^[a-f0-9]{40}$/.test(headSha))fail('UNIFIED_INTEGRATION_DIRECT_HEAD_INVALID');
  const {repository}=githubContext(),issue=await gh('/repos/'+repository+'/issues/'+bundle.issueNumber);
  const state=core.parseAssignmentState(issue.body||'');
  if(!state||state.assignmentId!==bundle.assignmentId||state.status!=='leased')fail('UNIFIED_INTEGRATION_DIRECT_PREMERGE_STATE_INVALID');
  writeEvent('direct-premerge',bundle,{operation:'checkpoint',assignmentId:state.assignmentId,leaseToken:state.leaseToken,leaseEpoch:state.leaseEpoch,
    commitSha:headSha,integrationStage:'premerge-direct',integrationHeadSha:headSha,
    validation:{status:'passed',workflow:'MLS Unified R33 Integration Execute',runId},
    completedUnits:state.resourceLocks.filter(x=>String(x).startsWith('entry:')).map(x=>String(x).slice(6)),pendingUnits:[],
    notes:'Unified direct fallback premerge checkpoint after source pinning, index regeneration and R33 tests.'},runId*10+6);
}
async function directMerge(){
  const bundle=JSON.parse(fs.readFileSync(process.argv[3],'utf8')),headSha=String(process.argv[4]||'').toLowerCase();
  if(bundle.integration?.allowDirectFallback!==true)fail('UNIFIED_INTEGRATION_DIRECT_FALLBACK_NOT_ALLOWED');
  if(!/^[a-f0-9]{40}$/.test(headSha))fail('UNIFIED_INTEGRATION_DIRECT_HEAD_INVALID');
  const {repository}=githubContext();
  const branchRef=await gh('/repos/'+repository+'/git/ref/heads/'+bundle.branch.split('/').map(encodeURIComponent).join('/'));
  const branchSha=String(branchRef?.object?.sha||'').toLowerCase();
  if(branchSha!==headSha)fail('UNIFIED_INTEGRATION_DIRECT_BRANCH_MOVED','Assignment branch moved before direct merge.');
  const mainRef=await gh('/repos/'+repository+'/git/ref/heads/main');
  const mainSha=String(mainRef?.object?.sha||'').toLowerCase(),base=String(bundle.baseCommit||'').toLowerCase();
  if(!/^[a-f0-9]{40}$/.test(base))fail('UNIFIED_INTEGRATION_DIRECT_BASE_INVALID');
  run('git',['fetch','--no-tags','origin','refs/heads/main:refs/remotes/origin/main']);
  if(mainSha!==base){
    try{run('git',['merge-base','--is-ancestor',base,'refs/remotes/origin/main'],{capture:true});}
    catch{fail('UNIFIED_INTEGRATION_DIRECT_MAIN_DIVERGED','main is no longer a descendant of the serialized assignment base.');}
    const mainChanged=new Set(run('git',['diff','--name-only',base+'..refs/remotes/origin/main'],{capture:true}).split(/\\r?\\n/).filter(Boolean));
    const branchChanged=new Set(run('git',['diff','--name-only',base+'..'+headSha],{capture:true}).split(/\\r?\\n/).filter(Boolean));
    const overlap=[...mainChanged].filter(file=>branchChanged.has(file));
    if(overlap.length)fail('UNIFIED_INTEGRATION_DIRECT_MAIN_OVERLAP','main moved on files also changed by the validated integration branch: '+overlap.join(', '));
  }
  run('git',['config','user.name','github-actions[bot]']);
  run('git',['config','user.email','41898282+github-actions[bot]@users.noreply.github.com']);
  run('git',['checkout','-B','unified-direct-main','refs/remotes/origin/main']);
  run('git',['merge','--no-ff','--no-edit',headSha]);
  const mergeSha=String(run('git',['rev-parse','HEAD'],{capture:true})).trim().toLowerCase();
  if(!/^[a-f0-9]{40}$/.test(mergeSha)||mergeSha===headSha)fail('UNIFIED_INTEGRATION_DIRECT_MERGE_SHA_INVALID');
  run('git',['push','origin','HEAD:refs/heads/main']);
  const finalRef=await gh('/repos/'+repository+'/git/ref/heads/main');
  if(String(finalRef?.object?.sha||'').toLowerCase()!==mergeSha)fail('UNIFIED_INTEGRATION_DIRECT_MAIN_VERIFY_FAILED');
  output('merge_sha',mergeSha);
}
async function directPostmergeEvent(){
  const bundle=JSON.parse(fs.readFileSync(process.argv[3],'utf8')),mergeSha=String(process.argv[4]||'').toLowerCase();
  const headSha=String(process.argv[5]||'').toLowerCase(),runId=Number(process.argv[6]);
  const {repository}=githubContext(),issue=await gh('/repos/'+repository+'/issues/'+bundle.issueNumber);
  const state=core.parseAssignmentState(issue.body||'');
  if(!state||state.assignmentId!==bundle.assignmentId||state.status!=='leased')fail('UNIFIED_INTEGRATION_DIRECT_POSTMERGE_STATE_INVALID');
  writeEvent('direct-postmerge',bundle,{operation:'checkpoint',assignmentId:state.assignmentId,leaseToken:state.leaseToken,leaseEpoch:state.leaseEpoch,
    commitSha:mergeSha,integrationStage:'postmerge-direct',integrationHeadSha:headSha,
    validation:{status:'passed',workflow:'MLS Unified R33 Integration Execute',runId},
    completedUnits:state.resourceLocks.filter(x=>String(x).startsWith('entry:')).map(x=>String(x).slice(6)),pendingUnits:[],
    notes:'Unified direct fallback merge verified on main after an exact base/head merge commit.'},runId*10+7);
}
async function directPostmergeReconcile(){
  const bundle=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
  const mergeSha=String(process.argv[4]||'').toLowerCase(),headSha=String(process.argv[5]||'').toLowerCase(),runId=Number(process.argv[6]);
  const {repository}=githubContext();
  const issue=await gh('/repos/'+repository+'/issues/'+bundle.issueNumber);
  const state=core.parseAssignmentState(issue.body||'');
  if(!state||state.assignmentId!==bundle.assignmentId||state.status!=='leased')fail('UNIFIED_INTEGRATION_DIRECT_RECOVERY_STATE_INVALID');
  const expectedUnits=(state.resourceLocks||[]).filter(x=>String(x).startsWith('entry:')).map(x=>String(x).slice(6));
  if(directPostmergeCheckpointMatches(state,mergeSha,headSha,expectedUnits)){
    output('recovery_needed','false');
    console.log(JSON.stringify({ok:true,status:'DIRECT_POSTMERGE_ACK',idempotent_existing:true,assignmentId:state.assignmentId,mergeSha,headSha,scopeSize:expectedUnits.length}));
    return;
  }
  const existing=(state.checkpoints||[]).find(x=>String(x.commitSha||'').toLowerCase()===mergeSha);
  if(existing)fail('UNIFIED_INTEGRATION_DIRECT_POSTMERGE_CONFLICT','A checkpoint for the merge SHA exists but does not match its exact integration scope.');
  if(!/^[a-f0-9]{40}$/.test(mergeSha)||!/^[a-f0-9]{40}$/.test(headSha)||!expectedUnits.length)fail('UNIFIED_INTEGRATION_DIRECT_RECOVERY_SCOPE_INVALID');
  if(!recoveryContext.acceptedHead(state,headSha))fail('UNIFIED_INTEGRATION_DIRECT_RECOVERY_PREMERGE_MISSING');
  const branchRef=await gh('/repos/'+repository+'/git/ref/heads/'+state.branch.split('/').map(encodeURIComponent).join('/'));
  if(String(branchRef?.object?.sha||'').toLowerCase()!==headSha)fail('UNIFIED_INTEGRATION_DIRECT_RECOVERY_BRANCH_MOVED');
  const mainRef=await gh('/repos/'+repository+'/git/ref/heads/main');
  const mainSha=String(mainRef?.object?.sha||'').toLowerCase();
  const mainComparison=await gh('/repos/'+repository+'/compare/'+mergeSha+'...'+mainSha);
  if(!['ahead','identical'].includes(String(mainComparison?.status||'').toLowerCase())||
    (mainComparison?.files||[]).some(file=>integrationPathAllowed(file.filename,state.allowedPaths||[])))
    fail('UNIFIED_INTEGRATION_DIRECT_RECOVERY_MAIN_MOVED');
  const mergeCommit=await gh('/repos/'+repository+'/git/commits/'+mergeSha);
  const parents=(mergeCommit?.parents||[]).map(x=>String(x?.sha||'').toLowerCase());
  if(parents.length!==2||parents[1]!==headSha)fail('UNIFIED_INTEGRATION_DIRECT_RECOVERY_IDENTITY_MISMATCH');
  const premerge=(state.checkpoints||[]).find(x=>String(x.integrationStage||'').toLowerCase()==='premerge-direct'&&String(x.integrationHeadSha||'').toLowerCase()===headSha);
  const premergeUnits=new Set((premerge?.completedUnits||[]).map(String));
  if(!premerge||String(premerge.validation?.status||'').toLowerCase()!=='passed'||(premerge.pendingUnits||[]).length||
    premergeUnits.size!==expectedUnits.length||!expectedUnits.every(x=>premergeUnits.has(x)))
    fail('UNIFIED_INTEGRATION_DIRECT_RECOVERY_PREMERGE_SCOPE_MISMATCH');
  const event={operation:'checkpoint',assignmentId:state.assignmentId,leaseToken:state.leaseToken,leaseEpoch:state.leaseEpoch,
    commitSha:mergeSha,integrationStage:'postmerge-direct',integrationHeadSha:headSha,
    validation:{status:'passed',workflow:'MLS Unified R33 Integration Execute',runId},
    completedUnits:expectedUnits,pendingUnits:[],
    notes:'Idempotently reconstructed lost direct postmerge checkpoint after verifying exact merge parents and complete premerge scope.'};
  writeEvent('direct-postmerge-recovery',bundle,event,runId*10+9);
  output('recovery_needed','true');
  console.log(JSON.stringify({ok:true,status:'DIRECT_POSTMERGE_RECOVERY_READY',applied:false,assignmentId:state.assignmentId,mergeSha,headSha,scopeSize:expectedUnits.length}));
}
async function verifyDirectPostmerge(){
  const bundle=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
  const mergeSha=String(process.argv[4]||'').toLowerCase(),headSha=String(process.argv[5]||'').toLowerCase();
  const {repository}=githubContext(),issue=await gh('/repos/'+repository+'/issues/'+bundle.issueNumber);
  const state=core.parseAssignmentState(issue.body||'');
  const expectedUnits=(state?.resourceLocks||[]).filter(x=>String(x).startsWith('entry:')).map(x=>String(x).slice(6));
  if(!state||state.assignmentId!==bundle.assignmentId||!directPostmergeCheckpointMatches(state,mergeSha,headSha,expectedUnits))
    fail('UNIFIED_INTEGRATION_DIRECT_POSTMERGE_ACK_MISSING');
  console.log(JSON.stringify({ok:true,status:'DIRECT_POSTMERGE_ACK',applied:true,assignmentId:state.assignmentId,mergeSha,headSha,scopeSize:expectedUnits.length}));
}
async function verifyDirectFinish(){
  const bundle=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
  const mergeSha=String(process.argv[4]||'').toLowerCase(),headSha=String(process.argv[5]||'').toLowerCase();
  const {repository}=githubContext(),issue=await gh('/repos/'+repository+'/issues/'+bundle.issueNumber);
  const state=core.parseAssignmentState(issue.body||'');
  const expectedUnits=(state?.resourceLocks||[]).filter(x=>String(x).startsWith('entry:')).map(x=>String(x).slice(6));
  if(!state||state.assignmentId!==bundle.assignmentId||!state.readyToClose||
    String(state.finalCommitSha||'').toLowerCase()!==mergeSha||
    !directPostmergeCheckpointMatches(state,mergeSha,headSha,expectedUnits))
    fail('UNIFIED_INTEGRATION_DIRECT_FINISH_ACK_MISSING');
  console.log(JSON.stringify({ok:true,status:'DIRECT_FINISH_ACK',readyToClose:true,finalCommitSha:state.finalCommitSha,assignmentId:state.assignmentId,scopeSize:expectedUnits.length}));
}
async function directFinishEvent(){
  const bundle=JSON.parse(fs.readFileSync(process.argv[3],'utf8')),mergeSha=String(process.argv[4]||'').toLowerCase();
  const headSha=String(process.argv[5]||'').toLowerCase(),runId=Number(process.argv[6]);
  const {repository}=githubContext(),issue=await gh('/repos/'+repository+'/issues/'+bundle.issueNumber);
  const state=core.parseAssignmentState(issue.body||'');
  const expectedUnits=(state?.resourceLocks||[]).filter(x=>String(x).startsWith('entry:')).map(x=>String(x).slice(6));
  if(!state||state.assignmentId!==bundle.assignmentId||!directPostmergeCheckpointMatches(state,mergeSha,headSha,expectedUnits))
    fail('UNIFIED_INTEGRATION_DIRECT_FINISH_STATE_INVALID');
  writeEvent('direct-finish',bundle,{operation:'finish',assignmentId:state.assignmentId,leaseToken:state.leaseToken,leaseEpoch:state.leaseEpoch,
    commitSha:mergeSha,integrationStage:'postmerge-direct',integrationHeadSha:headSha},runId*10+8);
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
  if(mode==='direct-premerge-event')return directPremergeEvent();
  if(mode==='direct-merge')return directMerge();
  if(mode==='direct-postmerge-event')return directPostmergeEvent();
  if(mode==='direct-postmerge-reconcile')return directPostmergeReconcile();
  if(mode==='verify-direct-postmerge')return verifyDirectPostmerge();
  if(mode==='verify-direct-finish')return verifyDirectFinish();
  if(mode==='direct-finish-event')return directFinishEvent();
  if(mode==='postmerge-event')return postmergeEvent();
  if(mode==='finish-event')return finishEvent();
  fail('UNIFIED_INTEGRATION_MODE_INVALID');
}
if(require.main===module)main().catch(error=>{console.error(error.code||'UNIFIED_INTEGRATION_ERROR',error.message);process.exitCode=2});
module.exports={MARKER,AUTHORIZED,extractMarked,validateState,directPostmergeCheckpointMatches};
