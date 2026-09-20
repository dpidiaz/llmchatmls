(()=>{
  'use strict';
  const MLS=window.MLS;
  const {esc,escAttr,short}=MLS.util;

  // El lector canónico es la única ruta de lectura de entradas.
  // Mantener esta bandera evita que cualquier materializador global compita
  // con el contenido publicado en GitHub.
  window.__MLS_NATIVE_READER_MATERIALIZER__=true;

  const jsonTasks=new Map();
  let manifestTask=null;

  function stripSpeak(s){
    return String(s||'')
      .replace(/\*\*/g,'')
      .replace(/`/g,'')
      .replace(/[#>*_~\[\]()]/g,' ')
      .replace(/\n/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }

  function scrollPageToAbsoluteTop(){
    document.documentElement.scrollTop=0;
    if(document.body)document.body.scrollTop=0;
    window.scrollTo({top:0,left:0,behavior:'auto'});
  }

  const READING_PROGRESS_KEY='mls.readingProgress.v1';
  const RESUME_INTENT_KEY='mls.resumeIntent.v1';
  const RESUME_INTENT_MAX_AGE=5*60*1000;
  const READING_PROGRESS_LIMIT=120;
  let activeReadingCode='';
  let readingProgressTimer=null;

  function validEntryCode(code){
    return /^MLS-V\d{2}-\d{4}$/.test(String(code||'').trim().toUpperCase());
  }

  function storageJson(storage,key,fallback){
    try{
      const raw=storage?.getItem?.(key);
      if(!raw)return fallback;
      const value=JSON.parse(raw);
      return value&&typeof value==='object'?value:fallback;
    }catch{return fallback}
  }

  function readProgressMap(){
    return storageJson(window.localStorage,READING_PROGRESS_KEY,{});
  }

  function writeProgressMap(map){
    try{window.localStorage?.setItem?.(READING_PROGRESS_KEY,JSON.stringify(map))}catch{}
  }

  function nearbyHeading(){
    const headings=[...document.querySelectorAll('.permanent-entry-body h1[id],.permanent-entry-body h2[id],.permanent-entry-body h3[id],.permanent-entry-body h4[id],.permanent-entry-body h5[id],.permanent-entry-body h6[id]')];
    let best=null;
    for(const heading of headings){
      const top=heading.getBoundingClientRect().top;
      if(top<=160)best=heading;
      else break;
    }
    return best;
  }

  function captureReadingProgress(code=activeReadingCode){
    const normalized=String(code||'').trim().toUpperCase();
    if(!validEntryCode(normalized))return;
    const scrollY=Math.max(0,Math.round(window.scrollY||document.documentElement.scrollTop||document.body?.scrollTop||0));
    const heading=nearbyHeading();
    const headingTop=heading?Math.round(scrollY+heading.getBoundingClientRect().top):null;
    const map=readProgressMap();
    map[normalized]={
      scrollY,
      headingId:heading?.id||'',
      headingOffset:heading?Math.max(0,scrollY-headingTop):0,
      updatedAt:Date.now()
    };
    const entries=Object.entries(map)
      .filter(([entryCode,value])=>validEntryCode(entryCode)&&value&&Number.isFinite(Number(value.updatedAt)))
      .sort((a,b)=>Number(b[1].updatedAt)-Number(a[1].updatedAt))
      .slice(0,READING_PROGRESS_LIMIT);
    writeProgressMap(Object.fromEntries(entries));
  }

  function scheduleReadingProgress(){
    if(!activeReadingCode)return;
    clearTimeout(readingProgressTimer);
    readingProgressTimer=setTimeout(()=>captureReadingProgress(),350);
  }

  function savedReadingProgress(code){
    const normalized=String(code||'').trim().toUpperCase();
    if(!validEntryCode(normalized))return null;
    const value=readProgressMap()[normalized];
    if(!value||typeof value!=='object')return null;
    const scrollY=Number(value.scrollY);
    const updatedAt=Number(value.updatedAt);
    if(!Number.isFinite(scrollY)||scrollY<0||!Number.isFinite(updatedAt)||updatedAt<=0)return null;
    return {
      scrollY,
      headingId:typeof value.headingId==='string'?value.headingId:'',
      headingOffset:Number.isFinite(Number(value.headingOffset))?Math.max(0,Number(value.headingOffset)):0,
      updatedAt
    };
  }

  function requestResume(code){
    const normalized=String(code||'').trim().toUpperCase();
    if(!validEntryCode(normalized))return false;
    try{
      window.sessionStorage?.setItem?.(RESUME_INTENT_KEY,JSON.stringify({code:normalized,at:Date.now()}));
      return true;
    }catch{return false}
  }

  function consumeResumeIntent(code){
    const normalized=String(code||'').trim().toUpperCase();
    let intent=null;
    try{
      intent=storageJson(window.sessionStorage,RESUME_INTENT_KEY,null);
      window.sessionStorage?.removeItem?.(RESUME_INTENT_KEY);
    }catch{}
    if(!intent||String(intent.code||'').toUpperCase()!==normalized)return false;
    const at=Number(intent.at);
    return Number.isFinite(at)&&at>0&&Date.now()-at<=RESUME_INTENT_MAX_AGE;
  }

  function restoreReadingProgress(code){
    const saved=savedReadingProgress(code);
    if(!saved)return false;
    let target=saved.scrollY;
    if(saved.headingId){
      const heading=document.getElementById(saved.headingId);
      if(heading){
        const current=Math.max(0,window.scrollY||document.documentElement.scrollTop||document.body?.scrollTop||0);
        target=current+heading.getBoundingClientRect().top+saved.headingOffset;
      }
    }
    const max=Math.max(0,(document.documentElement.scrollHeight||document.body?.scrollHeight||0)-window.innerHeight);
    const top=Math.max(0,Math.min(Math.round(target),max||Math.round(target)));
    window.scrollTo({top,left:0,behavior:'auto'});
    return true;
  }

  function installReadingProgressTracking(){
    if(window.__MLS_READING_PROGRESS_TRACKING__)return;
    window.__MLS_READING_PROGRESS_TRACKING__=true;
    window.addEventListener('scroll',scheduleReadingProgress,{passive:true});
    window.addEventListener('pagehide',()=>captureReadingProgress());
    document.addEventListener('visibilitychange',()=>{
      if(document.visibilityState==='hidden')captureReadingProgress();
    });
  }

  installReadingProgressTracking();

  function versioned(url,buildId){
    if(!buildId)return url;
    const join=url.includes('?')?'&':'?';
    return url+join+'v='+encodeURIComponent(String(buildId).slice(0,16));
  }

  async function fetchJson(url){
    if(jsonTasks.has(url))return jsonTasks.get(url);
    const task=(async()=>{
      const response=await fetch(url,{
        cache:'no-cache',
        headers:{accept:'application/json','cache-control':'no-cache'}
      });
      if(!response.ok)throw new Error('No se pudo cargar '+url+' (HTTP '+response.status+').');
      return response.json();
    })();
    jsonTasks.set(url,task);
    try{return await task}catch(error){jsonTasks.delete(url);throw error}
  }

  async function runtimeManifest(){
    if(!manifestTask){
      manifestTask=fetchJson('/data/canonical/runtime-manifest.json').then(manifest=>{
        if(!manifest||manifest.standard!=='MLS R32'||manifest.promptVersion!=='32.0'){
          throw new Error('Runtime manifest canónico inválido.');
        }
        if(Number(manifest.totalEntries)!==10133){
          throw new Error('Runtime manifest incompleto: '+manifest.totalEntries+'.');
        }
        return manifest;
      }).catch(error=>{manifestTask=null;throw error});
    }
    return manifestTask;
  }

  function languageFromCode(manifest,code){
    const normalized=String(code||'').trim().toUpperCase();
    for(const [slug,info] of Object.entries(manifest.languages||{})){
      if(normalized.startsWith(String(info.prefix||'')+'-'))return {slug,info};
    }
    return null;
  }

  async function catalogFor(manifest,language,info){
    const url=versioned('/data/canonical/'+info.catalog,manifest.corpusBuildId);
    const catalog=await fetchJson(url);
    if(!catalog||catalog.language!==language||catalog.promptVersion!=='32.0'||!Array.isArray(catalog.entries)){
      throw new Error('Catálogo canónico inválido para '+language+'.');
    }
    return catalog;
  }

  function shardDescriptor(info,n){
    return (info.shards||[]).find(item=>Number(n)>=Number(item.start)&&Number(n)<=Number(item.end))||null;
  }

  async function canonicalPayload(code){
    const normalized=String(code||'').trim().toUpperCase();
    const manifest=await runtimeManifest();
    const languageHit=languageFromCode(manifest,normalized);
    if(!languageHit)throw new Error('Código canónico desconocido: '+normalized+'.');

    const {slug:language,info}=languageHit;
    const catalog=await catalogFor(manifest,language,info);
    const meta=catalog.entries.find(item=>item.code===normalized);
    if(!meta)throw new Error(normalized+' no existe en el catálogo canónico.');

    const descriptor=shardDescriptor(info,meta.n);
    if(!descriptor)throw new Error(normalized+' no tiene shard canónico.');

    const shardUrl=versioned('/data/canonical/'+descriptor.path,manifest.corpusBuildId);
    const shard=await fetchJson(shardUrl);
    const article=shard&&shard.entries?shard.entries[normalized]:null;
    if(!article)throw new Error(normalized+' no existe dentro de su shard canónico.');
    if(article.promptVersion!=='32.0')throw new Error(normalized+' no es R32.');
    if(/legacy/i.test(String(article.provider||''))||/legacy/i.test(String(article.auditProvider||''))){
      throw new Error(normalized+' contiene procedencia legacy.');
    }
    if(!String(article.articleMarkdown||'').trim())throw new Error(normalized+' no contiene articleMarkdown.');

    return {manifest,language,info,catalog,meta,article};
  }

  function normalizeArticleMarkdown(value,prefix){
    return String(value||'')
      .replace(/\$\s*\\(?:rightarrow|to)\s*\$/gi,'→')
      .replace(/\$\s*\\leftarrow\s*\$/gi,'←')
      .replace(/\$\s*\\(?:Rightarrow|Longrightarrow)\s*\$/g,'⇒')
      .replace(/\$\s*\\(?:Leftarrow|Longleftarrow)\s*\$/g,'⇐')
      .replace(/\\(?:rightarrow|to)\b/gi,'→')
      .replace(/\\leftarrow\b/gi,'←')
      .replace(/\\(?:Rightarrow|Longrightarrow)\b/g,'⇒')
      .replace(/\\(?:Leftarrow|Longleftarrow)\b/g,'⇐')
      .replace(/&#x20;|&#32;|&nbsp;/gi,' ')
      .replace(/\\([*_])/g,'$1')
      .replace(/([\p{L}\p{N}])\*(?=\s*(?:\n|$))/gu,'$1')
      .replace(/([\p{L}\p{N}])\*([.,;:!?])/gu,'$1$2')
      .replace(/\]\(#entry-(\d+)\)/gi,(_,n)=>'](#entry='+prefix+'-'+String(Number(n)).padStart(4,'0')+')')
      .replace(/[ \t]+\n/g,'\n')
      .replace(/[ \t]{2,}/g,' ')
      .trim();
  }

  function relatedFromMarkdown(markdown,catalog){
    const byCode=new Map(catalog.entries.map(item=>[item.code,item]));
    const seen=new Set();
    const related=[];
    for(const match of String(markdown||'').matchAll(/#entry=(MLS-V\d{2}-\d{4})/gi)){
      const code=String(match[1]).toUpperCase();
      if(seen.has(code))continue;
      const item=byCode.get(code);
      if(item){seen.add(code);related.push(item)}
    }
    return related.slice(0,12);
  }

  function canonicalUnavailable(code,error){
    console.error('MASTER LANGUAGE SYSTEM: canonical entry unavailable',code,error);
    MLS.app.innerHTML=`<div class="reader-wide reading-first">
      <main class="reader-main">
        <section class="reader-head simple-head">
          <div class="simple-meta">MASTER LANGUAGE SYSTEM · R32</div>
          <h1>Contenido no disponible</h1>
          <p>No fue posible cargar la entrada canónica <strong>${esc(code)}</strong>. Por seguridad, MLS no mostrará contenido antiguo como reemplazo.</p>
          <div class="reader-actions simple-actions">
            <button class="btn primary" id="canonicalRetry" type="button">Reintentar</button>
            <a class="btn" href="#">Volver</a>
          </div>
        </section>
      </main>
    </div>`;
    document.getElementById('canonicalRetry')?.addEventListener('click',()=>{
      manifestTask=null;
      jsonTasks.clear();
      page(code);
    });
  }

  async function page(code){
    captureReadingProgress();
    const scrollBeforeRender=Math.max(0,Math.round(window.scrollY||document.documentElement.scrollTop||document.body?.scrollTop||0));
    const normalized=String(code||'').trim().toUpperCase();
    const resumeRequested=consumeResumeIntent(normalized);
    const previousCode=document.documentElement.dataset.mlsCurrentEntryCode||'';
    const entryChanged=previousCode!==normalized;
    document.documentElement.dataset.mlsCurrentEntryCode=normalized;
    activeReadingCode='';
    if(entryChanged&&!resumeRequested)scrollPageToAbsoluteTop();

    MLS.app.innerHTML='<div class="loading">Abriendo contenido canónico…</div>';

    let payload;
    try{
      payload=await canonicalPayload(normalized);
    }catch(error){
      canonicalUnavailable(normalized,error);
      return;
    }

    const {manifest,language,info,catalog,meta,article}=payload;
    MLS.state.currentLang=language;
    MLS.state.recent=[normalized,...MLS.state.recent.filter(x=>x!==normalized)].slice(0,80);
    MLS.save();

    const m=MLS.data.metaBySlug?.[language]||{
      slug:language,
      name:article.languageName||info.name||language,
      flag:''
    };

    const markdown=normalizeArticleMarkdown(article.articleMarkdown,info.prefix);
    const e={
      ...meta,
      ...article,
      code:normalized,
      language,
      articleMarkdown:markdown,
      body:markdown,
      auditedBody:markdown,
      definition:markdown
    };

    const languageEntries=[...catalog.entries].sort((a,b)=>Number(a.n)-Number(b.n));
    const pos=languageEntries.findIndex(item=>item.code===normalized);
    const prev=pos>0?languageEntries[pos-1]:null;
    const next=pos>=0&&pos<languageEntries.length-1?languageEntries[pos+1]:null;
    const chapterEntries=languageEntries.filter(item=>item.chapter===meta.chapter);
    const related=relatedFromMarkdown(markdown,catalog);
    const outline=MLS.entryOutline(markdown);
    const fav=MLS.state.favorites.includes(normalized);

    const chapterIndex=chapterEntries.map((item,i)=>`<a class="local-entry ${item.code===normalized?'active':''}" href="#entry=${escAttr(item.code)}"><span>${String(i+1).padStart(2,'0')}</span><div><strong>${esc(item.title)}</strong></div></a>`).join('');
    const relatedHTML=related.length
      ?related.map(item=>`<a class="related-link" href="#entry=${escAttr(item.code)}"><strong>${esc(item.title)}</strong></a>`).join('')
      :'<span class="muted-note">No hay enlaces directos desde esta entrada.</span>';
    const outlineHTML=outline.length
      ?outline.map(item=>`<button type="button" data-scroll="${escAttr(item.id)}">${esc(short(item.label))}</button>`).join('')
      :'';

    MLS.app.innerHTML=`<div class="reader-wide reading-first">
      <div class="crumbs reader-crumbs"><a href="#lang=${escAttr(m.slug||language)}">${m.flag||''} ${esc(m.name||article.languageName||language)}</a><span>›</span><span>${esc(meta.chapter||'Entrada')}</span></div>
      <details class="mobile-local-index"><summary>Ver temas de este capítulo</summary><div class="local-entry-list">${chapterIndex}</div></details>
      <div class="reader-layout">
        <aside class="reader-left"><div class="sticky-reader-panel"><div class="reader-panel-label">En este capítulo</div><div class="local-entry-list">${chapterIndex}</div></div></aside>
        <main class="reader-main">
          <section class="reader-head simple-head">
            <div class="simple-meta">${m.flag||''} ${esc(m.name||article.languageName||language)} · ${esc(article.level||'')}</div>
            <h1>${esc(article.title)}</h1>
            <nav class="reader-actions simple-actions" aria-label="Navegación entre temas">${prev?`<a class="btn" href="#entry=${escAttr(prev.code)}" rel="prev">← Anterior</a>`:'<button class="btn" type="button" disabled aria-disabled="true">← Anterior</button>'}${next?`<a class="btn primary" href="#entry=${escAttr(next.code)}" rel="next">Siguiente →</a>`:'<button class="btn primary" type="button" disabled aria-disabled="true">Siguiente →</button>'}</nav>
            <div class="reader-actions simple-actions"><button class="btn primary" id="listenBtn">🔊 Escuchar</button><button class="btn ai-entry-btn" id="aiExplainBtn">✨ Profesor IA</button><button class="btn" id="favBtn">${fav?'★ Guardado':'☆ Guardar'}</button></div>
          </section>
          <div class="replacement-status ready" id="replacementStatus" role="status">Contenido canónico · GitHub · R32 · build ${esc(String(manifest.corpusBuildId||'').slice(0,10))}</div>
          <article class="plain-entry permanent-entry" aria-label="Explicación">
            <article class="entry-body permanent-entry-body">${MLS.renderMarkdown(markdown,language)}</article>
          </article>
          <nav class="easy-entry-nav" aria-label="Siguiente o anterior">${prev?`<a class="btn" href="#entry=${escAttr(prev.code)}">← Anterior</a>`:'<span></span>'}<a class="btn" href="#lang=${escAttr(m.slug||language)}">Temas</a>${next?`<a class="btn primary" href="#entry=${escAttr(next.code)}">Siguiente →</a>`:'<span></span>'}</nav>
        </main>
        <aside class="reader-right"><div class="sticky-reader-panel">
          ${outlineHTML?`<section class="reader-context-section"><div class="reader-panel-label">En esta entrada</div><nav class="entry-outline">${outlineHTML}</nav></section>`:''}
          <section class="reader-context-section"><div class="reader-panel-label">También mira</div><div class="related-list">${relatedHTML}</div></section>
        </div></aside>
      </div>
    </div>`;

    activeReadingCode=normalized;
    if(resumeRequested){
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        if(!restoreReadingProgress(normalized))scrollPageToAbsoluteTop();
      }));
    }else if(entryChanged){
      scrollPageToAbsoluteTop();
      requestAnimationFrame(scrollPageToAbsoluteTop);
    }else{
      requestAnimationFrame(()=>window.scrollTo({top:scrollBeforeRender,left:0,behavior:'auto'}));
    }

    const speechFor=entry=>[entry.title,entry.articleMarkdown].filter(Boolean).join('. ');
    document.getElementById('listenBtn').onclick=()=>MLS.speak(stripSpeak(speechFor(e)));
    document.getElementById('aiExplainBtn').onclick=()=>MLS.aiTutor?.open(e,m);
    document.getElementById('favBtn').onclick=()=>{
      if(MLS.state.favorites.includes(normalized))MLS.state.favorites=MLS.state.favorites.filter(x=>x!==normalized);
      else MLS.state.favorites.push(normalized);
      MLS.save();
      page(normalized);
    };
    document.querySelectorAll('[data-scroll]').forEach(button=>{
      button.onclick=()=>document.getElementById(button.dataset.scroll)?.scrollIntoView({behavior:'smooth',block:'start'});
    });
  }

  MLS.reader={page,requestResume,captureReadingProgress,savedReadingProgress};
  MLS.pages.entry=page;
})();
