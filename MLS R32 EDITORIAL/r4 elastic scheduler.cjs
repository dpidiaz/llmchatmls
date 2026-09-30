'use strict';
// GitHub-only, serialized R4.2 BCR Dispatcher. Chat workers have no durable identity
// outside the reservation + their issue and branch. No API, cloud or paid fallback.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const buffered=require('./r4 buffered allocation.cjs');
const bcr=require('./r4 buffered context.cjs');
const core=require('./r4 buffered core.cjs');
const dispatcherCore=require('./global dispatcher/core.js');
const provider=require('./global dispatcher/providers/integration.js');
const elastic=require('./r4 elastic core.cjs');
const universal=require('./r4 universal scheduler.cjs');
const PREFIX='r42-buffer/';
function fail(code){core.error('R42_'+code);}
function requireOk(cond,code){if(!cond)fail(code);}
function encodedPath(value){return String(value).split('/').map(encodeURIComponent).join('/');}
function jsonString(x){return typeof x==='string'?x:JSON.stringify(x,null,2)+'\n';}
async function refHead(api,branch){
 try{const r=await api.get('/git/ref/heads/'+encodedPath(branch));return r?.object?.sha||null;}
 catch(e){if(e.status===404)return null;throw e;}
}
async function remoteFile(api,file,sha){
 const r=await api.get('/contents/'+encodedPath(file)+'?ref='+sha);
 requireOk(r?.encoding==='base64'&&typeof r.content==='string','FILE_RESPONSE');
 return {value:JSON.parse(Buffer.from(r.content.replace(/\s/g,''),'base64').toString('utf8')),blobSha:r.sha};
}
async function groupedCommit(api,parent,files,message){
 const c=await api.get('/git/commits/'+parent);
 requireOk(c?.tree?.sha,'PARENT_TREE');
 const names=new Set();
 const tree=files.map(f=>{
  requireOk(typeof f.path==='string'&&!f.path.startsWith('/')&&!f.path.split('/').includes('..')&&!names.has(f.path),'UNSAFE_OR_DUPLICATE_WRITE');
  names.add(f.path);
  return {path:f.path,mode:'100644',type:'blob',content:jsonString(f.value)};
 });
 const t=await api.post('/git/trees',{base_tree:c.tree.sha,tree});
 const commit=await api.post('/git/commits',{message,tree:t.sha,parents:[parent]});
 requireOk(/^[a-f0-9]{40}$/.test(commit.sha||''),'COMMIT_RESPONSE');
 return commit.sha;
}
async function publishNewBranch(api,branch,parent,commit){
 requireOk(!(await refHead(api,branch)),'BRANCH_ALREADY_EXISTS');
 await api.post('/git/refs',{ref:'refs/heads/'+branch,sha:commit||parent});
 requireOk((await refHead(api,branch))===(commit||parent),'BRANCH_READBACK');
}
async function moveBranch(api,branch,expected,newSha){
 requireOk(await refHead(api,branch)===expected,'CONCURRENT_BRANCH');
 await api.patch('/git/refs/heads/'+encodedPath(branch),{sha:newSha,force:false});
 requireOk(await refHead(api,branch)===newSha,'BRANCH_COMMIT_READBACK');
}
async function saveReservation(api,res,expectedRecordHash=null){
 const current=await api.get('/issues/'+res.issueNumber);
 const prior=buffered.parseReservation(current);
 if(expectedRecordHash!==null)requireOk(prior.recordHash===expectedRecordHash,'CONCURRENT_RESERVATION');
 requireOk(res.allocationHash===prior.allocationHash,'ALLOCATION_CHANGED');
 await api.patch('/issues/'+res.issueNumber,{
  title:'[MLS Buffered]['+res.status.toUpperCase()+'] '+res.allocation.assignmentId,
  body:buffered.renderReservation(res)});
 const check=buffered.parseReservation(await api.get('/issues/'+res.issueNumber));
 requireOk(check.recordHash===res.recordHash,'RESERVATION_READBACK');
 return check;
}
function asReservations(issues){
 return buffered.reservations(issues);
}
async function baseBranch(api,res,root){
 const branch='r41/buffer/'+res.issueNumber;
 let head=await refHead(api,branch);
 if(head)return head;
 // Only a zero-checkpoint reservation may be initialized here. The Scheduler
 // never overwrites the legacy buffer and never fabricates academic results.
 const base=res.allocation.baseCommit;
 const main=await api.get('/git/ref/heads/main');
 requireOk(main?.object?.sha===base,'STALE_MAIN_BEFORE_BOOTSTRAP');
 const checkout=cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 requireOk(checkout===base,'STALE_CHECKOUT');
 const created=elastic.preblock(res,bcr.RECIPE,base);
 const sha=await groupedCommit(api,base,created.files,'buffer(r4.2): initialize immutable BCR '+res.issueNumber+' with 0/25');
 await publishNewBranch(api,branch,base,sha);
 return sha;
}
function sortedCommands(issues,action){
 return issues.filter(i=>buffered.requestAuthorized(i)&&
  String(i.title||'').startsWith('[MLS Dispatcher][BCR]['+action.toUpperCase()+']'))
  .sort((a,b)=>a.number-b.number);
}
async function finishRequest(api,issue,status,response){
 await api.patch('/issues/'+issue.number,{title:'[MLS Dispatcher][BCR]['+status+'] '+issue.number,
  body:'## MLS R4.2 — '+status+'\n\n'+JSON.stringify(response,null,2)+'\n',state:'closed',state_reason:status==='REJECTED'||status==='STALE'?'not_planned':'completed'});
}
async function createReservation(api,root,issues,globalLedger,activeStates,now){
 const ref=await api.get('/git/ref/heads/main'),main=ref?.object?.sha;
 const local=cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 requireOk(main&&main===local,'MAIN_STALE_BEFORE_RESERVE');
 const snapshot=provider.projectR33Snapshot(provider.collectR33Snapshot(issues,root),{globalLedger,globalAssignments:activeStates});
 const placeholder=await api.post('/issues',{title:'[MLS Buffered][ALLOCATING] R4.2 elastic',
  body:'Serialized Dispatcher allocation in progress; no claim is authorized until RESERVED is persisted.'});
 // The bot is verifiably GitHub's GITHUB_TOKEN actor, not a user-asserted flag.
 requireOk(placeholder.user?.login==='github-actions[bot]','AUTOMATION_ISSUE_OWNER');
 const contentManifestBlobSha=cp.execFileSync('git',['rev-parse','HEAD:content/manifest.json'],{cwd:root,encoding:'utf8'}).trim();
 const reservation=buffered.allocate(snapshot,{size:25,issueNumber:placeholder.number,
  requestId:'r42-auto-'+placeholder.number,baseCommit:main,contentManifestBlobSha,now});
 const next=elastic.withBlocks(reservation,elastic.blocks(reservation));
 await api.patch('/issues/'+placeholder.number,{title:'[MLS Buffered][RESERVED] '+next.allocation.assignmentId,
  body:buffered.renderReservation(next)});
 const confirmed=await api.get('/issues/'+placeholder.number);
 requireOk(confirmed?.user?.login==='github-actions[bot]'&&
  buffered.parseReservation(confirmed).recordHash===next.recordHash,'AUTO_RESERVATION_UNCONFIRMED');
 issues.push(confirmed);
 await baseBranch(api,next,root);
 return next;
}
function requestAge(issue,now){return now-Date.parse(issue.created_at||0);}
async function verifyClaimCompletion(api,res,block,command,issue,now){
 requireOk(block.status==='leased'&&block.claimIssueNumber===command.claimIssueNumber &&
  block.block===command.block&&res.issueNumber===command.reservationIssueNumber,'STALE_LEASE');
 requireOk(block.workerLogin===issue.user?.login,'CLAIM_OWNER_MISMATCH');
 const submittedAt=Date.parse(issue.created_at||0),expiry=Date.parse(block.expiresAt);
 // A GitHub Issue created BEFORE lease expiry is legitimate even if the
 // serialized Scheduler picks it up after expiry (bounded protected queue).
 // No claim is ever accepted after the reaper has changed the block epoch.
 requireOk(Number.isFinite(submittedAt)&&submittedAt<=now&&submittedAt<=expiry&&
  now-submittedAt<=elastic.MAX_SETTLEMENT_QUEUE_DELAY_MS,'LEASE_EXPIRED_RECLAIM');
 const claim=await api.get('/issues/'+block.claimIssueNumber);
 requireOk(claim?.user?.login===issue.user?.login &&
  String(claim?.title||'').startsWith('[MLS Dispatcher][BCR][LEASED]'),'CLAIM_NOT_OWNER');
 const sha=await refHead(api,block.branch);
 requireOk(sha===command.headSha&&sha!==block.baseSha,'REMOTE_BLOCK_NOT_COMMITTED');
 const master=await refHead(api,'r41/buffer/'+res.issueNumber);
 requireOk(master,'BLOCK_MASTER_MISSING');
 // Compare against the immutable zero-checkpoint master buffer, not main.
 // Any worker modification to a manifest, checkpoint outside its block, or
 // another reservation is rejected even if its chunk looks valid.
 const compare=await api.get('/compare/'+master+'...'+sha);
 requireOk(compare.status==='ahead','BLOCK_NOT_DESCENDANT');
 requireOk((compare.files||[]).every(f=>f.filename.startsWith(
   PREFIX+res.issueNumber+'/blocks/'+String(block.block).padStart(2,'0')+'/')),
   'BLOCK_FOREIGN_PATH');
 const filePath=PREFIX+res.issueNumber+'/blocks/'+String(block.block).padStart(2,'0')+
  '/chunk-'+String(block.block).padStart(2,'0')+'-of-05.json';
 const [source,manifest]=await Promise.all([
  remoteFile(api,filePath,sha),
  remoteFile(api,'r41-buffer/'+res.issueNumber+'/manifest.json',
    await refHead(api,'r41/buffer/'+res.issueNumber))]);
 // Checking all Git blob SHA-1 values from the REST compare guards against a
 // forged valid-looking chunk diverging from actual persisted entries/checkpoints.
 const checked=elastic.validateChunkSubmission({
  manifest:manifest.value,block,chunk:source.value,changedFiles:(compare.files||[]).filter(f=>
   f.filename.startsWith(PREFIX+res.issueNumber+'/blocks/'+String(block.block).padStart(2,'0')+'/'))});
 requireOk(source.blobSha===elastic.gitBlobJson(source.value),'CHUNK_BLOB_DRIFT');
 return {chunkHash:checked.chunkHash,commitSha:sha,codes:checked.codes};
}
async function reconcileExpired(api,reservations,now,issues=[]){
 const result=[];
 for(let i=0;i<reservations.length;i++){
  const res=reservations[i];if(res.status!=='reserved'||!res.elastic)continue;
  let rows=elastic.blocks(res),changed=false;
  for(let j=0;j<rows.length;j++){
   const b=rows[j];if(b.status!=='leased'||Date.parse(b.expiresAt)>now||
    elastic.pendingForLease(issues,b,res.issueNumber,b.block,now))continue;
   let latest=await refHead(api,b.branch);
   if(!latest){await publishNewBranch(api,b.branch,b.baseSha);latest=b.baseSha;}
   if(latest!==b.baseSha){
    const diff=await api.get('/compare/'+b.baseSha+'...'+latest);
    const prefix=PREFIX+res.issueNumber+'/blocks/'+String(b.block).padStart(2,'0')+'/';
    // Never silently recover content written outside the isolated block scope.
    requireOk(['ahead','identical'].includes(diff.status)&&
     (diff.files||[]).every(f=>f.filename.startsWith(prefix)),'RECOVERY_SCOPE_BLOCKED');
   }
   rows[j]={...b,status:'pending',recovery:{branch:b.branch,headSha:latest,
    originalBaseSha:b.baseSha,priorClaimIssueNumber:b.claimIssueNumber},
    claimIssueNumber:null,workerLogin:null,requestId:null,branch:null,baseSha:null,
    expiresAt:null};
   const claim=await api.get('/issues/'+b.claimIssueNumber);
   if(claim.state==='open')await api.patch('/issues/'+claim.number,{
    title:'[MLS Dispatcher][BCR][EXPIRED] '+claim.number,
    body:claim.body+'\n\nLease expired. Checkpoint branch preserved for recovery; no further writes authorized.',
    state:'closed',state_reason:'not_planned'});
   changed=true;result.push({reservation:res.issueNumber,block:b.block,recoveryHead:latest});
  }
  if(changed){
   const updated=elastic.withBlocks(res,rows);
   reservations[i]=await saveReservation(api,updated,res.recordHash);
  }
 }
 return result;
}
async function consolidate(api,res,root){
 if(res.elastic?.consolidatedSha||elastic.blocks(res).some(b=>b.status!=='done'))return null;
 const branch='r41/buffer/'+res.issueNumber,head=await refHead(api,branch);
 requireOk(head,'CONSOLIDATION_BASE_MISSING');
 const rootDir='r41-buffer/'+res.issueNumber+'/';
 const [m,p,k,s]=await Promise.all([
  remoteFile(api,rootDir+'manifest.json',head),remoteFile(api,rootDir+'progress.json',head),
  remoteFile(api,rootDir+'bcr/context-pack.json',head),remoteFile(api,rootDir+'bcr/source-index.json',head)]);
 requireOk(m.value.allocationHash===res.allocationHash,'CONSOLIDATION_ALLOCATION_CHANGED');
 // Crash-safe replay: branch may already have the exact grouped join commit
 // while the terminal Issue PATCH failed/was rate limited. Reconcile immutable
 // audit + parent, never regenerate or overwrite 25 valid checkpoints.
 if(p.value.checkpointed===25){
  const audit=(await remoteFile(api,rootDir+'bcr/elastic-join-audit.json',head)).value;
  const commit=await api.get('/git/commits/'+head);
  const expected=res.elastic.blocks.map(x=>({block:x.block,sha:x.commitSha,chunkHash:x.chunkHash}));
  requireOk(audit.schema==='MLS-R4.2-JOIN-1'&&audit.reservationId===res.allocation.assignmentId&&
   audit.count===25&&core.hash(audit.blockCommits)===core.hash(expected)&&
   commit.parents?.length===1&&commit.parents[0].sha===audit.originalHead&&
   k.value.completedCodes.length===25&&!k.value.pendingCodes.length&&
   k.value.checkpointRefs.length===25,'REPLAY_JOIN_CONFLICT');
  const recovered={...res,elastic:{...res.elastic,consolidatedSha:head,
   status:'JOINED_AWAITING_CANONICAL_R33_GATE',
   consolidatedAt:new Date().toISOString(),replayedAfterRemoteReadback:true}};
  recovered.recordHash=buffered.recordHash(recovered);
  await saveReservation(api,recovered,res.recordHash);
  return {reservation:res.issueNumber,head,checkpointed:25,gatePending:true,replayed:true};
 }
 requireOk(p.value.checkpointed===0&&k.value.completedCodes.length===0&&
  !Object.keys(s.value.sources).length,'CONSOLIDATION_ALREADY_MODIFIED');
 let pack=k.value,index=s.value,progress=p.value;
 const all=new Map(),sources={};
 const b=res.elastic.blocks;
 for(let n=1;n<=5;n++){
  const status=b[n-1],block=await remoteFile(api,PREFIX+res.issueNumber+'/blocks/'+
   String(n).padStart(2,'0')+'/chunk-'+String(n).padStart(2,'0')+'-of-05.json',status.commitSha);
  requireOk(block.value.chunkHash===status.chunkHash,'CHUNK_CHANGED_AFTER_COMPLETION');
  for(const e of Object.values(block.value.entries)){
   for(const l of e.links||[]){
    if(sources[l.sourceId])continue;
    const rel='MLS R32 EDITORIAL/evidence git/registry/sources/'+l.sourceId+'.json';
    const sourcePath=path.resolve(root,rel);
    requireOk(sourcePath.startsWith(path.resolve(root)+path.sep)&&fs.existsSync(sourcePath),
     'SOURCE_REGISTRY_NOT_REGISTERED');
    // Registry is loaded from the same checked-out canonical main; do not use
    // user-provided bibliographic metadata as an authoritative registry.
    const blob=cp.execFileSync('git',['rev-parse','HEAD:'+rel],{cwd:root,encoding:'utf8'}).trim();
    const src=core.read(sourcePath);sources[l.sourceId]={...src,registryBlobSha:blob};
   }
  }
  const advanced=bcr.advance({manifest:m.value,pack,index,progress,chunk:block.value,
   sourceRegistry:sources,expectedParentCommit:head});
  requireOk(!advanced.replayed&&advanced.pack.completedCodes.length===n*5,'ADVANCE_FAILED');
  for(const f of advanced.files)all.set(f.path,f);
  pack=advanced.pack;index=advanced.index;progress=advanced.progress;
 }
 requireOk(progress.checkpointed===25&&!progress.pendingCodes.length&&
  Object.values(index.sources).every(x=>x.entryVerificationInherited===false),
  'INCOMPLETE_CONSOLIDATION');
 const files=[...all.values()].map(f=>({path:rootDir+f.path,value:f.value}));
 files.push({path:rootDir+'bcr/elastic-join-audit.json',
  value:{schema:'MLS-R4.2-JOIN-1',reservationId:res.allocation.assignmentId,
   originalHead:head,blockCommits:b.map(x=>({block:x.block,sha:x.commitSha,chunkHash:x.chunkHash})),
   count:25,verifiedInherited:0,canonicalGatePassed:false,packageSealed:false,synced:false}});
 requireOk(files.length===66,'JOIN_FILE_COUNT_UNEXPECTED'); // 50 Evidence/checkpoints + 5 chunks + progress + 4 compact files + 5 deltas + audit.
 const commit=await groupedCommit(api,head,files,'buffer(r4.2): consolidate 5 independent certified-structure chunks for '+res.issueNumber+' (NO SEAL)');
 await moveBranch(api,branch,head,commit);
 const next={...res,elastic:{...res.elastic,consolidatedSha:commit,
  status:'JOINED_AWAITING_CANONICAL_R33_GATE',consolidatedAt:new Date().toISOString()}};
 next.recordHash=buffered.recordHash(next);
 await saveReservation(api,next,res.recordHash);
 return {reservation:res.issueNumber,head:commit,checkpointed:25,gatePending:true};
}
async function drain({api,root,issues,globalLedger,activeStates,now=Date.now(),technical=false}){
 // Keep this tick's inventory current after each confirmed write.
 const upstream=api;
 api={...upstream,patch:async(route,body)=>{const value=await upstream.patch(route,body);
  const id=/^\/issues\/(\d+)$/.exec(route);if(id){const row=issues.find(x=>x.number===Number(id[1]));if(row)Object.assign(row,body);}
  return value;}};
 const commands=issues.filter(i=>!i.pull_request&&buffered.requestAuthorized(i));
 let reservations=asReservations(issues);
 const done=[],renewed=[],created=[],leased=[],busy=[],reaped=[];
 const initialSettlementCount=issues.filter(elastic.settlementIssue).length;
 // Confirm and reconcile worker submissions before freeing any capacity.
 for(const issue of sortedCommands(commands,'COMPLETE').filter(i=>!i.body.includes('"task":"repair"')&&!/"task"\s*:\s*"repair"/.test(i.body)).slice(0,elastic.MAX_SETTLEMENTS_PER_TICK)){
  try{
   const cmd=elastic.command(issue),at=reservations.findIndex(r=>r.issueNumber===cmd.reservationIssueNumber);
   requireOk(at>=0,'RESERVATION_NOT_FOUND');
   const res=reservations[at],block=elastic.blocks(res)[cmd.block-1];
   if(block.status==='done'&&block.commitSha===cmd.headSha&&block.claimIssueNumber===cmd.claimIssueNumber){
    await api.patch('/issues/'+cmd.claimIssueNumber,{title:'[MLS Dispatcher][BCR][DONE] '+cmd.claimIssueNumber,state:'closed',state_reason:'completed'});
    await finishRequest(api,issue,'REPLAY',{ok:true,commitSha:block.commitSha});continue;
   }
   const verified=await verifyClaimCompletion(api,res,block,cmd,issue,now);
   const saved=elastic.markDone(res,block,cmd.claimIssueNumber,verified.commitSha,verified.chunkHash);
   reservations[at]=await saveReservation(api,saved,res.recordHash);
   await api.patch('/issues/'+cmd.claimIssueNumber,{title:'[MLS Dispatcher][BCR][DONE] '+cmd.claimIssueNumber,
    state:'closed',state_reason:'completed'});
   await finishRequest(api,issue,'COMPLETED',{ok:true,verified});
   done.push({issue:cmd.claimIssueNumber,reservation:res.issueNumber,block:cmd.block,sha:verified.commitSha});
  }catch(e){
   if([403,429].includes(e.status)||e.status>=500)throw e;
   await finishRequest(api,issue,'REJECTED',{ok:false,error:e.code||'R42_COMPLETE_ERROR',message:e.message});
  }
 }
 for(const issue of sortedCommands(commands,'RENEW').filter(i=>!/"task"\s*:\s*"repair"/.test(i.body)).slice(0,elastic.MAX_SETTLEMENTS_PER_TICK)){
  try{
   const cmd=elastic.command(issue),at=reservations.findIndex(r=>r.issueNumber===cmd.reservationIssueNumber);
   requireOk(at>=0,'RENEW_RESERVATION_MISSING');
   const res=reservations[at],blocks=elastic.blocks(res),b=blocks[cmd.block-1];
   requireOk(b.status==='leased'&&b.claimIssueNumber===cmd.claimIssueNumber&&
    b.workerLogin===issue.user?.login&&
     Number.isFinite(Date.parse(issue.created_at||0))&&Date.parse(issue.created_at)<=now&&
     Date.parse(issue.created_at)<=Date.parse(b.expiresAt)&&
     now-Date.parse(issue.created_at)<=elastic.MAX_SETTLEMENT_QUEUE_DELAY_MS,'RENEW_NOT_OWNER_OR_EXPIRED');
   if(b.lastRenewal!==issue.number){
    blocks[cmd.block-1]={...b,lastRenewal:issue.number,expiresAt:new Date(now+elastic.TTL_MS).toISOString()};
    reservations[at]=await saveReservation(api,elastic.withBlocks(res,blocks),res.recordHash);
   }
   await finishRequest(api,issue,'RENEWED',{ok:true,expiresAt:blocks[cmd.block-1].expiresAt});
   renewed.push({reservation:res.issueNumber,block:cmd.block});
  }catch(e){if([403,429].includes(e.status)||e.status>=500)throw e;
   await finishRequest(api,issue,'REJECTED',{ok:false,error:e.code||'R42_RENEW_ERROR'});}
 }
 reaped.push(...await reconcileExpired(api,reservations,now,issues));
 // A completed batch is consolidated once, serially, without academic promotion,
 // package seal, canonical main writes, SYNC or Cloudflare.
 const joined=[];
 for(let i=0;i<reservations.length;i++){
  const r=reservations[i];
  if(r.elastic&&!r.elastic.consolidatedSha&&elastic.blocks(r).every(b=>b.status==='done')){
   const j=await consolidate(api,r,root);if(j){joined.push(j);
    reservations[i]=buffered.parseReservation(await api.get('/issues/'+r.issueNumber));}
  }
 }
 let minted=0;
 const lifecycle=await universal.drain({api,io:module.exports,root,reservations,issues,now,technical,activeStates});
 const incoming=sortedCommands(commands,'REQUEST').filter(i=>i.state!=='closed'&&!lifecycle.consumed.has(i.number));
 const repairsLeased=lifecycle.events.filter(event=>Array.isArray(event.repair)).length;
 const productionBudget=Math.max(0,elastic.MAX_LEASE_ADMISSIONS_PER_TICK-repairsLeased);
 for(const issue of incoming.slice(0,elastic.MAX_REQUESTS_PER_TICK)){
  // Leave overflow REQUESTs open in FIFO order. Never issue an unattended lease
  // after admission budget is spent, or turn temporary pacing into CAPACITY_BUSY.
  if(leased.length>=productionBudget)break;
  try{
   const cmd=elastic.command(issue);
   const oldReceipt=reservations.find(r=>r.elastic?.requestReceipts?.[cmd.requestId]);
   if(oldReceipt&&!oldReceipt.elastic.blocks.some(b=>b.requestId===cmd.requestId)){
    await finishRequest(api,issue,'REPLAY',oldReceipt.elastic.requestReceipts[cmd.requestId]);continue;
   }
   const receipt=reservations.flatMap(r=>(r.elastic?.blocks||[]).map(b=>({r,b})))
    .find(x=>x.b.requestId===cmd.requestId);
   if(receipt){
    const {r,b}=receipt;
    if(b.claimIssueNumber===issue.number&&b.status==='leased'&&Date.parse(b.expiresAt)>now){
     const current=await refHead(api,b.branch);
     if(!current)await publishNewBranch(api,b.branch,b.baseSha);
     const out=elastic.lease({...r,elastic:{...r.elastic,blocks:r.elastic.blocks.map(x=>x.block===b.block?{...x,status:'pending'}:x)}},
      {...b,status:'pending'},issue,{branch:b.branch,baseSha:b.baseSha,now:Date.parse(b.leasedAt),workerLogin:b.workerLogin});
     out.claim.expiresAt=b.expiresAt;
     await api.patch('/issues/'+issue.number,{title:'[MLS Dispatcher][BCR][LEASED] '+r.allocation.assignmentId,
      body:'Recovered original durable claim. Read docs/MLS Global Dispatcher/19 Comando universal BCR.md.\n'+dispatcherCore.renderMarked(elastic.STATUS_MARKER,out.claim)});
    }else await finishRequest(api,issue,'REPLAY',{claimIssueNumber:b.claimIssueNumber,reservation:r.issueNumber,status:b.status});
    continue;
   }
   if(requestAge(issue,now)>2*60*1000){
    await finishRequest(api,issue,'STALE',{ok:false,retryable:true,reason:'DISPOSABLE_CHAT_REQUEST_TIMED_OUT'});
    continue;
   }
   requireOk(!reservations.some(r=>(r.elastic?.blocks||[]).some(b=>b.requestId===cmd.requestId&&b.status==='leased')),
    'DUPLICATE_WORKER_REQUEST');
   if(elastic.activeCount(reservations,now,issues)+reservations.filter(r=>universal.active(r,now)||
      elastic.pendingForLease(issues,r.universal?.lease,r.issueNumber,0,now)).length+
      (activeStates||[]).length>=elastic.MAX_ACTIVE){
    await finishRequest(api,issue,'CAPACITY_BUSY',{ok:true,assigned:false,retryable:true,
     reason:'SAFE_GLOBAL_ACTIVE_BLOCK_CEILING',capacity:elastic.MAX_ACTIVE});
    busy.push(issue.number);continue;
   }
   // Academic maintenance owns its reservation, not the entire production pool.
   // universal.drain has already admitted its bounded repair share on this tick.
   let free=elastic.freeBlock(reservations,now,issues);
   if(!free){
    if(minted>=elastic.MAX_NEW_RESERVATIONS_PER_TICK){
     // A future serialized tick may create the next canonical reservation.
     // Keep this request pending rather than falsely marking capacity exhausted.
     break;
    }
    const fresh=await createReservation(api,root,issues,globalLedger,activeStates,now);
    reservations.push(fresh);created.push(fresh.issueNumber);minted++;
    free=elastic.freeBlock(reservations,now,issues);
   }
   requireOk(free,'NO_ELIGIBLE_BLOCK');
   const at=reservations.findIndex(r=>r.issueNumber===free.reservation.issueNumber);
   let res=reservations[at],master=await baseBranch(api,res,root);
   // #1881 remains a valid zero-checkpoint R4.1 reservation. For old partially
   // produced R4.1 batches, fail rather than attach independent R4.2 writers.
   if(!res.elastic){
    const existing=await remoteFile(api,'r41-buffer/'+res.issueNumber+'/progress.json',master);
    requireOk(existing.value.checkpointed===0,'LEGACY_BCR_ALREADY_STARTED');
    res=await saveReservation(api,elastic.withBlocks(res,elastic.blocks(res)),res.recordHash);
    reservations[at]=res;
   }
   const block=elastic.blocks(res)[free.block.block-1];
   const branch='r42/work/'+res.issueNumber+'/'+String(block.block).padStart(2,'0')+'/'+issue.number;
   let source=master;
   if(block.recovery){
    source=await refHead(api,block.recovery.branch);
    requireOk(source&&source===block.recovery.headSha,'RECOVERY_BRANCH_DRIFT');
    const compare=await api.get('/compare/'+block.recovery.originalBaseSha+'...'+source);
    const prefix=PREFIX+res.issueNumber+'/blocks/'+String(block.block).padStart(2,'0')+'/';
    requireOk(['ahead','identical'].includes(compare.status)&&
     (compare.files||[]).every(f=>f.filename.startsWith(prefix)),'RECOVERY_SCOPE_REJECTED');
   }
   const issued=elastic.lease(res,block,issue,{branch,baseSha:source,now,workerLogin:issue.user?.login});
   issued.reservation=elastic.withBlocks(issued.reservation,issued.reservation.elastic.blocks,{
    requestReceipts:{...res.elastic?.requestReceipts,[cmd.requestId]:{issue:issue.number,reservation:res.issueNumber,block:block.block}}});
   reservations[at]=await saveReservation(api,issued.reservation,res.recordHash);
   await publishNewBranch(api,branch,source);
   const guide=[
    '## MLS R4.2 — TRABAJO AUTOSUFICIENTE PARA ESTE CHAT',
    'No busqués otra conversación. La única titularidad válida está en el marcador de este Issue y la reserva #'+res.issueNumber+'.',
    'Contrato completo: docs/MLS Global Dispatcher/18 R4.2 Elastic BCR.md (en GitHub main).',
    '1. Verificá RESERVATION RESERVED, leaseEpoch, expiresAt y HEAD remoto == baseSha antes de cada escritura.',
    '2. Recuperá exactamente los cinco artículos contentPath del manifiesto fijado. Hacé R33 académico AI-only por separado.',
    '3. Persistí dentro de r42-buffer/'+res.issueNumber+'/blocks/'+String(block.block).padStart(2,'0')+
      '/, sin tocar el Context Pack central. Se admiten checkpoints por entrada con commits agrupados pequeños para tolerar caídas.',
    '4. Finalizá con exactamente cinco entradas, cinco checkpoints, chunk-'+String(block.block).padStart(2,'0')+
      '-of-05.json; el diff final respecto a la rama maestra debe tener solo once archivos y pasar bcr.verifyChunk.',
    '5. Leé HEAD remoto. Abrí un nuevo Issue [MLS Dispatcher][BCR][COMPLETE] con este marcador (REEMPLAZÁ headSha):',
    '<!-- '+elastic.REQUEST_MARKER,
    JSON.stringify({kind:'mls_bcr_elastic_command',version:1,action:'complete',
      requestId:'bcr-complete-'+issue.number+'-nonce',claimIssueNumber:issue.number,
      reservationIssueNumber:res.issueNumber,block:block.block,headSha:'REEMPLAZAR_SHA_REMOTO_40_HEX'}),
    '-->',
    'Si necesitás más tiempo, antes del vencimiento abrí [MLS Dispatcher][BCR][RENEW] con:',
    '<!-- '+elastic.REQUEST_MARKER,
    JSON.stringify({kind:'mls_bcr_elastic_command',version:1,action:'renew',
      requestId:'bcr-renew-'+issue.number+'-nonce',claimIssueNumber:issue.number,
      reservationIssueNumber:res.issueNumber,block:block.block}),
    '-->',
    'El Dispatcher certifica únicamente estructura/identidad del bloque; el Gate académico R33 de 25/25 sigue separado.',
    'Sin Work, OpenAI API, APIs pagadas, SYNC, main, sellado prematuro ni Cloudflare.'
   ].join('\n')+'\n\n';
   await api.patch('/issues/'+issue.number,{
    title:'[MLS Dispatcher][BCR][LEASED] '+res.allocation.assignmentId+' block-'+String(block.block).padStart(2,'0'),
    body:guide+dispatcherCore.renderMarked(elastic.STATUS_MARKER,issued.claim)});
   leased.push({issue:issue.number,reservation:res.issueNumber,block:block.block,
    branch,expiresAt:issued.claim.expiresAt,codes:issued.claim.codes,recovered:Boolean(block.recovery)});
  }catch(e){
   if([403,429].includes(e.status)||e.status>=500)throw e;
   if(reservations.some(r=>r.elastic?.blocks?.some(b=>b.claimIssueNumber===issue.number&&b.status==='leased')))throw e;
   await finishRequest(api,issue,'REJECTED',{ok:false,error:e.code||'R42_REQUEST_ERROR',
    message:e.message});
  }
 }
 const pendingSettlements=issues.filter(elastic.settlementIssue).length;
 return {leased,created,busy,done,renewed,reaped,joined,universal:lifecycle.events,
  pending:incoming.filter(i=>i.state!=='closed'&&String(i.title).startsWith('[MLS Dispatcher][BCR][REQUEST]')).length,
  pendingSettlements,settlementProgress:Math.max(0,initialSettlementCount-pendingSettlements),
  maxActive:elastic.MAX_ACTIVE,maxRequestsPerTick:elastic.MAX_REQUESTS_PER_TICK,
  maxLeaseAdmissionsPerTick:elastic.MAX_LEASE_ADMISSIONS_PER_TICK,
  maxLeaseAdmissionsPerBurst:elastic.MAX_LEASE_ADMISSIONS_PER_BURST};
}
module.exports={drain,refHead,remoteFile,groupedCommit,publishNewBranch,moveBranch,
 saveReservation,createReservation,baseBranch,verifyClaimCompletion,reconcileExpired,consolidate};
