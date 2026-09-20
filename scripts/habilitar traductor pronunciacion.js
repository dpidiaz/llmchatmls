'use strict';

const fs=require('node:fs');
const path=require('node:path');

const PAGE_SOURCE='MLS R32 OVERLAY/traductor.html';
const OFFLINE_SOURCE='MLS R32 OVERLAY/traductor offline.js';
const TRANSLATOR_SOURCE_DIR='MLS R32 OVERLAY/translator';
const PACKS_SOURCE=path.join(TRANSLATOR_SOURCE_DIR,'packs.json');
const REGISTRY_SOURCE=path.join(TRANSLATOR_SOURCE_DIR,'registry.json');
const PAGE_PUBLIC='public/traductor.html';
const TRANSLATOR_PUBLIC_DIR='public/translator';
const HOME='public/index.html';
const WORKER='src/index.js';
const HOME_MARKER='data-nav="translator"';
const WORKER_MARKER='MLS_TRANSLATOR_ROUTE_V3';
const BACKEND_MARKER='MLS_TRANSLATOR_BACKEND_V1';
const MODEL_PROXY_MARKER='MLS_TRANSLATOR_MODEL_PROXY_V1';
const BACKEND_ANCHOR='var index_default = {';
const ROUTER_ANCHOR='    if (url.pathname.startsWith("/api/wiki/")) {';
const MODEL_ORIGIN='https://storage.googleapis.com/moz-fx-translations-data--303e-prod-translations-data/';

const LANGUAGE_NAMES={
  'espanol-guatemala':'Español',
  ingles:'Inglés',
  portugues:'Portugués brasileño',
  italiano:'Italiano',
  frances:'Francés',
  aleman:'Alemán',
  japones:'Japonés',
  'chino-taiwan':'Chino mandarín de Taiwán',
  coreano:'Coreano',
  ruso:'Ruso'
};

const BACKEND_BLOCK=[
  '// '+BACKEND_MARKER,
  'const MLS_TRANSLATOR_MODEL_ID = "@cf/google/gemma-4-26b-a4b-it";',
  'const MLS_TRANSLATOR_LANGUAGES = '+JSON.stringify(LANGUAGE_NAMES)+';',
  'function mlsTranslatorText(value, limit = 1200) {',
  '  return String(value || "").replace(/\\s+/g, " ").trim().slice(0, limit);',
  '}',
  'function mlsTranslatorModelText(result) {',
  '  if (typeof result === "string") return result.trim();',
  '  return String(result?.response ?? result?.result?.response ?? result?.choices?.[0]?.message?.content ?? "").trim();',
  '}',
  'function mlsTranslatorParseJson(text) {',
  '  const cleaned = String(text || "").trim().replace(/^\\`\\`\\`(?:json)?/i, "").replace(/\\`\\`\\`$/i, "").trim();',
  '  return JSON.parse(cleaned);',
  '}',
  'async function handleTranslatorRequest(request, env) {',
  '  if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: { allow: "POST" } });',
  '  try {',
  '    const contentType = request.headers.get("content-type") || "";',
  '    if (!contentType.toLowerCase().includes("application/json")) return Response.json({ ok: false, error: "Se requiere application/json." }, { status: 415 });',
  '    const body = await request.json();',
  '    const text = mlsTranslatorText(body?.text, 1200);',
  '    const sourceLanguage = mlsTranslatorText(body?.sourceLanguage, 80);',
  '    const targetLanguage = mlsTranslatorText(body?.targetLanguage, 80);',
  '    const sourceName = MLS_TRANSLATOR_LANGUAGES[sourceLanguage];',
  '    const targetName = MLS_TRANSLATOR_LANGUAGES[targetLanguage];',
  '    if (!text) return Response.json({ ok: false, error: "Escribe un texto para traducir." }, { status: 400 });',
  '    if (!sourceName || !targetName) return Response.json({ ok: false, error: "Idioma no válido." }, { status: 400 });',
  '    if (sourceLanguage === targetLanguage) return Response.json({ ok: true, usedAi: false, sameLanguage: true, sourceLanguage, targetLanguage, translation: text }, { headers: { "cache-control": "no-store" } });',
  '    if (!env.AI || typeof env.AI.run !== "function") return Response.json({ ok: false, aiUnavailable: true, error: "La traducción mejorada no está disponible en este momento." }, { status: 503, headers: { "cache-control": "no-store" } });',
  '    const system = [',
  '      "Eres el motor de traducción de MASTER LANGUAGE SYSTEM.",',
  '      "Traduce fielmente el texto del idioma de origen al idioma de destino.",',
  '      "Conserva significado, registro, nombres propios, números y puntuación cuando corresponda.",',
  '      "No expliques la traducción, no añadas notas y no inventes contenido.",',
  '      "Devuelve exclusivamente JSON válido con esta forma: {\\\"translation\\\":\\\"...\\\"}."',
  '    ].join("\\n");',
  '    const user = "Idioma de origen: " + sourceName + "\\nIdioma de destino: " + targetName + "\\nTexto:\\n" + text;',
  '    let parsed;',
  '    try {',
  '      const result = await env.AI.run(MLS_TRANSLATOR_MODEL_ID, {',
  '        messages: [{ role: "system", content: system }, { role: "user", content: user }],',
  '        max_completion_tokens: 900,',
  '        temperature: 0.05,',
  '        top_p: 0.9,',
  '        chat_template_kwargs: { enable_thinking: false },',
  '        stream: false',
  '      });',
  '      parsed = mlsTranslatorParseJson(mlsTranslatorModelText(result));',
  '    } catch (error) {',
  '      console.warn("MLS Translator AI unavailable:", error instanceof Error ? error.message : String(error));',
  '      return Response.json({ ok: false, aiUnavailable: true, error: "La traducción mejorada no está disponible temporalmente. La pronunciación local sigue disponible." }, { status: 503, headers: { "cache-control": "no-store", "retry-after": "60" } });',
  '    }',
  '    const translation = mlsTranslatorText(parsed?.translation, 2400);',
  '    if (!translation) return Response.json({ ok: false, error: "No fue posible obtener una traducción válida." }, { status: 502, headers: { "cache-control": "no-store" } });',
  '    return Response.json({ ok: true, usedAi: true, model: MLS_TRANSLATOR_MODEL_ID, sourceLanguage, targetLanguage, translation }, { headers: { "cache-control": "no-store", "x-content-type-options": "nosniff" } });',
  '  } catch (error) {',
  '    console.warn("MLS Translator request failed:", error instanceof Error ? error.message : String(error));',
  '    return Response.json({ ok: false, error: "No fue posible traducir en este momento." }, { status: 500, headers: { "cache-control": "no-store" } });',
  '  }',
  '}'
].join('\n');

