'use strict';

const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const test=require('node:test');

const archive='MASTER LANGUAGE SYSTEM REVISION 32 BUNDLE.tar.gz';

function tarText(path){
  return execFileSync('tar',['-xOzf',archive,path],{encoding:'utf8'});
}

test('diagnose hero Buscar behavior',()=>{
  const files=execFileSync('tar',['-tzf',archive],{encoding:'utf8'}).split('\n').filter(Boolean);
  const candidates=files.filter(p=>/\.(?:html|js)$/i.test(p));
  for(const file of candidates){
    let text='';
    try{text=tarText(file)}catch{continue}
    if(/Seguir leyendo|#search|Buscar|search/i.test(text)){
      const lines=text.split('\n');
      const hits=[];
      for(let i=0;i<lines.length;i++){
        if(/Seguir leyendo|#search|Buscar|search|preventDefault|location\.hash|scrollIntoView|data-action/i.test(lines[i])){
          hits.push({line:i+1,text:lines.slice(Math.max(0,i-2),Math.min(lines.length,i+3)).join('\n')});
        }
      }
      if(hits.length){
        console.log('\n=== '+file+' ===');
        for(const hit of hits.slice(0,80))console.log('L'+hit.line+'\n'+hit.text+'\n---');
      }
    }
  }
});
