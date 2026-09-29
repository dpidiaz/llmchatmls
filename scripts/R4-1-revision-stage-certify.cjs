'use strict';
// Read-only R4.1 versioned-stage reconciliation. Never patches #709/#1861 or pushes code.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const dispatcher=require('../MLS R32 EDITORIAL/global dispatcher/core.js');
const buffer=require('../MLS R32 EDITORIAL/r4 buffered core.cjs');
const evidence=require('../MLS R32 EDITORIAL/evidence git.js');
const academic=require('../MLS R32 EDITORIAL/r4 buffered academic.cjs');
const STAGE_PATH='docs/MLS Global Dispatcher/13 R4.1 Piloto 1861 staged revision v3.json';
const sha40=x=>/^[a-f0-9]{40}$/i.test(String(x||''));
const sha64=x=>/^[a-f0-9]{64}$/i.test(String(x||''));
function fail(code,detail){const e=new Error(detail?code+': '+detail:code);e.code=code;throw e;}
function assert(b,code,detail){if(!b)fail(code,detail);}
function read(root,file){return JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));}
function sameCodes(a,b){return Array.isArray(a)&&a.length===b.length&&a.slice().sort().every((x,i)=>x===b.slice().sort()[i]);}
async function verifyLocal(root='.'){
 const record=read(root,STAGE_PATH),manifest=read(root,record.candidate.revisionManifestPath);
 assert(record.kind==='mls_r41_versioned_staging_supersession'&&record.schemaVersion===1,'R41_STAGE_SCHEMA');
 assert(record.assignmentId==='MLS-BUFFER-001861'&&record.revisionId===manifest.revisionId,'R41_REVISION_ID');
 assert(sha40(record.originalTerminal.commitSha)&&sha64(record.originalTerminal.packageHash),'R41_PREVIOUS_ID_INVALID');
 assert(record.originalTerminal.commitSha===manifest.parentStageCommit,'R41_ORIGINAL_COMMIT_MISMATCH');
 assert(record.candidate.baseMain===manifest.baseMain,'R41_MAIN_BASE_MISMATCH');
 assert(record.candidate.headCommit==='3ae4eed73c05c4d6f426fc21dd44695f7057552e','R41_CANDIDATE_CHANGED');
 assert(record.reconciliation.historicalTerminalImmutable===true&&
 record.reconciliation.approvedForMergeIntoMain===false&&
 record.reconciliation.publicationHoldReleaseAuthorized===false&&
 record.reconciliation.reviewedByHuman===false&&
 record.reconciliation.cloudflareDeploymentAuthorized===false,'R41_UNSAFE_RELEASE_FLAGS');
 assert(manifest.qualityHoldReleaseAuthorized===false&&manifest.reviewedByHuman===false,'R41_UNSAFE_REVISION_MANIFEST');
 const holds=read(root,'MLS R32 EDITORIAL/evidence git/quality-holds.json');
 const hold=(holds.holds||[]).find(x=>x.workId===record.originalTerminal.workId);
 assert(hold?.status==='active'&&hold.commitSha===record.originalTerminal.commitSha&&
 hold.packageHash===record.originalTerminal.packageHash,'R41_HISTORICAL_HOLD_NOT_ACTIVE');
 const rows=manifest.correctedEntries;
 assert(rows.length===10&&record.candidate.count===10&&new Set(rows.map(x=>x.code)).size===10,'R41_REVISION_CODE_COUNT');
 assert(sameCodes(rows.map(x=>x.code),hold.codes),'R41_HOLD_CODES_MISMATCH');
 const git=(...args)=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 try{git('merge-base','--is-ancestor',record.originalTerminal.commitSha,'HEAD');}catch{fail('R41_OLD_STAGE_NOT_ANCESTOR');}
 let claims=0,links=0;
 for(const row of rows){
  const code=row.code;
  const epath='MLS R32 EDITORIAL/evidence git/entries/espanol-guatemala/'+code+'.json';
  const old=JSON.parse(git('show',record.originalTerminal.commitSha+':'+epath));
  const current=read(root,epath);
  assert(buffer.hash(old)===row.oldEvidenceHash,'R41_PREVIOUS_CONTENT_HASH',code);
  assert(buffer.hash(current)===row.correctedEvidenceHash,'R41_REVISED_CONTENT_HASH',code);
  assert(current.evidenceRevision===3&&current.review===null&&current.provenance?.parentStageCommit===record.originalTerminal.commitSha,
    'R41_EVIDENCE_PROVENANCE',code);
  assert(row.claims===3&&row.links===3&&current.claims.length===3&&current.links.length===3,'R41_SECTION_COVERAGE',code);
  const article=read(root,current.contentPath);
  const academicResult=academic.inspect(current,article);
  assert(academicResult.ok,'R41_ACADEMIC_STRUCTURE',code+': '+academicResult.errors.join(','));
  const r33=await evidence.assessEntry(root,current);
  assert(r33.ok&&r33.derivedStatus==='VERIFIED','R41_CANONICAL_CERTIFICATION',code+': '+(r33.errors||[]).join(','));
  claims+=current.claims.length;links+=current.links.length;
 }
 assert(claims===record.candidate.claims&&links===record.candidate.links,'R41_PACKAGE_COUNTS');
 assert(sameCodes(rows.filter(x=>x.articleEdited).map(x=>x.code),record.candidate.correctedArticleCodes),'R41_EDITED_ARTICLE_SCOPE');
 for(const id of record.candidate.newSourceIds){
  const row=read(root,'MLS R32 EDITORIAL/evidence git/registry/sources/'+id+'.json');
  assert(row.sourceId===id&&row.metadata.status==='active'&&row.metadata.authorityTier==='A',
   'R41_NEW_SOURCE_REGISTRY',id);
 }
 return {ok:true,revisionId:record.revisionId,oldStageCommit:record.originalTerminal.commitSha,
  expectedMainSha:record.candidate.baseMain,workId:record.originalTerminal.workId,
  correctedCodes:rows.map(x=>x.code),claims,links,holdActive:true};
}
function locks(rec){
 const raw=[...(rec.completedUnits||[]),...(rec.resourceLocks||rec.workItem?.resourceLocks||[])];
 return raw.map(x=>String(x).startsWith('entry:')?String(x).slice(6):String(x)).filter(x=>/^MLS-V\d{2}-\d{4}$/.test(x));
}
function verifyLedger({ledger,originalIssue,mainRef,stageRef},local,record){
 assert(ledger?.kind==='mls_global_dispatch_ledger'&&ledger.terminal,'R41_LIVE_LEDGER_INVALID');
 const t=ledger.terminal[local.workId],ref=record.originalTerminal;
 assert(t?.status==='certified'&&t.provider==='r33-farm'&&t.assignmentId===record.assignmentId&&
 t.commitSha===ref.commitSha&&t.branch===ref.branch&&t.bufferPackageHash===ref.packageHash,
 'R41_ORIGINAL_TERMINAL_DIVERGED');
 assert(sameCodes(t.completedUnits,local.correctedCodes),'R41_TERMINAL_CODE_MISMATCH');
 const set=new Set(local.correctedCodes);
 for(const [id,other] of Object.entries(ledger.terminal)){
  if(id===local.workId||other?.provider!=='r33-farm')continue;
  if((other.completedUnits||[]).some(x=>set.has(x)))fail('R41_TERMINAL_DUPLICATE',id);
 }
 for(const [id,recovery] of Object.entries(ledger.recoveries||{})){
  if(recovery?.workItem?.provider==='r33-farm'&&locks(recovery).some(code=>set.has(code)))
   fail('R41_RECOVERY_COLLISION',id);
 }
 assert(originalIssue?.state==='closed'&&originalIssue.title==='[MLS Buffered][DONE] '+record.assignmentId,
  'R41_HISTORICAL_ISSUE_CHANGED');
 const match=String(originalIssue.body||'').match(/<!--\s*MLS_BUFFERED_RESERVATION\s*\n([\s\S]*?)\n-->/);
 assert(!!match,'R41_ORIGINAL_RESERVATION_MISSING');
 const body=JSON.parse(match[1]);
 assert(body.issueNumber===ref.issueNumber&&body.stage?.commitSha===ref.commitSha&&
 body.stage?.packageHash===ref.packageHash&&body.allocation?.assignmentId===record.assignmentId,
 'R41_ISSUE_STAGE_MISMATCH');
 assert(String(stageRef?.object?.sha||'').toLowerCase()===ref.commitSha,'R41_OLD_STAGE_REF_CHANGED');
 assert(String(mainRef?.object?.sha||'').toLowerCase()===local.expectedMainSha,'R41_MAIN_MOVED_REBASE_REQUIRED');
 return {...local,liveLedgerMatched:true,liveOriginalReservationMatched:true,oldStageRefUnchanged:true,
  noOtherTerminalCollision:true,noRecoveryCollision:true,publicationHoldStillActive:true,
  releaseAuthorized:false,status:'VERSIONED_STAGING_RECONCILED_NOT_PUBLISHED'};
}
async function githubGet(endpoint,{token=process.env.GITHUB_TOKEN,repo=process.env.GITHUB_REPOSITORY||'dpidiaz/llmchatmls',
 request=globalThis.fetch}={}){
 assert(typeof token==='string'&&token.length>10&&repo==='dpidiaz/llmchatmls','R41_READ_TOKEN_REQUIRED');
 const res=await request('https://api.github.com/repos/'+repo+endpoint,{method:'GET',headers:{
  accept:'application/vnd.github+json','x-github-api-version':'2022-11-28',
  'user-agent':'mls-r41-versioned-stage-auditor',authorization:'Bearer '+token}});
 if(res.status===403||res.status===429)fail('R41_GITHUB_READ_BLOCKED','Do not retry burst; respect Retry-After '+(res.headers.get('retry-after')||'not supplied'));
 if(!res.ok)fail('R41_GITHUB_READ_FAILED',endpoint+' '+res.status);
 return res.json();
}
async function run(root='.',get=githubGet){
 const record=read(root,STAGE_PATH),local=await verifyLocal(root);
 // Read-only remote checks, not a new lease or a new terminal. Never write to GitHub here.
 const [ledgerIssue,originalIssue,mainRef,stageRef]=await Promise.all([
  get('/issues/709'),get('/issues/1861'),get('/git/ref/heads/main'),get('/git/ref/heads/r41/staged/1861')]);
 const ledger=dispatcher.parseLedger(ledgerIssue?.body||'');
 assert(ledger,'R41_GITHUB_LEDGER_CORRUPT');
 return verifyLedger({ledger,originalIssue,mainRef,stageRef},local,record);
}
if(require.main===module)run(process.cwd()).then(out=>process.stdout.write(JSON.stringify(out,null,2)+'\n'))
 .catch(e=>{process.stderr.write((e.code||'R41_RECONCILIATION_FAILED')+': '+e.message+'\n');process.exitCode=2;});
module.exports={STAGE_PATH,verifyLocal,verifyLedger,githubGet,run};
