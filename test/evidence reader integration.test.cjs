'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {patchEvidenceReader,MARKER}=require('../scripts/habilitar evidence lector.js');

test('reader materialization attaches only the public Evidence consumer summary',()=>{
  const source=fs.readFileSync('MLS R32 OVERLAY/index.js','utf8');
  const patched=patchEvidenceReader(source);
  assert.ok(patched.includes(MARKER));
  assert.match(patched,/MLS_EVIDENCE_CONSUMER\.contextForEntry\(env, code\)/);
  assert.match(patched,/MLS_EVIDENCE_CONSUMER\.publicSummary\(context\)/);
  assert.match(patched,/SELECT 1 AS ok FROM wiki_evidence_entry_state WHERE code=\?/);
  assert.doesNotMatch(patched,/article\.evidenceSnapshotHash/);
  assert.doesNotMatch(patched,/article\.sourceId/);
});

test('reader status is visible but remains outside canonical article HTML',()=>{
  const patched=patchEvidenceReader(fs.readFileSync('MLS R32 OVERLAY/index.js','utf8'));
  assert.match(patched,/function ensureEvidenceStatus\(article, code, target\)/);
  assert.match(patched,/panel\.id = "mls-evidence-status"/);
  assert.match(patched,/panel\.setAttribute\("role", "status"\)/);
  assert.match(patched,/label\.textContent = String\(evidence\.label/);
  assert.match(patched,/review\.textContent = "Revisión pendiente"/);
  assert.match(patched,/target\.insertAdjacentElement\("beforebegin", panel\)/);
  assert.match(patched,/target\.innerHTML = html;[\s\S]*ensureEvidenceStatus\(article, code, target\);[\s\S]*articleCache\.set/);
});

test('reader hides Evidence panel when no R33 state exists',()=>{
  const patched=patchEvidenceReader(fs.readFileSync('MLS R32 OVERLAY/index.js','utf8'));
  assert.match(patched,/if \(!evidence\) \{[\s\S]*panel\?\.remove\(\);[\s\S]*return;/);
  assert.match(patched,/if \(!exists\) return \{ \.\.\.article, evidence: null \};/);
});

test('reader public article endpoint does not cache per-entry Evidence state',()=>{
  const patched=patchEvidenceReader(fs.readFileSync('MLS R32 OVERLAY/index.js','utf8'));
  assert.match(patched,/article: await mlsAttachPublicEvidence\(env, article\)/);
  assert.match(patched,/"cache-control": "private, no-store"/);
});

test('Evidence reader patch is idempotent',()=>{
  const source=fs.readFileSync('MLS R32 OVERLAY/index.js','utf8');
  const once=patchEvidenceReader(source);
  assert.equal(patchEvidenceReader(once),once);
});


test('reader exposes APA 7 references for Evidence-backed entries',()=>{
  const patched=patchEvidenceReader(fs.readFileSync('MLS R32 OVERLAY/index.js','utf8'));
  assert.match(patched,/MLS_EVIDENCE_API\.entrySources\(env, code\)/);
  assert.match(patched,/references = \(rows \|\| \[\]\)/);
  assert.match(patched,/function ensureEvidenceReferences\(article, code, target\)/);
  assert.match(patched,/section\.id = "mls-evidence-references"/);
  assert.match(patched,/title\.textContent = "Referencias"/);
  assert.match(patched,/note\.textContent = "Formato APA 7"/);
  assert.match(patched,/citation\.textContent = String\(reference\.text \|\| ""\)/);
  assert.match(patched,/link\.textContent = "Abrir fuente"/);
  assert.match(patched,/ensureEvidenceReferences\(article, code, target\)/);
});

test('reader removes references section when current entry has no visible references',()=>{
  const patched=patchEvidenceReader(fs.readFileSync('MLS R32 OVERLAY/index.js','utf8'));
  assert.match(patched,/if \(!references\.length\) \{[\s\S]*section\?\.remove\(\);[\s\S]*return;/);
});
