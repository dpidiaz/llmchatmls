'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const provider=require('./global dispatcher/providers/r33.js');
const SCHEMA='MLS-R4.1-BUFFER-1';
const statuses=new Set(['UNSOURCED','SOURCED','VERIFIED','REVIEWED']);
function error(code,message){const e=new Error(message||code);e.code=code;throw e;}
function stable(x){if(Array.isArray(x))return '['+x.map(stable).join(',')+']';if(x&&typeof x==='object')return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';return JSON.stringify(x);}
function hash(x){return crypto.createHash('sha256').update(stable(x)).digest('hex');}
function read(f){if(fs.lstatSync(f).isSymbolicLink())error('SYMLINK_FORBIDDEN');return JSON.parse(fs.readFileSync(f,'utf8'));}
function writeOnce(f,value){
  fs.mkdirSync(path.dirname(f),{recursive:true});
  if(fs.existsSync(f))error('IMMUTABLE_CONFLICT',f+' already exists');
  const tmp=f+'.tmp-'+process.pid+'-'+crypto.randomBytes(5).toString('hex');
  try{
    const fd=fs.openSync(tmp,'wx');
    try{fs.writeFileSync(fd,JSON.stringify(value,null,2)+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
    if(fs.existsSync(f))error('IMMUTABLE_CONFLICT');
    fs.renameSync(tmp,f);
  }finally{if(fs.existsSync(tmp))fs.unlinkSync(tmp);}
}
async function exclusive(dir,fn){
  fs.mkdirSync(dir,{recursive:true});
  const lock=path.join(dir,'.writer-lock');
  try{fs.mkdirSync(lock);}catch{error('BUFFER_BUSY','Single writer required. Reconcile stale lock manually.');}
  try{return await fn();}finally{fs.rmdirSync(lock);}
}
function normalizeAssignment(a){
  if(a?.allocatedBy!=='global-dispatcher')error('DISPATCHER_EXPORT_REQUIRED','Never synthesize a lease offline.');
  if(!/^[A-Za-z0-9._:-]{8,160}$/.test(String(a.assignmentId||'')))error('INVALID_ASSIGNMENT_ID');
  if(!Number.isSafeInteger(a.assignmentIssueNumber)||a.assignmentIssueNumber<1||!Number.isSafeInteger(a.leaseEpoch)||a.leaseEpoch<1)error('INVALID_ASSIGNMENT_EPOCH');
  for(const field of ['baseCommit','contentManifestBlobSha'])if(!/^[a-f0-9]{40}$/i.test(String(a[field]||'')))error('INVALID_SHA',field);
  if(!a.poolId||!a.manifestVersion)error('POOL_SNAPSHOT_REQUIRED');
  if(!Array.isArray(a.units)||!a.units.length||a.units.length>100)error('INVALID_UNIT_COUNT');
  const used=new Set(),units=a.units.map(u=>{
    const code=provider.assertCode(u.code),language=String(u.language||''),contentPath=String(u.contentPath||'');
    if(used.has(code)||!/^[A-Za-z0-9._-]{2,80}$/.test(language))error('DUPLICATE_OR_INVALID_UNIT');
    if(!contentPath.startsWith('content/')||contentPath.includes('\\')||contentPath.split('/').includes('..'))error('UNSAFE_CONTENT_PATH');
    used.add(code);
    const evidenceArtifactPath=provider.evidenceArtifactPath({code,language});
    if(u.evidenceArtifactPath&&u.evidenceArtifactPath!==evidenceArtifactPath)error('ENTRY_PATH_MISMATCH');
    return {code,language,contentPath,evidenceArtifactPath};
  });
  return {allocatedBy:'global-dispatcher',assignmentId:a.assignmentId,assignmentIssueNumber:a.assignmentIssueNumber,leaseEpoch:a.leaseEpoch,
    poolId:String(a.poolId),manifestVersion:String(a.manifestVersion),baseCommit:String(a.baseCommit).toLowerCase(),
    contentManifestBlobSha:String(a.contentManifestBlobSha).toLowerCase(),units};
}
const mf=d=>path.join(d,'manifest.json');
const ef=(d,c)=>path.join(d,'entries',provider.assertCode(c)+'.json');
const cf=(d,c)=>path.join(d,'checkpoints',provider.assertCode(c)+'.json');
const pf=d=>path.join(d,'package.json');
function manifest(d){
  const m=read(mf(d));
  if(m.schema!==SCHEMA||m.allocationHash!==hash(m.allocation))error('MANIFEST_TAMPERED');
  normalizeAssignment(m.allocation);
  return m;
}
async function init(d,a){const x=normalizeAssignment(a),m={schema:SCHEMA,allocation:x,allocationHash:hash(x),authority:'REMOTE_RECONCILIATION_PENDING'};
  return exclusive(d,()=>{
    if(fs.existsSync(mf(d))){const prev=manifest(d);if(prev.allocationHash!==m.allocationHash)error('ALLOCATION_CONFLICT');return {created:false,allocationHash:m.allocationHash};}
    writeOnce(mf(d),m);return {created:true,allocationHash:m.allocationHash,count:x.units.length};
  });
}
async function checkpoint(d,e){
  return exclusive(d,()=>{
    const m=manifest(d),code=provider.assertCode(e.code),u=m.allocation.units.find(x=>x.code===code);
    if(fs.existsSync(pf(d)))error('SEALED_PACKAGE');
    if(!u||e.language!==u.language||e.contentPath!==u.contentPath||e.architecture!=='github-native'||!statuses.has(e.status))error('UNASSIGNED_OR_INVALID_EVIDENCE');
    const h=hash(e),entryFile=ef(d,code),cpFile=cf(d,code);
    if(fs.existsSync(entryFile)&&hash(read(entryFile))!==h)error('ENTRY_CONFLICT','No overwrite; reconcile orphan/previous revision.');
    if(fs.existsSync(cpFile)){
      const existing=read(cpFile);if(!fs.existsSync(entryFile)||existing.entrySha!==h||existing.allocationHash!==m.allocationHash)error('CHECKPOINT_CONFLICT');
      return {...existing,replayed:true};
    }
    if(!fs.existsSync(entryFile))writeOnce(entryFile,e);
    const record={schema:SCHEMA,code,entrySha:h,evidenceArtifactPath:u.evidenceArtifactPath,allocationHash:m.allocationHash,
      assessment:'PENDING_CANONICAL_R33_VALIDATION',claimedStatus:e.status};
    writeOnce(cpFile,record);return record;
  });
}
function inspect(d){
  const m=manifest(d),state={assigned:m.allocation.units.length,completed:[],missing:[],orphans:[],invalid:[],sealed:fs.existsSync(pf(d))};
  for(const u of m.allocation.units){
    const entryFile=ef(d,u.code),cpFile=cf(d,u.code);
    if(!fs.existsSync(cpFile)){(fs.existsSync(entryFile)?state.orphans:state.missing).push(u.code);continue;}
    try{const record=read(cpFile),e=read(entryFile);
      if(record.schema!==SCHEMA||record.code!==u.code||record.entrySha!==hash(e)||record.allocationHash!==m.allocationHash||record.evidenceArtifactPath!==u.evidenceArtifactPath)error('CHECKPOINT_CORRUPT');
      state.completed.push({code:u.code,entrySha:record.entrySha});
    }catch(err){state.invalid.push({code:u.code,reason:err.code||err.message});}
  }
  if(state.sealed){
    try{
      const pkg=read(pf(d)),expected=pkg.entries.map(e=>({code:e.code,entrySha:e.entrySha,derivedStatus:e.derivedStatus,articleHash:e.articleHash}));
      if(pkg.schema!==SCHEMA||pkg.allocationHash!==m.allocationHash||pkg.packageHash!==hash({allocationHash:m.allocationHash,entries:expected})||
      expected.length!==m.allocation.units.length||expected.some((e,i)=>e.code!==m.allocation.units[i].code||!state.completed.some(c=>c.code===e.code&&c.entrySha===e.entrySha)))error('PACKAGE_CORRUPT');
    }catch(err){state.invalid.push({code:'PACKAGE',reason:err.code||err.message});}
  }
  return state;
}
module.exports={SCHEMA,hash,read,writeOnce,exclusive,error,manifest,init,checkpoint,inspect,ef,pf};
