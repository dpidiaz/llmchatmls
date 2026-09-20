'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const test=require('node:test');
const vm=require('node:vm');

const html=fs.readFileSync('MLS R32 OVERLAY/traductor.html','utf8');
const sw=fs.readFileSync('MLS R32 OVERLAY/sw.js','utf8');
const installer=require('../scripts/habilitar traductor pronunciacion.js');

test('Translator exposes a dedicated accessible route shell',()=>{
  assert.match(html,/<title>Traductor · MASTER LANGUAGE SYSTEM<\/title>/);
  assert.match(html,/id="translatorApp"/);
  assert.match(html,/Saltar al Traductor/);
  assert.match(html,/role="tablist"/);
  assert.match(html,/>Traducir<\/button>/);
  assert.match(html,/>Pronunciar<\/button>/);
});

test('Translator reuses all ten canonical MLS language slugs',()=>{
  for(const slug of ['espanol-guatemala','ingles','portugues','italiano','frances','aleman','japones','chino-taiwan','coreano','ruso']){
    assert.match(html,new RegExp(slug.replace(/[.*+?^$()|[\]\\]/g,'\\$&')));
  }
});

test('slow speech is a first-class mode rather than playback-rate postprocessing',()=>{
  assert.match(html,/const NORMAL_RATE=1;/);
  assert.match(html,/const SLOW_RATE=0\.65;/);
  assert.match(html,/new SpeechSynthesisUtterance\(text\)/);
  assert.match(html,/utterance\.rate=mode==='slow'\?SLOW_RATE:NORMAL_RATE/);
  assert.match(html,/>Escuchar lento<\/button>/);
  assert.doesNotMatch(html,/playbackRate/);
});

test('speech always cancels the previous queue before speaking',()=>{
  assert.match(html,/window\.speechSynthesis\.cancel\(\);\s*const utterance=new SpeechSynthesisUtterance/);
  assert.match(html,/data-repeat/);
  assert.match(html,/data-stop/);
});

test('voice selection prefers locale-compatible local services',()=>{
  assert.match(html,/voice\.localService===true/);
  assert.match(html,/local\.find\(voice=>exact\.includes\(normalizedTag\(voice\.lang\)\)\)/);
  assert.match(html,/localOnly/);
  assert.match(html,/zh-TW/);
  assert.match(html,/pt-BR/);
});

test('Translator never claims browser speech API alone proves offline speech',()=>{
  assert.match(html,/Puede funcionar sin Internet, pero MLS no la marcará como verificada hasta una prueba real en modo avión/);
  assert.match(html,/puede requerir conexión/);
});

test('pronunciation guide degrades safely for ambiguous scripts',()=>{
  assert.match(html,/La lectura de kanji necesita un diccionario de pronunciación/);
  assert.match(html,/El pinyin con tonos necesita el paquete de pronunciación/);
  assert.match(html,/La romanización fonológica completa necesita el paquete de pronunciación/);
  assert.match(html,/no se añade sin una fuente fiable/);
});

test('Japanese kana and Russian transliteration have deterministic local helpers',()=>{
  assert.match(html,/function japaneseKanaToHepburn\(input\)/);
  assert.match(html,/'し':'shi'/);
  assert.match(html,/'つ':'tsu'/);
  assert.match(html,/function russianTransliteration\(input\)/);
  assert.match(html,/'Ж':'Zh'/);
  assert.match(html,/'Щ':'Shch'/);
});

test('user-entered pronunciation text is rendered with textContent',()=>{
  assert.match(html,/pronunciationText\.textContent=text/);
  assert.match(html,/pronunciationGuide\.textContent=info\.guide/);
  assert.doesNotMatch(html,/pronunciationText\.innerHTML/);
  assert.doesNotMatch(html,/pronunciationGuide\.innerHTML/);
});

test('contextual language URL is validated against the canonical list',()=>{
  assert.match(html,/new URLSearchParams\(location\.search\)\.get\('lang'\)/);
  assert.match(html,/if\(requested&&language\(requested\)\)/);
  assert.match(html,/targetLanguage\.value=requested/);
  assert.match(html,/pronounceLanguage\.value=requested/);
});

test('inline Translator script compiles',()=>{
  const pattern=/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi;
  const scripts=[...html.matchAll(pattern)].map(match=>match[1].trim()).filter(Boolean);
  assert.ok(scripts.length>=1);
  for(const [index,source] of scripts.entries()){
    assert.doesNotThrow(()=>new vm.Script(source,{filename:'translator-inline-'+index+'.js'}));
  }
});

test('installer adds Translator to Herramientas and remains idempotent',()=>{
  const source='<summary>Herramientas</summary><nav>\n      <a href="#compare" data-nav="compare">⇄ Ver diferencias</a>\n</nav>';
  const patched=installer.patchHome(source);
  assert.match(patched,/href="\/traductor" data-nav="translator">Traductor<\/a>/);
  assert.equal(installer.patchHome(patched),patched);
});

