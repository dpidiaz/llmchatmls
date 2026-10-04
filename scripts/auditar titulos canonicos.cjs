'use strict';
const fs=require('node:fs');
const path=require('node:path');

// Reject headings that require chapter context to identify the article's subject.
// This is a structural check, not a semantic certification of every title.
const GENERIC=/^(?:(?:tipos|clases|formas|funciones|usos|propiedades|estructura|formación|distribución|descripción|generalidades|introducción|resumen|definición|concepto|caracterización|características|aspectos|factores|valores|restricciones|condiciones)(?:\s+(?:generales|sintácticos|morfológicos|fonológicos|temporales|semánticos|pragmáticos|de uso))?(?:\s+y\s+(?:tipos|clases|formas|usos))?|sus\s+\w+|forma de significar|en pocas palabras|cómo funciona|ejemplos|observación importante|entradas relacionadas|definition|definitions|description|introduction|overview|examples|how it works|definição|definizione|définition|einführung|определение|정의|定義|概要)$/iu;

function titleIssues(value){
  const title=String(value??'').normalize('NFC').trim();
  const issues=[];
  if(!title)issues.push('empty');
  if(GENERIC.test(title))issues.push('generic_heading');
  if(/^(?:todo|tbd|untitled|sin título|sin titulo|pendiente|placeholder|null|undefined)$/iu.test(title))issues.push('placeholder');
  if(/(?:^#{1,6}\s|<\/?[a-z][^>]*>|\]\(#entry|^MLS-V\d{2}-\d{4}$)/iu.test(title))issues.push('markup_or_identifier');
  return issues;
}

function auditTitles(manifest){
  const byLanguage={},issues=[];
  for(const item of manifest.entries||[]){
    byLanguage[item.language]=(byLanguage[item.language]||0)+1;
    const found=titleIssues(item.title);
    if(found.length)issues.push({code:item.code,title:item.title,issues:found});
  }
  return {ok:issues.length===0,totalEntries:(manifest.entries||[]).length,byLanguage,issues,scope:'Structural title quality; semantic title/content accuracy requires editorial review.'};
}
if(require.main===module){
  const root=path.resolve(process.env.MLS_CANONICAL_ROOT||'content');
  const result=auditTitles(JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8')));
  console.log(JSON.stringify(result,null,2));
  if(!result.ok)process.exitCode=1;
}
module.exports={titleIssues,auditTitles};
