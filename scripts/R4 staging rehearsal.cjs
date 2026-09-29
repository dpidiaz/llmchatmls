'use strict';

const fs=require('node:fs');
const path=require('node:path');
const core=require('../MLS R32 EDITORIAL/global dispatcher/core.js');
const integration=require('../MLS R32 EDITORIAL/global dispatcher/providers/integration.js');
const r33=require('../MLS R32 EDITORIAL/global dispatcher/providers/r33.js');
const mls=require('../MLS R32 EDITORIAL/farm core.js');
const store=require('../MLS R32 EDITORIAL/evidence git.js');
const revision=require('../MLS R32 EDITORIAL/r4 staging supersession.cjs');

function die(message){throw new Error(message);}
async function gh(url,token){
  const response=await fetch(url,{headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+token,'X-GitHub-Api-Version':'2022-11-28'}});
  if(!response.ok)die('GitHub '+response.status+' '+url+': '+await response.text());
  return response.json();
}
async function ledgerFromIssues(api,token){
  for(let page=1;page<=10;page++){
    const issues=await gh(api+'/issues?state=open&per_page=100&page='+page,token);
    for(const issue of issues){
      const ledger=core.parseLedger(issue.body||'');
      if(ledger)return ledger;
    }
    if(issues.length<100)break;
  }
  die('Global Dispatcher ledger issue not found.');
}
async function fetchText(api,token,commitSha,repoPath){
  const url=api+'/contents/'+repoPath.split('/').map(encodeURIComponent).join('/')+'?ref='+encodeURIComponent(commitSha);
  const payload=await gh(url,token);
  if(payload.encoding!=='base64'||typeof payload.content!=='string')die('Evidence content unavailable for '+repoPath+' @ '+commitSha);
  return Buffer.from(payload.content.replace(/\n/g,''),'base64').toString('utf8');
}
async function main(){
  const token=process.env.GITHUB_TOKEN;
  const repository=process.env.GITHUB_REPOSITORY;
  if(!token||!repository)die('GITHUB_TOKEN/GITHUB_REPOSITORY required.');
  const api='https://api.github.com/repos/'+repository;
  const ledger=await ledgerFromIssues(api,token);
  const manifest=integration.r33StagingManifest(ledger,{root:'.'});
  const corpus=mls.corpusEntries('.');
  const byCode=new Map(corpus.map(entry=>[String(entry.code).toUpperCase(),entry]));
  // Pinned supplemental assets only; this workflow works in an ephemeral rehearsal checkout.
  let supplementalAssets=0;
  for(const asset of manifest.assetRefs||[]){
    if(!revision.safeAsset(asset.path,manifest.entries.map(e=>e.code))||
       !/^[a-f0-9]{40}$/i.test(asset.commitSha))die('INVALID_REVISION_ASSET: '+asset.path);
    const contents=await fetchText(api,token,asset.commitSha,asset.path);
    JSON.parse(contents);
    const destination=path.join('.',asset.path);
    fs.mkdirSync(path.dirname(destination),{recursive:true});
    fs.writeFileSync(destination,contents.endsWith('\n')?contents:contents+'\n');
    supplementalAssets++;
  }
  let materialized=0;
  for(const row of manifest.entries){
    const entry=byCode.get(row.code);
    if(!entry)die('Corpus entry missing for '+row.code);
    if(!/^[a-f0-9]{40}$/i.test(row.commitSha))die('Certified commit SHA missing for '+row.code);
    const artifactPath=r33.evidenceArtifactPath({code:row.code,language:entry.language});
    const text=await fetchText(api,token,row.commitSha,artifactPath);
    JSON.parse(text);
    const absolute=path.join('.',artifactPath);
    fs.mkdirSync(path.dirname(absolute),{recursive:true});
    fs.writeFileSync(absolute,text.endsWith('\n')?text:text+'\n');
    materialized++;
  }
  const validation=await store.validateStore('.');
  if(validation&&validation.ok===false)die('R33 rehearsal validation failed.');
  const indexes=store.writeIndexes('.');
  // Report unresolved academic holds transparently. This rehearsal remains structural;
  // publication readiness separately blocks final release while any hold is active.
  const holdsFile='MLS R32 EDITORIAL/evidence git/quality-holds.json';
  const holdInventory=fs.existsSync(holdsFile)?JSON.parse(fs.readFileSync(holdsFile,'utf8')):null;
  if(holdInventory&&(holdInventory.schemaVersion!=='1.0'||holdInventory.kind!=='mls_r33_publication_quality_holds'||!Array.isArray(holdInventory.holds)))
    die('R4_ACADEMIC_HOLD_INVENTORY_INVALID');
  const activeHolds=(holdInventory?.holds||[]).filter(h=>h.status==='active');
  const output={...manifest,materialized,supplementalAssets,indexedVerified:Array.isArray(indexes.verified)?indexes.verified.length:null,
    academicHoldCount:activeHolds.length,academicHoldWorkIds:activeHolds.map(h=>h.workId),
    rehearsal:activeHolds.length?'STRUCTURAL_PASS_ACADEMIC_HOLD':'PASS'};
  fs.mkdirSync('artifacts',{recursive:true});
  fs.writeFileSync('artifacts/r4-rehearsal-manifest.json',JSON.stringify(output,null,2)+'\n');
  process.stdout.write(JSON.stringify({ok:true,entryCount:manifest.entryCount,snapshotHash:manifest.snapshotHash,materialized,supplementalAssets,academicHoldCount:activeHolds.length})+'\n');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
