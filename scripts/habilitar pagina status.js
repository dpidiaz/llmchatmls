'use strict';
const fs=require('node:fs');
const path=require('node:path');

const TARGET='src/index.js';
const SOURCE='MLS R32 OVERLAY/status.html';
const PUBLIC='public/status.html';
const MARKER='// MLS STATUS PAGE ROUTE 1.1';
const ANCHOR=`    if (url.pathname.startsWith("/api/wiki/")) {\n      return handleWikiApi(request, env, url);\n    }`;

function patchWorker(source,html){
  source=String(source);
  html=String(html||'');
  if(source.includes(MARKER))return source;
  if(!source.includes(ANCHOR))throw new Error('No se encontró el ancla del router wiki para habilitar /status.');
  if(!html.includes('<title>Status · MASTER LANGUAGE SYSTEM</title>'))throw new Error('La página visual de status no es válida.');
  const payload=JSON.stringify(html);
  const route=`    ${MARKER}\n    if (url.pathname === "/status" || url.pathname === "/status/" || url.pathname === "/status.html") {\n      if (request.method !== "GET" && request.method !== "HEAD") {\n        return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });\n      }\n      return new Response(request.method === "HEAD" ? null : ${payload}, {\n        status: 200,\n        headers: {\n          "content-type": "text/html; charset=utf-8",\n          "cache-control": "no-cache, no-store",\n          "x-content-type-options": "nosniff"\n        }\n      });\n    }\n${ANCHOR}`;
  return source.replace(ANCHOR,route);
}

function installFiles(){
  if(!fs.existsSync(SOURCE))throw new Error('No se encontró la página visual de status.');
  const html=fs.readFileSync(SOURCE,'utf8');
  fs.mkdirSync(path.dirname(PUBLIC),{recursive:true});
  fs.writeFileSync(PUBLIC,html,'utf8');
  if(!fs.existsSync(TARGET))throw new Error('No se encontró src/index.js después de reconstruir R32.');
  fs.writeFileSync(TARGET,patchWorker(fs.readFileSync(TARGET,'utf8'),html),'utf8');
}

function main(){installFiles();console.log('Página visual /status habilitada directamente desde el Worker.');}
module.exports={patchWorker,installFiles,MARKER,ANCHOR,SOURCE,PUBLIC};
if(require.main===module)main();
