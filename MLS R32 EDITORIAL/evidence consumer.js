'use strict';
const foundation=require('./evidence foundation.js');
const registry=require('./evidence registry.js');

const CONSUMER_STATUS=Object.freeze(['UNSOURCED','SOURCED','VERIFIED','REVIEWED']);

function normalizeCode(value){
  const code=String(value||'').trim().toUpperCase();
  return /^MLS-V\d{2}-\d{4}$/.test(code)?code:null;
}
function consumerPolicy(status,{humanReviewed=false,needsReview=false}={}){
  const normalized=CONSUMER_STATUS.includes(status)?status:'UNSOURCED';
  if(normalized==='REVIEWED'&&humanReviewed){
    return {
      status:'REVIEWED',
      canSayVerified:true,
      canSayHumanReviewed:true,
      caution:needsReview?'Existe una marca de revisión pendiente adicional.':'',
      prompt:'La versión exacta de esta entrada está verificada con Evidence y tiene una revisión editorial humana posterior. Puedes describirla como verificada y revisada por una persona cuando sea relevante, sin presentarla como verdad absoluta.'
    };
  }
  if(normalized==='VERIFIED'||normalized==='REVIEWED'){
    return {
      status:'VERIFIED',
      canSayVerified:true,
      canSayHumanReviewed:false,
      caution:normalized==='REVIEWED'&&!humanReviewed?'El estado REVIEWED no tiene una revisión humana vigente demostrable; trátalo conservadoramente como VERIFIED.':'',
      prompt:'La versión exacta de esta entrada está VERIFIED por Evidence. Puedes decir que está verificada con fuentes cuando sea relevante. No digas que fue revisada por una persona y no presentes VERIFIED como certeza absoluta.'
    };
  }
  if(normalized==='SOURCED'){
    return {
      status:'SOURCED',
      canSayVerified:false,
      canSayHumanReviewed:false,
      caution:needsReview?'La entrada además está marcada para revisión.':'',
      prompt:'Esta entrada tiene Sources vinculadas, pero NO está VERIFIED. No uses expresiones como comprobado, verificado, confirmado por fuentes o equivalente. Si la fiabilidad es relevante, aclara que hay evidencia asociada pero la verificación sigue pendiente.'
    };
  }
  return {
    status:'UNSOURCED',
    canSayVerified:false,
    canSayHumanReviewed:false,
    caution:'',
    prompt:'Esta entrada está UNSOURCED en R33: todavía no tiene verificación independiente de Evidence para su versión actual. Úsala como contenido canónico R32, pero no afirmes que está comprobada, verificada o confirmada por fuentes.'
  };
}

async function contextForEntry(env,code){
  const normalized=normalizeCode(code);
  if(!normalized)return null;
  await registry.ensureEvidenceDb(env);
  const article=await env.WIKI_DB.prepare('SELECT code,generated_at,article_markdown FROM wiki_articles WHERE code=?').bind(normalized).first();
  if(!article)return null;
  const hash=await foundation.articleHash(article.article_markdown);
  const state=await env.WIKI_DB.prepare('SELECT * FROM wiki_evidence_entry_state WHERE code=?').bind(normalized).first();
  const current=!!state&&String(state.article_generated_at||'')===String(article.generated_at||'')&&String(state.article_hash||'')===hash;
  let status=current&&CONSUMER_STATUS.includes(state.status)?state.status:'UNSOURCED';
  let humanReview=null;
  if(status==='REVIEWED'){
    humanReview=await env.WIKI_DB.prepare(`SELECT review_id,reviewer_type,reviewer,created_at
      FROM wiki_evidence_reviews
      WHERE code=? AND review_kind='editorial_review'
      ORDER BY created_at DESC,review_id DESC LIMIT 1`).bind(normalized).first();
  }
  const humanReviewed=status==='REVIEWED'&&humanReview?.reviewer_type==='human';
  const policy=consumerPolicy(status,{humanReviewed,needsReview:!!Number(state?.needs_review||0)});
  return {
    code:normalized,
    articleGeneratedAt:article.generated_at,
    articleHash:hash,
    stateCurrent:current,
    evidenceStatus:policy.status,
    rawEvidenceStatus:status,
    claimsTotal:current?Number(state?.claims_total||0):0,
    claimsVerified:current?Number(state?.claims_verified||0):0,
    sourcesTotal:current?Number(state?.sources_total||0):0,
    conflictsTotal:current?Number(state?.conflicts_total||0):0,
    needsReview:current?!!Number(state?.needs_review||0):false,
    verifiedAt:current?state?.verified_at||null:null,
    reviewedAt:humanReviewed?state?.reviewed_at||humanReview?.created_at||null:null,
    humanReviewed,
    canSayVerified:policy.canSayVerified,
    canSayHumanReviewed:policy.canSayHumanReviewed,
    caution:policy.caution,
    prompt:policy.prompt
  };
}

function professorGuidance(context){
  if(!context)return '';
  return [
    'ESTADO EVIDENCE DE LA ENTRADA ACTUAL:',
    'status='+context.evidenceStatus,
    'sources='+context.sourcesTotal,
    'claims='+context.claimsVerified+'/'+context.claimsTotal,
    context.needsReview?'needsReview=true':'needsReview=false',
    context.prompt,
    context.caution||''
  ].filter(Boolean).join('\n');
}

function virtuosoLabel(context){
  if(!context)return {status:'UNSOURCED',label:'Verificación pendiente',canSayVerified:false,humanReviewed:false};
  if(context.evidenceStatus==='REVIEWED'&&context.humanReviewed)return {status:'REVIEWED',label:'Verificada y revisada',canSayVerified:true,humanReviewed:true};
  if(context.evidenceStatus==='VERIFIED')return {status:'VERIFIED',label:'Verificada con fuentes',canSayVerified:true,humanReviewed:false};
  if(context.evidenceStatus==='SOURCED')return {status:'SOURCED',label:'Fuentes vinculadas; verificación pendiente',canSayVerified:false,humanReviewed:false};
  return {status:'UNSOURCED',label:'Verificación pendiente',canSayVerified:false,humanReviewed:false};
}

module.exports={CONSUMER_STATUS,normalizeCode,consumerPolicy,contextForEntry,professorGuidance,virtuosoLabel};
