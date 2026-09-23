'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {patchEvidenceReader,MARKER}=require('../scripts/habilitar evidence lector.js');

test('reader materialization attaches GitHub-derived deployment Evidence without D1',()=>{
  const patched=patchEvidenceReader(fs.readFileSync('MLS R32 OVERLAY/index.js','utf8'));
  assert.ok(patched.includes(MARKER));
  assert.match(patched,/env\.ASSETS\.fetch/);
  assert.match(patched,/\/data\/evidence\/by-code\//);
  assert.match(patched,/sourceOfTruth === "github"/);
  assert.doesNotMatch(patched,/wiki_evidence_entry_state|MLS_EVIDENCE_CONSUMER\.contextForEntry|MLS_EVIDENCE_API\.entrySources/);
});

test('public Evidence route resolves static assets before any wiki D1 initialization',()=>{
  const patched=patchEvidenceReader(fs.readFileSync('MLS R32 OVERLAY/index.js','utf8'));
  const route=patched.indexOf('const publicEvidenceMatch');
  const db=patched.indexOf('await ensureWikiDb(env);',route);
  assert.ok(route>=0&&db>route);
  assert.match(patched,/mlsPublicEvidenceForCode\(request, env, publicEvidenceMatch\[1\]\.toUpperCase\(\)\)/);
});

test('reader status is visible but remains outside canonical article HTML',()=>{
  const patched=patchEvidenceReader(fs.readFileSync('MLS R32 OVERLAY/index.js','utf8'));
  assert.match(patched,/function ensureEvidenceStatus\(article, code, target\)/);
  assert.match(patched,/panel\.id = "mls-evidence-status"/);
  assert.match(patched,/label\.textContent = String\(evidence\.label/);
  assert.match(patched,/target\.innerHTML = html;[\s\S]*ensureEvidenceStatus\(article, code, target\);[\s\S]*articleCache\.set/);
});

test('reader hides Evidence panel when no GitHub-native artifact exists',()=>{
  const patched=patchEvidenceReader(fs.readFileSync('MLS R32 OVERLAY/index.js','utf8'));
  assert.match(patched,/if \(!response\.ok\) return null;/);
  assert.match(patched,/if \(!evidence\) \{[\s\S]*panel\?\.remove\(\);[\s\S]*return;/);
});

test('reader public article endpoint attaches GitHub-derived Evidence',()=>{
  const patched=patchEvidenceReader(fs.readFileSync('MLS R32 OVERLAY/index.js','utf8'));
  assert.match(patched,/article: await mlsAttachPublicEvidence\(request, env, article\)/);
});

test('Evidence reader patch is idempotent',()=>{
  const source=fs.readFileSync('MLS R32 OVERLAY/index.js','utf8');
  const once=patchEvidenceReader(source);
  assert.equal(patchEvidenceReader(once),once);
});

test('reader exposes APA 7 references from the static deployment artifact',()=>{
  const patched=patchEvidenceReader(fs.readFileSync('MLS R32 OVERLAY/index.js','utf8'));
  assert.match(patched,/function ensureEvidenceReferences\(article, code, target\)/);
  assert.match(patched,/section\.id = "mls-evidence-references"/);
  assert.match(patched,/title\.textContent = "Referencias"/);
  assert.match(patched,/note\.textContent = "Formato APA 7"/);
  assert.match(patched,/link\.textContent = "Abrir fuente"/);
});

test('public Evidence-only compatibility endpoint is static-source backed',()=>{
  const patched=patchEvidenceReader(fs.readFileSync('MLS R32 OVERLAY/index.js','utf8'));
  assert.ok(patched.includes('evidence-public'));
  assert.ok(patched.includes('/data/evidence/by-code/'));
  assert.doesNotMatch(patched,/SELECT 1 AS ok FROM wiki_evidence_entry_state/);
});
