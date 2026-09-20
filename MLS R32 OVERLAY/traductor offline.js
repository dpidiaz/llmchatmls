const CACHE_NAME='mls-language-tools-r1';
const PACKS_URL='/translator/packs.json';
const REGISTRY_URL='/translator/registry.json';
const STATE_KEY='mlsTranslatorLanguageToolsV1';

const SLUG_TO_CODE={
  'espanol-guatemala':'es',
  ingles:'en',
  portugues:'pt',
  italiano:'it',
  frances:'fr',
  aleman:'de',
  japones:'ja',
  'chino-taiwan':'zh',
  coreano:'ko',
  ruso:'ru'
};

let manifestPromise=null;
let activeTranslator=null;
let activeTranslatorKey='';

function normalizeSlug(value){
  const slug=String(value||'').trim();
  return Object.prototype.hasOwnProperty.call(SLUG_TO_CODE,slug)?slug:null;
}

function bytesLabel(bytes){
  const n=Number(bytes||0);
  if(!Number.isFinite(n)||n<=0)return '0 MB';
  return (n/1048576).toFixed(n>=104857600?0:1)+' MB';
}

async function sha256Hex(buffer){
  const digest=await crypto.subtle.digest('SHA-256',buffer);
  return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
}

async function readJson(url){
  const response=await fetch(url,{cache:'no-store'});
  if(!response.ok)throw new Error('No se pudo leer '+url+' ('+response.status+').');
  return response.json();
}

export async function loadPackManifest(){
  if(!manifestPromise){
    manifestPromise=readJson(PACKS_URL).then(manifest=>{
      if(!manifest||manifest.schemaVersion!==1||!manifest.packVersion||!manifest.languages)throw new Error('Manifest de paquetes inválido.');
      return manifest;
    }).catch(error=>{manifestPromise=null;throw error});
  }
  return manifestPromise;
}

export function requiredPackSlugs(sourceSlug,targetSlug){
  const source=normalizeSlug(sourceSlug);
  const target=normalizeSlug(targetSlug);
  if(!source||!target)return [];
  if(source===target)return [];
  const out=[];
  if(source!=='ingles')out.push(source);
  if(target!=='ingles'&&!out.includes(target))out.push(target);
  return out;
}

function allExpectedItems(manifest,slug,{includeRuntime=true}={}){
  const lang=manifest.languages?.[slug];
  if(!lang)return [];
  const items=[];
  if(includeRuntime){
    for(const runtime of manifest.runtime||[]){
      items.push({kind:'runtime',url:runtime.url,sha256:runtime.sha256,bytes:runtime.bytes});
    }
  }
  for(const file of lang.files||[]){
    items.push({kind:'model',url:file.url,sha256:file.compressedSha256,bytes:file.compressedBytes,pair:file.pair,part:file.part});
  }
  return items;
}

async function cachedBuffer(cache,url){
  const response=await cache.match(url,{ignoreSearch:false});
  if(!response)return null;
  try{return await response.arrayBuffer()}catch{return null}
}

async function verifyCachedItem(cache,item){
  const buffer=await cachedBuffer(cache,item.url);
  if(!buffer)return {ok:false,reason:'missing',item};
  if(item.bytes&&buffer.byteLength!==Number(item.bytes))return {ok:false,reason:'size',item};
  if(item.sha256){
    const actual=await sha256Hex(buffer);
    if(actual.toLowerCase()!==String(item.sha256).toLowerCase())return {ok:false,reason:'hash',item};
  }
  return {ok:true,item};
}

function readState(){
  try{
    const value=JSON.parse(localStorage.getItem(STATE_KEY)||'null');
    return value&&typeof value==='object'?value:{schemaVersion:1,packs:{}};
  }catch{return {schemaVersion:1,packs:{}}}
}

function writeState(manifest,slug,status){
  try{
    const state=readState();
    state.schemaVersion=1;
    state.packVersion=manifest.packVersion;
    state.packs=state.packs&&typeof state.packs==='object'?state.packs:{};
    if(status==='ready'){
      state.packs[slug]={status:'ready',verifiedAt:Date.now()};
    }else if(status==='remove'){
      delete state.packs[slug];
    }else{
      state.packs[slug]={status,updatedAt:Date.now()};
    }
    localStorage.setItem(STATE_KEY,JSON.stringify(state));
  }catch{}
}

