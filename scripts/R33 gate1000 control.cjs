'use strict';

const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const ROOT=process.cwd();
const GATE='docs/evidence y provenance/23 R33 Gate 1000 Pool.json';
const CONTROL='docs/evidence y provenance/21 R33 Active Pool Control.json';
const GATE500='docs/evidence y provenance/20 R33 Gate 500 Pool.json';
const PRIOR=[
  'docs/evidence y provenance/04 Pilot 20 Manifest.json',
  'docs/evidence y provenance/13 Gate 100 Manifest.json',
  'docs/evidence y provenance/15 Evidence Farm Correction Repeat Pool.json',
  'docs/evidence y provenance/17 GitHub Native Benchmark 100 Pool.json',
  GATE500
];
function read(rel){return JSON.parse(fs.readFileSync(path.join(ROOT,rel),'utf8'));}
function gitBlobSha(rel){
  const bytes=fs.readFileSync(path.join(ROOT,rel));
  const header=Buffer.from('blob '+bytes.length+'\0');
  return crypto.createHash('sha1').update(header).update(bytes).digest('hex');
}
function fail(code,message){const e=new Error(message||code);e.code=code;throw e;}
function validate(){
  const pool=read(GATE),control=read(CONTROL),gate500=read(GATE500);
  if(pool.poolId!=='MLS-R33-GITHUB-NATIVE-GATE-1000')fail('POOL_ID','Gate 1000 poolId inválido.');
  if(pool.status!=='prepared'||pool.active!==false||pool.gate1000Authorized!==false)fail('PREPARATION_STATE','Gate 1000 debe permanecer prepared/inactive/unauthorized.');
  if(pool.sourceOfTruth!=='github'||pool.editorialArchitecture!=='github-native')fail('ARCHITECTURE','Gate 1000 debe ser GitHub-native.');
  if(pool.cloudflareEditorialAllowed!==false||pool.d1EditorialAllowed!==false)fail('RUNTIME_EDITORIAL','Cloudflare/D1 editorial debe permanecer false.');
  if(pool.dispatcherOnly!==true)fail('DISPATCHER_ONLY','Gate 1000 debe requerir Global Dispatcher.');
  if(!Array.isArray(pool.entries)||pool.entries.length!==1000)fail('ENTRY_COUNT','Gate 1000 requiere 1000 entradas.');
  const codes=new Set(),counts={},drift=[];
  for(const e of pool.entries){
    if(codes.has(e.code))fail('DUPLICATE_CODE','Código duplicado: '+e.code);
    codes.add(e.code);counts[e.language]=(counts[e.language]||0)+1;
    if(!/^[a-f0-9]{40}$/.test(String(e.contentBlobSha||'')))fail('BLOB_SHA','contentBlobSha inválido: '+e.code);
    if(!fs.existsSync(path.join(ROOT,e.contentPath)))fail('CONTENT_MISSING','No existe '+e.contentPath);
    const actual=gitBlobSha(e.contentPath);
    if(actual!==e.contentBlobSha)drift.push({code:e.code,expected:e.contentBlobSha,actual});
  }
  if(Object.keys(counts).length!==10||Object.values(counts).some(x=>x!==100))fail('LANGUAGE_DISTRIBUTION','Gate 1000 debe tener 100 entradas por cada uno de 10 idiomas.');
  const prior=new Set();
  for(const rel of PRIOR)for(const e of read(rel).entries||[])prior.add(e.code);
  const overlap=pool.entries.filter(e=>prior.has(e.code)).map(e=>e.code);
  if(prior.size!==820)fail('PRIOR_CARDINALITY','Se esperaban 820 códigos previos, hay '+prior.size+'.');
  if(overlap.length)fail('PRIOR_OVERLAP','Gate 1000 contiene códigos usados previamente: '+overlap.slice(0,10).join(', '));
  if(drift.length)fail('CONTENT_BLOB_DRIFT','Cambió contenido canónico de '+drift.length+' entradas Gate 1000.');
  if(control.activePoolId!=='MLS-R33-GITHUB-NATIVE-GATE-500'||control.activePoolPath!==GATE500)fail('ACTIVE_POOL_CHANGED','Gate 500 debe permanecer como activePool durante preparación Gate 1000.');
  if(control.gate500Authorized!==true||control.activationState!=='authorized')fail('GATE500_CONTROL','Gate 500 activo no está autorizado.');
  if(gate500.status!=='authorized'||gate500.active!==true||gate500.gate500Authorized!==true)fail('GATE500_STATE','Gate 500 debe seguir autorizado y activo.');
  return {pool,counts,priorCodes:prior.size,blobDrift:drift.length,activePoolId:control.activePoolId};
}
try{
  const v=validate();
  console.log(JSON.stringify({ok:true,mode:'check',poolId:v.pool.poolId,entries:v.pool.entries.length,languages:v.counts,priorCodes:v.priorCodes,blobDrift:v.blobDrift,active:false,authorized:false,activePoolId:v.activePoolId,cloudflareEditorialInteractions:0,d1Reads:0,d1Writes:0},null,2));
}catch(error){
  console.error(JSON.stringify({ok:false,error:error.code||'GATE1000_PREP_ERROR',message:error.message},null,2));
  process.exitCode=1;
}
