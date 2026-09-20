'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const installer=require('../scripts/habilitar ux profesor ia.js');
const helperPath=path.join(__dirname,'..','MLS R32 OVERLAY','profesor ia ux.js');

function node(){const attrs={};return{attrs,dataset:{},setAttribute(k,v){attrs[k]=String(v);},getAttribute(k){return attrs[k]||'';}};}
function modalFixture(){const modal=node(),parts={status:node(),input:node(),send:node(),cancel:node(),close:node(),clear:node(),messages:node()};const map={'[data-ai-status]':parts.status,'[data-ai-input]':parts.input,'[data-ai-send]':parts.send,'[data-ai-cancel]':parts.cancel,'[data-ai-close]':parts.close,'[data-ai-clear]':parts.clear,'[data-ai-messages]':parts.messages};modal.querySelector=selector=>map[selector]||null;return{modal,parts};}
function apiWithDom(){const source=fs.readFileSync(helperPath,'utf8'),fixture=modalFixture(),elements={aiTutorModal:fixture.modal};const head={children:[],appendChild(el){this.children.push(el);if(el.id)elements[el.id]=el;}};const document={head,createElement(tag){return{id:'',tag,textContent:''};},getElementById(id){return elements[id]||null;}};const window={document,queueMicrotask(fn){fn();},MLS:{aiTutor:{open(){return'ok';}}}};const context={window,module:{exports:{}},exports:{},console};vm.runInNewContext(source,context,{filename:'profesor ia ux.js'});return{api:context.module.exports,window,fixture,head};}

test('estilos cumplen legibilidad, foundation D y objetivos táctiles',()=>{const {api}=apiWithDom();const css=api.STYLE_TEXT;assert.match(css,/font-size:max\(11pt,var\(--mls-font-size-body,1rem\)\)/);assert.match(css,/--mls-surface-panel-light/);assert.match(css,/--mls-text-primary/);assert.match(css,/--mls-control-height/);assert.match(css,/--mls-focus-color/);assert.match(css,/@media\(max-width:600px\)/);assert.match(css,/prefers-reduced-motion:reduce/);assert.doesNotMatch(css,/color:\s*#fff(?:fff)?\b/i);});

test('diálogo recibe semántica aria sin borrar etiquetas existentes',()=>{const {api,fixture}=apiWithDom();fixture.parts.send.setAttribute('aria-label','Etiqueta existente');assert.equal(api.enhanceDialog(fixture.modal),true);assert.equal(fixture.modal.attrs['aria-label'],'Profesor IA');assert.equal(fixture.parts.status.attrs.role,'status');assert.equal(fixture.parts.status.attrs['aria-live'],'polite');assert.equal(fixture.parts.messages.attrs.role,'log');assert.equal(fixture.parts.input.attrs['aria-label'],'Escribe una pregunta sobre esta entrada');assert.equal(fixture.parts.send.attrs['aria-label'],'Etiqueta existente');assert.equal(fixture.modal.dataset.professorUxVersion,'1.0');});

test('instalación es idempotente y mejora el modal después de abrir',()=>{const {api,window,fixture,head}=apiWithDom();assert.equal(window.MLS.aiTutor.professorUXVersion,'1.0');const wrapped=window.MLS.aiTutor.open;assert.equal(api.install(window.MLS),false);assert.equal(window.MLS.aiTutor.open,wrapped);assert.equal(window.MLS.aiTutor.open(),'ok');assert.equal(fixture.modal.dataset.professorUxVersion,'1.0');assert.equal(head.children.filter(x=>x.id==='mlsProfessorUXStyles').length,1);});

test('instalador de build agrega helper una sola vez',()=>{const helper=fs.readFileSync(helperPath,'utf8'),base='(()=>{window.MLS={aiTutor:{open(){}}};})();\n';const once=installer.patchAi(base,helper),twice=installer.patchAi(once,helper);assert.match(once,/MLSProfessorUX/);assert.equal(twice,once);});