test('Translator backend uses only the existing free Workers AI binding',()=>{
  assert.match(installer.BACKEND_BLOCK,/MLS_TRANSLATOR_MODEL_ID = "@cf\/google\/gemma-4-26b-a4b-it"/);
  assert.match(installer.BACKEND_BLOCK,/env\.AI\.run\(MLS_TRANSLATOR_MODEL_ID/);
  assert.match(installer.BACKEND_BLOCK,/chat_template_kwargs: \{ enable_thinking: false \}/);
  assert.match(installer.BACKEND_BLOCK,/La traducción mejorada no está disponible temporalmente/);
  assert.doesNotMatch(installer.BACKEND_BLOCK,/OpenAI|DeepL|ElevenLabs|Azure|Amazon Polly|Google Translate/i);
});

test('Translator API validates languages, text length and same-language shortcut',()=>{
  assert.match(installer.BACKEND_BLOCK,/mlsTranslatorText\(body\?\.text, 1200\)/);
  assert.match(installer.BACKEND_BLOCK,/MLS_TRANSLATOR_LANGUAGES\[sourceLanguage\]/);
  assert.match(installer.BACKEND_BLOCK,/sourceLanguage === targetLanguage/);
  assert.match(installer.BACKEND_BLOCK,/usedAi: false, sameLanguage: true/);
});

test('Translator UI calls the dedicated endpoint and keeps offline pronunciation available',()=>{
  assert.match(html,/fetch\('\/api\/translate'/);
  assert.match(html,/sourceLanguage:sourceLanguage\.value/);
  assert.match(html,/targetLanguage:targetLanguage\.value/);
  assert.match(html,/Esta combinación todavía no está preparada para traducirse sin Internet/);
  assert.match(html,/translationResult\.hidden=false/);
  assert.match(html,/translatedText\.textContent=translation/);
});

test('Translator backend executes with a mocked Workers AI binding and preserves privacy',async()=>{
  const warnings=[];
  const context={Request,Response,console:{warn:(...args)=>warnings.push(args.join(' '))}};
  vm.runInNewContext(installer.BACKEND_BLOCK+';globalThis.__translatorHandler=handleTranslatorRequest;',context);
  const handler=context.__translatorHandler;

  let aiCalls=0;
  const sameRequest=new Request('https://example.test/api/translate',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({text:'Olá 👋',sourceLanguage:'portugues',targetLanguage:'portugues'})
  });
  const sameResponse=await handler(sameRequest,{AI:{run:async()=>{aiCalls++;throw new Error('should not run')}}});
  const same=await sameResponse.json();
  assert.equal(sameResponse.status,200);
  assert.equal(same.ok,true);
  assert.equal(same.usedAi,false);
  assert.equal(same.translation,'Olá 👋');
  assert.equal(aiCalls,0);

  const aiRequest=new Request('https://example.test/api/translate',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({text:'Buenos días',sourceLanguage:'espanol-guatemala',targetLanguage:'frances'})
  });
  const aiResponse=await handler(aiRequest,{AI:{run:async(model,payload)=>{
    aiCalls++;
    assert.equal(model,'@cf/google/gemma-4-26b-a4b-it');
    assert.match(payload.messages[1].content,/Buenos días/);
    return {response:'{\"translation\":\"Bonjour\"}'};
  }}});
  const ai=await aiResponse.json();
  assert.equal(aiResponse.status,200);
  assert.equal(ai.ok,true);
  assert.equal(ai.usedAi,true);
  assert.equal(ai.translation,'Bonjour');

  const privateText='frase privada 918273';
  const failedRequest=new Request('https://example.test/api/translate',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({text:privateText,sourceLanguage:'espanol-guatemala',targetLanguage:'ingles'})
  });
  const failedResponse=await handler(failedRequest,{AI:{run:async()=>{throw new Error('quota_exhausted')}}});
  const failed=await failedResponse.json();
  assert.equal(failedResponse.status,503);
  assert.equal(failed.aiUnavailable,true);
  assert.ok(warnings.every(line=>!line.includes(privateText)));
});

test('Translator backend rejects unsupported methods, content types and languages',async()=>{
  const context={Request,Response,console:{warn:()=>{}}};
  vm.runInNewContext(installer.BACKEND_BLOCK+';globalThis.__translatorHandler=handleTranslatorRequest;',context);
  const handler=context.__translatorHandler;
  const getResponse=await handler(new Request('https://example.test/api/translate'),{});
  assert.equal(getResponse.status,405);
  const typeResponse=await handler(new Request('https://example.test/api/translate',{method:'POST',body:'x'}),{});
  assert.equal(typeResponse.status,415);
  const invalidResponse=await handler(new Request('https://example.test/api/translate',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({text:'hello',sourceLanguage:'ingles',targetLanguage:'klingon'})
  }),{});
  assert.equal(invalidResponse.status,400);
});

test('worker route serves the static Translator asset and is idempotent',()=>{
  const source='before\nvar index_default = {\nrouter\n    if (url.pathname.startsWith("/api/wiki/")) {\nafter';
  const patched=installer.patchWorker(source);
  assert.match(patched,/MLS_TRANSLATOR_ROUTE_V3/);
  assert.match(patched,/MLS_TRANSLATOR_MODEL_PROXY_V1/);
  assert.match(patched,/url\.pathname\.startsWith\("\/translation-models\/"\)/);
  assert.match(patched,/url\.pathname === "\/api\/translate"/);
  assert.match(patched,/handleTranslatorRequest\(request, env\)/);
  assert.match(patched,/url\.pathname === "\/traductor"/);
  assert.match(patched,/new URL\("\/traductor\.html", request\.url\)/);
  assert.match(patched,/env\.ASSETS\.fetch\(assetRequest\)/);
  assert.equal(installer.patchWorker(patched),patched);
});

test('service worker preloads Translator and preserves it as navigation fallback',()=>{
  assert.match(sw,/offline-v2-translator/);
  assert.match(sw,/\.\/traductor\.html/);
  assert.match(sw,/\.\/css\/design-system\.css/);
  assert.match(sw,/url\.pathname==='\/traductor'\|\|url\.pathname==='\/traductor\/'/);
  assert.match(sw,/caches\.match\('\.\/traductor\.html'\)/);
});

test('Translator page observes 44px controls and reduced motion',()=>{
  assert.match(html,/min-height:44px/);
  assert.match(html,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(html,/:where\(a,button,input,select,textarea\):focus-visible/);
});
