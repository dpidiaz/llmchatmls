'use strict';
const fs=require('node:fs');

function atlasHelpers(){return `
  function atlasLabel(value,fallback){const text=String(value||'').trim();return text||fallback}
  function atlasPartLabel(entry){return atlasLabel(entry.partTitle||entry.partName||entry.part,'Parte '+entry.partNum)}
  function atlasChapterLabel(entry){return atlasLabel(entry.chapterTitle||entry.chapterName||entry.chapter,'Temas del capítulo')}
  function atlasBuild(vol,e,m){
    const levels=[...new Set(vol.entries.map(x=>String(x.level||'').trim()).filter(Boolean))];
    const parts=new Map();
    for(const item of vol.entries){
      const p=String(item.partNum??'');if(!parts.has(p))parts.set(p,{label:atlasPartLabel(item),chapters:new Map()});
      const part=parts.get(p),c=String(item.chapterNum??'');if(!part.chapters.has(c))part.chapters.set(c,{first:item,entries:[]});part.chapters.get(c).entries.push(item);
    }
    const body=[...parts.entries()].map(([partNum,part])=>{
      const chapters=[...part.chapters.entries()].sort((a,b)=>Number(MLS.chapterDisplayNum(e.language,a[0]))-Number(MLS.chapterDisplayNum(e.language,b[0]))).map(([chapterNum,chapter])=>{
        const display=MLS.chapterDisplayNum(e.language,chapterNum),active=String(chapterNum)===String(e.chapterNum),chapterHash='#lang='+m.slug+'&part='+encodeURIComponent(partNum)+'&chapter='+encodeURIComponent(chapterNum);
        const entries=chapter.entries.slice().sort((a,b)=>a.n-b.n).map(item=>`<a class="atlas-entry ${item.code===e.code?'active':''}" data-title="${escAttr((item.title+' '+(item.target||'')).toLocaleLowerCase())}" data-level="${escAttr(String(item.level||''))}" href="#entry=${item.code}"><span class="atlas-entry-code">${esc(item.code)}</span><span class="atlas-entry-copy"><strong>${esc(item.title)}</strong>${item.target?`<small>${esc(item.target)}</small>`:''}</span><span class="atlas-entry-level">${esc(item.level||'')}</span></a>`).join('');
        return `<section class="atlas-chapter ${active?'current':''}" data-atlas-chapter><div class="atlas-chapter-head"><a href="${chapterHash}"><strong>Capítulo ${esc(display)}</strong><span>${esc(atlasChapterLabel(chapter.first))}</span></a><small>${chapter.entries.length} temas</small></div><div class="atlas-entry-list">${entries}</div></section>`;
      }).join('');
      return `<section class="atlas-part"><h3>${esc(part.label)}</h3>${chapters}</section>`;
    }).join('');
    return `<dialog id="mlsAtlasDialog" class="mls-atlas-dialog" aria-labelledby="mlsAtlasTitle"><div class="atlas-shell"><header class="atlas-head"><div><span class="atlas-kicker">${m.flag} ${esc(m.name)}</span><h2 id="mlsAtlasTitle">Atlas de la enciclopedia</h2><p>Navega directamente por parte, capítulo, nivel o tema. No es una ruta obligatoria.</p></div><button type="button" class="btn" id="mlsAtlasClose" aria-label="Cerrar atlas">Cerrar</button></header><div class="atlas-toolbar"><label><span>Buscar tema</span><input id="mlsAtlasSearch" type="search" placeholder="Escribe un tema…" autocomplete="off"></label><label><span>Nivel</span><select id="mlsAtlasLevel"><option value="">Todos</option>${levels.map(level=>`<option value="${escAttr(level)}">${esc(level)}</option>`).join('')}</select></label><button type="button" class="btn" id="mlsAtlasCurrent">Ir al tema actual</button></div><div class="atlas-current-path">Parte ${esc(e.partNum)} · Capítulo ${esc(MLS.chapterDisplayNum(e.language,e.chapterNum))} · ${esc(e.level||'Sin nivel')}</div><div class="atlas-body" id="mlsAtlasBody">${body}</div><div class="atlas-empty" id="mlsAtlasEmpty" hidden>No hay temas que coincidan con esos filtros.</div></div></dialog>`;
  }
  function atlasEnsureStyles(){if(document.getElementById('mlsAtlasStyles'))return;const style=document.createElement('style');style.id='mlsAtlasStyles';style.textContent=`
    .mls-atlas-dialog{width:min(1180px,94vw);height:min(860px,92vh);max-width:none;max-height:none;border:1px solid rgba(20,28,36,.16);border-radius:20px;padding:0;background:#f8f6f1;color:#182026;box-shadow:0 28px 90px rgba(0,0,0,.28)}
    .mls-atlas-dialog::backdrop{background:rgba(13,20,26,.5);backdrop-filter:blur(3px)}
    .atlas-shell{display:flex;flex-direction:column;height:100%;min-height:0}.atlas-head{display:flex;justify-content:space-between;gap:24px;padding:24px 28px 18px;border-bottom:1px solid rgba(20,28,36,.12);background:#fff}.atlas-head h2{margin:.2rem 0;font-size:clamp(1.45rem,3vw,2rem)}.atlas-head p{margin:0;color:#59636c}.atlas-kicker{font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;color:#6e5843}.atlas-toolbar{display:grid;grid-template-columns:minmax(220px,1fr) 180px auto;gap:12px;padding:16px 28px;background:#f3efe7;border-bottom:1px solid rgba(20,28,36,.1)}.atlas-toolbar label{display:grid;gap:5px;font-size:.8rem;font-weight:700}.atlas-toolbar input,.atlas-toolbar select{min-height:42px;border:1px solid #c9c1b6;border-radius:10px;padding:8px 11px;background:#fff;color:#182026;font:inherit}.atlas-current-path{padding:10px 28px;background:#fff;border-bottom:1px solid rgba(20,28,36,.08);font-size:.9rem;color:#5c5045}.atlas-body{padding:22px 28px 40px;overflow:auto}.atlas-part{margin:0 0 30px}.atlas-part>h3{position:sticky;top:-22px;z-index:2;margin:0 -4px 12px;padding:10px 4px 8px;background:#f8f6f1;font-size:1.05rem}.atlas-chapter{margin:0 0 14px;border:1px solid #d8d0c6;border-radius:14px;background:#fff;overflow:hidden}.atlas-chapter.current{border-color:#8f7356;box-shadow:0 0 0 2px rgba(143,115,86,.12)}.atlas-chapter-head{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px 14px;background:#f3efe7;border-bottom:1px solid #ddd5cc}.atlas-chapter-head a{display:flex;gap:8px;align-items:baseline;color:inherit;text-decoration:none}.atlas-chapter-head span,.atlas-chapter-head small{color:#665e57}.atlas-entry-list{display:grid}.atlas-entry{display:grid;grid-template-columns:110px minmax(0,1fr) 58px;gap:12px;align-items:center;padding:10px 14px;color:inherit;text-decoration:none;border-top:1px solid rgba(20,28,36,.07)}.atlas-entry:first-child{border-top:0}.atlas-entry:hover{background:#faf7f1}.atlas-entry.active{background:#ede6dc}.atlas-entry-code,.atlas-entry-level{font-size:.75rem;color:#756b61}.atlas-entry-copy{display:grid;gap:2px;min-width:0}.atlas-entry-copy strong{font-size:.93rem}.atlas-entry-copy small{font-size:.78rem;color:#665e57}.atlas-entry-level{text-align:right}.atlas-empty{padding:32px;text-align:center;color:#665e57}.atlas-open-btn{white-space:nowrap}
    @media(max-width:760px){.mls-atlas-dialog{width:100vw;height:100dvh;border:0;border-radius:0}.atlas-head{padding:18px 16px 14px}.atlas-head p{font-size:.86rem}.atlas-toolbar{grid-template-columns:1fr 1fr;padding:12px 16px}.atlas-toolbar .btn{grid-column:1/-1}.atlas-current-path{padding:9px 16px}.atlas-body{padding:16px 12px 30px}.atlas-part>h3{top:-16px}.atlas-entry{grid-template-columns:minmax(0,1fr) 52px}.atlas-entry-code{display:none}.atlas-chapter-head{align-items:flex-start}.atlas-chapter-head a{display:grid;gap:2px}}
  `;document.head.appendChild(style)}
  function atlasBind(){
    const dialog=document.getElementById('mlsAtlasDialog'),open=document.getElementById('mlsAtlasOpen'),close=document.getElementById('mlsAtlasClose'),search=document.getElementById('mlsAtlasSearch'),level=document.getElementById('mlsAtlasLevel'),current=document.getElementById('mlsAtlasCurrent'),empty=document.getElementById('mlsAtlasEmpty');if(!dialog||!open)return;atlasEnsureStyles();
    const openDialog=()=>{if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','');setTimeout(()=>document.querySelector('.atlas-entry.active')?.scrollIntoView({block:'center'}),20)};
    const closeDialog=()=>{if(typeof dialog.close==='function'&&dialog.open)dialog.close();else dialog.removeAttribute('open')};
    const filter=()=>{const q=String(search?.value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().trim(),lv=String(level?.value||'');let shown=0;dialog.querySelectorAll('.atlas-entry').forEach(a=>{const title=String(a.dataset.title||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase(),ok=(!q||title.includes(q))&&(!lv||a.dataset.level===lv);a.hidden=!ok;if(ok)shown++});dialog.querySelectorAll('[data-atlas-chapter]').forEach(ch=>{ch.hidden=!ch.querySelector('.atlas-entry:not([hidden])')});if(empty)empty.hidden=shown!==0};
    open.onclick=openDialog;close?.addEventListener('click',closeDialog);current?.addEventListener('click',()=>document.querySelector('.atlas-entry.active')?.scrollIntoView({behavior:'smooth',block:'center'}));search?.addEventListener('input',filter);level?.addEventListener('change',filter);dialog.addEventListener('click',event=>{if(event.target===dialog)closeDialog();if(event.target.closest('.atlas-entry,.atlas-chapter-head a'))closeDialog()});
  }
`}

function patchReader(source){
  if(source.includes('id="mlsAtlasDialog"'))return source;
  const pageMarker='  async function page(code){';
  if(!source.includes(pageMarker))throw new Error('No se encontró el punto de inserción de helpers del atlas.');
  source=source.replace(pageMarker,atlasHelpers()+pageMarker);
  const indexMarker="    const chapterIndex=chapterEntries.map((x,i)=>`<a class=\"local-entry ${x.code===code?'active':''}\" href=\"#entry=${x.code}\"><span>${String(i+1).padStart(2,'0')}</span><div><strong>${esc(x.title)}</strong>${x.target?`<small>${esc(x.target)}</small>`:''}</div></a>`).join('');";
  if(!source.includes(indexMarker))throw new Error('No se encontró el índice local del lector.');
  source=source.replace(indexMarker,indexMarker+"\n    const atlasHTML=atlasBuild(vol,e,m);");
  const mobileMarker='      <details class="mobile-local-index"><summary>Ver temas de este capítulo</summary><div class="local-entry-list">${chapterIndex}</div></details>';
  if(!source.includes(mobileMarker))throw new Error('No se encontró el índice móvil del lector.');
  source=source.replace(mobileMarker,mobileMarker+'\n      ${atlasHTML}');
  const actions='<div class="reader-actions simple-actions"><button class="btn primary" id="listenBtn">🔊 Escuchar</button><button class="btn ai-entry-btn" id="aiExplainBtn">✨ Profesor IA</button><button class="btn" id="favBtn">${fav?\'★ Guardado\':\'☆ Guardar\'}</button></div>';
  if(!source.includes(actions))throw new Error('No se encontró la fila de acciones del lector.');
  source=source.replace(actions,'<div class="reader-actions simple-actions"><button class="btn primary" id="listenBtn">🔊 Escuchar</button><button class="btn ai-entry-btn" id="aiExplainBtn">✨ Profesor IA</button><button class="btn atlas-open-btn" id="mlsAtlasOpen">◫ Atlas</button><button class="btn" id="favBtn">${fav?\'★ Guardado\':\'☆ Guardar\'}</button></div>');
  const bindMarker="    document.getElementById('favBtn').onclick=()=>{if(MLS.state.favorites.includes(code))MLS.state.favorites=MLS.state.favorites.filter(x=>x!==code);else MLS.state.favorites.push(code);MLS.save();page(code)};";
  if(!source.includes(bindMarker))throw new Error('No se encontró el enlace de eventos del lector.');
  source=source.replace(bindMarker,bindMarker+'\n    atlasBind();');
  return source;
}

function main(){const target='public/js/reader.js';const source=fs.readFileSync(target,'utf8');const patched=patchReader(source);fs.writeFileSync(target,patched);console.log('Atlas de navegación del lector habilitado.');}
module.exports={patchReader,atlasHelpers};
if(require.main===module)main();
