'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');

test('la numeración visible usa directamente la numeración canónica consecutiva',()=>{
  const root=path.resolve(__dirname,'..');
  const bundle=path.join(root,'MASTER LANGUAGE SYSTEM REVISION 32 BUNDLE.tar.gz');
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'mls-chapters-current-'));
  try{
    execFileSync('tar',['-xzf',bundle,'-C',temp,'public/js']);
    const publicDir=path.join(temp,'public');
    execFileSync(process.execPath,[path.join(root,'scripts/aplicar numeracion visible.js')],{
      env:{...process.env,MLS_PUBLIC_DIR:publicDir}
    });

    const browser={
      window:{},
      document:{getElementById:()=>({}),body:{dataset:{},classList:{toggle(){}}}},
      localStorage:{getItem:()=>null}
    };
    browser.MLS_META=[];
    browser.MLS_INDEX=[];
    vm.runInNewContext(fs.readFileSync(path.join(publicDir,'js/core.js'),'utf8'),browser);
    const MLS=browser.window.MLS;

    for(const n of [1,2,3,4,5,6,48,49,50,51,52,53,58]){
      assert.equal(Number(MLS.chapterDisplayNum('espanol-guatemala',n)),n,'espanol-guatemala capítulo '+n);
      assert.equal(Number(MLS.chapterDisplayNum('ingles',n)),n,'ingles capítulo '+n);
    }

    assert.equal(Number(MLS.chapterDisplayNum('espanol-guatemala',2)),2);
    assert.notEqual(Number(MLS.chapterDisplayNum('espanol-guatemala',2)),6);

    for(const file of ['core.js','app.js','search.js','map.js']){
      const source=fs.readFileSync(path.join(publicDir,'js',file),'utf8');
      assert.match(source,/MLS\.chapterDisplayNum\(/);
      execFileSync(process.execPath,['--check',path.join(publicDir,'js',file)]);
    }
  }finally{
    fs.rmSync(temp,{recursive:true,force:true});
  }
});

test('los datos canónicos asignan chapterNum por orden editorial de primera aparición',()=>{
  const root=path.resolve(__dirname,'..');
  const source=fs.readFileSync(path.join(root,'scripts/generar datos canonicos compatibles.js'),'utf8');
  assert.match(source,/const chapterOrder=new Map\(\)/);
  assert.match(source,/if\(!chapterOrder\.has\(article\.chapter\)\)chapterOrder\.set\(article\.chapter,chapterOrder\.size\+1\)/);
  assert.match(source,/const chapterNum=String\(chapterOrder\.get\(article\.chapter\)\)/);
  assert.doesNotMatch(source,/n>=49&&n<=52/);
});
