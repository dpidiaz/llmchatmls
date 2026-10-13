(()=>{
  'use strict';
  const MLS=window.MLS=window.MLS||{};
  const app=document.getElementById('app');window.MLS_DATA=window.MLS_DATA||{};
  const safeJSON=(key,fallback)=>{try{const v=localStorage.getItem(key);return v===null?fallback:JSON.parse(v)}catch{return fallback}};
  MLS.state={
    compare:safeJSON('mlsCompare',[]),favorites:safeJSON('mlsFavorites',[]),recent:safeJSON('mlsRecent',[]),
    mapPrefs:safeJSON('mlsMapPrefs',{connections:true,lastLanguage:'ingles'}),deep:false,currentLang:'',
    advancedDetails:safeJSON('mlsAdvancedDetails',false),showReferences:safeJSON('mlsShowReferences',false),continuousReading:safeJSON('mlsContinuousReading',true),textSize:safeJSON('mlsTextSize','large'),theme:safeJSON('mlsThemeMode','dark')
  };
  MLS.data={metaBySlug:Object.fromEntries(MLS_META.map(x=>[x.slug,x])),idxByCode:Object.fromEntries(MLS_INDEX.map(x=>[x.code,x])),idxByLangN:Object.fromEntries(MLS_INDEX.map(x=>[`${x.language}:${x.n}`,x]))};
  MLS.data.byLanguage=Object.fromEntries(MLS_META.map(m=>[m.slug,MLS_INDEX.filter(x=>x.language===m.slug)]));
  MLS.data.levelOrder={'Pre-A1':0,'A1':1,'A2':2,'B1':3,'B2':4,'C1':5,'C2':6,'G0':0,'G1':1,'G2':2,'G3':3,'G4':4,'G5':5,'G6':6,'—':99};
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const escAttr=s=>esc(s).replace(/`/g,'&#96;');
  const norm=s=>String(s??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const romanToInt=r=>{const map={I:1,V:5,X:10,L:50,C:100,D:500,M:1000};let n=0,prev=0;for(const ch of String(r||'').toUpperCase().split('').reverse()){const v=map[ch]||0;if(v<prev)n-=v;else{n+=v;prev=v}}return n};
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));const fmt=n=>Number(n||0).toLocaleString('es-GT');
  const debounce=(fn,ms=180)=>{let t;return(...args)=>{clearTimeout(t);t=setTimeout(()=>fn(...args),ms)}};
  const short=s=>String(s||'').split(' — ')[0].trim();
  const slugify=s=>norm(s).replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af\u0400-\u04ff]+/g,'-').replace(/^-|-$/g,'').slice(0,70)||'seccion';
  MLS.util={esc,escAttr,norm,romanToInt,clamp,fmt,debounce,short,slugify};MLS.app=app;MLS.pages=MLS.pages||{};
  MLS.save=()=>{localStorage.setItem('mlsCompare',JSON.stringify(MLS.state.compare));localStorage.setItem('mlsFavorites',JSON.stringify(MLS.state.favorites));localStorage.setItem('mlsRecent',JSON.stringify(MLS.state.recent));localStorage.setItem('mlsMapPrefs',JSON.stringify(MLS.state.mapPrefs));localStorage.setItem('mlsAdvancedDetails',JSON.stringify(MLS.state.advancedDetails));localStorage.setItem('mlsShowReferences',JSON.stringify(MLS.state.showReferences));localStorage.setItem('mlsContinuousReading',JSON.stringify(MLS.state.continuousReading));localStorage.setItem('mlsTextSize',JSON.stringify(MLS.state.textSize));localStorage.setItem('mlsThemeMode',JSON.stringify(MLS.state.theme))};
  MLS.applyPrefs=()=>{document.body.dataset.textSize=MLS.state.textSize||'large';document.body.classList.toggle('dark',MLS.state.theme==='dark')};
  MLS.applyPrefs();
  MLS.toast=(text,ms=1700)=>{const el=document.getElementById('toast');if(!el)return;el.textContent=text;el.classList.add('show');clearTimeout(MLS._toastTimer);MLS._toastTimer=setTimeout(()=>el.classList.remove('show'),ms)};
  MLS.loadVolume=slug=>new Promise((resolve,reject)=>{if(window.MLS_DATA[slug])return resolve(window.MLS_DATA[slug]);const s=document.createElement('script');s.src=`data/volumes/${slug}.js`;s.onload=()=>resolve(window.MLS_DATA[slug]);s.onerror=()=>reject(new Error(`No se pudo cargar ${slug}`));document.head.appendChild(s)});
  const relationOverrides={
    'MLS-V05-0001|caso genitivo':'MLS-V05-0179',
    'MLS-V05-0001|nombres propios':'MLS-V05-0115'
  };
  const normalizeRelation=s=>norm(String(s||'').replace(/^(?:entrada|entry|concepto(?: relacionado)?|related concept)\s*(?:\d+\s*:)?\s*/i,'')).replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  const relationAliases=new Map();
  for(const entry of MLS_INDEX){
    for(const value of [entry.title,entry.target]){
      const key=normalizeRelation(value);if(!key)continue;
      const aliases=relationAliases.get(`${entry.language}:${key}`)||new Set();aliases.add(entry.code);relationAliases.set(`${entry.language}:${key}`,aliases);
    }
  }
  MLS.resolveRelatedEntry=(label='',href='',language='',sourceCode='')=>{
    const target=String(href||'').replace(/&amp;/g,'&'),code=target.match(/MLS-V\d{2}-\d{4}/i)?.[0];
    if(code&&MLS.data.idxByCode[code])return MLS.data.idxByCode[code];
    const normalized=normalizeRelation(label),override=relationOverrides[`${sourceCode}|${normalized}`];
    if(override&&MLS.data.idxByCode[override])return MLS.data.idxByCode[override];
    const number=target.match(/#(?:entry|entrada)-(\d+)/i)?.[1]||target.match(/^#?(\d{1,4})$/)?.[1]||String(label).match(/^(?:entrada|entry)\s+(\d+)\s*:/i)?.[1];
    if(number){const indexed=MLS.data.idxByLangN[`${language}:${Number(number)}`];if(indexed)return indexed}
    const exact=relationAliases.get(`${language}:${normalized}`);if(exact?.size===1){const match=MLS.data.idxByCode[[...exact][0]];if(match)return match}
    if(normalized){const global=new Set();for(const [key,codes] of relationAliases){if(key.endsWith(`:${normalized}`))for(const entryCode of codes)global.add(entryCode)}if(global.size===1){const match=MLS.data.idxByCode[[...global][0]];if(match)return match}}
    return null;
  };
  MLS.relatedSearchHref=(label='',language='')=>`#search?${new URLSearchParams({related:'1',lang:language,q:String(label||'').trim()}).toString()}`;
  MLS.extractRelations=(body='',language='',sourceCode='')=>{
    const text=String(body||''),section=text.match(/####\s*(?:Entradas relacionadas|Related entries)\s*\n([\s\S]*?)(?=\n####\s|$)/i);if(!section)return[];
    const out=[],seen=new Set();for(const match of section[1].matchAll(/\[([^\]]+)\]\(([^)]*)\)/g)){
      const label=match[1].replace(/\*\*/g,'').trim(),entry=MLS.resolveRelatedEntry(label,match[2],language,sourceCode),href=entry?`#entry=${entry.code}`:MLS.relatedSearchHref(label,language),key=entry?.code||`${language}:${normalizeRelation(label)}`;
      if(seen.has(key))continue;seen.add(key);out.push(entry?{...entry,relationLabel:`Entrada ${entry.n}: ${entry.title}`,relationHref:href}:{code:'',language,title:label,relationLabel:label,relationHref:href,relationSearch:true});
    }return out;
  };
  MLS.entryOutline=(body='')=>{const out=[];const used=new Map();for(const line of String(body).split('\n')){const m=line.match(/^#{4,6}\s+(.+)$/);if(!m)continue;const label=m[1].replace(/\*\*/g,'').trim();if(MLS.isCourseHeading(label))continue;let id=`sec-${slugify(label)}`;const n=used.get(id)||0;used.set(id,n+1);if(n)id+=`-${n+1}`;out.push({id,label})}return out};
  MLS.isCourseHeading=label=>/\b(pr[aá]ctica|practice|exercise|exercises|übung|練習|연습|практика|micropr[aá]ctica|aplicaci[oó]n\s+toefl|toefl.*application|tarea|actividad)\b/i.test(String(label||''));
  MLS.stripCourseSections=md=>{const lines=String(md||'').split('\n');const out=[];let skip=false;for(const line of lines){const h=line.match(/^#{4,6}\s+(.+)$/);if(h){skip=MLS.isCourseHeading(h[1]);if(skip)continue}if(!skip)out.push(line)}return out.join('\n')};
  const inline=s=>{
    let text=String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const preserved=[];const keep=html=>{preserved.push(html);return`\uE000${preserved.length-1}\uE001`};
    text=text.replace(/`([^`]+)`/g,(_,code)=>keep(`<code>${code}</code>`));
    text=text.replace(/(^|[^*])\*([^*]+)\*(?!\*)/g,(_,prefix,emphasis)=>`${prefix}${keep(`<em>${emphasis}</em>`)}`);
    text=text.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
    return text.replace(/\uE000(\d+)\uE001/g,(_,index)=>preserved[Number(index)]);
  };
  MLS.renderEasyInline=s=>inline(String(s||'')).replace(/\n/g,'<br>');
  MLS.renderMarkdown=(md='',language='',sourceCode='')=>{
    const source=String(md||''),outline=MLS.entryOutline(source);let headingIndex=0,out='',listType='',inTable=false,tableRows=[],inRelations=false,paragraph=[];
    const linkInline=text=>inline(text).replace(/\[([^\]]+)\]\(([^)]*)\)/g,(match,label,href)=>{
      const entry=MLS.resolveRelatedEntry(label,href,language,sourceCode);if(entry)return`<a href="#entry=${entry.code}">${inRelations?`Entrada ${entry.n}: ${entry.title}`:label}</a>`;
      const safeHref=href.replace(/&amp;/g,'&');if(/^https?:\/\//i.test(safeHref))return`<a href="${escAttr(safeHref)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
      if(safeHref.startsWith('#')&&safeHref.length>1&&outline.some(item=>item.id===safeHref.slice(1)))return`<a href="${escAttr(safeHref)}">${label}</a>`;
      return`<a href="${escAttr(MLS.relatedSearchHref(label,language))}">${label}</a>`;
    });
    const cells=line=>line.trim().replace(/^\|/,'').replace(/\|$/,'').split('|').map(cell=>cell.trim());
    const isTableRule=line=>/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
    const flushList=()=>{if(listType){out+=`</${listType}>`;listType=''}};
    const flushParagraph=()=>{if(paragraph.length){out+=`<p>${linkInline(paragraph.join(' '))}</p>`;paragraph=[]}};
    const flushTable=()=>{if(!inTable)return;const [header,...rows]=tableRows;out+='<table><thead><tr>'+header.map(cell=>`<th>${linkInline(cell)}</th>`).join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+header.map((_,i)=>`<td>${linkInline(row[i]||'')}</td>`).join('')+'</tr>').join('')+'</tbody></table>';tableRows=[];inTable=false};
    const lines=source.split('\n');
    for(let i=0;i<lines.length;i++){
      const line=lines[i]||'',trimmed=line.trim();
      if(/^<a\s+id=["'](?:entry|entrada)-\d+["']><\/a>\s*$/.test(trimmed))continue;
      // PDF text extraction repeats the page logo as a standalone bold M in
      // article bodies. It is page furniture, not article content.
      if(/^\*\*M\*\*$/.test(trimmed))continue;
      if(trimmed.startsWith('|')&&i+1<lines.length&&isTableRule(lines[i+1])){flushParagraph();flushList();flushTable();inTable=true;tableRows.push(cells(line));i++;continue}
      if(inTable){if(trimmed.startsWith('|')){tableRows.push(cells(line));continue}flushTable()}
      if(!trimmed){flushParagraph();const next=lines.slice(i+1).find(value=>value.trim())?.trim()||'';const continues=listType==='ol'?/^\d+[.)]\s+/.test(next):listType==='ul'?/^[-*]\s+/.test(next):false;if(!continues)flushList();continue}
      if(/^#{4,6}\s+/.test(trimmed)){flushParagraph();flushList();const label=trimmed.replace(/^#{4,6}\s+/,'');const info=outline[headingIndex++]||{id:`sec-${headingIndex}`,label};out+=`<h2 id="${escAttr(info.id)}" class="entry-section-title">${linkInline(label)}</h2>`;inRelations=/^(?:Entradas relacionadas|Related entries)$/i.test(label.trim());continue}
      if(/^[-*]\s+/.test(trimmed)){flushParagraph();if(listType!=='ul'){flushList();out+='<ul>';listType='ul'}out+=`<li>${linkInline(trimmed.replace(/^[-*]\s+/,''))}</li>`;continue}
      const ordered=trimmed.match(/^\d+[.)]\s+(.+)$/);if(ordered){flushParagraph();if(listType!=='ol'){flushList();out+='<ol>';listType='ol'}out+=`<li>${linkInline(ordered[1])}</li>`;continue}
      if(/^[-*_]{3,}$/.test(trimmed)){flushParagraph();flushList();out+='<hr>';continue}
      if(/^>\s?/.test(trimmed)){flushParagraph();flushList();out+=`<blockquote>${linkInline(trimmed.replace(/^>\s?/,''))}</blockquote>`;continue}
      flushList();paragraph.push(trimmed);
    }
    flushParagraph();flushList();flushTable();return out;
  };
  MLS.structureFor=slug=>{const arr=MLS.data.byLanguage[slug]||[];const levels=[...new Set(arr.map(e=>e.level))].sort((a,b)=>(MLS.data.levelOrder[a]??99)-(MLS.data.levelOrder[b]??99));const parts=[...new Map(arr.map(e=>[String(e.partNum),{num:e.partNum,title:e.part}])).values()].sort((a,b)=>romanToInt(a.num)-romanToInt(b.num));const chapters=[...new Map(arr.map(e=>[String(e.chapterNum),{num:e.chapterNum,title:e.chapter,partNum:e.partNum,part:e.part}])).values()].sort((a,b)=>Number(a.num)-Number(b.num));return{levels,parts,chapters}};
  MLS.ui={langBadge(slug){const m=MLS.data.metaBySlug[slug];return `<span class="badge">${m?.flag||''} ${esc(m?.name||slug)}</span>`},levelBadge(level){return `<span class="badge">${esc(level)}</span>`},empty(text){return `<div class="empty">${esc(text)}</div>`}};
  MLS.resultCard=(r,opts={})=>`<article class="result-card" data-code="${escAttr(r.code)}"><div class="result-simple-meta">${MLS.data.metaBySlug[r.language]?.flag||''} ${esc(MLS.data.metaBySlug[r.language]?.name||'')} · ${esc(r.level)}</div><h3>${esc(r.title)}</h3>${r.target?`<div class="target">${esc(r.target)}</div>`:''}<p>${esc(r.plain||r.definition||short(r.chapter)||'')}</p>${opts.compare?`<label class="checkline"><input type="checkbox" class="compareCheck" data-code="${escAttr(r.code)}" ${MLS.state.compare.includes(r.code)?'checked':''}> Comparar</label>`:''}</article>`;
  MLS.attachResultCards=()=>{document.querySelectorAll('.result-card').forEach(card=>card.addEventListener('click',ev=>{if(ev.target.closest('label,input,button,a,select'))return;location.hash=`#entry=${card.dataset.code}`}));document.querySelectorAll('.compareCheck').forEach(ch=>ch.addEventListener('change',ev=>MLS.compare?.toggle(ev.target.dataset.code,ev.target.checked)))};
  MLS.setSidebarActive=()=>{document.querySelectorAll('.sidebar a,.mobile-tabbar [data-mobile-nav]').forEach(a=>a.classList.remove('active'));const h=location.hash||'#home';let key='home';if(h==='#map'||h.startsWith('#map&'))key='map';else if(h.startsWith('#map=')){key='map';const slug=h.slice(5).split('&')[0];document.querySelector(`a[href="#map=${CSS.escape(slug)}"]`)?.classList.add('active')}else if(h.startsWith('#entry='))key='map';else if(h.startsWith('#search'))key='search';else if(h.startsWith('#az'))key='az';else if(h.startsWith('#themes'))key='map';else if(h.startsWith('#compare'))key='compare';else if(h.startsWith('#favorites'))key='favorites';else if(h.startsWith('#recent'))key='recent';else if(h.startsWith('#offline'))key='offline';else if(h.startsWith('#settings'))key='settings';document.querySelector(`.sidebar a[data-nav="${key}"]`)?.classList.add('active');document.querySelector(`.mobile-tabbar [data-mobile-nav="${key}"]`)?.classList.add('active');if(h.startsWith('#lang=')){const slug=h.slice(6).split('&')[0];document.querySelector(`a[href="#map=${CSS.escape(slug)}"]`)?.classList.add('active')}};
  window.toast=MLS.toast;
})();

