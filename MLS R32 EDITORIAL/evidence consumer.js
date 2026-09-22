'use strict';
const registry=require('./evidence registry.js');
const validator=require('./evidence validator.js');

const CONSUMER_CONTRACT_VERSION='1.0';
const SAFE_STATUSES=Object.freeze(['UNSOURCED','SOURCED','VERIFIED','REVIEWED']);

function normalizedStatus(value){
  const status=String(value||'UNSOURCED').toUpperCase();
  return SAFE_STATUSES.includes(status)?status:'UNSOURCED';
}

function contractForEvidence({status='UNSOURCED',needsReview=false,proposedRevisionCount=0}={}){
  const safeStatus=normalizedStatus(status);
  const proposed=Math.max(0,Number(proposedRevisionCount)||0);
  const base={
    version:CONSUMER_CONTRACT_VERSION,
    status:safeStatus,
    needsReview:Boolean(needsReview),
    proposedRevisionCount:proposed,
    hasProposedRevision:proposed>0,
    maySayVerified:safeStatus==='VERIFIED'||safeStatus==='REVIEWED',
    maySayReviewed:safeStatus==='REVIEWED',
    mayTreatProposedAsCanonical:false,
    mayTreatSourcePresenceAsProof:false
  };
  const copy={
    UNSOURCED:{
      label:'Fundamentación pendiente',
      disclosure:'Esta entrada todavía no ha completado fundamentación bibliográfica.',
      instruction:'No digas que esta entrada está comprobada, verificada con fuentes ni revisada. Puedes explicarla como material enciclopédico R32 y señalar que su fundamentación bibliográfica está pendiente cuando sea relevante.'
    },
    SOURCED:{
      label:'Fuentes identificadas',
      disclosure:'Esta entrada tiene fuentes identificadas, pero la verificación bibliográfica todavía no está completa.',
      instruction:'No digas que esta entrada está comprobada o verificada. Puedes decir que tiene fuentes identificadas o cobertura parcial/pendiente según el contexto.'
    },
    VERIFIED:{
      label:'Verificado con fuentes',
      disclosure:'Esta entrada fue contrastada con fuentes para su snapshot de Evidence vigente.',
      instruction:'Puedes indicar que la entrada está verificada con fuentes para el snapshot vigente. No presentes esa verificación como verdad absoluta ni ocultes límites, variación o conflictos relevantes.'
    },
    REVIEWED:{
      label:'Verificado y revisado',
      disclosure:'Esta entrada fue verificada con fuentes y recibió una revisión editorial posterior.',
      instruction:'Puedes indicar que la entrada está verificada con fuentes y revisada editorialmente. No presentes esa revisión como garantía absoluta de verdad.'
    }
  }[safeStatus];
  let instruction=copy.instruction;
  if(base.needsReview)instruction+=' Existe una señal needsReview activa: no resuelvas ni minimices silenciosamente el problema.';
  if(base.hasProposedRevision)instruction+=' Existe una revisión de artículo propuesta que todavía NO es canónica: no la presentes como contenido publicado.';
  return {...base,...copy,instruction};
}

async function contextForEntry(env,code){
  await registry.ensureEvidenceDb(env);
  const evaluation=await validator.evaluateEntryEvidence(env,code);
  const proposed=await env.WIKI_DB.prepare("SELECT COUNT(*) AS n FROM wiki_article_revisions WHERE code=? AND status='proposed'")
    .bind(String(code||'').trim().toUpperCase()).first();
  const contract=contractForEvidence({
    status:evaluation.status,
    needsReview:evaluation.needsReview,
    proposedRevisionCount:Number(proposed?.n||0)
  });
  return {
    code:evaluation.article.code,
    status:contract.status,
    needsReview:contract.needsReview,
    proposedRevisionCount:contract.proposedRevisionCount,
    claimsTotal:evaluation.claimsTotal,
    claimsVerified:evaluation.claimsVerified,
    sourcesTotal:evaluation.sourcesTotal,
    verifiedAt:evaluation.verifiedAt||null,
    reviewedAt:evaluation.reviewedAt||null,
    contract
  };
}

function publicSummary(context){
  if(!context)return null;
  return {
    status:context.status,
    label:context.contract.label,
    disclosure:context.contract.disclosure,
    needsReview:context.needsReview,
    hasProposedRevision:context.contract.hasProposedRevision,
    verifiedAt:context.verifiedAt||null,
    reviewedAt:context.reviewedAt||null
  };
}

function systemGuidance(context,consumer='assistant'){
  if(!context)return '';
  return [
    'CONTRATO DE EVIDENCE & PROVENANCE — '+String(consumer||'assistant').toUpperCase(),
    'Estado efectivo: '+context.status+'.',
    context.contract.instruction,
    'La existencia de Sources por sí sola no equivale a verificación.',
    'Una revisión propuesta nunca sustituye el artículo canónico.'
  ].join('\n');
}

module.exports={
  CONSUMER_CONTRACT_VERSION,
  SAFE_STATUSES,
  normalizedStatus,
  contractForEvidence,
  contextForEntry,
  publicSummary,
  systemGuidance
};
