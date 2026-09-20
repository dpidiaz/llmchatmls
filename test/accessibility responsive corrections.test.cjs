'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {patchHome,patchStyles,MARKER}=require('../scripts/habilitar accesibilidad responsive.js');

const archive='MASTER LANGUAGE SYSTEM REVISION 32 BUNDLE.tar.gz';
const tarText=file=>execFileSync('tar',['-xOzf',archive,file],{encoding:'utf8'});

test('Accessibility R1 añade skip link sin duplicarlo y conserva un destino main válido',()=>{
  const original=tarText('public/index.html');
  const patched=patchHome(original);
  assert.match(patched,/class=["']mls-skip-link["']/);
  const href=(patched.match(/class=["']mls-skip-link["'][^>]*href=["']#([^"']+)["']/)||[])[1];
  assert.ok(href,'skip link sin destino');
  assert.match(patched,new RegExp('<main\\b[^>]*\\bid=["\']'+href+'["\']','i'));
  assert.equal(patchHome(patched),patched,'patchHome debe ser idempotente');
});

test('Accessibility R1 añade focus, touch targets y breakpoints de lectura sin reescribir CSS base',()=>{
  const original=tarText('public/assets/styles.css');
  const patched=patchStyles(original);
  assert.ok(patched.includes(MARKER));
  assert.match(patched,/body :is\(a,button,input,select,textarea,summary\):focus-visible/);
  assert.match(patched,/\.sidebar a,\.sidebar button,\.mobile-nav a,\.mobile-nav button\{\s*min-height:/);
  assert.match(patched,/@media \(max-width:1100px\)/);
  assert.match(patched,/@media \(min-width:1101px\) and \(max-width:1350px\)/);
  assert.equal(patchStyles(patched),patched,'patchStyles debe ser idempotente');
});

test('Reader respeta prefers-reduced-motion al navegar el outline',()=>{
  const reader=require('node:fs').readFileSync('MLS R32 OVERLAY/reader.js','utf8');
  assert.match(reader,/prefers-reduced-motion:\s*reduce/);
  assert.match(reader,/\?'auto':'smooth'/);
});
