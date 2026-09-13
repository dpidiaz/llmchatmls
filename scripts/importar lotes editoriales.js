'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const CONTRACT_PATH = path.resolve('MLS R32 EDITORIAL', 'contrato editorial.js');
const BATCH_DIR = path.resolve('MLS R32 EDITORIAL', 'lotes');
const DB_BINDING = process.env.MLS_WIKI_DB_BINDING || 'WIKI_DB';
const contract = require(CONTRACT_PATH);

const LANGUAGES = Object.freeze({
  'espanol-guatemala': { prefix: 'MLS-V10', total: 930 },
  ingles: { prefix: 'MLS-V01', total: 766 },
  portugues: { prefix: 'MLS-V02', total: 1199 },
  italiano: { prefix: 'MLS-V03', total: 810 },
  frances: { prefix: 'MLS-V04', total: 1159 },
  aleman: { prefix: 'MLS-V05', total: 1101 },
  japones: { prefix: 'MLS-V06', total: 1027 },
  'chino-taiwan': { prefix: 'MLS-V07', total: 1016 },
  coreano: { prefix: 'MLS-V08', total: 1094 },
  ruso: { prefix: 'MLS-V09', total: 1031 }
});

function fail(message) {
  throw new Error(message);
}

function sqlText(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/\u0000/g, '').replace(/'/g, "''")}'`;
}

function countWords(text) {
  const clean = String(text || '').trim();
  return clean ? clean.split(/\s+/u).length : 0;
}

function countFourthLevelHeadings(text) {
  return (String(text || '').match(/^####\s+.+$/gmu) || []).length;
}

function verifyCanonicalRuntime() {
  const runtimePath = path.resolve(contract.canonicalRuntime);
  if (!fs.existsSync(runtimePath)) fail(`Falta el runtime canónico R32: ${runtimePath}.`);
  const runtime = fs.readFileSync(runtimePath, 'utf8');
  const versionPattern = new RegExp(`WIKI_PROMPT_VERSION\\s*=\\s*[\"']${contract.promptVersion.replace('.', '\\.')}[\"']`);
  if (!versionPattern.test(runtime)) {
    fail(`El runtime ya no usa promptVersion ${contract.promptVersion}; se bloquea la importación para evitar deriva editorial.`);
  }
  for (const [label, symbol] of Object.entries(contract.canonicalSymbols || {})) {
    if (!runtime.includes(symbol)) fail(`El runtime R32 ya no contiene ${label}: ${symbol}.`);
  }
}

function assertSafeBatchId(value, fileName) {
  const id = String(value || '').trim();
  if (!id) fail(`${fileName}: falta batch.id.`);
  if (!/^[\p{L}\p{N} .()]+$/u.test(id)) fail(`${fileName}: batch.id contiene caracteres no permitidos.`);
  return id;
}

function validateCalibration(batch, fileName) {
  if (!contract.calibrationRequiredForExternalBatches) {
    return { mode: 'not-required', referenceCodes: [], profile: null };
  }

  const calibration = batch.calibration;
  if (!calibration || typeof calibration !== 'object' || Array.isArray(calibration)) {
    fail(`${fileName}: falta calibration; todo lote externo debe calibrarse contra entradas ya publicadas.`);
  }
  if (calibration.mode !== 'published-corpus') {
    fail(`${fileName}: calibration.mode debe ser published-corpus.`);
  }

  const referenceCodes = Array.isArray(calibration.referenceCodes)
    ? [...new Set(calibration.referenceCodes.map(value => String(value || '').trim().toUpperCase()).filter(Boolean))]
    : [];
  if (referenceCodes.length === 0) {
    fail(`${fileName}: calibration.referenceCodes debe incluir al menos una entrada publicada usada como referencia.`);
  }
  for (const code of referenceCodes) {
    if (!/^MLS-V\d{2}-\d{4}$/.test(code)) fail(`${fileName}: código de referencia inválido: ${code}.`);
  }

  const profile = calibration.profile && typeof calibration.profile === 'object' && !Array.isArray(calibration.profile)
    ? calibration.profile
    : null;
  if (!profile || !profile.available || Number(profile.sampleSize || 0) < 1) {
    fail(`${fileName}: calibration.profile debe provenir del endpoint editorial de contexto y contener una muestra publicada.`);
  }

  return {
    mode: 'published-corpus',
    referenceCodes,
    profile
  };
}

function validateArticle(article, index, fileName, calibration) {
  const label = `${fileName} artículo ${index + 1}`;
  if (!article || typeof article !== 'object' || Array.isArray(article)) fail(`${label}: formato inválido.`);

  const code = String(article.code || '').toUpperCase();
  const language = String(article.language || '');
  const info = LANGUAGES[language];
  if (!info) fail(`${label}: idioma no reconocido: ${language || '(vacío)'}.`);
  if (!/^MLS-V\d{2}-\d{4}$/.test(code)) fail(`${label}: código inválido: ${code || '(vacío)'}.`);
  if (!code.startsWith(`${info.prefix}-`)) fail(`${label}: el código no corresponde al idioma ${language}.`);

  const n = Number(article.n);
  const codeN = Number(code.slice(-4));
  if (!Number.isInteger(n) || n < 1 || n > info.total) fail(`${label}: n fuera de rango.`);
  if (n !== codeN) fail(`${label}: n no coincide con el código.`);

  for (const field of ['languageName', 'title', 'level', 'part', 'chapter']) {
    if (!String(article[field] || '').trim()) fail(`${label}: falta ${field}.`);
  }

  const markdown = String(article.articleMarkdown || '').trim();
  if (!markdown) fail(`${label}: falta articleMarkdown.`);
  const words = countWords(markdown);
  if (words < contract.minimumWords) {
    fail(`${label}: tiene menos de ${contract.minimumWords} palabras.`);
  }
  if (contract.requiresFourthLevelHeading && !markdown.includes('####')) {
    fail(`${label}: faltan encabezados de cuarto nivel (####), igual que exige R32.`);
  }
  if (/\b(examen|quiz|ejercicio|tarea|flashcards|gamificaci[oó]n)\b/iu.test(markdown) && /(?:responde|completa|practica|elige|contesta|actividad)/iu.test(markdown)) {
    fail(`${label}: parece convertir la entrada en actividad o curso, contrario al estándar R32.`);
  }

  const profile = calibration?.profile;
  if (profile?.words && Number(profile.sampleSize || 0) > 0) {
    const referenceMin = Number(profile.words.min || 0);
    const referenceMax = Number(profile.words.max || 0);
    if (referenceMin > 0 && referenceMax > 0) {
      const lower = Math.max(contract.minimumWords, Math.floor(referenceMin * 0.5));
      const upper = Math.max(lower + 1, Math.ceil(referenceMax * 1.8));
      if (words < lower || words > upper) {
        fail(`${label}: extensión ${words} palabras fuera del margen de coherencia del corpus publicado (${lower}–${upper}).`);
      }
    }
  }

  if (profile?.headings && Number(profile.sampleSize || 0) > 0) {
    const headingCount = countFourthLevelHeadings(markdown);
    const referenceMax = Number(profile.headings.max || 0);
    if (referenceMax > 0 && headingCount > referenceMax + 4) {
      fail(`${label}: contiene ${headingCount} secciones ####; se aleja demasiado de la estructura publicada.`);
    }
  }

  return {
    code,
    language,
    languageName: String(article.languageName).trim(),
    n,
    title: String(article.title).trim(),
    level: String(article.level).trim(),
    part: String(article.part).trim(),
    chapter: String(article.chapter).trim(),
    articleMarkdown: markdown
  };
}

function loadBatch(filePath) {
  const fileName = path.basename(filePath);
  let batch;
  try {
    batch = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`${fileName}: JSON inválido: ${error.message}`);
  }

  if (batch.standard !== contract.standardId) fail(`${fileName}: standard debe ser ${contract.standardId}.`);
  if (batch.promptVersion !== contract.promptVersion) fail(`${fileName}: promptVersion debe ser ${contract.promptVersion}.`);
  const id = assertSafeBatchId(batch.id, fileName);
  if (!Array.isArray(batch.articles) || batch.articles.length === 0) fail(`${fileName}: no contiene artículos.`);

  const calibration = validateCalibration(batch, fileName);
  const articles = batch.articles.map((article, index) => validateArticle(article, index, fileName, calibration));
  const codes = new Set();
  for (const article of articles) {
    if (codes.has(article.code)) fail(`${fileName}: código duplicado ${article.code}.`);
    codes.add(article.code);
  }

  return {
    id,
    standard: batch.standard,
    promptVersion: batch.promptVersion,
    generator: String(batch.generator || 'chatgpt').trim() || 'chatgpt',
    generatorModel: String(batch.generatorModel || 'unspecified').trim() || 'unspecified',
    generatedAt: String(batch.generatedAt || new Date().toISOString()),
    calibration,
    articles
  };
}