export async function verifyRuntime(manifestArg){
  const manifest=manifestArg||await loadPackManifest();
  if(!('caches' in globalThis))return {status:'unsupported',missing:(manifest.runtime||[]).length,total:(manifest.runtime||[]).length};
  const cache=await caches.open(CACHE_NAME);
  let missing=0;
  for(const item of allExpectedItems(manifest,'ingles',{includeRuntime:true}).filter(item=>item.kind==='runtime')){
    const result=await verifyCachedItem(cache,item);
    if(!result.ok)missing++;
  }
  return {status:missing===0?'ready':missing<(manifest.runtime||[]).length?'partial':'empty',missing,total:(manifest.runtime||[]).length};
}

export async function verifyPack(slug,manifestArg){
  slug=normalizeSlug(slug);
  if(!slug)return {status:'invalid',missing:0,total:0};
  const manifest=manifestArg||await loadPackManifest();
  const lang=manifest.languages?.[slug];
  if(!lang)return {status:'invalid',missing:0,total:0};
  if(!('caches' in globalThis))return {status:'unsupported',missing:(lang.files||[]).length,total:(lang.files||[]).length};
  const cache=await caches.open(CACHE_NAME);
  const modelItems=allExpectedItems(manifest,slug,{includeRuntime:false});
  let missing=0;
  for(const item of modelItems){
    const result=await verifyCachedItem(cache,item);
    if(!result.ok)missing++;
  }
  const runtime=await verifyRuntime(manifest);
  const modelsReady=missing===0;
  const runtimeReady=runtime.status==='ready';
  let status;
  if(modelsReady&&runtimeReady)status='ready';
  else if(missing<modelItems.length||runtime.status==='partial'||(modelsReady&&!runtimeReady))status='partial';
  else status='empty';
  if(status==='ready')writeState(manifest,slug,'ready');
  return {status,missing,total:modelItems.length,runtime,compressedBytes:lang.compressedBytes||0};
}

async function fetchVerified(item,onProgress){
  const response=await fetch(item.url,{cache:'no-store'});
  if(!response.ok)throw new Error('No se pudo descargar '+item.url+' ('+response.status+').');
  const buffer=await response.arrayBuffer();
  if(item.bytes&&buffer.byteLength!==Number(item.bytes))throw new Error('Tamaño inesperado en '+item.url+'.');
  if(item.sha256){
    const actual=await sha256Hex(buffer);
    if(actual.toLowerCase()!==String(item.sha256).toLowerCase())throw new Error('Hash inválido en '+item.url+'.');
  }
  if(onProgress)onProgress({phase:'verified',url:item.url,bytes:buffer.byteLength});
  return buffer;
}

async function ensureItem(cache,item,onProgress){
  const existing=await verifyCachedItem(cache,item);
  if(existing.ok){
    if(onProgress)onProgress({phase:'cached',url:item.url,bytes:item.bytes||0});
    return;
  }
  if(onProgress)onProgress({phase:'downloading',url:item.url,bytes:item.bytes||0});
  const buffer=await fetchVerified(item,onProgress);
  const headers=new Headers({
    'content-type':item.kind==='runtime'&&item.url.endsWith('.wasm')?'application/wasm':item.kind==='runtime'&&item.url.endsWith('.js')?'text/javascript; charset=utf-8':'application/gzip',
    'cache-control':'public, max-age=31536000, immutable',
    'x-mls-language-tools':'1'
  });
  await cache.put(item.url,new Response(buffer,{status:200,headers}));
}

async function cachedItemPresent(cache,item){
  try{return Boolean(await cache.match(item.url,{ignoreSearch:false}))}catch{return false}
}

