'use strict';
const fs=require('node:fs');
const path=require('node:path');

const TARGET='src/index.js';
const PAGE_SOURCE='MLS R32 OVERLAY/virtuoso.html';
const PAGE_PUBLIC='public/virtuoso.html';
const HOME='public/index.html';
const MARKER='// MLS VIRTUOSO V1 1.0';
const API_MARKER='// MLS VIRTUOSO API V1 1.0';
const ROUTER_ANCHOR='    if (url.pathname.startsWith("/api/wiki/")) {\n      return handleWikiApi(request, env, url);\n    }';
const CODE_ANCHOR='var index_default = {';
const BACKEND_BLOCK="const VIRTUOSO_MODEL_ID = \"@cf/google/gemma-4-26b-a4b-it\";\nconst VIRTUOSO_MAX_CANDIDATES = 12;\nconst VIRTUOSO_MAX_RECOMMENDATIONS = 5;\nfunction virtuosoText(value, max = 800) {\n  return String(value || \"\").replace(/\\\\s+/g, \" \").trim().slice(0, max);\n}\nfunction virtuosoModelText(result) {\n  if (typeof result === \"string\") return result;\n  if (typeof result?.response === \"string\") return result.response;\n  if (typeof result?.result?.response === \"string\") return result.result.response;\n  if (typeof result?.choices?.[0]?.message?.content === \"string\") return result.choices[0].message.content;\n  return \"\";\n}\nfunction virtuosoParseJson(text) {\n  let value = String(text || \"\").trim();\n  value = value.replace(/^```(?:json)?\\\\s*/i, \"\").replace(/\\\\s*```$/i, \"\");\n  const start = value.indexOf(\"{\");\n  const end = value.lastIndexOf(\"}\");\n  if (start < 0 || end <= start) throw new Error(\"Virtuoso no devolvió JSON.\");\n  return JSON.parse(value.slice(start, end + 1));\n}\nasync function virtuosoCanonicalCandidates(env, targetLanguage, candidates) {\n  const language = WIKI_LANGUAGE_ORDER.find((item) => item.slug === targetLanguage);\n  if (!language) throw new Error(\"Idioma objetivo inválido.\");\n  const assetPath = \"/data/canonical/catalog/\" + encodeURIComponent(targetLanguage) + \".json\";\n  const response = await env.ASSETS.fetch(new Request(\"https://mls-assets.local\" + assetPath));\n  if (!response.ok) throw new Error(\"Catálogo canónico no disponible.\");\n  const catalog = await response.json();\n  if (catalog?.standard !== \"MLS R32\" || catalog?.promptVersion !== WIKI_PROMPT_VERSION || catalog?.language !== targetLanguage || !Array.isArray(catalog.entries)) throw new Error(\"Catálogo canónico inválido.\");\n  const byCode = new Map(catalog.entries.map((entry) => [String(entry.code || \"\").toUpperCase(), entry]));\n  const seen = new Set();\n  const validated = [];\n  for (const raw of Array.isArray(candidates) ? candidates.slice(0, VIRTUOSO_MAX_CANDIDATES) : []) {\n    const code = String(raw?.code || \"\").trim().toUpperCase();\n    if (!code.startsWith(language.prefix + \"-\") || seen.has(code)) continue;\n    const entry = byCode.get(code);\n    if (!entry) continue;\n    seen.add(code);\n    validated.push({\n      code,\n      title: virtuosoText(entry.title, 300),\n      level: virtuosoText(entry.level, 40),\n      part: virtuosoText(entry.part, 240),\n      chapter: virtuosoText(entry.chapter, 240),\n      section: virtuosoText(raw?.section, 220),\n      lexicalScore: Number.isFinite(Number(raw?.lexicalScore)) ? Number(raw.lexicalScore) : null,\n      semanticScore: Number.isFinite(Number(raw?.semanticScore)) ? Number(raw.semanticScore) : null\n    });\n  }\n  return { language, validated };\n}\nfunction virtuosoFallback(query, validated, message = \"Estas entradas son las coincidencias más relevantes encontradas en la biblioteca.\") {\n  const chosen = validated.slice(0, Math.min(VIRTUOSO_MAX_RECOMMENDATIONS, Math.max(1, validated.length)));\n  return {\n    ok: true,\n    usedAi: false,\n    degraded: true,\n    intent: \"Orientación en la biblioteca\",\n    intro: message,\n    query: virtuosoText(query, 600),\n    recommendations: chosen.map((entry, index) => ({\n      order: index + 1,\n      code: entry.code,\n      title: entry.title,\n      level: entry.level,\n      part: entry.part,\n      chapter: entry.chapter,\n      section: entry.section,\n      reason: \"Coincide con tu consulta dentro del corpus canónico de MLS.\",\n      deepLink: \"/#entry=\" + entry.code\n    }))\n  };\n}\nasync function handleVirtuosoRequest(request, env) {\n  if (request.method !== \"POST\") return new Response(\"Method not allowed\", { status: 405, headers: { allow: \"POST\" } });\n  try {\n    const contentType = request.headers.get(\"content-type\") || \"\";\n    if (!contentType.toLowerCase().includes(\"application/json\")) return Response.json({ error: \"Se requiere application/json.\" }, { status: 415 });\n    const body = await request.json();\n    const query = virtuosoText(body?.query, 600);\n    const targetLanguage = virtuosoText(body?.targetLanguage, 80);\n    if (query.length < 2) return Response.json({ error: \"Consulta demasiado corta.\" }, { status: 400 });\n    const { language, validated } = await virtuosoCanonicalCandidates(env, targetLanguage, body?.candidates);\n    if (!validated.length) return Response.json({ error: \"No se recibieron candidatos canónicos válidos.\" }, { status: 400 });\n    const candidateText = validated.map((entry, index) => [\n      String(index + 1) + \". \" + entry.code + \" — \" + entry.title,\n      \"Nivel: \" + (entry.level || \"sin nivel\"),\n      \"Parte: \" + (entry.part || \"\"),\n      \"Capítulo: \" + (entry.chapter || \"\"),\n      entry.section ? \"Sección coincidente: \" + entry.section : \"\"\n    ].filter(Boolean).join(\" | \")).join(\"\\\\n\");\n    const system = [\n      \"Eres Virtuoso, el bibliotecario de MASTER LANGUAGE SYSTEM.\",\n      \"Tu función es orientar dentro de la biblioteca, no enseñar el tema ni sustituir al Profesor IA.\",\n      \"Solo puedes recomendar códigos de la lista CANÓNICA proporcionada.\",\n      \"No inventes códigos, títulos, niveles, capítulos, enlaces ni prerrequisitos.\",\n      \"Selecciona entre 1 y 5 entradas y ordénalas por utilidad para la intención del usuario.\",\n      \"Responde exclusivamente con JSON válido, sin Markdown, usando esta forma:\",\n      \"{\\\\\\\"intent\\\\\\\":\\\\\\\"...\\\\\\\",\\\\\\\"intro\\\\\\\":\\\\\\\"...\\\\\\\",\\\\\\\"recommendations\\\\\\\":[{\\\\\\\"code\\\\\\\":\\\\\\\"MLS-V00-0000\\\\\\\",\\\\\\\"reason\\\\\\\":\\\\\\\"...\\\\\\\"}]}\"\n    ].join(\"\\\\n\");\n    const user = \"Idioma objetivo: \" + language.name + \" (\" + language.slug + \")\\\\nConsulta: \" + query + \"\\\\n\\\\nCANDIDATOS CANÓNICOS:\\\\n\" + candidateText;\n    let parsed;\n    try {\n      const result = await env.AI.run(VIRTUOSO_MODEL_ID, {\n        messages: [{ role: \"system\", content: system }, { role: \"user\", content: user }],\n        max_completion_tokens: 1200,\n        temperature: 0.1,\n        top_p: 0.85,\n        chat_template_kwargs: { enable_thinking: false },\n        stream: false\n      });\n      parsed = virtuosoParseJson(virtuosoModelText(result));\n    } catch (error) {\n      console.warn(\"Virtuoso Gemma fallback:\", error);\n      return Response.json(virtuosoFallback(query, validated, \"Virtuoso no pudo razonar sobre la ruta en este momento; se muestran los mejores resultados híbridos disponibles.\"), { headers: { \"cache-control\": \"no-store\" } });\n    }\n    const allowed = new Map(validated.map((entry) => [entry.code, entry]));\n    const used = new Set();\n    const recommendations = [];\n    for (const raw of Array.isArray(parsed?.recommendations) ? parsed.recommendations : []) {\n      if (recommendations.length >= VIRTUOSO_MAX_RECOMMENDATIONS) break;\n      const code = String(raw?.code || \"\").trim().toUpperCase();\n      const entry = allowed.get(code);\n      if (!entry || used.has(code)) continue;\n      used.add(code);\n      recommendations.push({\n        order: recommendations.length + 1,\n        code: entry.code,\n        title: entry.title,\n        level: entry.level,\n        part: entry.part,\n        chapter: entry.chapter,\n        section: entry.section,\n        reason: virtuosoText(raw?.reason, 600) || \"Entrada relevante para tu objetivo.\",\n        deepLink: \"/#entry=\" + entry.code\n      });\n    }\n    if (!recommendations.length) return Response.json(virtuosoFallback(query, validated), { headers: { \"cache-control\": \"no-store\" } });\n    return Response.json({\n      ok: true,\n      usedAi: true,\n      degraded: false,\n      model: VIRTUOSO_MODEL_ID,\n      targetLanguage: language.slug,\n      intent: virtuosoText(parsed?.intent, 300) || \"Orientación en la biblioteca\",\n      intro: virtuosoText(parsed?.intro, 700) || \"Estas entradas forman una ruta breve para tu consulta.\",\n      recommendations\n    }, { headers: { \"cache-control\": \"no-store\", \"x-content-type-options\": \"nosniff\" } });\n  } catch (error) {\n    console.error(\"Virtuoso error:\", error);\n    return Response.json({ error: \"No fue posible consultar Virtuoso.\" }, { status: 500, headers: { \"cache-control\": \"no-store\" } });\n  }\n}";

