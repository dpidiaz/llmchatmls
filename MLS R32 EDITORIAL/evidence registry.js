'use strict';
const foundation=require('./evidence foundation.js');
const ready=new WeakMap();
const CORE_FIELDS=['sourceType','authorityTier','title','publicationYear','publisher','edition','journal','volume','issue','articleNumber','doi','isbn','canonicalUrl','resourceVersion'];

function dbValue(v){return v===undefined?null:v;}
function rowToSource(row){
  if(!row)return null;
  return {sourceId:row.source_id,identityKind:row.identity_kind,identityKey:row.identity_key,metadataHash:row.metadata_hash,sourceType:row.source_type,authorityTier:row.authority_tier,status:row.status,title:row.title,
    authors:JSON.parse(row.authors_json||'[]'),editors:JSON.parse(row.editors_json||'[]'),contributors:JSON.parse(row.contributors_json||'[]'),institution:row.institution||null,publicationYear:row.publication_year??null,publicationDate:row.publication_date||null,
    publisher:row.publisher||null,edition:row.edition||null,containerTitle:row.container_title||null,journal:row.journal||null,volume:row.volume||null,issue:row.issue||null,pages:row.pages||null,
    articleNumber:row.article_number||null,isbn:row.isbn||null,issn:row.issn||null,doi:row.doi||null,canonicalUrl:row.canonical_url||null,language:row.language||null,topics:JSON.parse(row.topics_json||'[]'),
    resourceVersion:row.resource_version||null,supersedesSourceId:row.supersedes_source_id||null,accessedAt:row.accessed_at||null,createdAt:row.created_at,updatedAt:row.updated_at};
}
function sourceParams(s,now,createdAt=now){return [s.sourceId,s.identityKind,s.identityKey,s.metadataHash,s.sourceType,s.authorityTier,s.status,s.title,JSON.stringify(s.authors),JSON.stringify(s.editors||[]),JSON.stringify(s.contributors),dbValue(s.institution),dbValue(s.publicationYear),dbValue(s.publicationDate),dbValue(s.publisher),dbValue(s.edition),dbValue(s.containerTitle),dbValue(s.journal),dbValue(s.volume),dbValue(s.issue),dbValue(s.pages),dbValue(s.articleNumber),dbValue(s.isbn),dbValue(s.issn),dbValue(s.doi),dbValue(s.canonicalUrl),dbValue(s.language),JSON.stringify(s.topics),dbValue(s.resourceVersion),dbValue(s.supersedesSourceId),dbValue(s.accessedAt),createdAt,now];}
async function ensureEvidenceDb(env){
  let task=ready.get(env.WIKI_DB);
  if(!task){task=env.WIKI_DB.batch(foundation.evidenceSchema().map(sql=>env.WIKI_DB.prepare(sql)));ready.set(env.WIKI_DB,task);task.catch(()=>ready.delete(env.WIKI_DB));}
  await task;
}
async function getSourceById(env,sourceId){await ensureEvidenceDb(env);const row=await env.WIKI_DB.prepare('SELECT * FROM wiki_sources WHERE source_id=?').bind(String(sourceId||'')).first();return rowToSource(row);}
async function getSourceByIdentity(env,identityKind,identityKey){await ensureEvidenceDb(env);const row=await env.WIKI_DB.prepare('SELECT * FROM wiki_sources WHERE identity_kind=? AND identity_key=?').bind(identityKind,identityKey).first();return rowToSource(row);}
function comparable(v){if(Array.isArray(v))return JSON.stringify(v.map(x=>String(x).toLowerCase()).sort());return v===null||v===undefined?'':String(v).normalize('NFKC').replace(/\s+/g,' ').trim().toLowerCase();}
function metadataConflicts(existing,incoming){
  const conflicts=[];
  for(const field of CORE_FIELDS){const a=existing[field],b=incoming[field];if(a===null||a===undefined||a===''||b===null||b===undefined||b==='')continue;if(comparable(a)!==comparable(b))conflicts.push(field);}
  return conflicts;
}
function mergeEnrichment(existing,incoming){
  const merged={...incoming};
  for(const [key,value] of Object.entries(existing)){
    if(['sourceId','identityKind','identityKey','metadataHash','createdAt','updatedAt'].includes(key))continue;
    if((merged[key]===null||merged[key]===undefined||merged[key]===''||(Array.isArray(merged[key])&&!merged[key].length)) && value!==null&&value!==undefined&&value!=='')merged[key]=value;
  }
  merged.sourceId=existing.sourceId;merged.identityKind=existing.identityKind;merged.identityKey=existing.identityKey;
  return merged;
}
async function upsertSource(env,input,{now=new Date().toISOString()}={}){
  await ensureEvidenceDb(env);
  let normalized=await foundation.normalizeSourceMetadata(input);
  const existing=await getSourceByIdentity(env,normalized.identityKind,normalized.identityKey);
  if(existing){
    if(existing.status==='superseded'&&normalized.status!=='superseded'){const e=new Error('SOURCE_SUPERSEDED');e.code='SOURCE_SUPERSEDED';e.status=409;throw e;}
    const conflicts=metadataConflicts(existing,normalized);
    if(conflicts.length){const e=new Error('SOURCE_METADATA_CONFLICT: '+conflicts.join(','));e.code='SOURCE_METADATA_CONFLICT';e.status=409;e.fields=conflicts;throw e;}
    normalized=mergeEnrichment(existing,normalized);
    const hashPayload={...normalized};delete hashPayload.metadataHash;delete hashPayload.createdAt;delete hashPayload.updatedAt;normalized.metadataHash=await foundation.sha256Hex(foundation.stableJson(hashPayload));
    if(existing.metadataHash===normalized.metadataHash)return {source:existing,created:false,updated:false,reused:true};
    await env.WIKI_DB.prepare(`UPDATE wiki_sources SET metadata_hash=?, source_type=?, authority_tier=?, status=?, title=?, authors_json=?, editors_json=?, contributors_json=?, institution=?, publication_year=?, publication_date=?, publisher=?, edition=?, container_title=?, journal=?, volume=?, issue=?, pages=?, article_number=?, isbn=?, issn=?, doi=?, canonical_url=?, language=?, topics_json=?, resource_version=?, supersedes_source_id=?, accessed_at=?, updated_at=? WHERE source_id=?`)
      .bind(normalized.metadataHash,normalized.sourceType,normalized.authorityTier,normalized.status,normalized.title,JSON.stringify(normalized.authors),JSON.stringify(normalized.editors||[]),JSON.stringify(normalized.contributors),dbValue(normalized.institution),dbValue(normalized.publicationYear),dbValue(normalized.publicationDate),dbValue(normalized.publisher),dbValue(normalized.edition),dbValue(normalized.containerTitle),dbValue(normalized.journal),dbValue(normalized.volume),dbValue(normalized.issue),dbValue(normalized.pages),dbValue(normalized.articleNumber),dbValue(normalized.isbn),dbValue(normalized.issn),dbValue(normalized.doi),dbValue(normalized.canonicalUrl),dbValue(normalized.language),JSON.stringify(normalized.topics),dbValue(normalized.resourceVersion),dbValue(normalized.supersedesSourceId),dbValue(normalized.accessedAt),now,existing.sourceId).run();
    return {source:await getSourceById(env,existing.sourceId),created:false,updated:true,reused:true};
  }
  await env.WIKI_DB.prepare(`INSERT INTO wiki_sources(source_id,identity_kind,identity_key,metadata_hash,source_type,authority_tier,status,title,authors_json,editors_json,contributors_json,institution,publication_year,publication_date,publisher,edition,container_title,journal,volume,issue,pages,article_number,isbn,issn,doi,canonical_url,language,topics_json,resource_version,supersedes_source_id,accessed_at,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(...sourceParams(normalized,now)).run();
  return {source:await getSourceById(env,normalized.sourceId),created:true,updated:false,reused:false};
}
async function sourceRegistryStatus(env){
  await ensureEvidenceDb(env);
  const total=await env.WIKI_DB.prepare('SELECT COUNT(*) AS n FROM wiki_sources').first();
  const tiers=await env.WIKI_DB.prepare('SELECT authority_tier AS name,COUNT(*) AS n FROM wiki_sources GROUP BY authority_tier ORDER BY authority_tier').all();
  const statuses=await env.WIKI_DB.prepare('SELECT status AS name,COUNT(*) AS n FROM wiki_sources GROUP BY status ORDER BY status').all();
  return {evidenceVersion:foundation.MLS_EVIDENCE_VERSION,total:Number(total?.n||0),byTier:Object.fromEntries((tiers.results||[]).map(x=>[x.name,Number(x.n)])),byStatus:Object.fromEntries((statuses.results||[]).map(x=>[x.name,Number(x.n)]))};
}
module.exports={ensureEvidenceDb,rowToSource,metadataConflicts,mergeEnrichment,getSourceById,getSourceByIdentity,upsertSource,sourceRegistryStatus};
