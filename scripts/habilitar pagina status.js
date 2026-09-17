'use strict';
const fs=require('node:fs');
const path=require('node:path');

const TARGET='src/index.js';
const SOURCE='MLS R32 OVERLAY/status.html';
const PUBLIC='public/status.html';
const MARKER='// MLS STATUS PAGE ROUTE 1.0';
const ANCHOR=`    if (url.pathname.startsWith("/api/wiki/")) {\n      return handleWikiApi(request, env, url);\n    }`;

function patchWorker(source){
  source=String(source);
  if(source.includes(MARKER))return source;
  if(!source.includes(ANCHOR))throw new Error('No se encontró el ancla del router wiki para habilitar /status.');
  const route=`    ${MARKER}\n    if (url.pathname === "/status" || url.pathname === "/status/") {\n      if (request.method !== "GET" && request.method !== "HEAD") {\n        return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });\n      }\n      if (!env.ASSETS || typeof env.ASSETS.fetch !== "function") {\n        return new Response("Status page unavailable", { status: 503 });\n      }\n      const statusUrl = new URL(request.url);\n      statusUrl.pathname = "/status.html";\n      statusUrl.search = "";\n      return env.ASSETS.fetch(new Request(statusUrl.toString(), request));\n    }\n${ANCHOR}`;
  return source.replace(ANCHOR,route);
}

function installFiles(){
  if(!fs.existsSync(SOURCE))throw new Error('No se encontró la página visual de status.');
  fs.mkdirSync(path.dirname(PUBLIC),{recursive:true});
  fs.copyFileSync(SOURCE,PUBLIC);
  if(!fs.existsSync(TARGET))throw new Error('No se encontró src/index.js después de reconstruir R32.');
  fs.writeFileSync(TARGET,patchWorker(fs.readFileSync(TARGET,'utf8')),'utf8');
}

function main(){installFiles();console.log('Página visual /status habilitada.');}
module.exports={patchWorker,installFiles,MARKER,ANCHOR,SOURCE,PUBLIC};
if(require.main===module)main();
