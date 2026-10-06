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
  assert.match(built,/\/api\/unified-runner\/github-gate/);
  assert.match(built,/\/api\/unified-runner\/kick/);
  assert.match(built,/CREATE TABLE IF NOT EXISTS mls_unified_runner_lane/);
  assert.match(built,/CREATE TABLE IF NOT EXISTS mls_unified_github_gate/);
  assert.match(built,/state TEXT NOT NULL CHECK\(state IN \('NORMAL','DEGRADED'\)\)/);
  assert.match(built,/unifiedRunnerGithubRetryDelay/);
  assert.match(built,/mode:"CLOUDFLARE_ONLY"/);
  assert.match(built,/MLS_R33_SOURCE_CATALOG/);
  assert.match(built,/R33-Unified-CF-3/);
  assert.match(built,/NEEDS_CHAT_REVIEW/);
  assert.match(built,/ctx && ctx\.access/);
  assert.match(built,/ctx\.access\.getIdentity\(\)/);
  assert.match(built,/UNIFIED_RUNNER_ACCESS_REQUIRED/);
  assert.match(built,/r44ChatBridgeAuthorize\(request, env\)/);
  assert.match(built,/handleR44\(request, env, url, _ctx\)/);
  assert.match(built,/@cf\/ibm-granite\/granite-4\.0-h-micro/);
  assert.match(built,/POLICY_PAUSED/);
  assert.match(built,/QUOTA_PAUSED/);
  assert.match(built,/automated_registered_source_fulltext_match_v3/);
  assert.match(built,/SOURCE_FULLTEXT_REQUIRED/);
  assert.match(built,/complete:"COMPLETE"/);
  assert.equal(injectR44(built),built,'R44/Unified injection must be idempotent');
  checkJs(built,'.mjs');
});

test('Unified runner uses Cloudflare Access with no browser secret',()=>{
  const runtime=fs.readFileSync(path.join(root,'scripts','r44 runtime.js'),'utf8');
  const r33=fs.readFileSync(path.join(root,'scripts','unified runner r33 runtime.js'),'utf8');
  const setup=fs.readFileSync(path.join(root,'scripts','configurar unified access.cjs'),'utf8');
  const workflow=fs.readFileSync(path.join(root,'.github','workflows','MLS R44 Cloudflare Cutover.yml'),'utf8');
  assert.match(runtime,/ctx && ctx\.access/);
  assert.match(runtime,/cf-access-jwt-assertion/);
  assert.match(runtime,/crypto\.subtle\.verify/);
  assert.match(runtime,/MLS_UNIFIED_ACCESS_AUD/);
  assert.match(runtime,/\/cdn-cgi\/access\/certs/);
  assert.match(runtime,/ctx\.access\.getIdentity\(\)/);
  assert.match(runtime,/UNIFIED_RUNNER_ACCESS_REQUIRED/);
  assert.match(runtime,/\/api\/unified-runner\/browser\//);
  assert.match(r33,/unifiedRunnerAuthorize\(request,env,ctx\)/);
  assert.match(setup,/cloudflare_account_member/);
  assert.match(setup,/\/runner\.html/);
  assert.match(setup,/\/api\/unified-runner\/browser\/\*/);
  assert.match(setup,/path_cookie_attribute:false/);
  assert.match(workflow,/Configure MLS Unified Cloudflare Access/);
  assert.match(workflow,/MLS_UNIFIED_ACCESS_PROTECTED/);
  child.execFileSync(process.execPath,['--check',path.join(root,'scripts','configurar unified access.cjs')],{stdio:'pipe'});
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
  assert.match(html,/Sesión segura de Cloudflare/);
  assert.match(html,/credentials:'same-origin'/);
  assert.match(html,/\/api\/unified-runner\/browser\//);
  assert.match(html,/mlsUnifiedAccessRecovery/);
  assert.match(html,/\/api\/unified-runner\/browser\/session/);
  assert.doesNotMatch(html,/mlsUnifiedRunnerKey|unifiedKey|MLS_EDITORIAL_CHAT_KEY|authorization':'Bearer /);
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
