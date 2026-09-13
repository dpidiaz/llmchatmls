import fs from "node:fs";

const indexPath = "src/index.js";
const runnerPath = "public/runner.html";

function replaceOnce(source, oldText, newText, label) {
  if (source.includes(newText)) return source;
  const first = source.indexOf(oldText);
  if (first < 0) throw new Error(`No se encontró el bloque esperado para: ${label}`);
  if (source.indexOf(oldText, first + oldText.length) >= 0) {
    throw new Error(`El bloque para ${label} aparece más de una vez; se aborta para no parchear de forma ambigua.`);
  }
  return source.slice(0, first) + newText + source.slice(first + oldText.length);
}

let source = fs.readFileSync(indexPath, "utf8");

source = replaceOnce(
  source,
  `async function runWithFallback(env, seedCode, messages, maxTokens, temperature, excludeId, preferCheapCloudflare = false) {\n  let providers = await availableProviders(env, seedCode, excludeId);\n  if (preferCheapCloudflare && excludeId !== "cloudflare-auditor") {`,
  `async function runWithFallback(env, seedCode, messages, maxTokens, temperature, excludeId, preferCheapCloudflare = false, preferredProviderId = null) {\n  let providers = await availableProviders(env, seedCode, excludeId);\n  if (preferredProviderId) {\n    providers = providers.filter((provider) => provider.id === preferredProviderId);\n    if (!providers.length) {\n      throw new NoProviderAvailableError(\`El proveedor solicitado [0m\${preferredProviderId} no está configurado, está en cooldown o no tiene cuota disponible.\`, 900);\n    }\n  }\n  if (!preferredProviderId && preferCheapCloudflare && excludeId !== "cloudflare-auditor") {`,
  "preferencia explícita de proveedor"
);

source = replaceOnce(
  source,
  `async function generateWikiDraftR32(env, seed) {`,
  `async function generateWikiDraftR32(env, seed, preferredProviderId = null) {`,
  "firma de generateWikiDraftR32"
);

source = replaceOnce(
  source,
  `  return runWithFallback(env, seed.code, messages, maxTokens, 0.12);\n}\n__name(generateWikiDraftR32, "generateWikiDraftR32");`,
  `  return runWithFallback(env, seed.code, messages, maxTokens, 0.12, void 0, false, preferredProviderId);\n}\n__name(generateWikiDraftR32, "generateWikiDraftR32");`,
  "proveedor preferido en generación"
);

source = replaceOnce(
  source,
  `async function correctWikiDraftR32(env, seed, draft, decision, preferredExclude) {`,
  `async function correctWikiDraftR32(env, seed, draft, decision, preferredExclude, preferredProviderId = null) {`,
  "firma de correctWikiDraftR32"
);

source = replaceOnce(
  source,
  `  return runWithFallback(env, \`\${seed.code}-fix\`, messages, 3200, 0.05, preferredExclude);\n}\n__name(correctWikiDraftR32, "correctWikiDraftR32");`,
  `  return runWithFallback(env, \`\${seed.code}-fix\`, messages, 3200, 0.05, preferredExclude, false, preferredProviderId);\n}\n__name(correctWikiDraftR32, "correctWikiDraftR32");`,
  "proveedor preferido en corrección"
);

source = replaceOnce(
  source,
  `async function processWikiEntry(env, code, alreadyClaimed = false) {`,
  `async function processWikiEntry(env, code, alreadyClaimed = false, preferredProviderId = null) {`,
  "firma de processWikiEntry"
);

source = replaceOnce(
  source,
  `  const draft = await generateWikiDraftR32(env, seed);`,
  `  const draft = await generateWikiDraftR32(env, seed, preferredProviderId);`,
  "proveedor preferido del borrador"
);

source = replaceOnce(
  source,
  `    const corrected = await correctWikiDraftR32(env, seed, draft.text, audit.decision, audit.result?.provider);`,
  `    const corrected = await correctWikiDraftR32(env, seed, draft.text, audit.decision, audit.result?.provider, preferredProviderId);`,
  "proveedor preferido de corrección"
);

source = replaceOnce(
  source,
  `  const now = (/* @__PURE__ */ new Date()).toISOString();\n  await env.WIKI_DB.prepare(\`INSERT OR IGNORE INTO wiki_jobs`,
  `  const requestedProvider = (url.searchParams.get("provider") || "").trim().toLowerCase();\n  const preferredProviderId = requestedProvider === "gemini" ? "gemini" : null;\n  if (requestedProvider && !preferredProviderId) {\n    return Response.json({ error: "Proveedor editorial no permitido para esta ruta." }, {\n      status: 400,\n      headers: { "cache-control": "no-store" }\n    });\n  }\n  const now = (/* @__PURE__ */ new Date()).toISOString();\n  await env.WIKI_DB.prepare(\`INSERT OR IGNORE INTO wiki_jobs`,
  "lectura segura de provider=gemini"
);

source = replaceOnce(
  source,
  `    await processWikiEntry(env, job.code, true);`,
  `    await processWikiEntry(env, job.code, true, preferredProviderId);`,
  "propagación del proveedor desde materialize"
);

fs.writeFileSync(indexPath, source, "utf8");

let runner = fs.readFileSync(runnerPath, "utf8");
runner = runner.replace('value="Generador MLS actual"', 'value="Gemini exclusivo"');
runner = runner.replace(
  'const endpoint = `/api/wiki/materialize/${encodeURIComponent(code)}`;',
  'const endpoint = `/api/wiki/materialize/${encodeURIComponent(code)}?provider=gemini`;'
);
runner = runner.replace(
  "El proveedor real usado por cada artículo se muestra al terminar.",
  "El Runner solicita Gemini de forma explícita. Si Gemini no está disponible, se detiene en vez de consumir otro proveedor. El proveedor final queda visible al terminar."
);
fs.writeFileSync(runnerPath, runner, "utf8");

console.log("MLS Editorial Runner: Gemini exclusivo habilitado.");