function buildSql(batch) {
  const batchGuard = `NOT EXISTS (SELECT 1 FROM wiki_editorial_batches WHERE batch_id = ${sqlText(batch.id)})`;
  const now = new Date().toISOString();
  const lines = [
    `CREATE TABLE IF NOT EXISTS wiki_editorial_batches (\n      batch_id TEXT PRIMARY KEY,\n      standard TEXT NOT NULL,\n      prompt_version TEXT NOT NULL,\n      generator TEXT NOT NULL,\n      generator_model TEXT NOT NULL,\n      article_count INTEGER NOT NULL,\n      generated_at TEXT NOT NULL,\n      imported_at TEXT NOT NULL\n    );`,
    `CREATE TABLE IF NOT EXISTS wiki_editorial_calibration (\n      batch_id TEXT PRIMARY KEY,\n      mode TEXT NOT NULL,\n      reference_codes TEXT NOT NULL,\n      profile_json TEXT NOT NULL,\n      FOREIGN KEY(batch_id) REFERENCES wiki_editorial_batches(batch_id)\n    );`,
    'BEGIN TRANSACTION;'
  ];

  for (const article of batch.articles) {
    lines.push(`INSERT INTO wiki_articles(\n      code, language, language_name, n, title, level, part, chapter, article_markdown,\n      provider, model, audit_provider, audit_model, prompt_version, generated_at\n    )\n    SELECT\n      ${sqlText(article.code)}, ${sqlText(article.language)}, ${sqlText(article.languageName)}, ${article.n},\n      ${sqlText(article.title)}, ${sqlText(article.level)}, ${sqlText(article.part)}, ${sqlText(article.chapter)}, ${sqlText(article.articleMarkdown)},\n      ${sqlText(contract.importedArticleProvider)}, ${sqlText(contract.importedArticleModel)},\n      ${sqlText(contract.importedAuditProvider)}, ${sqlText(contract.importedAuditModel)},\n      ${sqlText(contract.promptVersion)}, ${sqlText(batch.generatedAt)}\n    WHERE ${batchGuard}\n    ON CONFLICT(code) DO NOTHING;`);

    lines.push(`UPDATE wiki_jobs\n    SET status = 'published',\n        provider = (SELECT provider FROM wiki_articles WHERE code = ${sqlText(article.code)}),\n        model = (SELECT model FROM wiki_articles WHERE code = ${sqlText(article.code)}),\n        last_error = NULL,\n        updated_at = ${sqlText(now)}\n    WHERE code = ${sqlText(article.code)}\n      AND ${batchGuard}\n      AND EXISTS (SELECT 1 FROM wiki_articles WHERE code = ${sqlText(article.code)});`);
  }

  lines.push(`INSERT OR IGNORE INTO wiki_editorial_batches(\n    batch_id, standard, prompt_version, generator, generator_model, article_count, generated_at, imported_at\n  ) VALUES (\n    ${sqlText(batch.id)}, ${sqlText(batch.standard)}, ${sqlText(batch.promptVersion)},\n    ${sqlText(batch.generator)}, ${sqlText(batch.generatorModel)}, ${batch.articles.length},\n    ${sqlText(batch.generatedAt)}, ${sqlText(now)}\n  );`);
  lines.push(`INSERT OR IGNORE INTO wiki_editorial_calibration(\n    batch_id, mode, reference_codes, profile_json\n  ) VALUES (\n    ${sqlText(batch.id)}, ${sqlText(batch.calibration.mode)},\n    ${sqlText(JSON.stringify(batch.calibration.referenceCodes))},\n    ${sqlText(JSON.stringify(batch.calibration.profile))}\n  );`);
  lines.push('COMMIT;');
  return lines.join('\n\n');
}

