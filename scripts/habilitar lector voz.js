'use strict';
const fs = require('node:fs');

const readerPath = 'public/js/reader.js';

function replaceFirstAvailable(source, candidates, replacement, label) {
  if (source.includes(replacement)) return source;
  for (const search of candidates) {
    const first = source.indexOf(search);
    if (first < 0) continue;
    if (source.indexOf(search, first + search.length) >= 0) {
      throw new Error(`El bloque para ${label} aparece más de una vez.`);
    }
    return source.slice(0, first) + replacement + source.slice(first + search.length);
  }
  throw new Error(`No se encontró el bloque esperado para ${label}.`);
}

function patchReader(input) {
  let source=String(input);

  source = replaceFirstAvailable(
    source,
    [
      "  let manifestTask=null;",
      "  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));"
    ],
    `  let manifestTask=null;
  const speechController={code:null,utterance:null,state:'idle'};
  const speechLanguage='es-GT';
  function updateListenButton(){
    const button=document.getElementById('listenBtn');
    if(!button)return;
    button.textContent=speechController.state==='playing'?'⏸ Pausar':speechController.state==='paused'?'▶ Continuar':'▶ Escuchar';
    button.setAttribute('aria-pressed',speechController.state==='playing'?'true':'false');
  }
  function speechWithoutRelatedSections(value){
    return String(value||'')
      .replace(/(?:^|\\n)\\s*#{1,6}\\s*(?:también mira|entradas relacionadas|temas relacionados|véase también|relacionados?)\\b[\\s\\S]*$/imu,'')
      .replace(/(?:^|\\n)\\s*(?:también mira|entradas relacionadas|temas relacionados|véase también)\\s*:?\\s*(?:\\n[\\s\\S]*)?$/imu,'')
      .trim();
  }
  function cancelSpeech(){
    if('speechSynthesis' in window)window.speechSynthesis.cancel();
    speechController.code=null;
    speechController.utterance=null;
    speechController.state='idle';
    updateListenButton();
  }
  function toggleSpeech(code,text){
    if(!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined'){
      MLS.speak?.(text);
      return;
    }
    const synth=window.speechSynthesis;
    if(speechController.code===code&&speechController.state==='playing'){
      synth.pause();speechController.state='paused';updateListenButton();return;
    }
    if(speechController.code===code&&speechController.state==='paused'){
      synth.resume();speechController.state='playing';updateListenButton();return;
    }
    synth.cancel();
    const utterance=new SpeechSynthesisUtterance(text);
    const lang=speechLanguage;
    utterance.lang=lang;
    const voices=synth.getVoices();
    const exact=voices.find(voice=>String(voice.lang||'').toLowerCase()===lang.toLowerCase());
    const base=lang.split('-')[0].toLowerCase();
    const fallback=voices.find(voice=>String(voice.lang||'').toLowerCase().startsWith(base));
    if(exact||fallback)utterance.voice=exact||fallback;
    speechController.code=code;
    speechController.utterance=utterance;
    speechController.state='playing';
    utterance.onend=utterance.onerror=()=>{
      if(speechController.utterance!==utterance)return;
      speechController.code=null;speechController.utterance=null;speechController.state='idle';updateListenButton();
    };
    synth.speak(utterance);
    updateListenButton();
  }`,
    'control de reproducción de voz'
  );

  source = replaceFirstAvailable(
    source,
    [
      "    if(entryChanged)scrollPageToAbsoluteTop();",
      "    if(entryChanged){cancelSpeech();scrollPageToAbsoluteTop();}"
    ],
    "    if(entryChanged){cancelSpeech();scrollPageToAbsoluteTop();}",
    'cancelación de voz al cambiar de entrada'
  );

  source = replaceFirstAvailable(
    source,
    [
      '<button class="btn primary" id="listenBtn">🔊 Escuchar</button>',
      '<button class="btn primary" id="listenBtn" aria-pressed="false">▶ Escuchar</button>'
    ],
    '<button class="btn primary" id="listenBtn" aria-pressed="false">▶ Escuchar</button>',
    'etiqueta inicial del botón escuchar'
  );

  const canonicalSpeech = `    const speechFor=entry=>[entry.title,speechWithoutRelatedSections(entry.articleMarkdown)].filter(Boolean).join('. ');
    document.getElementById('listenBtn').onclick=()=>toggleSpeech(normalized,stripSpeak(speechFor(e)));
    updateListenButton();`;

  if (!source.includes(canonicalSpeech)) {
    const canonicalOld = `    const speechFor=entry=>[entry.title,entry.articleMarkdown].filter(Boolean).join('. ');
    document.getElementById('listenBtn').onclick=()=>MLS.speak(stripSpeak(speechFor(e)));`;
    const legacyOld = `    const speechFor=entry=>[entry.title,entry.articleMarkdown||entry.auditedBody||entry.body||entry.definition||easy.lead,stripSpeak(easy.example)].filter(Boolean).join('. ');
    document.getElementById('listenBtn').onclick=()=>MLS.speak(stripSpeak(speechFor(activeTutorEntry)));`;
    if(source.includes(canonicalOld)){
      source=source.replace(canonicalOld,canonicalSpeech);
    }else if(source.includes(legacyOld)){
      source=source.replace(legacyOld,`    const speechFor=entry=>[entry.title,speechWithoutRelatedSections(entry.articleMarkdown||entry.auditedBody||entry.body||entry.definition||easy.lead),stripSpeak(easy.example)].filter(Boolean).join('. ');
    document.getElementById('listenBtn').onclick=()=>toggleSpeech(code,stripSpeak(speechFor(activeTutorEntry)));
    updateListenButton();`);
    }else{
      throw new Error('No se encontró el bloque esperado para botón play/pausa.');
    }
  }

  return source;
}

function main(){
  const source=fs.readFileSync(readerPath,'utf8');
  fs.writeFileSync(readerPath,patchReader(source),'utf8');
  console.log('Lector de voz MLS actualizado para contenido canónico: español de Guatemala, play/pausa/reanudar y exclusión de relacionados.');
}

module.exports={patchReader};
if(require.main===module)main();
