'use strict';
const fs=require('node:fs');
const files=[
  'MLS R32 EDITORIAL/evidence farm core.js',
  'MLS R32 EDITORIAL/evidence git.js',
  'scripts/R33 evidence farm scheduler.cjs',
  'scripts/R33 evidence farm worker.cjs',
  'scripts/R33 evidence git validate.cjs',
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
const pool=JSON.parse(fs.readFileSync('docs/evidence y provenance/15 Evidence Farm Correction Repeat Pool.json','utf8'));
if(pool.sourceOfTruth!=='github'||pool.editorialArchitecture!=='github-native'||pool.cloudflareEditorialAllowed!==false||pool.d1EditorialAllowed!==false)failures.push('pool architecture flags invalid');
if(failures.length){console.error(failures.join('\n'));process.exit(1);}
console.log(JSON.stringify({ok:true,editorial:'github-only',cloudflare:'deployment-only',d1Editorial:false,filesChecked:files.length},null,2));
