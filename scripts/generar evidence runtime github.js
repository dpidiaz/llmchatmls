'use strict';

const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const store=require('../MLS R32 EDITORIAL/evidence git.js');
const apa=require('../MLS R32 EDITORIAL/evidence apa.js');

const DEFAULT_OUTPUT=path.resolve('public/data/evidence');

const COPY={
  UNSOURCED:{label:'Fundamentación pendiente',disclosure:'Esta entrada todavía no ha completado fundamentación bibliográfica.'},
  SOURCED:{label:'Fuentes identificadas',disclosure:'Esta entrada tiene fuentes identificadas, pero la verificación bibliográfica todavía no está completa.'},
  VERIFIED:{label:'Verificado con fuentes',disclosure:'Esta entrada fue contrastada con fuentes para su snapshot de Evidence vigente.'},
  REVIEWED:{label:'Verificado y revisado',disclosure:'Esta entrada fue verificada con fuentes y recibió una revisión editorial posterior.'}
};

function stableJson(value){return JSON.stringify(value,null,2)+'\n';}
function sha256(value){return crypto.createHash('sha256').update(String(value),'utf8').digest('hex');}
function writeJson(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,stableJson(value),'utf8');}

async function publicEvidence(root,entry,artifactPath){
  const status=String(entry.status||'UNSOURCED').toUpperCase();
  const copy=COPY[status]||COPY.UNSOURCED;
  const sourceIds=[...new Set((entry.links||[]).map(link=>link.sourceId).filter(Boolean))];
  const references=[];
  for(const sourceId of sourceIds){
    const source=await store.loadSource(root,sourceId);
    const citation=apa.renderApaReference(source);
    references.push({
      sourceId,
      authorityTier:source.authorityTier||null,
      text:citation.text,
      markdown:citation.markdown,
      url:citation.url||null
    });
  }
  references.sort((a,b)=>a.text.localeCompare(b.text,'es'));
  const unresolved=(entry.conflicts||[]).some(x=>x.status==='unresolved');
  return {
    schemaVersion:'1.0',
    sourceOfTruth:'github',
    deploymentArtifact:true,
    code:entry.code,
    status,
    label:copy.label,
    disclosure:copy.disclosure,
    needsReview:unresolved,
    hasProposedRevision:false,
    verifiedAt:entry.verification?.verifiedAt||null,
    reviewedAt:entry.review?.reviewedAt||null,
    evidenceRevision:Number(entry.evidenceRevision||0),
    references,
    provenance:{
      evidenceArtifactPath:artifactPath,
      deploymentSourceCommit:process.env.GITHUB_SHA||null
    }
  };
}

async function buildEvidenceRuntime(options={}){
  const root=path.resolve(options.root||'.');
  const outputRoot=path.resolve(options.outputRoot||DEFAULT_OUTPUT);
  const validation=await store.validateStore(root);
  if(!validation.ok)throw new Error('Evidence Git store inválido: '+validation.errors.join('; '));
  fs.rmSync(outputRoot,{recursive:true,force:true});
  fs.mkdirSync(path.join(outputRoot,'by-code'),{recursive:true});
  const entryRoot=store.repoPath('MLS R32 EDITORIAL','evidence git','entries');
  const entryPaths=store.listJson(root,entryRoot);
  const index={};
  const digests=[];
  for(const artifactPath of entryPaths){
    const entry=store.readJson(root,artifactPath);
    const payload=await publicEvidence(root,entry,artifactPath);
    const raw=stableJson(payload);
    const rel='by-code/'+entry.code+'.json';
    fs.writeFileSync(path.join(outputRoot,rel),raw,'utf8');
    const digest=sha256(raw);
    index[entry.code]={path:rel,status:entry.status,evidenceRevision:entry.evidenceRevision,sha256:digest};
    digests.push(entry.code+':'+digest);
  }
  const buildId=sha256(digests.sort().join('\n'));
  const manifest={
    schemaVersion:'1.0',
    sourceOfTruth:'github',
    generatedFrom:'MLS R32 EDITORIAL/evidence git/',
    cloudflareRole:'deployment-serving-only',
    totalEntries:entryPaths.length,
    verified:validation.verified,
    reviewed:validation.reviewed,
    sources:validation.sources,
    buildId,
    sourceCommit:process.env.GITHUB_SHA||null,
    entries:index
  };
  writeJson(path.join(outputRoot,'manifest.json'),manifest);
  const health={ok:true,sourceOfTruth:'github',totalEntries:entryPaths.length,sources:validation.sources,verified:validation.verified,reviewed:validation.reviewed,buildId,cloudflareEditorialInteractions:0,d1Reads:0,d1Writes:0};
  writeJson(path.join(outputRoot,'health.json'),health);
  process.stdout.write(JSON.stringify(health,null,2)+'\n');
  return health;
}

module.exports={DEFAULT_OUTPUT,COPY,publicEvidence,buildEvidenceRuntime};
if(require.main===module)buildEvidenceRuntime().catch(error=>{console.error('ERROR GitHub Evidence runtime:',error.message);process.exitCode=1;});
