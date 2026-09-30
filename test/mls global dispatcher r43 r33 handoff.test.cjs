'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');

const reservations=require('../MLS R32 EDITORIAL/r4 snapshot reservations.cjs');
const integration=require('../MLS R32 EDITORIAL/global dispatcher/providers/integration.js');
const r33=require('../MLS R32 EDITORIAL/global dispatcher/providers/r33.js');

const BASE='a'.repeat(40),CONTENT='b'.repeat(40);
function source(n=30,start=754){
 const entries=Array.from({length:n},(_,i)=>{
  const code='MLS-V10-'+String(start+i).padStart(4,'0');
  return {order:i+1,code,language:'espanol-guatemala',
   contentPath:'content/espanol-guatemala/'+code+'.json'};
 });
 return {
  pool:{poolId:'MLS-R33-FULL-CORPUS-CONTINUATION',manifestVersion:'1.0',
   status:'authorized',active:true,sourceOfTruth:'github',
   cloudflareEditorialAllowed:false,d1EditorialAllowed:false,
   execution:{defaultClaimSize:5,maxClaimSize:10},entries},
  ledger:{poolId:'MLS-R33-FULL-CORPUS-CONTINUATION',
   manifestVersion:'1.0',verified:[],exceptions:[]},
  batches:[],reservedCodes:[]
 };
}
function handoffReservation({waveId='BCR-R43-HANDOFF',issueNumber=5001,waveIssueNumber=6001,start=754}={}){
 const composed=reservations.compose(source(30,start),{
  reservationIssueNumbers:[issueNumber],
  baseCommit:BASE,contentManifestBlobSha:CONTENT,
  now:Date.parse('2026-09-30T10:00:00.000Z'),
  waveId,workerCount:2,shardSize:5,
  createdAt:'2026-09-30T10:00:00.000Z'
 });
 const wave=composed.wave;
 const reservation=reservations.markR33Handoff(composed.reservations[0],{
  waveIssueNumber,waveId,
  waveHash:wave.waveHash,
  reconciliationHash:'c'.repeat(64),
  at:'2026-09-30T10:05:00.000Z'
 });
 return {reservation,wave,codes:reservation.allocation.units.map(x=>x.code)};
}

test('R4.3 reservation handoff preserves R4.2 fence and binds reconciliation identity',()=>{
 const x=handoffReservation();
 assert.equal(x.reservation.snapshotFarm.ownershipOnly,true);
 assert.equal(x.reservation.snapshotFarm.r42BlocksAllowed,false);
 assert.equal(x.reservation.snapshotFarm.r33Handoff.status,'active');
 assert.equal(x.reservation.snapshotFarm.r33Handoff.waveIssueNumber,6001);
 assert.equal(x.reservation.snapshotFarm.r33Handoff.waveHash,x.wave.waveHash);
 assert.equal(x.reservation.snapshotFarm.r33Handoff.reconciliationHash,'c'.repeat(64));
 assert.equal(x.reservation.recordHash.length,64);
});

test('projected R33 snapshot removes active handoff codes from reserved set and exposes them exactly',()=>{
 const src=source();
 const x=handoffReservation();
 const projected=integration.projectR33Snapshot({...src,bufferedReservations:[x.reservation]},{});
 assert.deepEqual(projected.handoffCodes,x.codes);
 assert.deepEqual(projected.reservedCodes,[]);
 assert.equal(projected.r43Handoff.waveIssueNumber,6001);
 assert.equal(projected.r43Handoff.pendingCodes.length,10);
});

test('R33 provider selects only active R4.3 handoff codes before unrelated backlog',()=>{
 const src=source();
 const x=handoffReservation();
 const projected=integration.projectR33Snapshot({...src,bufferedReservations:[x.reservation]},{});
 const candidate=r33.materializeCandidate(projected,{
  requested:5,now:Date.parse('2026-09-30T10:06:00.000Z')
 });
 assert.equal(candidate.eligible,true);
 assert.equal(candidate.reason,'R43_R33_HANDOFF_READY');
 assert.deepEqual(candidate.units.map(x=>x.code),x.codes.slice(0,5));
 assert.equal(candidate.ownership.r43Handoff.waveIssueNumber,6001);
});

test('active handoff never falls through to unrelated backlog when all handoff codes are leased',()=>{
 const src=source();
 const x=handoffReservation();
 const projected=integration.projectR33Snapshot({...src,bufferedReservations:[x.reservation]},{});
 const busy={...projected,batches:[{
  poolId:src.pool.poolId,batchId:'HANDOFF-BUSY',status:'leased',
  acknowledgedAt:'2026-09-30T10:05:00.000Z',
  ackDeadlineAt:'2026-09-30T10:20:00.000Z',
  expiresAt:'2026-09-30T10:20:00.000Z',
  entries:x.codes.map(code=>({code}))
 }]};
 const candidate=r33.materializeCandidate(busy,{
  requested:5,now:Date.parse('2026-09-30T10:06:00.000Z')
 });
 assert.equal(candidate.eligible,false);
 assert.equal(candidate.reason,'R43_R33_HANDOFF_WAITING_OR_COMPLETE');
 assert.deepEqual(candidate.units,[]);
});

test('multiple R4.3 handoff identities fail closed',()=>{
 const a=handoffReservation({waveId:'BCR-R43-HANDOFF-A',issueNumber:5001,waveIssueNumber:6001,start:754});
 const b=handoffReservation({waveId:'BCR-R43-HANDOFF-B',issueNumber:5002,waveIssueNumber:6002,start:800});
 const src=source(100,754);
 assert.throws(()=>integration.projectR33Snapshot({...src,bufferedReservations:[a.reservation,b.reservation]},{}),{
  code:'R43_R33_HANDOFF_CARDINALITY'
 });
});
