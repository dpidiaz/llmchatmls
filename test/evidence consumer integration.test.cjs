'use strict';
const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const assert=require('node:assert/strict');
const {patchWorker}=require('../scripts/habilitar virtuoso.js');
const {buildChatRuntime,augmentEditorialOpenApi}=require('../scripts/habilitar chat editorial.js');
const {patchRuntime,MARKER}=require('../scripts/habilitar consumidores evidence.js');

function runtimeBeforeConsumer(){
  const worker=fs.readFileSync(path.join(__dirname,'..','MLS R32 OVERLAY/index.js'),'utf8');
  const html=fs.readFileSync(path.join(__dirname,'..','MLS R32 OVERLAY/virtuoso.html'),'utf8');
  return patchWorker(worker,html)+buildChatRuntime(path.join(__dirname,'..'));
}

test('Evidence consumer integration: build bundles consumer module before wiring clients',()=>{
  const before=runtimeBeforeConsumer();
  assert.match(before,/var MLS_EVIDENCE_CONSUMER=/);
  const patched=patchRuntime(before);
  assert.ok(patched.includes(MARKER));
  assert.match(patched,/MLS_EVIDENCE_CONSUMER\.contextForEntry\(env, body\.entry\?\.code\)/);
  assert.match(patched,/MLS_EVIDENCE_CONSUMER\.professorGuidance\(evidenceConsumerContext\)/);
  assert.match(patched,/MLS_EVIDENCE_CONSUMER\.contextsForEntries\(env, validated\.map/);
  assert.match(patched,/entry\.evidence = MLS_EVIDENCE_CONSUMER\.virtuosoLabel/);
  assert.equal(patchRuntime(patched),patched);
});

test('Evidence consumer integration: Virtuoso exposes state but does not rank by Evidence',()=>{
  const patched=patchRuntime(runtimeBeforeConsumer());
  assert.match(patched,/Evidence es informativo y no cambia el ranking por sí solo/);
  assert.match(patched,/UNSOURCED o SOURCED nunca significan verificado/);
  assert.match(patched,/evidence: entry\.evidence/);
  assert.doesNotMatch(patched,/sort\([^\n]*evidence/i);
});

test('Evidence consumer integration: package predeploy installs contract after private Evidence runtime',()=>{
  const pkg=JSON.parse(fs.readFileSync(path.join(__dirname,'..','package.json'),'utf8'));
  const cmd=pkg.scripts.predeploy;
  const editorial=cmd.indexOf("node 'scripts/habilitar chat editorial.js'");
  const consumer=cmd.indexOf("node 'scripts/habilitar consumidores evidence.js'");
  assert.ok(editorial>=0&&consumer>editorial);
});

test('Evidence consumer integration: private OpenAPI allows REVIEWED only through identified human review',()=>{
  const raw=fs.readFileSync(path.join(__dirname,'..','MLS R32 EDITORIAL/chat openapi.json'),'utf8');
  const api=JSON.parse(augmentEditorialOpenApi(raw));
  const schema=api.paths['/api/wiki/editorial/evidence/review'].post.requestBody.content['application/json'].schema;
  assert.deepEqual(schema.properties.reviewerType.enum,['human']);
  assert.ok(schema.required.includes('reviewer'));
  assert.match(api.paths['/api/wiki/editorial/evidence/review'].post.summary,/humana/i);
});
