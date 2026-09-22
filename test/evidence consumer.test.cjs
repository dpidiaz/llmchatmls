'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const consumer=require('../MLS R32 EDITORIAL/evidence consumer.js');

test('consumer contract: UNSOURCED forbids verified language',()=>{
  const c=consumer.contractForEvidence({status:'UNSOURCED'});
  assert.equal(c.maySayVerified,false);
  assert.equal(c.maySayReviewed,false);
  assert.match(c.instruction,/No digas que esta entrada está comprobada/);
});

test('consumer contract: SOURCED never equates source presence with verification',()=>{
  const c=consumer.contractForEvidence({status:'SOURCED'});
  assert.equal(c.maySayVerified,false);
  assert.equal(c.mayTreatSourcePresenceAsProof,false);
  assert.match(c.disclosure,/fuentes identificadas/);
});

test('consumer contract: VERIFIED allows bounded verified wording only',()=>{
  const c=consumer.contractForEvidence({status:'VERIFIED'});
  assert.equal(c.maySayVerified,true);
  assert.equal(c.maySayReviewed,false);
  assert.match(c.instruction,/snapshot vigente/);
  assert.match(c.instruction,/No presentes esa verificación como verdad absoluta/);
});

test('consumer contract: REVIEWED requires the explicit reviewed state',()=>{
  const c=consumer.contractForEvidence({status:'REVIEWED'});
  assert.equal(c.maySayVerified,true);
  assert.equal(c.maySayReviewed,true);
  assert.match(c.disclosure,/revisión editorial posterior/);
});

test('consumer contract: needsReview and proposed revision are never hidden',()=>{
  const c=consumer.contractForEvidence({status:'SOURCED',needsReview:true,proposedRevisionCount:2});
  assert.equal(c.needsReview,true);
  assert.equal(c.hasProposedRevision,true);
  assert.equal(c.mayTreatProposedAsCanonical,false);
  assert.match(c.instruction,/needsReview/);
  assert.match(c.instruction,/NO es canónica/);
});

test('consumer contract: unknown status fails safe as UNSOURCED',()=>{
  const c=consumer.contractForEvidence({status:'MAGIC'});
  assert.equal(c.status,'UNSOURCED');
  assert.equal(c.maySayVerified,false);
});

test('consumer contract: public summary does not expose Sources as proof',()=>{
  const context={status:'VERIFIED',needsReview:false,proposedRevisionCount:0,verifiedAt:'2026-09-22T00:00:00Z',reviewedAt:null,contract:consumer.contractForEvidence({status:'VERIFIED'})};
  const s=consumer.publicSummary(context);
  assert.equal(s.status,'VERIFIED');
  assert.equal(Object.hasOwn(s,'sources'),false);
  assert.equal(Object.hasOwn(s,'claimsVerified'),false);
});
