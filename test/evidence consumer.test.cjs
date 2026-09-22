'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const foundation=require('../MLS R32 EDITORIAL/evidence foundation.js');
const registry=require('../MLS R32 EDITORIAL/evidence registry.js');
const consumer=require('../MLS R32 EDITORIAL/evidence consumer.js');

function setup(){
  const db=new DatabaseSync(':memory:');
  db.exec("CREATE TABLE wiki_articles(code TEXT PRIMARY KEY,generated_at TEXT NOT NULL,article_markdown TEXT NOT NULL)");
  db.prepare("INSERT INTO wiki_articles VALUES(?,?,?)").run('MLS-V10-0020','2026-09-21T10:00:00Z','#### Regla\nLeer forma leyendo.');
  db.prepare("INSERT INTO wiki_articles VALUES(?,?,?)").run('MLS-V05-0165','2026-09-21T11:00:00Z','#### Regel\nmit + Dativ.');
  const wrap=(sql,args=[])=>({sql,args,bind(...x){return wrap(sql,x)},async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}},async run(){const r=db.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}}}});
  const env={WIKI_DB:{prepare:wrap,async batch(stmts){db.exec('BEGIN');try{const out=stmts.map(x=>{const r=db.prepare(x.sql).run(...x.args);return {meta:{changes:Number(r.changes)}}});db.exec('COMMIT');return out;}catch(e){db.exec('ROLLBACK');throw e;}}}};
  return {db,env};
}
async function putState(s,code,status,{hash=null,reviewerType=null,reviewer='Revisor humano'}={}){
  await registry.ensureEvidenceDb(s.env);
  const row=s.db.prepare('SELECT generated_at,article_markdown FROM wiki_articles WHERE code=?').get(code);
  const articleHash=hash||await foundation.articleHash(row.article_markdown);
  s.db.prepare(`INSERT OR REPLACE INTO wiki_evidence_entry_state(code,article_generated_at,article_hash,evidence_version,status,claims_total,claims_verified,sources_total,conflicts_total,needs_review,evidence_revision,source_revision,citation_style,citation_edition,citation_profile,citation_renderer_version,verified_at,reviewed_at,updated_at)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(code,row.generated_at,articleHash,'1.0',status,3,status==='UNSOURCED'?0:3,status==='UNSOURCED'?0:2,0,0,2,1,'APA',7,'URL-GT-2025','1.0',status==='VERIFIED'||status==='REVIEWED'?'2026-09-21T12:00:00Z':null,status==='REVIEWED'?'2026-09-21T13:00:00Z':null,'2026-09-21T13:00:00Z');
  if(status==='REVIEWED'&&reviewerType){
    s.db.prepare(`INSERT INTO wiki_evidence_reviews(review_id,code,article_generated_at,article_hash,evidence_version,evidence_revision,source_revision,review_kind,evidence_snapshot_hash,status_before,status_after,claims_total,claims_verified,sources_total,conflicts_total,reviewer_type,reviewer,verification_method,citation_renderer_version,parent_review_id,article_revision_id,notes,run_id,created_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run('REV-'+code.replace(/[^A-Z0-9]/g,''),code,row.generated_at,articleHash,'1.0',1,1,'editorial_review','a'.repeat(64),'VERIFIED','REVIEWED',3,3,2,0,reviewerType,reviewer,'editorial_review','1.0',null,null,null,'test','2026-09-21T13:00:00Z');
  }
}

test('Evidence consumer: no current state is UNSOURCED and cannot claim verification',async()=>{
  const s=setup();
  const c=await consumer.contextForEntry(s.env,'MLS-V10-0020');
  assert.equal(c.evidenceStatus,'UNSOURCED');
  assert.equal(c.canSayVerified,false);
  assert.match(consumer.professorGuidance(c),/no afirmes que está comprobada/i);
});

test('Evidence consumer: SOURCED never becomes verified merely because sources exist',async()=>{
  const s=setup();await putState(s,'MLS-V10-0020','SOURCED');
  const c=await consumer.contextForEntry(s.env,'MLS-V10-0020');
  assert.equal(c.evidenceStatus,'SOURCED');
  assert.equal(c.canSayVerified,false);
  assert.match(c.prompt,/NO está VERIFIED/);
});

test('Evidence consumer: VERIFIED permits sourced verification but not human review',async()=>{
  const s=setup();await putState(s,'MLS-V10-0020','VERIFIED');
  const c=await consumer.contextForEntry(s.env,'MLS-V10-0020');
  assert.equal(c.evidenceStatus,'VERIFIED');
  assert.equal(c.canSayVerified,true);
  assert.equal(c.canSayHumanReviewed,false);
  assert.equal(consumer.virtuosoLabel(c).label,'Verificada con fuentes');
});

test('Evidence consumer: REVIEWED without human reviewer is conservatively exposed as VERIFIED',async()=>{
  const s=setup();await putState(s,'MLS-V10-0020','REVIEWED',{reviewerType:'chatgpt',reviewer:'ChatGPT'});
  const c=await consumer.contextForEntry(s.env,'MLS-V10-0020');
  assert.equal(c.rawEvidenceStatus,'REVIEWED');
  assert.equal(c.evidenceStatus,'VERIFIED');
  assert.equal(c.humanReviewed,false);
  assert.match(c.caution,/no tiene una revisión humana vigente demostrable/i);
});

test('Evidence consumer: REVIEWED with human reviewer is explicitly human reviewed',async()=>{
  const s=setup();await putState(s,'MLS-V10-0020','REVIEWED',{reviewerType:'human'});
  const c=await consumer.contextForEntry(s.env,'MLS-V10-0020');
  assert.equal(c.evidenceStatus,'REVIEWED');
  assert.equal(c.humanReviewed,true);
  assert.equal(c.canSayHumanReviewed,true);
  assert.equal(consumer.virtuosoLabel(c).label,'Verificada y revisada');
});

test('Evidence consumer: stale article version downgrades to UNSOURCED',async()=>{
  const s=setup();await putState(s,'MLS-V10-0020','VERIFIED',{hash:'0'.repeat(64)});
  const c=await consumer.contextForEntry(s.env,'MLS-V10-0020');
  assert.equal(c.stateCurrent,false);
  assert.equal(c.evidenceStatus,'UNSOURCED');
  assert.equal(c.canSayVerified,false);
});

test('Evidence consumer: batch lookup returns independent conservative states',async()=>{
  const s=setup();await putState(s,'MLS-V10-0020','VERIFIED');await putState(s,'MLS-V05-0165','SOURCED');
  const c=await consumer.contextsForEntries(s.env,['MLS-V10-0020','MLS-V05-0165','bad']);
  assert.equal(Object.keys(c).length,2);
  assert.equal(c['MLS-V10-0020'].evidenceStatus,'VERIFIED');
  assert.equal(c['MLS-V05-0165'].evidenceStatus,'SOURCED');
});
