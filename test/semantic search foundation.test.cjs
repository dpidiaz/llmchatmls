'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const {DIMS,mergeSections,analyzeSemanticCorpus}=require('../scripts/analizar indice semantico.js');

test('semantic chunking preserves natural sections and bounded pieces',()=>{
  const md='#### Uno\n\nTexto breve sobre sustantivos.\n\n#### Dos\n\nOtro bloque relacionado con género y número.';
  const chunks=mergeSections(md);
  assert.ok(chunks.length>=1);
  assert.ok(chunks.every(x=>x.length>0));
});

test('semantic corpus analysis measures the complete canonical corpus',()=>{
  const report=analyzeSemanticCorpus();
  assert.equal(report.totalEntries,10133);
  assert.equal(Object.keys(report.languages).length,10);
  assert.equal(report.dimensions,DIMS);
  assert.ok(report.totalChars>0);
  assert.ok(report.totalChunks>=report.totalEntries);
  console.log('SEMANTIC_CORPUS_REPORT '+JSON.stringify(report));
});
