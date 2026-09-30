'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const base=require('../MLS R32 EDITORIAL/r4 buffered core.cjs');
const alloc=require('../MLS R32 EDITORIAL/r4 buffered allocation.cjs');
const bcr=require('../MLS R32 EDITORIAL/r4 buffered context.cjs');
const elastic=require('../MLS R32 EDITORIAL/r4 elastic core.cjs');
const engine=require('../MLS R32 EDITORIAL/r4 elastic scheduler.cjs');
const dispatcher=require('../MLS R32 EDITORIAL/global dispatcher/core.js');
const PIN='a'.repeat(40),CONTENT='b'.repeat(40),SRC='MLS-SRC-4FD19E7F1FE011BD0049';
function fixture(issueNumber,start=4000){
 const allocation={allocatedBy:'global-dispatcher',
  assignmentId:'MLS-BUFFER-'+String(issueNumber).padStart(6,'0'),
  assignmentIssueNumber:issueNumber,leaseEpoch:issueNumber,
  poolId:'MLS-R33-FULL-CORPUS-CONTINUATION',manifestVersion:'1.0',
  baseCommit:PIN,contentManifestBlobSha:CONTENT,
  units:Array.from({length:25},(_,i)=>{
   const code='MLS-V10-'+String(start+i).padStart(4,'0');
   return {code,language:'espanol-guatemala',
    contentPath:'content/espanol-guatemala/'+code+'.json',
    evidenceArtifactPath:'MLS R32 EDITORIAL/evidence git/entries/espanol-guatemala/'+code+'.json'};
  })};
 return alloc.reservation({allocation,requestId:'elastic-fixture-'+issueNumber});
}
function request(number,requestId='elastic-request-'+number,action='next',rest={},when=Date.now()){
 const payload={kind:'mls_bcr_elastic_command',version:1,action,requestId,...rest};
 return {number,state:'open',author_association:'OWNER',user:{login:'owner'},
  created_at:new Date(when).toISOString(),
  title:'[MLS Dispatcher][BCR]['+(action==='next'?'REQUEST':action.toUpperCase())+'] '+requestId,
  body:elastic.renderCommand(payload)};
}
function issue(res){
 return {number:res.issueNumber,state:'open',title:'[MLS Buffered][RESERVED] '+res.allocation.assignmentId,
  author_association:'OWNER',user:{login:'owner'},body:alloc.renderReservation(res)};
}
function sourceEntry(u,n){
 const claimId='MLS-CLM-'+u.code+'-'+n,linkId='MLS-LNK-'+u.code+'-'+n;
 return {schemaVersion:'1.0',architecture:'github-native',code:u.code,
  language:u.language,contentPath:u.contentPath,status:'VERIFIED',evidenceRevision:2,
  article:{code:u.code,articleHash:'f'.repeat(64)},
  claims:[{claimId,sectionKey:'En pocas palabras',
   summary:'Claim individually researched '+u.code,materiality:'substantial'}],
  links:[{linkId,claimId,sourceId:SRC,supportType:'supports',
   locator:{section:'23.2a',url:'https://www.rae.es/gramatica/sintaxis/23-2a'}}],
  conflicts:[],verification:{reviewerType:'chatgpt'},review:null,
  provenance:{generatedWithAI:true,sourceOfTruth:'github'}};
}
function makeChunk(f,n){
 const m=elastic.preblock(f,bcr.RECIPE,PIN).manifest;
 const units=m.allocation.units.slice((n-1)*5,n*5),entries={},checkpoints={};
 for(const [i,u] of units.entries()){
  const e=sourceEntry(u,i);entries[u.code]=e;
  checkpoints[u.code]={schema:base.SCHEMA,code:u.code,entrySha:base.hash(e),
   evidenceArtifactPath:u.evidenceArtifactPath,allocationHash:m.allocationHash,
   assessment:'PENDING_CANONICAL_R33_VALIDATION',claimedStatus:'VERIFIED'};
 }
 const unsigned={schema:'MLS-R4.1-PARTIAL-EXPORT-1',issueNumber:f.issueNumber,
  assignmentId:f.allocation.assignmentId,allocationHash:m.allocationHash,
  chunk:n,totalChunks:5,manifest:m,entries,checkpoints,
  policy:{complete:false,sealAllowed:false}};
 return {...unsigned,chunkHash:base.hash(unsigned)};
}
test('preblock creates an independently validated zero-checkpoint Context Pack for any canonical allocation',()=>{
 const f=fixture(1881),s=elastic.preblock(f,bcr.RECIPE,PIN);
 assert.equal(s.files.length,8);
 assert.equal(s.progress.checkpointed,0);
 assert.equal(s.pack.nextBlock,1);assert.equal(s.pack.lastPersistedBlock,0);
 assert.equal(Object.keys(s.index.sources).length,0);
 assert.equal(s.plan.blocks.flatMap(b=>b.codes).length,25);
 assert.equal(new Set(s.plan.blocks.flatMap(b=>b.codes)).size,25);
 assert.equal(bcr.verifyState({manifest:s.manifest,pack:s.pack,index:s.index,progress:s.progress,sourceRegistry:{}}),true);
 assert.equal(s.files.some(x=>/package\.json/.test(x.path)),false);
});
test('5 independent blocks never share a writer; sixth disposable chat requires a second 25-unit reservation',()=>{
 let list=[fixture(1881)],received=[];
 for(let k=0;k<6;k++){
  if(!elastic.freeBlock(list,1e12))list.push(fixture(1882,4120));
  const f=elastic.freeBlock(list,1e12),i=request(2000+k);
  const branch='r42/work/'+f.reservation.issueNumber+'/'+String(f.block.block).padStart(2,'0')+'/'+i.number;
  const next=elastic.lease(f.reservation,f.block,i,{branch,baseSha:PIN,now:1e12,workerLogin:'owner'});
  list[list.findIndex(r=>r.issueNumber===f.reservation.issueNumber)]=next.reservation;
  received.push(next.claim);
 }
 assert.equal(list.length,2);
 assert.deepEqual(received.map(x=>x.block),[1,2,3,4,5,1]);
 assert.equal(new Set(received.map(x=>x.branch)).size,6);
 assert.equal(new Set(received.flatMap(x=>x.codes)).size,30);
 assert.equal(received[5].reservationIssueNumber,1882);
});
test('90 incoming chats are bounded by active capacity rather than 90 simultaneous GitHub writers',()=>{
 let all=Array.from({length:18},(_,i)=>fixture(1881+i,4200+i*25));
 const observed=[],seen=new Set();let activePeak=0,busy=0;
 for(let n=0;n<90;n++){
  if(elastic.activeCount(all,1e12)>=elastic.MAX_ACTIVE){
   busy++;continue;
  }
  const free=elastic.freeBlock(all,1e12);assert.ok(free);
  const i=request(4000+n);
  const branch='r42/work/'+free.reservation.issueNumber+'/'+String(free.block.block).padStart(2,'0')+'/'+i.number;
  const out=elastic.lease(free.reservation,free.block,i,{branch,baseSha:PIN,now:1e12,workerLogin:'owner'});
  all[all.findIndex(r=>r.issueNumber===free.reservation.issueNumber)]=out.reservation;
  for(const code of out.claim.codes){assert.equal(seen.has(code),false);seen.add(code);}
  observed.push(out.claim);activePeak=Math.max(activePeak,elastic.activeCount(all,1e12));
 }
 assert.equal(observed.length,elastic.MAX_ACTIVE);
 assert.equal(busy,90-elastic.MAX_ACTIVE);
 assert.equal(activePeak,elastic.MAX_ACTIVE);
 assert.equal(elastic.MAX_REQUESTS_PER_TICK,10);
 assert.equal(elastic.MAX_NEW_RESERVATIONS_PER_TICK,2);
 assert.equal(elastic.MAX_MAINTENANCE_PER_TICK,2);
 assert.equal(new Set(observed.map(w=>w.reservationIssueNumber)).size,10);
 assert.equal(new Set(observed.map(w=>w.branch)).size,observed.length);
});
test('lease has a five-minute epoch; stale worker cannot finalize somebody else’s block',()=>{
 const f=fixture(1881),i=request(2002);
 const b=elastic.blocks(f)[0],route='r42/work/1881/01/'+i.number;
 const got=elastic.lease(f,b,i,{branch:route,baseSha:PIN,now:1e12,workerLogin:'owner'});
 assert.equal(Date.parse(got.claim.expiresAt)-1e12,elastic.TTL_MS);
 assert.throws(()=>elastic.markDone(got.reservation,elastic.blocks(got.reservation)[0],1,'d'.repeat(40),'e'.repeat(64)),/R42_STALE_COMPLETION/);
 const renewed=request(3011,'renew-3011','renew',{claimIssueNumber:i.number,reservationIssueNumber:1881,block:1});
 assert.equal(elastic.command(renewed).action,'renew');
});
test('per-block chunk matches exact five assignments, individual immutable checkpoints and 11 remote blobs',()=>{
 const f=fixture(1881),chunk=makeChunk(f,1),block=elastic.blocks(f)[0],dir='r42-buffer/1881/blocks/01/';
 const files=[{filename:dir+'chunk-01-of-05.json',sha:elastic.gitBlobJson(chunk),status:'added'}];
 for(const c of block.codes){
  files.push({filename:dir+'entries/'+c+'.json',sha:elastic.gitBlobJson(chunk.entries[c]),status:'added'});
  files.push({filename:dir+'checkpoints/'+c+'.json',sha:elastic.gitBlobJson(chunk.checkpoints[c]),status:'added'});
 }
 const res=elastic.validateChunkSubmission({manifest:chunk.manifest,block,chunk,changedFiles:files});
 assert.equal(res.files,11);
 assert.deepEqual(res.codes,block.codes);
 const altered=structuredClone(files);altered[1].sha='f'.repeat(40);
 assert.throws(()=>elastic.validateChunkSubmission({manifest:chunk.manifest,block,chunk,changedFiles:altered}),/R42_COMMIT_PATH_OR_BLOB_DRIFT/);
 const bad=structuredClone(chunk);bad.entries[block.codes[0]].review={reviewer:'human'};
 bad.checkpoints[block.codes[0]].entrySha=base.hash(bad.entries[block.codes[0]]);
 bad.chunkHash=base.hash(Object.fromEntries(Object.entries(bad).filter(([k])=>k!=='chunkHash')));
 assert.throws(()=>elastic.validateChunkSubmission({manifest:bad.manifest,block,chunk:bad,changedFiles:files}),/R42_ENTRY_PROVENANCE_OR_CLAIMS/);
});
test('serialized R4.2 worker issue request creates one exclusive branch and persists ownership in reservation issue',async()=>{
 let res=fixture(1881),requestIssue=request(1882),reservationIssue=issue(res);
 const master='f'.repeat(40),branch='r42/work/1881/01/1882',refs={'r41/buffer/1881':master},calls=[];
 const pre=elastic.preblock(res,bcr.RECIPE,PIN);
 const api={
  async get(route){
   calls.push({method:'GET',route});
   if(route.startsWith('/git/ref/heads/')){const key=route.slice('/git/ref/heads/'.length);
    if(!refs[key]){const e=Error('404');e.status=404;throw e;}return {object:{sha:refs[key]}};}
   if(route==='/issues/1881')return reservationIssue;
   if(route.startsWith('/contents/r41-buffer/1881/progress.json?ref=')){
    return {encoding:'base64',content:Buffer.from(JSON.stringify(pre.progress)).toString('base64'),sha:'f'.repeat(40)};}
   throw Error('Unexpected GET '+route);
  },
  async post(route,body){
   calls.push({method:'POST',route});
   if(route==='/git/refs'){refs[body.ref.slice('refs/heads/'.length)]=body.sha;return {ref:body.ref};}
   throw Error('Unexpected POST '+route);
  },
  async patch(route,body){
   calls.push({method:'PATCH',route});
   if(route==='/issues/1881'){Object.assign(reservationIssue,body);return reservationIssue;}
   if(route==='/issues/1882'){Object.assign(requestIssue,body);return requestIssue;}
   throw Error('Unexpected PATCH '+route);
  }
 };
 const result=await engine.drain({api,root:'.',issues:[reservationIssue,requestIssue],globalLedger:{},
  activeStates:[],now:Date.parse(requestIssue.created_at)});
 assert.equal(result.leased.length,1);
 assert.equal(result.leased[0].branch,branch);
 assert.equal(result.leased[0].codes.length,5);
 assert.equal(refs[branch],master);
 assert.equal(alloc.parseReservation(reservationIssue).elastic.blocks[0].claimIssueNumber,1882);
 assert.match(requestIssue.title,/\[LEASED\]/);
 assert.equal(calls.filter(x=>x.method==='POST').length,1);
 assert.equal(calls.filter(x=>x.method==='PATCH').length,3); // preblock adoption, claim reservation and lease issue
});
test('bot can own only canonical durable reservation, never forge a REQUEST',()=>{
 const res=fixture(1883),r=issue(res);r.user.login='github-actions[bot]';r.author_association='NONE';
 assert.equal(alloc.requestAuthorized(r),true);
 const fake={...r,title:'[MLS Buffered][REQUEST] from bot'};
 assert.equal(alloc.requestAuthorized(fake),false);
});

