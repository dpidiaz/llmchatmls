'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const profiles=require('../MLS R32 OVERLAY/profesor ia perfiles.js');
const prefs=require('../MLS R32 OVERLAY/profesor ia preferencias.js');
const quick=require('../MLS R32 OVERLAY/profesor ia acciones rapidas.js');
const pronunciation=require('../MLS R32 OVERLAY/profesor ia pronunciacion.js');

const LANGS=['espanol-guatemala','ingles','portugues','italiano','frances','aleman','japones','chino-taiwan','coreano','ruso'];

test('las diez enciclopedias tienen perfil y acciones aisladas',()=>{
  assert.deepEqual(Object.keys(profiles.PROFILES).sort(),[...LANGS].sort());
  for(const slug of LANGS){
    assert.notEqual(profiles.profileFor(slug),profiles.FALLBACK,slug);
    const actions=quick.actionsFor(slug);
    assert.ok(actions.length>=13,slug);
    assert.equal(new Set(actions.map(a=>a.id)).size,actions.length,slug);
  }
  assert.ok(quick.actionsFor('japones').some(a=>a.id==='ja-reading'));
  assert.ok(!quick.actionsFor('chino-taiwan').some(a=>a.id==='ja-reading'));
  assert.ok(quick.actionsFor('chino-taiwan').some(a=>a.id==='zh-zhuyin'));
  assert.ok(!quick.actionsFor('coreano').some(a=>a.id==='zh-zhuyin'));
});

test('invariantes canónicos sobreviven a perfiles y pronunciación',()=>{
  const expected={
    'espanol-guatemala':/voseo|Guatemala/i,
    ingles:/variante|estadounidense|británico/i,
    portugues:/Brasil|brasileñ/i,
    italiano:/italiano estándar/i,
    frances:/francés estándar/i,
    aleman:/Standarddeutsch/i,
    japones:/kanji|kana/i,
    'chino-taiwan':/tradicional|Taiwán/i,
    coreano:/Hangul/i,
    ruso:/cirílico/i
  };
  for(const slug of LANGS){
    assert.match(profiles.directiveFor(slug),expected[slug],slug);
    assert.match(pronunciation.directiveFor(slug),expected[slug],slug);
  }
});

test('preferencias no mutan variante ni artículo y longitud es independiente',()=>{
  for(const slug of LANGS){
    const original={language:slug,body:'ARTÍCULO ORIGINAL',plain:{lead:'LEAD'}};
    const out=prefs.augmentEntry(original,{slug,name:profiles.profileFor(slug).label},{explanationLanguage:'target',depth:'technical',length:'brief'});
    assert.equal(original.body,'ARTÍCULO ORIGINAL',slug);
    assert.equal(original.plain.lead,'LEAD',slug);
    assert.equal(out.professorPreferences.depth,'technical',slug);
    assert.equal(out.professorPreferences.length,'brief',slug);
    assert.match(out.body,/Estas preferencias no alteran la variante canónica/i,slug);
  }
});

test('capas combinadas no contaminan slugs ni sustituyen escritura canónica',()=>{
  for(const slug of LANGS){
    const entry={language:slug,body:'BASE'};
    const profiled=profiles.augmentEntry(entry,{slug});
    const preferred=prefs.augmentEntry(profiled,{slug,name:profiles.profileFor(slug).label},{depth:'normal',length:'normal'});
    const action=quick.actionsFor(slug)[0];
    const enriched=quick.augmentEntry(preferred,{slug},action.id,'');
    assert.equal(entry.body,'BASE',slug);
    assert.equal(enriched.professorProfile.slug,slug);
    assert.equal(enriched.professorQuickAction.slug,slug);
    assert.match(enriched.body,/MLS_PROFESSOR_PROFILE 1\.0/);
    assert.match(enriched.body,/MLS_PROFESSOR_PREFERENCES 1\.0/);
    assert.match(enriched.body,/MLS_PROFESSOR_QUICK_ACTION 1\.0/);
  }
});
