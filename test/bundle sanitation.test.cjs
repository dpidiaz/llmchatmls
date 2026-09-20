'use strict';

const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const test=require('node:test');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {sanitizeBundle,validateSanitizedArchive,BANNED_PREFIXES}=require('../scripts/sanear bundle r32.js');

const archive=path.resolve('MASTER LANGUAGE SYSTEM REVISION 32 BUNDLE.tar.gz');

test('predeploy discards bundled data and source before installing canonical runtime',()=>{
  const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
  const p=pkg.scripts.predeploy;
  const purge=p.indexOf('rm -rf public/data public/mls-staging-targets src');
  const overlay=p.indexOf("cp 'MLS R32 OVERLAY/index.js' src/index.js");
  const compat=p.indexOf("node 'scripts/generar datos canonicos compatibles.js'");
  assert.ok(purge>=0,'predeploy debe purgar contenido y source del bundle');
  assert.ok(overlay>purge,'overlay canónico debe instalarse después de la purga');
  assert.ok(compat>overlay,'datos canónicos deben reconstruirse después de instalar el runtime');
});

test('sanitizer produces a shell-only bundle with no legacy data or bundled backend',()=>{
  assert.ok(fs.existsSync(archive),'Debe existir el bundle fuente durante la transición');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mls-bundle-test-'));
  const output=path.join(dir,'clean.tar.gz');
  try{
    const report=sanitizeBundle(archive,output);
    assert.ok(report.bytes>0);
    assert.ok(report.entries>0);
    const validated=validateSanitizedArchive(output);
    assert.equal(validated.required,7);
    assert.deepEqual(validated.bannedPrefixes,BANNED_PREFIXES);
    const ai=execFileSync('tar',['-xOzf',output,'public/js/ai.js'],{encoding:'utf8'});
    assert.match(ai,/Profesor|AI|fetch|chat/i,'public/js/ai.js debe conservar ruta exacta dentro del tar');
  } finally {
    fs.rmSync(dir,{recursive:true,force:true});
  }
});
