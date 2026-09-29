'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const integration=require('../MLS R32 EDITORIAL/global dispatcher/providers/integration.js');
const selector=require('../MLS R32 EDITORIAL/r4 staging supersession.cjs');
const root=path.resolve(__dirname,'..'),state=selector.load(root);
const rec=state.entries.get('r33-buffer:MLS-BUFFER-001861').record;
const hold=state.entries.get(rec.workId).hold;
const terminal={provider:'r33-farm',status:'certified',assignmentId:rec.assignmentId,
 branch:rec.original.branch,commitSha:rec.original.commitSha,
 bufferPackageHash:rec.original.packageHash,completedUnits:rec.codes,completedAt:'2026-09-29T05:00:04Z'};
const ledger={kind:'mls_global_dispatch_ledger',terminal:{[rec.workId]:terminal},recoveries:{}};
const pool={entries:rec.codes.map((code,i)=>({code,order:i+1,language:'espanol-guatemala'})),
 execution:{integrationWaveSize:10}};
test('source registry pins exact v3 commit and matches original quality hold',()=>{
 assert.equal(state.entries.size,1);
 assert.equal(hold.status,'active');
 assert.equal(rec.replacement.branch,'r41/staged/1861-v3');
 assert.equal(rec.replacement.commitSha,'8df7762dd540a31da2fe7bfe68075f7a1217cc1a');
 assert.equal(rec.original.commitSha,'b6de10a6cd9d2a0682a9a162606a6d09e2bea839');
 assert.equal(rec.academicSecondPass.checkedClaims,30);
 assert.equal(rec.academicSecondPass.humanReviewed,false);
});
test('a held final integration has no old-SHA fallback and will not schedule these ten codes',()=>{
 const choice=selector.choose(rec.workId,terminal,state,{mode:'integration'});
 assert.equal(choice.blocked,true);
 assert.equal(choice.commitSha,rec.replacement.commitSha);
 const available=integration.r33TerminalSourceMap(ledger,pool,{root});
 assert.equal(available.size,0);
 const work=integration.r33IndexIntegrationWork({pool,globalLedger:ledger,root,waveSize:10,verifiedCodes:[]});
 assert.equal(work,null);
});
test('rehearsal uses *only* v3 and pins the two article + two source supplement assets',()=>{
 const manifest=integration.r33StagingManifest(ledger,{createdAt:'2026-09-29T06:00:00Z',root});
 assert.equal(manifest.entryCount,10);
 assert.ok(manifest.entries.every(e=>e.commitSha===rec.replacement.commitSha));
 assert.ok(manifest.entries.every(e=>e.branch===rec.replacement.branch&&e.academicHold===true));
 assert.equal(manifest.assetRefs.length,4);
 assert.ok(manifest.assetRefs.every(a=>a.commitSha===rec.replacement.commitSha&&selector.safeAsset(a.path,rec.codes)));
 assert.equal(manifest.revisionSelections[0].originalCommitSha,rec.original.commitSha);
 const rehearsal=fs.readFileSync(path.join(root,'scripts/R4 staging rehearsal.cjs'),'utf8');
 assert.match(rehearsal,/manifest\.assetRefs/);
 assert.ok(rehearsal.indexOf('manifest.assetRefs')<rehearsal.indexOf('for(const row of manifest.entries)'));
});
test('wrong original terminal, altered hold and duplicate ownership fail closed',()=>{
 assert.throws(()=>selector.choose(rec.workId,{...terminal,commitSha:'1'.repeat(40)},state),
  /SUPERSESSION_LIVE_TERMINAL_CONFLICT/);
 const raw=require('../MLS R32 EDITORIAL/evidence git/staging-supersessions.json');
 const holds=require('../MLS R32 EDITORIAL/evidence git/quality-holds.json');
 const corrupt=structuredClone(holds);corrupt.holds[0].commitSha='2'.repeat(40);
 assert.throws(()=>selector.parseRegistry(raw,corrupt),/SUPERSESSION_ORIGINAL_HOLD_MISMATCH/);
 const repeated=structuredClone(raw);repeated.entries.push(structuredClone(repeated.entries[0]));
 assert.throws(()=>selector.parseRegistry(repeated,holds),/SUPERSESSION_WORK_ID/);
});
test('after independent editorial hold release, exact v3 is selected—not the old SHA',()=>{
 const approve=structuredClone(hold);
 approve.status='resolved';
 approve.replacementApproval={revisionId:rec.revisionId,commitSha:rec.replacement.commitSha,
   reviewer:'Independent academic editor',reviewedAt:'2026-09-30T12:00:00Z',independentAcademicReview:true};
 const stateApproved={entries:new Map([[rec.workId,{record:rec,hold:approve}]]),activeHeldCodes:new Set()};
 const s=selector.choose(rec.workId,terminal,stateApproved,{mode:'integration'});
 assert.equal(s.blocked,false);assert.equal(s.commitSha,rec.replacement.commitSha);
 assert.notEqual(s.commitSha,rec.original.commitSha);
 const noApproval=structuredClone(approve);delete noApproval.replacementApproval;
 assert.throws(()=>selector.choose(rec.workId,terminal,
  {entries:new Map([[rec.workId,{record:rec,hold:noApproval}]]),activeHeldCodes:new Set()},{mode:'integration'}),
  /SUPERSESSION_EXPLICIT_APPROVAL_REQUIRED/);
});
test('academic source report does not claim human REVIEWED certification',()=>{
 const report=fs.readFileSync(path.join(root,rec.replacement.academicReportPath),'utf8');
 assert.match(report,/30 claims/);
 assert.match(report,/no constituye aprobación por una persona revisora/i);
 assert.equal(rec.finalIntegration.approvedForPublication,false);
});

test('approved final wave includes exact pinned v3 Evidence and four additional article/source assets',()=>{
 const os=require('node:os'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'r41-supersession-'));
 try{
  const dir=path.join(tmp,'MLS R32 EDITORIAL','evidence git');
  fs.mkdirSync(dir,{recursive:true});
  const raw=require('../MLS R32 EDITORIAL/evidence git/staging-supersessions.json');
  const originalHolds=require('../MLS R32 EDITORIAL/evidence git/quality-holds.json');
  const revised=structuredClone(originalHolds);
  const h=revised.holds.find(x=>x.workId===rec.workId);
  h.status='resolved';
  h.replacementApproval={revisionId:rec.revisionId,commitSha:rec.replacement.commitSha,
   reviewer:'Independent qualified editor',independentAcademicReview:true,reviewedAt:'2026-09-30T12:00:00Z'};
  fs.writeFileSync(path.join(dir,'staging-supersessions.json'),JSON.stringify(raw));
  fs.writeFileSync(path.join(dir,'quality-holds.json'),JSON.stringify(revised));
  const wave=integration.r33IndexIntegrationWork({pool,globalLedger:ledger,root:tmp,waveSize:10,verifiedCodes:[]});
  assert.ok(wave);
  assert.equal(wave.sourceRefs.length,10);
  assert.ok(wave.sourceRefs.every(x=>x.commitSha===rec.replacement.commitSha));
  assert.equal(wave.integration.revisionAssets.length,4);
  for(const asset of rec.materializationAssets){
   assert.ok(wave.allowedPaths.includes(asset));
   assert.ok(wave.integration.revisionAssets.some(x=>x.path===asset&&x.commitSha===rec.replacement.commitSha));
  }
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
