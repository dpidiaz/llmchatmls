const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('deploy artifact routes the published Action path before the GET-only wiki router', () => {
  const root = path.resolve(__dirname, '..');
  const runtime = fs.readFileSync(path.join(root, 'src/index.js'), 'utf8');
  const schema = JSON.parse(fs.readFileSync(path.join(root, 'MLS R32 EDITORIAL/chat openapi.json'), 'utf8'));
  const matches = Object.entries(schema.paths).flatMap(([pathname, methods]) =>
    Object.entries(methods).filter(([, operation]) => operation.operationId === 'iniciarLoteMLS')
      .map(([method]) => ({pathname, method})));
  assert.deepEqual(matches, [{pathname:'/api/wiki/editorial/chat/start', method:'post'}]);
  assert.equal(schema.servers[0].url, 'https://llmchatmls.dpidiaz.workers.dev');
  assert.ok(schema.paths[matches[0].pathname].post.requestBody.content['application/json']);
  assert.ok(schema.security.some(item => Object.hasOwn(item, 'MLSKey')));
  const chatRoute = runtime.indexOf('if (url.pathname.startsWith("/api/wiki/editorial/chat/")) return handleMlsChat(request, env, url);');
  const wikiRoute = runtime.indexOf('if (url.pathname.startsWith("/api/wiki/"))');
  assert.ok(chatRoute >= 0, 'the deploy artifact must include the editorial route');
  assert.ok(wikiRoute > chatRoute, 'the editorial route must run before the GET-only wiki router');
  assert.ok(runtime.includes('async function handleMlsChat(request, env, url)'));
  assert.ok(runtime.includes('iniciarLoteMLS'));
});
