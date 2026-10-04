'use strict';

const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');
const {semanticRecoveryState,verifySources}=require('../scripts/verificar recuperacion git.js');

test('GitHub recovery sources are complete or explicitly degrade only a stale semantic derivative',()=>{
  const previous=process.env.MLS_DERIVED_STALE_POLICY;
  process.env.MLS_DERIVED_STALE_POLICY='degrade';
  try{
    const r=verifySources();
    assert.equal(r.canonicalEntries,10133);
    assert.equal(r.canonicalLanguages,10);
    if(r.semanticDegraded){
      assert.equal(r.semanticReason,'corpus_mismatch');
      assert.equal(r.semanticEntries,null);
      assert.equal(r.semanticChunks,null);
      assert.equal(r.semanticLanguages,null);
      assert.equal(r.semanticModel,null);
    }else{
      assert.equal(r.semanticEntries,10133);
      assert.equal(r.semanticChunks,10669);
      assert.equal(r.semanticLanguages,10);
      assert.equal(r.semanticModel,'@cf/baai/bge-m3');
    }
    assert.ok(r.bundleEntries>0);
  }finally{
    if(previous===undefined)delete process.env.MLS_DERIVED_STALE_POLICY;
    else process.env.MLS_DERIVED_STALE_POLICY=previous;
  }
});

test('semantic recovery degrades only corpus mismatch under explicit policy',()=>{
  assert.deepEqual(
    semanticRecoveryState({complete:false,reason:'corpus_mismatch'},{policy:'degrade'}),
    {degraded:true,reason:'corpus_mismatch'}
  );
  assert.throws(
    ()=>semanticRecoveryState({complete:false,reason:'manifest_missing'},{policy:'degrade'}),
    /Índice semántico fuente incompleto: manifest_missing/
  );
  assert.throws(
    ()=>semanticRecoveryState({complete:false,reason:'corpus_mismatch'},{policy:'strict'}),
    /Índice semántico fuente incompleto: corpus_mismatch/
  );
});

test('production CI certifies disaster recovery after predeploy with the same degrade policy',()=>{
  const workflow=fs.readFileSync('.github/workflows/produccion.yml','utf8');
  const predeploy=workflow.indexOf('npm run predeploy');
  const recovery=workflow.indexOf('npm run recovery:verify');
  assert.ok(predeploy>=0,'produccion debe ejecutar predeploy');
  assert.ok(recovery>predeploy,'recovery:verify debe ejecutarse después de predeploy');
  assert.match(
    workflow,
    /- run: npm run recovery:verify\n\s+env:\n\s+MLS_DERIVED_STALE_POLICY: degrade/,
    'recovery:verify debe heredar la política degrade explícita'
  );
});
