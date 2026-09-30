'use strict';
const path=require('node:path');
const cp=require('node:child_process');
const core=require('../MLS R32 EDITORIAL/global dispatcher/core.js');
const provider=require('../MLS R32 EDITORIAL/global dispatcher/providers/integration.js');
const buffered=require('../MLS R32 EDITORIAL/r4 buffered allocation.cjs');
const farm=require('../MLS R32 EDITORIAL/r4 snapshot farm.cjs');
const snapshotReservations=require('../MLS R32 EDITORIAL/r4 snapshot reservations.cjs');
const waveIssue=require('../MLS R32 EDITORIAL/r4 snapshot wave issue.cjs');

const token=process.env.GITHUB_TOKEN||'';
const repository=process.env.GITHUB_REPOSITORY||'';
const waveId=String(process.env.MLS_R43_WAVE_ID||'').trim();
if(!token||!/^[^/]+\/[^/]+$/.test(repository))throw new Error('GITHUB_TOKEN/GITHUB_REPOSITORY missing.');
if(!/^[A-Za-z0-9._:-]{3,120}$/.test(waveId))throw new Error('MLS_R43_WAVE_ID invalid.');
const [owner,repo]=repository.split('/');
const root=path.resolve(__dirname,'..');
const writes={POST:0,PATCH:0};

async function gh(method,endpoint,body){
 if(method==='POST'||method==='PATCH')writes[method]++;
 const response=await fetch('https://api.github.com'+endpoint,{
  method,
  headers:{
   authorization:'Bearer '+token,
   accept:'application/vnd.github+json',
   'content-type':'application/json',
   'x-github-api-version':'2022-11-28',
   'user-agent':'mls-r43-pilot-initializer'
  },
  body:body===undefined?undefined:JSON.stringify(body)
 });
 const text=await response.text();let data=null;
 try{data=text?JSON.parse(text):null}catch{data=text}
 if(!response.ok){
  const e=new Error('GitHub '+response.status+': '+(data?.message||String(text).slice(0,500)));
  e.status=response.status;throw e;
 }
 return data;
}
async function pages(endpoint){
 const out=[];
 for(let page=1;page<=20;page++){
  const join=endpoint.includes('?')?'&':'?';
  const rows=await gh('GET',endpoint+join+'per_page=100&page='+page);
  if(!Array.isArray(rows))throw new Error('GitHub pagination response invalid.');
  out.push(...rows);
  if(rows.length<100)return out;
 }
 throw new Error('Open Issue inventory exceeds safe pagination bound.');
}
async function allOpenIssues(){
 return (await pages('/repos/'+owner+'/'+repo+'/issues?state=open')).filter(x=>!x.pull_request);
}
async function getMainSha(){
 const ref=await gh('GET','/repos/'+owner+'/'+repo+'/git/ref/heads/main');
 const sha=String(ref?.object?.sha||'');
 if(!/^[a-f0-9]{40}$/.test(sha))throw new Error('main SHA invalid.');
 return sha;
}
function assignmentStates(issues){
 return issues.map(i=>core.parseAssignmentState(i.body||'')).filter(Boolean);
}
function globalLedger(issues){
 const rows=issues.filter(i=>String(i.title||'')==='[MLS Dispatcher Ledger]');
 if(rows.length!==1)throw new Error('Exactly one Global Dispatcher ledger is required.');
 const ledger=core.parseLedger(rows[0].body||'');
 if(!ledger)throw new Error('Global Dispatcher ledger is invalid.');
 return ledger;
}
function taggedReservation(issue){
 try{
  const r=buffered.parseReservation(issue);
  return r.snapshotFarm?.schema===snapshotReservations.RESERVATION_SCHEMA&&
   r.snapshotFarm?.waveId===waveId?r:null;
 }catch{return null;}
}
function escapeRe(value){return String(value).replace(/[|\\{}()[\]^$+*?.-]/g,'\\$&');}
function slotOf(r){
 const re=new RegExp('^r43-wave-'+escapeRe(waveId)+'-(\\d{2})$');
 const m=re.exec(String(r.requestId||''));
 return m?Number(m[1]):null;
}
async function createReservation(projected,slot,baseCommit,contentManifestBlobSha,now){
 const requestId='r43-wave-'+waveId+'-'+String(slot).padStart(2,'0');
 const placeholder=await gh('POST','/repos/'+owner+'/'+repo+'/issues',{
  title:'[MLS Buffered][ALLOCATING] R4.3 '+waveId+' '+String(slot).padStart(2,'0'),
  body:'R4.3 Snapshot Farm ownership reservation allocation in progress.'
 });
 if(placeholder?.user?.login!=='github-actions[bot]')throw new Error('Unexpected reservation creator.');
 const allocated=buffered.allocate(projected,{
  size:25,issueNumber:placeholder.number,requestId,
  baseCommit,contentManifestBlobSha,now
 });
 const tagged=snapshotReservations.markSnapshotReservation(allocated,waveId);
 await gh('PATCH','/repos/'+owner+'/'+repo+'/issues/'+placeholder.number,{
  title:'[MLS Buffered][RESERVED] '+tagged.allocation.assignmentId,
  body:buffered.renderReservation(tagged)
 });
 const check=await gh('GET','/repos/'+owner+'/'+repo+'/issues/'+placeholder.number);
 const parsed=buffered.parseReservation(check);
 if(parsed.recordHash!==tagged.recordHash||parsed.snapshotFarm?.waveId!==waveId)
  throw new Error('R4.3 reservation readback failed.');
 return {issue:check,reservation:parsed};
}

