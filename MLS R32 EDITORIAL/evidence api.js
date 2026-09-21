'use strict';
const foundation=require('./evidence foundation.js');
const registry=require('./evidence registry.js');
const claims=require('./evidence claims.js');
const validator=require('./evidence validator.js');
const reviews=require('./evidence reviews.js');
const apa=require('./evidence apa.js');
const provenance=require('./evidence provenance.js');
const telemetry=require('./evidence telemetry.js');

function fail(code,status,message=code,extra={}){const e=new Error(message);e.code=code;e.status=status;Object.assign(e,extra);return e;}
function trim(v,max=200){return String(v??'').normalize('NFKC').replace(/\s+/gu,' ').trim().slice(0,max);}
function asArray(v,max,name){if(!Array.isArray(v))throw fail('INVALID_'+name.toUpperCase(),422,name+' debe ser un arreglo.');if(v.length>max)throw fail('TOO_MANY_'+name.toUpperCase(),422,'Demasiados elementos en '+name+'.');return v;}
function uniqueClientId(map,id,kind){const x=trim(id,80);if(!/^[A-Za-z0-9_.:-]{1,80}$/.test(x))throw fail('INVALID_CLIENT_ID',422,'clientId inválido en '+kind+'.');if(map.has(x))throw fail('DUPLICATE_CLIENT_ID',422,'clientId duplicado: '+x);return x;}
async function currentRevision(env,article){
  const state=await validator.getEvidenceState(env,article.code);
  const exact=state&&foundation.assertEvidenceVersionMatch(article,state);
  return {state,revision:exact?Number(state.evidence_revision||0):0};
}
async function articleRecord(env,code){
  await registry.ensureEvidenceDb(env);
  const row=await env.WIKI_DB.prepare('SELECT * FROM wiki_articles WHERE code=?').bind(String(code||'').toUpperCase()).first();
  if(!row)throw fail('ARTICLE_NOT_FOUND',404,'La entrada canónica no existe.');
  const version=await claims.currentArticleVersion(env,row.code);
  return {row,version};
}
async function entrySources(env,code){
  const snap=await claims.entryEvidenceSnapshot(env,code);
  const ids=[...new Set(snap.links.map(x=>x.source_id).filter(Boolean))].sort();
  const out=[];
  for(const id of ids){
    const source=await registry.getSourceById(env,id);if(!source)continue;
    let citation=null;try{citation=apa.renderApaReference(source);}catch{}
    out.push({source,citation});
  }
  return out;
}
async function status(env){
  await registry.ensureEvidenceDb(env);
  const sourceRegistry=await registry.sourceRegistryStatus(env);
  const states=await env.WIKI_DB.prepare('SELECT status AS name,COUNT(*) AS n FROM wiki_evidence_entry_state GROUP BY status ORDER BY status').all();
  const reviewsCount=await env.WIKI_DB.prepare('SELECT review_kind AS name,COUNT(*) AS n FROM wiki_evidence_reviews GROUP BY review_kind ORDER BY review_kind').all();
  return {ok:true,context:foundation.MLS_EVIDENCE_CONTEXT,evidenceVersion:foundation.MLS_EVIDENCE_VERSION,citation:{style:foundation.MLS_CITATION_STYLE,edition:foundation.MLS_CITATION_EDITION,profile:foundation.MLS_CITATION_PROFILE,rendererVersion:foundation.MLS_CITATION_RENDERER_VERSION},sourceRegistry,entriesByStatus:Object.fromEntries((states.results||[]).map(x=>[x.name,Number(x.n)])),reviewsByKind:Object.fromEntries((reviewsCount.results||[]).map(x=>[x.name,Number(x.n)])),freeOnly:true,zeroCost:true};
}
async function entry(env,code){
  const {row,version}=await articleRecord(env,code);
  const state=await validator.getEvidenceState(env,version.code);
  const evaluation=await validator.evaluateEntryEvidence(env,version.code);
  const reviewRows=await reviews.listReviews(env,version.code);
  return {ok:true,article:row,version,state,evaluation:{status:evaluation.status,reasons:evaluation.reasons,claimsTotal:evaluation.claimsTotal,claimsVerified:evaluation.claimsVerified,sourcesTotal:evaluation.sourcesTotal,conflictsTotal:evaluation.conflictsTotal,needsReview:evaluation.needsReview,citationReady:evaluation.citationReady,verifiedAt:evaluation.verifiedAt||null,reviewedAt:evaluation.reviewedAt||null},reviews:reviewRows,policy:evaluation.policy,provenance:await provenance.composeArticleProvenance(env,version.code)};
}
async function preflightProposal(env,body){
  const article=await claims.assertArticleVersion(env,body);
  const {state,revision}=await currentRevision(env,article);
  foundation.assertExpectedEvidenceRevision(revision,body.expectedEvidenceRevision);
  const sourceInputs=asArray(body.sources||[],30,'sources'),claimInputs=asArray(body.claims||[],50,'claims'),linkInputs=asArray(body.links||[],100,'links'),conflictInputs=asArray(body.conflicts||[],30,'conflicts');
  const sourceMap=new Map(),claimMap=new Map(),preparedSources=[];
  for(const raw of sourceInputs){
    const clientId=uniqueClientId(sourceMap,raw.clientId,'sources');
    const normalized=await foundation.normalizeSourceMetadata(raw);
    const existing=await registry.getSourceByIdentity(env,normalized.identityKind,normalized.identityKey);
    if(existing){
      const conflicts=registry.metadataConflicts(existing,normalized);
      if(conflicts.length)throw fail('SOURCE_METADATA_CONFLICT',409,'Conflicto de metadata: '+conflicts.join(','),{fields:conflicts,clientId});
    }
    sourceMap.set(clientId,{raw,normalized,existing});preparedSources.push({clientId,raw});
  }
  const preparedClaims=[];
  for(const raw of claimInputs){
    const clientId=uniqueClientId(claimMap,raw.clientId,'claims');
    const normalized=await claims.normalizeClaim({...raw,...article});
    claimMap.set(clientId,normalized);preparedClaims.push({clientId,raw,normalized});
  }
  const preparedLinks=linkInputs.map(raw=>{
    const claimRef=trim(raw.claimRef,80),sourceRef=trim(raw.sourceRef,80);
    if(!claimMap.has(claimRef))throw fail('UNKNOWN_CLAIM_REF',422,'claimRef no existe: '+claimRef);
    if(!sourceMap.has(sourceRef))throw fail('UNKNOWN_SOURCE_REF',422,'sourceRef no existe: '+sourceRef);
    return {raw,claimRef,sourceRef,locator:claims.normalizeLocator(raw.locator||{})};
  });
  const preparedConflicts=conflictInputs.map(raw=>{
    const claimRef=trim(raw.claimRef,80);if(!claimMap.has(claimRef))throw fail('UNKNOWN_CLAIM_REF',422,'claimRef no existe: '+claimRef);
    const sourceRefs=Array.isArray(raw.sourceRefs)?raw.sourceRefs.map(x=>trim(x,80)):[];
    for(const ref of sourceRefs)if(!sourceMap.has(ref))throw fail('UNKNOWN_SOURCE_REF',422,'sourceRef no existe: '+ref);
    return {raw,claimRef,sourceRefs};
  });
  return {article,state,revision,sourceMap,claimMap,preparedSources,preparedClaims,preparedLinks,preparedConflicts};
}
async function applyProposal(env,body){
  const p=await preflightProposal(env,body);
  const resolvedSources=new Map(),resolvedClaims=new Map();
  const sourceOperations=[],claimOperations=[],linkOperations=[],conflictOperations=[];
  for(const item of p.preparedSources){
    const result=await registry.upsertSource(env,item.raw);
    resolvedSources.set(item.clientId,result.source);
    sourceOperations.push({clientId:item.clientId,sourceId:result.source.sourceId,created:!!result.created,updated:!!result.updated,reused:!!result.reused});
  }
  for(const item of p.preparedClaims){
    const result=await claims.upsertClaim(env,{...item.raw,...p.article});
    resolvedClaims.set(item.clientId,result.claim);
    claimOperations.push({clientId:item.clientId,claimId:result.claim.claim_id,created:!!result.created,reused:!!result.reused});
  }
  const links=[];
  for(const item of p.preparedLinks){
    const cl=resolvedClaims.get(item.claimRef),src=resolvedSources.get(item.sourceRef);
    const result=await claims.upsertEvidenceLink(env,{claimId:cl.claim_id,sourceId:src.sourceId,supportType:item.raw.supportType,locator:item.locator,notes:item.raw.notes,verificationMethod:item.raw.verificationMethod||'manual_source_match'});
    links.push(result.link);
    linkOperations.push({linkId:result.link.link_id,created:!!result.created,reused:!!result.reused});
  }
  const conflicts=[];
  for(const item of p.preparedConflicts){
    const cl=resolvedClaims.get(item.claimRef),sourceIds=item.sourceRefs.map(x=>resolvedSources.get(x).sourceId);
    const result=await claims.recordConflict(env,{claimId:cl.claim_id,conflictType:item.raw.conflictType,status:item.raw.status,context:item.raw.context,resolution:item.raw.resolution,sourceIds});
    conflicts.push(result.conflict);
    conflictOperations.push({conflictId:result.conflict.conflict_id,created:!!result.created,reused:!!result.reused});
  }
  const evaluation=await validator.persistEvaluation(env,p.article.code,{expectedEvidenceRevision:p.revision});
  const operations={
    sourcesCreated:sourceOperations.filter(x=>x.created).length,
    sourcesReused:sourceOperations.filter(x=>x.reused).length,
    sourcesUpdated:sourceOperations.filter(x=>x.updated).length,
    claimsCreated:claimOperations.filter(x=>x.created).length,
    claimsReused:claimOperations.filter(x=>x.reused).length,
    linksCreated:linkOperations.filter(x=>x.created).length,
    linksReused:linkOperations.filter(x=>x.reused).length,
    conflictsCreated:conflictOperations.filter(x=>x.created).length,
    conflictsReused:conflictOperations.filter(x=>x.reused).length,
    sourceOperations,claimOperations,linkOperations,conflictOperations
  };
  return {ok:true,code:p.article.code,article:p.article,state:evaluation.state,evaluation:{status:evaluation.status,reasons:evaluation.reasons,claimsTotal:evaluation.claimsTotal,claimsVerified:evaluation.claimsVerified,sourcesTotal:evaluation.sourcesTotal,conflictsTotal:evaluation.conflictsTotal,citationReady:evaluation.citationReady},mappings:{sources:Object.fromEntries([...resolvedSources].map(([k,v])=>[k,v.sourceId])),claims:Object.fromEntries([...resolvedClaims].map(([k,v])=>[k,v.claim_id]))},links:links.map(x=>x.link_id),conflicts:conflicts.map(x=>x.conflict_id),operations,idempotentRetrySafe:true};
}
async function validateEntry(env,code){
  const assessment=await validator.assessEntryEvidence(env,code);
  const sources=await entrySources(env,code);
  return {ok:true,code:assessment.article.code,canVerify:assessment.coverageComplete&&assessment.citationReady,assessment:{status:assessment.status,reasons:assessment.reasons,claimsTotal:assessment.claimsTotal,claimsVerified:assessment.claimsVerified,sourcesTotal:assessment.sourcesTotal,conflictsTotal:assessment.conflictsTotal,coverageComplete:assessment.coverageComplete,citationReady:assessment.citationReady},sources};
}
async function handleMlsEvidence(request,env,url,runtime){
  const json=runtime.json,error=runtime.error;
  let meter=null;
  try{
    await runtime.authenticate(request,env);
    await runtime.ensureWikiDb(env);
    await registry.ensureEvidenceDb(env);
    meter=telemetry.createD1Meter();
    const measuredEnv={...env,WIKI_DB:meter.wrap(env.WIKI_DB)};
    const respond=(payload,status=200)=>json({...payload,telemetry:{d1:meter.snapshot()}},status);
    const route=url.pathname.replace('/api/wiki/editorial/evidence','')||'/';
    if(route==='/status'&&request.method==='GET')return respond(await status(measuredEnv));
    if(route==='/entry'&&request.method==='GET')return respond(await entry(measuredEnv,url.searchParams.get('code')));
    if(route==='/sources'&&request.method==='GET')return respond({ok:true,code:String(url.searchParams.get('code')||'').toUpperCase(),sources:await entrySources(measuredEnv,url.searchParams.get('code'))});
    if(route==='/provenance'&&request.method==='GET')return respond({ok:true,provenance:await provenance.composeArticleProvenance(measuredEnv,url.searchParams.get('code'))});
    if(route==='/metrics'&&request.method==='GET')return respond({ok:true,storage:await telemetry.measureEntryLogicalBytes(measuredEnv,url.searchParams.get('code'))});
    if(route==='/validate'&&request.method==='POST'){const body=await runtime.body(request);return respond(await validateEntry(measuredEnv,body.code));}
    if(route==='/proposal'&&request.method==='POST'){const body=await runtime.body(request);return respond(await applyProposal(measuredEnv,body));}
    if(route==='/verify'&&request.method==='POST'){const body=await runtime.body(request);const out=await validator.verifyEntryEvidence(measuredEnv,body.code,{expectedEvidenceRevision:body.expectedEvidenceRevision,reviewerType:body.reviewerType||'chatgpt',reviewer:body.reviewer,verificationMethod:body.verificationMethod||'manual_source_match',notes:body.notes,runId:body.runId});return respond({ok:true,...out});}
    if(route==='/review'&&request.method==='POST'){const body=await runtime.body(request);const out=await validator.reviewEntryEvidence(measuredEnv,body.code,{expectedEvidenceRevision:body.expectedEvidenceRevision,reviewerType:body.reviewerType||'human',reviewer:body.reviewer,verificationMethod:body.verificationMethod||'editorial_review',notes:body.notes,runId:body.runId});return respond({ok:true,...out});}
    if(route==='/revision/propose'&&request.method==='POST'){const body=await runtime.body(request);return respond({ok:true,...await reviews.proposeArticleRevision(measuredEnv,body)});}
    if(!['GET','POST'].includes(request.method)){const r=respond({ok:false,error:'Método no permitido.'},405);r.headers.set('Allow','GET, POST');return r;}
    error(404,'Ruta Evidence no encontrada.');
  }catch(e){
    if(!e.status)console.error('mls-evidence-failure',e.message);
    return json({ok:false,error:e.status?e.message:'Error temporal de Evidence.',code:e.code||null,...(e.fields?{fields:e.fields}:{}),...(meter?{telemetry:{d1:meter.snapshot()}}:{})},e.status||500);
  }
}
module.exports={status,entry,entrySources,preflightProposal,applyProposal,validateEntry,handleMlsEvidence};
