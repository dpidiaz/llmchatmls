'use strict';
const fs=require('node:fs');
const files=[
  'MLS R32 EDITORIAL/evidence farm core.js',
  'MLS R32 EDITORIAL/evidence git.js',
  'scripts/R33 evidence farm scheduler.cjs',
  'scripts/R33 evidence farm worker.cjs',
  'scripts/R33 evidence git validate.cjs',
  'scripts/R33 evidence indexes.cjs',
  'scripts/generar evidence runtime github.js',
  'scripts/habilitar evidence lector.js',
  'MLS R32 OVERLAY/reader.js',
  '.github/workflows/R33 Evidence Farm Scheduler.yml',
  '.github/workflows/R33 Evidence Farm Worker Events.yml',
  '.github/workflows/R33 GitHub Native Tests.yml'
];
const forbidden=[/WIKI_DB/,/workers\.dev/i,/wrangler/i,/mls chat bridge/i,/\/api\/wiki\/editorial\/evidence/i,/entradaEvidenceMLS|proponerEvidenceMLS|verificarEvidenceMLS|triageBatchEvidenceMLS/];
const failures=[];
for(const file of files){const src=fs.readFileSync(file,'utf8');for(const re of forbidden)if(re.test(src))failures.push(file+' matches '+re);}
const farmCore=require('../MLS R32 EDITORIAL/evidence farm core.js');
const pool=farmCore.loadPool('.');
if(pool.sourceOfTruth!=='github'||pool.editorialArchitecture!=='github-native'||pool.cloudflareEditorialAllowed!==false||pool.d1EditorialAllowed!==false)failures.push('active pool architecture flags invalid');
const gate=farmCore.loadPool('.','docs/evidence y provenance/20 R33 Gate 500 Pool.json');
if(gate.sourceOfTruth!=='github'||gate.editorialArchitecture!=='github-native'||gate.cloudflareEditorialAllowed!==false||gate.d1EditorialAllowed!==false||gate.dispatcherOnly!==true)failures.push('Gate 500 architecture flags invalid');
if(failures.length){console.error(failures.join('\n'));process.exit(1);}
console.log(JSON.stringify({ok:true,editorial:'github-only',cloudflare:'deployment-only',d1Editorial:false,filesChecked:files.length},null,2));
