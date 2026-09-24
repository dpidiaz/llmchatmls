'use strict';

const SHA40=/^[a-f0-9]{40}$/;

function integrationError(code,message){
  const e=new Error(message||code);e.code=code;return e;
}
function clean(value){return String(value??'').trim();}
function normalizeChecks(values){
  if(!Array.isArray(values)||!values.length)throw integrationError('INTEGRATION_CHECKS_REQUIRED','requiredChecks debe contener al menos un check.');
  const out=[...new Set(values.map(clean).filter(Boolean))];
  if(!out.length)throw integrationError('INTEGRATION_CHECKS_REQUIRED','requiredChecks debe contener al menos un check.');
  return out;
}
function normalizeSpec(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw integrationError('INTEGRATION_SPEC_REQUIRED','integration spec requerido.');
  const prNumber=Number(raw.prNumber);
  if(!Number.isInteger(prNumber)||prNumber<1)throw integrationError('INTEGRATION_PR_INVALID','prNumber inválido.');
  const base=clean(raw.base||'main');
  if(base!=='main')throw integrationError('INTEGRATION_BASE_FORBIDDEN','R1 solo permite integrar a main.');
  const expectedHeadSha=clean(raw.expectedHeadSha).toLowerCase();
  if(!SHA40.test(expectedHeadSha))throw integrationError('INTEGRATION_HEAD_REQUIRED','expectedHeadSha debe ser SHA-40.');
  const mergeMethod=clean(raw.mergeMethod||'merge').toLowerCase();
  if(!['merge','squash','rebase'].includes(mergeMethod))throw integrationError('INTEGRATION_METHOD_INVALID','mergeMethod inválido.');
  return {
    prNumber,
    base,
    expectedHeadSha,
    mergeMethod,
    requiredChecks:normalizeChecks(raw.requiredChecks),
    postMergeChecks:Array.isArray(raw.postMergeChecks)?[...new Set(raw.postMergeChecks.map(clean).filter(Boolean))]:[],
    certifiedByWorkId:clean(raw.certifiedByWorkId)||null
  };
}
function checkMap(checks){
  const map=new Map();
  for(const c of checks||[]){
    const name=clean(c?.name||c?.context);
    if(!name)continue;
    map.set(name,clean(c?.conclusion||c?.state||c?.status).toLowerCase());
  }
  return map;
}
function successState(value){return ['success','successful','passed','pass'].includes(clean(value).toLowerCase());}

function assignmentPrSpec(policy,{prNumber,expectedHeadSha}={}){
  if(!policy||String(policy.mode||'')!=='assignment-pr')throw integrationError('INTEGRATION_POLICY_INVALID','Policy assignment-pr requerida.');
  return normalizeSpec({
    prNumber,
    base:policy.base||'main',
    expectedHeadSha,
    mergeMethod:policy.mergeMethod||'merge',
    requiredChecks:policy.requiredChecks,
    postMergeChecks:Array.isArray(policy.postMergeChecks)?policy.postMergeChecks:policy.requiredChecks,
    certifiedByWorkId:null
  });
}

function evaluatePreMerge(specRaw,snapshot){
  const spec=normalizeSpec(specRaw);
  const pr=snapshot?.pr||{};
  if(Number(pr.number)!==spec.prNumber)throw integrationError('INTEGRATION_PR_MISMATCH','PR no coincide con el spec.');
  if(clean(pr.base)!==spec.base)throw integrationError('INTEGRATION_BASE_MISMATCH','Base del PR cambió.');
  if(clean(pr.headSha||pr.head_sha).toLowerCase()!==spec.expectedHeadSha)throw integrationError('INTEGRATION_HEAD_DRIFT','El head del PR cambió respecto del SHA certificado.');
  if(pr.merged===true){
    return {ok:true,alreadyMerged:true,expectedHeadSha:spec.expectedHeadSha,mergeCommitSha:clean(pr.mergeCommitSha||pr.merge_commit_sha)||null};
  }
  if(clean(pr.state).toLowerCase()!=='open')throw integrationError('INTEGRATION_PR_NOT_OPEN','PR no está abierto ni merged.');
  if(pr.draft===true)throw integrationError('INTEGRATION_PR_DRAFT','PR está en draft.');
  if(pr.mergeable===false)throw integrationError('INTEGRATION_NOT_MERGEABLE','GitHub reporta PR no mergeable.');
  const checks=checkMap(snapshot?.checks||[]);
  const missing=[],failed=[];
  for(const name of spec.requiredChecks){
    if(!checks.has(name))missing.push(name);
    else if(!successState(checks.get(name)))failed.push({name,state:checks.get(name)});
  }
  if(missing.length)throw integrationError('INTEGRATION_CHECK_MISSING','Checks requeridos ausentes: '+missing.join(', '));
  if(failed.length)throw integrationError('INTEGRATION_CHECK_FAILED','Checks no verdes: '+failed.map(x=>x.name+'='+x.state).join(', '));
  return {
    ok:true,
    alreadyMerged:false,
    expectedHeadSha:spec.expectedHeadSha,
    mergeMethod:spec.mergeMethod,
    mergeRequest:{expected_head_sha:spec.expectedHeadSha,merge_method:spec.mergeMethod}
  };
}

