'use strict';
// Single-run read-side preflight. Never trusts chat claims, forged packages, stale ledgers or expired lease ownership.
const fs=require('node:fs');
const core=require('./r4 buffered core.cjs');
const allocation=require('./r4 buffered allocation.cjs');
const dispatcher=require('./global dispatcher/core.js');
const r33Core=require('./evidence farm core.js');
const providers=require('./global dispatcher/providers/integration.js');
const transport=require('./r4 buffered transport.cjs');
const sync=require('./r4 buffered sync.cjs');
function api(repo,token,request=fetch){
  if(!/^[^/]+\/[^/]+$/.test(String(repo||''))||!token)core.error('GITHUB_CREDENTIALS_REQUIRED');
  let calls=0;
  async function send(method,endpoint,body){
    calls++;
    const response=await request('https://api.github.com/repos/'+repo+endpoint,{
      method,headers:{authorization:'Bearer '+token,accept:'application/vnd.github+json',
        'content-type':'application/json','x-github-api-version':'2022-11-28',
        'user-agent':'mls-r41-buffer-synchronizer'},
      body:body===undefined?undefined:JSON.stringify(body)});
    const raw=await response.text();let data;try{data=raw?JSON.parse(raw):null;}catch{data=raw;}
    if(response.status===403||response.status===429){
      const e=new Error('GitHub '+response.status+': '+(data?.message||'Remote sync blocked')+
        '; do not retry automatically. Retry-After: '+(response.headers.get('retry-after')||'not supplied'));
      e.code='SYNC_BLOCKED';e.status=response.status;e.retryAfter=response.headers.get('retry-after')||null;throw e;
    }
    if(!response.ok){const e=new Error('GitHub '+response.status+': '+(data?.message||raw));e.status=response.status;throw e;}
    return data;
  }
  return {get:p=>send('GET',p),patch:(p,b)=>send('PATCH',p,b),counts:()=>({httpCalls:calls})};
}
async function listAll(client,path,maxPages=30){
  const out=[];
  for(let page=1;page<=maxPages;page++){
    const rows=await client.get(path+(path.includes('?')?'&':'?')+'per_page=100&page='+page);
    if(!Array.isArray(rows))core.error('INVALID_GITHUB_PAGE');
    out.push(...rows);
    if(rows.length<100)return out.filter(x=>!x.pull_request);
  }
  core.error('GITHUB_PAGE_LIMIT','Failed closed instead of trusting incomplete Issue listing.');
}
function overlap(codes,units){return units.some(x=>codes.has(typeof x==='string'?x:x.code));}
function checkpointCodes(state){return providers.completedUnitsForState(state);}
async function verifyLive(dir,root,issueNumber,client,{plan=sync.plan,collect=providers.collectR33Snapshot}={}){
  const m=core.manifest(dir),bundle=transport.assemble(dir);
  if(!Number.isSafeInteger(issueNumber)||issueNumber<1||m.allocation.assignmentIssueNumber!==issueNumber)
    core.error('RESERVATION_ISSUE_MISMATCH');
  const issues=await listAll(client,'/issues?state=open');
  const original=issues.find(x=>Number(x.number)===issueNumber);
  if(!original||!allocation.requestAuthorized(original))core.error('RESERVATION_NOT_OPEN_OR_AUTHORIZED');
  const r=allocation.parseReservation(original);
  if(r.allocationHash!==m.allocationHash||core.hash(r.allocation)!==m.allocationHash)core.error('RESERVATION_NOT_EQUAL_TO_BUNDLE');
  if(['staged','quarantined'].includes(r.status)&&r.stage.packageHash!==bundle.package.packageHash)core.error('STAGED_PACKAGE_CONFLICT');
  const other=allocation.reservations(issues).filter(x=>x.issueNumber!==issueNumber);
  const codes=new Set(m.allocation.units.map(x=>x.code));
  if(other.some(x=>overlap(codes,x.allocation.units)))core.error('OTHER_BUFFER_OWNS_CODE');
  const ledgers=issues.filter(x=>x.title==='[MLS Dispatcher Ledger]');
  if(ledgers.length!==1)core.error('GLOBAL_LEDGER_UNAVAILABLE');
  const ledger=dispatcher.parseLedger(ledgers[0].body||'');
  if(!ledger)core.error('GLOBAL_LEDGER_CORRUPT');
  for(const entry of Object.values(ledger.terminal||{})){
    if(entry?.provider==='r33-farm'&&overlap(codes,entry.completedUnits||[]))core.error('CODE_ALREADY_TERMINAL');
  }
  for(const entry of Object.values(ledger.recoveries||{})){
    if(entry?.workItem?.provider!=='r33-farm')continue;
    if(overlap(codes,[...(entry.completedUnits||[]),...providers.codesFromLocks(entry.resourceLocks||[])]))
      core.error('CODE_HAS_PENDING_RECOVERY');
  }
  for(const row of issues){
    if(!String(row.title||'').startsWith('[MLS Dispatcher][LEASED]'))continue;
    const state=dispatcher.parseAssignmentState(row.body||'');
    if(!state||state.provider!=='r33-farm')continue;
    if(overlap(codes,[...providers.codesFromLocks(state.resourceLocks||[]),...checkpointCodes(state)]))
      core.error('ACTIVE_OR_UNREAPED_CLAIM_CONFLICT');
  }
  const snapshot=collect(issues,root);
  if(snapshot.pool.poolId!==r.allocation.poolId||snapshot.pool.manifestVersion!==r.allocation.manifestVersion)
    core.error('POOL_VERSION_CHANGED');
  if(overlap(codes,[...snapshot.ledger.verified,...snapshot.ledger.exceptions]))core.error('R33_LEDGER_TERMINAL_CONFLICT');
  for(const batch of snapshot.batches){
    if(batch.status==='leased'&&overlap(codes,(batch.entries||[]).map(x=>x.code)))core.error('R33_LEGACY_BATCH_CONFLICT');
  }
  const eligible=new Set(snapshot.pool.entries.map(x=>x.code));
  if([...codes].some(code=>!eligible.has(code)))core.error('CODE_NO_LONGER_IN_AUTHORIZED_POOL');

  // Ledger can lag a closed DONE issue. Reconcile/check all closed DONE changes since its last persisted timestamp.
  const at=Date.parse(ledger.updatedAt||'');
  if(!Number.isFinite(at))core.error('GLOBAL_LEDGER_TIMESTAMP_INVALID');
  const since=encodeURIComponent(new Date(Math.max(0,at-10*60*1000)).toISOString());
  const closed=await listAll(client,'/issues?state=closed&sort=updated&direction=asc&since='+since);
  for(const row of closed){
    if(!String(row.title||'').startsWith('[MLS Dispatcher][DONE]'))continue;
    const state=dispatcher.parseAssignmentState(row.body||'');
    if(!state||state.status!=='done')core.error('DONE_ISSUE_CORRUPT');
    if(state.provider==='r33-farm'&&overlap(codes,checkpointCodes(state)))core.error('RECENT_DONE_COLLISION');
  }
  const preparedPlan=await plan(dir,root);
  return {reservation:r,plan:preparedPlan,packageHash:bundle.package.packageHash,bundleHash:bundle.bundleHash,
    codes:[...codes],remoteReads:client.counts().httpCalls};
}
function requestFromIssue(issue){
  if(!allocation.requestAuthorized(issue)||!String(issue?.title||'').startsWith('[MLS Buffered][SYNC]'))
    core.error('SYNC_REQUEST_NOT_AUTHORIZED');
  const match=[...String(issue.body||'').matchAll(/<!--\s*MLS_BUFFERED_SYNC_REQUEST\s*\n([\s\S]*?)\n-->/g)];
  if(match.length!==1)core.error('SYNC_REQUEST_MARKER_INVALID');
  let x;try{x=JSON.parse(match[0][1]);}catch{core.error('SYNC_REQUEST_JSON_INVALID');}
  if(x?.kind!=='mls_buffer_sync_request'||x.version!==1||
     !Number.isSafeInteger(x.reservationIssueNumber)||x.reservationIssueNumber<1||
     x.inboxBranch!=='r41/inbox/'+x.reservationIssueNumber)core.error('SYNC_REQUEST_SCHEMA_INVALID');
  return {issueNumber:x.reservationIssueNumber,requestIssueNumber:issue.number,inboxBranch:x.inboxBranch};
}
module.exports={api,listAll,verifyLive,requestFromIssue};
