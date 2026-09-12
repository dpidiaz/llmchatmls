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
  `async function availableProviders(env, seedCode, excludeId) {\n  if (excludeId === "cloudflare") return [];\n  return [{ id: "cloudflare", kind: "cloudflare", model: MODEL_ID }];\n}\n__name(availableProviders, "availableProviders");`
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
  '      await wikiStore(env).markQuotaExhausted("revision-32", message);\n      throw new NoProviderAvailableError("Cloudflare agot\\xF3 su cuota diaria real.", secondsUntilNextUtcDay());',
  '      throw new NoProviderAvailableError("Cloudflare Workers AI no está disponible temporalmente; se reintentará en una próxima visita.", 300);',
  "evitar que un error temporal bloquee el resto del día"
);

replaceOnce(
  '    externalProvidersConfigured: [...providers.map((p) => p.id), ...(env.xKiroRouter ? ["xkiro-dynamic-free-only"] : [])],\n    xKiroConfigured: Boolean(env.xKiroRouter),\n    xKiroPolicy: "dynamic access_tier=free only",\n    approvedExternalModels: Object.fromEntries(Object.entries(STRICT_ZERO_COST_EXTERNAL_MODELS).map(([id, models]) => [id, [...models]])),',
  '    externalProvidersConfigured: [],\n    xKiroConfigured: false,\n    xKiroPolicy: "disabled; materialization uses Cloudflare Workers AI only",\n    cloudflareOnly: true,\n    materializationModel: MODEL_ID,\n    approvedExternalModels: {},',
  "reflejar la política Cloudflare only en el estado"
);

fs.writeFileSync(path, code);
console.log("Materialización configurada para usar exclusivamente Cloudflare Workers AI con MODEL_ID.");
