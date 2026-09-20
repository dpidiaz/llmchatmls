'use strict';

const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {LANGUAGES}=require('./exportar corpus canonico.js');

const SOURCE_ROOT=path.resolve(process.env.MLS_SEMANTIC_ROOT||'semantic');
const PUBLIC_ROOT=path.resolve(process.env.MLS_SEMANTIC_PUBLIC_ROOT||'public/data/semantic');
const CANONICAL_ROOT=path.resolve(process.env.MLS_CANONICAL_ROOT||'content');
const MODEL='@cf/baai/bge-m3';
const VERSION='1.0';

function sha256Buffer(value){return crypto.createHash('sha256').update(value).digest('hex')}
function canonicalBuildId(){return sha256Buffer(fs.readFileSync(path.join(CANONICAL_ROOT,'manifest.json')))}
function removePublished(){fs.rmSync(PUBLIC_ROOT,{recursive:true,force:true})}

function validateSemanticSource(root=SOURCE_ROOT){
  const manifestFile=path.join(root,'manifest.json');
  if(!fs.existsSync(manifestFile))return {complete:false,reason:'manifest_missing'};
  const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
  const buildId=canonicalBuildId();
  if(manifest.standard!=='MLS R32'||manifest.promptVersion!=='32.0'||manifest.version!==VERSION||manifest.model!==MODEL)throw new Error('Manifest semántico incompatible.');
  if(manifest.corpusBuildId!==buildId)throw new Error('Índice semántico corresponde a otro corpus.');
  if(Number(manifest.totalEntries)!==10133)throw new Error('Conteo semántico inesperado: '+manifest.totalEntries);
  if(!manifest.languages||Object.keys(manifest.languages).length!==LANGUAGES.length)throw new Error('Manifest semántico no contiene los diez idiomas.');

  let totalEntries=0,totalChunks=0,totalBytes=0;
  for(const language of LANGUAGES){
    const descriptor=manifest.languages[language.slug];
    if(!descriptor)throw new Error('Falta descriptor semántico de '+language.slug);
    const metaFile=path.join(root,descriptor.metadata||language.slug+'.json');
    const binFile=path.join(root,descriptor.binary||language.slug+'.bin');
    if(!fs.existsSync(metaFile)||!fs.existsSync(binFile))throw new Error('Faltan archivos semánticos de '+language.slug);
    const meta=JSON.parse(fs.readFileSync(metaFile,'utf8'));
    const binary=fs.readFileSync(binFile);
    if(meta.language!==language.slug||meta.totalEntries!==language.total||meta.corpusBuildId!==buildId||meta.model!==MODEL||meta.version!==VERSION)throw new Error(language.slug+': metadata semántica inválida.');
    if(meta.binarySha256!==sha256Buffer(binary)||descriptor.binarySha256!==meta.binarySha256)throw new Error(language.slug+': hash binario semántico inválido.');
    if(Number(meta.totalChunks)!==Number(descriptor.totalChunks))throw new Error(language.slug+': chunks inconsistentes.');
    if(binary.length!==Number(meta.totalChunks)*Number(meta.recordBytes))throw new Error(language.slug+': tamaño binario inconsistente.');
    totalEntries+=meta.totalEntries;
    totalChunks+=meta.totalChunks;
    totalBytes+=binary.length;
  }
  if(totalEntries!==manifest.totalEntries||totalChunks!==manifest.totalChunks||totalBytes!==manifest.totalBytes)throw new Error('Totales semánticos inconsistentes.');
  return {complete:true,manifest,buildId,totalEntries,totalChunks,totalBytes};
}

function publishSemanticIndex(){
  const result=validateSemanticSource();
  removePublished();
  if(!result.complete){
    console.log(JSON.stringify({published:false,reason:result.reason}));
    return {published:false,reason:result.reason};
  }
  fs.mkdirSync(path.dirname(PUBLIC_ROOT),{recursive:true});
  fs.cpSync(SOURCE_ROOT,PUBLIC_ROOT,{recursive:true});
  fs.writeFileSync(path.join(PUBLIC_ROOT,'publish-health.json'),JSON.stringify({
    ok:true,
    standard:'MLS R32',
    promptVersion:'32.0',
    model:MODEL,
    version:VERSION,
    corpusBuildId:result.buildId,
    totalEntries:result.totalEntries,
    totalChunks:result.totalChunks,
    totalBytes:result.totalBytes
  },null,2)+'\n','utf8');
  console.log(JSON.stringify({published:true,totalEntries:result.totalEntries,totalChunks:result.totalChunks,totalBytes:result.totalBytes}));
  return {published:true,...result};
}

module.exports={MODEL,VERSION,validateSemanticSource,publishSemanticIndex,canonicalBuildId};
if(require.main===module){
  try{publishSemanticIndex()}catch(error){console.error('ERROR semantic publish:',error.message);process.exitCode=1}
}
