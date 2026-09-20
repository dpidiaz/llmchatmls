'use strict';

const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const test=require('node:test');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {normalizeText,tokenizeText,buildFullTextSearch}=require('../scripts/generar indice full text.js');
const {patchSearch,MARKER}=require('../scripts/habilitar busqueda full text.js');

const archive=path.resolve('MASTER LANGUAGE SYSTEM REVISION 32 BUNDLE.tar.gz');

function shellSearch(){
  return execFileSync('tar',['-xOzf',archive,'public/js/search.js'],{encoding:'utf8'});
}

test('full-text normalization folds accents without splitting the word',()=>{
  assert.equal(normalizeText('Pretérito perfecto','es-GT'),'preterito perfecto');
  assert.deepEqual(tokenizeText('Pretérito perfecto','es-GT'),['preterito','perfecto']);
});

test('tokenizer supports multilingual scripts without paid services',()=>{
  assert.ok(tokenizeText('subjunctive clause','en').length>=2);
  assert.ok(tokenizeText('сложное предложение','ru').length>=2);
  assert.ok(tokenizeText('日本語の文法','ja').length>=1);
  assert.ok(tokenizeText('臺灣華語語法','zh-TW').length>=1);
  assert.ok(tokenizeText('한국어 문법','ko').length>=1);
});

test('canonical index builder creates compact postings from R32 content',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'mls-fulltext-test-'));
  const source=path.join(root,'content');
  const output=path.join(root,'search');
  fs.mkdirSync(path.join(source,'ingles'),{recursive:true});
  fs.writeFileSync(path.join(source,'manifest.json'),JSON.stringify({standard:'MLS R32',promptVersion:'32.0'})+'\n');
  const language={slug:'ingles',name:'Inglés',total:2,prefix:'MLS-V01'};
  const docs=[
    {
      code:'MLS-V01-0001',language:'ingles',languageName:'Inglés',n:1,title:'Past perfect',
      level:'B1',part:'Verbs',chapter:'Past tenses',
      articleMarkdown:'#### En pocas palabras\n\nThe past perfect describes an action before another past action. Pretérito anterior como contraste.',
      provider:'cloudflare-workers-ai',auditProvider:null,promptVersion:'32.0'
    },
    {
      code:'MLS-V01-0002',language:'ingles',languageName:'Inglés',n:2,title:'Subjunctive mood',
      level:'B2',part:'Verbs',chapter:'Moods',
      articleMarkdown:'#### En pocas palabras\n\nThe subjunctive expresses wishes, demands and hypothetical situations.',
      provider:'cloudflare-workers-ai',auditProvider:null,promptVersion:'32.0'
    }
  ];
  for(const doc of docs)fs.writeFileSync(path.join(source,'ingles',doc.code+'.json'),JSON.stringify(doc));
  try{
    const health=buildFullTextSearch({sourceRoot:source,outputRoot:output,languages:[language]});
    assert.equal(health.totalEntries,2);
    assert.equal(health.languages,1);
    const index=JSON.parse(fs.readFileSync(path.join(output,'ingles.json'),'utf8'));
    assert.equal(index.standard,'MLS R32');
    assert.deepEqual(index.codes,['MLS-V01-0001','MLS-V01-0002']);
    assert.ok(Array.isArray(index.postings['preterito']));
    assert.ok(Array.isArray(index.postings['subjunctive']));
    assert.ok(fs.statSync(path.join(output,'ingles.json')).size<20*1024*1024);
  }finally{
    fs.rmSync(root,{recursive:true,force:true});
  }
});

test('search patch replaces volume scan with canonical static full-text index',()=>{
  const original=shellSearch();
  assert.match(original,/MLS\.loadVolume\(slug\)/);
  const patched=patchSearch(original);
  assert.ok(patched.includes(MARKER));
  assert.doesNotMatch(patched,/MLS\.loadVolume\(slug\)/);
  assert.match(patched,/data\/search\//);
  assert.match(patched,/Math\.log\(\(index\.totalEntries\+1\)\/\(df\+1\)\)\+1/);
  assert.match(patched,/baseSearch\(q,lang,level,part,chapter\)/);
  assert.doesNotMatch(patched,/\/api\//);
  assert.equal(patchSearch(patched),patched);
});

test('predeploy installs full-text engine after shell numbering and builds index from canonical content',()=>{
  const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
  const p=pkg.scripts.predeploy;
  const numbering=p.indexOf("node 'scripts/aplicar numeracion visible.js'");
  const patch=p.indexOf("node 'scripts/habilitar busqueda full text.js'");
  const compat=p.indexOf("node 'scripts/generar datos canonicos compatibles.js'");
  const index=p.indexOf("node 'scripts/generar indice full text.js'");
  assert.ok(numbering>=0&&patch>numbering,'El parche full-text debe ejecutarse después de numeración.');
  assert.ok(compat>=0&&index>compat,'El índice full-text debe generarse después de los datos canónicos compatibles.');
});
