const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const store=require('../MLS R32 EDITORIAL/evidence git.js');

test('GitHub-native Evidence store is complete and validates without Cloudflare',async()=>{
  const r=await store.validateStore('.');
  assert.equal(r.architecture,'github-native');
  assert.equal(r.sourceOfTruth,'github');
  assert.equal(r.cloudflareEditorialInteractions,0);
  assert.equal(r.d1Reads,0);
  assert.equal(r.d1Writes,0);
  assert.equal(r.entries,100);
  assert.equal(r.verified,100);
  assert.equal(r.errors.length,0,JSON.stringify(r.errors,null,2));
  assert.ok(r.sources>=30);
});
test('GitHub-native store binds every Evidence artifact to the canonical article hash',async()=>{
  const index=JSON.parse(fs.readFileSync('MLS R32 EDITORIAL/evidence git/indexes/by-code.json','utf8'));
  assert.equal(Object.keys(index).length,100);
  for(const meta of Object.values(index)){
    const entry=JSON.parse(fs.readFileSync(meta.path,'utf8'));
    const current=await store.currentArticle('.',entry.contentPath);
    assert.equal(current.articleHash,entry.article.articleHash,entry.code);
    assert.equal(current.articleGeneratedAt,entry.article.articleGeneratedAt,entry.code);
  }
});
test('Evidence Git module has no Cloudflare/D1/runtime-network dependency',()=>{
  const src=fs.readFileSync('MLS R32 EDITORIAL/evidence git.js','utf8');
  assert.doesNotMatch(src,/WIKI_DB|workers\.dev|wrangler|cloudflare|fetch\s*\(/i);
});
test('Indexes are derivable from canonical Evidence files',()=>{
  const x=store.buildIndexes('.');
  const byCode=JSON.parse(fs.readFileSync('MLS R32 EDITORIAL/evidence git/indexes/by-code.json','utf8'));
  const verified=JSON.parse(fs.readFileSync('MLS R32 EDITORIAL/evidence git/indexes/verified.json','utf8'));
  assert.deepEqual(x.byCode,byCode);
  assert.deepEqual(x.verified,verified);
});
