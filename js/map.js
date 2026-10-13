(()=>{
  'use strict';
  const MLS=window.MLS;
  const {esc,escAttr,clamp,fmt,short,romanToInt}=MLS.util;
  const levelClass=l=>`level-${String(l||'').toLowerCase().replace(/[^a-z0-9]+/g,'-')}`;

  function globalMapPage(){
    const cards=MLS_META.map(m=>{
      const entries=MLS.data.byLanguage[m.slug]||[];
      return `<a class="atlas-language-card atlas-palette-${m.slug}" href="#map=${m.slug}">
        <div class="atlas-language-card-head"><span class="atlas-language-flag">${m.flag}</span><div class="atlas-language-name"><h2>${esc(m.name)}</h2><small>${esc(m.native)}</small></div><span class="atlas-language-arrow" aria-hidden="true">→</span></div>
        <div class="atlas-language-stats"><strong>${fmt(entries.length)}</strong><span>entradas numeradas</span></div>
      </a>`;
    }).join('');
    const total=MLS_META.reduce((sum,m)=>sum+(MLS.data.byLanguage[m.slug]||[]).length,0);
    MLS.app.innerHTML=`<section class="map-page-head"><div><div class="eyebrow">Atlas global · vista general</div><h1>Explora por idioma</h1><p>Elige un idioma para recorrer sus entradas agrupadas por parte.</p></div><div class="map-head-count"><strong>${fmt(total)}</strong><span>entradas consultables</span></div></section>
      <div class="atlas-language-grid">${cards}</div>
      <div class="legend panel"><strong>Cómo funciona</strong><span>Abre una parte para recorrer sus entradas en orden numérico.</span></div>`;
  }
  function parseParams(){
    const h=location.hash;const amp=h.indexOf('&');if(amp<0)return new URLSearchParams();return new URLSearchParams(h.slice(amp+1));
  }

  async function languageMapPage(slug){
    const m=MLS.data.metaBySlug[slug];if(!m){globalMapPage();return}
    MLS.state.mapPrefs.lastLanguage=slug;MLS.save();
    const params=parseParams(),focusCode=params.get('entry')||'';
    const source=(MLS.data.byLanguage[slug]||[]).slice().sort((a,b)=>a.n-b.n);
    let related=[];
    if(focusCode){const vol=await MLS.loadVolume(slug);const focus=vol.entries.find(e=>e.code===focusCode);if(focus)related=MLS.extractRelations(focus.body,slug)}
    const relatedSet=new Set(related.map(x=>x.code)),parts=new Map();
    for(const entry of source){const key=String(entry.partNum||'—');if(!parts.has(key))parts.set(key,{num:entry.partNum||'—',title:entry.part||'Parte sin nombre',entries:[]});parts.get(key).entries.push(entry)}
    const partGroups=[...parts.values()].sort((a,b)=>romanToInt(a.num)-romanToInt(b.num)||String(a.num).localeCompare(String(b.num)));
    const groups=partGroups.map(part=>{
      const entries=part.entries.sort((a,b)=>a.n-b.n),partHasFocus=entries.some(e=>e.code===focusCode),chapters=new Map();
      for(const entry of entries){const key=String(entry.chapterNum||'—');if(!chapters.has(key))chapters.set(key,{num:entry.chapterNum||'—',title:entry.chapter||'Capítulo sin nombre',entries:[]});chapters.get(key).entries.push(entry)}
      const chapterGroups=[...chapters.values()].sort((a,b)=>Number(a.num)-Number(b.num)||String(a.num).localeCompare(String(b.num)));
      const chapterHTML=chapterGroups.map(chapter=>{
        const chapterEntries=chapter.entries.sort((a,b)=>a.n-b.n),chapterHasFocus=chapterEntries.some(e=>e.code===focusCode);
        const levels=[...new Set(chapterEntries.map(e=>e.level).filter(Boolean))];
        const rows=chapterEntries.map(e=>`<a class="atlas-entry-row ${e.code===focusCode?'is-focused':''} ${relatedSet.has(e.code)?'is-related':''}" href="#entry=${encodeURIComponent(e.code)}" data-atlas-search="${escAttr(`${String(e.n).padStart(4,'0')} ${e.code} ${e.title} ${e.target||''}`.toLocaleLowerCase())}"><span class="atlas-entry-number">${String(e.n).padStart(4,'0')}</span><span class="atlas-entry-copy"><strong>${esc(e.title)}</strong>${e.target?`<small>${esc(e.target)}</small>`:''}</span><span class="atlas-entry-code">${esc(e.code)}</span></a>`).join('');
        return `<details class="atlas-chapter" data-atlas-chapter ${chapterHasFocus?'open':''}><summary><span class="atlas-chapter-number">${esc(chapter.num)}</span><span class="atlas-chapter-copy"><small>CAPÍTULO ${esc(chapter.num)}</small><strong>${esc(chapter.title)}</strong>${levels.length?`<span class="atlas-chapter-levels">${levels.map(level=>`<span class="atlas-chapter-level-tag">${esc(level)}</span>`).join('')}</span>`:''}</span><span class="atlas-chapter-count">${fmt(chapterEntries.length)} entradas</span><span class="atlas-chapter-caret" aria-hidden="true">⌄</span></summary><div class="atlas-chapter-entries">${rows}</div></details>`;
      }).join('');
      return `<details class="atlas-part-section" data-atlas-part ${partHasFocus?'open':''}><summary class="atlas-part-heading"><span class="atlas-part-marker" aria-hidden="true"></span><span class="atlas-part-copy"><small>PARTE ${esc(part.num)}</small><strong>${esc(part.title)}</strong></span><span class="atlas-part-count">${chapterGroups.length} ${chapterGroups.length===1?'capítulo':'capítulos'} <i>·</i> ${fmt(entries.length)} entradas</span><span class="atlas-part-caret" aria-hidden="true">⌄</span></summary><div class="atlas-part-chapters"><div class="atlas-chapter-grid">${chapterHTML}</div></div></details>`;
    }).join('');
    const description='Explora cada parte y despliega sus capítulos para recorrer las entradas en el orden del libro.';
    const legend='Las entradas se agrupan por parte y capítulo. Anterior y Siguiente siguen el número global.';
    const route=entry=>entry?`#map=${slug}&entry=${encodeURIComponent(entry)}`:`#map=${slug}`;
    MLS.app.innerHTML=`<div class="atlas-detail-page atlas-palette-${slug}"><div class="crumbs"><a href="#home">Biblioteca</a><span>›</span><a href="#map">Atlas</a><span>›</span><a href="#map=${slug}">${m.flag} ${esc(m.name)}</a></div>
      <section class="map-page-head atlas-detail-head"><div><div class="eyebrow">Atlas detallado · Volumen ${String(m.v).padStart(2,'0')}</div><h1>${m.flag} ${esc(m.name)}</h1><p>${description}</p></div><div class="map-head-count"><strong>${fmt(source.length)}</strong><span>entradas del volumen</span></div></section>
      <div class="map-toolbar atlas-toolbar">
        <button class="btn" onclick="location.hash='#map'">← Atlas</button>
        <label class="atlas-search"><span>Buscar en este atlas</span><input id="atlasSearch" type="search" placeholder="Número, código o título" autocomplete="off"></label>
        ${focusCode?`<button class="btn" id="clearFocus">Quitar foco</button>`:''}
      </div>
      ${focusCode?`<div class="focus-strip panel"><strong>Entrada enfocada:</strong> ${esc(focusCode)}${related.length?` · ${related.length} referencias explícitas «Véase también» resaltadas`: ' · sin referencias internas explícitas detectadas'}</div>`:''}
      <div class="atlas-detail-list atlas-part-list" id="atlasDetailList">${groups||'<div class="empty">No hay entradas.</div>'}</div>
      <div class="legend panel atlas-legend"><strong>Cómo leer este atlas</strong><span>${legend}</span></div></div>`;
    MLS.state.mapPrefs.orderBy='part-entry-number';MLS.save();
    if(focusCode)document.getElementById('clearFocus').onclick=()=>location.hash=route('');
    const atlasList=document.getElementById('atlasDetailList'),search=document.getElementById('atlasSearch');
    search.addEventListener('input',()=>{
      const q=search.value.trim().toLocaleLowerCase();
      atlasList.querySelectorAll('[data-atlas-part]').forEach(part=>{
        let partVisible=0;part.querySelectorAll('[data-atlas-chapter]').forEach(chapter=>{
          let chapterVisible=0;chapter.querySelectorAll('.atlas-entry-row').forEach(row=>{row.hidden=Boolean(q)&&!row.dataset.atlasSearch.includes(q);if(!row.hidden)chapterVisible++});
          chapter.hidden=chapterVisible===0;if(q&&chapterVisible)chapter.open=true;if(!q)chapter.open=false;partVisible+=chapterVisible;
        });
        part.hidden=partVisible===0;if(q&&partVisible)part.open=true;if(!q)part.open=false;
      });

    });
  }  function positionTooltip(tt,ev){const pad=14;tt.style.left=`${Math.min(ev.clientX+16,window.innerWidth-tt.offsetWidth-pad)}px`;tt.style.top=`${Math.min(ev.clientY+16,window.innerHeight-tt.offsetHeight-pad)}px`}
  function shorten(s,n){const t=short(s);return t.length>n?t.slice(0,n-1)+'…':t}

  function initPanZoom(svg,bounds,semantic=false,mini=null){
    let vb={x:bounds.x,y:bounds.y,w:bounds.w,h:bounds.h},dragging=false,last=null;const pointers=new Map();let pinch=null;
    const set=()=>{svg.setAttribute('viewBox',`${vb.x} ${vb.y} ${vb.w} ${vb.h}`);if(semantic)applySemantic(svg,bounds.w/vb.w);if(mini){const vr=mini.querySelector('.mini-viewport');if(vr){vr.setAttribute('x',vb.x);vr.setAttribute('y',vb.y);vr.setAttribute('width',vb.w);vr.setAttribute('height',vb.h)}}};
    const fit=()=>{const rect=svg.getBoundingClientRect(),ar=rect.width/Math.max(1,rect.height);let w=bounds.w*1.04,h=bounds.h*1.04;if(w/h>ar)h=w/ar;else w=h*ar;vb={x:bounds.x+(bounds.w-w)/2,y:bounds.y+(bounds.h-h)/2,w,h};set()};
    const zoomAt=(factor,cx,cy)=>{const r=svg.getBoundingClientRect(),px=(cx-r.left)/Math.max(1,r.width),py=(cy-r.top)/Math.max(1,r.height),wx=vb.x+px*vb.w,wy=vb.y+py*vb.h,nw=clamp(vb.w*factor,bounds.w/9,bounds.w*4),nh=nw*(r.height/Math.max(1,r.width));vb.x=wx-px*nw;vb.y=wy-py*nh;vb.w=nw;vb.h=nh;set()};
    const zoomCenter=f=>{const r=svg.getBoundingClientRect();zoomAt(f,r.left+r.width/2,r.top+r.height/2)};
    const centerOn=(x,y,w=Math.max(bounds.w/3,600))=>{const r=svg.getBoundingClientRect();vb.w=clamp(w,bounds.w/9,bounds.w*4);vb.h=vb.w*(r.height/Math.max(1,r.width));vb.x=x-vb.w/2;vb.y=y-vb.h/2;set()};
    svg.addEventListener('wheel',ev=>{ev.preventDefault();zoomAt(ev.deltaY>0?1.12:.88,ev.clientX,ev.clientY)},{passive:false});
    svg.addEventListener('pointerdown',ev=>{if(ev.target.closest?.('.entry-node,.language-region,.chapter-link'))return;svg.setPointerCapture?.(ev.pointerId);pointers.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});if(pointers.size===1){dragging=true;last={x:ev.clientX,y:ev.clientY}}else if(pointers.size===2){const a=[...pointers.values()];pinch={dist:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),w:vb.w}}});
    svg.addEventListener('pointermove',ev=>{if(!pointers.has(ev.pointerId))return;pointers.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});if(pointers.size===2&&pinch){const a=[...pointers.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(d>5){const factor=pinch.dist/d,c={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};zoomAt((pinch.w*factor)/vb.w,c.x,c.y)}return}if(dragging&&last){const r=svg.getBoundingClientRect(),dx=(ev.clientX-last.x)*vb.w/Math.max(1,r.width),dy=(ev.clientY-last.y)*vb.h/Math.max(1,r.height);vb.x-=dx;vb.y-=dy;last={x:ev.clientX,y:ev.clientY};set()}});
    const end=ev=>{pointers.delete(ev.pointerId);if(pointers.size<2)pinch=null;if(!pointers.size){dragging=false;last=null}};svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);svg.addEventListener('pointerleave',ev=>{if(ev.buttons===0)end(ev)});
    if(mini)mini.addEventListener('click',ev=>{const r=mini.getBoundingClientRect(),wx=bounds.x+((ev.clientX-r.left)/Math.max(1,r.width))*bounds.w,wy=bounds.y+((ev.clientY-r.top)/Math.max(1,r.height))*bounds.h;vb.x=wx-vb.w/2;vb.y=wy-vb.h/2;set()});
    requestAnimationFrame(fit);return{fit,zoomCenter,centerOn};
  }
  function applySemantic(svg,z){svg.classList.remove('zoom-far','zoom-mid','zoom-near');svg.classList.add(z<.6?'zoom-far':z<2?'zoom-mid':'zoom-near')}

  MLS.map={globalMapPage,languageMapPage};
  MLS.pages.map=()=>{const h=location.hash;if(h.startsWith('#map='))return languageMapPage(h.slice(5).split('&')[0]);return globalMapPage()};
})();
