"use strict";

function unifiedR33NormalizeText(value) {
  return String(value || "").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
    .replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af\u0400-\u04ff]+/g," ").trim();
}
function unifiedR33Tokens(value) {
  return new Set(unifiedR33NormalizeText(value).split(/\s+/).filter(x=>x.length>=3).slice(0,1200));
}
function unifiedR33LanguageCode(language) {
  const map={
    "espanol-guatemala":"es","ingles":"en","portugues":"pt","italiano":"it","frances":"fr",
    "aleman":"de","japones":"ja","chino-taiwan":"zh","coreano":"ko","ruso":"ru"
  };
  return map[String(language || "").toLowerCase()] || "";
}
function unifiedR33HandoffSourceText(entry) {
  return (Array.isArray(entry && entry.sources) ? entry.sources : []).map(x=>{
    if(typeof x==="string") return x;
    if(x && typeof x==="object") return [x.sourceId,x.citation,x.title,x.url,x.canonicalUrl,x.role].filter(Boolean).join(" ");
    return "";
  }).join(" ");
}
function unifiedR33SourceCandidates(article,handoffEntry) {
  const lang=unifiedR33LanguageCode(article && article.language);
  const hints=Array.isArray(handoffEntry && handoffEntry.claims)?handoffEntry.claims.map(x=>typeof x==="string"?x:JSON.stringify(x)):[];
  const articleText=[
    article && article.title,article && article.part,article && article.chapter,
    String(article && article.articleMarkdown || "").slice(0,14000),...hints
  ].filter(Boolean).join(" ");
  const articleTokens=unifiedR33Tokens(articleText);
  const handoffText=unifiedR33NormalizeText(unifiedR33HandoffSourceText(handoffEntry));
  return (Array.isArray(MLS_R33_SOURCE_CATALOG)?MLS_R33_SOURCE_CATALOG:[]).map(raw=>{
    const m=raw && raw.metadata || {};
    if(m.status && m.status!=="active") return null;
    if(String(m.authorityTier || "").toUpperCase()==="X") return null;
    const sourceLang=String(m.language || "").toLowerCase();
    if(lang && sourceLang && !(sourceLang===lang || sourceLang.startsWith(lang+"-"))) return null;
    const sourceText=[m.title,(m.topics||[]).join(" "),m.institution,(m.authors||[]).join(" ")].filter(Boolean).join(" ");
    const sourceTokens=unifiedR33Tokens(sourceText);
    let overlap=0;
    for(const token of sourceTokens) if(articleTokens.has(token)) overlap++;
    let score=overlap*5;
    const tier=String(m.authorityTier || "").toUpperCase();
    score+=tier==="A"?20:tier==="B"?14:tier==="C"?8:3;
    const title=unifiedR33NormalizeText(m.title);
    const url=unifiedR33NormalizeText(m.canonicalUrl);
    if(title && handoffText.includes(title)) score+=160;
    if(url && handoffText.includes(url)) score+=220;
    if(raw.sourceId && handoffText.includes(unifiedR33NormalizeText(raw.sourceId))) score+=500;
    return {sourceId:String(raw.sourceId||""),metadata:m,score};
  }).filter(Boolean).sort((a,b)=>b.score-a.score||a.sourceId.localeCompare(b.sourceId)).slice(0,12);
}
function unifiedR33ParseJson(text) {
  const raw=String(text || "").trim();
  try{return JSON.parse(raw)}catch(_){}
  const a=raw.indexOf("{"),b=raw.lastIndexOf("}");
  if(a>=0&&b>a){try{return JSON.parse(raw.slice(a,b+1))}catch(_){}}
  throw new Error("UNIFIED_R33_DRAFT_JSON_INVALID");
}
function unifiedR33ReconcileArticle(article,handoffEntry) {
  if(!article || typeof article!=="object" || Array.isArray(article)) throw new Error("UNIFIED_R33_ARTICLE_INVALID");
  const base={...article};
  const code=String(base.code||"").toUpperCase();
  if(!/^MLS-V\d{2}-\d{4}$/.test(code)) throw new Error("UNIFIED_R33_CODE_INVALID");
  if(String(handoffEntry && handoffEntry.outcome || "").toUpperCase()!=="CORRECTED") return base;
  const correction=handoffEntry && handoffEntry.correctedContent;
  if(!correction || typeof correction!=="object" || Array.isArray(correction)) throw new Error("UNIFIED_R33_CORRECTION_MISSING");
  const next={...base};
  for(const key of ["articleMarkdown","title","level","part","chapter"]){
    if(Object.prototype.hasOwnProperty.call(correction,key)) next[key]=correction[key];
  }
  next.code=base.code;
  next.language=base.language;
  next.languageName=base.languageName;
  return next;
}
function unifiedR33SourcePacket(candidates) {
  return candidates.map(x=>({
    sourceId:x.sourceId,authorityTier:x.metadata.authorityTier,sourceType:x.metadata.sourceType,
    title:x.metadata.title,authors:x.metadata.authors||[],institution:x.metadata.institution||null,
    publicationYear:x.metadata.publicationYear||null,canonicalUrl:x.metadata.canonicalUrl||null,
    topics:x.metadata.topics||[],score:x.score
  }));
}
function unifiedR33EvidenceObject(args) {
  const {code,contentPath,finalArticle,selected,claim,parsed,result,runId,currentEvidenceRevision}=args;
  const now=new Date().toISOString(),temp=code.replace(/[^A-Z0-9]/g,"");
  return {
    schemaVersion:"1.0",architecture:"github-native",code,
    language:String(finalArticle.language||""),languageName:String(finalArticle.languageName||finalArticle.language||""),
    contentPath,article:{},evidenceVersion:"1.0",evidenceRevision:Math.max(0,Number(currentEvidenceRevision||0))+1,status:"VERIFIED",
    claims:[{claimId:"MLS-CLM-TEMP-"+temp,sectionKey:String(claim.sectionKey||"En pocas palabras"),summary:String(claim.summary||"").trim(),claimType:String(claim.claimType||"general"),materiality:"substantial"}],
    links:[{linkId:"MLS-LNK-TEMP-"+temp,claimId:"MLS-CLM-TEMP-"+temp,sourceId:selected.sourceId,supportType:"supports",locator:{},notes:String(parsed.rationale||"")||null,verificationMethod:"automated_registered_source_match"}],
    conflicts:[],
    verification:{verifiedAt:now,reviewerType:"system",reviewer:"MLS Unified Cloudflare Runner",verificationMethod:"automated_registered_source_match",evidenceSnapshotHash:"pending-preflight",runId},
    review:null,
    provenance:{generatedWithAI:true,model:result.model||"@cf/ibm-granite/granite-4.0-h-micro",promptVersion:"R33-Unified-CF-1",runId,sourceOfTruth:"github",updatedAt:now}
  };
}
async function unifiedRunnerR33Draft(request,env) {
  const auth=await unifiedRunnerAuthorize(request,env);
  if(!auth.ok) return r44Json({error:auth.error},auth.status);
  const runner=await unifiedRunnerRead(env);
  if(runner.state!=="RUNNING") return r44Json({error:"UNIFIED_RUNNER_NOT_RUNNING",state:runner.state},409);
  const body=await r44ChatBridgeBody(request);
  const article=body.article,handoffEntry=body.handoffEntry || {};
  const code=String(body.code || article && article.code || "").toUpperCase();
  const contentPath=String(body.contentPath || "");
  if(!/^MLS-V\d{2}-\d{4}$/.test(code)||!contentPath.startsWith("content/")) return r44Json({error:"UNIFIED_R33_DRAFT_SCOPE_INVALID"},400);
  if(String(article && article.code || "").toUpperCase()!==code) return r44Json({error:"UNIFIED_R33_DRAFT_CODE_MISMATCH"},400);
  const finalArticle=unifiedR33ReconcileArticle(article,handoffEntry);
  const candidates=unifiedR33SourceCandidates(finalArticle,handoffEntry);
  if(!candidates.length) return r44Json({ok:true,status:"NEEDS_CHAT_REVIEW",code,reason:"NO_REGISTERED_SOURCE_CANDIDATE"},200);

  const prompt=[
    "MLS R33 REGISTERED-SOURCE MATCHER v1.",
    "Return ONLY JSON. Never invent a sourceId, URL, quotation, page or locator.",
    "Choose exactly one source from CANDIDATES only when its bibliographic identity and topics make it credible support for ONE central substantial claim actually present in ARTICLE.",
    "If the match is weak or ambiguous, return status NEEDS_CHAT_REVIEW.",
    "Do not create quotation claims.",
    "claimType must be one of: general, normative, orthography, regional_variation, historical.",
    "For normative or orthography claims, select only authorityTier A or B.",
    "Output keys: status, confidence, sourceId, claim, rationale. status is MATCH or NEEDS_CHAT_REVIEW. claim has sectionKey, summary, claimType, materiality=substantial.",
    "ARTICLE:\n"+String(finalArticle.articleMarkdown||"").slice(0,18000),
    "TITLE/PART/CHAPTER:\n"+[finalArticle.title,finalArticle.part,finalArticle.chapter].filter(Boolean).join(" | "),
    "R44 CLAIM HINTS:\n"+JSON.stringify(Array.isArray(handoffEntry.claims)?handoffEntry.claims:[]).slice(0,6000),
    "CANDIDATES:\n"+JSON.stringify(unifiedR33SourcePacket(candidates))
  ].join("\n\n");

  const provider={id:"cloudflare-r33-source-matcher",kind:"cloudflare",model:"@cf/ibm-granite/granite-4.0-h-micro"};
  let result;
  try{
    result=await runCloudflareProvider(env,provider,[{role:"user",content:prompt}],900,0.01);
  }catch(error){
    const message=wikiErrorMessage(error),kind=workersAiFailureKind(message);
    if(kind==="quota"){
      await unifiedRunnerApplyMark(env,{state:"QUOTA_PAUSED",last_error:message,last_step_at:new Date().toISOString(),errorDelta:1});
      return r44Json({error:"QUOTA_PAUSED",message},429);
    }
    if(kind==="paid"){
      await unifiedRunnerApplyMark(env,{state:"POLICY_PAUSED",last_error:message,last_step_at:new Date().toISOString(),errorDelta:1});
      return r44Json({error:"POLICY_PAUSED",message},409);
    }
    throw error;
  }

  const parsed=unifiedR33ParseJson(result.text);
  const confidence=Number(parsed.confidence||0);
  const selected=candidates.find(x=>x.sourceId===String(parsed.sourceId||""));
  const claim=parsed.claim && typeof parsed.claim==="object" ? parsed.claim : null;
  const claimType=String(claim && claim.claimType || "general");
  const allowedTypes=new Set(["general","normative","orthography","regional_variation","historical"]);
  const tier=String(selected && selected.metadata.authorityTier || "").toUpperCase();
  const tierAllowed=!(claimType==="normative"||claimType==="orthography") || tier==="A" || tier==="B";
  const summary=String(claim && claim.summary || "").trim();
  if(parsed.status!=="MATCH" || confidence<0.76 || !selected || !tierAllowed || !allowedTypes.has(claimType) || !summary){
    return r44Json({ok:true,status:"NEEDS_CHAT_REVIEW",code,reason:"SOURCE_MATCH_BELOW_THRESHOLD",confidence,sourceId:selected && selected.sourceId || null,rationale:String(parsed.rationale||"")},200);
  }

  const runId=String(body.runId || "MLS-UNIFIED-WEB");
  const evidence=unifiedR33EvidenceObject({code,contentPath,finalArticle,selected,claim,parsed,result,runId,currentEvidenceRevision:body.currentEvidenceRevision});
  return r44Json({
    ok:true,status:"MATCH",code,confidence,
    source:{sourceId:selected.sourceId,metadata:selected.metadata},
    evidence,
    finalContent:String(handoffEntry.outcome||"").toUpperCase()==="CORRECTED"?finalArticle:null
  });
}
