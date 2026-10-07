'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const apa=require('../MLS R32 EDITORIAL/evidence apa.js');
const {createRuntime,hash}=require('../scripts/r44 canonical assets.cjs');
const root=path.resolve(__dirname,'..');

test('canonical asset context recognizes registered Taiwan MOE URLs for MLS-V07-0048',()=>{
  const sourceDir=path.join(root,'MLS R32 EDITORIAL/evidence git/registry/sources');
  const catalog=fs.readdirSync(sourceDir).filter(name=>name.endsWith('.json'))
    .map(name=>JSON.parse(fs.readFileSync(path.join(sourceDir,name),'utf8')))
    .filter(source=>source&&source.metadata&&apa.validateApaSource(source.metadata).citationReady);
  const entry=JSON.parse(fs.readFileSync(path.join(root,'content/manifest.json'),'utf8')).entries
    .find(item=>item.code==='MLS-V07-0048');
  const article=JSON.parse(fs.readFileSync(path.join(root,'content',entry.path),'utf8'));
  const handoffIndex=JSON.parse(fs.readFileSync(path.join(root,'MLS R32 EDITORIAL/r44/r33-handoff/index.json'),'utf8'));
  const handoff=handoffIndex.entries.find(item=>item.code===entry.code);
  const ticket=JSON.parse(fs.readFileSync(path.join(root,handoff.handoffPath),'utf8'));
  const handoffEntry=ticket.entries.find(item=>item.code===entry.code);

  const runtime=createRuntime(catalog,root);
  const input={article,handoffEntry};
  const candidates=runtime.unifiedR33SourceCandidates(
    runtime.unifiedR33ReconcileArticle(article,handoffEntry),handoffEntry,{autoAuditableOnly:true}
  );
  const moe=candidates.find(candidate=>candidate.sourceId==='MLS-SRC-1D3BF739315BDF277811');
  assert.equal(moe.fetchUrl,'https://dict.revised.moe.edu.tw/dictView.jsp?ID=10496&la=0&powerMode=0');

  const previousRuntime=vm.createContext({MLS_R33_SOURCE_CATALOG:catalog});
  vm.runInContext(fs.readFileSync(path.join(root,'scripts/unified runner r33 runtime.js'),'utf8'),previousRuntime);
  const previousContext=previousRuntime.unifiedR33CanonicalContext(input);
  const currentContext=runtime.unifiedR33CanonicalContext(input);
  assert.notEqual(hash(currentContext),hash(previousContext));
});
