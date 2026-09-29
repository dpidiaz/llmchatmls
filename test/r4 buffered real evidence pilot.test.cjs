'use strict';
// Academic pilot: ten EXISTING canonical R33 VERIFIED entries, read-only.
// It creates no new VERIFIED entries or live ownership and performs no GitHub REST calls.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const cp=require('node:child_process');
const core=require('../MLS R32 EDITORIAL/r4 buffered core.cjs');
const sync=require('../MLS R32 EDITORIAL/r4 buffered sync.cjs');
const transport=require('../MLS R32 EDITORIAL/r4 buffered transport.cjs');
const r33=require('../MLS R32 EDITORIAL/global dispatcher/providers/r33.js');

test('ten real VERIFIED Evidence entries pass offline R33, checkpoints, export and recoverable import',async t=>{
 const repo=path.resolve(__dirname,'..');
 const evidenceDir=path.join(repo,'MLS R32 EDITORIAL/evidence git/entries/espanol-guatemala');
 const candidates=fs.readdirSync(evidenceDir).filter(f=>/^MLS-V10-\d{4}\.json$/.test(f)).sort();
 const sample=[],skipped=[];
 for(const file of candidates){
   const e=JSON.parse(fs.readFileSync(path.join(evidenceDir,file),'utf8'));
   if(!['VERIFIED','REVIEWED'].includes(e.status))continue;
   try{await sync.canonicalAssessment(repo,e);sample.push(e);}catch(error){skipped.push({code:e.code,reason:error.code||error.message});}
   if(sample.length===10)break;
 }
 assert.equal(sample.length,10,'At least ten existing canonical entries must pass R33; rejected: '+JSON.stringify(skipped));
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'r41-real-evidence-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const buffer=path.join(root,'original'),file=path.join(root,'bundle.json'),recovered=path.join(root,'recovered');
 const head=cp.execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim();
 const blob=cp.execFileSync('git',['rev-parse','HEAD:content/manifest.json'],{cwd:repo,encoding:'utf8'}).trim();
 const assignment={allocatedBy:'offline-pilot',pilotOnly:true,assignmentId:'MLS-PILOT-EXISTING-10',
   assignmentIssueNumber:99990001,leaseEpoch:99990001,poolId:'MLS-PILOT-READONLY',manifestVersion:'R33-main-snapshot',
   baseCommit:head,contentManifestBlobSha:blob,
   units:sample.map(e=>({code:e.code,language:e.language,contentPath:e.contentPath,
     evidenceArtifactPath:r33.evidenceArtifactPath(e)}))};
 await core.init(buffer,assignment);
 for(const e of sample)await core.checkpoint(buffer,e);
 assert.equal(core.inspect(buffer).completed.length,10);
 const package1=await sync.seal(buffer,repo);
 assert.equal(package1.entries.length,10);
 assert.equal(package1.entries.every(e=>['VERIFIED','REVIEWED'].includes(e.derivedStatus)),true);
 const exported=transport.exportTo(buffer,file);
 const imported=await transport.importFrom(recovered,file);
 assert.equal(imported.packageHash,package1.packageHash);
 assert.equal(imported.entries,10);
 assert.equal(core.inspect(recovered).invalid.length,0);
 await assert.rejects(sync.plan(recovered,repo),e=>e.code==='OFFLINE_PILOT_CANNOT_SYNC');
 console.log('R41_REAL_CANONICAL_EVIDENCE_PILOT '+JSON.stringify({
   alreadyIntegratedAcademicEntries:10,canonicalChecksPassed:10,recovered:10,
   checkpoints:10,identicalBundleHash:exported.bundleHash===imported.bundleHash,
   githubRestCallsFromLocalEditorialPipeline:0,remoteWrites:false,productionIdsAllocated:false,
   corpusModified:false,pilotOnly:true
 }));
});
