'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const guide=path.join(process.cwd(),'docs','MLS Global Dispatcher','22 R4.3 Worker Command.md');
const commandFile=path.join(process.cwd(),'MLS R32 EDITORIAL','r4 snapshot command.cjs');

test('R4.3 command adapter points to an existing durable worker guide',()=>{
 assert.equal(fs.existsSync(guide),true);
 const command=fs.readFileSync(commandFile,'utf8');
 assert.match(command,/docs\/MLS Global Dispatcher\/22 R4\.3 Worker Command\.md/);
});

test('R4.3 worker guide preserves every universal-command state and zero-write production rule',()=>{
 const text=fs.readFileSync(guide,'utf8');
 for(const state of [
  'create_request','await_admission','produce_shard',
  'result_already_submitted','pilot_capacity_full','request_not_admitted'
 ])assert.match(text,new RegExp('`'+state+'`'));
 assert.match(text,/remoteWritesDuringProduction=false/);
 assert.match(text,/0 escrituras GitHub durante producción/);
 assert.match(text,/actualizar \*\*ese mismo request Issue una sola vez\*\*/i);
 assert.match(text,/no abrir R4\.2 en paralelo/i);
 assert.match(text,/Solo cuando \*\*no existe una Wave R4\.3 activa autoritativa\*\*/);
});

test('R4.3 worker guide does not weaken academic status semantics',()=>{
 const text=fs.readFileSync(guide,'utf8');
 assert.match(text,/R33, evidencia, APA 7 y validación canónica siguen siendo obligatorios/);
 assert.match(text,/PENDING_CANONICAL_R33_VALIDATION/);
 assert.match(text,/`PRODUCED`, `reconciled` o `submitted` no significan `VERIFIED`/);
 assert.match(text,/No OpenAI API ni otras APIs pagadas/);
 assert.match(text,/No Cloudflare\/D1 editorial/);
});
