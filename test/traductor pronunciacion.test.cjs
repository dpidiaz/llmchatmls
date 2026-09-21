'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const test=require('node:test');
const vm=require('node:vm');

const html=fs.readFileSync('MLS R32 OVERLAY/traductor.html','utf8');
const sw=fs.readFileSync('MLS R32 OVERLAY/sw.js','utf8');
const installer=require('../scripts/habilitar traductor pronunciacion.js');

function translatorBackendContext(warnings=[]){
  let dailyNeurons=100;
  let reservedNeurons=0;
  const events=[];
  const store={
    async reserveCloudflareBudget(estimate){reservedNeurons+=estimate;events.push(['reserve',estimate]);return {ok:true,reserved:estimate,dailyNeurons,dailyReservedNeurons:reservedNeurons,targetNeurons:9000}},
    async settleCloudflareBudget(reserved,actual){reservedNeurons=Math.max(0,reservedNeurons-reserved);dailyNeurons+=actual;events.push(['settle',reserved,actual]);return {ok:true,dailyNeurons,dailyReservedNeurons:reservedNeurons,targetNeurons:9000}},
    async releaseCloudflareBudget(reserved){reservedNeurons=Math.max(0,reservedNeurons-reserved);events.push(['release',reserved]);return {ok:true,dailyReservedNeurons:reservedNeurons}},
    async getCloudflareBudget(){return {dailyNeurons,dailyReservedNeurons:reservedNeurons,targetNeurons:9000}},
    async markQuotaExhausted(code,message){events.push(['quota',code,message]);return {ok:false,quotaExhausted:true}}
  };
  const context={
    Request,Response,
    console:{warn:(...args)=>warnings.push(args.join(' '))},
    WIKI_CLOUDFLARE_NEURON_TARGET:9000,
    wikiStore:()=>store,
    wikiUsageResult(result){
      const usage=result?.usage||result?.result?.usage||{};
      return {
        promptTokens:Number(usage.prompt_tokens||usage.input_tokens||0),
        completionTokens:Number(usage.completion_tokens||usage.output_tokens||0)
      };
    },
    cloudflareNeurons(_model,promptTokens,completionTokens){return (promptTokens*9091+completionTokens*27273)/1e6},
    async recordProviderUsage(_env,id,promptTokens,completionTokens,error){events.push(['usage',id,promptTokens,completionTokens,error])},
    wikiErrorMessage:error=>error instanceof Error?error.message:String(error),
    workersAiFailureKind(message){
      const value=String(message||'').toLowerCase();
      if(/3036|daily free allocation|10,000 neurons|10000 neurons|used up your daily|429/.test(value))return 'quota';
      if(/5035|workers paid|requires paid/.test(value))return 'paid';
      return 'other';
    },
    secondsUntilNextUtcDay:()=>3600
  };
  return {context,events,store,get dailyNeurons(){return dailyNeurons},get reservedNeurons(){return reservedNeurons}};
}

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

test('speech exposes the requested 0.10 to 1.00 selector and Listen uses it directly',()=>{
  assert.match(html,/const DEFAULT_SPEECH_RATE=0\.50;/);
  assert.match(html,/const MIN_SPEECH_RATE=0\.10;/);
  assert.match(html,/const MAX_SPEECH_RATE=1\.00;/);
  assert.match(html,/id="speechRate" autocomplete="off"/);
  assert.match(html,/id="pronounceSpeechRate" autocomplete="off"/);
  for(const rate of ['0.10','0.25','0.50','0.75','1.00']) assert.match(html,new RegExp('value="'+rate.replace('.','\\.')+'"'));
  assert.match(html,/value="0\.50" selected>0\.50×<\/option>/);
  assert.match(html,/function resetSpeechRateDefaults\(\)/);
  assert.match(html,/const value=DEFAULT_SPEECH_RATE\.toFixed\(2\)/);
  assert.match(html,/speechRate\.value=value/);
  assert.match(html,/pronounceSpeechRate\.value=value/);
  assert.match(html,/resetSpeechRateDefaults\(\);\s*applyContext\(\);/);
  assert.match(html,/function selectedSpeechRate\(context\)/);
  assert.match(html,/const rate=selectedSpeechRate\(context\)/);
  assert.match(html,/utterance\.rate=rate/);
  assert.match(html,/data-speak>Escuchar<\/button>/);
  assert.doesNotMatch(html,/Escuchar lento/);
  assert.doesNotMatch(html,/playbackRate/);
});

