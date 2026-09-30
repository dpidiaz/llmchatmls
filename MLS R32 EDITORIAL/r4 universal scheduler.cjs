'use strict';
// Called only inside mls-global-dispatcher. Reservation is the durable intent;
// issue replies and branch creation are replayable projections, not ownership.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const core=require('./r4 buffered core.cjs'),alloc=require('./r4 buffered allocation.cjs');
const elastic=require('./r4 elastic core.cjs'),gate=require('./r4 universal gate.cjs');
const sync=require('./r4 buffered sync.cjs'),transport=require('./r4 buffered transport.cjs');
const dispatcher=require('./global dispatcher/core.js');
const assert=gate.assert;
const SYNC_WORKFLOW='R4.1 Buffered Sync.yml';
function changed(res,patch){const next={...res,universal:{version:1,...res.universal,...patch}};return {...next,recordHash:alloc.recordHash(next)};}
function active(res,now){return res.universal?.lease?.status==='leased'&&Date.parse(res.universal.lease.expiresAt)>now;}
function fingerprint(res,canonicalSha){return core.hash({bufferSha:res.elastic.consolidatedSha,allocationHash:res.allocationHash,
 corrections:res.universal?.corrections||{},canonicalSha});}
function fetchObject(root,sha){
 assert(/^[a-f0-9]{40}$/.test(sha||''),'UNIVERSAL_OBJECT_SHA');
 try{gate.git(root,'cat-file','-e',sha+'^{commit}');}
 catch{gate.git(root,'fetch','--no-tags','origin',sha);}
}
function claimBody(res,lease){
 const record={kind:'mls_bcr_elastic_claim',version:1,task:'repair',status:'leased',
  reservationIssueNumber:res.issueNumber,allocationHash:res.allocationHash,block:0,
  claimIssueNumber:lease.issue,leaseEpoch:lease.issue,branch:lease.branch,baseSha:lease.baseSha,
  expiresAt:lease.expiresAt,codes:lease.codes,outputPrefix:lease.path,
  originalBufferSha:res.elastic.consolidatedSha,corrections:res.universal.corrections||{},
  gate:res.universal.gate,workerLogin:lease.workerLogin,sourceCommit:res.allocation.baseCommit};
 return ['## MLS BCR siguiente — corrección/revisión académica IA',
  'Este trabajo se completa en cualquier chat. No volver al chat productor.',
  'Leer docs/MLS Global Dispatcher/19 Comando universal BCR.md y la reserva viva antes de escribir.',
  'Recuperar el buffer y las correcciones por SHA; consultar realmente las fuentes y registrar decisiones por afirmación.',
  'Persistir solo entries/<code>.json + checkpoints/<code>.json + reviews/<code>.json dentro de outputPrefix.',
  'Conservar entradas ya correctas. No inventar verificación: el informe contiene errores reales de R33.',
  'Renovar antes de 5 minutos con RENEW, task:"repair", block:0; completar con COMPLETE y headSha confirmado.',
  'FREE ONLY. La automatización posterior ejecuta Gate, sellado y sync; no integra main ni despliega.',
  dispatcher.renderMarked(elastic.STATUS_MARKER,record)].join('\n\n');
}
async function reply(api,res,lease){
 await api.patch('/issues/'+lease.issue,{title:'[MLS Dispatcher][BCR][LEASED] repair '+res.allocation.assignmentId,
  body:claimBody(res,lease)});
}
async function finish(api,issue,status,data){
 await api.patch('/issues/'+issue.number,{title:'[MLS Dispatcher][BCR]['+status+'] '+issue.number,
  body:JSON.stringify(data,null,2),state:'closed',state_reason:status==='REJECTED'?'not_planned':'completed'});
}
function checkScope(files,lease){
 const allowed=new Set(lease.codes.flatMap(c=>['entries','checkpoints','reviews'].map(d=>lease.path+d+'/'+c+'.json')));
 assert(Array.isArray(files)&&files.length<=allowed.size&&files.every(f=>allowed.has(f.filename)&&['added','modified'].includes(f.status)),
  'REPAIR_FOREIGN_OR_DELETED_PATH');
}
async function validateCompletion({api,io,root,res,lease,command,issue,now}){
 assert(lease?.status==='leased'&&lease.issue===command.claimIssueNumber&&lease.workerLogin===issue.user?.login,'REPAIR_STALE_OWNER');
 const submitted=Date.parse(issue.created_at||'');
 assert(submitted<=Date.parse(lease.expiresAt)&&submitted<=now&&now-submitted<=120000,'REPAIR_EXPIRED');
 assert(await io.refHead(api,lease.branch)===command.headSha,'REPAIR_HEAD_DRIFT');
 const compare=await api.get('/compare/'+lease.scopeBase+'...'+command.headSha);
 assert(compare.status==='ahead','REPAIR_NOT_DESCENDANT');checkScope(compare.files,lease);
 fetchObject(root,command.headSha);
 const corrections={...res.universal.corrections};
 for(const code of lease.codes){
  const entry=gate.readGit(root,command.headSha,lease.path+'entries/'+code+'.json');
  const checkpoint=gate.readGit(root,command.headSha,lease.path+'checkpoints/'+code+'.json');
  const review=gate.readGit(root,command.headSha,lease.path+'reviews/'+code+'.json');
  const unit=res.allocation.units.find(u=>u.code===code);
  assert(unit&&entry.code===code&&entry.language===unit.language&&entry.contentPath===unit.contentPath&&entry.architecture==='github-native','REPAIR_ENTRY_IDENTITY');
  assert(checkpoint.schema===core.SCHEMA&&checkpoint.code===code&&checkpoint.entrySha===core.hash(entry)&&
   checkpoint.evidenceArtifactPath===unit.evidenceArtifactPath&&checkpoint.allocationHash===res.allocationHash,'REPAIR_CHECKPOINT_DRIFT');
  const assessment=await gate.assessEntry(root,entry,review);
  assert(assessment.ok,'REPAIR_GATE_FAILED:'+code+':'+assessment.errors.join(','));
  corrections[code]={sha:command.headSha,path:lease.path,entryHash:core.hash(entry)};
 }
 return corrections;
}
async function analyze({api,io,root,res,canonicalSha}){
 fetchObject(root,res.elastic.consolidatedSha);
 for(const c of Object.values(res.universal?.corrections||{}))fetchObject(root,c.sha);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'mls-universal-'));
 try{
  const {reviews}=await gate.materialize(root,res,dir);
  const report=await gate.assessBuffer(root,dir,{bufferSha:res.elastic.consolidatedSha,canonicalSha,reviews});
  // Full reports are content-addressed and immutable; preserve failed results too.
  const branch='r41/buffer/'+res.issueNumber;
  const reportPath='r42-reports/'+res.issueNumber+'/'+report.reportHash+'.json';
  const head=await io.refHead(api,branch);
  let exists=false;
  try{const prior=await io.remoteFile(api,reportPath,head);assert(core.hash(prior.value)===core.hash(report),'REPORT_HASH_COLLISION');exists=true;}
  catch(e){if(e.status!==404)throw e;}
  let reportSha=head;
  if(!exists){reportSha=await io.groupedCommit(api,head,[{path:reportPath,value:report}],
   'audit(bcr): canonical gate '+res.issueNumber+' '+report.status);
   await io.moveBranch(api,branch,head,reportSha);}
  const state={fingerprint:fingerprint(res,canonicalSha),reportHash:report.reportHash,reportPath,reportSha,
   status:report.status,failedCodes:report.failedCodes,errors:report.errors,
   failures:report.entries.filter(x=>!x.ok).map(x=>({code:x.code,errors:x.errors}))};
  return {report,state,dir};
 }catch(e){fs.rmSync(dir,{recursive:true,force:true});throw e;}
}
async function publishBundle({api,io,res,root,dir}){
 // Re-executes R33 during seal; the prior gate is not a substitute.
 await sync.seal(dir,root);
 const bundle=transport.assemble(dir),branch='r41/inbox/'+res.issueNumber;
 const head=await io.refHead(api,branch);
 if(head){const prior=await io.remoteFile(api,'r41-package.json',head);
  assert(prior.value.bundleHash===bundle.bundleHash,'IMMUTABLE_INBOX_CONFLICT');
  transport.validateBundle(prior.value);
  return {branch,sha:head,packageHash:bundle.package.packageHash,bundleHash:bundle.bundleHash};}
 const parent=gate.git(root,'rev-parse','HEAD');
 const sha=await io.groupedCommit(api,parent,[{path:'r41-package.json',value:bundle}],
  'buffer(bcr): seal '+res.issueNumber+' after actual canonical gate');
 await io.publishNewBranch(api,branch,parent,sha);
 return {branch,sha,packageHash:bundle.package.packageHash,bundleHash:bundle.bundleHash};
}
async function dispatchSync({api,io,res,issues,now}){
 const intent=res.universal.sync;
 const request=await api.get('/issues/'+intent.issue);
 // Original user-authored NEXT is the authorization, not an invented bot issue.
 assert(alloc.requestAuthorized(request)&&request.user?.login===intent.workerLogin,'SYNC_ORIGINAL_AUTHOR_REQUIRED');
 const body=dispatcher.renderMarked('MLS_BUFFERED_SYNC_REQUEST',{
  kind:'mls_buffer_sync_request',version:1,reservationIssueNumber:res.issueNumber,
  inboxBranch:'r41/inbox/'+res.issueNumber});
 if(!String(request.title).startsWith('[MLS Buffered][SYNC]'))await api.patch('/issues/'+request.number,
  {title:'[MLS Buffered][SYNC] universal '+res.issueNumber,body,state:'open'});
 // A saved intent precedes dispatch. Ambiguous responses wait before readback/retry.
 if(intent.nextAttemptAt&&Date.parse(intent.nextAttemptAt)>now)return res;
 const list=await api.get('/actions/workflows/'+encodeURIComponent(SYNC_WORKFLOW)+'/runs?event=workflow_dispatch&per_page=100');
 assert(Array.isArray(list.workflow_runs),'SYNC_RUN_LIST_INVALID');
 const runs=list.workflow_runs.filter(r=>r.display_title==='MLS buffer sync #'+intent.issue);
 if(runs.some(r=>r.status!=='completed'||r.conclusion==='success'))return res;
 if((intent.attempts||0)>=3)return res; // Requires next user request to reopen bounded attempts.
 const next=changed(res,{sync:{...intent,attempts:(intent.attempts||0)+1,
  nextAttemptAt:new Date(now+15*60000).toISOString()}});
 await io.saveReservation(api,next,res.recordHash);
 await api.post('/actions/workflows/'+encodeURIComponent(SYNC_WORKFLOW)+'/dispatches',
  {ref:'main',inputs:{request_issue:String(intent.issue)}});
 return next;
}
async function drain({api,io,root,reservations,issues,now,technical=true,activeStates=[]}){
 const consumed=new Set(),events=[];
 const save=async(index,next)=>{const saved=await io.saveReservation(api,next,reservations[index].recordHash);reservations[index]=saved;return saved;};
 // Completion and heartbeat before reaping. All are fenced by reservation epoch.
 for(const issue of issues.filter(x=>x.state!=='closed'&&alloc.requestAuthorized(x)&&/\[BCR\]\[(COMPLETE|RENEW)\]/.test(x.title||'')).slice(0,elastic.MAX_REQUESTS_PER_TICK)){
  let command;try{command=elastic.command(issue);}catch{continue;}
  if(command.task!=='repair')continue;consumed.add(issue.number);
  const index=reservations.findIndex(r=>r.issueNumber===command.reservationIssueNumber);
  try{
   assert(index>=0,'REPAIR_RESERVATION_MISSING');let res=reservations[index],lease=res.universal?.lease;
   if(command.action==='complete'&&res.universal?.lastCompletion?.issue===command.claimIssueNumber&&
      res.universal.lastCompletion.sha===command.headSha){await finish(api,issue,'REPLAY',res.universal.lastCompletion);continue;}
   if(command.action==='renew'){
    const t=Date.parse(issue.created_at||'');
    assert(lease?.status==='leased'&&lease.issue===command.claimIssueNumber&&lease.workerLogin===issue.user?.login&&
     t<=Date.parse(lease.expiresAt)&&t<=now&&now-t<=120000,'REPAIR_RENEW_STALE');
    // Replay the exact renewal, rather than extending forever on a failed reply.
    if(lease.lastRenewal!==issue.number)res=await save(index,changed(res,{lease:{...lease,lastRenewal:issue.number,
     expiresAt:new Date(now+elastic.TTL_MS).toISOString()}}));
    await reply(api,res,res.universal.lease);
    await finish(api,issue,'RENEWED',{expiresAt:res.universal.lease.expiresAt});
   }else{
    const corrections=await validateCompletion({api,io,root,res,lease,command,issue,now});
    res=await save(index,changed(res,{corrections,lease:null,recovery:null,gate:null,
     lastCompletion:{issue:lease.issue,sha:command.headSha,workerLogin:lease.workerLogin}}));
    await finish(api,{number:lease.issue},'DONE',{commitSha:command.headSha});
    await finish(api,issue,'COMPLETED',{commitSha:command.headSha});
   }
  }catch(e){if([403,429].includes(e.status)||e.status>=500)throw e;await finish(api,issue,'REJECTED',{error:e.code||e.message});}
 }
 for(let index=0;index<reservations.length;index++){
  let res=reservations[index],lease=res.universal?.lease;
  if(!lease||active(res,now))continue;
  let head=await io.refHead(api,lease.branch);
  if(!head){await io.publishNewBranch(api,lease.branch,lease.baseSha);head=lease.baseSha;}
  const compare=await api.get('/compare/'+lease.scopeBase+'...'+head);
  assert(['ahead','identical'].includes(compare.status),'REPAIR_RECOVERY_ANCESTRY');checkScope(compare.files,lease);
  res=await save(index,changed(res,{lease:null,recovery:{...lease,headSha:head}}));
  await finish(api,{number:lease.issue},'EXPIRED',{recoveryHead:head,checkpointsPreserved:true});
 }
 // At most one local gate/seal job per tick; do not burst remote writes.
 const incoming=issues.filter(x=>x.state!=='closed'&&alloc.requestAuthorized(x)&&String(x.title).startsWith('[MLS Dispatcher][BCR][REQUEST]')).sort((a,b)=>a.number-b.number);
 let maintenanceAdmitted=0;
 let analyzed=false;
 const canonicalSha=technical?gate.git(root,'rev-parse','HEAD'):null;
 for(let index=0;index<reservations.length;index++){
  let res=reservations[index];
  if(!res.elastic?.consolidatedSha)continue;
  if(res.universal?.sync){
   if(technical&&['reserved','quarantined'].includes(res.status))reservations[index]=await dispatchSync({api,io,res,issues,now});continue;
  }
  if(res.status!=='reserved')continue;
  if(technical&&!analyzed&&!active(res,now)&&(incoming.length||res.universal)&&
    (res.universal?.gate?.fingerprint!==fingerprint(res,canonicalSha)||
     (res.universal?.gate?.status==='PASS'&&!res.universal?.bundle))){
   analyzed=true;const result=await analyze({api,io,root,res,canonicalSha});
   try{
    res=await save(index,changed(res,{gate:result.state}));
    if(result.report.status==='PASS'){
     const bundle=await publishBundle({api,io,res,root,dir:result.dir});
     res=await save(index,changed(res,{bundle}));
     const origin=res.universal.lastCompletion||
      (incoming[0]?{issue:incoming[0].number,workerLogin:incoming[0].user.login}:null);
     if(origin){
      consumed.add(origin.issue);
      res=await save(index,changed(res,{sync:{issue:origin.issue,workerLogin:origin.workerLogin,attempts:0}}));
      reservations[index]=await dispatchSync({api,io,res,issues,now});
     }
    }
    events.push({reservation:res.issueNumber,gate:result.report.status,passed:result.report.passed});
   }finally{fs.rmSync(result.dir,{recursive:true,force:true});}
  }
 }
 for(const issue of incoming.slice(0,elastic.MAX_REQUESTS_PER_TICK)){
  if(consumed.has(issue.number))continue;
  let command;try{command=elastic.command(issue);}catch(e){consumed.add(issue.number);await finish(api,issue,'REJECTED',{error:e.code||e.message});continue;}
  // Same issue or requestId recovers the saved receipt, even after a reply crash.
  let index=reservations.findIndex(r=>r.universal?.requests?.[command.requestId]);
  if(index>=0){
   consumed.add(issue.number);const res=reservations[index],receipt=res.universal.requests[command.requestId];
   if(receipt.issue===issue.number&&res.universal.lease?.issue===issue.number&&active(res,now)){
    const l=res.universal.lease,head=await io.refHead(api,l.branch);
    if(!head)await io.publishNewBranch(api,l.branch,l.baseSha);
    await reply(api,res,l);
   }else await finish(api,issue,'REPLAY',receipt);
   continue;
  }
  if(now-Date.parse(issue.created_at)>120000)continue;
  // Sync remains single-writer but no longer captures unrelated NEXT requests.
  // A user-authored NEXT may re-arm one exhausted automatic sync budget.
  const awaiting=reservations.findIndex(r=>r.universal?.sync&&
   (r.universal.sync.attempts||0)>=3&&r.status!=='staged');
  if(awaiting>=0&&maintenanceAdmitted<elastic.MAX_MAINTENANCE_PER_TICK){
   consumed.add(issue.number);let pending=reservations[awaiting];
   pending=await save(awaiting,changed(pending,{sync:{...pending.universal.sync,attempts:0,nextAttemptAt:null}}));
   if(technical)reservations[awaiting]=await dispatchSync({api,io,res:pending,issues,now});
   maintenanceAdmitted++;
   await finish(api,issue,'TECHNICAL_PENDING',{reservation:pending.issueNumber,stage:pending.status,
    syncRequest:pending.universal.sync.issue,automatic:true});continue;
  }
  // Reserve at most two admission slots for repair; other requests pass through
  // to elastic production even when another reservation is gated or syncing.
  if(maintenanceAdmitted>=elastic.MAX_MAINTENANCE_PER_TICK)continue;
  index=reservations.findIndex(r=>r.elastic?.consolidatedSha&&!r.universal?.sync&&!active(r,now)&&
   (r.universal?.bundle||r.universal?.gate?.failedCodes?.length));
  if(index<0)continue;
  consumed.add(issue.number);let res=reservations[index];
  if(res.universal.bundle){
   res=await save(index,changed(res,{sync:{issue:issue.number,workerLogin:issue.user.login,attempts:0},
    requests:{...res.universal.requests,[command.requestId]:{issue:issue.number,status:'SYNC',reservation:res.issueNumber}}}));
   if(technical)reservations[index]=await dispatchSync({api,io,res,issues,now});
   maintenanceAdmitted++;
   continue;
  }
  const live=elastic.activeCount(reservations,now)+reservations.filter(r=>active(r,now)).length+activeStates.length;
  if(live>=elastic.MAX_ACTIVE){await finish(api,issue,'CAPACITY_BUSY',{retryAfterSeconds:60,reason:'GLOBAL_WRITER_LIMIT'});continue;}
  const recovery=res.universal.recovery;
  const codes=recovery?.codes||res.universal.gate.failedCodes.slice(0,5);
  const master=await io.refHead(api,'r41/buffer/'+res.issueNumber);
  const source=recovery?.headSha||master;
  if(recovery)assert(await io.refHead(api,recovery.branch)===source,'REPAIR_RECOVERY_DRIFT');
  const lease={status:'leased',issue:issue.number,requestId:command.requestId,workerLogin:issue.user.login,codes,
   branch:'r42/repair/'+res.issueNumber+'/'+issue.number,baseSha:source,scopeBase:recovery?.scopeBase||source,
   path:recovery?.path||'r42-repair/'+res.issueNumber+'/'+issue.number+'/',
   expiresAt:new Date(now+elastic.TTL_MS).toISOString()};
  // Ownership first; branches/replies can be reconstructed after any interruption.
  res=await save(index,changed(res,{lease,recovery:null,requests:{...res.universal.requests,
   [command.requestId]:{issue:issue.number,reservation:res.issueNumber,status:'REPAIR',codes}}}));
  const existing=await io.refHead(api,lease.branch);
  if(!existing)await io.publishNewBranch(api,lease.branch,source);
  else assert(existing===source,'REPAIR_GENERATIONAL_BRANCH_CONFLICT');
  await reply(api,res,lease);maintenanceAdmitted++;
  events.push({reservation:res.issueNumber,repair:codes,issue:issue.number});
 }
 return {consumed,events};
}
module.exports={changed,active,fingerprint,fetchObject,claimBody,checkScope,validateCompletion,analyze,publishBundle,dispatchSync,drain};