test('automatic overflow creates one trusted durable 25-unit reservation and preblock branch',async()=>{
 const cp=require('node:child_process');
 const root=process.cwd(),head=cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 const placeholder={number:9900,user:{login:'github-actions[bot]',type:'Bot'},author_association:'NONE',
  title:'[MLS Buffered][ALLOCATING] R4.2 elastic',state:'open',body:''};
 const refs={main:head},writes={};
 const api={
  async get(route){
   if(route==='/git/ref/heads/main')return {object:{sha:head}};
   if(route.startsWith('/git/ref/heads/')){const name=route.slice('/git/ref/heads/'.length);
    if(!refs[name]){const e=Error('404');e.status=404;throw e;}return {object:{sha:refs[name]}};}
   if(route==='/issues/9900')return placeholder;
   if(route==='/git/commits/'+head)return {tree:{sha:'a'.repeat(40)}};
   throw Error('Unmocked reserve GET '+route);
  },
  async post(route,body){
   if(route==='/issues')return placeholder;
   if(route==='/git/trees'){writes.tree=body.tree;return {sha:'b'.repeat(40)};}
   if(route==='/git/commits'){writes.commit=body;return {sha:'c'.repeat(40)};}
   if(route==='/git/refs'){refs[body.ref.slice('refs/heads/'.length)]=body.sha;return {object:{sha:body.sha}};}
   throw Error('Unmocked reserve POST '+route);
  },
  async patch(route,body){
   if(route==='/issues/9900'){Object.assign(placeholder,body);return placeholder;}
   throw Error('Unmocked reserve PATCH '+route);
  }
 };
 const r=await engine.createReservation(api,root,[],{terminal:{},recoveries:{}},[],Date.now());
 assert.equal(r.issueNumber,9900);
 assert.equal(r.allocation.units.length,25);
 assert.equal(r.allocation.baseCommit,head);
 assert.equal(r.elastic.blocks.length,5);
 assert.equal(alloc.requestAuthorized(placeholder),true);
 assert.equal(alloc.reservations([placeholder]).length,1);
 assert.equal(refs['r41/buffer/9900'],'c'.repeat(40));
 assert.equal(writes.tree.length,8);
 assert.ok(writes.tree.every(e=>e.path.startsWith('r41-buffer/9900/')));
 assert.equal(writes.commit.parents[0],head);
});
test('five independent chunks consolidate with original bcr.advance in one group; no package/seal or main write',async()=>{
 const f=fixture(1881),initial=elastic.preblock(f,bcr.RECIPE,PIN);
 const chunks=Array.from({length:5},(_,i)=>makeChunk(f,i+1));
 const commits=Array.from({length:5},(_,i)=>String(i+1).repeat(40));
 const state=elastic.withBlocks(f,elastic.blocks(f).map((b,i)=>({...b,status:'done',
  claimIssueNumber:3000+i,commitSha:commits[i],chunkHash:chunks[i].chunkHash})));
 const ownerIssue=issue(state);let reservationIssue=ownerIssue,head='d'.repeat(40),tree=[],writes=0;
 const contents=new Map([
  ['manifest.json',initial.manifest],['progress.json',initial.progress],
  ['bcr/context-pack.json',initial.pack],['bcr/source-index.json',initial.index]
 ]);
 for(let n=1;n<=5;n++)contents.set('blocks/'+String(n).padStart(2,'0')+
  '/chunk-'+String(n).padStart(2,'0')+'-of-05.json',chunks[n-1]);
 const api={
  async get(route){
   if(route==='/git/ref/heads/r41/buffer/1881')return {object:{sha:head}};
   if(route==='/issues/1881')return reservationIssue;
   if(route==='/git/commits/'+'d'.repeat(40))return {tree:{sha:'e'.repeat(40)}};
   if(route.startsWith('/contents/')){
    const p=route.slice('/contents/'.length).split('?ref=')[0];
    const name=p.startsWith('r41-buffer/1881/')?p.slice('r41-buffer/1881/'.length):
      p.startsWith('r42-buffer/1881/')?p.slice('r42-buffer/1881/'.length):null;
    if(!contents.has(name))throw Error('Unmocked consolidation contents '+p);
    const value=contents.get(name);
    return {encoding:'base64',content:Buffer.from(JSON.stringify(value)).toString('base64'),
     sha:elastic.gitBlobJson(value)};
   }
   throw Error('Unmocked consolidation GET '+route);
  },
  async post(route,body){
   if(route==='/git/trees'){tree=body.tree;return {sha:'7'.repeat(40)};}
   if(route==='/git/commits'){writes++;assert.deepEqual(body.parents,['d'.repeat(40)]);return {sha:'8'.repeat(40)};}
   throw Error('Unmocked consolidation POST '+route);
  },
  async patch(route,body){
   if(route==='/git/refs/heads/r41/buffer/1881'){assert.equal(body.force,false);head=body.sha;return {};}
   if(route==='/issues/1881'){Object.assign(reservationIssue,body);return reservationIssue;}
   throw Error('Unmocked consolidation PATCH '+route);
  }
 };
 const j=await engine.consolidate(api,state,process.cwd());
 assert.equal(j.checkpointed,25);
 assert.equal(j.gatePending,true);
 assert.equal(writes,1);
 assert.equal(head,'8'.repeat(40));
 assert.equal(tree.length,66);
 assert.equal(tree.filter(f=>/\/entries\/MLS-V10-/.test(f.path)).length,25);
 assert.equal(tree.filter(f=>/\/checkpoints\/MLS-V10-/.test(f.path)).length,25);
 assert.equal(tree.some(f=>/package\.json$/.test(f.path)),false);
 assert.equal(alloc.parseReservation(reservationIssue).elastic.consolidatedSha,head);
});

