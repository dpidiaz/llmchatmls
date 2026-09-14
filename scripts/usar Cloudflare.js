const fs = require("fs");

const path = "src/index.js";
let code = fs.readFileSync(path, "utf8");

function replaceOnce(search, replacement, label) {
  if (!code.includes(search)) {
    throw new Error(`No se encontró el bloque esperado para ${label}.`);
  }
  code = code.replace(search, replacement);
}

const providersPattern = /async function availableProviders\(env, seedCode, excludeId\) \{[\s\S]*?\n\}\n__name\(availableProviders, "availableProviders"\);/;
if (!providersPattern.test(code)) {
  throw new Error("No se encontró availableProviders para activar Cloudflare exclusivamente.");
}
code = code.replace(
  providersPattern,
  `async function availableProviders(env, seedCode, excludeId) {\n  const budget = await wikiStore(env).getCloudflareBudget();\n  if (budget.quotaExhaustedDate === budget.dateUTC) {\n    throw new NoProviderAvailableError("Cloudflare agotó la cuota diaria real de Workers AI. Se restablecerá al comenzar el próximo día UTC.", secondsUntilNextUtcDay());\n  }\n  const candidates = [\n    { id: "cloudflare-gemma", kind: "cloudflare", model: MODEL_ID },\n    { id: "cloudflare-glm", kind: "cloudflare", model: "@cf/zai-org/glm-4.7-flash" },\n    { id: "cloudflare-llama", kind: "cloudflare", model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast" }\n  ];\n  const available = [];\n  for (const provider of candidates) {\n    if (provider.id === excludeId || await providerOnCooldown(env, provider.id)) continue;\n    available.push(provider);\n  }\n  return available;\n}\n__name(availableProviders, "availableProviders");`
);

replaceOnce(
  "const reservation = await wikiStore(env).reserveCloudflareBudget(estimate);",
  "const reservation = { ok: true, reserved: 0 };",
  "eliminar el bloqueo interno de presupuesto de materialización"
);

replaceOnce(
  'if (preferCheapCloudflare && excludeId !== "cloudflare-auditor") {',
  'if (false && preferCheapCloudflare && excludeId !== "cloudflare-auditor") {',
  "usar el mismo modelo del Profesor IA también para auditoría"
);

replaceOnce(
  '    externalProvidersConfigured: [...providers.map((p) => p.id), ...(env.xKiroRouter ? ["xkiro-dynamic-free-only"] : [])],\n    xKiroConfigured: Boolean(env.xKiroRouter),\n    xKiroPolicy: "dynamic access_tier=free only",\n    approvedExternalModels: Object.fromEntries(Object.entries(STRICT_ZERO_COST_EXTERNAL_MODELS).map(([id, models]) => [id, [...models]])),',
  '    externalProvidersConfigured: [],\n    xKiroConfigured: false,\n    xKiroPolicy: "disabled; materialization uses Cloudflare Workers AI only",\n    cloudflareOnly: true,\n    materializationModel: MODEL_ID,\n    materializationModels: [MODEL_ID, "@cf/zai-org/glm-4.7-flash", "@cf/meta/llama-3.3-70b-instruct-fp8-fast"],\n    regenerationMaxAttemptsPerModel: 3,\n    cloudflareMeteringNote: "dailyNeurons only measures successful MLS responses; Cloudflare error 3036 is authoritative for the account-wide free allocation",\n    approvedExternalModels: {},',
  "reflejar la política Cloudflare only en el estado"
);

fs.writeFileSync(path, code);
console.log("Materialización configurada con tres modelos de Cloudflare Workers AI y fallback automático.");
