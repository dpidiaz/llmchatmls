'use strict';
const fs=require('node:fs');
const path=require('node:path');
function load(root='.'){
  const file=path.join(root,'MLS R32 EDITORIAL/r44/prepared-drain.json');
  if(!fs.existsSync(file))return new Set();
  const manifest=JSON.parse(fs.readFileSync(file,'utf8'));
  const codes=manifest.codes;
  if(manifest.version!==1||!Array.isArray(codes)||codes.some(c=>!/^MLS-V\d{2}-\d{4}$/.test(c))||new Set(codes).size!==codes.length)throw Error('PREPARED_DRAIN_MANIFEST_INVALID');
  return new Set(codes);
}
function prioritize(entries,codes){
  return [...entries].sort((a,b)=>Number(codes.has(b.code))-Number(codes.has(a.code))||a.order-b.order||a.code.localeCompare(b.code))
    .map((entry,index)=>({...entry,order:index+1}));
}
module.exports={load,prioritize};
