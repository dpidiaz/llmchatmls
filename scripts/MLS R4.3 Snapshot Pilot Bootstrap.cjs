'use strict';

/**
 * MLS R4.3 Snapshot Pilot Bootstrap
 *
 * PLAN is read-only. APPLY is restricted to the 20x5 remote pilot, requires
 * explicit confirmation, and is crash-resumable by waveId. The workflow shares
 * the mls-global-dispatcher mutex with R4.2.
 */
const path=require('node:path');
const child=require('node:child_process');
const dispatcher=require('../MLS R32 EDITORIAL/global dispatcher/core.js');
const integration=require('../MLS R32 EDITORIAL/global dispatcher/providers/integration.js');
const buffered=require('../MLS R32 EDITORIAL/r4 buffered allocation.cjs');
const bootstrap=require('../MLS R32 EDITORIAL/r4 snapshot bootstrap.cjs');
const snapshotReservations=require('../MLS R32 EDITORIAL/r4 snapshot reservations.cjs');
const farm=require('../MLS R32 EDITORIAL/r4 snapshot farm.cjs');
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
 return {reservations:[900000001,900000002,900000003,900000004],wave:900000005};
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
function reservationSlot(record,waveId){
 const prefix='r43-wave-'+waveId+'-';
 const id=String(record?.requestId||'');
 if(!id.startsWith(prefix))return null;
 const suffix=id.slice(prefix.length);
 return /^\d{2}$/.test(suffix)?Number(suffix):null;
}
function taggedReservation(issue,waveId){
 try{
  const r=buffered.parseReservation(issue);
  return r.snapshotFarm?.schema===snapshotReservations.RESERVATION_SCHEMA&&
    r.snapshotFarm?.waveId===waveId?r:null;
 }catch{return null;}
}
function liveWaveIssue(issues,waveId){
 return issues.find(i=>String(i.title||'').startsWith('[MLS BCR R4.3][WAVE][')&&
  String(i.title||'').endsWith(' '+waveId)&&String(i.body||'').includes(waveIssue.MARKER))||null;
}
async function createOrReusePlaceholder(issues,title,body){
 const existing=issues.filter(i=>String(i.title||'')===title);
 assert(existing.length<=1,'R43_BOOT_PLACEHOLDER_DUP');
 if(existing.length)return existing[0];
 const created=await api('POST','/issues',{title,body});
 assert(created?.user?.login==='github-actions[bot]','R43_BOOT_PLACEHOLDER_OWNER');
 issues.push(created);
 return created;
}
async function persistReservation({issues,projected,waveId,slot,baseCommit,contentManifestBlobSha,now}){
 const title='[MLS R4.3][BOOTSTRAP][PENDING] '+waveId+' reservation '+String(slot).padStart(2,'0')+'/4';
 const placeholder=await createOrReusePlaceholder(
  issues,title,'R4.3 bootstrap placeholder. Not an ownership record until finalized.'
 );
 const allocated=buffered.allocate(projected,{
  size:25,
  issueNumber:Number(placeholder.number),
  requestId:'r43-wave-'+waveId+'-'+String(slot).padStart(2,'0'),
  baseCommit,
  contentManifestBlobSha,
  now
 });
 const tagged=snapshotReservations.markSnapshotReservation(allocated,waveId);
 const patched=await api('PATCH','/issues/'+placeholder.number,{
  title:'[MLS Buffered][RESERVED] '+tagged.allocation.assignmentId,
  body:buffered.renderReservation(tagged)
 });
 const parsed=buffered.parseReservation(patched);
 assert(parsed.recordHash===tagged.recordHash,'R43_BOOT_RESERVATION_PERSIST');
 return {issue:patched,reservation:parsed};
}
async function apply({waveId,createdAt,confirm}){
 assert(confirm===CONFIRM,'R43_BOOT_CONFIRMATION',
  'Apply requires exact confirmation token '+CONFIRM);
 let issues=await allOpenIssues();

 const existingWave=liveWaveIssue(issues,waveId);
 if(existingWave){
  const record=waveIssue.parse(existingWave);
  return {
   ok:true,mode:'APPLIED',idempotent:true,waveId,
   waveIssueNumber:Number(existingWave.number),
   reservationIssueNumbers:[...record.reservationIssueNumbers],
   snapshotHash:record.snapshotHash,waveHash:record.waveHash,
   totalUnits:record.totalUnits,actualApiCounts:{...counts}
  };
 }
 const otherLive=issues.filter(i=>/^\[MLS BCR R4\.3\]\[WAVE\]\[(COLLECTING|SEALED)\]/.test(String(i.title||'')));
 assert(otherLive.length===0,'R43_BOOT_OTHER_WAVE_LIVE');

 const main=await mainHead();
 assert(localHead()===main,'R43_BOOT_CHECKOUT_STALE');
 const manifest=manifestSha();
 assert(/^[a-f0-9]{40}$/.test(manifest),'R43_BOOT_MANIFEST_SHA');

 let projected=projectedSnapshot(issues,Date.parse(createdAt));
 const existingBySlot=new Map();
 for(const issue of issues){
  const r=taggedReservation(issue,waveId);
  if(!r)continue;
  const slot=reservationSlot(r,waveId);
  assert(Number.isInteger(slot)&&slot>=1&&slot<=4,'R43_BOOT_RESERVATION_SLOT');
  assert(!existingBySlot.has(slot),'R43_BOOT_RESERVATION_SLOT_DUP');
  assert(r.allocation.baseCommit===main,'R43_BOOT_RESERVATION_BASE_DRIFT');
  assert(r.allocation.contentManifestBlobSha===manifest,'R43_BOOT_RESERVATION_MANIFEST_DRIFT');
  existingBySlot.set(slot,{issue,reservation:r});
 }
 const now=Date.parse(createdAt);
 for(let slot=1;slot<=4;slot++){
  if(existingBySlot.has(slot))continue;
  const made=await persistReservation({
   issues,projected,waveId,slot,baseCommit:main,
   contentManifestBlobSha:manifest,now:now+slot
  });
  existingBySlot.set(slot,made);
  const codes=made.reservation.allocation.units.map(x=>x.code);
  projected={...projected,reservedCodes:[...(projected.reservedCodes||[]),...codes]};
 }
 const ordered=[1,2,3,4].map(slot=>existingBySlot.get(slot));
 const units=ordered.flatMap(x=>x.reservation.allocation.units);
 assert(units.length===100&&new Set(units.map(x=>x.code)).size===100,'R43_BOOT_UNIT_SET');
 const frozenAt=ordered.map(x=>x.reservation.createdAt).sort()[0];
 const snapshot=farm.createSnapshot({
  baseCommit:main,contentManifestBlobSha:manifest,units,createdAt:frozenAt,source:'github'
 });
 const wave=farm.createWave(snapshot,{
  waveId,workerCount:20,shardSize:5,createdAt:frozenAt
 });

 const wavePendingTitle='[MLS R4.3][BOOTSTRAP][PENDING] '+waveId+' wave';
 const wavePlaceholder=await createOrReusePlaceholder(
  issues,wavePendingTitle,'R4.3 bootstrap placeholder. Not active until finalized.'
 );
 const mainAfter=await mainHead();
 assert(mainAfter===main,'R43_BOOT_MAIN_DRIFT');
 const control=waveIssue.create({
  waveIssueNumber:Number(wavePlaceholder.number),
  reservationIssueNumbers:ordered.map(x=>x.reservation.issueNumber),
  snapshot,wave,createdAt:String(wavePlaceholder.created_at||createdAt),route:'remote'
 });
 const wavePatched=await api('PATCH','/issues/'+wavePlaceholder.number,{
  title:waveIssue.title(control),body:waveIssue.render(control)
 });
 const parsedWave=waveIssue.parse(wavePatched);
 waveIssue.validate(parsedWave,snapshot,wave);
 const writeCount=counts.POST+counts.PATCH;
 assert(writeCount<=10,'R43_BOOT_WRITE_BUDGET');

 return {
  ok:true,mode:'APPLIED',idempotent:false,waveId,totalUnits:wave.totalUnits,
  waveIssueNumber:Number(wavePatched.number),
  reservationIssueNumbers:ordered.map(x=>x.reservation.issueNumber),
  firstCode:units[0].code,lastCode:units.at(-1).code,
  snapshotHash:snapshot.snapshotHash,waveHash:wave.waveHash,
  protectedCodes:units.map(x=>x.code),
  actualApiCounts:{...counts},contentWriteCount:writeCount
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
module.exports={CONFIRM,planOnly,apply,run,reservationSlot,taggedReservation,liveWaveIssue};
