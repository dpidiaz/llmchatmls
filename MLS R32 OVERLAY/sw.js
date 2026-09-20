const APP_SHELL_VERSION='2026-r32-offline-v1';
const APP_SHELL_CACHE='mls-app-shell-'+APP_SHELL_VERSION;
const OFFLINE_LIBRARY_PREFIX='mls-offline-library-';
const LEGACY_CACHE_PREFIX='mls-iphone11-';
const LEGACY_LIBRARY_PROBE='./data/volumes/ingles.js';
async function notifyClients(type,detail={}){
  const clients=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  for(const client of clients)client.postMessage({source:'mls-offline',type,...detail});
}

const SHELL=[
  './','./index.html','./status.html','./assets/styles.css','./manifest.webmanifest',
  './data/index.js','./js/core.js','./js/map.js','./js/search.js','./js/compare.js',
  './js/ai.js','./js/wiki.js','./js/reader.js','./js/ios.js','./js/app.js',
  './assets/icon-192.png','./assets/icon-512.png','./assets/apple-touch-icon-180.png',
  './assets/splash-iphone11-828x1792.png'
];

self.addEventListener('install',event=>event.waitUntil(
  caches.open(APP_SHELL_CACHE)
    .then(cache=>cache.addAll(SHELL))
    .then(()=>self.skipWaiting())
));

async function cleanupCaches(){
  const keys=await caches.keys();
  await Promise.all(keys.map(async key=>{
    if(key.startsWith(OFFLINE_LIBRARY_PREFIX))return;
    if(key.startsWith('mls-app-shell-')&&key!==APP_SHELL_CACHE){
      await caches.delete(key);
      return;
    }
    if(key.startsWith(LEGACY_CACHE_PREFIX)){
      const legacy=await caches.open(key);
      const hasOfflineLibrary=Boolean(await legacy.match(LEGACY_LIBRARY_PROBE));
      if(!hasOfflineLibrary)await caches.delete(key);
    }
  }));
}

self.addEventListener('activate',event=>event.waitUntil(
  cleanupCaches().then(()=>self.clients.claim())
));

async function networkFirst(request){
  try{
    const response=await fetch(request,{cache:'no-store'});
    if(response&&response.ok&&new URL(request.url).origin===self.location.origin){
      const copy=response.clone();
      caches.open(APP_SHELL_CACHE).then(cache=>cache.put(request,copy));
    }
    return response;
  }catch(error){
    const cached=await caches.match(request);
    if(cached)return cached;
    const url=new URL(request.url);
    if(url.pathname.startsWith('/data/volumes/')){
      notifyClients('offline-content-missing',{url:url.pathname}).catch(()=>{});
    }
    if(request.mode==='navigate'){
      if(url.pathname==='/status'||url.pathname==='/status/')return caches.match('./status.html');
      return caches.match('./index.html');
    }
    throw error;
  }
}

async function cacheFirst(request){
  const cached=await caches.match(request);
  if(cached)return cached;
  const response=await fetch(request);
  if(response&&response.ok&&new URL(request.url).origin===self.location.origin){
    const copy=response.clone();
    caches.open(APP_SHELL_CACHE).then(cache=>cache.put(request,copy));
  }
  return response;
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.pathname.startsWith('/api/')){
    event.respondWith(fetch(event.request,{cache:'no-store'}));
    return;
  }
  const destination=event.request.destination;
  const needsFreshCode=
    event.request.mode==='navigate'||
    destination==='document'||
    destination==='script'||
    destination==='style'||
    url.pathname.endsWith('.html')||
    url.pathname.endsWith('.js')||
    url.pathname.endsWith('.css');
  event.respondWith(needsFreshCode?networkFirst(event.request):cacheFirst(event.request));
});
