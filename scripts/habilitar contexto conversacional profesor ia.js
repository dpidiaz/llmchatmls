'use strict';
const fs=require('node:fs');

const TARGET='public/js/ai.js';
const MARKER="const CONVERSATION_VERSION='1.0';";

function replaceOnce(source,needle,replacement,label){
  if(!source.includes(needle))throw new Error(`No se encontró el ancla de ${label}.`);
  return source.replace(needle,replacement);
}

function patchAi(source){
  source=String(source);
  if(source.includes(MARKER))return source;

  source=replaceOnce(source,
`  const sessions=new Map();\n  const MAX_HISTORY=16;`,
`  const sessions=new Map();\n  const CONVERSATION_VERSION='1.0';\n  const MAX_HISTORY=10;\n  const MAX_HISTORY_CHARS=8000;\n\n  function conversationSlug(entry,meta){\n    return String((entry&&entry.language)||(meta&&meta.slug)||'neutral').trim()||'neutral';\n  }\n  function conversationKey(entry,meta){\n    const slug=conversationSlug(entry,meta),code=String(entry&&entry.code||'unknown').trim()||'unknown';\n    return \`mls.profesor.conversation.v1:\${slug}:\${code}\`;\n  }\n  function sessionStorageSafe(){\n    try{return window.sessionStorage||null}catch(_){return null}\n  }\n  function boundedHistory(list){\n    const source=Array.isArray(list)?list:[],out=[];let chars=0;\n    for(let i=source.length-1;i>=0&&out.length<MAX_HISTORY;i--){\n      const item=source[i]||{},role=item.role==='assistant'?'assistant':'user';\n      let content=String(item.content||'').trim();if(!content)continue;\n      if(content.length>MAX_HISTORY_CHARS)content=content.slice(-MAX_HISTORY_CHARS);\n      if(chars+content.length>MAX_HISTORY_CHARS&&out.length)break;\n      if(chars+content.length>MAX_HISTORY_CHARS)content=content.slice(-(MAX_HISTORY_CHARS-chars));\n      out.push({role,content});chars+=content.length;\n    }\n    return out.reverse();\n  }\n  function readStored(key){\n    const storage=sessionStorageSafe();if(!storage)return [];\n    try{return boundedHistory(JSON.parse(storage.getItem(key)||'[]'))}catch(_){return []}\n  }\n  function writeStored(key,history){\n    const storage=sessionStorageSafe();if(!storage)return;\n    try{storage.setItem(key,JSON.stringify(history))}catch(_){}\n  }\n  function conversationSessionFor(entry,meta){\n    const key=conversationKey(entry,meta);\n    if(!sessions.has(key))sessions.set(key,readStored(key));\n    return sessions.get(key);\n  }\n  function persistSession(entry,meta,history){\n    const bounded=boundedHistory(history);history.splice(0,history.length,...bounded);\n    writeStored(conversationKey(entry,meta),history);return history;\n  }\n  function clearSession(entry,meta){\n    const key=conversationKey(entry,meta),current=sessions.get(key);\n    if(current)current.splice(0,current.length);sessions.delete(key);\n    const storage=sessionStorageSafe();if(storage){try{storage.removeItem(key)}catch(_){}}\n  }`,
  'almacenamiento conversacional');

  source=replaceOnce(source,
`    const history=sessionFor(entry.code),messages=modal.querySelector('[data-ai-messages]'),input=modal.querySelector('[data-ai-input]');`,
`    const history=conversationSessionFor(entry,meta),messages=modal.querySelector('[data-ai-messages]'),input=modal.querySelector('[data-ai-input]');`,
  'historial de ask');

  source=replaceOnce(source,
`      history.push({role:'user',content:q});\n      userWasAdded=true;`,
`      history.push({role:'user',content:q});\n      persistSession(entry,meta,history);\n      userWasAdded=true;`,
  'persistencia de pregunta');

  source=replaceOnce(source,
`      history.push({role:'assistant',content:answer});\n      if(history.length>MAX_HISTORY*2)history.splice(0,history.length-MAX_HISTORY*2);`,
`      history.push({role:'assistant',content:answer});\n      persistSession(entry,meta,history);`,
  'persistencia de respuesta');

  source=replaceOnce(source,
`      if(userWasAdded&&history[history.length-1]?.role==='user'&&history[history.length-1]?.content===q)history.pop();`,
`      if(userWasAdded&&history[history.length-1]?.role==='user'&&history[history.length-1]?.content===q){history.pop();persistSession(entry,meta,history);}`,
  'rollback de pregunta fallida');

  source=replaceOnce(source,
`      <div class="ai-context"><span>Estás consultando</span><strong></strong></div>`,
`      <div class="ai-context"><span>Estás consultando</span><strong></strong><button type="button" class="btn" data-ai-clear aria-label="Limpiar conversación de esta entrada">Limpiar conversación</button></div>`,
  'botón limpiar conversación');

  source=replaceOnce(source,
`    const messages=modal.querySelector('[data-ai-messages]'),history=sessionFor(entry.code);`,
`    const messages=modal.querySelector('[data-ai-messages]'),history=conversationSessionFor(entry,meta);`,
  'historial de open');

  source=replaceOnce(source,
`    modal.querySelector('[data-ai-close]').onclick=close;`,
`    modal.querySelector('[data-ai-close]').onclick=close;\n    modal.querySelector('[data-ai-clear]').onclick=()=>{clearSession(entry,meta);messages.replaceChildren();status(modal,'Conversación limpiada para esta entrada.');modal.querySelector('[data-ai-input]')?.focus();};`,
  'acción limpiar conversación');

  source=replaceOnce(source,
`  MLS.aiTutor={open};`,
`  MLS.aiTutor={open,professorConversationVersion:CONVERSATION_VERSION};`,
  'versión de conversación');

  return source;
}

function main(){
  if(!fs.existsSync(TARGET))throw new Error('No se encontró public/js/ai.js después de extraer el bundle R32.');
  const original=fs.readFileSync(TARGET,'utf8');
  fs.writeFileSync(TARGET,patchAi(original),'utf8');
  console.log('Contexto conversacional corto del Profesor IA habilitado.');
}

module.exports={patchAi,MARKER};
if(require.main===module)main();
