'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const {STATUSES,buildBaseline,summarize,format}=require('../scripts/auditar baseline accesibilidad responsive.js');

test('baseline G usa únicamente estados QA autorizados y cubre áreas críticas',()=>{
  const results=buildBaseline();
  assert.ok(results.length>=20,'baseline demasiado pequeño');

  const allowed=new Set(STATUSES);
  for(const item of results){
    assert.ok(item.id&&item.area&&item.status&&item.evidence,'cada check debe tener id, area, status y evidence');
    assert.ok(allowed.has(item.status),'estado inválido: '+item.status);
  }

  const areas=new Set(results.map(x=>x.area));
  for(const expected of ['Visual System','Home','Virtuoso','Profesor IA','Reader','Offline','Cross-workstream']){
    assert.ok(areas.has(expected),'falta cobertura: '+expected);
  }
});

test('baseline G separa PASS FAIL MANUAL BLOCKED y N/A sin convertir hallazgos baseline en fallo de CI',()=>{
  const results=buildBaseline();
  const counts=summarize(results);
  for(const status of STATUSES)assert.equal(typeof counts[status],'number');
  assert.ok(counts.PASS>0);
  assert.ok(counts['MANUAL QA REQUIRED']>0);
  assert.ok(counts.BLOCKED>0);
  assert.ok(counts['N/A']>0);

  const report=format(results);
  assert.match(report,/MLS ACCESSIBILITY & RESPONSIVE BASELINE/);
  assert.match(report,/SUMMARY/);
});

test('baseline G inspecciona el shell real del bundle, no solamente overlays',()=>{
  const results=buildBaseline();
  const home=results.filter(x=>x.area==='Home');
  assert.ok(home.length>=5);
  assert.ok(home.some(x=>/real shell bundle/i.test(x.evidence)),'no hay evidencia del bundle real');
});
