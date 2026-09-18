'use strict';

const fs = require('node:fs');
const path = require('node:path');

const MLS_CHAT_BRIDGE_BASE_URL = 'https://llmchatmls.dpidiaz.workers.dev';

const MLS_CHAT_BRIDGE_OPERATIONS = Object.freeze({
  iniciarLoteStagingMLS: {
    method: 'POST',
    pathname: '/api/wiki/editorial/staging/start',
    input: 'body'
  },
  siguienteContextoStagingMLS: {
    method: 'GET',
    pathname: '/api/wiki/editorial/staging/next',
    input: 'runId'
  },
  validarBorradorStagingMLS: {
    method: 'POST',
    pathname: '/api/wiki/editorial/staging/validate',
    input: 'body'
  },
  stagearBorradorMLS: {
    method: 'POST',
    pathname: '/api/wiki/editorial/staging/stage',
    input: 'body'
  },
  estadoStagingMLS: {
    method: 'GET',
    pathname: '/api/wiki/editorial/staging/status',
    input: 'runId'
  },
  cancelarLoteStagingMLS: {
    method: 'POST',
    pathname: '/api/wiki/editorial/staging/cancel',
    input: 'body'
  },
  reconciliarStagingMLS: {
    method: 'POST',
    pathname: '/api/wiki/editorial/staging/integrate',
    input: 'body'
  }
});

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function ownKeysExactly(value, allowed) {
  const keys = Object.keys(value || {}).sort();
  const expected = [...allowed].sort();
  return keys.length === expected.length && keys.every((key, index) => key === expected[index]);
}

function normalizeBridgeCommand(command) {
  if (!isPlainObject(command)) throw new Error('El comando del puente debe ser un objeto JSON.');
  if (!ownKeysExactly(command, ['operationId', 'input']))
    throw new Error('El comando del puente solo admite operationId e input.');

  const operationId = String(command.operationId || '').trim();
  const operation = MLS_CHAT_BRIDGE_OPERATIONS[operationId];
  if (!operation) throw new Error('operationId no permitido por MLS Chat Bridge.');

  if (!isPlainObject(command.input))
    throw new Error('input debe ser un objeto JSON.');

  if (operation.input === 'runId') {
    if (!ownKeysExactly(command.input, ['runId']))
      throw new Error('Esta operación solo admite input.runId.');
    const runId = String(command.input.runId || '').trim();
    if (!runId) throw new Error('runId es obligatorio.');
    return { operationId, operation, input: { runId } };
  }

  return { operationId, operation, input: command.input };
}

function bridgeResultPath(commandPath) {
  const normalized = String(commandPath || '').replace(/\\/g, '/');
  const marker = '/commands/';
  const index = normalized.lastIndexOf(marker);
  if (index < 0 || !normalized.endsWith('.json'))
    throw new Error('Ruta de comando inválida.');
  return normalized.slice(0, index) + '/results/' + normalized.slice(index + marker.length);
}

async function executeBridgeCommand(command, options = {}) {
  const normalized = normalizeBridgeCommand(command);
  const fetchImpl = options.fetchImpl || global.fetch;
  const secret = String(options.secret ?? process.env.MLS_EDITORIAL_CHAT_KEY ?? '').trim();
  const baseUrl = String(options.baseUrl || MLS_CHAT_BRIDGE_BASE_URL);

  if (typeof fetchImpl !== 'function') throw new Error('fetch no está disponible.');
  if (!secret) throw new Error('MLS_EDITORIAL_CHAT_KEY no está configurado.');

  const url = new URL(normalized.operation.pathname, baseUrl);
  const init = {
    method: normalized.operation.method,
    headers: {
      accept: 'application/json',
      authorization: 'Bearer ' + secret
    }
  };

  if (normalized.operation.input === 'runId') {
    url.searchParams.set('runId', normalized.input.runId);
  } else {
    init.headers['content-type'] = 'application/json';
    init.body = JSON.stringify(normalized.input);
  }

  const response = await fetchImpl(url, init);
  const responseText = await response.text();
  let payload;
  try {
    payload = responseText ? JSON.parse(responseText) : null;
  } catch {
    payload = { raw: responseText };
  }

  return {
    success: response.ok,
    httpStatus: response.status,
    operationId: normalized.operationId,
    method: normalized.operation.method,
    path: normalized.operation.pathname,
    response: payload,
    completedAt: new Date().toISOString()
  };
}

async function processBridgeCommandFile(commandPath, options = {}) {
  const resultPath = bridgeResultPath(commandPath);
  let result;

  try {
    const command = JSON.parse(fs.readFileSync(commandPath, 'utf8'));
    result = await executeBridgeCommand(command, options);
  } catch (error) {
    result = {
      success: false,
      httpStatus: 0,
      operationId: null,
      method: null,
      path: null,
      response: { error: String(error?.message || error) },
      completedAt: new Date().toISOString()
    };
  }

  result.commandFile = String(commandPath).replace(/\\/g, '/');
  fs.mkdirSync(path.dirname(resultPath), { recursive: true });
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2) + '\n');
  return { resultPath, result };
}

function verifyBridgeResults(commandPaths) {
  const failures = [];
  for (const commandPath of commandPaths) {
    const resultPath = bridgeResultPath(commandPath);
    const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
    if (!result.success) failures.push({ commandPath, resultPath, httpStatus: result.httpStatus, response: result.response });
  }
  return failures;
}

async function main(argv = process.argv.slice(2)) {
  if (!argv.length) throw new Error('Indica al menos un archivo de comando.');

  if (argv[0] === '--verify') {
    const commandPaths = argv.slice(1);
    if (!commandPaths.length) throw new Error('Indica al menos un comando para verificar.');
    const failures = verifyBridgeResults(commandPaths);
    if (failures.length) {
      console.error(JSON.stringify({ ok: false, failures }, null, 2));
      process.exitCode = 1;
    } else {
      console.log(JSON.stringify({ ok: true, verified: commandPaths.length }));
    }
    return;
  }

  const outputs = [];
  for (const commandPath of argv) outputs.push(await processBridgeCommandFile(commandPath));
  console.log(JSON.stringify({
    ok: outputs.every(x => x.result.success),
    results: outputs.map(x => ({ resultPath: x.resultPath, success: x.result.success, httpStatus: x.result.httpStatus }))
  }));
}

if (require.main === module) {
  main().catch(error => {
    console.error(String(error?.message || error));
    process.exitCode = 1;
  });
}

module.exports = {
  MLS_CHAT_BRIDGE_BASE_URL,
  MLS_CHAT_BRIDGE_OPERATIONS,
  normalizeBridgeCommand,
  bridgeResultPath,
  executeBridgeCommand,
  processBridgeCommandFile,
  verifyBridgeResults
};
