'use strict';

const TOKEN=String(process.env.CLOUDFLARE_API_TOKEN||'').trim();
const API='https://api.cloudflare.com/client/v4';
const SCRIPT_NAME=String(process.env.MLS_UNIFIED_WORKER_NAME||'llmchatmls').trim();
const HOST=String(process.env.MLS_UNIFIED_ACCESS_HOST||'llmchatmls.dpidiaz.workers.dev').trim().replace(/^https?:\/\//,'').replace(/\/$/,'');
const APP_NAME='MLS Unified Runner';
const CHECK_ONLY=process.argv.includes('--check');

function fail(code,message){const e=new Error(message||code);e.code=code;throw e}
async function cf(path,options={}){
  if(!TOKEN)fail('CLOUDFLARE_API_TOKEN_MISSING');
  const response=await fetch(API+path,{
    method:options.method||'GET',
    headers:{authorization:'Bearer '+TOKEN,'content-type':'application/json'},
    body:options.body===undefined?undefined:JSON.stringify(options.body)
  });
  const text=await response.text();
  let data=null;try{data=text?JSON.parse(text):null}catch{data={success:false,errors:[{message:text}]}}
  if(!response.ok||data?.success===false){
    const message=(data?.errors||[]).map(x=>x.message||x.code).filter(Boolean).join(' | ')||('HTTP '+response.status);
    const e=new Error(message);e.status=response.status;e.data=data;throw e;
  }
  return data?.result??data;
}
async function findAccount(){
  const accounts=await cf('/accounts?per_page=50');
  const rows=Array.isArray(accounts)?accounts:[];
  if(!rows.length)fail('CLOUDFLARE_ACCOUNT_NOT_FOUND');
  for(const account of rows){
    const id=String(account.id||'');
    if(!id)continue;
    try{
      await cf('/accounts/'+encodeURIComponent(id)+'/workers/scripts/'+encodeURIComponent(SCRIPT_NAME)+'/script-settings');
      return {id,name:String(account.name||'')};
    }catch(error){
      if(error.status===404)continue;
    }
  }
  fail('CLOUDFLARE_WORKER_ACCOUNT_NOT_FOUND',SCRIPT_NAME);
}
function desiredApplication(){
  return {
    name:APP_NAME,
    type:'self_hosted',
    domain:HOST+'/runner.html',
    session_duration:'24h',
    app_launcher_visible:false,
    destinations:[
      {type:'public',uri:HOST+'/runner.html'},
      {type:'public',uri:HOST+'/api/unified-runner/browser/*'}
    ]
  };
}
function desiredPolicy(accountId){
  return {
    name:'MLS Cloudflare account members',
    decision:'allow',
    precedence:1,
    include:[{cloudflare_account_member:{account_id:accountId}}],
    exclude:[],
    require:[]
  };
}
function destinationUris(app){
  return new Set((app?.destinations||[]).map(x=>String(x?.uri||'')));
}
async function main(){
  const account=await findAccount();
  const appsResult=await cf('/accounts/'+encodeURIComponent(account.id)+'/access/apps?per_page=100');
  const apps=Array.isArray(appsResult)?appsResult:[];
  const runnerUri=HOST+'/runner.html',apiUri=HOST+'/api/unified-runner/browser/*';
  let app=apps.find(x=>String(x.name||'')===APP_NAME);
  if(!app) app=apps.find(x=>{const u=destinationUris(x);return u.has(runnerUri)||u.has(apiUri)});
  if(CHECK_ONLY){
    process.stdout.write(JSON.stringify({
      ok:true,checkOnly:true,account:account.name||account.id,
      accessApi:true,existingApplication:!!app,
      protectedDestinations:app?[...destinationUris(app)]:[]
    })+'\n');
    return;
  }
  const body=desiredApplication();
  if(app?.id){
    app=await cf('/accounts/'+encodeURIComponent(account.id)+'/access/apps/'+encodeURIComponent(app.id),{method:'PUT',body});
  }else{
    app=await cf('/accounts/'+encodeURIComponent(account.id)+'/access/apps',{method:'POST',body});
  }
  const appId=String(app?.id||'');
  if(!appId)fail('CLOUDFLARE_ACCESS_APP_ID_MISSING');
  const policiesResult=await cf('/accounts/'+encodeURIComponent(account.id)+'/access/apps/'+encodeURIComponent(appId)+'/policies?per_page=100');
  const policies=Array.isArray(policiesResult)?policiesResult:[];
  const policyBody=desiredPolicy(account.id);
  const existing=policies.find(x=>String(x.name||'')===policyBody.name);
  let policy;
  if(existing?.id){
    policy=await cf('/accounts/'+encodeURIComponent(account.id)+'/access/apps/'+encodeURIComponent(appId)+'/policies/'+encodeURIComponent(existing.id),{method:'PUT',body:policyBody});
  }else{
    policy=await cf('/accounts/'+encodeURIComponent(account.id)+'/access/apps/'+encodeURIComponent(appId)+'/policies',{method:'POST',body:policyBody});
  }
  process.stdout.write(JSON.stringify({
    ok:true,account:account.name||account.id,applicationId:appId,policyId:policy?.id||null,
    host:HOST,protected:[runnerUri,apiUri],sessionDuration:'24h'
  })+'\n');
}
main().catch(error=>{
  console.error(error.code||'MLS_UNIFIED_ACCESS_SETUP_ERROR',error.message);
  process.exitCode=2;
});
