'use strict';

const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');
const {verifySources}=require('../scripts/verificar recuperacion git.js');

test('GitHub recovery sources are complete and self-consistent',()=>{
  const r=verifySources();
  assert.equal(r.canonicalEntries,10133);
  assert.equal(r.canonicalLanguages,10);
  assert.equal(r.semanticEntries,10133);
  assert.equal(r.semanticChunks,10669);
  assert.equal(r.semanticLanguages,10);
  assert.equal(r.semanticModel,'@cf/baai/bge-m3');
  assert.ok(r.bundleEntries>0);
});

test('production CI certifies disaster recovery after predeploy',()=>{
  const workflow=fs.readFileSync('.github/workflows/produccion.yml','utf8');
  const predeploy=workflow.indexOf('npm run predeploy');
  const recovery=workflow.indexOf('npm run recovery:verify');
  assert.ok(predeploy>=0,'produccion debe ejecutar predeploy');
  assert.ok(recovery>predeploy,'recovery:verify debe ejecutarse después de predeploy');
});
