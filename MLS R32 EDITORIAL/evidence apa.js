'use strict';
const foundation=require('./evidence foundation.js');
const SUPPORTED=new Set(['book','book_chapter','journal_article','institutional_webpage','report','reference_entry']);
const ITALIC_TITLE_TYPES=new Set(['book','institutional_webpage','report']);
const MONTHS_ES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const MONTHS_EN=['January','February','March','April','May','June','July','August','September','October','November','December'];
function clean(v){return String(v??'').normalize('NFKC').replace(/\s+/gu,' ').trim();}
function initials(given){return clean(given).split(/\s+/u).filter(Boolean).map(part=>part.split('-').filter(Boolean).map(x=>(x.match(/\p{L}/u)?.[0]||'').toUpperCase()+'.').join('-')).filter(Boolean).join(' ');}
function parsePerson(v){const s=clean(v);const i=s.indexOf(',');if(i<0)return {organization:s};return {family:clean(s.slice(0,i)),given:clean(s.slice(i+1))};}
function referencePerson(v){const p=parsePerson(v);if(p.organization)return p.organization;return p.family+(p.given?', '+initials(p.given):'');}
function editorPerson(v){const p=parsePerson(v);if(p.organization)return p.organization;return (p.given?initials(p.given)+' ':'')+p.family;}
function inTextPerson(v){const p=parsePerson(v);return p.organization||p.family;}
function joinReferenceAuthors(authors=[]){const a=authors.map(referencePerson).filter(Boolean);if(!a.length)return '';if(a.length===1)return a[0];if(a.length<=20)return a.slice(0,-1).join(', ')+', & '+a.at(-1);return a.slice(0,19).join(', ')+', … '+a.at(-1);}
function joinEditors(editors=[]){const a=editors.map(editorPerson).filter(Boolean);if(!a.length)return '';if(a.length===1)return a[0]+' (Ed.)';return a.slice(0,-1).join(', ')+', & '+a.at(-1)+' (Eds.)';}
function authorIdentity(source){if(Array.isArray(source.authors)&&source.authors.length)return {kind:'authors',value:joinReferenceAuthors(source.authors),names:source.authors};if(clean(source.institution))return {kind:'institution',value:clean(source.institution),names:[clean(source.institution)]};return {kind:'title',value:'',names:[]};}
function yearText(source,locale='es-GT'){const y=Number(source.publicationYear);return Number.isInteger(y)&&y>0?String(y):(locale.startsWith('es')?'s. f.':'n.d.');}
function referenceDate(source,locale='es-GT'){
  const raw=clean(source.publicationDate);if(!raw)return '('+yearText(source,locale)+').';
  const m=raw.match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/);if(!m)return '('+yearText(source,locale)+').';
  const y=m[1],month=m[2]?Number(m[2]):null,day=m[3]?Number(m[3]):null;if(!month)return '('+y+').';
  const months=locale.startsWith('es')?MONTHS_ES:MONTHS_EN;const name=months[month-1];if(!name)return '('+y+').';
  if(locale.startsWith('es'))return day?'('+y+', '+day+' de '+name+').':'('+y+', '+name+').';
  return day?'('+y+', '+name+' '+day+').':'('+y+', '+name+').';
}
function doiOrUrl(source){if(source.doi&&source.doiScope!=='container')return 'https://doi.org/'+String(source.doi).replace(/^https?:\/\/(?:dx\.)?doi\.org\//i,'');return clean(source.canonicalUrl)||'';}
function same(a,b){return clean(a).toLocaleLowerCase('es')===clean(b).toLocaleLowerCase('es');}
function validateApaSource(source={}){
  const errors=[],warnings=[];const t=source.sourceType;
  if(!SUPPORTED.has(t))errors.push('unsupported_source_type');
  if(!clean(source.title))errors.push('title_required');
  if(source.status&&source.status!=='active')warnings.push('source_not_active');
  if(t==='book'&&!clean(source.publisher))errors.push('publisher_required');
  if(t==='book_chapter'){
    if(!clean(source.containerTitle))errors.push('container_title_required');
    if(!clean(source.publisher))errors.push('publisher_required');
    if(!(Array.isArray(source.editors)&&source.editors.length))errors.push('editors_required');
    if(!clean(source.pages))errors.push('chapter_pages_required');
  }
  if(t==='journal_article'){
    if(!clean(source.journal))errors.push('journal_required');
    if(!clean(source.pages)&&!clean(source.articleNumber))errors.push('pages_or_article_number_required');
  }
  if(t==='institutional_webpage'){
    if(!(clean(source.institution)||(Array.isArray(source.authors)&&source.authors.length)))errors.push('web_author_or_institution_required');
    if(!clean(source.canonicalUrl))errors.push('canonical_url_required');
  }
  if(t==='report'&&!clean(source.publisher)&&!clean(source.institution))errors.push('report_publisher_or_institution_required');
  if(t==='reference_entry'){
    if(!clean(source.containerTitle))errors.push('container_title_required');
    if(!clean(source.publisher)&&!clean(source.canonicalUrl))errors.push('reference_container_source_required');
  }
  const normalizedDoi=source.doi?foundation.normalizeDoi(source.doi):null;
  if(source.doi&&!normalizedDoi)errors.push('invalid_doi');
  const doiScope=clean(source.doiScope).toLowerCase();
  if(doiScope&&!source.doi)errors.push('doi_scope_requires_doi');
  if(doiScope&&!['resource','container'].includes(doiScope))errors.push('invalid_doi_scope');
  if(normalizedDoi&&doiScope==='container'&&!clean(source.canonicalUrl))errors.push('container_doi_requires_canonical_url');
  if(source.canonicalUrl&&!foundation.normalizeUrl(source.canonicalUrl))errors.push('invalid_url');
  return {valid:errors.length===0,citationReady:errors.length===0&&(!source.status||source.status==='active'),errors,warnings,style:foundation.MLS_CITATION_STYLE,edition:foundation.MLS_CITATION_EDITION,profile:foundation.MLS_CITATION_PROFILE,rendererVersion:foundation.MLS_CITATION_RENDERER_VERSION};
}
function titleStart(source,italic=false){return italic?'*'+clean(source.title)+'*':clean(source.title);}
function lead(source,date,italicTitle=false){const a=authorIdentity(source);if(a.kind==='title')return titleStart(source,italicTitle)+' '+date;return a.value.replace(/\.+$/u,'')+'. '+date+' '+titleStart(source,italicTitle);}
function appendLocator(base,url){return url?base.replace(/[.\s]+$/u,'')+'. '+url:base.replace(/\s+/gu,' ').trim();}
function renderApaReference(source,{locale='es-GT'}={}){
  const v=validateApaSource(source);if(!v.valid){const e=new Error('APA_METADATA_INVALID: '+v.errors.join(','));e.code='APA_METADATA_INVALID';e.status=422;e.errors=v.errors;throw e;}
  const date=referenceDate(source,locale),url=doiOrUrl(source);let body='';
  if(source.sourceType==='book'){
    body=lead(source,date,true);if(clean(source.edition))body+=' ('+clean(source.edition)+').';else body+='.';
    if(clean(source.publisher)&&!(clean(source.institution)&&same(source.publisher,source.institution)))body+=' '+clean(source.publisher)+'.';
  } else if(source.sourceType==='book_chapter'){
    body=lead(source,date,false)+'. In '+joinEditors(source.editors)+', *'+clean(source.containerTitle)+'*';
    const inside=[clean(source.edition),clean(source.pages)?'pp. '+clean(source.pages):''].filter(Boolean).join(', ');if(inside)body+=' ('+inside+')';body+='. '+clean(source.publisher)+'.';
  } else if(source.sourceType==='journal_article'){
    body=lead(source,date,false)+'. *'+clean(source.journal)+(clean(source.volume)?', '+clean(source.volume):'')+'*';if(clean(source.issue))body+='('+clean(source.issue)+')';
    const p=clean(source.pages)||clean(source.articleNumber);if(p)body+=', '+p;body+='.';
  } else if(source.sourceType==='institutional_webpage'){
    body=lead(source,date,true)+'.';const site=clean(source.publisher);const author=authorIdentity(source).value;if(site&&(!author||!same(site,author)))body+=' '+site+'.';
  } else if(source.sourceType==='report'){
    body=lead(source,date,true)+'.';const publisher=clean(source.publisher);const author=authorIdentity(source).value;if(publisher&&(!author||!same(publisher,author)))body+=' '+publisher+'.';
  } else if(source.sourceType==='reference_entry'){
    body=lead(source,date,false)+'. In ';if(Array.isArray(source.editors)&&source.editors.length)body+=joinEditors(source.editors)+', ';body+='*'+clean(source.containerTitle)+'*';
    const inside=[clean(source.edition),clean(source.pages)?'pp. '+clean(source.pages):''].filter(Boolean).join(', ');if(inside)body+=' ('+inside+')';if(clean(source.publisher))body+='. '+clean(source.publisher);body+='.';
  }
  const markdown=appendLocator(body,url);return {...v,markdown,text:markdown.replace(/\*/g,''),url:url||null};
}
function shortTitle(source){const t=clean(source.title);return t.length<=40?t:t.slice(0,37).trim()+'…';}
function inTextAuthor(source,{narrative=false,locale='es-GT'}={}){
  const a=authorIdentity(source);if(a.kind==='institution')return a.value;if(a.kind==='title'){const t=shortTitle(source);return ITALIC_TITLE_TYPES.has(source.sourceType)?'*'+t+'*':'“'+t+'”';}
  const names=a.names.map(inTextPerson).filter(Boolean);if(names.length===1)return names[0];if(names.length===2)return names[0]+(narrative?(locale.startsWith('es')?' y ':' and '):' & ')+names[1];return names[0]+' et al.';
}
function renderInTextCitation(source,{narrative=false,locale='es-GT'}={}){const a=inTextAuthor(source,{narrative,locale}),y=yearText(source,locale);return narrative?a+' ('+y+')':'('+a+', '+y+')';}
module.exports={SUPPORTED,validateApaSource,referencePerson,editorPerson,joinReferenceAuthors,joinEditors,referenceDate,doiOrUrl,renderApaReference,renderInTextCitation};
