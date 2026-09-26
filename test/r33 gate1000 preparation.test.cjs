'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const store=require('../MLS R32 EDITORIAL/evidence git.js');

const GATE='docs/evidence y provenance/23 R33 Gate 1000 Pool.json';
const GATE500='docs/evidence y provenance/20 R33 Gate 500 Pool.json';
const CONTROL='docs/evidence y provenance/21 R33 Active Pool Control.json';

test('Gate 1000 lifecycle is prepared-or-authorized and always GitHub-only',()=>{
  const pool=JSON.parse(fs.readFileSync(GATE,'utf8'));
  assert.equal(pool.poolId,'MLS-R33-GITHUB-NATIVE-GATE-1000');
  assert.ok((pool.status==='prepared'&&pool.active===false&&pool.gate1000Authorized===false)||(pool.status==='authorized'&&pool.active===true&&pool.gate1000Authorized===true));
  assert.equal(pool.dispatcherOnly,true);
  assert.equal(pool.sourceOfTruth,'github');
  assert.equal(pool.editorialArchitecture,'github-native');
  assert.equal(pool.cloudflareEditorialAllowed,false);
  assert.equal(pool.d1EditorialAllowed,false);
  assert.equal(pool.execution.integrationWaveSize,50);
  assert.equal(pool.execution.serializedIndexIntegrationRequired,true);
  assert.equal(pool.execution.parallelIntegrationPreparation,true);
  assert.equal(pool.execution.parallelPreparedPrs,true);
  assert.equal(pool.execution.finalMergeSerialized,true);
  assert.equal(pool.entries.length,1000);
  assert.equal(new Set(pool.entries.map(x=>x.code)).size,1000);
  assert.equal(pool.entries.every(x=>/^[a-f0-9]{40}$/.test(x.contentBlobSha||'')),true);
  const counts={};for(const e of pool.entries)counts[e.language]=(counts[e.language]||0)+1;
  assert.deepEqual(Object.values(counts).sort((a,b)=>a-b),Array(10).fill(100));
});

test('Gate 1000 excludes all 820 codes used in previous R33 pools',()=>{
  const pool=JSON.parse(fs.readFileSync(GATE,'utf8'));
  const prior=[
    '04 Pilot 20 Manifest.json',
    '13 Gate 100 Manifest.json',
    '15 Evidence Farm Correction Repeat Pool.json',
    '17 GitHub Native Benchmark 100 Pool.json',
    '20 R33 Gate 500 Pool.json'
  ];
  const used=new Set();
  for(const name of prior){
    const doc=JSON.parse(fs.readFileSync('docs/evidence y provenance/'+name,'utf8'));
    for(const e of doc.entries||[])used.add(e.code);
  }
  assert.equal(used.size,820);
  assert.equal(pool.entries.some(x=>used.has(x.code)),false);
});

test('Active Pool Control is lifecycle-consistent across Gate 1000 activation',()=>{
  const control=JSON.parse(fs.readFileSync(CONTROL,'utf8'));
  const gate500=JSON.parse(fs.readFileSync(GATE500,'utf8'));
  const gate1000=JSON.parse(fs.readFileSync(GATE,'utf8'));
  assert.equal(gate500.status,'authorized');
  assert.equal(gate500.active,true);
  assert.equal(gate500.gate500Authorized,true);
  assert.equal(control.activationState,'authorized');
  if(gate1000.active){
    assert.equal(gate1000.status,'authorized');
    assert.equal(gate1000.gate1000Authorized,true);
    assert.equal(control.activePoolId,'MLS-R33-GITHUB-NATIVE-GATE-1000');
    assert.equal(control.activePoolPath,GATE);
    assert.equal(control.gate1000Authorized,true);
  }else{
    assert.equal(gate1000.status,'prepared');
    assert.equal(gate1000.gate1000Authorized,false);
    assert.equal(control.activePoolId,'MLS-R33-GITHUB-NATIVE-GATE-500');
    assert.equal(control.activePoolPath,GATE500);
    assert.equal(control.gate500Authorized,true);
  }
});

test('committed Evidence indexes remain exactly derivable during Gate 1000 preparation',()=>{
  const x=store.buildIndexes('.');
  assert.deepEqual(JSON.parse(fs.readFileSync('MLS R32 EDITORIAL/evidence git/indexes/by-code.json','utf8')),x.byCode);
  assert.deepEqual(JSON.parse(fs.readFileSync('MLS R32 EDITORIAL/evidence git/indexes/by-language.json','utf8')),x.byLanguage);
  assert.deepEqual(JSON.parse(fs.readFileSync('MLS R32 EDITORIAL/evidence git/indexes/by-source.json','utf8')),x.bySource);
  assert.deepEqual(JSON.parse(fs.readFileSync('MLS R32 EDITORIAL/evidence git/indexes/verified.json','utf8')),x.verified);
});

test('Gate 1000 preparation work item is preparation-only',()=>{
  const registry=JSON.parse(fs.readFileSync('MLS R32 EDITORIAL/global dispatcher/work registry.json','utf8'));
  const item=registry.items.find(x=>x.workId==='gate1000-preparation-r1');
  assert.ok(item);
  assert.equal(item.status,'ready');
  assert.equal(item.provider,'global');
  assert.equal(item.workType,'code_task');
  assert.equal(item.instructions.includes('PREPARACIÓN SOLAMENTE'),true);
  assert.equal(item.allowedPaths.some(x=>x.includes('evidence git/entries')),false);
  assert.equal(item.allowedPaths.includes(GATE),true);
});

test('Gate 1000 activation work item is authorization-scoped and Evidence-free',()=>{
  const registry=JSON.parse(fs.readFileSync('MLS R32 EDITORIAL/global dispatcher/work registry.json','utf8'));
  const item=registry.items.find(x=>x.workId==='gate1000');
  assert.ok(item);
  assert.equal(item.status,'ready');
  assert.equal(item.workType,'validation');
  assert.equal(item.provider,'global');
  assert.equal(item.authorization?.authorized,true);
  assert.deepEqual(item.allowedPaths.sort(),[CONTROL,GATE].sort());
  assert.equal(item.allowedPaths.some(x=>x.includes('evidence git/')),false);
});
