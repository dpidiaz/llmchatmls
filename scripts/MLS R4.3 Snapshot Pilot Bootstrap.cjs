'use strict';

/**
 * MLS R4.3 Snapshot Pilot Bootstrap
 *
 * PLAN is read-only. APPLY is restricted to the 20x5 remote pilot and requires
 * an explicit confirmation token. The workflow must share the
 * mls-global-dispatcher concurrency group with R4.2.
 */
const path=require('node:path');
const child=require('node:child_process');
const dispatcher=require('../MLS R32 EDITORIAL/global dispatcher/core.js');
const integration=require('../MLS R32 EDITORIAL/global dispatcher/providers/integration.js');
const buffered=require('../MLS R32 EDITORIAL/r4 buffered allocation.cjs');
const bootstrap=require('../MLS R32 EDITORIAL/r4 snapshot bootstrap.cjs');
const waveIssue=require('../MLS R32 EDITORIAL/r4 snapshot wave issue.cjs');
const backoff=require('../MLS R32 EDITORIAL/r4 github backoff.cjs');

const CONFIRM='APPLY_R43_PILOT_20X5';
function fail(code,msg,status=409){const e=new Error(msg||code);e.code=code;e.status=status;throw e;}
function assert(ok,code,msg){if(!ok)fail(code,msg);}
function repoParts(){
 const repo=String(process.env.GITHUB_REPOSITORY||'');
 assert(/^[^/]+\/[^/]+$/.test(repo),'R43_BOOT_REPOSITORY');
 return repo.split('/');
}
function root(){return path.resolve(__dirname,'..');}

