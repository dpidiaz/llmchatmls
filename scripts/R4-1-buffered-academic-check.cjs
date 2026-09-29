'use strict';
const fs=require('node:fs'),path=require('node:path');
const core=require('../MLS R32 EDITORIAL/r4 buffered core.cjs');
const academic=require('../MLS R32 EDITORIAL/r4 buffered academic.cjs');
const [buffer,repo='.']=process.argv.slice(2);
if(!buffer)throw Error('Usage: node scripts/R4-1-buffered-academic-check.cjs <buffer-dir> [checkout]');
const m=core.manifest(buffer),results=[];
for(const u of m.allocation.units){
 if(!/^content\/[A-Za-z0-9._/-]+$/.test(u.contentPath)||u.contentPath.split('/').includes('..'))throw Error('Unsafe path: '+u.contentPath);
 const entry=core.read(core.ef(buffer,u.code));
 const article=JSON.parse(fs.readFileSync(path.join(repo,u.contentPath),'utf8'));
 results.push(academic.inspect(entry,article));
}
const errors=results.flatMap(r=>r.errors.map(e=>r.code+':'+e));
process.stdout.write(JSON.stringify({kind:'MLS_R41_ACADEMIC_TRACEABILITY',entries:results.length,
 ok:!errors.length,errors,disclaimer:'Structure does not prove the cited source supports a claim.'},null,2)+'\n');
if(errors.length)process.exitCode=2;
