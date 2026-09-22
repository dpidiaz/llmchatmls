'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {patchProfessorEvidenceConsumer}=require('../scripts/habilitar evidence consumers.js');
const {patchWorker,BACKEND_BLOCK}=require('../scripts/habilitar virtuoso.js');

test('Profesor IA consumes deterministic Evidence guidance for the current entry',()=>{
  const source=fs.readFileSync('MLS R32 OVERLAY/index.js','utf8');
  const patched=patchProfessorEvidenceConsumer(source);
  assert.match(patched,/MLS R33 EVIDENCE CONSUMERS 1\.0/);
  assert.match(patched,/MLS_EVIDENCE_CONSUMER\.contextForEntry\(env, body\.entry\.code\)/);
  assert.match(patched,/MLS_EVIDENCE_CONSUMER\.systemGuidance\(evidenceConsumerContext, "Profesor IA"\)/);
  assert.match(patched,/role: "system",[\s\S]*content: evidenceGuidance/);
  assert.equal(patchProfessorEvidenceConsumer(patched),patched);
});

test('Profesor IA Evidence failure degrades without blocking the encyclopedia chat',()=>{
  const patched=patchProfessorEvidenceConsumer(fs.readFileSync('MLS R32 OVERLAY/index.js','utf8'));
  assert.match(patched,/catch \(error\) \{[\s\S]*Profesor IA Evidence context unavailable/);
  assert.match(patched,/const evidenceGuidance = evidenceConsumerContext[\s\S]*: null/);
});

test('Virtuoso annotates final recommendations after relevance selection, not before ranking',()=>{
  assert.match(BACKEND_BLOCK,/async function virtuosoAttachEvidence/);
  assert.match(BACKEND_BLOCK,/MLS_EVIDENCE_CONSUMER\.contextForEntry\(env, recommendation\.code\)/);
  assert.match(BACKEND_BLOCK,/const responsePayload = \{/);
  assert.match(BACKEND_BLOCK,/await virtuosoAttachEvidence\(env, responsePayload\)/);
  const select=BACKEND_BLOCK.indexOf('const recommendations = []');
  const attach=BACKEND_BLOCK.indexOf('await virtuosoAttachEvidence(env, responsePayload)');
  assert.ok(select>=0&&attach>select,'Evidence debe anotarse después del reranking');
});

test('Virtuoso never lets the model infer VERIFIED or REVIEWED',()=>{
  assert.match(BACKEND_BLOCK,/No infieras ni anuncies que una entrada está verificada o revisada/);
});

test('Virtuoso fallback also receives deterministic Evidence annotations',()=>{
  assert.match(BACKEND_BLOCK,/await virtuosoAttachEvidence\(env, virtuosoFallback\(query, validated/);
});
