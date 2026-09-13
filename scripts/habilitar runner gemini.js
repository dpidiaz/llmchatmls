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
  `async function runWithFallback(env, seedCode, messages, maxTokens, temperature, excludeId, preferCheapCloudflare = false, preferredProviderId = null) {\n  let providers = await availableProviders(env, seedCode, excludeId);\n  if (preferredProviderId) {\n    providers = providers.filter((provider) => provider.id === preferredProviderId);\n    if (!providers.length) {\n      throw new NoProviderAvailableError(\`El proveedor solicitado \${preferredProviderId} no está configurado, está en cooldown o no tiene cuota disponible.\`, 900);\n    }\n  }\n  if (!preferredProviderId && preferCheapCloudflare && excludeId !== "cloudflare-auditor") {`,
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
  `  const effectiveExclude = preferredProviderId && preferredExclude === preferredProviderId ? void 0 : preferredExclude;\n  return runWithFallback(env, \`\${seed.code}-fix\`, messages, 3200, 0.05, effectiveExclude, false, preferredProviderId);\n}\n__name(correctWikiDraftR32, "correctWikiDraftR32");`,
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
  `  const requestedProvider = (url.searchParams.get("provider") || "").trim().toLowerCase();\n  const preferredProviderId = requestedProvider === "gemini" ? "gemini" : requestedProvider === "cloudflare" ? "cloudflare" : null;\n  if (requestedProvider && !preferredProviderId) {\n    return Response.json({ error: "Proveedor editorial no permitido para esta ruta." }, {\n      status: 400,\n      headers: { "cache-control": "no-store" }\n    });\n  }\n  const now = (/* @__PURE__ */ new Date()).toISOString();\n  await env.WIKI_DB.prepare(\`INSERT OR IGNORE INTO wiki_jobs`,
  "lectura segura del proveedor solicitado"
);

source = replaceOnce(
  source,
  `    await processWikiEntry(env, job.code, true);`,
  `    await processWikiEntry(env, job.code, true, preferredProviderId);`,
  "propagación del proveedor desde materialize"
);

fs.writeFileSync(indexPath, source, "utf8");

let runner = fs.readFileSync(runnerPath, "utf8");
runner = runner.replace('value="Gemini exclusivo"', 'value="Proveedor automático"');
runner = runner.replace('value="Generador MLS actual"', 'value="Proveedor automático"');
runner = runner.replaceAll('?provider=gemini', '');
runner = runner.replace(
  "El Runner solicita Gemini de forma explícita. Si Gemini no está disponible, se detiene en vez de consumir otro proveedor. El proveedor final queda visible al terminar.",
  "El Runner usa automáticamente un proveedor disponible. Con la configuración actual utiliza Cloudflare Workers AI; el proveedor final queda visible al terminar."
);
runner = runner.replace(
  "El proveedor real usado por cada artículo se muestra al terminar.",
  "El Runner usa automáticamente un proveedor disponible. Con la configuración actual utiliza Cloudflare Workers AI; el proveedor final queda visible al terminar."
);

runner = replaceOnce(
  runner,
  `  let consecutiveErrors = 0;\n  let initialPending = 0;`,
  `  let consecutiveErrors = 0;\n  let initialPending = 0;\n  const skippedThisRun = new Set();`,
  "registro de entradas fallidas en la sesión"
);

runner = replaceOnce(
  runner,
  `  async function fetchPending(pageSize = 1) {\n    const qs = new URLSearchParams({\n      language: language.value,\n      status: "pending",\n      page: "1",\n      pageSize: String(pageSize)\n    });\n    const response = await fetch(\`/api/wiki/articles?\${qs}\`, { cache: "no-store", credentials: "same-origin" });\n    const data = await response.json();\n    if (!response.ok || !data.ok) throw new Error(data.error || \`No se pudo consultar la cola: HTTP \${response.status}\`);\n    remainingNode.textContent = String(data.total ?? 0);\n    return data;\n  }`,
  `  async function fetchQueueStatus(status, pageSize = 50) {\n    const qs = new URLSearchParams({\n      language: language.value,\n      status,\n      page: "1",\n      pageSize: String(pageSize)\n    });\n    const response = await fetch(\`/api/wiki/articles?\${qs}\`, { cache: "no-store", credentials: "same-origin" });\n    const data = await response.json();\n    if (!response.ok || !data.ok) throw new Error(data.error || \`No se pudo consultar la cola \${status}: HTTP \${response.status}\`);\n    return data;\n  }\n\n  async function fetchPending(pageSize = 1) {\n    const fetchSize = Math.max(50, Math.min(100, Number(pageSize) || 1));\n    const [queued, enqueued, pending] = await Promise.all([\n      fetchQueueStatus("queued", fetchSize),\n      fetchQueueStatus("enqueued", fetchSize),\n      fetchQueueStatus("pending", fetchSize)\n    ]);\n    const items = [];\n    const seen = new Set();\n    for (const item of [...(queued.items || []), ...(enqueued.items || []), ...(pending.items || [])]) {\n      if (!item?.code || seen.has(item.code) || skippedThisRun.has(item.code)) continue;\n      seen.add(item.code);\n      items.push(item);\n    }\n    const total = Number(queued.total || 0) + Number(enqueued.total || 0) + Number(pending.total || 0);\n    remainingNode.textContent = String(total);\n    return { ok: true, total, items: items.slice(0, Math.max(1, Number(pageSize) || 1)) };\n  }`,
  "recuperación de estados queued y enqueued"
);

runner = replaceOnce(
  runner,
  `    consecutiveErrors = 0;\n    current.textContent = "—";`,
  `    consecutiveErrors = 0;\n    skippedThisRun.clear();\n    current.textContent = "—";`,
  "reinicio de exclusiones por ejecución"
);

runner = replaceOnce(
  runner,
  `        const next = queue.items?.[0];\n        if (!next) {\n          log("No quedan entradas pendientes para el idioma seleccionado.");\n          setState("Cola completada", "");\n          break;\n        }`,
  `        const next = queue.items?.[0];\n        if (!next) {\n          if (Number(queue.total || 0) > 0 && skippedThisRun.size) {\n            log(\`Quedan \${queue.total} entradas registradas, pero las que fallaron en esta ejecución se aplazan para el próximo intento.\`);\n            setState("Reintentos aplazados", "paused");\n          } else {\n            log("No quedan entradas pendientes para el idioma seleccionado.");\n            setState("Cola completada", "");\n          }\n          break;\n        }`,
  "salida segura cuando solo quedan fallos aplazados"
);

runner = replaceOnce(
  runner,
  `          errors += 1;\n          consecutiveErrors += 1;\n          errorsNode.textContent = String(errors);`,
  `          errors += 1;\n          consecutiveErrors += 1;\n          skippedThisRun.add(next.code);\n          errorsNode.textContent = String(errors);`,
  "evitar reintentar inmediatamente la misma entrada fallida"
);

fs.writeFileSync(runnerPath, runner, "utf8");

console.log("MLS Editorial Runner: selección automática de proveedor y recuperación de queued/enqueued habilitadas.");
