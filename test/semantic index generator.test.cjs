'use strict';

const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const test=require('node:test');
const assert=require('node:assert/strict');
const {
  MODEL,VERSION,recordsForArticle,normalizeVector,quantizeVector,dequantizedDot,
  embeddingRows,existingLanguageIsCurrent,buildManifest
}=require('../scripts/generar indice semantico.js');

test('semantic generator uses multilingual bge-m3 with versioned output',()=>{
  assert.equal(MODEL,'@cf/baai/bge-m3');
  assert.equal(VERSION,'1.0');
});

test('semantic records preserve entry identity and section context',()=>{
  const article={
    code:'MLS-V02-0001',language:'portugues',n:1,title:'Substantivos',level:'A1',
    part:'Morfologia',chapter:'Nomes',
    articleMarkdown:'#### Conceito\n\nUm substantivo nomeia entidades.\n\n#### Número\n\nPode variar em singular e plural.'
  };
  const records=recordsForArticle(article);
  assert.ok(records.length>=1);
  assert.ok(records.every(x=>x.code===article.code&&x.language==='portugues'));
  assert.ok(records.every(x=>x.text.includes('Substantivos')&&x.text.includes('Morfologia')));
});

test('int8 quantization preserves cosine ranking approximately',()=>{
  const docA=normalizeVector([1,0.4,-0.2,0.1]);
  const docB=normalizeVector([-0.4,0.1,0.8,0.2]);
  const query=normalizeVector([0.9,0.35,-0.1,0.05]);
  const qa=quantizeVector(docA).buffer;
  const qb=quantizeVector(docB).buffer;
  const a=dequantizedDot(qa,0,4,query);
  const b=dequantizedDot(qb,0,4,query);
  assert.ok(a>b);
  assert.ok(a>0.9);
});

test('Cloudflare embedding response parser accepts nested and flat shapes',()=>{
  assert.deepEqual(embeddingRows({result:{data:[[1,2],[3,4]],shape:[2,2]}}),[[1,2],[3,4]]);
  assert.deepEqual(embeddingRows({result:{data:[1,2,3,4],shape:[2,2]}}),[[1,2],[3,4]]);
});

test('semantic manifest requires all ten current language artifacts',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mls-semantic-manifest-'));
  try{
    assert.equal(buildManifest(dir),null);
  }finally{fs.rmSync(dir,{recursive:true,force:true})}
});

test('existing semantic language check rejects missing artifacts',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mls-semantic-current-'));
  try{
    assert.equal(existingLanguageIsCurrent({slug:'ingles',total:766},'x',dir),false);
  }finally{fs.rmSync(dir,{recursive:true,force:true})}
});


test('semantic metadata includes language identity fields',()=>{
  const source=fs.readFileSync('scripts/generar indice semantico.js','utf8');
  assert.match(source,/language:language\.slug/);
  assert.match(source,/languageName:language\.name/);
});
