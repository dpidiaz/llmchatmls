'use strict';

const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');

const DEFAULT_ARCHIVE=path.resolve('MASTER LANGUAGE SYSTEM REVISION 32 BUNDLE.tar.gz');
const REQUIRED_SHELL_FILES=[
  'public/index.html',
  'public/js/core.js',
  'public/js/app.js',
  'public/js/search.js',
  'public/js/map.js',
  'public/js/compare.js'
];
const BANNED_PREFIXES=[
  'public/data/',
  'public/mls-staging-targets/',
  'src/'
];

function run(cmd,args,options={}){
  const result=spawnSync(cmd,args,{encoding:'utf8',...options});
  if(result.status!==0)throw new Error((result.stderr||result.stdout||cmd+' failed').trim());
  return result;
}
function normalizeTarPath(value){
  return String(value||'').replace(/^\.\//,'').replaceAll('\\','/');
}
function listArchive(archive){
  return run('tar',['-tzf',archive]).stdout.split('\n').map(normalizeTarPath).filter(Boolean);
}
function validateSanitizedArchive(archive){
  const entries=listArchive(archive);
  for(const prefix of BANNED_PREFIXES){
    const hit=entries.find(x=>x===prefix.slice(0,-1)||x.startsWith(prefix));
    if(hit)throw new Error('Bundle todavía contiene ruta prohibida: '+hit);
  }
  for(const required of REQUIRED_SHELL_FILES){
    if(!entries.includes(required))throw new Error('Bundle saneado perdió archivo requerido: '+required);
  }
  if(entries.some(x=>/wiki-seeds|cloudflare-legacy/i.test(x)))throw new Error('Bundle saneado conserva nombre legacy inesperado.');
  return {entries:entries.length,required:REQUIRED_SHELL_FILES.length,bannedPrefixes:BANNED_PREFIXES};
}

function sanitizeBundle(input=DEFAULT_ARCHIVE,output=path.resolve('MASTER LANGUAGE SYSTEM REVISION 32 BUNDLE CLEAN.tar.gz')){
  if(!fs.existsSync(input))throw new Error('No existe bundle fuente: '+input);
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'mls-r32-clean-'));
  try{
    run('tar',['--no-same-owner','-xzf',input,'-C',tmp]);
    for(const rel of ['public/data','public/mls-staging-targets','src']){
      fs.rmSync(path.join(tmp,rel),{recursive:true,force:true});
    }
    for(const required of REQUIRED_SHELL_FILES){
      if(!fs.existsSync(path.join(tmp,required)))throw new Error('Bundle fuente no contiene shell requerido: '+required);
    }
    fs.rmSync(output,{force:true});
    run('tar',[
      '--sort=name',
      '--mtime=@0',
      '--owner=0',
      '--group=0',
      '--numeric-owner',
      '-czf',output,
      '-C',tmp,'.'
    ]);
    const report=validateSanitizedArchive(output);
    report.bytes=fs.statSync(output).size;
    report.input=path.resolve(input);
    report.output=path.resolve(output);
    return report;
  } finally {
    fs.rmSync(tmp,{recursive:true,force:true});
  }
}

module.exports={sanitizeBundle,validateSanitizedArchive,listArchive,REQUIRED_SHELL_FILES,BANNED_PREFIXES};
if(require.main===module){
  const input=process.argv[2]?path.resolve(process.argv[2]):DEFAULT_ARCHIVE;
  const output=process.argv[3]?path.resolve(process.argv[3]):path.resolve('MASTER LANGUAGE SYSTEM REVISION 32 BUNDLE CLEAN.tar.gz');
  try{
    const report=sanitizeBundle(input,output);
    console.log(JSON.stringify(report,null,2));
  }catch(error){
    console.error('ERROR saneando bundle R32:',error.message);
    process.exitCode=1;
  }
}
