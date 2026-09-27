'use strict';

const fs=require('node:fs');
const path=require('node:path');
const core=require('../MLS R32 EDITORIAL/global dispatcher/core.js');
const integration=require('../MLS R32 EDITORIAL/global dispatcher/providers/integration.js');
const r33=require('../MLS R32 EDITORIAL/global dispatcher/providers/r33.js');
const mls=require('../MLS R32 EDITORIAL/farm core.js');
const store=require('../MLS R32 EDITORIAL/evidence git.js');

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
  const manifest=integration.r33StagingManifest(ledger);
  const corpus=mls.corpusEntries('.');
  const byCode=new Map(corpus.map(entry=>[String(entry.code).toUpperCase(),entry]));
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
  const output={...manifest,materialized,indexedVerified:Array.isArray(indexes.verified)?indexes.verified.length:null,rehearsal:'PASS'};
  fs.mkdirSync('artifacts',{recursive:true});
  fs.writeFileSync('artifacts/r4-rehearsal-manifest.json',JSON.stringify(output,null,2)+'\n');
  process.stdout.write(JSON.stringify({ok:true,entryCount:manifest.entryCount,snapshotHash:manifest.snapshotHash,materialized})+'\n');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
