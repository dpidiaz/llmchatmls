'use strict';
const foundation=require('./evidence foundation.js');
const registry=require('./evidence registry.js');
const LOCATOR_KEYS=new Set(['page','pageRange','chapter','section','paragraph','table','figure','timestamp','urlFragment']);
const CONFLICT_TYPES=new Set(['contradiction','regional_variation','standard_variation','register_variation','historical_variation','metadata_conflict']);
const CONFLICT_STATUSES=new Set(['unresolved','resolved','accepted_variation']);

function evidenceError(code,status,message=code,extra={}){const e=new Error(message);e.code=code;e.status=status;Object.assign(e,extra);return e;}
function text(v,max=4000){return String(v??'').normalize('NFKC').replace(/\s+/gu,' ').trim().slice(0,max);}
async function currentArticleVersion(env,code){
  await registry.ensureEvidenceDb(env);
  const normalized=String(code||'').trim().toUpperCase();
  if(!/^MLS-V\d{2}-\d{4}$/.test(normalized))throw evidenceError('INVALID_ENTRY_CODE',400,'Código MLS inválido.');
  const row=await env.WIKI_DB.prepare('SELECT * FROM wiki_articles WHERE code=?').bind(normalized).first();
  if(!row)throw evidenceError('ARTICLE_NOT_FOUND',404,'La entrada canónica no existe.');
  return {
    code:row.code,
    articleGeneratedAt:row.generated_at,
    articleHash:await foundation.articleHash(row.article_markdown),
    language:row.language||null,
    languageName:row.language_name||null,
    title:row.title||null,
    level:row.level||null,
    part:row.part||null,
    chapter:row.chapter||null
  };
}
async function assertArticleVersion(env,input={}){
  const current=await currentArticleVersion(env,input.code);
  const supplied={code:String(input.code||'').toUpperCase(),articleGeneratedAt:String(input.articleGeneratedAt||''),articleHash:String(input.articleHash||'')};
  if(!foundation.assertEvidenceVersionMatch(current,supplied))throw evidenceError('ARTICLE_VERSION_CONFLICT',409,'La entrada cambió; vuelve a cargar la versión canónica.',{current});
  return current;
}
function normalizeLocator(input={}){
  if(input===null||input===undefined)return {};
  if(typeof input!=='object'||Array.isArray(input))throw evidenceError('INVALID_LOCATOR',422,'locator debe ser un objeto.');
  const out={};
  for(const [key,value] of Object.entries(input)){
    if(!LOCATOR_KEYS.has(key))throw evidenceError('INVALID_LOCATOR_KEY',422,'Localizador no permitido: '+key,{field:key});
    const v=text(value,500);if(v)out[key]=v;
  }
  return out;
}
async function normalizeClaim(input={}){
  const code=String(input.code||'').trim().toUpperCase();
  const articleHash=String(input.articleHash||'').trim().toLowerCase();
  const summary=text(input.summary,2000);const claimType=text(input.claimType||'general',100).toLowerCase();const materiality=text(input.materiality||'substantial',50).toLowerCase();
  const sectionKey=text(input.sectionKey,300)||null;
  if(!summary)throw evidenceError('INVALID_CLAIM',422,'summary es obligatorio.');
  const claimId=await foundation.claimIdentity({code,articleHash,sectionKey:sectionKey||'',summary,claimType,materiality});
  return {claimId,code,articleGeneratedAt:String(input.articleGeneratedAt||''),articleHash,sectionKey,summary,claimType,materiality};
}
async function getClaim(env,claimId){await registry.ensureEvidenceDb(env);return await env.WIKI_DB.prepare('SELECT * FROM wiki_evidence_claims WHERE claim_id=?').bind(String(claimId||'')).first();}
async function upsertClaim(env,input,{now=new Date().toISOString()}={}){
  await assertArticleVersion(env,input);const claim=await normalizeClaim(input);
  const before=await getClaim(env,claim.claimId);if(before)return {claim:before,created:false,reused:true};
  await env.WIKI_DB.prepare(`INSERT OR IGNORE INTO wiki_evidence_claims(claim_id,code,article_generated_at,article_hash,section_key,summary,claim_type,materiality,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)`)
    .bind(claim.claimId,claim.code,claim.articleGeneratedAt,claim.articleHash,claim.sectionKey,claim.summary,claim.claimType,claim.materiality,'unverified',now).run();
  const stored=await getClaim(env,claim.claimId);return {claim:stored,created:!before,reused:false};
}
async function getEvidenceLink(env,linkId){await registry.ensureEvidenceDb(env);return await env.WIKI_DB.prepare('SELECT * FROM wiki_evidence_links WHERE link_id=?').bind(String(linkId||'')).first();}
async function upsertEvidenceLink(env,input,{now=new Date().toISOString()}={}){
  await registry.ensureEvidenceDb(env);
  const claim=await getClaim(env,input.claimId);if(!claim)throw evidenceError('CLAIM_NOT_FOUND',404,'El claim no existe.');
  await assertArticleVersion(env,{code:claim.code,articleGeneratedAt:claim.article_generated_at,articleHash:claim.article_hash});
  const source=await registry.getSourceById(env,input.sourceId);if(!source)throw evidenceError('SOURCE_NOT_FOUND',404,'La fuente no existe en Source Registry.');
  const supportType=text(input.supportType,80).toLowerCase();if(!foundation.SUPPORT_TYPES.includes(supportType))throw evidenceError('INVALID_SUPPORT_TYPE',422,'supportType inválido.');
  const locator=normalizeLocator(input.locator);const linkId=await foundation.evidenceLinkIdentity({claimId:claim.claim_id,sourceId:source.sourceId,supportType,locator});
  const before=await getEvidenceLink(env,linkId);if(before)return {link:before,source,created:false,reused:true};
  await env.WIKI_DB.prepare(`INSERT OR IGNORE INTO wiki_evidence_links(link_id,claim_id,source_id,support_type,locator_json,notes,verification_method,verified_at,created_at) VALUES(?,?,?,?,?,?,?,?,?)`)
    .bind(linkId,claim.claim_id,source.sourceId,supportType,foundation.stableJson(locator),text(input.notes,3000)||null,text(input.verificationMethod,100)||'manual_source_match',null,now).run();
  return {link:await getEvidenceLink(env,linkId),source,created:true,reused:false};
}
async function conflictIdentity(input){return 'MLS-CNF-'+(await foundation.sha256Hex([input.code,input.articleHash,input.claimId,input.conflictType,foundation.stableJson(input.sourceIds||[]),input.context].join('\u001f'))).slice(0,24).toUpperCase();}
async function recordConflict(env,input,{now=new Date().toISOString()}={}){
  await registry.ensureEvidenceDb(env);const claim=await getClaim(env,input.claimId);if(!claim)throw evidenceError('CLAIM_NOT_FOUND',404,'El claim no existe.');
  await assertArticleVersion(env,{code:claim.code,articleGeneratedAt:claim.article_generated_at,articleHash:claim.article_hash});
  const conflictType=text(input.conflictType,80).toLowerCase(),status=text(input.status||'unresolved',50).toLowerCase(),context=text(input.context,4000),resolution=text(input.resolution,4000)||null;
  if(!CONFLICT_TYPES.has(conflictType))throw evidenceError('INVALID_CONFLICT_TYPE',422,'conflictType inválido.');
  if(!CONFLICT_STATUSES.has(status))throw evidenceError('INVALID_CONFLICT_STATUS',422,'status de conflicto inválido.');
  if(!context)throw evidenceError('INVALID_CONFLICT',422,'context es obligatorio.');
  if(status!=='unresolved'&&!resolution)throw evidenceError('CONFLICT_RESOLUTION_REQUIRED',422,'Una contradicción o variación resuelta requiere resolución explícita.');
  const sourceIds=[...new Set((Array.isArray(input.sourceIds)?input.sourceIds:[]).map(x=>String(x||'').trim().toUpperCase()).filter(Boolean))].sort();
  for(const sourceId of sourceIds)if(!(await registry.getSourceById(env,sourceId)))throw evidenceError('SOURCE_NOT_FOUND',404,'Fuente de conflicto no registrada: '+sourceId,{sourceId});
  const conflictId=await conflictIdentity({code:claim.code,articleHash:claim.article_hash,claimId:claim.claim_id,conflictType,sourceIds,context});
  const existing=await env.WIKI_DB.prepare('SELECT * FROM wiki_evidence_conflicts WHERE conflict_id=?').bind(conflictId).first();if(existing)return {conflict:existing,created:false,reused:true};
  await env.WIKI_DB.prepare(`INSERT OR IGNORE INTO wiki_evidence_conflicts(conflict_id,code,article_generated_at,claim_id,conflict_type,status,context,resolution,needs_review,source_ids_json,created_at,resolved_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`)
    .bind(conflictId,claim.code,claim.article_generated_at,claim.claim_id,conflictType,status,context,resolution,status==='unresolved'?1:0,JSON.stringify(sourceIds),now,status==='unresolved'?null:now).run();
  return {conflict:await env.WIKI_DB.prepare('SELECT * FROM wiki_evidence_conflicts WHERE conflict_id=?').bind(conflictId).first(),created:true,reused:false};
}
async function entryEvidenceSnapshot(env,code){
  const article=await currentArticleVersion(env,code);const params=[article.code,article.articleGeneratedAt,article.articleHash];
  const claims=await env.WIKI_DB.prepare('SELECT * FROM wiki_evidence_claims WHERE code=? AND article_generated_at=? AND article_hash=? ORDER BY created_at,claim_id').bind(...params).all();
  const links=await env.WIKI_DB.prepare(`SELECT l.* FROM wiki_evidence_links l JOIN wiki_evidence_claims c ON c.claim_id=l.claim_id WHERE c.code=? AND c.article_generated_at=? AND c.article_hash=? ORDER BY l.created_at,l.link_id`).bind(...params).all();
  const conflicts=await env.WIKI_DB.prepare('SELECT * FROM wiki_evidence_conflicts WHERE code=? AND article_generated_at=? ORDER BY created_at,conflict_id').bind(article.code,article.articleGeneratedAt).all();
  return {article,claims:claims.results||[],links:links.results||[],conflicts:conflicts.results||[]};
}
module.exports={LOCATOR_KEYS,CONFLICT_TYPES,CONFLICT_STATUSES,currentArticleVersion,assertArticleVersion,normalizeLocator,normalizeClaim,getClaim,upsertClaim,getEvidenceLink,upsertEvidenceLink,recordConflict,entryEvidenceSnapshot};
