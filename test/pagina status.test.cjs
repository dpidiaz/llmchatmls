'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const installer=require('../scripts/habilitar pagina status.js');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'MLS R32 OVERLAY','status.html'),'utf8');
const worker=fs.readFileSync(path.join(root,'MLS R32 OVERLAY','index.js'),'utf8');

test('pagina status usa la API existente sin reemplazarla',()=>{
  assert.match(html,/\/api\/wiki\/status/);
  assert.match(html,/Ver JSON técnico/);
  assert.match(html,/\/api\/wiki\/recent\?limit=5&revision=r32/);
  assert.match(worker,/url\.pathname === "\/api\/wiki\/status"/);
});

test('pagina status es user friendly y responsive',()=>{
  for(const term of ['Status','Actualizar ahora','Capacidad de IA hoy','Enciclopedias','Actividad','Detalles técnicos'])assert.match(html,new RegExp(term,'i'));
  assert.match(html,/viewport-fit=cover/);
  assert.match(html,/@media\(max-width:760px\)/);
  assert.match(html,/setInterval\([^]*60000\)/);
});

test('pagina status respeta minimo tipografico aproximado de 11 pt',()=>{
  assert.doesNotMatch(html,/font-size:\.(?:[0-8]\d?|9[01])rem/);
  assert.match(html,/font-size:\.92rem/);
});

test('javascript embebido de status tiene sintaxis valida',()=>{
  const match=html.match(/<script>([\s\S]*?)<\/script>/i);
  assert.ok(match&&match[1],'No se encontró el script de status.');
  assert.doesNotThrow(()=>new Function(match[1]));
});

test('instalador parchea el worker real y sirve status directamente',()=>{
  const once=installer.patchWorker(worker,html);
  assert.match(once,/MLS STATUS PAGE ROUTE 1\.1/);
  assert.match(once,/url\.pathname === "\/status"/);
  assert.match(once,/url\.pathname === "\/status\/"/);
  assert.match(once,/url\.pathname === "\/status\.html"/);
  assert.match(once,/content-type": "text\/html; charset=utf-8"/);
  assert.match(once,/url\.pathname\.startsWith\("\/api\/wiki\/"\)/);
  assert.doesNotMatch(once,/statusUrl\.pathname = "\/status\.html"/);
  assert.equal(installer.patchWorker(once,html),once);
});

test('status muestra uso D1 y countdown del reset en ambos niveles',()=>{
  assert.match(html,/Cloudflare D1 hoy/);
  assert.match(html,/d1ReadMain/);
  assert.match(html,/d1WriteMain/);
  assert.match(html,/d1Countdown/);
  assert.match(html,/setInterval\(updateD1Countdown,1000\)/);
  assert.match(html,/target\.getTime\(\)<=now/);
  assert.match(html,/d1ResetAt=target\.toISOString\(\)/);
  assert.match(html,/d1_daily_row_\(\?:read\|write\)_limit/);
  assert.match(html,/s\.d1Usage/);
  assert.match(html,/statusRes\.status===503&&s\.degraded/);
});

test('instalador de uso D1 agrega GraphQL oficial sin consultar D1 para medir D1',()=>{
  const usageInstaller=require('../scripts/habilitar uso d1 status.js');
  const sample=[
    'async function getWikiStatusR32(env) {',
    '  return {',
    '    nextFIFO: nextFifo ?? null,',
    '    cloudflare: { ...budget, onDemandTargetPercent: 90 },',
    '  };',
    '}',
    'async function d1QuotaResponse(env,url,quotaType="read") {',
    '  const normalizedQuotaType=quotaType==="write"?"write":"read";',
    '  const resetAt=nextUtcResetIso();',
    '  const base={',
    '    d1:{quotaExhausted:true,quotaType:normalizedQuotaType,resetAt},',
    '  };',
    '}'
  ].join('\n');
  const patched=usageInstaller.patchD1UsageStatus(sample);
  assert.match(patched,/MLS D1 USAGE STATUS 1\.1/);
  assert.match(patched,/d1AnalyticsAdaptiveGroups/);
  assert.match(patched,/rowsRead rowsWritten/);
  assert.match(patched,/D1_ANALYTICS_TOKEN/);
  assert.match(patched,/D1_ANALYTICS_ACCOUNT_ID/);
  assert.match(patched,/readLimit:MLS_D1_FREE_READ_LIMIT/);
  assert.match(patched,/writeLimit:MLS_D1_FREE_WRITE_LIMIT/);
  assert.match(patched,/quotaType:normalizedQuotaType/);
  assert.match(patched,/d1Usage: await mlsD1UsageStatus\(env\)/);
  assert.equal(usageInstaller.patchD1UsageStatus(patched),patched);
});

test('predeploy instala métricas D1 después de la degradación por cuota',()=>{
  const packageJson=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  const predeploy=packageJson.scripts.predeploy;
  assert.ok(predeploy.indexOf('habilitar uso d1 status.js')>predeploy.indexOf('habilitar degradacion cuota d1.js'));
  assert.ok(predeploy.indexOf('habilitar uso d1 status.js')<predeploy.indexOf('generar snapshot staging.js'));
});


test('workflow sincroniza credenciales Analytics dedicadas sin convertir el token de deploy en token runtime',()=>{
  const workflow=fs.readFileSync(path.join(root,'.github','workflows','produccion.yml'),'utf8');
  assert.match(workflow,/Sincronizar credenciales D1 Analytics/);
  assert.match(workflow,/secrets\.D1_ANALYTICS_TOKEN/);
  assert.match(workflow,/secrets\.D1_ANALYTICS_ACCOUNT_ID/);
  assert.match(workflow,/wrangler secret put D1_ANALYTICS_TOKEN/);
  assert.match(workflow,/wrangler secret put D1_ANALYTICS_ACCOUNT_ID/);
  assert.match(workflow,/secrets\.CLOUDFLARE_API_TOKEN/);
  assert.doesNotMatch(workflow,/D1_ANALYTICS_TOKEN:\s*\$\{\{\s*secrets\.CLOUDFLARE_API_TOKEN\s*\}\}/);
  assert.match(workflow,/daily row \(read\|write\) limit/);
});