export async function packCatalog(){
  const manifest=await loadPackManifest();
  const state=readState();
  const stateMatches=state.packVersion===manifest.packVersion;
  const languages=Object.values(manifest.languages||{});
  if(!('caches' in globalThis)){
    return {
      packVersion:manifest.packVersion,
      runtime:{status:'unsupported'},
      packs:languages.map(lang=>({
        slug:lang.slug,
        label:lang.label||lang.slug,
        runtimeOnly:lang.runtimeOnly===true,
        compressedBytes:Number(lang.compressedBytes||0),
        status:lang.runtimeOnly===true?'base':'unsupported',
        installed:lang.runtimeOnly===true,
        selectable:false
      })),
      storage:await estimateStorage()
    };
  }

  const cache=await caches.open(CACHE_NAME);
  const runtimeItems=allExpectedItems(manifest,'ingles',{includeRuntime:true}).filter(item=>item.kind==='runtime');
  let runtimePresent=0;
  for(const item of runtimeItems)if(await cachedItemPresent(cache,item))runtimePresent++;
  const runtimeStatus=runtimePresent===runtimeItems.length?'ready':runtimePresent>0?'partial':'empty';
  const packs=[];

  for(const lang of languages){
    if(lang.runtimeOnly===true){
      packs.push({
        slug:lang.slug,
        label:lang.label||lang.slug,
        runtimeOnly:true,
        compressedBytes:0,
        status:'base',
        installed:true,
        selectable:false
      });
      continue;
    }
    const items=allExpectedItems(manifest,lang.slug,{includeRuntime:false});
    let present=0;
    for(const item of items)if(await cachedItemPresent(cache,item))present++;
    const storedStatus=stateMatches?state.packs?.[lang.slug]?.status:null;
    const modelsPresent=items.length>0&&present===items.length;
    const ready=modelsPresent&&runtimeStatus==='ready'&&storedStatus==='ready';
    const partial=!ready&&(present>0||Boolean(storedStatus)||runtimeStatus==='partial');
    packs.push({
      slug:lang.slug,
      label:lang.label||lang.slug,
      runtimeOnly:false,
      compressedBytes:Number(lang.compressedBytes||0),
      status:ready?'ready':partial?'partial':'empty',
      installed:ready,
      selectable:true,
      present,
      total:items.length
    });
  }

  return {
    packVersion:manifest.packVersion,
    runtime:{status:runtimeStatus,present:runtimePresent,total:runtimeItems.length},
    packs,
    storage:await estimateStorage()
  };
}

export async function preparePack(slug,onProgress){
  slug=normalizeSlug(slug);
  if(!slug)throw new Error('Idioma no válido.');
  if(!('caches' in globalThis))throw new Error('Este navegador no permite guardar paquetes offline.');
  const manifest=await loadPackManifest();
  const lang=manifest.languages?.[slug];
  if(!lang)throw new Error('Paquete no disponible.');
  const items=allExpectedItems(manifest,slug,{includeRuntime:true});
  const unique=[...new Map(items.map(item=>[item.url,item])).values()];
  const totalBytes=unique.reduce((sum,item)=>sum+Number(item.bytes||0),0);
  let completedBytes=0;
  writeState(manifest,slug,'downloading');
  const cache=await caches.open(CACHE_NAME);
  try{
    for(let index=0;index<unique.length;index++){
      const item=unique[index];
      await ensureItem(cache,item,event=>{
        if(onProgress)onProgress({...event,index,total:unique.length,completedBytes,totalBytes});
      });
      completedBytes+=Number(item.bytes||0);
      if(onProgress)onProgress({phase:'progress',index:index+1,total:unique.length,completedBytes,totalBytes,url:item.url});
    }
    const verified=await verifyPack(slug,manifest);
    if(verified.status!=='ready')throw new Error('El paquete quedó incompleto después de la descarga.');
    writeState(manifest,slug,'ready');
    return verified;
  }catch(error){
    writeState(manifest,slug,'partial');
    throw error;
  }
}

export async function removePack(slug){
  slug=normalizeSlug(slug);
  if(!slug)throw new Error('Idioma no válido.');
  const manifest=await loadPackManifest();
  const cache=await caches.open(CACHE_NAME);
  for(const item of allExpectedItems(manifest,slug,{includeRuntime:false})){
    await cache.delete(item.url,{ignoreSearch:false});
  }
  writeState(manifest,slug,'remove');
  if(activeTranslator){
    try{await activeTranslator.delete()}catch{}
    activeTranslator=null;
    activeTranslatorKey='';
  }
  return verifyPack(slug,manifest);
}

export async function estimateStorage(){
  if(!navigator.storage||typeof navigator.storage.estimate!=='function')return null;
  try{
    const estimate=await navigator.storage.estimate();
    return {usage:Number(estimate.usage||0),quota:Number(estimate.quota||0)};
  }catch{return null}
}

