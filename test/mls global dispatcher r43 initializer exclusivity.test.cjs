'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const oldFlow=path.join(process.cwd(),'.github','workflows','MLS R4.3 Snapshot Pilot Init.yml');
const newFlow=path.join(process.cwd(),'.github','workflows','MLS R4.3 Snapshot Pilot Bootstrap.yml');

test('deprecated R4.3 initializer is hard-disabled so only Bootstrap can apply a pilot',()=>{
 const oldSource=fs.readFileSync(oldFlow,'utf8');
 const newSource=fs.readFileSync(newFlow,'utf8');
 assert.match(oldSource,/name: MLS R4\.3 Snapshot Pilot Init \(Deprecated\)/);
 assert.match(oldSource,/if: \$\{\{ false && inputs\.confirm == 'PILOT20' \}\}/);
 assert.match(newSource,/name: MLS R4\.3 Snapshot Pilot Bootstrap/);
 assert.match(newSource,/default: plan/);
 assert.match(newSource,/options:\s*\n\s*- plan\s*\n\s*- apply/);
 assert.match(newSource,/group: mls-global-dispatcher/);
});
