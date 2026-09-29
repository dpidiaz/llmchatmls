'use strict';
const fs=require('node:fs'),path=require('node:path');
function read(file){if(!file||!fs.existsSync(file))return null;return JSON.parse(fs.readFileSync(file,'utf8'));}
function check(file,now=Date.now()){
 const prior=read(file);if(prior&&(!Number.isFinite(prior.until)||prior.until>now)){
  const e=new Error('GitHub cooldown active; preserve all claims and checkpoints.');
  e.code='GITHUB_COOLDOWN';e.status=429;e.retryAt=prior.until;throw e;
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
 const value={schema:'MLS-GITHUB-COOLDOWN-1',until,attempts,status:response.status};
 if(file){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value));}
 return value;
}
module.exports={read,check,record};
