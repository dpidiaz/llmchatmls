'use strict';
async function run(action='check',env=process.env,fetchFn=fetch){
  if(!env.MLS_EDITORIAL_CHAT_KEY)throw Error('UNIFIED_SINK_KEY_MISSING');
  const base=env.MLS_UNIFIED_BASE_URL||'https://llmchatmls.dpidiaz.workers.dev';
  const response=await fetchFn(base+(action==='check'?'/api/unified-runner/status':'/api/unified-runner/github-gate'),{
    method:'POST',headers:{authorization:'Bearer '+env.MLS_EDITORIAL_CHAT_KEY,'content-type':'application/json'},
    body:JSON.stringify(action==='check'?{}:{action:'degrade',retryAfterMs:60000,error:'Secondary writer failed; durable work retained for bounded retry'})
  });
  if(!response.ok)throw Error('UNIFIED_SINK_GATE_UNAVAILABLE_'+response.status);
  const result=await response.json(),gate=result.githubGate||{};
  if(action==='check'&&gate.state==='DEGRADED'&&Number(gate.retry_at)>Date.now())throw Error('UNIFIED_SINK_COOLDOWN_UNTIL_'+gate.retry_at);
  return {ok:true,action};
}
if(require.main===module)run(process.argv[2]||'check').then(x=>console.log(JSON.stringify(x))).catch(e=>{console.error(e.message);process.exitCode=1});
module.exports={run};
