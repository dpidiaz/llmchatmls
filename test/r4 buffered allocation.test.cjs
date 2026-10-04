'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const buffered=require('../MLS R32 EDITORIAL/r4 buffered allocation.cjs');
const r33=require('../MLS R32 EDITORIAL/global dispatcher/providers/r33.js');
const providers=require('../MLS R32 EDITORIAL/global dispatcher/providers/integration.js');
const epoch=Date.parse('2026-09-28T19:00:00.000Z');
const code=i=>'MLS-V10-'+String(i).padStart(4,'0');
function pool(n=140){return {poolId:'MLS-R33-TEST-BUFFER',manifestVersion:'1.0',status:'authorized',active:true,
 sourceOfTruth:'github',execution:{defaultClaimSize:5,maxClaimSize:10},
 entries:Array.from({length:n},(_,i)=>({code:code(i+1),language:'espanol-guatemala',
 contentPath:'content/espanol-guatemala/'+code(i+1)+'.json',order:i+1}))};}
const ledger={poolId:'MLS-R33-TEST-BUFFER',manifestVersion:'1.0',verified:[],exceptions:[]};
const args=(issueNumber,size=10)=>({size,issueNumber,requestId:'buffer-request-'+issueNumber,
 baseCommit:'a'.repeat(40),contentManifestBlobSha:'b'.repeat(40),now:epoch});
function issue(r){return {number:r.issueNumber,title:'[MLS Buffered][RESERVED] '+r.allocation.assignmentId,
 state:'open',author_association:'OWNER',body:buffered.renderReservation(r)};}
