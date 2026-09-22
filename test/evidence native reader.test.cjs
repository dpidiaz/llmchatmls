'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const reader=fs.readFileSync('MLS R32 OVERLAY/reader.js','utf8');

test('native reader requests public Evidence for the active canonical code',()=>{
  assert.ok(reader.includes('async function publicEvidence(code)'));
  assert.ok(reader.includes("/api/wiki/evidence-public/"));
  assert.ok(reader.includes("cache:'no-store'"));
  assert.ok(reader.includes('return payload?.evidence||null'));
  assert.ok(!reader.includes('/api/wiki/article/'));
  assert.ok(!reader.includes('/api/wiki/materialize/'));
});

test('native reader renders Evidence state and APA references in main article flow',()=>{
  assert.ok(reader.includes('const evidence=await publicEvidence(normalized)'));
  assert.ok(reader.includes('const evidenceReferences=Array.isArray(evidence?.references)'));
  assert.ok(reader.includes('Referencias'));
  assert.ok(reader.includes('Formato APA 7'));
  assert.ok(reader.includes('Abrir fuente'));
  assert.ok(reader.includes('${evidenceHTML}'));
});

test('native reader degrades safely when Evidence is unavailable',()=>{
  assert.ok(reader.includes('if(!response.ok)return null'));
  assert.ok(reader.includes("console.warn('MLS Evidence public summary unavailable'"));
  assert.ok(reader.includes("const evidenceHTML=evidence"));
});
