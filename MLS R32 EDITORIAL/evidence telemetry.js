'use strict';

function numberOrNull(value){
  const n=Number(value);
  return Number.isFinite(n)?n:null;
}
function utf8Bytes(value){
  const text=typeof value==='string'?value:JSON.stringify(value);
  if(typeof TextEncoder!=='undefined')return new TextEncoder().encode(text).length;
  return unescape(encodeURIComponent(text)).length;
}
function createD1Meter(){
  const state={
    queries:0,
    batchCalls:0,
    metaReadOperations:0,
    metaWriteOperations:0,
    missingReadMetaOperations:0,
    missingWriteMetaOperations:0,
    rowsRead:0,
    rowsWritten:0,
    observedRowsRead:0,
    observedRowsWritten:0
  };
  function capture(result,{read=true,write=true}={}){
    const meta=result&&result.meta?result.meta:{};
    const rr=numberOrNull(meta.rows_read??meta.rowsRead);
    const rw=numberOrNull(meta.rows_written??meta.rowsWritten);
    const results=Array.isArray(result?.results)?result.results:[];
    const changes=numberOrNull(meta.changes)??0;
    if(read){
      state.observedRowsRead+=results.length;
      if(rr===null)state.missingReadMetaOperations++;
      else {state.metaReadOperations++;state.rowsRead+=rr;}
    }
    if(write){
      state.observedRowsWritten+=changes;
      if(rw===null)state.missingWriteMetaOperations++;
      else {state.metaWriteOperations++;state.rowsWritten+=rw;}
    }
  }
  function wrapStatement(raw,sql=''){
    return {
      __mlsEvidenceRawStatement:raw,
      __mlsEvidenceSql:sql,
      bind(...args){return wrapStatement(raw.bind(...args),sql);},
      async all(){
        state.queries++;
        const result=await raw.all();
        capture(result,{read:true,write:true});
        return result;
      },
      async first(column){
        state.queries++;
        const result=await raw.all();
        capture(result,{read:true,write:true});
        const row=(result.results||[])[0]||null;
        if(column===undefined)return row;
        return row===null?null:row[column];
      },
      async run(){
        state.queries++;
        const result=await raw.run();
        capture(result,{read:true,write:true});
        return result;
      }
    };
  }
  function wrap(db){
    return {
      __mlsEvidenceOriginal:db,
      prepare(sql){return wrapStatement(db.prepare(sql),sql);},
      async batch(statements){
        state.batchCalls++;
        const raws=statements.map(x=>x&&x.__mlsEvidenceRawStatement?x.__mlsEvidenceRawStatement:x);
        state.queries+=raws.length;
        const results=await db.batch(raws);
        for(const result of results||[])capture(result,{read:true,write:true});
        return results;
      }
    };
  }
  function snapshot(){
    const exactRowsRead=state.missingReadMetaOperations===0&&state.metaReadOperations>0;
    const exactRowsWritten=state.missingWriteMetaOperations===0&&state.metaWriteOperations>0;
    return {
      queries:state.queries,
      batchCalls:state.batchCalls,
      exactRowsRead,
      exactRowsWritten,
      d1RowsRead:exactRowsRead?state.rowsRead:null,
      d1RowsWritten:exactRowsWritten?state.rowsWritten:null,
      observedRowsRead:state.observedRowsRead,
      observedRowsWritten:state.observedRowsWritten,
      missingReadMetaOperations:state.missingReadMetaOperations,
      missingWriteMetaOperations:state.missingWriteMetaOperations,
      source:'D1 result meta when available; observed rows are a separate fallback and are not billed-row estimates'
    };
  }
  return {wrap,snapshot};
}

async function queryRows(db,sql,...args){
  const result=await db.prepare(sql).bind(...args).all();
  return result.results||[];
}
async function measureEntryLogicalBytes(env,code){
  const normalized=String(code||'').trim().toUpperCase();
  const article=await env.WIKI_DB.prepare('SELECT code,generated_at FROM wiki_articles WHERE code=?').bind(normalized).first();
  if(!article){
    const e=new Error('ARTICLE_NOT_FOUND');e.code='ARTICLE_NOT_FOUND';e.status=404;throw e;
  }
  const state=await queryRows(env.WIKI_DB,'SELECT * FROM wiki_evidence_entry_state WHERE code=?',normalized);
  const claims=await queryRows(env.WIKI_DB,'SELECT * FROM wiki_evidence_claims WHERE code=? AND article_generated_at=? ORDER BY claim_id',normalized,article.generated_at);
  const links=await queryRows(env.WIKI_DB,`SELECT l.* FROM wiki_evidence_links l JOIN wiki_evidence_claims c ON c.claim_id=l.claim_id WHERE c.code=? AND c.article_generated_at=? ORDER BY l.link_id`,normalized,article.generated_at);
  const conflicts=await queryRows(env.WIKI_DB,'SELECT * FROM wiki_evidence_conflicts WHERE code=? AND article_generated_at=? ORDER BY conflict_id',normalized,article.generated_at);
  const reviews=await queryRows(env.WIKI_DB,'SELECT * FROM wiki_evidence_reviews WHERE code=? AND article_generated_at=? ORDER BY review_id',normalized,article.generated_at);
  const revisions=await queryRows(env.WIKI_DB,'SELECT * FROM wiki_article_revisions WHERE code=? ORDER BY revision_number',normalized);
  const sources=await queryRows(env.WIKI_DB,`SELECT DISTINCT s.* FROM wiki_sources s JOIN wiki_evidence_links l ON l.source_id=s.source_id JOIN wiki_evidence_claims c ON c.claim_id=l.claim_id WHERE c.code=? AND c.article_generated_at=? ORDER BY s.source_id`,normalized,article.generated_at);
  const owned={state,claims,links,conflicts,reviews,revisions};
  const entryOwnedBytes=utf8Bytes(owned);
  const referencedSourceBytes=utf8Bytes(sources);
  return {
    code:normalized,
    generatedAt:article.generated_at,
    rowCounts:{
      state:state.length,claims:claims.length,links:links.length,conflicts:conflicts.length,reviews:reviews.length,revisions:revisions.length,sources:sources.length
    },
    entryOwnedBytes,
    referencedSourceBytes,
    logicalEvidenceBytes:entryOwnedBytes+referencedSourceBytes,
    measurement:'UTF-8 JSON logical payload; not physical SQLite file size. Referenced source bytes may be shared across entries.'
  };
}

module.exports={createD1Meter,measureEntryLogicalBytes,utf8Bytes};
