'use strict';

const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const zlib=require('node:zlib');

const REGISTRY_URL='https://storage.googleapis.com/moz-fx-translations-data--303e-prod-translations-data/db/models.json';
const ENGINE_PACKAGE='@browsermt/bergamot-translator';
const ENGINE_VERSION='0.4.9';
const OUT_DIR='MLS R32 OVERLAY/translator';
const REGISTRY_OUT=path.join(OUT_DIR,'registry.json');
const PACKS_OUT=path.join(OUT_DIR,'packs.json');

const LANGUAGES=[
  {slug:'espanol-guatemala',code:'es',label:'Español'},
  {slug:'ingles',code:'en',label:'Inglés'},
  {slug:'portugues',code:'pt',label:'Portugués'},
  {slug:'italiano',code:'it',label:'Italiano'},
  {slug:'frances',code:'fr',label:'Francés'},
  {slug:'aleman',code:'de',label:'Alemán'},
  {slug:'japones',code:'ja',label:'Japonés'},
  {slug:'chino-taiwan',code:'zh',label:'Chino (Taiwán)'},
  {slug:'coreano',code:'ko',label:'Coreano'},
  {slug:'ruso',code:'ru',label:'Ruso'}
];

const RUNTIME_FILES=[
  'translator.js',
  'worker/translator-worker.js',
  'worker/bergamot-translator-worker.js',
  'worker/bergamot-translator-worker.wasm'
];

