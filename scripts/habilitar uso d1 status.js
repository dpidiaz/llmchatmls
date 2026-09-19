'use strict';

const fs=require('node:fs');

const TARGET='src/index.js';
const MARKER='// MLS D1 USAGE STATUS 1.1';

function patchD1UsageStatus(source){
  source=String(source);
  if(source.includes(MARKER)) return source;

  const statusMarker='async function getWikiStatusR32(env) {';
  if(!source.includes(statusMarker)) throw new Error('No se encontró getWikiStatusR32 para instalar métricas D1.');
  if(!source.includes('async function d1QuotaResponse(env,url,quotaType="read") {')) throw new Error('Instalar primero la degradación por cuota D1 1.2.');

  const helper=`
${MARKER}
const MLS_D1_FREE_READ_LIMIT=5000000;
const MLS_D1_FREE_WRITE_LIMIT=100000;
let mlsD1AnalyticsCache={key:null,expiresAt:0,value:null};
function mlsD1UsageReset(now=Date.now()){
  const d=new Date(now);
  const resetAt=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()+1)).toISOString();
  return {resetAt,resetInSeconds:Math.max(0,Math.ceil((Date.parse(resetAt)-now)/1000))};
}
__name(mlsD1UsageReset,"mlsD1UsageReset");
function mlsD1UsageState(readPercent,writePercent,quotaExhausted=false){
  if(quotaExhausted||readPercent>=100||writePercent>=100)return "exhausted";
  const peak=Math.max(readPercent,writePercent);
  if(peak>=98)return "critical";
  if(peak>=90)return "high";
  if(peak>=70)return "watch";
  return "normal";
}
__name(mlsD1UsageState,"mlsD1UsageState");
function mlsD1UsageBase(reason,now=Date.now()){
  const reset=mlsD1UsageReset(now);
  return {
    available:false,
    source:"cloudflare-graphql",
    scope:"account",
    reason,
    dateUTC:new Date(now).toISOString().slice(0,10),
    rowsRead:null,
    rowsWritten:null,
    readLimit:MLS_D1_FREE_READ_LIMIT,
    writeLimit:MLS_D1_FREE_WRITE_LIMIT,
    readPercent:null,
    writePercent:null,
    readsRemaining:null,
    writesRemaining:null,
    state:"unknown",
    quotaExhausted:false,
    ...reset
  };
}
__name(mlsD1UsageBase,"mlsD1UsageBase");
function mlsD1AnalyticsError(error){
  return String(error?.message||error||"analytics error")
    .replace(/https?:\\/\\/\\S+/gi,"[url]")
    .replace(/Bearer\\s+\\S+/gi,"Bearer [redacted]")
    .slice(0,240);
}
__name(mlsD1AnalyticsError,"mlsD1AnalyticsError");
async function mlsD1UsageStatus(env){
  const now=Date.now();
  const token=String(env.D1_ANALYTICS_TOKEN||"").trim();
  const accountTag=String(env.D1_ANALYTICS_ACCOUNT_ID||"").trim();
  if(!token||!accountTag)return mlsD1UsageBase("analytics_not_configured",now);
  const dateUTC=new Date(now).toISOString().slice(0,10);
  const cacheKey=accountTag+":"+dateUTC;
  if(mlsD1AnalyticsCache.key===cacheKey&&mlsD1AnalyticsCache.value&&mlsD1AnalyticsCache.expiresAt>now){
    return {...mlsD1AnalyticsCache.value,...mlsD1UsageReset(now),cached:true};
  }
  try{
    const query=[
      "query MLS_D1_USAGE($accountTag: string!, $start: Date!, $end: Date!) {",
      "  viewer {",
      "    accounts(filter: { accountTag: $accountTag }) {",
      "      d1AnalyticsAdaptiveGroups(",
      "        limit: 10000",
      "        filter: { date_geq: $start, date_leq: $end }",
      "      ) {",
      "        sum { rowsRead rowsWritten }",
      "        dimensions { date databaseId }",
      "      }",
      "    }",
      "  }",
      "}"
    ].join("\\n");
    const response=await fetch("https://api.cloudflare.com/client/v4/graphql",{
      method:"POST",
      headers:{"authorization":"Bearer "+token,"content-type":"application/json"},
      body:JSON.stringify({query,variables:{accountTag,start:dateUTC,end:dateUTC}})
    });
    const payload=await response.json().catch(()=>null);
    if(!response.ok)throw new Error("Cloudflare Analytics HTTP "+response.status);
    if(payload?.errors?.length)throw new Error(payload.errors.map(item=>item?.message||"GraphQL error").join("; "));
    const accounts=payload?.data?.viewer?.accounts||[];
    const groups=accounts.flatMap(account=>account?.d1AnalyticsAdaptiveGroups||[]);
    const rowsRead=Math.max(0,Math.round(groups.reduce((sum,row)=>sum+Number(row?.sum?.rowsRead||0),0)));
    const rowsWritten=Math.max(0,Math.round(groups.reduce((sum,row)=>sum+Number(row?.sum?.rowsWritten||0),0)));
    const readPercent=Math.max(0,rowsRead/MLS_D1_FREE_READ_LIMIT*100);
    const writePercent=Math.max(0,rowsWritten/MLS_D1_FREE_WRITE_LIMIT*100);
    const reset=mlsD1UsageReset(now);
    const value={
      available:true,
      source:"cloudflare-graphql",
      scope:"account",
      reason:null,
      dateUTC,
      rowsRead,
      rowsWritten,
      readLimit:MLS_D1_FREE_READ_LIMIT,
      writeLimit:MLS_D1_FREE_WRITE_LIMIT,
      readPercent,
      writePercent,
      readsRemaining:Math.max(0,MLS_D1_FREE_READ_LIMIT-rowsRead),
      writesRemaining:Math.max(0,MLS_D1_FREE_WRITE_LIMIT-rowsWritten),
      state:mlsD1UsageState(readPercent,writePercent,false),
      quotaExhausted:false,
      sampledAt:new Date(now).toISOString(),
      cached:false,
      ...reset
    };
    mlsD1AnalyticsCache={key:cacheKey,expiresAt:now+60000,value};
    return value;
  }catch(error){
    return {...mlsD1UsageBase("analytics_unavailable",now),error:mlsD1AnalyticsError(error)};
  }
}
__name(mlsD1UsageStatus,"mlsD1UsageStatus");
`;

  source=source.replace(statusMarker,helper+'\n'+statusMarker);

  const returnAnchor='    nextFIFO: nextFifo ?? null,\n    cloudflare: { ...budget, onDemandTargetPercent: 90 },';
  if(!source.includes(returnAnchor)) throw new Error('No se encontró el retorno de getWikiStatusR32.');
  source=source.replace(returnAnchor,'    nextFIFO: nextFifo ?? null,\n    d1Usage: await mlsD1UsageStatus(env),\n    cloudflare: { ...budget, onDemandTargetPercent: 90 },');

  const quotaAnchor='  const resetAt=nextUtcResetIso();\n  const base={';
  if(!source.includes(quotaAnchor)) throw new Error('No se encontró d1QuotaResponse para adjuntar métricas D1.');
  source=source.replace(quotaAnchor,'  const resetAt=nextUtcResetIso();\n  const d1Usage=await mlsD1UsageStatus(env);\n  const base={');

  const quotaD1='    d1:{quotaExhausted:true,quotaType:normalizedQuotaType,resetAt},';
  if(!source.includes(quotaD1)) throw new Error('No se encontró bloque d1 de respuesta degradada.');
  source=source.replace(quotaD1,'    d1:{quotaExhausted:true,quotaType:normalizedQuotaType,resetAt},\n    d1Usage:{...d1Usage,quotaExhausted:true,quotaType:normalizedQuotaType,state:"exhausted",resetAt,resetInSeconds:Math.max(0,Math.ceil((Date.parse(resetAt)-Date.now())/1000))},');

  return source;
}

function install(){
  if(!fs.existsSync(TARGET))throw new Error('No se encontró src/index.js para instalar métricas D1.');
  fs.writeFileSync(TARGET,patchD1UsageStatus(fs.readFileSync(TARGET,'utf8')),'utf8');
}

function main(){
  install();
  console.log('Métricas oficiales y reset de D1 habilitados en /api/wiki/status.');
}

module.exports={patchD1UsageStatus,install,MARKER};
if(require.main===module)main();
