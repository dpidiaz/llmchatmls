'use strict';

const fs=require('node:fs');
const crypto=require('node:crypto');
const core=require('../MLS R32 EDITORIAL/evidence farm core.js');

const token=process.env.GITHUB_TOKEN||'';
const repository=process.env.GITHUB_REPOSITORY||'';
if(!token||!/^[^/]+\/[^/]+$/.test(repository))throw new Error('GITHUB_TOKEN/GITHUB_REPOSITORY faltante.');
const [owner,repo]=repository.split('/');

async function gh(method,endpoint,body){
  const response=await fetch('https://api.github.com'+endpoint,{
    method,
    headers:{authorization:'Bearer '+token,accept:'application/vnd.github+json','content-type':'application/json','x-github-api-version':'2022-11-28','user-agent':'r33-evidence-farm-r2'},
    body:body===undefined?undefined:JSON.stringify(body)
  });
  const text=await response.text();let data=null;try{data=text?JSON.parse(text):null}catch{data=text}
  if(!response.ok){const e=new Error('GitHub '+response.status+': '+(data?.message||text));e.status=response.status;throw e;}
  return data;
}
async function getIssue(number){return gh('GET','/repos/'+owner+'/'+repo+'/issues/'+number);}
async function updateIssue(number,patch){return gh('PATCH','/repos/'+owner+'/'+repo+'/issues/'+number,patch);}
function encodedPath(p){return String(p).split('/').map(encodeURIComponent).join('/');}
function sha256(text){return crypto.createHash('sha256').update(text).digest('hex');}

async function verifyCheckpointArtifacts(state,event){
  if(event.operation!=='checkpoint')return;
  const assigned=new Map((state.entries||[]).map(x=>[x.code,x]));
  for(const row of Array.isArray(event.entries)?event.entries:[]){
    const code=core.assertCode(row.code),assignment=assigned.get(code);
    if(!assignment)throw core.farmError('CODE_NOT_IN_BATCH','La entrada no pertenece al lote: '+code,409);
    const result=row.result||{},expectedPath=core.evidenceEntryPath(assignment);
    if(result.evidenceArtifactPath!==expectedPath)throw core.farmError('EVIDENCE_ARTIFACT_PATH_MISMATCH','Ruta Evidence Git inválida para '+code,409);
    const ref=String(result.evidenceCommitSha||'');
    const file=await gh('GET','/repos/'+owner+'/'+repo+'/contents/'+encodedPath(expectedPath)+'?ref='+encodeURIComponent(ref));
    if(!file||file.type!=='file'||!file.content)throw core.farmError('EVIDENCE_ARTIFACT_NOT_FOUND','No se encontró artefacto Evidence en el commit indicado.',409);
    const raw=Buffer.from(String(file.content).replace(/\s+/g,''),'base64').toString('utf8');
    if(sha256(raw)!==String(result.evidenceArtifactHash||'').toLowerCase())throw core.farmError('EVIDENCE_ARTIFACT_HASH_MISMATCH','El hash del artefacto Evidence no coincide.',409);
    let artifact;try{artifact=JSON.parse(raw)}catch{throw core.farmError('EVIDENCE_ARTIFACT_INVALID','Artefacto Evidence JSON inválido.',409);}
    if(String(artifact.code||'').toUpperCase()!==code)throw core.farmError('EVIDENCE_ARTIFACT_CODE_MISMATCH','Artefacto Evidence pertenece a otra entrada.',409);
    if(artifact.architecture!=='github-native')throw core.farmError('EVIDENCE_ARCHITECTURE_MISMATCH','Artefacto no es GitHub-native.',409);
    if(String(artifact.article?.articleGeneratedAt||'')!==String(result.articleGeneratedAt||'')||String(artifact.article?.articleHash||'')!==String(result.articleHash||''))throw core.farmError('EVIDENCE_ARTIFACT_VERSION_MISMATCH','Versión/hash del artículo no coincide.',409);
    if(String(artifact.status||'').toUpperCase()!==String(result.evidenceStatus||'').toUpperCase())throw core.farmError('EVIDENCE_ARTIFACT_STATUS_MISMATCH','Estado Evidence no coincide.',409);
    if(Number(artifact.evidenceRevision)!==Number(result.evidenceRevision))throw core.farmError('EVIDENCE_ARTIFACT_REVISION_MISMATCH','Evidence revision no coincide.',409);
    if(artifact.status==='REVIEWED'&&artifact.review?.reviewerType!=='human')throw core.farmError('FALSE_HUMAN_REVIEW','REVIEWED requiere revisión humana real.',409);
  }
}

async function main(){
  const event=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8')),eventIssue=event.issue,comment=event.comment;
  if(!eventIssue||!comment)return;
  let issue=await getIssue(eventIssue.number);
  if(!String(issue.title||'').startsWith('[R33 Evidence Farm][LEASED]'))return;
  let state=core.parseFarmState(issue.body||'');if(!state)return;
  if(state.workerLogin&&String(comment.user?.login||'')!==String(state.workerLogin))return;
  try{
    const farmEvent=core.parseWorkerEvent(comment.body||'');
    await verifyCheckpointArtifacts(state,farmEvent);
    issue=await getIssue(eventIssue.number);
    if(!String(issue.title||'').startsWith('[R33 Evidence Farm][LEASED]'))return;
    state=core.parseFarmState(issue.body||'');if(!state)return;
    const next=core.applyWorkerEvent(state,farmEvent,{createdAt:comment.created_at,commentId:comment.id});
    await updateIssue(issue.number,{body:core.renderBatchBody(next)});
  }catch(error){
    issue=await getIssue(eventIssue.number);
    state=core.parseFarmState(issue.body||'');
    if(!state||state.status!=='leased')return;
    const next={...state,lastRejectedEvent:{operation:'comment',commentId:Number(comment.id),reason:error.code||'EVIDENCE_FARM_EVENT_REJECTED',message:error.message,at:comment.created_at}};
    await updateIssue(issue.number,{body:core.renderBatchBody(next)});
    if(error.status>=500)throw error;
  }
}
main().catch(error=>{console.error(error);process.exitCode=1});
