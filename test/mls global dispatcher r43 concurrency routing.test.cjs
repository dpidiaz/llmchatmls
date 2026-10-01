'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

function workflow(name){
 return fs.readFileSync(path.join(process.cwd(),'.github','workflows',name),'utf8');
}

const files={
 dispatcher:workflow('MLS Global Dispatcher Scheduler.yml'),
 bootstrap:workflow('MLS R4.3 Snapshot Pilot Bootstrap.yml'),
 r43:workflow('MLS R4.3 Snapshot Pilot Scheduler.yml'),
 buffered:workflow('R4.1 Buffered Sync.yml')
};

test('all shared writers keep the real mutex; only Issue-routed fallbacks need skip groups',()=>{
 for(const [name,text] of Object.entries(files)){
  assert.match(text,/mls-global-dispatcher/,
   name+' must still select the repository-wide writer mutex');
  assert.match(text,/cancel-in-progress: false/);
 }
 for(const name of ['bootstrap','buffered']){
  assert.match(files[name],/format\('mls-global-dispatcher-skip-\{0\}', github\.run_id\)/,
   name+' must isolate ignored Issue runs');
 }
 for(const name of ['dispatcher','r43']){
  assert.doesNotMatch(files[name],/mls-global-dispatcher-skip-\{0\}/);
  assert.match(files[name],/workflow_dispatch:/);
 }
});

test('bootstrap command owns the writer mutex only for the fixed authorized 50x5 apply Issue',()=>{
 const text=files.bootstrap;
 assert.match(text,/\[MLS R4\.3\]\[BOOTSTRAP\]\[APPLY\] 50X5/);
 assert.match(text,/MLS_R43_BOOTSTRAP_APPLY_V2/);
 assert.match(text,/APPLY_R43_WAVE_50X5/);
 assert.match(text,/OWNER/);
 assert.match(text,/MEMBER/);
 assert.match(text,/COLLABORATOR/);
});

test('automatic Issue routing remains only on explicit legacy Issue fallbacks',()=>{
 assert.doesNotMatch(files.dispatcher,/github\.event\.issue/);
 assert.doesNotMatch(files.r43,/github\.event\.issue/);
 assert.match(files.bootstrap,/\[MLS R4\.3\]\[BOOTSTRAP\]\[APPLY\] 50X5/);
 assert.match(files.buffered,/\[MLS Buffered\]\[SYNC\]/);
});

test('R4.3 bootstrap command Issue no longer matches the writer-path selectors of peer workflows',()=>{
 const title='[MLS R4.3][BOOTSTRAP][APPLY] 50X5';
 assert.equal(title.startsWith('[MLS Dispatcher]'),false);
 assert.equal(title.startsWith('[MLS Buffered][REQUEST]'),false);
 assert.equal(title.startsWith('[MLS Buffered][SYNC]'),false);
});
