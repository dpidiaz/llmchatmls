'use strict';

const fs=require('node:fs');
const path=require('node:path');

const PAGE_SOURCE='MLS R32 OVERLAY/traductor.html';
const PAGE_PUBLIC='public/traductor.html';
const HOME='public/index.html';
const WORKER='src/index.js';
const HOME_MARKER='data-nav="translator"';
const WORKER_MARKER='MLS_TRANSLATOR_ROUTE_V1';

function patchHome(html){
  html=String(html||'');
  if(html.includes(HOME_MARKER))return html;
  const anchor='      <a href="#compare" data-nav="compare">⇄ Ver diferencias</a>';
  if(!html.includes(anchor))throw new Error('Traductor: no se encontró el menú Herramientas generado.');
  return html.replace(anchor,anchor+'\n      <a href="/traductor" data-nav="translator">Traductor</a>');
}

function patchWorker(source){
  source=String(source||'');
  if(source.includes(WORKER_MARKER))return source;
  const anchor='    if (url.pathname.startsWith("/api/wiki/")) {';
  if(!source.includes(anchor))throw new Error('Traductor: no se encontró el ancla del router Worker.');
  const block=[
    '    // '+WORKER_MARKER,
    '    if (url.pathname === "/traductor" || url.pathname === "/traductor/") {',
    '      if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });',
    '      if (!env.ASSETS || typeof env.ASSETS.fetch !== "function") return new Response("Traductor no disponible.", { status: 503 });',
    '      const assetUrl = new URL("/traductor.html", request.url);',
    '      const assetRequest = new Request(assetUrl.toString(), request);',
    '      return env.ASSETS.fetch(assetRequest);',
    '    }',
    anchor
  ].join('\n');
  return source.replace(anchor,block);
}

function install(){
  for(const file of [PAGE_SOURCE,HOME,WORKER])if(!fs.existsSync(file))throw new Error('Traductor: falta '+file);
  const page=fs.readFileSync(PAGE_SOURCE,'utf8');
  if(!page.includes('<title>Traductor · MASTER LANGUAGE SYSTEM</title>'))throw new Error('Traductor: página fuente inválida.');
  fs.mkdirSync(path.dirname(PAGE_PUBLIC),{recursive:true});
  fs.writeFileSync(PAGE_PUBLIC,page,'utf8');
  fs.writeFileSync(HOME,patchHome(fs.readFileSync(HOME,'utf8')),'utf8');
  fs.writeFileSync(WORKER,patchWorker(fs.readFileSync(WORKER,'utf8')),'utf8');
}

function main(){install();console.log('MLS Traductor + Pronunciación T1–T2 habilitado.');}

module.exports={PAGE_SOURCE,PAGE_PUBLIC,HOME,WORKER,HOME_MARKER,WORKER_MARKER,patchHome,patchWorker,install};
if(require.main===module)main();
