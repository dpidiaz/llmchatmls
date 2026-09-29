'use strict';
// BCR local-only adapter. The caller confirms the GitHub ref and performs
// one grouped commit separately; this command never contacts GitHub.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const bcr=require('../MLS R32 EDITORIAL/r4 buffered context.cjs');
const core=require('../MLS R32 EDITORIAL/r4 buffered core.cjs');
const read=(d,p)=>core.read(path.join(d,p));
function persist(d,files){
 for(const f of files){
  if(path.isAbsolute(f.path)||f.path.split('/').includes('..'))core.error('BCR_UNSAFE_PATH');
  const target=path.join(d,f.path),s=typeof f.value==='string'?f.value:JSON.stringify(f.value,null,2)+'\n';
  fs.mkdirSync(path.dirname(target),{recursive:true});
  if(fs.existsSync(target)&&fs.readFileSync(target,'utf8')===s)continue;
  if(fs.existsSync(target)&&(/^(?:entries|checkpoints)\//.test(f.path)||
    /^chunk-\d\d-of-05\.json$/.test(f.path)||/\/deltas\//.test(f.path)||
    f.path==='bcr/recipe.json'))core.error('BCR_IMMUTABLE_CONFLICT',f.path);
  const tmp=target+'.pending-'+process.pid+'-'+crypto.randomBytes(4).toString('hex');
  try{fs.writeFileSync(tmp,s,{flag:'wx'});fs.renameSync(tmp,target);}
  finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}
 }
}
function registryFromFile(filename){const r=core.read(filename);
 if(!r||typeof r!=='object'||Array.isArray(r))core.error('BCR_REGISTRY_INVALID');
 return r;
}
async function run([op,dir,extra,sha,chunkFile]){
 if(!op||!dir)core.error('BCR_USAGE','bootstrap|advance|next|verify');
 const manifest=core.manifest(dir),progress=read(dir,'progress.json');
 if(op==='bootstrap'){
  if(!/^[a-f0-9]{40}$/.test(sha||''))core.error('BCR_PARENT_SHA_REQUIRED');
  const chunk=read(dir,'chunk-01-of-05.json');
  for(const code of Object.keys(chunk.entries||{})){
   if(core.hash(read(dir,'entries/'+code+'.json'))!==core.hash(chunk.entries[code])||
    core.hash(read(dir,'checkpoints/'+code+'.json'))!==core.hash(chunk.checkpoints[code]))
     core.error('BCR_EXISTING_CHECKPOINT_DRIFT',code);
  }
  const out=bcr.bootstrap({manifest,chunk,progress,
    sourceRegistry:registryFromFile(extra),parentCommit:sha});
  persist(dir,out.files);
  return {preparedLocally:true,remotePersisted:false,block:1,packHash:out.pack.stateHash,
   files:out.files.map(x=>x.path),handoff:out.handoff,requiresOneGroupedCommit:true};
 }
 const pack=read(dir,'bcr/context-pack.json'),index=read(dir,'bcr/source-index.json');
 const registry=registryFromFile(extra);
 bcr.verifyState({pack,index,manifest,progress,sourceRegistry:registry});
 const delta=read(dir,pack.lastDeltaRef),unsigned={...delta};delete unsigned.deltaHash;
 if(delta.deltaHash!==core.hash(unsigned)||delta.newContextHash!==pack.stateHash)
  core.error('BCR_DELTA_DRIFT');
 if(op==='next')return bcr.next(pack,index);
 if(op==='verify')return {ok:true,packHash:pack.stateHash,lastPersistedBlock:pack.lastPersistedBlock,
  sourceCount:Object.keys(index.sources).length,next:bcr.next(pack,index)};
 if(op==='advance'){
  if(!/^[a-f0-9]{40}$/.test(sha||'')||!chunkFile)core.error('BCR_PARENT_AND_CHUNK_REQUIRED');
  const out=bcr.advance({manifest,pack,index,progress,chunk:core.read(chunkFile),
    sourceRegistry:registry,expectedParentCommit:sha});
  if(out.replayed)return {replayed:true,packHash:pack.stateHash};
  await core.exclusive(dir,async()=>persist(dir,out.files));
  return {preparedLocally:true,remotePersisted:false,block:out.pack.lastPersistedBlock,
   packHash:out.pack.stateHash,files:out.files.map(x=>x.path),
   handoff:out.handoff,requiresOneGroupedCommit:true};
 }
 core.error('BCR_USAGE');
}
if(require.main===module)run(process.argv.slice(2)).then(r=>process.stdout.write(JSON.stringify(r,null,2)+'\n'))
 .catch(e=>{console.error(e.code||'BCR_ERROR',e.message);process.exitCode=2;});
module.exports={run,persist,registryFromFile};
