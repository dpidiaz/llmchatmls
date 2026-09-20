'use strict';

const fs=require('node:fs');

const MARKER='// MLS FULL TEXT SEARCH 1.0';

const FULLTEXT_BLOCK=[
  '  '+MARKER,
  '  const fullTextCache=new Map();',
  "  function fullTextNormalize(text,locale='es'){",
  "    return String(text||'').toLocaleLowerCase(locale).normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/\\s+/g,' ').trim();",
  '  }',
  '  function fullTextKeepToken(token){',
  '    const chars=Array.from(token);',
  '    if(chars.length>=2)return true;',
  '    return /[\\u3040-\\u30ff\\u3400-\\u9fff\\uac00-\\ud7af]/u.test(token);',
  '  }',
  '  function fullTextFallbackSegments(text){',
  '    try{return text.match(/[\\p{L}\\p{N}]+/gu)||[]}',
  '    catch{return text.match(/[A-Za-zÀ-ž\\u0400-\\u04ff\\u3040-\\u30ff\\u3400-\\u9fff\\uac00-\\ud7af0-9]+/g)||[]}',
  '  }',
  "  function fullTextTokenize(text,locale='es'){",
  '    const normalized=fullTextNormalize(text,locale),out=[];',
  "    if(typeof Intl!=='undefined'&&typeof Intl.Segmenter==='function'){",
  "      const segmenter=new Intl.Segmenter(locale,{granularity:'word'});",
  '      for(const item of segmenter.segment(normalized)){',
  '        if(item.isWordLike===false)continue;',
  "        const token=String(item.segment||'').trim();",
  '        if(token&&fullTextKeepToken(token))out.push(token);',
  '      }',
  '    }else{',
  '      for(const token of fullTextFallbackSegments(normalized))if(fullTextKeepToken(token))out.push(token);',
  '    }',
  '    return out;',
  '  }',
  '  async function loadFullTextIndex(slug){',
  '    if(fullTextCache.has(slug))return fullTextCache.get(slug);',
  "    const promise=fetch('data/search/'+encodeURIComponent(slug)+'.json',{cache:'default'})",
  "      .then(response=>{if(!response.ok)throw new Error('No se pudo cargar el índice full-text de '+slug);return response.json()})",
  "      .then(index=>{",
  "        if(index?.standard!=='MLS R32'||index?.promptVersion!=='32.0'||index?.version!=='1.0'||index?.language!==slug||!Array.isArray(index.codes)||!index.postings)throw new Error('Índice full-text inválido: '+slug);",
  '        return index;',
  '      })',
  '      .catch(error=>{fullTextCache.delete(slug);throw error});',
  '    fullTextCache.set(slug,promise);',
  '    return promise;',
  '  }',
  '  function fullTextScores(index,variant){',
  '    const tokens=[...new Set(fullTextTokenize(variant,index.locale))];',
  '    const active=tokens.filter(token=>Array.isArray(index.postings[token])&&index.postings[token].length);',
  '    if(!active.length)return new Map();',
  '    const required=active.length<=2?1:Math.ceil(active.length/2);',
  '    const stats=new Map();',
  '    for(const token of active){',
  '      const posting=index.postings[token],df=posting.length/2;',
  '      const idf=Math.log((index.totalEntries+1)/(df+1))+1;',
  '      for(let i=0;i<posting.length;i+=2){',
  '        const doc=posting[i],tf=posting[i+1];',
  '        let row=stats.get(doc);',
  '        if(!row){row={score:0,matched:0};stats.set(doc,row)}',
  '        row.score+=(1+Math.log(Math.max(1,tf)))*idf;',
  '        row.matched++;',
  '      }',
  '    }',
  '    const out=new Map();',
  '    for(const[doc,row]of stats)if(row.matched>=required)out.set(doc,row.score);',
  '    return out;',
  '  }',
  "  function fullTextPasses(r,lang='',level='',part='',chapter=''){",
  '    return r&&(!lang||r.language===lang)&&(!level||r.level===level)&&(!part||String(r.partNum)===String(part))&&(!chapter||String(r.chapterNum)===String(chapter));',
  '  }',
  "  async function deepSearch(q='',lang='',level='',part='',chapter=''){",
  '    const variants=queryVariants(q);',
  '    if(!variants.length)return baseSearch(q,lang,level,part,chapter);',
  '    const ranked=new Map();',
  '    for(const r of baseSearch(q,lang,level,part,chapter)){',
  '      ranked.set(r.code,{r,s:500+score(r,variants)*5});',
  '    }',
  '    const slugs=lang?[lang]:MLS_META.map(m=>m.slug);',
  '    await Promise.all(slugs.map(async slug=>{',
  '      try{',
  '        const index=await loadFullTextIndex(slug);',
  '        for(const variant of variants){',
  '          const hits=fullTextScores(index,variant);',
  '          for(const[doc,lexical]of hits){',
  '            const code=index.codes[doc],r=MLS.data.idxByCode[code];',
  '            if(!fullTextPasses(r,lang,level,part,chapter))continue;',
  '            const candidate=100+lexical;',
  '            const previous=ranked.get(code);',
  '            if(!previous||candidate>previous.s)ranked.set(code,{r,s:candidate});',
  '          }',
  '        }',
  '      }catch(error){',
  "        console.warn('MLS full-text fallback',slug,error);",
  '      }',
  '    }));',
  "    return [...ranked.values()].sort((a,b)=>b.s-a.s||a.r.title.localeCompare(b.r.title,'es')).map(x=>x.r);",
  '  }',
  ''
].join('\n');


