'use strict';

const fs=require('node:fs');
const zlib=require('node:zlib');
const crypto=require('node:crypto');

const TRIGGER_MARKER='MLS_BCR_R43_REPAIR_RESULT_HASH';
const RESULT_MARKER='MLS_BCR_R43_RESULT';
const REQUEST_MARKER='MLS_BCR_R43_REQUEST';
const AUTHORIZED=new Set(['OWNER','MEMBER','COLLABORATOR']);

function die(msg){throw new Error(msg);}
function stable(x){
 if(Array.isArray(x))return '['+x.map(stable).join(',')+']';
 if(x&&typeof x==='object')return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';
 return JSON.stringify(x);
}
function hash(x){return crypto.createHash('sha256').update(stable(x)).digest('hex');}
function marker(body,key){
 const re=new RegExp('<!--\\s*'+key+'\\s*\\n([\\s\\S]*?)\\n-->','g');
 const hits=[...String(body||'').matchAll(re)];
 if(hits.length!==1)die(key+' marker cardinality');
 try{return JSON.parse(hits[0][1]);}catch{die(key+' marker JSON');}
}
function replaceMarker(body,key,value){
 const re=new RegExp('(<!--\\s*'+key+'\\s*\\n)[\\s\\S]*?(\\n-->)');
 if(!re.test(body))die(key+' marker missing');
 return body.replace(re,'$1'+JSON.stringify(value)+'$2');
}

async function main(){
 const eventPath=process.env.GITHUB_EVENT_PATH;
 const token=process.env.GITHUB_TOKEN;
 const repository=process.env.GITHUB_REPOSITORY;
 if(!eventPath||!token||!repository)die('Missing GitHub Actions environment.');
 const event=JSON.parse(fs.readFileSync(eventPath,'utf8'));
 const trigger=event.issue;
 if(!trigger||trigger.pull_request)return;
 if(!AUTHORIZED.has(String(trigger.author_association||'').toUpperCase()))die('Unauthorized repair trigger.');

 const cmd=marker(trigger.body,TRIGGER_MARKER);
 if(cmd?.schema!=='MLS-BCR-R43-REPAIR-RESULT-HASH-1'||cmd.version!==1)die('Invalid repair schema.');
 const targetIssueNumber=Number(cmd.targetIssueNumber);
 if(!Number.isSafeInteger(targetIssueNumber)||targetIssueNumber<1)die('Invalid target issue.');

 const [owner,repo]=repository.split('/');
 async function api(method,path,body){
  const res=await fetch('https://api.github.com/repos/'+owner+'/'+repo+path,{
   method,
   headers:{
    Accept:'application/vnd.github+json',
    Authorization:'Bearer '+token,
    'X-GitHub-Api-Version':'2022-11-28',
    'User-Agent':'mls-r43-result-hash-repair'
   },
   ...(body?{body:JSON.stringify(body)}:{})
  });
  if(!res.ok)die('GitHub '+method+' '+path+' '+res.status+' '+(await res.text()).slice(0,500));
  if(res.status===204)return null;
  return res.json();
 }

 const target=await api('GET','/issues/'+targetIssueNumber);
 if(target.pull_request)die('Target must be an Issue.');
 if(!AUTHORIZED.has(String(target.author_association||'').toUpperCase()))die('Target owner not authorized.');

 const req=marker(target.body,REQUEST_MARKER);
 const result=marker(target.body,RESULT_MARKER);
 if(result?.schema!=='MLS-BCR-R43-RESULT-1'||result.version!==1)die('Invalid result schema.');
 if(result.encoding!=='deflate-raw-base64')die('Unsupported result encoding.');
 if(result.waveIssueNumber!==req.waveIssueNumber||result.waveId!==req.waveId||result.waveHash!==req.waveHash)die('Request/result wave mismatch.');

 const compressed=Buffer.from(String(result.data||''),'base64');
 if(compressed.length!==result.compressedBytes)die('Compressed byte count mismatch.');
 const raw=zlib.inflateRawSync(compressed,{maxOutputLength:8*1024*1024});
 if(raw.length!==result.rawBytes)die('Raw byte count mismatch.');
 const delta=JSON.parse(raw.toString('utf8'));
 if(delta?.schema!=='MLS-BCR-DELTA-1'||delta.version!==1)die('Invalid delta schema.');
 if(delta.waveId!==result.waveId||delta.waveHash!==result.waveHash||delta.shardId!==result.shardId)die('Delta/result identity mismatch.');

 const unsignedDelta={...delta};
 delete unsignedDelta.deltaHash;
 const correctedDeltaHash=hash(unsignedDelta);
 if(delta.deltaHash===correctedDeltaHash){
  console.log(JSON.stringify({targetIssueNumber,changed:false,reason:'DELTA_HASH_ALREADY_VALID',deltaHash:correctedDeltaHash}));
  return;
 }
 const oldDeltaHash=delta.deltaHash;
 delta.deltaHash=correctedDeltaHash;

 const correctedRaw=Buffer.from(JSON.stringify(delta),'utf8');
 const correctedCompressed=zlib.deflateRawSync(correctedRaw,{level:9});
 const unsignedResult={
  schema:'MLS-BCR-R43-RESULT-1',
  version:1,
  waveIssueNumber:result.waveIssueNumber,
  waveId:result.waveId,
  waveHash:result.waveHash,
  shardId:result.shardId,
  deltaHash:correctedDeltaHash,
  encoding:'deflate-raw-base64',
  rawBytes:correctedRaw.length,
  compressedBytes:correctedCompressed.length,
  data:correctedCompressed.toString('base64')
 };
 const correctedResult={...unsignedResult,resultHash:hash(unsignedResult)};
 const nextBody=replaceMarker(target.body,RESULT_MARKER,correctedResult);
 await api('PATCH','/issues/'+targetIssueNumber,{body:nextBody});

 await api('POST','/issues/'+trigger.number+'/comments',{body:[
  'R4.3 result hash repair completed.',
  '',
  '- Target issue: #'+targetIssueNumber,
  '- Shard: '+result.shardId,
  '- Old deltaHash: `'+oldDeltaHash+'`',
  '- Corrected deltaHash: `'+correctedDeltaHash+'`',
  '- Result hash: `'+correctedResult.resultHash+'`',
  '',
  'The target issue was edited in place; the normal R4.3 scheduler will re-validate it.'
 ].join('\n')});
 await api('PATCH','/issues/'+trigger.number,{state:'closed'});

 console.log(JSON.stringify({
  targetIssueNumber,changed:true,shardId:result.shardId,
  oldDeltaHash,correctedDeltaHash,resultHash:correctedResult.resultHash,
  rawBytes:correctedRaw.length,compressedBytes:correctedCompressed.length
 }));
}

main().catch(err=>{console.error(err&&err.stack||err);process.exitCode=1;});
