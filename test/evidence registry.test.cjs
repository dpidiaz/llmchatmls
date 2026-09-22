const test=require('node:test');
const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const registry=require('../MLS R32 EDITORIAL/evidence registry.js');

function setup(){
  const db=new DatabaseSync(':memory:');
  const ops={reads:0,writes:0,batches:0};
  const wrap=(sql,args=[])=>({sql,args,bind(...x){return wrap(sql,x)},async first(){ops.reads++;return db.prepare(sql).get(...args)||null},async all(){ops.reads++;return {results:db.prepare(sql).all(...args)}},async run(){ops.writes++;const r=db.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}}}});
  const WIKI_DB={prepare:wrap,async batch(stmts){ops.batches++;db.exec('BEGIN');try{const out=stmts.map(x=>{const r=db.prepare(x.sql).run(...x.args);return {meta:{changes:Number(r.changes)}}});db.exec('COMMIT');return out;}catch(e){db.exec('ROLLBACK');throw e;}}};
  return {db,ops,env:{WIKI_DB}};
}
const book={sourceType:'book',authorityTier:'B',title:'Gramática de prueba',authors:['Doe, Jane'],publicationYear:2025,isbn:'978-0-306-40615-7'};

test('source registry: create and read normalized source',async()=>{
  const s=setup();const r=await registry.upsertSource(s.env,book,{now:'2026-09-21T12:00:00Z'});
  assert.equal(r.created,true);assert.equal(r.source.isbn,'9780306406157');assert.equal(r.source.authorityTier,'B');
  assert.deepEqual((await registry.getSourceById(s.env,r.source.sourceId)).authors,['Doe, Jane']);
});

test('source registry: identical upsert is idempotent and reuses row',async()=>{
  const s=setup();const a=await registry.upsertSource(s.env,book,{now:'2026-09-21T12:00:00Z'});const writes=s.ops.writes;
  const b=await registry.upsertSource(s.env,{...book,isbn:'9780306406157'},{now:'2026-09-21T12:01:00Z'});
  assert.equal(b.source.sourceId,a.source.sourceId);assert.equal(b.reused,true);assert.equal(b.updated,false);assert.equal(s.ops.writes,writes);
  assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM wiki_sources').get().n,1);
});

test('source registry: enrichment fills missing metadata without new source',async()=>{
  const s=setup();const base={sourceType:'report',authorityTier:'A',title:'Guía institucional',institution:'Institución X',publicationYear:2025,url:'https://example.org/guide'};
  const a=await registry.upsertSource(s.env,base,{now:'2026-09-21T12:00:00Z'});
  const b=await registry.upsertSource(s.env,{...base,publisher:'Editorial X',language:'es'},{now:'2026-09-21T12:01:00Z'});
  assert.equal(b.source.sourceId,a.source.sourceId);assert.equal(b.updated,true);assert.equal(b.source.publisher,'Editorial X');assert.equal(b.source.language,'es');
});

test('source registry: conflicting strong metadata fails closed and preserves row',async()=>{
  const s=setup();const a=await registry.upsertSource(s.env,book,{now:'2026-09-21T12:00:00Z'});
  await assert.rejects(()=>registry.upsertSource(s.env,{...book,publicationYear:2024},{now:'2026-09-21T12:01:00Z'}),e=>e.code==='SOURCE_METADATA_CONFLICT'&&e.status===409&&e.fields.includes('publicationYear'));
  assert.equal((await registry.getSourceById(s.env,a.source.sourceId)).publicationYear,2025);
});

test('source registry: stable URL with explicit resource version creates distinct source version',async()=>{
  const s=setup();const base={sourceType:'institutional_webpage',authorityTier:'A',title:'Norma viva',institution:'Institución',url:'https://example.org/norma'};
  const a=await registry.upsertSource(s.env,{...base,resourceVersion:'2025'},{now:'2026-09-21T12:00:00Z'});
  const b=await registry.upsertSource(s.env,{...base,resourceVersion:'2026'},{now:'2026-09-21T12:01:00Z'});
  assert.notEqual(a.source.sourceId,b.source.sourceId);assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM wiki_sources').get().n,2);
});

