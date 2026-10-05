'use strict';

const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const child=require('node:child_process');

const core=require('../MLS R32 EDITORIAL/global dispatcher/core.js');
const unified=require('../MLS R32 EDITORIAL/unified command.cjs');
const PREPARED_DRAIN=require('../MLS R32 EDITORIAL/prepared drain.cjs').load();

const REPOSITORY=String(process.env.GITHUB_REPOSITORY||'');
const TOKEN=String(process.env.GITHUB_TOKEN||'');
const EDITORIAL_KEY=String(process.env.MLS_EDITORIAL_CHAT_KEY||'');
const BASE=String(process.env.MLS_UNIFIED_BASE_URL||'https://llmchatmls.dpidiaz.workers.dev').replace(/\/$/,'');
const BOT='github-actions[bot]';
const WORKERS={
  integration:'mls-unified-web-integration',
  r33:'mls-unified-web-r33'
};
const WORKFLOWS={
  integration:'MLS Unified R33 Integration Execute.yml',
  r33:'MLS Unified R33 Evidence Submit.yml'
};
const REVIEW_MARKER='MLS_UNIFIED_WEB_NEEDS_REVIEW';

function fail(code,message,status=1){const e=new Error(message||code);e.code=code;e.status=status;throw e;}
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
function repoParts(){
  const p=REPOSITORY.split('/');
  if(p.length!==2||!p[0]||!p[1])fail('UNIFIED_WEB_REPOSITORY_MISSING');
  return {owner:p[0],repo:p[1]};
}
function encodePath(value){return String(value).split('/').map(encodeURIComponent).join('/');}
function githubHeaders(){
  if(!TOKEN)fail('UNIFIED_WEB_GITHUB_TOKEN_MISSING');
  return {authorization:'Bearer '+TOKEN,accept:'application/vnd.github+json','content-type':'application/json','x-github-api-version':'2022-11-28','user-agent':'mls-unified-web-runner'};
}
async function gh(endpoint,{method='GET',body,allow404=false}={}){
  const response=await fetch('https://api.github.com'+endpoint,{
    method,headers:githubHeaders(),body:body===undefined?undefined:JSON.stringify(body)
  });
  const text=await response.text();
  let data=null;try{data=text?JSON.parse(text):null}catch{data=text}
  if(response.status===404&&allow404)return null;
  if(!response.ok){
    const e=new Error(data?.message||text||('GitHub '+response.status));
    e.code='GITHUB_'+response.status;e.status=response.status;e.data=data;throw e;
  }
  return data;
}
async function cf(pathname,body={}){
  if(!EDITORIAL_KEY)fail('UNIFIED_WEB_EDITORIAL_KEY_MISSING');
  const response=await fetch(BASE+pathname,{
    method:'POST',
    headers:{authorization:'Bearer '+EDITORIAL_KEY,'content-type':'application/json',accept:'application/json'},
    body:JSON.stringify(body)
  });
  const text=await response.text();
  let data=null;try{data=text?JSON.parse(text):null}catch{data=text}
  if(!response.ok){
    const e=new Error(data?.message||data?.error||text||('Cloudflare '+response.status));
    e.code=data?.error||('CLOUDFLARE_'+response.status);e.status=response.status;e.data=data;throw e;
  }
  return data;
}
async function report(stage,state,extra={}){
  return cf('/api/unified-runner/report',{stage,state,...extra});
}
function durableCount(r44,state){
  const row=(r44?.durableCounts||[]).find(x=>String(x.state||'')===state);
  return row?Number(row.n||0):0;
}
function r44Drained(r44){
  return ['CLAIMABLE','LEASED','PARTIAL_DURABLE','QUARANTINED'].every(state=>durableCount(r44,state)===0);
}
function parseAssignment(issue){
  try{return core.parseAssignmentState(issue?.body||'')}catch{return null}
}
function parseClaim(issue){
  try{return core.parseCommand(issue?.body||'')}catch{return null}
}
function stageMatchesState(stage,state){
  const spec=unified.stageSpec(stage);
  return !!state&&state.workerId===WORKERS[stage]&&state.workerLogin===BOT&&state.provider===spec.provider&&String(state.workId||'').startsWith(spec.workPrefix);
}
function stageMatchesClaim(stage,command){
  const spec=unified.stageSpec(stage);
  return !!command&&command.operation==='claim'&&command.workerId===WORKERS[stage]&&command.workerLogin===BOT&&command.provider===spec.provider&&command.workPrefix===spec.workPrefix;
}
async function getIssue(number){
  if(!Number.isInteger(Number(number))||Number(number)<1)return null;
  return gh('/repos/'+REPOSITORY+'/issues/'+Number(number),{allow404:true});
}
async function comments(number){
  const rows=await gh('/repos/'+REPOSITORY+'/issues/'+Number(number)+'/comments?per_page=100');
  return Array.isArray(rows)?rows:[];
}
async function findExisting(stage){
  for(let page=1;page<=3;page++){
    const rows=await gh('/repos/'+REPOSITORY+'/issues?state=open&per_page=100&sort=updated&direction=desc&page='+page);
    if(!Array.isArray(rows)||!rows.length)break;
    for(const issue of rows){
      if(stageMatchesState(stage,parseAssignment(issue))||stageMatchesClaim(stage,parseClaim(issue)))return issue;
    }
    if(rows.length<100)break;
  }
  return null;
}
async function createClaim(stage){
  const requestId=('autopull:unified-web-'+stage+'-'+String(process.env.GITHUB_RUN_ID||Date.now())+'-'+Date.now().toString(36)).slice(0,120);
  // Bot-created Dispatcher claims must use the trusted auto-pull fence. Do not delegate
  // workerLogin here: the scheduler derives github-actions[bot] from the issue author.
  const claim=unified.createClaim({stage,requestId,workerId:WORKERS[stage]});
  const issue=await gh('/repos/'+REPOSITORY+'/issues',{method:'POST',body:{title:claim.title,body:claim.body}});
  await report(stage,'CLAIM_PENDING',{issueNumber:Number(issue.number),detail:{requestId,workerId:WORKERS[stage]}});
  await gh('/repos/'+REPOSITORY+'/actions/workflows/'+encodeURIComponent('MLS Global Dispatcher Scheduler.yml')+'/dispatches',{
    method:'POST',body:{ref:'main'}
  });
  return issue;
}
async function laneIssue(stage,lane){
  let issue=lane?.issue_number?await getIssue(Number(lane.issue_number)):null;
  if(issue){
    const state=parseAssignment(issue);
    if(state?.autoPull?.issueNumber){
      const chained=await getIssue(Number(state.autoPull.issueNumber));
      if(chained){
        issue=chained;
        await report(stage,'CLAIM_PENDING',{issueNumber:Number(issue.number),detail:{source:'autoPull',from:Number(lane.issue_number)}});
      }
    }
  }
  if(!issue){
    issue=await findExisting(stage);
    if(issue)await report(stage,'RECOVERED_POINTER',{issueNumber:Number(issue.number),detail:{source:'github-open-issue'}});
  }
  if(!issue)issue=await createClaim(stage);
  return issue;
}
function expired(state){
  const end=Date.parse(String(state?.expiresAt||''));
  return !Number.isFinite(end)||Date.now()>end;
}
function syntheticEventPath(stage){
  return path.join(process.env.RUNNER_TEMP||os.tmpdir(),'mls-unified-web-'+stage+'-'+Date.now()+'.json');
}
async function heartbeatInline(issue,state,stage){
  const event={
    operation:'heartbeat',
    assignmentId:state.assignmentId,
    leaseToken:state.leaseToken,
    leaseEpoch:state.leaseEpoch
  };
  const body='<!-- MLS_GLOBAL_DISPATCH_EVENT\n'+JSON.stringify(event,null,2)+'\n-->';
  const p=syntheticEventPath(stage);
  fs.writeFileSync(p,JSON.stringify({
    issue:{number:Number(issue.number)},
    comment:{id:Date.now(),body,created_at:new Date().toISOString(),user:{login:BOT}}
  },null,2)+'\n');
  try{
    child.execFileSync(process.execPath,['scripts/MLS global dispatcher worker.cjs'],{
      cwd:process.cwd(),stdio:'inherit',env:{...process.env,GITHUB_EVENT_PATH:p}
    });
  }finally{try{fs.unlinkSync(p)}catch{}}
  const refreshed=await getIssue(Number(issue.number));
  const next=parseAssignment(refreshed);
  if(!stageMatchesState(stage,next)||next.status!=='leased')fail('UNIFIED_WEB_HEARTBEAT_STATE_MISMATCH');
  return {issue:refreshed,state:next};
}
async function replaceExpiredAssignment(stage,issue,detail={}){
  const previousIssue=Number(issue.number);
  await report(stage,'EXPIRED',{
    issueNumber:null,
    error:'Lease is no longer active.',
    detail:{previousIssue,...detail}
  });
  const replacement=await createClaim(stage);
  return {kind:'pending',issue:replacement,replacedIssue:previousIssue};
}
async function resolveAssignment(stage,lane){
  let issue=await laneIssue(stage,lane);
  const title=String(issue?.title||'');
  if(title.startsWith('[MLS Dispatcher][CLAIM]')){
    await report(stage,'CLAIM_PENDING',{issueNumber:Number(issue.number)});
    return {kind:'pending',issue};
  }
  for(const [prefix,state] of [
    ['[MLS Dispatcher][CAPACITY_BUSY]','CAPACITY_BUSY'],
    ['[MLS Dispatcher][NO_WORK]','NO_WORK'],
    ['[MLS Dispatcher][STALE]','STALE'],
    ['[MLS Dispatcher][DUPLICATE]','DUPLICATE'],
    ['[MLS Dispatcher][REJECTED]','REJECTED'],
    ['[MLS Dispatcher][EXPIRED]','EXPIRED']
  ]){
    if(title.startsWith(prefix)){
      if(state==='EXPIRED')return replaceExpiredAssignment(stage,issue,{source:'dispatcher-title'});
      await report(stage,state,{issueNumber:null,error:state==='REJECTED'?title:null,detail:{previousIssue:Number(issue.number)}});
      return {kind:state.toLowerCase(),issue};
    }
  }
  const state=parseAssignment(issue);
  if(!stageMatchesState(stage,state)){
    await report(stage,'FENCE_REJECTED',{issueNumber:null,error:'Issue pointer does not belong to web runner lane.',detail:{issueNumber:Number(issue.number)}});
    return {kind:'fence_rejected',issue};
  }
  if(state.readyToClose){
    if(state.autoPull?.issueNumber){
      const next=await getIssue(Number(state.autoPull.issueNumber));
      if(next){
        await report(stage,'CLAIM_PENDING',{issueNumber:Number(next.number),detail:{source:'readyToClose-autoPull'}});
        return {kind:'pending',issue:next};
      }
    }
    const next=await createClaim(stage);
    await report(stage,'CLAIM_PENDING',{issueNumber:Number(next.number),detail:{source:'readyToClose-recovery',from:Number(issue.number)}});
    return {kind:'pending',issue:next};
  }
  if(state.status!=='leased'||expired(state)){
    return replaceExpiredAssignment(stage,issue,{source:'assignment-state'});
  }
  const hb=await heartbeatInline(issue,state,stage);
  await report(stage,'LEASED',{issueNumber:Number(issue.number),assignmentId:hb.state.assignmentId,detail:{workId:hb.state.workId,expiresAt:hb.state.expiresAt}});
  return {kind:'leased',...hb};
}
function extractMarkedJson(body,marker){
  const re=new RegExp('<!--\\s*'+marker+'\\s*([\\s\\S]*?)-->','m'),m=re.exec(String(body||''));
  if(!m)return null;
  try{return JSON.parse(m[1].trim())}catch{return null}
}
async function recentMarker(issueNumber,marker,predicate,maxAgeMs=15*60*1000){
  const rows=await comments(issueNumber);
  const now=Date.now();
  return rows.find(c=>{
    const p=extractMarkedJson(c.body,marker);
    if(!p||!predicate(p))return false;
    const at=Date.parse(String(c.created_at||''));
    return Number.isFinite(at)&&now-at<=maxAgeMs;
  })||null;
}
async function postComment(issueNumber,body){
  return gh('/repos/'+REPOSITORY+'/issues/'+Number(issueNumber)+'/comments',{method:'POST',body:{body}});
}
async function dispatchWorkflow(file,issueNumber,commentId){
  await gh('/repos/'+REPOSITORY+'/actions/workflows/'+encodeURIComponent(file)+'/dispatches',{
    method:'POST',
    body:{ref:'main',inputs:{issue_number:String(issueNumber),comment_id:String(commentId)}}
  });
}
async function dispatchIntegration(issue,state){
  const prior=await recentMarker(issue.number,'MLS_UNIFIED_R33_INTEGRATION_EXECUTE',p=>p.assignmentId===state.assignmentId,20*60*1000);
  if(prior&&String(prior.user?.login||'')===String(state.workerLogin||'')){
    await report('integration','DISPATCHED',{issueNumber:Number(issue.number),assignmentId:state.assignmentId,detail:{commentId:Number(prior.id),deduped:true}});
    return;
  }
  const payload={assignmentId:state.assignmentId,leaseEpoch:state.leaseEpoch};
  const body='<!-- MLS_UNIFIED_R33_INTEGRATION_EXECUTE\n'+JSON.stringify(payload,null,2)+'\n-->';
  const comment=await postComment(issue.number,body);
  await dispatchWorkflow(WORKFLOWS.integration,issue.number,comment.id);
  await report('integration','DISPATCHED',{issueNumber:Number(issue.number),assignmentId:state.assignmentId,detail:{commentId:Number(comment.id),workflow:WORKFLOWS.integration}});
}

