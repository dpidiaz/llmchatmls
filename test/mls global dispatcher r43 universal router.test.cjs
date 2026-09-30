'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const farm=require('../MLS R32 EDITORIAL/r4 snapshot farm.cjs');
const waveIssue=require('../MLS R32 EDITORIAL/r4 snapshot wave issue.cjs');
const remote=require('../MLS R32 EDITORIAL/r4 snapshot remote admission.cjs');
const router=require('../MLS R32 EDITORIAL/r4 universal bcr router.cjs');

const BASE='a'.repeat(40),CONTENT='b'.repeat(40);

function makeWave(waveId='BCR-R43-ROUTER',workerCount=2){
 const units=Array.from({length:workerCount*5},(_,i)=>{
  const code='MLS-V10-'+String(2000+i).padStart(4,'0');
  return {
   code,
   language:'espanol-guatemala',
   contentPath:'content/espanol-guatemala/'+code+'.json',
   evidenceArtifactPath:'MLS R32 EDITORIAL/evidence git/entries/espanol-guatemala/'+code+'.json'
  };
 });
 const snapshot=farm.createSnapshot({
  baseCommit:BASE,
  contentManifestBlobSha:CONTENT,
  units,
  createdAt:'2026-09-30T07:00:00.000Z'
 });
 const wave=farm.createWave(snapshot,{
  waveId,workerCount,shardSize:5,
  createdAt:'2026-09-30T07:00:00.000Z'
 });
 return {snapshot,wave};
}
function collectingIssue(number=12000,waveId='BCR-R43-ROUTER'){
 const {snapshot,wave}=makeWave(waveId);
 const record=waveIssue.create({
  waveIssueNumber:number,
  reservationIssueNumbers:[number-2],
  snapshot,wave,
  createdAt:'2026-09-30T07:01:00.000Z',
  route:'remote'
 });
 return {
  snapshot,wave,record,
  issue:{number,title:waveIssue.title(record),body:waveIssue.render(record)}
 };
}
function requestIssue(number,wave,waveIssueNumber,requestId){
 const req=remote.createRequest(wave,{
  waveIssueNumber,requestId,createdAt:'2026-09-30T07:02:00.000Z'
 });
 return {
  number,
  title:'[MLS BCR R4.3][REQUEST] '+requestId,
  author_association:'OWNER',
  body:remote.renderRequestBody(req)
 };
}
function sealedIssue(number=12000,waveId='BCR-R43-ROUTER'){
 const base=collectingIssue(number,waveId);
 const requests=[
  requestIssue(number+1,base.wave,number,'router-request-0001'),
  requestIssue(number+2,base.wave,number,'router-request-0002')
 ];
 const admission=remote.sealAdmission(base.wave,requests,{
  sealedAt:'2026-09-30T07:03:00.000Z',
  waveIssueNumber:number
 });
 const record=waveIssue.seal(
  base.record,base.snapshot,base.wave,admission,'2026-09-30T07:03:00.000Z'
 );
 return {
  ...base,record,requests,
  issue:{number,title:waveIssue.title(record),body:waveIssue.render(record)}
 };
}

test('universal command falls back to R4.2 when no R4.3 wave is active',()=>{
 const out=router.route({issues:[]});
 assert.deepEqual(out,{
  backend:'r42-elastic',
  action:'request-next',
  reason:'NO_ACTIVE_R43_WAVE'
 });
});

test('universal command routes a fresh chat to R4.3 admission while wave is collecting',()=>{
 const x=collectingIssue();
 const out=router.route({issues:[x.issue]});
 assert.equal(out.backend,'r43-snapshot');
 assert.equal(out.action,'request-admission');
 assert.equal(out.waveIssueNumber,x.issue.number);
 assert.equal(out.waveId,x.record.waveId);
});

test('universal command resumes exact admitted shard after wave is sealed',()=>{
 const x=sealedIssue();
 const admitted=x.record.admission.assignments[0];
 const out=router.route({issues:[x.issue],requestIssueNumber:admitted.issueNumber});
 assert.equal(out.backend,'r43-snapshot');
 assert.equal(out.action,'resume-assigned-shard');
 assert.equal(out.shardId,'W0001');
 assert.deepEqual(out.codes,x.wave.shards[0].codes);
});

test('fresh chat does not join an already sealed R4.3 wave and falls back to R4.2',()=>{
 const x=sealedIssue();
 const out=router.route({issues:[x.issue]});
 assert.equal(out.backend,'r42-elastic');
 assert.equal(out.action,'request-next');
 assert.equal(out.reason,'R43_WAVE_SEALED_NOT_ADMITTED');
 assert.equal(out.excludedWaveIssueNumber,x.issue.number);
});

test('universal router fails closed if multiple active R4.3 waves are visible',()=>{
 const a=collectingIssue(12000,'BCR-R43-ROUTER-A');
 const b=collectingIssue(13000,'BCR-R43-ROUTER-B');
 assert.throws(()=>router.route({issues:[a.issue,b.issue]}),{
  code:'R43_UNIVERSAL_MULTIPLE_ACTIVE_WAVES'
 });
});