function sha256(buffer){
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function priority(status){
  if(status==='Release')return 0;
  if(status==='Release Android')return 1;
  if(status==='Nightly')return 2;
  return 3;
}

async function fetchBuffer(url){
  const response=await fetch(url);
  if(!response.ok)throw new Error('HTTP '+response.status+' '+url);
  return Buffer.from(await response.arrayBuffer());
}

function gunzipMaybe(buffer,name){
  return String(name).endsWith('.gz')?zlib.gunzipSync(buffer):buffer;
}

function mapPart(part){
  if(part==='lexicalShortlist')return 'lex';
  if(part==='srcVocab')return 'srcvocab';
  if(part==='trgVocab')return 'trgvocab';
  return part;
}

function runtimeManifest(){
  const root=path.dirname(require.resolve(ENGINE_PACKAGE+'/package.json'));
  return RUNTIME_FILES.map(rel=>{
    const file=path.join(root,rel);
    const data=fs.readFileSync(file);
    return {
      url:'/translator/bergamot/'+rel,
      relativePath:rel,
      bytes:data.byteLength,
      sha256:sha256(data)
    };
  });
}

async function main(){
  fs.mkdirSync(OUT_DIR,{recursive:true});
  const modernResponse=await fetch(REGISTRY_URL);
  if(!modernResponse.ok)throw new Error('No se pudo leer el registro Mozilla: '+modernResponse.status);
  const modern=await modernResponse.json();
  const base=String(modern.baseUrl||'').replace(/\/$/,'');
  if(!base)throw new Error('Registro Mozilla sin baseUrl.');

  const pureRegistry={};
  const directions={};
  const nonEnglish=LANGUAGES.filter(lang=>lang.code!=='en');

  for(const lang of nonEnglish){
    for(const pair of [lang.code+'-en','en-'+lang.code]){
      const candidates=(modern.models?.[pair]||[]).slice().sort((a,b)=>priority(a.releaseStatus)-priority(b.releaseStatus));
      const chosen=candidates.find(item=>item.releaseStatus==='Release'||item.releaseStatus==='Release Android')||candidates[0];
      if(!chosen)throw new Error('No existe modelo para '+pair);

      const files={};
      const manifestFiles=[];
      for(const [rawPart,fileMeta] of Object.entries(chosen.files||{})){
        if(!fileMeta||typeof fileMeta!=='object'||!fileMeta.path)continue;
        const part=mapPart(rawPart);
        const upstreamPath=String(fileMeta.path).replace(/^\//,'');
        const upstreamUrl=base+'/'+upstreamPath;
        process.stdout.write('Descargando '+pair+' '+part+'... ');
        const compressed=await fetchBuffer(upstreamUrl);
        const uncompressed=gunzipMaybe(compressed,upstreamPath);
        const compressedHash=sha256(compressed);
        const uncompressedHash=sha256(uncompressed);
        if(fileMeta.uncompressedHash&&String(fileMeta.uncompressedHash).toLowerCase()!==uncompressedHash){
          throw new Error('Hash descomprimido inválido para '+pair+' '+part);
        }
        console.log((compressed.byteLength/1048576).toFixed(2)+' MiB');

        const proxyUrl='/translation-models/'+upstreamPath;
        files[part]={
          name:proxyUrl,
          size:uncompressed.byteLength,
          expectedSha256Hash:uncompressedHash
        };
        manifestFiles.push({
          pair,
          part,
          url:proxyUrl,
          upstreamPath,
          compressedBytes:compressed.byteLength,
          compressedSha256:compressedHash,
          uncompressedBytes:uncompressed.byteLength,
          uncompressedSha256:uncompressedHash
        });
      }
      if(!files.model)throw new Error('Modelo sin archivo model para '+pair);
      if(chosen.config)files.config=chosen.config;
      pureRegistry[pair.replace('-','')]=files;
      directions[pair]={
        pair,
        releaseStatus:chosen.releaseStatus||null,
        architecture:chosen.architecture||null,
        files:manifestFiles
      };
    }
  }

  const runtime=runtimeManifest();
  const runtimeBytes=runtime.reduce((sum,item)=>sum+item.bytes,0);
  const languages={};
  for(const lang of LANGUAGES){
    if(lang.code==='en'){
      languages[lang.slug]={
        slug:lang.slug,code:lang.code,label:lang.label,
        runtimeOnly:true,directions:[],files:[],
        compressedBytes:0,uncompressedBytes:0
      };
      continue;
    }
    const pairNames=[lang.code+'-en','en-'+lang.code];
    const files=pairNames.flatMap(pair=>directions[pair].files);
    languages[lang.slug]={
      slug:lang.slug,
      code:lang.code,
      label:lang.label,
      runtimeOnly:false,
      directions:pairNames,
      files,
      compressedBytes:files.reduce((sum,item)=>sum+item.compressedBytes,0),
      uncompressedBytes:files.reduce((sum,item)=>sum+item.uncompressedBytes,0)
    };
  }

  const registryJson=JSON.stringify(pureRegistry,null,2)+'\n';
  fs.writeFileSync(REGISTRY_OUT,registryJson);
  const registryHash=sha256(Buffer.from(registryJson));
  const packVersion='mozilla-'+String(modern.generated||'unknown').replace(/[^0-9A-Za-z]+/g,'').slice(0,32)+'-'+registryHash.slice(0,12);
  const packs={
    schemaVersion:1,
    packVersion,
    generatedFrom:modern.generated||null,
    sourceRegistry:REGISTRY_URL,
    engine:{
      name:'Bergamot',
      package:ENGINE_PACKAGE,
      version:ENGINE_VERSION,
      license:'MPL-2.0'
    },
    pivotLanguage:'en',
    runtime,
    runtimeBytes,
    languages
  };
  fs.writeFileSync(PACKS_OUT,JSON.stringify(packs,null,2)+'\n');
  console.log(JSON.stringify({
    ok:true,
    packVersion,
    languages:Object.keys(languages).length,
    directions:Object.keys(directions).length,
    runtimeBytes,
    modelCompressedBytes:Object.values(languages).reduce((sum,item)=>sum+item.compressedBytes,0)
  },null,2));
}

if(require.main===module){
  main().catch(error=>{console.error(error);process.exit(1)});
}

module.exports={LANGUAGES,RUNTIME_FILES,REGISTRY_URL,ENGINE_PACKAGE,ENGINE_VERSION,mapPart,priority,sha256,gunzipMaybe};
