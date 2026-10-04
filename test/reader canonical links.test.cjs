'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const {patchCore}=require('../scripts/habilitar enlaces canonicos lector.js');
const original=execFileSync('tar',['-xOzf','MASTER LANGUAGE SYSTEM REVISION 32 BUNDLE.tar.gz','public/js/core.js'],{encoding:'utf8'});
const entries=[];
for(const language of fs.readdirSync('content')){
const directory=path.join('content',language);
if(!fs.statSync(directory).isDirectory())continue;
for(const file of fs.readdirSync(directory))if(/^MLS-V\d{2}-\d{4}\.json$/.test(file))entries.push(JSON.parse(fs.readFileSync(path.join(directory,file),'utf8')));
}
function renderer(source){
const context={window:{},MLS_META:[],MLS_INDEX:entries,localStorage:{getItem:()=>null},document:{getElementById:()=>null,body:{dataset:{},classList:{toggle(){}}}}};
vm.runInNewContext(source,context);return context.window.MLS;
}
const mls=renderer(patchCore(original)),render=mls.renderMarkdown;
const reader=fs.readFileSync('MLS R32 OVERLAY/reader.js','utf8');
const normalize=vm.runInNewContext('('+reader.slice(reader.indexOf('function normalizeArticleMarkdown('),reader.indexOf('function relatedFromMarkdown(')).trim()+')');
test('reproduces broken canonical links and repairs the original example',()=>{
const markdown=normalize(entries.find(e=>e.code==='MLS-V01-0001').articleMarkdown,'MLS-V01');
assert.doesNotMatch(renderer(original).renderMarkdown(markdown,'ingles'),/<a href="#entry=MLS-V01-0002">/);
assert.match(render(markdown,'ingles'),/<a href="#entry=MLS-V01-0002">Mayúsculas/);
});
test('preserves legacy links, formatting, and cross-language canonical links',()=>{
const html=render('[**Inglés**](#entry-2) [Português](#entry=mls-v02-0001) [旧](#entrada-3)','ingles');
assert.match(html,/<a href="#entry=MLS-V01-0002"><strong>Inglés<\/strong><\/a>/);
assert.match(html,/<a href="#entry=MLS-V02-0001">Português<\/a>/);
assert.match(html,/<a href="#entry=MLS-V01-0003">旧<\/a>/);
});
test('does not activate code examples, nonexistent entries, HTML, or unsafe URLs',()=>{
const tick=String.fromCharCode(96);
const html=render(tick+'[Ejemplo](#entry=MLS-V01-0002)'+tick+' [Falta](#entry=MLS-V99-9999) [<img src=x onerror=alert(1)>](#entry=MLS-V01-0002) [Mal](javascript:alert(1))','ingles');
assert.match(html,/<code>\[Ejemplo\]\(#entry=MLS-V01-0002\)<\/code>/);
assert.doesNotMatch(html,/href="#entry=MLS-V99|href="javascript:|<img/);
assert.equal((html.match(/<a /g)||[]).length,1);
});
test('patch is idempotent and included in the production build',()=>{
assert.equal(patchCore(patchCore(original)),patchCore(original));
assert.throws(()=>patchCore('changed upstream'),/renderizador/);
assert.match(JSON.parse(fs.readFileSync('package.json','utf8')).scripts.predeploy,/habilitar enlaces canonicos lector\.js/);
});
test('audits all 10133 canonical articles across ten languages',()=>{
assert.equal(entries.length,10133);
const byCode=new Set(entries.map(e=>e.code)),summary={},broken=[];
for(const entry of entries){
const row=summary[entry.language]??={entries:0,articlesWithLinks:0,links:0,broken:0};row.entries++;
const markdown=normalize(entry.articleMarkdown,entry.code.slice(0,7));
const readable=mls.stripCourseSections(markdown).replace(/\x60[^\x60]+\x60/g,'');
const links=[...readable.matchAll(/\[([^\]]+)\]\(#(?:(?:entry|entrada)-(\d+)|entry=(MLS-V\d{2}-\d{4}))\)/gi)];
if(links.length)row.articlesWithLinks++;
const visible=render(markdown,entry.language).replace(/<code>.*?<\/code>/g,'');
let expected=0;
for(const link of links){
const code=link[3]?.toUpperCase()||(entry.code.slice(0,7)+'-'+String(Number(link[2])).padStart(4,'0'));
row.links++;
if(!byCode.has(code)){row.broken++;broken.push({from:entry.code,to:code});continue;}expected++;
}
assert.equal((visible.match(/<a href="#entry=/g)||[]).length,expected,entry.code);
assert.doesNotMatch(visible,/\[[^\]]+\]\(#entry=MLS-V\d{2}-\d{4}\)/,entry.code);
for(const href of visible.matchAll(/<a href="#entry=([^"]+)">/g))assert.ok(byCode.has(href[1]),entry.code+' -> '+href[1]);
}
assert.equal(Object.keys(summary).length,10);
console.log('READER_LINK_AUDIT '+JSON.stringify({summary,broken}));
});
