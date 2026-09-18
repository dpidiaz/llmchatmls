'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const bridge = require(path.join(process.cwd(), 'scripts', 'MLS Chat Bridge Runner.cjs'));

test('MLS Chat Bridge exposes only staging operations', () => {
  assert.deepEqual(Object.keys(bridge.OPERATIONS).sort(), [
    'cancelarLoteStagingMLS',
    'estadoStagingMLS',
    'iniciarLoteStagingMLS',
    'reconciliarStagingMLS',
    'siguienteContextoStagingMLS',
    'stagearBorradorMLS',
    'validarBorradorStagingMLS'
  ]);
});

test('MLS Chat Bridge never accepts arbitrary operation ids', () => {
  assert.throws(() => bridge.buildRequest({operationId:'fetchAnyUrl'}), /no permitido/);
});

test('MLS Chat Bridge GET operations require runId and target only the production staging API', () => {
  const req = bridge.buildRequest({operationId:'estadoStagingMLS',query:{runId:'run123'}});
  assert.equal(req.init.method,'GET');
  assert.equal(req.url.origin,'https://llmchatmls.dpidiaz.workers.dev');
  assert.equal(req.url.pathname,'/api/wiki/editorial/staging/status');
  assert.equal(req.url.searchParams.get('runId'),'run123');
});

test('MLS Chat Bridge workflow triggers only on command files in control branch', () => {
  const workflow = fs.readFileSync(path.join(process.cwd(),'.github','workflows','MLS Chat Bridge.yml'),'utf8');
  assert.match(workflow,/branches:\s*\n\s*- mlschatbridgev1/);
  assert.match(workflow,/mls chat bridge\/commands\/\*\.json/);
  assert.match(workflow,/permissions:\s*\n\s*contents: write/);
  assert.match(workflow,/MLS_EDITORIAL_CHAT_KEY/);
  assert.match(workflow,/MLS Chat Bridge Runner\.cjs/);
});
