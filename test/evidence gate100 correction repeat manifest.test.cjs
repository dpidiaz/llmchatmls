const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const repeat=JSON.parse(fs.readFileSync('docs/evidence y provenance/16 Gate 100 Correction Repeat Manifest.json','utf8'));
const pilot=JSON.parse(fs.readFileSync('docs/evidence y provenance/04 Pilot 20 Manifest.json','utf8'));
const gate=JSON.parse(fs.readFileSync('docs/evidence y provenance/13 Gate 100 Manifest.json','utf8'));

function meta(filename){
  const m=String(filename).match(/^(MLS-V\d{2}-(\d{4}))\.json$/);
  return m?{code:m[1],n:Number(m[2])}:null;
}

test('Gate 100 correction repeat manifest: identity and safety are exact',()=>{
  assert.equal(repeat.system,'MLS');
  assert.equal(repeat.repository,'dpidiaz/llmchatmls');
  assert.equal(repeat.domain,'language');
  assert.equal(repeat.status,'prepared');
  assert.equal(repeat.sampleBaseline.entries,100);
  assert.equal(repeat.sampleBaseline.languages,10);
  assert.equal(repeat.sampleBaseline.entriesPerLanguage,10);
  assert.equal(repeat.execution.started,false);
  assert.equal(repeat.safety.optimizationPullRequest,668);
  assert.equal(repeat.safety.optimizationLiveRequired,true);
  assert.equal(repeat.safety.gate500Authorized,false);
  assert.equal(repeat.selectionMethod.eligibleNumericSuffixMax,1000);
  assert.equal(repeat.selectionMethod.manualCherryPicking,false);
});

test('Gate 100 correction repeat manifest: fresh sample has no Pilot 20 or Gate 100 overlap',()=>{
  assert.equal(repeat.entries.length,100);
  const codes=repeat.entries.map(x=>x.code);
  assert.equal(new Set(codes).size,100);
  const excluded=new Set([...pilot.entries.map(x=>x.code),...gate.entries.map(x=>x.code)]);
  assert.equal(codes.some(code=>excluded.has(code)),false);
  const counts={};
  for(const entry of repeat.entries)counts[entry.language]=(counts[entry.language]||0)+1;
  assert.equal(Object.keys(counts).length,10);
  for(const n of Object.values(counts))assert.equal(n,10);
});

test('Gate 100 correction repeat manifest: selection rule reconstructs exactly from content tree',()=>{
  const excluded=new Set([...pilot.entries.map(x=>x.code),...gate.entries.map(x=>x.code)]);
  const languages=[...new Set(gate.entries.map(x=>x.language))];
  const reconstructed=[];
  for(const language of languages){
    const files=fs.readdirSync(path.join('content',language))
      .map(filename=>({filename,...meta(filename)}))
      .filter(x=>x.code&&x.n<=1000&&!excluded.has(x.code))
      .sort((a,b)=>a.filename.localeCompare(b.filename));
    for(let slot=1;slot<=10;slot++){
      const selected=files[Math.floor((slot-0.5)*files.length/10)];
      reconstructed.push(selected.code);
    }
  }
  assert.deepEqual(reconstructed,repeat.entries.map(x=>x.code));
});

test('Gate 100 correction repeat manifest: entries are blob-locked and quantile-labelled',()=>{
  for(const entry of repeat.entries){
    assert.match(entry.code,/^MLS-V\d{2}-\d{4}$/);
    assert.match(entry.contentPath,/^content\/[a-z-]+\/MLS-V\d{2}-\d{4}\.json$/);
    assert.match(entry.contentBlobSha,/^[a-f0-9]{40}$/);
    assert.ok(Number.isInteger(entry.quantileSlot)&&entry.quantileSlot>=1&&entry.quantileSlot<=10);
  }
});
