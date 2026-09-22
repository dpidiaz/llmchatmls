const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const gate=JSON.parse(fs.readFileSync('docs/evidence y provenance/13 Gate 100 Manifest.json','utf8'));
const pilot=JSON.parse(fs.readFileSync('docs/evidence y provenance/04 Pilot 20 Manifest.json','utf8'));
test('Gate 100 manifest: identity and scale are exact',()=>{
  assert.equal(gate.system,'MLS');assert.equal(gate.repository,'dpidiaz/llmchatmls');assert.equal(gate.domain,'language');
  assert.equal(gate.status,'prepared');assert.equal(gate.sampleBaseline.entries,100);assert.equal(gate.sampleBaseline.languages,10);assert.equal(gate.sampleBaseline.entriesPerLanguage,10);
  assert.equal(gate.execution.started,false);assert.equal(gate.safety.phase3Decision,'GO');assert.equal(gate.safety.gate100Authorized,true);assert.equal(gate.safety.runtimeScalePrepLive,false);
});
test('Gate 100 manifest: exactly ten unique entries per language and no Pilot 20 overlap',()=>{
  assert.equal(gate.entries.length,100);
  const codes=gate.entries.map(x=>x.code);assert.equal(new Set(codes).size,100);
  const pilotCodes=new Set(pilot.entries.map(x=>x.code));assert.equal(codes.some(x=>pilotCodes.has(x)),false);
  const counts={};for(const x of gate.entries)counts[x.language]=(counts[x.language]||0)+1;
  assert.equal(Object.keys(counts).length,10);for(const n of Object.values(counts))assert.equal(n,10);
});
test('Gate 100 manifest: selection is deterministic and blob-locked',()=>{
  for(const x of gate.entries){
    assert.match(x.code,/^MLS-V\d{2}-\d{4}$/);
    assert.match(x.contentPath,/^content\/[a-z-]+\/MLS-V\d{2}-\d{4}\.json$/);
    assert.match(x.contentBlobSha,/^[a-f0-9]{40}$/);
    assert.ok(Number.isInteger(x.quantileSlot)&&x.quantileSlot>=1&&x.quantileSlot<=10);
  }
  assert.equal(gate.selectionMethod.manualCherryPicking,false);
  assert.equal(gate.execution.metadataHydration,'at_execution');
});
