'use strict';
const registry=require('./evidence registry.js');
const consumer=require('./evidence consumer.js');
const claims=require('./evidence claims.js');

const SCALE_PREP_VERSION='1.0';
const TRIAGE_LANES=Object.freeze(['complete','exception','resume_existing','needs_evidence']);
const DISCOVERY_MODES=Object.freeze(['none','human_or_manual','registry_first','external_discovery']);
const STOPWORDS=new Set(['para','por','con','sin','del','las','los','una','uno','unos','unas','the','and','for','with','from','oder','und','mit','der','die','das','ein','eine','des','dem','den']);

function scaleError(code,status,message=code){const e=new Error(message);e.code=code;e.status=status;throw e;}
function clean(v){return String(v??'').normalize('NFKC').replace(/\s+/gu,' ').trim();}
function normalizeTopic(v){return clean(v).toLocaleLowerCase('en-US');}
function normalizeTopics(v){
  const arr=Array.isArray(v)?v:[];
  return [...new Set(arr.map(normalizeTopic).filter(Boolean))].slice(0,20);
}
function inferredTopics(article={}){
  const raw=[article.title,article.chapter,article.part].map(clean).filter(Boolean).join(' ');
  return [...new Set(raw.toLocaleLowerCase('en-US').split(/[^\p{L}\p{N}]+/u).filter(x=>x.length>=4&&!STOPWORDS.has(x)))].slice(0,12);
}
function sourceHaystack(source){
  return [
    source.title,source.institution,source.containerTitle,source.journal,
    ...(Array.isArray(source.topics)?source.topics:[])
  ].map(normalizeTopic).filter(Boolean);
}
function topicMatches(source,topics){
  const hay=sourceHaystack(source);
  return topics.filter(topic=>hay.some(value=>value===topic||value.includes(topic)||topic.includes(value)));
}
function tierWeight(tier){return ({A:4,B:3,C:2,D:1})[String(tier||'').toUpperCase()]||0;}

async function reusableSourceRows(env,{language=''}={}){
  await registry.ensureEvidenceDb(env);
  const lang=clean(language).toLowerCase();
  const rows=await env.WIKI_DB.prepare(`
    SELECT s.*, COUNT(DISTINCT c.code) AS entry_usage, COUNT(DISTINCT l.link_id) AS link_usage
    FROM wiki_sources s
    JOIN wiki_evidence_links l ON l.source_id=s.source_id
    JOIN wiki_evidence_claims c ON c.claim_id=l.claim_id
    JOIN wiki_articles a ON a.code=c.code AND a.generated_at=c.article_generated_at
    WHERE s.status='active' AND (?='' OR a.language=?)
    GROUP BY s.source_id
    ORDER BY entry_usage DESC, link_usage DESC, s.updated_at DESC
    LIMIT 200
  `).bind(lang,lang).all();
  return {language:lang,rows:rows.results||[]};
}
function candidatePoolFromRows(rows,{language='',topics=[],limit=12}={}){
  const lang=clean(language).toLowerCase();
  const wanted=normalizeTopics(topics);
  const max=Math.max(1,Math.min(50,Number(limit)||12));
  const candidates=(Array.isArray(rows)?rows:[]).map(row=>{
    const source=registry.rowToSource(row);
    const matchedTopics=topicMatches(source,wanted);
    const entryUsage=Number(row.entry_usage||0),linkUsage=Number(row.link_usage||0);
    const candidateScore=matchedTopics.length*10+Math.min(entryUsage,20)*3+Math.min(linkUsage,30)+tierWeight(source.authorityTier);
    return {
      source,
      usage:{entries:entryUsage,links:linkUsage},
      matchedTopics,
      candidateScore,
      approved:false,
      reuseStatus:'candidate_only',
      requiresClaimSpecificVerification:true
    };
  }).filter(item=>wanted.length===0||item.matchedTopics.length>0)
    .sort((a,b)=>b.candidateScore-a.candidateScore||b.usage.entries-a.usage.entries||a.source.sourceId.localeCompare(b.source.sourceId))
    .slice(0,max);
  return {
    version:SCALE_PREP_VERSION,
    language:lang||null,
    requestedTopics:wanted,
    candidates,
    candidateCount:candidates.length,
    contract:{
      approved:false,
      sourcePresenceIsNotVerification:true,
      externalDiscoveryMayStillBeRequired:true
    }
  };
}
async function reusableSourceCandidates(env,{language='',topics=[],limit=12}={}){
  const loaded=await reusableSourceRows(env,{language});
  return candidatePoolFromRows(loaded.rows,{language:loaded.language,topics,limit});
}