const LANGUAGE_FIRST_MARKER='// MLS SEARCH LANGUAGE FIRST 1.0';

function patchLanguageFirst(source){
  source=String(source);
  if(source.includes(LANGUAGE_FIRST_MARKER))return source;

  const pageHead="  function page(){const raw=location.hash.split('?')[1]||'',params=new URLSearchParams(raw),q0=params.get('q')||'',lang0=params.get('lang')||'';";
  const pageHeadReplacement="  function page(){const raw=location.hash.split('?')[1]||'',params=new URLSearchParams(raw),q0=params.get('q')||'';let savedLang='';try{savedLang=localStorage.getItem('mlsSearchLanguage')||''}catch{}const requestedLang=params.has('lang')?(params.get('lang')||''):null,currentLang=MLS_META.some(m=>m.slug===MLS.state.currentLang)?MLS.state.currentLang:'',candidateLang=requestedLang!==null?requestedLang:(currentLang||savedLang||''),lang0=candidateLang==='all'||MLS_META.some(m=>m.slug===candidateLang)?candidateLang:'';"+LANGUAGE_FIRST_MARKER;
  if(!source.includes(pageHead))throw new Error('No se encontró inicio de page() para idioma obligatorio.');
  source=source.replace(pageHead,pageHeadReplacement);

  const oldUi='<div class="search-main"><div class="searchbox big-search"><input id="q" value="${esc(q0)}" placeholder="Ej.: plural, pasado, dativo…" autofocus></div><details class="search-filters"><summary>Más filtros</summary><div class="toolbar"><select id="langFilter"><option value="">Todos los idiomas</option>${MLS_META.map(m=>`<option value="${m.slug}" ${m.slug===lang0?\'selected\':\'\'}>${m.flag} ${esc(m.name)}</option>`).join(\'\')}</select><select id="levelFilter"><option value="">Todos los niveles</option></select>';
  const newUi='<div class="search-main"><div class="searchbox big-search"><input id="q" value="${esc(q0)}" placeholder="Ej.: plural, pasado, dativo…" autofocus></div><div class="toolbar search-language-primary"><label><span>Buscar en</span><select id="langFilter"><option value="" ${!lang0?\'selected\':\'\'} disabled>Selecciona un idioma</option><option value="all" ${lang0===\'all\'?\'selected\':\'\'}>Todos los idiomas</option>${MLS_META.map(m=>`<option value="${m.slug}" ${m.slug===lang0?\'selected\':\'\'}>${m.flag} ${esc(m.name)}</option>`).join(\'\')}</select></label></div><details class="search-filters"><summary>Más filtros</summary><div class="toolbar"><select id="levelFilter"><option value="">Todos los niveles</option></select>';
  if(!source.includes(oldUi))throw new Error('No se encontró selector de idioma original.');
  source=source.replace(oldUi,newUi);

  const oldFacets="const refreshFacets=()=>{const slug=langEl.value,base=slug?(MLS.data.byLanguage[slug]||[]):MLS_INDEX;";
  const newFacets="const refreshFacets=()=>{const rawSlug=langEl.value,slug=rawSlug==='all'?'':rawSlug,base=rawSlug==='all'?MLS_INDEX:(slug?(MLS.data.byLanguage[slug]||[]):[]);";
  if(!source.includes(oldFacets))throw new Error('No se encontró refreshFacets original.');
  source=source.replace(oldFacets,newFacets);

  const oldRun="const run=async()=>{const q=document.getElementById('q').value,lang=langEl.value,level=levelEl.value,part=partEl.value,chapter=chapterEl.value;let rs=MLS.state.deep?await deepSearch(q,lang,level,part,chapter):baseSearch(q,lang,level,part,chapter);";
  const newRun="const run=async()=>{const q=document.getElementById('q').value,rawLang=langEl.value,lang=rawLang==='all'?'':rawLang,level=levelEl.value,part=partEl.value,chapter=chapterEl.value;if(!rawLang){document.getElementById('searchInfo').textContent='Selecciona un idioma para buscar.';document.getElementById('results').innerHTML='';return}try{localStorage.setItem('mlsSearchLanguage',rawLang)}catch{}let rs=MLS.state.deep?await deepSearch(q,lang,level,part,chapter):baseSearch(q,lang,level,part,chapter);";
  if(!source.includes(oldRun))throw new Error('No se encontró run() original.');
  source=source.replace(oldRun,newRun);

  return source;
}

function patchSearch(source){
  source=String(source);
  if(source.includes(MARKER))return patchLanguageFirst(source);
  const start=source.indexOf('  async function deepSearch(');
  const end=source.indexOf('  function page(){',start);
  if(start<0||end<0||end<=start)throw new Error('No se encontró el bloque deepSearch de search.js.');
  source=source.slice(0,start)+FULLTEXT_BLOCK+source.slice(end);
  return patchLanguageFirst(source);
}

function main(){
  const target='public/js/search.js';
  const source=fs.readFileSync(target,'utf8');
  fs.writeFileSync(target,patchSearch(source),'utf8');
  console.log('Búsqueda full-text canónica 1.0 habilitada.');
}

module.exports={MARKER,LANGUAGE_FIRST_MARKER,FULLTEXT_BLOCK,patchLanguageFirst,patchSearch};
if(require.main===module)main();
