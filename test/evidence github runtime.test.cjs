'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {buildEvidenceRuntime}=require('../scripts/generar evidence runtime github.js');

test('deployment Evidence is generated only from the GitHub-native store',async()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'mls-evidence-runtime-'));
  try{
    const report=await buildEvidenceRuntime({root:'.',outputRoot:temp});
    assert.equal(report.ok,true);
    assert.equal(report.sourceOfTruth,'github');
    assert.ok(report.totalEntries>=100);
    assert.equal(report.verified,report.totalEntries);
    assert.equal(report.cloudflareEditorialInteractions,0);
    assert.equal(report.d1Reads,0);
    assert.equal(report.d1Writes,0);
    const manifest=JSON.parse(fs.readFileSync(path.join(temp,'manifest.json'),'utf8'));
    assert.equal(manifest.sourceOfTruth,'github');
    assert.equal(manifest.cloudflareRole,'deployment-serving-only');
    assert.equal(Object.keys(manifest.entries).length,report.totalEntries);
    const evidence=JSON.parse(fs.readFileSync(path.join(temp,'by-code','MLS-V10-0093.json'),'utf8'));
    assert.equal(evidence.status,'VERIFIED');
    assert.equal(evidence.sourceOfTruth,'github');
    assert.ok(evidence.references.length>=1);
    assert.match(evidence.references[0].text,/Real Academia Española|Asociación de Academias/i);
  }finally{fs.rmSync(temp,{recursive:true,force:true});}
});

test('runtime Evidence generator has no D1 or network dependency',()=>{
  const src=fs.readFileSync('scripts/generar evidence runtime github.js','utf8');
  assert.doesNotMatch(src,/WIKI_DB|workers\.dev|wrangler|fetch\s*\(/i);
});
