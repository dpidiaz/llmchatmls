'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const core=require('../MLS R32 EDITORIAL/r4 buffered core.cjs');
const sync=require('../MLS R32 EDITORIAL/r4 buffered sync.cjs');

function unit(i){const code='MLS-V10-'+String(500+i).padStart(4,'0');
  return {code,language:'espanol-guatemala',contentPath:'content/espanol-guatemala/sample-'+i+'.json'};
}
function assignment(n=10){return {allocatedBy:'global-dispatcher',assignmentId:'MLS-GLOBAL-TEST-0042',assignmentIssueNumber:88001,
  leaseEpoch:42,poolId:'MLS-R33-TEST-POOL',manifestVersion:'v1',baseCommit:'a'.repeat(40),
  contentManifestBlobSha:'b'.repeat(40),units:Array.from({length:n},(_,i)=>unit(i))};}
function entry(u){return {architecture:'github-native',code:u.code,language:u.language,contentPath:u.contentPath,
  status:'VERIFIED',article:{code:u.code,articleHash:'c'.repeat(64)},claims:[],links:[],conflicts:[],
  verification:{verifiedAt:'2026-09-28T00:00:00Z',evidenceSnapshotHash:'d'.repeat(64)}};}
function temporary(t){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mls-r41-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));return dir;}
const assessed=async (_root,e)=>({ok:true,derivedStatus:e.status,article:{articleHash:e.article.articleHash},claimsVerified:2,sourcesTotal:2});
function state(branch='feat/test',blob='b'.repeat(40),ancestor=true){
  return ()=>({branch,headSha:'e'.repeat(40),contentManifestBlobSha:blob,isAncestor:()=>ancestor});
}

test('requires actual Dispatcher assignment envelope, never creates a lease from a guess',async t=>{
  const dir=temporary(t),a=assignment(1);
  await assert.rejects(core.init(dir,{...a,allocatedBy:'chat'}),{code:'DISPATCHER_EXPORT_REQUIRED'});
  await core.init(dir,a);
  await assert.rejects(core.init(dir,{...a,assignmentId:'MLS-GLOBAL-OTHER-0042'}),{code:'ALLOCATION_CONFLICT'});
});
test('ten units: individual checkpoint, progress and exact idempotent replay',async t=>{
  const dir=temporary(t),a=assignment();
  assert.equal((await core.init(dir,a)).count,10);
  for(const u of a.units)await core.checkpoint(dir,entry(u));
  assert.equal(core.inspect(dir).completed.length,10);
  assert.equal(core.inspect(dir).missing.length,0);
  assert.equal((await core.checkpoint(dir,entry(a.units[0]))).replayed,true);
  await assert.rejects(core.checkpoint(dir,{...entry(a.units[0]),conflicts:[{status:'unresolved'}]}),{code:'ENTRY_CONFLICT'});
});
test('crash after entry write before checkpoint is explicitly recognized and recoverable',async t=>{
  const dir=temporary(t),a=assignment(1);await core.init(dir,a);
  core.writeOnce(core.ef(dir,a.units[0].code),entry(a.units[0]));
  assert.deepEqual(core.inspect(dir).orphans,[a.units[0].code]);
  await core.checkpoint(dir,entry(a.units[0]));
  assert.equal(core.inspect(dir).completed.length,1);
});
test('tampered checkpoint or entry fails integrity check',async t=>{
  const dir=temporary(t),a=assignment(1);await core.init(dir,a);await core.checkpoint(dir,entry(a.units[0]));
  fs.writeFileSync(core.ef(dir,a.units[0].code),'{"altered":true}');
  assert.equal(core.inspect(dir).invalid.length,1);
  await assert.rejects(sync.seal(dir,dir,{assess:assessed}),{code:'INCOMPLETE_BUFFER'});
});
test('cannot seal incomplete work, or content that does not pass R33',async t=>{
  const dir=temporary(t),a=assignment(2);await core.init(dir,a);await core.checkpoint(dir,entry(a.units[0]));
  await assert.rejects(sync.seal(dir,dir,{assess:assessed}),{code:'INCOMPLETE_BUFFER'});
  await core.checkpoint(dir,entry(a.units[1]));
  await assert.rejects(sync.seal(dir,dir,{assess:async()=>({ok:false,derivedStatus:'SOURCED',errors:['unverified_claim']})}),{code:'R33_CERTIFICATION_REQUIRED'});
  assert.equal(core.inspect(dir).sealed,false);
});
test('ten-entry package seals immutably; replay cannot modify it',async t=>{
  const dir=temporary(t),a=assignment();await core.init(dir,a);
  for(const u of a.units)await core.checkpoint(dir,entry(u));
  const package1=await sync.seal(dir,dir,{assess:assessed});
  assert.equal(package1.entries.length,10);assert.equal(core.inspect(dir).invalid.length,0);
  assert.equal((await sync.seal(dir,dir,{assess:assessed})).packageHash,package1.packageHash);
  await assert.rejects(core.checkpoint(dir,entry(a.units[0])),{code:'SEALED_PACKAGE'});
});
test('read-only import plan flags remote authorization and detects identical previous content',async t=>{
  const dir=temporary(t),repo=temporary(t),a=assignment(10);await core.init(dir,a);
  for(const u of a.units)await core.checkpoint(dir,entry(u));
  await sync.seal(dir,repo,{assess:assessed});
  const options={assess:assessed,state:state()};
  let p=await sync.plan(dir,repo,options);
  assert.equal(p.toCreate.length,10);assert.equal(p.status,'REMOTE_AUTHORIZATION_REQUIRED');
  const target=path.join(repo,p.toCreate[0].path);fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,JSON.stringify(entry(a.units[0])));
  p=await sync.plan(dir,repo,options);assert.equal(p.toCreate.length,9);assert.deepEqual(p.alreadyPresent,[a.units[0].code]);
});
test('rejects protected branch, moved corpus, stale base and divergent target',async t=>{
  const dir=temporary(t),repo=temporary(t),a=assignment(1);await core.init(dir,a);
  await core.checkpoint(dir,entry(a.units[0]));await sync.seal(dir,repo,{assess:assessed});
  await assert.rejects(sync.plan(dir,repo,{assess:assessed,state:state('main')}),{code:'PROTECTED_BRANCH'});
  await assert.rejects(sync.plan(dir,repo,{assess:assessed,state:state('feat/test','f'.repeat(40))}),{code:'CORPUS_SNAPSHOT_CONFLICT'});
  await assert.rejects(sync.plan(dir,repo,{assess:assessed,state:state('feat/test','b'.repeat(40),false)}),{code:'BASE_CONFLICT'});
  const target=path.join(repo,'MLS R32 EDITORIAL/evidence git/entries/espanol-guatemala',a.units[0].code+'.json');
  fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,'{"different":true}');
  await assert.rejects(sync.plan(dir,repo,{assess:assessed,state:state()}),{code:'CANONICAL_CONTENT_CONFLICT'});
});
test('canonical assessor independently rejects a fictitious source-less Evidence entry',async t=>{
  const dir=temporary(t),e=entry(unit(0));
  await assert.rejects(sync.canonicalAssessment(dir,e));
});
