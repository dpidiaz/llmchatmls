'use strict';

const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');

const reader=fs.readFileSync('MLS R32 OVERLAY/reader.js','utf8');

test('También mira keeps editorial results first and caps the list at five',()=>{
  assert.match(reader,/function relatedFromMarkdown\(markdown,catalog\)/);
  assert.match(reader,/return related\\.slice\\(0,12\\);/);
  assert.match(reader,/const editorial=relatedFromMarkdown\\(markdown,catalog\\)\\.slice\\(0,limit\\);/);
  assert.match(reader,/if\(editorial\.length>=limit\)return editorial;/);
  assert.match(reader,/const combined=\[\.\.\.editorial\];/);
  assert.match(reader,/if\(combined\.length>=limit\)break;/);
  assert.match(reader,/await relatedForEntry\(markdown,catalog,manifest,language,normalized,5\)/);
});

test('También mira validates related build, version, language and canonical catalog membership',()=>{
  assert.match(reader,/\/data\/related\/manifest\.json/);
  assert.match(reader,/relatedManifest\?\.corpusBuildId!==manifest\.corpusBuildId/);
  assert.match(reader,/payload\?\.corpusBuildId!==manifest\.corpusBuildId/);
  assert.match(reader,/payload\?\.language!==language/);
  assert.match(reader,/const byCode=new Map\(catalog\.entries\.map\(item=>\[item\.code,item\]\)\);/);
  assert.match(reader,/const item=byCode\.get\(code\);\s*if\(!item\)continue;/);
});

test('También mira deduplicates editorial and semantic candidates and excludes current entry',()=>{
  assert.match(reader,/const seen=new Set\(\[currentCode,\.\.\.editorial\.map\(item=>item\.code\)\]\);/);
  assert.match(reader,/if\(seen\.has\(code\)\)continue;/);
  assert.match(reader,/seen\.add\(code\);\s*combined\.push\(item\);/);
});

test('semantic related assets are optional and never become a reader dependency',()=>{
  assert.match(reader,/catch\(error\)\{\s*console\.warn\('MLS related supplemental fallback',language,error\);\s*return editorial;/);
  assert.doesNotMatch(reader,/relatedForEntry[\s\S]{0,2500}env\.AI\.run/);
  assert.doesNotMatch(reader,/relatedForEntry[\s\S]{0,2500}\/api\/wiki\//);
  assert.match(reader,/No hay temas relacionados disponibles\./);
});
