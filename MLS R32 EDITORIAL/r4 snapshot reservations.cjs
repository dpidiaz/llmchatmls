'use strict';

/**
 * MLS BCR R4.3 wave reservation composer.
 *
 * Reuses the existing durable R4.1 buffered reservation contract so R33 and R4.2
 * already understand the protected codes. No new ownership format is introduced.
 * This module is pure; the serialized dispatcher remains responsible for creating
 * the actual GitHub Issues at wave start.
 */
const buffered=require('./r4 buffered allocation.cjs');
const farm=require('./r4 snapshot farm.cjs');

function fail(code,msg){const e=new Error(msg||code);e.code=code;e.status=409;throw e;}
function assert(ok,code,msg){if(!ok)fail(code,msg);}

const RESERVATION_SCHEMA='MLS-R4.3-SNAPSHOT-RESERVATION-1';
function markSnapshotReservation(res,waveId){
 assert(res?.status==='reserved'&&res.allocation,'R43_RESERVE_RECORD');
 assert(typeof waveId==='string'&&/^[A-Za-z0-9._:-]{3,120}$/.test(waveId),'R43_RESERVE_WAVE_ID');
 const next={...res,snapshotFarm:{
  schema:RESERVATION_SCHEMA,version:1,waveId,
  ownershipOnly:true,r42BlocksAllowed:false,workerHotPath:false
 }};
 return {...next,recordHash:buffered.recordHash(next)};
}
function batchSizes(total){
 assert(Number.isInteger(total)&&total>0&&total<=500,'R43_RESERVE_TOTAL');
 const out=[];let n=total;
 while(n>=25){out.push(25);n-=25;}
 if(n===20){out.push(10,10);n=0;}
 else if(n===10){out.push(10);n=0;}
 assert(n===0,'R43_RESERVE_GRANULARITY',
  'R4.3 wave size must decompose into durable 10/25-entry reservations.');
 return out;
}

function compose(snapshot,{
 reservationIssueNumbers,baseCommit,contentManifestBlobSha,now=Date.now(),
 waveId,workerCount,shardSize=5,createdAt
}){
 const total=workerCount*shardSize,sizes=batchSizes(total);
 assert(Array.isArray(reservationIssueNumbers)&&
  reservationIssueNumbers.length===sizes.length,'R43_RESERVE_ISSUE_COUNT');
 assert(new Set(reservationIssueNumbers).size===reservationIssueNumbers.length,'R43_RESERVE_ISSUE_DUP');
 let projected={...snapshot,reservedCodes:[...(snapshot.reservedCodes||[])]};
 const reservations=[],units=[];
 for(let i=0;i<sizes.length;i++){
  const issueNumber=reservationIssueNumbers[i];
  const allocated=buffered.allocate(projected,{
   size:sizes[i],issueNumber,
   requestId:'r43-wave-'+waveId+'-'+String(i+1).padStart(2,'0'),
   baseCommit,contentManifestBlobSha,now:now+i
  });
  const r=markSnapshotReservation(allocated,waveId);
  reservations.push(r);
  const codes=r.allocation.units.map(x=>x.code);
  units.push(...r.allocation.units);
  projected={...projected,reservedCodes:[...(projected.reservedCodes||[]),...codes]};
 }
 assert(units.length===total,'R43_RESERVE_TOTAL_MISMATCH');
 assert(new Set(units.map(x=>x.code)).size===units.length,'R43_RESERVE_OVERLAP');
 const snap=farm.createSnapshot({
  baseCommit,contentManifestBlobSha,units,createdAt,source:'github'
 });
 const wave=farm.createWave(snap,{waveId,workerCount,shardSize,createdAt});
 return {sizes,reservations,snapshot:snap,wave,protectedCodes:units.map(x=>x.code)};
}

module.exports={RESERVATION_SCHEMA,markSnapshotReservation,batchSizes,compose};
