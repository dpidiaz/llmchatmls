'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const {titleIssues,auditTitles}=require('../scripts/auditar titulos canonicos.cjs');
const manifest=JSON.parse(fs.readFileSync('content/manifest.json','utf8'));
const {corrections}=JSON.parse(fs.readFileSync('docs/editorial/canonical title corrections.json','utf8'));
const hash=value=>crypto.createHash('sha256').update(value,'utf8').digest('hex');

test('all 10133 canonical titles pass structural checks across ten languages',()=>{
  const result=auditTitles(manifest);
  assert.equal(result.totalEntries,10133);
  assert.equal(Object.keys(result.byLanguage).length,10);
  assert.deepEqual(result.issues,[]);
});
test('generic headings and placeholders fail while real grammar terms remain valid',()=>{
  for(const title of ['Definición','Descripción','Sus clases','Características generales','Concepto y tipos','Examples','Definition','定義','TBD','<h1>Título</h1>'])assert.ok(titleIssues(title).length,title);
  for(const title of ['Complemento directo','Negación','Sujeto','Descripción en pasado con imparfait','Numerales: definición y clases','Aspectos sintácticos de las interjecciones','h','了'])assert.deepEqual(titleIssues(title),[],title);
});
test('all reviewed title corrections preserve canonical bodies and historical Evidence bindings',()=>{
  assert.equal(corrections.length,27);
  for(const correction of corrections){
    const raw=fs.readFileSync('content/'+correction.path,'utf8').replace(/\r\n/g,'\n');
    const article=JSON.parse(raw);
    const item=manifest.entries.find(e=>e.code===correction.code);
    assert.equal(article.title,correction.title,correction.code);
    assert.equal(item.title,article.title,correction.code);
    assert.equal(item.sha256,hash(raw),correction.code);
    assert.equal(item.bytes,Buffer.byteLength(raw),correction.code);
    assert.equal(hash(article.articleMarkdown),correction.articleMarkdownSha256,correction.code);
    assert.equal(article.generatedAt,correction.generatedAt,correction.code);
    assert.equal(article.chapter,correction.chapter,correction.code);
    const evidencePath='MLS R32 EDITORIAL/evidence git/entries/'+article.language+'/'+article.code+'.json';
    if(fs.existsSync(evidencePath)){
      const evidence=JSON.parse(fs.readFileSync(evidencePath,'utf8'));
      assert.equal(evidence.article.articleHash,hash(article.articleMarkdown.trim()),correction.code);
      assert.equal(evidence.article.articleGeneratedAt,article.generatedAt,correction.code);
    }
  }
});
test('the reported direct-object entry has a standalone descriptive title',()=>{
  assert.equal(manifest.entries.find(e=>e.code==='MLS-V10-0572').title,'Complemento directo');
});

test('Gate pool hash updates reproduce the previous blob by restoring only the title',()=>{
  const audit=JSON.parse(fs.readFileSync('docs/editorial/canonical title corrections.json','utf8'));
  const blob=value=>crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+Buffer.byteLength(value)+'\0'),Buffer.from(value)])).digest('hex');
  assert.equal(audit.poolMetadataUpdates.changes.length,7);
  for(const update of audit.poolMetadataUpdates.changes){
    const correction=corrections.find(c=>c.code===update.code);
    const pool=JSON.parse(fs.readFileSync(update.poolPath,'utf8'));
    const entry=pool.entries.find(e=>e.code===update.code);
    const raw=fs.readFileSync(entry.contentPath,'utf8').replace(/\r\n/g,'\n');
    assert.equal(blob(raw),update.contentBlobSha,update.code);
    assert.equal(entry.contentBlobSha,update.contentBlobSha,update.code);
    assert.equal(blob(raw.replace(JSON.stringify(correction.title),JSON.stringify(correction.oldTitle))),update.previousContentBlobSha,update.code);
  }
});

test('every canonical catalog title matches its article title',()=>{
  for(const item of manifest.entries){
    const article=JSON.parse(fs.readFileSync('content/'+item.path,'utf8'));
    assert.equal(item.title,article.title,item.code);
  }
});
