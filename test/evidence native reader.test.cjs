'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const reader=fs.readFileSync('MLS R32 OVERLAY/reader.js','utf8');

test('native reader requests public Evidence for the active canonical code',()=>{
  assert.match(reader,/async function publicEvidence\(code\)/);
  assert.match(reader,/fetch\('\\/api\\/wiki\\/evidence-public\\/'\+encodeURIComponent\(normalized\)/);
  assert.match(reader,/cache:'no-store'/);
  assert.doesNotMatch(reader,/\/api\/wiki\/article\//);
  assert.match(reader,/return payload\?\.evidence\|\|null/);
});

test('native reader renders Evidence state and APA references in main article flow',()=>{
  assert.match(reader,/const evidence=await publicEvidence\(normalized\)/);
  assert.match(reader,/const evidenceReferences=Array\.isArray\(evidence\?\.references\)/);
  assert.match(reader,/Referencias/);
  assert.match(reader,/Formato APA 7/);
  assert.match(reader,/Abrir fuente/);
  assert.match(reader,/\$\{evidenceHTML\}[\s\S]*easy-entry-nav/);
});

test('native reader degrades safely when Evidence is unavailable',()=>{
  assert.match(reader,/if\(!response\.ok\)return null/);
  assert.match(reader,/catch\(error\)\{[\s\S]*return null;/);
  assert.match(reader,/const evidenceHTML=evidence[\s\S]*:'';/);
});
