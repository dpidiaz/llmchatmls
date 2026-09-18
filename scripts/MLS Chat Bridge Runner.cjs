'use strict';

const fs = require('node:fs');
const path = require('node:path');

const BASE_URL = 'https://llmchatmls.dpidiaz.workers.dev';

const OPERATIONS = Object.freeze({
  iniciarLoteStagingMLS: { method: 'POST', path: '/api/wiki/editorial/staging/start' },
  siguienteContextoStagingMLS: { method: 'GET', path: '/api/wiki/editorial/staging/next', query: ['runId'] },
  validarBorradorStagingMLS: { method: 'POST', path: '/api/wiki/editorial/staging/validate' },
  stagearBorradorMLS: { method: 'POST', path: '/api/wiki/editorial/staging/stage' },
  estadoStagingMLS: { method: 'GET', path: '/api/wiki/editorial/staging/status', query: ['runId'] },
  cancelarLoteStagingMLS: { method: 'POST', path: '/api/wiki/editorial/staging/cancel' },
  reconciliarStagingMLS: { method: 'POST', path: '/api/wiki/editorial/staging/integrate' }
});

function fail(message) {
  throw new Error(message);
}

function safeId(value) {
  const text = String(value || '').trim();
  if (!/^[A-Za-z0-9]{12,80}$/.test(text)) fail('commandId inválido.');
  return text;
}

function buildRequest(command) {
  const op = OPERATIONS[command.operationId];
  if (!op) fail('operationId no permitido por MLS Chat Bridge.');
  const url = new URL(BASE_URL + op.path);
  if (op.query) {
    const query = command.query || {};
    for (const key of op.query) {
      const value = String(query[key] || '').trim();
      if (!value) fail('Falta query.' + key);
      url.searchParams.set(key, value);
    }
  }
  const init = {
    method: op.method,
    headers: {
      authorization: 'Bearer ' + process.env.MLS_EDITORIAL_CHAT_KEY,
      accept: 'application/json'
    }
  };
  if (op.method === 'POST') {
    init.headers['content-type'] = 'application/json';
    init.body = JSON.stringify(command.payload || {});
  }
  return { url, init };
}

async function main() {
  const commandPath = process.argv[2];
  const resultPath = process.argv[3];
  if (!commandPath || !resultPath) fail('Uso: node runner <command> <result>.');
  if (!process.env.MLS_EDITORIAL_CHAT_KEY) fail('Falta MLS_EDITORIAL_CHAT_KEY.');

  const command = JSON.parse(fs.readFileSync(commandPath, 'utf8'));
  const commandId = safeId(command.commandId);
  const { url, init } = buildRequest(command);

  const startedAt = new Date().toISOString();
  let response;
  let responseText = '';
  let responseJson = null;
  let transportError = null;

  try {
    response = await fetch(url, init);
    responseText = await response.text();
    try { responseJson = responseText ? JSON.parse(responseText) : null; }
    catch { responseJson = { raw: responseText }; }
  } catch (error) {
    transportError = String(error && error.message || error);
  }

  const result = {
    version: 1,
    commandId,
    operationId: command.operationId,
    startedAt,
    finishedAt: new Date().toISOString(),
    transportOk: !transportError,
    httpStatus: response ? response.status : null,
    ok: response ? response.ok : false,
    response: responseJson,
    transportError
  };

  fs.mkdirSync(path.dirname(resultPath), { recursive: true });
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2) + '\n');
  process.stdout.write(JSON.stringify({
    commandId,
    operationId: command.operationId,
    httpStatus: result.httpStatus,
    ok: result.ok,
    resultPath
  }) + '\n');
}

if (require.main === module) {
  main().catch(error => {
    console.error(error && error.stack || error);
    process.exit(1);
  });
}

module.exports = { OPERATIONS, buildRequest, safeId };
