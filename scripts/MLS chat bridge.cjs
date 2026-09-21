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
  },
  metricasEvidenceEntradaMLS: {
    method: 'GET',
    pathname: '/api/wiki/editorial/evidence/metrics',
    input: 'code'
  }
});

const MLS_CHAT_BRIDGE_LOCAL_OPERATIONS = Object.freeze({
  procesarSecuenciaStagingMLS: 'staging-sequence'
});

const MLS_CHAT_BRIDGE_TERMINAL_STAGED = new Set(['staged','integrated','deployed','preservedExisting']);
const MLS_CHAT_BRIDGE_TERMINAL_BLOCKED = new Set(['deferred','needs_review','cancelled']);

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function ownKeysExactly(value, allowed) {
  const keys = Object.keys(value || {}).sort();
  const expected = [...allowed].sort();
  return keys.length === expected.length && keys.every((key, index) => key === expected[index]);
}

function normalizeStagingSequenceInput(input) {
  if (!isPlainObject(input) || !ownKeysExactly(input, ['runId','entries']))
    throw new Error('procesarSecuenciaStagingMLS solo admite input.runId e input.entries.');
  const runId = String(input.runId || '').trim();
  if (!runId) throw new Error('runId es obligatorio.');
  if (!Array.isArray(input.entries) || input.entries.length < 1 || input.entries.length > 400)
    throw new Error('entries debe contener entre 1 y 400 borradores.');

  const entries = input.entries.map((entry, index) => {
    if (!isPlainObject(entry) || !ownKeysExactly(entry, ['code','articleMarkdown','editorialReview']))
      throw new Error('Cada entrada solo admite code, articleMarkdown y editorialReview.');
    const code = String(entry.code || '').trim().toUpperCase();
    const articleMarkdown = String(entry.articleMarkdown || '');
    const editorialReview = String(entry.editorialReview || '');
    if (!/^MLS-V\d{2}-\d{4}$/.test(code))
      throw new Error('Código inválido en entries[' + index + '].');
    if (!articleMarkdown.trim() || articleMarkdown.length > 16000)
      throw new Error('articleMarkdown inválido en ' + code + '.');
    if (editorialReview.length < 40 || editorialReview.length > 3000)
      throw new Error('editorialReview inválido en ' + code + '.');
    return { code, articleMarkdown, editorialReview };
  });

  return { runId, entries };
}

