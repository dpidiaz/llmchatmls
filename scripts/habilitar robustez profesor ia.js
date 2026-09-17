'use strict';
const fs=require('node:fs');

const TARGET='public/js/ai.js';
const MARKER="const ROBUSTNESS_VERSION='1.0';";

function replaceOnce(source,needle,replacement,label){
  if(!source.includes(needle))throw new Error(`No se encontró el ancla de ${label}.`);
  return source.replace(needle,replacement);
}
function replaceBetween(source,startNeedle,endNeedle,replacement,label){
  const start=source.indexOf(startNeedle),end=source.indexOf(endNeedle,start+startNeedle.length);
  if(start<0||end<0)throw new Error(`No se encontró el bloque de ${label}.`);
  return source.slice(0,start)+replacement+source.slice(end);
}

function patchAi(source){
  source=String(source);
  if(source.includes(MARKER))return source;

  source=replaceOnce(source,
`  function setBusy(modal,busy){\n    const send=modal.querySelector('[data-ai-send]'),input=modal.querySelector('[data-ai-input]');\n    if(send)send.disabled=busy;\n    if(input)input.disabled=busy;\n    modal.dataset.aiBusy=busy?'1':'0';\n  }`,
`  function setBusy(modal,busy){\n    const send=modal.querySelector('[data-ai-send]'),input=modal.querySelector('[data-ai-input]'),cancel=modal.querySelector('[data-ai-cancel]');\n    if(send)send.disabled=busy;\n    if(input)input.disabled=busy;\n    if(cancel)cancel.hidden=!busy;\n    modal.dataset.aiBusy=busy?'1':'0';\n    modal.dataset.aiState=busy?'responding':'ready';\n  }`,
  'estado busy');

  const askStart=`  async function ask(entry,meta,question,modal,{automatic=false}={}){`;
  const openStart=`  function open(entry,meta){`;
  const robustBlock=`  const ROBUSTNESS_VERSION='1.0';\n  const REQUEST_TIMEOUT_MS=45000;\n  const requestControllers=new WeakMap();\n  function classifyProfessorError(error){\n    const statusCode=Number(error&&error.status||0),raw=String(error&&error.message||error||'');\n    if(error&&error.kind==='timeout')return 'La respuesta tardó demasiado. Puedes intentarlo de nuevo.';\n    if(error&&error.kind==='cancel')return 'Consulta cancelada. Puedes reintentarla si quieres.';\n    if(statusCode===429||/quota|limit|neuron|rate limit|too many/i.test(raw))return 'Se alcanzó temporalmente el límite disponible del Profesor IA. Intenta de nuevo más tarde.';\n    if(statusCode===502||statusCode===503||statusCode===504||/unavailable|capacity|overloaded|provider/i.test(raw))return 'El Profesor IA no está disponible temporalmente. Tu pregunta se conserva para reintentar.';\n    if(statusCode===404)return 'El Profesor IA no está conectado correctamente en este despliegue.';\n    if(/Failed to fetch|NetworkError|network|fetch failed/i.test(raw))return 'No pude conectar con el Profesor IA. Revisa tu conexión e inténtalo de nuevo.';\n    if(/no devolvió|empty|vac[ií]a|respuesta útil/i.test(raw))return 'No recibí una respuesta útil. Puedes reintentar la misma pregunta.';\n    return raw?('No pude obtener la explicación: '+raw):'No pude obtener la explicación en este momento.';\n  }\n  function abortModal(modal,reason='cancel'){\n    const active=requestControllers.get(modal);if(!active)return false;\n    active.reason=reason;try{active.controller.abort()}catch(_){}return true;\n  }\n  function showRetry(modal,message,retry){\n    const el=modal.querySelector('[data-ai-status]');if(!el)return;\n    el.className='ai-status error';el.replaceChildren();\n    const span=make('span','');text(span,message);el.append(span);\n    if(typeof retry==='function'){const button=make('button','btn');button.type='button';button.dataset.aiRetry='1';text(button,'Reintentar');button.onclick=retry;el.append(button);}\n  }\n  async function ask(entry,meta,question,modal,{automatic=false,reuseUser=false}={}){\n    if(modal.dataset.aiBusy==='1')return;\n    const q=String(question||'').trim();\n    if(!online()){status(modal,'Necesitas conexión a Internet para consultar al Profesor IA.','error');return}\n    const history=sessionFor(entry,meta),messages=modal.querySelector('[data-ai-messages]'),input=modal.querySelector('[data-ai-input]');\n    let userWasAdded=false;\n    if(!automatic&&q){\n      if(!reuseUser)addMessage(messages,'user',q);\n      history.push({role:'user',content:q});persistSession(entry,meta,history);userWasAdded=true;\n    }\n    if(input)input.value='';\n    setBusy(modal,true);\n    status(modal,automatic?'Preparando una explicación de esta entrada…':'Pensando en tu pregunta…','loading');\n    const assistant=addMessage(messages,'assistant','');assistant.row.classList.add('ai-streaming');\n    const controller=new AbortController(),active={controller,reason:'active'},timer=setTimeout(()=>{active.reason='timeout';controller.abort();},REQUEST_TIMEOUT_MS);\n    requestControllers.set(modal,active);\n    let answer='';\n    const retry=()=>ask(entry,meta,q,modal,{automatic,reuseUser:!automatic&&!!q});\n    try{\n      const response=await fetch('/api/chat',{\n        method:'POST',signal:controller.signal,\n        headers:{'content-type':'application/json','accept':'text/event-stream'},\n        body:JSON.stringify({entry:contextFromEntry(entry,meta),messages:history.slice(-MAX_HISTORY)})\n      });\n      if(!response.ok){const err=new Error(await errorMessage(response));err.status=response.status;throw err;}\n      await streamAnswer(response,piece=>{\n        if(controller.signal.aborted||!modal.isConnected)return;answer+=piece;text(assistant.body,answer);messages.scrollTop=messages.scrollHeight;\n      });\n      answer=answer.trim();if(!answer){const err=new Error('La IA no devolvió una respuesta útil.');err.kind='empty';throw err;}\n      if(controller.signal.aborted||!modal.isConnected)return;\n      renderAssistantLinks(assistant.body,answer,entry,meta);history.push({role:'assistant',content:answer});persistSession(entry,meta,history);status(modal,'');\n    }catch(err){\n      assistant.row.remove();\n      if(userWasAdded&&history[history.length-1]?.role==='user'&&history[history.length-1]?.content===q){history.pop();persistSession(entry,meta,history);}\n      const reason=active.reason;\n      if(!modal.isConnected&&(reason==='close'||reason==='entry-change'))return;\n      if(err&&err.name==='AbortError'){err={kind:reason==='timeout'?'timeout':'cancel',message:String(err.message||'')};}\n      showRetry(modal,classifyProfessorError(err),retry);\n    }finally{\n      clearTimeout(timer);if(requestControllers.get(modal)===active)requestControllers.delete(modal);\n      assistant.row.classList.remove('ai-streaming');setBusy(modal,false);if(modal.isConnected)input?.focus();\n    }\n  }\n`;
  source=replaceBetween(source,askStart,openStart,robustBlock, 'ask robusto');

  source=replaceOnce(source,
`  function open(entry,meta){\n    document.getElementById('aiTutorModal')?.remove();`,
`  function open(entry,meta){\n    const previous=document.getElementById('aiTutorModal');if(previous){abortModal(previous,'entry-change');previous.remove();document.body.classList.remove('ai-open');}`,
  'apertura y cancelación previa');

  source=replaceOnce(source,
`      <form class="ai-compose" data-ai-form><textarea data-ai-input rows="2" maxlength="1200" placeholder="Pregunta algo sobre este tema…"></textarea><button class="btn primary" data-ai-send type="submit">Preguntar</button></form>`,
`      <form class="ai-compose" data-ai-form><textarea data-ai-input rows="2" maxlength="1200" placeholder="Pregunta algo sobre este tema…"></textarea><button class="btn" data-ai-cancel type="button" hidden>Cancelar</button><button class="btn primary" data-ai-send type="submit">Preguntar</button></form>`,
  'botón cancelar');

  source=replaceOnce(source,
`    const close=()=>{modal.remove();document.body.classList.remove('ai-open')};\n    modal.querySelector('[data-ai-close]').onclick=close;`,
`    let onHashChange=null;\n    const close=(reason='close')=>{abortModal(modal,reason);if(onHashChange)window.removeEventListener('hashchange',onHashChange);modal.remove();document.body.classList.remove('ai-open')};\n    onHashChange=()=>close('entry-change');window.addEventListener('hashchange',onHashChange);\n    modal.querySelector('[data-ai-close]').onclick=()=>close('close');\n    modal.querySelector('[data-ai-cancel]').onclick=()=>abortModal(modal,'user-cancel');`,
  'cierre y cancelación');

  source=replaceOnce(source,
`  MLS.aiTutor={open,professorConversationVersion:CONVERSATION_VERSION,professorSuggestionsVersion:SUGGESTIONS_VERSION,suggestionsFor,professorInternalLinksVersion:INTERNAL_LINKS_VERSION,internalLinkMatches};`,
`  MLS.aiTutor={open,professorConversationVersion:CONVERSATION_VERSION,professorSuggestionsVersion:SUGGESTIONS_VERSION,suggestionsFor,professorInternalLinksVersion:INTERNAL_LINKS_VERSION,internalLinkMatches,professorRobustnessVersion:ROBUSTNESS_VERSION,classifyProfessorError};`,
  'versión de robustez');

  return source;
}

function main(){
  if(!fs.existsSync(TARGET))throw new Error('No se encontró public/js/ai.js después de extraer el bundle R32.');
  fs.writeFileSync(TARGET,patchAi(fs.readFileSync(TARGET,'utf8')),'utf8');
  console.log('Robustez del Profesor IA habilitada.');
}
module.exports={patchAi,MARKER};
if(require.main===module)main();
