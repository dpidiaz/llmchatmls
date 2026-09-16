const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const rescue=require('../MLS R32 EDITORIAL/deferred rescue.js');

test('deferred rescue: classifies length deterministically',()=>{
  const d=rescue.mlsDeferredClassify({reason:'El artículo no alcanza el mínimo de palabras.',reason_code:'editorial_validation'});
  assert.equal(d.category,'length');assert.equal(d.retryable,true);assert.equal(d.confidence,'alta');
});

test('deferred rescue: classifies contract, structure, references, provider and format',()=>{
  assert.equal(rescue.mlsDeferredClassify({reason:'Incumple contrato R32: actividad o curso.'}).category,'contract');
  assert.equal(rescue.mlsDeferredClassify({reason:'Faltan secciones obligatorias y el orden está incompleto.'}).category,'structure');
  assert.equal(rescue.mlsDeferredClassify({reason:'Debes consultar y declarar todas las referencias del contexto.'}).category,'references');
  assert.equal(rescue.mlsDeferredClassify({reason:'Cloudflare Workers AI provider timeout 503.'}).category,'provider');
  assert.equal(rescue.mlsDeferredClassify({reason:'Markdown o HTML no permitido.'}).category,'format');
});

test('deferred rescue: explicit semantic risk is not auto retryable',()=>{
  const d=rescue.mlsDeferredClassify({reason:'Posible error conceptual de precisión lingüística.'});
  assert.equal(d.category,'semantic-risk');assert.equal(d.retryable,false);
});

test('deferred rescue: unknown never invents a cause',()=>{
  const d=rescue.mlsDeferredClassify({reason:'Fallo no reconocido XYZ.'});
  assert.equal(d.category,'unknown');assert.equal(d.retryable,false);assert.equal(d.confidence,'baja');
});

test('deferred rescue: diagnosis keeps language and family separate',()=>{
  const a=rescue.mlsDeferredDiagnose({code:'MLS-V01-0001',reason:'mínimo de palabras',rescue_state:'pending'},{target:{language:'ingles',title:'Conjugación verbal',level:'A1'}});
  const b=rescue.mlsDeferredDiagnose({code:'MLS-V10-0001',reason:'mínimo de palabras',rescue_state:'pending'},{target:{language:'espanol-guatemala',title:'Conjugación verbal',level:'A1'}});
  const agg=rescue.mlsDeferredAggregate([a,b]);
  assert.equal(agg.byLanguage.length,2);assert.equal(agg.byFamily.length,2);
});

test('deferred rescue: aggregation is diagnostic only and stable',()=>{
  const diagnostics=[
    rescue.mlsDeferredDiagnose({code:'A',reason:'mínimo de palabras',rescue_state:'pending'},{target:{language:'ingles',family:'verbos'}}),
    rescue.mlsDeferredDiagnose({code:'B',reason:'provider timeout',rescue_state:'pending'},{target:{language:'ingles',family:'verbos'}}),
    rescue.mlsDeferredDiagnose({code:'C',reason:'error conceptual',rescue_state:'needs_review'},{target:{language:'portugues-brasil',family:'verbos'}})
  ];
  const agg=rescue.mlsDeferredAggregate(diagnostics);
  assert.equal(agg.total,3);assert.equal(agg.retryable,2);assert.equal(agg.notRetryable,1);
  assert.equal(agg.byCategory.reduce((n,x)=>n+x.count,0),3);
});

test('deferred rescue: runtime integration does not define autonomous actions',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../MLS R32 EDITORIAL/deferred rescue.js'),'utf8');
  assert.match(source,/automaticRescue:false/);assert.match(source,/automaticPublish:false/);assert.match(source,/fifoChanged:false/);
  assert.equal(/fetch\s*\(/.test(source),false);
});

test('deferred rescue: predeploy injects diagnostics and panel section',()=>{
  const installer=require('../scripts/habilitar chat editorial.js');
  const panel=installer.patchAutooptPanel('<section class="card"><h2>Historial separado de evidencia viva</h2>\n<script>\n  $(\'historyGeneral\').innerHTML=\'x\';\n</script>');
  assert.match(panel,/Deferred inteligente/);assert.match(panel,/deferredGeneral/);assert.match(panel,/deferredCategories/);
  const runtime=installer.buildChatRuntime(path.join(__dirname,'..'));
  assert.match(runtime,/MLS_DEFERRED_RESCUE_VERSION/);assert.match(runtime,/rescueDiagnosis/);
});
