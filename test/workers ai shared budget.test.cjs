'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const test=require('node:test');
const vm=require('node:vm');

const virtuoso=require('../scripts/habilitar virtuoso.js');
const translator=require('../scripts/habilitar traductor pronunciacion.js');
const shared=require('../scripts/habilitar presupuesto compartido workers ai.js');

function fullyPatchedWorker(){
  const base=fs.readFileSync('MLS R32 OVERLAY/index.js','utf8');
  const virtuosoHtml=fs.readFileSync('MLS R32 OVERLAY/virtuoso.html','utf8');
  return shared.patchWorker(translator.patchWorker(virtuoso.patchWorker(base,virtuosoHtml)));
}

test('shared Workers AI budget covers semantic, Virtuoso and Profesor IA direct inference paths',()=>{
  const worker=fullyPatchedWorker();
  assert.match(worker,/MLS_SHARED_WORKERS_AI_BUDGET_V1/);
  assert.match(worker,/providerId: "cloudflare-semantic"/);
  assert.match(worker,/providerId: "cloudflare-virtuoso"/);
  assert.match(worker,/providerId: "cloudflare-profesor"/);
  assert.doesNotMatch(worker,/const result = await env\.AI\.run\(MLS_SEMANTIC_EMBEDDING_MODEL/);
  assert.doesNotMatch(worker,/const result = await env\.AI\.run\(VIRTUOSO_MODEL_ID/);
  assert.doesNotMatch(worker,/const stream = await env\.AI\.run\(MODEL_ID, inputs\)/);
});

test('shared budget helper reserves atomically, settles usage and opens the existing persistent quota circuit',()=>{
  const block=shared.HELPER_BLOCK;
  assert.match(block,/reserveCloudflareBudget/);
  assert.match(block,/settleCloudflareBudget/);
  assert.match(block,/releaseCloudflareBudget/);
  assert.match(block,/markQuotaExhausted/);
  assert.match(block,/workersAiFailureKind/);
  assert.match(block,/recordProviderUsage/);
  assert.match(block,/status.*quota|mlsBudgetKind/s);
  assert.match(block,/@cf\/baai\/bge-m3/);
  assert.match(block,/1075\/1e6/);
});

test('non-streaming shared runner meters real token usage',async()=>{
  let daily=250;
  let reserved=0;
  const events=[];
  const store={
    async reserveCloudflareBudget(n){reserved+=n;events.push(['reserve',n]);return {ok:true,reserved:n}},
    async settleCloudflareBudget(r,a){reserved-=r;daily+=a;events.push(['settle',r,a]);return {dailyNeurons:daily,dailyReservedNeurons:reserved,targetNeurons:9000}},
    async releaseCloudflareBudget(r){reserved-=r;events.push(['release',r])},
    async markQuotaExhausted(){events.push(['quota'])}
  };
  const context={
    Error,Date,Math,JSON,ReadableStream,TextDecoder,
    wikiStore:()=>store,
    wikiUsageResult:result=>({
      promptTokens:Number(result?.usage?.prompt_tokens||0),
      completionTokens:Number(result?.usage?.completion_tokens||0)
    }),
    cloudflareNeurons:(_model,prompt,completion)=>(prompt*9091+completion*27273)/1e6,
    recordProviderUsage:async(_env,id,prompt,completion,error)=>events.push(['usage',id,prompt,completion,error]),
    wikiErrorMessage:error=>error instanceof Error?error.message:String(error),
    workersAiFailureKind:()=> 'other',
    secondsUntilNextUtcDay:()=>3600
  };
  vm.createContext(context);
  vm.runInContext(shared.HELPER_BLOCK+';globalThis.run=mlsSharedRunNonStreaming;',context);
  const result=await context.run(
    {AI:{run:async()=>({response:'ok',usage:{prompt_tokens:100,completion_tokens:20}})}},
    {providerId:'cloudflare-test',model:'@cf/google/gemma-4-26b-a4b-it',input:{},estimateNeurons:40}
  );
  assert.equal(result.measured,true);
  assert.equal(Math.round(result.neurons*10000)/10000,1.4546);
  assert.equal(reserved,0);
  assert.ok(events.some(e=>e[0]==='reserve'&&e[1]===40));
  assert.ok(events.some(e=>e[0]==='settle'&&Math.abs(e[2]-1.45456)<0.00001));
  assert.ok(events.some(e=>e[0]==='usage'&&e[1]==='cloudflare-test'&&e[4]===false));
});

test('streaming Professor runner holds reservation until the stream ends and settles final SSE usage',async()=>{
  let reserved=0;
  const events=[];
  const store={
    async reserveCloudflareBudget(n){reserved+=n;events.push(['reserve',n]);return {ok:true,reserved:n}},
    async settleCloudflareBudget(r,a){reserved-=r;events.push(['settle',r,a]);return {dailyNeurons:a,dailyReservedNeurons:reserved,targetNeurons:9000}},
    async releaseCloudflareBudget(r){reserved-=r;events.push(['release',r])},
    async markQuotaExhausted(){events.push(['quota'])}
  };
  const encoder=new TextEncoder();
  const source=new ReadableStream({
    start(controller){
      controller.enqueue(encoder.encode('data: {"response":"Hola"}\n\n'));
      controller.enqueue(encoder.encode('data: {"usage":{"prompt_tokens":120,"completion_tokens":30}}\n\n'));
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    }
  });
  const context={
    Error,Date,Math,JSON,ReadableStream,TextDecoder,
    wikiStore:()=>store,
    wikiUsageResult:result=>({
      promptTokens:Number(result?.usage?.prompt_tokens||0),
      completionTokens:Number(result?.usage?.completion_tokens||0)
    }),
    cloudflareNeurons:(_model,prompt,completion)=>(prompt*9091+completion*27273)/1e6,
    recordProviderUsage:async(_env,id,prompt,completion,error)=>events.push(['usage',id,prompt,completion,error]),
    wikiErrorMessage:error=>error instanceof Error?error.message:String(error),
    workersAiFailureKind:()=> 'other',
    secondsUntilNextUtcDay:()=>3600
  };
  vm.createContext(context);
  vm.runInContext(shared.HELPER_BLOCK+';globalThis.run=mlsSharedRunStreaming;',context);
  const wrapped=await context.run(
    {AI:{run:async()=>source}},
    {providerId:'cloudflare-profesor',model:'@cf/google/gemma-4-26b-a4b-it',input:{stream:true},estimateNeurons:150}
  );
  assert.equal(reserved,150,'la reserva debe permanecer mientras el stream está abierto');
  const reader=wrapped.getReader();
  while(!(await reader.read()).done){}
  assert.equal(reserved,0);
  const expected=(120*9091+30*27273)/1e6;
  assert.ok(events.some(e=>e[0]==='settle'&&Math.abs(e[2]-expected)<0.00001));
  assert.ok(events.some(e=>e[0]==='usage'&&e[1]==='cloudflare-profesor'&&e[2]===120&&e[3]===30&&e[4]===false));
});

test('shared budget patch is idempotent and predeploy runs it after AI modules are installed',()=>{
  const worker=fullyPatchedWorker();
  assert.equal(shared.patchWorker(worker),worker);
  const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
  const command=pkg.scripts.predeploy;
  const sharedPos=command.indexOf("habilitar presupuesto compartido workers ai.js");
  assert.ok(sharedPos>command.indexOf("habilitar virtuoso.js"));
  assert.ok(sharedPos>command.indexOf("habilitar traductor pronunciacion.js"));
  assert.match(pkg.scripts['test:chat-editorial'],/workers ai shared budget\.test\.cjs/);
});
