'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const dispatcher=require('../MLS R32 EDITORIAL/global dispatcher/core.js');
const verify=require('../scripts/R4-1-revision-stage-certify.cjs');
const root=path.resolve(__dirname,'..');
const record=require('../docs/MLS Global Dispatcher/13 R4.1 Piloto 1861 staged revision v3.json');
const codes=require('../docs/MLS Global Dispatcher/12 R4.1 Piloto 1861 Evidence revision v3.json').correctedEntries.map(r=>r.code);
function ledger(){
 return {kind:'mls_global_dispatch_ledger',version:1,terminal:{
  [record.originalTerminal.workId]:{provider:'r33-farm',status:'certified',assignmentId:record.assignmentId,
  commitSha:record.originalTerminal.commitSha,branch:record.originalTerminal.branch,
  bufferPackageHash:record.originalTerminal.packageHash,completedUnits:codes}
 },recoveries:{},updatedAt:'2026-09-29T05:00:03.396Z'};
}
function issue(){
 return {state:'closed',title:'[MLS Buffered][DONE] '+record.assignmentId,body:[
 '## reservation','<!-- MLS_BUFFERED_RESERVATION',JSON.stringify({issueNumber:1861,
 allocation:{assignmentId:record.assignmentId},stage:{commitSha:record.originalTerminal.commitSha,
 packageHash:record.originalTerminal.packageHash}}), '-->'].join('\n')};
}
function data(l=ledger()){
 return {ledger:l,originalIssue:issue(),mainRef:{object:{sha:record.candidate.baseMain}},
 stageRef:{object:{sha:record.originalTerminal.commitSha}}};
}
function local(){return {ok:true,correctedCodes:codes,workId:record.originalTerminal.workId,
 expectedMainSha:record.candidate.baseMain,claims:30,links:30};}
test('versioned stage validates each corrected and previous Evidence SHA from original commit',async()=>{
 const r=await verify.verifyLocal(root);
 assert.equal(r.ok,true);assert.equal(r.correctedCodes.length,10);assert.equal(r.claims,30);
 assert.equal(r.links,30);assert.equal(r.holdActive,true);
});
test('read-only live reconciliation preserves old certified terminal and release hold',()=>{
 const r=verify.verifyLedger(data(),local(),record);
 assert.equal(r.liveLedgerMatched,true);assert.equal(r.releaseAuthorized,false);
 assert.equal(r.status,'VERSIONED_STAGING_RECONCILED_NOT_PUBLISHED');
});
test('disallows different terminal, recovery, stale main and moved original stage',()=>{
 const other=ledger();other.terminal['r33-farm:overlap']={provider:'r33-farm',completedUnits:[codes[0]]};
 assert.throws(()=>verify.verifyLedger(data(other),local(),record),/R41_TERMINAL_DUPLICATE/);
 const rec=ledger();rec.recoveries.r={workItem:{provider:'r33-farm'},resourceLocks:['entry:'+codes[0]]};
 assert.throws(()=>verify.verifyLedger(data(rec),local(),record),/R41_RECOVERY_COLLISION/);
 const moved=data();moved.mainRef.object.sha='0'.repeat(40);
 assert.throws(()=>verify.verifyLedger(moved,local(),record),/R41_MAIN_MOVED_REBASE_REQUIRED/);
 const oldMoved=data();oldMoved.stageRef.object.sha='1'.repeat(40);
 assert.throws(()=>verify.verifyLedger(oldMoved,local(),record),/R41_OLD_STAGE_REF_CHANGED/);
});
test('historical publication quality hold remains present and active in staging',()=>{
 const holds=JSON.parse(fs.readFileSync(path.join(root,'MLS R32 EDITORIAL/evidence git/quality-holds.json'),'utf8'));
 const h=holds.holds.find(x=>x.workId===record.originalTerminal.workId);
 assert.equal(h.status,'active');
 assert.equal(record.reconciliation.publicationHoldReleaseAuthorized,false);
 assert.equal(record.reconciliation.approvedForMergeIntoMain,false);
 assert.equal(record.reconciliation.reviewedByHuman,false);
});
