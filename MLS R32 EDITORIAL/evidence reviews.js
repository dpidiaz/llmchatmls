'use strict';
const foundation=require('./evidence foundation.js');
const registry=require('./evidence registry.js');
const claimsApi=require('./evidence claims.js');

function err(code,status,message=code,extra={}){const e=new Error(message);e.code=code;e.status=status;Object.assign(e,extra);return e;}
function text(v,max=4000){return String(v??'').normalize('NFKC').replace(/\s+/gu,' ').trim().slice(0,max);}

async function snapshotPayload(env,code){
  const snap=await claimsApi.entryEvidenceSnapshot(env,code);
  const sourceIds=[...new Set(snap.links.map(x=>x.source_id).filter(Boolean))].sort();
  const sources=[];
  for(const id of sourceIds){
    const src=await registry.getSourceById(env,id);
    if(src)sources.push({sourceId:src.sourceId,metadataHash:src.metadataHash,status:src.status,authorityTier:src.authorityTier,resourceVersion:src.resourceVersion||null});
  }
  return {
    evidenceVersion:foundation.MLS_EVIDENCE_VERSION,
    citationRendererVersion:foundation.MLS_CITATION_RENDERER_VERSION,
    article:{code:snap.article.code,articleGeneratedAt:snap.article.articleGeneratedAt,articleHash:snap.article.articleHash},
    claims:snap.claims.map(x=>({claimId:x.claim_id,sectionKey:x.section_key||null,summary:x.summary,claimType:x.claim_type,materiality:x.materiality,status:x.status,verificationRevision:x.verification_revision??null})).sort((a,b)=>a.claimId.localeCompare(b.claimId)),
    links:snap.links.map(x=>({linkId:x.link_id,claimId:x.claim_id,sourceId:x.source_id,supportType:x.support_type,locatorJson:x.locator_json,verificationMethod:x.verification_method})).sort((a,b)=>a.linkId.localeCompare(b.linkId)),
    conflicts:snap.conflicts.map(x=>({conflictId:x.conflict_id,claimId:x.claim_id,conflictType:x.conflict_type,status:x.status,context:x.context,resolution:x.resolution||null,sourceIdsJson:x.source_ids_json||'[]'})).sort((a,b)=>a.conflictId.localeCompare(b.conflictId)),
    sources:sources.sort((a,b)=>a.sourceId.localeCompare(b.sourceId))
  };
}
async function evidenceSnapshotHash(env,code){return foundation.sha256Hex(foundation.stableJson(await snapshotPayload(env,code)));}

