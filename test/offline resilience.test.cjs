'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const test=require('node:test');

const ios=fs.readFileSync('MLS R32 OVERLAY/ios.js','utf8');
const sw=fs.readFileSync('MLS R32 OVERLAY/sw.js','utf8');

test('app shell cache and offline library cache are separate contracts',()=>{
  assert.match(sw,/APP_SHELL_CACHE='mls-app-shell-'/);
  assert.match(sw,/OFFLINE_LIBRARY_PREFIX='mls-offline-library-'/);
  assert.match(ios,/LIBRARY_CACHE='mls-offline-library-'/);
  assert.doesNotMatch(ios,/const CACHE='mls-iphone11-/);
});

test('service worker preserves offline library caches during activation',()=>{
  assert.match(sw,/if\(key\.startsWith\(OFFLINE_LIBRARY_PREFIX\)\)return/);
  assert.match(sw,/if\(key\.startsWith\('mls-app-shell-'\)&&key!==APP_SHELL_CACHE\)/);
});

test('legacy caches with downloaded language volumes are preserved for migration',()=>{
  assert.match(sw,/LEGACY_CACHE_PREFIX='mls-iphone11-'/);
  assert.match(sw,/LEGACY_LIBRARY_PROBE='\.\/data\/volumes\/ingles\.js'/);
  assert.match(sw,/hasOfflineLibrary/);
  assert.match(sw,/if\(!hasOfflineLibrary\)await caches\.delete\(key\)/);
});

test('offline ready state is verified against Cache Storage rather than localStorage alone',()=>{
  assert.match(ios,/async function verifyOfflineState\(\)/);
  assert.match(ios,/cacheHasFiles\(cache,LANGUAGES\[slug\]\.files\)/);
  assert.match(ios,/const isReady=\(\)=>verifiedState\.status==='ready'/);
  assert.doesNotMatch(ios,/isReady=\(\)=>localStorage\.getItem/);
});

test('legacy state migrates only after all legacy language files are physically present',()=>{
  assert.match(ios,/async function migrateLegacy\(\)/);
  assert.match(ios,/cacheHasFiles\(legacy,filesFor\(ALL_LANGUAGES\)\)/);
  assert.match(ios,/cacheHasFiles\(target,filesFor\(ALL_LANGUAGES\)\)/);
  assert.match(ios,/writeState\(ALL_LANGUAGES,savedAt\)/);
});

test('offline library has per-language mapping and supports selected downloads',()=>{
  for(const slug of ['espanol-guatemala','ingles','portugues','italiano','frances','aleman','japones','chino-taiwan','coreano','ruso']){
    assert.match(ios,new RegExp(slug.replace(/[.*+?^$()|[\]\\]/g,'\\$&')));
  }
  assert.match(ios,/data-offline-language/);
  assert.match(ios,/Preparar selección/);
  assert.match(ios,/data-offline-all>Guardar todos/);
  assert.match(ios,/async function prepare\(slugs=ALL_LANGUAGES\)/);
});

test('offline state is schema-versioned and backward compatible',()=>{
  assert.match(ios,/SCHEMA_VERSION=1/);
  assert.match(ios,/STATE_KEY='mlsOfflineLibraryStateV1'/);
  assert.match(ios,/LEGACY_VERSION_KEY='mlsOfflinePackVersion'/);
  assert.match(ios,/LEGACY_SAVED_AT_KEY='mlsOfflinePackSavedAt'/);
  assert.match(ios,/schemaVersion:SCHEMA_VERSION/);
});

test('offline microcopy distinguishes library availability from AI availability',()=>{
  assert.match(ios,/La biblioteca descargada funciona sin Internet\. Las funciones de IA necesitan conexión\./);
  assert.match(ios,/Biblioteca disponible sin Internet/);
  assert.match(ios,/Las funciones de IA necesitan conexión/);
});

test('API requests remain network-only and local content can fall back to any cache',()=>{
  assert.match(sw,/url\.pathname\.startsWith\('\/api\/'\)/);
  assert.match(sw,/fetch\(event\.request,\{cache:'no-store'\}\)/);
  assert.match(sw,/const cached=await caches\.match\(request\)/);
});
