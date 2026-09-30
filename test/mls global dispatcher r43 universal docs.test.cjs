'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const doc=path.join(process.cwd(),'docs','MLS Global Dispatcher','19 Comando universal BCR.md');

test('MLS BCR siguiente is reserved exclusively for R4.2',()=>{
 const text=fs.readFileSync(doc,'utf8');
 assert.match(text,/contrato R4\.2/);
 assert.match(text,/define exclusivamente el comando/);
 assert.match(text,/`MLS BCR siguiente`/);
 assert.match(text,/R4\.3 usa un comando distinto/);
 assert.match(text,/`MLS R43 siguiente`/);
 assert.match(text,/Un chat que recibe `MLS BCR siguiente` no debe buscar, reclamar ni producir una\s+Wave R4\.3/);
 assert.match(text,/Un chat que recibe `MLS R43 siguiente` no debe caer a R4\.2/);
});

test('R4.2 document no longer advertises R4.3 routing behind MLS BCR siguiente',()=>{
 const text=fs.readFileSync(doc,'utf8');
 assert.doesNotMatch(text,/Routing del comando único/);
 assert.doesNotMatch(text,/Ruta R4\.3 collecting/);
 assert.doesNotMatch(text,/Cuando eligió R4\.3/);
 assert.match(text,/Ruta R4\.2/);
 assert.match(text,/`MLS BCR siguiente` inicia un \*\*bucle de\s+producción R4\.2/);
});
