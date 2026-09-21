const test=require('node:test');
const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const policies=require('../MLS R32 EDITORIAL/evidence policies.js');
const registry=require('../MLS R32 EDITORIAL/evidence registry.js');
const claims=require('../MLS R32 EDITORIAL/evidence claims.js');
const provenance=require('../MLS R32 EDITORIAL/evidence provenance.js');

const EXPECTED_LANGUAGES=['aleman','chino-taiwan','coreano','espanol-guatemala','frances','ingles','italiano','japones','portugues','ruso'].sort();

function setup(){
  const db=new DatabaseSync(':memory:');
  db.exec(`CREATE TABLE wiki_articles(
    code TEXT PRIMARY KEY,language TEXT,language_name TEXT,title TEXT,level TEXT,part TEXT,chapter TEXT,
    article_markdown TEXT NOT NULL,provider TEXT,model TEXT,audit_provider TEXT,audit_model TEXT,prompt_version TEXT,generated_at TEXT NOT NULL
  )`);
  db.prepare(`INSERT INTO wiki_articles(code,language,language_name,title,level,part,chapter,article_markdown,provider,model,audit_provider,audit_model,prompt_version,generated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run('MLS-V10-0020','espanol-guatemala','Español','Gerundio de leer','A1','Fundamentos','Verbos','#### Regla\nLeer forma leyendo.','workers-ai','gemma','chatgpt','gpt-5.6','32.0','2026-09-21T10:00:00Z');
  const wrap=(sql,args=[])=>({sql,args,bind(...x){return wrap(sql,x)},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}},async run(){const r=db.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}}}});
  const WIKI_DB={prepare:wrap,async batch(stmts){db.exec('BEGIN');try{const out=stmts.map(x=>{const r=db.prepare(x.sql).run(...x.args);return {meta:{changes:Number(r.changes)}}});db.exec('COMMIT');return out}catch(e){db.exec('ROLLBACK');throw e}}};
  return {db,env:{WIKI_DB}};
}

test('source policies: cover exactly the ten canonical MLS languages',()=>{
  assert.deepEqual(Object.keys(policies.SOURCE_POLICIES).sort(),EXPECTED_LANGUAGES);
});

test('source policies: no concrete source is preapproved before pilot verification',()=>{
  for(const policy of Object.values(policies.SOURCE_POLICIES)){
    assert.deepEqual(policy.approvedSourcePool,[]);
    assert.ok(policy.preferredAuthorityKinds.length>=3);
    assert.ok(policy.recommendedAcademicSourceKinds.length>=3);
    assert.ok(policy.disallowedEvidenceKinds.includes('ai_output'));
    assert.equal(policy.variation.doNotTreatAsConflictByDefault,true);
  }
});

test('source policies: regional targets are explicit for Guatemala Brazil and Taiwan',()=>{
  assert.match(policies.sourcePolicyForLanguage('espanol-guatemala').regionalScope,/Guatemala/);
  assert.match(policies.sourcePolicyForLanguage('portugues').regionalScope,/Brasil/);
  assert.match(policies.sourcePolicyForLanguage('chino-taiwan').regionalScope,/Taiwán/);
});

test('source policies: unknown nonempty language fails closed',()=>{
  assert.throws(()=>policies.sourcePolicyForLanguage('desconocido'),e=>e.code==='SOURCE_POLICY_NOT_FOUND'&&e.status===422);
});

test('claims: canonical article version carries source-policy language metadata',async()=>{
  const s=setup();await registry.ensureEvidenceDb(s.env);
  const v=await claims.currentArticleVersion(s.env,'MLS-V10-0020');
  assert.equal(v.language,'espanol-guatemala');
  assert.equal(v.languageName,'Español');
  assert.match(v.articleHash,/^[a-f0-9]{64}$/);
});

test('provenance: composes generation and R33 even when R32 provenance table does not yet exist',async()=>{
  const s=setup();await registry.ensureEvidenceDb(s.env);
  const p=await provenance.composeArticleProvenance(s.env,'MLS-V10-0020');
  assert.equal(p.system.repository,'dpidiaz/llmchatmls');
  assert.equal(p.generation.generatedWithAI,true);
  assert.equal(p.generation.promptVersion,'32.0');
  assert.equal(p.r32.provenance,null);
  assert.equal(p.r33.effectiveStatus,'UNSOURCED');
});

test('provenance: reuses existing wiki_article_provenance instead of duplicating it',async()=>{
  const s=setup();await registry.ensureEvidenceDb(s.env);
  s.db.exec(`CREATE TABLE wiki_article_provenance(
    code TEXT PRIMARY KEY,origin TEXT,standard TEXT,prompt_version TEXT,staging_run_id TEXT,snapshot_version TEXT,snapshot_commit TEXT,
    staged_at TEXT,integrated_at TEXT,source_audit_model TEXT,recorded_at TEXT
  )`);
  s.db.prepare(`INSERT INTO wiki_article_provenance(code,origin,standard,prompt_version,staging_run_id,snapshot_version,snapshot_commit,integrated_at)
    VALUES(?,?,?,?,?,?,?,?)`).run('MLS-V10-0020','github-staging','MLS R32','32.0','run-1','v1','abc123','2026-09-21T10:30:00Z');
  const p=await provenance.composeArticleProvenance(s.env,'MLS-V10-0020');
  assert.equal(p.r32.origin,'github-staging');
  assert.equal(p.r32.stagingRunId,'run-1');
  assert.equal(p.r32.snapshotCommit,'abc123');
  assert.equal(s.db.prepare("SELECT COUNT(*) n FROM sqlite_master WHERE type='table' AND name='wiki_article_provenance'").get().n,1);
});

test('provenance: article revisions are summarized without duplicating article markdown in output',async()=>{
  const s=setup();await registry.ensureEvidenceDb(s.env);
  s.db.prepare(`INSERT INTO wiki_article_revisions(revision_id,code,revision_number,article_markdown,article_hash,source_generated_at,change_reason,status,created_at)
    VALUES(?,?,?,?,?,?,?,?,?)`).run('rev1','MLS-V10-0020',1,'contenido completo','a'.repeat(64),'2026-09-21T10:00:00Z','baseline','baseline','2026-09-21T10:00:00Z');
  const p=await provenance.composeArticleProvenance(s.env,'MLS-V10-0020');
  assert.equal(p.r33.revisions.length,1);
  assert.equal(Object.hasOwn(p.r33.revisions[0],'article_markdown'),false);
});
