'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const oldFlow=path.join(process.cwd(),'.github','workflows','MLS R4.3 Snapshot Pilot Init.yml');
const newFlow=path.join(process.cwd(),'.github','workflows','MLS R4.3 Snapshot Pilot Bootstrap.yml');

test('only Bootstrap remains as the authorized R4.3 pilot initializer',()=>{
 assert.equal(fs.existsSync(oldFlow),false);
 assert.equal(fs.existsSync(newFlow),true);
 const newSource=fs.readFileSync(newFlow,'utf8');
 assert.match(newSource,/name: MLS R4\.3 Snapshot Pilot Bootstrap/);
 assert.match(newSource,/default: plan/);
 assert.match(newSource,/options:\s*\n\s*- plan\s*\n\s*- apply/);
 assert.match(newSource,/mls-global-dispatcher/);
 assert.match(newSource,/mls-global-dispatcher-skip-\{0\}/);
 assert.match(newSource,/github\.run_id/);
 assert.match(newSource,/APPLY_R43_PILOT_20X5/);
});
