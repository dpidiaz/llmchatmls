'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const test=require('node:test');

const iosSource=fs.readFileSync('MLS R32 OVERLAY/ios.js','utf8');
const swSource=fs.readFileSync('MLS R32 OVERLAY/sw.js','utf8');

class FakeResponse{
  constructor(body='ok',status=200){this.body=body;this.status=status;this.ok=status>=200&&status<300}
  clone(){return new FakeResponse(this.body,this.status)}
}
const keyOf=value=>typeof value==='string'?value:(value&&value.url)||String(value);
class FakeCache{
  constructor(){this.items=new Map()}
  async match(key){return this.items.get(keyOf(key))}
  async put(key,response){this.items.set(keyOf(key),response)}
  async addAll(paths){for(const path of paths)this.items.set(path,new FakeResponse(path))}
}
class FakeCaches{
  constructor(){this.stores=new Map()}
  async open(name){if(!this.stores.has(name))this.stores.set(name,new FakeCache());return this.stores.get(name)}
  async keys(){return [...this.stores.keys()]}
  async delete(name){return this.stores.delete(name)}
  async match(key){for(const cache of this.stores.values()){const hit=await cache.match(key);if(hit)return hit}}
}
class FakeStorage{
  constructor(){this.map=new Map()}
  getItem(key){return this.map.has(key)?this.map.get(key):null}
  setItem(key,value){this.map.set(key,String(value))}
  removeItem(key){this.map.delete(key)}
}
class FakeRequest{
  constructor(url,options={}){this.url=url;Object.assign(this,options)}
}

function createIosRuntime({fetchImpl}={}){
  const caches=new FakeCaches();
  const localStorage=new FakeStorage();
  const windowListeners={};
  const documentListeners={};
  const elements=new Map();
  const document={
    body:{dataset:{},appendChild(node){if(node?.id)elements.set(node.id,node)}},
    createElement(){return {id:'',className:'',attributes:{},textContent:'',setAttribute(name,value){this.attributes[name]=String(value)}}},
    getElementById(id){return elements.get(id)||null},
    querySelectorAll(){return []},
    addEventListener(name,fn){documentListeners[name]=fn}
  };
  const navigator={
    onLine:true,userAgent:'',platform:'',maxTouchPoints:0,
    storage:{persist:async()=>true,estimate:async()=>({usage:0})}
  };
  const window={
    MLS:{toast(){},pages:{}},
    navigator,caches,localStorage,
    matchMedia(){return {matches:false}},
    addEventListener(name,fn){windowListeners[name]=fn}
  };
  const context={
    window,document,navigator,caches,localStorage,
    location:{protocol:'https:',hash:'',reloadCalls:0,reload(){this.reloadCalls++}},
    Request:FakeRequest,
    fetch:fetchImpl|| (async req=>new FakeResponse(keyOf(req))),
    setTimeout(fn){fn();return 1},
    clearTimeout(){},
    console
  };
  context.globalThis=context;
  vm.createContext(context);
  new vm.Script(iosSource,{filename:'ios.js'}).runInContext(context);
  return {context,caches,localStorage,windowListeners,documentListeners,offline:window.MLS.offline,elements};
}

async function fillLanguage(cache,slug,offline){
  for(const path of offline.LANGUAGES[slug].files)await cache.put(path,new FakeResponse(path));
}

test('legacy completo migrates to verified Offline Library Cache',async()=>{
  const rt=createIosRuntime();
  const legacy=await rt.caches.open('mls-iphone11-legacy-full');
  for(const slug of rt.offline.ALL_LANGUAGES)await fillLanguage(legacy,slug,rt.offline);
  rt.localStorage.setItem('mlsOfflinePackVersion','old');
  rt.localStorage.setItem('mlsOfflinePackSavedAt','2026-09-19T10:00:00.000Z');

  const state=await rt.offline.verifyOfflineState();
  assert.equal(state.status,'ready');
  assert.equal(state.savedLanguages.length,10);
  assert.ok((await rt.caches.keys()).includes(rt.offline.LIBRARY_CACHE));
  assert.ok(!(await rt.caches.keys()).includes('mls-iphone11-legacy-full'));
  const persisted=JSON.parse(rt.localStorage.getItem('mlsOfflineLibraryStateV1'));
  assert.equal(persisted.savedLanguages.length,10);
});

test('legacy incompleto does not claim offline readiness or delete recoverable legacy cache',async()=>{
  const rt=createIosRuntime();
  const legacy=await rt.caches.open('mls-iphone11-legacy-partial');
  await fillLanguage(legacy,'ingles',rt.offline);
  rt.localStorage.setItem('mlsOfflinePackVersion','old');

  const state=await rt.offline.verifyOfflineState();
  assert.equal(state.status,'empty');
  assert.deepEqual([...state.savedLanguages],[]);
  assert.ok((await rt.caches.keys()).includes('mls-iphone11-legacy-partial'));
});

test('legacy flag sin cache is ignored instead of producing a false ready state',async()=>{
  const rt=createIosRuntime();
  rt.localStorage.setItem('mlsOfflinePackVersion','old');
  const state=await rt.offline.verifyOfflineState();
  assert.equal(state.status,'empty');
  assert.equal(rt.offline.isReady(),false);
});

test('verified cache sin flag reconstructs state from physical Cache Storage',async()=>{
  const rt=createIosRuntime();
  const cache=await rt.caches.open(rt.offline.LIBRARY_CACHE);
  await fillLanguage(cache,'japones',rt.offline);

  const state=await rt.offline.verifyOfflineState();
  assert.equal(state.status,'ready');
  assert.deepEqual([...state.savedLanguages],['japones']);
  const persisted=JSON.parse(rt.localStorage.getItem('mlsOfflineLibraryStateV1'));
  assert.deepEqual(persisted.savedLanguages,['japones']);
});

