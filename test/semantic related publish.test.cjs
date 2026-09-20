'use strict';

const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const crypto=require('node:crypto');
const test=require('node:test');
const assert=require('node:assert/strict');
const {LANGUAGES}=require('../scripts/exportar corpus canonico.js');
const {validateRelatedSource,publishRelated}=require('../scripts/publicar vecinos semanticos.js');

function sha(value){return crypto.createHash('sha256').update(value).digest('hex')}
function makeFixture(){
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'mls-related-'));
  const canonical=path.join(root,'content');
  const related=path.join(root,'related');
  const published=path.join(root,'public');
  fs.mkdirSync(canonical,{recursive:true});
  fs.mkdirSync(related,{recursive:true});
  fs.writeFileSync(path.join(canonical,'manifest.json'),'{"fixture":"canonical"}\n');
  const buildId=sha(fs.readFileSync(path.join(canonical,'manifest.json')));
  const manifest={
    standard:'MLS R32',promptVersion:'32.0',version:'1.0',source:'semantic-neighbors',
    semanticModel:'@cf/baai/bge-m3',semanticVersion:'1.0',corpusBuildId:buildId,
    languages:{},totalEntries:0
  };
  for(const language of LANGUAGES){
    const neighbors={};
    for(let n=1;n<=language.total;n++){
      const code=language.prefix+'-'+String(n).padStart(4,'0');
      const next=language.prefix+'-'+String(n===language.total?1:n+1).padStart(4,'0');
      neighbors[code]=[next];
    }
    const payload={
      standard:'MLS R32',promptVersion:'32.0',version:'1.0',source:'semantic-neighbors',
      semanticModel:'@cf/baai/bge-m3',semanticVersion:'1.0',corpusBuildId:buildId,
      language:language.slug,totalEntries:language.total,topK:1,audit:{},neighbors
    };
    const raw=JSON.stringify(payload)+'\n';
    const file=language.slug+'.json';
    fs.writeFileSync(path.join(related,file),raw);
    manifest.languages[language.slug]={totalEntries:language.total,topK:1,file,sha256:sha(Buffer.from(raw)),audit:{}};
    manifest.totalEntries+=language.total;
  }
  fs.writeFileSync(path.join(related,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  return {root,canonical,related,published,manifest};
}

test('missing related manifest is optional and non-blocking',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'mls-related-missing-'));
  const canonical=path.join(root,'content');
  fs.mkdirSync(canonical,{recursive:true});
  fs.writeFileSync(path.join(canonical,'manifest.json'),'{}\n');
  assert.deepEqual(validateRelatedSource(path.join(root,'related'),canonical),{complete:false,reason:'manifest_missing'});
  fs.rmSync(root,{recursive:true,force:true});
});

test('valid related source covers ten canonical languages and 10133 entries',()=>{
  const fx=makeFixture();
  try{
    const result=validateRelatedSource(fx.related,fx.canonical);
    assert.equal(result.complete,true);
    assert.equal(result.totalEntries,10133);
    assert.equal(Object.keys(result.manifest.languages).length,10);
  }finally{fs.rmSync(fx.root,{recursive:true,force:true})}
});

test('publisher rejects stale corpusBuildId',()=>{
  const fx=makeFixture();
  try{
    const file=path.join(fx.related,'manifest.json');
    const manifest=JSON.parse(fs.readFileSync(file,'utf8'));
    manifest.corpusBuildId='stale';
    fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n');
    assert.throws(()=>validateRelatedSource(fx.related,fx.canonical),/otro corpus/);
  }finally{fs.rmSync(fx.root,{recursive:true,force:true})}
});

test('publisher rejects corrupt language hash',()=>{
  const fx=makeFixture();
  try{
    const slug=LANGUAGES[0].slug;
    fs.appendFileSync(path.join(fx.related,slug+'.json'),' ');
    assert.throws(()=>validateRelatedSource(fx.related,fx.canonical),/hash de relacionados inválido/);
  }finally{fs.rmSync(fx.root,{recursive:true,force:true})}
});

test('publisher rejects cross-language or noncanonical neighbors',()=>{
  const fx=makeFixture();
  try{
    const language=LANGUAGES[0];
    const file=path.join(fx.related,language.slug+'.json');
    const payload=JSON.parse(fs.readFileSync(file,'utf8'));
    const first=language.prefix+'-0001';
    payload.neighbors[first]=['MLS-V01-0001'];
    const raw=JSON.stringify(payload)+'\n';
    fs.writeFileSync(file,raw);
    const manifestFile=path.join(fx.related,'manifest.json');
    const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
    manifest.languages[language.slug].sha256=sha(Buffer.from(raw));
    fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');
    assert.throws(()=>validateRelatedSource(fx.related,fx.canonical),/vecino no canónico, cruzado o duplicado/);
  }finally{fs.rmSync(fx.root,{recursive:true,force:true})}
});

test('publisher copies validated assets and writes health metadata',()=>{
  const fx=makeFixture();
  try{
    const result=publishRelated({sourceRoot:fx.related,publicRoot:fx.published,canonicalRoot:fx.canonical});
    assert.equal(result.published,true);
    const health=JSON.parse(fs.readFileSync(path.join(fx.published,'publish-health.json'),'utf8'));
    assert.equal(health.ok,true);
    assert.equal(health.totalEntries,10133);
    assert.equal(health.languages,10);
    assert.equal(health.corpusBuildId,fx.manifest.corpusBuildId);
  }finally{fs.rmSync(fx.root,{recursive:true,force:true})}
});