test('COMPLETE authorizes exactly 11 block blobs against master buffer, never a forged manifest change',async()=>{
 const f=fixture(1881),rq=request(2080),master='d'.repeat(40),commit='e'.repeat(40);
 const bran='r42/work/1881/01/2080';
 const leased=elastic.lease(f,elastic.blocks(f)[0],rq,{branch:bran,baseSha:master,now:Date.now(),workerLogin:'owner'});
 const res=leased.reservation,claimIssue={...rq,title:'[MLS Dispatcher][BCR][LEASED] MLS-BUFFER-001881 block-01'};
 const complete=request(2081,'complete-2081','complete',{claimIssueNumber:2080,reservationIssueNumber:1881,block:1,headSha:commit});
 const chunk=makeChunk(f,1),manifest=elastic.preblock(f,bcr.RECIPE,PIN).manifest;
 const root='r42-buffer/1881/blocks/01/';
 const files=[{filename:root+'chunk-01-of-05.json',sha:elastic.gitBlobJson(chunk),status:'added'}];
 for(const code of leased.claim.codes){
  files.push({filename:root+'entries/'+code+'.json',sha:elastic.gitBlobJson(chunk.entries[code]),status:'added'});
  files.push({filename:root+'checkpoints/'+code+'.json',sha:elastic.gitBlobJson(chunk.checkpoints[code]),status:'added'});
 }
 let extra=false,compares=[];
 const api={
  async get(route){
   if(route==='/git/ref/heads/'+bran)return {object:{sha:commit}};
   if(route==='/git/ref/heads/r41/buffer/1881')return {object:{sha:master}};
   if(route==='/issues/2080')return claimIssue;
   if(route==='/compare/'+master+'...'+commit){compares.push(route);return {status:'ahead',files:extra?
     [...files,{filename:'r41-buffer/1881/manifest.json',sha:'b'.repeat(40),status:'modified'}]:files};}
   if(route.startsWith('/contents/')){
    const value=route.includes('chunk-01-of-05.json')?chunk:manifest;
    return {encoding:'base64',sha:elastic.gitBlobJson(value),
     content:Buffer.from(JSON.stringify(value,null,2)+'\n').toString('base64')};
   }
   throw Error('Unexpected COMPLETE GET '+route);
  }
 };
 const v=await engine.verifyClaimCompletion(api,res,elastic.blocks(res)[0],
  elastic.command(complete),complete,Date.now());
 assert.equal(v.chunkHash,chunk.chunkHash);
 assert.deepEqual(v.codes,leased.claim.codes);
 assert.deepEqual(compares,['/compare/'+master+'...'+commit]);
 extra=true;
 await assert.rejects(()=>engine.verifyClaimCompletion(api,res,elastic.blocks(res)[0],
  elastic.command(complete),complete,Date.now()),/R42_BLOCK_FOREIGN_PATH/);
});
test('expired lease preserves own-scope committed branch as immutable recovery parent and invalidates old epoch',async()=>{
 const f=fixture(1881),oldIssue=request(2170),master='d'.repeat(40),progress='e'.repeat(40);
 const lease=elastic.lease(f,elastic.blocks(f)[0],oldIssue,{branch:'r42/work/1881/01/2170',
  baseSha:master,now:1e12,workerLogin:'owner'});
 let reservationIssue=issue(lease.reservation),
  claimIssue={...oldIssue,title:'[MLS Dispatcher][BCR][LEASED] MLS-BUFFER-001881 block-01'};
 let compared=[];
 const api={
  async get(route){
   if(route==='/git/ref/heads/r42/work/1881/01/2170')return {object:{sha:progress}};
   if(route==='/compare/'+master+'...'+progress){
    compared.push(route);return {status:'ahead',files:[{filename:'r42-buffer/1881/blocks/01/entries/MLS-V10-4000.json',status:'added'}]};}
   if(route==='/issues/1881')return reservationIssue;
   if(route==='/issues/2170')return claimIssue;
   throw Error('Unexpected recovery GET '+route);
  },
  async patch(route,body){
   if(route==='/issues/1881'){Object.assign(reservationIssue,body);return reservationIssue;}
   if(route==='/issues/2170'){Object.assign(claimIssue,body);return claimIssue;}
   throw Error('Unexpected recovery PATCH '+route);
  }
 };
 const reservations=[lease.reservation];
 const done=await engine.reconcileExpired(api,reservations,1e12+elastic.TTL_MS+1);
 assert.equal(done.length,1);
 assert.deepEqual(compared,['/compare/'+master+'...'+progress]);
 const updated=alloc.parseReservation(reservationIssue),block=elastic.blocks(updated)[0];
 assert.equal(block.status,'pending');
 assert.equal(block.recovery.headSha,progress);
 assert.equal(block.recovery.originalBaseSha,master);
 assert.match(claimIssue.title,/\[EXPIRED\]/);
 assert.equal(claimIssue.state,'closed');
 const next=request(2171),newBranch='r42/work/1881/01/2171';
 const nextClaim=elastic.lease(updated,block,next,{branch:newBranch,baseSha:progress,
  now:1e12+elastic.TTL_MS+2,workerLogin:'owner'});
 assert.equal(nextClaim.claim.leaseEpoch,2171);
 assert.notEqual(nextClaim.claim.leaseEpoch,lease.claim.leaseEpoch);
});

