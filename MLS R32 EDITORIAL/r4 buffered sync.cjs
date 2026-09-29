'use strict';
// Read-only synchronization planning for R4.1; actual remote authorization and grouped commit remain Dispatcher-controlled.
const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');
const core=require('./r4 buffered core.cjs');
const store=require('./evidence git.js');
const foundation=require('./evidence foundation.js');

async function canonicalAssessment(root,entry){
  const a=await store.assessEntry(root,entry);
  if(!a.ok||!['VERIFIED','REVIEWED'].includes(a.derivedStatus)||a.derivedStatus!==entry.status)
    core.error('R33_CERTIFICATION_REQUIRED',entry.code+': '+(a.errors||[]).join(','));
  if(!foundation.assertEvidenceVersionMatch(a.article,entry.article||{}))core.error('ARTICLE_HASH_CONFLICT',entry.code);
  for(const claim of entry.claims||[]){
    const expected=await foundation.claimIdentity({code:entry.code,articleHash:a.article.articleHash,
      sectionKey:claim.sectionKey||'',summary:claim.summary,claimType:claim.claimType||'general',
      materiality:claim.materiality||'substantial'});
    if(claim.claimId!==expected)core.error('CLAIM_ID_CONFLICT',entry.code);
  }
  for(const link of entry.links||[]){
    const expected=await foundation.evidenceLinkIdentity({claimId:link.claimId,sourceId:link.sourceId,
      supportType:link.supportType,locator:link.locator&&typeof link.locator==='object'?link.locator:{}});
    if(link.linkId!==expected)core.error('LINK_ID_CONFLICT',entry.code);
  }
  const expectedSnapshot=store.sha256Text(foundation.stableJson({article:a.article,
    claims:entry.claims||[],links:entry.links||[],conflicts:entry.conflicts||[]}));
  if(entry.verification?.evidenceSnapshotHash!==expectedSnapshot)core.error('EVIDENCE_SNAPSHOT_CONFLICT',entry.code);
  return a;
}
async function seal(dir,repoRoot,{assess=canonicalAssessment}={}){
  if(!repoRoot)core.error('CANONICAL_CHECKOUT_REQUIRED','Full canonical checkout required.');
  return core.exclusive(dir,async()=>{
    const m=core.manifest(dir),i=core.inspect(dir);
    if(i.invalid.length||i.orphans.length||i.missing.length)core.error('INCOMPLETE_BUFFER','Unresolved orphan/missing/corrupt entries.');
    if(i.sealed)return core.read(core.pf(dir));
    const entries=[];
    for(const u of m.allocation.units){
      const e=core.read(core.ef(dir,u.code)),a=await assess(repoRoot,e);
      entries.push({code:u.code,entrySha:core.hash(e),derivedStatus:a.derivedStatus,articleHash:a.article?.articleHash||null,
        claimsVerified:a.claimsVerified,sourcesTotal:a.sourcesTotal});
    }
    const signed=entries.map(({code,entrySha,derivedStatus,articleHash})=>({code,entrySha,derivedStatus,articleHash}));
    const pkg={schema:core.SCHEMA,allocationHash:m.allocationHash,
      packageHash:core.hash({allocationHash:m.allocationHash,entries:signed}),
      checkpointSizeMax:1,integration:'PENDING_REMOTE_RECONCILIATION',entries};
    core.writeOnce(core.pf(dir),pkg);return pkg;
  });
}
function gitState(repoRoot){
  const git=(...args)=>cp.execFileSync('git',args,{cwd:repoRoot,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  const branch=git('symbolic-ref','--short','HEAD');
  return {branch,headSha:git('rev-parse','HEAD'),contentManifestBlobSha:git('rev-parse','HEAD:content/manifest.json'),
    isAncestor:sha=>{try{git('merge-base','--is-ancestor',sha,'HEAD');return true;}catch{return false;}}};
}
async function plan(dir,repoRoot,{assess=canonicalAssessment,state=gitState}={}){
  const m=core.manifest(dir),i=core.inspect(dir);
  if(!i.sealed||i.invalid.length||i.orphans.length||i.missing.length)core.error('PACKAGE_NOT_READY');
  const pkg=core.read(core.pf(dir)),g=state(repoRoot);
  if(!g.branch||['main','master'].includes(g.branch))core.error('PROTECTED_BRANCH','Do not synchronize directly to production.');
  if(!g.isAncestor(m.allocation.baseCommit))core.error('BASE_CONFLICT','Assignment base no longer an ancestor.');
  if(g.contentManifestBlobSha!==m.allocation.contentManifestBlobSha)core.error('CORPUS_SNAPSHOT_CONFLICT','Reconcile before import.');
  const toCreate=[],alreadyPresent=[];
  for(const u of m.allocation.units){
    const e=core.read(core.ef(dir,u.code)),a=await assess(repoRoot,e);
    const sealed=pkg.entries.find(x=>x.code===u.code);
    if(!sealed||sealed.entrySha!==core.hash(e)||sealed.derivedStatus!==a.derivedStatus||sealed.articleHash!==(a.article?.articleHash||null))
      core.error('PACKAGE_VALIDATION_CONFLICT',u.code);
    const target=path.resolve(repoRoot,u.evidenceArtifactPath),base=path.resolve(repoRoot);
    if(!target.startsWith(base+path.sep))core.error('PATH_OUT_OF_ROOT');
    if(fs.existsSync(target)){
      if(core.hash(core.read(target))!==core.hash(e))core.error('CANONICAL_CONTENT_CONFLICT',u.code);
      alreadyPresent.push(u.code);
    }else toCreate.push({code:u.code,path:u.evidenceArtifactPath,sha256:core.hash(e)});
  }
  // This plan does not authorize writes. The single remote synchronizer must refetch Dispatcher live ownership.
  return {schema:core.SCHEMA,packageHash:pkg.packageHash,branch:g.branch,headSha:g.headSha,
    status:'REMOTE_AUTHORIZATION_REQUIRED',assignmentId:m.allocation.assignmentId,
    assignmentIssueNumber:m.allocation.assignmentIssueNumber,leaseEpoch:m.allocation.leaseEpoch,
    toCreate,alreadyPresent,mandatoryRemoteChecks:['fetch live dispatcher ledger and current assignment',
      'reject overlap with active lease, terminal, or recovery work',
      'commit all approved files in one serialized group; validate canonical R33/CI afterward',
      'record integration only when GitHub confirms exact commit SHA']};
}
async function cli(argv){
  const [operation,dir,arg,checkout]=argv;
  if(operation==='init')return core.init(dir,core.read(arg));
  if(operation==='checkpoint')return core.checkpoint(dir,core.read(arg));
  if(operation==='inspect')return core.inspect(dir);
  if(operation==='seal')return seal(dir,arg);
  if(operation==='plan')return plan(dir,arg);
  core.error('USAGE','node scripts/R4-1-buffered-farm.cjs init <buffer> <assignment.json> | checkpoint <buffer> <entry.json> | inspect <buffer> | seal <buffer> <checkout> | plan <buffer> <checkout>');
}
module.exports={canonicalAssessment,seal,plan,gitState,cli};
