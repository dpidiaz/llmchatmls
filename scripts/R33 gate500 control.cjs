'use strict';

const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const ROOT=process.cwd();
const GATE='docs/evidence y provenance/20 R33 Gate 500 Pool.json';
const CONTROL='docs/evidence y provenance/21 R33 Active Pool Control.json';
const GATE1000='docs/evidence y provenance/23 R33 Gate 1000 Pool.json';
const PRIOR=[
  'docs/evidence y provenance/04 Pilot 20 Manifest.json',
  'docs/evidence y provenance/13 Gate 100 Manifest.json',
  'docs/evidence y provenance/15 Evidence Farm Correction Repeat Pool.json',
  'docs/evidence y provenance/17 GitHub Native Benchmark 100 Pool.json'
];
function read(rel){return JSON.parse(fs.readFileSync(path.join(ROOT,rel),'utf8'));}
function write(rel,value){fs.writeFileSync(path.join(ROOT,rel),JSON.stringify(value,null,2)+'\n');}
function gitBlobSha(rel){
  const bytes=fs.readFileSync(path.join(ROOT,rel));
  const header=Buffer.from('blob '+bytes.length+'\0');
  return crypto.createHash('sha1').update(header).update(bytes).digest('hex');
}
function fail(code,message){const e=new Error(message||code);e.code=code;throw e;}
function validate(){
  const pool=read(GATE),control=read(CONTROL);
  if(pool.poolId!=='MLS-R33-GITHUB-NATIVE-GATE-500')fail('POOL_ID','Gate 500 poolId inválido.');
  if(pool.sourceOfTruth!=='github'||pool.editorialArchitecture!=='github-native')fail('ARCHITECTURE','Gate 500 debe ser GitHub-native.');
  if(pool.cloudflareEditorialAllowed!==false||pool.d1EditorialAllowed!==false)fail('RUNTIME_EDITORIAL','Cloudflare/D1 editorial debe permanecer false.');
  if(pool.dispatcherOnly!==true)fail('DISPATCHER_ONLY','Gate 500 debe requerir Global Dispatcher.');
  if(!Array.isArray(pool.entries)||pool.entries.length!==500)fail('ENTRY_COUNT','Gate 500 requiere 500 entradas.');
  const codes=new Set(),counts={},drift=[];
  for(const e of pool.entries){
    if(codes.has(e.code))fail('DUPLICATE_CODE','Código duplicado: '+e.code);
    codes.add(e.code);counts[e.language]=(counts[e.language]||0)+1;
    if(!/^[a-f0-9]{40}$/.test(String(e.contentBlobSha||'')))fail('BLOB_SHA','contentBlobSha inválido: '+e.code);
    const actual=gitBlobSha(e.contentPath);
    if(actual!==e.contentBlobSha)drift.push({code:e.code,expected:e.contentBlobSha,actual});
  }
  if(Object.keys(counts).length!==10||Object.values(counts).some(x=>x!==50))fail('LANGUAGE_DISTRIBUTION','Gate 500 debe tener 50 entradas por cada uno de 10 idiomas.');
  const prior=new Set();
  for(const rel of PRIOR)for(const e of read(rel).entries||[])prior.add(e.code);
  const overlap=pool.entries.filter(e=>prior.has(e.code)).map(e=>e.code);
  if(overlap.length)fail('PRIOR_OVERLAP','Gate 500 contiene códigos usados previamente: '+overlap.slice(0,10).join(', '));
  if(prior.size!==320)fail('PRIOR_CARDINALITY','Se esperaban 320 códigos previos, hay '+prior.size+'.');
  if(drift.length)fail('CONTENT_BLOB_DRIFT','Cambió contenido canónico de '+drift.length+' entradas Gate 500.');
  if(control.activePoolId==='MLS-R33-GITHUB-NATIVE-GATE-1000'){
    if(control.activePoolPath!==GATE1000||control.candidatePoolPath!==GATE1000||control.candidatePoolId!=='MLS-R33-GITHUB-NATIVE-GATE-1000')fail('GATE1000_CONTROL','Active Pool Control Gate 1000 inconsistente.');
    if(control.gate1000Authorized!==true||control.gate500Authorized!==true||control.activationState!=='authorized')fail('GATE1000_AUTH','Gate 1000/Gate 500 authorization flags inconsistentes.');
  }else if(control.candidatePoolPath!==GATE||control.candidatePoolId!==pool.poolId)fail('CONTROL_CANDIDATE','Active Pool Control no apunta al candidato Gate 500.');
  return {pool,control,counts,priorCodes:prior.size,blobDrift:drift.length};
}
const mode=process.argv.includes('--activate')?'activate':'check';
try{
  const v=validate();
  if(mode==='activate'){
    if(!process.argv.includes('--confirm=GATE500'))fail('CONFIRMATION_REQUIRED','Activación requiere --confirm=GATE500.');
    if(v.pool.status!=='prepared'||v.pool.active!==false||v.pool.gate500Authorized!==false)fail('ACTIVATION_STATE','Gate 500 no está en estado preparado bloqueado.');
    v.pool.status='authorized';v.pool.active=true;v.pool.gate500Authorized=true;v.pool.activatedAt=new Date().toISOString();
    v.control.activePoolPath=GATE;v.control.activePoolId=v.pool.poolId;v.control.gate500Authorized=true;v.control.activationState='authorized';v.control.updatedAt=new Date().toISOString();
    write(GATE,v.pool);write(CONTROL,v.control);
  }
  console.log(JSON.stringify({ok:true,mode,poolId:v.pool.poolId,entries:v.pool.entries.length,languages:v.counts,priorCodes:v.priorCodes,blobDrift:v.blobDrift,active:mode==='activate'?true:v.pool.active,authorized:mode==='activate'?true:v.pool.gate500Authorized},null,2));
}catch(error){console.error(JSON.stringify({ok:false,error:error.code||'GATE500_PREP_ERROR',message:error.message},null,2));process.exitCode=1;}
