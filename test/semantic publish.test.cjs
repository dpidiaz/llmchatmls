'use strict';

const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const test=require('node:test');
const assert=require('node:assert/strict');

test('semantic publisher emits parseable publish-health JSON',()=>{
  const root=path.resolve(__dirname,'..');
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'mls-semantic-publish-'));
  try{
    execFileSync(process.execPath,[path.join(root,'scripts/publicar indice semantico.js')],{
      cwd:root,
      env:{...process.env,MLS_SEMANTIC_PUBLIC_ROOT:temp},
      stdio:'pipe'
    });
    const file=path.join(temp,'publish-health.json');
    assert.ok(fs.existsSync(file),'publish-health.json debe existir');
    const raw=fs.readFileSync(file,'utf8');
    const health=JSON.parse(raw);
    assert.equal(health.ok,true);
    assert.equal(health.standard,'MLS R32');
    assert.equal(health.promptVersion,'32.0');
    assert.equal(health.model,'@cf/baai/bge-m3');
    assert.equal(health.totalEntries,10133);
    assert.equal(health.totalChunks,10669);
    assert.equal(health.totalBytes,10967732);
    assert.equal(raw.endsWith('\n'),true,'debe terminar con salto de línea real');
    assert.equal(raw.endsWith('\\n'),false,'no debe terminar con barra+n literal');
  }finally{
    fs.rmSync(temp,{recursive:true,force:true});
  }
});
