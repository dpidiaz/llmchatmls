var MLS_R33_REPAIR_SCHEMA="1";
var MLS_R33_REPAIR_REASONS=new Set([
  "NO_REGISTERED_SOURCE_CANDIDATE",
  "SOURCE_FULLTEXT_REQUIRED",
  "SOURCE_URL_UNAVAILABLE",
  "SOURCE_NO_AUDITABLE_REGISTERED_CANDIDATE",
  "SOURCE_CONTENT_TYPE_UNSUPPORTED",
  "SOURCE_TEXT_TOO_SHORT",
  "SOURCE_FETCH_HTTP_403",
  "SOURCE_FETCH_HTTP_404",
  "SOURCE_SUPPORT_AUDIT_REJECTED",
  "MATCHER_REQUESTED_REVIEW"
]);
async function unifiedR33RepairEnsure(env){
  await env.WIKI_DB.batch([
    env.WIKI_DB.prepare("CREATE TABLE IF NOT EXISTS mls_r33_repair_queue(code TEXT PRIMARY KEY,state TEXT NOT NULL DEFAULT 'PENDING',reason TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,lease_token TEXT,expires_ms INTEGER NOT NULL DEFAULT 0,last_error TEXT,last_source_id TEXT,updated_ms INTEGER NOT NULL DEFAULT 0)"),
    env.WIKI_DB.prepare("CREATE TABLE IF NOT EXISTS mls_r33_repair_sources(source_id TEXT PRIMARY KEY,code TEXT NOT NULL,source_json TEXT NOT NULL,source_sha256 TEXT NOT NULL,url TEXT NOT NULL,authority_tier TEXT NOT NULL,provenance_json TEXT NOT NULL,created_ms INTEGER NOT NULL,state TEXT NOT NULL DEFAULT 'ACTIVE')")
  ]);
}
function unifiedR33RepairNormalizeUrl(value){
  const raw=String(value||"").trim();if(!raw)return null;
  try{
    const u=new URL(raw);if(!["http:","https:"].includes(u.protocol))return null;
    const host=u.hostname.toLowerCase();
    if(host==="localhost"||host.endsWith(".local")||host==="::1"||host.startsWith("127.")||host.startsWith("10.")||host.startsWith("192.168.")||host.startsWith("169.254."))return null;
    const m=/^172\.(\d{1,3})\./.exec(host);if(m&&Number(m[1])>=16&&Number(m[1])<=31)return null;
    u.hash="";u.hostname=host;
    for(const k of [...u.searchParams.keys()])if(/^(utm_|fbclid$|gclid$|mc_cid$|mc_eid$)/i.test(k))u.searchParams.delete(k);
    u.searchParams.sort();if(u.pathname!=="/")u.pathname=u.pathname.replace(/\/+$/g,"");
    return u.toString();
  }catch{return null}
}
async function unifiedR33RepairSourceId(url){
  return "MLS-SRC-"+(await r44Sha256Text("url:"+url)).slice(0,20).toUpperCase();
}
function unifiedR33RepairDomainTier(url){
  let host="";try{host=new URL(url).hostname.toLowerCase()}catch{return "D"}
  const order={A:0,B:1,C:2,D:3},tiers=[];
  for(const source of Array.isArray(MLS_R33_SOURCE_CATALOG)?MLS_R33_SOURCE_CATALOG:[]){
    const m=source&&source.metadata||{};if(!m.canonicalUrl)continue;
    let h="";try{h=new URL(m.canonicalUrl).hostname.toLowerCase()}catch{continue}
    if(host===h||host.endsWith("."+h)||h.endsWith("."+host)){
      const t=String(m.authorityTier||"D").toUpperCase();if(Object.prototype.hasOwnProperty.call(order,t))tiers.push(t);
    }
  }
  if(!tiers.length)return "D";
  return tiers.sort((a,b)=>order[b]-order[a])[0];
}
async function unifiedR33RepairSources(env,code){
  if(!env||!env.WIKI_DB)return [];
  await unifiedR33RepairEnsure(env);
  const rows=await env.WIKI_DB.prepare("SELECT source_json FROM mls_r33_repair_sources WHERE code=? AND state='ACTIVE' ORDER BY created_ms,source_id").bind(String(code||"").toUpperCase()).all();
  return (rows.results||[]).map(r=>{try{return JSON.parse(r.source_json)}catch{return null}}).filter(Boolean);
}
async function unifiedR33RepairSeed(env){
  await unifiedR33RepairEnsure(env);
  const reasons=JSON.stringify([...MLS_R33_REPAIR_REASONS]);
  await env.WIKI_DB.prepare(`INSERT INTO mls_r33_repair_queue(code,state,reason,updated_ms)
    SELECT q.code,'PENDING',q.last_error,?1 FROM mls_canonical_queue q
    WHERE q.state='QUARANTINED' AND q.last_error IN (SELECT value FROM json_each(?2))
    ON CONFLICT(code) DO UPDATE SET
      reason=excluded.reason,
      state=CASE WHEN mls_r33_repair_queue.state='DONE' AND mls_r33_repair_queue.attempts<3 THEN 'PENDING' ELSE mls_r33_repair_queue.state END,
      updated_ms=excluded.updated_ms`).bind(Date.now(),reasons).run();
}
async function unifiedR33RepairClaim(env){
  await unifiedR33RepairSeed(env);
  const now=Date.now(),token=crypto.randomUUID();
  const row=await env.WIKI_DB.prepare(`UPDATE mls_r33_repair_queue SET state='LEASED',lease_token=?1,expires_ms=?2,attempts=attempts+1,updated_ms=?3
    WHERE code=(SELECT r.code FROM mls_r33_repair_queue r JOIN mls_canonical_queue q USING(code)
      WHERE q.state='QUARANTINED' AND r.attempts<3 AND (r.state IN ('PENDING','RETRY') OR (r.state='LEASED' AND r.expires_ms<=?3))
      ORDER BY r.attempts,r.code LIMIT 1)
    RETURNING *`).bind(token,now+10*60*1000,now).first();
  return row||null;
}
function unifiedR33RepairOverlap(articleText,sourceText){
  const a=unifiedR33Tokens(articleText),b=unifiedR33Tokens(sourceText);let n=0;
  for(const t of a)if(t.length>=4&&b.has(t))n++;
  return n;
}
async function unifiedR33RepairDiscover(env,input,reason){
  const article=input.article||{};
  const prompt=[
    "MLS R33 SOURCE REPAIR DISCOVERY v1.",
    "Return ONLY JSON. Suggest up to 4 direct public URLs that are likely to contain substantive full text supporting the article below.",
    "Prefer official language academies, government language institutes, universities, standards bodies, dictionaries/reference works, or other authoritative institutional pages.",
    "Never return product pages, bookstores, search-result pages, login pages, DOI landing pages without article text, or guessed URLs. If uncertain return NO_SAFE_SOURCE.",
    "Output {status:'CANDIDATES'|'NO_SAFE_SOURCE',candidates:[{url,title,sourceType,institution,publisher,language,topics:[...]}],rationale}.",
    "Allowed sourceType: institutional_webpage, reference_entry, report. These are the only automatically publishable APA source types in this lane.",
    "QUARANTINE REASON: "+String(reason||""),
    "ARTICLE TITLE/PART/CHAPTER: "+[article.title,article.part,article.chapter].filter(Boolean).join(" | "),
    "ARTICLE: "+String(article.articleMarkdown||"").slice(0,14000),
    "REGISTERED SOURCE HINTS: "+JSON.stringify(unifiedR33SourcePacket(unifiedR33SourceCandidates(article,input.handoffEntry||{}))).slice(0,12000)
  ].join("\n\n");
  const provider={id:"cloudflare-r33-source-repair-discovery",kind:"cloudflare",model:"@cf/ibm-granite/granite-4.0-h-micro"};
  const result=await unifiedR33RunProvider(env,provider,[{role:"user",content:prompt}],1200);
  const parsed=unifiedR33ParseJson(result.text);
  return {parsed,result};
}
async function unifiedR33RepairRegister(env,input,row,candidate,providerResult){
  const url=unifiedR33RepairNormalizeUrl(candidate&&candidate.url);if(!url)return {ok:false,reason:"REPAIR_URL_INVALID"};
  const sourceType=String(candidate&&candidate.sourceType||"institutional_webpage");
  if(!new Set(["institutional_webpage","reference_entry","report"]).has(sourceType))return {ok:false,reason:"REPAIR_TYPE_INVALID"};
  const sourceId=await unifiedR33RepairSourceId(url);
  const prior=await env.WIKI_DB.prepare("SELECT source_id FROM mls_r33_repair_sources WHERE code=? AND source_id=?").bind(row.code,sourceId).first();
  if(prior)return {ok:false,reason:"REPAIR_SOURCE_ALREADY_TRIED"};
  const language=unifiedR33LanguageCode(input.article&&input.article.language)||String(candidate&&candidate.language||"");
  const host=new URL(url).hostname.toLowerCase();
  const metadata={
    sourceType,authorityTier:unifiedR33RepairDomainTier(url),status:"active",
    title:String(candidate&&candidate.title||"").trim(),authors:[],
    institution:host,publisher:null,
    canonicalUrl:url,language:language||null,
    topics:[input.article&&input.article.title,input.article&&input.article.part,input.article&&input.article.chapter].filter(Boolean).slice(0,16),
    accessedAt:new Date().toISOString().slice(0,10)
  };
  if(!metadata.title)return {ok:false,reason:"REPAIR_TITLE_MISSING"};
  if(sourceType==="reference_entry")metadata.containerTitle=metadata.publisher||metadata.institution||metadata.title;
  const source={schemaVersion:"1.0",sourceId,metadata};
  const doc=await unifiedR33FetchSourceDocument(source);
  if(!doc.ok)return {ok:false,reason:doc.reason||"REPAIR_FETCH_REJECTED"};
  const docTokens=unifiedR33Tokens(doc.text),titleTokens=[...unifiedR33Tokens(metadata.title)].filter(t=>t.length>=4);
  if(titleTokens.length&&titleTokens.filter(t=>docTokens.has(t)).length<Math.min(2,titleTokens.length))return {ok:false,reason:"REPAIR_TITLE_NOT_IN_SOURCE"};
  const articleText=[input.article&&input.article.title,input.article&&input.article.part,input.article&&input.article.chapter,input.article&&input.article.articleMarkdown].filter(Boolean).join(" ");
  if(unifiedR33RepairOverlap(articleText,doc.text)<3)return {ok:false,reason:"REPAIR_RELEVANCE_TOO_LOW"};
  const sourceJson=JSON.stringify(source),sha=await r44Sha256Text(sourceJson);
  const provenance=JSON.stringify({schema:"MLS-R33-REPAIR-SOURCE-1",code:row.code,reason:row.reason,provider:providerResult&&providerResult.model||null,discoveredAt:new Date().toISOString(),validatedBy:"live-fulltext-fetch+token-overlap"});
  await env.WIKI_DB.prepare("INSERT INTO mls_r33_repair_sources(source_id,code,source_json,source_sha256,url,authority_tier,provenance_json,created_ms,state) VALUES(?,?,?,?,?,?,?,?, 'ACTIVE') ON CONFLICT(source_id) DO UPDATE SET source_json=excluded.source_json,source_sha256=excluded.source_sha256,provenance_json=excluded.provenance_json,state='ACTIVE'")
    .bind(sourceId,row.code,sourceJson,sha,url,metadata.authorityTier,provenance,Date.now()).run();
  const baseHash=await canonicalInputHash(input);
  const staticContext=await r44Sha256Text(r44Stable(unifiedR33CanonicalContext(input)));
  const overlays=await unifiedR33RepairSources(env,row.code);
  const overlayHash=await r44Sha256Text(r44Stable(overlays.map(x=>({sourceId:x.sourceId,metadata:x.metadata}))));
  const contextHash=baseHash+":"+staticContext+":"+overlayHash;
  await env.WIKI_DB.batch([
    env.WIKI_DB.prepare("UPDATE mls_canonical_recovery SET context_hash=? WHERE code=?").bind(contextHash,row.code),
    env.WIKI_DB.prepare("UPDATE mls_r33_repair_queue SET state='DONE',lease_token=NULL,expires_ms=0,last_error=NULL,last_source_id=?,updated_ms=? WHERE code=? AND lease_token=?").bind(sourceId,Date.now(),row.code,row.lease_token)
  ]);
  return {ok:true,status:"REPAIR_SOURCE_REGISTERED",code:row.code,sourceId,url,authorityTier:metadata.authorityTier};
}
async function unifiedR33RepairStep(env){
  const row=await unifiedR33RepairClaim(env);if(!row)return {status:"NO_REPAIR_WORK"};
  try{
    const q=await env.WIKI_DB.prepare("SELECT code,page,revision,input_hash FROM mls_canonical_queue WHERE code=? AND state='QUARANTINED'").bind(row.code).first();
    if(!q)throw Error("REPAIR_CANONICAL_ROW_MISSING");
    const packet=await canonicalPacket(env,q),item=(packet||[]).find(x=>x.input&&x.input.code===row.code&&x.inputHash===q.input_hash);
    if(!item||await canonicalInputHash(item.input)!==q.input_hash)throw Error("REPAIR_CONTEXT_MISMATCH");
    const discovered=await unifiedR33RepairDiscover(env,item.input,row.reason);
    const candidates=Array.isArray(discovered.parsed&&discovered.parsed.candidates)?discovered.parsed.candidates.slice(0,4):[];
    for(const candidate of candidates){
      const saved=await unifiedR33RepairRegister(env,item.input,row,candidate,discovered.result);
      if(saved.ok)return saved;
    }
    await env.WIKI_DB.prepare("UPDATE mls_r33_repair_queue SET state=CASE WHEN attempts<3 THEN 'RETRY' ELSE 'BLOCKED' END,lease_token=NULL,expires_ms=0,last_error=?,updated_ms=? WHERE code=? AND lease_token=?")
      .bind(candidates.length?"REPAIR_NO_VALIDATED_SOURCE":"REPAIR_NO_SAFE_SOURCE",Date.now(),row.code,row.lease_token).run();
    return {status:candidates.length?"REPAIR_NO_VALIDATED_SOURCE":"REPAIR_NO_SAFE_SOURCE",code:row.code};
  }catch(error){
    const message=wikiErrorMessage(error);
    const quota=(typeof WorkersQuotaExceededError!=="undefined"&&error instanceof WorkersQuotaExceededError)||workersAiFailureKind(message)==="quota";
    const paid=(typeof ZeroCostPolicyError!=="undefined"&&error instanceof ZeroCostPolicyError)||workersAiFailureKind(message)==="paid";
    await env.WIKI_DB.prepare("UPDATE mls_r33_repair_queue SET state=CASE WHEN ?1 THEN 'RETRY' ELSE 'BLOCKED' END,lease_token=NULL,expires_ms=0,last_error=?2,updated_ms=?3 WHERE code=?4 AND lease_token=?5")
      .bind(quota?1:0,message,Date.now(),row.code,row.lease_token).run();
    if(quota||paid)throw error;
    return {status:"REPAIR_BLOCKED",code:row.code,error:message};
  }
}
async function unifiedR33RepairStatus(env){
  await unifiedR33RepairEnsure(env);await unifiedR33RepairSeed(env);
  const rows=await env.WIKI_DB.prepare("SELECT state,COUNT(*) n FROM mls_r33_repair_queue GROUP BY state").all();
  const sources=await env.WIKI_DB.prepare("SELECT COUNT(*) n FROM mls_r33_repair_sources WHERE state='ACTIVE'").first();
  return {counts:Object.fromEntries((rows.results||[]).map(r=>[r.state,Number(r.n)])),registeredSources:Number(sources&&sources.n||0)};
}
