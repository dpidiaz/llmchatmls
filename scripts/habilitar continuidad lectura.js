'use strict';
const fs=require('node:fs');

const APP='public/js/app.js';
const READER='public/js/reader.js';
const RESUME_CALL="window.MLS?.reader?.requestResume('${recent.code}')";
const CTA_PATTERN=/(<button\b[^>]*\bonclick=")location\.hash='#entry=\$\{recent\.code\}'("[^>]*>\s*↺\s*Seguir leyendo\s*<\/button>)/i;
const MARKER="const READING_PROGRESS_KEY='mls.readingProgress.v1';";

const HELPERS=`
  const READING_PROGRESS_KEY='mls.readingProgress.v1';
  const RESUME_INTENT_KEY='mls.resumeIntent.v1';
  const RESUME_INTENT_MAX_AGE=5*60*1000;
  const READING_PROGRESS_LIMIT=120;
  let activeReadingCode='';
  let readingProgressTimer=null;
  function validEntryCode(code){return /^MLS-V\\d{2}-\\d{4}$/.test(String(code||'').trim().toUpperCase())}
  function storageJson(storage,key,fallback){try{const raw=storage?.getItem?.(key);if(!raw)return fallback;const value=JSON.parse(raw);return value&&typeof value==='object'?value:fallback}catch{return fallback}}
  function readProgressMap(){return storageJson(window.localStorage,READING_PROGRESS_KEY,{})}
  function writeProgressMap(map){try{window.localStorage?.setItem?.(READING_PROGRESS_KEY,JSON.stringify(map))}catch{}}
  function nearbyHeading(){
    const headings=[...document.querySelectorAll('.permanent-entry-body h1[id],.permanent-entry-body h2[id],.permanent-entry-body h3[id],.permanent-entry-body h4[id],.permanent-entry-body h5[id],.permanent-entry-body h6[id]')];
    let best=null;for(const heading of headings){const top=heading.getBoundingClientRect().top;if(top<=160)best=heading;else break}return best;
  }
  function captureReadingProgress(code=activeReadingCode){
    const normalized=String(code||'').trim().toUpperCase();if(!validEntryCode(normalized))return;
    const scrollY=Math.max(0,Math.round(window.scrollY||document.documentElement.scrollTop||document.body?.scrollTop||0));
    const heading=nearbyHeading();const headingTop=heading?Math.round(scrollY+heading.getBoundingClientRect().top):null;const map=readProgressMap();
    map[normalized]={scrollY,headingId:heading?.id||'',headingOffset:heading?Math.max(0,scrollY-headingTop):0,updatedAt:Date.now()};
    const entries=Object.entries(map).filter(([entryCode,value])=>validEntryCode(entryCode)&&value&&Number.isFinite(Number(value.updatedAt))).sort((a,b)=>Number(b[1].updatedAt)-Number(a[1].updatedAt)).slice(0,READING_PROGRESS_LIMIT);
    writeProgressMap(Object.fromEntries(entries));
  }
  function scheduleReadingProgress(){if(!activeReadingCode)return;clearTimeout(readingProgressTimer);readingProgressTimer=setTimeout(()=>captureReadingProgress(),350)}
  function savedReadingProgress(code){
    const normalized=String(code||'').trim().toUpperCase();if(!validEntryCode(normalized))return null;const value=readProgressMap()[normalized];if(!value||typeof value!=='object')return null;
    const scrollY=Number(value.scrollY),updatedAt=Number(value.updatedAt);if(!Number.isFinite(scrollY)||scrollY<0||!Number.isFinite(updatedAt)||updatedAt<=0)return null;
    return {scrollY,headingId:typeof value.headingId==='string'?value.headingId:'',headingOffset:Number.isFinite(Number(value.headingOffset))?Math.max(0,Number(value.headingOffset)):0,updatedAt};
  }
  function requestResume(code){const normalized=String(code||'').trim().toUpperCase();if(!validEntryCode(normalized))return false;try{window.sessionStorage?.setItem?.(RESUME_INTENT_KEY,JSON.stringify({code:normalized,at:Date.now()}));return true}catch{return false}}
  function consumeResumeIntent(code){
    const normalized=String(code||'').trim().toUpperCase();let intent=null;try{intent=storageJson(window.sessionStorage,RESUME_INTENT_KEY,null);window.sessionStorage?.removeItem?.(RESUME_INTENT_KEY)}catch{}
    if(!intent||String(intent.code||'').toUpperCase()!==normalized)return false;const at=Number(intent.at);return Number.isFinite(at)&&at>0&&Date.now()-at<=RESUME_INTENT_MAX_AGE;
  }
  function restoreReadingProgress(code){
    const saved=savedReadingProgress(code);if(!saved)return false;let target=saved.scrollY;
    if(saved.headingId){const heading=document.getElementById(saved.headingId);if(heading){const current=Math.max(0,window.scrollY||document.documentElement.scrollTop||document.body?.scrollTop||0);target=current+heading.getBoundingClientRect().top+saved.headingOffset}}
    const max=Math.max(0,(document.documentElement.scrollHeight||document.body?.scrollHeight||0)-window.innerHeight);const top=Math.max(0,Math.min(Math.round(target),max||Math.round(target)));window.scrollTo({top,left:0,behavior:'auto'});return true;
  }
  function installReadingProgressTracking(){
    if(window.__MLS_READING_PROGRESS_TRACKING__)return;window.__MLS_READING_PROGRESS_TRACKING__=true;
    window.addEventListener('scroll',scheduleReadingProgress,{passive:true});window.addEventListener('pagehide',()=>captureReadingProgress());
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')captureReadingProgress()});
  }
  installReadingProgressTracking();
`;

