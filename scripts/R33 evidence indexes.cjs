'use strict';

const fs=require('node:fs');
const path=require('node:path');
const store=require('../MLS R32 EDITORIAL/evidence git.js');

const root=process.cwd();
const mode=process.argv.includes('--write')?'write':'check';
const files={
  byCode:'MLS R32 EDITORIAL/evidence git/indexes/by-code.json',
  byLanguage:'MLS R32 EDITORIAL/evidence git/indexes/by-language.json',
  bySource:'MLS R32 EDITORIAL/evidence git/indexes/by-source.json',
  verified:'MLS R32 EDITORIAL/evidence git/indexes/verified.json'
};
function stableText(value){return JSON.stringify(value,null,2)+'\n';}
function readJson(rel){return JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'));}

(async()=>{
  const canonical=store.buildIndexes(root);
  const drift=[];
  for(const [key,rel] of Object.entries(files)){
    const actual=readJson(rel);
    if(JSON.stringify(actual)!==JSON.stringify(canonical[key]))drift.push(rel);
  }
  if(mode==='write'){
    store.writeIndexes(root);
  }else if(drift.length){
    console.error(JSON.stringify({ok:false,mode,drift},null,2));
    process.exitCode=1;
    return;
  }
  const report=await store.validateStore(root);
  const after=store.buildIndexes(root);
  const summary={
    ok:report.ok,
    mode,
    driftBefore:drift,
    entries:report.entries,
    verified:report.verified,
    reviewed:report.reviewed,
    sources:report.sources,
    cloudflareEditorialInteractions:report.cloudflareEditorialInteractions,
    d1Reads:report.d1Reads,
    d1Writes:report.d1Writes,
    indexedCodes:Object.keys(after.byCode).length
  };
  console.log(JSON.stringify(summary,null,2));
  if(!report.ok)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