test('RENEW received before expiry survives a short serialized GitHub queue delay without a double lease',async()=>{
 const baseMs=1e12,f=fixture(1881),owner=request(4000,'renew-initial-4000','next',{},baseMs);
 const lease=elastic.lease(f,elastic.blocks(f)[0],owner,{branch:'r42/work/1881/01/4000',
  baseSha:'d'.repeat(40),now:baseMs,workerLogin:'owner'});
 let reservation=issue(lease.reservation);
 const due=baseMs+elastic.TTL_MS;
 const renew=request(4001,'renew-ticket-4001','renew',
  {claimIssueNumber:4000,reservationIssueNumber:1881,block:1},due-1000);
 const api={
  async get(route){
   if(route==='/issues/1881')return reservation;
   throw Error('Unexpected renewal GET '+route);
  },
  async patch(route,body){
   if(route==='/issues/1881'){Object.assign(reservation,body);return reservation;}
   if(route==='/issues/4001'){Object.assign(renew,body);return renew;}
   throw Error('Unexpected renewal PATCH '+route);
  }
 };
 const result=await engine.drain({api,root:process.cwd(),issues:[reservation,renew],
  globalLedger:{terminal:{},recoveries:{}},activeStates:[],now:due+30000});
 assert.equal(result.renewed.length,1);
 assert.equal(result.reaped.length,0);
 assert.equal(Date.parse(alloc.parseReservation(reservation).elastic.blocks[0].expiresAt),due+30000+elastic.TTL_MS);
 assert.equal(renew.state,'closed');
});
test('consolidation replays exact immutable join if the remote commit succeeded but terminal Issue PATCH was lost',async()=>{
 const f=fixture(1881),pre=elastic.preblock(f,bcr.RECIPE,PIN);
 const commits=Array.from({length:5},(_,i)=>String(i+1).repeat(40));
 const chunks=Array.from({length:5},(_,i)=>makeChunk(f,i+1));
 const r=elastic.withBlocks(f,elastic.blocks(f).map((b,i)=>({...b,status:'done',
  claimIssueNumber:5000+i,commitSha:commits[i],chunkHash:chunks[i].chunkHash})));
 let reservation=issue(r);
 const joined='8'.repeat(40),prior='d'.repeat(40);
 const status=structuredClone(pre.progress);status.checkpointed=25;
 const pack=structuredClone(pre.pack);
 pack.completedCodes=f.allocation.units.map(x=>x.code);
 pack.pendingCodes=[];pack.checkpointRefs=f.allocation.units.map(x=>({code:x.code,entrySha:'f'.repeat(64)}));
 const audit={schema:'MLS-R4.2-JOIN-1',reservationId:r.allocation.assignmentId,originalHead:prior,
  blockCommits:r.elastic.blocks.map(x=>({block:x.block,sha:x.commitSha,chunkHash:x.chunkHash})),
  count:25,verifiedInherited:0,canonicalGatePassed:false,packageSealed:false,synced:false};
 const files=new Map([['manifest.json',pre.manifest],['progress.json',status],
  ['bcr/context-pack.json',pack],['bcr/source-index.json',pre.index],
  ['bcr/elastic-join-audit.json',audit]]);
 let writes=0;
 const api={
  async get(route){
   if(route==='/git/ref/heads/r41/buffer/1881')return {object:{sha:joined}};
   if(route==='/git/commits/'+joined)return {parents:[{sha:prior}]};
   if(route==='/issues/1881')return reservation;
   if(route.startsWith('/contents/')){
    const name=route.slice('/contents/r41-buffer/1881/'.length).split('?ref=')[0];
    assert.ok(files.has(name),'Unmocked remote immutable file '+name);
    const value=files.get(name);
    return {sha:elastic.gitBlobJson(value),encoding:'base64',
     content:Buffer.from(JSON.stringify(value)).toString('base64')};
   }
   throw Error('Unmocked join replay GET '+route);
  },
  async patch(route,body){
   if(route==='/issues/1881'){writes++;Object.assign(reservation,body);return reservation;}
   throw Error('Unexpected join replay PATCH '+route);
  },
  async post(){throw Error('Replayed join must never write a second Git commit');}
 };
 const result=await engine.consolidate(api,r,process.cwd());
 assert.equal(result.replayed,true);
 assert.equal(result.head,joined);
 assert.equal(writes,1);
 assert.equal(alloc.parseReservation(reservation).elastic.consolidatedSha,joined);
});
