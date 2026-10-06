"use strict";

// Explicit semantic versions, not a deployment/global-catalog hash. Bump only
// when the corresponding R33 behavior materially changes. Candidate fingerprints
// ensure unrelated source-catalog edits do not reopen every entry.
var MLS_CANONICAL_R33_POLICY={claims:1,support:1,coverage:1};
function unifiedR33CanonicalContext(body) {
  const article=unifiedR33ReconcileArticle(body.article,body.handoffEntry||{});
  const candidates=unifiedR33SourceCandidates(article,body.handoffEntry||{},{autoAuditableOnly:true});
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
  const fetchable=candidates.filter(candidate=>!!(candidate&&candidate.fetchUrl));
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
function unifiedR33DoiSourceUrl(value) {
  const doi=String(value||"").trim().replace(/^https?:\/\/(?:dx\.)?doi\.org\//i,"").replace(/^doi:\s*/i,"");
  if(!/^10\.\d{4,9}\/.+/.test(doi))return null;
  return unifiedR33SafeSourceUrl("https://doi.org/"+doi);
}
function unifiedR33HandoffSourceUrl(entry,sourceId) {
  const wanted=String(sourceId||"").toUpperCase();
  for(const row of (Array.isArray(entry&&entry.sources)?entry.sources:[])){
    if(!row||typeof row!=="object"||String(row.sourceId||"").toUpperCase()!==wanted)continue;
    const url=unifiedR33SafeSourceUrl(row.canonicalUrl||row.url);
    if(url)return url;
  }
  return null;
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
  const catalog=[...(Array.isArray(MLS_R33_SOURCE_CATALOG)?MLS_R33_SOURCE_CATALOG:[]),...(Array.isArray(options.extraCatalog)?options.extraCatalog:[])];
  const ranked=catalog.map(raw=>{
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
    const sourceId=String(raw.sourceId||"");
    const title=unifiedR33NormalizeText(m.title);
    const url=unifiedR33NormalizeText(m.canonicalUrl);
    if(title && handoffText.includes(title)) score+=160;
    if(url && handoffText.includes(url)) score+=220;
    if(raw.sourceId && handoffText.includes(unifiedR33NormalizeText(raw.sourceId))) score+=500;
    const registeredUrl=unifiedR33SafeSourceUrl(m.canonicalUrl);
    const handoffUrl=unifiedR33HandoffSourceUrl(handoffEntry,sourceId);
    const doiUrl=unifiedR33DoiSourceUrl(m.doi);
    const fetchUrl=registeredUrl||handoffUrl||doiUrl||null;
    const fetchLocatorSource=registeredUrl?"registry":handoffUrl?"handoff":doiUrl?"doi":null;
    if(fetchUrl)score+=8;
    return {sourceId,metadata:m,score,repairValidatedFulltext:raw&&raw.repairValidatedFulltext===true,repairPublishRequired:raw&&raw.repairPublishRequired!==false,fetchUrl,fetchLocatorSource};
  }).filter(Boolean);
  const eligible=options.autoAuditableOnly?ranked.filter(unifiedR33SourceAutoAuditable):ranked;
  return eligible.sort((a,b)=>b.score-a.score||a.sourceId.localeCompare(b.sourceId)).slice(0,16);
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
function unifiedR33SourceAutoAuditable(candidate) {
  const metadata=candidate&&candidate.metadata||{};
  const type=String(metadata.sourceType||"");
  const autoTypes=new Set(["institutional_webpage","reference_entry","standard","report","dataset"]);
  return (autoTypes.has(type)||candidate&&candidate.repairValidatedFulltext===true)&&!!unifiedR33SafeSourceUrl(candidate&&candidate.fetchUrl);
}
function unifiedR33SourcePacket(candidates) {
  return candidates.map(x=>({
    sourceId:x.sourceId,authorityTier:x.metadata.authorityTier,sourceType:x.metadata.sourceType,
    title:x.metadata.title,authors:x.metadata.authors||[],institution:x.metadata.institution||null,
    publicationYear:x.metadata.publicationYear||null,canonicalUrl:x.metadata.canonicalUrl||null,
    topics:x.metadata.topics||[],score:x.score,fetchable:!!x.fetchUrl,
    verificationUrl:x.fetchUrl||null,verificationLocatorSource:x.fetchLocatorSource||null
  }));
}
function unifiedR33AllowedTier(claimType,tier) {
  const type=String(claimType||"general"),t=String(tier||"").toUpperCase();
  if(type==="normative"||type==="orthography")return t==="A"||t==="B";
  if(type==="regional_variation"||type==="historical")return t==="A"||t==="B"||t==="C";
  return t==="A"||t==="B"||t==="C"||t==="D";
}
function unifiedR33ClaimSourceOverlap(summary,candidate) {
  const claimTokens=unifiedR33Tokens(summary);
  const metadata=candidate&&candidate.metadata||{};
  const sourceTokens=unifiedR33Tokens([
    metadata.title,(metadata.topics||[]).join(" "),metadata.institution,
    (metadata.authors||[]).join(" ")
  ].filter(Boolean).join(" "));
  let overlap=0;
  for(const token of claimTokens)if(token.length>=4&&sourceTokens.has(token))overlap++;
  return overlap;
}
function unifiedR33TierEligibleSource(claimType,selected,candidates,summary) {
  return candidates
    .filter(candidate=>candidate&&candidate.sourceId!==selected.sourceId&&unifiedR33AllowedTier(claimType,candidate.metadata&&candidate.metadata.authorityTier))
    .map(candidate=>({candidate,overlap:unifiedR33ClaimSourceOverlap(summary,candidate)}))
    .filter(row=>row.overlap>=2)
    .sort((a,b)=>b.overlap-a.overlap||Number(b.candidate.score||0)-Number(a.candidate.score||0)||a.candidate.sourceId.localeCompare(b.candidate.sourceId))[0]?.candidate||null;
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
    let selected=candidates.find(x=>x.sourceId===String(item.sourceId||""));
    if(!summary||normalized.length<12||seen.has(normalized))return {ok:false,reason:"CLAIM_SUMMARY_INVALID",claimIndex:i};
    if(!allowedTypes.has(claimType))return {ok:false,reason:"CLAIM_TYPE_INVALID",claimIndex:i};
    if(!selected)return {ok:false,reason:"CLAIM_SOURCE_NOT_REGISTERED",claimIndex:i};
    if(!unifiedR33AllowedTier(claimType,selected.metadata.authorityTier)){
      const stronger=unifiedR33TierEligibleSource(claimType,selected,candidates,summary);
      if(!stronger)return {ok:false,reason:"CLAIM_SOURCE_TIER_INVALID",claimIndex:i};
      selected=stronger;
    }
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
  const type=String(metadata.sourceType||"");
  const url=candidate&&candidate.fetchUrl||unifiedR33SafeSourceUrl(metadata.canonicalUrl)||unifiedR33DoiSourceUrl(metadata.doi);
  if(!url){
    const bibliographicOnly=new Set(["book","book_chapter","journal_article","thesis","other"]);
    return {ok:false,reason:bibliographicOnly.has(type)?"SOURCE_FULLTEXT_REQUIRED":"SOURCE_URL_UNAVAILABLE",sourceId:candidate.sourceId};
  }
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
      verificationMethod:"automated_registered_source_fulltext_match_v3",evidenceSnapshotHash:"pending-preflight",runId
    },
    review:null,
    provenance:{
      generatedWithAI:true,
      model:[matcher.model,support.result&&support.result.model,coverage.result.model].filter(Boolean).join(" + "),
      promptVersion:"R33-Unified-CF-3",runId,sourceOfTruth:"github",updatedAt:now
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
  const repairCatalog=await unifiedR33RepairSources(env,code);
  const registeredCandidates=unifiedR33SourceCandidates(finalArticle,handoffEntry,{extraCatalog:repairCatalog});
  if(!registeredCandidates.length)return r44Json({ok:true,status:"NEEDS_CHAT_REVIEW",code,reason:"NO_REGISTERED_SOURCE_CANDIDATE"},200);
  const candidates=unifiedR33SourceCandidates(finalArticle,handoffEntry,{autoAuditableOnly:true,extraCatalog:repairCatalog});
  if(!candidates.length)return r44Json({ok:true,status:"NEEDS_CHAT_REVIEW",code,reason:"SOURCE_NO_AUDITABLE_REGISTERED_CANDIDATE"},200);

  const packet=unifiedR33SourcePacket(candidates);
  const prompt=[
    "MLS R33 REGISTERED-SOURCE CLAIM MAPPER v2.",
    "Return ONLY JSON. Never invent a sourceId, URL, quotation, page, locator, bibliographic fact, or source content.",
    "Enumerate ALL substantial externally verifiable claims actually asserted by ARTICLE. Do not omit a claim merely because no source fits.",
    "For EACH substantial claim, choose one sourceId from CANDIDATES only when the source metadata makes the match credible.",
    "Every candidate below has a safe verification URL; R33 fetches its actual text before accepting support. Do not infer support from metadata or sources outside CANDIDATES.",
    "When candidates are comparably authoritative and relevant, prefer fetchable:true. Never sacrifice authority tier or topical fit merely for fetchability.",
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
  const parsed=unifiedR33ParseJson(matcher.text);
  const claimSet=unifiedR33ValidateClaimSet(parsed,candidates);
  if(!claimSet.ok){
    return r44Json({
      ok:true,status:"NEEDS_CHAT_REVIEW",code,reason:claimSet.reason,
      confidence:claimSet.confidence??Number(parsed.confidence||0),rationale:String(parsed.rationale||"")
    },200);
  }

  let support;
  try{
    support=await unifiedR33SourceSupportAudit(env,claimSet.claims,candidates);
  }catch(error){
    if(error.unifiedStatus)return r44Json({error:error.unifiedStatus,message:error.message},error.unifiedStatus==="QUOTA_PAUSED"?429:409);
    throw error;
  }
  if(!support.ok){
    return r44Json({
      ok:true,status:"NEEDS_CHAT_REVIEW",code,reason:support.reason||"SOURCE_SUPPORT_AUDIT_REJECTED",
      confidence:support.confidence??null,sourceId:support.sourceId||null,
      unsupportedClaimIndexes:support.unsupported||[],rationale:support.rationale||""
    },200);
  }

  let coverage;
  try{
    coverage=await unifiedR33CoverageAudit(env,finalArticle,claimSet.claims,packet);
  }catch(error){
    if(error.unifiedStatus)return r44Json({error:error.unifiedStatus,message:error.message},error.unifiedStatus==="QUOTA_PAUSED"?429:409);
    throw error;
  }
  if(!coverage.ok){
    return r44Json({
      ok:true,status:"NEEDS_CHAT_REVIEW",code,reason:"COVERAGE_AUDIT_REJECTED",
      confidence:coverage.confidence,missingClaims:coverage.missing,
      unsupportedClaimIndexes:coverage.unsupported,rationale:coverage.rationale
    },200);
  }

  const runId=String(body.runId || "MLS-UNIFIED-WEB");
  const evidence=unifiedR33EvidenceObject({
    code,contentPath,finalArticle,claimSet,matcher,support,coverage,runId,currentEvidenceRevision:body.currentEvidenceRevision
  });
  const sources=[...new Set(claimSet.claims.map(x=>x.sourceId))].map(sourceId=>{
    const source=candidates.find(x=>x.sourceId===sourceId);
    return source?{sourceId,metadata:source.metadata}:null;
  }).filter(Boolean);
  const repairIds=new Set(repairCatalog.filter(x=>x&&x.repairPublishRequired!==false).map(x=>String(x.sourceId||"")));
  const repairSources=sources.filter(x=>repairIds.has(String(x.sourceId||"")));
  return r44Json({
    ok:true,status:"MATCH",code,
    confidence:Math.min(claimSet.confidence,support.confidence,coverage.confidence),
    claimCount:claimSet.claims.length,sources,evidence,repairSources,
    finalContent:String(handoffEntry.outcome||"").toUpperCase()==="CORRECTED"?finalArticle:null
  });
}
