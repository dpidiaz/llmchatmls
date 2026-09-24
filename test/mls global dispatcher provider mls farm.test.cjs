const test=require('node:test');
const assert=require('node:assert/strict');
const farm=require('../MLS R32 EDITORIAL/farm core.js');
const globalCore=require('../MLS R32 EDITORIAL/global dispatcher/core.js');
const provider=require('../MLS R32 EDITORIAL/global dispatcher/providers/mls farm.js');

const AT='2026-09-24T04:00:00.000Z';

function entry(n){
  const code='MLS-V10-'+String(n).padStart(4,'0');
  return {code,language:'espanol-guatemala',languageName:'Español de Guatemala',n,path:'content/espanol-guatemala/'+code+'.json'};
}
function ledger(terminals=[]){
  let value=farm.initialLedger(farm.LANGUAGE_ORDER[0],[]);
  for(const [code,status] of terminals)value=farm.addTerminalToLedger(value,code,status);
  return value;
}
function activeBatch(issueNumber,entries){
  return farm.makeBatchState({issueNumber,requestId:'request-'+String(issueNumber).padStart(8,'0'),workerId:'worker-'+String(issueNumber).padStart(8,'0'),entries,now:'2026-09-24T03:58:00.000Z',token:'token-'+issueNumber});
}

test('MLS Farm provider exposes FIFO eligible work with one global ownership layer',()=>{
  const corpus=[1,2,3,4,5].map(entry);
  const ledgers=[ledger([[corpus[0].code,'submitted']])];
  const batches=[activeBatch(100,[corpus[1]])];
  const before=JSON.stringify({corpus,ledgers,batches});
  const work=provider.materializeFarmWork({corpus,ledgers,batches,requested:2,at:AT});
  assert.deepEqual(work.units,[corpus[2].code,corpus[3].code]);
  assert.deepEqual(work.resourceLocks,work.units.map(code=>'entry:'+code));
  assert.deepEqual(work.allowedPaths,[corpus[2].path,corpus[3].path]);
  assert.equal(work.provider,'mls-farm');
  assert.equal(work.ownershipMode,'global-single-lease');
  assert.equal(work.workType,'editorial_batch');
  assert.equal(JSON.stringify({corpus,ledgers,batches}),before,'adapter must be pure');
});

test('MLS Farm provider emits a Global Dispatcher compatible work item',()=>{
  const work=provider.materializeFarmWork({corpus:[entry(1),entry(2)],ledgers:[ledger()],batches:[],requested:1,at:AT});
  const normalized=globalCore.normalizeWorkItem(work);
  assert.equal(normalized.workId,work.workId);
  assert.equal(normalized.provider,'mls-farm');
  assert.deepEqual(normalized.resourceLocks,['entry:MLS-V10-0001']);
  assert.deepEqual(normalized.allowedPaths,['content/espanol-guatemala/MLS-V10-0001.json']);
});

test('MLS Farm provider returns null when no eligible work remains',()=>{
  const corpus=[entry(1),entry(2)];
  const ledgers=[ledger([[corpus[0].code,'submitted'],[corpus[1].code,'needs_review']])];
  assert.equal(provider.materializeFarmWork({corpus,ledgers,batches:[],at:AT}),null);
});

test('MLS Farm provider fails closed on duplicate active ownership',()=>{
  const corpus=[entry(1),entry(2)];
  const batches=[activeBatch(101,[corpus[0]]),activeBatch(102,[corpus[0]])];
  assert.throws(()=>provider.materializeFarmWork({corpus,ledgers:[ledger()],batches,at:AT}),error=>error.code==='DOUBLE_OWNERSHIP');
});

test('MLS Farm provider fails closed when terminal and active ownership conflict',()=>{
  const corpus=[entry(1),entry(2)];
  const ledgers=[ledger([[corpus[0].code,'submitted']])];
  const batches=[activeBatch(103,[corpus[0]])];
  assert.throws(()=>provider.materializeFarmWork({corpus,ledgers,batches,at:AT}),error=>error.code==='TERMINAL_LEASE_CONFLICT');
});

test('MLS Farm provider fails closed on malformed active lease timing',()=>{
  const bad=activeBatch(104,[entry(1)]);
  bad.ackDeadlineAt='not-a-date';
  bad.expiresAt='not-a-date';
  assert.throws(()=>provider.materializeFarmWork({corpus:[entry(1)],ledgers:[ledger()],batches:[bad],at:AT}),error=>error.code==='INVALID_LEASE_EXPIRY');
});

test('MLS Farm provider fails closed on duplicate corpus and ledgers',()=>{
  assert.throws(()=>provider.materializeFarmWork({corpus:[entry(1),entry(1)],ledgers:[ledger()],batches:[],at:AT}),error=>error.code==='DUPLICATE_CORPUS_CODE');
  const l=ledger();
  assert.throws(()=>provider.materializeFarmWork({corpus:[entry(1)],ledgers:[l,l],batches:[],at:AT}),error=>error.code==='DUPLICATE_LEDGER');
});

test('MLS Farm provider honors Farm batch bounds',()=>{
  assert.throws(()=>provider.materializeFarmWork({corpus:[entry(1)],ledgers:[ledger()],batches:[],requested:101,at:AT}),error=>error.code==='INVALID_BATCH_SIZE');
  const work=provider.materializeFarmWork({corpus:[entry(1),entry(2)],ledgers:[ledger()],batches:[],requested:1,at:AT});
  assert.equal(work.units.length,1);
  assert.equal(work.checkpointSizeMax,10);
});
