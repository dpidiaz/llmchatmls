'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const zlib=require('node:zlib');
const {execFileSync}=require('node:child_process');
const {BASE,POOL_PATH}=require('./r44 full pending corpus.cjs');
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
// Resolve historical input at build time, never from a production claim.
function build(root=path.resolve(__dirname,'..')){
  const poolBytes=fs.readFileSync(path.join(root,POOL_PATH));
  const pool=JSON.parse(poolBytes),entries=pool.tickets.flatMap(t=>t.entries);
  const out=path.join(root,'public/r44-primary');
  fs.mkdirSync(out,{recursive:true});
  const refs=entries.map(e=>BASE+':content/'+e.path);
  const bundledBatch=path.join(__dirname,'r44-frozen','primary-assets.batch.gz');
  const blobs=process.env.R44_FROZEN_BATCH?fs.readFileSync(process.env.R44_FROZEN_BATCH):fs.existsSync(bundledBatch)?zlib.gunzipSync(fs.readFileSync(bundledBatch)):execFileSync('git',['cat-file','--batch'],{cwd:root,input:refs.join('\n')+'\n',maxBuffer:256*1024*1024});
  let offset=0;
  const quarantined=[],shards=new Map();
  for(const entry of entries){
    const end=blobs.indexOf(10,offset),header=blobs.subarray(offset,end).toString();
    if(!/^[a-f0-9]+ blob \d+$/.test(header))throw Error('R44_FROZEN_BLOB_MISSING_'+entry.code);
    const size=Number(header.split(' ')[2]),bytes=blobs.subarray(end+1,end+1+size);
    offset=end+size+2;
    if(digest(bytes)!==entry.sha256){
      // Preserve the existing fail-closed treatment of these two corrupt frozen entries.
      if(!['MLS-V10-0870','MLS-V10-0871'].includes(entry.code))throw Error('R44_FROZEN_HASH_MISMATCH_'+entry.code);
      quarantined.push(entry.code);continue;
    }
    const shard=entry.sha256.slice(0,2);
    if(!shards.has(shard))shards.set(shard,{});
    shards.get(shard)[entry.sha256]=bytes.toString('utf8');
  }
  for(const [key,value] of shards)fs.writeFileSync(path.join(out,key+'.json'),JSON.stringify(value));
  fs.writeFileSync(path.join(out,'pool-manifest.json'),poolBytes);
  return {entries:entries.length-quarantined.length,quarantined,poolSha256:digest(poolBytes)};
}
if(require.main===module)console.log(JSON.stringify(build()));
module.exports={build};