function loadPacks(){
  if(!fs.existsSync(PACKS_SOURCE))throw new Error('Traductor: falta '+PACKS_SOURCE+'. Ejecuta el generador de paquetes.');
  const packs=JSON.parse(fs.readFileSync(PACKS_SOURCE,'utf8'));
  if(packs?.schemaVersion!==1||!packs?.packVersion||!packs?.languages)throw new Error('Traductor: manifest de paquetes inválido.');
  return packs;
}

function allowedModelPaths(packs){
  const set=new Set();
  for(const lang of Object.values(packs.languages||{})){
    for(const file of lang.files||[]){
      const value=String(file.upstreamPath||'').replace(/^\//,'');
      if(value&&!value.includes('..')&&value.startsWith('models/'))set.add(value);
    }
  }
  return [...set].sort();
}

function buildModelProxyBlock(packs){
  const allowed=allowedModelPaths(packs);
  if(!allowed.length)throw new Error('Traductor: no hay modelos permitidos en el manifest.');
  return [
    '// '+MODEL_PROXY_MARKER,
    'const MLS_TRANSLATION_MODEL_ORIGIN = '+JSON.stringify(MODEL_ORIGIN)+';',
    'const MLS_TRANSLATION_MODEL_PATHS = new Set('+JSON.stringify(allowed)+');',
    'async function handleTranslationModelAsset(request, url) {',
    '  if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });',
    '  let relative;',
    '  try { relative = decodeURIComponent(url.pathname.slice("/translation-models/".length)); } catch { return new Response("Bad request", { status: 400 }); }',
    '  if (!MLS_TRANSLATION_MODEL_PATHS.has(relative)) return new Response("Not found", { status: 404 });',
    '  const upstream = await fetch(MLS_TRANSLATION_MODEL_ORIGIN + relative, { method: request.method, redirect: "follow" });',
    '  if (!upstream.ok) return new Response("Model unavailable", { status: upstream.status >= 500 ? 503 : upstream.status });',
    '  const headers = new Headers();',
    '  headers.set("content-type", "application/gzip");',
    '  headers.set("cache-control", "public, max-age=604800, immutable");',
    '  headers.set("x-content-type-options", "nosniff");',
    '  headers.set("x-mls-language-tool", "translation-model");',
    '  const length = upstream.headers.get("content-length");',
    '  if (length) headers.set("content-length", length);',
    '  const etag = upstream.headers.get("etag");',
    '  if (etag) headers.set("etag", etag);',
    '  return new Response(request.method === "HEAD" ? null : upstream.body, { status: 200, headers });',
    '}'
  ].join('\n');
}

function patchHome(html){
  html=String(html||'');
  if(html.includes(HOME_MARKER))return html;
  const anchor='      <a href="#compare" data-nav="compare">⇄ Ver diferencias</a>';
  if(!html.includes(anchor))throw new Error('Traductor: no se encontró el menú Herramientas generado.');
  return html.replace(anchor,anchor+'\n      <a href="/traductor" data-nav="translator">Traductor</a>');
}

function patchWorker(source,packsArg){
  source=String(source||'');
  const packs=packsArg||loadPacks();
  if(!source.includes(BACKEND_MARKER)){
    if(!source.includes(BACKEND_ANCHOR))throw new Error('Traductor: no se encontró el ancla de backend Worker.');
    source=source.replace(BACKEND_ANCHOR,BACKEND_BLOCK+'\n\n'+BACKEND_ANCHOR);
  }
  if(!source.includes(MODEL_PROXY_MARKER)){
    if(!source.includes(BACKEND_ANCHOR))throw new Error('Traductor: no se encontró el ancla del proxy de modelos.');
    source=source.replace(BACKEND_ANCHOR,buildModelProxyBlock(packs)+'\n\n'+BACKEND_ANCHOR);
  }
  if(source.includes(WORKER_MARKER))return source;
  if(!source.includes(ROUTER_ANCHOR))throw new Error('Traductor: no se encontró el ancla del router Worker.');
  const block=[
    '    // '+WORKER_MARKER,
    '    if (url.pathname.startsWith("/translation-models/")) {',
    '      return handleTranslationModelAsset(request, url);',
    '    }',
    '    if (url.pathname === "/api/translate") {',
    '      return handleTranslatorRequest(request, env);',
    '    }',
    '    if (url.pathname === "/traductor" || url.pathname === "/traductor/") {',
    '      if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });',
    '      if (!env.ASSETS || typeof env.ASSETS.fetch !== "function") return new Response("Traductor no disponible.", { status: 503 });',
    '      const assetUrl = new URL("/traductor.html", request.url);',
    '      const assetRequest = new Request(assetUrl.toString(), request);',
    '      return env.ASSETS.fetch(assetRequest);',
    '    }',
    ROUTER_ANCHOR
  ].join('\n');
  return source.replace(ROUTER_ANCHOR,block);
}

function copyTranslatorAssets(packs){
  fs.mkdirSync(TRANSLATOR_PUBLIC_DIR,{recursive:true});
  fs.copyFileSync(OFFLINE_SOURCE,path.join(TRANSLATOR_PUBLIC_DIR,'offline.js'));
  fs.copyFileSync(PACKS_SOURCE,path.join(TRANSLATOR_PUBLIC_DIR,'packs.json'));
  fs.copyFileSync(REGISTRY_SOURCE,path.join(TRANSLATOR_PUBLIC_DIR,'registry.json'));

  const packageRoot=path.join(process.cwd(),'node_modules','@browsermt','bergamot-translator');
  for(const runtime of packs.runtime||[]){
    const rel=String(runtime.relativePath||'');
    if(!rel||rel.includes('..'))throw new Error('Traductor: runtime path inválido.');
    const source=path.join(packageRoot,rel);
    const destination=path.join(TRANSLATOR_PUBLIC_DIR,'bergamot',rel);
    if(!fs.existsSync(source))throw new Error('Traductor: falta runtime Bergamot '+rel);
    fs.mkdirSync(path.dirname(destination),{recursive:true});
    fs.copyFileSync(source,destination);
  }
}

function install(){
  for(const file of [PAGE_SOURCE,OFFLINE_SOURCE,PACKS_SOURCE,REGISTRY_SOURCE,HOME,WORKER])if(!fs.existsSync(file))throw new Error('Traductor: falta '+file);
  const page=fs.readFileSync(PAGE_SOURCE,'utf8');
  if(!page.includes('<title>Traductor · MASTER LANGUAGE SYSTEM</title>'))throw new Error('Traductor: página fuente inválida.');
  const packs=loadPacks();
  fs.mkdirSync(path.dirname(PAGE_PUBLIC),{recursive:true});
  fs.writeFileSync(PAGE_PUBLIC,page,'utf8');
  copyTranslatorAssets(packs);
  fs.writeFileSync(HOME,patchHome(fs.readFileSync(HOME,'utf8')),'utf8');
  fs.writeFileSync(WORKER,patchWorker(fs.readFileSync(WORKER,'utf8'),packs),'utf8');
}

function main(){install();console.log('MLS Traductor + Pronunciación T1–T6 + paquetes offline habilitado.');}

module.exports={
  PAGE_SOURCE,OFFLINE_SOURCE,PACKS_SOURCE,REGISTRY_SOURCE,PAGE_PUBLIC,TRANSLATOR_PUBLIC_DIR,
  HOME,WORKER,HOME_MARKER,WORKER_MARKER,BACKEND_MARKER,MODEL_PROXY_MARKER,MODEL_ORIGIN,
  LANGUAGE_NAMES,BACKEND_BLOCK,loadPacks,allowedModelPaths,buildModelProxyBlock,patchHome,patchWorker,copyTranslatorAssets,install
};
if(require.main===module)main();
