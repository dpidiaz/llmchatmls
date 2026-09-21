const test=require('node:test');
const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const telemetry=require('../MLS R32 EDITORIAL/evidence telemetry.js');
const registry=require('../MLS R32 EDITORIAL/evidence registry.js');
const claims=require('../MLS R32 EDITORIAL/evidence claims.js');

function sqliteEnv(){
  const db=new DatabaseSync(':memory:');
  db.exec("CREATE TABLE wiki_articles(code TEXT PRIMARY KEY,language TEXT,language_name TEXT,title TEXT,level TEXT,part TEXT,chapter TEXT,article_markdown TEXT NOT NULL,prompt_version TEXT,generated_at TEXT NOT NULL)");
  db.prepare("INSERT INTO wiki_articles VALUES(?,?,?,?,?,?,?,?,?,?)").run('MLS-V10-0020','espanol-guatemala','Español','Tema','A1','Parte','Capítulo','#### Regla\nContenido.','32.0','2026-09-21T10:00:00Z');
  const wrap=(sql,args=[])=>({sql,args,bind(...x){return wrap(sql,x)},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}},async run(){const r=db.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}}}});
  const WIKI_DB={prepare:wrap,async batch(stmts){db.exec('BEGIN');try{const out=stmts.map(q=>{const raw=q.__mlsEvidenceRawStatement||q;const r=db.prepare(raw.sql).run(...raw.args);return {meta:{changes:Number(r.changes)}}});db.exec('COMMIT');return out}catch(e){db.exec('ROLLBACK');throw e}}};
  return {db,env:{WIKI_DB}};
}

test('telemetry: exact Cloudflare row metadata is preserved separately from observations',async()=>{
  const statement=(kind,args=[])=>({
    bind(...x){return statement(kind,x)},
    async all(){return {results:[{x:1},{x:2}],meta:{rows_read:7,rows_written:0,changes:0}}},
    async run(){return {meta:{rows_read:1,rows_written:3,changes:2}}}
  });
  const db={prepare(sql){return statement(sql)},async batch(){return []}};
  const meter=telemetry.createD1Meter(),wrapped=meter.wrap(db);
  await wrapped.prepare('SELECT').all();
  await wrapped.prepare('UPDATE').run();
  const m=meter.snapshot();
  assert.equal(m.exactRowsRead,true);
  assert.equal(m.exactRowsWritten,true);
  assert.equal(m.d1RowsRead,8);
  assert.equal(m.d1RowsWritten,3);
  assert.equal(m.observedRowsRead,2);
  assert.equal(m.observedRowsWritten,2);
});

test('telemetry: missing D1 meta never masquerades as exact billed rows',async()=>{
  const s=sqliteEnv();
  const meter=telemetry.createD1Meter(),db=meter.wrap(s.env.WIKI_DB);
  await db.prepare('SELECT code FROM wiki_articles').all();
  const m=meter.snapshot();
  assert.equal(m.exactRowsRead,false);
  assert.equal(m.d1RowsRead,null);
  assert.equal(m.observedRowsRead,1);
  assert.ok(m.missingReadMetaOperations>=1);
});

test('telemetry: metered wrapper shares Evidence schema readiness with original D1 binding',async()=>{
  const s=sqliteEnv();
  await registry.ensureEvidenceDb(s.env);
  const meter=telemetry.createD1Meter();
  const measured={...s.env,WIKI_DB:meter.wrap(s.env.WIKI_DB)};
  await registry.ensureEvidenceDb(measured);
  assert.equal(meter.snapshot().batchCalls,0);
});

test('telemetry: logical Evidence bytes count entry-owned and referenced-source payloads',async()=>{
  const s=sqliteEnv();
  await registry.ensureEvidenceDb(s.env);
  const v=await claims.currentArticleVersion(s.env,'MLS-V10-0020');
  const src=(await registry.upsertSource(s.env,{sourceType:'report',authorityTier:'A',title:'Fuente',institution:'Institución',publicationYear:2025})).source;
  const cl=(await claims.upsertClaim(s.env,{...v,summary:'Claim',claimType:'general'})).claim;
  await claims.upsertEvidenceLink(s.env,{claimId:cl.claim_id,sourceId:src.sourceId,supportType:'supports'});
  const m=await telemetry.measureEntryLogicalBytes(s.env,'MLS-V10-0020');
  assert.equal(m.rowCounts.claims,1);
  assert.equal(m.rowCounts.links,1);
  assert.equal(m.rowCounts.sources,1);
  assert.ok(m.entryOwnedBytes>0);
  assert.ok(m.referencedSourceBytes>0);
  assert.equal(m.logicalEvidenceBytes,m.entryOwnedBytes+m.referencedSourceBytes);
});
