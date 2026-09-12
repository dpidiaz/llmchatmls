(()=>{
  'use strict';
  const MLS=window.MLS;const {esc,escAttr,short}=MLS.util;
  function stripSpeak(s){return String(s||'').replace(/\*\*/g,'').replace(/`/g,'').replace(/\n/g,' ').replace(/\s+/g,' ').trim()}
  async function page(code){
    const idx=MLS.data.idxByCode[code];if(!idx){MLS.app.innerHTML=MLS.ui.empty('No encontré esta entrada.');return}
    MLS.state.currentLang=idx.language;MLS.app.innerHTML='<div class="loading">Abriendo…</div>';
    const vol=await MLS.loadVolume(idx.language),e=vol.entries.find(x=>x.code===code);if(!e){MLS.app.innerHTML=MLS.ui.empty('No encontré esta entrada.');return}
    MLS.state.recent=[code,...MLS.state.recent.filter(x=>x!==code)].slice(0,80);MLS.save();
    const m=MLS.data.metaBySlug[e.language],pos=vol.entries.findIndex(x=>x.code===code),prev=vol.entries[pos-1],next=vol.entries[pos+1];
    const chapterEntries=vol.entries.filter(x=>String(x.chapterNum)===String(e.chapterNum)).sort((a,b)=>a.n-b.n),chapterPos=chapterEntries.findIndex(x=>x.code===code);
    const related=MLS.extractRelations(e.body,e.language),outline=MLS.entryOutline(e.body),fav=MLS.state.favorites.includes(code);
    const chapterHash=`#lang=${m.slug}&part=${encodeURIComponent(e.partNum)}&chapter=${encodeURIComponent(e.chapterNum)}`;
    const chapterIndex=chapterEntries.map((x,i)=>`<a class="local-entry ${x.code===code?'active':''}" href="#entry=${x.code}"><span>${String(i+1).padStart(2,'0')}</span><div><strong>${esc(x.title)}</strong>${x.target?`<small>${esc(x.target)}</small>`:''}</div></a>`).join('');
    const relatedHTML=related.length?related.map(x=>`<a class="related-link" href="#entry=${x.code}"><strong>${esc(x.title)}</strong></a>`).join(''):'<span class="muted-note">No hay enlaces directos desde esta entrada.</span>';
    const easy=e.plain||{lead:e.definition||'',example:'',look:''};
    const example=easy.example?`<section class="plain-block example-block"><h2>Ejemplo</h2><div class="easy-example">${MLS.renderEasyInline(easy.example)}</div></section>`:'';
    const look=easy.look?`<section class="plain-block look-block"><h2>Mira</h2><p>${esc(easy.look)}</p></section>`:'';
    const advanced=MLS.state.advancedDetails?`<section class="advanced-details"><div class="advanced-title"><span>Detalles avanzados</span><small>Información técnica y de referencia</small></div><article class="entry-body">${MLS.renderMarkdown(e.auditedBody||e.body,e.language)}</article></section>`:'';
    const outlineHTML=MLS.state.advancedDetails&&outline.length?outline.map(x=>`<button type="button" data-scroll="${escAttr(x.id)}">${esc(short(x.label))}</button>`).join(''):'';
    const speech=[e.title,easy.lead,stripSpeak(easy.example)].filter(Boolean).join('. ');
    MLS.app.innerHTML=`<div class="reader-wide reading-first">
      <div class="crumbs reader-crumbs"><a href="#lang=${m.slug}">${m.flag} ${esc(m.name)}</a><span>›</span><a href="${chapterHash}">Capítulo ${esc(e.chapterNum)}</a></div>
      <details class="mobile-local-index"><summary>Ver temas de este capítulo</summary><div class="local-entry-list">${chapterIndex}</div></details>
      <div class="reader-layout">
        <aside class="reader-left"><div class="sticky-reader-panel"><div class="reader-panel-label">En este capítulo</div><div class="local-entry-list">${chapterIndex}</div></div></aside>
        <main class="reader-main">
          <section class="reader-head simple-head">
            <div class="simple-meta">${m.flag} ${esc(m.name)} · ${esc(e.level)}</div>
            <h1>${esc(e.title)}</h1>${e.target?`<div class="target-title">${esc(e.target)}</div>`:''}
            <div class="reader-actions simple-actions"><button class="btn primary" id="listenBtn">🔊 Escuchar</button><button class="btn ai-entry-btn" id="aiExplainBtn">✨ Explícame este tema</button><button class="btn wiki-entry-btn" id="wikiArticleBtn" hidden>📖 Artículo desarrollado</button><button class="btn" id="favBtn">${fav?'★ Guardado':'☆ Guardar'}</button></div>
          </section>
          <article class="plain-entry" aria-label="Explicación">
            <section class="plain-block lead-block"><p>${esc(easy.lead)}</p></section>${example}${look}
          </article>
          <section class="wiki-autogen" id="wikiArticleSection" hidden>
            <div class="wiki-autogen-head"><div><span>Wiki autónoma</span><small data-wiki-meta>Artículo desarrollado automáticamente</small></div><strong>Revisión 32</strong></div>
            <article class="entry-body wiki-autogen-body" data-wiki-body></article>
            <footer>Contenido generado y revisado automáticamente. La entrada canónica original permanece intacta.</footer>
          </section>
          ${advanced}
          <nav class="easy-entry-nav" aria-label="Siguiente o anterior">${prev?`<a class="btn" href="#entry=${prev.code}">← Anterior</a>`:'<span></span>'}<a class="btn" href="${chapterHash}">Temas</a>${next?`<a class="btn primary" href="#entry=${next.code}">Siguiente →</a>`:'<span></span>'}</nav>
        </main>
        <aside class="reader-right"><div class="sticky-reader-panel">
          ${MLS.state.advancedDetails&&outlineHTML?`<section class="reader-context-section"><div class="reader-panel-label">En esta entrada</div><nav class="entry-outline">${outlineHTML}</nav></section>`:''}
          <section class="reader-context-section"><div class="reader-panel-label">También mira</div><div class="related-list">${relatedHTML}</div></section>
        </div></aside>
      </div>
    </div>`;
    document.getElementById('listenBtn').onclick=()=>MLS.speak(speech);
    document.getElementById('aiExplainBtn').onclick=()=>MLS.aiTutor?.open(e,m);
    document.getElementById('favBtn').onclick=()=>{if(MLS.state.favorites.includes(code))MLS.state.favorites=MLS.state.favorites.filter(x=>x!==code);else MLS.state.favorites.push(code);MLS.save();page(code)};
    document.querySelectorAll('[data-scroll]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.scroll)?.scrollIntoView({behavior:'smooth',block:'start'}));
    MLS.wiki?.hydrateEntry(e,m);
  }
  MLS.reader={page};MLS.pages.entry=page;
})();
