'use strict';

const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {LANGUAGES,PROMPT_VERSION}=require('./exportar corpus canonico.js');

const SOURCE_ROOT=path.resolve(process.env.MLS_CANONICAL_ROOT||'content');
const PUBLIC_DATA_ROOT=path.resolve(process.env.MLS_PUBLIC_DATA_ROOT||'public/data');
const MAX_COMPAT_INDEX_BYTES=20*1024*1024;
const INDEX_DEFINITION_CHARS=240;
const INDEX_SEARCH_BODY_CHARS=160;

const UI_META={
  ingles:{native:'English',flag:'🇬🇧'},
  portugues:{native:'Português brasileiro',flag:'🇧🇷'},
  italiano:{native:'Italiano',flag:'🇮🇹'},
  frances:{native:'Français',flag:'🇫🇷'},
  aleman:{native:'Deutsch',flag:'🇩🇪'},
  japones:{native:'日本語',flag:'🇯🇵'},
  'chino-taiwan':{native:'臺灣華語',flag:'🇹🇼'},
  coreano:{native:'한국어',flag:'🇰🇷'},
  ruso:{native:'Русский',flag:'🇷🇺'},
  'espanol-guatemala':{native:'Español',flag:'🇬🇹'}
};

function fail(message){throw new Error(message)}
function padded(n){return String(n).padStart(4,'0')}
function volumeNumber(language){return Number(String(language.prefix).match(/V(\d{2})/)?.[1]||0)}
function toRoman(number){
  const pairs=[[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
  let n=Number(number)||1,out='';
  for(const [value,symbol] of pairs){while(n>=value){out+=symbol;n-=value}}
  return out;
}
function normalizeSearch(text){
  return String(text||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().replace(/\s+/g,' ').trim();
}
function stripMarkdown(text){
  return String(text||'')
    .replace(/\x60\x60\x60[\s\S]*?\x60\x60\x60/g,' ')
    .replace(/^#{1,6}\s+/gm,'')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g,'$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g,'$1')
    .replace(/[*_~\x60>|]/g,' ')
    .replace(/^\s*[-+*]\s+/gm,'')
    .replace(/^\s*\d+[.)]\s+/gm,'')
    .replace(/\s+/g,' ')
    .trim();
}
function firstParagraph(markdown){
  const blocks=String(markdown||'').split(/\n\s*\n/);
  for(const block of blocks){
    const raw=block.trim();
    if(!raw||/^#{1,6}\s/.test(raw)||/^[-+*]\s/.test(raw)||/^\d+[.)]\s/.test(raw)||/^\x60\x60\x60/.test(raw)||/^\|/.test(raw))continue;
    const clean=stripMarkdown(raw);
    if(clean)return clean.slice(0,1200);
  }
  return stripMarkdown(markdown).slice(0,1200);
}
function firstExample(markdown){
  const text=String(markdown||'');
  const heading=/^####\s+.*(?:ejempl|例句|beispiel|esempio|exemple|пример|예문).*$/gim;
  const hit=heading.exec(text);
  const slice=hit?text.slice(hit.index+hit[0].length):text;
  for(const line of slice.split('\n')){
    if(/^\s*(?:[-+*]|\d+[.)])\s+/.test(line)){
      const clean=stripMarkdown(line);
      if(clean)return clean.slice(0,800);
    }
    if(hit&&/^####\s+/.test(line))break;
  }
  return '';
}
function readArticle(language,n){
  const code=language.prefix+'-'+padded(n);
  const file=path.join(SOURCE_ROOT,language.slug,code+'.json');
  if(!fs.existsSync(file))fail('Falta entrada canónica '+file);
  const article=JSON.parse(fs.readFileSync(file,'utf8'));
  if(article.code!==code||article.language!==language.slug||article.promptVersion!==PROMPT_VERSION)fail(code+': identidad canónica inválida');
  if(/legacy/i.test(String(article.provider||''))||/legacy/i.test(String(article.auditProvider||'')))fail(code+': proveedor legacy');
  if(!String(article.articleMarkdown||'').trim())fail(code+': articleMarkdown vacío');
  return article;
}
function writeJson(file,value){
  fs.mkdirSync(path.dirname(file),{recursive:true});
  fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n','utf8');
}
function sha256(text){return crypto.createHash('sha256').update(text,'utf8').digest('hex')}

function buildCanonicalCompatibility(){
  const volumesRoot=path.join(PUBLIC_DATA_ROOT,'volumes');
  const oldSeedsRoot=path.join(PUBLIC_DATA_ROOT,'wiki-seeds');
  const canonicalSeedsRoot=path.join(PUBLIC_DATA_ROOT,'canonical','seeds');

  fs.rmSync(volumesRoot,{recursive:true,force:true});
  fs.rmSync(oldSeedsRoot,{recursive:true,force:true});
  fs.rmSync(canonicalSeedsRoot,{recursive:true,force:true});
  fs.mkdirSync(volumesRoot,{recursive:true});
  fs.mkdirSync(canonicalSeedsRoot,{recursive:true});

  const ordered=[...LANGUAGES].sort((a,b)=>volumeNumber(a)-volumeNumber(b));
  const metas=[];
  const globalIndex=[];
  let total=0;

  for(const language of ordered){
    const v=volumeNumber(language);
    const ui=UI_META[language.slug]||{native:language.name,flag:''};
    const meta={v,slug:language.slug,name:language.name.replace('Chino mandarín de Taiwán','Chino de Taiwán'),native:ui.native,flag:ui.flag,count:language.total};
    metas.push(meta);

    const partOrder=new Map();
    const chapterOrder=new Map();
    const entries=[];

    for(let n=1;n<=language.total;n++){
      const article=readArticle(language,n);
      if(!partOrder.has(article.part))partOrder.set(article.part,partOrder.size+1);
      if(!chapterOrder.has(article.chapter))chapterOrder.set(article.chapter,chapterOrder.size+1);

      const lead=firstParagraph(article.articleMarkdown);
      const example=firstExample(article.articleMarkdown);
      const partNum=toRoman(partOrder.get(article.part));
      const chapterNum=String(chapterOrder.get(article.chapter));
      // Este índice conserva solo metadata/snippets para compatibilidad de UI.
      // El full-text completo se construye por separado en la Fase 6.
      const indexDefinition=lead.slice(0,INDEX_DEFINITION_CHARS);
      const searchBody=stripMarkdown(article.articleMarkdown).slice(0,INDEX_SEARCH_BODY_CHARS);
      const search=normalizeSearch([article.title,article.part,article.chapter,indexDefinition,searchBody].join(' '));
      const base={
        n:article.n,
        title:article.title,
        target:'',
        rawTitle:article.title,
        part:article.part,
        partNum,
        chapter:article.chapter,
        chapterNum,
        body:article.articleMarkdown,
        level:article.level||'',
        definition:lead,
        code:article.code,
        language:article.language,
        plain:{lead,example,look:'',kind:'canonical-r32',exampleKind:example?'canonical-r32':'none',exampleScore:example?5:0},
        auditedBody:article.articleMarkdown,
        _slug:article.language
      };
      entries.push(base);
      globalIndex.push({
        code:article.code,
        language:article.language,
        volume:v,
        n:article.n,
        title:article.title,
        target:'',
        level:article.level||'',
        part:article.part,
        partNum,
        chapter:article.chapter,
        chapterNum,
        definition:indexDefinition,
        search,
        plain:indexDefinition
      });

      writeJson(path.join(canonicalSeedsRoot,language.slug,padded(n)+'.json'),{
        code:article.code,
        language:article.language,
        languageName:article.languageName,
        n:article.n,
        title:article.title,
        level:article.level||'',
        part:article.part||'',
        chapter:article.chapter||'',
        definition:lead,
        example
      });
      total++;
    }

    const volumeJs='window.MLS_DATA=window.MLS_DATA||{};window.MLS_DATA['+JSON.stringify(language.slug)+']='+JSON.stringify({meta,entries})+';\n';
    fs.writeFileSync(path.join(volumesRoot,language.slug+'.js'),volumeJs,'utf8');
  }

  globalIndex.sort((a,b)=>a.volume-b.volume||a.n-b.n);
  const indexJs='window.MLS_META='+JSON.stringify(metas)+';window.MLS_INDEX='+JSON.stringify(globalIndex)+';\n';
  const indexBytes=Buffer.byteLength(indexJs,'utf8');
  if(indexBytes>MAX_COMPAT_INDEX_BYTES)fail('public/data/index.js excede el margen seguro de 20 MiB: '+indexBytes+' bytes');
  fs.writeFileSync(path.join(PUBLIC_DATA_ROOT,'index.js'),indexJs,'utf8');

  if(fs.existsSync(oldSeedsRoot))fail('public/data/wiki-seeds sobrevivió al reemplazo canónico');
  const health={
    ok:true,
    standard:'MLS R32',
    promptVersion:PROMPT_VERSION,
    totalEntries:total,
    volumes:ordered.length,
    legacyWikiSeedsPresent:false,
    indexBytes,
    indexSha256:sha256(indexJs),
    source:'GitHub canonical content/'
  };
  writeJson(path.join(PUBLIC_DATA_ROOT,'canonical','compat-health.json'),health);
  process.stdout.write(JSON.stringify(health,null,2)+'\n');
  return health;
}

module.exports={buildCanonicalCompatibility,stripMarkdown,firstParagraph,firstExample,toRoman,MAX_COMPAT_INDEX_BYTES,INDEX_DEFINITION_CHARS,INDEX_SEARCH_BODY_CHARS};
if(require.main===module){
  try{buildCanonicalCompatibility()}catch(error){console.error('ERROR canonical compatibility:',error.message);process.exitCode=1}
}
