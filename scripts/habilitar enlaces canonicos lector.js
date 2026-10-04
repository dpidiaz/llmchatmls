'use strict';
const fs=require('node:fs');
const TARGET='public/js/core.js';
const MARKER='/* MLS canonical reader links 1.0 */';
const LINK_INLINE=String.raw`const linkInline=s=>inline(s).split(/(<code>.*?<\/code>)/g).map((part,i)=>i%2?part:part.replace(/\[([^\]]+)\]\(#(?:(?:entry|entrada)-(\d+)|entry=(MLS-V\d{2}-\d{4}))\)/gi,(m,t,n,code)=>{const x=code?MLS.data.idxByCode[code.toUpperCase()]:MLS.data.idxByLangN[language+':'+Number(n)];return x?'<a href="#entry='+escAttr(x.code)+'">'+t+'</a>':t})).join('');`;
function patchCore(source){
if(source.includes(MARKER))return source;
const start=source.indexOf('const linkInline=s=>');
const end=source.indexOf('const lines=String(md)',start);
if(start<0||end<0)throw new Error('No se encontró el renderizador Markdown del lector.');
return source.slice(0,start)+MARKER+LINK_INLINE+source.slice(end);
}
if(require.main===module){fs.writeFileSync(TARGET,patchCore(fs.readFileSync(TARGET,'utf8')));console.log('Enlaces canónicos del lector habilitados.');}
module.exports={patchCore};
