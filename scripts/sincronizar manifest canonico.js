'use strict';

const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.resolve(process.env.MLS_CANONICAL_ROOT||'content');
const manifestPath=path.join(root,'manifest.json');

function sha256(data){return crypto.createHash('sha256').update(data).digest('hex');}
function fail(message){const e=new Error(message);e.code='CANONICAL_MANIFEST_SYNC_INVALID';throw e;}

function sync({write=false}={}){
  const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  if(!Array.isArray(manifest.entries))fail('manifest.entries debe ser array.');
  let changed=0;
  const mismatches=[];
  for(const item of manifest.entries){
    const code=String(item.code||'').toUpperCase();
    const relative=String(item.path||'').replace(/\\/g,'/');
    if(!/^MLS-V\d{2}-\d{4}$/.test(code)||!relative||relative.startsWith('/')||relative.includes('..'))fail('Entrada de manifest inválida: '+code);
    const file=path.resolve(root,relative);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file))fail('Archivo canónico faltante: '+relative);
    const raw=fs.readFileSync(file);
    const parsed=JSON.parse(raw.toString('utf8'));
    if(String(parsed.code||'').toUpperCase()!==code)fail('Código no coincide: '+relative);
    const nextHash=sha256(raw),nextBytes=raw.length;
    if(item.sha256!==nextHash||Number(item.bytes)!==nextBytes){
      mismatches.push({code,path:relative,oldSha256:item.sha256||null,newSha256:nextHash,oldBytes:Number(item.bytes)||0,newBytes:nextBytes});
      item.sha256=nextHash;
      item.bytes=nextBytes;
      changed++;
    }
  }
  if(write&&changed)fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
  const result={ok:true,total:manifest.entries.length,changed,written:write&&changed>0,mismatches:mismatches.slice(0,50)};
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
  return result;
}

if(require.main===module){
  try{
    const write=process.argv.includes('--write');
    const result=sync({write});
    if(!write&&result.changed)process.exitCode=2;
  }catch(error){
    console.error(error.code||'CANONICAL_MANIFEST_SYNC_ERROR',error.message);
    process.exitCode=2;
  }
}
module.exports={sync};
