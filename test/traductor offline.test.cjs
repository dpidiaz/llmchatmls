'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const test=require('node:test');
const vm=require('node:vm');

const html=fs.readFileSync('MLS R32 OVERLAY/traductor.html','utf8');
const offline=fs.readFileSync('MLS R32 OVERLAY/traductor offline.js','utf8');
const sw=fs.readFileSync('MLS R32 OVERLAY/sw.js','utf8');
const packs=JSON.parse(fs.readFileSync('MLS R32 OVERLAY/translator/packs.json','utf8'));
const registry=JSON.parse(fs.readFileSync('MLS R32 OVERLAY/translator/registry.json','utf8'));
const installer=require('../scripts/habilitar traductor pronunciacion.js');

const CANONICAL=['espanol-guatemala','ingles','portugues','italiano','frances','aleman','japones','chino-taiwan','coreano','ruso'];

test('offline pack manifest is versioned and covers all canonical languages',()=>{
  assert.equal(packs.schemaVersion,1);
  assert.match(packs.packVersion,/^mozilla-/);
  assert.equal(packs.engine.name,'Bergamot');
  assert.equal(packs.engine.version,'0.4.9');
  assert.equal(packs.engine.license,'MPL-2.0');
  assert.equal(packs.pivotLanguage,'en');
  assert.deepEqual(Object.keys(packs.languages),CANONICAL);
});

