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
  assert.deepEqual(status.verifiedCodes,[...codes].sort());
  assert.equal(status.totalEntries,10133);
  assert.equal(status.remaining,10133-codes.length);
  assert.equal(status.languages.reduce((sum,row)=>sum+row.verified,0),codes.length);
  assert.equal(status.languages.reduce((sum,row)=>sum+row.total,0),10133);
});

function entryMonitorHarness(entries) {
  const vm=require('node:vm');
  class Element {
    constructor(){this.value='';this.textContent='';this.children=[];this.listeners={};this.disabled=false;}
    append(child){this.children.push(child);}
    replaceChildren(){this.children=[];}
    get lastChild(){return this.children.at(-1);}
    setAttribute(){}
    addEventListener(name,fn){this.listeners[name]=fn;}
    fire(name){this.listeners[name]?.();}
  }
  const elements=new Map();
  const document={getElementById(id){if(!elements.has(id))elements.set(id,new Element());return elements.get(id)},createElement(){return new Element()}};
  let fetchCount=0,fail=false;
  const context={document,window:{},AbortSignal,fetch:async()=>{fetchCount++;return {ok:!fail,json:async()=>({totalEntries:entries.length,entries})}}};
  vm.runInNewContext(fs.readFileSync(path.join(root,'MLS R32 OVERLAY','status entries.js'),'utf8'),context);
  return {api:context.window.mlsStatusEntries,$:document.getElementById,fetchCount:()=>fetchCount,setFail:value=>{fail=value}};
}

test('individual monitor searches titles and IDs, filters, paginates and updates verification without resetting filters',async()=>{
  const entries=Array.from({length:61},(_,i)=>({code:'MLS-V01-'+String(i+1).padStart(4,'0'),language:'ingles',title:i===0?'Alfabeto inglés <img onerror=alert(1)>':'Tema '+(i+1)}));
  const h=entryMonitorHarness(entries);
  const data={ok:true,verifiedCodes:['MLS-V01-0001'],verifiedCount:1,totalEntries:61,languages:[{slug:'ingles',name:'Inglés'}],fetchedAt:'2026-10-03T15:00:00Z'};
  await h.api.update(data);
  assert.equal(h.$('entryRows').children.length,50);
  assert.equal(h.$('entryRows').children[0].children[1].textContent,entries[0].title);
  assert.equal(h.$('entryRows').children[0].children[1].children.length,0);
  assert.equal(h.$('entryRows').children[0].children[3].textContent,'VERIFIED');
  assert.equal(h.$('entryRows').children[1].children[3].textContent,'Pendiente');
  h.$('entryNext').fire('click');
  assert.equal(h.$('entryRows').children.length,11);
  assert.equal(h.$('entryNext').disabled,true);
  h.$('entrySearch').value='ingles';h.$('entrySearch').fire('input');
  assert.equal(h.$('entryRows').children.length,1);
  assert.equal(h.$('entryRows').children[0].children[0].textContent,'MLS-V01-0001');
  h.$('entrySearch').value='MLS-V01-0002';h.$('entrySearch').fire('input');
  h.$('entryStatus').value='PENDING';h.$('entryStatus').fire('input');
  h.$('entryLanguage').value='ingles';h.$('entryLanguage').fire('input');
  await h.api.update({...data,verifiedCodes:['MLS-V01-0001','MLS-V01-0002'],verifiedCount:2});
  assert.equal(h.$('entryResults').textContent,'0 entradas');
  assert.equal(h.$('entrySearch').value,'MLS-V01-0002');
  assert.equal(h.$('entryLanguage').value,'ingles');
  assert.equal(h.fetchCount(),1);
});

test('monitor fails closed for unavailable or inconsistent sources, preserves marked stale data and retries catalog failures',async()=>{
  const h=entryMonitorHarness([{code:'MLS-V01-0001',language:'ingles',title:'Alfabeto'}]);
  const data={ok:true,verifiedCodes:['MLS-V01-0001'],verifiedCount:1,totalEntries:1,languages:[{slug:'ingles',name:'Inglés'}],fetchedAt:'2026-10-03T15:00:00Z'};
  h.setFail(true);await h.api.update(data);
  assert.match(h.$('entryFreshness').textContent,/No se pudo consultar/);
  h.setFail(false);await h.api.update(data);
  assert.equal(h.$('entryRows').children[0].children[3].textContent,'VERIFIED');
  await h.api.update({...data,verifiedCodes:['MLS-V01-0002']});
  assert.match(h.$('entryFreshness').textContent,/Datos desactualizados/);
  assert.equal(h.$('entryRows').children[0].children[3].textContent,'VERIFIED');
  await h.api.update({...data,verifiedCodes:[],verifiedCount:0});
  assert.equal(h.$('entryRows').children[0].children[3].textContent,'Pendiente');
  h.api.unavailable();
  assert.match(h.$('entryFreshness').textContent,/Datos desactualizados/);
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
