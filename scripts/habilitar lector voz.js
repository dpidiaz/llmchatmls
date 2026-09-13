import fs from "node:fs";

const readerPath = "public/js/reader.js";
let source = fs.readFileSync(readerPath, "utf8");

function replaceOnce(text, search, replacement, label) {
  if (text.includes(replacement)) return text;
  const first = text.indexOf(search);
  if (first < 0) throw new Error(`No se encontró el bloque esperado para ${label}.`);
  if (text.indexOf(search, first + search.length) >= 0) throw new Error(`El bloque para ${label} aparece más de una vez.`);
  return text.slice(0, first) + replacement + text.slice(first + search.length);
}

source = replaceOnce(
  source,
  `  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));`,
  `  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));\n  const speechController={code:null,utterance:null,state:'idle'};\n  const speechLanguage={\n    'espanol-guatemala':'es-GT',\n    'ingles':'en-US',\n    'portugues':'pt-BR',\n    'italiano':'it-IT',\n    'frances':'fr-FR',\n    'aleman':'de-DE',\n    'japones':'ja-JP',\n    'chino-taiwan':'zh-TW',\n    'coreano':'ko-KR',\n    'ruso':'ru-RU'\n  };\n  function updateListenButton(){\n    const button=document.getElementById('listenBtn');\n    if(!button)return;\n    button.textContent=speechController.state==='playing'?'⏸ Pausar':speechController.state==='paused'?'▶ Continuar':'▶ Escuchar';\n    button.setAttribute('aria-pressed',speechController.state==='playing'?'true':'false');\n  }\n  function speechWithoutRelatedSections(value){\n    return String(value||'')\n      .replace(/(?:^|\\n)\\s*#{1,6}\\s*(?:también mira|entradas relacionadas|temas relacionados|véase también|relacionados?)\\b[\\s\\S]*$/imu,'')\n      .replace(/(?:^|\\n)\\s*(?:también mira|entradas relacionadas|temas relacionados|véase también)\\s*:?\\s*(?:\\n[\\s\\S]*)?$/imu,'')\n      .trim();\n  }\n  function cancelSpeech(){\n    if('speechSynthesis' in window)window.speechSynthesis.cancel();\n    speechController.code=null;\n    speechController.utterance=null;\n    speechController.state='idle';\n    updateListenButton();\n  }\n  function toggleSpeech(code,text,language){\n    if(!('speechSynthesis' in window)||typeof SpeechSynthesisUtterance==='undefined'){\n      MLS.speak?.(text);\n      return;\n    }\n    const synth=window.speechSynthesis;\n    if(speechController.code===code&&speechController.state==='playing'){\n      synth.pause();\n      speechController.state='paused';\n      updateListenButton();\n      return;\n    }\n    if(speechController.code===code&&speechController.state==='paused'){\n      synth.resume();\n      speechController.state='playing';\n      updateListenButton();\n      return;\n    }\n    synth.cancel();\n    const utterance=new SpeechSynthesisUtterance(text);\n    const lang=speechLanguage[language]||'es-GT';\n    utterance.lang=lang;\n    const voices=synth.getVoices();\n    const exact=voices.find(voice=>String(voice.lang||'').toLowerCase()===lang.toLowerCase());\n    const base=lang.split('-')[0].toLowerCase();\n    const fallback=voices.find(voice=>String(voice.lang||'').toLowerCase().startsWith(base));\n    if(exact||fallback)utterance.voice=exact||fallback;\n    speechController.code=code;\n    speechController.utterance=utterance;\n    speechController.state='playing';\n    utterance.onend=()=>{\n      if(speechController.utterance!==utterance)return;\n      speechController.code=null;\n      speechController.utterance=null;\n      speechController.state='idle';\n      updateListenButton();\n    };\n    utterance.onerror=()=>{\n      if(speechController.utterance!==utterance)return;\n      speechController.code=null;\n      speechController.utterance=null;\n      speechController.state='idle';\n      updateListenButton();\n    };\n    synth.speak(utterance);\n    updateListenButton();\n  }`,
  "control de reproducción de voz"
);

source = replaceOnce(
  source,
  `    if(entryChanged)scrollPageToAbsoluteTop();`,
  `    if(entryChanged){cancelSpeech();scrollPageToAbsoluteTop();}`,
  "cancelación de voz al cambiar de entrada"
);

source = replaceOnce(
  source,
  `<button class="btn primary" id="listenBtn">🔊 Escuchar</button>`,
  `<button class="btn primary" id="listenBtn" aria-pressed="false">▶ Escuchar</button>`,
  "etiqueta inicial del botón escuchar"
);

source = replaceOnce(
  source,
  `    const speechFor=entry=>[entry.title,entry.articleMarkdown||entry.auditedBody||entry.body||entry.definition||easy.lead,stripSpeak(easy.example)].filter(Boolean).join('. ');\n    document.getElementById('listenBtn').onclick=()=>MLS.speak(stripSpeak(speechFor(activeTutorEntry)));`,
  `    const speechFor=entry=>[entry.title,speechWithoutRelatedSections(entry.articleMarkdown||entry.auditedBody||entry.body||entry.definition||easy.lead),stripSpeak(easy.example)].filter(Boolean).join('. ');\n    document.getElementById('listenBtn').onclick=()=>toggleSpeech(code,stripSpeak(speechFor(activeTutorEntry)),activeTutorEntry.language||e.language);\n    updateListenButton();`,
  "botón play pausa y exclusión de relacionados"
);

fs.writeFileSync(readerPath, source, "utf8");
console.log("Lector de voz MLS actualizado: play/pausa/reanudar y exclusión de entradas relacionadas.");
