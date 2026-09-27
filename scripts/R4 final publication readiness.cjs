'use strict';

const fs=require('node:fs');
const mls=require('../MLS R32 EDITORIAL/farm core.js');

const corpus=mls.corpusEntries('.');
const expected=new Set(corpus.map(x=>String(x.code).toUpperCase()));
const verifiedPath='MLS R32 EDITORIAL/evidence git/indexes/verified.json';
const verified=new Set(JSON.parse(fs.readFileSync(verifiedPath,'utf8')).map(x=>String(x).toUpperCase()));
const missing=[...expected].filter(code=>!verified.has(code)).sort();
const extra=[...verified].filter(code=>!expected.has(code)).sort();
const result={corpus:expected.size,verified:verified.size,missing:missing.length,extra:extra.length,ready:missing.length===0&&extra.length===0};
process.stdout.write(JSON.stringify(result)+'\n');
if(!result.ready){
  process.stderr.write('R4 final publication blocked: corpus is not complete. Missing='+missing.length+' extra='+extra.length+'\n');
  if(missing.length)process.stderr.write('First missing: '+missing.slice(0,20).join(', ')+'\n');
  process.exitCode=2;
}
