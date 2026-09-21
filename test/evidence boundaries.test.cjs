const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const foundation=require('../MLS R32 EDITORIAL/evidence foundation.js');
const pkg=require('../package.json');

const evidenceFiles=[
  'evidence foundation.js','evidence policies.js','evidence registry.js','evidence claims.js',
  'evidence apa.js','evidence reviews.js','evidence validator.js','evidence provenance.js','evidence api.js'
].map(x=>path.join('MLS R32 EDITORIAL',x));
const evidenceText=evidenceFiles.map(file=>fs.readFileSync(file,'utf8')).join('\n');

test('Evidence boundary: canonical repository identity is explicit and enforced',()=>{
  assert.deepEqual(foundation.MLS_EVIDENCE_CONTEXT,{system:'MLS',repository:'dpidiaz/llmchatmls',domain:'language'});
  assert.equal(foundation.assertRepositoryContext({system:'MLS',repository:'dpidiaz/llmchatmls',domain:'language'}),true);
  assert.throws(()=>foundation.assertRepositoryContext({system:'MLS',repository:'otro/repo',domain:'language'}),e=>e.code==='REPO_CONTEXT_MISMATCH'&&e.status===409);
  assert.equal(pkg.repository.url,'https://github.com/dpidiaz/llmchatmls.git');
  assert.deepEqual(pkg.mlsContext,{system:'MLS',domain:'language'});
});

test('Evidence boundary: style references never become evidence sources',()=>{
  assert.equal(/referenceCodes|styleReferences/.test(evidenceText),false);
  const chat=fs.readFileSync('MLS R32 EDITORIAL/chat workflow.js','utf8');
  assert.match(chat,/referenceCodes/);
});

test('Evidence boundary: Foundation has no paid provider or OpenAI API dependency',()=>{
  assert.equal(/api\.openai\.com|OPENAI_API_KEY|anthropic|paid[_ -]?api/i.test(evidenceText),false);
  const api=fs.readFileSync('MLS R32 EDITORIAL/evidence api.js','utf8');
  assert.equal(/\bfetch\s*\(/.test(api),false);
});

test('Evidence boundary: no GitHub runtime database or arbitrary repository writes',()=>{
  assert.equal(/api\.github\.com|github\.com\/repos|git\/refs|force\s*:\s*true/i.test(evidenceText),false);
});

test('Evidence boundary: no canonical wiki_articles overwrite exists in Evidence modules',()=>{
  assert.equal(/UPDATE\s+wiki_articles|INSERT\s+(?:OR\s+\w+\s+)?INTO\s+wiki_articles|DELETE\s+FROM\s+wiki_articles/i.test(evidenceText),false);
});

test('Evidence boundary: no image assets exercises or quizzes are introduced by Evidence modules',()=>{
  assert.equal(/\.png|\.jpe?g|\.webp|\.gif|\.svg|\bquiz\b|\bflashcard\b|\bworkbook\b|\bexercise(?:s)?\b/i.test(evidenceText),false);
});

test('Evidence boundary: AUTOOPT and GitHub Staging remain independent of Evidence',()=>{
  const autoopt=fs.readFileSync('MLS R32 EDITORIAL/autoopt.js','utf8');
  const staging=fs.readFileSync('MLS R32 EDITORIAL/staging.js','utf8');
  assert.equal(/evidence foundation|evidence api|wiki_evidence_/i.test(autoopt),false);
  assert.equal(/evidence foundation|evidence api|wiki_evidence_/i.test(staging),false);
});

test('Evidence boundary: private runtime exposes only the editorial Evidence namespace',()=>{
  const installer=fs.readFileSync('scripts/habilitar chat editorial.js','utf8');
  assert.match(installer,/\/api\/wiki\/editorial\/evidence\//);
  assert.equal(installer.includes('/api/wiki/evidence/'),false);
  assert.match(installer,/assertRepositoryContext/);
});
