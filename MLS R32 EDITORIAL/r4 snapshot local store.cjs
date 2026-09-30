'use strict';

/**
 * MLS BCR R4.3 chat-local persistence adapter.
 *
 * This adapter intentionally uses only a local filesystem exposed to the current
 * ChatGPT execution. It never calls GitHub. Files are immutable and replay-safe.
 */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const farm=require('./r4 snapshot farm.cjs');

function fail(code,msg){const e=new Error(msg||code);e.code=code;e.status=409;throw e;}
function assert(ok,code,msg){if(!ok)fail(code,msg);}
function stable(x){
 if(Array.isArray(x))return '['+x.map(stable).join(',')+']';
 if(x&&typeof x==='object')return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';
 return JSON.stringify(x);
}
function hash(x){return crypto.createHash('sha256').update(stable(x)).digest('hex');}
function safeSegment(x){
 assert(typeof x==='string'&&/^[A-Za-z0-9._:-]{1,160}$/.test(x),'R43_LOCAL_SEGMENT');
 return x.replace(/:/g,'_');
}
function readJson(file){return JSON.parse(fs.readFileSync(file,'utf8'));}
function writeOnce(file,value){
 fs.mkdirSync(path.dirname(file),{recursive:true});
 if(fs.existsSync(file)){
  const prior=readJson(file);
  assert(hash(prior)===hash(value),'R43_LOCAL_IMMUTABLE_CONFLICT');
  return {created:false,path:file,hash:hash(prior)};
 }
 const tmp=file+'.tmp-'+process.pid+'-'+crypto.randomBytes(5).toString('hex');
 const fd=fs.openSync(tmp,'wx');
 try{
  fs.writeFileSync(fd,JSON.stringify(value,null,2)+'\n');
  fs.fsyncSync(fd);
 }finally{fs.closeSync(fd);}
 try{
  fs.linkSync(tmp,file);
 }catch(e){
  if(e.code!=='EEXIST')throw e;
  const prior=readJson(file);
  assert(hash(prior)===hash(value),'R43_LOCAL_IMMUTABLE_CONFLICT');
  fs.unlinkSync(tmp);
  return {created:false,path:file,hash:hash(prior)};
 }
 fs.unlinkSync(tmp);
 return {created:true,path:file,hash:hash(value)};
}

function paths(root,waveId,shardId){
 const w=safeSegment(waveId),s=safeSegment(shardId);
 const base=path.join(root,'waves',w);
 return {
  base,
  worker:path.join(base,'workers',s+'.json'),
  delta:path.join(base,'deltas',s+'.json'),
  reconciliation:path.join(base,'reconciliation.json')
 };
}

function saveWorkerContext(root,snapshot,wave,context){
 farm.validateWorkerContext(snapshot,wave,context);
 const p=paths(root,wave.waveId,context.shardId);
 return writeOnce(p.worker,context);
}

function loadWorkerContext(root,waveId,shardId){
 const p=paths(root,waveId,shardId);
 assert(fs.existsSync(p.worker),'R43_LOCAL_WORKER_MISSING');
 return readJson(p.worker);
}

function saveDelta(root,wave,delta){
 farm.validateDelta(wave,delta);
 const p=paths(root,wave.waveId,delta.shardId);
 return writeOnce(p.delta,delta);
}

function loadDeltas(root,wave){
 assert(wave?.schema===farm.WAVE_SCHEMA,'R43_WAVE_REQUIRED');
 const dir=path.join(root,'waves',safeSegment(wave.waveId),'deltas');
 if(!fs.existsSync(dir))return [];
 const byId=new Map(wave.shards.map(x=>[x.shardId,x]));
 const out=[];
 for(const name of fs.readdirSync(dir).sort()){
  if(!name.endsWith('.json'))continue;
  const shardId=name.slice(0,-5);
  assert(byId.has(shardId),'R43_LOCAL_FOREIGN_DELTA');
  const delta=readJson(path.join(dir,name));
  farm.validateDelta(wave,delta);
  out.push(delta);
 }
 return out;
}

function reconcileToDisk(root,wave){
 const result=farm.reconcileWave(wave,loadDeltas(root,wave));
 const p=paths(root,wave.waveId,'W0001');
 return {...writeOnce(p.reconciliation,result),reconciliation:result};
}

module.exports={
 paths,writeOnce,saveWorkerContext,loadWorkerContext,
 saveDelta,loadDeltas,reconcileToDisk
};
