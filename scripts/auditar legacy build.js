'use strict';

const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');

const archive=path.resolve('MASTER LANGUAGE SYSTEM REVISION 32 BUNDLE.tar.gz');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'mls-legacy-audit-'));
const extract=spawnSync('tar',['-xzf',archive,'-C',tmp],{encoding:'utf8'});
if(extract.status!==0)throw new Error(extract.stderr||'No se pudo extraer bundle');

function walk(dir,out=[]){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,ent.name);
    if(ent.isDirectory())walk(p,out);
    else if(ent.isFile())out.push(p);
  }
  return out;
}
const files=walk(tmp);
const rel=p=>path.relative(tmp,p).replaceAll('\\','/');
const dataFiles=files.map(rel).filter(p=>p.startsWith('public/data/'));
const jsFiles=files.filter(p=>/\.js$/i.test(p));
const markers=['loadVolume','wiki-seeds','plain-entry','auditedBody','e.plain','easy.lead','/data/','vol.entries','idxByCode'];
const refs=[];
for(const file of jsFiles){
  let text=''; try{text=fs.readFileSync(file,'utf8')}catch{}
  const found=markers.filter(m=>text.includes(m));
  if(found.length)refs.push({file:rel(file),markers:found});
}
const byTop={};
for(const p of dataFiles){
  const seg=p.split('/').slice(0,4).join('/');
  byTop[seg]=(byTop[seg]||0)+1;
}
console.log(JSON.stringify({
  extractedFiles:files.length,
  publicDataFiles:dataFiles.length,
  publicDataGroups:byTop,
  sampleDataFiles:dataFiles.slice(0,250),
  javascriptReferences:refs.slice(0,120)
},null,2));
// audit trigger active

const contractFiles=[
  'public/data/index.js',
  'public/data/volumes/chino-taiwan.js'
];
console.log('=== CONTRACT EXCERPTS ===');
for(const name of contractFiles){
  const file=path.join(tmp,name);
  if(!fs.existsSync(file)){console.log(name+': MISSING');continue}
  const text=fs.readFileSync(file,'utf8');
  console.log('--- '+name+' bytes='+Buffer.byteLength(text,'utf8')+' ---');
  console.log(text.slice(0,9000));
  console.log('--- END HEAD '+name+' ---');
  console.log(text.slice(Math.max(0,text.length-4000)));
  console.log('--- END TAIL '+name+' ---');
}
