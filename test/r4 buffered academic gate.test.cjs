'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),
 fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const ac=require('../MLS R32 EDITORIAL/r4 buffered academic.cjs');
const root=path.resolve(__dirname,'..');
const article={code:'MLS-V10-0306',articleMarkdown:'#### En pocas palabras\nRegla uno.\n#### Cómo funciona\nRegla dos.\n#### Ejemplos\nEjemplo construido.\n#### Observación importante\nMatiz.\n#### Entradas relacionadas\nOtras.'};
const claim=(id,sectionKey)=>({claimId:id,sectionKey,materiality:'substantial'});
const link=(id,locator)=>({claimId:id,sourceId:'MLS-SRC-VALID',supportType:'supports',locator});
test('pilot #1861 one-claim, zero-locator pattern cannot pass the new academic gate',()=>{
 const e={code:article.code,status:'VERIFIED',claims:[claim('ONE','En pocas palabras')],links:[link('ONE',{})]};
 const r=ac.inspect(e,article);
 assert.equal(r.ok,false);
 assert.ok(r.errors.some(x=>x==='ACADEMIC_SECTION_UNMAPPED:Cómo funciona'));
 assert.ok(r.errors.some(x=>x==='ACADEMIC_SECTION_UNMAPPED:Observación importante'));
 assert.ok(r.errors.some(x=>x.startsWith('ACADEMIC_EXACT_LOCATOR_MISSING:')));
});
test('material sections with checkable locators pass only structural traceability',()=>{
 const e={code:article.code,status:'VERIFIED',
 claims:[claim('A','En pocas palabras'),claim('B','Cómo funciona'),claim('C','Observación importante')],
 links:[link('A',{section:'15.4a'}),link('B',{section:'15.4b'}),link('C',{section:'15.4c'})]};
 const r=ac.inspect(e,article);assert.equal(r.ok,true);
 assert.equal(r.independentSourceMeaningCheck,'REQUIRED_SEPARATELY');
 assert.equal(ac.inspect({...e,links:e.links.map(x=>({...x,locator:{url:'https://rae.es/'}}))},article).ok,false);
});
test('immutable #1861 hold blocks final publication',()=>{
 const holds=JSON.parse(fs.readFileSync(path.join(root,'MLS R32 EDITORIAL/evidence git/quality-holds.json'),'utf8'));
 const h=holds.holds.find(x=>x.workId==='r33-buffer:MLS-BUFFER-001861');
 assert.equal(h.status,'active');assert.equal(h.codes.length,10);
 assert.equal(h.commitSha,'b6de10a6cd9d2a0682a9a162606a6d09e2bea839');
 const out=cp.spawnSync(process.execPath,['scripts/R4 final publication readiness.cjs'],{cwd:root,encoding:'utf8'});
 assert.equal(out.status,2,out.stderr);
 const result=JSON.parse(out.stdout.trim());
 assert.equal(result.ready,false);assert.equal(result.academicHolds,1);assert.equal(result.heldCodes.length,10);
});
test('R4.1 sync executes academic gate before grouped write',()=>{
 const y=fs.readFileSync(path.join(root,'.github/workflows/R4.1 Buffered Sync.yml'),'utf8');
 const gate=y.indexOf('R4.1 academic traceability before grouped write'),commit=y.indexOf('Single grouped commit and non-force push');
 assert.ok(gate>0&&commit>gate);
 assert.match(y,/scripts\/R4-1-buffered-academic-check\.cjs/);
});

test('deferred R4 rehearsal discloses pilot hold instead of implying full academic clearance',()=>{
 const rehearsal=fs.readFileSync(path.join(root,'scripts/R4 staging rehearsal.cjs'),'utf8');
 assert.match(rehearsal,/academicHoldCount:activeHolds\.length/);
 assert.match(rehearsal,/STRUCTURAL_PASS_ACADEMIC_HOLD/);
});