test('offline runtime is small, hashed and not part of automatic app shell runtime',()=>{
  assert.ok(packs.runtimeBytes>5_000_000&&packs.runtimeBytes<6_000_000);
  assert.equal(packs.runtime.length,4);
  for(const item of packs.runtime){
    assert.match(item.url,/^\/translator\/bergamot\//);
    assert.match(item.sha256,/^[a-f0-9]{64}$/);
    assert.ok(item.bytes>0);
  }
  assert.doesNotMatch(sw,/\.\/translator\/bergamot\/translator\.js/);
  assert.match(sw,/\.\/translator\/offline\.js/);
  assert.match(sw,/\.\/translator\/packs\.json/);
  assert.match(sw,/\.\/translator\/registry\.json/);
});

test('every non-English pack contains both directions through English with compressed hashes',()=>{
  for(const slug of CANONICAL.filter(x=>x!=='ingles')){
    const lang=packs.languages[slug];
    assert.equal(lang.directions.length,2,slug);
    assert.ok(lang.directions.includes(lang.code+'-en'),slug);
    assert.ok(lang.directions.includes('en-'+lang.code),slug);
    assert.ok(lang.compressedBytes>20*1024*1024,slug);
    assert.ok(lang.uncompressedBytes>lang.compressedBytes,slug);
    for(const file of lang.files){
      assert.match(file.url,/^\/translation-models\/models\//,slug);
      assert.match(file.upstreamPath,/^models\//,slug);
      assert.match(file.compressedSha256,/^[a-f0-9]{64}$/,slug);
      assert.match(file.uncompressedSha256,/^[a-f0-9]{64}$/,slug);
      assert.ok(file.compressedBytes>0&&file.uncompressedBytes>0,slug);
    }
  }
});

test('Bergamot registry is same-origin and contains all 18 model directions',()=>{
  const keys=Object.keys(registry);
  assert.equal(keys.length,18);
  for(const [key,parts] of Object.entries(registry)){
    assert.match(key,/^[a-z]{4}$/);
    assert.ok(parts.model,key);
    for(const [part,file] of Object.entries(parts)){
      if(part==='config')continue;
      assert.match(file.name,/^\/translation-models\/models\//,key+' '+part);
      assert.match(file.expectedSha256Hash,/^[a-f0-9]{64}$/,key+' '+part);
      assert.ok(file.size>0,key+' '+part);
    }
  }
});

test('model proxy is a strict allowlist rather than an arbitrary upstream proxy',()=>{
  const allowed=installer.allowedModelPaths(packs);
  const expected=new Set(Object.values(packs.languages).flatMap(lang=>(lang.files||[]).map(file=>file.upstreamPath)));
  assert.equal(allowed.length,expected.size);
  for(const item of allowed)assert.ok(expected.has(item));
  const block=installer.buildModelProxyBlock(packs);
  assert.match(block,/new Set\(/);
  assert.match(block,/MLS_TRANSLATION_MODEL_PATHS\.has\(relative\)/);
  assert.match(block,/return new Response\("Not found", \{ status: 404 \}\)/);
  assert.match(block,/request\.method !== "GET" && request\.method !== "HEAD"/);
  assert.doesNotMatch(block,/url\.searchParams.*http/i);
});

test('Service Worker preserves Language Tools independently from App Shell and Offline Library',()=>{
  assert.match(sw,/const LANGUAGE_TOOLS_CACHE='mls-language-tools-r1'/);
  assert.match(sw,/if\(key===LANGUAGE_TOOLS_CACHE\)return/);
  assert.match(sw,/url\.pathname\.startsWith\('\/translation-models\/'\)/);
  assert.match(sw,/url\.pathname\.startsWith\('\/translator\/bergamot\/'\)/);
  assert.match(sw,/languageToolsFirst\(event\.request\)/);
  assert.match(sw,/cache\.match\(request,\{ignoreSearch:false\}\)/);
});

test('offline runtime treats Cache Storage as source of truth and verifies hashes',()=>{
  assert.match(offline,/const CACHE_NAME='mls-language-tools-r1'/);
  assert.match(offline,/caches\.open\(CACHE_NAME\)/);
  assert.match(offline,/verifyCachedItem/);
  assert.match(offline,/sha256Hex\(buffer\)/);
  assert.match(offline,/actual\.toLowerCase\(\)!==String\(item\.sha256\)\.toLowerCase\(\)/);
  assert.doesNotMatch(offline,/localStorage\.getItem\(STATE_KEY\).*===.*ready/);
});

test('pack manager detects prior installs and exposes an explicit language checklist',()=>{
  assert.match(html,/Usar traducción sin Internet/);
  assert.match(html,/id="downloadSelectedPacks"/);
  assert.match(html,/id="downloadAllPacks"/);
  assert.match(html,/data-pack-checkbox/);
  assert.match(html,/pack\.status==='ready'/);
  assert.match(html,/checkbox\.checked=true/);
  assert.match(html,/checkbox\.disabled=true/);
  assert.match(html,/pack\.status==='partial'/);
  assert.match(html,/MLS marca automáticamente los paquetes completos que ya tienes guardados/);
  for(const flag of ['🇬🇹','🇺🇸','🇧🇷','🇮🇹','🇫🇷','🇩🇪','🇯🇵','🇹🇼','🇰🇷','🇷🇺'])assert.match(html,new RegExp(flag));
});

test('fast pack catalog combines persisted verified state with real Cache Storage presence',()=>{
  assert.match(offline,/export async function packCatalog\(\)/);
  assert.match(offline,/const stateMatches=state\.packVersion===manifest\.packVersion/);
  assert.match(offline,/cachedItemPresent\(cache,item\)/);
  assert.match(offline,/const ready=modelsPresent&&runtimeStatus==='ready'&&storedStatus==='ready'/);
  assert.match(offline,/status:ready\?'ready':partial\?'partial':'empty'/);
  assert.match(offline,/installed:ready/);
});

test('pack download remains opt-in, verified, retryable and removable',()=>{
  assert.match(offline,/writeState\(manifest,slug,'downloading'\)/);
  assert.match(offline,/writeState\(manifest,slug,'partial'\)/);
  assert.match(offline,/if\(verified\.status!=='ready'\)throw/);
  assert.match(offline,/writeState\(manifest,slug,'ready'\)/);
  assert.match(offline,/cache\.delete\(item\.url/);
  assert.match(html,/downloadOfflinePacks\('selected'\)/);
  assert.match(html,/downloadOfflinePacks\('all'\)/);
  assert.match(html,/pack\.status!=='ready'/);
  assert.match(html,/remove\.dataset\.removePack/);
});

test('local engine decompresses on device and validates uncompressed integrity',()=>{
  assert.match(offline,/new DecompressionStream\('gzip'\)/);
  assert.match(offline,/crypto\.subtle\.digest\('SHA-256'/);
  assert.match(offline,/if\(checksum\)/);
  assert.match(offline,/new mod\.TranslatorBacking\(options\)/);
  assert.match(offline,/backing\.fetch=verifiedFetchForBacking/);
  assert.match(offline,/new mod\.LatencyOptimisedTranslator\(options,backing\)/);
});

test('translation engine choice is explicit: Local and Online never silently fall back',()=>{
  assert.match(html,/data-translation-mode="online"/);
  assert.match(html,/data-translation-mode="local"/);
  assert.match(html,/let translationMode='online'/);
  assert.match(html,/if\(mode==='local'\)/);
  assert.match(html,/offline\.canTranslateOffline/);
  assert.match(html,/offline\.translateLocal/);
  assert.match(html,/fetch\('\/api\/translate'/);
  assert.match(html,/El motor local no pudo completar esta traducción\. No se usó Internet/);
  assert.match(html,/Traducción en línea lista\. Los paquetes locales no se usaron/);
  assert.match(html,/MLS respetará ese motor y no cambiará automáticamente al otro/);
  assert.doesNotMatch(html,/mode==='auto'/);
});

test('English remains the pivot/base while Download all targets only missing downloadable packs',()=>{
  assert.match(offline,/if\(source!=='ingles'\)out\.push\(source\)/);
  assert.match(offline,/if\(target!=='ingles'/);
  assert.match(offline,/runtimeOnly:true/);
  assert.match(html,/Descargar todos/);
  assert.match(html,/pack\.selectable&&pack\.status!=='ready'/);
  assert.match(html,/Base del traductor · no requiere paquete/);
  assert.doesNotMatch(offline,/preparePack\([^)]*CANONICAL/);
});

test('pack UI exposes real size, progress, privacy, storage estimate and skips completed downloads',()=>{
  assert.match(html,/offline\.bytesLabel\(pack\.compressedBytes\)/);
  assert.match(html,/id="offlinePackProgress"/);
  assert.match(html,/role="status" aria-live="polite"/);
  assert.match(html,/no envía tu texto a Workers AI/);
  assert.match(html,/pack&&pack\.selectable&&pack\.status!=='ready'/);
  assert.match(html,/Todos los paquetes disponibles ya están descargados/);
  assert.match(offline,/navigator\.storage\.estimate/);
});

test('offline manager limits mobile memory by disposing translator on pair change',()=>{
  assert.match(offline,/if\(activeTranslator&&activeTranslatorKey!==key\)/);
  assert.match(offline,/await activeTranslator\.delete\(\)/);
  assert.match(offline,/activeTranslator=null/);
});

test('offline module has valid ECMAScript module syntax',()=>{
  if(typeof vm.SourceTextModule==='function'){
    assert.doesNotThrow(()=>new vm.SourceTextModule(offline));
  }else{
    assert.match(offline,/export async function translateLocal/);
  }
});
