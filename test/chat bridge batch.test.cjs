'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const bridge=require('../scripts/MLS chat bridge.cjs');

test('MLS Chat Bridge batch accepts 1–50 validated commands',()=>{
  const batch=bridge.normalizeBridgeBatch({
    batchId:'batch-1',
    commands:[
      {operationId:'entradaEvidenceMLS',input:{code:'MLS-V05-0881'}},
      {operationId:'fuentesEntradaEvidenceMLS',input:{code:'MLS-V05-0881'}}
    ]
  });
  assert.equal(batch.commands.length,2);
  assert.equal(batch.stopOnError,true);
  assert.throws(()=>bridge.normalizeBridgeBatch({batchId:'too-many',commands:Array.from({length:51},()=>({operationId:'entradaEvidenceMLS',input:{code:'MLS-V05-0881'}}))}),/entre 1 y 50/);
});

test('MLS Chat Bridge batch executes commands sequentially in one envelope',async()=>{
  const seen=[];
  const fetchImpl=async(url,init)=>{
    seen.push({url:String(url),method:init.method});
    return new Response(JSON.stringify({ok:true,n:seen.length}),{status:200,headers:{'content-type':'application/json'}});
  };
  const result=await bridge.executeBridgeBatch({
    batchId:'sequential',
    commands:[
      {operationId:'entradaEvidenceMLS',input:{code:'MLS-V05-0881'}},
      {operationId:'fuentesEntradaEvidenceMLS',input:{code:'MLS-V05-0881'}},
      {operationId:'metricasEvidenceEntradaMLS',input:{code:'MLS-V05-0881'}}
    ]
  },{secret:'test',fetchImpl,baseUrl:'https://example.test'});
  assert.equal(result.success,true);
  assert.equal(result.response.requested,3);
  assert.equal(result.response.processed,3);
  assert.equal(result.response.failures,0);
  assert.deepEqual(result.response.results.map(x=>x.index),[0,1,2]);
  assert.equal(seen.length,3);
});

test('MLS Chat Bridge batch stops after first failure by default',async()=>{
  let n=0;
  const fetchImpl=async()=>{
    n+=1;
    return new Response(JSON.stringify({ok:n!==2}),{status:n===2?409:200,headers:{'content-type':'application/json'}});
  };
  const result=await bridge.executeBridgeBatch({
    batchId:'stop',
    commands:[
      {operationId:'entradaEvidenceMLS',input:{code:'MLS-V05-0881'}},
      {operationId:'entradaEvidenceMLS',input:{code:'MLS-V05-0165'}},
      {operationId:'entradaEvidenceMLS',input:{code:'MLS-V05-0881'}}
    ]
  },{secret:'test',fetchImpl,baseUrl:'https://example.test'});
  assert.equal(result.success,false);
  assert.equal(result.response.processed,2);
  assert.equal(result.response.failures,1);
  assert.equal(n,2);
});

test('MLS Chat Bridge operational definition includes all Evidence correction operations',()=>{
  for(const id of ['entradaEvidenceMLS','fuentesEntradaEvidenceMLS','metricasEvidenceEntradaMLS','consumerEvidenceEntradaMLS','validarEvidenceMLS','proponerEvidenceMLS','verificarEvidenceMLS','revisarEvidenceMLS','proponerRevisionEvidenceMLS']){
    assert.ok(bridge.MLS_CHAT_BRIDGE_OPERATIONS[id],id);
  }
});


test('bridge: Gate 100 read-only scalability operations are allowlisted', async()=> {
  assert.ok(bridge.MLS_CHAT_BRIDGE_OPERATIONS.candidatosReuseEvidenceMLS);
  assert.equal(bridge.MLS_CHAT_BRIDGE_OPERATIONS.candidatosReuseEvidenceMLS.method,'POST');
  assert.equal(bridge.MLS_CHAT_BRIDGE_OPERATIONS.candidatosReuseEvidenceMLS.pathname,'/api/wiki/editorial/evidence/reuse-candidates');
  assert.ok(bridge.MLS_CHAT_BRIDGE_OPERATIONS.triageBatchEvidenceMLS);
  assert.equal(bridge.MLS_CHAT_BRIDGE_OPERATIONS.triageBatchEvidenceMLS.method,'POST');
  assert.equal(bridge.MLS_CHAT_BRIDGE_OPERATIONS.triageBatchEvidenceMLS.pathname,'/api/wiki/editorial/evidence/triage');
});
