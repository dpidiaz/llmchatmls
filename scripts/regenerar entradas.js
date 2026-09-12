const fs = require("fs");

function replaceOnce(text, search, replacement, label) {
  if (!text.includes(search)) throw new Error(`No se encontró el bloque esperado para ${label}.`);
  return text.replace(search, replacement);
}

// Backend
const backendPath = "src/index.js";
let backend = fs.readFileSync(backendPath, "utf8");

if (!backend.includes("/api/wiki/regenerate/")) {
  backend = replaceOnce(
    backend,
    "ON CONFLICT(code) DO NOTHING",
    "ON CONFLICT(code) DO UPDATE SET language = excluded.language, language_name = excluded.language_name, n = excluded.n, title = excluded.title, level = excluded.level, part = excluded.part, chapter = excluded.chapter, article_markdown = excluded.article_markdown, provider = excluded.provider, model = excluded.model, audit_provider = excluded.audit_provider, audit_model = excluded.audit_model, prompt_version = excluded.prompt_version, generated_at = excluded.generated_at",
    "permitir reemplazo atómico del artículo existente"
  );

  backend = replaceOnce(
    backend,
    "async function processWikiEntry(env, code, alreadyClaimed = false) {",
    "async function processWikiEntry(env, code, alreadyClaimed = false, force = false) {",
    "activar modo force en processWikiEntry"
  );

  backend = replaceOnce(
    backend,
    "  if (await articleExists(env, code)) {",
    "  if (!force && await articleExists(env, code)) {",
    "saltar artículo existente solo en generación normal"
  );

  backend = replaceOnce(
    backend,
    "  if (legacy?.articleMarkdown) {",
    "  if (!force && legacy?.articleMarkdown) {",
    "evitar restaurar legacy durante regeneración"
  );

  const handleMarker = "async function handleWikiApi(request, env, url) {\n  await ensureWikiDb(env);";
  const route = `async function handleWikiApi(request, env, url) {\n  await ensureWikiDb(env);\n  const regenerateMatch = url.pathname.match(/^\\/api\\/wiki\\/regenerate\\/(MLS-V\\d{2}-\\d{4})$/i);\n  if (regenerateMatch) {\n    if (request.method !== \"POST\") {\n      return new Response(\"Method not allowed\", { status: 405, headers: { allow: \"POST\" } });\n    }\n    const code = regenerateMatch[1].toUpperCase();\n    const existing = await getWikiArticleD1(env, code);\n    if (!existing) {\n      return Response.json({ error: \"La entrada todavía no tiene una versión permanente para regenerar.\" }, { status: 404, headers: { \"cache-control\": \"no-store\" } });\n    }\n    try {\n      await processWikiEntry(env, code, false, true);\n      const article = await getWikiArticleD1(env, code);\n      return Response.json({ ok: true, regenerated: true, article }, { headers: { \"cache-control\": \"no-store\" } });\n    } catch (error) {\n      console.error(\"Manual regeneration failed\", code, error);\n      return Response.json({ error: error?.message || \"No fue posible regenerar la entrada.\", preserved: true }, { status: 503, headers: { \"cache-control\": \"no-store\" } });\n    }\n  }`;
  backend = replaceOnce(backend, handleMarker, route, "ruta manual de regeneración");
}

fs.writeFileSync(backendPath, backend);

// Frontend
const readerPath = "public/js/reader.js";
let reader = fs.readFileSync(readerPath, "utf8");

if (!reader.includes("regenerateBtn")) {
  reader = replaceOnce(
    reader,
    "    if(advanced)advanced.hidden=true;\n    setStatus(e.code,'ready','Contenido permanente · generado una sola vez · '+String(article.generatedAt||'').slice(0,10));",
    "    if(advanced)advanced.hidden=true;\n    const regenerateBtn=document.getElementById('regenerateBtn');if(regenerateBtn)regenerateBtn.hidden=false;\n    setStatus(e.code,'ready','Contenido permanente · generado una sola vez · '+String(article.generatedAt||'').slice(0,10));",
    "mostrar el botón solo cuando existe contenido permanente"
  );

  reader = replaceOnce(
    reader,
    "  async function materializeOnVisit(e,onReady){",
    "  async function requestRegeneration(code){\n    return fetch('/api/wiki/regenerate/'+encodeURIComponent(code),{method:'POST',cache:'no-store',headers:{accept:'application/json','cache-control':'no-store'}});\n  }\n  async function materializeOnVisit(e,onReady){",
    "cliente de regeneración"
  );

  reader = replaceOnce(
    reader,
    "<button class=\"btn\" id=\"favBtn\">${fav?'★ Guardado':'☆ Guardar'}</button>",
    "<button class=\"btn\" id=\"favBtn\">${fav?'★ Guardado':'☆ Guardar'}</button><button class=\"btn\" id=\"regenerateBtn\" hidden>♻ Regenerar esta entrada con IA</button>",
    "botón manual de regeneración"
  );

  reader = replaceOnce(
    reader,
    "    document.getElementById('favBtn').onclick=()=>{if(MLS.state.favorites.includes(code))MLS.state.favorites=MLS.state.favorites.filter(x=>x!==code);else MLS.state.favorites.push(code);MLS.save();page(code)};",
    "    document.getElementById('favBtn').onclick=()=>{if(MLS.state.favorites.includes(code))MLS.state.favorites=MLS.state.favorites.filter(x=>x!==code);else MLS.state.favorites.push(code);MLS.save();page(code)};\n    document.getElementById('regenerateBtn').onclick=async()=>{\n      const button=document.getElementById('regenerateBtn');\n      if(!button||!currentEntryIs(code))return;\n      if(!confirm('¿Regenerar esta entrada con IA? La versión actual se conservará si la nueva generación falla.'))return;\n      const oldText=button.textContent;button.disabled=true;button.textContent='Regenerando…';setStatus(code,'working','Regenerando esta entrada con IA…');\n      try{\n        const response=await requestRegeneration(code);const data=await response.json().catch(()=>({}));\n        if(!currentEntryIs(code))return;\n        if(response.ok&&data.article){activeTutorEntry=installPermanentArticle(data.article,e);setStatus(code,'ready','Contenido permanente · regenerado manualmente · '+String(data.article.generatedAt||'').slice(0,10));return}\n        setStatus(code,'unavailable',data.error||'No fue posible regenerar la entrada; se conserva la versión anterior.');\n      }catch(error){\n        setStatus(code,'unavailable','No fue posible regenerar la entrada; se conserva la versión anterior.');console.warn('MASTER LANGUAGE SYSTEM: regeneración manual falló para '+code,error);\n      }finally{if(button){button.disabled=false;button.textContent=oldText}}\n    };",
    "acción del botón manual"
  );
}

fs.writeFileSync(readerPath, reader);
console.log("Regeneración manual segura habilitada.");
