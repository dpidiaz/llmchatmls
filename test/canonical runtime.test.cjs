'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  shardBounds,
  shardRelativePath
} = require('../scripts/generar runtime canonico.js');

test('canonical runtime shard bounds are deterministic', () => {
  assert.deepEqual(shardBounds(1, 1016, 100), { start: 1, end: 100 });
  assert.deepEqual(shardBounds(100, 1016, 100), { start: 1, end: 100 });
  assert.deepEqual(shardBounds(101, 1016, 100), { start: 101, end: 200 });
  assert.deepEqual(shardBounds(1016, 1016, 100), { start: 1001, end: 1016 });
});

test('canonical runtime shard paths are stable and language-scoped', () => {
  assert.equal(
    shardRelativePath('chino-taiwan', 401, 500),
    'shards/chino-taiwan/0401-0500.json'
  );
});


test('reader is GitHub-canonical-first and has no D1/materialization read fallback', () => {
  const fs = require('node:fs');
  const reader = fs.readFileSync('MLS R32 OVERLAY/reader.js', 'utf8');
  assert.match(reader, /\/data\/canonical\/runtime-manifest\.json/);
  assert.match(reader, /Contenido no disponible/);
  assert.match(reader, /no mostrará contenido antiguo/);
  assert.doesNotMatch(reader, /\/api\/wiki\/article\//);
  assert.doesNotMatch(reader, /\/api\/wiki\/materialize\//);
  assert.doesNotMatch(reader, /cloudflare-legacy/);
  assert.doesNotMatch(reader, /e\.plain/);
  assert.doesNotMatch(reader, /easy\.lead/);
});