function integrationUnits(state){
  return (state.resourceLocks||[]).filter(x=>String(x).startsWith('entry:')).map(x=>String(x).slice(6));
}
async function applyIntegrationEventInline(issue,event,kind){
  const body='<!-- MLS_GLOBAL_DISPATCH_EVENT\n'+JSON.stringify(event,null,2)+'\n-->';
  const p=syntheticEventPath('integration-'+kind);
  fs.writeFileSync(p,JSON.stringify({
    issue:{number:Number(issue.number)},
    comment:{id:Date.now(),body,created_at:new Date().toISOString(),user:{login:BOT}}
  },null,2)+'\n');
  try{
    child.execFileSync(process.execPath,['scripts/MLS global dispatcher worker.cjs'],{
      cwd:process.cwd(),stdio:'inherit',env:{...process.env,GITHUB_EVENT_PATH:p}
    });
  }finally{try{fs.unlinkSync(p)}catch{}}
  const refreshed=await getIssue(Number(issue.number));
  return {issue:refreshed,state:parseAssignment(refreshed)};
}
async function existingIntegrationPr(state){
  const {owner}=repoParts();
  const rows=await gh('/repos/'+REPOSITORY+'/pulls?state=all&base=main&head='+encodeURIComponent(owner+':'+state.branch)+'&per_page=20');
  const branchRef=await gh('/repos/'+REPOSITORY+'/git/ref/heads/'+state.branch.split('/').map(encodeURIComponent).join('/'));
  const branchSha=String(branchRef?.object?.sha||'').toLowerCase();
  return (Array.isArray(rows)?rows:[])
    .filter(pr=>String(pr.head?.ref||'')===state.branch&&String(pr.head?.sha||'').toLowerCase()===branchSha)
    .sort((a,b)=>Number(b.number)-Number(a.number))[0]||null;
}
async function requiredIntegrationCheck(headSha){
  const runs=await gh('/repos/'+REPOSITORY+'/actions/runs?head_sha='+encodeURIComponent(headSha)+'&event=pull_request&per_page=50');
  return (runs.workflow_runs||[]).filter(r=>r.name==='R33 GitHub Native Tests').sort((a,b)=>Number(b.id)-Number(a.id))[0]||null;
}
async function resumeIntegrationPr(issue,state){
  const pr=await existingIntegrationPr(state);
  if(!pr||(!pr.merged_at&&pr.state!=='open'))return {handled:false};
  const headSha=String(pr.head?.sha||'').toLowerCase();
  if(!/^[a-f0-9]{40}$/.test(headSha))fail('UNIFIED_WEB_INTEGRATION_PR_HEAD_INVALID');
  const check=await requiredIntegrationCheck(headSha);
  if(!check||check.status!=='completed'){
    await report('integration','WAITING_PR_CHECK',{issueNumber:Number(issue.number),assignmentId:state.assignmentId,detail:{prNumber:Number(pr.number),headSha}});
    return {handled:true,status:'WAITING_PR_CHECK'};
  }
  if(check.conclusion!=='success')fail('UNIFIED_WEB_INTEGRATION_REQUIRED_CHECK_FAILED','R33 GitHub Native Tests: '+check.conclusion);

  let currentIssue=issue,currentState=state;
  const last=(currentState.checkpoints||[]).at(-1);
  if(!(last?.integrationStage==='premerge'&&String(last.integrationHeadSha||last.commitSha||'').toLowerCase()===headSha)){
    ({issue:currentIssue,state:currentState}=await applyIntegrationEventInline(currentIssue,{
      operation:'checkpoint',
      assignmentId:currentState.assignmentId,
      leaseToken:currentState.leaseToken,
      leaseEpoch:currentState.leaseEpoch,
      commitSha:headSha,
      integrationStage:'premerge',
      integrationPrNumber:Number(pr.number),
      integrationHeadSha:headSha,
      validation:{status:'passed',workflow:'R33 GitHub Native Tests',runId:Number(check.id)},
      completedUnits:integrationUnits(currentState),
      pendingUnits:[],
      notes:'Unified web runner resumed an existing serialized integration PR after checks passed.'
    },'resume-premerge'));
  }

  let mergeSha=String(pr.merge_commit_sha||'').toLowerCase();
  if(!pr.merged_at){
    const merged=await gh('/repos/'+REPOSITORY+'/pulls/'+Number(pr.number)+'/merge',{
      method:'PUT',body:{merge_method:'merge',sha:headSha}
    });
    if(merged?.merged!==true||!/^[a-f0-9]{40}$/.test(String(merged.sha||'')))fail('UNIFIED_WEB_INTEGRATION_MERGE_FAILED',merged?.message||'merge failed');
    mergeSha=String(merged.sha).toLowerCase();
  }
  if(!/^[a-f0-9]{40}$/.test(mergeSha)){
    const refreshedPr=await gh('/repos/'+REPOSITORY+'/pulls/'+Number(pr.number));
    mergeSha=String(refreshedPr?.merge_commit_sha||'').toLowerCase();
  }
  if(!/^[a-f0-9]{40}$/.test(mergeSha))fail('UNIFIED_WEB_INTEGRATION_MERGE_SHA_INVALID');
  const mainRef=await gh('/repos/'+REPOSITORY+'/git/ref/heads/main');
  const mainSha=String(mainRef?.object?.sha||'').toLowerCase();
  if(mainSha!==mergeSha)fail('UNIFIED_WEB_INTEGRATION_MAIN_VERIFY_FAILED','main HEAD does not match integration merge SHA.');

  currentIssue=await getIssue(Number(issue.number));
  currentState=parseAssignment(currentIssue);
  const lastAfterMerge=(currentState?.checkpoints||[]).at(-1);
  if(!(lastAfterMerge?.integrationStage==='postmerge'&&String(lastAfterMerge.commitSha||'').toLowerCase()===mergeSha)){
    ({issue:currentIssue,state:currentState}=await applyIntegrationEventInline(currentIssue,{
      operation:'checkpoint',
      assignmentId:currentState.assignmentId,
      leaseToken:currentState.leaseToken,
      leaseEpoch:currentState.leaseEpoch,
      commitSha:mergeSha,
      integrationStage:'postmerge',
      integrationPrNumber:Number(pr.number),
      integrationHeadSha:headSha,
      validation:{status:'passed',workflow:'R33 GitHub Native Tests',runId:Number(check.id)},
      completedUnits:integrationUnits(currentState),
      pendingUnits:[],
      notes:'Unified web runner resumed existing PR, merged with expected head SHA and verified main.'
    },'resume-postmerge'));
  }

  currentIssue=await getIssue(Number(issue.number));
  currentState=parseAssignment(currentIssue);
  if(!currentState?.readyToClose){
    ({issue:currentIssue,state:currentState}=await applyIntegrationEventInline(currentIssue,{
      operation:'finish',
      assignmentId:currentState.assignmentId,
      leaseToken:currentState.leaseToken,
      leaseEpoch:currentState.leaseEpoch,
      commitSha:mergeSha,
      integrationStage:'postmerge',
      integrationPrNumber:Number(pr.number),
      integrationHeadSha:headSha
    },'resume-finish'));
  }
  await report('integration','FINISHING',{issueNumber:Number(issue.number),assignmentId:currentState?.assignmentId||state.assignmentId,detail:{prNumber:Number(pr.number),headSha,mergeSha,resumedExistingPr:true}});
  return {handled:true,status:'INTEGRATION_RESUMED',prNumber:Number(pr.number),mergeSha};
}

