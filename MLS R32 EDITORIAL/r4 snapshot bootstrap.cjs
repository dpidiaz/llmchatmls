'use strict';

/**
 * MLS BCR R4.3 deterministic pilot bootstrap planner.
 *
 * Pure module. It performs no network writes.
 */
const reservations=require('./r4 snapshot reservations.cjs');
const waveIssue=require('./r4 snapshot wave issue.cjs');
const farm=require('./r4 snapshot farm.cjs');

const SCHEMA='MLS-BCR-R43-BOOTSTRAP-PLAN-1';

function fail(code,msg){const e=new Error(msg||code);e.code=code;e.status=409;throw e;}
function assert(ok,code,msg){if(!ok)fail(code,msg);}
function iso(x){return typeof x==='string'&&!Number.isNaN(Date.parse(x));}
function sha(x){return typeof x==='string'&&/^[0-9a-f]{40}$/i.test(x);}
function blobSha(x){return typeof x==='string'&&/^[0-9a-f]{40}$/i.test(x);}

function plan(projectedR33Snapshot,{
  waveId,
  workerCount=20,
  shardSize=5,
  reservationIssueNumbers,
  waveIssueNumber,
  baseCommit,
  contentManifestBlobSha,
  createdAt,
  route='remote'
}={}){
 assert(projectedR33Snapshot&&typeof projectedR33Snapshot==='object','R43_BOOTSTRAP_SNAPSHOT');
 assert(typeof waveId==='string'&&/^[A-Za-z0-9._:-]{3,120}$/.test(waveId),'R43_BOOTSTRAP_WAVE_ID');
 assert(Number.isInteger(workerCount)&&workerCount>0&&workerCount<=100,'R43_BOOTSTRAP_WORKERS');
 assert(Number.isInteger(shardSize)&&shardSize>0&&shardSize<=25,'R43_BOOTSTRAP_SHARD');
 assert(Array.isArray(reservationIssueNumbers)&&reservationIssueNumbers.every(x=>Number.isSafeInteger(x)&&x>0),'R43_BOOTSTRAP_RESERVATIONS');
 assert(Number.isSafeInteger(waveIssueNumber)&&waveIssueNumber>0,'R43_BOOTSTRAP_WAVE_ISSUE');
 assert(!reservationIssueNumbers.includes(waveIssueNumber),'R43_BOOTSTRAP_ISSUE_COLLISION');
 assert(new Set(reservationIssueNumbers).size===reservationIssueNumbers.length,'R43_BOOTSTRAP_RESERVATION_DUP');
 assert(sha(baseCommit),'R43_BOOTSTRAP_BASE');
 assert(blobSha(contentManifestBlobSha),'R43_BOOTSTRAP_MANIFEST');
 assert(iso(createdAt),'R43_BOOTSTRAP_CREATED_AT');
 assert(['remote','chatgpt-library'].includes(route),'R43_BOOTSTRAP_ROUTE');

 const composed=reservations.compose(projectedR33Snapshot,{
  reservationIssueNumbers,
  baseCommit,
  contentManifestBlobSha,
  now:Date.parse(createdAt),
  waveId,
  workerCount,
  shardSize,
  createdAt
 });
 const control=waveIssue.create({
  waveIssueNumber,
  reservationIssueNumbers,
  snapshot:composed.snapshot,
  wave:composed.wave,
  createdAt,
  route
 });
 farm.validateWave(composed.snapshot,composed.wave);
 waveIssue.validate(control,composed.snapshot,composed.wave);

 const total=composed.wave.totalUnits;
 const expectedReservationCount=reservations.batchSizes(total).length;
 assert(composed.reservations.length===expectedReservationCount,'R43_BOOTSTRAP_RESERVATION_COUNT');
 assert(new Set(composed.protectedCodes).size===total,'R43_BOOTSTRAP_PROTECTED_UNIQUENESS');

 return {
  schema:SCHEMA,
  waveId,
  workerCount,
  shardSize,
  totalUnits:total,
  route,
  reservationIssueNumbers:[...reservationIssueNumbers],
  waveIssueNumber,
  baseCommit,
  contentManifestBlobSha,
  snapshotHash:composed.snapshot.snapshotHash,
  waveHash:composed.wave.waveHash,
  protectedCodes:[...composed.protectedCodes],
  reservations:composed.reservations,
  snapshot:composed.snapshot,
  wave:composed.wave,
  waveControl:control,
  writeBudget:{
   bootstrapReservationCreates:expectedReservationCount,
   bootstrapReservationPatches:expectedReservationCount,
   waveControlCreates:1,
   workerAdmissionCreates:route==='remote'?workerCount:0,
   workerResultPatches:route==='remote'?workerCount:0,
   waveTransitionPatches:route==='remote'?2:0,
   workerHotPathLeaseRenewCheckpointComplete:0
  }
 };
}

function validate(planValue){
 assert(planValue?.schema===SCHEMA,'R43_BOOTSTRAP_SCHEMA');
 assert(Array.isArray(planValue.reservations),'R43_BOOTSTRAP_RESERVATIONS');
 assert(planValue.snapshot&&planValue.wave&&planValue.waveControl,'R43_BOOTSTRAP_COMPONENTS');
 farm.validateWave(planValue.snapshot,planValue.wave);
 waveIssue.validate(planValue.waveControl,planValue.snapshot,planValue.wave);
 assert(planValue.snapshotHash===planValue.snapshot.snapshotHash,'R43_BOOTSTRAP_SNAPSHOT_HASH');
 assert(planValue.waveHash===planValue.wave.waveHash,'R43_BOOTSTRAP_WAVE_HASH');
 assert(planValue.totalUnits===planValue.wave.totalUnits,'R43_BOOTSTRAP_TOTAL');
 assert(new Set(planValue.protectedCodes||[]).size===planValue.totalUnits,'R43_BOOTSTRAP_CODES');
 assert(planValue.writeBudget?.workerHotPathLeaseRenewCheckpointComplete===0,'R43_BOOTSTRAP_HOT_PATH');
 return true;
}

module.exports={SCHEMA,plan,validate};