test('one durable 10-unit reservation uses canonical provider identities',()=>{
 const first=buffered.allocate({pool:pool(),ledger,batches:[]},args(1234));
 assert.equal(first.allocation.units.length,10);assert.equal(first.allocation.units[0].code,code(1));
 assert.equal(first.allocation.assignmentIssueNumber,1234);
 assert.equal(buffered.parseReservation(issue(first)).allocationHash,first.allocationHash);
 assert.equal(buffered.reservations([issue(first)]).length,1);
});
test('reserved units remain excluded after conversational lease TTL',()=>{
 const first=buffered.allocate({pool:pool(),ledger,batches:[]},args(1234));
 const snapshot=providers.projectR33Snapshot({pool:pool(),ledger,batches:[],bufferedReservations:buffered.reservations([issue(first)])},{globalLedger:{terminal:{}},globalAssignments:[]});
 assert.equal(snapshot.reservedCodes.length,10);
 const second=buffered.allocate(snapshot,args(1235));
 assert.deepEqual(second.allocation.units.map(x=>x.code),Array.from({length:10},(_,i)=>code(i+11)));
});
test('refuses conflicting old live claims or terminal ownership',()=>{
 const first=buffered.allocate({pool:pool(),ledger,batches:[]},args(1234));
 const snapshot=providers.projectR33Snapshot({pool:pool(),ledger,batches:[],bufferedReservations:[first]},{globalLedger:{terminal:{}},
 globalAssignments:[{status:'leased',provider:'r33-farm',assignmentId:'CLAIM-A',
 resourceLocks:['entry:'+code(1)],ackDeadlineAt:'2026-09-28T20:00:00Z',expiresAt:'2026-09-28T20:00:00Z'}]});
 assert.throws(()=>r33.materializeCandidate(snapshot,{now:epoch,requested:1}),e=>e.code==='BUFFER_DOUBLE_OWNER');
 assert.throws(()=>r33.materializeCandidate({...snapshot,ledger:{...ledger,verified:[code(1)]},batches:[]},{now:epoch,requested:1}),e=>e.code==='BUFFER_TERMINAL_CONFLICT');
});
test('serialized reservations dedupe repeated issue inventory but reject real overlapping owners',()=>{
 const first=buffered.allocate({pool:pool(),ledger,batches:[]},args(1234));
 const firstIssue=issue(first);
 assert.equal(buffered.reservations([firstIssue,{...firstIssue}]).length,1);
 const copy={...first,issueNumber:1235};
 assert.throws(()=>buffered.parseReservation(issue(copy)),e=>e.code==='BUFFER_RESERVATION_INVALID');
 const other=buffered.allocate({pool:pool(),ledger,batches:[]},args(1235));
 assert.throws(()=>buffered.reservations([firstIssue,issue(other)]),e=>e.code==='DOUBLE_BUFFERED_OWNERSHIP');
});
test('public non-collaborator cannot block R33 with fake reservation issue',()=>{
 const r=buffered.allocate({pool:pool(),ledger,batches:[]},args(1234));
 const fake={...issue(r),author_association:'NONE'};
 assert.deepEqual(buffered.reservations([fake]),[]);
 assert.equal(buffered.requestAuthorized(fake),false);
});
test('only valid requested sizes and reviewed releases accepted',()=>{
 const i={title:'[MLS Buffered][REQUEST] pilot',author_association:'OWNER',
 body:'<!-- MLS_BUFFERED_REQUEST\n'+JSON.stringify({kind:'mls_buffer_request',version:1,requestId:'test-r41-request',mode:'reserve',size:10})+'\n-->'};
 assert.equal(buffered.parseRequest(i).size,10);
 assert.deepEqual(buffered.ALLOWED_NEW_BATCH_SIZES,[10,25]);
 assert.equal(buffered.MAX_NEW_BATCH_SIZE,25);
 const i25={...i,body:i.body.replace('"size":10','"size":25')};
 assert.equal(buffered.parseRequest(i25).size,25);
 for(const size of [26,50,100]){
  const rejected={...i,body:i.body.replace('"size":10','"size":'+size)};
  assert.throws(()=>buffered.parseRequest(rejected),e=>e.code==='BUFFER_REQUEST_SIZE');
  assert.throws(()=>buffered.allocate({pool:pool(),ledger,batches:[]},args(2234,size)),e=>e.code==='BUFFER_REQUEST_INVALID');
 }
 const twentyFive=buffered.allocate({pool:pool(),ledger,batches:[]},args(2234,25));
 assert.equal(twentyFive.allocation.units.length,25);
 assert.throws(()=>buffered.parseRequest({...i,body:i.body.replace('"size":10','"size":11')}),e=>e.code==='BUFFER_REQUEST_SIZE');
 assert.throws(()=>buffered.parseRequest({...i,body:i.body.replace('"mode":"reserve","size":10','"mode":"release","targetIssueNumber":1234')}),e=>e.code==='BUFFER_RELEASE_REVIEW_REQUIRED');
});
test('staged marker can only be derived from full validated reservation',()=>{
 const r=buffered.allocate({pool:pool(),ledger,batches:[]},args(1234));
 const stage=buffered.stage(r,{branch:'r41/staged/1234',commitSha:'c'.repeat(40),packageHash:'d'.repeat(64),workflowRunId:12345,syncRequestIssueNumber:9901,checksPassed:true});
 const stagedIssue={...issue(stage),title:'[MLS Buffered][STAGED] '+r.allocation.assignmentId};
 assert.equal(buffered.parseReservation(stagedIssue).stage.commitSha,'c'.repeat(40));
 assert.throws(()=>buffered.stage(r,{branch:'r41/staged/1234',commitSha:'c'.repeat(40),packageHash:'d'.repeat(64),workflowRunId:12345,syncRequestIssueNumber:9901,checksPassed:false}),e=>e.code==='BUFFER_STAGE_INVALID');
});

test('unresolved R4 orphan recovery codes remain protected despite expired leases',()=>{
 const snapshot=providers.projectR33Snapshot({pool:pool(),ledger,batches:[],bufferedReservations:[]},{
  globalLedger:{terminal:{},recoveries:{'orphan-work':{workItem:{provider:'r33-farm',resourceLocks:['entry:'+code(1)]},
   resourceLocks:['entry:'+code(1)]}}},globalAssignments:[]});
 assert.deepEqual(snapshot.reservedCodes,[code(1)]);
 const result=r33.materializeCandidate(snapshot,{now:epoch,requested:1});
 assert.deepEqual(result.units.map(u=>u.code),[code(2)]);
});
