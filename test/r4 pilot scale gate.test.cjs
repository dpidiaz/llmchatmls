'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const s=require('../MLS R32 EDITORIAL/r4 staging supersession.cjs');
const root=path.resolve(__dirname,'..'),current=s.load(root);
const workId='r33-buffer:MLS-BUFFER-001861';
function signed(){
 const [id,pair]=[...current.entries][0];const data=structuredClone(pair),r=data.record;
 data.hold.status='resolved';
 data.hold.replacementApproval={protocol:s.AI_PROTOCOL,revisionId:r.revisionId,
  commitSha:r.replacement.commitSha,stageBranch:r.replacement.branch,
  generatedWithAI:true,humanReviewed:false,reviewerType:'ai',
  sourceReviewMode:'primary_source_text_and_exact_sections',entriesChecked:10,
  claimsChecked:30,sourceLinksChecked:30,reportPath:r.academicSecondPass.reportPath,
  validationRunId:r.replacement.ciRunId,
  pdfVisualStatus:'not_verified_text_passages_checked',verifiedAt:'2026-09-29T12:00:00Z',
  limitsAcknowledged:true};
 return {entries:new Map([[id,data]]),activeHeldCodes:new Set()};
}
test('AI-only: ten-entry opt-in unchanged, current historic hold blocks 25',()=>{
 assert.deepEqual(s.assertScaledPilotReady(10,current),[]);
 assert.throws(()=>s.assertScaledPilotReady(25,current),/R41_ACADEMIC_HOLD_ACTIVE/);
});
test('verified AI record explicitly has humanReviewed false and passes Gate 25 structure',()=>{
 const approved=signed();
 const x=s.assertScaledPilotReady(25,approved);
 assert.equal(x.length,1);assert.equal(x[0].protocol,s.AI_PROTOCOL);
 assert.equal(approved.entries.get(workId).hold.replacementApproval.humanReviewed,false);
 assert.equal(s.assertAiApproval(approved.entries.get(workId).record,
  approved.entries.get(workId).hold.replacementApproval).claimLinksChecked,undefined);
});
test('missing SHA/run, primary source coverage, altered scope or false human label fail closed',()=>{
 for(const field of ['commitSha','validationRunId','claimsChecked','sourceLinksChecked','reportPath',
  'generatedWithAI','pdfVisualStatus','sourceReviewMode','limitsAcknowledged']){
  const a=signed();delete a.entries.get(workId).hold.replacementApproval[field];
  assert.throws(()=>s.assertScaledPilotReady(25,a),/R41_AI_EVIDENCE_APPROVAL_INVALID/,field);
 }
 const bad=signed();bad.entries.get(workId).hold.replacementApproval.humanReviewed=true;
 assert.throws(()=>s.assertScaledPilotReady(25,bad),/R41_AI_EVIDENCE_APPROVAL_INVALID/);
 const drift=signed();drift.entries.get(workId).hold.replacementApproval.commitSha='1'.repeat(40);
 assert.throws(()=>s.assertScaledPilotReady(25,drift),/R41_AI_EVIDENCE_APPROVAL_INVALID/);
});
test('Gate 50/100 still disabled after pilot 10, even with AI verification',()=>{
 assert.throws(()=>s.assertScaledPilotReady(50,signed()),/R41_SCALE_GATE_NOT_CERTIFIED/);
 assert.throws(()=>s.assertScaledPilotReady(100,signed()),/R41_SCALE_GATE_NOT_CERTIFIED/);
});
test('serial Scheduler validates exact existing stage SHA and GitHub Action success, not a human comment',()=>{
 const txt=fs.readFileSync(path.join(root,'scripts/MLS global dispatcher scheduler.cjs'),'utf8');
 assert.match(txt,/verifyPilot25AiEvidence\(approvals\)/);
 assert.match(txt,/actions\/runs\//);
 assert.match(txt,/R41_CANONICAL_CI_UNVERIFIED/);
 assert.ok(txt.indexOf('verifyPilot25AiEvidence(approvals)')<txt.indexOf('const reservation=buffered.allocate('));
 assert.doesNotMatch(txt,/verifyPilot25ReviewerEvidence/);
});
