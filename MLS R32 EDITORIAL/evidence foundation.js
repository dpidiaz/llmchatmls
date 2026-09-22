'use strict';

const MLS_EVIDENCE_VERSION='1.0';
const MLS_EVIDENCE_CONTEXT=Object.freeze({system:'MLS',repository:'dpidiaz/llmchatmls',domain:'language'});
const MLS_CITATION_STYLE='APA';
const MLS_CITATION_EDITION=7;
const MLS_CITATION_PROFILE='URL-GT-2025';
const MLS_CITATION_RENDERER_VERSION='1.0';

const EVIDENCE_STATUSES=Object.freeze(['UNSOURCED','SOURCED','VERIFIED','REVIEWED']);
const SOURCE_TIERS=Object.freeze(['A','B','C','D','X']);
const SUPPORT_TYPES=Object.freeze(['supports','partially_supports','contextualizes','contradicts','primary_source','secondary_interpretation']);
const VERIFYING_SUPPORT_TYPES=new Set(['supports','primary_source','secondary_interpretation']);
const CLAIM_MATERIALITY=Object.freeze(['substantial','supporting','constructed_example']);
const SOURCE_TYPES=Object.freeze(['book','book_chapter','journal_article','institutional_webpage','report','reference_entry','standard','dataset','thesis','other']);

