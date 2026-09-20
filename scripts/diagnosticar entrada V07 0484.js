'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const archive = path.resolve('MASTER LANGUAGE SYSTEM REVISION 32 BUNDLE.tar.gz');
const target = 'MLS-V07-0484';
const neighbors = ['MLS-V07-0483', 'MLS-V07-0485'];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function excerpt(text, needle) {
  const i = text.indexOf(needle);
  if (i < 0) return null;
  const start = Math.max(0, i - 1200);
  const end = Math.min(text.length, i + needle.length + 2400);
  return text.slice(start, end);
}

if (!fs.existsSync(archive)) {
  console.error('No existe el bundle R32:', archive);
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mls-r32-'));
const extract = spawnSync('tar', ['-xzf', archive, '-C', tmp], { encoding: 'utf8' });
if (extract.status !== 0) {
  console.error(extract.stderr || extract.stdout || 'tar falló');
  process.exit(extract.status || 1);
}

const files = walk(tmp);
const needles = [target, ...neighbors];
const hits = [];

for (const file of files) {
  const st = fs.statSync(file);
  if (st.size > 20 * 1024 * 1024) continue;
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  if (text.includes('\u0000')) continue;
  for (const needle of needles) {
    const x = excerpt(text, needle);
    if (x) hits.push({ needle, file: path.relative(tmp, file), excerpt: x });
  }
}

console.log(JSON.stringify({
  archive: path.basename(archive),
  extractedFiles: files.length,
  target,
  exactTargetHits: hits.filter(x => x.needle === target),
  neighborHits: hits.filter(x => x.needle !== target)
}, null, 2));

if (!hits.some(x => x.needle === target) && !hits.some(x => neighbors.includes(x.needle))) {
  console.error('No se encontró target ni vecinos dentro del bundle R32.');
  process.exitCode = 2;
}
