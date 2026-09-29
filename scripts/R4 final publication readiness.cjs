'use strict';

const fs=require('node:fs');
const mls=require('../MLS R32 EDITORIAL/farm core.js');

const corpus=mls.corpusEntries('.');
const expected=new Set(corpus.map(x=>String(x.code).toUpperCase()));
const verifiedPath='MLS R32 EDITORIAL/evidence git/indexes/verified.json';
const verified=new Set(JSON.parse(fs.readFileSync(verifiedPath,'utf8')).map(x=>String(x).toUpperCase()));
const missing=[...expected].filter(code=>!verified.has(code)).sort();
const extra=[...verified].filter(code=>!expected.has(code)).sort();

const holdPath='MLS R32 EDITORIAL/evidence git/quality-holds.json';
const inventory=fs.existsSync(holdPath)?JSON.parse(fs.readFileSync(holdPath,'utf8')):null;
if(inventory&&(inventory.schemaVersion!=='1.0'||inventory.kind!=='mls_r33_publication_quality_holds'||!Array.isArray(inventory.holds)))
 throw Error('R4_ACADEMIC_HOLD_INVENTORY_INVALID');
const academicHolds=(inventory?.holds||[]).filter(x=>x.status==='active');
if(academicHolds.some(h=>!/^r33-buffer:MLS-BUFFER-\d{6}$/.test(h.workId||'')||!Array.isArray(h.codes)||
 h.codes.length<1||!/^[a-f0-9]{40}$/i.test(h.commitSha||'')))
 throw Error('R4_ACADEMIC_HOLD_INVALID');

const result={corpus:expected.size,verified:verified.size,missing:missing.length,extra:extra.length,
 academicHolds:academicHolds.length,heldCodes:[...new Set(academicHolds.flatMap(h=>h.codes))].sort(),
 ready:missing.length===0&&extra.length===0&&academicHolds.length===0};
process.stdout.write(JSON.stringify(result)+'\n');
if(!result.ready){
 process.stderr.write('R4 final publication blocked: missing='+missing.length+' extra='+extra.length+'\n');
 if(academicHolds.length)process.stderr.write('Academic quality holds active: '+academicHolds.map(h=>h.workId).join(', ')+'\n');
 if(missing.length)process.stderr.write('First missing: '+missing.slice(0,20).join(', ')+'\n');
 process.exitCode=2;
}
