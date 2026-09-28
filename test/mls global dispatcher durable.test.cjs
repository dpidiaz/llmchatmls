'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{createRequire}=require('node:module');
const core=require('../MLS R32 EDITORIAL/global dispatcher/core.js');
const durable=require('../MLS R32 EDITORIAL/global dispatcher/durable.js');
const sha='a'.repeat(40),completed='b'.repeat(40);
const clone=x=>structuredClone(x);
class MemoryStore{
  constructor(){this.sha=0;this.value={version:1,issues:{}};this.conflicts=0;}
  async read(){await Promise.resolve();return {sha:this.sha,value:clone(this.value)};}
  async cas(expected,value){await Promise.resolve();if(expected!==this.sha){this.conflicts++;return false;}this.value=clone(value);this.sha++;return true;}
}
function fixture(count=10,capacity=3){
  const registry=core.normalizeRegistry({items:Array.from({length:count},(_,i)=>({workId:'work-'+String(i).padStart(4,'0'),workType:'code_task',status:'ready',resourceLocks:['slot:'+i%capacity],allowedPaths:['content/'],completion:{requiresCommit:true,requiresValidation:true}}))});
  const issues=new Map([[1,{number:1,state:'open',title:'[MLS Dispatcher Ledger]',body:core.renderLedgerBody(core.initialLedger(registry))}]]),comments=new Map(),branches=new Map([['main',sha]]);
  let failure=null;
  const api=async(method,url,body)=>{
    await Promise.resolve();if(failure){const e=failure;failure=null;throw e;}
    let m;
    if((m=/\/issues\/(\d+)\/comments/.exec(url)))return clone(comments.get(+m[1])||[]);
    if(url.includes('/issues?')){const page=Number(new URL('https://x'+url).searchParams.get('page'));return clone([...issues.values()].filter(x=>x.state==='open').slice((page-1)*100,page*100));}
    if((m=/\/issues\/(\d+)$/.exec(url))){if(method==='PATCH')issues.set(+m[1],{...issues.get(+m[1]),...clone(body)});return clone(issues.get(+m[1]));}
    if(url.endsWith('/issues')&&method==='POST'){const number=Math.max(...issues.keys())+1;const value={number,state:'open',user:{login:'tester'},created_at:core.iso(),...clone(body)};issues.set(number,value);return clone(value);}
    if((m=/\/git\/ref\/heads\/(.*)$/.exec(url))){const name=decodeURIComponent(m[1]);if(!branches.has(name))throw Object.assign(new Error('missing'),{status:404});return {object:{sha:branches.get(name)}};}
    if(url.endsWith('/git/refs')&&method==='POST'){const name=body.ref.slice(11);if(branches.has(name))throw Object.assign(new Error('exists'),{status:422});branches.set(name,body.sha);return {};}
    if(url.includes('/compare/'))return {status:'ahead',files:[{filename:'content/test.json'}]};
    throw new Error('Unmocked API '+method+' '+url);
  };
  function claim(number,requestId='request-'+number){issues.set(number,{number,state:'open',title:'[MLS Dispatcher][CLAIM] '+requestId,created_at:'2020-01-01T00:00:00Z',user:{login:'tester'},body:core.renderCommandBody({operation:'claim',requestId,workerId:'worker-'+number})});}
  function context(name,extra={}){
    const file=path.resolve('scripts/MLS global dispatcher '+name+'.cjs'),realRequire=createRequire(file);
    const context=vm.createContext({require:id=>id.endsWith('/providers/integration.js')?{...realRequire(id),materializeProviderItems:()=>({items:[],diagnostics:[]}),corpusComplete:({states,ledger})=>!states.length&&registry.items.every(i=>ledger.terminal[i.workId])}:realRequire(id),__dirname:path.dirname(file),process:{env:{GITHUB_TOKEN:'fake',GITHUB_REPOSITORY:'owner/repo'}},console:{log(){},warn(){},error(){}},structuredClone,Buffer,Date,...extra});
    vm.runInContext(fs.readFileSync(file,'utf8').replace(/module\.exports=[\s\S]*$/,''),context);return context;
  }
  const store=new MemoryStore();
  async function cycle(){return durable.transact(store,api,async tx=>{
    const worker=context('worker',{injectedApi:tx.call.bind(tx)});vm.runInContext('gh=injectedApi',worker);
    const open=await tx.issues('owner/repo');
    await worker.replay(tx.call.bind(tx),open);
    const scheduler=context('scheduler',{injected:tx});vm.runInContext('transaction=injected',scheduler);
    return scheduler.drainPendingCommands(registry,await scheduler.ensureLedger(registry));
  },{attempts:100});}
  const states=()=>Object.values(store.value.issues).map(i=>core.parseAssignmentState(i.body)).filter(Boolean);
  const ledger=()=>core.parseLedger(store.value.issues[1].body);
  const publish=()=>durable.project(store,api,'owner/repo');
  function finish(state){
    branches.set(state.branch,completed);
    const common={assignmentId:state.assignmentId,leaseToken:state.leaseToken,leaseEpoch:state.leaseEpoch};
    const id=state.issueNumber*1000+Number(state.leaseEpoch)*10;
    comments.set(state.issueNumber,[{id,user:{login:'tester'},created_at:core.iso(),body:core.renderMarked(core.EVENT_MARKER,{...common,operation:'checkpoint',commitSha:completed,validation:{status:'passed'}})},{id:id+1,user:{login:'tester'},created_at:core.iso(),body:core.renderMarked(core.EVENT_MARKER,{...common,operation:'finish',commitSha:completed})}]);
  }
  return {registry,issues,comments,branches,api,store,claim,cycle,states,ledger,publish,finish,fail:e=>failure=e,context};
}
for(const count of [10,25,50,100])test('durable concurrent burst '+count+': FIFO, unique leases, no orphan claims',async()=>{
  const f=fixture(count,3);
  await Promise.all(Array.from({length:count},async(_,i)=>f.claim(10+i)));
  // Independent schedulers race over the same durable source, not an in-memory mutex.
  await Promise.all(Array.from({length:4},()=>f.cycle()));
  assert.ok(f.store.conflicts>0);
  let previous=9,total=0;
  while(total<count){
    await f.publish();
    const active=f.states().filter(s=>s.status==='leased');
    assert.ok(active.length>0&&active.length<=3);
    assert.equal(new Set(active.flatMap(s=>s.resourceLocks)).size,active.length);
    for(const state of active.sort((a,b)=>a.issueNumber-b.issueNumber)){
      assert.ok(state.issueNumber>previous);previous=state.issueNumber;f.finish(state);total++;
    }
    await f.cycle();
  }
  await f.publish();
  assert.equal(Object.keys(f.ledger().terminal).length,count);
  assert.equal(Object.values(f.ledger().requests).filter(x=>x.status==='done').length,count);
  assert.equal(f.states().filter(x=>x.status==='leased').length,0);
  assert.equal([...f.issues.values()].filter(x=>x.number!==1&&x.state==='open').length,0);
});
test('same request retry has exactly one lease, including concurrent ingestion',async()=>{
  const f=fixture();f.claim(10);f.claim(11,'request-10');
  await Promise.all([f.cycle(),f.cycle()]);
  assert.equal(f.states().length,1);assert.equal(f.ledger().requests['request-10'].issueNumber,10);
  assert.match(f.store.value.issues[11].title,/DUPLICATE/);
});
test('restart before projection repairs publication and starts ACK window without losing ownership',async()=>{
  const f=fixture();f.claim(10);await f.cycle();
  assert.match(f.issues.get(10).title,/CLAIM/);assert.equal(f.states()[0].publicationPending,true);
  assert.equal(core.isLeaseExpired(f.states()[0],Date.now()+86400000),false);
  await f.cycle();assert.equal(f.states().length,1);
  await f.publish();assert.match(f.issues.get(10).title,/LEASED/);
  assert.equal(f.states()[0].publicationPending,false);
  assert.ok(Date.parse(f.states()[0].ackDeadlineAt)>Date.now());
});
test('expired lease requeues same request, restores checkpoint, fences old worker and isolates branch',async()=>{
  const f=fixture();f.claim(10);await f.cycle();await f.publish();
  const old=f.states()[0];f.branches.set(old.branch,completed);
  const checkpoint=core.applyWorkerEvent(old,{operation:'checkpoint',assignmentId:old.assignmentId,leaseToken:old.leaseToken,leaseEpoch:old.leaseEpoch,commitSha:completed,validation:{status:'passed'}},{createdAt:core.iso(),commentId:90});
  checkpoint.expiresAt='2000-01-01T00:00:00Z';
  f.store.value.issues[10].body=core.renderAssignmentBody(checkpoint);
  await f.cycle();const next=f.states()[0];
  assert.equal(next.requestId,old.requestId);assert.equal(next.workId,old.workId);
  assert.ok(next.leaseEpoch>old.leaseEpoch);assert.notEqual(next.branch,old.branch);
  assert.equal(next.lastCheckpointCommit,completed);assert.equal(next.checkpoints.length,1);
  assert.throws(()=>core.applyWorkerEvent(next,{operation:'heartbeat',assignmentId:old.assignmentId,leaseToken:old.leaseToken,leaseEpoch:old.leaseEpoch},{createdAt:core.iso(),commentId:100}),/no coincide/);
  await f.publish();f.finish(f.states()[0]);await f.cycle();assert.equal(f.ledger().requests['request-10'].status,'done');
});
test('403 while replaying leaves event pending; restart accepts it before expiry',async()=>{
  const f=fixture();f.claim(10);await f.cycle();await f.publish();
  const state=f.states()[0];f.finish(state);
  const before=clone(f.store.value);f.fail(Object.assign(new Error('secondary rate limit'),{status:403,code:'GITHUB_BACKOFF'}));
  await assert.rejects(f.cycle(),/secondary/);assert.deepEqual(f.store.value,before);
  await f.cycle();assert.equal(f.ledger().requests['request-10'].status,'done');
});
test('only explicit queued cancellation is terminal; capacity never cancels',async()=>{
  const f=fixture(2,1);f.claim(10);f.claim(11);await f.cycle();
  assert.equal(f.ledger().requests['request-11'].status,'queued');
  f.comments.set(11,[{id:30,user:{login:'tester'},body:core.renderMarked(core.EVENT_MARKER,{operation:'cancel',requestId:'request-11'})}]);
  await f.cycle();assert.equal(f.ledger().requests['request-11'].status,'cancelled');
});
test('corpus complete requires positive exhaustion; no candidate at capacity stays QUEUED',async()=>{
  const f=fixture(1,1);f.claim(10);f.claim(11);await f.cycle();assert.equal(f.ledger().requests['request-11'].status,'queued');
  await f.publish();f.finish(f.states()[0]);await f.cycle();assert.equal(f.ledger().requests['request-11'].status,'corpus_complete');
});
test('backoff holds lease through retryAt plus TTL; forbidden response is not a rate limit',async()=>{
  const f=fixture();f.claim(10);await f.cycle();await f.publish();const state=f.states()[0],at=core.iso();
  const next=core.applyWorkerEvent(state,{operation:'backoff',assignmentId:state.assignmentId,leaseToken:state.leaseToken,leaseEpoch:state.leaseEpoch,retryAt:core.plusMs(at,3600000)},{createdAt:at,commentId:5});
  assert.equal(core.isLeaseExpired(next,Date.parse(at)+3600001),false);
  const delays=[];let calls=0;
  const api=durable.githubClient({token:'test',repository:'owner/repo',random:()=>0,sleep:async ms=>delays.push(ms),fetchImpl:async()=>++calls<3?new Response(JSON.stringify({message:'secondary rate limit'}),{status:403,headers:{'retry-after':'90'}}):new Response('{}')});
  await api('GET','/test');assert.deepEqual(delays,[90000,120000]);
  const forbidden=durable.githubClient({token:'test',repository:'owner/repo',fetchImpl:async()=>new Response('{"message":"Forbidden"}',{status:403}),sleep:()=>assert.fail('must not retry permissions')});
  await assert.rejects(forbidden('GET','/test'),e=>e.status===403&&e.code!=='GITHUB_BACKOFF');
});
test('branch created before crash is reconciled on restart instead of rejecting valid claim',async()=>{
  const f=fixture();f.claim(10);
  const original=f.store.cas.bind(f.store);let fail=true;
  f.store.cas=async(...args)=>{if(fail){fail=false;throw new Error('crash before state commit');}return original(...args);};
  await assert.rejects(f.cycle(),/crash/);assert.ok(f.branches.size>1);
  await f.cycle();assert.equal(f.states().length,1);assert.equal(f.ledger().requests['request-10'].status,'assigned');
});
test('restart after branch creation tolerates main advancing without losing the claim',async()=>{
  const f=fixture();f.claim(10);const cas=f.store.cas.bind(f.store);
  f.store.cas=async()=>{throw new Error('crash');};await assert.rejects(f.cycle(),/crash/);
  f.store.cas=cas;f.branches.set('main',completed);
  await f.cycle();assert.equal(f.states().length,1);assert.equal(f.states()[0].baseCommit,completed);
});
test('Git adapter rejects competing sibling commits and reconstructs state after restart',async()=>{
  const objects=new Map();let head=null,id=0;
  const api=async(method,url,body)=>{
    if(method==='POST'&&/\/git\/(blobs|trees|commits)$/.test(url)){
      const sha=String(++id).padStart(40,'0');
      objects.set(sha,url.endsWith('/blobs')?{content:Buffer.from(body.content).toString('base64')}:url.endsWith('/commits')?{...body,tree:{sha:body.tree}}:clone(body));return {sha};
    }
    if(url.endsWith('/git/refs')&&method==='POST'){
      if(head)throw Object.assign(new Error('exists'),{status:422});head=body.sha;return {};
    }
    if(url.includes('/git/refs/heads/')&&method==='PATCH'){
      assert.equal(body.force,false);
      if(objects.get(body.sha).parents[0]!==head)throw Object.assign(new Error('not fast forward'),{status:422});head=body.sha;return {};
    }
    if(url.includes('/git/ref/heads/')){if(!head)throw Object.assign(new Error('missing'),{status:404});return {object:{sha:head}};}
    return clone(objects.get(url.split('/').at(-1)));
  };
  const store=new durable.GitStore(api,'owner/repo');
  assert.equal((await store.read()).sha,null);
  assert.equal(await store.cas(null,{version:1,issues:{}}),true);
  const a=await store.read(),b=await store.read();a.value.issues[10]={title:'winner'};b.value.issues[11]={title:'loser'};
  assert.equal(await store.cas(a.sha,a.value),true);assert.equal(await store.cas(b.sha,b.value),false);
  const restarted=new durable.GitStore(api,'owner/repo');assert.deepEqual((await restarted.read()).value,a.value);
});
test('projection failure cannot erase accepted state or allocate a second lease',async()=>{
  const f=fixture();f.claim(10);await f.cycle();const token=f.states()[0].leaseToken;
  f.fail(Object.assign(new Error('secondary rate limit'),{status:403,code:'GITHUB_BACKOFF'}));
  await assert.rejects(f.publish(),/secondary/);await f.cycle();await f.publish();
  assert.equal(f.states().length,1);assert.equal(f.states()[0].leaseToken,token);
  assert.equal(f.states()[0].publicationPending,false);
});
test('pagination has no 2000-issue ceiling and does not silently accept incomplete responses',async()=>{
  const rows=await durable.pages(async(_,url)=>{const n=Number(new URL('https://x'+url).searchParams.get('page'));return Array.from({length:n<=21?100:1},(_,i)=>({number:(n-1)*100+i}));},'/issues');
  assert.equal(rows.length,2101);
  await assert.rejects(durable.pages(async()=>({error:'not a page'}),'/issues'),/complete/);
});
test('rate-limit retry exhaustion retains actionable retryAt without retrying early',async()=>{
  const delays=[];
  const api=durable.githubClient({token:'test',repository:'owner/repo',now:()=>0,random:()=>0,maxRetries:2,sleep:async ms=>delays.push(ms),fetchImpl:async()=>new Response('{"message":"secondary rate limit"}',{status:403,headers:{'retry-after':'180'}})});
  await assert.rejects(api('GET','/test'),e=>e.code==='GITHUB_BACKOFF'&&Date.parse(e.retryAt)>=240000);
  assert.deepEqual(delays,[180000,180000]);
});
