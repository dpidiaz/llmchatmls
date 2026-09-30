'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../MLS R32 EDITORIAL/global dispatcher/core.js');
const gate=require('../MLS R32 EDITORIAL/r4 r33 gate command.cjs');

test('MLS R33 claim is hard scoped to provider and Wave #2208 work prefix',()=>{
 const env=gate.createClaim({requestId:'r33-gate-request-0001',workerId:'r33-gate-worker-0001',workerLogin:'dpidiaz'});
 assert.match(env.title,/^\[MLS Dispatcher\]\[CLAIM\]/);
 const parsed=core.parseCommand(env.body);
 assert.equal(parsed.operation,'claim');
 assert.equal(parsed.provider,'r33-farm');
 assert.equal(parsed.workPrefix,'r33-handoff:2208:');
 assert.deepEqual(parsed.capabilities,['chat','github','r43-r33-gate']);
});

test('MLS R33 adapter accepts only leased assignments inside handoff scope',()=>{
 const item=core.normalizeWorkItem({
  workId:'r33-handoff:2208:pool:MLS-V10-0754:MLS-V10-0755:2',
  version:1,title:'gate',workType:'editorial_batch',status:'ready',priority:0,
  createdAt:'2026-09-30T10:00:00.000Z',provider:'r33-farm',
  resourceLocks:['entry:MLS-V10-0754','entry:MLS-V10-0755'],
  allowedPaths:[
   'MLS R32 EDITORIAL/evidence git/entries/espanol-guatemala/MLS-V10-0754.json',
   'MLS R32 EDITORIAL/evidence git/entries/espanol-guatemala/MLS-V10-0755.json'
  ],
  validation:['R33 Editorial Batch Tests'],dependsOn:[],
  branchPolicy:{mode:'assignment',prefix:'worker/r33-farm'},
  completion:{requiresCommit:true,requiresValidation:true}
 });
 const state=core.makeAssignmentState({
  issueNumber:9001,item,requestId:'r33-gate-request-0001',workerId:'r33-gate-worker-0001',workerLogin:'dpidiaz',
  baseCommit:'a'.repeat(40),branch:'worker/r33-farm/009001',now:'2026-09-30T10:01:00.000Z',token:'b'.repeat(32)
 });
 const issue={number:9001,title:'[MLS Dispatcher][LEASED] '+state.assignmentId+' '+state.workId,body:core.renderAssignmentBody(state)};
 const out=gate.inspectAssignment(issue);
 assert.equal(out.action,'process_r33');
 assert.equal(out.workId,state.workId);
 assert.deepEqual(out.codes,['MLS-V10-0754','MLS-V10-0755']);
});

test('MLS R33 adapter rejects R33 work outside Wave #2208 scope',()=>{
 const item=core.normalizeWorkItem({
  workId:'r33-farm:legacy:MLS-V01-0001:MLS-V01-0005:5',
  version:1,title:'legacy',workType:'editorial_batch',status:'ready',priority:0,
  createdAt:'2026-09-30T10:00:00.000Z',provider:'r33-farm',
  resourceLocks:['entry:MLS-V01-0001'],allowedPaths:['tmp/evidence.json'],
  validation:[],dependsOn:[],branchPolicy:{mode:'assignment',prefix:'worker/r33-farm'},
  completion:{requiresCommit:true,requiresValidation:true}
 });
 const state=core.makeAssignmentState({
  issueNumber:9002,item,requestId:'r33-gate-request-0002',workerId:'r33-gate-worker-0002',workerLogin:'dpidiaz',
  baseCommit:'a'.repeat(40),branch:'worker/r33-farm/009002',now:'2026-09-30T10:01:00.000Z',token:'b'.repeat(32)
 });
 const issue={number:9002,title:'[MLS Dispatcher][LEASED] '+state.assignmentId+' '+state.workId,body:core.renderAssignmentBody(state)};
 assert.throws(()=>gate.inspectAssignment(issue),{code:'R43_R33_ASSIGNMENT_SCOPE'});
});

test('R33 gate guide preserves command separation and canonical VERIFIED gate',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const text=fs.readFileSync(path.join(process.cwd(),'docs','MLS Global Dispatcher','23 R4.3 R33 Gate Worker Command.md'),'utf8');
 assert.match(text,/MLS R33 siguiente/);
 assert.match(text,/provider: \"r33-farm\"/);
 assert.match(text,/workPrefix: \"r33-handoff:2208:\"/);
 assert.match(text,/first-pass VERIFIED \+ repairs VERIFIED = 100/);
 assert.match(text,/unresolved R33 failures = 0/);
 assert.match(text,/validator bypasses = 0/);
});
