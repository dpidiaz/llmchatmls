const MODEL='@cf/baai/bge-m3';
const EXPECTED_DIGEST='__SEMANTIC_GENERATION_KEY_SHA256__';

async function sha256Hex(value){
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(v=>v.toString(16).padStart(2,'0')).join('');
}

function rows(result){
  const data=result?.data;
  if(Array.isArray(data)&&Array.isArray(data[0]))return data.map(row=>row.map(Number));
  if(Array.isArray(data)&&Array.isArray(result?.shape)&&result.shape.length===2){
    const count=Number(result.shape[0]),width=Number(result.shape[1]),out=[];
    for(let i=0;i<count;i++)out.push(data.slice(i*width,(i+1)*width).map(Number));
    return out;
  }
  throw new Error('Unexpected embedding shape');
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.pathname==='/health'){
      return Response.json({ok:true,service:'MLS semantic generator temp',model:MODEL});
    }
    if(url.pathname!=='/embed'||request.method!=='POST')return new Response('Not found',{status:404});
    const auth=request.headers.get('authorization')||'';
    const token=auth.startsWith('Bearer ')?auth.slice(7):'';
    if(!token||EXPECTED_DIGEST.startsWith('__')||await sha256Hex(token)!==EXPECTED_DIGEST)return new Response('Not found',{status:404});
    try{
      const body=await request.json();
      const texts=Array.isArray(body?.texts)?body.texts.map(x=>String(x||'').replace(/\s+/g,' ').trim()):[];
      if(!texts.length||texts.length>32)return Response.json({ok:false,error:'texts must contain 1-32 items'},{status:400});
      let total=0;
      for(const text of texts){
        if(text.length<2||text.length>8000)return Response.json({ok:false,error:'each text must contain 2-8000 characters'},{status:400});
        total+=text.length;
      }
      if(total>180000)return Response.json({ok:false,error:'batch too large'},{status:413});
      const result=await env.AI.run(MODEL,{text:texts});
      const vectors=rows(result);
      if(vectors.length!==texts.length)throw new Error('Embedding count mismatch');
      return Response.json({ok:true,model:MODEL,count:vectors.length,dimensions:vectors[0]?.length||0,vectors},{headers:{'cache-control':'no-store'}});
    }catch(error){
      console.log('semantic temp error',String(error?.message||error));
      return Response.json({ok:false,error:'temporary semantic generation unavailable'},{status:503,headers:{'cache-control':'no-store','retry-after':'15'}});
    }
  }
};