function patchContinueReading(source){
  source=String(source);if(source.includes(RESUME_CALL))return source;
  if(!CTA_PATTERN.test(source))throw new Error('No se encontró el CTA Seguir leyendo esperado.');
  CTA_PATTERN.lastIndex=0;return source.replace(CTA_PATTERN,`$1${RESUME_CALL};location.hash='#entry=\${recent.code}'$2`);
}

function patchReaderContinuity(source){
  source=String(source);if(source.includes(MARKER))return source;
  const helperAnchor='  function versioned(url,buildId){';
  if(!source.includes(helperAnchor))throw new Error('No se encontró ancla de helpers del lector.');
  source=source.replace(helperAnchor,HELPERS+'\n'+helperAnchor);

  const pageStart=/  async function page\(code\)\{\n    const normalized=String\(code\|\|''\)\.trim\(\)\.toUpperCase\(\);\n    const previousCode=document\.documentElement\.dataset\.mlsCurrentEntryCode\|\|'';\n    const entryChanged=previousCode!==normalized;\n    document\.documentElement\.dataset\.mlsCurrentEntryCode=normalized;\n    if\(entryChanged\)\{cancelSpeech\(\);scrollPageToAbsoluteTop\(\);\}/;
  if(!pageStart.test(source))throw new Error('No se encontró inicio de page() posterior a voz.');
  source=source.replace(pageStart,`  async function page(code){
    captureReadingProgress();
    const scrollBeforeRender=Math.max(0,Math.round(window.scrollY||document.documentElement.scrollTop||document.body?.scrollTop||0));
    const normalized=String(code||'').trim().toUpperCase();
    const resumeRequested=consumeResumeIntent(normalized);
    const previousCode=document.documentElement.dataset.mlsCurrentEntryCode||'';
    const entryChanged=previousCode!==normalized;
    document.documentElement.dataset.mlsCurrentEntryCode=normalized;
    activeReadingCode='';
    if(entryChanged){cancelSpeech();if(!resumeRequested)scrollPageToAbsoluteTop();}`);

  const post=`    if(entryChanged){
      scrollPageToAbsoluteTop();
      requestAnimationFrame(scrollPageToAbsoluteTop);
    }`;
  if(!source.includes(post))throw new Error('No se encontró bloque post-render del lector.');
  source=source.replace(post,`    activeReadingCode=normalized;
    if(resumeRequested){
      requestAnimationFrame(()=>requestAnimationFrame(()=>{if(!restoreReadingProgress(normalized))scrollPageToAbsoluteTop()}));
    }else if(entryChanged){
      scrollPageToAbsoluteTop();
      requestAnimationFrame(scrollPageToAbsoluteTop);
    }else{
      requestAnimationFrame(()=>window.scrollTo({top:scrollBeforeRender,left:0,behavior:'auto'}));
    }`);

  const exportAnchor='  MLS.reader={page};';
  if(!source.includes(exportAnchor))throw new Error('No se encontró export del lector.');
  source=source.replace(exportAnchor,'  MLS.reader={page,requestResume,captureReadingProgress,savedReadingProgress};');
  return source;
}

function install(){
  if(!fs.existsSync(APP)||!fs.existsSync(READER))throw new Error('El build R32 no contiene app/reader.');
  fs.writeFileSync(APP,patchContinueReading(fs.readFileSync(APP,'utf8')),'utf8');
  fs.writeFileSync(READER,patchReaderContinuity(fs.readFileSync(READER,'utf8')),'utf8');
}
function main(){install();console.log('Continuidad de lectura habilitada.');}
module.exports={RESUME_CALL,CTA_PATTERN,patchContinueReading,patchReaderContinuity,install};
if(require.main===module)main();
