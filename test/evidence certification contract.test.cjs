'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');

const workflow=fs.readFileSync('.github/workflows/produccion.yml','utf8');
const pkg=require('../package.json');

function pos(x){
  const i=workflow.indexOf(x);
  assert.ok(i>=0,'Falta '+x);
  return i;
}

test('R33 certification contract: explicit Evidence canonical and accessibility gates precede predeploy',()=>{
  const pre=pos('npm run predeploy');
  for(const step of ['npm run test:chat-editorial','npm run test:evidence','npm run test:canonical-tools','npm run qa:baseline']){
    assert.ok(pos(step)<pre,step+' debe ejecutarse antes de predeploy');
  }
});

test('R33 certification contract: production deploy is restricted to main and supports certified push plus manual full run',()=>{
  assert.match(workflow,/on:\s*\n\s*workflow_dispatch:/);
  assert.match(workflow,/\n\s*push:\s*\n\s*branches:\s*\n\s*- main\s*\n\s*paths:/);
  assert.match(workflow,/name: Certificar Evidence publicada[\s\S]*if: \$\{\{ github\.event_name == 'push' \}\}/);
  assert.match(workflow,/name: Desplegar artefacto certificado en produccion[\s\S]*if: \$\{\{ github\.ref == 'refs\/heads\/main' \}\}/);
  assert.equal((workflow.match(/run: npx wrangler deploy --keep-vars/g)||[]).length,1);
  assert.doesNotMatch(workflow,/\n\s*pull_request:\s*\n/);
});

test('R33 certification contract: Evidence suite names every Foundation test module',()=>{
  const script=pkg.scripts['test:evidence'];
  for(const file of [
    'evidence foundation.test.cjs',
    'evidence registry.test.cjs',
    'evidence claims.test.cjs',
    'evidence validator.test.cjs',
    'evidence apa.test.cjs',
    'evidence reviews.test.cjs',
    'evidence api.test.cjs',
    'evidence runtime integration.test.cjs',
    'evidence policies provenance.test.cjs',
    'evidence boundaries.test.cjs',
    'evidence telemetry.test.cjs',
    'evidence pilot 20 manifest.test.cjs'
  ]) assert.ok(script.includes(file),'Falta '+file);
});

test('R33 certification contract: production deploy is never a pull request step',()=>{
  const start=pos('- name: Desplegar artefacto certificado en produccion');
  const end=pos('- name: Sincronizar credenciales D1 Analytics');
  const deployBlock=workflow.slice(start,end);
  assert.match(deployBlock,/github\.ref == 'refs\/heads\/main'/);
  assert.match(deployBlock,/npx wrangler deploy --keep-vars/);
  assert.doesNotMatch(deployBlock,/pull_request/);
});
