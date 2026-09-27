'use strict';

const fs=require('node:fs');
const path=require('node:path');
const store=require('../MLS R32 EDITORIAL/evidence git.js');
const foundation=require('../MLS R32 EDITORIAL/evidence foundation.js');

function die(message){const e=new Error(message);e.code='R4_PREFLIGHT_INVALID';throw e;}
async function main(){
  const artifactPath=process.argv[2];
  if(!artifactPath)die('Usage: node scripts/R4 evidence preflight.cjs <evidence-json>');
  const absolute=path.resolve(artifactPath);
  const entry=JSON.parse(fs.readFileSync(absolute,'utf8'));
  if(!entry.contentPath)die('contentPath missing.');
  const article=await store.currentArticle('.',entry.contentPath);
  if(String(entry.code||'').toUpperCase()!==article.code)die('Evidence code does not match canonical article.');
  entry.article=article;

  const claimMap=new Map();
  for(const claim of entry.claims||[]){
    const old=claim.claimId;
    claim.claimId=await foundation.claimIdentity({
      code:entry.code,articleHash:article.articleHash,sectionKey:claim.sectionKey||'',
      summary:claim.summary,claimType:claim.claimType||'general',materiality:claim.materiality||'substantial'
    });
    if(old)claimMap.set(old,claim.claimId);
  }
  for(const link of entry.links||[]){
    link.claimId=claimMap.get(link.claimId)||link.claimId;
    link.linkId=await foundation.evidenceLinkIdentity({
      claimId:link.claimId,sourceId:link.sourceId,supportType:link.supportType,
      locator:link.locator&&typeof link.locator==='object'?link.locator:{}
    });
  }
  if(entry.verification){
    entry.verification.evidenceSnapshotHash=store.sha256Text(foundation.stableJson({
      article:entry.article,claims:entry.claims||[],links:entry.links||[],conflicts:entry.conflicts||[]
    }));
  }
  fs.writeFileSync(absolute,JSON.stringify(entry,null,2)+'\n');
  const assessment=await store.assessEntry('.',entry);
  if(!assessment.ok)die(entry.code+': '+assessment.errors.join(','));
  process.stdout.write(JSON.stringify({ok:true,code:entry.code,articleHash:article.articleHash,evidenceSnapshotHash:entry.verification?.evidenceSnapshotHash||null})+'\n');
}
main().catch(error=>{console.error(error.code||'R4_PREFLIGHT_INVALID',error.message);process.exitCode=2;});