function patchWorker(source,html){
  source=String(source);html=String(html||'');
  if(source.includes(API_MARKER))return source;
  if(!source.includes(CODE_ANCHOR))throw new Error('No se encontró ancla de código para Virtuoso.');
  if(!source.includes(ROUTER_ANCHOR))throw new Error('No se encontró router wiki para Virtuoso.');
  if(!html.includes('<title>Virtuoso · Bibliotecario de MASTER LANGUAGE SYSTEM</title>'))throw new Error('Página Virtuoso inválida.');
  source=source.replace(CODE_ANCHOR,API_MARKER+'\n'+BACKEND_BLOCK+'\n'+CODE_ANCHOR);
  const payload=JSON.stringify(html);
  const routes=[
    '    '+MARKER,
    '    if (url.pathname === "/api/virtuoso") {',
    '      return handleVirtuosoRequest(request, env);',
    '    }',
    '    if (url.pathname === "/virtuoso" || url.pathname === "/virtuoso/" || url.pathname === "/virtuoso.html") {',
    '      if (request.method !== "GET" && request.method !== "HEAD") return new Response("Method not allowed", { status: 405, headers: { allow: "GET, HEAD" } });',
    '      return new Response(request.method === "HEAD" ? null : '+payload+', { status: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache, no-store", "x-content-type-options": "nosniff" } });',
    '    }',
    ROUTER_ANCHOR
  ].join('\n');
  return source.replace(ROUTER_ANCHOR,routes);
}

