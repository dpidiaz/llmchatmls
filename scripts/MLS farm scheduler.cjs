'use strict';

const fs=require('node:fs');
const path=require('node:path');
const core=require('../MLS R32 EDITORIAL/farm core.js');

const token=process.env.GITHUB_TOKEN||'';
const repository=process.env.GITHUB_REPOSITORY||'';
if(!token||!/^[^/]+\/[^/]+$/.test(repository))throw new Error('GITHUB_TOKEN/GITHUB_REPOSITORY faltante.');
const [owner,repo]=repository.split('/');
const apiRoot='https://api.github.com';
const root=path.resolve(__dirname,'..');

async function gh(method,endpoint,body){
  const response=await fetch(apiRoot+endpoint,{
    method,
    headers:{authorization:'Bearer '+token,accept:'application/vnd.github+json','content-type':'application/json','x-github-api-version':'2022-11-28','user-agent':'mls-farm-r1'},
    body:body===undefined?undefined:JSON.stringify(body)
  });
  const text=await response.text();let data=null;try{data=text?JSON.parse(text):null}catch{data=text}
  if(!response.ok){const e=new Error('GitHub '+response.status+': '+(data?.message||text));e.status=response.status;throw e;}
  return data;
}
async function pages(endpoint){
  const out=[];for(let page=1;page<=20;page++){const join=endpoint.includes('?')?'&':'?';const rows=await gh('GET',endpoint+join+'per_page=100&page='+page);if(!Array.isArray(rows))break;out.push(...rows);if(rows.length<100)break;}return out;
}
function farmIssue(issue){return issue&&!issue.pull_request&&String(issue.title||'').startsWith('[MLS Farm]');}
function ledgerIssue(issue){return issue&&!issue.pull_request&&String(issue.title||'').startsWith('[MLS Farm Ledger]');}
function hasCommandMarker(issue){return /<!--\s*MLS_FARM_COMMAND\b/.test(String(issue?.body||''));}
function hasBatchState(issue){return Boolean(core.parseFarmState(issue?.body||''));}
async function allIssues(state='open'){return (await pages('/repos/'+owner+'/'+repo+'/issues?state='+state)).filter(x=>!x.pull_request);}
async function updateIssue(number,patch){return gh('PATCH','/repos/'+owner+'/'+repo+'/issues/'+number,patch);}
async function createIssue(title,body){return gh('POST','/repos/'+owner+'/'+repo+'/issues',{title,body});}

function preservedByPrefix(){
  const map=new Map(core.LANGUAGE_ORDER.map(x=>[x.prefix,[]]));
  for(const code of core.preservedPilotCodes(root)){const p=core.codeParts(code);map.get(p.prefix).push(p.n);}
  return map;
}
async function ensureLedgers(){
  const issues=await allIssues('open'),byPrefix=new Map();
  for(const issue of issues.filter(ledgerIssue)){
    const ledger=core.parseLedger(issue.body||'');if(ledger)byPrefix.set(ledger.prefix,{issue,ledger:core.normalizeLedger(ledger),dirty:false});
  }
  const preserved=preservedByPrefix();
  for(const lang of core.LANGUAGE_ORDER){
    if(byPrefix.has(lang.prefix))continue;
    const ledger=core.initialLedger(lang,preserved.get(lang.prefix)||[]);
    const issue=await createIssue('[MLS Farm Ledger] '+lang.prefix,core.renderLedgerBody(ledger));
    byPrefix.set(lang.prefix,{issue,ledger,dirty:false});
  }
  return byPrefix;
}
async function saveLedgers(map){
  for(const item of map.values()){
    if(!item.dirty)continue;
    item.ledger.updatedAt=core.iso();
    await updateIssue(item.issue.number,{body:core.renderLedgerBody(item.ledger)});
    item.dirty=false;
  }
}
function mergeResultIntoLedgers(ledgers,code,resultMeta){
  const p=core.codeParts(code),item=ledgers.get(p.prefix);if(!item)throw new Error('Ledger ausente '+p.prefix);
  const before=JSON.stringify(item.ledger);
  item.ledger=core.addTerminalToLedger(item.ledger,code,resultMeta.status);
  if(JSON.stringify(item.ledger)!==before)item.dirty=true;
}
async function finalizeBatch(issue,state,ledgers,nowMs){
  const expired=core.isLeaseExpired(state,nowMs),pending=core.pendingCodes(state);
  const shouldClose=state.readyToClose||state.cancelRequested||expired||state.status!=='leased';
  if(!shouldClose)return {closed:false,state};
  for(const [code,meta] of Object.entries(state.results||{}))mergeResultIntoLedgers(ledgers,code,meta);
  const finalStatus=state.readyToClose?'done':state.cancelRequested?'cancelled':expired?'expired':state.status;
  const releaseReason=expired
    ? (!state.acknowledgedAt&&state.ackDeadlineAt?'ACK_TIMEOUT':'LEASE_TIMEOUT')
    : state.cancelRequested?'WORKER_CANCELLED':null;
  const next={...state,status:finalStatus,closedAt:core.iso(nowMs),releasedCodes:state.readyToClose?[]:pending,releaseReason};
  const title='[MLS Farm]['+finalStatus.toUpperCase()+'] '+state.batchId;
  await updateIssue(issue.number,{title,body:core.renderBatchBody(next),state:'closed',state_reason:'completed'});
  return {closed:true,state:next,released:next.releasedCodes.length};
}
async function sweep(ledgers,nowMs=Date.now()){
  const issues=await allIssues('open'),active=[],closed=[];
  for(const issue of issues){
    if(!farmIssue(issue))continue;
    const state=core.parseFarmState(issue.body||'');if(!state)continue;
    const result=await finalizeBatch(issue,state,ledgers,nowMs);
    if(result.closed)closed.push({issueNumber:issue.number,batchId:state.batchId,status:result.state.status,releaseReason:result.state.releaseReason||null,released:result.released||0});
    else active.push({issue,state});
  }
  await saveLedgers(ledgers);
  return {active,closed};
}
function terminalSet(ledgers){return core.terminalCodesFromLedgers([...ledgers.values()].map(x=>x.ledger));}
function renderResponse(title,payload){return '## '+title+'\n\n'+JSON.stringify(payload,null,2)+'\n';}

