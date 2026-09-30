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
const R33_HANDOFF_SCHEMA='MLS-R4.3-R33-HANDOFF-1';
function markSnapshotReservation(res,waveId){
 assert(res?.status==='reserved'&&res.allocation,'R43_RESERVE_RECORD');
 assert(typeof waveId==='string'&&/^[A-Za-z0-9._:-]{3,120}$/.test(waveId),'R43_RESERVE_WAVE_ID');
 const next={...res,snapshotFarm:{
  schema:RESERVATION_SCHEMA,version:1,waveId,
  ownershipOnly:true,r42BlocksAllowed:false,workerHotPath:false
 }};
 return {...next,recordHash:buffered.recordHash(next)};
}

function markR33Handoff(res,{
 waveIssueNumber,waveId,waveHash,reconciliationHash,at
}={}){
 assert(res?.status==='reserved'&&res.allocation,'R43_R33_HANDOFF_RECORD');
 assert(res.snapshotFarm?.schema===RESERVATION_SCHEMA&&
  res.snapshotFarm?.ownershipOnly===true&&res.snapshotFarm?.r42BlocksAllowed===false,
  'R43_R33_HANDOFF_NOT_SNAPSHOT_RESERVATION');
 assert(Number.isSafeInteger(Number(waveIssueNumber))&&Number(waveIssueNumber)>0,
  'R43_R33_HANDOFF_WAVE_ISSUE');
 assert(String(waveId||'')===String(res.snapshotFarm.waveId||''),
  'R43_R33_HANDOFF_WAVE_ID');
 assert(/^[a-f0-9]{64}$/i.test(String(waveHash||'')),'R43_R33_HANDOFF_WAVE_HASH');
 assert(/^[a-f0-9]{64}$/i.test(String(reconciliationHash||'')),
  'R43_R33_HANDOFF_RECONCILIATION_HASH');
 assert(!Number.isNaN(Date.parse(String(at||''))),'R43_R33_HANDOFF_AT');
 const handoff={
  schema:R33_HANDOFF_SCHEMA,version:1,status:'active',
  waveIssueNumber:Number(waveIssueNumber),waveId:String(waveId),
  waveHash:String(waveHash).toLowerCase(),
  reconciliationHash:String(reconciliationHash).toLowerCase(),
  activatedAt:String(at)
 };
 const prior=res.snapshotFarm.r33Handoff||null;
 if(prior){
  const same=prior.schema===R33_HANDOFF_SCHEMA&&prior.version===1&&prior.status==='active'&&
   Number(prior.waveIssueNumber)===handoff.waveIssueNumber&&prior.waveId===handoff.waveId&&
   String(prior.waveHash).toLowerCase()===handoff.waveHash&&
   String(prior.reconciliationHash).toLowerCase()===handoff.reconciliationHash;
  assert(same,'R43_R33_HANDOFF_CONFLICT');
  return res;
 }
 const next={...res,snapshotFarm:{...res.snapshotFarm,r33Handoff:handoff}};
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

module.exports={RESERVATION_SCHEMA,R33_HANDOFF_SCHEMA,markSnapshotReservation,markR33Handoff,batchSizes,compose};
