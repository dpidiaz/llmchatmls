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
