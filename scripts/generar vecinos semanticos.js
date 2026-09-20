'use strict';

const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const SEMANTIC_ROOT=path.resolve(process.env.MLS_SEMANTIC_ROOT||'semantic');
const OUTPUT_ROOT=path.resolve(process.env.MLS_RELATED_ROOT||'related');
const VERSION='1.0';
const DEFAULT_TOP=Math.max(1,Math.min(12,Number(process.env.MLS_RELATED_TOP)||8));

function sha256Buffer(value){return crypto.createHash('sha256').update(value).digest('hex')}

function readSemanticLanguage(slug,root=SEMANTIC_ROOT){
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
  const descriptor=manifest.languages?.[slug];
  if(!descriptor)throw new Error('Idioma semántico desconocido: '+slug);
  const metaFile=path.join(root,descriptor.metadata||slug+'.json');
  const binFile=path.join(root,descriptor.binary||slug+'.bin');
  const meta=JSON.parse(fs.readFileSync(metaFile,'utf8'));
  const binary=fs.readFileSync(binFile);

  if(manifest.standard!=='MLS R32'||manifest.promptVersion!=='32.0'||manifest.model!=='@cf/baai/bge-m3')throw new Error('Manifest semántico incompatible.');
  if(meta.standard!=='MLS R32'||meta.promptVersion!=='32.0'||meta.model!==manifest.model||meta.language!==slug)throw new Error(slug+': metadata semántica incompatible.');
  if(meta.corpusBuildId!==manifest.corpusBuildId)throw new Error(slug+': corpusBuildId semántico inconsistente.');
  if(meta.binarySha256!==sha256Buffer(binary))throw new Error(slug+': hash del binario semántico inválido.');
  if(binary.length!==Number(meta.totalChunks)*Number(meta.recordBytes))throw new Error(slug+': tamaño binario semántico inválido.');
  return {manifest,descriptor,meta,binary};
}

function normalizedChunkVector(binary,index,meta){
  const dimensions=Number(meta.dimensions);
  const recordBytes=Number(meta.recordBytes);
  const offset=index*recordBytes;
  const scale=binary.readFloatLE(offset);
  const out=new Float32Array(dimensions);
  let norm=0;
  for(let d=0;d<dimensions;d++){
    const value=binary.readInt8(offset+4+d)*scale;
    out[d]=value;
    norm+=value*value;
  }
  norm=Math.sqrt(norm)||1;
  for(let d=0;d<dimensions;d++)out[d]/=norm;
  return out;
}

function normalizeInPlace(vector){
  let norm=0;
  for(let i=0;i<vector.length;i++)norm+=vector[i]*vector[i];
  norm=Math.sqrt(norm)||1;
  for(let i=0;i<vector.length;i++)vector[i]/=norm;
  return vector;
}

function entryVectors(meta,binary){
  const grouped=new Map();
  meta.chunks.forEach((chunk,index)=>{
    let item=grouped.get(chunk.code);
    if(!item){
      item={
        code:chunk.code,
        title:chunk.title||'',
        level:chunk.level||'',
        part:chunk.part||'',
        chapter:chunk.chapter||'',
        count:0,
        vector:new Float32Array(Number(meta.dimensions))
      };
      grouped.set(chunk.code,item);
    }
    const vector=normalizedChunkVector(binary,index,meta);
    for(let d=0;d<vector.length;d++)item.vector[d]+=vector[d];
    item.count++;
  });
  const entries=[...grouped.values()];
  for(const item of entries){
    if(!item.count)throw new Error(item.code+': entrada sin chunks.');
    for(let d=0;d<item.vector.length;d++)item.vector[d]/=item.count;
    normalizeInPlace(item.vector);
  }
  return entries;
}

function dot(a,b){
  let value=0;
  for(let i=0;i<a.length;i++)value+=a[i]*b[i];
  return value;
}

function insertTop(list,candidate,top){
  let i=0;
  while(i<list.length&&(list[i].score>candidate.score||(list[i].score===candidate.score&&list[i].code<candidate.code)))i++;
  list.splice(i,0,candidate);
  if(list.length>top)list.length=top;
}

function semanticNeighbors(entries,top=DEFAULT_TOP){
  const byCode=new Map(entries.map(entry=>[entry.code,[]]));
  for(let i=0;i<entries.length;i++){
    for(let j=i+1;j<entries.length;j++){
      const score=dot(entries[i].vector,entries[j].vector);
      insertTop(byCode.get(entries[i].code),{code:entries[j].code,score},top);
      insertTop(byCode.get(entries[j].code),{code:entries[i].code,score},top);
    }
  }
  return byCode;
}

const LEVEL_ORDER=new Map([['A1',1],['A2',2],['B1',3],['B2',4],['C1',5],['C2',6]]);
function levelGap(a,b){
  const x=LEVEL_ORDER.get(String(a||'').toUpperCase());
  const y=LEVEL_ORDER.get(String(b||'').toUpperCase());
  return x&&y?Math.abs(x-y):null;
}

