'use strict';

const fs=require('node:fs');

const WORKER='src/index.js';
const MARKER='MLS_SHARED_WORKERS_AI_BUDGET_V1';
const ANCHOR='var index_default = {';

const HELPER_BLOCK=`// ${MARKER}
function mlsSharedBudgetError(message,{circuitOpen=false,retryAfter=60,kind='budget'}={}){
  const error=new Error(message);
  error.mlsBudgetBlocked=true;
  error.mlsCircuitOpen=circuitOpen;
  error.retryAfter=Math.max(60,Number(retryAfter)||60);
  error.mlsBudgetKind=kind;
  return error;
}
function mlsSharedGemmaEstimate(messages,maxCompletionTokens){
  const chars=(Array.isArray(messages)?messages:[]).reduce((sum,item)=>sum+String(item?.content||'').length,0);
  const promptTokens=Math.max(64,Math.ceil(chars/4));
  const completionTokens=Math.max(64,Math.min(5000,Number(maxCompletionTokens)||1200));
  return Math.max(1,Math.ceil(cloudflareNeurons('@cf/google/gemma-4-26b-a4b-it',promptTokens,completionTokens)+2));
}
function mlsSharedNeuronCost(model,promptTokens,completionTokens,fallback){
  if(model==='@cf/baai/bge-m3'){
    if(promptTokens>0)return promptTokens*1075/1e6;
    return Math.max(0,Number(fallback)||0);
  }
  if(promptTokens+completionTokens>0)return cloudflareNeurons(model,promptTokens,completionTokens);
  return Math.max(0,Number(fallback)||0);
}
async function mlsSharedReserve(env,estimateNeurons){
  const reservation=await wikiStore(env).reserveCloudflareBudget(Math.max(1,Number(estimateNeurons)||1));
  if(reservation.ok)return reservation;
  const retryAfter=reservation.circuitOpen&&reservation.circuit?.resetAt
    ?Math.max(60,Math.ceil((Date.parse(reservation.circuit.resetAt)-Date.now())/1000))
    :secondsUntilNextUtcDay();
  throw mlsSharedBudgetError(
    reservation.circuitOpen
      ?'Workers AI FREE agotado hasta 00:00 UTC.'
      :'MLS alcanzó su presupuesto protegido de Workers AI por hoy.',
    {circuitOpen:reservation.circuitOpen===true,retryAfter,kind:reservation.circuitOpen?'quota':'budget'}
  );
}
async function mlsSharedFinalizeUsage(env,{providerId,model,reserved,result,fallbackNeurons,error=false}){
  const usage=wikiUsageResult(result);
  const promptTokens=Math.max(0,Number(usage.promptTokens)||0);
  const completionTokens=Math.max(0,Number(usage.completionTokens)||0);
  const measured=promptTokens+completionTokens>0;
  const neurons=mlsSharedNeuronCost(model,promptTokens,completionTokens,measured?0:fallbackNeurons);
  const budget=await wikiStore(env).settleCloudflareBudget(reserved,neurons);
  await recordProviderUsage(env,providerId,promptTokens,completionTokens,error).catch(()=>{});
  return {usage:{promptTokens,completionTokens},neurons,measured,budget};
}
async function mlsSharedHandleInferenceFailure(env,{providerId,reserved,error}){
  await wikiStore(env).releaseCloudflareBudget(reserved).catch(()=>{});
  await recordProviderUsage(env,providerId,0,0,true).catch(()=>{});
  const message=wikiErrorMessage(error);
  const kind=workersAiFailureKind(message);
  if(kind==='quota'){
    await wikiStore(env).markQuotaExhausted(providerId,message).catch(()=>{});
    throw mlsSharedBudgetError('Workers AI FREE agotado hasta 00:00 UTC.',{circuitOpen:true,retryAfter:secondsUntilNextUtcDay(),kind:'quota'});
  }
  if(kind==='paid'){
    throw mlsSharedBudgetError('El modelo requeriría Workers Paid. MLS lo bloqueó para mantener costo $0.00.',{retryAfter:secondsUntilNextUtcDay(),kind:'paid'});
  }
  throw error;
}
async function mlsSharedRunNonStreaming(env,{providerId,model,input,estimateNeurons}){
  const reservation=await mlsSharedReserve(env,estimateNeurons);
  const reserved=Number(reservation.reserved||estimateNeurons||1);
  try{
    const result=await env.AI.run(model,input);
    const metering=await mlsSharedFinalizeUsage(env,{providerId,model,reserved,result,fallbackNeurons:reserved});
    return {result,...metering};
  }catch(error){
    return await mlsSharedHandleInferenceFailure(env,{providerId,reserved,error});
  }
}
function mlsSharedObserveSseUsage(state,text){
  state.buffer+=String(text||'');
  const lines=state.buffer.split(/\\r?\\n/);
  state.buffer=lines.pop()||'';
  for(const line of lines){
    if(!line.startsWith('data:'))continue;
    const raw=line.slice(5).trim();
    if(!raw||raw==='[DONE]')continue;
    try{
      const payload=JSON.parse(raw);
      const usage=wikiUsageResult(payload);
      if(usage.promptTokens>0)state.promptTokens=Math.max(state.promptTokens,usage.promptTokens);
      if(usage.completionTokens>0)state.completionTokens=Math.max(state.completionTokens,usage.completionTokens);
    }catch{}
  }
}
async function mlsSharedRunStreaming(env,{providerId,model,input,estimateNeurons}){
  const reservation=await mlsSharedReserve(env,estimateNeurons);
  const reserved=Number(reservation.reserved||estimateNeurons||1);
  let source;
  try{
    source=await env.AI.run(model,input);
  }catch(error){
    return await mlsSharedHandleInferenceFailure(env,{providerId,reserved,error});
  }
  if(!source||typeof source.getReader!=='function'){
    await mlsSharedFinalizeUsage(env,{providerId,model,reserved,result:null,fallbackNeurons:reserved,error:true});
    throw new Error('Workers AI no devolvió un stream utilizable.');
  }
  const reader=source.getReader();
  const decoder=new TextDecoder();
  const state={buffer:'',promptTokens:0,completionTokens:0,finalized:false};
  const finalize=async(error=false)=>{
    if(state.finalized)return;
    state.finalized=true;
    const result={usage:{prompt_tokens:state.promptTokens,completion_tokens:state.completionTokens}};
    await mlsSharedFinalizeUsage(env,{providerId,model,reserved,result,fallbackNeurons:reserved,error}).catch(()=>{});
  };
  return new ReadableStream({
    async pull(controller){
      try{
        const chunk=await reader.read();
        if(chunk.done){
          mlsSharedObserveSseUsage(state,decoder.decode());
          if(state.buffer)mlsSharedObserveSseUsage(state,'\\n');
          await finalize(false);
          controller.close();
          return;
        }
        controller.enqueue(chunk.value);
        mlsSharedObserveSseUsage(state,decoder.decode(chunk.value,{stream:true}));
      }catch(error){
        await finalize(true);
        controller.error(error);
      }
    },
    async cancel(reason){
      try{await reader.cancel(reason)}catch{}
      await finalize(true);
    }
  });
}
`;