test('speech cancels the previous queue and repetition is done by pressing Listen again',()=>{
  assert.match(html,/window\.speechSynthesis\.cancel\(\);\s*const utterance=new SpeechSynthesisUtterance/);
  assert.match(html,/data-speak/);
  assert.match(html,/data-stop/);
  assert.doesNotMatch(html,/data-repeat/);
  assert.doesNotMatch(html,/lastSpeech/);
  assert.doesNotMatch(html,/>Repetir<\/button>/);
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
  assert.match(installer.BACKEND_BLOCK,/MLS_TRANSLATOR_PROVIDER_ID = "cloudflare-translator"/);
  assert.match(installer.BACKEND_BLOCK,/env\.AI\.run\(MLS_TRANSLATOR_MODEL_ID/);
  assert.match(installer.BACKEND_BLOCK,/chat_template_kwargs: \{ enable_thinking: false \}/);
  assert.match(installer.BACKEND_BLOCK,/reserveCloudflareBudget\(MLS_TRANSLATOR_ESTIMATED_NEURONS\)/);
  assert.match(installer.BACKEND_BLOCK,/settleCloudflareBudget\(reserved, neurons\)/);
  assert.match(installer.BACKEND_BLOCK,/releaseCloudflareBudget\(reserved\)/);
  assert.match(installer.BACKEND_BLOCK,/markQuotaExhausted\("translator", message\)/);
  assert.match(installer.BACKEND_BLOCK,/recordProviderUsage\(env, MLS_TRANSLATOR_PROVIDER_ID/);
  assert.match(installer.BACKEND_BLOCK,/workersAiFailureKind\(message\)/);
  assert.match(installer.BACKEND_BLOCK,/zeroCostPolicy: true/);
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
  assert.match(html,/Esta combinación no está preparada para traducción local/);
  assert.match(html,/translationResult\.hidden=false/);
  assert.match(html,/translatedText\.textContent=translation/);
  assert.match(html,/id="translationNeuronStatus"/);
  assert.match(html,/function formatNeuronUsage\(usage/);
  assert.match(html,/Workers AI: /);
  assert.match(html,/onlineUsage=payload\.usage\|\|null/);
});

test('translation engine is an explicit two-state Online or Local toggle with no automatic fallback',()=>{
  assert.match(html,/data-translation-mode="online" aria-pressed="true">En línea<\/button>/);
  assert.match(html,/data-translation-mode="local" aria-pressed="false">Local<\/button>/);
  assert.match(html,/let translationMode='online'/);
  assert.match(html,/if\(mode==='local'\)/);
  assert.match(html,/El motor local no pudo completar esta traducción\. No se usó Internet/);
  assert.match(html,/Traducción en línea lista\. Los paquetes locales no se usaron/);
  assert.match(html,/El modo En línea necesita conexión a Internet\. Cambia a Local/);
  assert.doesNotMatch(html,/value="auto"/);
  assert.doesNotMatch(html,/Automático/);
  assert.doesNotMatch(html,/mode==='auto'/);
  assert.doesNotMatch(html,/alternativa al motor local/);
});

test('Translator backend executes with a mocked Workers AI binding, measures neurons and preserves privacy',async()=>{
  const warnings=[];
  const rt=translatorBackendContext(warnings);
  vm.runInNewContext(installer.BACKEND_BLOCK+';globalThis.__translatorHandler=handleTranslatorRequest;',rt.context);
  const handler=rt.context.__translatorHandler;

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
  assert.equal(same.usage.neurons,0);
  assert.equal(aiCalls,0);

  const aiRequest=new Request('https://example.test/api/translate',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({text:'Buenos días',sourceLanguage:'espanol-guatemala',targetLanguage:'frances'})
  });
  const aiResponse=await handler(aiRequest,{AI:{run:async(model,payload)=>{
    aiCalls++;
    assert.equal(model,'@cf/google/gemma-4-26b-a4b-it');
    assert.match(payload.messages[1].content,/Buenos días/);
    return {response:'{"translation":"Bonjour"}',usage:{prompt_tokens:100,completion_tokens:20}};
  }}});
  const ai=await aiResponse.json();
  assert.equal(aiResponse.status,200);
  assert.equal(ai.ok,true);
  assert.equal(ai.usedAi,true);
  assert.equal(ai.translation,'Bonjour');
  assert.equal(ai.usage.measured,true);
  assert.equal(ai.usage.promptTokens,100);
  assert.equal(ai.usage.completionTokens,20);
  assert.equal(ai.usage.neurons,1.4546);
  assert.equal(ai.usage.dailyNeurons,101.45);
  assert.equal(ai.usage.targetNeurons,9000);
  assert.ok(rt.events.some(event=>event[0]==='reserve'&&event[1]===40));
  assert.ok(rt.events.some(event=>event[0]==='settle'));
  assert.ok(rt.events.some(event=>event[0]==='usage'&&event[1]==='cloudflare-translator'&&event[4]===false));

  const privateText='frase privada 918273';
  const failedRequest=new Request('https://example.test/api/translate',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({text:privateText,sourceLanguage:'espanol-guatemala',targetLanguage:'ingles'})
  });
  const failedResponse=await handler(failedRequest,{AI:{run:async()=>{throw new Error('3036: daily free allocation of 10,000 neurons used up')}}});
  const failed=await failedResponse.json();
  assert.equal(failedResponse.status,429);
  assert.equal(failed.aiUnavailable,true);
  assert.equal(failed.quotaProtected,true);
  assert.equal(failed.circuitOpen,true);
  assert.ok(rt.events.some(event=>event[0]==='quota'&&event[1]==='translator'));
  assert.ok(warnings.every(line=>!line.includes(privateText)));
});

test('Translator backend rejects unsupported methods, content types and languages',async()=>{
  const rt=translatorBackendContext();
  vm.runInNewContext(installer.BACKEND_BLOCK+';globalThis.__translatorHandler=handleTranslatorRequest;',rt.context);
  const handler=rt.context.__translatorHandler;
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
  assert.doesNotMatch(patched,/new URL\("\/traductor\.html", request\.url\)/);
  assert.match(patched,/return env\.ASSETS\.fetch\(request\)/);
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
