'use strict';

const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {validateCanonicalCorpus}=require('./validar corpus canonico.js');
const {validateSemanticSource}=require('./publicar indice semantico.js');

const ROOT=path.resolve(__dirname,'..');
const EXPECTED_ENTRIES=10133;
const EXPECTED_LANGUAGES=10;
const EXPECTED_CHUNKS=10669;
const EXPECTED_SEMANTIC_MODEL='@cf/baai/bge-m3';

function fail(message){throw new Error(message)}
function read(file){return fs.readFileSync(path.join(ROOT,file),'utf8')}
function json(file){return JSON.parse(read(file))}
function exists(file){return fs.existsSync(path.join(ROOT,file))}
function assertIncludes(value,needle,label){if(!String(value).includes(needle))fail(label+' no contiene '+needle)}
function assertExcludes(value,needle,label){if(String(value).includes(needle))fail(label+' contiene valor prohibido '+needle)}

function listBundle(){
  const archive=path.join(ROOT,'MASTER LANGUAGE SYSTEM REVISION 32 BUNDLE.tar.gz');
  if(!fs.existsSync(archive))fail('Falta bundle shell R32.');
  const r=spawnSync('tar',['-tzf',archive],{encoding:'utf8'});
  if(r.status!==0)fail('No se pudo listar bundle: '+String(r.stderr||r.stdout).trim());
  return r.stdout.split('\n').map(x=>x.replace(/^\.\//,'')).filter(Boolean);
}

function verifySources(){
  const canonical=validateCanonicalCorpus();
  if(canonical.totalEntries!==EXPECTED_ENTRIES)fail('Corpus canónico incompleto.');

  const semantic=validateSemanticSource();
  if(!semantic.complete)fail('Índice semántico fuente incompleto: '+semantic.reason);
  if(semantic.totalEntries!==EXPECTED_ENTRIES)fail('Índice semántico no cubre 10,133 entradas.');
  if(semantic.totalChunks!==EXPECTED_CHUNKS)fail('Conteo de chunks semánticos inesperado.');
  if(semantic.manifest.model!==EXPECTED_SEMANTIC_MODEL)fail('Modelo semántico inesperado.');
  if(Object.keys(semantic.manifest.languages||{}).length!==EXPECTED_LANGUAGES)fail('Índice semántico no contiene diez idiomas.');

  const pkg=json('package.json');
  const predeploy=String(pkg.scripts?.predeploy||'');
  const requiredBuildSteps=[
    "rm -rf public/data public/mls-staging-targets src",
    "cp 'MLS R32 OVERLAY/index.js' src/index.js",
    "node 'scripts/habilitar busqueda full text.js'",
    "node 'scripts/habilitar busqueda semantica.js'",
    "node 'scripts/habilitar virtuoso.js'",
    "node 'scripts/generar runtime canonico.js'",
    "node 'scripts/generar datos canonicos compatibles.js'",
    "node 'scripts/generar indice full text.js'",
    "node 'scripts/publicar indice semantico.js'"
  ];
  for(const step of requiredBuildSteps)assertIncludes(predeploy,step,'predeploy');

  const reader=read('MLS R32 OVERLAY/reader.js');
  assertIncludes(reader,'/data/canonical/runtime-manifest.json','reader');
  assertExcludes(reader,'/api/wiki/article/','reader');
  assertExcludes(reader,'/api/wiki/materialize/','reader');
  assertExcludes(reader,'cloudflare-legacy','reader');

  const semanticPatch=read('scripts/habilitar busqueda semantica.js');
  assertIncludes(semanticPatch,'MLS SEMANTIC HYBRID SEARCH 1.0','búsqueda semántica');
  assertIncludes(semanticPatch,'semantic query fallback','búsqueda semántica');
  assertIncludes(semanticPatch,"const slugs=lang?[lang]:MLS_META.map(m=>m.slug)",'búsqueda semántica');

  const virtuoso=read('scripts/habilitar virtuoso.js');
  assertIncludes(virtuoso,'VIRTUOSO_MODEL_ID','Virtuoso');
  assertIncludes(virtuoso,'@cf/google/gemma-4-26b-a4b-it','Virtuoso');
  assertIncludes(virtuoso,'enable_thinking: false','Virtuoso');
  assertIncludes(virtuoso,'virtuosoFallback','Virtuoso');
  assertIncludes(virtuoso,'/data/canonical/catalog/','Virtuoso');

  const bundle=listBundle();
  const forbidden=[
    /^public\/data(?:\/|$)/,
    /^src(?:\/|$)/,
    /wiki-seeds/i,
    /cloudflare-legacy/i
  ];
  for(const entry of bundle){
    for(const pattern of forbidden)if(pattern.test(entry))fail('Bundle contiene legacy/backend prohibido: '+entry);
  }
  for(const required of ['public/index.html','public/js/core.js','public/js/app.js','public/js/search.js']){
    if(!bundle.includes(required))fail('Bundle shell perdió '+required);
  }

  return {
    canonicalEntries:canonical.totalEntries,
    canonicalLanguages:Object.keys(canonical.byLanguage||{}).length,
    semanticEntries:semantic.totalEntries,
    semanticChunks:semantic.totalChunks,
    semanticLanguages:Object.keys(semantic.manifest.languages||{}).length,
    semanticModel:semantic.manifest.model,
    bundleEntries:bundle.length
  };
}

function verifyBuildArtifacts(){
  const checks=[];

  if(exists('public/data/canonical/runtime-health.json')){
    const h=json('public/data/canonical/runtime-health.json');
    if(h.ok!==true||Number(h.totalEntries)!==EXPECTED_ENTRIES)fail('runtime-health canónico inválido.');
    checks.push('canonical-runtime');
  }

  if(exists('public/data/canonical/compat-health.json')){
    const h=json('public/data/canonical/compat-health.json');
    if(h.ok!==true||Number(h.totalEntries)!==EXPECTED_ENTRIES||h.legacyWikiSeedsPresent!==false)fail('compat-health inválido.');
    checks.push('canonical-compat');
  }

  if(exists('public/data/search/manifest.json')){
    const h=json('public/data/search/manifest.json');
    if(h.standard!=='MLS R32'||h.promptVersion!=='32.0'||Number(h.totalEntries)!==EXPECTED_ENTRIES||Object.keys(h.languages||{}).length!==EXPECTED_LANGUAGES)fail('manifest full-text inválido.');
    checks.push('full-text');
  }

  if(exists('public/data/semantic/publish-health.json')){
    const h=json('public/data/semantic/publish-health.json');
    if(h.ok!==true||h.model!==EXPECTED_SEMANTIC_MODEL||Number(h.totalEntries)!==EXPECTED_ENTRIES||Number(h.totalChunks)!==EXPECTED_CHUNKS)fail('publish-health semántico inválido.');
    checks.push('semantic');
  }

  if(exists('public/virtuoso.html')){
    const h=read('public/virtuoso.html');
    assertIncludes(h,'/api/virtuoso','Virtuoso build');
    assertIncludes(h,'/api/search/embedding','Virtuoso build');
    assertIncludes(h,'/data/semantic/manifest.json','Virtuoso build');
    checks.push('virtuoso');
  }

  if(exists('src/index.js')){
    const worker=read('src/index.js');
    assertIncludes(worker,'VIRTUOSO_MODEL_ID','Worker build');
    assertIncludes(worker,'enable_thinking: false','Worker build');
    assertIncludes(worker,'/api/search/embedding','Worker build');
    assertIncludes(worker,'/api/virtuoso','Worker build');
    checks.push('worker');
  }

  return checks;
}

function verifyRecovery(){
  const sources=verifySources();
  const buildArtifacts=verifyBuildArtifacts();
  const result={
    ok:true,
    standard:'MLS R32',
    sourceOfTruth:'GitHub content/',
    publishedReadsRequireD1:false,
    semanticRuntimeRequiresVectorDatabase:false,
    aiFailureHasLexicalFallback:true,
    virtuosoFailureHasCanonicalFallback:true,
    sources,
    buildArtifacts
  };
  process.stdout.write('RECOVERY_OK '+JSON.stringify(result)+'\n');
  return result;
}

module.exports={verifySources,verifyBuildArtifacts,verifyRecovery};

if(require.main===module){
  try{verifyRecovery()}
  catch(error){console.error('RECOVERY_FAILED',error.message);process.exitCode=1}
}
