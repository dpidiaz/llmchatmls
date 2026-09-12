const CACHE='mls-iphone11-2026-r32-scrollzero-2';
const SHELL=[
  './','./index.html','./assets/styles.css','./manifest.webmanifest','./data/index.js',
  './js/core.js','./js/map.js','./js/search.js','./js/compare.js','./js/ai.js','./js/wiki.js','./js/reader.js','./js/ios.js','./js/app.js',
  './assets/icon-192.png','./assets/icon-512.png','./assets/apple-touch-icon-180.png','./assets/splash-iphone11-828x1792.png'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('mls-iphone11-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.pathname.startsWith('/api/')){event.respondWith(fetch(event.request));return;}
  event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(resp=>{
    if(resp&&resp.ok&&new URL(event.request.url).origin===self.location.origin){const copy=resp.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}
    return resp;
  }).catch(()=>event.request.mode==='navigate'?caches.match('./index.html'):undefined)));
});
