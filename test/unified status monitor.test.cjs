'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

const root=path.join(__dirname,'..');
const verifiedPath=path.join(root,'MLS R32 EDITORIAL','evidence git','indexes','verified.json');
const helperPath=path.join(root,'MLS R32 OVERLAY','unified status.mjs');
const overlayWorker=fs.readFileSync(path.join(root,'MLS R32 OVERLAY','index.js'),'utf8');
const statusHtml=fs.readFileSync(path.join(root,'MLS R32 OVERLAY','status.html'),'utf8');

test('Unified status derives VERIFIED exactly from canonical verified.json',async()=>{
  const helper=await import(pathToFileURL(helperPath).href+'?t='+Date.now());
  const codes=JSON.parse(fs.readFileSync(verifiedPath,'utf8'));
  const status=helper.buildUnifiedStatus(codes,{fetchedAt:'2026-10-03T08:40:00.000Z'});
  assert.equal(status.ok,true);
  assert.equal(status.sourceOfTruth,'github-main-verified-index');
  assert.equal(status.verifiedCount,codes.length);
  assert.equal(status.totalEntries,10133);
  assert.equal(status.remaining,10133-codes.length);
  assert.equal(status.languages.reduce((sum,row)=>sum+row.verified,0),codes.length);
  assert.equal(status.languages.reduce((sum,row)=>sum+row.total,0),10133);
});

test('Unified status rejects duplicate or malformed VERIFIED codes',async()=>{
  const helper=await import(pathToFileURL(helperPath).href+'?x='+Date.now());
  assert.throws(()=>helper.buildUnifiedStatus(['MLS-V01-0001','MLS-V01-0001']),/UNIFIED_VERIFIED_DUPLICATE/);
  assert.throws(()=>helper.buildUnifiedStatus(['NOT-A-CODE']),/UNIFIED_VERIFIED_CODE_INVALID/);
  assert.throws(()=>helper.buildUnifiedStatus(['MLS-V01-9999']),/UNIFIED_VERIFIED_CODE_OUT_OF_RANGE/);
});

test('Worker exposes cached user-facing Unified JSON endpoint',()=>{
  assert.match(overlayWorker,/from "\.\/unified-status\.mjs"/);
  assert.match(overlayWorker,/url\.pathname === "\/api\/unified\/status"/);
  assert.match(overlayWorker,/fetchUnifiedStatus\(fetch\)/);
  assert.match(overlayWorker,/github-main-verified-index/);
  assert.match(overlayWorker,/max-age=15, s-maxage=30/);
});

test('Status page prominently monitors Unified canonical progress',()=>{
  for(const term of [
    'MLS Unified',
    'entradas canónicas VERIFIED',
    'Pendientes para VERIFIED',
    'Desde activación Unified',
    'Desde que abriste el monitor',
    'Ritmo observado en esta pestaña',
    'VERIFIED por idioma',
    'verified.json'
  ]) assert.match(statusHtml,new RegExp(term,'i'));
  assert.match(statusHtml,/\/api\/unified\/status/);
  assert.match(statusHtml,/mls-unified-monitor-v1/);
  assert.match(statusHtml,/localStorage/);
  assert.match(statusHtml,/setInterval\(\(\)=>\{if\(!document\.hidden\)load\(\)\},60000\)/);
});