async function triageEntry(env,{code,topics=[],candidateLimit=8,candidateRowsByLanguage=null}={}){
  const version=await claims.currentArticleVersion(env,code);
  const context=await consumer.contextForEntry(env,version.code);
  let lane='needs_evidence';
  if(context.status==='VERIFIED'||context.status==='REVIEWED')lane='complete';
  else if(context.needsReview||context.proposedRevisionCount>0)lane='exception';
  else if(context.status==='SOURCED')lane='resume_existing';

  const effectiveTopics=normalizeTopics(topics);
  const queryTopics=effectiveTopics.length?effectiveTopics:inferredTopics(version);
  let pool={candidates:[],candidateCount:0,requestedTopics:queryTopics,contract:{approved:false}};
  if(lane==='needs_evidence'||lane==='resume_existing'){
    const lang=clean(version.language).toLowerCase();
    if(candidateRowsByLanguage instanceof Map){
      if(!candidateRowsByLanguage.has(lang)){
        const loaded=await reusableSourceRows(env,{language:lang});
        candidateRowsByLanguage.set(lang,loaded.rows);
      }
      pool=candidatePoolFromRows(candidateRowsByLanguage.get(lang),{language:lang,topics:queryTopics,limit:candidateLimit});
    } else {
      pool=await reusableSourceCandidates(env,{language:lang,topics:queryTopics,limit:candidateLimit});
    }
  }
  let discoveryMode='external_discovery';
  if(lane==='complete')discoveryMode='none';
  else if(lane==='exception')discoveryMode='human_or_manual';
  else if(pool.candidateCount>0)discoveryMode='registry_first';

  return {
    code:version.code,
    language:version.language||null,
    title:version.title||null,
    status:context.status,
    lane,
    discoveryMode,
    externalDiscoveryRequired:discoveryMode==='external_discovery',
    needsReview:context.needsReview,
    proposedRevisionCount:context.proposedRevisionCount,
    topics:queryTopics,
    sourceCandidates:pool.candidates,
    sourceCandidateCount:pool.candidateCount,
    candidateContract:pool.contract
  };
}

async function batchTriage(env,{entries=[],candidateLimit=8}={}){
  if(!Array.isArray(entries)||entries.length<1||entries.length>50)scaleError('INVALID_TRIAGE_BATCH',422,'entries debe contener entre 1 y 50 elementos.');
  const seen=new Set(),items=[],candidateRowsByLanguage=new Map();
  for(const raw of entries){
    const code=clean(raw?.code).toUpperCase();
    if(!/^MLS-V\d{2}-\d{4}$/.test(code))scaleError('INVALID_ENTRY_CODE',422,'Código MLS inválido en batch triage.');
    if(seen.has(code))scaleError('DUPLICATE_ENTRY_CODE',422,'Código duplicado en batch triage.');
    seen.add(code);
    items.push(await triageEntry(env,{code,topics:raw?.topics,candidateLimit,candidateRowsByLanguage}));
  }
  const byLane=Object.fromEntries(TRIAGE_LANES.map(x=>[x,items.filter(i=>i.lane===x).length]));
  const byDiscovery=Object.fromEntries(DISCOVERY_MODES.map(x=>[x,items.filter(i=>i.discoveryMode===x).length]));
  return {
    version:SCALE_PREP_VERSION,
    requested:entries.length,
    processed:items.length,
    byLane,
    byDiscovery,
    externalDiscoveryRequired:items.filter(i=>i.externalDiscoveryRequired).length,
    registryFirst:items.filter(i=>i.discoveryMode==='registry_first').length,
    exceptions:items.filter(i=>i.lane==='exception').length,
    items,
    gate100Authorized:false
  };
}

module.exports={
  SCALE_PREP_VERSION,
  TRIAGE_LANES,
  DISCOVERY_MODES,
  normalizeTopics,
  inferredTopics,
  reusableSourceRows,
  candidatePoolFromRows,
  reusableSourceCandidates,
  triageEntry,
  batchTriage
};