function importBatch(filePath) {
  const batch = loadBatch(filePath);
  const tempName = `MLS editorial ${Date.now()} ${Math.random().toString(36).slice(2, 8)}.sql`;
  const tempPath = path.join(os.tmpdir(), tempName);
  fs.writeFileSync(tempPath, buildSql(batch), 'utf8');

  console.log(`Importando ${batch.id}: ${batch.articles.length} artículos bajo ${batch.standard}, calibrados con ${batch.calibration.referenceCodes.length} referencias publicadas…`);
  const result = spawnSync(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['wrangler', 'd1', 'execute', DB_BINDING, '--remote', '--yes', `--file=${tempPath}`],
    { stdio: 'inherit', env: process.env }
  );
  try { fs.unlinkSync(tempPath); } catch {}
  if (result.error) throw result.error;
  if (result.status !== 0) fail(`Falló la importación de ${batch.id}.`);
  console.log(`✓ ${batch.id} importado de forma idempotente.`);
}

function main() {
  if (!fs.existsSync(CONTRACT_PATH)) fail(`Falta ${CONTRACT_PATH}.`);
  verifyCanonicalRuntime();
  if (!fs.existsSync(BATCH_DIR)) {
    console.log('No hay lotes editoriales pendientes.');
    return;
  }

  const files = fs.readdirSync(BATCH_DIR)
    .filter(name => name.toLowerCase().endsWith('.json'))
    .sort((a, b) => a.localeCompare(b, 'es'))
    .map(name => path.join(BATCH_DIR, name));

  if (files.length === 0) {
    console.log('No hay lotes editoriales pendientes.');
    return;
  }

  for (const file of files) importBatch(file);
}

main();
