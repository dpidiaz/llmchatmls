const fs = require("fs");

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

let runner = fs.readFileSync(runnerPath, "utf8");

// MLS Farm owns the runner's queue selection.  The legacy patch below targets
// the pre-Farm markup and must not try to overwrite its normal/deferred modes.
if (runner.includes('id="mode"')) {
  console.log("MLS Editorial Runner Farm detectado; se conserva su flujo FREE ONLY.");
  process.exit(0);
}

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
console.log("MLS Editorial Runner: proveedor automático y recuperación de queued/enqueued habilitados sin modificar el backend.");
