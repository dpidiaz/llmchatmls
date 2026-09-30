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

test('all shared writers keep the real mutex and route ignored Issue runs to unique skip groups',()=>{
 for(const [name,text] of Object.entries(files)){
  assert.match(text,/['"]mls-global-dispatcher['"]/,
   name+' must still select the repository-wide writer mutex');
  assert.match(text,/format\('mls-global-dispatcher-skip-\{0\}', github\.run_id\)/,
   name+' must isolate ignored Issue runs');
  assert.match(text,/cancel-in-progress: false/);
 }
});

test('bootstrap command owns the writer mutex only for the fixed authorized apply Issue',()=>{
 const text=files.bootstrap;
 assert.match(text,/\[MLS R4\.3\]\[BOOTSTRAP\]\[APPLY\] BCR-R43-PILOT-20X5/);
 assert.match(text,/MLS_R43_BOOTSTRAP_APPLY_V1/);
 assert.match(text,/APPLY_R43_PILOT_20X5/);
 assert.match(text,/OWNER/);
 assert.match(text,/MEMBER/);
 assert.match(text,/COLLABORATOR/);
});

test('other shared workflows route by their own protocol markers instead of every Issue event',()=>{
 assert.match(files.dispatcher,/startsWith\(github\.event\.issue\.title, '\[MLS Dispatcher\]'/);
 assert.match(files.dispatcher,/\[MLS Buffered\]\[REQUEST\]/);
 assert.match(files.r43,/MLS_BCR_R43_REQUEST/);
 assert.match(files.r43,/MLS_BCR_R43_RESULT/);
 assert.match(files.buffered,/\[MLS Buffered\]\[SYNC\]/);
});

test('R4.3 bootstrap command Issue no longer matches the writer-path selectors of peer workflows',()=>{
 const title='[MLS R4.3][BOOTSTRAP][APPLY] BCR-R43-PILOT-20X5';
 assert.equal(title.startsWith('[MLS Dispatcher]'),false);
 assert.equal(title.startsWith('[MLS Buffered][REQUEST]'),false);
 assert.equal(title.startsWith('[MLS Buffered][SYNC]'),false);
});
