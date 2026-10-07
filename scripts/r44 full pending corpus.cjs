const fs = require('node:fs');
const {execFileSync} = require('node:child_process');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');
const zlib = require('node:zlib');
const BASE = '2961a29cfcb62caa9972e5dc5552037b001063a3';
const CANONICAL_BASE = '0fa768aba71a5f9d31fe3558a625203c3dff856e';
const LEGACY = '9ca3221fad3be35d55b8848b890d435d344421c3';
const LEGACY_BLOB = '2cc713bd40bcb42dfc7f19f7a79cd5acafc3ecd2';
const POOL_PATH = 'MLS R32 EDITORIAL/r44/pool-manifest.json';
function frozen(commit, filePath, blob) {
  const ref = `${commit}:${filePath}`;
  if (process.env.R44_FROZEN_DIR) {
    const bytes=fs.readFileSync(path.join(process.env.R44_FROZEN_DIR,`${commit}-${filePath.split('/').at(-1)}`));
    assert(blob, 'Offline frozen sources require an expected Git blob');
    assert.equal(crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'),blob);
    return JSON.parse(bytes);
  }
  const snapshot = path.join(__dirname, 'r44-frozen', `${commit}-${filePath.split('/').at(-1)}.gz`);
  if (fs.existsSync(snapshot)) {
    const bytes = zlib.gunzipSync(fs.readFileSync(snapshot));
    assert(blob, 'Bundled frozen sources require an expected Git blob');
    assert.equal(crypto.createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'), blob);
    return JSON.parse(bytes);
  }
  if (blob) assert.equal(execFileSync('git', ['rev-parse', ref], {encoding:'utf8'}).trim(), blob);
  return JSON.parse(execFileSync('git', ['show', ref], {encoding:'utf8',maxBuffer:16*1024*1024}));
}
function unique(values, count) {
  const set = new Set(values);
  assert.equal(values.length, count);
  assert.equal(set.size, count, 'Duplicate code');
  return set;
}
function derive() {
  const manifest = frozen(CANONICAL_BASE, 'content/manifest.json', '643b3c9cab84a0372f9e52127fe78ad0e9fab938');
  const verified = frozen(BASE, 'MLS R32 EDITORIAL/evidence git/indexes/verified.json', 'e19bc5f617a93f4b1ec50eb96815783ba6b8920e');
  const legacy = frozen(LEGACY, POOL_PATH, LEGACY_BLOB);
  const all = unique(manifest.entries.map(e=>e.code), 10133);
  const certified = unique(verified, 1725);
  for (const code of certified) assert(all.has(code));
  const current = unique(legacy.tickets.flatMap(t=>t.entries.map(e=>e.code)), 4000);
  assert.equal(legacy.tickets.length, 800);
  const pending = manifest.entries.filter(e=>!certified.has(e.code));
  const pendingCodes = unique(pending.map(e=>e.code), 8408);
  for (const code of current) assert(pendingCodes.has(code));
  const remainder = pending.filter(e=>!current.has(e.code));
  unique(remainder.map(e=>e.code), 4408);
  const byPrefix = {};
  for (const e of remainder) byPrefix[e.code.slice(4,7)] = (byPrefix[e.code.slice(4,7)]||0)+1;
  assert.deepEqual(byPrefix, {V01:596,V02:1029,V07:263,V08:924,V09:861,V10:735});
  const tickets = [...legacy.tickets];
  for(let i=0;i<remainder.length;i+=legacy.ticketSize) {
    const entries = remainder.slice(i,i+legacy.ticketSize).map(({code,path,sha256})=>({code,path,sha256}));
    tickets.push({id:`R44-CORPUS-${String(tickets.length+1).padStart(4,'0')}`,ordinalStart:4001+i,ordinalEnd:4000+i+entries.length,initialState:'queued',entries});
  }
  assert.equal(tickets.length,1682);
  assert.deepEqual(tickets[800].entries.map(e=>e.code),['MLS-V01-0001','MLS-V01-0002','MLS-V01-0004','MLS-V01-0005','MLS-V01-0006']);
  assert.deepEqual(tickets.at(-1).entries.map(e=>e.code),['MLS-V10-0927','MLS-V10-0928','MLS-V10-0929']);
  assert.deepEqual(unique(tickets.flatMap(t=>t.entries.map(e=>e.code)),8408),pendingCodes);
  const canonical = new Map(manifest.entries.map(e=>[e.code,e]));
  for(const t of tickets) for(const e of t.entries) {
    assert.equal(e.path,canonical.get(e.code).path);
    assert.equal(e.sha256,canonical.get(e.code).sha256);
  }
  return {...legacy,schema:'MLS-R44-CLOUDFLARE-POOL-2',ticketCount:tickets.length,entryCount:pending.length,
    source:{...legacy.source,fullPendingBaseCommit:CANONICAL_BASE,legacyPoolCommit:LEGACY},
    fullPendingCorpus:{frozen:all.size,verified:certified.size,pending:pending.length,existing:current.size,added:remainder.length,addedTickets:tickets.length-legacy.tickets.length,remainderByPrefix:byPrefix},tickets};
}
function validate() {
  const expected=derive(), actual=JSON.parse(fs.readFileSync(POOL_PATH,'utf8'));
  assert.deepEqual(actual,expected,'Pool must equal deterministic append-only derivation');
  return actual;
}
if(require.main===module) {
  if(process.argv.includes('--write')) fs.writeFileSync(POOL_PATH,JSON.stringify(derive())+'\n');
  const pool=validate();
  console.log(JSON.stringify(pool.fullPendingCorpus));
}
module.exports={derive,validate,BASE,CANONICAL_BASE,LEGACY,POOL_PATH};