export async function packSummary(sourceSlug,targetSlug){
  const manifest=await loadPackManifest();
  const required=requiredPackSlugs(sourceSlug,targetSlug);
  const packs=[];
  for(const slug of required){
    const lang=manifest.languages?.[slug];
    packs.push({
      slug,
      label:lang?.label||slug,
      compressedBytes:Number(lang?.compressedBytes||0),
      uncompressedBytes:Number(lang?.uncompressedBytes||0),
      ...(await verifyPack(slug,manifest))
    });
  }
  const runtime=await verifyRuntime(manifest);
  return {packVersion:manifest.packVersion,required,packs,runtime,storage:await estimateStorage()};
}

async function verifiedFetchForBacking(url,checksum,extra){
  const response=await fetch(url,{cache:'no-store',signal:extra?.signal});
  if(!response.ok)throw new Error('No se pudo leer el recurso local ('+response.status+').');
  let buffer;
  if(String(url).endsWith('.gz')){
    if(!('DecompressionStream' in globalThis))throw new Error('Este navegador no puede descomprimir los modelos locales.');
    if(!response.body)throw new Error('El recurso local no tiene stream de datos.');
    const stream=response.body.pipeThrough(new DecompressionStream('gzip'));
    buffer=await new Response(stream).arrayBuffer();
  }else{
    buffer=await response.arrayBuffer();
  }
  if(checksum){
    const actual=await sha256Hex(buffer);
    if(actual.toLowerCase()!==String(checksum).toLowerCase())throw new Error('El recurso local no pasó la verificación de integridad.');
  }
  return buffer;
}

async function createTranslator(){
  const mod=await import('/translator/bergamot/translator.js');
  if(typeof mod.LatencyOptimisedTranslator!=='function'||typeof mod.TranslatorBacking!=='function')throw new Error('Motor de traducción local no disponible.');
  const options={registryUrl:REGISTRY_URL,pivotLanguage:'en',downloadTimeout:120000};
  const backing=new mod.TranslatorBacking(options);
  backing.fetch=verifiedFetchForBacking;
  return new mod.LatencyOptimisedTranslator(options,backing);
}

export async function canTranslateOffline(sourceSlug,targetSlug){
  const source=normalizeSlug(sourceSlug);
  const target=normalizeSlug(targetSlug);
  if(!source||!target)return {ok:false,reason:'invalid'};
  if(source===target)return {ok:true,sameLanguage:true,required:[]};
  const required=requiredPackSlugs(source,target);
  const manifest=await loadPackManifest();
  const runtime=await verifyRuntime(manifest);
  if(runtime.status!=='ready')return {ok:false,reason:'runtime',required};
  for(const slug of required){
    const status=await verifyPack(slug,manifest);
    if(status.status!=='ready')return {ok:false,reason:'pack',slug,required};
  }
  return {ok:true,required};
}

export async function translateLocal({sourceSlug,targetSlug,text}){
  const source=normalizeSlug(sourceSlug);
  const target=normalizeSlug(targetSlug);
  const clean=String(text||'').replace(/\s+/g,' ').trim().slice(0,1200);
  if(!source||!target)throw new Error('Idioma no válido.');
  if(!clean)throw new Error('Escribe un texto para traducir.');
  if(source===target)return {translation:clean,local:true,sameLanguage:true};
  const availability=await canTranslateOffline(source,target);
  if(!availability.ok)throw new Error('Los paquetes necesarios no están preparados para uso sin Internet.');

  const sourceCode=SLUG_TO_CODE[source];
  const targetCode=SLUG_TO_CODE[target];
  const key=sourceCode+'>'+targetCode;
  if(activeTranslator&&activeTranslatorKey!==key){
    try{await activeTranslator.delete()}catch{}
    activeTranslator=null;
    activeTranslatorKey='';
  }
  if(!activeTranslator){
    activeTranslator=await createTranslator();
    activeTranslatorKey=key;
  }
  const result=await activeTranslator.translate({from:sourceCode,to:targetCode,text:clean,html:false});
  const translation=String(result?.target?.text||'').trim();
  if(!translation)throw new Error('El motor local no devolvió una traducción.');
  return {translation,local:true,sameLanguage:false};
}

export async function disposeTranslator(){
  if(activeTranslator){
    try{await activeTranslator.delete()}catch{}
    activeTranslator=null;
    activeTranslatorKey='';
  }
}

export {CACHE_NAME,PACKS_URL,REGISTRY_URL,STATE_KEY,SLUG_TO_CODE,bytesLabel};
