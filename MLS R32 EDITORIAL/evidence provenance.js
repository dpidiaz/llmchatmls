'use strict';
const foundation=require('./evidence foundation.js');
const registry=require('./evidence registry.js');
const claims=require('./evidence claims.js');
const reviews=require('./evidence reviews.js');

async function tableExists(env,name){
  const row=await env.WIKI_DB.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").bind(name).first();
  return !!row;
}
async function composeArticleProvenance(env,code){
  await registry.ensureEvidenceDb(env);
  const normalized=String(code||'').trim().toUpperCase();
  const article=await env.WIKI_DB.prepare(`SELECT code,language,language_name,title,level,part,chapter,provider,model,audit_provider,audit_model,prompt_version,generated_at,article_markdown FROM wiki_articles WHERE code=?`).bind(normalized).first();
  if(!article){const e=new Error('ARTICLE_NOT_FOUND');e.code='ARTICLE_NOT_FOUND';e.status=404;throw e;}
  const version=await claims.currentArticleVersion(env,normalized);
  let r32Provenance=null;
  if(await tableExists(env,'wiki_article_provenance'))r32Provenance=await env.WIKI_DB.prepare('SELECT * FROM wiki_article_provenance WHERE code=?').bind(normalized).first();
  const state=await env.WIKI_DB.prepare('SELECT * FROM wiki_evidence_entry_state WHERE code=?').bind(normalized).first();
  const stateCurrent=!!state&&foundation.assertEvidenceVersionMatch(version,state);
  const reviewState=await reviews.validReviewState(env,normalized);
  const revisionRows=await env.WIKI_DB.prepare(`SELECT revision_id,revision_number,parent_revision_id,article_hash,source_generated_at,change_reason,evidence_review_id,status,created_at FROM wiki_article_revisions WHERE code=? ORDER BY revision_number`).bind(normalized).all();
  let effectiveEvidenceStatus='UNSOURCED';
  if(stateCurrent){
    if(reviewState.editorial)effectiveEvidenceStatus='REVIEWED';
    else if(reviewState.verification)effectiveEvidenceStatus='VERIFIED';
    else if(Number(state.sources_total||0)>0&&Number(state.claims_total||0)>0)effectiveEvidenceStatus='SOURCED';
  }
  return {
    system:foundation.MLS_EVIDENCE_CONTEXT,
    code:normalized,
    articleVersion:version,
    generation:{
      generatedWithAI:!!(article.provider||article.model),
      provider:article.provider||null,
      model:article.model||null,
      auditProvider:article.audit_provider||null,
      auditModel:article.audit_model||null,
      promptVersion:article.prompt_version||null,
      generatedAt:article.generated_at,
      articleHash:version.articleHash
    },
    r32:{
      provenance:r32Provenance,
      origin:r32Provenance?.origin||'r32-canonical',
      stagingRunId:r32Provenance?.staging_run_id||null,
      snapshotVersion:r32Provenance?.snapshot_version||null,
      snapshotCommit:r32Provenance?.snapshot_commit||null,
      integratedAt:r32Provenance?.integrated_at||null
    },
    r33:{
      evidenceVersion:foundation.MLS_EVIDENCE_VERSION,
      effectiveStatus:effectiveEvidenceStatus,
      stateCurrent,
      state:stateCurrent?state:null,
      evidenceSnapshotHash:reviewState.snapshotHash,
      verificationReviewId:reviewState.verification?.review_id||null,
      editorialReviewId:reviewState.editorial?.review_id||null,
      verifiedAt:reviewState.verifiedAt,
      reviewedAt:reviewState.reviewedAt,
      revisions:revisionRows.results||[]
    }
  };
}

module.exports={tableExists,composeArticleProvenance};