function jsonArrayAfter(text,marker){
  const raw=String(text||''),m=raw.lastIndexOf(marker);
  if(m<0)return null;
  const src=raw.slice(m+marker.length),start=src.indexOf('[');
  if(start<0)return null;
  let depth=0,inString=false,escaped=false;
  for(let i=start;i<src.length;i++){
    const ch=src[i];
    if(inString){
      if(escaped)escaped=false;
      else if(ch==='\\')escaped=true;
      else if(ch==='"')inString=false;
      continue;
    }
    if(ch==='"'){inString=true;continue}
    if(ch==='[')depth++;
    else if(ch===']'){
      depth--;
      if(depth===0){
        try{return JSON.parse(src.slice(start,i+1))}catch{return null}
      }
    }
  }
  return null;
}
async function githubJsonAt(repoPath,ref,{optional=false}={}){
  const data=await gh('/repos/'+REPOSITORY+'/contents/'+encodePath(repoPath)+'?ref='+encodeURIComponent(ref),{allow404:optional});
  if(!data)return null;
  if(data.type!=='file'||data.encoding!=='base64')fail('UNIFIED_WEB_CONTENT_INVALID',repoPath);
  const text=Buffer.from(String(data.content||'').replace(/\n/g,''),'base64').toString('utf8');
  try{return JSON.parse(text)}catch{fail('UNIFIED_WEB_JSON_INVALID',repoPath)}
}
async function blockedCodes(issueNumber,assignmentId){
  const rows=await comments(issueNumber),out=new Set();
  for(const c of rows){
    const p=extractMarkedJson(c.body,REVIEW_MARKER);
    if(p&&p.assignmentId===assignmentId&&/^MLS-V\d{2}-\d{4}$/.test(String(p.code||'')))out.add(String(p.code));
  }
  return out;
}
async function finishR33Inline(issue,state){
  const last=(state.checkpoints||[]).at(-1);
  if(!last||last.validation?.status!=='passed'||!state.lastCheckpointCommit)return false;
  const event={operation:'finish',assignmentId:state.assignmentId,leaseToken:state.leaseToken,leaseEpoch:state.leaseEpoch,commitSha:state.lastCheckpointCommit};
  const body='<!-- MLS_GLOBAL_DISPATCH_EVENT\n'+JSON.stringify(event,null,2)+'\n-->';
  const p=syntheticEventPath('r33-finish');
  fs.writeFileSync(p,JSON.stringify({issue:{number:Number(issue.number)},comment:{id:Date.now(),body,created_at:new Date().toISOString(),user:{login:BOT}}},null,2)+'\n');
  try{
    child.execFileSync(process.execPath,['scripts/MLS global dispatcher worker.cjs'],{cwd:process.cwd(),stdio:'inherit',env:{...process.env,GITHUB_EVENT_PATH:p}});
  }finally{try{fs.unlinkSync(p)}catch{}}
  await report('r33','FINISHING',{issueNumber:Number(issue.number),assignmentId:state.assignmentId});
  return true;
}
async function dispatchR33(issue,state){
  const codes=(state.resourceLocks||[]).filter(x=>String(x).startsWith('entry:')).map(x=>String(x).slice(6));
  const completed=new Set((state.checkpoints||[]).at(-1)?.completedUnits||[]);
  const blocked=await blockedCodes(issue.number,state.assignmentId);
  const pending=codes.filter(code=>!completed.has(code));
  const code=pending.find(x=>!blocked.has(x));
  if(!code){
    if(!pending.length){
      await finishR33Inline(issue,state);
      return;
    }
    await report('r33','REVIEW_REQUIRED',{
      issueNumber:Number(issue.number),assignmentId:state.assignmentId,code:pending[0],
      error:'All remaining entries in the active microclaim require editorial review.',
      detail:{blocked:[...blocked],pending},pauseRunner:false
    });
    return;
  }
  const duplicate=await recentMarker(issue.number,'MLS_UNIFIED_R33_EVIDENCE_SUBMIT',p=>p.assignmentId===state.assignmentId&&String(p.code||'')===code,15*60*1000);
  if(duplicate){
    await report('r33','DISPATCHED',{issueNumber:Number(issue.number),assignmentId:state.assignmentId,code,detail:{commentId:Number(duplicate.id),deduped:true}});
    return;
  }
  const context=jsonArrayAfter(state.instructions,'Contexto R44=');
  if(!Array.isArray(context))fail('UNIFIED_WEB_R44_CONTEXT_MISSING');
  const ctx=context.find(x=>String(x.code||'').toUpperCase()===code);
  if(!ctx)fail('UNIFIED_WEB_R44_CODE_CONTEXT_MISSING',code);
  const contentPath=String(ctx.contentPath||'');
  const handoffPath=String(ctx.handoffPath||'');
  const evidencePath=(state.allowedPaths||[]).find(p=>String(p).startsWith('MLS R32 EDITORIAL/evidence git/entries/')&&String(p).endsWith('/'+code+'.json'));
  if(!contentPath||!handoffPath||!evidencePath)fail('UNIFIED_WEB_R33_PATH_SCOPE_MISSING',code);

  const article=await githubJsonAt(contentPath,state.branch);
  const ticket=await githubJsonAt(handoffPath,state.branch);
  const handoffEntry=(ticket.entries||[]).find(x=>String(x.code||'').toUpperCase()===code);
  if(!handoffEntry)fail('UNIFIED_WEB_HANDOFF_ENTRY_MISSING',code);
  const existing=await githubJsonAt(evidencePath,state.branch,{optional:true});
  const draft=await cf(PREPARED_DRAIN.has(code)?'/api/unified-runner/prepared-evidence':'/api/unified-runner/r33-evidence',{
    code,contentPath,article,handoffEntry,currentEvidenceRevision:Number(existing?.evidenceRevision||0),
    runId:'MLS-UNIFIED-WEB-'+String(process.env.GITHUB_RUN_ID||Date.now())
  });
  if(draft.status!=='MATCH'){
    const reviewPayload={assignmentId:state.assignmentId,leaseEpoch:state.leaseEpoch,code,reason:draft.reason||'NEEDS_CHAT_REVIEW',confidence:draft.confidence??null,sourceId:draft.sourceId||null,rationale:draft.rationale||null};
    const already=await recentMarker(issue.number,REVIEW_MARKER,p=>p.assignmentId===state.assignmentId&&String(p.code||'')===code,365*24*60*60*1000);
    if(!already)await postComment(issue.number,'<!-- '+REVIEW_MARKER+'\n'+JSON.stringify(reviewPayload,null,2)+'\n-->\n\nMLS Unified web runner paused this entry for editorial review; no Evidence was fabricated.');
    await report('r33','NEEDS_CHAT_REVIEW',{issueNumber:Number(issue.number),assignmentId:state.assignmentId,code,error:String(draft.reason||'Source match below threshold.'),detail:reviewPayload});
    return;
  }
  const payload={
    assignmentId:state.assignmentId,
    leaseEpoch:state.leaseEpoch,
    code,
    evidence:draft.evidence,
    ...(draft.finalContent?{content:draft.finalContent}:{})
  };
  const body='<!-- MLS_UNIFIED_R33_EVIDENCE_SUBMIT\n'+JSON.stringify(payload,null,2)+'\n-->';
  const comment=await postComment(issue.number,body);
  await dispatchWorkflow(WORKFLOWS.r33,issue.number,comment.id);
  await report('r33','DISPATCHED',{issueNumber:Number(issue.number),assignmentId:state.assignmentId,code,detail:{commentId:Number(comment.id),workflow:WORKFLOWS.r33,confidence:draft.confidence,sourceId:draft.source?.sourceId||null}});
}
async function run(){
  repoParts();
  const status=await cf('/api/unified-runner/status');
  const runner=status.runner||{};
  if(runner.state!=='RUNNING'){
    console.log(JSON.stringify({ok:true,status:'SKIPPED',runnerState:runner.state||null}));
    return;
  }

  const integration=await resolveAssignment('integration',status.lanes?.integration||null);
  if(integration.kind==='leased'){
    const resumed=await resumeIntegrationPr(integration.issue,integration.state);
    if(resumed.handled){
      console.log(JSON.stringify({ok:true,status:resumed.status,issueNumber:integration.issue.number,prNumber:resumed.prNumber||null,mergeSha:resumed.mergeSha||null}));
      return;
    }
    await dispatchIntegration(integration.issue,integration.state);
    console.log(JSON.stringify({ok:true,status:'INTEGRATION_DISPATCHED',issueNumber:integration.issue.number}));
    return;
  }
  if(['pending','fence_rejected'].includes(integration.kind)){
    console.log(JSON.stringify({ok:true,status:'WAITING_INTEGRATION',kind:integration.kind}));
    return;
  }

  const refreshed=await cf('/api/unified-runner/status');
  if(refreshed.runner?.state!=='RUNNING')return;
  const r33=await resolveAssignment('r33',refreshed.lanes?.r33||null);
  if(r33.kind==='leased'){
    await dispatchR33(r33.issue,r33.state);
    console.log(JSON.stringify({ok:true,status:'R33_DISPATCHED',issueNumber:r33.issue.number}));
    return;
  }
  if(integration.kind==='no_work'&&r33.kind==='no_work'&&r44Drained(refreshed.r44)&&refreshed.canonical?.initialized&&refreshed.canonical.pending===0){
    const completed=await cf('/api/unified-runner/control',{action:'complete'});
    console.log(JSON.stringify({ok:true,status:'COMPLETE',runnerState:completed.state||'COMPLETE'}));
    return;
  }
  console.log(JSON.stringify({ok:true,status:'NO_AUTOMATIC_ASSIGNMENT',integration:integration.kind,r33:r33.kind}));
}
run().catch(async error=>{
  console.error(error.code||'MLS_UNIFIED_WEB_RUNNER_ERROR',error.message);
  try{
    const stage=String(error.code||'').includes('INTEGRATION')?'integration':'r33';
    await report(stage,'ERROR',{error:(error.code||'ERROR')+': '+error.message});
  }catch(_){}
  process.exitCode=1;
});
