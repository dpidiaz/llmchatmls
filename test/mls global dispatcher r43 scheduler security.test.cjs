'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const workflow=path.join(process.cwd(),'.github','workflows','MLS R4.3 Snapshot Pilot Scheduler.yml');
const script=path.join(process.cwd(),'scripts','MLS R4.3 Snapshot Pilot Scheduler.cjs');

test('R4.3 pilot scheduler workflow only wakes for authorized issue authors',()=>{
 const text=fs.readFileSync(workflow,'utf8');
 assert.match(text,/OWNER/);
 assert.match(text,/MEMBER/);
 assert.match(text,/COLLABORATOR/);
 assert.match(text,/github\.event\.issue\.author_association/);
 assert.match(text,/MLS_BCR_R43_REQUEST/);
 assert.match(text,/MLS_BCR_R43_RESULT/);
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