async function closeStale(issue,payload,stateReason='not_planned'){
  await updateIssue(issue.number,{
    title:'[MLS Farm][STALE] '+issue.number,
    body:renderResponse('MLS Farm stale command',{ok:false,...payload}),
    state:'closed',
    state_reason:stateReason
  });
}
async function reject(issue,error){
  const payload={ok:false,error:error.code||'FARM_ERROR',message:error.message};
  await updateIssue(issue.number,{title:'[MLS Farm][REJECTED] '+issue.number,body:renderResponse('MLS Farm rejected',payload),state:'closed',state_reason:'not_planned'});
}
async function closeLegacyOperationalIssues(issues){
  const closed=[];
  for(const issue of issues){
    if(!farmIssue(issue)||ledgerIssue(issue)||hasBatchState(issue)||hasCommandMarker(issue))continue;
    await closeStale(issue,{
      error:'LEGACY_UNMARKED_COMMAND',
      message:'Comando operativo legacy sin marcador MLS_FARM_COMMAND. No se ejecutó ni se convirtió en lease.',
      createdAt:issue.created_at||null
    });
    closed.push({issueNumber:issue.number,status:'stale_legacy'});
  }
  return closed;
}
async function drainPendingCommands(ledgers){
  const now=Date.now();
  const initialIssues=await allIssues('open');
  const legacy=await closeLegacyOperationalIssues(initialIssues);
  const s=await sweep(ledgers,now);
  const corpus=core.corpusEntries(root),terminal=terminalSet(ledgers);
  const activeStates=s.active.map(x=>x.state);
  const issues=(await allIssues('open'))
    .filter(x=>farmIssue(x)&&!ledgerIssue(x)&&!hasBatchState(x)&&hasCommandMarker(x))
    .sort((a,b)=>Number(a.number)-Number(b.number));
  const drained=[...legacy];

  for(const issue of issues){
    let command;
    try{command=core.parseCommand(issue.body||'');}
    catch(error){await reject(issue,error);drained.push({issueNumber:issue.number,status:'rejected'});continue;}

    if(command.operation==='claim'){
      if(core.isClaimStale(issue.created_at,now)){
        await closeStale(issue,{
          error:'STALE_CLAIM',
          message:'El claim excedió el TTL antes de ser convertido en lease. No se reservaron entradas.',
          requestId:command.requestId,
          requested:command.requested,
          claimTtlMs:core.FARM_CLAIM_TTL_MS,
          createdAt:issue.created_at||null
        });
        drained.push({issueNumber:issue.number,status:'stale_claim',assigned:0});
        continue;
      }
      const protectedCodes=core.protectedCodesFromBatches(activeStates);
      const entries=core.selectNextEntries(corpus,terminal,protectedCodes,command.requested);
      if(!entries.length){
        const progress=core.farmProgress({corpus,ledgers:[...ledgers.values()].map(x=>x.ledger),batches:activeStates});
        await updateIssue(issue.number,{title:'[MLS Farm][COMPLETE] sin trabajo pendiente',body:renderResponse('MLS Farm complete',{ok:true,operation:'claim',assigned:0,progress}),state:'closed',state_reason:'completed'});
        drained.push({issueNumber:issue.number,status:'complete',assigned:0});
        continue;
      }
      const batch=core.makeBatchState({issueNumber:issue.number,requestId:command.requestId,workerId:command.workerId,workerLogin:issue.user?.login||null,entries,now:core.iso(now)});
      await updateIssue(issue.number,{title:'[MLS Farm][LEASED] '+batch.batchId,body:core.renderBatchBody(batch)});
      activeStates.push(batch);
      drained.push({issueNumber:issue.number,status:'leased',batchId:batch.batchId,assigned:entries.length,ackDeadlineAt:batch.ackDeadlineAt});
      continue;
    }

    if(command.operation==='status_global'){
      const progress=core.farmProgress({corpus,ledgers:[...ledgers.values()].map(x=>x.ledger),batches:activeStates});
      await updateIssue(issue.number,{title:'[MLS Farm][STATUS] global',body:renderResponse('MLS Farm status',{ok:true,progress,reaped:s.closed}),state:'closed',state_reason:'completed'});
      drained.push({issueNumber:issue.number,status:'status_closed'});
      continue;
    }

    if(command.operation==='reap'){
      const progress=core.farmProgress({corpus,ledgers:[...ledgers.values()].map(x=>x.ledger),batches:activeStates});
      await updateIssue(issue.number,{title:'[MLS Farm][REAP] complete',body:renderResponse('MLS Farm reap',{ok:true,reaped:s.closed,progress}),state:'closed',state_reason:'completed'});
      drained.push({issueNumber:issue.number,status:'reap_closed'});
    }
  }
  return {drained,reaped:s.closed};
}

async function main(){
  const ledgers=await ensureLedgers();
  const result=await drainPendingCommands(ledgers);
  if(result.drained.length||result.reaped.length)console.log(JSON.stringify({ok:true,...result}));
}
main().catch(error=>{console.error(error);process.exitCode=1});
