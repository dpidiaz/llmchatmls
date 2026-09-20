'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const test=require('node:test');

const system=require('../scripts/habilitar sistema visual.js');
const css=fs.readFileSync('MLS R32 OVERLAY/design system.css','utf8');

test('Visual Foundation exposes the shared token contract',()=>{
  assert.equal(system.validateCss(css),true);
  for(const token of system.REQUIRED_TOKENS){
    assert.ok(css.includes(token+':'),'missing '+token);
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

test('Visual Foundation remains opt-in and avoids global element restyling',()=>{
  assert.doesNotMatch(css,/(^|[},\n])\s*(?:html|body|button|input|select|textarea|a|h[1-6]|p|article|main|aside)\s*\{/m);
});

test('installer publishes the stylesheet without transforming it',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mls-visual-'));
  const source=path.join(dir,'design system.css');
  const target=path.join(dir,'public','css','design-system.css');
  fs.writeFileSync(source,css,'utf8');
  assert.equal(system.install({source,target}),target);
  assert.equal(fs.readFileSync(target,'utf8'),css);
});
