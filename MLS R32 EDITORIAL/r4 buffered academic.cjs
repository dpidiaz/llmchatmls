'use strict';
// R4.1-only structural academic gate: complements R33; does not prove semantic source support.
const SUPPORT=new Set(['supports','primary_source','secondary_interpretation']);
const OMIT=new Set(['ejemplos','examples','entradas relacionadas','related entries','fuentes y fundamento',
'bibliografía','bibliography','referencias','references','fuentes','sources','ejercicios','exercises']);
function norm(s){return String(s||'').normalize('NFKC').trim().toLocaleLowerCase('es').replace(/\s+/g,' ');}
function sections(markdown){
 return [...new Set([...String(markdown||'').matchAll(/^#{2,6}\s+(.+?)\s*$/gm)]
 .map(m=>m[1].replace(/\s*#+\s*$/,'').trim()).filter(x=>x&&!OMIT.has(norm(x))))];
}
function locatorProvided(loc){
 if(!loc||typeof loc!=='object'||Array.isArray(loc))return false;
 // Canonical source URL alone is never a passage locator.
 return ['section','paragraph','chapter','page','pages','passageId','locator']
 .some(k=>(typeof loc[k]==='string'&&loc[k].trim().length>0)||
 (k==='page'&&Number.isSafeInteger(loc[k])&&loc[k]>0));
}
function inspect(entry,article){
 const errors=[],requiredSections=sections(article?.articleMarkdown);
 if(!entry||!article||entry.code!==article.code){
  return {ok:false,code:entry?.code||null,errors:['ACADEMIC_CANONICAL_ARTICLE_MISMATCH'],requiredSections};
 }
 const substantive=(entry.claims||[]).filter(c=>(c.materiality||'substantial')==='substantial');
 const mapped=new Set(substantive.map(c=>norm(c.sectionKey)).filter(Boolean));
 if(!substantive.length)errors.push('ACADEMIC_NO_SUBSTANTIAL_CLAIMS');
 for(const title of requiredSections)if(!mapped.has(norm(title)))errors.push('ACADEMIC_SECTION_UNMAPPED:'+title);
 for(const c of substantive){
  const links=(entry.links||[]).filter(l=>l.claimId===c.claimId&&SUPPORT.has(l.supportType));
  if(!links.length)errors.push('ACADEMIC_CLAIM_UNLINKED:'+c.claimId);
  else if(!links.some(l=>locatorProvided(l.locator)))errors.push('ACADEMIC_EXACT_LOCATOR_MISSING:'+c.claimId);
 }
 return {ok:errors.length===0,code:entry.code,errors,requiredSections,coveredSections:[...mapped],
  automatedScope:'declared-claim-coverage-and-pointer-shape-only',
  independentSourceMeaningCheck:'REQUIRED_SEPARATELY'};
}
module.exports={sections,locatorProvided,inspect};
