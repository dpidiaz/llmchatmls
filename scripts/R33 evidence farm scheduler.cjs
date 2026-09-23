'use strict';

const path=require('node:path');
const core=require('../MLS R32 EDITORIAL/evidence farm core.js');

const token=process.env.GITHUB_TOKEN||'';
const repository=process.env.GITHUB_REPOSITORY||'';
if(!token||!/^[^/]+\/[^/]+$/.test(repository))throw new Error('GITHUB_TOKEN/GITHUB_REPOSITORY faltante.');
const [owner,repo]=repository.split('/');
const apiRoot='https://api.github.com';
const root=path.resolve(__dirname,'..');

async function gh(method,endpoint,body){
  const response=await fetch(apiRoot+endpoint,{
    method,
    headers:{authorization:'Bearer '+token,accept:'application/vnd.github+json','content-type':'application/json','x-github-api-version':'2022-11-28','user-agent':'r33-evidence-farm-r1'},
    body:body===undefined?undefined:JSON.stringify(body)
  });
  const text=await response.text();let data=null;try{data=text?JSON.parse(text):null}catch{data=text}
  if(!response.ok){const e=new Error('GitHub '+response.status+': '+(data?.message||text));e.status=response.status;throw e;}
  return data;
}
async function pages(endpoint){
  const out=[];for(let page=1;page<=20;page++){const join=endpoint.includes('?')?'&':'?';const rows=await gh('GET',endpoint+join+'per_page=100&page='+page);if(!Array.isArray(rows))break;out.push(...rows);if(rows.length<100)break;}return out;
}
async function allIssues(state='open'){return (await pages('/repos/'+owner+'/'+repo+'/issues?state='+state)).filter(x=>!x.pull_request);}
async function updateIssue(number,patch){return gh('PATCH','/repos/'+owner+'/'+repo+'/issues/'+number,patch);}
async function createIssue(title,body){return gh('POST','/repos/'+owner+'/'+repo+'/issues',{title,body});}
function farmIssue(issue){return issue&&!issue.pull_request&&String(issue.title||'').startsWith('[R33 Evidence Farm]');}
function ledgerIssue(issue,pool){return issue&&!issue.pull_request&&String(issue.title||'')==='[R33 Evidence Farm Ledger] '+pool.poolId;}
function hasCommandMarker(issue){return /<!--\s*R33_EVIDENCE_FARM_COMMAND\b/.test(String(issue?.body||''));}
function hasBatchState(issue){return Boolean(core.parseFarmState(issue?.body||''));}
function renderResponse(title,payload){return '## '+title+'\n\n'+JSON.stringify(payload,null,2)+'\n';}