function auditNeighbors(entries,neighbors){
  const metaByCode=new Map(entries.map(x=>[x.code,x]));
  let total=0,sameChapter=0,samePart=0,knownLevel=0,levelGapSum=0,farLevel=0;
  let minScore=Infinity,maxScore=-Infinity,scoreSum=0;
  for(const entry of entries){
    for(const hit of neighbors.get(entry.code)||[]){
      const other=metaByCode.get(hit.code);
      if(!other)continue;
      total++;
      if(entry.chapter&&entry.chapter===other.chapter)sameChapter++;
      if(entry.part&&entry.part===other.part)samePart++;
      const gap=levelGap(entry.level,other.level);
      if(gap!==null){
        knownLevel++;
        levelGapSum+=gap;
        if(gap>=3)farLevel++;
      }
      minScore=Math.min(minScore,hit.score);
      maxScore=Math.max(maxScore,hit.score);
      scoreSum+=hit.score;
    }
  }
  const pct=n=>total?Number((100*n/total).toFixed(1)):0;
  return {
    entries:entries.length,
    neighborLinks:total,
    sameChapterPct:pct(sameChapter),
    samePartPct:pct(samePart),
    knownLevelLinks:knownLevel,
    averageLevelGap:knownLevel?Number((levelGapSum/knownLevel).toFixed(2)):null,
    farLevelPct:knownLevel?Number((100*farLevel/knownLevel).toFixed(1)):0,
    scoreMin:total?Number(minScore.toFixed(4)):null,
    scoreMean:total?Number((scoreSum/total).toFixed(4)):null,
    scoreMax:total?Number(maxScore.toFixed(4)):null
  };
}

function languageOutput(slug,semantic,entries,neighbors,top){
  const items={};
  for(const entry of entries)items[entry.code]=(neighbors.get(entry.code)||[]).map(hit=>hit.code);
  return {
    standard:'MLS R32',
    promptVersion:'32.0',
    version:VERSION,
    source:'semantic-neighbors',
    semanticModel:semantic.meta.model,
    semanticVersion:semantic.meta.version,
    corpusBuildId:semantic.meta.corpusBuildId,
    language:slug,
    totalEntries:entries.length,
    topK:top,
    audit:auditNeighbors(entries,neighbors),
    neighbors:items
  };
}

function generateLanguage(slug,options={}){
  const semanticRoot=path.resolve(options.semanticRoot||SEMANTIC_ROOT);
  const outputRoot=path.resolve(options.outputRoot||OUTPUT_ROOT);
  const top=Math.max(1,Math.min(12,Number(options.top)||DEFAULT_TOP));
  const semantic=readSemanticLanguage(slug,semanticRoot);
  const entries=entryVectors(semantic.meta,semantic.binary);
  if(entries.length!==Number(semantic.meta.totalEntries))throw new Error(slug+': entradas agregadas '+entries.length+' != '+semantic.meta.totalEntries);
  const neighbors=semanticNeighbors(entries,top);
  const payload=languageOutput(slug,semantic,entries,neighbors,top);
  fs.mkdirSync(outputRoot,{recursive:true});
  fs.writeFileSync(path.join(outputRoot,slug+'.json'),JSON.stringify(payload)+'\n','utf8');
  return payload;
}

function buildManifest(root=OUTPUT_ROOT,semanticRoot=SEMANTIC_ROOT){
  const semanticManifest=JSON.parse(fs.readFileSync(path.join(semanticRoot,'manifest.json'),'utf8'));
  const manifest={
    standard:'MLS R32',
    promptVersion:'32.0',
    version:VERSION,
    source:'semantic-neighbors',
    semanticModel:semanticManifest.model,
    semanticVersion:semanticManifest.version,
    corpusBuildId:semanticManifest.corpusBuildId,
    languages:{},
    totalEntries:0
  };
  for(const slug of Object.keys(semanticManifest.languages||{})){
    const file=path.join(root,slug+'.json');
    if(!fs.existsSync(file))return null;
    const payload=JSON.parse(fs.readFileSync(file,'utf8'));
    if(payload.corpusBuildId!==manifest.corpusBuildId||payload.semanticModel!==manifest.semanticModel||payload.language!==slug)throw new Error(slug+': vecinos semánticos obsoletos o incompatibles.');
    manifest.languages[slug]={
      totalEntries:payload.totalEntries,
      topK:payload.topK,
      file:slug+'.json',
      sha256:sha256Buffer(fs.readFileSync(file)),
      audit:payload.audit
    };
    manifest.totalEntries+=payload.totalEntries;
  }
  fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2)+'\n','utf8');
  return manifest;
}

function main(){
  const languageArg=process.argv.indexOf('--language');
  const only=languageArg>=0?process.argv[languageArg+1]:null;
  const semanticManifest=JSON.parse(fs.readFileSync(path.join(SEMANTIC_ROOT,'manifest.json'),'utf8'));
  const slugs=only?[only]:Object.keys(semanticManifest.languages||{});
  if(only&&!semanticManifest.languages?.[only])throw new Error('Idioma desconocido: '+only);
  for(const slug of slugs){
    const started=Date.now();
    const payload=generateLanguage(slug);
    console.log('RELATED_LANGUAGE '+JSON.stringify({language:slug,totalEntries:payload.totalEntries,topK:payload.topK,audit:payload.audit,ms:Date.now()-started}));
  }
  const manifest=buildManifest();
  if(manifest)console.log('RELATED_MANIFEST '+JSON.stringify({totalEntries:manifest.totalEntries,languages:Object.keys(manifest.languages).length,corpusBuildId:manifest.corpusBuildId}));
  else console.log('RELATED_MANIFEST incomplete');
}

module.exports={
  VERSION,DEFAULT_TOP,readSemanticLanguage,normalizedChunkVector,entryVectors,dot,insertTop,
  semanticNeighbors,levelGap,auditNeighbors,languageOutput,generateLanguage,buildManifest
};

if(require.main===module){
  try{main()}catch(error){console.error('ERROR related neighbors:',error.message);process.exitCode=1}
}
