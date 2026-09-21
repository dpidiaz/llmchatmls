'use strict';
const foundation=require('./evidence foundation.js');
const registry=require('./evidence registry.js');
const claimsApi=require('./evidence claims.js');
const apa=require('./evidence apa.js');

const VERIFYING_SUPPORT_TYPES=new Set(['supports','primary_source','secondary_interpretation']);
const DEFAULT_EVIDENCE_POLICY=Object.freeze({
  allowedTiers:['A','B','C','D'],
  claimRules:{
    normative:{allowedTiers:['A','B']},
    quotation:{requiresLocator:true}
  }
});
function evidenceError(code,status,message=code,extra={}){const e=new Error(message);e.code=code;e.status=status;Object.assign(e,extra);return e;}
function ruleFor(policy,claim){return policy?.claimRules?.[claim.claim_type||claim.claimType]||{};}
function parseLocator(link){try{return JSON.parse(link.locator_json||link.locatorJson||'{}')}catch{return {};}}
function sourceAvailable(source){return !!source&&source.status==='active'&&source.authorityTier!=='X';}
function sourceCounts(source,claim,policy=DEFAULT_EVIDENCE_POLICY){
  if(!sourceAvailable(source))return false;
  const rule=ruleFor(policy,claim);const tiers=rule.allowedTiers||policy.allowedTiers||['A','B','C','D'];return tiers.includes(source.authorityTier);
}
function linkQualifies(link,source,claim,policy=DEFAULT_EVIDENCE_POLICY){
  if(!VERIFYING_SUPPORT_TYPES.has(link.support_type||link.supportType))return false;
  if(!sourceCounts(source,claim,policy))return false;
  const rule=ruleFor(policy,claim);if(rule.requiresLocator&&!Object.keys(parseLocator(link)).length)return false;
  return true;
}
async function loadSources(env,links){
  const out=new Map();
  for(const id of [...new Set(links.map(x=>x.source_id||x.sourceId).filter(Boolean))])out.set(id,await registry.getSourceById(env,id));
  return out;
}
async function evaluateEntryEvidence(env,code,{policy=DEFAULT_EVIDENCE_POLICY,verificationConfirmed=false,reviewedAt=null,verifiedAt=null}={}){
  const snap=await claimsApi.entryEvidenceSnapshot(env,code);const sources=await loadSources(env,snap.links);
  const byClaim=new Map();for(const link of snap.links){const id=link.claim_id||link.claimId;if(!byClaim.has(id))byClaim.set(id,[]);byClaim.get(id).push(link);}
  const substantial=snap.claims.filter(x=>(x.materiality||'substantial')==='substantial');
  const evaluation=substantial.map(claim=>{
    const links=byClaim.get(claim.claim_id)||[];const qualifying=links.filter(link=>linkQualifies(link,sources.get(link.source_id),claim,policy));
    const citationReadyLinks=qualifying.filter(link=>apa.validateApaSource(sources.get(link.source_id)||{}).citationReady);
    return {claimId:claim.claim_id,verified:qualifying.length>0,qualifyingLinks:qualifying.length,citationReady:citationReadyLinks.length>0,citationReadyLinks:citationReadyLinks.length};
  });
  const activeMapped=snap.links.filter(link=>sourceAvailable(sources.get(link.source_id)));
  const unresolved=snap.conflicts.filter(x=>x.status==='unresolved'&&x.conflict_type==='contradiction');
  const reasons=[];
  let status='UNSOURCED';
  if(snap.claims.length&&activeMapped.length){
    status='SOURCED';
    if(!substantial.length)reasons.push('no_substantial_claims');
    if(evaluation.some(x=>!x.verified))reasons.push('unverified_substantial_claims');
    if(unresolved.length)reasons.push('unresolved_substantive_conflict');
    const coverageComplete=substantial.length>0&&evaluation.every(x=>x.verified)&&!unresolved.length;
    const citationReady=coverageComplete&&evaluation.every(x=>x.citationReady);
    if(coverageComplete&&!citationReady)reasons.push('apa_validation_required');
    if(coverageComplete&&citationReady&&!verificationConfirmed)reasons.push('verification_event_missing');
    if(coverageComplete&&citationReady&&verificationConfirmed){
      status='VERIFIED';
      if(reviewedAt&&verifiedAt&&Date.parse(reviewedAt)>Date.parse(verifiedAt))status='REVIEWED';
    }
  } else reasons.push('insufficient_mapping');
  const citationReady=status==='VERIFIED'||status==='REVIEWED'||(substantial.length>0&&evaluation.every(x=>x.verified&&x.citationReady)&&!unresolved.length);
  return {article:snap.article,status,reasons:[...new Set(reasons)],claimsTotal:substantial.length,claimsVerified:evaluation.filter(x=>x.verified).length,sourcesTotal:sources.size,conflictsTotal:snap.conflicts.length,needsReview:unresolved.length>0,citationReady,evaluation,snapshot:snap};
}
async function getEvidenceState(env,code){await registry.ensureEvidenceDb(env);return await env.WIKI_DB.prepare('SELECT * FROM wiki_evidence_entry_state WHERE code=?').bind(String(code||'').toUpperCase()).first();}
async function effectiveState(env,code){const article=await claimsApi.currentArticleVersion(env,code),state=await getEvidenceState(env,article.code);return {article,state,effectiveStatus:foundation.effectiveEvidenceStatus({article,state})};}
async function persistEvaluation(env,code,{expectedEvidenceRevision=0,policy=DEFAULT_EVIDENCE_POLICY,verificationConfirmed=false,verifiedAt=null,reviewedAt=null,now=new Date().toISOString()}={}){
  await registry.ensureEvidenceDb(env);const result=await evaluateEntryEvidence(env,code,{policy,verificationConfirmed,verifiedAt,reviewedAt});const current=await getEvidenceState(env,result.article.code);
  const exact=current&&foundation.assertEvidenceVersionMatch(result.article,current);const currentRevision=exact?Number(current.evidence_revision||0):0;
  foundation.assertExpectedEvidenceRevision(currentRevision,expectedEvidenceRevision);
  const values=[foundation.MLS_EVIDENCE_VERSION,result.status,result.claimsTotal,result.claimsVerified,result.sourcesTotal,result.conflictsTotal,result.needsReview?1:0,foundation.MLS_CITATION_STYLE,foundation.MLS_CITATION_EDITION,foundation.MLS_CITATION_PROFILE,foundation.MLS_CITATION_RENDERER_VERSION,verifiedAt,reviewedAt,now];
  if(!current){
    const write=await env.WIKI_DB.prepare(`INSERT OR IGNORE INTO wiki_evidence_entry_state(code,article_generated_at,article_hash,evidence_version,status,claims_total,claims_verified,sources_total,conflicts_total,needs_review,evidence_revision,source_revision,citation_style,citation_edition,citation_profile,citation_renderer_version,verified_at,reviewed_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(result.article.code,result.article.articleGeneratedAt,result.article.articleHash,foundation.MLS_EVIDENCE_VERSION,result.status,result.claimsTotal,result.claimsVerified,result.sourcesTotal,result.conflictsTotal,result.needsReview?1:0,1,result.sourcesTotal?1:0,foundation.MLS_CITATION_STYLE,foundation.MLS_CITATION_EDITION,foundation.MLS_CITATION_PROFILE,foundation.MLS_CITATION_RENDERER_VERSION,verifiedAt,reviewedAt,now).run();
    if(Number(write?.meta?.changes||0)!==1)throw evidenceError('EVIDENCE_REVISION_CONFLICT',409,'Evidence state cambió concurrentemente.');
  } else if(!exact){
    const write=await env.WIKI_DB.prepare(`UPDATE wiki_evidence_entry_state SET article_generated_at=?,article_hash=?,evidence_version=?,status=?,claims_total=?,claims_verified=?,sources_total=?,conflicts_total=?,needs_review=?,evidence_revision=1,source_revision=?,citation_style=?,citation_edition=?,citation_profile=?,citation_renderer_version=?,verified_at=?,reviewed_at=?,updated_at=? WHERE code=? AND (article_generated_at<>? OR article_hash<>?)`)
      .bind(result.article.articleGeneratedAt,result.article.articleHash,...values.slice(0,7),result.sourcesTotal?1:0,...values.slice(7),result.article.code,result.article.articleGeneratedAt,result.article.articleHash).run();
    if(Number(write?.meta?.changes||0)!==1)throw evidenceError('EVIDENCE_REVISION_CONFLICT',409,'Evidence state cambió concurrentemente.');
  } else {
    const write=await env.WIKI_DB.prepare(`UPDATE wiki_evidence_entry_state SET evidence_version=?,status=?,claims_total=?,claims_verified=?,sources_total=?,conflicts_total=?,needs_review=?,evidence_revision=evidence_revision+1,source_revision=source_revision+?,citation_style=?,citation_edition=?,citation_profile=?,citation_renderer_version=?,verified_at=?,reviewed_at=?,updated_at=? WHERE code=? AND article_generated_at=? AND article_hash=? AND evidence_revision=?`)
      .bind(...values.slice(0,7),result.sourcesTotal!==Number(current.sources_total||0)?1:0,...values.slice(7),result.article.code,result.article.articleGeneratedAt,result.article.articleHash,expectedEvidenceRevision).run();
    if(Number(write?.meta?.changes||0)!==1)throw evidenceError('EVIDENCE_REVISION_CONFLICT',409,'Evidence state cambió concurrentemente.');
  }
  return {...result,state:await getEvidenceState(env,result.article.code)};
}
module.exports={DEFAULT_EVIDENCE_POLICY,sourceAvailable,sourceCounts,linkQualifies,evaluateEntryEvidence,getEvidenceState,effectiveState,persistEvaluation};
