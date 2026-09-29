'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const base=require('../MLS R32 EDITORIAL/r4 buffered core.cjs');
const alloc=require('../MLS R32 EDITORIAL/r4 buffered allocation.cjs');
const bcr=require('../MLS R32 EDITORIAL/r4 buffered context.cjs');
const elastic=require('../MLS R32 EDITORIAL/r4 elastic core.cjs');
const engine=require('../MLS R32 EDITORIAL/r4 elastic scheduler.cjs');
const dispatcher=require('../MLS R32 EDITORIAL/global dispatcher/core.js');
const PIN='a'.repeat(40),CONTENT='b'.repeat(40),SRC='MLS-SRC-'+('C'.repeat(20));
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
 assert.equal(elastic.MAX_REQUESTS_PER_TICK,5);
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
