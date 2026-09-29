'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const selector=require('../MLS R32 EDITORIAL/r4 staging supersession.cjs');
const root=path.resolve(__dirname,'..'),current=selector.load(root);
const workId='r33-buffer:MLS-BUFFER-001861';
function approved(){
 const pair=structuredClone([...current.entries][0][1]);
 pair.hold.status='resolved';
 pair.hold.replacementApproval={
   revisionId:pair.record.revisionId,commitSha:pair.record.replacement.commitSha,
   reviewer:'Independent academic editor',reviewerGithub:'editor-real',
   reviewIssueNumber:1868,reviewCommentId:123456789,reviewedAt:'2026-09-29T18:00:00Z',
   independentAcademicReview:true};
 return {entries:new Map([[workId,pair]]),activeHeldCodes:new Set()};
}
test('ordinary pilot 10 remains allowed, even while quality hold applies to prior pilot',()=>{
 assert.deepEqual(selector.assertScaledPilotReady(10,current),[]);
});
test('pilot 25 rejects current real active #1861 hold',()=>{
 assert.throws(()=>selector.assertScaledPilotReady(25,current),/R41_ACADEMIC_HOLD_ACTIVE/);
});
test('pilot 50 and 100 are not enabled by the first pilot release',()=>{
 assert.throws(()=>selector.assertScaledPilotReady(50,approved()),/R41_SCALE_GATE_NOT_CERTIFIED/);
 assert.throws(()=>selector.assertScaledPilotReady(100,approved()),/R41_SCALE_GATE_NOT_CERTIFIED/);
});
test('pilot 25 requires exact SHA-bound, traceable approval plus review issue and comment',()=>{
 const state=approved();
 const good=selector.assertScaledPilotReady(25,state);
 assert.equal(good.length,1);
 assert.equal(good[0].commitSha,'8df7762dd540a31da2fe7bfe68075f7a1217cc1a');
 for(const field of ['reviewIssueNumber','reviewCommentId','reviewerGithub','independentAcademicReview']){
  const altered=approved();
  delete altered.entries.get(workId).hold.replacementApproval[field];
  assert.throws(()=>selector.assertScaledPilotReady(25,altered),/R41_HUMAN_ATTESTATION_MISSING/,field);
 }
 const wrong=approved();wrong.entries.get(workId).hold.replacementApproval.commitSha='1'.repeat(40);
 assert.throws(()=>selector.assertScaledPilotReady(25,wrong),/R41_HUMAN_ATTESTATION_MISSING/);
});
test('serialized scheduler validates live reviewer identity and comment before reserving',()=>{
 const scheduler=fs.readFileSync(path.join(root,'scripts/MLS global dispatcher scheduler.cjs'),'utf8');
 assert.match(scheduler,/verifyPilot25ReviewerEvidence\(approvals\)/);
 assert.match(scheduler,/issues\/comments\//);
 assert.match(scheduler,/R41_APPROVED_STAGE_MOVED/);
 assert.ok(scheduler.indexOf('verifyPilot25ReviewerEvidence(approvals)')<
  scheduler.indexOf('const reservation=buffered.allocate('));
});
