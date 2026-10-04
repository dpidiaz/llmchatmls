'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
function stable(x){return Array.isArray(x)?x.map(stable):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,stable(x[k])])):x;}
function hash(x){return crypto.createHash('sha256').update(JSON.stringify(stable(x))).digest('hex');}
function build(root=path.resolve(__dirname,'..')){
  const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
  const manifest=read('content/manifest.json');
  const verified=new Set(read('MLS R32 EDITORIAL/evidence git/indexes/verified.json'));
  const handoffs=new Map(read('MLS R32 EDITORIAL/r44/r33-handoff/index.json').entries.map(e=>[e.code,e]));
  const tickets=new Map(), packets=[], rows=[];
  let pending=0;
  for(const entry of manifest.entries){
    if(verified.has(entry.code))continue;
    pending++;
    const handoff=handoffs.get(entry.code);
    if(!handoff)continue; // Never manufacture the required durable R44 handoff.
    if(!tickets.has(handoff.handoffPath))tickets.set(handoff.handoffPath,read(handoff.handoffPath));
    const handoffEntry=tickets.get(handoff.handoffPath).entries.find(e=>e.code===entry.code);
    if(!handoffEntry)throw Error('CANONICAL_HANDOFF_MISSING_'+entry.code);
    const contentPath='content/'+entry.path;
    const evidencePath='MLS R32 EDITORIAL/evidence git/entries/'+entry.language+'/'+entry.code+'.json';
    const currentEvidenceRevision=fs.existsSync(path.join(root,evidencePath))?Number(read(evidencePath).evidenceRevision||0):0;
    const input={code:entry.code,contentPath,article:read(contentPath),handoffEntry,currentEvidenceRevision};
    const inputHash=hash(input), page=Math.floor(rows.length/100);
    (packets[page]??=[]).push({inputHash,input});
    rows.push({code:entry.code,inputHash,page});
  }
  const revision=hash(rows), out=path.join(root,'public','canonical-runner');
  fs.mkdirSync(out,{recursive:true});
  packets.forEach((packet,i)=>fs.writeFileSync(path.join(out,`${revision}-${i}.json`),JSON.stringify(packet)));
  fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({revision,pending,waitingHandoff:pending-rows.length,rows}));
  return {revision,pending,claimable:rows.length,waitingHandoff:pending-rows.length};
}
if(require.main===module)console.log(JSON.stringify(build()));
module.exports={build,hash};
