'use strict';
const assert = require('node:assert/strict');

const origin = 'https://llmchatmls.dpidiaz.workers.dev';
const path = '/api/wiki/editorial/chat/start';
const diagnosticPath = '/api/wiki/editorial/chat/fifo/diagnostic?limit=200';
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function verify() {
  const schemaResponse = await fetch(origin + '/api/wiki/editorial/chat/openapi.json', {redirect:'manual'});
  assert.equal(schemaResponse.status, 200, 'deployed editorial OpenAPI must be reachable');
  const schema = await schemaResponse.json();
  assert.equal(schema.servers[0].url, origin);
  assert.equal(schema.paths[path].post.operationId, 'iniciarLoteMLS');
  for (const command of ['MLS siguientes 5', 'MLS rescate siguientes 1']) {
    const response = await fetch(origin + path, {
      method:'POST', redirect:'manual', headers:{'content-type':'application/json'},
      body:JSON.stringify({command, requestId:crypto.randomUUID()})
    });
    assert.equal(response.status, 401, `${command}: una petición sin clave debe alcanzar autenticación sin crear lote`);
    console.log(JSON.stringify({command, method:'POST', path, status:response.status}));
  }
  const get = await fetch(origin + path, {redirect:'manual'});
  assert.equal(get.status, 401, 'GET without credentials must remain protected');
  console.log(JSON.stringify({method:'GET', path, status:get.status}));

  const editorialKey = String(process.env.MLS_EDITORIAL_CHAT_KEY || '').trim();
  if (!editorialKey) {
    console.log(JSON.stringify({fifoDiagnostic:'skipped', reason:'MLS_EDITORIAL_CHAT_KEY is not configured in GitHub Actions secrets'}));
    return;
  }

  const diagnosticResponse = await fetch(origin + diagnosticPath, {
    method:'GET',
    redirect:'manual',
    headers:{authorization:'Bearer ' + editorialKey}
  });
  assert.equal(diagnosticResponse.status, 200, 'authenticated FIFO diagnostic must return 200');
  const diagnostic = await diagnosticResponse.json();
  assert.equal(diagnostic.readOnly, true, 'FIFO diagnostic must declare readOnly=true');
  assert.equal(diagnostic.ok, true, 'FIFO diagnostic must return ok=true');
  console.log('MLS_FIFO_DIAGNOSTIC=' + JSON.stringify(diagnostic));
}

(async () => {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try { await verify(); return; }
    catch (error) {
      if (attempt === 5) throw error;
      await pause(3000 * attempt);
    }
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
