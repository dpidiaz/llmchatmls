'use strict';
// End-to-end mocked GitHub API test of the ACTUAL serialized Scheduler path.
// No repository mutation or live GitHub REST request is made by this test.
const test=require('node:test');
const assert=require('node:assert/strict');
const cp=require('node:child_process');
const path=require('node:path');
const core=require('../MLS R32 EDITORIAL/global dispatcher/core.js');
const buffered=require('../MLS R32 EDITORIAL/r4 buffered allocation.cjs');

test('one authenticated buffer Issue reserves ten disjoint units and replay causes no new writes',async()=>{
 const root=path.resolve(__dirname,'..'),head=cp.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 const ledger=core.initialLedger(core.loadRegistry(root));
 const body=core.renderMarked(buffered.REQUEST_MARKER,{
  kind:'mls_buffer_request',version:1,mode:'reserve',requestId:'r41-request-integration-0001',size:10});
 const issue={number:88001,title:'[MLS Buffered][REQUEST] r41-request-integration-0001',
  author_association:'OWNER',user:{login:'dpidiaz'},state:'open',body,created_at:new Date().toISOString()};
 const ledgerIssue={number:709,title:'[MLS Dispatcher Ledger]',state:'open',body:core.renderLedgerBody(ledger),
  created_at:new Date().toISOString()};
 const rows=[ledgerIssue,issue],calls=[];
 function response(data){return {status:200,ok:true,headers:{get:()=>null},
  text:async()=>JSON.stringify(data)};}
 const original=global.fetch,previousToken=process.env.GITHUB_TOKEN,previousRepo=process.env.GITHUB_REPOSITORY;
 global.fetch=async(url,opts={})=>{
  const u=new URL(url),method=opts.method||'GET',p=u.pathname,c={method,path:p,query:u.search};
  calls.push(c);
  assert.equal(u.host,'api.github.com');
  if(p==='/repos/test/r41/issues'&&method==='GET')
    return response(u.searchParams.get('state')==='closed'?[]:rows.filter(x=>x.state==='open'));
  if(p==='/repos/test/r41/git/ref/heads/main'&&method==='GET')return response({object:{sha:head}});
  if(p==='/repos/test/r41/issues/88001'&&method==='PATCH'){
    Object.assign(issue,JSON.parse(opts.body));return response(issue);
  }
  throw Error('Unexpected GitHub call '+JSON.stringify(c));
 };
 process.env.GITHUB_TOKEN='mock-only-not-a-credential';
 process.env.GITHUB_REPOSITORY='test/r41';
 try{
   // This script now exports main() only when imported; it does not start an uncontrolled task.
   const scheduler=require('../scripts/MLS global dispatcher scheduler.cjs');
   const first=await scheduler.main();
   assert.equal(first.buffered.length,1);
   assert.equal(first.buffered[0].count,10);
   const reservation=buffered.parseReservation(issue);
   assert.equal(reservation.allocation.units.length,10);
   assert.equal(reservation.allocation.baseCommit,head);
   assert.equal(calls.filter(x=>x.method==='PATCH').length,1);
   const second=await scheduler.main();
   assert.equal(second.buffered.length,0);
   assert.equal(calls.filter(x=>x.method==='PATCH').length,1,'Replay must not write the same reservation twice.');
 }finally{
   global.fetch=original;
   if(previousToken===undefined)delete process.env.GITHUB_TOKEN;else process.env.GITHUB_TOKEN=previousToken;
   if(previousRepo===undefined)delete process.env.GITHUB_REPOSITORY;else process.env.GITHUB_REPOSITORY=previousRepo;
 }
});