async function ensureLedger(pool){
  const issues=await allIssues('open');
  for(const issue of issues.filter(x=>ledgerIssue(x,pool))){
    const raw=core.parseLedger(issue.body||'');if(raw)return {issue,ledger:core.normalizeLedger(raw,pool),dirty:false};
  }
  const ledger=core.initialLedger(pool);
  const issue=await createIssue('[R33 Evidence Farm Ledger] '+pool.poolId,core.renderLedgerBody(ledger));
  return {issue,ledger,dirty:false};
}
async function saveLedger(item){
  if(!item.dirty)return;
  item.ledger.updatedAt=core.iso();
  await updateIssue(item.issue.number,{body:core.renderLedgerBody(item.ledger)});
  item.dirty=false;
}
function mergeResult(ledgerItem,pool,code,resultMeta){
  const before=JSON.stringify(ledgerItem.ledger);
  ledgerItem.ledger=core.addTerminalToLedger(ledgerItem.ledger,pool,code,resultMeta.status);
  if(JSON.stringify(ledgerItem.ledger)!==before)ledgerItem.dirty=true;
}
async function finalizeBatch(issue,state,ledgerItem,pool,nowMs){
  const expired=core.isLeaseExpired(state,nowMs),pending=core.pendingCodes(state);
  const shouldClose=state.readyToClose||state.cancelRequested||expired||state.status!=='leased';
  if(!shouldClose)return {closed:false,state};
  for(const [code,meta] of Object.entries(state.results||{}))mergeResult(ledgerItem,pool,code,meta);
  const finalStatus=state.readyToClose?'done':state.cancelRequested?'cancelled':expired?'expired':state.status;
  const releaseReason=expired?(!state.acknowledgedAt&&state.ackDeadlineAt?'ACK_TIMEOUT':'LEASE_TIMEOUT'):state.cancelRequested?'WORKER_CANCELLED':null;
  const next={...state,status:finalStatus,closedAt:core.iso(nowMs),releasedCodes:state.readyToClose?[]:pending,releaseReason};
  await updateIssue(issue.number,{title:'[R33 Evidence Farm]['+finalStatus.toUpperCase()+'] '+state.batchId,body:core.renderBatchBody(next),state:'closed',state_reason:'completed'});
  return {closed:true,state:next,released:next.releasedCodes.length};
}
async function sweep(pool,ledgerItem,nowMs=Date.now()){
  const issues=await allIssues('open'),active=[],closed=[];
  for(const issue of issues){
    if(!farmIssue(issue))continue;
    const state=core.parseFarmState(issue.body||'');if(!state||state.poolId!==pool.poolId)continue;
    const result=await finalizeBatch(issue,state,ledgerItem,pool,nowMs);
    if(result.closed)closed.push({issueNumber:issue.number,batchId:state.batchId,status:result.state.status,releaseReason:result.state.releaseReason||null,released:result.released||0});
    else active.push({issue,state});
  }
  await saveLedger(ledgerItem);return {active,closed};
}
async function closeStale(issue,payload,stateReason='not_planned'){
  await updateIssue(issue.number,{title:'[R33 Evidence Farm][STALE] '+issue.number,body:renderResponse('R33 Evidence Farm stale command',{ok:false,...payload}),state:'closed',state_reason:stateReason});
}
async function reject(issue,error){
  await updateIssue(issue.number,{title:'[R33 Evidence Farm][REJECTED] '+issue.number,body:renderResponse('R33 Evidence Farm rejected',{ok:false,error:error.code||'EVIDENCE_FARM_ERROR',message:error.message}),state:'closed',state_reason:'not_planned'});
}
async function closeLegacyOperationalIssues(issues){
  const closed=[];
  for(const issue of issues){
    if(!farmIssue(issue)||hasBatchState(issue)||hasCommandMarker(issue))continue;
    await closeStale(issue,{error:'LEGACY_UNMARKED_COMMAND',message:'Comando sin marcador R33_EVIDENCE_FARM_COMMAND. No se ejecutó.',createdAt:issue.created_at||null});
    closed.push({issueNumber:issue.number,status:'stale_legacy'});
  }
  return closed;
}
async function drainPendingCommands(pool,ledgerItem){
  const now=Date.now(),initial=await allIssues('open'),legacy=await closeLegacyOperationalIssues(initial),s=await sweep(pool,ledgerItem,now);
  const terminal=core.terminalCodesFromLedger(ledgerItem.ledger,pool),activeStates=s.active.map(x=>x.state);
  const issues=(await allIssues('open')).filter(x=>farmIssue(x)&&!hasBatchState(x)&&hasCommandMarker(x)).sort((a,b)=>Number(a.number)-Number(b.number));
  const drained=[...legacy];
  for(const issue of issues){
    let command;
    try{command=core.parseCommand(issue.body||'');}catch(error){await reject(issue,error);drained.push({issueNumber:issue.number,status:'rejected'});continue;}
    if(command.operation==='claim'){
      if(!pool.active||pool.status!=='authorized'){
        await updateIssue(issue.number,{title:'[R33 Evidence Farm][BLOCKED] pool inactivo',body:renderResponse('R33 Evidence Farm blocked',{ok:false,error:'POOL_NOT_AUTHORIZED',poolId:pool.poolId,status:pool.status,active:pool.active}),state:'closed',state_reason:'not_planned'});
        drained.push({issueNumber:issue.number,status:'blocked',assigned:0});continue;
      }
      if(core.isClaimStale(issue.created_at,now)){
        await closeStale(issue,{error:'STALE_CLAIM',message:'El claim excedió el TTL antes de convertirse en lease.',requestId:command.requestId,requested:command.requested,claimTtlMs:core.EVIDENCE_FARM_CLAIM_TTL_MS,createdAt:issue.created_at||null});
        drained.push({issueNumber:issue.number,status:'stale_claim',assigned:0});continue;
      }
      const protectedCodes=core.protectedCodesFromBatches(activeStates),entries=core.selectNextEntries(pool,terminal,protectedCodes,command.requested);
      if(!entries.length){
        const progress=core.farmProgress({pool,ledger:ledgerItem.ledger,batches:activeStates});
        await updateIssue(issue.number,{title:'[R33 Evidence Farm][COMPLETE] sin trabajo pendiente',body:renderResponse('R33 Evidence Farm complete',{ok:true,operation:'claim',assigned:0,progress}),state:'closed',state_reason:'completed'});
        drained.push({issueNumber:issue.number,status:'complete',assigned:0});continue;
      }
      const batch=core.makeBatchState({issueNumber:issue.number,pool,requestId:command.requestId,workerId:command.workerId,workerLogin:issue.user?.login||null,entries,now:core.iso(now)});
      await updateIssue(issue.number,{title:'[R33 Evidence Farm][LEASED] '+batch.batchId,body:core.renderBatchBody(batch)});
      activeStates.push(batch);drained.push({issueNumber:issue.number,status:'leased',batchId:batch.batchId,assigned:entries.length,ackDeadlineAt:batch.ackDeadlineAt,bridgeNamespace:core.bridgeNamespace(batch)});continue;
    }
    if(command.operation==='status_global'){
      const progress=core.farmProgress({pool,ledger:ledgerItem.ledger,batches:activeStates});
      await updateIssue(issue.number,{title:'[R33 Evidence Farm][STATUS] '+pool.poolId,body:renderResponse('R33 Evidence Farm status',{ok:true,progress,reaped:s.closed}),state:'closed',state_reason:'completed'});
      drained.push({issueNumber:issue.number,status:'status_closed'});continue;
    }
    if(command.operation==='reap'){
      const progress=core.farmProgress({pool,ledger:ledgerItem.ledger,batches:activeStates});
      await updateIssue(issue.number,{title:'[R33 Evidence Farm][REAP] complete',body:renderResponse('R33 Evidence Farm reap',{ok:true,reaped:s.closed,progress}),state:'closed',state_reason:'completed'});
      drained.push({issueNumber:issue.number,status:'reap_closed'});
    }
  }
  return {drained,reaped:s.closed};
}
async function main(){
  const pool=core.loadPool(root),ledgerItem=await ensureLedger(pool),result=await drainPendingCommands(pool,ledgerItem);
  if(result.drained.length||result.reaped.length)console.log(JSON.stringify({ok:true,poolId:pool.poolId,...result}));
}
main().catch(error=>{console.error(error);process.exitCode=1});