function patchNavigation(html){
  html=String(html);
  if(html.includes('href="/virtuoso"')||html.includes("href='/virtuoso'"))return html;
  const match=html.match(/<a\b[^>]*href=(["'])#search[^"']*\1[^>]*>[\s\S]*?<\/a>/i);
  if(!match)throw new Error('No se encontró enlace #search en la navegación principal.');
  const classMatch=match[0].match(/\sclass=(["'])(.*?)\1/i);
  const classAttr=classMatch?' class="'+classMatch[2].replace(/"/g,'&quot;')+'"':'';
  const link='<a'+classAttr+' href="/virtuoso" aria-label="Abrir Virtuoso, bibliotecario de MLS">Virtuoso</a>';
  return html.replace(match[0],match[0]+link);
}

function install(){
  if(!fs.existsSync(PAGE_SOURCE))throw new Error('No existe la página Virtuoso.');
  if(!fs.existsSync(TARGET)||!fs.existsSync(HOME))throw new Error('El build R32 no contiene Worker/home para Virtuoso.');
  const html=fs.readFileSync(PAGE_SOURCE,'utf8');
  fs.mkdirSync(path.dirname(PAGE_PUBLIC),{recursive:true});
  fs.writeFileSync(PAGE_PUBLIC,html,'utf8');
  fs.writeFileSync(TARGET,patchWorker(fs.readFileSync(TARGET,'utf8'),html),'utf8');
  fs.writeFileSync(HOME,patchNavigation(fs.readFileSync(HOME,'utf8')),'utf8');
}

function main(){install();console.log('Virtuoso V1 habilitado.');}
module.exports={MARKER,API_MARKER,BACKEND_BLOCK,patchWorker,patchNavigation,install};
if(require.main===module)main();
