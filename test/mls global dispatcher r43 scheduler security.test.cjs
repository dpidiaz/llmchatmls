'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const workflow=path.join(process.cwd(),'.github','workflows','MLS R4.3 Snapshot Pilot Scheduler.yml');
const script=path.join(process.cwd(),'scripts','MLS R4.3 Snapshot Pilot Scheduler.cjs');

test('R4.3 pilot scheduler workflow is manual-only after R44 cutover',()=>{
 const text=fs.readFileSync(workflow,'utf8');
 assert.match(text,/workflow_dispatch:/);
 assert.match(text,/group: mls-r43-legacy-manual/);
 assert.doesNotMatch(text,/issues:/);
 assert.doesNotMatch(text,/schedule:/);
 assert.doesNotMatch(text,/github\.event\.issue\.author_association/);
});

test('R4.3 pilot scheduler script requires bot-owned wave authority',()=>{
 const text=fs.readFileSync(script,'utf8');
 assert.match(text,/AUTHORIZED_ASSOCIATIONS/);
 assert.match(text,/trigger\.author_association/);
 assert.match(text,/control\?\.user\?\.login!==['"]github-actions\[bot\]['"]/);
 assert.match(text,/Wave control Issue is not authoritative/);
});

test('R4.3 pilot scheduler never reconciles from a silently truncated issue inventory',()=>{
 const text=fs.readFileSync(script,'utf8');
 assert.match(text,/maxPages=20/);
 assert.match(text,/if\(!Array\.isArray\(rows\)\)/);
 assert.match(text,/if\(rows\.length<100\)return out/);
 assert.match(text,/Issue inventory exceeds safe pagination bound/);
 assert.doesNotMatch(text,/page<=5/);
});

test('R4.3 pilot scheduler shares GitHub cooldown and fails closed on 403/429',()=>{
 const text=fs.readFileSync(script,'utf8');
 assert.match(text,/r4 github backoff\.cjs/);
 assert.match(text,/backoff\.check\(process\.env\.MLS_GITHUB_COOLDOWN_FILE\)/);
 assert.match(text,/\[403,429\]\.includes\(res\.status\)/);
 assert.match(text,/backoff\.record\(process\.env\.MLS_GITHUB_COOLDOWN_FILE,res\)/);
 assert.doesNotMatch(text,/for\s*\([^\n]*(403|429)/);
 assert.doesNotMatch(text,/while\s*\([^\n]*(403|429)/);
});