function evidenceSchema(){
  return [
    "CREATE TABLE IF NOT EXISTS wiki_sources ("+
      "source_id TEXT PRIMARY KEY, identity_kind TEXT NOT NULL, identity_key TEXT NOT NULL, metadata_hash TEXT NOT NULL, "+
      "source_type TEXT NOT NULL, authority_tier TEXT NOT NULL CHECK(authority_tier IN ('A','B','C','D','X')), "+
      "status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','unresolved','superseded')), "+
      "title TEXT NOT NULL, authors_json TEXT NOT NULL DEFAULT '[]', editors_json TEXT NOT NULL DEFAULT '[]', contributors_json TEXT NOT NULL DEFAULT '[]', "+
      "institution TEXT, publication_year INTEGER, publication_date TEXT, publisher TEXT, edition TEXT, container_title TEXT, "+
      "journal TEXT, volume TEXT, issue TEXT, pages TEXT, article_number TEXT, isbn TEXT, issn TEXT, doi TEXT, doi_scope TEXT, canonical_url TEXT, "+
      "language TEXT, topics_json TEXT NOT NULL DEFAULT '[]', resource_version TEXT, supersedes_source_id TEXT, accessed_at TEXT, "+
      "created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(identity_kind, identity_key))",
    "CREATE INDEX IF NOT EXISTS wiki_sources_status_idx ON wiki_sources(status)",
    "CREATE TABLE IF NOT EXISTS wiki_evidence_entry_state ("+
      "code TEXT PRIMARY KEY, article_generated_at TEXT NOT NULL, article_hash TEXT NOT NULL, evidence_version TEXT NOT NULL, "+
      "status TEXT NOT NULL CHECK(status IN ('UNSOURCED','SOURCED','VERIFIED','REVIEWED')), "+
      "claims_total INTEGER NOT NULL DEFAULT 0 CHECK(claims_total>=0), claims_verified INTEGER NOT NULL DEFAULT 0 CHECK(claims_verified>=0), "+
      "sources_total INTEGER NOT NULL DEFAULT 0 CHECK(sources_total>=0), conflicts_total INTEGER NOT NULL DEFAULT 0 CHECK(conflicts_total>=0), "+
      "needs_review INTEGER NOT NULL DEFAULT 0 CHECK(needs_review IN (0,1)), "+
      "evidence_revision INTEGER NOT NULL DEFAULT 0 CHECK(evidence_revision>=0), source_revision INTEGER NOT NULL DEFAULT 0 CHECK(source_revision>=0), "+
      "citation_style TEXT NOT NULL, citation_edition INTEGER NOT NULL, citation_profile TEXT NOT NULL, citation_renderer_version TEXT NOT NULL, "+
      "verified_at TEXT, reviewed_at TEXT, updated_at TEXT NOT NULL)",
    "CREATE INDEX IF NOT EXISTS wiki_evidence_entry_state_status_idx ON wiki_evidence_entry_state(status,updated_at)",
    "CREATE TABLE IF NOT EXISTS wiki_evidence_claims ("+
      "claim_id TEXT PRIMARY KEY, code TEXT NOT NULL, article_generated_at TEXT NOT NULL, article_hash TEXT NOT NULL, section_key TEXT, "+
      "summary TEXT NOT NULL, claim_type TEXT NOT NULL, materiality TEXT NOT NULL CHECK(materiality IN ('substantial','supporting','constructed_example')), "+
      "status TEXT NOT NULL DEFAULT 'unverified' CHECK(status IN ('unverified','partially_verified','verified','conflicted')), "+
      "created_at TEXT NOT NULL, verified_at TEXT, verification_revision INTEGER)",
    "CREATE INDEX IF NOT EXISTS wiki_evidence_claims_entry_idx ON wiki_evidence_claims(code,article_generated_at,status)",
    "CREATE TABLE IF NOT EXISTS wiki_evidence_links ("+
      "link_id TEXT PRIMARY KEY, claim_id TEXT NOT NULL, source_id TEXT NOT NULL, "+
      "support_type TEXT NOT NULL CHECK(support_type IN ('supports','partially_supports','contextualizes','contradicts','primary_source','secondary_interpretation')), "+
      "locator_json TEXT NOT NULL DEFAULT '{}', notes TEXT, verification_method TEXT NOT NULL, verified_at TEXT, created_at TEXT NOT NULL, "+
      "UNIQUE(claim_id,source_id,support_type,locator_json))",
    "CREATE INDEX IF NOT EXISTS wiki_evidence_links_claim_idx ON wiki_evidence_links(claim_id)",
    "CREATE INDEX IF NOT EXISTS wiki_evidence_links_source_idx ON wiki_evidence_links(source_id)",
    "CREATE TABLE IF NOT EXISTS wiki_evidence_conflicts ("+
      "conflict_id TEXT PRIMARY KEY, code TEXT NOT NULL, article_generated_at TEXT NOT NULL, claim_id TEXT NOT NULL, "+
      "conflict_type TEXT NOT NULL CHECK(conflict_type IN ('contradiction','regional_variation','standard_variation','register_variation','historical_variation','metadata_conflict')), "+
      "status TEXT NOT NULL DEFAULT 'unresolved' CHECK(status IN ('unresolved','resolved','accepted_variation')), "+
      "context TEXT NOT NULL, resolution TEXT, needs_review INTEGER NOT NULL DEFAULT 1 CHECK(needs_review IN (0,1)), source_ids_json TEXT NOT NULL DEFAULT '[]', created_at TEXT NOT NULL, resolved_at TEXT)",
    "CREATE INDEX IF NOT EXISTS wiki_evidence_conflicts_entry_idx ON wiki_evidence_conflicts(code,status)",
    "CREATE INDEX IF NOT EXISTS wiki_evidence_conflicts_claim_idx ON wiki_evidence_conflicts(claim_id)",
    "CREATE TABLE IF NOT EXISTS wiki_evidence_reviews ("+
      "review_id TEXT PRIMARY KEY, code TEXT NOT NULL, article_generated_at TEXT NOT NULL, article_hash TEXT NOT NULL, evidence_version TEXT NOT NULL, "+
      "evidence_revision INTEGER NOT NULL, source_revision INTEGER NOT NULL, "+
      "review_kind TEXT NOT NULL CHECK(review_kind IN ('verification','editorial_review')), evidence_snapshot_hash TEXT NOT NULL, "+
      "status_before TEXT NOT NULL CHECK(status_before IN ('UNSOURCED','SOURCED','VERIFIED','REVIEWED')), "+
      "status_after TEXT NOT NULL CHECK(status_after IN ('UNSOURCED','SOURCED','VERIFIED','REVIEWED')), "+
      "claims_total INTEGER NOT NULL, claims_verified INTEGER NOT NULL, sources_total INTEGER NOT NULL, conflicts_total INTEGER NOT NULL, "+
      "reviewer_type TEXT NOT NULL CHECK(reviewer_type IN ('chatgpt','human','system')), reviewer TEXT, verification_method TEXT NOT NULL, "+
      "citation_renderer_version TEXT NOT NULL, parent_review_id TEXT, article_revision_id TEXT, notes TEXT, run_id TEXT, created_at TEXT NOT NULL)",
    "CREATE INDEX IF NOT EXISTS wiki_evidence_reviews_entry_idx ON wiki_evidence_reviews(code,created_at)",
    "CREATE INDEX IF NOT EXISTS wiki_evidence_reviews_kind_idx ON wiki_evidence_reviews(code,review_kind,created_at)",
    "CREATE TABLE IF NOT EXISTS wiki_article_revisions ("+
      "revision_id TEXT PRIMARY KEY, code TEXT NOT NULL, revision_number INTEGER NOT NULL CHECK(revision_number>=1), parent_revision_id TEXT, "+
      "article_markdown TEXT NOT NULL, article_hash TEXT NOT NULL, source_generated_at TEXT NOT NULL, change_reason TEXT NOT NULL, "+
      "evidence_review_id TEXT, status TEXT NOT NULL CHECK(status IN ('baseline','proposed','canonical','superseded')), created_at TEXT NOT NULL, "+
      "UNIQUE(code,revision_number), UNIQUE(code,article_hash))",
    "CREATE INDEX IF NOT EXISTS wiki_article_revisions_entry_idx ON wiki_article_revisions(code,revision_number)"
  ];
}