function patchWorker(source){
  source=String(source||'');
  if(source.includes(MARKER))return source;
  if(!source.includes(ANCHOR))throw new Error('Presupuesto compartido: no se encontró el ancla del Worker.');

  const semanticOld='const result = await env.AI.run(MLS_SEMANTIC_EMBEDDING_MODEL, { text: [query] });';
  const semanticNew='const { result } = await mlsSharedRunNonStreaming(env, { providerId: "cloudflare-semantic", model: MLS_SEMANTIC_EMBEDDING_MODEL, input: { text: [query] }, estimateNeurons: 1 });';
  if(!source.includes(semanticOld))throw new Error('Presupuesto compartido: no se encontró la inferencia semántica.');
  source=source.replace(semanticOld,semanticNew);

  const professorOld='const stream = await env.AI.run(MODEL_ID, inputs);';
  const professorNew='const stream = await mlsSharedRunStreaming(env, { providerId: "cloudflare-profesor", model: MODEL_ID, input: inputs, estimateNeurons: mlsSharedGemmaEstimate(modelMessages, inputs.max_completion_tokens) });';
  if(!source.includes(professorOld))throw new Error('Presupuesto compartido: no se encontró la inferencia de Profesor IA.');
  source=source.replace(professorOld,professorNew);

  const virtuosoPattern=/const result = await env\.AI\.run\(VIRTUOSO_MODEL_ID, \{\n\s*messages: \[\{ role: "system", content: system \}, \{ role: "user", content: user \}\],\n\s*max_completion_tokens: 1200,\n\s*temperature: 0\.1,\n\s*top_p: 0\.85,\n\s*chat_template_kwargs: \{ enable_thinking: false \},\n\s*stream: false\n\s*\}\);/;
  if(!virtuosoPattern.test(source))throw new Error('Presupuesto compartido: no se encontró la inferencia de Virtuoso.');
  source=source.replace(virtuosoPattern,
`const virtuosoInput = {
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        max_completion_tokens: 1200,
        temperature: 0.1,
        top_p: 0.85,
        chat_template_kwargs: { enable_thinking: false },
        stream: false
      };
      const { result } = await mlsSharedRunNonStreaming(env, {
        providerId: "cloudflare-virtuoso",
        model: VIRTUOSO_MODEL_ID,
        input: virtuosoInput,
        estimateNeurons: mlsSharedGemmaEstimate(virtuosoInput.messages, virtuosoInput.max_completion_tokens)
      });`);

  const professorCatchOld=`console.error("Profesor IA error:", error);
    return new Response(
      JSON.stringify({
        error: "No fue posible generar la explicaci\\xF3n."
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store"
        }
      }
    );`;
  const professorCatchNew=`console.error("Profesor IA error:", error);
    const budgetBlocked = error?.mlsBudgetBlocked === true;
    return new Response(
      JSON.stringify({
        error: budgetBlocked ? error.message : "No fue posible generar la explicaci\\xF3n."
      }),
      {
        status: budgetBlocked ? 429 : 500,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store",
          ...(budgetBlocked ? { "retry-after": String(error.retryAfter || 60) } : {})
        }
      }
    );`;
  if(!source.includes(professorCatchOld))throw new Error('Presupuesto compartido: no se encontró el catch de Profesor IA.');
  source=source.replace(professorCatchOld,professorCatchNew);

  return source.replace(ANCHOR,HELPER_BLOCK+'\n\n'+ANCHOR);
}

function install(){
  if(!fs.existsSync(WORKER))throw new Error('Presupuesto compartido: falta '+WORKER+'. Ejecuta predeploy desde el repositorio.');
  const source=fs.readFileSync(WORKER,'utf8');
  const patched=patchWorker(source);
  fs.writeFileSync(WORKER,patched);
}

function main(){install();console.log('MLS Workers AI shared FREE ONLY budget habilitado.');}

module.exports={WORKER,MARKER,HELPER_BLOCK,patchWorker,install};
if(require.main===module)main();