const counts={GET:0,POST:0,PATCH:0};
async function api(method,route,body){
 const token=process.env.GITHUB_TOKEN;
 assert(token,'R43_BOOT_TOKEN');
 backoff.check(process.env.MLS_GITHUB_COOLDOWN_FILE);
 if(Object.hasOwn(counts,method))counts[method]++;
 const [owner,repo]=repoParts();
 const res=await fetch('https://api.github.com/repos/'+owner+'/'+repo+route,{
  method,
  headers:{
   Accept:'application/vnd.github+json',
   Authorization:'Bearer '+token,
   'X-GitHub-Api-Version':'2022-11-28',
   'User-Agent':'mls-r43-bootstrap'
  },
  ...(body===undefined?{}:{body:JSON.stringify(body)})
 });
 const text=await res.text();let data=null;
 try{data=text?JSON.parse(text):null}catch{data=text}
 if(!res.ok){
  const e=new Error('GitHub '+method+' '+route+' '+res.status+' '+(data?.message||String(text).slice(0,300)));
  e.status=res.status;
  if([403,429].includes(res.status))e.cooldown=backoff.record(process.env.MLS_GITHUB_COOLDOWN_FILE,res);
  throw e;
 }
 return data;
}
async function allOpenIssues(){
 const out=[];
 for(let page=1;page<=20;page++){
  const rows=await api('GET','/issues?state=open&per_page=100&page='+page+'&sort=created&direction=asc');
  assert(Array.isArray(rows),'R43_BOOT_ISSUES');
  out.push(...rows.filter(x=>!x.pull_request));
  if(rows.length<100)return out;
 }
 fail('R43_BOOT_ISSUE_PAGE_LIMIT','Open issue inventory incomplete.',503);
}
function projectedSnapshot(issues,now){
 const registry=dispatcher.loadRegistry(root());
 const ledgerIssues=issues.filter(x=>String(x.title||'')==='[MLS Dispatcher Ledger]');
 assert(ledgerIssues.length===1,'R43_BOOT_LEDGER_CARDINALITY');
 const raw=dispatcher.parseLedger(ledgerIssues[0].body||'');
 assert(raw,'R43_BOOT_LEDGER_CORRUPT');
 const globalLedger=dispatcher.normalizeLedger(raw,registry);
 const states=issues.map(x=>dispatcher.parseAssignmentState(x.body||'')).filter(Boolean);
 const active=dispatcher.activeAssignments(states,now);
 return integration.projectR33Snapshot(
  integration.collectR33Snapshot(issues,root()),
  {globalLedger,globalAssignments:active}
 );
}
async function mainHead(){
 const ref=await api('GET','/git/ref/heads/main');
 const sha=String(ref?.object?.sha||'');
 assert(/^[a-f0-9]{40}$/.test(sha),'R43_BOOT_MAIN_SHA');
 return sha;
}
function localHead(){
 return child.execFileSync('git',['rev-parse','HEAD'],{cwd:root(),encoding:'utf8'}).trim();
}
function manifestSha(){
 return child.execFileSync('git',['rev-parse','HEAD:content/manifest.json'],{cwd:root(),encoding:'utf8'}).trim();
}
function virtualNumbers(){
 return {
  reservations:[900000001,900000002,900000003,900000004],
  wave:900000005
 };
}
async function computePlan({issues,numbers,waveId,createdAt,baseCommit}){
 const projected=projectedSnapshot(issues,Date.parse(createdAt));
 return bootstrap.plan(projected,{
  waveId,workerCount:20,shardSize:5,
  reservationIssueNumbers:numbers.reservations,
  waveIssueNumber:numbers.wave,
  baseCommit,
  contentManifestBlobSha:manifestSha(),
  createdAt,
  route:'remote'
 });
}
async function planOnly({waveId,createdAt}){
 const issues=await allOpenIssues();
 const main=await mainHead();
 assert(localHead()===main,'R43_BOOT_CHECKOUT_STALE');
 const plan=await computePlan({issues,numbers:virtualNumbers(),waveId,createdAt,baseCommit:main});
 return {
  ok:true,mode:'PLAN_ONLY',noRemoteWrites:true,
  waveId:plan.waveId,totalUnits:plan.totalUnits,
  firstCode:plan.protectedCodes[0],lastCode:plan.protectedCodes.at(-1),
  snapshotHash:plan.snapshotHash,waveHash:plan.waveHash,
  protectedCodes:plan.protectedCodes,writeBudget:plan.writeBudget,
  apiCounts:{...counts}
 };
}
async function createPlaceholder(title,body){
 return api('POST','/issues',{title,body});
}
async function apply({waveId,createdAt,confirm}){
 assert(confirm===CONFIRM,'R43_BOOT_CONFIRMATION',
  'Apply requires exact confirmation token '+CONFIRM);
 const issues=await allOpenIssues();
 const main=await mainHead();
 assert(localHead()===main,'R43_BOOT_CHECKOUT_STALE');

 // Compute the exact candidate set before creating anything.
 const preview=await computePlan({issues,numbers:virtualNumbers(),waveId,createdAt,baseCommit:main});

 const reservationIssues=[];
 for(let i=0;i<4;i++){
  reservationIssues.push(await createPlaceholder(
   '[MLS R4.3][BOOTSTRAP][PENDING] '+waveId+' reservation '+String(i+1)+'/4',
   'R4.3 bootstrap placeholder. Not an ownership record until finalized.'
  ));
 }
 const wavePlaceholder=await createPlaceholder(
  '[MLS R4.3][BOOTSTRAP][PENDING] '+waveId+' wave',
  'R4.3 bootstrap placeholder. Not active until finalized.'
 );
 const numbers={
  reservations:reservationIssues.map(x=>Number(x.number)),
  wave:Number(wavePlaceholder.number)
 };

 // The shared Global Dispatcher mutex prevents R4.2 from allocating concurrently.
 // Still verify main did not move for any external reason.
 const mainAfter=await mainHead();
 assert(mainAfter===main,'R43_BOOT_MAIN_DRIFT');

 const currentIssues=await allOpenIssues();
 const actual=await computePlan({issues:currentIssues,numbers,waveId,createdAt,baseCommit:main});
 assert(JSON.stringify(actual.protectedCodes)===JSON.stringify(preview.protectedCodes),
  'R43_BOOT_PREVIEW_DRIFT');

 for(let i=0;i<actual.reservations.length;i++){
  const r=actual.reservations[i];
  const patched=await api('PATCH','/issues/'+numbers.reservations[i],{
   title:'[MLS Buffered][RESERVED] '+r.allocation.assignmentId,
   body:buffered.renderReservation(r)
  });
  const parsed=buffered.parseReservation(patched);
  assert(parsed.recordHash===r.recordHash,'R43_BOOT_RESERVATION_PERSIST');
 }
 const wavePatched=await api('PATCH','/issues/'+numbers.wave,{
  title:waveIssue.title(actual.waveControl),
  body:waveIssue.render(actual.waveControl)
 });
 const parsedWave=waveIssue.parse(wavePatched);
 assert(parsedWave.recordHash===actual.waveControl.recordHash,'R43_BOOT_WAVE_PERSIST');

 return {
  ok:true,mode:'APPLIED',waveId,totalUnits:actual.totalUnits,
  waveIssueNumber:numbers.wave,reservationIssueNumbers:numbers.reservations,
  firstCode:actual.protectedCodes[0],lastCode:actual.protectedCodes.at(-1),
  snapshotHash:actual.snapshotHash,waveHash:actual.waveHash,
  protectedCodes:actual.protectedCodes,writeBudget:actual.writeBudget,
  actualApiCounts:{...counts}
 };
}
async function run(){
 const mode=String(process.env.MLS_R43_BOOTSTRAP_MODE||'plan').toLowerCase();
 const waveId=String(process.env.MLS_R43_WAVE_ID||'BCR-R43-PILOT-20X5');
 const createdAt=new Date().toISOString();
 if(mode==='plan')return planOnly({waveId,createdAt});
 if(mode==='apply')return apply({
  waveId,createdAt,confirm:String(process.env.MLS_R43_CONFIRM||'')
 });
 fail('R43_BOOT_MODE','mode must be plan or apply');
}
if(require.main===module){
 run().then(x=>process.stdout.write(JSON.stringify(x,null,2)+'\n'))
  .catch(e=>{console.error(e.code||'R43_BOOT_FAILED',e.message);process.exitCode=2;});
}
module.exports={CONFIRM,planOnly,apply,run};
