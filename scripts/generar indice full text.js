'use strict';

const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {LANGUAGES,PROMPT_VERSION}=require('./exportar corpus canonico.js');
const {stripMarkdown}=require('./generar datos canonicos compatibles.js');

const SOURCE_ROOT=path.resolve(process.env.MLS_CANONICAL_ROOT||'content');
const OUTPUT_ROOT=path.resolve(process.env.MLS_SEARCH_ROOT||'public/data/search');
const VERSION='1.0';
const MAX_INDEX_BYTES=20*1024*1024;
const MAX_DF_RATIO=0.65;
const MAX_TF=15;

const LOCALES={
  'espanol-guatemala':'es-GT',
  ingles:'en',
  portugues:'pt-BR',
  italiano:'it',
  frances:'fr',
  aleman:'de',
  japones:'ja',
  'chino-taiwan':'zh-TW',
  coreano:'ko',
  ruso:'ru'
};

function sha256(text){return crypto.createHash('sha256').update(text,'utf8').digest('hex')}
function padded(n){return String(n).padStart(4,'0')}
function normalizeText(text,locale='es'){
  return String(text||'')
    .toLocaleLowerCase(locale)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}
function fallbackSegments(text){
  try{return text.match(/[\p{L}\p{N}]+/gu)||[]}
  catch{return text.match(/[A-Za-zÀ-ž\u0400-\u04ff\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af0-9]+/g)||[]}
}
function keepToken(token){
  const chars=Array.from(token);
  if(chars.length>=2)return true;
  return /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/u.test(token);
}
function tokenizeText(text,locale='es'){
  const normalized=normalizeText(text,locale);
  const out=[];
  if(typeof Intl!=='undefined'&&typeof Intl.Segmenter==='function'){
    const segmenter=new Intl.Segmenter(locale,{granularity:'word'});
    for(const item of segmenter.segment(normalized)){
      if(item.isWordLike===false)continue;
      const token=String(item.segment||'').trim();
      if(token&&keepToken(token))out.push(token);
    }
  }else{
    for(const token of fallbackSegments(normalized))if(keepToken(token))out.push(token);
  }
  return out;
}
function countTokens(tokens,weight=1,target=new Map()){
  for(const token of tokens)target.set(token,Math.min(MAX_TF,(target.get(token)||0)+weight));
  return target;
}
function readArticle(language,n,sourceRoot=SOURCE_ROOT){
  const code=language.prefix+'-'+padded(n);
  const file=path.join(sourceRoot,language.slug,code+'.json');
  const article=JSON.parse(fs.readFileSync(file,'utf8'));
  if(article.code!==code||article.language!==language.slug||article.promptVersion!==PROMPT_VERSION)throw new Error(code+': identidad canónica inválida');
  if(/legacy/i.test(String(article.provider||''))||/legacy/i.test(String(article.auditProvider||'')))throw new Error(code+': proveedor legacy');
  if(!String(article.articleMarkdown||'').trim())throw new Error(code+': articleMarkdown vacío');
  return article;
}
function stable(value){return JSON.stringify(value)+'\n'}

function buildFullTextSearch(options={}){
  const sourceRoot=path.resolve(options.sourceRoot||SOURCE_ROOT);
  const outputRoot=path.resolve(options.outputRoot||OUTPUT_ROOT);
  const languages=options.languages||LANGUAGES;
  fs.rmSync(outputRoot,{recursive:true,force:true});
  fs.mkdirSync(outputRoot,{recursive:true});

  const manifestRaw=fs.readFileSync(path.join(sourceRoot,'manifest.json'),'utf8');
  const corpusBuildId=sha256(manifestRaw);
  const manifest={
    standard:'MLS R32',
    promptVersion:PROMPT_VERSION,
    version:VERSION,
    source:'GitHub canonical content/',
    corpusBuildId,
    totalEntries:0,
    totalBytes:0,
    languages:{}
  };

  for(const language of languages){
    const locale=LOCALES[language.slug]||'es';
    const codes=[];
    const docMaps=[];
    const df=new Map();

    for(let n=1;n<=language.total;n++){
      const article=readArticle(language,n,sourceRoot);
      const counts=new Map();
      countTokens(tokenizeText(stripMarkdown(article.articleMarkdown),locale),1,counts);
      countTokens(tokenizeText(article.part,locale),2,counts);
      countTokens(tokenizeText(article.chapter,locale),3,counts);
      countTokens(tokenizeText(article.title,locale),6,counts);
      codes.push(article.code);
      docMaps.push(counts);
      for(const token of counts.keys())df.set(token,(df.get(token)||0)+1);
    }

    const maxDf=Math.max(25,Math.floor(codes.length*MAX_DF_RATIO));
    const postings={};
    let omittedHighFrequency=0;
    const tokens=[...df.keys()].sort((a,b)=>a.localeCompare(b,locale));
    for(const token of tokens){
      const frequency=df.get(token)||0;
      if(frequency>maxDf){omittedHighFrequency++;continue}
      const flat=[];
      for(let i=0;i<docMaps.length;i++){
        const tf=docMaps[i].get(token);
        if(tf)flat.push(i,tf);
      }
      postings[token]=flat;
    }

    const index={
      standard:'MLS R32',
      promptVersion:PROMPT_VERSION,
      version:VERSION,
      corpusBuildId,
      language:language.slug,
      locale,
      totalEntries:codes.length,
      codes,
      postings
    };
    const raw=stable(index);
    const bytes=Buffer.byteLength(raw,'utf8');
    if(bytes>MAX_INDEX_BYTES)throw new Error(language.slug+': índice full-text excede 20 MiB: '+bytes);
    const filename=language.slug+'.json';
    fs.writeFileSync(path.join(outputRoot,filename),raw,'utf8');
    manifest.languages[language.slug]={
      name:language.name,
      locale,
      totalEntries:codes.length,
      path:filename,
      tokens:Object.keys(postings).length,
      omittedHighFrequency,
      bytes,
      sha256:sha256(raw)
    };
    manifest.totalEntries+=codes.length;
    manifest.totalBytes+=bytes;
  }

  const manifestText=JSON.stringify(manifest,null,2)+'\n';
  fs.writeFileSync(path.join(outputRoot,'manifest.json'),manifestText,'utf8');
  const health={
    ok:true,
    standard:'MLS R32',
    promptVersion:PROMPT_VERSION,
    version:VERSION,
    corpusBuildId,
    totalEntries:manifest.totalEntries,
    languages:Object.keys(manifest.languages).length,
    totalBytes:manifest.totalBytes,
    manifestSha256:sha256(manifestText)
  };
  fs.writeFileSync(path.join(outputRoot,'health.json'),JSON.stringify(health,null,2)+'\n','utf8');
  process.stdout.write(JSON.stringify(health,null,2)+'\n');
  return health;
}

module.exports={VERSION,MAX_INDEX_BYTES,MAX_DF_RATIO,MAX_TF,LOCALES,normalizeText,tokenizeText,buildFullTextSearch};
if(require.main===module){
  try{buildFullTextSearch()}
  catch(error){console.error('ERROR full-text search build:',error.message);process.exitCode=1}
}
