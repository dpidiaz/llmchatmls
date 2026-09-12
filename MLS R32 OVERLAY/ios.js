(()=>{
  'use strict';
  const MLS=window.MLS=window.MLS||{};
  const VERSION='iphone11-2026-r32-fifo-publish-first';
  const CACHE='mls-iphone11-2026-r32-fifo-publish-first';
  const FILES=[
    './','./index.html','./assets/styles.css','./manifest.webmanifest','./sw.js',
    './data/index.js','./js/core.js','./js/map.js','./js/search.js','./js/compare.js','./js/reader.js','./js/ios.js','./js/app.js',
    './assets/icon-192.png','./assets/icon-512.png','./assets/apple-touch-icon-180.png','./assets/apple-touch-icon-167.png','./assets/apple-touch-icon-152.png','./assets/splash-iphone11-828x1792.png',
    './data/volumes/ingles.js','./data/volumes/portugues.js','./data/volumes/italiano.js','./data/volumes/frances.js','./data/volumes/aleman.js',
    './data/volumes/japones.js','./data/volumes/chino-taiwan.js','./data/volumes/coreano.js','./data/volumes/ruso.js','./data/volumes/espanol-guatemala.js'
  ];
  const isStandalone=()=>window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const isIOS=()=>/iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const isReady=()=>localStorage.getItem('mlsOfflinePackVersion')===VERSION;
  const humanMB=n=>`${(n/1024/1024).toFixed(0)} MB`;
  async function estimate(){try{const x=await navigator.storage?.estimate?.();return x?.usage?humanMB(x.usage):''}catch{return ''}}
  function installSteps(){return `<div class="install-help"><h2>Instalar en iPhone</h2><ol><li>Abre esta página en <strong>Safari</strong>.</li><li>Toca <strong>Compartir</strong>.</li><li>Toca <strong>Añadir a pantalla de inicio</strong>.</li><li>Abre el icono <strong>MLS Gramática</strong>.</li><li>Ve a <strong>Más → Configuración → Usar sin Internet</strong>.</li><li>Toca <strong>Preparar ahora</strong> y espera hasta que termine.</li></ol><p>Después puedes usar la biblioteca en modo avión.</p><button class="btn primary" data-install-close>Entendido</button></div>`}
  function showInstallHelp(){const ov=document.getElementById('offlineOverlay');if(!ov)return;ov.hidden=false;ov.innerHTML=installSteps();ov.querySelector('[data-install-close]').onclick=()=>{ov.hidden=true;ov.innerHTML=''}}
  function statusMarkup(){
    if(location.protocol==='file:')return `<div class="offline-status warn"><strong>Para instalarla como app</strong><span>Ábrela desde Safari usando una dirección HTTPS.</span></div>`;
    if(isReady())return `<div class="offline-status ready"><strong>✓ Lista sin Internet</strong><span>Los 10 idiomas están guardados en este dispositivo.</span></div>`;
    return `<div class="offline-status"><strong>Uso sin Internet</strong><span>Guarda los 10 idiomas en este iPhone. Aproximadamente 65 MB.</span></div>`;
  }
  function settingsBlock(){return `<section class="setting-row offline-setting"><div><h2>Usar sin Internet</h2><div id="offlineStatusText">${statusMarkup()}</div></div><div class="offline-actions">${location.protocol!=='file:'?`<button class="btn primary" type="button" data-offline-prepare>${isReady()?'Volver a guardar':'Preparar ahora'}</button>`:''}<button class="btn" type="button" data-install-help>Cómo instalar</button></div></section>`}
  function homeCard(){if(location.protocol==='file:'||isReady())return '';return `<section class="iphone-setup-card" aria-label="Preparar uso sin Internet"><div><strong>¿Lo usarás sin Internet?</strong><span>Guarda los 10 idiomas en este iPhone.</span></div><button class="btn primary" type="button" data-offline-prepare>Preparar</button></section>`}
  function setOverlay(done,total,label='Guardando la biblioteca…'){
    const ov=document.getElementById('offlineOverlay');if(!ov)return;
    ov.hidden=false;const pct=Math.round(done/Math.max(1,total)*100);
    ov.innerHTML=`<div class="offline-progress-card"><div class="offline-progress-icon">MLS</div><h2>${label}</h2><p>Mantén esta pantalla abierta.</p><div class="progress-track"><span style="width:${pct}%"></span></div><strong>${pct}%</strong><small>${done} de ${total} archivos</small></div>`;
  }
  async function prepare(){
    if(location.protocol==='file:'){showInstallHelp();return}
    if(!('caches' in window)){MLS.toast('Este navegador no permite preparar el modo offline.');return}
    let wake=null;
    try{wake=await navigator.wakeLock?.request?.('screen')}catch{}
    try{
      await navigator.storage?.persist?.().catch(()=>false);
      const cache=await caches.open(CACHE);
      let done=0;setOverlay(done,FILES.length);
      for(const path of FILES){
        const req=new Request(path,{cache:'reload'});
        const resp=await fetch(req);
        if(!resp.ok)throw new Error(`${path}: ${resp.status}`);
        await cache.put(req,resp.clone());
        done++;setOverlay(done,FILES.length);
      }
      for(const path of FILES){if(!(await cache.match(path)))throw new Error(`Falta ${path}`)}
      localStorage.setItem('mlsOfflinePackVersion',VERSION);
      localStorage.setItem('mlsOfflinePackSavedAt',new Date().toISOString());
      const used=await estimate();
      setOverlay(FILES.length,FILES.length,'✓ Lista sin Internet');
      setTimeout(()=>{const ov=document.getElementById('offlineOverlay');if(ov){ov.hidden=true;ov.innerHTML=''};document.getElementById('offlineStatusText')?.replaceChildren();if(location.hash.startsWith('#settings'))MLS.pages.settings?.();MLS.toast(`Biblioteca guardada${used?' · '+used:''}`,2600)},1000);
    }catch(err){
      const ov=document.getElementById('offlineOverlay');if(ov){ov.hidden=false;ov.innerHTML=`<div class="offline-progress-card"><h2>No se pudo terminar</h2><p>Comprueba la conexión y vuelve a intentarlo.</p><small>${String(err.message||err)}</small><button class="btn primary" data-offline-close>Cerrar</button></div>`;ov.querySelector('[data-offline-close]').onclick=()=>{ov.hidden=true;ov.innerHTML=''}}
    }finally{try{await wake?.release?.()}catch{}}
  }
  function setMobileActive(){const h=location.hash||'#home';let key='home';if(h.startsWith('#search'))key='search';else if(h.startsWith('#themes'))key='themes';document.querySelectorAll('[data-mobile-nav]').forEach(a=>a.classList.toggle('active',a.dataset.mobileNav===key))}
  function entryCodeFromHash(){return new URLSearchParams(location.hash.replace(/^#/,'' )).get('entry')||''}
  function resetAllScrollLayers(){
    try{if('scrollRestoration' in history)history.scrollRestoration='manual'}catch{}
    const seen=new Set();
    const reset=el=>{
      if(!el||seen.has(el))return;seen.add(el);
      try{el.scrollTop=0;el.scrollLeft=0}catch{}
      try{el.scrollTo?.({top:0,left:0,behavior:'auto'})}catch{}
    };
    reset(document.scrollingElement);reset(document.documentElement);reset(document.body);reset(MLS.app);reset(document.getElementById('app'));
    let node=MLS.app||document.getElementById('app');
    while(node){reset(node);node=node.parentElement}
    document.querySelectorAll('*').forEach(el=>{if((el.scrollTop||el.scrollLeft)&&(el.scrollHeight>el.clientHeight||el.scrollWidth>el.clientWidth))reset(el)});
    try{window.scrollTo({top:0,left:0,behavior:'auto'})}catch{try{window.scrollTo(0,0)}catch{}}
  }
  function forceAbsoluteEntryTop(){
    resetAllScrollLayers();
    requestAnimationFrame(()=>{resetAllScrollLayers();requestAnimationFrame(resetAllScrollLayers)});
    [40,120,250].forEach(ms=>setTimeout(resetAllScrollLayers,ms));
  }
  let pendingEntryTop='';
  function armAbsoluteEntryTop(){const code=entryCodeFromHash();if(!code)return;pendingEntryTop=code;forceAbsoluteEntryTop()}
  function observeEntryRender(){
    const app=document.getElementById('app')||MLS.app;if(!app)return;
    new MutationObserver(()=>{
      if(!pendingEntryTop||entryCodeFromHash()!==pendingEntryTop)return;
      if(!app.querySelector('.reader-wide'))return;
      forceAbsoluteEntryTop();pendingEntryTop='';
    }).observe(app,{childList:true,subtree:true});
  }
  document.addEventListener('click',ev=>{
    const prep=ev.target.closest('[data-offline-prepare]');if(prep){ev.preventDefault();prepare();return}
    const help=ev.target.closest('[data-install-help]');if(help){ev.preventDefault();showInstallHelp();return}
  });
  window.addEventListener('hashchange',()=>{setMobileActive();armAbsoluteEntryTop()});
  window.addEventListener('online',()=>document.body.dataset.online='true');
  window.addEventListener('offline',()=>document.body.dataset.online='false');
  document.addEventListener('DOMContentLoaded',()=>{document.body.dataset.ios=isIOS()?'true':'false';document.body.dataset.standalone=isStandalone()?'true':'false';document.body.dataset.online=navigator.onLine?'true':'false';setMobileActive();observeEntryRender();if(entryCodeFromHash())armAbsoluteEntryTop()});
  MLS.offline={VERSION,CACHE,FILES,isReady,isStandalone,isIOS,prepare,settingsBlock,homeCard,showInstallHelp,statusMarkup};
})();