async function listReviews(env,code){
  await registry.ensureEvidenceDb(env);
  const r=await env.WIKI_DB.prepare('SELECT * FROM wiki_evidence_reviews WHERE code=? ORDER BY created_at,review_id').bind(String(code||'').toUpperCase()).all();
  return r.results||[];
}
async function latestMatchingReview(env,code,reviewKind,snapshotHash){
  await registry.ensureEvidenceDb(env);
  return await env.WIKI_DB.prepare('SELECT * FROM wiki_evidence_reviews WHERE code=? AND review_kind=? AND evidence_snapshot_hash=? ORDER BY created_at DESC,review_id DESC LIMIT 1')
    .bind(String(code||'').toUpperCase(),reviewKind,snapshotHash).first();
}
async function validReviewState(env,code){
  const hash=await evidenceSnapshotHash(env,code);
  const verification=await latestMatchingReview(env,code,'verification',hash);
  let editorial=null;
  if(verification){
    const candidate=await latestMatchingReview(env,code,'editorial_review',hash);
    if(candidate&&Date.parse(candidate.created_at)>Date.parse(verification.created_at))editorial=candidate;
  }
  return {snapshotHash:hash,verification,editorial,verifiedAt:verification?.created_at||null,reviewedAt:editorial?.created_at||null};
}
async function reviewId(input){
  const key=[input.code,input.articleHash,input.evidenceSnapshotHash,input.reviewKind,String(input.evidenceRevision),input.statusAfter,input.reviewerType||'',input.reviewer||'',input.verificationMethod||'',input.runId||''].join('\u001f');
  return 'MLS-REVW-'+(await foundation.sha256Hex(key)).slice(0,24).toUpperCase();
}
async function recordReview(env,input,{now=new Date().toISOString()}={}){
  await registry.ensureEvidenceDb(env);
  const article=await claimsApi.assertArticleVersion(env,input);
  const state=await env.WIKI_DB.prepare('SELECT * FROM wiki_evidence_entry_state WHERE code=?').bind(article.code).first();
  const exact=state&&foundation.assertEvidenceVersionMatch(article,state);
  const currentRevision=exact?Number(state.evidence_revision||0):0;
  foundation.assertExpectedEvidenceRevision(currentRevision,input.expectedEvidenceRevision);
  const currentHash=await evidenceSnapshotHash(env,article.code);
  if(input.expectedSnapshotHash&&input.expectedSnapshotHash!==currentHash)throw err('EVIDENCE_SNAPSHOT_CONFLICT',409,'El snapshot de Evidence cambió.',{currentSnapshotHash:currentHash});
  const reviewKind=text(input.reviewKind,40);if(!['verification','editorial_review'].includes(reviewKind))throw err('INVALID_REVIEW_KIND',422,'reviewKind inválido.');
  const reviewerType=text(input.reviewerType||'chatgpt',40);if(!['chatgpt','human','system'].includes(reviewerType))throw err('INVALID_REVIEWER_TYPE',422,'reviewerType inválido.');
  const statusBefore=text(input.statusBefore||state?.status||'UNSOURCED',20),statusAfter=text(input.statusAfter,20);
  if(!foundation.EVIDENCE_STATUSES.includes(statusBefore)||!foundation.EVIDENCE_STATUSES.includes(statusAfter))throw err('INVALID_REVIEW_STATUS',422,'Estado de review inválido.');
  if(reviewKind==='verification'&&statusAfter!=='VERIFIED')throw err('INVALID_REVIEW_TRANSITION',422,'Verification review debe terminar en VERIFIED.');
  if(reviewKind==='editorial_review'&&statusAfter!=='REVIEWED')throw err('INVALID_REVIEW_TRANSITION',422,'Editorial review debe terminar en REVIEWED.');
  const verificationMethod=text(input.verificationMethod||'manual_source_match',100);
  const rid=await reviewId({code:article.code,articleHash:article.articleHash,evidenceSnapshotHash:currentHash,reviewKind,evidenceRevision:currentRevision,statusAfter,reviewerType,reviewer:text(input.reviewer,200),verificationMethod,runId:text(input.runId,200)});
  const existing=await env.WIKI_DB.prepare('SELECT * FROM wiki_evidence_reviews WHERE review_id=?').bind(rid).first();
  if(existing)return {review:existing,created:false,reused:true,snapshotHash:currentHash};
  const counts=input.counts||{};
  await env.WIKI_DB.prepare(`INSERT OR IGNORE INTO wiki_evidence_reviews(review_id,code,article_generated_at,article_hash,evidence_version,evidence_revision,source_revision,review_kind,evidence_snapshot_hash,status_before,status_after,claims_total,claims_verified,sources_total,conflicts_total,reviewer_type,reviewer,verification_method,citation_renderer_version,parent_review_id,article_revision_id,notes,run_id,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(rid,article.code,article.articleGeneratedAt,article.articleHash,foundation.MLS_EVIDENCE_VERSION,currentRevision,Number(state?.source_revision||0),reviewKind,currentHash,statusBefore,statusAfter,Number(counts.claimsTotal||0),Number(counts.claimsVerified||0),Number(counts.sourcesTotal||0),Number(counts.conflictsTotal||0),reviewerType,text(input.reviewer,200)||null,verificationMethod,foundation.MLS_CITATION_RENDERER_VERSION,text(input.parentReviewId,100)||null,text(input.articleRevisionId,100)||null,text(input.notes,4000)||null,text(input.runId,200)||null,now).run();
  return {review:await env.WIKI_DB.prepare('SELECT * FROM wiki_evidence_reviews WHERE review_id=?').bind(rid).first(),created:true,reused:false,snapshotHash:currentHash};
}

async function getArticleRow(env,code){
  await registry.ensureEvidenceDb(env);
  const row=await env.WIKI_DB.prepare('SELECT code,article_markdown,generated_at FROM wiki_articles WHERE code=?').bind(String(code||'').toUpperCase()).first();
  if(!row)throw err('ARTICLE_NOT_FOUND',404,'La entrada canónica no existe.');
  return row;
}
async function revisionId(code,hash){return 'MLS-ARTREV-'+(await foundation.sha256Hex(String(code).toUpperCase()+'\u001f'+hash)).slice(0,24).toUpperCase();}
async function ensureBaselineRevision(env,code,{now=new Date().toISOString()}={}){
  const row=await getArticleRow(env,code),hash=await foundation.articleHash(row.article_markdown);
  const existing=await env.WIKI_DB.prepare('SELECT * FROM wiki_article_revisions WHERE code=? AND article_hash=?').bind(row.code,hash).first();
  if(existing)return {revision:existing,created:false,reused:true};
  const max=await env.WIKI_DB.prepare('SELECT MAX(revision_number) AS n FROM wiki_article_revisions WHERE code=?').bind(row.code).first();
  const n=Number(max?.n||0)+1,rid=await revisionId(row.code,hash);
  await env.WIKI_DB.prepare(`INSERT OR IGNORE INTO wiki_article_revisions(revision_id,code,revision_number,parent_revision_id,article_markdown,article_hash,source_generated_at,change_reason,evidence_review_id,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(rid,row.code,n,null,row.article_markdown,hash,row.generated_at,'R32 canonical baseline',null,'baseline',now).run();
  return {revision:await env.WIKI_DB.prepare('SELECT * FROM wiki_article_revisions WHERE revision_id=?').bind(rid).first(),created:true,reused:false};
}
async function proposeArticleRevision(env,input,{now=new Date().toISOString()}={}){
  const row=await getArticleRow(env,input.code),currentHash=await foundation.articleHash(row.article_markdown);
  if(String(input.expectedArticleHash||'')!==currentHash)throw err('ARTICLE_VERSION_CONFLICT',409,'La entrada canónica cambió.',{currentArticleHash:currentHash});
  const markdown=foundation.normalizeArticleMarkdown(input.articleMarkdown);if(!markdown)throw err('INVALID_ARTICLE_REVISION',422,'articleMarkdown es obligatorio.');
  const nextHash=await foundation.articleHash(markdown);if(nextHash===currentHash)throw err('NO_ARTICLE_CHANGE',422,'La revisión propuesta no cambia el artículo.');
  const baseline=await ensureBaselineRevision(env,row.code,{now});
  const duplicate=await env.WIKI_DB.prepare('SELECT * FROM wiki_article_revisions WHERE code=? AND article_hash=?').bind(row.code,nextHash).first();
  if(duplicate)return {revision:duplicate,baseline:baseline.revision,created:false,reused:true};
  const max=await env.WIKI_DB.prepare('SELECT MAX(revision_number) AS n FROM wiki_article_revisions WHERE code=?').bind(row.code).first();
  const n=Number(max?.n||0)+1,rid=await revisionId(row.code,nextHash),reason=text(input.changeReason,2000);
  if(!reason)throw err('CHANGE_REASON_REQUIRED',422,'changeReason es obligatorio.');
  await env.WIKI_DB.prepare(`INSERT OR IGNORE INTO wiki_article_revisions(revision_id,code,revision_number,parent_revision_id,article_markdown,article_hash,source_generated_at,change_reason,evidence_review_id,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(rid,row.code,n,baseline.revision.revision_id,markdown,nextHash,row.generated_at,reason,text(input.evidenceReviewId,100)||null,'proposed',now).run();
  return {revision:await env.WIKI_DB.prepare('SELECT * FROM wiki_article_revisions WHERE revision_id=?').bind(rid).first(),baseline:baseline.revision,created:true,reused:false};
}

module.exports={snapshotPayload,evidenceSnapshotHash,listReviews,latestMatchingReview,validReviewState,recordReview,ensureBaselineRevision,proposeArticleRevision};
