'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const script=fs.readFileSync(path.join(process.cwd(),'scripts','MLS R4.3 R33 Gate Audit.cjs'),'utf8');
const workflow=fs.readFileSync(path.join(process.cwd(),'.github','workflows','MLS R4.3 R33 Gate Audit.yml'),'utf8');

test('R4.3 R33 audit is read-only and uses canonical decoders',()=>{
 assert.match(script,/remoteScheduler\.reconstruct/);
 assert.match(script,/remoteResult\.collectResults/);
 assert.match(script,/reconciliationHash/);
 assert.doesNotMatch(script,/method:\s*['"](?:POST|PATCH|PUT|DELETE)['"]/i);
 assert.doesNotMatch(script,/createIssue|updateIssue|deleteIssue/);
});

test('R4.3 R33 audit workflow is narrow and read-only',()=>{
 assert.match(workflow,/issues:\s*read/);
 assert.match(workflow,/contents:\s*read/);
 assert.doesNotMatch(workflow,/issues:\s*write/);
 assert.match(workflow,/\[MLS R4\.3\]\[R33\]\[AUDIT\] 2208/);
 assert.match(workflow,/MLS_R43_R33_AUDIT_WAVE_ISSUE: '2208'/);
 assert.doesNotMatch(workflow,/workflow_dispatch:|schedule:|push:/);
});