function assertRepositoryContext(input={}){
  const got={system:String(input.system||''),repository:String(input.repository||''),domain:String(input.domain||'')};
  const expected=MLS_EVIDENCE_CONTEXT;
  if(got.system!==expected.system||got.repository!==expected.repository||got.domain!==expected.domain){
    const e=new Error('REPO_CONTEXT_MISMATCH');e.code='REPO_CONTEXT_MISMATCH';e.status=409;e.expected=expected;e.received=got;throw e;
  }
  return true;
}
function normalizeText(v){return String(v??'').normalize('NFKC').replace(/\s+/gu,' ').trim();}
function normalizeArticleMarkdown(v){return String(v??'').replace(/\r\n?/g,'\n').split('\n').map(x=>x.replace(/[ \t]+$/g,'')).join('\n').trim();}
function hex(bytes){return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}
async function sha256Hex(v){
  const subtle=globalThis.crypto?.subtle;
  if(!subtle)throw new Error('Web Crypto SHA-256 no disponible.');
  return hex(new Uint8Array(await subtle.digest('SHA-256',new TextEncoder().encode(String(v)))));
}
async function articleHash(markdown){return sha256Hex(normalizeArticleMarkdown(markdown));}

function normalizeDoi(v){
  let x=normalizeText(v).toLowerCase().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i,'').replace(/^doi:\s*/i,'');
  if(!x)return null;
  return /^10\.\d{4,9}\/[\w.()/:;+-]+$/i.test(x)?x:null;
}
function normalizeDoiScope(v,{hasDoi=false}={}){
  const raw=normalizeText(v).toLowerCase();
  if(!hasDoi){
    if(raw)throw new Error('doiScope requiere DOI.');
    return null;
  }
  const scope=raw||'resource';
  if(!['resource','container'].includes(scope))throw new Error('doiScope debe ser resource o container.');
  return scope;
}
function isbn10(x){
  if(!/^\d{9}[\dX]$/.test(x))return false;
  let s=0;for(let i=0;i<10;i++)s+=(10-i)*(x[i]==='X'?10:Number(x[i]));
  return s%11===0;
}
function isbn13(x){
  if(!/^\d{13}$/.test(x))return false;
  const s=x.slice(0,12).split('').reduce((a,d,i)=>a+Number(d)*(i%2?3:1),0);
  return (10-s%10)%10===Number(x[12]);
}
function normalizeIsbn(v){
  const x=normalizeText(v).toUpperCase().replace(/^ISBN(?:-1[03])?:?\s*/i,'').replace(/[^\dX]/g,'');
  return (x.length===10&&isbn10(x))||(x.length===13&&isbn13(x))?x:null;
}
function normalizeUrl(v){
  const raw=normalizeText(v);if(!raw)return null;
  try{
    const u=new URL(raw);if(!['http:','https:'].includes(u.protocol))return null;
    u.hash='';u.hostname=u.hostname.toLowerCase();
    for(const k of [...u.searchParams.keys()])if(/^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$)/i.test(k))u.searchParams.delete(k);
    u.searchParams.sort();if(u.pathname!=='/')u.pathname=u.pathname.replace(/\/+$/g,'');
    return u.toString();
  }catch{return null;}
}
function normalizePerson(v){
  if(typeof v==='string')return normalizeText(v);
  if(!v||typeof v!=='object')return '';
  const family=normalizeText(v.family||v.familyName||v.surname||'');
  const given=normalizeText(v.given||v.givenName||v.name||'');
  return [family,given].filter(Boolean).join(', ');
}
function normalizeArray(v,fn=normalizeText){const a=Array.isArray(v)?v:(v?[v]:[]);return [...new Set(a.map(fn).filter(Boolean))];}
function year(v){if(v===null||v===undefined||v==='')return null;const n=Number(v);return Number.isInteger(n)&&n>=1000&&n<=9999?n:null;}
function fingerprintPayload(s){
  return [
    normalizeText(s.title).toLocaleLowerCase('en-US'),
    normalizeArray(s.authors,normalizePerson).map(x=>x.toLocaleLowerCase('en-US')).join('|'),
    normalizeText(s.institution).toLocaleLowerCase('en-US'),
    year(s.publicationYear)??'',
    normalizeText(s.publisher).toLocaleLowerCase('en-US'),
    normalizeText(s.edition).toLocaleLowerCase('en-US')
  ].join('\u001f');
}
async function sourceIdentity(source={}){
  const doi=normalizeDoi(source.doi);if(source.doi&&!doi)throw new Error('DOI inválido.');
  const doiScope=normalizeDoiScope(source.doiScope,{hasDoi:!!doi});
  const isbn=normalizeIsbn(source.isbn);if(source.isbn&&!isbn)throw new Error('ISBN inválido.');
  const canonicalUrl=normalizeUrl(source.canonicalUrl||source.url);if((source.canonicalUrl||source.url)&&!canonicalUrl)throw new Error('URL canónica inválida.');
  if(doiScope==='container'&&!canonicalUrl)throw new Error('doiScope=container requiere canonicalUrl granular.');
  let identityKind,identityKey;
  if(doi&&doiScope==='resource'){identityKind='doi';identityKey=doi;}
  else if(doiScope==='container'&&canonicalUrl){identityKind='url';const version=normalizeText(source.resourceVersion||source.publicationDate||'');identityKey=canonicalUrl+(version?'#version:'+version:'');}
  else if(isbn){identityKind='isbn';identityKey=isbn;}
  else if(canonicalUrl){identityKind='url';const version=normalizeText(source.resourceVersion||source.publicationDate||'');identityKey=canonicalUrl+(version?'#version:'+version:'');}
  else{
    const signals=[normalizeArray(source.authors,normalizePerson).length,normalizeText(source.institution),year(source.publicationYear),normalizeText(source.publisher),normalizeText(source.edition)].filter(Boolean).length;
    if(!normalizeText(source.title)||signals<1)throw new Error('La fuente no tiene identidad bibliográfica suficiente.');
    identityKind='fingerprint';identityKey='fp:'+await sha256Hex(fingerprintPayload(source));
  }
  return {sourceId:'MLS-SRC-'+(await sha256Hex(identityKind+':'+identityKey)).slice(0,20).toUpperCase(),identityKind,identityKey,doi,doiScope,isbn,canonicalUrl};
}
function stableJson(v){
  if(Array.isArray(v))return '['+v.map(stableJson).join(',')+']';
  if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stableJson(v[k])).join(',')+'}';
  return JSON.stringify(v);
}
async function normalizeSourceMetadata(input={}){
  const sourceType=normalizeText(input.sourceType||'other');
  const authorityTier=normalizeText(input.authorityTier||'').toUpperCase();
  if(!SOURCE_TYPES.includes(sourceType))throw new Error('sourceType no soportado.');
  if(!SOURCE_TIERS.includes(authorityTier))throw new Error('authorityTier debe ser A, B, C, D o X.');
  const title=normalizeText(input.title);if(!title)throw new Error('title es obligatorio.');
  const identity=await sourceIdentity(input);
  const normalized={...identity,sourceType,authorityTier,status:normalizeText(input.status||'active').toLowerCase(),title,
    authors:normalizeArray(input.authors,normalizePerson),editors:normalizeArray(input.editors,normalizePerson),contributors:normalizeArray(input.contributors,normalizePerson),
    institution:normalizeText(input.institution)||null,publicationYear:year(input.publicationYear),publicationDate:normalizeText(input.publicationDate)||null,
    publisher:normalizeText(input.publisher)||null,edition:normalizeText(input.edition)||null,containerTitle:normalizeText(input.containerTitle)||null,
    journal:normalizeText(input.journal)||null,volume:normalizeText(input.volume)||null,issue:normalizeText(input.issue)||null,pages:normalizeText(input.pages)||null,
    articleNumber:normalizeText(input.articleNumber)||null,issn:normalizeText(input.issn)||null,language:normalizeText(input.language)||null,
    topics:normalizeArray(input.topics),resourceVersion:normalizeText(input.resourceVersion)||null,supersedesSourceId:normalizeText(input.supersedesSourceId)||null,
    accessedAt:normalizeText(input.accessedAt)||null};
  if(!['active','unresolved','superseded'].includes(normalized.status))throw new Error('status de fuente inválido.');
  normalized.metadataHash=await sha256Hex(stableJson(normalized));
  return normalized;
}
async function claimIdentity({code,articleHash:hash,sectionKey='',summary,claimType='general',materiality='substantial'}={}){
  const c=normalizeText(code).toUpperCase(),h=normalizeText(hash).toLowerCase(),m=normalizeText(materiality).toLowerCase(),s=normalizeText(summary).toLocaleLowerCase('en-US');
  if(!/^MLS-V\d{2}-\d{4}$/.test(c))throw new Error('Código MLS inválido para claim.');
  if(!/^[a-f0-9]{64}$/.test(h))throw new Error('articleHash inválido para claim.');
  if(!s)throw new Error('summary es obligatorio para claim.');
  if(!CLAIM_MATERIALITY.includes(m))throw new Error('materiality inválida.');
  const key=[c,h,normalizeText(sectionKey).toLocaleLowerCase('en-US'),s,normalizeText(claimType).toLocaleLowerCase('en-US'),m].join('\u001f');
  return 'MLS-CLM-'+(await sha256Hex(key)).slice(0,24).toUpperCase();
}
async function evidenceLinkIdentity({claimId,sourceId,supportType,locator={}}={}){
  const c=normalizeText(claimId).toUpperCase(),s=normalizeText(sourceId).toUpperCase(),t=normalizeText(supportType).toLowerCase();
  if(!c.startsWith('MLS-CLM-'))throw new Error('claimId inválido.');
  if(!s.startsWith('MLS-SRC-'))throw new Error('sourceId inválido.');
  if(!SUPPORT_TYPES.includes(t))throw new Error('supportType inválido.');
  return 'MLS-LNK-'+(await sha256Hex([c,s,t,stableJson(locator&&typeof locator==='object'?locator:{})].join('\u001f'))).slice(0,24).toUpperCase();
}
function sameVersion(a,b){
  return !!a&&!!b&&String(a.code||'').toUpperCase()===String(b.code||'').toUpperCase()&&
    String(a.articleGeneratedAt||a.article_generated_at||'')===String(b.articleGeneratedAt||b.article_generated_at||'')&&
    String(a.articleHash||a.article_hash||'')===String(b.articleHash||b.article_hash||'');
}
function effectiveEvidenceStatus({article,state}={}){return !state||!sameVersion(article,state)||!EVIDENCE_STATUSES.includes(state.status)?'UNSOURCED':state.status;}
function counts(source){return !!source&&source.status==='active'&&SOURCE_TIERS.includes(source.authorityTier)&&source.authorityTier!=='X';}
function deriveEvidenceStatus({articleMatches=true,claims=[],links=[],sources=[],conflicts=[],verifiedAt=null,reviewedAt=null}={}){
  if(!articleMatches)return {status:'UNSOURCED',reasons:['article_version_mismatch']};
  const sourceMap=new Map(sources.map(x=>[x.sourceId||x.source_id,x]));
  const byClaim=new Map();for(const link of links){const k=link.claimId||link.claim_id;if(!byClaim.has(k))byClaim.set(k,[]);byClaim.get(k).push(link);}
  const counting=links.filter(x=>counts(sourceMap.get(x.sourceId||x.source_id)));
  if(!claims.length||!counting.length)return {status:'UNSOURCED',reasons:['insufficient_mapping']};
  const substantial=claims.filter(x=>(x.materiality||'substantial')==='substantial');
  const verified=substantial.filter(claim=>(byClaim.get(claim.claimId||claim.claim_id)||[]).some(link=>VERIFYING_SUPPORT_TYPES.has(link.supportType||link.support_type)&&counts(sourceMap.get(link.sourceId||link.source_id))));
  const unresolved=conflicts.filter(x=>(x.status||'unresolved')==='unresolved'&&(x.conflictType||x.conflict_type)==='contradiction');
  if(!substantial.length||verified.length!==substantial.length||unresolved.length){
    const reasons=[];if(!substantial.length)reasons.push('no_substantial_claims');if(verified.length!==substantial.length)reasons.push('unverified_substantial_claims');if(unresolved.length)reasons.push('unresolved_substantive_conflict');
    return {status:'SOURCED',reasons,claimsTotal:substantial.length,claimsVerified:verified.length};
  }
  if(!verifiedAt)return {status:'SOURCED',reasons:['verification_event_missing'],claimsTotal:substantial.length,claimsVerified:verified.length};
  if(reviewedAt&&Date.parse(reviewedAt)>Date.parse(verifiedAt))return {status:'REVIEWED',reasons:[],claimsTotal:substantial.length,claimsVerified:verified.length};
  return {status:'VERIFIED',reasons:[],claimsTotal:substantial.length,claimsVerified:verified.length};
}
function assertExpectedEvidenceRevision(currentRevision,expectedRevision){
  const current=Number(currentRevision||0),expected=Number(expectedRevision);
  if(!Number.isInteger(expected)||expected<0)throw new Error('expectedEvidenceRevision inválido.');
  if(current!==expected){const e=new Error('EVIDENCE_REVISION_CONFLICT');e.code='EVIDENCE_REVISION_CONFLICT';e.status=409;throw e;}
  return true;
}

module.exports={
  MLS_EVIDENCE_VERSION,MLS_EVIDENCE_CONTEXT,assertRepositoryContext,MLS_CITATION_STYLE,MLS_CITATION_EDITION,MLS_CITATION_PROFILE,MLS_CITATION_RENDERER_VERSION,
  EVIDENCE_STATUSES,SOURCE_TIERS,SUPPORT_TYPES,CLAIM_MATERIALITY,SOURCE_TYPES,evidenceSchema,normalizeArticleMarkdown,sha256Hex,articleHash,
  normalizeDoi,normalizeDoiScope,normalizeIsbn,normalizeUrl,normalizeSourceMetadata,sourceIdentity,claimIdentity,evidenceLinkIdentity,stableJson,
  assertEvidenceVersionMatch:sameVersion,effectiveEvidenceStatus,deriveEvidenceStatus,assertExpectedEvidenceRevision
};
