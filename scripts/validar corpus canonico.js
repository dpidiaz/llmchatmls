'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { LANGUAGES, PROMPT_VERSION } = require('./exportar corpus canonico.js');

const ROOT = path.resolve(process.env.MLS_CANONICAL_ROOT || 'content');

function fail(message) {
  throw new Error(message);
}

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    fail(file + ': JSON inválido: ' + error.message);
  }
}

function countWords(text) {
  const value = String(text || '').trim();
  return value ? value.split(/\s+/u).length : 0;
}

function validateCanonicalCorpus() {
  const manifestPath = path.join(ROOT, 'manifest.json');
  if (!fs.existsSync(manifestPath)) fail('No existe ' + manifestPath + '. Ejecuta canonical:export primero.');
  const manifest = readJson(manifestPath);
  if (manifest.standard !== 'MLS R32') fail('manifest.standard inválido.');
  if (manifest.promptVersion !== PROMPT_VERSION) fail('manifest.promptVersion inválido.');
  if (!Array.isArray(manifest.entries)) fail('manifest.entries debe ser un arreglo.');

  const manifestByCode = new Map();
  for (const item of manifest.entries) {
    const code = String(item.code || '').toUpperCase();
    if (!code) fail('Manifest contiene entrada sin código.');
    if (manifestByCode.has(code)) fail('Manifest contiene código duplicado: ' + code);
    manifestByCode.set(code, item);
  }

  const seen = new Set();
  let total = 0;
  const byLanguage = {};

  for (const language of LANGUAGES) {
    const dir = path.join(ROOT, language.slug);
    if (!fs.existsSync(dir)) fail('Falta directorio ' + dir + '.');
    const files = fs.readdirSync(dir).filter(name => name.endsWith('.json')).sort();
    if (files.length !== language.total) {
      fail(language.slug + ': ' + files.length + '/' + language.total + ' archivos.');
    }
    byLanguage[language.slug] = files.length;

    for (const fileName of files) {
      const filePath = path.join(dir, fileName);
      const raw = fs.readFileSync(filePath, 'utf8');
      const article = JSON.parse(raw);
      const code = String(article.code || '').toUpperCase();
      const expectedCode = language.prefix + '-' + String(article.n).padStart(4, '0');
      if (code !== expectedCode) fail(filePath + ': código esperado ' + expectedCode + '.');
      if (article.language !== language.slug) fail(code + ': idioma incorrecto.');
      if (article.promptVersion !== PROMPT_VERSION) fail(code + ': promptVersion incorrecto.');
      if (!String(article.title || '').trim()) fail(code + ': título vacío.');
      if (!String(article.articleMarkdown || '').trim()) fail(code + ': articleMarkdown vacío.');
      if (countWords(article.articleMarkdown) < 90) fail(code + ': articleMarkdown tiene menos de 90 palabras.');
      if (!String(article.articleMarkdown).includes('####')) fail(code + ': faltan encabezados #### requeridos por R32.');
      if (article.provider === 'cloudflare-legacy' || article.auditProvider === 'cloudflare-legacy') {
        fail(code + ': proveedor legacy detectado.');
      }
      if (seen.has(code)) fail('Código duplicado en archivos: ' + code);
      seen.add(code);

      const manifestItem = manifestByCode.get(code);
      if (!manifestItem) fail(code + ': falta en manifest.');
      const relativePath = language.slug + '/' + fileName;
      if (manifestItem.path !== relativePath) fail(code + ': manifest.path no coincide.');
      if (manifestItem.sha256 !== sha256(raw)) fail(code + ': hash SHA-256 no coincide.');
      if (Number(manifestItem.bytes) !== Buffer.byteLength(raw, 'utf8')) fail(code + ': bytes no coinciden.');
      total++;
    }
  }

  const expectedTotal = LANGUAGES.reduce((sum, item) => sum + item.total, 0);
  if (total !== expectedTotal) fail('Total real ' + total + ' no coincide con ' + expectedTotal + '.');
  if (manifest.entries.length !== expectedTotal) fail('Manifest contiene ' + manifest.entries.length + ' entradas; se esperaban ' + expectedTotal + '.');
  for (const code of manifestByCode.keys()) if (!seen.has(code)) fail(code + ': está en manifest pero no existe como archivo.');

  const result = { ok: true, totalEntries: total, promptVersion: PROMPT_VERSION, byLanguage };
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  return result;
}

module.exports = { validateCanonicalCorpus };

if (require.main === module) {
  try {
    validateCanonicalCorpus();
  } catch (error) {
    console.error('ERROR canonical validation:', error.message);
    process.exitCode = 1;
  }
}
