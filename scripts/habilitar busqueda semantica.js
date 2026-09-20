'use strict';

const fs=require('node:fs');

const MARKER='// MLS SEMANTIC HYBRID SEARCH 1.0';

const BLOCK=[
  '  '+MARKER,
  '  const semanticIndexCache=new Map();',
  '  const semanticQueryCache=new Map();',
  "  async function loadSemanticIndex(slug){",
  '    if(semanticIndexCache.has(slug))return semanticIndexCache.get(slug);',
  "    const task=Promise.all([",
  "      fetch('data/semantic/'+encodeURIComponent(slug)+'.json',{cache:'default'}),",
  "      fetch('data/semantic/'+encodeURIComponent(slug)+'.bin',{cache:'default'})",
  '    ]).then(async responses=>{',
  "      if(!responses[0].ok||!responses[1].ok)throw new Error('Índice semántico no disponible para '+slug);",
  '      const meta=await responses[0].json(),buffer=await responses[1].arrayBuffer();',
  "      if(meta?.standard!=='MLS R32'||meta?.promptVersion!=='32.0'||meta?.version!=='1.0'||meta?.model!=='@cf/baai/bge-m3'||meta?.language!==slug)throw new Error('Metadata semántica inválida: '+slug);",
  "      if(!Number.isInteger(meta.dimensions)||!Number.isInteger(meta.recordBytes)||meta.recordBytes!==meta.dimensions+4||!Array.isArray(meta.chunks))throw new Error('Forma semántica inválida: '+slug);",
  "      if(buffer.byteLength!==meta.chunks.length*meta.recordBytes)throw new Error('Binario semántico incompatible: '+slug);",
  '      return {meta,buffer,view:new DataView(buffer)};',
  '    }).catch(error=>{semanticIndexCache.delete(slug);throw error});',
  '    semanticIndexCache.set(slug,task);',
  '    return task;',
  '  }',
  "  async function semanticQueryVector(query){",
  "    const key=String(query||'').replace(/\s+/g,' ').trim();",
  "    if(key.length<2)throw new Error('Consulta semántica demasiado corta');",
  '    if(semanticQueryCache.has(key))return semanticQueryCache.get(key);',
  "    const task=fetch('/api/search/embedding',{method:'POST',headers:{'content-type':'application/json',accept:'application/json'},body:JSON.stringify({query:key}),cache:'no-store'})",
  "      .then(async response=>{const payload=await response.json().catch(()=>({}));if(!response.ok||!payload?.ok||!Array.isArray(payload.vector))throw new Error(payload?.error||'Embedding semántico no disponible');if(payload.model!=='@cf/baai/bge-m3')throw new Error('Modelo semántico inesperado');return payload.vector.map(Number)})",
  '      .catch(error=>{semanticQueryCache.delete(key);throw error});',
  '    semanticQueryCache.set(key,task);',
  '    return task;',
  '  }',
  "  function semanticTop(index,queryVector,lang='',level='',part='',chapter='',topK=50){",
  '    const {meta,view}=index;',
  "    if(queryVector.length!==meta.dimensions)throw new Error('Dimensión de consulta incompatible');",
  '    const best=new Map();',
  '    for(let i=0;i<meta.chunks.length;i++){',
  '      const chunk=meta.chunks[i],r=MLS.data.idxByCode[chunk.code];',
  '      if(!fullTextPasses(r,lang,level,part,chapter))continue;',
  '      const offset=i*meta.recordBytes,scale=view.getFloat32(offset,true);',
  '      let score=0;',
  '      for(let d=0;d<meta.dimensions;d++)score+=view.getInt8(offset+4+d)*scale*queryVector[d];',
  '      const previous=best.get(chunk.code);',
  '      if(!previous||score>previous.score)best.set(chunk.code,{r,score,section:chunk.section||null});',
  '    }',
  "    return [...best.values()].sort((a,b)=>b.score-a.score||a.r.title.localeCompare(b.r.title,'es')).slice(0,topK);",
  '  }',
  "  async function deepSearch(q='',lang='',level='',part='',chapter=''){",
  '    const variants=queryVariants(q);',
  '    if(!variants.length)return baseSearch(q,lang,level,part,chapter);',
  '    const ranked=new Map();',
  '    for(const r of baseSearch(q,lang,level,part,chapter))ranked.set(r.code,{r,s:500+score(r,variants)*5});',
  '    const slugs=lang?[lang]:MLS_META.map(m=>m.slug);',
  '    await Promise.all(slugs.map(async slug=>{',
  '      try{',
  '        const index=await loadFullTextIndex(slug);',
  '        for(const variant of variants){',
  '          const hits=fullTextScores(index,variant);',
  '          for(const[doc,lexical]of hits){',
  '            const code=index.codes[doc],r=MLS.data.idxByCode[code];',
  '            if(!fullTextPasses(r,lang,level,part,chapter))continue;',
  '            const candidate=100+lexical,previous=ranked.get(code);',
  '            if(!previous||candidate>previous.s)ranked.set(code,{r,s:candidate});',
  '          }',
  '        }',
  '      }catch(error){console.warn("MLS full-text fallback",slug,error)}',
  '    }));',
  '    try{',
  '      const queryVector=await semanticQueryVector(q);',
  '      await Promise.all(slugs.map(async slug=>{',
  '        try{',
  '          const semantic=await loadSemanticIndex(slug);',
  '          for(const hit of semanticTop(semantic,queryVector,lang,level,part,chapter,50)){',
  '            const semanticScore=90+Math.max(-1,Math.min(1,hit.score))*80;',
  '            const previous=ranked.get(hit.r.code);',
  '            if(previous){previous.s+=Math.max(0,semanticScore)*0.35;if(hit.section)previous.semanticSection=hit.section}',
  '            else ranked.set(hit.r.code,{r:hit.r,s:semanticScore,semanticSection:hit.section});',
  '          }',
  '        }catch(error){console.warn("MLS semantic index fallback",slug,error)}',
  '      }));',
  '    }catch(error){console.warn("MLS semantic query fallback",error)}',
  "    return [...ranked.values()].sort((a,b)=>b.s-a.s||a.r.title.localeCompare(b.r.title,'es')).map(x=>x.r);",
  '  }',
  ''
].join('\n');

function patchSemanticSearch(source){
  source=String(source);
  if(source.includes(MARKER))return source;
  const start=source.indexOf("  async function deepSearch(q='',lang='',level='',part='',chapter=''){");
  const end=source.indexOf('  function page(){',start);
  if(start<0||end<0||end<=start)throw new Error('No se encontró deepSearch full-text para añadir semántica.');
  source=source.slice(0,start)+BLOCK+source.slice(end);
  source=source.replace('<input type="checkbox" id="deepCheck"> Buscar también dentro de los textos','<input type="checkbox" id="deepCheck" checked> Búsqueda inteligente: contenido completo + significado');
  source=source.replace("let rs=MLS.state.deep?await deepSearch(q,lang,level,part,chapter):baseSearch(q,lang,level,part,chapter);","const smart=document.getElementById('deepCheck')?.checked!==false;let rs=smart?await deepSearch(q,lang,level,part,chapter):baseSearch(q,lang,level,part,chapter);");
  return source;
}

function main(){
  const target='public/js/search.js';
  const source=fs.readFileSync(target,'utf8');
  fs.writeFileSync(target,patchSemanticSearch(source),'utf8');
  console.log('Búsqueda semántica híbrida MLS 1.0 habilitada.');
}

module.exports={MARKER,BLOCK,patchSemanticSearch};
if(require.main===module)main();
