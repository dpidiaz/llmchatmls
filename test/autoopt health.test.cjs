const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const health=require('../MLS R32 EDITORIAL/autoopt health.js');

test('AUTOOPT health: empty live data stays readable and insufficient',()=>{
  const metrics=health.mlsAutooptHealthMetrics({});
  assert.equal(metrics.validations,0);assert.equal(metrics.publications,0);
  assert.equal(metrics.firstPassSuccessRate,null);assert.equal(metrics.attemptsPerPublication,null);
  assert.deepEqual(metrics.successfulWords,{min:null,max:null,average:null});
  assert.equal(health.mlsAutooptHealthAlert(metrics).status,'evidencia insuficiente');
});

test('AUTOOPT health: live calculations preserve attempts, words and stable alert',()=>{
  const metrics=health.mlsAutooptHealthMetrics({validationAttempts:12,validationFailures:1,firstAttempts:10,successfulFirstPass:9,
    published:9,publicationsWithAttemptHistory:9,attemptsForPublished:10,wordsSuccessful:5400,minimumSuccessful:500,maximumSuccessful:700,
    consecutiveFirstPassSuccesses:6,deferred:0,needsReview:0});
  assert.equal(metrics.firstPassSuccessRate,0.9);assert.equal(metrics.attemptsPerPublication,1.111);
  assert.equal(metrics.rejectionRate,0.083);assert.equal(metrics.successfulWords.average,600);
  assert.equal(metrics.currentFirstPassStreak,6);assert.equal(health.mlsAutooptHealthAlert(metrics).status,'estable');
});

test('AUTOOPT health: watch alert is diagnostic for deferred, rejection and first pass regression',()=>{
  const metrics=health.mlsAutooptHealthMetrics({validationAttempts:20,validationFailures:8,firstAttempts:10,successfulFirstPass:6,
    published:6,publicationsWithAttemptHistory:6,attemptsForPublished:10,deferred:2,needsReview:0});
  const alert=health.mlsAutooptHealthAlert(metrics);
  assert.equal(alert.status,'vigilar');assert.equal(alert.conclusive,false);
  assert(alert.reasons.some(x=>/Deferred/.test(x)));assert(alert.reasons.some(x=>/Rechazos R32/.test(x)));assert(alert.reasons.some(x=>/primer intento/.test(x)));
});

test('AUTOOPT health: language is part of family and level aggregation key',()=>{
  const stats=JSON.stringify({validationAttempts:8,firstAttempts:8,successfulFirstPass:8,published:5,publicationsWithAttemptHistory:5,attemptsForPublished:5});
  const rows=[
    {scope_id:'espanol-guatemala:B1:conjugacion_verbal',family:'conjugacion_verbal',stats,updated_at:'2026-09-16T01:00:00Z'},
    {scope_id:'ingles:B1:conjugacion_verbal',family:'conjugacion_verbal',stats,updated_at:'2026-09-16T01:00:00Z'}
  ];
  const families=health.mlsAutooptHealthGroups(rows,'family');
  assert.equal(families.length,2);assert.deepEqual(new Set(families.map(x=>x.language)),new Set(['espanol-guatemala','ingles']));
  assert(families.every(x=>x.metrics.validations===8));
  const levels=health.mlsAutooptHealthGroups(rows,'level');assert.equal(levels.length,2);
});

test('AUTOOPT health: historical evidence remains separate and never fabricates attempts',()=>{
  const rows=[{prompt:'32.0',family_key:'ingles:B1:conjugacion_verbal',profile_key:'90:800:4',publications:3,incidents:1,
    words_sum:1800,sections_sum:12,references_sum:18,activity_like:1,length_errors:0}];
  const profiles=health.mlsAutooptHealthHistoryAggregate(rows,'profile');
  assert.equal(profiles.length,1);assert.equal(profiles[0].language,'ingles');assert.equal(profiles[0].publications,3);
  assert.equal(profiles[0].meanPublishedWords,600);assert.equal(profiles[0].firstPassSuccessRate,null);assert.equal(profiles[0].attemptsPerPublication,null);
  assert.equal(profiles[0].linguisticCorrectness,'not-certified');
});

test('AUTOOPT health: mobile shell does not persist the editorial key',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../MLS R32 EDITORIAL/autoopt health.html'),'utf8');
  assert(html.includes('/api/wiki/editorial/chat/autoopt/health'));
  assert.equal(/localStorage\.setItem\s*\(/.test(html),false);
  assert(html.includes('type="password"'));
});
