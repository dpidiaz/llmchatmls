const BASE=process.env.MLS_UNIFIED_BASE_URL||'https://llmchatmls.dpidiaz.workers.dev';
const KEY=process.env.MLS_EDITORIAL_CHAT_KEY||'';
const BATCH=Math.max(1,Math.min(5,Number(process.env.R44_LEGACY_RECONCILE_BATCH||5)));
const MAX_BATCHES=Math.max(1,Math.min(100,Number(process.env.R44_LEGACY_RECONCILE_MAX_BATCHES||60)));
const MIN_WRITES=Math.max(0,Number(process.env.R44_LEGACY_RECONCILE_MIN_WRITES_REMAINING||2500));
const ENFORCE_FREE_D1_GUARD=/^(1|true|yes|on)$/i.test(String(process.env.R44_LEGACY_RECONCILE_ENFORCE_D1_FREE_GUARD||''));

if(KEY.length<32)throw new Error('MLS_EDITORIAL_CHAT_KEY missing or invalid');

async function json(path,options={}){
  const response=await fetch(BASE+path,options);
  const text=await response.text();
  let data;try{data=text?JSON.parse(text):null}catch{throw new Error(path+' returned non-JSON: '+text.slice(0,500))}
  if(!response.ok)throw new Error(path+' HTTP '+response.status+': '+JSON.stringify(data).slice(0,1000));
  return data;
}
async function run(){
  let last=null,totalReconciled=0,totalRequeued=0,totalBlocked=0;
  if(!ENFORCE_FREE_D1_GUARD){
    console.log(JSON.stringify({status:'D1_FREE_WRITE_GUARD_DISABLED',reason:'WORKERS_PAID'}));
  }
  for(let i=0;i<MAX_BATCHES;i++){
    if(ENFORCE_FREE_D1_GUARD){
      const wiki=await json('/api/wiki/status');
      const rawRemaining=wiki?.d1Usage?.writesRemaining??wiki?.cloudflare?.d1Usage?.writesRemaining;
      const remaining=Number(rawRemaining);
      if(Number.isFinite(remaining)&&remaining<MIN_WRITES){
        console.log(JSON.stringify({status:'D1_WRITE_GUARD',writesRemaining:remaining,minWritesRemaining:MIN_WRITES,totalReconciled,totalRequeued,totalBlocked,last}));
        return;
      }
    }
    last=await json('/api/r44/admin/reconcile-legacy-quarantine',{
      method:'POST',
      headers:{authorization:'Bearer '+KEY,'content-type':'application/json',accept:'application/json'},
      body:JSON.stringify({limit:BATCH})
    });
    totalReconciled+=Number(last.reconciled||0);
    totalRequeued+=Number(last.requeued||0);
    totalBlocked+=Number(last.blocked||0);
    console.log(JSON.stringify({batch:i+1,...last}));
    if(Number(last.remainingLegacy||0)===0){
      console.log(JSON.stringify({status:'LEGACY_QUARANTINE_DRAINED',totalReconciled,totalRequeued,totalBlocked,quarantinedTotal:Number(last.quarantinedTotal||0)}));
      return;
    }
    if(Number(last.attempted||0)===0)break;
  }
  console.log(JSON.stringify({status:'LEGACY_QUARANTINE_RECONCILE_BOUNDED_STOP',totalReconciled,totalRequeued,totalBlocked,last}));
}
run().catch(error=>{console.error('R44_LEGACY_QUARANTINE_RECONCILE_ERROR',error.stack||error.message||error);process.exitCode=1;});