test('source registry: superseded source cannot be silently reactivated',async()=>{
  const s=setup();const src={sourceType:'report',authorityTier:'A',title:'Informe',institution:'Inst',publicationYear:2025,url:'https://example.org/report',status:'superseded'};
  await registry.upsertSource(s.env,src,{now:'2026-09-21T12:00:00Z'});
  await assert.rejects(()=>registry.upsertSource(s.env,{...src,status:'active'},{now:'2026-09-21T12:01:00Z'}),e=>e.code==='SOURCE_SUPERSEDED'&&e.status===409);
});

test('source registry: status aggregates tiers and states',async()=>{
  const s=setup();await registry.upsertSource(s.env,book);await registry.upsertSource(s.env,{sourceType:'report',authorityTier:'A',title:'Informe',institution:'Inst',publicationYear:2025});
  const status=await registry.sourceRegistryStatus(s.env);assert.equal(status.total,2);assert.equal(status.byTier.A,1);assert.equal(status.byTier.B,1);assert.equal(status.byStatus.active,2);
});

test('source registry: upsert touches no claim or article state rows',async()=>{
  const s=setup();await registry.upsertSource(s.env,book);
  assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM wiki_evidence_claims').get().n,0);
  assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM wiki_evidence_entry_state').get().n,0);
  assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM wiki_evidence_links').get().n,0);
});

test('source registry: two granular resources may share one container DOI without collision',async()=>{
  const s=setup();
  const common={sourceType:'institutional_webpage',authorityTier:'A',institution:'IDS',doi:'10.14618/wb-praepositionen',doiScope:'container'};
  const a=await registry.upsertSource(s.env,{...common,title:'mit',canonicalUrl:'https://grammis.ids-mannheim.de/praepositionen/299660'});
  const b=await registry.upsertSource(s.env,{...common,title:'laut',canonicalUrl:'https://grammis.ids-mannheim.de/praepositionen/299306'});
  assert.notEqual(a.source.sourceId,b.source.sourceId);
  assert.equal(a.source.identityKind,'url');
  assert.equal(b.source.identityKind,'url');
  assert.equal(a.source.doiScope,'container');
  assert.equal(b.source.doiScope,'container');
  assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM wiki_sources').get().n,2);
});

test('source registry: legacy wiki_sources migrates DOI scope idempotently',async()=>{
  const s=setup();
  s.db.exec(`CREATE TABLE wiki_sources (
    source_id TEXT PRIMARY KEY, identity_kind TEXT NOT NULL, identity_key TEXT NOT NULL, metadata_hash TEXT NOT NULL,
    source_type TEXT NOT NULL, authority_tier TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active',
    title TEXT NOT NULL, authors_json TEXT NOT NULL DEFAULT '[]', editors_json TEXT NOT NULL DEFAULT '[]', contributors_json TEXT NOT NULL DEFAULT '[]',
    institution TEXT, publication_year INTEGER, publication_date TEXT, publisher TEXT, edition TEXT, container_title TEXT,
    journal TEXT, volume TEXT, issue TEXT, pages TEXT, article_number TEXT, isbn TEXT, issn TEXT, doi TEXT, canonical_url TEXT,
    language TEXT, topics_json TEXT NOT NULL DEFAULT '[]', resource_version TEXT, supersedes_source_id TEXT, accessed_at TEXT,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(identity_kind, identity_key)
  )`);
  s.db.prepare(`INSERT INTO wiki_sources(source_id,identity_kind,identity_key,metadata_hash,source_type,authority_tier,status,title,doi,authors_json,editors_json,contributors_json,topics_json,created_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run('MLS-SRC-LEGACY','doi','10.1000/legacy','legacy-hash','journal_article','B','active','Legacy DOI','10.1000/legacy','[]','[]','[]','[]','2026-09-21T00:00:00Z','2026-09-21T00:00:00Z');
  await registry.ensureEvidenceDb(s.env);
  const columns=s.db.prepare('PRAGMA table_info(wiki_sources)').all().map(x=>x.name);
  assert.ok(columns.includes('doi_scope'));
  assert.equal(s.db.prepare('SELECT doi_scope FROM wiki_sources WHERE source_id=?').get('MLS-SRC-LEGACY').doi_scope,'resource');
  const src=await registry.getSourceById(s.env,'MLS-SRC-LEGACY');
  assert.equal(src.doiScope,'resource');
  await registry.ensureEvidenceDb(s.env);
  assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM wiki_sources WHERE source_id=?').get('MLS-SRC-LEGACY').n,1);
});
