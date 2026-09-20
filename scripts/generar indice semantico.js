'use strict';

const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {LANGUAGES,PROMPT_VERSION}=require('./exportar corpus canonico.js');
const {mergeSections,strip}=require('./analizar indice semantico.js');

const MODEL='@cf/baai/bge-m3';
const VERSION='1.0';
const SOURCE_ROOT=path.resolve(process.env.MLS_CANONICAL_ROOT||'content');
const OUTPUT_ROOT=path.resolve(process.env.MLS_SEMANTIC_ROOT||'semantic');
const BATCH_SIZE=Math.max(1,Math.min(32,Number(process.env.MLS_SEMANTIC_BATCH_SIZE)||12));

function sha256Buffer(value){return crypto.createHash('sha256').update(value).digest('hex')}
function sourceBuildId(root=SOURCE_ROOT){
  return sha256Buffer(fs.readFileSync(path.join(root,'manifest.json')));
}
function headingOf(chunk,index){
  const match=String(chunk||'').match(/^####\s+([^\n]+)/);
  return match?strip(match[1]).slice(0,180):('Fragmento '+String(index+1));
}
function chunkInput(article,chunk){
  return strip([
    article.title,
    article.level,
    article.part,
    article.chapter,
    chunk
  ].filter(Boolean).join('\n\n'));
}
function recordsForArticle(article){
  const chunks=mergeSections(article.articleMarkdown);
  return chunks.map((chunk,index)=>({
    id:article.code+':'+String(index+1).padStart(2,'0'),
    code:article.code,
    language:article.language,
    n:article.n,
    title:article.title,
    level:article.level||'',
    part:article.part||'',
    chapter:article.chapter||'',
    section:headingOf(chunk,index),
    chunk:index,
    text:chunkInput(article,chunk)
  }));
}
function readLanguageRecords(language,root=SOURCE_ROOT){
  const records=[];
  for(let n=1;n<=language.total;n++){
    const code=language.prefix+'-'+String(n).padStart(4,'0');
    const file=path.join(root,language.slug,code+'.json');
    const article=JSON.parse(fs.readFileSync(file,'utf8'));
    if(article.code!==code||article.language!==language.slug||article.promptVersion!==PROMPT_VERSION)throw new Error(code+': identidad canónica inválida');
    if(/legacy/i.test(String(article.provider||''))||/legacy/i.test(String(article.auditProvider||'')))throw new Error(code+': proveedor legacy');
    records.push(...recordsForArticle(article));
  }
  return records;
}
function normalizeVector(vector){
  let norm=0;
  for(const value of vector)norm+=Number(value)*Number(value);
  norm=Math.sqrt(norm)||1;
  return vector.map(value=>Number(value)/norm);
}
function quantizeVector(vector){
  const normalized=normalizeVector(vector);
  let maxAbs=0;
  for(const value of normalized)maxAbs=Math.max(maxAbs,Math.abs(value));
  const scale=maxAbs?maxAbs/127:1/127;
  const out=Buffer.allocUnsafe(4+normalized.length);
  out.writeFloatLE(scale,0);
  for(let i=0;i<normalized.length;i++){
    const q=Math.max(-127,Math.min(127,Math.round(normalized[i]/scale)));
    out.writeInt8(q,4+i);
  }
  return {buffer:out,scale};
}
function dequantizedDot(buffer,offset,dimensions,query){
  const scale=buffer.readFloatLE(offset);
  let score=0;
  for(let i=0;i<dimensions;i++)score+=buffer.readInt8(offset+4+i)*scale*query[i];
  return score;
}
async function discoverAccountId(token){
  if(process.env.CLOUDFLARE_ACCOUNT_ID)return process.env.CLOUDFLARE_ACCOUNT_ID;
  const response=await fetch('https://api.cloudflare.com/client/v4/accounts?per_page=50',{
    headers:{authorization:'Bearer '+token,accept:'application/json'}
  });
  const payload=await response.json();
  const accounts=Array.isArray(payload?.result)?payload.result:[];
  if(!response.ok||payload?.success===false||accounts.length!==1){
    throw new Error('No se pudo determinar una única cuenta Cloudflare. Define CLOUDFLARE_ACCOUNT_ID.');
  }
  return accounts[0].id;
}
function embeddingRows(payload){
  const result=payload?.result||payload;
  const data=result?.data;
  if(Array.isArray(data)&&Array.isArray(data[0]))return data;
  const shape=result?.shape;
  if(Array.isArray(data)&&Array.isArray(shape)&&shape.length===2){
    const rows=[];
    const width=Number(shape[1]);
    for(let i=0;i<Number(shape[0]);i++)rows.push(data.slice(i*width,(i+1)*width));
    return rows;
  }
  throw new Error('Respuesta de embeddings sin data/shape reconocible.');
}
async function embedBatch(texts,{token,accountId,model=MODEL}){
  const endpoint=String(process.env.MLS_EMBEDDING_ENDPOINT||'').trim();
  const endpointKey=String(process.env.MLS_EMBEDDING_KEY||'').trim();
  if(endpoint){
    let lastError=null;
    for(let attempt=1;attempt<=8;attempt++){
      const response=await fetch(endpoint,{
        method:'POST',
        headers:{
          'content-type':'application/json',
          accept:'application/json',
          ...(endpointKey?{authorization:'Bearer '+endpointKey}:{})
        },
        body:JSON.stringify({texts})
      });
      const payload=await response.json().catch(()=>({}));
      if(response.ok&&payload?.ok&&Array.isArray(payload?.vectors)){
        if(payload.model!==model)throw new Error('Modelo inesperado del endpoint: '+payload.model);
        if(payload.vectors.length!==texts.length)throw new Error('Endpoint devolvió '+payload.vectors.length+' embeddings para '+texts.length+' textos.');
        return payload.vectors;
      }
      lastError=new Error('Endpoint de embeddings falló: '+(payload?.error||('HTTP '+response.status)));
      lastError.status=response.status;
      lastError.endpoint=payload;
      const retryable=[404,408,409,425,429,500,502,503,504].includes(response.status);
      if(!retryable||attempt===8)throw lastError;
      const delay=Math.min(8000,500*Math.pow(2,attempt-1));
      process.stdout.write('semantic endpoint retry '+attempt+'/8 after HTTP '+response.status+' in '+delay+'ms\n');
      await new Promise(resolve=>setTimeout(resolve,delay));
    }
    throw lastError||new Error('Endpoint de embeddings no disponible.');
  }

  const response=await fetch('https://api.cloudflare.com/client/v4/accounts/'+accountId+'/ai/run/'+model,{
    method:'POST',
    headers:{authorization:'Bearer '+token,'content-type':'application/json',accept:'application/json'},
    body:JSON.stringify({text:texts})
  });
  const payload=await response.json().catch(()=>({}));
  if(!response.ok||payload?.success===false){
    const message=(payload?.errors||[]).map(x=>x.message||x.code).join('; ')||('HTTP '+response.status);
    const error=new Error('Workers AI embeddings falló: '+message);
    error.status=response.status;
    error.cloudflare=payload;
    throw error;
  }
  const rows=embeddingRows(payload);
  if(rows.length!==texts.length)throw new Error('Workers AI devolvió '+rows.length+' embeddings para '+texts.length+' textos.');
  return rows;
}
function existingLanguageIsCurrent(language,buildId,root=OUTPUT_ROOT){
  const metaFile=path.join(root,language.slug+'.json');
  const binFile=path.join(root,language.slug+'.bin');
  if(!fs.existsSync(metaFile)||!fs.existsSync(binFile))return false;
  try{
    const meta=JSON.parse(fs.readFileSync(metaFile,'utf8'));
    return meta.version===VERSION&&meta.model===MODEL&&meta.corpusBuildId===buildId&&meta.totalEntries===language.total&&meta.binarySha256===sha256Buffer(fs.readFileSync(binFile));
  }catch{return false}
}
async function generateLanguage(language,options={}){
  const sourceRoot=path.resolve(options.sourceRoot||SOURCE_ROOT);
  const outputRoot=path.resolve(options.outputRoot||OUTPUT_ROOT);
  const token=options.token||process.env.CLOUDFLARE_API_TOKEN;
  const endpoint=String(process.env.MLS_EMBEDDING_ENDPOINT||'').trim();
  if(!endpoint&&!token)throw new Error('Falta CLOUDFLARE_API_TOKEN o MLS_EMBEDDING_ENDPOINT.');
  const buildId=sourceBuildId(sourceRoot);
  fs.mkdirSync(outputRoot,{recursive:true});
  if(!options.force&&existingLanguageIsCurrent(language,buildId,outputRoot)){
    return {language:language.slug,skipped:true};
  }
  const accountId=endpoint?(options.accountId||null):(options.accountId||await discoverAccountId(token));
  const records=readLanguageRecords(language,sourceRoot);
  const buffers=[];
  let dimensions=0;
  for(let start=0;start<records.length;start+=BATCH_SIZE){
    const batch=records.slice(start,start+BATCH_SIZE);
    const vectors=await embedBatch(batch.map(x=>x.text),{token,accountId});
    for(const vector of vectors){
      if(!dimensions)dimensions=vector.length;
      if(vector.length!==dimensions)throw new Error(language.slug+': dimensión inconsistente.');
      buffers.push(quantizeVector(vector).buffer);
    }
    process.stdout.write('semantic '+language.slug+' '+Math.min(start+BATCH_SIZE,records.length)+'/'+records.length+'\n');
  }
  if(!dimensions)throw new Error(language.slug+': no se generaron vectores.');
  const binary=Buffer.concat(buffers);
  const binFile=path.join(outputRoot,language.slug+'.bin');
  fs.writeFileSync(binFile,binary);
  const meta={
    standard:'MLS R32',
    promptVersion:PROMPT_VERSION,
    version:VERSION,
    model:MODEL,
    language:language.slug,
    languageName:language.name,
    corpusBuildId:buildId,
    quantization:'symmetric-int8-unit-vector',
    dimensions,
    recordBytes:4+dimensions,
    totalEntries:language.total,
    totalChunks:records.length,
    binary:language.slug+'.bin',
    binarySha256:sha256Buffer(binary),
    chunks:records.map(({text,...record})=>record)
  };
  fs.writeFileSync(path.join(outputRoot,language.slug+'.json'),JSON.stringify(meta)+'\n','utf8');
  return {language:language.slug,skipped:false,dimensions,totalChunks:records.length,bytes:binary.length};
}
function buildManifest(outputRoot=OUTPUT_ROOT){
  const buildId=sourceBuildId();
  const manifest={
    standard:'MLS R32',
    promptVersion:PROMPT_VERSION,
    version:VERSION,
    model:MODEL,
    corpusBuildId:buildId,
    quantization:'symmetric-int8-unit-vector',
    languages:{},
    totalEntries:0,
    totalChunks:0,
    totalBytes:0
  };
  for(const language of LANGUAGES){
    const file=path.join(outputRoot,language.slug+'.json');
    const bin=path.join(outputRoot,language.slug+'.bin');
    if(!fs.existsSync(file)||!fs.existsSync(bin))return null;
    const meta=JSON.parse(fs.readFileSync(file,'utf8'));
    if(meta.corpusBuildId!==buildId||meta.model!==MODEL||meta.version!==VERSION)throw new Error(language.slug+': índice semántico obsoleto.');
    manifest.languages[language.slug]={
      name:language.name,
      totalEntries:meta.totalEntries,
      totalChunks:meta.totalChunks,
      dimensions:meta.dimensions,
      metadata:language.slug+'.json',
      binary:language.slug+'.bin',
      binarySha256:meta.binarySha256,
      bytes:fs.statSync(bin).size
    };
    manifest.totalEntries+=meta.totalEntries;
    manifest.totalChunks+=meta.totalChunks;
    manifest.totalBytes+=fs.statSync(bin).size;
  }
  fs.writeFileSync(path.join(outputRoot,'manifest.json'),JSON.stringify(manifest,null,2)+'\n','utf8');
  return manifest;
}
async function main(){
  const argIndex=process.argv.indexOf('--language');
  const only=argIndex>=0?process.argv[argIndex+1]:null;
  const force=process.argv.includes('--force');
  const languages=only?LANGUAGES.filter(x=>x.slug===only):LANGUAGES;
  if(only&&!languages.length)throw new Error('Idioma desconocido: '+only);
  const token=process.env.CLOUDFLARE_API_TOKEN;
  const endpoint=String(process.env.MLS_EMBEDDING_ENDPOINT||'').trim();
  if(!endpoint&&!token)throw new Error('Falta CLOUDFLARE_API_TOKEN o MLS_EMBEDDING_ENDPOINT.');
  const accountId=endpoint?null:await discoverAccountId(token);
  for(const language of languages){
    const result=await generateLanguage(language,{token,accountId,force});
    console.log(JSON.stringify(result));
  }
  const manifest=buildManifest();
  if(manifest)console.log('SEMANTIC_MANIFEST '+JSON.stringify({totalEntries:manifest.totalEntries,totalChunks:manifest.totalChunks,totalBytes:manifest.totalBytes,model:manifest.model}));
  else console.log('SEMANTIC_MANIFEST incomplete');
}

module.exports={MODEL,VERSION,BATCH_SIZE,headingOf,chunkInput,recordsForArticle,readLanguageRecords,normalizeVector,quantizeVector,dequantizedDot,embeddingRows,discoverAccountId,embedBatch,existingLanguageIsCurrent,generateLanguage,buildManifest};

if(require.main===module){
  main().catch(error=>{console.error('ERROR semantic index:',error.message);if(error.cloudflare)console.error(JSON.stringify(error.cloudflare));process.exitCode=1});
}
