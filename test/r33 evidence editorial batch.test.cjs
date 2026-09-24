'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const store=require('../MLS R32 EDITORIAL/evidence git.js');

test('R33 editorial Evidence validates without requiring derived indexes to be current',async()=>{
  const result=await store.validateStore('.');
  assert.equal(result.architecture,'github-native');
  assert.equal(result.sourceOfTruth,'github');
  assert.equal(result.cloudflareEditorialInteractions,0);
  assert.equal(result.d1Reads,0);
  assert.equal(result.d1Writes,0);
  assert.equal(result.ok,true,JSON.stringify(result.errors,null,2));
  assert.equal(result.errors.length,0,JSON.stringify(result.errors,null,2));
  assert.equal(result.verified+result.reviewed,result.entries);
});
