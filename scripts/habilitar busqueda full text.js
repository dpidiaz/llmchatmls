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

function patchSearch(source){
  source=String(source);
  if(source.includes(MARKER))return source;
  const start=source.indexOf('  async function deepSearch(');
  const end=source.indexOf('  function page(){',start);
  if(start<0||end<0||end<=start)throw new Error('No se encontró el bloque deepSearch de search.js.');
  return source.slice(0,start)+FULLTEXT_BLOCK+source.slice(end);
}

function main(){
  const target='public/js/search.js';
  const source=fs.readFileSync(target,'utf8');
  fs.writeFileSync(target,patchSearch(source),'utf8');
  console.log('Búsqueda full-text canónica 1.0 habilitada.');
}

module.exports={MARKER,FULLTEXT_BLOCK,patchSearch};
if(require.main===module)main();
