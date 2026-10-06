"use strict";

// Explicit semantic versions, not a deployment/global-catalog hash. Bump only
// when the corresponding R33 behavior materially changes. Candidate fingerprints
// ensure unrelated source-catalog edits do not reopen every entry.
var MLS_CANONICAL_R33_POLICY={claims:2,support:2,coverage:1,repair:1};
function unifiedR33CanonicalContext(body) {
  const article=unifiedR33ReconcileArticle(body.article,body.handoffEntry||{});
  const candidates=unifiedR33SourceCandidates(article,body.handoffEntry||{},{repairUrlOnly:true});
  return {policy:MLS_CANONICAL_R33_POLICY,candidates:unifiedR33SourcePacket(candidates)};
}
// Cheap deterministic quarantine preflight. It performs no AI inference and no
// source fetch. Its only job is deciding whether the CURRENT registered context
// is good enough to justify one bounded R33 retry at the same fingerprint.
function unifiedR33CanonicalPreflight(body,reason) {
  let article,candidates;
  try{
    article=unifiedR33ReconcileArticle(body.article,body.handoffEntry||{});
    candidates=unifiedR33SourceCandidates(article,body.handoffEntry||{});
  }catch(error){
    return {eligible:false,reason:String(error&&error.message||'CANONICAL_PREFLIGHT_INVALID_CONTEXT'),candidateCount:0,fetchableCandidateCount:0};
  }
  const fetchable=unifiedR33SourceCandidates(article,body.handoffEntry||{},{repairUrlOnly:true});
  const s=String(reason||"");
  if(!candidates.length)return {eligible:false,reason:"NO_REGISTERED_SOURCE_CANDIDATE",candidateCount:0,fetchableCandidateCount:0};
  if(s==="NO_REGISTERED_SOURCE_CANDIDATE")return {eligible:true,reason:"CANDIDATE_NOW_AVAILABLE",candidateCount:candidates.length,fetchableCandidateCount:fetchable.length};
  if(["SOURCE_FULLTEXT_REQUIRED","SOURCE_URL_UNAVAILABLE","SOURCE_NO_AUDITABLE_REGISTERED_CANDIDATE"].includes(s)){
    return {eligible:fetchable.length>0,reason:fetchable.length?"FETCHABLE_SOURCE_NOW_AVAILABLE":"NO_FETCHABLE_REGISTERED_SOURCE",candidateCount:candidates.length,fetchableCandidateCount:fetchable.length};
  }
  if(s==="CLAIM_SOURCE_TIER_INVALID"){
    const strong=candidates.some(candidate=>["A","B"].includes(String(candidate.metadata&&candidate.metadata.authorityTier||"").toUpperCase()));
    return {eligible:strong,reason:strong?"STRONG_SOURCE_CANDIDATE_AVAILABLE":"NO_STRONG_SOURCE_CANDIDATE",candidateCount:candidates.length,fetchableCandidateCount:fetchable.length};
  }
  if(/^CLAIM_SOURCE_/.test(s)||/^(MATCHER_|CLAIM_|COVERAGE_|SOURCE_SUPPORT_|NEEDS_CHAT_REVIEW)/.test(s)){
    return {eligible:true,reason:"CURRENT_CONTEXT_RECHECKABLE",candidateCount:candidates.length,fetchableCandidateCount:fetchable.length};
  }
  return {eligible:false,reason:"REASON_NOT_SAFE_FOR_SAME_CONTEXT_RETRY",candidateCount:candidates.length,fetchableCandidateCount:fetchable.length};
}

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
function unifiedR33SourceCandidates(article,handoffEntry,options={}) {
  const lang=unifiedR33LanguageCode(article && article.language);
  const hints=Array.isArray(handoffEntry && handoffEntry.claims)?handoffEntry.claims.map(x=>typeof x==="string"?x:JSON.stringify(x)):[];
  const articleText=[
    article && article.title,article && article.part,article && article.chapter,
    String(article && article.articleMarkdown || "").slice(0,16000),...hints
  ].filter(Boolean).join(" ");
  const articleTokens=unifiedR33Tokens(articleText);
  const handoffText=unifiedR33NormalizeText(unifiedR33HandoffSourceText(handoffEntry));
  const ranked=(Array.isArray(MLS_R33_SOURCE_CATALOG)?MLS_R33_SOURCE_CATALOG:[]).map(raw=>{
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
  }).filter(Boolean);
  const eligible=options.autoAuditableOnly?ranked.filter(unifiedR33SourceAutoAuditable):options.repairUrlOnly?ranked.filter(candidate=>!!unifiedR33SafeSourceUrl(candidate.metadata&&candidate.metadata.canonicalUrl)):ranked;
  return eligible.sort((a,b)=>b.score-a.score||a.sourceId.localeCompare(b.sourceId)).slice(0,16);
}
function unifiedR33ParseJson(text) {
  const raw=String(text || "").replace(/^\uFEFF/,"").trim();
  const attempts=[raw,raw.replace(/^\`\`\`(?:json)?\s*/i,"").replace(/\s*\`\`\`$/,"")];
  const a=raw.indexOf("{"),b=raw.lastIndexOf("}");
  if(a>=0&&b>a)attempts.push(raw.slice(a,b+1));
  for(const value of attempts){
    try{return JSON.parse(value)}catch(_){}
    try{return JSON.parse(value.replace(/,\s*([}\]])/g,"$1"))}catch(_){}
  }
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
function unifiedR33SourceAutoAuditable(candidate) {
  const metadata=candidate&&candidate.metadata||{};
  const type=String(metadata.sourceType||"");
  const autoTypes=new Set(["institutional_webpage","reference_entry","standard","report","dataset"]);
  return autoTypes.has(type)&&!!unifiedR33SafeSourceUrl(metadata.canonicalUrl);
}
function unifiedR33SourcePacket(candidates) {
  return candidates.map(x=>({
    sourceId:x.sourceId,authorityTier:x.metadata.authorityTier,sourceType:x.metadata.sourceType,
    title:x.metadata.title,authors:x.metadata.authors||[],institution:x.metadata.institution||null,
    publicationYear:x.metadata.publicationYear||null,canonicalUrl:x.metadata.canonicalUrl||null,
    topics:x.metadata.topics||[],score:x.score
  }));
}
function unifiedR33AllowedTier(claimType,tier) {
  const type=String(claimType||"general"),t=String(tier||"").toUpperCase();
  if(type==="normative"||type==="orthography")return t==="A"||t==="B";
  if(type==="regional_variation"||type==="historical")return t==="A"||t==="B"||t==="C";
  return t==="A"||t==="B"||t==="C"||t==="D";
}
function unifiedR33ValidateClaimSet(parsed,candidates) {
  if(parsed?.status!=="MATCH")return {ok:false,reason:"MATCHER_REQUESTED_REVIEW"};
  const overall=Number(parsed.confidence||0);
  if(overall<0.80)return {ok:false,reason:"MATCHER_CONFIDENCE_LOW",confidence:overall};
  const raw=Array.isArray(parsed.claims)?parsed.claims:[];
  if(!raw.length||raw.length>16)return {ok:false,reason:"CLAIM_COUNT_INVALID",confidence:overall};
  const allowedTypes=new Set(["general","normative","orthography","regional_variation","historical"]);
  const seen=new Set(),claims=[];
  for(let i=0;i<raw.length;i++){
    const item=raw[i]&&typeof raw[i]==="object"?raw[i]:{};
    const summary=String(item.summary||"").trim();
    const normalized=unifiedR33NormalizeText(summary);
    const claimType=String(item.claimType||"general");
    const confidence=Number(item.confidence??overall);
    const selected=candidates.find(x=>x.sourceId===String(item.sourceId||""));
    if(!summary||normalized.length<12||seen.has(normalized))return {ok:false,reason:"CLAIM_SUMMARY_INVALID",claimIndex:i};
    if(!allowedTypes.has(claimType))return {ok:false,reason:"CLAIM_TYPE_INVALID",claimIndex:i};
    if(!selected)return {ok:false,reason:"CLAIM_SOURCE_NOT_REGISTERED",claimIndex:i};
    if(!unifiedR33AllowedTier(claimType,selected.metadata.authorityTier))return {ok:false,reason:"CLAIM_SOURCE_TIER_INVALID",claimIndex:i};
    if(confidence<0.78)return {ok:false,reason:"CLAIM_CONFIDENCE_LOW",claimIndex:i,confidence};
    seen.add(normalized);
    claims.push({
      sectionKey:String(item.sectionKey||"En pocas palabras").slice(0,160),
      summary,
      claimType,
      materiality:"substantial",
      sourceId:selected.sourceId,
      source:selected,
      confidence,
      rationale:String(item.rationale||parsed.rationale||"").slice(0,1200)
    });
  }
  return {ok:true,confidence:overall,claims};
}
async function unifiedR33RunProvider(env,provider,messages,maxTokens) {
  try{
    return await runCloudflareProvider(env,provider,messages,maxTokens,0.01);
  }catch(error){
    const message=wikiErrorMessage(error),kind=workersAiFailureKind(message);
    if(kind==="quota"){
      await unifiedRunnerApplyMark(env,{state:"QUOTA_PAUSED",last_error:message,last_step_at:new Date().toISOString(),errorDelta:1});
      const e=new Error(message);e.unifiedStatus="QUOTA_PAUSED";throw e;
    }
    if(kind==="paid"){
      await unifiedRunnerApplyMark(env,{state:"POLICY_PAUSED",last_error:message,last_step_at:new Date().toISOString(),errorDelta:1});
      const e=new Error(message);e.unifiedStatus="POLICY_PAUSED";throw e;
    }
    throw error;
  }
}
function unifiedR33SafeSourceUrl(value) {
  const raw=String(value||"").trim();
  if(!raw)return null;
  try{
    const u=new URL(raw);
    if(u.protocol!=="https:"&&u.protocol!=="http:")return null;
    const host=u.hostname.toLowerCase();
    if(host==="localhost"||host.endsWith(".local")||host==="::1"||host.startsWith("127.")||host.startsWith("10.")||host.startsWith("192.168.")||host.startsWith("169.254."))return null;
    const m=/^172\.(\d{1,3})\./.exec(host);if(m&&Number(m[1])>=16&&Number(m[1])<=31)return null;
    return u.toString();
  }catch{return null}
}
function unifiedR33ReadableSourceText(raw,contentType) {
  let text=String(raw||"");
  if(/html|xml/i.test(String(contentType||""))){
    text=text.replace(/<script\b[\s\S]*?<\/script>/gi," ").replace(/<style\b[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ");
  }
  return text.replace(/&nbsp;|&#160;/gi," ").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/\s+/g," ").trim();
}
async function unifiedR33FetchSourceDocument(candidate) {
  const metadata=candidate&&candidate.metadata||{};
  // Repair mode may try any citation-ready registered source that exposes a safe
  // canonical URL. Approval still requires substantive fetched text plus the
  // unchanged support and coverage audits, so this does not weaken R33.
  const url=unifiedR33SafeSourceUrl(metadata.canonicalUrl);
  if(!url)return {ok:false,reason:"SOURCE_URL_UNAVAILABLE",sourceId:candidate.sourceId};
  let response;
  try{response=await fetch(url,{redirect:"follow",headers:{accept:"text/html,text/plain,application/json,application/xml;q=0.8,*/*;q=0.2","user-agent":"MLS-Unified-R33/1.0"}})}
  catch{return {ok:false,reason:"SOURCE_FETCH_FAILED",sourceId:candidate.sourceId}};
  if(!response.ok)return {ok:false,reason:"SOURCE_FETCH_HTTP_"+response.status,sourceId:candidate.sourceId};
  const contentType=String(response.headers.get("content-type")||"");
  if(!/text|html|json|xml/i.test(contentType))return {ok:false,reason:"SOURCE_CONTENT_TYPE_UNSUPPORTED",sourceId:candidate.sourceId};
  const raw=await response.text();
  const text=unifiedR33ReadableSourceText(raw,contentType).slice(0,18000);
  if(text.length<300)return {ok:false,reason:"SOURCE_TEXT_TOO_SHORT",sourceId:candidate.sourceId};
  return {ok:true,sourceId:candidate.sourceId,url,text,title:String(metadata.title||"")};
}
async function unifiedR33SourceSupportAudit(env,claims,candidates) {
  const ids=[...new Set(claims.map(x=>x.sourceId))],documents=[];
  for(const sourceId of ids){
    const candidate=candidates.find(x=>x.sourceId===sourceId);
    if(!candidate)return {ok:false,reason:"SOURCE_NOT_REGISTERED",sourceId};
    const doc=await unifiedR33FetchSourceDocument(candidate);
    if(!doc.ok)return doc;
    documents.push(doc);
  }
  const packet=documents.map(d=>({sourceId:d.sourceId,title:d.title,url:d.url,text:d.text.slice(0,7000)}));
  const prompt=[
    "MLS R33 SOURCE-SUPPORT AUDITOR v3.",
    "Return ONLY JSON.",
    "Evaluate the claims against the ACTUAL fetched source text below, not merely bibliographic metadata.",
    "PASS only when every claim is directly supported by the sourceId assigned to it. Reject inference that is broader than the source text.",
    "If a source page is only a landing page, table of contents, bibliography, product page, metadata record, or otherwise lacks the substantive support, return NEEDS_CHAT_REVIEW.",
    "Output keys: status (PASS or NEEDS_CHAT_REVIEW), confidence 0..1, unsupportedClaimIndexes array, rationale.",
    "CLAIMS:\n"+JSON.stringify(claims.map((c,i)=>({index:i,summary:c.summary,claimType:c.claimType,sourceId:c.sourceId}))),
    "FETCHED SOURCES:\n"+JSON.stringify(packet).slice(0,32000)
  ].join("\n\n");
  const provider={id:"cloudflare-r33-source-support-auditor",kind:"cloudflare",model:"@cf/ibm-granite/granite-4.0-h-micro"};
  const result=await unifiedR33RunProvider(env,provider,[{role:"user",content:prompt}],1000);
  const parsed=unifiedR33ParseJson(result.text),confidence=Number(parsed.confidence||0);
  const unsupported=Array.isArray(parsed.unsupportedClaimIndexes)?parsed.unsupportedClaimIndexes.filter(Number.isInteger).slice(0,16):[];
  return {ok:parsed.status==="PASS"&&confidence>=0.85&&!unsupported.length,confidence,unsupported,rationale:String(parsed.rationale||"").slice(0,1600),result};
}
async function unifiedR33RepairMapping(env,finalArticle,handoffEntry,candidates,previous={}) {
  const previousReason=String(previous.reason||"NEEDS_CHAT_REVIEW");
  const excluded=new Set();
  if(previous.sourceId)excluded.add(String(previous.sourceId));
  const priorClaims=Array.isArray(previous.claims)?previous.claims:[];
  for(const index of Array.isArray(previous.unsupported)?previous.unsupported:[]){
    const claim=priorClaims[index];
    if(claim&&claim.sourceId)excluded.add(String(claim.sourceId));
  }
  const usable=(candidates||[]).filter(candidate=>!excluded.has(candidate.sourceId)).slice(0,16);
  if(!usable.length)return {ok:false,reason:previousReason};
  const packet=unifiedR33SourcePacket(usable);
  const prompt=[
    "MLS R33 QUARANTINE REPAIR MAPPER v1.",
    "Return ONLY valid JSON. This is one bounded repair pass after a prior R33 failure.",
    "Previous failure: "+previousReason+".",
    excluded.size?"Do not reuse rejected sourceIds: "+[...excluded].join(", ")+".":"No sourceId is pre-excluded.",
    "Use only REGISTERED CANDIDATES. Never invent a sourceId, URL, quotation, page, locator, bibliographic fact, or source content.",
    "Enumerate every substantial externally verifiable assertion in ARTICLE. Choose a candidate only when its registered metadata makes the match credible.",
    "Every candidate has a registered safe canonical URL. Downstream R33 will fetch the actual text and fail closed unless every mapped claim is directly supported.",
    "If support is uncertain, return NEEDS_CHAT_REVIEW rather than guessing.",
    "Allowed claimType values: general, normative, orthography, regional_variation, historical.",
    "Source tiers: normative/orthography require A or B; regional_variation/historical require A, B or C; general permits A-D.",
    "Output: {status:'MATCH'|'NEEDS_CHAT_REVIEW',confidence:0..1,claims:[{sectionKey,summary,claimType,materiality:'substantial',sourceId,confidence,rationale}],rationale}.",
    "ARTICLE:\n"+String(finalArticle.articleMarkdown||"").slice(0,20000),
    "TITLE/PART/CHAPTER:\n"+[finalArticle.title,finalArticle.part,finalArticle.chapter].filter(Boolean).join(" | "),
    "R44 CLAIM HINTS:\n"+JSON.stringify(Array.isArray(handoffEntry.claims)?handoffEntry.claims:[]).slice(0,7000),
    "REGISTERED CANDIDATES:\n"+JSON.stringify(packet)
  ].join("\n\n");
  const provider={id:"cloudflare-r33-quarantine-repair",kind:"cloudflare",model:"@cf/ibm-granite/granite-4.0-h-micro"};
  let matcher;
  try{
    matcher=await unifiedR33RunProvider(env,provider,[{role:"user",content:prompt}],2000);
  }catch(error){
    if(error.unifiedStatus)return {ok:false,fatal:error};
    throw error;
  }
  let parsed;
  try{parsed=unifiedR33ParseJson(matcher.text)}catch(error){
    if(String(error&&error.message||"")==="UNIFIED_R33_DRAFT_JSON_INVALID")return {ok:false,reason:"UNIFIED_R33_DRAFT_JSON_INVALID"};
    throw error;
  }
  const claimSet=unifiedR33ValidateClaimSet(parsed,usable);
  if(!claimSet.ok)return {ok:false,reason:claimSet.reason,confidence:claimSet.confidence??Number(parsed.confidence||0),rationale:String(parsed.rationale||"")};
  let support;
  try{support=await unifiedR33SourceSupportAudit(env,claimSet.claims,usable)}
  catch(error){if(error.unifiedStatus)return {ok:false,fatal:error};throw error}
  if(!support.ok)return {ok:false,reason:support.reason||"SOURCE_SUPPORT_AUDIT_REJECTED",confidence:support.confidence??null,sourceId:support.sourceId||null,unsupported:support.unsupported||[],claims:claimSet.claims,rationale:support.rationale||""};
  let coverage;
  try{coverage=await unifiedR33CoverageAudit(env,finalArticle,claimSet.claims,packet)}
  catch(error){if(error.unifiedStatus)return {ok:false,fatal:error};throw error}
  if(!coverage.ok)return {ok:false,reason:"COVERAGE_AUDIT_REJECTED",confidence:coverage.confidence,unsupported:coverage.unsupported||[],claims:claimSet.claims,rationale:coverage.rationale||""};
  return {ok:true,candidates:usable,packet,matcher,claimSet,support,coverage};
}
async function unifiedR33CoverageAudit(env,finalArticle,claims,sourcePacket) {
  const prompt=[
    "MLS R33 CLAIM-COVERAGE AUDITOR v2.",
    "Return ONLY JSON.",
    "Your job is to reject incomplete Evidence. Read the entire ARTICLE and the proposed CLAIMS.",
    "PASS only if every substantial externally verifiable linguistic, grammatical, orthographic, historical, regional, or normative assertion in the article is represented by a proposed claim, and every proposed claim has a bibliographically plausible registered source.",
    "Do not count illustrative examples, headings, navigation links, or purely pedagogical phrasing as separate substantial claims unless they assert an independently checkable rule.",
    "If a substantial assertion is missing, ambiguous, overbroad, or its selected source metadata is not plausibly on-topic, return NEEDS_CHAT_REVIEW.",
    "You have only source metadata, not full source text. If metadata is insufficient to justify a source-to-claim match, reject rather than guess.",
    "Output keys: status (PASS or NEEDS_CHAT_REVIEW), confidence 0..1, missingClaims array of short summaries, unsupportedClaimIndexes array of zero-based indexes, rationale.",
    "ARTICLE:\n"+String(finalArticle.articleMarkdown||"").slice(0,20000),
    "PROPOSED CLAIMS:\n"+JSON.stringify(claims.map((c,i)=>({index:i,sectionKey:c.sectionKey,summary:c.summary,claimType:c.claimType,sourceId:c.sourceId,confidence:c.confidence}))),
    "REGISTERED SOURCE METADATA:\n"+JSON.stringify(sourcePacket)
  ].join("\n\n");
  const provider={id:"cloudflare-r33-coverage-auditor",kind:"cloudflare",model:"@cf/ibm-granite/granite-4.0-h-micro"};
  const result=await unifiedR33RunProvider(env,provider,[{role:"user",content:prompt}],1100);
  const parsed=unifiedR33ParseJson(result.text);
  const confidence=Number(parsed.confidence||0);
  const missing=Array.isArray(parsed.missingClaims)?parsed.missingClaims.filter(Boolean).slice(0,12):[];
  const unsupported=Array.isArray(parsed.unsupportedClaimIndexes)?parsed.unsupportedClaimIndexes.filter(Number.isInteger).slice(0,16):[];
  return {
    ok:parsed.status==="PASS"&&confidence>=0.82&&!missing.length&&!unsupported.length,
    confidence,
    missing,
    unsupported,
    rationale:String(parsed.rationale||"").slice(0,1600),
    result
  };
}
function unifiedR33EvidenceObject(args) {
  const {code,contentPath,finalArticle,claimSet,matcher,support,coverage,runId,currentEvidenceRevision}=args;
  const now=new Date().toISOString(),temp=code.replace(/[^A-Z0-9]/g,"");
  const claims=claimSet.claims.map((claim,index)=>({
    claimId:"MLS-CLM-TEMP-"+temp+"-"+String(index+1).padStart(2,"0"),
    sectionKey:claim.sectionKey,
    summary:claim.summary,
    claimType:claim.claimType,
    materiality:"substantial"
  }));
  const links=claimSet.claims.map((claim,index)=>({
    linkId:"MLS-LNK-TEMP-"+temp+"-"+String(index+1).padStart(2,"0"),
    claimId:claims[index].claimId,
    sourceId:claim.sourceId,
    supportType:"supports",
    locator:{},
    notes:claim.rationale||null,
    verificationMethod:"automated_registered_source_fulltext_match_v3"
  }));
  return {
    schemaVersion:"1.0",architecture:"github-native",code,
    language:String(finalArticle.language||""),languageName:String(finalArticle.languageName||finalArticle.language||""),
    contentPath,article:{},evidenceVersion:"1.0",evidenceRevision:Math.max(0,Number(currentEvidenceRevision||0))+1,status:"VERIFIED",
    claims,links,conflicts:[],
    verification:{
      verifiedAt:now,reviewerType:"system",reviewer:"MLS Unified Cloudflare Runner",
      verificationMethod:"automated_registered_source_fulltext_match_v4_repair",evidenceSnapshotHash:"pending-preflight",runId
    },
    review:null,
    provenance:{
      generatedWithAI:true,
      model:[matcher.model,support.result&&support.result.model,coverage.result.model].filter(Boolean).join(" + "),
      promptVersion:"R33-Unified-CF-4-Repair",runId,sourceOfTruth:"github",updatedAt:now
    }
  };
}
async function unifiedRunnerR33Draft(request,env,ctx,preparedOnly=false) {
  const auth=await unifiedRunnerAuthorize(request,env,ctx);
  if(!auth.ok) return r44Json({error:auth.error},auth.status);
  const runner=await unifiedRunnerRead(env);
  if(runner.state!=="RUNNING") return r44Json({error:"UNIFIED_RUNNER_NOT_RUNNING",state:runner.state},409);
  const body=await r44ChatBridgeBody(request);
  const prepared=await canonicalPrepared(env,body);
  if(prepared)return r44Json({...prepared,preparedByRunner:true});
  // A drain request must never call AI again, including when its context has drifted.
  if(preparedOnly||body.preparedOnly===true)return r44Json({ok:true,status:'NEEDS_CHAT_REVIEW',code:body.code,reason:'PREPARED_CONTEXT_MISMATCH_OR_MISSING'},200);
  return unifiedR33BuildDraft(env,body);
}
async function unifiedR33BuildDraft(env,body) {
  const article=body.article,handoffEntry=body.handoffEntry || {};
  const code=String(body.code || article && article.code || "").toUpperCase();
  const contentPath=String(body.contentPath || "");
  if(!/^MLS-V\d{2}-\d{4}$/.test(code)||!contentPath.startsWith("content/")) return r44Json({error:"UNIFIED_R33_DRAFT_SCOPE_INVALID"},400);
  if(String(article && article.code || "").toUpperCase()!==code) return r44Json({error:"UNIFIED_R33_DRAFT_CODE_MISMATCH"},400);
  const finalArticle=unifiedR33ReconcileArticle(article,handoffEntry);
  const registeredCandidates=unifiedR33SourceCandidates(finalArticle,handoffEntry);
  if(!registeredCandidates.length)return r44Json({ok:true,status:"NEEDS_CHAT_REVIEW",code,reason:"NO_REGISTERED_SOURCE_CANDIDATE"},200);
  const autoCandidates=unifiedR33SourceCandidates(finalArticle,handoffEntry,{autoAuditableOnly:true});
  const repairCandidates=unifiedR33SourceCandidates(finalArticle,handoffEntry,{repairUrlOnly:true});
  let candidates=autoCandidates.length?autoCandidates:repairCandidates;
  if(!candidates.length)return r44Json({ok:true,status:"NEEDS_CHAT_REVIEW",code,reason:"SOURCE_NO_AUDITABLE_REGISTERED_CANDIDATE"},200);

  let packet=unifiedR33SourcePacket(candidates);
  const prompt=[
    "MLS R33 REGISTERED-SOURCE CLAIM MAPPER v3.",
    "Return ONLY JSON. Never invent a sourceId, URL, quotation, page, locator, bibliographic fact, or source content.",
    "Enumerate ALL substantial externally verifiable claims actually asserted by ARTICLE. Do not omit a claim merely because no source fits.",
    "For EACH substantial claim, choose one sourceId from CANDIDATES only when the source metadata makes the match credible.",
    "Every candidate below has a registered safe URL or is in the established auto-auditable class. R33 will fetch actual source text before approval.",
    "If even one substantial claim cannot be credibly mapped, return NEEDS_CHAT_REVIEW.",
    "Do not create quotation claims. Do not treat illustrative examples or navigation links as independent substantial claims unless they assert a rule.",
    "Allowed claimType values: general, normative, orthography, regional_variation, historical.",
    "Source tiers: normative/orthography require A or B; regional_variation/historical require A, B or C; general permits A-D.",
    "Output: {status:'MATCH'|'NEEDS_CHAT_REVIEW',confidence:0..1,claims:[{sectionKey,summary,claimType,materiality:'substantial',sourceId,confidence,rationale}],rationale}.",
    "ARTICLE:\n"+String(finalArticle.articleMarkdown||"").slice(0,20000),
    "TITLE/PART/CHAPTER:\n"+[finalArticle.title,finalArticle.part,finalArticle.chapter].filter(Boolean).join(" | "),
    "R44 CLAIM HINTS:\n"+JSON.stringify(Array.isArray(handoffEntry.claims)?handoffEntry.claims:[]).slice(0,7000),
    "REGISTERED CANDIDATES:\n"+JSON.stringify(packet)
  ].join("\n\n");
  const provider={id:"cloudflare-r33-claim-mapper",kind:"cloudflare",model:"@cf/ibm-granite/granite-4.0-h-micro"};
  let matcher;
  try{
    matcher=await unifiedR33RunProvider(env,provider,[{role:"user",content:prompt}],2000);
  }catch(error){
    if(error.unifiedStatus)return r44Json({error:error.unifiedStatus,message:error.message},error.unifiedStatus==="QUOTA_PAUSED"?429:409);
    throw error;
  }
  let parsed,claimSet;
  try{
    parsed=unifiedR33ParseJson(matcher.text);
    claimSet=unifiedR33ValidateClaimSet(parsed,candidates);
  }catch(error){
    if(String(error&&error.message||"")==="UNIFIED_R33_DRAFT_JSON_INVALID")claimSet={ok:false,reason:"UNIFIED_R33_DRAFT_JSON_INVALID",confidence:0};
    else throw error;
  }

  let support=null,coverage=null;
  const applyRepair=repaired=>{
    candidates=repaired.candidates;packet=repaired.packet;matcher=repaired.matcher;
    claimSet=repaired.claimSet;support=repaired.support;coverage=repaired.coverage;
  };
  const fatalResponse=repaired=>repaired&&repaired.fatal?r44Json({error:repaired.fatal.unifiedStatus,message:repaired.fatal.message},repaired.fatal.unifiedStatus==="QUOTA_PAUSED"?429:409):null;

  if(!claimSet.ok){
    const repaired=await unifiedR33RepairMapping(env,finalArticle,handoffEntry,repairCandidates,{reason:claimSet.reason});
    const fatal=fatalResponse(repaired);if(fatal)return fatal;
    if(!repaired.ok){
      return r44Json({ok:true,status:"NEEDS_CHAT_REVIEW",code,reason:repaired.reason||claimSet.reason,
        confidence:repaired.confidence??claimSet.confidence??Number(parsed&&parsed.confidence||0),rationale:repaired.rationale||String(parsed&&parsed.rationale||"")},200);
    }
    applyRepair(repaired);
  }

  if(!support){
    try{support=await unifiedR33SourceSupportAudit(env,claimSet.claims,candidates)}
    catch(error){if(error.unifiedStatus)return r44Json({error:error.unifiedStatus,message:error.message},error.unifiedStatus==="QUOTA_PAUSED"?429:409);throw error}
  }
  if(!support.ok){
    const repaired=await unifiedR33RepairMapping(env,finalArticle,handoffEntry,repairCandidates,{
      reason:support.reason||"SOURCE_SUPPORT_AUDIT_REJECTED",sourceId:support.sourceId||null,
      unsupported:support.unsupported||[],claims:claimSet.claims
    });
    const fatal=fatalResponse(repaired);if(fatal)return fatal;
    if(!repaired.ok){
      return r44Json({ok:true,status:"NEEDS_CHAT_REVIEW",code,reason:repaired.reason||support.reason||"SOURCE_SUPPORT_AUDIT_REJECTED",
        confidence:repaired.confidence??support.confidence??null,sourceId:repaired.sourceId||support.sourceId||null,
        unsupportedClaimIndexes:repaired.unsupported||support.unsupported||[],rationale:repaired.rationale||support.rationale||""},200);
    }
    applyRepair(repaired);
  }

  if(!coverage){
    try{coverage=await unifiedR33CoverageAudit(env,finalArticle,claimSet.claims,packet)}
    catch(error){if(error.unifiedStatus)return r44Json({error:error.unifiedStatus,message:error.message},error.unifiedStatus==="QUOTA_PAUSED"?429:409);throw error}
  }
  if(!coverage.ok){
    const repaired=await unifiedR33RepairMapping(env,finalArticle,handoffEntry,repairCandidates,{
      reason:"COVERAGE_AUDIT_REJECTED",unsupported:coverage.unsupported||[],claims:claimSet.claims
    });
    const fatal=fatalResponse(repaired);if(fatal)return fatal;
    if(!repaired.ok){
      return r44Json({ok:true,status:"NEEDS_CHAT_REVIEW",code,reason:repaired.reason||"COVERAGE_AUDIT_REJECTED",
        confidence:repaired.confidence??coverage.confidence,missingClaims:coverage.missing,
        unsupportedClaimIndexes:repaired.unsupported||coverage.unsupported||[],rationale:repaired.rationale||coverage.rationale||""},200);
    }
    applyRepair(repaired);
  }

  const runId=String(body.runId || "MLS-UNIFIED-WEB");
  const evidence=unifiedR33EvidenceObject({
    code,contentPath,finalArticle,claimSet,matcher,support,coverage,runId,currentEvidenceRevision:body.currentEvidenceRevision
  });
  const sources=[...new Set(claimSet.claims.map(x=>x.sourceId))].map(sourceId=>{
    const source=candidates.find(x=>x.sourceId===sourceId);
    return source?{sourceId,metadata:source.metadata}:null;
  }).filter(Boolean);
  return r44Json({
    ok:true,status:"MATCH",code,
    confidence:Math.min(claimSet.confidence,support.confidence,coverage.confidence),
    claimCount:claimSet.claims.length,sources,evidence,
    finalContent:String(handoffEntry.outcome||"").toUpperCase()==="CORRECTED"?finalArticle:null
  });
}

