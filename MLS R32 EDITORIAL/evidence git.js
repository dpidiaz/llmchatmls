'use strict';

const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const foundation=require('./evidence foundation.js');
const apa=require('./evidence apa.js');
const policies=require('./evidence policies.js');

const GIT_EVIDENCE_VERSION='1.0';
const GIT_EVIDENCE_ROOT=path.join('MLS R32 EDITORIAL','evidence git');
const VERIFYING_SUPPORT_TYPES=new Set(['supports','primary_source','secondary_interpretation']);

function evidenceError(code,message,status=422,extra={}){const e=new Error(message||code);e.code=code;e.status=status;Object.assign(e,extra);return e;}
function repoPath(...parts){return parts.join('/').replace(/\\/g,'/');}
function entryPath(language,code){return repoPath('MLS R32 EDITORIAL','evidence git','entries',String(language||'').trim(),String(code||'').trim().toUpperCase()+'.json');}
function sourcePath(sourceId){return repoPath('MLS R32 EDITORIAL','evidence git','registry','sources',String(sourceId||'').trim().toUpperCase()+'.json');}
function full(root,p){return path.join(root,p);}
function readJson(root,p){return JSON.parse(fs.readFileSync(full(root,p),'utf8'));}
function writeJson(root,p,value){const target=full(root,p);fs.mkdirSync(path.dirname(target),{recursive:true});const temp=target+'.tmp-'+process.pid;fs.writeFileSync(temp,JSON.stringify(value,null,2)+'\n');fs.renameSync(temp,target);return p;}
function sha256Text(value){return crypto.createHash('sha256').update(String(value)).digest('hex');}
function artifactHash(value){return sha256Text(JSON.stringify(value,null,2)+'\n');}
function listJson(root,dir){const base=full(root,dir);if(!fs.existsSync(base))return [];const out=[];for(const ent of fs.readdirSync(base,{withFileTypes:true})){const p=repoPath(dir,ent.name);if(ent.isDirectory())out.push(...listJson(root,p));else if(ent.isFile()&&ent.name.endsWith('.json'))out.push(p);}return out.sort();}
async function currentArticle(root,contentPath){
  const row=readJson(root,contentPath);
  if(!row?.code||!row?.articleMarkdown||!row?.generatedAt)throw evidenceError('ARTICLE_INVALID','Entrada canónica inválida: '+contentPath,409);
  return {code:String(row.code).toUpperCase(),articleGeneratedAt:String(row.generatedAt),articleHash:await foundation.articleHash(row.articleMarkdown),language:row.language||null,languageName:row.languageName||null,title:row.title||null,level:row.level||null,part:row.part||null,chapter:row.chapter||null};
}
async function normalizeStoredSource(raw){
  const stored=raw?.metadata?raw:{sourceId:raw?.sourceId,metadata:Object.fromEntries(Object.entries(raw||{}).filter(([k])=>k!=='sourceId'&&k!=='schemaVersion'&&k!=='migratedFrom'))};
  if(!stored.sourceId)throw evidenceError('SOURCE_ID_MISSING','Source sin sourceId.');
  const normalized=await foundation.normalizeSourceMetadata(stored.metadata||{});
  if(normalized.sourceId!==stored.sourceId)throw evidenceError('SOURCE_ID_MISMATCH','Source ID no coincide con identidad bibliográfica.',409,{expected:normalized.sourceId,received:stored.sourceId});
  return {...normalized,sourceId:stored.sourceId};
}
async function loadSource(root,sourceId){const raw=readJson(root,sourcePath(sourceId));return normalizeStoredSource(raw);}
function loadEntry(root,language,code){return readJson(root,entryPath(language,code));}
function locatorObject(link){return link?.locator&&typeof link.locator==='object'&&!Array.isArray(link.locator)?link.locator:{};}
function ruleFor(policy,claim){return policy?.claimRules?.[claim.claimType]||{};}
function sourceCounts(source,claim,policy){
  if(!source||source.status!=='active'||source.authorityTier==='X')return false;
  const rule=ruleFor(policy,claim),tiers=rule.allowedTiers||policy?.allowedTiers||['A','B','C','D'];
  return tiers.includes(source.authorityTier);
}
function linkQualifies(link,source,claim,policy){
  if(!VERIFYING_SUPPORT_TYPES.has(String(link.supportType||'').toLowerCase()))return false;
  if(!sourceCounts(source,claim,policy))return false;
  if(ruleFor(policy,claim).requiresLocator&&!Object.keys(locatorObject(link)).length)return false;
  return true;
}
async function assessEntry(root,entry){
  const errors=[],warnings=[];
  if(entry.architecture!=='github-native')errors.push('architecture_not_github_native');
  if(!/^MLS-V\d{2}-\d{4}$/.test(String(entry.code||'')))errors.push('invalid_code');
  const article=await currentArticle(root,entry.contentPath);
  const articleMatches=foundation.assertEvidenceVersionMatch(article,entry.article||{});
  if(!articleMatches)errors.push('article_version_mismatch');
  const sourceIds=[...new Set((entry.links||[]).map(x=>x.sourceId).filter(Boolean))];
  const sourceMap=new Map();
  for(const sourceId of sourceIds){
    try{const source=await loadSource(root,sourceId);sourceMap.set(sourceId,source);const av=apa.validateApaSource(source);if(!av.citationReady)errors.push('apa:'+sourceId+':'+av.errors.join(','));}
    catch(e){errors.push('source:'+sourceId+':'+(e.code||e.message));}
  }
  const policy=policies.sourcePolicyForLanguage(entry.language);
  const byClaim=new Map();for(const link of entry.links||[]){if(!byClaim.has(link.claimId))byClaim.set(link.claimId,[]);byClaim.get(link.claimId).push(link);}
  const substantial=(entry.claims||[]).filter(x=>(x.materiality||'substantial')==='substantial');
  let claimsVerified=0;
  for(const claim of substantial){
    const links=byClaim.get(claim.claimId)||[];
    if(links.some(link=>linkQualifies(link,sourceMap.get(link.sourceId),claim,policy)))claimsVerified++;
    else errors.push('unverified_claim:'+claim.claimId);
  }
  const unresolved=(entry.conflicts||[]).filter(x=>x.status==='unresolved'&&x.conflictType==='contradiction');
  if(unresolved.length)errors.push('unresolved_contradiction');
  const coverageComplete=substantial.length>0&&claimsVerified===substantial.length&&!unresolved.length;
  const citationReady=coverageComplete&&sourceMap.size>0&&[...sourceMap.values()].every(s=>apa.validateApaSource(s).citationReady);
  let derivedStatus=(entry.claims||[]).length&&sourceMap.size?'SOURCED':'UNSOURCED';
  if(coverageComplete&&citationReady&&entry.verification?.verifiedAt)derivedStatus='VERIFIED';
  if(derivedStatus==='VERIFIED'&&entry.review?.reviewedAt){
    if(entry.review.reviewerType!=='human')errors.push('false_human_review');
    else if(Date.parse(entry.review.reviewedAt)<=Date.parse(entry.verification.verifiedAt))errors.push('invalid_review_order');
    else derivedStatus='REVIEWED';
  }
  if(entry.status!==derivedStatus)errors.push('status_mismatch:'+entry.status+':'+derivedStatus);
  if(entry.review?.reviewerType==='human'&&entry.status!=='REVIEWED')warnings.push('human_review_not_promoted');
  if(entry.status==='REVIEWED'&&entry.review?.reviewerType!=='human')errors.push('reviewed_without_human');
  return {ok:errors.length===0,errors,warnings,article,claimsTotal:substantial.length,claimsVerified,sourcesTotal:sourceMap.size,coverageComplete,citationReady,derivedStatus};
}
async function validateEntry(root,entry){const a=await assessEntry(root,entry);if(!a.ok)throw evidenceError('GIT_EVIDENCE_INVALID',a.errors.join('; '),409,{assessment:a,code:entry.code});return a;}
async function validateStore(root='.'){
  const errors=[],warnings=[],entryFiles=listJson(root,repoPath('MLS R32 EDITORIAL','evidence git','entries')),sourceFiles=listJson(root,repoPath('MLS R32 EDITORIAL','evidence git','registry','sources'));
  for(const p of sourceFiles){try{await normalizeStoredSource(readJson(root,p));}catch(e){errors.push(p+': '+(e.code||e.message));}}
  let verified=0,reviewed=0;
  for(const p of entryFiles){try{const e=readJson(root,p),a=await assessEntry(root,e);if(!a.ok)errors.push(p+': '+a.errors.join(','));warnings.push(...a.warnings.map(w=>p+': '+w));if(e.status==='VERIFIED')verified++;if(e.status==='REVIEWED')reviewed++;}catch(e){errors.push(p+': '+(e.code||e.message));}}
  return {ok:errors.length===0,architecture:'github-native',sourceOfTruth:'github',cloudflareEditorialInteractions:0,d1Reads:0,d1Writes:0,entries:entryFiles.length,sources:sourceFiles.length,verified,reviewed,errors,warnings};
}
function buildIndexes(root='.'){
  const entries=listJson(root,repoPath('MLS R32 EDITORIAL','evidence git','entries')).map(p=>({p,e:readJson(root,p)})),byCode={},byLanguage={},bySource={},verified=[];
  for(const {p,e} of entries){byCode[e.code]={path:p,language:e.language,status:e.status,evidenceRevision:e.evidenceRevision,contentPath:e.contentPath};(byLanguage[e.language]??=[]).push(e.code);for(const l of e.links||[])(bySource[l.sourceId]??=[]).push(e.code);if(['VERIFIED','REVIEWED'].includes(e.status))verified.push(e.code);}
  for(const k of Object.keys(byLanguage))byLanguage[k].sort();for(const k of Object.keys(bySource))bySource[k]=[...new Set(bySource[k])].sort();verified.sort();
  return {byCode,byLanguage,bySource,verified};
}
function writeIndexes(root='.') {const x=buildIndexes(root);writeJson(root,repoPath('MLS R32 EDITORIAL','evidence git','indexes','by-code.json'),x.byCode);writeJson(root,repoPath('MLS R32 EDITORIAL','evidence git','indexes','by-language.json'),x.byLanguage);writeJson(root,repoPath('MLS R32 EDITORIAL','evidence git','indexes','by-source.json'),x.bySource);writeJson(root,repoPath('MLS R32 EDITORIAL','evidence git','indexes','verified.json'),x.verified);return x;}
async function upsertSource(root,input,{migratedFrom=null}={}){
  const normalized=await foundation.normalizeSourceMetadata(input);const p=sourcePath(normalized.sourceId);
  if(fs.existsSync(full(root,p))){const existing=readJson(root,p),current=await normalizeStoredSource(existing);if(current.identityKind!==normalized.identityKind||current.identityKey!==normalized.identityKey)throw evidenceError('SOURCE_IDENTITY_CONFLICT','Conflicto de identidad Source.',409);const merged={...(existing.metadata||{}),...Object.fromEntries(Object.entries(input).filter(([,v])=>v!==null&&v!==undefined&&v!==''))};writeJson(root,p,{schemaVersion:GIT_EVIDENCE_VERSION,sourceId:normalized.sourceId,metadata:merged,migratedFrom:existing.migratedFrom||migratedFrom});return {sourceId:normalized.sourceId,path:p,reused:true};}
  writeJson(root,p,{schemaVersion:GIT_EVIDENCE_VERSION,sourceId:normalized.sourceId,metadata:input,migratedFrom});return {sourceId:normalized.sourceId,path:p,reused:false};
}
async function applyProposal(root,input,{now=new Date().toISOString()}={}){
  const language=String(input.language||'').trim(),code=String(input.code||'').trim().toUpperCase(),contentPath=String(input.contentPath||'').trim();if(!language||!contentPath)throw evidenceError('ENTRY_REF_REQUIRED','language/contentPath son obligatorios.');
  const p=entryPath(language,code),current=fs.existsSync(full(root,p))?readJson(root,p):null,article=await currentArticle(root,contentPath);
  if(article.code!==code)throw evidenceError('ARTICLE_CODE_MISMATCH','contentPath no corresponde al código.',409);
  const currentRevision=current&&foundation.assertEvidenceVersionMatch(article,current.article)?Number(current.evidenceRevision||0):0;foundation.assertExpectedEvidenceRevision(currentRevision,input.expectedEvidenceRevision);
  const sourceMap={};for(const s of input.sources||[]){const clientId=String(s.clientId||'').trim();const src={...s};delete src.clientId;const up=await upsertSource(root,src);sourceMap[clientId]=up.sourceId;}
  const claims=[],claimMap={};for(const c of input.claims||[]){const claimId=await foundation.claimIdentity({code,articleHash:article.articleHash,sectionKey:c.sectionKey||'',summary:c.summary,claimType:c.claimType||'general',materiality:c.materiality||'substantial'});claimMap[c.clientId]=claimId;claims.push({claimId,sectionKey:c.sectionKey||null,summary:c.summary,claimType:c.claimType||'general',materiality:c.materiality||'substantial'});}
  const links=[];for(const l of input.links||[]){const claimId=claimMap[l.claimRef],sourceId=sourceMap[l.sourceRef],locator=l.locator&&typeof l.locator==='object'?l.locator:{},supportType=l.supportType;const linkId=await foundation.evidenceLinkIdentity({claimId,sourceId,supportType,locator});links.push({linkId,claimId,sourceId,supportType,locator,notes:l.notes||null,verificationMethod:l.verificationMethod||'manual_source_match'});}
  const entry={schemaVersion:GIT_EVIDENCE_VERSION,architecture:'github-native',code,language,languageName:input.languageName||article.languageName,contentPath,article,evidenceVersion:foundation.MLS_EVIDENCE_VERSION,evidenceRevision:currentRevision+1,status:'SOURCED',claims,links,conflicts:input.conflicts||[],verification:null,review:null,provenance:{generatedWithAI:true,model:input.model||null,promptVersion:input.promptVersion||'R33',runId:input.runId||null,updatedAt:now}};
  writeJson(root,p,entry);writeIndexes(root);return entry;
}
async function verifyEntry(root,{language,code,expectedEvidenceRevision,reviewer='ChatGPT R33 GitHub Native',reviewerType='chatgpt',verificationMethod='manual_source_match',runId=null,now=new Date().toISOString()}={}){
  if(reviewerType==='human')throw evidenceError('HUMAN_REVIEW_FORBIDDEN','La verificación Farm no puede fabricar REVIEWED humano.',409);
  const p=entryPath(language,code),entry=readJson(root,p);foundation.assertExpectedEvidenceRevision(entry.evidenceRevision,expectedEvidenceRevision);const a=await assessEntry(root,{...entry,status:'SOURCED',verification:null});if(!a.coverageComplete||!a.citationReady||a.errors.filter(x=>!x.startsWith('status_mismatch')).length)throw evidenceError('EVIDENCE_NOT_VERIFIABLE','Evidence no cumple cobertura/citación: '+a.errors.join(','),409);
  const snapshotHash=sha256Text(foundation.stableJson({article:entry.article,claims:entry.claims,links:entry.links,conflicts:entry.conflicts}));
  entry.evidenceRevision=Number(entry.evidenceRevision)+1;entry.status='VERIFIED';entry.verification={verifiedAt:now,reviewerType,reviewer,verificationMethod,evidenceSnapshotHash:snapshotHash,runId};entry.provenance={...(entry.provenance||{}),updatedAt:now};writeJson(root,p,entry);writeIndexes(root);return entry;
}
module.exports={GIT_EVIDENCE_VERSION,GIT_EVIDENCE_ROOT,evidenceError,repoPath,entryPath,sourcePath,readJson,writeJson,sha256Text,artifactHash,listJson,currentArticle,normalizeStoredSource,loadSource,loadEntry,assessEntry,validateEntry,validateStore,buildIndexes,writeIndexes,upsertSource,applyProposal,verifyEntry};
