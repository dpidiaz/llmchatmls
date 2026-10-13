(()=>{
  'use strict';
  const MLS=window.MLS;
  const {esc,escAttr,norm,fmt,debounce}=MLS.util;

  function home(){
    const total=MLS_INDEX.length;
    MLS.app.innerHTML=`<section class="hero home-hero reading-home"><span class="eyebrow">Biblioteca Enciclopédica - Edición Digital</span><h1>MASTER LANGUAGE SYSTEM</h1><p>Diez idiomas. Un universo de ideas lingüísticas por descubrir.</p><nav class="home-language-flags" aria-label="Abrir un idioma en el Atlas">${MLS_META.map(m=>`<a href="#map=${m.slug}" aria-label="Abrir Atlas: ${esc(m.name)}" title="${esc(m.name)}">${m.flag}</a>`).join('')}</nav><div class="hero-actions"><a class="btn primary big-action" href="#map">Abrir Atlas</a></div><p class="rights-notice">© 2026 Josué David Díaz Ponce · <a href="derechos.html">Derechos reservados</a></p></section>${MLS.offline?.homeCard?.()||''}`;
  }

  function listCodes(title,codes){
    const rows=(codes||[]).map(code=>MLS.data.idxByCode[code]).filter(Boolean);
    MLS.app.innerHTML=`<section class="page-head simple-page-head"><div><h1>${esc(title)}</h1><p>${fmt(rows.length)} entradas</p></div></section><div class="results">${rows.length?rows.map(row=>MLS.resultCard(row)).join(''):MLS.ui.empty('Todavía no hay entradas aquí.')}</div>`;
    MLS.attachResultCards();
  }

  function languagePage(slug){
    const hash=location.hash,amp=hash.indexOf('&'),params=amp>=0?new URLSearchParams(hash.slice(amp+1)):new URLSearchParams();
    const level=params.get('level');
    location.hash=`#map=${slug}${level?`&level=${encodeURIComponent(level)}`:''}`;
  }

  function azPage(){
    const h=location.hash,amp=h.indexOf('&'),params=amp>=0?new URLSearchParams(h.slice(amp+1)):new URLSearchParams(),lang=params.get('lang')||'',letter=(params.get('letter')||'A').toUpperCase(),base=lang?(MLS.data.byLanguage[lang]||[]):MLS_INDEX,letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const firstLetter=e=>{const t=norm(e.title).trim(),c=t[0]?.toUpperCase()||'#';return/[A-Z]/.test(c)?c:'#'};
    const counts=Object.fromEntries([...letters,'#'].map(l=>[l,base.filter(e=>firstLetter(e)===l).length]));
    const rows=base.filter(e=>firstLetter(e)===letter).sort((a,b)=>a.title.localeCompare(b.title,'es')).slice(0,600);
    MLS.app.innerHTML=`<section class="page-head simple-page-head"><div><h1>A–Z</h1><p>Busca por la primera letra.</p></div></section><div class="toolbar"><select id="azLang"><option value="">Todos los idiomas</option>${MLS_META.map(m=>`<option value="${m.slug}" ${m.slug===lang?'selected':''}>${m.flag} ${esc(m.name)}</option>`).join('')}</select></div><nav class="alphabet-strip">${[...letters,'#'].map(l=>`<a class="${l===letter?'active':''} ${counts[l]?'':'disabled'}" href="#az${lang?`&lang=${lang}`:''}&letter=${encodeURIComponent(l)}"><strong>${l}</strong></a>`).join('')}</nav><div class="az-list">${rows.length?rows.map(e=>`<a href="#entry=${e.code}"><span class="az-title">${esc(e.title)}</span>${e.target?`<span class="az-target">${esc(e.target)}</span>`:''}</a>`).join(''):MLS.ui.empty('No hay temas con esta letra.')}</div>`;
    document.getElementById('azLang').onchange=ev=>location.hash=`#az${ev.target.value?`&lang=${ev.target.value}`:''}&letter=${encodeURIComponent(letter)}`;
  }

  function themesPage(){
    const amp=location.hash.indexOf('&'),params=amp>=0?new URLSearchParams(location.hash.slice(amp+1)):new URLSearchParams(),slug=params.get('lang');
    location.hash=slug?`#map=${slug}`:'#map';
  }

  function offlinePage(){
    const ready=MLS.offline?.isReady?.()||false;
    MLS.app.innerHTML=`<section class="page-head simple-page-head"><div><h1>Uso offline</h1><p>Instala MLS en tu pantalla de inicio y guarda la biblioteca para consultarla sin Internet.</p></div></section><section class="offline-guide panel"><h2>1. Añade MLS a tu pantalla de inicio</h2><div class="offline-guide-grid"><article><h3>iPhone</h3><ol><li>Abre la dirección publicada de MLS en <strong>Safari</strong>.</li><li>Toca <strong>Compartir</strong> y elige <strong>Añadir a pantalla de inicio</strong>.</li><li>Activa <strong>Abrir como app web</strong>, si aparece, y toca <strong>Añadir</strong>.</li><li>Abre MLS desde el nuevo icono.</li></ol><a href="https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/27/ios/27">Guía oficial de Apple</a></article><article><h3>Android</h3><ol><li>Abre la dirección publicada de MLS en <strong>Chrome</strong>.</li><li>Toca el menú <strong>⋮</strong> y elige <strong>Instalar app</strong> o <strong>Instalar y crear acceso directo</strong>.</li><li>Toca <strong>Instalar</strong> y abre MLS desde el icono.</li></ol><a href="https://support.google.com/chrome/answer/9658361?co=GENIE.Platform%3DAndroid&amp;hl=es-419">Guía oficial de Chrome</a></article></div><h2>2. Guarda la biblioteca en el dispositivo</h2><ol><li>Con Internet, abre MLS desde su icono y entra aquí en <strong>Uso offline</strong>.</li><li>Toca <strong>${ready?'Guardar de nuevo':'Preparar biblioteca'}</strong>. Se guardan los diez idiomas (aprox. 250 MB).</li><li>Mantén esta pantalla abierta hasta que indique <strong>Lista sin Internet</strong>.</li><li>Desconéctate o activa el modo avión y abre MLS desde el icono para comprobarlo.</li></ol><p class="offline-guide-note">La dirección debe ser HTTPS y estar publicada. Una dirección local como <code>127.0.0.1</code> solo se abre en la computadora donde se ejecuta. Eliminar la copia offline libera ese espacio sin desinstalar MLS.</p></section><section class="setting-row offline-setting"><div><h2>Estado en este dispositivo</h2><div id="offlineStatusText">${MLS.offline?.statusMarkup?.()||'<div class="offline-status"><strong>Preparación disponible</strong><span>Conéctate a Internet para guardar la biblioteca.</span></div>'}</div></div><div class="offline-actions"><button class="btn primary" type="button" data-offline-prepare>${ready?'Guardar de nuevo':'Preparar biblioteca'}</button><button class="btn" type="button" data-offline-remove>Eliminar copia offline</button></div></section>`;
  }
  function settingsPage(){
    MLS.app.innerHTML=`<section class="page-head simple-page-head"><div><h1>Configuración</h1><p>Cambia cómo se ve la biblioteca.</p></div></section><div class="settings-list"><section class="setting-row"><div><h2>Encyclopedia Uso offline</h2><p>Función de administrador.</p></div><label class="switch"><input id="offlinePageToggle" type="checkbox" ${MLS.offline?.isPageVisible?.()!==false?'checked':''}><span></span></label></section><section class="setting-row"><div><h2>Índice de secciones</h2><p>Muestra los encabezados del artículo en el panel lateral. El texto completo de R32 siempre aparece en la entrada.</p></div><label class="switch"><input id="advancedToggle" type="checkbox" ${MLS.state.advancedDetails?'checked':''}><span></span></label></section><section class="setting-row"><div><h2>Referencias (APA 7)</h2><p>Muestra las referencias al final de cada entrada.</p></div><label class="switch"><input id="referencesToggle" type="checkbox" ${MLS.state.showReferences?'checked':''}><span></span></label></section><section class="setting-row"><div><h2>Lectura continua</h2><p>Carga las entradas anteriores o siguientes del mismo capítulo al desplazarte. Puedes desactivarla para leer una entrada a la vez.</p></div><label class="switch"><input id="continuousReadingToggle" type="checkbox" ${MLS.state.continuousReading?'checked':''}><span></span></label></section><section class="setting-row"><div><h2>Tamaño de letra</h2><p>Elige el tamaño más cómodo.</p></div><select id="textSize"><option value="large" ${MLS.state.textSize==='large'?'selected':''}>Grande</option><option value="xlarge" ${MLS.state.textSize==='xlarge'?'selected':''}>Muy grande</option><option value="normal" ${MLS.state.textSize==='normal'?'selected':''}>Normal</option></select></section><section class="setting-row"><div><h2>Fondo</h2><p>Claro u oscuro.</p></div><select id="themeMode"><option value="light" ${MLS.state.theme==='light'?'selected':''}>Claro</option><option value="dark" ${MLS.state.theme==='dark'?'selected':''}>Oscuro</option></select></section></div>`;
    const offlinePageToggle=document.getElementById('offlinePageToggle');offlinePageToggle.onchange=ev=>{const desired=ev.target.checked;ev.target.checked=!desired;MLS.offline?.requestPageVisibility?.(desired)};
    document.getElementById('advancedToggle').onchange=ev=>{MLS.state.advancedDetails=ev.target.checked;MLS.save();MLS.toast('Configuración guardada')};
    document.getElementById('referencesToggle').onchange=ev=>{MLS.state.showReferences=ev.target.checked;MLS.save();MLS.toast('Configuración guardada')};
    document.getElementById('continuousReadingToggle').onchange=ev=>{MLS.state.continuousReading=ev.target.checked;MLS.save();MLS.toast('Configuración guardada')};
    document.getElementById('textSize').onchange=ev=>{MLS.state.textSize=ev.target.value;MLS.save();MLS.applyPrefs()};
    document.getElementById('themeMode').onchange=ev=>{MLS.state.theme=ev.target.value;MLS.save();MLS.applyPrefs()};
  }

  const sidebar=document.getElementById('sidebar'),menuBtn=document.getElementById('menuBtn'),isOverlayMenu=()=>matchMedia('(max-width: 900px)').matches;
  const syncMenuButton=()=>menuBtn.setAttribute('aria-label',isOverlayMenu()?(sidebar.classList.contains('open')?'Cerrar menú':'Abrir menú'):(document.body.classList.contains('sidebar-hidden')?'Mostrar menú':'Ocultar menú'));
  const toggleSidebar=()=>{if(isOverlayMenu())sidebar.classList.toggle('open');else document.body.classList.toggle('sidebar-hidden');syncMenuButton()};

  function route(){
    MLS.setSidebarActive();
    const h=location.hash||'#home';
    if(h.startsWith('#entry='))MLS.reader.page(h.slice(7));
    else if(h.startsWith('#map'))MLS.pages.map();
    else if(h.startsWith('#lang=')){const rest=h.slice(6),amp=rest.indexOf('&'),slug=amp<0?rest:rest.slice(0,amp);languagePage(slug)}
    else if(h.startsWith('#search'))MLS.search.page();
    else if(h.startsWith('#offline')){if(MLS.offline?.isPageVisible?.()===false){location.hash='#settings';return}offlinePage()}
    else if(h.startsWith('#az'))azPage();
    else if(h.startsWith('#themes'))themesPage();
    else if(h.startsWith('#compare'))MLS.compare.page();
    else if(h.startsWith('#favorites'))listCodes('Guardados',MLS.state.favorites);
    else if(h.startsWith('#recent'))listCodes('Recientes',MLS.state.recent);
    else if(h.startsWith('#settings'))settingsPage();
    else home();
    MLS.app.focus();
    document.getElementById('sidebar').classList.remove('open');
    syncMenuButton();
  }

  window.addEventListener('hashchange',route);
  route();
  menuBtn.onclick=toggleSidebar;
  document.getElementById('mobileMoreBtn')?.addEventListener('click',toggleSidebar);
  window.addEventListener('resize',syncMenuButton);
  syncMenuButton();
  if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('sw.js').then(()=>document.getElementById('offlineState').textContent='Biblioteca local').catch(()=>{});
  MLS.route=route;MLS.pages.home=home;MLS.pages.language=languagePage;MLS.pages.offline=offlinePage;MLS.pages.az=azPage;MLS.pages.themes=themesPage;MLS.pages.settings=settingsPage;
})();










