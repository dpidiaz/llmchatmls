'use strict';

const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {LANGUAGES}=require('./exportar corpus canonico.js');

const SOURCE_ROOT=path.resolve(process.env.MLS_RELATED_ROOT||'related');
const PUBLIC_ROOT=path.resolve(process.env.MLS_RELATED_PUBLIC_ROOT||'public/data/related');
const CANONICAL_ROOT=path.resolve(process.env.MLS_CANONICAL_ROOT||'content');
const VERSION='1.0';
const MODEL='@cf/baai/bge-m3';
const EXPECTED_ENTRIES=10133;
const EXPECTED_LANGUAGES=10;
const LANGUAGE_BY_SLUG=new Map(LANGUAGES.map(language=>[language.slug,language]));

function sha256Buffer(value){return crypto.createHash('sha256').update(value).digest('hex')}
function canonicalBuildId(root=CANONICAL_ROOT){
  return sha256Buffer(fs.readFileSync(path.join(root,'manifest.json')));
}
function removePublished(root=PUBLIC_ROOT){fs.rmSync(root,{recursive:true,force:true})}

function validateRelatedSource(root=SOURCE_ROOT,canonicalRoot=CANONICAL_ROOT){
  const manifestFile=path.join(root,'manifest.json');
  if(!fs.existsSync(manifestFile))return {complete:false,reason:'manifest_missing'};

  const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));
  const buildId=canonicalBuildId(canonicalRoot);
  if(
    manifest.standard!=='MLS R32'||
    manifest.promptVersion!=='32.0'||
    manifest.version!==VERSION||
    manifest.source!=='semantic-neighbors'||
    manifest.semanticModel!==MODEL
  )throw new Error('Manifest de relacionados incompatible.');
  if(manifest.corpusBuildId!==buildId)throw new Error('Relacionados corresponden a otro corpus.');
  const descriptors=manifest.languages||{};
  if(Object.keys(descriptors).length!==EXPECTED_LANGUAGES)throw new Error('Manifest de relacionados no contiene los diez idiomas.');

  let totalEntries=0;
  for(const [slug,descriptor] of Object.entries(descriptors)){
    const language=LANGUAGE_BY_SLUG.get(slug);
    if(!language)throw new Error('Idioma inesperado en relacionados: '+slug);
    const file=path.join(root,descriptor.file||slug+'.json');
    if(!fs.existsSync(file))throw new Error('Falta archivo de relacionados: '+slug);
    const raw=fs.readFileSync(file);
    if(descriptor.sha256!==sha256Buffer(raw))throw new Error(slug+': hash de relacionados inválido.');
    const payload=JSON.parse(raw.toString('utf8'));
    if(
      payload.standard!=='MLS R32'||
      payload.promptVersion!=='32.0'||
      payload.version!==VERSION||
      payload.source!=='semantic-neighbors'||
      payload.semanticModel!==MODEL||
      payload.corpusBuildId!==buildId||
      payload.language!==slug||
      !payload.neighbors||
      typeof payload.neighbors!=='object'
    )throw new Error(slug+': payload de relacionados inválido.');
    if(Number(payload.totalEntries)!==Number(descriptor.totalEntries))throw new Error(slug+': totalEntries inconsistente.');
    const expectedCodes=new Set(Array.from({length:language.total},(_,index)=>language.prefix+'-'+String(index+1).padStart(4,'0')));
    if(Object.keys(payload.neighbors).length!==language.total)throw new Error(slug+': mapa de vecinos incompleto.');
    for(const [code,neighbors] of Object.entries(payload.neighbors)){
      if(!expectedCodes.has(code)||!Array.isArray(neighbors))throw new Error(slug+': mapa de vecinos no canónico.');
      const seen=new Set();
      for(const neighbor of neighbors){
        if(!expectedCodes.has(neighbor)||neighbor===code||seen.has(neighbor))throw new Error(slug+': vecino no canónico, cruzado o duplicado en '+code);
        seen.add(neighbor);
      }
    }
    totalEntries+=Number(payload.totalEntries)||0;
  }
  if(totalEntries!==EXPECTED_ENTRIES||Number(manifest.totalEntries)!==EXPECTED_ENTRIES)throw new Error('Conteo total de relacionados inesperado: '+totalEntries);
  return {complete:true,manifest,buildId,totalEntries};
}

function publishRelated(options={}){
  const sourceRoot=path.resolve(options.sourceRoot||SOURCE_ROOT);
  const publicRoot=path.resolve(options.publicRoot||PUBLIC_ROOT);
  const canonicalRoot=path.resolve(options.canonicalRoot||CANONICAL_ROOT);
  const result=validateRelatedSource(sourceRoot,canonicalRoot);
  removePublished(publicRoot);
  if(!result.complete){
    console.log(JSON.stringify({published:false,reason:result.reason}));
    return {published:false,reason:result.reason};
  }
  fs.mkdirSync(path.dirname(publicRoot),{recursive:true});
  fs.cpSync(sourceRoot,publicRoot,{recursive:true});
  fs.writeFileSync(path.join(publicRoot,'publish-health.json'),JSON.stringify({
    ok:true,
    standard:'MLS R32',
    promptVersion:'32.0',
    version:VERSION,
    source:'semantic-neighbors',
    semanticModel:MODEL,
    corpusBuildId:result.buildId,
    totalEntries:result.totalEntries,
    languages:Object.keys(result.manifest.languages).length
  },null,2)+'\n','utf8');
  console.log(JSON.stringify({published:true,totalEntries:result.totalEntries,languages:Object.keys(result.manifest.languages).length}));
  return {published:true,...result};
}

module.exports={VERSION,MODEL,EXPECTED_ENTRIES,EXPECTED_LANGUAGES,canonicalBuildId,validateRelatedSource,publishRelated};
if(require.main===module){
  try{publishRelated()}catch(error){console.error('ERROR related publish:',error.message);process.exitCode=1}
}
