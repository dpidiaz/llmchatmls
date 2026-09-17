'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const context=require('../scripts/habilitar contexto conversacional profesor ia.js');
const suggestions=require('../scripts/habilitar preguntas sugeridas profesor ia.js');
const links=require('../scripts/habilitar enlaces internos profesor ia.js');
const robust=require('../scripts/habilitar robustez profesor ia.js');
const optimize=require('../scripts/habilitar optimizacion prompt profesor ia.js');

const bundle=path.join(__dirname,'..','MASTER LANGUAGE SYSTEM REVISION 32 BUNDLE.tar.gz');
function baseAi(){return execFileSync('tar',['-xOzf',bundle,'public/js/ai.js'],{encoding:'utf8'});}
function patched(){return optimize.patchAi(robust.patchAi(links.patchAi(suggestions.patchAi(context.patchAi(baseAi())))));}
function runtimeApi(source){
  const start=source.indexOf("  const PROMPT_OPTIMIZATION_VERSION='1.0';");
  const end=source.indexOf("  const SUGGESTIONS_VERSION='1.0';");
  assert.ok(start>=0&&end>start,'bloque de optimización localizable');
  const block=source.slice(start,end);
  return new Function(`${block}\nreturn {contextFromEntry,stripProfessorBlocks,collectProfessorBlocks,MAX_CLIENT_CONTEXT_CHARS};`)();
}
function count(text,needle){return String(text).split(needle).length-1;}

const PROFILE='[MLS_PROFESSOR_PROFILE 1.0]\nPERFIL ÚNICO\n[/MLS_PROFESSOR_PROFILE]';
const PREFS='[MLS_PROFESSOR_PREFERENCES 1.0]\nPREFERENCIAS ÚNICAS\n[/MLS_PROFESSOR_PREFERENCES]';
const QUICK='[MLS_PROFESSOR_QUICK_ACTION 1.0]\nACCIÓN ÚNICA\n[/MLS_PROFESSOR_QUICK_ACTION]';
const PRON='[MLS_PROFESSOR_PRONUNCIATION 1.0]\nPRONUNCIACIÓN ÚNICA\n[/MLS_PROFESSOR_PRONUNCIATION]';

test('parche optimiza el núcleo combinado e idempotente',()=>{
  const source=patched();
  assert.match(source,/professorPromptOptimizationVersion:PROMPT_OPTIMIZATION_VERSION/);
  assert.match(source,/MAX_CLIENT_CONTEXT_CHARS=11500/);
  assert.equal(optimize.patchAi(source),source);
});

test('cada directiva activa se envía exactamente una vez aunque esté duplicada en artículo y lead',()=>{
  const api=runtimeApi(patched());
  const entry={
    code:'X',language:'ingles',title:'Tema',target:'forma',
    professorProfilePrompt:PROFILE,professorPreferencesPrompt:PREFS,professorQuickActionPrompt:QUICK,professorPronunciationPrompt:PRON,
    plain:{lead:`Definición limpia\n\n${PROFILE}\n\n${PREFS}\n\n${QUICK}\n\n${PRON}`,look:'Nota útil',example:'Ejemplo'},
    body:`Artículo importante\n\n${PROFILE}\n\n${PREFS}\n\n${QUICK}\n\n${PRON}`
  };
  const out=api.contextFromEntry(entry,{name:'Inglés'});
  assert.equal(out.definition,'Definición limpia');
  for(const marker of ['MLS_PROFESSOR_PROFILE','MLS_PROFESSOR_PREFERENCES','MLS_PROFESSOR_QUICK_ACTION','MLS_PROFESSOR_PRONUNCIATION'])assert.equal(count(out.content,'['+marker+' '),1,marker);
  assert.match(out.content,/Artículo importante/);
  assert.match(out.content,/Instrucciones activas del Profesor IA/);
});

test('las instrucciones tienen prioridad dentro del presupuesto y el artículo conserva el espacio restante',()=>{
  const api=runtimeApi(patched());
  const body='CONTENIDO '.repeat(2500);
  const out=api.contextFromEntry({code:'X',language:'japones',title:'Tema',target:'対象',professorProfilePrompt:PROFILE,plain:{lead:'Definición',look:'Nota'},body},{name:'Japonés'});
  assert.ok(out.content.length<=api.MAX_CLIENT_CONTEXT_CHARS);
  assert.match(out.content,/PERFIL ÚNICO/);
  assert.match(out.content,/Forma o tema objetivo:\n対象/);
  assert.match(out.content,/Detalles de referencia:\nCONTENIDO/);
  assert.ok(out.content.indexOf('PERFIL ÚNICO')<out.content.indexOf('Detalles de referencia'));
});

test('sin capas opcionales conserva definición ejemplo tema y contenido limpio',()=>{
  const api=runtimeApi(patched());
  const out=api.contextFromEntry({code:'A',language:'ruso',level:'A1',part:1,chapter:2,title:'Тема',target:'форма',plain:{lead:'Definición',example:'Пример',look:'Nota'},body:'Contenido de referencia'},{name:'Ruso'});
  assert.equal(out.definition,'Definición');
  assert.deepEqual(out.examples,['Пример']);
  assert.equal(out.title,'Тема');
  assert.match(out.content,/форма/);
  assert.match(out.content,/Contenido de referencia/);
  assert.doesNotMatch(out.content,/MLS_PROFESSOR_/);
});

test('optimización no introduce persistencia proveedor ni operaciones editoriales',()=>{
  const source=patched();
  const block=source.slice(source.indexOf("const PROMPT_OPTIMIZATION_VERSION='1.0'"),source.indexOf("const SUGGESTIONS_VERSION='1.0'"));
  assert.doesNotMatch(block,/fetch\(|D1|wiki_|publish|materialize|FIFO|AUTOOPT|localStorage|sessionStorage/i);
});
