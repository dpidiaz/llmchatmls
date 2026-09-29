'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const foundation=require('../MLS R32 EDITORIAL/evidence foundation.js');
const evidence=require('../MLS R32 EDITORIAL/evidence git.js');
const academic=require('../MLS R32 EDITORIAL/r4 buffered academic.cjs');
const manifest=require('../docs/MLS Global Dispatcher/12 R4.1 Piloto 1861 Evidence revision v3.json');
const codes=['0306','0308','0309','0310','0311','0343','0344','0346','0347','0348'].map(n=>'MLS-V10-'+n);
const entryPath=code=>path.join(root,'MLS R32 EDITORIAL/evidence git/entries/espanol-guatemala',code+'.json');
const articlePath=code=>path.join(root,'content/espanol-guatemala',code+'.json');
test('ten corrected pilot entries pass R33 and academic structural traceability, identities and provenance',async()=>{
 assert.equal(manifest.correctedEntries.length,10);
 assert.equal(manifest.parentStageCommit,'b6de10a6cd9d2a0682a9a162606a6d09e2bea839');
 assert.equal(manifest.qualityHoldReleaseAuthorized,false);
 for(const code of codes){
   const e=JSON.parse(fs.readFileSync(entryPath(code),'utf8'));
   const article=JSON.parse(fs.readFileSync(articlePath(code),'utf8'));
   const assessed=await evidence.assessEntry(root,e);
   assert.equal(assessed.ok,true,code+': '+assessed.errors.join(','));
   assert.equal(assessed.derivedStatus,'VERIFIED',code);
   const structural=academic.inspect(e,article);
   assert.equal(structural.ok,true,code+': '+structural.errors.join(','));
   assert.equal(e.evidenceRevision,3,code);
   assert.equal(e.review,null,code+': false human review');
   assert.equal(e.provenance.parentStageCommit,manifest.parentStageCommit,code);
   assert.equal(e.article.articleHash,await foundation.articleHash(article.articleMarkdown),code);
   assert.equal(e.article.articleGeneratedAt,article.generatedAt,code);
   assert.deepEqual(e.claims.map(c=>c.sectionKey),['En pocas palabras','Cómo funciona','Observación importante']);
   assert.equal(e.links.length,3);
   for(const claim of e.claims){
     assert.equal(claim.claimId,await foundation.claimIdentity({code,articleHash:e.article.articleHash,
       sectionKey:claim.sectionKey,summary:claim.summary,claimType:claim.claimType,materiality:claim.materiality}),code+': claim id');
   }
   for(const link of e.links){
     assert.ok(link.locator.section&&link.locator.url,code+': passage locator');
     assert.equal(link.linkId,await foundation.evidenceLinkIdentity({claimId:link.claimId,sourceId:link.sourceId,
       supportType:link.supportType,locator:link.locator}),code+': EvidenceLink id');
   }
   assert.equal(e.verification.evidenceSnapshotHash,evidence.sha256Text(foundation.stableJson({
     article:e.article,claims:e.claims,links:e.links,conflicts:e.conflicts})),code+': snapshot hash');
 }
});
test('source register separates 2009 full NGLE, 2010 Manual, and separate DPD',async()=>{
 const sourceIds=['MLS-SRC-4FD19E7F1FE011BD0049','MLS-SRC-5489C23D3680489CAAAE','MLS-SRC-40C4D83616382846551E'];
 for(const id of sourceIds){
   const source=await evidence.loadSource(root,id);
   assert.equal(source.sourceId,id);
   assert.equal(source.authorityTier,'A');
   assert.equal(source.status,'active');
 }
 const manual=await evidence.loadSource(root,sourceIds[1]);
 const dpd=await evidence.loadSource(root,sourceIds[2]);
 assert.equal(manual.publicationYear,2010);
 assert.equal(manual.isbn,'9788467032819');
 assert.equal(dpd.identityKind,'url');
 const a=JSON.parse(fs.readFileSync(entryPath('MLS-V10-0311'),'utf8'));
 assert.ok(a.links.every(l=>l.sourceId===sourceIds[1]));
 const b=JSON.parse(fs.readFileSync(entryPath('MLS-V10-0309'),'utf8'));
 assert.equal(b.links[1].sourceId,sourceIds[2]);
});
test('article corrections remove uncited tangent in 0306 and qualify acá geography in 0346',()=>{
 const a=JSON.parse(fs.readFileSync(articlePath('MLS-V10-0306'),'utf8'));
 const b=JSON.parse(fs.readFileSync(articlePath('MLS-V10-0346'),'utf8'));
 assert.doesNotMatch(a.articleMarkdown,/Busco una ayuda/);
 assert.match(b.articleMarkdown,/Río de la Plata y el Caribe continental/);
 assert.match(b.articleMarkdown,/México y Centroamérica/);
});
test('historical #1861 publication hold remains active pending reconciled revision',()=>{
 const inventory=require('../MLS R32 EDITORIAL/evidence git/quality-holds.json');
 const item=inventory.holds.find(h=>h.workId==='r33-buffer:MLS-BUFFER-001861');
 assert.equal(item.status,'active');
 assert.equal(item.commitSha,manifest.parentStageCommit);
 assert.equal(manifest.status,'PREPARED_VERSIONED_CORRECTION_PENDING_RECONCILIATION');
});
