export const MLS_UNIFIED_VERIFIED_URL="https://raw.githubusercontent.com/dpidiaz/llmchatmls/main/MLS%20R32%20EDITORIAL/evidence%20git/indexes/verified.json";
export const MLS_UNIFIED_TOTAL_ENTRIES=10133;
export const MLS_UNIFIED_ACTIVATION_BASELINE=1725;

export const MLS_UNIFIED_LANGUAGES=[
  {slug:"espanol-guatemala",name:"Español de Guatemala",prefix:"MLS-V10",total:930},
  {slug:"ingles",name:"Inglés",prefix:"MLS-V01",total:766},
  {slug:"portugues",name:"Português brasileiro",prefix:"MLS-V02",total:1199},
  {slug:"italiano",name:"Italiano",prefix:"MLS-V03",total:810},
  {slug:"frances",name:"Français",prefix:"MLS-V04",total:1159},
  {slug:"aleman",name:"Deutsch",prefix:"MLS-V05",total:1101},
  {slug:"japones",name:"日本語",prefix:"MLS-V06",total:1027},
  {slug:"chino-taiwan",name:"中文（台灣）",prefix:"MLS-V07",total:1016},
  {slug:"coreano",name:"한국어",prefix:"MLS-V08",total:1094},
  {slug:"ruso",name:"Русский",prefix:"MLS-V09",total:1031}
];

function round2(value){return Math.round(Number(value)*100)/100}

export function buildUnifiedStatus(codes,{fetchedAt=new Date().toISOString(),etag=null}={}){
  if(!Array.isArray(codes))throw new Error("UNIFIED_VERIFIED_INDEX_INVALID");
  const byPrefix=new Map(MLS_UNIFIED_LANGUAGES.map(language=>[language.prefix,0]));
  const seen=new Set();
  for(const raw of codes){
    const code=String(raw||"").trim().toUpperCase();
    const match=code.match(/^(MLS-V\d{2})-(\d{4})$/);
    if(!match)throw new Error("UNIFIED_VERIFIED_CODE_INVALID:"+code);
    if(seen.has(code))throw new Error("UNIFIED_VERIFIED_DUPLICATE:"+code);
    const language=MLS_UNIFIED_LANGUAGES.find(item=>item.prefix===match[1]);
    const n=Number(match[2]);
    if(!language||!Number.isInteger(n)||n<1||n>language.total)throw new Error("UNIFIED_VERIFIED_CODE_OUT_OF_RANGE:"+code);
    seen.add(code);
    byPrefix.set(language.prefix,(byPrefix.get(language.prefix)||0)+1);
  }
  const verifiedCount=seen.size;
  if(verifiedCount>MLS_UNIFIED_TOTAL_ENTRIES)throw new Error("UNIFIED_VERIFIED_COUNT_OUT_OF_RANGE");
  const remaining=Math.max(0,MLS_UNIFIED_TOTAL_ENTRIES-verifiedCount);
  return {
    ok:true,
    schema:"MLS-UNIFIED-STATUS-1",
    sourceOfTruth:"github-main-verified-index",
    sourcePath:"MLS R32 EDITORIAL/evidence git/indexes/verified.json",
    totalEntries:MLS_UNIFIED_TOTAL_ENTRIES,
    verifiedCount,
    verifiedCodes:[...seen].sort(),
    remaining,
    percent:round2(verifiedCount/MLS_UNIFIED_TOTAL_ENTRIES*100),
    activationBaseline:MLS_UNIFIED_ACTIVATION_BASELINE,
    verifiedSinceActivation:Math.max(0,verifiedCount-MLS_UNIFIED_ACTIVATION_BASELINE),
    fetchedAt,
    etag:etag||null,
    languages:MLS_UNIFIED_LANGUAGES.map(language=>{
      const verified=byPrefix.get(language.prefix)||0;
      return {
        slug:language.slug,
        name:language.name,
        prefix:language.prefix,
        total:language.total,
        verified,
        remaining:Math.max(0,language.total-verified),
        percent:round2(verified/language.total*100)
      };
    })
  };
}

export async function fetchUnifiedStatus(fetchFn=fetch){
  const response=await fetchFn(MLS_UNIFIED_VERIFIED_URL,{
    headers:{accept:"application/json"},
    cf:{cacheEverything:true,cacheTtl:30}
  });
  if(!response||!response.ok)throw new Error("UNIFIED_VERIFIED_FETCH_FAILED:"+(response?.status??"unknown"));
  const codes=await response.json();
  return buildUnifiedStatus(codes,{
    fetchedAt:new Date().toISOString(),
    etag:response.headers?.get?.("etag")||null
  });
}
