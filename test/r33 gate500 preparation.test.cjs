'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const core=require('../MLS R32 EDITORIAL/evidence farm core.js');
const store=require('../MLS R32 EDITORIAL/evidence git.js');

const GATE='docs/evidence y provenance/20 R33 Gate 500 Pool.json';
const CONTROL='docs/evidence y provenance/21 R33 Active Pool Control.json';

test('active pool control stays pinned to Benchmark 100 until explicit Gate 500 authorization',()=>{
  const control=JSON.parse(fs.readFileSync(CONTROL,'utf8'));
  assert.equal(core.resolvePoolPath('.'),'docs/evidence y provenance/17 GitHub Native Benchmark 100 Pool.json');
  assert.equal(control.activePoolId,'MLS-R33-GITHUB-NATIVE-BENCHMARK-100');
  assert.equal(control.candidatePoolId,'MLS-R33-GITHUB-NATIVE-GATE-500');
  assert.equal(control.gate500Authorized,false);
});

test('Gate 500 candidate is deterministic, fresh, GitHub-only and not executable yet',()=>{
  const pool=core.loadPool('.',GATE);
  assert.equal(pool.poolId,'MLS-R33-GITHUB-NATIVE-GATE-500');
  assert.equal(pool.status,'prepared');
  assert.equal(pool.active,false);
  assert.equal(pool.gate500Authorized,false);
  assert.equal(pool.dispatcherOnly,true);
  assert.equal(pool.sourceOfTruth,'github');
  assert.equal(pool.cloudflareEditorialAllowed,false);
  assert.equal(pool.d1EditorialAllowed,false);
  assert.equal(pool.entries.length,500);
  assert.equal(new Set(pool.entries.map(x=>x.code)).size,500);
  assert.equal(pool.entries.every(x=>/^[a-f0-9]{40}$/.test(x.contentBlobSha||'')),true);
  const counts={};for(const e of pool.entries)counts[e.language]=(counts[e.language]||0)+1;
  assert.deepEqual(Object.values(counts).sort((a,b)=>a-b),Array(10).fill(50));
  const prior=['04 Pilot 20 Manifest.json','13 Gate 100 Manifest.json','15 Evidence Farm Correction Repeat Pool.json','17 GitHub Native Benchmark 100 Pool.json'];
  const used=new Set();
  for(const name of prior){
    const doc=JSON.parse(fs.readFileSync('docs/evidence y provenance/'+name,'utf8'));
    for(const e of doc.entries||[])used.add(e.code);
  }
  assert.equal(pool.entries.some(x=>used.has(x.code)),false);
  assert.equal(used.size,320);
});

test('committed Evidence indexes are exactly derivable before Gate 500 starts',()=>{
  const x=store.buildIndexes('.');
  assert.deepEqual(JSON.parse(fs.readFileSync('MLS R32 EDITORIAL/evidence git/indexes/by-code.json','utf8')),x.byCode);
  assert.deepEqual(JSON.parse(fs.readFileSync('MLS R32 EDITORIAL/evidence git/indexes/by-language.json','utf8')),x.byLanguage);
  assert.deepEqual(JSON.parse(fs.readFileSync('MLS R32 EDITORIAL/evidence git/indexes/by-source.json','utf8')),x.bySource);
  assert.deepEqual(JSON.parse(fs.readFileSync('MLS R32 EDITORIAL/evidence git/indexes/verified.json','utf8')),x.verified);
});

test('Gate 500 registry item is activation-only and ready after explicit authorization',()=>{
  const registry=JSON.parse(fs.readFileSync('MLS R32 EDITORIAL/global dispatcher/work registry.json','utf8'));
  const gate=registry.items.find(x=>x.workId==='gate500');
  assert.equal(gate.version,2);
  assert.equal(gate.status,'ready');
  assert.equal(gate.authorization?.authorized,true);
  assert.equal(gate.workType,'validation');
  assert.equal(gate.provider,'global');
  assert.ok(gate.allowedPaths.includes(GATE));
  assert.ok(gate.allowedPaths.includes(CONTROL));
});
