(()=>{
  'use strict';
  const MLS=window.MLS;const {esc,escAttr,short}=MLS.util;
  const speech=window.speechSynthesis;
  let activeUtterance=null,activeSpeechEntry=null;
  const latinSpanish=/^es-(?:419|MX|US|AR|BO|CL|CO|CR|CU|DO|EC|SV|GT|HN|NI|PA|PE|PR|PY|UY|VE)(?:-|$)/i;
  const feminineVoiceName=/(?:female|woman|mujer|sabina|dalia|helena|laura|paulina|luc[ií]a|m[oó]nica|sof[ií]a|paloma|conchita|angela|[áa]ngela)/i;
  function chooseSpeechVoice(voices){
    const spanish=voices.filter(voice=>/^es(?:-|$)/i.test(voice.lang||''));
    const latin=spanish.filter(voice=>latinSpanish.test(voice.lang||''));
    const femaleLatin=latin.find(voice=>feminineVoiceName.test(voice.name||''));
    if(femaleLatin)return femaleLatin;
    if(latin.length)return latin.find(voice=>voice.localService)||latin[0];
    if(spanish.length)return spanish.find(voice=>feminineVoiceName.test(voice.name||''))||spanish.find(voice=>voice.localService)||spanish[0];
    return voices.find(voice=>voice.localService)||voices[0]||null;
  }
  function speechControls(){return `<div class="reader-tts-controls" role="group" aria-label="Controles de audio de esta entrada"><button type="button" class="btn" data-tts-action="toggle" ${speech?'':'disabled'}>🔊 Reproducir</button><button type="button" class="btn" data-tts-action="stop" ${speech?'':'disabled'}>⏹️ Detener</button></div>`}
  function resetSpeechControls(){
    activeSpeechEntry?.querySelector('[data-tts-action="toggle"]')?.removeAttribute('aria-pressed');
    const toggle=activeSpeechEntry?.querySelector('[data-tts-action="toggle"]');if(toggle)toggle.textContent='🔊 Reproducir';
    activeSpeechEntry=null;activeUtterance=null;
  }
  function stopSpeech(){if(speech)speech.cancel();resetSpeechControls()}
  MLS.app.addEventListener('click',event=>{
    const button=event.target.closest('[data-tts-action]');if(!button)return;
    const action=button.dataset.ttsAction;
    if(action==='stop'){stopSpeech();return}
    if(action==='toggle'&&activeUtterance&&activeSpeechEntry===button.closest('.continuous-entry')){
      if(speech.paused){speech.resume();button.textContent='🔊 Pausar'}else{speech.pause();button.textContent='🔊 Reanudar'}
      return;
    }
    if(action!=='toggle'||!speech)return;
    stopSpeech();
    const entry=button.closest('.continuous-entry'),title=entry?.querySelector('h1')?.textContent?.trim()||'',body=entry?.querySelector('.entry-body')?.innerText?.trim()||'';
    if(!body)return;
    const voices=speech.getVoices(),voice=chooseSpeechVoice(voices),utterance=new SpeechSynthesisUtterance(`${title}. ${body}`);
    utterance.lang=voice?.lang||'es-419';if(voice)utterance.voice=voice;
    activeUtterance=utterance;activeSpeechEntry=entry;button.setAttribute('aria-pressed','true');button.textContent='🔊 Pausar';
    utterance.onend=resetSpeechControls;utterance.onerror=resetSpeechControls;
    speech.speak(utterance);
  });
  function referenceHTML(ref){
    if(ref?.citation){const citation=esc(ref.citation);const url=ref.url?` <a href="${escAttr(ref.url)}" target="_blank" rel="noopener noreferrer">${esc(ref.url)}</a>`:'';return `<li>${citation}${url}</li>`}
    const authors=Array.isArray(ref.authors)&&ref.authors.length?ref.authors:(ref.institution?[ref.institution]:[ref.publisher||'Autor no identificado']);
    const formatAuthor=value=>{const name=String(value||'').trim(),parts=name.split(',');if(parts.length<2||/^(ministry|department|university|academy|institute|bureau|fund[eé]u|rae\b|www\.)/i.test(name))return name;const initials=parts.slice(1).join(' ').trim().split(/\s+/).filter(Boolean).map(token=>token.split('-').map(piece=>piece?`${piece[0].toUpperCase()}.`:'').join('-')).join(' ');return`${parts[0].trim()}, ${initials}`};
    const names=authors.map(formatAuthor),authorText=names.length===2?`${names[0]}, & ${names[1]}`:names.length>2?`${names.slice(0,-1).join(', ')}, & ${names.at(-1)}`:names[0];
    const dateMatch=String(ref.date||'').match(/^(\d{4})-(\d{2})-(\d{2})$/),months=['January','February','March','April','May','June','July','August','September','October','November','December'];
    const dateLabel=dateMatch?`${dateMatch[1]}, ${months[Number(dateMatch[2])-1]} ${Number(dateMatch[3])}`:String(ref.year||ref.date||'').slice(0,4)||'s. f.',title=esc(ref.title||'Fuente sin título');
    let text=`${esc(authorText)} (${esc(dateLabel)}). `;
    if(ref.containerTitle){text+=`${title}. <em>${esc(ref.containerTitle)}${ref.volume?`, ${esc(ref.volume)}`:''}</em>${ref.issue?`(${esc(ref.issue)})`:''}${ref.pages?`, ${esc(ref.pages)}`:''}. `}
    else text+=`<em>${title}</em>${ref.edition?` (${esc(ref.edition)})`:''}. `;
    const publisher=ref.publisher&&ref.publisher!==authorText?ref.publisher:'';
    if(publisher&&!ref.containerTitle)text+=`${esc(publisher)}. `;
    if(ref.url)text+=`<a href="${escAttr(ref.url)}" target="_blank" rel="noopener noreferrer">${esc(ref.url)}</a>`;
    return `<li>${text}</li>`;
  }
  function normalizePdfParagraphSpacing(markdown=''){
    const lines=String(markdown||'').split('\n'),out=[];
    const isTableRule=line=>/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
    let inTable=false;
    for(let i=0;i<lines.length;i++){
      const line=lines[i],trimmed=line.trim();
      if(!trimmed){out.push('');inTable=false;continue}
      const startsTable=trimmed.startsWith('|')&&i+1<lines.length&&isTableRule(lines[i+1]);
      if(startsTable){if(out.length&&out.at(-1).trim())out.push('');inTable=true;out.push(line);continue}
      if(inTable&&trimmed.startsWith('|')){out.push(line);continue}
      inTable=false;
      if(out.length&&out.at(-1).trim())out.push('');
      out.push(line);
    }
    return out.join('\n').replace(/\n{3,}/g,'\n\n');
  }
  function compactSourceLocators(markdown=''){
    let inSourceSection=false,inReferenceSection=false,inRelatedSection=false;
    return String(markdown||'').split('\n').map(line=>{
      const heading=line.match(/^####\s+(.+)$/);
      if(heading){
        inReferenceSection=/^(?:referencias?(?:\s*\(apa\s*7\)|\s+apa\s*7)?|fuentes?\s*\(apa\s*7\)|sources?\s*\(apa\s*7\))$/i.test(heading[1].trim());
        inSourceSection=/^(?:fuente y localizador|fuentes y localizadores|source and locator|sources and locators)$/i.test(heading[1].trim());
        inRelatedSection=/^(?:entradas relacionadas|related entries|entrées liées|entrées connexes|voci correlate|相關條目|相关条目|관련 항목|関連項目|связанные записи)$/i.test(heading[1].trim());
        if(inReferenceSection||inRelatedSection)return '';
      }
      // The PDF's running page logo is extracted as a standalone **M** line.
      if(/^\*\*M\*\*$/.test(line.trim())||inReferenceSection||inRelatedSection)return '';
      if(!inSourceSection||!/^https?:\/\//i.test(line.trim().match(/https?:\/\/\S+/)?.[0]||''))return line;
      const withoutUrl=line.replace(/https?:\/\/\S+/gi,'').trim().replace(/[\s.]+$/,'');
      const citation=withoutUrl.match(/^.+?\((?:\d{4}|s\.\s*f\.)\)\.\s*(.+)$/i);
      if(!citation)return line;
      const title=citation[1].replace(/^\*+|\*+$/g,'').trim();
      return title?`**Fuente:** ${title}`:'';
    }).join('\n');
  }
  let continuousObserver=null,continuousTopObserver=null,chapterScrollHandler=null;
  function cleanup(){stopSpeech();continuousObserver?.disconnect();continuousTopObserver?.disconnect();continuousObserver=null;continuousTopObserver=null;if(chapterScrollHandler){window.removeEventListener('scroll',chapterScrollHandler);chapterScrollHandler=null}}
  function continuationHTML(entry,meta){
    const body=compactSourceLocators(normalizePdfParagraphSpacing(entry.body)),prefix=`continuous-${entry.code}-`;
    const article=MLS.renderMarkdown(body,entry.language,entry.code).replace(/ id="(sec-[^"]+)"/g,(_,id)=>` id="${prefix}${id}"`);
    const refs=window.MLS_REFERENCES?.[entry.code]||[],refId=`references-${entry.code}`;
    const references=MLS.state.showReferences?`<section class="entry-references" aria-labelledby="${escAttr(refId)}"><h2 id="${escAttr(refId)}">Referencias (APA 7)</h2>${refs.length?`<ol>${refs.map(referenceHTML).join('')}</ol>`:'<p class="muted-note">Este PDF no incluye referencias APA 7 para esta entrada.</p>'}</section>`:'';
    const status=entry.pdfVersionStatus==='PDF_VERSION_DIFFERS_OR_UNVERIFIED'?`<p class="pdf-version-note">El suplemento del PDF señala una discrepancia de versión o no confirma VERIFIED: ${esc(entry.pdfStatusText||'revisa el suplemento de esta entrada')}.</p>`:'';
    return `<section class="continuous-entry" id="continuous-${escAttr(entry.code)}" data-entry-code="${escAttr(entry.code)}"><header class="reader-head simple-head"><div class="simple-meta">${meta.flag} ${esc(meta.name)} · ${esc(entry.level)} · ${esc(entry.contentStandard||'MLS R32')}</div><h1>${esc(entry.title)}</h1>${entry.target?`<div class="target-title">${esc(entry.target)}</div>`:''}${status}${speechControls()}</header><article class="entry-body canonical-entry-body" aria-label="Artículo completo">${article}</article>${references}</section>`;
  }
  async function page(code){
    cleanup();
    const idx=MLS.data.idxByCode[code];if(!idx){MLS.app.innerHTML=MLS.ui.empty('No encontré esta entrada.');return}
    MLS.state.currentLang=idx.language;MLS.app.innerHTML='<div class="loading">Abriendo…</div>';
    const vol=await MLS.loadVolume(idx.language),e=vol.entries.find(x=>x.code===code);if(!e){MLS.app.innerHTML=MLS.ui.empty('No encontré esta entrada.');return}
    MLS.state.recent=[code,...MLS.state.recent.filter(x=>x!==code)].slice(0,80);MLS.save();
    const orderedEntries=[...vol.entries].sort((a,b)=>a.n-b.n),m=MLS.data.metaBySlug[e.language],pos=orderedEntries.findIndex(x=>x.code===code),prev=orderedEntries[pos-1],next=orderedEntries[pos+1];
    const displayBody=compactSourceLocators(normalizePdfParagraphSpacing(e.body)),outline=MLS.entryOutline(displayBody);
    const references=window.MLS_REFERENCES?.[code]||[],referencesHTML=MLS.state.showReferences?`<section class="entry-references" aria-labelledby="references-title"><h2 id="references-title">Referencias (APA 7)</h2>${references.length?`<ol>${references.map(referenceHTML).join('')}</ol>`:'<p class="muted-note">Este PDF no incluye referencias APA 7 para esta entrada.</p>'}</section>`:'';
    const pdfStatusNote=e.pdfVersionStatus==='PDF_VERSION_DIFFERS_OR_UNVERIFIED'?`<p class="pdf-version-note">El suplemento del PDF señala una discrepancia de versión o no confirma VERIFIED: ${esc(e.pdfStatusText||'revisa el suplemento de esta entrada')}.</p>`:'';
    const fullArticle=MLS.renderMarkdown(displayBody,e.language,e.code);
    const outlineHTML=MLS.state.advancedDetails&&outline.length?outline.map(x=>`<button type="button" data-scroll="${escAttr(x.id)}">${esc(short(x.label))}</button>`).join(''):'';
    const showOutline=Boolean(outlineHTML),continuous=Boolean(MLS.state.continuousReading);
    const chapterEntries=orderedEntries.filter(entry=>String(entry.partNum||'')===String(e.partNum||'')&&String(entry.chapterNum||'')===String(e.chapterNum||'')&&String(entry.chapter||'')===String(e.chapter||''));
    const chapterPosition=chapterEntries.findIndex(entry=>entry.code===e.code);
    const sameChapter=(a,b)=>String(a.partNum||'')===String(b.partNum||'')&&String(a.chapterNum||'')===String(b.chapterNum||'')&&String(a.chapter||'')===String(b.chapter||'');
    const chapterGroups=[];
    for(const entry of orderedEntries){let group=chapterGroups.at(-1);if(!group||!sameChapter(group.entries[0],entry)){group={entries:[]};chapterGroups.push(group)}group.entries.push(entry)}
    const currentChapterGroup=chapterGroups.findIndex(group=>group.entries.some(entry=>entry.code===e.code));
    const previousChapter=chapterGroups[currentChapterGroup-1]?.entries[0],nextChapter=chapterGroups[currentChapterGroup+1]?.entries[0];
    const chapterBoundaryNav=(label)=>`<nav class="chapter-boundary-nav" aria-label="${escAttr(label)}">${previousChapter?`<a class="chapter-boundary-link" href="#entry=${encodeURIComponent(previousChapter.code)}"><span>← Capítulo anterior</span><strong>${esc(previousChapter.chapter||`Capítulo ${previousChapter.chapterNum||''}`)}</strong></a>`:`<span class="chapter-boundary-link is-disabled" aria-disabled="true"><span>← Capítulo anterior</span><strong>No hay otro capítulo</strong></span>`}${nextChapter?`<a class="chapter-boundary-link next" href="#entry=${encodeURIComponent(nextChapter.code)}"><span>Siguiente capítulo →</span><strong>${esc(nextChapter.chapter||`Capítulo ${nextChapter.chapterNum||''}`)}</strong></a>`:`<span class="chapter-boundary-link is-disabled" aria-disabled="true"><span>Siguiente capítulo →</span><strong>No hay otro capítulo</strong></span>`}</nav>`;
    const chapterLinks=chapterEntries.map(entry=>`<a class="chapter-entry-link ${entry.code===e.code?'is-current':''}" href="#entry=${encodeURIComponent(entry.code)}" data-chapter-entry="${escAttr(entry.code)}" ${entry.code===e.code?'aria-current="location"':''}><span>${String(entry.n).padStart(4,'0')}</span><strong>${esc(entry.title)}</strong></a>`).join('');
    const chapterLabel=`Capítulo ${e.chapterNum||''} · Entrada ${chapterPosition+1} de ${chapterEntries.length}`;
    MLS.app.innerHTML=`<div class="reader-wide reading-first atlas-palette-${m.slug}">
      <div class="crumbs reader-crumbs"><a href="#map=${m.slug}">${m.flag} ${esc(m.name)}</a><span>›</span><span>Entrada ${String(e.n).padStart(4,'0')}</span></div>
      <details class="mobile-chapter-nav"><summary><span class="chapter-nav-current">${esc(chapterLabel)}</span><strong>${esc(e.title)}</strong><span class="chapter-nav-caret" aria-hidden="true">⌄</span></summary><nav class="chapter-entry-list" aria-label="Entradas del capítulo">${chapterLinks}</nav></details>
      <div class="reader-layout no-left-rail">
        <main class="reader-main">
          ${!continuous&&chapterPosition===0?`<div class="continuous-loader continuous-chapter-end"><strong>Inicio del capítulo</strong>${chapterBoundaryNav('Navegación entre capítulos')}</div>`:''}
          ${continuous?'<div class="continuous-loader continuous-loader-top" id="continuousTopLoader" role="status" aria-live="polite">Desplázate hacia arriba para cargar la entrada anterior del capítulo…</div>':''}
          <section class="continuous-entry" id="continuous-${escAttr(e.code)}" data-entry-code="${escAttr(e.code)}">
            <section class="reader-head simple-head"><div class="simple-meta">${m.flag} ${esc(m.name)} · ${esc(e.level)} · ${esc(e.contentStandard||'MLS R32')}</div><h1>${esc(e.title)}</h1>${e.target?`<div class="target-title">${esc(e.target)}</div>`:''}${pdfStatusNote}${speechControls()}</section>
            <article class="entry-body canonical-entry-body" aria-label="Artículo completo">${fullArticle}</article>
            ${referencesHTML}
          </section>
          ${continuous?'<div class="continuous-loader" id="continuousLoader" role="status" aria-live="polite">Sigue desplazándote para cargar la siguiente entrada del capítulo…</div>':''}
          ${!continuous&&chapterPosition===chapterEntries.length-1?`<div class="continuous-loader continuous-chapter-end"><strong>Fin del capítulo</strong><span>Has llegado al final de este capítulo.</span>${chapterBoundaryNav('Navegación entre capítulos')}</div>`:''}
          ${continuous?'':`<nav class="easy-entry-nav" aria-label="Navegación por número de entrada">${prev?`<a class="btn" href="#entry=${prev.code}">Anterior</a>`:'<span></span>'}${next?`<a class="btn primary" href="#entry=${next.code}">Siguiente</a>`:'<span></span>'}</nav>`}
        </main>
        <aside class="reader-right chapter-reader-nav"><div class="sticky-reader-panel"><section class="reader-context-section chapter-nav-section"><div class="reader-panel-label">ESTE CAPÍTULO</div><h2 class="chapter-nav-title">${esc(e.chapter||'Capítulo')}</h2><p class="chapter-nav-current">${esc(chapterLabel)}</p><nav class="chapter-entry-list" aria-label="Entradas del capítulo">${chapterLinks}</nav></section>${showOutline?`<section class="reader-context-section"><div class="reader-panel-label">En esta entrada</div><nav class="entry-outline">${outlineHTML}</nav>${next?`<a class="entry-outline-next" href="#entry=${next.code}">Siguiente entrada →</a>`:''}</section>`:''}</div></aside>
      </div>
    </div>`;
    document.querySelectorAll('[data-scroll]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.scroll)?.scrollIntoView({behavior:'smooth',block:'start'}));
    const markCurrentEntry=()=>{
      const center=window.innerHeight*.42,sections=[...document.querySelectorAll('.continuous-entry')];let active=sections[0];
      for(const section of sections){const rect=section.getBoundingClientRect(),distance=rect.top<=center&&rect.bottom>=center?0:Math.min(Math.abs(rect.top-center),Math.abs(rect.bottom-center));if(!active){active=section;continue}const activeRect=active.getBoundingClientRect(),activeDistance=activeRect.top<=center&&activeRect.bottom>=center?0:Math.min(Math.abs(activeRect.top-center),Math.abs(activeRect.bottom-center));if(distance<activeDistance)active=section}
      const activeCode=active?.dataset.entryCode;if(!activeCode)return;
      const activeEntry=chapterEntries.find(entry=>entry.code===activeCode),activePosition=chapterEntries.findIndex(entry=>entry.code===activeCode);
      document.querySelectorAll('[data-chapter-entry]').forEach(link=>{const current=link.dataset.chapterEntry===activeCode;link.classList.toggle('is-current',current);if(current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')});
      document.querySelectorAll('.chapter-nav-current').forEach(label=>{label.textContent=`Capítulo ${activeEntry?.chapterNum||''} · Entrada ${activePosition+1} de ${chapterEntries.length}`});
    };
    let scrollUpdatePending=false;chapterScrollHandler=()=>{if(scrollUpdatePending)return;scrollUpdatePending=true;requestAnimationFrame(()=>{scrollUpdatePending=false;markCurrentEntry()})};
    window.addEventListener('scroll',chapterScrollHandler,{passive:true});markCurrentEntry();
    if(continuous){
      const loader=document.getElementById('continuousLoader'),topLoader=document.getElementById('continuousTopLoader');let nextPosition=chapterPosition+1,previousPosition=chapterPosition-1;
      const finishStart=()=>{continuousTopObserver?.disconnect();continuousTopObserver=null;topLoader.classList.add('continuous-chapter-end');topLoader.innerHTML=`<strong>Inicio del capítulo</strong>${chapterBoundaryNav('Navegación entre capítulos')}`};
      const finishChapter=()=>{
        continuousObserver?.disconnect();continuousObserver=null;
        loader.classList.add('continuous-chapter-end');loader.innerHTML=`<strong>Fin del capítulo</strong><span>Has llegado al final de este capítulo.</span>${chapterBoundaryNav('Navegación entre capítulos')}`;
      };
      const loadNext=()=>{
        if(nextPosition>=chapterEntries.length){finishChapter();return}
        const entry=chapterEntries[nextPosition++];loader.insertAdjacentHTML('beforebegin',continuationHTML(entry,m));
        if(nextPosition>=chapterEntries.length)finishChapter();
      };
      const loadPrevious=()=>{
        if(previousPosition<0){finishStart();return}
        const anchor=[...document.querySelectorAll('.continuous-entry')].find(entry=>entry.getBoundingClientRect().bottom>0),anchorTop=anchor?.getBoundingClientRect().top;
        const entry=chapterEntries[previousPosition--];topLoader.insertAdjacentHTML('afterend',continuationHTML(entry,m));
        if(anchor&&anchorTop!==undefined)requestAnimationFrame(()=>window.scrollBy(0,anchor.getBoundingClientRect().top-anchorTop));
        if(previousPosition<0)finishStart();
      };
      if(chapterPosition<=0)finishStart();
      else if('IntersectionObserver' in window){continuousTopObserver=new IntersectionObserver(items=>{if(items.some(item=>item.isIntersecting))loadPrevious()},{rootMargin:'0px'});continuousTopObserver.observe(topLoader)}
      else {topLoader.innerHTML='<button type="button" class="btn">Cargar entrada anterior</button>';topLoader.querySelector('button').onclick=loadPrevious}
      if(chapterPosition<0||chapterPosition+1>=chapterEntries.length)finishChapter();
      else if('IntersectionObserver' in window){continuousObserver=new IntersectionObserver(items=>{if(items.some(item=>item.isIntersecting))loadNext()},{rootMargin:'700px 0px'});continuousObserver.observe(loader)}
      else {loader.innerHTML='<button type="button" class="btn primary">Cargar siguiente entrada</button>';loader.querySelector('button').onclick=loadNext}
    }
  }
  window.addEventListener('hashchange',()=>{if(!location.hash.startsWith('#entry='))cleanup()});
  MLS.reader={page,cleanup};MLS.pages.entry=page;
})();
