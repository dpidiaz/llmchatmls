'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const doc=path.join(process.cwd(),'docs','MLS Global Dispatcher','19 Comando universal BCR.md');

test('universal BCR documentation preserves R4.3-first routing with R4.2 fallback',()=>{
 const text=fs.readFileSync(doc,'utf8');
 assert.match(text,/contrato universal R4\.3 \/ R4\.2/);
 assert.match(text,/r4 snapshot command\.cjs/);
 assert.match(text,/estado `collecting`/);
 assert.match(text,/Wave está `sealed`/);
 assert.match(text,/responder `pilot_capacity_full`/);
 assert.match(text,/R4\.2 vuelve a ser fallback cuando no exista una Wave R4\.3 activa/);
 assert.match(text,/dos Waves R4\.3 activas/);
 assert.match(text,/no escribe GitHub/);
});

test('universal BCR documentation keeps R4.3 out of the R4.2 lease loop',()=>{
 const text=fs.readFileSync(doc,'utf8');
 assert.match(text,/Cuando el router eligió \*\*R4\.2\*\*/);
 assert.match(text,/Cuando eligió R4\.3, no se usa este lease loop/);
 assert.match(text,/una sola asignación\s+de cinco entradas/);
 assert.match(text,/un único delta durable al final/);
});