test('selección parcial stores and verifies only selected language',async()=>{
  const rt=createIosRuntime();
  await rt.offline.prepare(['portugues']);
  const state=await rt.offline.verifyOfflineState();
  assert.equal(state.status,'ready');
  assert.deepEqual([...state.savedLanguages],['portugues']);
  assert.equal(rt.offline.hasLanguage('portugues'),true);
  assert.equal(rt.offline.hasLanguage('aleman'),false);
});

test('descarga interrumpida preserves physically completed language and never claims requested set',async()=>{
  let calls=0;
  const rt=createIosRuntime({
    fetchImpl:async req=>{
      calls++;
      if(calls===2)throw new Error('network interrupted');
      return new FakeResponse(keyOf(req));
    }
  });
  await rt.offline.prepare(['ingles','portugues']);
  const state=await rt.offline.verifyOfflineState();
  assert.equal(state.status,'ready');
  assert.deepEqual([...state.savedLanguages],['ingles']);
  assert.equal(rt.offline.hasLanguage('portugues'),false);
});

test('estado posterior a fallo is derived from cache reality, not requested download metadata',async()=>{
  const rt=createIosRuntime({fetchImpl:async()=>{throw new Error('offline')}});
  await rt.offline.prepare(['frances']);
  const state=await rt.offline.verifyOfflineState();
  assert.equal(state.status,'empty');
  assert.deepEqual([...state.savedLanguages],[]);
  assert.equal(rt.localStorage.getItem('mlsOfflineLibraryStateV1'),null);
});

test('online → offline → online updates connectivity state and re-verifies library',async()=>{
  const rt=createIosRuntime();
  await rt.documentListeners.DOMContentLoaded?.();
  assert.equal(rt.context.document.body.dataset.online,'true');
  rt.context.navigator.onLine=false;
  await rt.windowListeners.offline?.();
  assert.equal(rt.context.document.body.dataset.online,'false');
  rt.context.navigator.onLine=true;
  await rt.windowListeners.online?.();
  assert.equal(rt.context.document.body.dataset.online,'true');
});

test('service worker upgrade deletes old app shell but preserves Offline Library Cache',async()=>{
  const caches=new FakeCaches();
  const library=await caches.open('mls-offline-library-offline-library-v1');
  await library.put('./data/volumes/ingles.js',new FakeResponse());
  await caches.open('mls-app-shell-old');
  const legacyWithLibrary=await caches.open('mls-iphone11-legacy-pack');
  await legacyWithLibrary.put('./data/volumes/ingles.js',new FakeResponse());
  await caches.open('mls-iphone11-shell-only');

  const listeners={};
  const self={
    location:{origin:'https://example.test'},
    addEventListener(name,fn){listeners[name]=fn},
    skipWaiting:async()=>{},
    clients:{claim:async()=>{}}
  };
  const context={self,caches,fetch:async()=>new FakeResponse(),URL,console};
  vm.createContext(context);
  new vm.Script(swSource,{filename:'sw.js'}).runInContext(context);

  let activation;
  listeners.activate({waitUntil(p){activation=p}});
  await activation;

  const keys=await caches.keys();
  assert.ok(keys.includes('mls-offline-library-offline-library-v1'));
  assert.ok(keys.includes('mls-iphone11-legacy-pack'));
  assert.ok(!keys.includes('mls-iphone11-shell-only'));
  assert.ok(!keys.includes('mls-app-shell-old'));
});


test('conexión perdida announces downloaded-library fallback and AI limitation accessibly',async()=>{
  const rt=createIosRuntime();
  await rt.documentListeners.DOMContentLoaded?.();
  rt.context.navigator.onLine=false;
  await rt.windowListeners.offline?.();
  assert.equal(rt.context.document.body.dataset.online,'false');
  const live=rt.elements.get('offlineLiveRegion');
  assert.ok(live);
  assert.equal(live.attributes['aria-live'],'assertive');
  assert.match(live.textContent,/contenido descargado/i);
  assert.match(live.textContent,/IA necesitan conexión/i);
});

test('conexión restaurada re-verifies state and announces recovery',async()=>{
  const rt=createIosRuntime();
  await rt.documentListeners.DOMContentLoaded?.();
  rt.context.navigator.onLine=true;
  await rt.windowListeners.online?.();
  assert.equal(rt.context.document.body.dataset.online,'true');
  const live=rt.elements.get('offlineLiveRegion');
  assert.ok(live);
  assert.match(live.textContent,/Conexión restaurada/i);
});

test('service worker missing-content message is ignored unless it belongs to MLS offline contract',()=>{
  const rt=createIosRuntime();
  assert.doesNotThrow(()=>rt.offline.handleServiceWorkerMessage({data:{source:'other',type:'offline-content-missing',url:'/data/volumes/japones.js'}}));
  assert.equal(rt.elements.has('offlineLiveRegion'),false);
});

test('missing uncached language produces understandable accessible fallback without technical cache terms',()=>{
  const rt=createIosRuntime();
  rt.offline.showMissingContent('/data/volumes/japones.js');
  const live=rt.elements.get('offlineLiveRegion');
  assert.ok(live);
  assert.match(live.textContent,/Japonés no está disponible sin conexión/i);
  assert.doesNotMatch(live.textContent,/cache|service worker/i);
});

test('retry without connection does not reload and announces why',async()=>{
  const rt=createIosRuntime();
  rt.context.navigator.onLine=false;
  await rt.offline.retryMissingContent();
  assert.equal(rt.context.location.reloadCalls,0);
  const live=rt.elements.get('offlineLiveRegion');
  assert.ok(live);
  assert.match(live.textContent,/Todavía no hay conexión/i);
});
