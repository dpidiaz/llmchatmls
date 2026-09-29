'use strict';
// End-to-end mocked GitHub API test of the ACTUAL serialized Scheduler path.
// No repository mutation or live GitHub REST request is made by this test.
const test=require('node:test');
const assert=require('node:assert/strict');
const cp=require('node:child_process');
const fs=require('node:fs');
const vm=require('node:vm');
const {createRequire}=require('node:module');
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
 const fakeFetch=async(url,opts={})=>{
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
 const schedulerFile=path.resolve(root,'scripts/MLS global dispatcher scheduler.cjs');
 const source=fs.readFileSync(schedulerFile,'utf8').replace(/main\(\)\.catch\([\s\S]*$/,'');
 const sandbox=vm.createContext({require:createRequire(schedulerFile),__dirname:path.dirname(schedulerFile),
   structuredClone,fetch:fakeFetch,process:{env:{GITHUB_TOKEN:'mock-only-not-a-credential',GITHUB_REPOSITORY:'test/r41'}},console});
 vm.runInContext(source,sandbox);
 {
   const first=await sandbox.main();
   assert.equal(first.buffered.length,1);
   assert.equal(first.buffered[0].count,10);
   const reservation=buffered.parseReservation(issue);
   assert.equal(reservation.allocation.units.length,10);
   assert.equal(reservation.allocation.baseCommit,head);
   assert.equal(calls.filter(x=>x.method==='PATCH').length,1);
   const second=await sandbox.main();
   assert.equal(second.buffered.length,0);
   assert.equal(calls.filter(x=>x.method==='PATCH').length,1,'Replay must not write the same reservation twice.');
 }
});
