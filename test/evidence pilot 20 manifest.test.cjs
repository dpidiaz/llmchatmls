const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const {mlsAutooptFamily}=require('../MLS R32 EDITORIAL/autoopt.js');

const manifest=JSON.parse(fs.readFileSync('docs/evidence y provenance/04 Pilot 20 Manifest.json','utf8'));
const EXPECTED_LANGUAGES=['aleman','chino-taiwan','coreano','espanol-guatemala','frances','ingles','italiano','japones','portugues','ruso'];

function gitBlobSha(buffer){
  return crypto.createHash('sha1').update(Buffer.from('blob '+buffer.length+'\0')).update(buffer).digest('hex');
}

test('Pilot 20 manifest: reflects completed live execution without fabricating review state',()=>{
  assert.equal(manifest.pilotId,'MLS-R33-EVIDENCE-PILOT-20');
  assert.equal(manifest.status,'completed');
  assert.equal(manifest.execution.started,true);
  assert.equal(manifest.execution.runId,'MLS-R33-EVIDENCE-PILOT-20-20260921-A');
  assert.equal(manifest.execution.startedAt,'2026-09-21T17:07:44Z');
  assert.equal(manifest.execution.completedAt,'2026-09-22T01:51:55.091Z');
  assert.equal(manifest.execution.entriesProcessed,20);
  assert.equal(manifest.execution.entriesVerified,17);
  assert.equal(manifest.execution.entriesSourcedNotVerified,3);
  assert.equal(manifest.execution.entriesNeedsReview,1);
  assert.equal(manifest.execution.articleRevisionsProposed,3);
  assert.equal(manifest.execution.lastCompletedOrder,20);
  assert.equal(manifest.execution.lastCompletedCode,'MLS-V09-0825');
  assert.equal(manifest.execution.lastCheckpoint,'17-20');
  assert.equal(manifest.execution.lastCheckpointStatus,'pass_with_findings');
  assert.equal(manifest.entries.length,20);
});

test('Pilot 20 manifest: exactly two entries per canonical language',()=>{
  const counts={};
  for(const entry of manifest.entries)counts[entry.language]=(counts[entry.language]||0)+1;
  assert.deepEqual(Object.keys(counts).sort(),EXPECTED_LANGUAGES);
  for(const language of EXPECTED_LANGUAGES)assert.equal(counts[language],2,language);
});

test('Pilot 20 manifest: codes paths and canonical versions are unique and current',()=>{
  const codes=new Set(),paths=new Set(),orders=new Set();
  for(const entry of manifest.entries){
    assert.ok(!codes.has(entry.code),'Código duplicado '+entry.code);codes.add(entry.code);
    assert.ok(!paths.has(entry.contentPath),'Path duplicado '+entry.contentPath);paths.add(entry.contentPath);
    assert.ok(!orders.has(entry.order),'Orden duplicado '+entry.order);orders.add(entry.order);
    const raw=fs.readFileSync(entry.contentPath);
    const current=JSON.parse(raw.toString('utf8'));
    assert.equal(gitBlobSha(raw),entry.contentBlobSha,entry.code+' cambió respecto del blob bloqueado');
    assert.equal(current.code,entry.code);
    assert.equal(current.language,entry.language);
    assert.equal(current.languageName,entry.languageName);
    assert.equal(current.title,entry.title);
    assert.equal(current.level,entry.level);
    assert.equal(current.part,entry.part);
    assert.equal(current.chapter,entry.chapter);
    assert.equal(current.generatedAt,entry.generatedAt);
    assert.equal(current.promptVersion,entry.promptVersion);
    assert.equal(current.articleMarkdown.length,entry.articleChars);
  }
  assert.deepEqual([...orders].sort((a,b)=>a-b),Array.from({length:20},(_,i)=>i+1));
});

test('Pilot 20 manifest: AUTOOPT families match the real deterministic classifier',()=>{
  const known=new Set();
  for(const entry of manifest.entries){
    const family=mlsAutooptFamily({title:entry.title,chapter:entry.chapter,part:entry.part});
    assert.equal(family,entry.expectedAutooptFamily,entry.code);
    if(family!=='unknown')known.add(family);
  }
  assert.ok(known.size>=4,'La muestra debe conservar varias familias AUTOOPT conocidas');
});

test('Pilot 20 manifest: level and phenomenon coverage stays heterogeneous',()=>{
  const levels=new Set(manifest.entries.map(x=>x.level));
  for(const required of ['A1','A2','B1','B2','C1','G1','G4'])assert.ok(levels.has(required),'Falta nivel '+required);
  const tags=new Set(manifest.entries.flatMap(x=>x.selectionTags));
  for(const required of ['orthography','morphology','syntax','pronunciation','regional_variation','optionality','pragmatics','discourse','case','short_entry','long_entry'])assert.ok(tags.has(required),'Falta cobertura '+required);
});

test('Pilot 20 manifest: sample baselines are reproducible',()=>{
  const chars=manifest.entries.map(x=>x.articleChars);
  const total=chars.reduce((a,b)=>a+b,0);
  const dist={};
  for(const entry of manifest.entries)dist[entry.level]=(dist[entry.level]||0)+1;
  assert.equal(total,manifest.sampleBaseline.totalArticleChars);
  assert.equal(total/manifest.entries.length,manifest.sampleBaseline.averageArticleChars);
  assert.equal(Math.min(...chars),manifest.sampleBaseline.minArticleChars);
  assert.equal(Math.max(...chars),manifest.sampleBaseline.maxArticleChars);
  assert.deepEqual(dist,manifest.sampleBaseline.levelDistribution);
});

test('Pilot 20 manifest: contains no materialized Evidence output',()=>{
  const serialized=JSON.stringify(manifest);
  assert.equal(/MLS-SRC-|MLS-CLM-|MLS-LNK-|MLS-REVW-|MLS-ARTREV-/i.test(serialized),false);
  for(const entry of manifest.entries){
    assert.equal(Object.hasOwn(entry,'evidenceStatus'),false);
    assert.equal(Object.hasOwn(entry,'sources'),false);
    assert.equal(Object.hasOwn(entry,'claims'),false);
  }
});
