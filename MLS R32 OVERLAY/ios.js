(()=>{
  'use strict';
  const MLS=window.MLS=window.MLS||{};
  const SCHEMA_VERSION=1;
  const LIBRARY_VERSION='offline-library-v1';
  const LIBRARY_CACHE='mls-offline-library-'+LIBRARY_VERSION;
  const LEGACY_CACHE_PREFIX='mls-iphone11-';
  const LEGACY_VERSION_KEY='mlsOfflinePackVersion';
  const LEGACY_SAVED_AT_KEY='mlsOfflinePackSavedAt';
  const STATE_KEY='mlsOfflineLibraryStateV1';

  const LANGUAGES={
    'espanol-guatemala':{label:'Español',files:['./data/volumes/espanol-guatemala.js']},
    ingles:{label:'Inglés',files:['./data/volumes/ingles.js']},
    portugues:{label:'Portugués',files:['./data/volumes/portugues.js']},
    italiano:{label:'Italiano',files:['./data/volumes/italiano.js']},
    frances:{label:'Francés',files:['./data/volumes/frances.js']},
    aleman:{label:'Alemán',files:['./data/volumes/aleman.js']},
    japones:{label:'Japonés',files:['./data/volumes/japones.js']},
    'chino-taiwan':{label:'Chino (Taiwán)',files:['./data/volumes/chino-taiwan.js']},
    coreano:{label:'Coreano',files:['./data/volumes/coreano.js']},
    ruso:{label:'Ruso',files:['./data/volumes/ruso.js']}
  };
  const ALL_LANGUAGES=Object.keys(LANGUAGES);
  let verifiedState={status:'checking',savedLanguages:[],missingLanguages:[],savedAt:null};
  let lastMissingContentUrl='';

  const isStandalone=()=>window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const isIOS=()=>/iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  const humanMB=n=>`${(n/1024/1024).toFixed(0)} MB`;
  async function estimate(){try{const x=await navigator.storage?.estimate?.();return x?.usage?humanMB(x.usage):''}catch{return ''}}

  function readState(){
    try{
      const value=JSON.parse(localStorage.getItem(STATE_KEY)||'null');
      if(!value||value.schemaVersion!==SCHEMA_VERSION||!Array.isArray(value.savedLanguages))return null;
      return value;
    }catch{return null}
  }
  function writeState(savedLanguages,savedAt=new Date().toISOString()){
    const state={schemaVersion:SCHEMA_VERSION,version:LIBRARY_VERSION,savedLanguages:[...new Set(savedLanguages)].filter(x=>LANGUAGES[x]),savedAt};
    localStorage.setItem(STATE_KEY,JSON.stringify(state));
    localStorage.removeItem(LEGACY_VERSION_KEY);
    localStorage.removeItem(LEGACY_SAVED_AT_KEY);
    return state;
  }
  const filesFor=slugs=>slugs.flatMap(slug=>LANGUAGES[slug]?.files||[]);

  async function cacheHasFiles(cache,files){
    for(const path of files)if(!(await cache.match(path)))return false;
    return true;
  }

  async function discoverCachedLanguages(){
    if(!('caches' in window))return null;
    const cache=await caches.open(LIBRARY_CACHE);
    const actual=[];
    for(const slug of ALL_LANGUAGES){
      if(await cacheHasFiles(cache,LANGUAGES[slug].files))actual.push(slug);
    }
    return actual.length?writeState(actual):null;
  }

  async function migrateLegacy(){
    if(!('caches' in window))return null;
    const keys=await caches.keys();
    for(const key of keys){
      if(!key.startsWith(LEGACY_CACHE_PREFIX))continue;
      const legacy=await caches.open(key);
      if(!(await cacheHasFiles(legacy,filesFor(ALL_LANGUAGES))))continue;
      const target=await caches.open(LIBRARY_CACHE);
      for(const path of filesFor(ALL_LANGUAGES)){
        const response=await legacy.match(path);
        if(response)await target.put(path,response.clone());
      }
      if(await cacheHasFiles(target,filesFor(ALL_LANGUAGES))){
        const savedAt=localStorage.getItem(LEGACY_SAVED_AT_KEY)||new Date().toISOString();
        const state=writeState(ALL_LANGUAGES,savedAt);
        await caches.delete(key).catch(()=>false);
        return state;
      }
    }
    return null;
  }

  async function verifyOfflineState(){
    if(!('caches' in window)){
      verifiedState={status:'unsupported',savedLanguages:[],missingLanguages:ALL_LANGUAGES,savedAt:null};
      return verifiedState;
    }
    let state=readState();
    if(!state)state=await migrateLegacy();
    if(!state)state=await discoverCachedLanguages();
    if(!state){
      verifiedState={status:'empty',savedLanguages:[],missingLanguages:ALL_LANGUAGES,savedAt:null};
      return verifiedState;
    }
    const cache=await caches.open(LIBRARY_CACHE);
    const actual=[];
    for(const slug of state.savedLanguages){
      if(await cacheHasFiles(cache,LANGUAGES[slug].files))actual.push(slug);
    }
    const missing=state.savedLanguages.filter(slug=>!actual.includes(slug));
    verifiedState={
      status:missing.length?'partial':(actual.length?'ready':'empty'),
      savedLanguages:actual,
      missingLanguages:missing,
      savedAt:state.savedAt||null
    };
    if(missing.length||actual.length!==state.savedLanguages.length)writeState(actual,state.savedAt||new Date().toISOString());
    return verifiedState;
  }

  const isReady=()=>verifiedState.status==='ready'&&verifiedState.savedLanguages.length>0;
  const hasLanguage=slug=>verifiedState.savedLanguages.includes(slug);

  function installSteps(){return `<div class="install-help"><h2>Instalar en iPhone</h2><ol><li>Abre esta página en <strong>Safari</strong>.</li><li>Toca <strong>Compartir</strong>.</li><li>Toca <strong>Añadir a pantalla de inicio</strong>.</li><li>Abre el icono <strong>MLS Gramática</strong>.</li><li>Ve a <strong>Más → Configuración → Usar sin Internet</strong>.</li><li>Elige los idiomas que quieres guardar y toca <strong>Preparar selección</strong>.</li></ol><p>La biblioteca descargada funciona sin Internet. Las funciones de IA necesitan conexión.</p><button class="btn primary" data-install-close>Entendido</button></div>`}
  function configureOverlay(ov,{role='dialog',live='polite',modal=false}={}){
    if(!ov)return null;
    ov.hidden=false;
    ov.setAttribute('role',role);
    ov.setAttribute('aria-live',live);
    if(modal)ov.setAttribute('aria-modal','true');else ov.removeAttribute('aria-modal');
    return ov;
  }
  function clearOverlay(){
    const ov=document.getElementById('offlineOverlay');if(!ov)return;
    ov.hidden=true;ov.innerHTML='';ov.removeAttribute('role');ov.removeAttribute('aria-live');ov.removeAttribute('aria-modal');
  }
  function focusOverlayAction(ov){setTimeout(()=>ov?.querySelector('button,[href],[tabindex]:not([tabindex="-1"])')?.focus?.(),0)}
  function showInstallHelp(){const ov=configureOverlay(document.getElementById('offlineOverlay'),{role:'dialog',live:'polite',modal:true});if(!ov)return;ov.innerHTML=installSteps();focusOverlayAction(ov);ov.querySelector('[data-install-close]').onclick=clearOverlay}

  function statusMarkup(){
    if(location.protocol==='file:')return `<div class="offline-status warn"><strong>Para instalarla como app</strong><span>Ábrela desde Safari usando una dirección HTTPS.</span></div>`;
    if(verifiedState.status==='checking')return `<div class="offline-status"><strong>Comprobando biblioteca offline…</strong><span>Verificando lo que está realmente guardado en este dispositivo.</span></div>`;
    if(verifiedState.status==='unsupported')return `<div class="offline-status warn"><strong>Modo offline no disponible</strong><span>Este navegador no permite guardar la biblioteca localmente.</span></div>`;
    if(verifiedState.status==='partial'){
      const affected=verifiedState.missingLanguages.map(slug=>LANGUAGES[slug]?.label).filter(Boolean);
      return `<div class="offline-status warn"><strong>Biblioteca incompleta</strong><span>${affected.length?'Falta contenido de '+affected.join(', ')+'. ':'Algunos archivos guardados ya no están disponibles. '}Vuelve a preparar esos idiomas cuando tengas conexión.</span></div>`;
    }
    if(isReady()){
      const count=verifiedState.savedLanguages.length;
      return `<div class="offline-status ready"><strong>✓ Biblioteca disponible sin Internet</strong><span>${count===10?'Los 10 idiomas':count+' idioma'+(count===1?'':'s')} están verificados en este dispositivo. Las funciones de IA necesitan conexión.</span></div>`;
    }
    return `<div class="offline-status"><strong>Usar la biblioteca sin Internet</strong><span>Elige los idiomas que quieras guardar. Los 10 ocupan aproximadamente 65 MB. Las funciones de IA necesitan conexión.</span></div>`;
  }

  function languagePicker(){
    return `<fieldset class="offline-language-picker"><legend>Idiomas para guardar</legend>${ALL_LANGUAGES.map(slug=>{
      const checked=hasLanguage(slug)||verifiedState.status==='empty'||verifiedState.status==='checking'?' checked':'';
      return `<label><input type="checkbox" value="${slug}" data-offline-language${checked}> ${LANGUAGES[slug].label}</label>`;
    }).join('')}</fieldset>`;
  }

  function settingsBlock(){return `<section class="setting-row offline-setting"><div><h2>Usar sin Internet</h2><div id="offlineStatusText">${statusMarkup()}</div>${languagePicker()}</div><div class="offline-actions">${location.protocol!=='file:'?`<button class="btn primary" type="button" data-offline-prepare>Preparar selección</button><button class="btn" type="button" data-offline-all>Guardar todos</button>`:''}<button class="btn" type="button" data-install-help>Cómo instalar</button></div></section>`}
  function homeCard(){if(location.protocol==='file:'||isReady())return '';return `<section class="iphone-setup-card" aria-label="Preparar uso sin Internet"><div><strong>¿Lo usarás sin Internet?</strong><span>Guarda la biblioteca que necesites en este dispositivo.</span></div><button class="btn primary" type="button" data-offline-all>Preparar</button></section>`}

  function setOverlay(done,total,label='Guardando la biblioteca…'){
    const ov=configureOverlay(document.getElementById('offlineOverlay'),{role:'status',live:'polite'});if(!ov)return;
    const pct=Math.round(done/Math.max(1,total)*100);
    ov.innerHTML=`<div class="offline-progress-card"><div class="offline-progress-icon" aria-hidden="true">MLS</div><h2>${label}</h2><p>Mantén esta pantalla abierta.</p><div class="progress-track" role="progressbar" aria-label="Progreso de descarga" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span style="width:${pct}%"></span></div><strong>${pct}%</strong><small>${done} de ${total} archivos</small></div>`;
  }

  function selectedLanguages(){
    const selected=[...document.querySelectorAll('[data-offline-language]:checked')].map(el=>el.value).filter(x=>LANGUAGES[x]);
    return selected.length?selected:ALL_LANGUAGES;
  }

  async function prepare(slugs=ALL_LANGUAGES){
    if(location.protocol==='file:'){showInstallHelp();return}
    if(!('caches' in window)){MLS.toast('Este navegador no permite guardar la biblioteca sin Internet.');return}
    slugs=[...new Set(slugs)].filter(x=>LANGUAGES[x]);
    if(!slugs.length){MLS.toast('Elige al menos un idioma.');return}
    let wake=null;
    try{wake=await navigator.wakeLock?.request?.('screen')}catch{}
    try{
      await navigator.storage?.persist?.().catch(()=>false);
      const cache=await caches.open(LIBRARY_CACHE);
      const paths=filesFor(slugs);
      let done=0;setOverlay(done,paths.length);
      for(const path of paths){
        const req=new Request(path,{cache:'reload'});
        const resp=await fetch(req);
        if(!resp.ok)throw new Error(`${path}: ${resp.status}`);
        await cache.put(req,resp.clone());
        done++;setOverlay(done,paths.length);
      }
      if(!(await cacheHasFiles(cache,paths)))throw new Error('La verificación final del contenido guardado falló.');
      const previous=readState()?.savedLanguages||[];
      writeState([...new Set([...previous,...slugs])]);
      await verifyOfflineState();
      const used=await estimate();
      setOverlay(paths.length,paths.length,'✓ Biblioteca preparada');
      setTimeout(()=>{clearOverlay();if(location.hash.startsWith('#settings'))MLS.pages.settings?.();MLS.toast(`Biblioteca verificada${used?' · '+used:''}`,2600)},1000);
    }catch(err){
      await verifyOfflineState().catch(()=>{});
      const ov=configureOverlay(document.getElementById('offlineOverlay'),{role:'alertdialog',live:'assertive',modal:true});if(ov){ov.innerHTML=`<div class="offline-progress-card"><h2>No se pudo terminar</h2><p>${navigator.onLine?'Comprueba la conexión y vuelve a intentarlo.':'No hay conexión. Vuelve a intentarlo cuando estés en línea.'} Lo que ya estaba verificado se conserva.</p><small>${String(err.message||err)}</small><button class="btn primary" data-offline-retry>Reintentar</button><button class="btn" data-offline-close>Cerrar</button></div>`;focusOverlayAction(ov);ov.querySelector('[data-offline-retry]').onclick=()=>{clearOverlay();prepare(slugs)};ov.querySelector('[data-offline-close]').onclick=clearOverlay}
    }finally{try{await wake?.release?.()}catch{}}
  }

  async function refreshStatus(){
    await verifyOfflineState();
    const target=document.getElementById('offlineStatusText');
    if(target)target.innerHTML=statusMarkup();
    return verifiedState;
  }

  function announce(message,assertive=false){
    let node=document.getElementById('offlineLiveRegion');
    if(!node){
      node=document.createElement('div');
      node.id='offlineLiveRegion';
      node.className='sr-only';
      node.setAttribute('aria-live',assertive?'assertive':'polite');
      node.setAttribute('aria-atomic','true');
      document.body.appendChild(node);
    }
    node.setAttribute('aria-live',assertive?'assertive':'polite');
    node.textContent='';
    setTimeout(()=>{node.textContent=message},0);
  }

  function showMissingContent(url){
    lastMissingContentUrl=String(url||'');
    const slug=(lastMissingContentUrl.match(/\/data\/volumes\/([^/]+)\.js$/)||[])[1]||'';
    const label=LANGUAGES[slug]?.label||'Este contenido';
    const ov=configureOverlay(document.getElementById('offlineOverlay'),{role:'alertdialog',live:'assertive',modal:true});
    if(!ov){announce(`${label} no está disponible sin conexión.`,true);return}
    ov.innerHTML=`<div class="offline-progress-card"><h2>Contenido no disponible sin conexión</h2><p><strong>${label}</strong> no está guardado en este dispositivo.</p><p>Conéctate a Internet para abrirlo o guárdalo después desde Configuración → Usar sin Internet.</p><button class="btn primary" type="button" data-offline-retry-content>Reintentar</button><button class="btn" type="button" data-offline-close>Cerrar</button></div>`;
    focusOverlayAction(ov);
    ov.querySelector('[data-offline-retry-content]').onclick=()=>retryMissingContent();
    ov.querySelector('[data-offline-close]').onclick=clearOverlay;
  }

  async function retryMissingContent(){
    if(!navigator.onLine){announce('Todavía no hay conexión. Intenta de nuevo cuando vuelvas a estar en línea.',true);return}
    const url=lastMissingContentUrl;
    clearOverlay();
    announce('Conexión disponible. Reintentando contenido.');
    if(url){
      try{const response=await fetch(url,{cache:'reload'});if(!response.ok)throw new Error(String(response.status));location.reload();return}catch{}
    }
    location.reload();
  }

  async function handleOnline(){
    document.body.dataset.online='true';
    await refreshStatus().catch(()=>{});
    announce('Conexión restaurada. Las funciones en línea vuelven a estar disponibles.');
    MLS.toast?.('Conexión restaurada',2200);
  }

  function handleOffline(){
    document.body.dataset.online='false';
    announce('Sin conexión. Puedes seguir usando el contenido descargado. Las funciones de IA necesitan conexión.',true);
    MLS.toast?.('Sin conexión · contenido descargado disponible',3000);
  }

  function handleServiceWorkerMessage(event){
    const data=event?.data;
    if(!data||data.source!=='mls-offline')return;
    if(data.type==='offline-content-missing')showMissingContent(data.url);
  }

  function setMobileActive(){const h=location.hash||'#home';let key='home';if(h.startsWith('#search'))key='search';else if(h.startsWith('#themes'))key='themes';document.querySelectorAll('[data-mobile-nav]').forEach(a=>a.classList.toggle('active',a.dataset.mobileNav===key))}
  document.addEventListener('click',ev=>{
    const prep=ev.target.closest('[data-offline-prepare]');if(prep){ev.preventDefault();prepare(selectedLanguages());return}
    const all=ev.target.closest('[data-offline-all]');if(all){ev.preventDefault();prepare(ALL_LANGUAGES);return}
    const help=ev.target.closest('[data-install-help]');if(help){ev.preventDefault();showInstallHelp();return}
  });
  window.addEventListener('hashchange',()=>{setMobileActive();if(location.hash.startsWith('#settings'))setTimeout(refreshStatus,0)});
  window.addEventListener('online',handleOnline);
  window.addEventListener('offline',handleOffline);
  navigator.serviceWorker?.addEventListener?.('message',handleServiceWorkerMessage);
  document.addEventListener('DOMContentLoaded',()=>{document.body.dataset.ios=isIOS()?'true':'false';document.body.dataset.standalone=isStandalone()?'true':'false';document.body.dataset.online=navigator.onLine?'true':'false';setMobileActive();refreshStatus().catch(()=>{})});

  MLS.offline={
    SCHEMA_VERSION,LIBRARY_VERSION,LIBRARY_CACHE,LANGUAGES,ALL_LANGUAGES,
    isReady,hasLanguage,isStandalone,isIOS,prepare,verifyOfflineState,refreshStatus,discoverCachedLanguages,
    settingsBlock,homeCard,showInstallHelp,statusMarkup,handleOnline,handleOffline,showMissingContent,retryMissingContent,handleServiceWorkerMessage
  };
})();
