'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createRequire}=require('node:module');
const core=require('../MLS R32 EDITORIAL/global dispatcher/core.js');

const base='8'.repeat(40);
const workId='r33-farm:MLS-R33-FULL-CORPUS-CONTINUATION:MLS-V01-0251:MLS-V01-0257:5';
const item=core.normalizeWorkItem({
  workId,workType:'editorial_batch',status:'ready',version:1,priority:1,
  resourceLocks:['entry:MLS-V01-0251'],allowedPaths:['evidence/'],provider:'r33-farm',
  validation:['R33 Editorial Batch Tests'],completion:{requiresCommit:true,requiresValidation:true}
});

function assignment(issueNumber,{status='leased',commit=null,ready=false}={}){
  const state=core.makeAssignmentState({
    issueNumber,item,requestId:'request-'+issueNumber,workerId:'worker-'+issueNumber,
    baseCommit:base,branch:'worker/r33-farm/'+String(issueNumber).padStart(6,'0'),
    now:'2026-09-28T16:20:00.000Z',token:'token-'+issueNumber
  });
  if(status==='done'){
    state.status='done';state.readyToClose=true;state.finalCommitSha=commit;
    state.closedAt='2026-09-28T16:'+(issueNumber===1694?'28':'39')+':00.000Z';
    state.checkpoints=[{commitSha:commit,validation:{status:'passed'},
      completedUnits:['MLS-V01-0251','MLS-V01-0253','MLS-V01-0254','MLS-V01-0255','MLS-V01-0257']}];
  }
  return state;
}
function harness(){
  const file=path.resolve('scripts/MLS global dispatcher scheduler.cjs');
  const context=vm.createContext({
    require:createRequire(file),__dirname:path.dirname(file),structuredClone,Buffer,
    process:{env:{GITHUB_TOKEN:'test',GITHUB_REPOSITORY:'owner/repo'}},console
  });
  vm.runInContext(fs.readFileSync(file,'utf8').replace(/main\(\)\.catch\([\s\S]*$/,''),context);
  return context;
}

test('legacy full ledger and Brotli envelope round-trip, including tamper detection',()=>{
  const ledger=core.initialLedger({schemaVersion:'1.0',items:[item]});
  for(let i=0;i<600;i++){
    ledger.terminal['r33-farm:MLS-R33-FULL-CORPUS-CONTINUATION:MLS-V01-'+String(i).padStart(4,'0')]={
      status:'done',workVersion:1,assignmentId:'MLS-GLOBAL-'+i,commitSha:'a'.repeat(40),
      provider:'r33-farm',completedUnits:['MLS-V01-'+String(i).padStart(4,'0')],
      branch:'worker/r33-farm/'+i,completedAt:'2026-09-28T16:00:00Z'
    };
    ledger.requests['request-'+i]={status:'done',workId:'work-'+i,assignmentId:'assignment-'+i,issueNumber:i,updatedAt:'2026-09-28T16:00:00Z'};
    ledger.epochs['work-'+i]=i;
  }
  const body=core.renderLedgerBody(ledger);
  assert.match(body,/"storage":"br-base64-v1"/);
  assert.ok(Buffer.byteLength(body,'utf8')<240000,'600 terminals must fit safely');
  assert.deepEqual(core.parseLedger(body),ledger);
  const old='<!-- MLS_GLOBAL_DISPATCH_LEDGER\n'+JSON.stringify(ledger)+'\n-->';
  assert.deepEqual(core.parseLedger(old),ledger);
  const tampered=body.replace(/("sha256":")[a-f0-9]/,'$1f');
  // The replacement could be a no-op only if the checksum happened to start with f.
  const malformed=tampered===body?body.replace(/("sha256":")[a-f0-9]/,'$10'):tampered;
  assert.equal(core.parseLedger(malformed),null);
});

test('stale ledger recovers first durable DONE and cancels untouched duplicate before assigning',async()=>{
  const context=harness();
  const first=assignment(1694,{status:'done',commit:'9'.repeat(40)});
  const duplicateDone=assignment(1702,{status:'done',commit:'7'.repeat(40)});
  const active=assignment(1704);
  const ledger=core.initialLedger({schemaVersion:'1.0',items:[item]});
  ledger.updatedAt='2026-09-28T09:05:07.171Z';
  let stored=core.renderLedgerBody(ledger);
  const ledgerItem={issue:{number:709,body:stored},ledger,dirty:false};
  const actions=[];
  context.ghMock=async(method,url,patch)=>{
    if(method==='GET'&&url.includes('/issues?state=closed'))return [
      {number:1702,title:'[MLS Dispatcher][DONE]',body:core.renderAssignmentBody(duplicateDone),closed_at:duplicateDone.closedAt},
      {number:1694,title:'[MLS Dispatcher][DONE]',body:core.renderAssignmentBody(first),closed_at:first.closedAt}
    ];
    if(method==='GET'&&url.includes('/issues?state=open'))return [
      {number:1704,title:'[MLS Dispatcher][LEASED]',body:core.renderAssignmentBody(active)}
    ];
    if(method==='GET'&&url.endsWith('/issues/709'))return {number:709,body:stored};
    if(method==='PATCH'&&url.endsWith('/issues/709')){stored=patch.body;actions.push('ledger');return {number:709,body:stored};}
    if(method==='GET'&&url.includes('/git/ref/heads/'))return {object:{sha:base}};
    if(method==='PATCH'&&url.endsWith('/issues/1704')){actions.push('cancel-1704');return {body:patch.body};}
    throw Error(method+' '+url);
  };
  vm.runInContext('gh=ghMock',context);
  const result=await context.sweep({items:[item]},ledgerItem,Date.parse('2026-09-28T16:50:00Z'));
  assert.equal(ledger.terminal[workId].assignmentId,first.assignmentId,'earliest DONE remains canonical');
  assert.equal(ledger.terminal[workId].commitSha,first.finalCommitSha);
  assert.equal(ledger.requests['request-1704'].status,'cancelled');
  assert.deepEqual(result.closed.map(x=>x.issueNumber),[1704]);
  assert.ok(actions.lastIndexOf('ledger')<actions.indexOf('cancel-1704'),'ledger persisted before duplicate closure');
  assert.deepEqual(core.parseLedger(stored),ledger);
});

test('ledger PATCH/body truncation is rejected without confirming persistence',async()=>{
  const context=harness();
  const ledger=core.initialLedger({schemaVersion:'1.0',items:[item]});
  let stored=core.renderLedgerBody(ledger);
  const state={issue:{number:709,body:stored},ledger,dirty:true};
  ledger.requests['request-x']={status:'assigned',issueNumber:1705};
  context.ghMock=async(method,url,patch)=>{
    if(method==='GET'&&url.endsWith('/issues/709'))return {number:709,body:stored};
    if(method==='PATCH'&&url.endsWith('/issues/709'))return {number:709,body:patch.body.slice(0,500)};
    throw Error(method+' '+url);
  };
  vm.runInContext('gh=ghMock',context);
  await assert.rejects(context.saveLedger(state),e=>e.code==='LEDGER_PATCH_MISMATCH');
  assert.equal(state.dirty,true);
});

test('duplicate with divergent branch fails closed and never rewrites DONE',async()=>{
  const context=harness();
  const state=assignment(1704),ledger=core.initialLedger({schemaVersion:'1.0',items:[item]});
  ledger.terminal[workId]={status:'done',assignmentId:'MLS-GLOBAL-001694',commitSha:'9'.repeat(40)};
  context.ghMock=async(method,url)=> {
    if(url.includes('/git/ref/heads/'))return {object:{sha:'1'.repeat(40)}};
    throw Error('Unexpected write: '+method+' '+url);
  };
  vm.runInContext('gh=ghMock',context);
  await assert.rejects(context.finalizeAssignment({number:1704},state,{ledger,dirty:false},Date.now()),
    e=>e.code==='DUPLICATE_TERMINAL_WITH_PROGRESS');
  assert.equal(ledger.terminal[workId].assignmentId,'MLS-GLOBAL-001694');
});
