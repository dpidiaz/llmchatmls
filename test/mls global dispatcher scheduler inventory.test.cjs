'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const {createOpenIssueInventoryCache}=require('../MLS R32 EDITORIAL/global dispatcher/issue inventory.js');

test('open issue inventory is read once per scheduler run and follows its own writes',async()=>{
  const cache=createOpenIssueInventoryCache();
  let reads=0;
  const fetch=async()=>{reads++;return [{number:1,state:'open',title:'one'}];};
  const first=await cache.load(fetch);
  cache.record({number:2,state:'open',title:'two'});
  cache.record({number:1,state:'open',title:'one updated'});
  cache.record({number:2,state:'closed',title:'two'});
  const second=await cache.load(fetch);
  assert.equal(reads,1);
  assert.equal(first,second);
  assert.deepEqual(second,[{number:1,state:'open',title:'one updated'}]);
});
