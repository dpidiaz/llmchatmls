(()=>{
  'use strict';
  const MLS=window.MLS=window.MLS||{};
  const VERSION='iphone11-2026-canonical-r33-v49';
  const CACHE='mls-iphone11-2026-canonical-r33-v49';
  const OFFLINE_CACHE_PREFIX='mls-iphone11-';
  const OFFLINE_SECTION_KEY='mlsOfflineSectionVisible';
  const FILES=[
    './','./index.html','./derechos.html','./assets/styles.css','./assets/local-overrides.css','./fonts/NotoColorEmoji-flagsonly.ttf','./manifest.webmanifest','./sw.js',
    './data/index.js','./data/references.js','./js/core.js','./js/map.js','./js/search.js','./js/compare.js','./js/reader.js','./js/ios.js','./js/app.js',
    './assets/icon-192.png','./assets/icon-512.png','./assets/apple-touch-icon-180.png','./assets/apple-touch-icon-167.png','./assets/apple-touch-icon-152.png','./assets/splash-iphone11-828x1792.png',
    './data/volumes/ingles.js','./data/volumes/portugues.js','./data/volumes/italiano.js','./data/volumes/frances.js','./data/volumes/aleman.js',
    './data/volumes/japones.js','./data/volumes/chino-taiwan.js','./data/volumes/coreano.js','./data/volumes/ruso.js','./data/volumes/espanol-guatemala.js'
  ];
  const isStandalone=()=>window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const isIOS=()=>/iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const isReady=()=>localStorage.getItem('mlsOfflinePackVersion')===VERSION;
  const isPageVisible=()=>localStorage.getItem(OFFLINE_SECTION_KEY)==='true';
  function syncOfflinePageNav(){const link=document.querySelector('[data-nav="offline"]');if(link)link.hidden=!isPageVisible()}
  function requestPageVisibility(visible){
    const ov=document.getElementById('offlineOverlay');if(!ov)return;
    ov.hidden=false;
    ov.innerHTML=`<form class="install-help offline-pin-form"><h2>${visible?'Mostrar':'Ocultar'} Uso offline</h2><p>Escribe la contraseña para cambiar la visibilidad de esta página.</p><label for="offlinePagePassword">Contraseña</label><input id="offlinePagePassword" class="offline-pin-input" type="password" inputmode="numeric" autocomplete="current-password" required><p class="offline-pin-error" aria-live="polite"></p><div class="offline-actions"><button class="btn" type="button" data-offline-pin-cancel>Cancelar</button><button class="btn primary" type="submit">Continuar</button></div></form>`;
    const form=ov.querySelector('form'),input=ov.querySelector('#offlinePagePassword'),error=ov.querySelector('.offline-pin-error');
    const close=()=>{ov.hidden=true;ov.innerHTML='';MLS.pages.settings?.()};
    form.addEventListener('submit',ev=>{ev.preventDefault();if(input.value!=='1993'){error.textContent='La contraseña no coincide. Puedes intentarlo otra vez.';input.value='';input.focus();return}localStorage.setItem(OFFLINE_SECTION_KEY,String(visible));ov.hidden=true;ov.innerHTML='';syncOfflinePageNav();if(!visible&&location.hash.startsWith('#offline'))location.hash='#settings';else if(location.hash.startsWith('#settings'))MLS.pages.settings?.();else if(location.hash.startsWith('#home'))MLS.pages.home?.()});
    form.querySelector('[data-offline-pin-cancel]').onclick=close;
    form.addEventListener('keydown',ev=>{if(ev.key==='Escape'){ev.preventDefault();close()}});
    input.focus();
  }
  const humanMB=n=>`${(n/1024/1024).toFixed(0)} MB`;
  async function estimate(){try{const x=await navigator.storage?.estimate?.();return x?.usage?humanMB(x.usage):''}catch{return ''}}
  function installSteps(){return `<div class="install-help"><h2>Instalar MLS</h2><ol><li>Abre el menú de tu navegador y elige <strong>Instalar app</strong> o <strong>Añadir a pantalla de inicio</strong>.</li><li>En iPhone o iPad, abre esta página en <strong>Safari</strong>, toca <strong>Compartir</strong> y luego <strong>Añadir a pantalla de inicio</strong>.</li><li>Abre MLS desde el icono instalado.</li><li>Ve a <strong>Más → Configuración → Usar sin Internet</strong> y toca <strong>Preparar ahora</strong>.</li></ol><p>Cuando termine, la biblioteca estará disponible sin conexión en este dispositivo.</p><button class="btn primary" data-install-close>Entendido</button></div>`}
  function showInstallHelp(){const ov=document.getElementById('offlineOverlay');if(!ov)return;ov.hidden=false;ov.innerHTML=installSteps();ov.querySelector('[data-install-close]').onclick=()=>{ov.hidden=true;ov.innerHTML=''}}
  function statusMarkup(){
    if(location.protocol==='file:')return `<div class="offline-status warn"><strong>Para instalarla como app</strong><span>Ábrela desde Safari usando una dirección HTTPS.</span></div>`;
    if(isReady())return `<div class="offline-status ready"><strong>✓ Lista sin Internet</strong><span>Los 10 idiomas están guardados en este dispositivo.</span></div>`;
    return `<div class="offline-status"><strong>Uso sin Internet</strong><span>Guarda los 10 idiomas en este dispositivo. Aproximadamente 250 MB.</span></div>`;
  }
  function settingsBlock(){return `<section class="setting-row offline-setting"><div><h2>Usar sin Internet</h2><div id="offlineStatusText">${statusMarkup()}</div></div><div class="offline-actions">${location.protocol!=='file:'?`<button class="btn primary" type="button" data-offline-prepare>${isReady()?'Volver a guardar':'Preparar ahora'}</button>`:''}<button class="btn" type="button" data-install-help>Cómo instalar</button></div></section>`}
  function homeCard(){if(location.protocol==='file:'||isReady()||!isPageVisible())return '';return `<section class="iphone-setup-card" aria-label="Preparar uso sin Internet"><div><strong>¿Lo usarás sin Internet?</strong><span>Guarda los 10 idiomas en este dispositivo.</span></div><button class="btn primary" type="button" data-offline-prepare>Preparar</button></section>`}
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
      setTimeout(()=>{const ov=document.getElementById('offlineOverlay');if(ov){ov.hidden=true;ov.innerHTML=''};document.getElementById('offlineStatusText')?.replaceChildren();if(location.hash.startsWith('#settings'))MLS.pages.settings?.();else if(location.hash.startsWith('#offline'))MLS.pages.offline?.();MLS.toast(`Biblioteca guardada${used?' · '+used:''}`,2600)},1000);
    }catch(err){
      const ov=document.getElementById('offlineOverlay');if(ov){ov.hidden=false;ov.innerHTML=`<div class="offline-progress-card"><h2>No se pudo terminar</h2><p>Comprueba la conexión y vuelve a intentarlo.</p><small>${String(err.message||err)}</small><button class="btn primary" data-offline-close>Cerrar</button></div>`;ov.querySelector('[data-offline-close]').onclick=()=>{ov.hidden=true;ov.innerHTML=''}}
    }finally{try{await wake?.release?.()}catch{}}
  }
  async function removeOffline(){
    if(!window.confirm('¿Eliminar la copia offline guardada (hasta aprox. 250 MB)? MLS seguirá instalada.'))return;
    try{
      await Promise.all((await caches.keys()).filter(name=>name.startsWith(OFFLINE_CACHE_PREFIX)).map(name=>caches.delete(name)));
      localStorage.removeItem('mlsOfflinePackVersion');
      localStorage.removeItem('mlsOfflinePackSavedAt');
      MLS.pages.offline?.();
      MLS.toast('Copia offline eliminada');
    }catch(err){MLS.toast('No se pudo eliminar: '+String(err&&err.message||err));}
  }  function setMobileActive(){const h=location.hash||'#home';let key='home';if(h.startsWith('#search'))key='search';else if(h.startsWith('#map')||h.startsWith('#themes'))key='map';document.querySelectorAll('[data-mobile-nav]').forEach(a=>a.classList.toggle('active',a.dataset.mobileNav===key))}
  document.addEventListener('click',ev=>{
    const remove=ev.target.closest('[data-offline-remove]');if(remove){ev.preventDefault();removeOffline();return}
    const prep=ev.target.closest('[data-offline-prepare]');if(prep){ev.preventDefault();prepare();return}
    const help=ev.target.closest('[data-install-help]');if(help){ev.preventDefault();showInstallHelp();return}
  });
  window.addEventListener('hashchange',setMobileActive);
  window.addEventListener('online',()=>document.body.dataset.online='true');
  window.addEventListener('offline',()=>document.body.dataset.online='false');
  document.addEventListener('DOMContentLoaded',()=>{document.body.dataset.ios=isIOS()?'true':'false';document.body.dataset.standalone=isStandalone()?'true':'false';document.body.dataset.online=navigator.onLine?'true':'false';setMobileActive()});
  MLS.offline={VERSION,CACHE,FILES,isReady,isStandalone,isIOS,prepare,settingsBlock,homeCard,showInstallHelp,statusMarkup,isPageVisible,requestPageVisibility};
  syncOfflinePageNav();
})();









