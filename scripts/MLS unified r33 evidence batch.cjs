'use strict';

const fs=require('node:fs');
const path=require('node:path');
const child=require('node:child_process');

const workspace=process.env.GITHUB_WORKSPACE||process.cwd();
const singlePath=process.env.MLS_UNIFIED_SINGLE_SCRIPT||path.join(workspace,'scripts','MLS unified r33 evidence submit.cjs');
const single=require(singlePath);
const core=require(path.join(workspace,'MLS R32 EDITORIAL','global dispatcher','core.js'));

const MARKER='MLS_UNIFIED_R33_EVIDENCE_SUBMIT_BATCH';
// Capacity is intentionally per assignment. Assignments remain fenced by
// assignmentId/leaseEpoch/branch and final canonical integration remains serial.
// 50 removes the historical 5-entry microbatch bottleneck without weakening R33.
const MAX_BATCH=single.MAX_BATCH;

function fail(code,message){const e=new Error(message||code);e.code=code;throw e;}
function appendOutput(name,value){
  const out=process.env.GITHUB_OUTPUT;
  if(!out)fail('GITHUB_OUTPUT_MISSING');
  fs.appendFileSync(out,name+'='+String(value).replace(/\r?\n/g,' ')+'\n');
}
function extractBatch(text){
  const m=new RegExp('<!--\\s*'+MARKER+'\\s*([\\s\\S]*?)-->','m').exec(String(text||''));
  if(!m)return null;
  try{return JSON.parse(m[1].trim())}catch{fail('UNIFIED_EVIDENCE_BATCH_JSON_INVALID')}
}
function githubContext(){
  const token=process.env.GITHUB_TOKEN||'',repository=process.env.GITHUB_REPOSITORY||'';
  if(!token||repository.split('/').length!==2)fail('GITHUB_CONTEXT_MISSING');
  return {token,repository};
}
async function gh(endpoint){
  const {token}=githubContext();
  const response=await fetch('https://api.github.com'+endpoint,{headers:{authorization:'Bearer '+token,accept:'application/vnd.github+json','x-github-api-version':'2022-11-28','user-agent':'mls-unified-r33-evidence-batch'}});
  const text=await response.text();let data=null;try{data=text?JSON.parse(text):null}catch{data=text}
  if(!response.ok)fail('GITHUB_'+response.status,data?.message||text||'GitHub request failed');
  return data;
}
function bundleFromValidated(issue,comment,validated){return {issueNumber:Number(issue.number),commentId:Number(comment.id),branch:validated.state.branch,assignmentId:validated.state.assignmentId,leaseEpoch:validated.state.leaseEpoch,code:validated.code,evidencePath:validated.evidencePath,contentPath:validated.contentPath,evidence:validated.evidence,content:validated.content,sources:validated.sources};}
async function prepare(){
  const event=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8'));
  const {repository}=githubContext();let eventIssue=event.issue||null,eventComment=event.comment||null;
  if(!eventIssue||!eventComment){const issueNumber=Number(process.env.MLS_UNIFIED_ISSUE_NUMBER||0),commentId=Number(process.env.MLS_UNIFIED_COMMENT_ID||0);if(!Number.isInteger(issueNumber)||issueNumber<1||!Number.isInteger(commentId)||commentId<1)fail('UNIFIED_EVIDENCE_BATCH_EVENT_INVALID');eventIssue={number:issueNumber};eventComment=await gh('/repos/'+repository+'/issues/comments/'+commentId);}
  const issue=await gh('/repos/'+repository+'/issues/'+Number(eventIssue.number));
  const batchPayload=extractBatch(eventComment.body||'');
  const payloads=batchPayload?(Array.isArray(batchPayload.entries)?batchPayload.entries:[]):[single.extractMarked(eventComment.body||'')];
  if(!payloads.length||payloads.length>MAX_BATCH)fail('UNIFIED_EVIDENCE_BATCH_SIZE_INVALID');
  const bundles=[],seen=new Set();
  for(const payload of payloads){const validated=single.validate(issue,eventComment,payload);if(seen.has(validated.code))fail('UNIFIED_EVIDENCE_BATCH_DUPLICATE_CODE');seen.add(validated.code);bundles.push(bundleFromValidated(issue,eventComment,validated));}
  const assignmentId=bundles[0].assignmentId,leaseEpoch=bundles[0].leaseEpoch,branch=bundles[0].branch;
  if(bundles.some(x=>x.assignmentId!==assignmentId||x.leaseEpoch!==leaseEpoch||x.branch!==branch))fail('UNIFIED_EVIDENCE_BATCH_ASSIGNMENT_MISMATCH');
  if(batchPayload&& (String(batchPayload.assignmentId||'')!==assignmentId||Number(batchPayload.leaseEpoch)!==Number(leaseEpoch)))fail('UNIFIED_EVIDENCE_BATCH_FENCE_MISMATCH');
  const batchPath=path.join(process.env.RUNNER_TEMP||workspace,'mls-unified-r33-evidence-batch.json');
  fs.writeFileSync(batchPath,JSON.stringify({schema:'MLS-UNIFIED-R33-EVIDENCE-BATCH-1',issueNumber:Number(issue.number),commentId:Number(eventComment.id),branch,assignmentId,leaseEpoch,entries:bundles},null,2)+'\n');
  appendOutput('branch',branch);appendOutput('batch_path',batchPath);appendOutput('count',bundles.length);appendOutput('codes',bundles.map(x=>x.code).join(','));
  process.stdout.write(JSON.stringify({ok:true,status:'BATCH_PREPARED',assignmentId,branch,count:bundles.length,codes:bundles.map(x=>x.code),maxBatch:MAX_BATCH})+'\n');
}
function exec(bin,args,{capture=false,env={}}={}){try{const result=child.execFileSync(bin,args,{cwd:workspace,env:{...process.env,...env},encoding:'utf8',stdio:capture?['ignore','pipe','pipe']:['ignore','inherit','inherit']});return capture?String(result||'').trim():'';}catch(error){if(capture){if(error.stdout)process.stdout.write(String(error.stdout));if(error.stderr)process.stderr.write(String(error.stderr));}throw error;}}
function git(args,options={}){return exec('git',args,options)}
function outputMap(file){if(!fs.existsSync(file))return {};const out={};for(const line of fs.readFileSync(file,'utf8').split(/\r?\n/)){const i=line.indexOf('=');if(i>0)out[line.slice(0,i)]=line.slice(i+1);}return out;}
function tempOutput(label){const p=path.join(process.env.RUNNER_TEMP||workspace,'mls-unified-r33-'+label+'-'+Date.now()+'-'+Math.random().toString(36).slice(2)+'.out');fs.writeFileSync(p,'');return p;}
function writeEntryBundle(entry,index){const p=path.join(process.env.RUNNER_TEMP||workspace,'mls-unified-r33-entry-'+String(index+1).padStart(2,'0')+'.json');fs.writeFileSync(p,JSON.stringify(entry,null,2)+'\n');return p;}
function staged(){const text=git(['diff','--cached','--name-only'],{capture:true});return text?text.split(/\r?\n/).filter(Boolean):[];}
function allowedStaged(entry,file){if(file===entry.evidencePath||file===entry.contentPath)return true;return (entry.sources||[]).some(x=>file===x.sourcePath);}
function checkoutCanonicalMain(){git(['fetch','--no-tags','origin','main']);git(['checkout','--detach','origin/main']);}
function restoreAssignment(headSha){git(['checkout','-B','unified-evidence-submit',headSha]);}
function dispatcherEvent(eventPath){exec(process.execPath,['scripts/MLS global dispatcher worker.cjs'],{env:{GITHUB_EVENT_PATH:eventPath}});}
function singleMode(mode,args,outFile){exec(process.execPath,[singlePath,mode,...args],{env:outFile?{GITHUB_OUTPUT:outFile}:{}});}
async function run(){
  const batchPath=process.argv[3],runId=Number(process.argv[4]||process.env.GITHUB_RUN_ID||0);if(!batchPath||!Number.isInteger(runId)||runId<1)fail('UNIFIED_EVIDENCE_BATCH_RUN_ARGS');
  const batch=JSON.parse(fs.readFileSync(batchPath,'utf8'));if(batch.schema!=='MLS-UNIFIED-R33-EVIDENCE-BATCH-1'||!Array.isArray(batch.entries)||!batch.entries.length||batch.entries.length>MAX_BATCH)fail('UNIFIED_EVIDENCE_BATCH_FILE_INVALID');
  git(['config','user.name','github-actions[bot]']);git(['config','user.email','41898282+github-actions[bot]@users.noreply.github.com']);
  const results=[];let lastBundlePath=null,lastSha=null;
  for(let index=0;index<batch.entries.length;index++){
    const entry=batch.entries[index],bundlePath=writeEntryBundle(entry,index);lastBundlePath=bundlePath;
    singleMode('apply',[bundlePath]);exec(process.execPath,['scripts/R4-evidence-preflight.cjs',entry.evidencePath]);
    const add=['add','--',entry.evidencePath,entry.contentPath];for(const source of entry.sources||[])if(fs.existsSync(path.resolve(workspace,source.sourcePath)))add.push(source.sourcePath);git(add);
    const files=staged(),bad=files.filter(file=>!allowedStaged(entry,file));if(bad.length)fail('UNIFIED_EVIDENCE_BATCH_STAGED_SCOPE','Unexpected staged paths: '+bad.join(', '));
    if(files.length)git(['commit','-m','r33(unified): verify '+entry.code]);const sha=git(['rev-parse','HEAD'],{capture:true}).toLowerCase();if(!/^[a-f0-9]{40}$/.test(sha))fail('UNIFIED_EVIDENCE_BATCH_SHA_INVALID');lastSha=sha;
    exec(process.execPath,['--test','test/r33 evidence editorial batch.test.cjs','test/r33 evidence farm.test.cjs']);git(['push','origin','HEAD:refs/heads/'+batch.branch]);
    const checkpointOut=tempOutput('checkpoint-'+(index+1));singleMode('checkpoint-event',[bundlePath,sha,String(runId),String(index+1)],checkpointOut);const checkpoint=outputMap(checkpointOut);if(!checkpoint.event_path)fail('UNIFIED_EVIDENCE_BATCH_CHECKPOINT_EVENT_MISSING');
    checkoutCanonicalMain();dispatcherEvent(checkpoint.event_path);restoreAssignment(sha);results.push({code:entry.code,commitSha:sha,checkpoint:true});
  }
  let finishNeeded=false;if(lastBundlePath&&lastSha){const finishOut=tempOutput('finish');singleMode('finish-event',[lastBundlePath,lastSha,String(runId),String(batch.entries.length+1)],finishOut);const finish=outputMap(finishOut);finishNeeded=finish.finish_needed==='true';if(finishNeeded){if(!finish.event_path)fail('UNIFIED_EVIDENCE_BATCH_FINISH_EVENT_MISSING');checkoutCanonicalMain();dispatcherEvent(finish.event_path);}}
  process.stdout.write(JSON.stringify({ok:true,status:'BATCH_COMPLETE',assignmentId:batch.assignmentId,count:results.length,finishNeeded,results})+'\n');
}
async function main(){const mode=String(process.argv[2]||'');if(mode==='prepare')return prepare();if(mode==='run')return run();fail('UNIFIED_EVIDENCE_BATCH_MODE_INVALID');}
if(require.main===module)main().catch(error=>{console.error(error.code||'UNIFIED_EVIDENCE_BATCH_ERROR',error.message);process.exitCode=2});
module.exports={MARKER,MAX_BATCH,extractBatch};
