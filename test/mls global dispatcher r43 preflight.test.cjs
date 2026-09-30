'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const cp=require('node:child_process');

const script=path.join(process.cwd(),'scripts','MLS R4.3 Snapshot Pilot Preflight.cjs');

test('R4.3 pilot preflight is syntactically valid and read-only by construction',()=>{
 cp.execFileSync(process.execPath,['--check',script],{stdio:'pipe'});
 const source=fs.readFileSync(script,'utf8');
 assert.doesNotMatch(source,/\bfetch\s*\(/);
 assert.doesNotMatch(source,/GITHUB_TOKEN/);
 assert.doesNotMatch(source,/api\.github\.com/);
 assert.doesNotMatch(source,/\bPOST\b|\bPATCH\b|\bPUT\b|\bDELETE\b/);
 assert.match(source,/mode:'PLAN_ONLY'/);
 assert.match(source,/noRemoteWrites:true/);
});

test('R4.3 preflight uses canonical R33 projection rather than an alternate corpus allocator',()=>{
 const source=fs.readFileSync(script,'utf8');
 assert.match(source,/integration\.collectR33Snapshot/);
 assert.match(source,/integration\.projectR33Snapshot/);
 assert.match(source,/bootstrap\.plan/);
 assert.match(source,/HEAD:content\/manifest\.json/);
});