function evaluatePostMerge(specRaw,{pre,mergeResult,prAfter,mainContainsMerge=false,postChecks=[]}={}){
  const spec=normalizeSpec(specRaw);
  if(!pre?.ok)throw integrationError('INTEGRATION_PRECONDITION_REQUIRED','Falta preflight válido.');
  const merged=prAfter?.merged===true||mergeResult?.merged===true||pre.alreadyMerged===true;
  if(!merged)throw integrationError('INTEGRATION_NOT_MERGED','GitHub no confirma merge.');
  if(clean(prAfter?.headSha||prAfter?.head_sha).toLowerCase()!==spec.expectedHeadSha)throw integrationError('INTEGRATION_POST_HEAD_DRIFT','Head observado después del merge no coincide con el certificado.');
  const mergeSha=clean(mergeResult?.sha||prAfter?.mergeCommitSha||prAfter?.merge_commit_sha||pre.mergeCommitSha).toLowerCase();
  if(!SHA40.test(mergeSha))throw integrationError('INTEGRATION_MERGE_SHA_REQUIRED','No hay merge SHA verificable.');
  if(!mainContainsMerge)throw integrationError('INTEGRATION_MAIN_NOT_VERIFIED','No se verificó que main contenga el merge SHA.');
  const checks=checkMap(postChecks);
  const missing=[],failed=[];
  for(const name of spec.postMergeChecks){
    if(!checks.has(name))missing.push(name);
    else if(!successState(checks.get(name)))failed.push({name,state:checks.get(name)});
  }
  if(missing.length)throw integrationError('INTEGRATION_POST_CHECK_MISSING','Checks post-merge ausentes: '+missing.join(', '));
  if(failed.length)throw integrationError('INTEGRATION_POST_CHECK_FAILED','Checks post-merge no verdes: '+failed.map(x=>x.name+'='+x.state).join(', '));
  return {ok:true,mergeCommitSha:mergeSha,idempotent:Boolean(pre.alreadyMerged)};
}


function validateMergedCheckpoint(specRaw,{pr,commitSha,mainContainsCommit=false}={}){
  const spec=normalizeSpec(specRaw);
  const sha=clean(commitSha).toLowerCase();
  if(!SHA40.test(sha))throw integrationError('INTEGRATION_CHECKPOINT_SHA_INVALID','commitSha de integración debe ser SHA-40.');
  const p=pr||{};
  const number=Number(p.number);
  const base=clean(p.base?.ref||p.base);
  const headSha=clean(p.headSha||p.head_sha||p.head?.sha).toLowerCase();
  const mergeSha=clean(p.mergeCommitSha||p.merge_commit_sha).toLowerCase();
  if(number!==spec.prNumber)throw integrationError('INTEGRATION_PR_MISMATCH','PR no coincide con el spec.');
  if(base!==spec.base)throw integrationError('INTEGRATION_BASE_MISMATCH','Base del PR cambió.');
  if(headSha!==spec.expectedHeadSha)throw integrationError('INTEGRATION_HEAD_DRIFT','El head del PR cambió respecto del SHA certificado.');
  if(p.merged!==true)throw integrationError('INTEGRATION_NOT_MERGED','PR aún no está merged.');
  if(!SHA40.test(mergeSha)||mergeSha!==sha)throw integrationError('INTEGRATION_MERGE_SHA_MISMATCH','commitSha no coincide con el merge SHA del PR.');
  if(!mainContainsCommit)throw integrationError('INTEGRATION_MAIN_NOT_VERIFIED','main no contiene el merge SHA.');
  return {ok:true,mergeCommitSha:sha};
}

module.exports={normalizeSpec,assignmentPrSpec,evaluatePreMerge,evaluatePostMerge,validateMergedCheckpoint,integrationError};
