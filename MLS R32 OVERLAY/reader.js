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

  async function relatedForEntry(markdown,catalog,manifest,language,currentCode,limit=5){
    const editorial=relatedFromMarkdown(markdown,catalog).slice(0,limit);
    if(editorial.length>=limit)return editorial;

    try{
      const relatedManifest=await fetchJson(versioned('/data/related/manifest.json',manifest.corpusBuildId));
      const descriptor=relatedManifest?.languages?.[language];
      if(
        relatedManifest?.standard!=='MLS R32'||
        relatedManifest?.promptVersion!=='32.0'||
        relatedManifest?.version!=='1.0'||
        relatedManifest?.source!=='semantic-neighbors'||
        relatedManifest?.corpusBuildId!==manifest.corpusBuildId||
        !descriptor?.file
      )throw new Error('Manifest de relacionados incompatible.');

      const payload=await fetchJson(versioned('/data/related/'+descriptor.file,manifest.corpusBuildId));
      if(
        payload?.standard!=='MLS R32'||
        payload?.promptVersion!=='32.0'||
        payload?.version!=='1.0'||
        payload?.source!=='semantic-neighbors'||
        payload?.corpusBuildId!==manifest.corpusBuildId||
        payload?.language!==language||
        !payload?.neighbors||
        typeof payload.neighbors!=='object'
      )throw new Error('Payload de relacionados incompatible.');

      const byCode=new Map(catalog.entries.map(item=>[item.code,item]));
      const seen=new Set([currentCode,...editorial.map(item=>item.code)]);
      const combined=[...editorial];
      const semanticCodes=Array.isArray(payload.neighbors[currentCode])?payload.neighbors[currentCode]:[];
      for(const candidateCode of semanticCodes){
        const code=String(candidateCode||'').toUpperCase();
        if(seen.has(code))continue;
        const item=byCode.get(code);
        if(!item)continue;
        seen.add(code);
        combined.push(item);
        if(combined.length>=limit)break;
      }
      return combined;
    }catch(error){
      console.warn('MLS related supplemental fallback',language,error);
      return editorial;
    }
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
    const normalized=String(code||'').trim().toUpperCase();
    const previousCode=document.documentElement.dataset.mlsCurrentEntryCode||'';
    const entryChanged=previousCode!==normalized;
    document.documentElement.dataset.mlsCurrentEntryCode=normalized;
    if(entryChanged)scrollPageToAbsoluteTop();

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
    const related=await relatedForEntry(markdown,catalog,manifest,language,normalized,5);
    const outline=MLS.entryOutline(markdown);
    const fav=MLS.state.favorites.includes(normalized);

    const chapterIndex=chapterEntries.map((item,i)=>`<a class="local-entry ${item.code===normalized?'active':''}" href="#entry=${escAttr(item.code)}"><span>${String(i+1).padStart(2,'0')}</span><div><strong>${esc(item.title)}</strong></div></a>`).join('');
    const relatedHTML=related.length
      ?related.map(item=>`<a class="related-link" href="#entry=${escAttr(item.code)}"><strong>${esc(item.title)}</strong></a>`).join('')
      :'<span class="muted-note">No hay temas relacionados disponibles.</span>';
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

    if(entryChanged){
      scrollPageToAbsoluteTop();
      requestAnimationFrame(scrollPageToAbsoluteTop);
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

  MLS.reader={page};
  MLS.pages.entry=page;
})();
