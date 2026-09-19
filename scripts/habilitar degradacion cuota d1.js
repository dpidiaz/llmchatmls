'use strict';

const fs=require('node:fs');

const TARGET='src/index.js';
const MARKER='// MLS D1 QUOTA GRACEFUL DEGRADATION 1.2';

function patchD1QuotaGuard(source){
  source=String(source);
  if(source.includes(MARKER)) return source;

  const pattern=/async function handleWikiApi\(request, env, url\) \{\n\s*await ensureWikiDb\(env\);/;
  if(!pattern.test(source)) throw new Error('No se encontró handleWikiApi con bootstrap D1 para instalar degradación por cuota.');

  const helper=`
${MARKER}
function d1DailyQuotaType(error) {
  const message=String(error?.message||error||'').toLowerCase();
  if(message.includes("exceeded d1's free tier daily row write limit") ||
    message.includes('d1 free tier daily row write limit') ||
    message.includes('daily row write limit')) return "write";
  if(message.includes("exceeded d1's free tier daily row read limit") ||
    message.includes('d1 free tier daily row read limit') ||
    message.includes('daily row read limit')) return "read";
  return null;
}
__name(d1DailyQuotaType, "d1DailyQuotaType");
function nextUtcResetIso(now=new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate()+1)).toISOString();
}
__name(nextUtcResetIso, "nextUtcResetIso");
async function d1QuotaResponse(env,url,quotaType="read") {
  let budget=null;
  try{budget=await wikiStore(env).getCloudflareBudget();}catch{}
  const normalizedQuotaType=quotaType==="write"?"write":"read";
  const quotaLabel=normalizedQuotaType==="write"?"rows written":"rows read";
  const resetAt=nextUtcResetIso();
  const base={
    ok:false,
    service:"MASTER LANGUAGE SYSTEM — Enciclopedia bajo demanda",
    revision:32,
    promptVersion:WIKI_PROMPT_VERSION,
    totalEntries:WIKI_TOTAL_ENTRIES,
    degraded:true,
    reason:"d1_daily_row_"+normalizedQuotaType+"_limit",
    d1:{quotaExhausted:true,quotaType:normalizedQuotaType,resetAt},
    cloudflare:budget?{...budget,onDemandTargetPercent:90}:null,
    strictZeroCost:true,
    retryAt:resetAt
  };
  if(url.pathname==="/api/wiki/status"){
    return Response.json({...base,
      status:"degraded",
      message:"Cloudflare D1 agotó el límite diario gratuito de "+quotaLabel+". El status completo volverá después del reset UTC.",
      countsAvailable:false,
      languages:WIKI_LANGUAGE_ORDER.map(language=>({slug:language.slug,name:language.name,total:language.total,published:null,failed:null,processing:null,status:"unknown"}))
    },{status:503,headers:{"cache-control":"no-store","retry-after":"3600"}});
  }
  return Response.json({...base,error:"D1 no está disponible temporalmente por cuota diaria."},
    {status:503,headers:{"cache-control":"no-store","retry-after":"3600"}});
}
__name(d1QuotaResponse, "d1QuotaResponse");
`;

  const replacement=`async function handleWikiApi(request, env, url) {
  try{
    await ensureWikiDb(env);
  }catch(error){
    const quotaType=d1DailyQuotaType(error);
    if(quotaType) return d1QuotaResponse(env,url,quotaType);
    throw error;
  }`;

  source=source.replace(pattern,helper+'\n'+replacement);

  const chatFailurePattern=/(\s*)if\s*\(!error\.status\)\s*console\.error\((['"])mls-chat-failure\2,\s*error\.message\);/;
  const match=source.match(chatFailurePattern);
  if(!match) throw new Error('No se encontró el marcador mls-chat-failure para instalar degradación por cuota.');
  const indent=match[1]||'    ';
  const quotaBranch=`${indent}const quotaType=d1DailyQuotaType(error);
${indent}if (quotaType) {
${indent}  return mlsChatJson({
${indent}    ok:false,
${indent}    degraded:true,
${indent}    reason:'d1_daily_row_'+quotaType+'_limit',
${indent}    quotaType,
${indent}    error:'D1 no está disponible temporalmente por cuota diaria.',
${indent}    retryAt:nextUtcResetIso()
${indent}  },503);
${indent}}
`;
  return source.replace(chatFailurePattern,quotaBranch+match[0]);
}

function install(){
  if(!fs.existsSync(TARGET)) throw new Error('No se encontró src/index.js para instalar degradación D1.');
  const source=fs.readFileSync(TARGET,'utf8');
  fs.writeFileSync(TARGET,patchD1QuotaGuard(source),'utf8');
}

function main(){
  install();
  console.log('Degradación controlada por cuota diaria de D1 instalada.');
}

module.exports={patchD1QuotaGuard,install,MARKER};
if(require.main===module)main();
