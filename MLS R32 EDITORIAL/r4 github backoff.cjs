'use strict';
const fs=require('node:fs'),path=require('node:path');
function read(file){if(!file||!fs.existsSync(file))return null;return JSON.parse(fs.readFileSync(file,'utf8'));}
function cooldownWindows(file,now=Date.now()){
 const prior=read(file);if(!prior)return [];
 const windows=Array.isArray(prior.cooldownWindows)?prior.cooldownWindows:
  (Number.isFinite(prior.recordedAt)?[{startedAt:new Date(prior.recordedAt).toISOString(),until:new Date(prior.until).toISOString()}]:[]);
 return windows.filter(w=>Number.isFinite(Date.parse(w?.startedAt))&&Number.isFinite(Date.parse(w?.until))&&Date.parse(w.until)>now-600000);
}
function check(file,now=Date.now()){
 const prior=read(file);if(prior&&(!Number.isFinite(prior.until)||prior.until>now)){
  const e=new Error('GitHub cooldown active; preserve all claims and checkpoints.');
  e.code='GITHUB_COOLDOWN';e.status=429;e.retryAt=prior.until;throw e;
 }
}
async function wait(file,{now=Date.now,sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),log=message=>console.log(message)}={}){
 const prior=read(file);if(!prior)return 0;
 if(!Number.isFinite(prior.until))throw new Error('GitHub cooldown checkpoint has an invalid retry time.');
 const delay=Math.max(0,prior.until-now());
 if(!delay)return 0;
 log('GitHub rate-limit cooldown active; scheduler will resume in '+Math.ceil(delay/1000)+'s.');
 await sleep(delay);
 return delay;
}
async function retry(file,operation,{maxRetries=3,waitOptions}={}){
 let retries=0;
 while(true){
  await wait(file,waitOptions);
  try{return await operation();}
  catch(error){
   if(!error?.retryAfterCooldown||retries>=maxRetries)throw error;
   retries++;
  }
 }
}
function record(file,response,now=Date.now(),random=Math.random){
 const prior=read(file),attempts=Math.min(8,(prior?.attempts||0)+1);
 const retry=response.headers.get('retry-after'),reset=Number(response.headers.get('x-ratelimit-reset'))*1000;
 const seconds=retry===null?NaN:Number(retry);
 const retryDate=Number.isFinite(seconds)?now+seconds*1000:Date.parse(retry||'');
 const primary=response.headers.get('x-ratelimit-remaining')==='0'?reset:0;
 const until=Math.max(now+Math.min(3600000,60000*2**(attempts-1))+Math.floor(random()*10000),
  Number.isFinite(retryDate)?retryDate:0,Number.isFinite(primary)?primary:0);
 const priorWindows=cooldownWindows(file,now);
 const value={schema:'MLS-GITHUB-COOLDOWN-1',until,attempts,status:response.status,recordedAt:now,
  cooldownWindows:[...priorWindows,{startedAt:new Date(now).toISOString(),until:new Date(until).toISOString()}]};
 if(file){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value));}
 return value;
}
module.exports={read,check,wait,retry,record,cooldownWindows};
