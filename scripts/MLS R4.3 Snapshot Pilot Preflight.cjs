'use strict';

/**
 * MLS R4.3 Snapshot Pilot Preflight
 *
 * Read/compute only. It never creates or edits Issues.
 * Inputs are supplied by environment/argv so the same code can be used in CI
 * and by a later guarded bootstrap workflow.
 */
const fs=require('node:fs');
const path=require('node:path');
const child=require('node:child_process');
const integration=require('../MLS R32 EDITORIAL/global dispatcher/providers/integration.js');
const core=require('../MLS R32 EDITORIAL/global dispatcher/core.js');
const bootstrap=require('../MLS R32 EDITORIAL/r4 snapshot bootstrap.cjs');

function die(code,msg){const e=new Error(msg||code);e.code=code;throw e;}
function parseIntList(raw,name){
 const values=String(raw||'').split(',').map(x=>x.trim()).filter(Boolean).map(Number);
 if(!values.length||values.some(x=>!Number.isSafeInteger(x)||x<1))die(name+'_INVALID');
 return values;
}
function readJson(file){
 try{return JSON.parse(fs.readFileSync(file,'utf8'));}catch{die('PREFLIGHT_JSON_INVALID','Invalid JSON: '+file);}
}
function openIssueLike(x){return x&&!x.pull_request&&String(x.state||'open')==='open';}

function run({
 root=path.resolve(__dirname,'..'),
 issues=[],
 globalLedger=null,
 globalAssignments=[],
 reservationIssueNumbers,
 waveIssueNumber,
 waveId,
 workerCount=20,
 shardSize=5,
 createdAt=new Date().toISOString(),
 route='remote',
 baseCommit=null,
 contentManifestBlobSha=null
}={}){
 const openIssues=(issues||[]).filter(openIssueLike);
 const collected=integration.collectR33Snapshot(openIssues,root);
 const projected=integration.projectR33Snapshot(collected,{globalLedger,globalAssignments});

 const head=baseCommit||child.execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
 const manifest=contentManifestBlobSha||child.execFileSync('git',['rev-parse','HEAD:content/manifest.json'],{
  cwd:root,encoding:'utf8'
 }).trim();
 const plan=bootstrap.plan(projected,{
  waveId,
  workerCount:Number(workerCount),
  shardSize:Number(shardSize),
  reservationIssueNumbers,
  waveIssueNumber:Number(waveIssueNumber),
  baseCommit:head,
  contentManifestBlobSha:manifest,
  createdAt,
  route
 });
 return {
  ok:true,
  mode:'PLAN_ONLY',
  noRemoteWrites:true,
  canonical:{
   poolId:projected.pool.poolId,
   manifestVersion:projected.pool.manifestVersion,
   baseCommit:head,
   contentManifestBlobSha:manifest,
   existingReservedCodes:(projected.reservedCodes||[]).length,
   activeBatches:(projected.batches||[]).length,
   verified:(projected.ledger?.verified||[]).length,
   exceptions:(projected.ledger?.exceptions||[]).length
  },
  pilot:{
   waveId:plan.waveId,
   workerCount:plan.workerCount,
   shardSize:plan.shardSize,
   totalUnits:plan.totalUnits,
   snapshotHash:plan.snapshotHash,
   waveHash:plan.waveHash,
   firstCode:plan.protectedCodes[0],
   lastCode:plan.protectedCodes.at(-1),
   protectedCodes:plan.protectedCodes,
   reservationIssueNumbers:plan.reservationIssueNumbers,
   waveIssueNumber:plan.waveIssueNumber,
   writeBudget:plan.writeBudget
  }
 };
}

if(require.main===module){
 const inputFile=process.argv[2];
 if(!inputFile)die('PREFLIGHT_USAGE','Usage: node scripts/MLS R4.3 Snapshot Pilot Preflight.cjs <input.json>');
 const input=readJson(inputFile);
 const out=run(input);
 process.stdout.write(JSON.stringify(out,null,2)+'\n');
}
module.exports={run,parseIntList};
