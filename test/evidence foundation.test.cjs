const test=require('node:test');
const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const evidence=require('../MLS R32 EDITORIAL/evidence foundation.js');

function db(){
  const x=new DatabaseSync(':memory:');
  x.exec("CREATE TABLE wiki_articles (code TEXT PRIMARY KEY, article_markdown TEXT NOT NULL, generated_at TEXT NOT NULL)");
  return x;
}
function apply(x){for(const sql of evidence.evidenceSchema())x.exec(sql);}

test('evidence foundation: schema is additive and idempotent',()=>{
  const x=db(),before=x.prepare('PRAGMA table_info(wiki_articles)').all().map(v=>v.name);
  apply(x);apply(x);
  assert.deepEqual(x.prepare('PRAGMA table_info(wiki_articles)').all().map(v=>v.name),before);
  for(const table of ['wiki_sources','wiki_evidence_entry_state','wiki_evidence_claims','wiki_evidence_links','wiki_evidence_conflicts','wiki_evidence_reviews','wiki_article_revisions'])
    assert.equal(x.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name=?").get(table).n,1);
});

test('evidence foundation: source identity deduplicates DOI ISBN and canonical URL',async()=>{
  const a=await evidence.normalizeSourceMetadata({sourceType:'journal_article',authorityTier:'B',title:'A',doi:'https://doi.org/10.1000/XYZ.123'});
  const b=await evidence.normalizeSourceMetadata({sourceType:'journal_article',authorityTier:'B',title:'B',doi:'doi:10.1000/xyz.123'});
  assert.equal(a.sourceId,b.sourceId);assert.equal(a.identityKey,'10.1000/xyz.123');
  const c=await evidence.normalizeSourceMetadata({sourceType:'book',authorityTier:'B',title:'Book',isbn:'978-0-306-40615-7'});
  const d=await evidence.normalizeSourceMetadata({sourceType:'book',authorityTier:'B',title:'Book 2',isbn:'9780306406157'});
  assert.equal(c.sourceId,d.sourceId);
  const e=await evidence.normalizeSourceMetadata({sourceType:'institutional_webpage',authorityTier:'A',title:'Guide',url:'https://Example.org/path/?utm_source=x&a=1'});
  const f=await evidence.normalizeSourceMetadata({sourceType:'institutional_webpage',authorityTier:'A',title:'Guide 2',url:'https://example.org/path?a=1'});
  assert.equal(e.sourceId,f.sourceId);
});

test('evidence foundation: invalid DOI and ISBN fail closed',async()=>{
  await assert.rejects(()=>evidence.normalizeSourceMetadata({sourceType:'book',authorityTier:'B',title:'Bad',doi:'not-a-doi'}),/DOI inválido/);
  await assert.rejects(()=>evidence.normalizeSourceMetadata({sourceType:'book',authorityTier:'B',title:'Bad',isbn:'9780000000000'}),/ISBN inválido/);
});

test('evidence foundation: article hash is stable across line endings',async()=>{
  assert.equal(await evidence.articleHash('A  \r\nB\r\n'),await evidence.articleHash('A\nB'));
  assert.notEqual(await evidence.articleHash('A\nB'),await evidence.articleHash('A\nC'));
});

test('evidence foundation: stale state becomes UNSOURCED',()=>{
  const article={code:'MLS-V10-0020',articleGeneratedAt:'2026-09-21T00:00:00Z',articleHash:'abc'};
  assert.equal(evidence.effectiveEvidenceStatus({article,state:null}),'UNSOURCED');
  assert.equal(evidence.effectiveEvidenceStatus({article,state:{...article,status:'VERIFIED'}}),'VERIFIED');
  assert.equal(evidence.effectiveEvidenceStatus({article,state:{...article,articleHash:'old',status:'VERIFIED'}}),'UNSOURCED');
});

test('evidence foundation: SOURCED is not VERIFIED',()=>{
  const claims=[{claimId:'c1',materiality:'substantial'}],sources=[{sourceId:'s1',authorityTier:'B',status:'active'}];
  assert.equal(evidence.deriveEvidenceStatus({claims,links:[{claimId:'c1',sourceId:'s1',supportType:'contextualizes'}],sources}).status,'SOURCED');
  const links=[{claimId:'c1',sourceId:'s1',supportType:'supports'}];
  assert.equal(evidence.deriveEvidenceStatus({claims,links,sources}).status,'SOURCED');
  assert.equal(evidence.deriveEvidenceStatus({claims,links,sources,verifiedAt:'2026-09-21T10:00:00Z'}).status,'VERIFIED');
});

test('evidence foundation: Tier X and unresolved contradiction block VERIFIED',()=>{
  const claims=[{claimId:'c1',materiality:'substantial'}];
  assert.equal(evidence.deriveEvidenceStatus({claims,links:[{claimId:'c1',sourceId:'x',supportType:'supports'}],sources:[{sourceId:'x',authorityTier:'X',status:'active'}],verifiedAt:'2026-09-21T10:00:00Z'}).status,'UNSOURCED');
  const result=evidence.deriveEvidenceStatus({claims,links:[{claimId:'c1',sourceId:'s1',supportType:'supports'}],sources:[{sourceId:'s1',authorityTier:'A',status:'active'}],conflicts:[{claimId:'c1',conflictType:'contradiction',status:'unresolved'}],verifiedAt:'2026-09-21T10:00:00Z'});
  assert.equal(result.status,'SOURCED');assert.ok(result.reasons.includes('unresolved_substantive_conflict'));
});

test('evidence foundation: accepted regional variation does not block VERIFIED',()=>{
  const result=evidence.deriveEvidenceStatus({claims:[{claimId:'c1',materiality:'substantial'}],links:[{claimId:'c1',sourceId:'s1',supportType:'supports'}],sources:[{sourceId:'s1',authorityTier:'A',status:'active'}],conflicts:[{claimId:'c1',conflictType:'regional_variation',status:'accepted_variation'}],verifiedAt:'2026-09-21T10:00:00Z'});
  assert.equal(result.status,'VERIFIED');
});

test('evidence foundation: REVIEWED requires later review',()=>{
  const base={claims:[{claimId:'c1',materiality:'substantial'}],links:[{claimId:'c1',sourceId:'s1',supportType:'supports'}],sources:[{sourceId:'s1',authorityTier:'A',status:'active'}],verifiedAt:'2026-09-21T10:00:00Z'};
  assert.equal(evidence.deriveEvidenceStatus({...base,reviewedAt:'2026-09-21T09:00:00Z'}).status,'VERIFIED');
  assert.equal(evidence.deriveEvidenceStatus({...base,reviewedAt:'2026-09-21T11:00:00Z'}).status,'REVIEWED');
});

test('evidence foundation: optimistic concurrency uses 409-style conflict',()=>{
  assert.equal(evidence.assertExpectedEvidenceRevision(3,3),true);
  assert.throws(()=>evidence.assertExpectedEvidenceRevision(3,2),e=>e.code==='EVIDENCE_REVISION_CONFLICT'&&e.status===409);
});

test('evidence foundation: fingerprint fallback requires second bibliographic signal',async()=>{
  await assert.rejects(()=>evidence.normalizeSourceMetadata({sourceType:'book',authorityTier:'B',title:'Generic title'}),/identidad bibliográfica suficiente/);
  const a=await evidence.normalizeSourceMetadata({sourceType:'book',authorityTier:'B',title:'Generic title',authors:['Doe, Jane'],publicationYear:2024});
  const b=await evidence.normalizeSourceMetadata({sourceType:'book',authorityTier:'B',title:' Generic   title ',authors:['Doe, Jane'],publicationYear:2024});
  assert.equal(a.sourceId,b.sourceId);
});

test('evidence foundation: claim and link identities are deterministic',async()=>{
  const hash=await evidence.articleHash('Contenido canónico');
  const a=await evidence.claimIdentity({code:'MLS-V10-0020',articleHash:hash,sectionKey:'Regla',summary:'Leer forma leyendo.',claimType:'normative',materiality:'substantial'});
  const b=await evidence.claimIdentity({code:'mls-v10-0020',articleHash:hash,sectionKey:' Regla ',summary:'Leer   forma leyendo.',claimType:'normative',materiality:'substantial'});
  assert.equal(a,b);
  const s=await evidence.normalizeSourceMetadata({sourceType:'report',authorityTier:'A',title:'Norma',institution:'Institución',publicationYear:2025});
  const l1=await evidence.evidenceLinkIdentity({claimId:a,sourceId:s.sourceId,supportType:'supports',locator:{page:'10',section:'A'}});
  const l2=await evidence.evidenceLinkIdentity({claimId:a,sourceId:s.sourceId,supportType:'supports',locator:{section:'A',page:'10'}});
  assert.equal(l1,l2);
});
