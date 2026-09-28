'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const core=require('../MLS R32 EDITORIAL/global dispatcher/core.js');

function registry(){
  return core.normalizeRegistry({schemaVersion:'1.0',items:[
    {workId:'alpha-work',workType:'editorial_batch',status:'ready',priority:25,createdAt:'2026-09-28T00:00:00Z',dependsOn:[],resourceLocks:['entry:MLS-V01-0316'],allowedPaths:['sample/a'],validation:['R33'],provider:'r33-farm'},
    {workId:'beta-work',workType:'editorial_batch',status:'ready',priority:25,createdAt:'2026-09-28T00:00:00Z',dependsOn:[],resourceLocks:['entry:MLS-V01-0322'],allowedPaths:['sample/b'],validation:['R33'],provider:'r33-farm'}
  ]});
}

test('legacy #709 ledger can migrate losslessly to a bounded compressed envelope',()=>{
  const ledger=core.initialLedger(registry());
  for(let i=0;i<500;i++){
    const workId='r33-farm:test:MLS-V01-'+String(i).padStart(4,'0')+':5';
    ledger.terminal[workId]={
      status:'done',workVersion:1,assignmentId:'MLS-GLOBAL-'+String(1000+i).padStart(6,'0'),
      commitSha:'a'.repeat(40),provider:'r33-farm',completedUnits:['MLS-V01-'+String(i).padStart(4,'0')],
      branch:'worker/r33-farm/'+String(i),completedAt:'2026-09-28T16:30:52.927Z'
    };
    ledger.epochs[workId]=1000+i;
  }
  for(let i=0;i<1600;i++)ledger.requests['autopull:MLS-GLOBAL-'+String(i).padStart(6,'0')+':5874290789']={
    status:i%2?'done':'duplicate_done',workId:'work-'+i,assignmentId:'MLS-GLOBAL-'+String(i).padStart(6,'0'),issueNumber:i,updatedAt:'2026-09-28T16:30:52.927Z'
  };
  ledger.recoveries['recoverable-work']={kind:'checkpoint_progress',branch:'worker/test',lastCheckpointCommit:'f'.repeat(40)};
  assert.ok(Buffer.byteLength(JSON.stringify(ledger),'utf8')>262144,'fixture exceeds GitHub issue body limit');
  const legacy='## MLS Global Dispatcher ledger\n\n<!-- MLS_GLOBAL_DISPATCH_LEDGER\n'+JSON.stringify(ledger)+'\n-->';
  assert.deepEqual(core.parseLedger(legacy),ledger);
  const body=core.renderLedgerBody(ledger);
  assert.ok(Buffer.byteLength(body,'utf8')<240*1024,'bounded margin below GitHub limit');
  assert.match(body,/"storage":"deflate-raw-base64"/);
  assert.deepEqual(core.parseLedger(body),ledger,'every terminal, request, epoch, recovery preserved');
  assert.equal(Object.keys(core.parseLedger(body).terminal).length,500);
  assert.equal(Object.keys(core.parseLedger(body).requests).length,1600);
});

test('integrity failure and unsupported compressed formats are unreadable, never silently empty',()=>{
  const ledger=core.initialLedger(registry()),body=core.renderLedgerBody(ledger);
  const match=/<!-- MLS_GLOBAL_DISPATCH_LEDGER\n([\s\S]*?)\n-->/.exec(body);
  assert.ok(match);
  const marker=JSON.parse(match[1]);
  const corrupt={...marker,payloadHash:'0'.repeat(64)};
  assert.equal(core.parseLedger('<!-- MLS_GLOBAL_DISPATCH_LEDGER\n'+JSON.stringify(corrupt)+'\n-->'),null);
  const unknown={...marker,storage:'unknown'};
  assert.equal(core.parseLedger('<!-- MLS_GLOBAL_DISPATCH_LEDGER\n'+JSON.stringify(unknown)+'\n-->'),null);
  assert.equal(core.parseLedger('<!-- MLS_GLOBAL_DISPATCH_LEDGER\n{invalid}\n-->'),null);
});

test('a restored durable DONE terminal excludes the workId even when provider snapshot says ready',()=>{
  const r=registry(),ledger=core.initialLedger(r);
  ledger.terminal['alpha-work']={status:'done',assignmentId:'MLS-GLOBAL-001698',commitSha:'a'.repeat(40)};
  const selected=core.selectNextWork(r,ledger,[],Date.parse('2026-09-28T16:40:00Z'));
  assert.equal(selected?.item.workId,'beta-work');
});

test('scheduler reconciles closed DONE before dispatch and saves a reservation before publishing lease',()=>{
  const source=fs.readFileSync('scripts/MLS global dispatcher scheduler.cjs','utf8');
  assert.match(source,/async function reconcileClosedDone\(ledgerItem\)/);
  assert.match(source,/allIssues\('closed'\)/);
  assert.match(source,/sort\(\(a,b\)=>Number\(a\.issue\.number\)-Number\(b\.issue\.number\)\)/);
  assert.match(source,/const history=await reconcileClosedDone\(ledgerItem\);[\s\S]*?await sweep/);
  assert.match(source,/await saveLedger\(ledgerItem\);\s*await updateIssue\(issue\.number,\{title:'\[MLS Dispatcher\]\[LEASED\]/);
  assert.match(source,/LEDGER_WRITE_CONFLICT/);
  assert.match(source,/LEDGER_PERSISTENCE_MISMATCH/);
  assert.match(source,/ISSUE_SCAN_INCOMPLETE/);
});

test('historical conflicts are explicitly detectable rather than counted twice',()=>{
  const source=fs.readFileSync('scripts/MLS global dispatcher scheduler.cjs','utf8');
  assert.match(source,/DUPLICATE_DONE_COMMIT_CONFLICT/);
  assert.match(source,/preferEarlier/);
  assert.match(source,/status=canonical\?'done':'duplicate_done'/);
});