async function main(){
 let issues=await allOpenIssues();
 const finalWave=issues.find(i=>String(i.title||'').includes('[MLS BCR R4.3][WAVE]')&&
  String(i.title||'').endsWith(' '+waveId)&&String(i.body||'').includes(waveIssue.MARKER));
 if(finalWave){
  const parsed=waveIssue.parse(finalWave);
  console.log(JSON.stringify({ok:true,idempotent:true,waveIssueNumber:finalWave.number,status:parsed.status,writes}));
  return;
 }
 const otherLive=issues.filter(i=>/^\[MLS BCR R4\.3\]\[WAVE\]\[(COLLECTING|SEALED)\]/.test(String(i.title||'')));
 if(otherLive.length)throw new Error('Another live R4.3 wave already exists: #'+otherLive[0].number);

 const mainSha=await getMainSha();
 const checkout=cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 if(checkout!==mainSha)throw new Error('Checkout is not current main.');
 const manifestSha=cp.execFileSync('git',['rev-parse','HEAD:content/manifest.json'],{cwd:root,encoding:'utf8'}).trim();
 if(!/^[a-f0-9]{40}$/.test(manifestSha))throw new Error('content/manifest.json blob SHA invalid.');

 const ledger=globalLedger(issues),states=assignmentStates(issues);
 let projected=provider.projectR33Snapshot(provider.collectR33Snapshot(issues,root),{
  globalLedger:ledger,globalAssignments:states
 });

 const existing=[];
 for(const issue of issues){
  const r=taggedReservation(issue);if(!r)continue;
  const slot=slotOf(r);
  if(!Number.isInteger(slot)||slot<1||slot>4)throw new Error('R4.3 reservation has invalid slot.');
  existing.push({slot,issue,reservation:r});
 }
 const bySlot=new Map();
 for(const row of existing){
  if(bySlot.has(row.slot))throw new Error('Duplicate R4.3 reservation slot '+row.slot);
  bySlot.set(row.slot,row);
 }
 for(const row of existing){
  if(row.reservation.allocation.baseCommit!==mainSha||
     row.reservation.allocation.contentManifestBlobSha!==manifestSha)
   throw new Error('Existing R4.3 reservation base drift; do not mix snapshots.');
 }

 const now=Date.now();
 for(let slot=1;slot<=4;slot++){
  if(bySlot.has(slot))continue;
  const made=await createReservation(projected,slot,mainSha,manifestSha,now+slot);
  bySlot.set(slot,{slot,...made});
  const codes=made.reservation.allocation.units.map(x=>x.code);
  projected={...projected,reservedCodes:[...(projected.reservedCodes||[]),...codes]};
  issues.push(made.issue);
 }
 const ordered=[1,2,3,4].map(slot=>bySlot.get(slot));
 const units=ordered.flatMap(x=>x.reservation.allocation.units);
 if(units.length!==100||new Set(units.map(x=>x.code)).size!==100)
  throw new Error('Pilot reservations are not exactly 100 unique units.');
 const frozenAt=ordered.map(x=>x.reservation.createdAt).sort()[0];
 const snapshot=farm.createSnapshot({
  baseCommit:mainSha,contentManifestBlobSha:manifestSha,units,
  createdAt:frozenAt,source:'github'
 });
 const wave=farm.createWave(snapshot,{
  waveId,workerCount:20,shardSize:5,createdAt:frozenAt
 });

 let wavePlaceholder=issues.find(i=>String(i.title||'')==='[MLS BCR R4.3][WAVE][ALLOCATING] '+waveId);
 if(!wavePlaceholder){
  wavePlaceholder=await gh('POST','/repos/'+owner+'/'+repo+'/issues',{
   title:'[MLS BCR R4.3][WAVE][ALLOCATING] '+waveId,
   body:'R4.3 Snapshot Farm wave control allocation in progress.'
  });
  if(wavePlaceholder?.user?.login!=='github-actions[bot]')throw new Error('Unexpected wave Issue creator.');
 }
 const record=waveIssue.create({
  waveIssueNumber:wavePlaceholder.number,
  reservationIssueNumbers:ordered.map(x=>x.reservation.issueNumber),
  snapshot,wave,createdAt:new Date().toISOString(),route:'remote'
 });
 await gh('PATCH','/repos/'+owner+'/'+repo+'/issues/'+wavePlaceholder.number,{
  title:waveIssue.title(record),body:waveIssue.render(record)
 });
 const check=await gh('GET','/repos/'+owner+'/'+repo+'/issues/'+wavePlaceholder.number);
 const parsed=waveIssue.parse(check);
 waveIssue.validate(parsed,snapshot,wave);
 console.log(JSON.stringify({
  ok:true,idempotent:false,waveId,waveIssueNumber:check.number,
  reservationIssueNumbers:record.reservationIssueNumbers,
  snapshotHash:snapshot.snapshotHash,waveHash:wave.waveHash,
  workers:20,totalUnits:100,writes
 }));
 if(writes.POST+writes.PATCH>10)throw new Error('Initializer exceeded ten content writes.');
}
main().catch(error=>{
 console.error(error&&error.stack||error);
 process.exitCode=1;
});
