'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const {URL}=require('node:url');
function stable(x){return Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;}
function hash(x){return crypto.createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');}
function createRuntime(catalog,root=path.resolve(__dirname,'..')){
  const runtime=vm.createContext({URL,MLS_R33_SOURCE_CATALOG:catalog});
  vm.runInContext(fs.readFileSync(path.join(root,'scripts/unified runner r33 runtime.js'),'utf8'),runtime);
  return runtime;
}
function build(root=path.resolve(__dirname,'..')){
  const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
  const sourceDir=path.join(root,'MLS R32 EDITORIAL/evidence git/registry/sources');
  const apa=require(path.join(root,'MLS R32 EDITORIAL/evidence apa.js'));
  const catalog=fs.readdirSync(sourceDir).filter(n=>n.endsWith('.json')).sort()
    .map(n=>JSON.parse(fs.readFileSync(path.join(sourceDir,n),'utf8')))
    .filter(raw=>raw&&raw.metadata&&apa.validateApaSource(raw.metadata).citationReady);
  const runtime=createRuntime(catalog,root);
  const manifest=read('content/manifest.json');
  const verified=new Set(read('MLS R32 EDITORIAL/evidence git/indexes/verified.json'));
  const handoffs=new Map(read('MLS R32 EDITORIAL/r44/r33-handoff/index.json').entries.map(e=>[e.code,e]));
  const tickets=new Map(), packets=[], rows=[];
  const primary=path.join(root,'public/canonical-input');
  fs.mkdirSync(primary,{recursive:true});
  let pending=0;
  for(const entry of manifest.entries){
    if(verified.has(entry.code))continue;
    pending++;
    const contentPath='content/'+entry.path;
    const evidencePath='MLS R32 EDITORIAL/evidence git/entries/'+entry.language+'/'+entry.code+'.json';
    const currentEvidenceRevision=fs.existsSync(path.join(root,evidencePath))?Number(read(evidencePath).evidenceRevision||0):0;
    const base={code:entry.code,contentPath,article:read(contentPath),currentEvidenceRevision};
    fs.writeFileSync(path.join(primary,entry.code+'.json'),JSON.stringify(base));
    const handoff=handoffs.get(entry.code);
    if(!handoff){rows.push({code:entry.code,inputHash:hash(base),contextHash:hash(base),page:-1,waiting:true});continue;}
    if(!tickets.has(handoff.handoffPath))tickets.set(handoff.handoffPath,read(handoff.handoffPath));
    const handoffEntry=tickets.get(handoff.handoffPath).entries.find(e=>e.code===entry.code);
    if(!handoffEntry)throw Error('CANONICAL_HANDOFF_MISSING_'+entry.code);
    const input={...base,handoffEntry};
    const inputHash=hash(input), page=Math.floor(rows.filter(r=>!r.waiting).length/100);
    (packets[page]??=[]).push({inputHash,input});
    const contextHash=hash(runtime.unifiedR33CanonicalContext(input));
    rows.push({code:entry.code,inputHash,contextHash,page});
  }
  const revision=hash(rows), out=path.join(root,'public','canonical-runner');
  fs.mkdirSync(out,{recursive:true});
  packets.forEach((packet,i)=>fs.writeFileSync(path.join(out,`${revision}-${i}.json`),JSON.stringify(packet)));
  fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({revision,pending,waitingHandoff:rows.filter(r=>r.waiting).length,rows}));
  return {revision,pending,claimable:rows.filter(r=>!r.waiting).length,waitingHandoff:pending-rows.length};
}
if(require.main===module)console.log(JSON.stringify(build()));
module.exports={build,hash,createRuntime};
