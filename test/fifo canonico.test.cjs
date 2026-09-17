'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const {patchCanonicalFifo} = require('../scripts/habilitar fifo canonico.js');

const root = path.resolve(__dirname, '..');
const original = fs.readFileSync(path.join(root, 'MLS R32 EDITORIAL/chat workflow.js'), 'utf8');

test('FIFO canónico reemplaza el selector parcial y mantiene sintaxis válida', () => {
  const patched = patchCanonicalFifo(original);
  assert.notEqual(patched, original);
  assert.match(patched, /async function mlsChatFillNormalRun\(env, runId\)/);
  assert.match(patched, /jobFromGlobalIndex\(globalIndex\)/);
  assert.match(patched, /INSERT OR IGNORE INTO wiki_jobs\(code, language, language_name, n, seed_path, status, updated_at\)/);
  assert.match(patched, /j\.status IN \('pending', 'enqueued', 'queued'\)/);
  assert.match(patched, /s\.status IN \('deferred', 'needs_review'\)/);
  assert.match(patched, /x\.rescue_state IN \('pending', 'claimed', 'chat_claimed', 'needs_review'\)/);
  assert.doesNotMatch(patched, /FROM wiki_jobs\s+WHERE status <> 'published'/);
  assert.doesNotThrow(() => new vm.Script(patched));
});

test('parche FIFO canónico es idempotente', () => {
  const once = patchCanonicalFifo(original);
  const twice = patchCanonicalFifo(once);
  assert.equal(twice, once);
});

test('materialización canónica no contiene operaciones destructivas', () => {
  const patched = patchCanonicalFifo(original);
  const start = patched.indexOf('async function mlsChatReserveNormal');
  const end = patched.indexOf('async function mlsChatNext', start);
  const section = patched.slice(start, end);
  assert.doesNotMatch(section, /DELETE\s+FROM\s+wiki_(?:jobs|articles)/i);
  assert.doesNotMatch(section, /UPDATE\s+wiki_articles/i);
  assert.doesNotMatch(section, /attempts\s*=\s*0/i);
  assert.match(section, /INSERT OR IGNORE INTO wiki_jobs/);
});
