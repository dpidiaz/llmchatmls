'use strict';
const fs=require('node:fs');

const TARGET='public/js/ai.js';
const MARKER="const INTERNAL_LINKS_VERSION='1.0';";

function replaceOnce(source,needle,replacement,label){
  if(!source.includes(needle))throw new Error(`No se encontró el ancla de ${label}.`);
  return source.replace(needle,replacement);
}

function patchAi(source){
  source=String(source);
  if(source.includes(MARKER))return source;

  const anchor=`  function status(modal,msg,kind=''){`;
  const helpers=`  const INTERNAL_LINKS_VERSION='1.0';\n  function internalLinkSlug(entry,meta){return String((entry&&entry.language)||(meta&&meta.slug)||'').trim();}\n  function linkableForm(value){\n    const form=String(value||'').replace(/\\s+/g,' ').trim();\n    if(!form)return '';\n    const compact=form.replace(/\\s/g,'');\n    if(compact.length>=4)return form;\n    return /[\\u3040-\\u30ff\\u3400-\\u9fff\\uac00-\\ud7af]/u.test(form)?form:'';\n  }\n  function internalLinkCandidates(entry,meta){\n    const slug=internalLinkSlug(entry,meta),current=String(entry&&entry.code||''),chapter=String((entry&&entry.chapterNum)||(entry&&entry.chapter)||'');\n    const rows=(MLS.data&&MLS.data.byLanguage&&MLS.data.byLanguage[slug])||[],out=[];\n    for(const row of rows){\n      if(!row||String(row.code||'')===current)continue;\n      const sameChapter=chapter&&String(row.chapterNum||row.chapter||'')===chapter?1:0;\n      const title=linkableForm(row.title);if(title)out.push({form:title,code:row.code,title:row.title||title,rank:0,sameChapter});\n      const target=linkableForm(row.target);if(target&&target.toLocaleLowerCase()!==title.toLocaleLowerCase())out.push({form:target,code:row.code,title:row.title||target,rank:1,sameChapter});\n    }\n    return out.sort((a,b)=>a.rank-b.rank||b.sameChapter-a.sameChapter||b.form.length-a.form.length||String(a.code).localeCompare(String(b.code)));\n  }\n  function internalLinkMatches(content,entry,meta){\n    const raw=String(content||''),lower=raw.toLocaleLowerCase(),matches=[],seenCodes=new Set();\n    const overlaps=(start,end)=>matches.some(x=>start<x.end&&end>x.start);\n    for(const candidate of internalLinkCandidates(entry,meta)){\n      if(matches.length>=5)break;if(seenCodes.has(candidate.code))continue;\n      const needle=candidate.form.toLocaleLowerCase();let from=0,idx=-1;\n      while((idx=lower.indexOf(needle,from))>=0){\n        const end=idx+needle.length,before=idx>0?raw[idx-1]:'',after=end<raw.length?raw[end]:'';\n        const first=candidate.form[0]||'',last=candidate.form[candidate.form.length-1]||'';\n        const word=/[\\p{L}\\p{N}]/u;\n        const badBefore=word.test(first)&&word.test(before),badAfter=word.test(last)&&word.test(after);\n        if(!badBefore&&!badAfter&&!overlaps(idx,end)){matches.push({start:idx,end,code:candidate.code,title:candidate.title,label:raw.slice(idx,end)});seenCodes.add(candidate.code);break;}\n        from=idx+Math.max(1,needle.length);\n      }\n    }\n    return matches.sort((a,b)=>a.start-b.start||b.end-a.end);\n  }\n  function renderAssistantLinks(el,content,entry,meta){\n    if(!el)return;const raw=String(content||''),links=internalLinkMatches(raw,entry,meta);\n    if(!links.length){text(el,raw);return;}\n    el.replaceChildren();let cursor=0;\n    for(const link of links){\n      if(link.start>cursor)el.append(document.createTextNode(raw.slice(cursor,link.start)));\n      const a=document.createElement('a');a.href='#entry='+encodeURIComponent(link.code);a.className='ai-internal-link';a.textContent=link.label;a.title='Abrir entrada MLS: '+link.title;el.append(a);cursor=link.end;\n    }\n    if(cursor<raw.length)el.append(document.createTextNode(raw.slice(cursor)));\n  }\n`;
  source=replaceOnce(source,anchor,helpers+anchor,'helpers de enlaces internos');

  source=replaceOnce(source,
`      text(assistant.body,answer);\n      history.push({role:'assistant',content:answer});`,
`      renderAssistantLinks(assistant.body,answer,entry,meta);\n      history.push({role:'assistant',content:answer});`,
  'render final de respuesta');

  source=replaceOnce(source,
`    if(history.length)history.forEach(m=>addMessage(messages,m.role==='assistant'?'assistant':'user',m.content));`,
`    if(history.length)history.forEach(m=>{const rendered=addMessage(messages,m.role==='assistant'?'assistant':'user',m.content);if(m.role==='assistant')renderAssistantLinks(rendered.body,m.content,entry,meta);});`,
  'render de historial');

  source=replaceOnce(source,
`  MLS.aiTutor={open,professorConversationVersion:CONVERSATION_VERSION,professorSuggestionsVersion:SUGGESTIONS_VERSION,suggestionsFor};`,
`  MLS.aiTutor={open,professorConversationVersion:CONVERSATION_VERSION,professorSuggestionsVersion:SUGGESTIONS_VERSION,suggestionsFor,professorInternalLinksVersion:INTERNAL_LINKS_VERSION,internalLinkMatches};`,
  'versión de enlaces internos');

  return source;
}

function main(){
  if(!fs.existsSync(TARGET))throw new Error('No se encontró public/js/ai.js después de extraer el bundle R32.');
  fs.writeFileSync(TARGET,patchAi(fs.readFileSync(TARGET,'utf8')),'utf8');
  console.log('Enlaces internos seguros del Profesor IA habilitados.');
}

module.exports={patchAi,MARKER};
if(require.main===module)main();
