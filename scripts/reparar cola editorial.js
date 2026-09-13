const fs = require("fs");

const backendPath = "src/index.js";
let source = fs.readFileSync(backendPath, "utf8");

const oldBlock = `    FROM wiki_jobs\n    WHERE status <> 'published'\n      AND NOT EXISTS (SELECT 1 FROM wiki_articles WHERE wiki_articles.code = wiki_jobs.code)\n    ORDER BY \${WIKI_FIFO_ORDER_SQL}\n    LIMIT ?\`).bind(limit).all();`;

const newBlock = `    FROM wiki_jobs\n    WHERE status IN ('pending', 'enqueued', 'queued')\n      AND NOT EXISTS (SELECT 1 FROM wiki_articles WHERE wiki_articles.code = wiki_jobs.code)\n    ORDER BY CASE WHEN status = 'queued' THEN 1 ELSE 0 END, \${WIKI_FIFO_ORDER_SQL}\n    LIMIT ?\`).bind(limit).all();`;

if (source.includes(oldBlock)) {
  source = source.replace(oldBlock, newBlock);
} else if (!source.includes(newBlock)) {
  throw new Error("No se encontró el bloque de selección editorial esperado.");
}

fs.writeFileSync(backendPath, source, "utf8");
console.log("Cola editorial reparada: los trabajos queued ya no bloquean el FIFO sano.");
