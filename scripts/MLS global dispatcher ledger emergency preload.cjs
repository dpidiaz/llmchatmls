'use strict';

// Emergency, lossless storage shim for the Global Dispatcher ledger.
// Keeps the canonical ledger semantics intact while replacing only its issue-body
// serialization. It reads the current deflate envelope and the new Brotli envelope.
const Module=require('node:module');
const zlib=require('node:zlib');
const crypto=require('node:crypto');
const originalLoad=Module._load;
const MAX_RAW=32*1024*1024;
const MAX_BODY=240000;

function hash(raw){return crypto.createHash('sha256').update(raw).digest('hex');}
function extract(body){
  const m=/<!--\s*MLS_GLOBAL_DISPATCH_LEDGER\s*([\s\S]*?)-->/m.exec(String(body||''));
  if(!m)return null;
  try{return JSON.parse(m[1].trim());}catch{return null;}
}
function decodeEnvelope(x){
  if(x?.kind==='mls_global_dispatch_ledger')return x;
  if(x?.kind!=='mls_global_dispatch_ledger_blob'||x.version!==1)return null;
  if(typeof x.data!=='string'||!Number.isSafeInteger(x.rawBytes)||x.rawBytes<1||x.rawBytes>MAX_RAW)return null;
  const packed=Buffer.from(x.data,'base64');
  if(packed.toString('base64')!==x.data)return null;
  let raw;
  if(x.encoding==='deflate-raw-base64')raw=zlib.inflateRawSync(packed,{maxOutputLength:MAX_RAW});
  else if(x.encoding==='brotli-base64-v2')raw=zlib.brotliDecompressSync(packed,{maxOutputLength:MAX_RAW});
  else return null;
  if(raw.length!==x.rawBytes||hash(raw)!==x.sha256)return null;
  const ledger=JSON.parse(raw.toString('utf8'));
  return ledger?.kind==='mls_global_dispatch_ledger'?ledger:null;
}

Module._load=function(request,parent,isMain){
  const exp=originalLoad.apply(this,arguments);
  let resolved='';
  try{resolved=Module._resolveFilename(request,parent,isMain);}catch{}
  if(!String(resolved).replace(/\\/g,'/').endsWith('/MLS R32 EDITORIAL/global dispatcher/core.js')||exp.__mlsLedgerBrotliV2)return exp;
  exp.__mlsLedgerBrotliV2=true;
  exp.parseLedger=function(body){try{return decodeEnvelope(extract(body));}catch{return null;}};
  exp.renderLedgerBody=function(ledger){
    const terminalCount=Object.keys(ledger.terminal||{}).length;
    const recoveryCount=Object.keys(ledger.recoveries||{}).length;
    const raw=Buffer.from(JSON.stringify(ledger),'utf8');
    if(raw.length>MAX_RAW)throw exp.dispatchError('LEDGER_RAW_LIMIT','Ledger excede el máximo seguro sin compresión.',507);
    const packed=zlib.brotliCompressSync(raw,{params:{[zlib.constants.BROTLI_PARAM_QUALITY]:11,[zlib.constants.BROTLI_PARAM_MODE]:zlib.constants.BROTLI_MODE_TEXT}});
    const payload={kind:'mls_global_dispatch_ledger_blob',version:1,encoding:'brotli-base64-v2',rawBytes:raw.length,sha256:hash(raw),data:packed.toString('base64')};
    const marker='<!-- MLS_GLOBAL_DISPATCH_LEDGER\n'+JSON.stringify(payload)+'\n-->';
    const body=['## MLS Global Dispatcher ledger','','**Terminales:** '+terminalCount+'  ','**Recoveries pendientes:** '+recoveryCount+'  ','**Actualizado:** '+ledger.updatedAt+'  ','','No edites manualmente el bloque de control.','',marker].join('\n');
    if(Buffer.byteLength(body,'utf8')>MAX_BODY)throw exp.dispatchError('LEDGER_BODY_LIMIT','Ledger Brotli excede el límite de publicación; detener antes de crear assignments.',507);
    return body;
  };
  return exp;
};
