'use strict';
// Immutable, portable R4.1 transport; no networking, payment, tokens or shared chat memory.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const core=require('./r4 buffered core.cjs');
const SCHEMA='MLS-R4.1-BUNDLE-1';

function validateBundle(b){
  if(!b||b.schema!==SCHEMA||typeof b.bundleHash!=='string')core.error('BUNDLE_SCHEMA_INVALID');
  const unsigned={schema:b.schema,manifest:b.manifest,entries:b.entries,checkpoints:b.checkpoints,package:b.package};
  if(core.hash(unsigned)!==b.bundleHash)core.error('BUNDLE_HASH_INVALID');
  if(b.manifest?.schema!==core.SCHEMA||b.manifest.allocationHash!==core.hash(b.manifest.allocation)||
     !Array.isArray(b.manifest.allocation?.units))core.error('BUNDLE_MANIFEST_INVALID');
  const units=b.manifest.allocation.units;
  if(!units.length||units.length>100||units.length!==b.package?.entries?.length||
      b.package.schema!==core.SCHEMA||b.package.allocationHash!==b.manifest.allocationHash)core.error('BUNDLE_ALLOCATION_CONFLICT');
  const unique=new Set();
  for(const u of units){
    if(unique.has(u.code))core.error('BUNDLE_DUPLICATE_CODE');
    unique.add(u.code);
    if(!Object.hasOwn(b.entries||{},u.code)||!Object.hasOwn(b.checkpoints||{},u.code))core.error('BUNDLE_INCOMPLETE',u.code);
    const e=b.entries[u.code],check=b.checkpoints[u.code],summary=b.package.entries.find(x=>x.code===u.code);
    if(!e||e.code!==u.code||e.language!==u.language||e.contentPath!==u.contentPath||
       !check||check.code!==u.code||check.entrySha!==core.hash(e)||check.allocationHash!==b.manifest.allocationHash||
       check.evidenceArtifactPath!==u.evidenceArtifactPath||
       !summary||summary.entrySha!==core.hash(e))core.error('BUNDLE_CONTENT_CONFLICT',u.code);
  }
  if(Object.keys(b.entries||{}).length!==units.length||Object.keys(b.checkpoints||{}).length!==units.length)
    core.error('BUNDLE_EXTRA_ENTRY');
  const signed=b.package.entries.map(({code,entrySha,derivedStatus,articleHash})=>({code,entrySha,derivedStatus,articleHash}));
  if(b.package.packageHash!==core.hash({allocationHash:b.manifest.allocationHash,entries:signed}))
    core.error('BUNDLE_PACKAGE_HASH_INVALID');
  if(b.package.integration!=='PENDING_REMOTE_RECONCILIATION'||b.package.checkpointSizeMax!==1)
    core.error('BUNDLE_NOT_OFFLINE_STAGING');
  return b;
}
function assemble(dir){
  const state=core.inspect(dir);
  if(!state.sealed||state.invalid.length||state.missing.length||state.orphans.length)
    core.error('BUNDLE_SOURCE_NOT_READY');
  const m=core.manifest(dir),entries=Object.create(null),checkpoints=Object.create(null);
  for(const u of m.allocation.units){
    entries[u.code]=core.read(core.ef(dir,u.code));
    checkpoints[u.code]=core.read(path.join(dir,'checkpoints',u.code+'.json'));
  }
  const unsigned={schema:SCHEMA,manifest:m,entries,checkpoints,package:core.read(core.pf(dir))};
  return validateBundle({...unsigned,bundleHash:core.hash(unsigned)});
}
function exportTo(dir,target){
  const b=assemble(dir);
  core.writeOnce(path.resolve(target),b);
  return {bundleHash:b.bundleHash,packageHash:b.package.packageHash,entries:b.manifest.allocation.units.length,target:path.resolve(target)};
}
async function importFrom(target,file){
  const b=validateBundle(core.read(file));
  const root=path.resolve(target);
  if(fs.existsSync(root)){
    if(assemble(root).bundleHash!==b.bundleHash)core.error('EXISTING_BUNDLE_CONFLICT');
    return {imported:false,replayed:true,bundleHash:b.bundleHash,entries:b.manifest.allocation.units.length};
  }
  const temp=root+'.incoming-'+crypto.randomBytes(5).toString('hex');
  try{
    await core.init(temp,b.manifest.allocation);
    if(core.manifest(temp).allocationHash!==b.manifest.allocationHash)core.error('IMPORT_ALLOCATION_MISMATCH');
    for(const u of b.manifest.allocation.units){
      const created=await core.checkpoint(temp,b.entries[u.code]);
      if(core.hash(created)!==core.hash(b.checkpoints[u.code]))core.error('IMPORT_CHECKPOINT_MISMATCH',u.code);
    }
    core.writeOnce(core.pf(temp),b.package);
    const state=core.inspect(temp);
    if(state.invalid.length||state.missing.length||state.orphans.length||!state.sealed||assemble(temp).bundleHash!==b.bundleHash)
      core.error('IMPORT_INTEGRITY_FAILED');
    if(fs.existsSync(root))core.error('IMPORT_RACE_CONFLICT');
    fs.renameSync(temp,root);
    return {imported:true,bundleHash:b.bundleHash,packageHash:b.package.packageHash,entries:b.manifest.allocation.units.length};
  }finally{if(fs.existsSync(temp))fs.rmSync(temp,{recursive:true,force:true});}
}
module.exports={SCHEMA,validateBundle,assemble,exportTo,importFrom};
