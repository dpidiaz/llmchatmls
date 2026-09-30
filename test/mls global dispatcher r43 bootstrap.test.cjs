'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const bootstrap=require('../MLS R32 EDITORIAL/r4 snapshot bootstrap.cjs');

const BASE='a'.repeat(40),CONTENT='b'.repeat(40);

function projectedSnapshot(n=150,start=1200){
 const entries=Array.from({length:n},(_,i)=>{
  const code='MLS-V10-'+String(start+i).padStart(4,'0');
  return {
   order:i+1,
   code,
   language:'espanol-guatemala',
   contentPath:'content/espanol-guatemala/'+code+'.json'
  };
 });
 return {
  pool:{
   poolId:'MLS-R33-FULL-CORPUS-CONTINUATION',
   manifestVersion:'1.0',
   status:'authorized',
   active:true,
   sourceOfTruth:'github',
   cloudflareEditorialAllowed:false,
   d1EditorialAllowed:false,
   execution:{defaultClaimSize:5,maxClaimSize:10},
   entries
  },
  ledger:{
   poolId:'MLS-R33-FULL-CORPUS-CONTINUATION',
   manifestVersion:'1.0',
   verified:[],
   exceptions:[]
  },
  batches:[],
  reservedCodes:[]
 };
}

test('bootstrap deterministically plans the 20x5 pilot before any worker starts',()=>{
 const p=bootstrap.plan(projectedSnapshot(),{
  waveId:'BCR-R43-PILOT-BOOTSTRAP',
  workerCount:20,
  shardSize:5,
  reservationIssueNumbers:[11001,11002,11003,11004],
  waveIssueNumber:11005,
  baseCommit:BASE,
  contentManifestBlobSha:CONTENT,
  createdAt:'2026-09-30T06:30:00.000Z',
  route:'remote'
 });
 assert.equal(bootstrap.validate(p),true);
 assert.equal(p.totalUnits,100);
 assert.equal(p.reservations.length,4);
 assert.deepEqual(p.reservations.map(x=>x.allocation.units.length),[25,25,25,25]);
 assert.equal(new Set(p.protectedCodes).size,100);
 assert.equal(p.wave.shards.length,20);
 assert.equal(p.wave.shards[0].codes.length,5);
 assert.equal(p.waveControl.status,'collecting');
});

test('bootstrap write budget makes the Route B cost explicit and keeps lease chatter at zero',()=>{
 const p=bootstrap.plan(projectedSnapshot(),{
  waveId:'BCR-R43-WRITE-BUDGET',
  workerCount:20,
  shardSize:5,
  reservationIssueNumbers:[11101,11102,11103,11104],
  waveIssueNumber:11105,
  baseCommit:BASE,
  contentManifestBlobSha:CONTENT,
  createdAt:'2026-09-30T06:31:00.000Z',
  route:'remote'
 });
 assert.deepEqual(p.writeBudget,{
  bootstrapReservationCreates:4,
  bootstrapReservationPatches:4,
  waveControlCreates:1,
  workerAdmissionCreates:20,
  workerResultPatches:20,
  waveTransitionPatches:2,
  workerHotPathLeaseRenewCheckpointComplete:0
 });
});

test('bootstrap produces exactly the same immutable identities from the same inputs',()=>{
 const args={
  waveId:'BCR-R43-DETERMINISTIC',
  workerCount:20,
  shardSize:5,
  reservationIssueNumbers:[11201,11202,11203,11204],
  waveIssueNumber:11205,
  baseCommit:BASE,
  contentManifestBlobSha:CONTENT,
  createdAt:'2026-09-30T06:32:00.000Z',
  route:'remote'
 };
 const a=bootstrap.plan(projectedSnapshot(),args);
 const b=bootstrap.plan(projectedSnapshot(),args);
 assert.equal(a.snapshotHash,b.snapshotHash);
 assert.equal(a.waveHash,b.waveHash);
 assert.equal(a.waveControl.recordHash,b.waveControl.recordHash);
 assert.deepEqual(a.protectedCodes,b.protectedCodes);
});

test('bootstrap fails closed if issue identities collide',()=>{
 assert.throws(()=>bootstrap.plan(projectedSnapshot(),{
  waveId:'BCR-R43-COLLISION',
  workerCount:20,
  shardSize:5,
  reservationIssueNumbers:[11301,11302,11303,11304],
  waveIssueNumber:11304,
  baseCommit:BASE,
  contentManifestBlobSha:CONTENT,
  createdAt:'2026-09-30T06:33:00.000Z',
  route:'remote'
 }),{code:'R43_BOOTSTRAP_ISSUE_COLLISION'});
});

test('remote bootstrap refuses 100 workers while chatgpt-library route can still model 100x5',()=>{
 const reservationIssueNumbers=Array.from({length:20},(_,i)=>11401+i);
 assert.throws(()=>bootstrap.plan(projectedSnapshot(550),{
  waveId:'BCR-R43-REMOTE-100',
  workerCount:100,
  shardSize:5,
  reservationIssueNumbers,
  waveIssueNumber:11450,
  baseCommit:BASE,
  contentManifestBlobSha:CONTENT,
  createdAt:'2026-09-30T06:34:00.000Z',
  route:'remote'
 }),{code:'R43_WAVE_REMOTE_CAP'});

 const p=bootstrap.plan(projectedSnapshot(550),{
  waveId:'BCR-R43-LOCAL-100',
  workerCount:100,
  shardSize:5,
  reservationIssueNumbers,
  waveIssueNumber:11450,
  baseCommit:BASE,
  contentManifestBlobSha:CONTENT,
  createdAt:'2026-09-30T06:34:00.000Z',
  route:'chatgpt-library'
 });
 assert.equal(p.totalUnits,500);
 assert.equal(p.reservations.length,20);
 assert.equal(p.writeBudget.workerAdmissionCreates,0);
 assert.equal(p.writeBudget.workerResultPatches,0);
});
