'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const child=require('node:child_process');

const root=path.resolve(__dirname,'..');
const {injectR44}=require('../scripts/habilitar r44 cloudflare.js');

function checkJs(source,ext='.mjs'){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mls-unified-runner-'));
  const file=path.join(dir,'check'+ext);
  fs.writeFileSync(file,source);
  try{
    child.execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
  }finally{
    fs.rmSync(dir,{recursive:true,force:true});
  }
}

test('Unified Cloudflare runner injects one syntactically valid scheduled control plane',()=>{
  const overlay=fs.readFileSync(path.join(root,'MLS R32 OVERLAY','index.js'),'utf8');
  const built=injectR44(overlay);
  assert.match(built,/url\.pathname\.startsWith\("\/api\/unified-runner\/"\)/);
  assert.match(built,/async scheduled\(_controller, env, ctx\)/);
  assert.match(built,/ctx\.waitUntil\(unifiedRunnerScheduled\(env\)\)/);
  assert.match(built,/CREATE TABLE IF NOT EXISTS mls_unified_runner/);
  assert.match(built,/step_token TEXT, busy_until INTEGER/);
  assert.match(built,/\/api\/unified-runner\/status/);
  assert.match(built,/\/api\/unified-runner\/control/);
  assert.match(built,/\/api\/unified-runner\/step/);
  assert.match(built,/\/api\/unified-runner\/r33-evidence/);
  assert.match(built,/\/api\/unified-runner\/report/);
  assert.match(built,/CREATE TABLE IF NOT EXISTS mls_unified_runner_lane/);
  assert.match(built,/MLS_R33_SOURCE_CATALOG/);
  assert.match(built,/R33-Unified-CF-3/);
  assert.match(built,/NEEDS_CHAT_REVIEW/);
  assert.match(built,/r44ChatBridgeAuthorize\(request, env\)/);
  assert.match(built,/@cf\/ibm-granite\/granite-4\.0-h-micro/);
  assert.match(built,/POLICY_PAUSED/);
  assert.match(built,/QUOTA_PAUSED/);
  assert.match(built,/automated_registered_source_fulltext_match_v3/);
  assert.match(built,/SOURCE_FULLTEXT_REQUIRED/);
  assert.match(built,/complete:"COMPLETE"/);
  assert.equal(injectR44(built),built,'R44/Unified injection must be idempotent');
  checkJs(built,'.mjs');
});

test('Unified runner page preserves corpus runner and parses all inline scripts',()=>{
  const html=fs.readFileSync(path.join(root,'public','runner.html'),'utf8');
  assert.match(html,/id="corpusPanel"/);
  assert.match(html,/id="unifiedPanel"/);
  assert.match(html,/>MLS Unified</);
  assert.match(html,/\/api\/unified-runner\//);
  assert.match(html,/id="unifiedR33Lane"/);
  assert.match(html,/VERIFIED canónico/);
  assert.match(html,/\/api\/unified\/status/);
  assert.match(html,/REVIEW_PAUSED/);
  assert.match(html,/authorization':'Bearer /);
  assert.doesNotMatch(html,/GITHUB_TOKEN|api\.github\.com/);
  const scripts=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(x=>x[1]).filter(Boolean);
  assert.ok(scripts.length>=2);
  for(const source of scripts)checkJs(source,'.js');
});

test('Wrangler schedules server-side Unified execution every five minutes',()=>{
  const config=JSON.parse(fs.readFileSync(path.join(root,'MLS R32 OVERLAY','wrangler.jsonc'),'utf8'));
  assert.deepEqual(config.triggers && config.triggers.crons,['*/5 * * * *']);
  assert.equal(config.ai.binding,'AI');
  assert.equal(config.d1_databases[0].binding,'WIKI_DB');
});