function normalizeBridgeCommand(command) {
  if (!isPlainObject(command)) throw new Error('El comando del puente debe ser un objeto JSON.');
  if (!ownKeysExactly(command, ['operationId', 'input']))
    throw new Error('El comando del puente solo admite operationId e input.');

  const operationId = String(command.operationId || '').trim();
  if (MLS_CHAT_BRIDGE_LOCAL_OPERATIONS[operationId]) {
    return {
      operationId,
      operation: { local: MLS_CHAT_BRIDGE_LOCAL_OPERATIONS[operationId] },
      input: normalizeStagingSequenceInput(command.input)
    };
  }

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

  if (operation.input === 'code') {
    if (!ownKeysExactly(command.input, ['code']))
      throw new Error('Esta operación solo admite input.code.');
    const code = String(command.input.code || '').trim().toUpperCase();
    if (!/^MLS-V\d{2}-\d{4}$/.test(code))
      throw new Error('code MLS inválido.');
    return { operationId, operation, input: { code } };
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

function addD1Metrics(target, payload) {
  target.d1RowsRead += Number(payload?.d1RowsRead || payload?.run?.d1RowsRead || 0);
  target.d1RowsWritten += Number(payload?.d1RowsWritten || payload?.run?.d1RowsWritten || 0);
}

function isTransientValidatedStage409(result) {
  if (Number(result?.httpStatus) !== 409) return false;
  const message = String(result?.response?.error || result?.response?.message || '');
  return /persisted como validated antes de stagear/i.test(message);
}

async function bridgeSleep(ms, options = {}) {
  if (typeof options.sleepImpl === 'function') return options.sleepImpl(ms);
  await new Promise(resolve => setTimeout(resolve, ms));
}

async function executeRemoteOperation(operationId, input, options = {}) {
  const operation = MLS_CHAT_BRIDGE_OPERATIONS[operationId];
  if (!operation) throw new Error('Operación remota no permitida por MLS Chat Bridge.');

  const fetchImpl = options.fetchImpl || global.fetch;
  const secret = String(options.secret ?? process.env.MLS_EDITORIAL_CHAT_KEY ?? '').trim();
  const baseUrl = String(options.baseUrl || MLS_CHAT_BRIDGE_BASE_URL);

  if (typeof fetchImpl !== 'function') throw new Error('fetch no está disponible.');
  if (!secret) throw new Error('MLS_EDITORIAL_CHAT_KEY no está configurado.');

  const url = new URL(operation.pathname, baseUrl);
  const init = {
    method: operation.method,
    headers: {
      accept: 'application/json',
      authorization: 'Bearer ' + secret
    }
  };

  if (operation.input === 'runId') {
    const runId = String(input?.runId || '').trim();
    if (!runId) throw new Error('runId es obligatorio.');
    url.searchParams.set('runId', runId);
  } else if (operation.input === 'code') {
    const code = String(input?.code || '').trim().toUpperCase();
    if (!/^MLS-V\d{2}-\d{4}$/.test(code)) throw new Error('code MLS inválido.');
    url.searchParams.set('code', code);
  } else {
    init.headers['content-type'] = 'application/json';
    init.body = JSON.stringify(input || {});
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
    operationId,
    method: operation.method,
    path: operation.pathname,
    response: payload,
    completedAt: new Date().toISOString()
  };
}

function sequenceFailure(runId, phase, code, remote, metrics, results, message) {
  return {
    success: false,
    httpStatus: remote?.httpStatus || 409,
    operationId: 'procesarSecuenciaStagingMLS',
    method: 'ORCHESTRATED',
    path: 'bridge://staging-sequence',
    response: {
      ok: false,
      runId,
      phase,
      code,
      error: message || remote?.response?.error || remote?.response || 'Falló la secuencia staging.',
      processed: results.filter(x => x.status === 'staged').length,
      skipped: results.filter(x => x.reused).length,
      results,
      d1RowsRead: metrics.d1RowsRead,
      d1RowsWritten: metrics.d1RowsWritten
    },
    completedAt: new Date().toISOString()
  };
}

async function executeStagingSequence(input, options = {}) {
  const normalized = normalizeStagingSequenceInput(input);
  const metrics = { d1RowsRead: 0, d1RowsWritten: 0 };
  const results = [];

  const status = await executeRemoteOperation('estadoStagingMLS', { runId: normalized.runId }, options);
  addD1Metrics(metrics, status.response);
  if (!status.success)
    return sequenceFailure(normalized.runId, 'status', null, status, metrics, results);

  const codeStates = new Map((status.response?.run?.codes || []).map(item => [
    String(item.code || '').toUpperCase(),
    String(item.status || '')
  ]));

  for (const entry of normalized.entries) {
    const priorStatus = codeStates.get(entry.code);
    if (!priorStatus)
      return sequenceFailure(normalized.runId, 'precheck', entry.code, null, metrics, results, 'El código no pertenece al run staging.');

    if (MLS_CHAT_BRIDGE_TERMINAL_STAGED.has(priorStatus)) {
      results.push({ code: entry.code, status: priorStatus, reused: true });
      continue;
    }
    if (MLS_CHAT_BRIDGE_TERMINAL_BLOCKED.has(priorStatus))
      return sequenceFailure(normalized.runId, 'precheck', entry.code, null, metrics, results, 'La entrada está en estado terminal ' + priorStatus + '.');

    let next = null;
    let nextAttempts = 0;
    let currentCode = '';
    const nextDelays = [500, 1000, 2000];
    while (nextAttempts < 4) {
      nextAttempts += 1;
      next = await executeRemoteOperation('siguienteContextoStagingMLS', { runId: normalized.runId }, options);
      addD1Metrics(metrics, next.response);
      if (!next.success)
        return sequenceFailure(normalized.runId, 'next', entry.code, next, metrics, results);

      currentCode = String(next.response?.context?.target?.code || '').toUpperCase();
      if (currentCode === entry.code) break;

      const staleState = codeStates.get(currentCode);
      if (!MLS_CHAT_BRIDGE_TERMINAL_STAGED.has(staleState) || nextAttempts >= 4)
        return sequenceFailure(
          normalized.runId,
          'fifo',
          entry.code,
          next,
          metrics,
          results,
          'FIFO esperaba ' + (currentCode || 'sin código') + ' y el comando proporcionó ' + entry.code + '.'
        );
      await bridgeSleep(nextDelays[nextAttempts - 1], options);
    }

    const contextId = String(next.response?.contextId || '');
    const referenceCodes = (next.response?.context?.references || []).map(ref => String(ref.code || '')).filter(Boolean);
    if (!contextId || !referenceCodes.length)
      return sequenceFailure(normalized.runId, 'context', entry.code, next, metrics, results, 'El contexto staging no contiene contextId o referencias.');

    const validateInput = {
      runId: normalized.runId,
      contextId,
      code: entry.code,
      articleMarkdown: entry.articleMarkdown,
      referenceCodes,
      editorialReview: entry.editorialReview
    };
    const validated = await executeRemoteOperation('validarBorradorStagingMLS', validateInput, options);
    addD1Metrics(metrics, validated.response);
    if (!validated.success || !validated.response?.valid)
      return sequenceFailure(normalized.runId, 'validate', entry.code, validated, metrics, results);

    const receipt = String(validated.response?.validationReceipt || '');
    if (!receipt)
      return sequenceFailure(normalized.runId, 'validate', entry.code, validated, metrics, results, 'La validación no devolvió validationReceipt.');

    let staged = null;
    let stageAttempts = 0;
    const stageDelays = [500, 1000, 2000];
    while (stageAttempts < 4) {
      stageAttempts += 1;
      staged = await executeRemoteOperation('stagearBorradorMLS', {
        ...validateInput,
        validationReceipt: receipt
      }, options);
      addD1Metrics(metrics, staged.response);
      if (staged.success && staged.response?.staged) break;
      if (!isTransientValidatedStage409(staged) || stageAttempts >= 4)
        return sequenceFailure(normalized.runId, 'stage', entry.code, staged, metrics, results);
      await bridgeSleep(stageDelays[stageAttempts - 1], options);
    }

    codeStates.set(entry.code, 'staged');
    results.push({
      code: entry.code,
      status: 'staged',
      reused: Boolean(staged.response?.reused),
      validationReused: Boolean(validated.response?.reused),
      nextAttempts,
      stageAttempts,
      words: validated.response?.words ?? null,
      validateCommit: validated.response?.commit ?? null,
      stageCommit: staged.response?.commit ?? null
    });
  }

  return {
    success: true,
    httpStatus: 200,
    operationId: 'procesarSecuenciaStagingMLS',
    method: 'ORCHESTRATED',
    path: 'bridge://staging-sequence',
    response: {
      ok: true,
      runId: normalized.runId,
      requested: normalized.entries.length,
      processed: results.filter(x => x.status === 'staged' && !x.reused).length,
      skipped: results.filter(x => x.reused).length,
      results,
      d1RowsRead: metrics.d1RowsRead,
      d1RowsWritten: metrics.d1RowsWritten
    },
    completedAt: new Date().toISOString()
  };
}

async function executeBridgeCommand(command, options = {}) {
  const normalized = normalizeBridgeCommand(command);
  if (normalized.operation.local === 'staging-sequence')
    return executeStagingSequence(normalized.input, options);
  return executeRemoteOperation(normalized.operationId, normalized.input, options);
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
  MLS_CHAT_BRIDGE_LOCAL_OPERATIONS,
  normalizeStagingSequenceInput,
  normalizeBridgeCommand,
  bridgeResultPath,
  isTransientValidatedStage409,
  executeRemoteOperation,
  executeStagingSequence,
  executeBridgeCommand,
  processBridgeCommandFile,
  verifyBridgeResults
};
