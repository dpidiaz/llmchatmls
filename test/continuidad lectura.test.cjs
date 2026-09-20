'use strict';

const fs=require('node:fs');
const path=require('node:path');
const test=require('node:test');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {patchContinueReading}=require('../scripts/habilitar continuidad lectura.js');

const archive=path.join(__dirname,'..','MASTER LANGUAGE SYSTEM REVISION 32 BUNDLE.tar.gz');
const readerSource=()=>fs.readFileSync(path.join(__dirname,'..','MLS R32 OVERLAY','reader.js'),'utf8');
const appSource=()=>execFileSync('tar',['-xOzf',archive,'public/js/app.js'],{encoding:'utf8'});

test('Seguir leyendo marca intención explícita y conserva el hash entry',()=>{
  const original=appSource();
  const patched=patchContinueReading(original);
  assert.match(patched,/reader\?\.requestResume\('\$\{recent\.code\}'\)/);
  assert.match(patched,/location\.hash='#entry=\$\{recent\.code\}'/);
  assert.match(patched,/↺ Seguir leyendo/);
  assert.equal(patchContinueReading(patched),patched);
});

test('el lector persiste progreso fuera de MLS.state para compatibilidad hacia atrás',()=>{
  const source=readerSource();
  assert.match(source,/READING_PROGRESS_KEY='mls\.readingProgress\.v1'/);
  assert.match(source,/window\.localStorage/);
  assert.match(source,/scrollY/);
  assert.match(source,/headingId/);
  assert.match(source,/headingOffset/);
  assert.match(source,/updatedAt/);
  assert.match(source,/READING_PROGRESS_LIMIT=120/);
});

test('reanudar requiere intención efímera y explícita',()=>{
  const source=readerSource();
  assert.match(source,/RESUME_INTENT_KEY='mls\.resumeIntent\.v1'/);
  assert.match(source,/RESUME_INTENT_MAX_AGE=5\*60\*1000/);
  assert.match(source,/window\.sessionStorage/);
  assert.match(source,/consumeResumeIntent\(normalized\)/);
  assert.match(source,/window\.sessionStorage\?\.removeItem\?\.\(RESUME_INTENT_KEY\)/);
  assert.match(source,/String\(intent\.code\|\|''\)\.toUpperCase\(\)!==normalized/);
  assert.match(source,/Date\.now\(\)-at<=RESUME_INTENT_MAX_AGE/);
  assert.match(source,/if\(resumeRequested\)[\s\S]*restoreReadingProgress\(normalized\)/);
});

test('navegación normal conserva el contrato de comenzar arriba',()=>{
  const source=readerSource();
  assert.match(source,/if\(entryChanged&&!resumeRequested\)scrollPageToAbsoluteTop\(\)/);
  assert.match(source,/else if\(entryChanged\)\{\s*scrollPageToAbsoluteTop\(\);\s*requestAnimationFrame\(scrollPageToAbsoluteTop\);/);
  assert.match(source,/href="#entry=\$\{escAttr\(prev\.code\)\}"/);
  assert.match(source,/href="#entry=\$\{escAttr\(next\.code\)\}"/);
});

test('guardar o quitar favorito preserva la posición perceptible de la misma entrada',()=>{
  const source=readerSource();
  assert.match(source,/const scrollBeforeRender=Math\.max\(0,Math\.round\(window\.scrollY/);
  assert.match(source,/document\.getElementById\('favBtn'\)\.onclick=\(\)=>\{[\s\S]*MLS\.save\(\);[\s\S]*page\(normalized\);/);
  assert.match(source,/else\{\s*requestAnimationFrame\(\(\)=>window\.scrollTo\(\{top:scrollBeforeRender,left:0,behavior:'auto'\}\)\);\s*\}/);
});

test('intención vieja, corrupta o de otra entrada nunca restaura accidentalmente',()=>{
  const source=readerSource();
  assert.match(source,/catch\{return fallback\}/);
  assert.match(source,/removeItem\?\.\(RESUME_INTENT_KEY\)/);
  assert.match(source,/if\(!intent\|\|String\(intent\.code\|\|''\)\.toUpperCase\(\)!==normalized\)return false/);
  assert.match(source,/Number\.isFinite\(at\)&&at>0&&Date\.now\(\)-at<=RESUME_INTENT_MAX_AGE/);
});

test('estado corrupto o ausente degrada de forma segura',()=>{
  const source=readerSource();
  assert.match(source,/catch\{return fallback\}/);
  assert.match(source,/if\(!value\|\|typeof value!=='object'\)return null/);
  assert.match(source,/if\(!Number\.isFinite\(scrollY\)\|\|scrollY<0/);
  assert.match(source,/if\(!restoreReadingProgress\(normalized\)\)scrollPageToAbsoluteTop\(\)/);
});

test('persistencia usa escritura limitada y no escribe en cada pixel de scroll',()=>{
  const source=readerSource();
  assert.match(source,/setTimeout\(\(\)=>captureReadingProgress\(\),350\)/);
  assert.match(source,/addEventListener\('scroll',scheduleReadingProgress,\{passive:true\}\)/);
  assert.match(source,/addEventListener\('pagehide'/);
  assert.match(source,/visibilityState==='hidden'/);
});

test('workstream B no altera la lógica de related content',()=>{
  const source=readerSource();
  assert.match(source,/function relatedFromMarkdown\(markdown,catalog\)/);
  assert.match(source,/return related\.slice\(0,12\)/);
  assert.doesNotMatch(source,/semantic neighbors|BGE-M3|semantic related/i);
});
