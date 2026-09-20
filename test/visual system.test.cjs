'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const test=require('node:test');

const system=require('../scripts/habilitar sistema visual.js');
const css=fs.readFileSync('MLS R32 OVERLAY/design system.css','utf8');

function token(name){
  const escaped=name.replace(/[.*+?^$()|[\]\\]/g,'\\$&');
  const match=css.match(new RegExp(escaped+'\\s*:\\s*(#[0-9a-fA-F]{6})'));
  assert.ok(match,'missing color token '+name);
  return match[1];
}

function luminance(hex){
  const values=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(value=>
    value<=0.04045?value/12.92:Math.pow((value+0.055)/1.055,2.4)
  );
  return 0.2126*values[0]+0.7152*values[1]+0.0722*values[2];
}

function contrast(a,b){
  const hi=Math.max(luminance(a),luminance(b));
  const lo=Math.min(luminance(a),luminance(b));
  return (hi+0.05)/(lo+0.05);
}

test('Visual Foundation exposes the shared token contract',()=>{
  assert.equal(system.validateCss(css),true);
  for(const name of system.REQUIRED_TOKENS){
    assert.ok(css.includes(name+':'),'missing '+name);
  }
});

test('Visual Foundation keeps readable typography and shared control sizes',()=>{
  assert.match(css,/font-size:\s*max\(11pt,/);
  assert.match(css,/--mls-control-height:\s*44px/);
  assert.match(css,/--mls-control-height-large:\s*48px/);
});

test('Visual Foundation provides an explicit visible focus primitive',()=>{
  assert.match(css,/--mls-focus-width:\s*3px/);
  assert.match(css,/--mls-focus-offset:\s*2px/);
  assert.match(css,/\.mls-focusable:focus-visible\s*\{/);
});

test('focus token keeps at least 3:1 contrast against every shared light surface',()=>{
  const focus=token('--mls-focus-color');
  const surfaces=[
    '--mls-surface-canvas-light',
    '--mls-surface-panel-light',
    '--mls-surface-raised-light',
    '--mls-surface-muted-light',
    '--mls-surface-warm-light'
  ];
  for(const surface of surfaces){
    const ratio=contrast(focus,token(surface));
    assert.ok(ratio>=3,focus+' vs '+surface+' contrast '+ratio.toFixed(2)+' is below 3:1');
  }
});

test('Visual Foundation remains opt-in and avoids global element restyling',()=>{
  assert.doesNotMatch(css,/(^|[},\n])\s*(?:html|body|button|input|select|textarea|a|h[1-6]|p|article|main|aside)\s*\{/m);
});

test('installer publishes CSS and centrally links published HTML without duplicating links',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mls-visual-'));
  const source=path.join(dir,'design system.css');
  const publicDir=path.join(dir,'public');
  const target=path.join(publicDir,'css','design-system.css');
  const home=path.join(publicDir,'index.html');
  const virtuoso=path.join(publicDir,'virtuoso.html');
  fs.mkdirSync(publicDir,{recursive:true});
  fs.writeFileSync(source,css,'utf8');
  fs.writeFileSync(home,'<!doctype html><html><head><title>Home</title></head><body></body></html>','utf8');
  fs.writeFileSync(virtuoso,'<!doctype html><html><head><title>Virtuoso</title></head><body></body></html>','utf8');

  const first=system.install({source,target,publicDir});
  assert.equal(first.target,target);
  assert.equal(first.linked,2);
  assert.equal(fs.readFileSync(target,'utf8'),css);

  for(const file of [home,virtuoso]){
    const html=fs.readFileSync(file,'utf8');
    assert.match(html,/href="\/css\/design-system\.css"/);
    assert.equal((html.match(/\/css\/design-system\.css/g)||[]).length,1);
  }

  const second=system.install({source,target,publicDir});
  assert.equal(second.linked,0);
  for(const file of [home,virtuoso]){
    const html=fs.readFileSync(file,'utf8');
    assert.equal((html.match(/\/css\/design-system\.css/g)||[]).length,1);
  }
});
