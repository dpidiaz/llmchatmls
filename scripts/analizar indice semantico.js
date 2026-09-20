'use strict';

const fs=require('node:fs');
const path=require('node:path');
const {LANGUAGES}=require('./exportar corpus canonico.js');

const ROOT=path.resolve(process.env.MLS_CANONICAL_ROOT||'content');
const DIMS=1024;
const TARGET_CHARS=2400;
const MAX_CHARS=5200;
const MIN_CHARS=700;

function strip(text){
  return String(text||'')
    .replace(/\\r/g,'')
    .replace(/\\x60\\x60\\x60[\\s\\S]*?\\x60\\x60\\x60/g,' ')
    .replace(/\\s+/g,' ')
    .trim();
}
function sectionize(markdown){
  const text=String(markdown||'').replace(/\\r/g,'');
  const parts=text.split(/(?=^####\\s+)/gm).map(x=>x.trim()).filter(Boolean);
  if(!parts.length)return [text.trim()].filter(Boolean);
  return parts;
}
function mergeSections(markdown){
  const raw=sectionize(markdown);
  const chunks=[];
  let current='';
  for(const section of raw){
    const clean=strip(section);
    if(!clean)continue;
    if(clean.length>MAX_CHARS){
      if(current){chunks.push(current);current='';}
      for(let i=0;i<clean.length;i+=MAX_CHARS){
        const piece=clean.slice(i,i+MAX_CHARS).trim();
        if(piece)chunks.push(piece);
      }
      continue;
    }
    if(!current){current=clean;continue;}
    if(current.length<MIN_CHARS || current.length+1+clean.length<=TARGET_CHARS){
      current+=' '+clean;
    }else{
      chunks.push(current);
      current=clean;
    }
  }
  if(current)chunks.push(current);
  return chunks;
}
function articleInput(article){
  return strip([article.title,article.level,article.part,article.chapter,article.articleMarkdown].filter(Boolean).join('\\n\\n'));
}
function analyzeSemanticCorpus(root=ROOT){
  const report={dimensions:DIMS,targetChars:TARGET_CHARS,maxChars:MAX_CHARS,totalEntries:0,totalChars:0,estimatedTokensByChars:0,totalChunks:0,languages:{}};
  for(const lang of LANGUAGES){
    let chars=0,chunks=0,maxEntryChars=0,maxChunksPerEntry=0;
    for(let n=1;n<=lang.total;n++){
      const code=lang.prefix+'-'+String(n).padStart(4,'0');
      const file=path.join(root,lang.slug,code+'.json');
      const article=JSON.parse(fs.readFileSync(file,'utf8'));
      const input=articleInput(article);
      const cs=mergeSections(article.articleMarkdown);
      chars+=input.length;
      chunks+=cs.length;
      maxEntryChars=Math.max(maxEntryChars,input.length);
      maxChunksPerEntry=Math.max(maxChunksPerEntry,cs.length);
    }
    const entries=lang.total;
    const langReport={
      entries,chars,approxTokensByChars:Math.ceil(chars/4),chunks,chunksPerEntry:Number((chunks/entries).toFixed(2)),maxEntryChars,maxChunksPerEntry,
      entryVectorsFloat32Bytes:entries*DIMS*4,entryVectorsInt8Bytes:entries*DIMS,
      chunkVectorsFloat32Bytes:chunks*DIMS*4,chunkVectorsInt8Bytes:chunks*DIMS
    };
    report.languages[lang.slug]=langReport;
    report.totalEntries+=entries;report.totalChars+=chars;report.totalChunks+=chunks;
  }
  report.estimatedTokensByChars=Math.ceil(report.totalChars/4);
  report.entryVectorsFloat32Bytes=report.totalEntries*DIMS*4;
  report.entryVectorsInt8Bytes=report.totalEntries*DIMS;
  report.chunkVectorsFloat32Bytes=report.totalChunks*DIMS*4;
  report.chunkVectorsInt8Bytes=report.totalChunks*DIMS;
  return report;
}

module.exports={DIMS,TARGET_CHARS,MAX_CHARS,MIN_CHARS,strip,sectionize,mergeSections,articleInput,analyzeSemanticCorpus};

if(require.main===module){
  try{console.log(JSON.stringify(analyzeSemanticCorpus(),null,2))}
  catch(error){console.error('ERROR semantic corpus analysis:',error.message);process.exitCode=1}
}
