'use strict';
const fs = require('fs');
const path = require('path');
function augmentEditorialOpenApi(text) {
  const api = JSON.parse(text);
  api.info.version = '33.0.0';
  api.info.description += ' MLS R33 Evidence & Provenance se añade de forma aditiva y privada.';
  api.paths['/api/wiki/editorial/chat/semantic/status']={get:{operationId:'estadoAuditoriaSemanticaMLS',summary:'Consultar cobertura y hallazgos agregados de la auditoría semántica por muestra.','x-openai-isConsequential':false,responses:{'200':{description:'Estado diagnóstico de la muestra.'},'401':{description:'Clave ausente o incorrecta.'}}}};
  api.paths['/api/wiki/editorial/chat/semantic/sample']={post:{operationId:'muestraAuditoriaSemanticaMLS',summary:'Seleccionar una muestra balanceada de artículos publicados aún no auditados.','x-openai-isConsequential':false,requestBody:{required:true,content:{'application/json':{schema:{type:'object',properties:{count:{type:'integer',minimum:1,maximum:10},language:{type:'string'}},additionalProperties:false}}}},responses:{'200':{description:'Muestra privada para revisión semántica.'},'401':{description:'Clave ausente o incorrecta.'}}}};
  api.paths['/api/wiki/editorial/chat/semantic/record']={post:{operationId:'registrarAuditoriaSemanticaMLS',summary:'Registrar el resultado diagnóstico de una revisión semántica sin modificar el artículo.','x-openai-isConsequential':true,requestBody:{required:true,content:{'application/json':{schema:{type:'object',properties:{code:{type:'string'},generatedAt:{type:'string'},verdict:{type:'string',enum:['ok','watch','review_required']},categories:{type:'array',items:{type:'string',enum:['accuracy','terminology','examples','ambiguity','variety','factual','other']}},confidence:{type:'string',enum:['low','medium','high']},notes:{type:'string',minLength:20,maxLength:3000},reviewer:{type:'string',enum:['chatgpt','human']}},required:['code','generatedAt','verdict','categories','confidence','notes','reviewer'],additionalProperties:false}}}},responses:{'200':{description:'Resultado semántico registrado para la versión exacta del artículo.'},'401':{description:'Clave ausente o incorrecta.'},'409':{description:'El artículo cambió desde la muestra.'},'422':{description:'Resultado de auditoría no válido.'}}}};
  api.paths['/api/wiki/editorial/chat/coverage/status']={get:{operationId:'estadoCoberturaEditorialMLS',summary:'Consultar el mapa de cobertura editorial de solo lectura.','x-openai-isConsequential':false,responses:{'200':{description:'Avance exacto por idioma y evidencia observada por nivel, parte, capítulo y familia.'},'401':{description:'Clave ausente o incorrecta.'}}}};

  const codeParam={name:'code',in:'query',required:true,schema:{type:'string',pattern:'^MLS-V[0-9]{2}-[0-9]{4}$'}};
  const responses={'200':{description:'Operación Evidence completada.'},'400':{description:'Solicitud inválida.'},'401':{description:'Clave ausente o incorrecta.'},'404':{description:'Entrada o recurso no encontrado.'},'409':{description:'Conflicto de versión, snapshot o revisión.'},'422':{description:'Evidence o metadata no válida.'}};
  api.paths['/api/wiki/editorial/evidence/status']={get:{operationId:'estadoEvidenceMLS',summary:'Consultar estado agregado de Evidence & Provenance.','x-openai-isConsequential':false,responses}};
  api.paths['/api/wiki/editorial/evidence/entry']={get:{operationId:'evidenceEntradaMLS',summary:'Obtener artículo canónico, versión exacta, estado Evidence y reviews.','x-openai-isConsequential':false,parameters:[codeParam],responses}};
  api.paths['/api/wiki/editorial/evidence/sources']={get:{operationId:'fuentesEntradaMLS',summary:'Listar Sources vinculadas a una entrada y su referencia APA cuando sea válida.','x-openai-isConsequential':false,parameters:[codeParam],responses}};
  api.paths['/api/wiki/editorial/evidence/provenance']={get:{operationId:'provenanceEntradaMLS',summary:'Obtener provenance compuesto R32 + R33 para la versión canónica vigente.','x-openai-isConsequential':false,parameters:[codeParam],responses}};
  api.paths['/api/wiki/editorial/evidence/metrics']={get:{operationId:'metricasEvidenceEntradaMLS',summary:'Medir bytes lógicos Evidence y telemetría D1 para una entrada sin modificarla.','x-openai-isConsequential':false,parameters:[codeParam],responses}};
  api.paths['/api/wiki/editorial/evidence/validate']={post:{operationId:'validarEvidenceMLS',summary:'Validar cobertura Evidence y APA sin promover estado.','x-openai-isConsequential':false,requestBody:{required:true,content:{'application/json':{schema:{type:'object',properties:{code:{type:'string'}},required:['code'],additionalProperties:false}}}},responses}};
  api.paths['/api/wiki/editorial/evidence/proposal']={post:{operationId:'proponerEvidenceMLS',summary:'Persistir una propuesta idempotente para la versión exacta del artículo.','x-openai-isConsequential':true,requestBody:{required:true,content:{'application/json':{schema:{type:'object',properties:{code:{type:'string'},articleGeneratedAt:{type:'string'},articleHash:{type:'string'},expectedEvidenceRevision:{type:'integer',minimum:0},sources:{type:'array',maxItems:30,items:{type:'object'}},claims:{type:'array',maxItems:50,items:{type:'object'}},links:{type:'array',maxItems:100,items:{type:'object'}},conflicts:{type:'array',maxItems:30,items:{type:'object'}}},required:['code','articleGeneratedAt','articleHash','expectedEvidenceRevision','sources','claims','links'],additionalProperties:false}}}},responses}};
  api.paths['/api/wiki/editorial/evidence/verify']={post:{operationId:'verificarEvidenceMLS',summary:'Crear un verification review ligado al snapshot actual y promover a VERIFIED solo si el backend lo permite.','x-openai-isConsequential':true,requestBody:{required:true,content:{'application/json':{schema:{type:'object',properties:{code:{type:'string'},expectedEvidenceRevision:{type:'integer',minimum:0},reviewerType:{type:'string',enum:['chatgpt','human','system']},reviewer:{type:'string'},verificationMethod:{type:'string'},notes:{type:'string'},runId:{type:'string'}},required:['code','expectedEvidenceRevision'],additionalProperties:false}}}},responses}};
  api.paths['/api/wiki/editorial/evidence/review']={post:{operationId:'revisarEvidenceMLS',summary:'Registrar una revisión editorial posterior sobre un snapshot VERIFIED vigente.','x-openai-isConsequential':true,requestBody:{required:true,content:{'application/json':{schema:{type:'object',properties:{code:{type:'string'},expectedEvidenceRevision:{type:'integer',minimum:0},reviewerType:{type:'string',enum:['chatgpt','human','system']},reviewer:{type:'string'},verificationMethod:{type:'string'},notes:{type:'string'},runId:{type:'string'}},required:['code','expectedEvidenceRevision'],additionalProperties:false}}}},responses}};
  api.paths['/api/wiki/editorial/evidence/revision/propose']={post:{operationId:'proponerRevisionEvidenceMLS',summary:'Guardar una revisión de artículo propuesta sin sobrescribir wiki_articles.','x-openai-isConsequential':true,requestBody:{required:true,content:{'application/json':{schema:{type:'object',properties:{code:{type:'string'},expectedArticleHash:{type:'string'},articleMarkdown:{type:'string'},changeReason:{type:'string'},evidenceReviewId:{type:'string'}},required:['code','expectedArticleHash','articleMarkdown','changeReason'],additionalProperties:false}}}},responses}};
  return JSON.stringify(api);
}
function buildChatRuntime(root = process.cwd()) {
  const read = file => fs.readFileSync(path.join(root, file), 'utf8');
  const packageMeta=JSON.parse(read('package.json'));
  const repositoryUrl=String(packageMeta.repository?.url||'').replace(/\.git$/,'');
  const repositoryName=repositoryUrl.replace(/^https:\/\/github\.com\//,'');
  const evidenceFoundation=require(path.join(root,'MLS R32 EDITORIAL/evidence foundation.js'));
  evidenceFoundation.assertRepositoryContext({
    system:packageMeta.mlsContext?.system,
    repository:repositoryName,
    domain:packageMeta.mlsContext?.domain
  });
  const evidenceNames={
    'MLS R32 EDITORIAL/evidence foundation.js':'MLS_EVIDENCE_FOUNDATION',
    'MLS R32 EDITORIAL/evidence policies.js':'MLS_EVIDENCE_POLICIES',
    'MLS R32 EDITORIAL/evidence registry.js':'MLS_EVIDENCE_REGISTRY',
    'MLS R32 EDITORIAL/evidence claims.js':'MLS_EVIDENCE_CLAIMS',
    'MLS R32 EDITORIAL/evidence apa.js':'MLS_EVIDENCE_APA',
    'MLS R32 EDITORIAL/evidence reviews.js':'MLS_EVIDENCE_REVIEWS',
    'MLS R32 EDITORIAL/evidence validator.js':'MLS_EVIDENCE_VALIDATOR',
    'MLS R32 EDITORIAL/evidence provenance.js':'MLS_EVIDENCE_PROVENANCE',
    'MLS R32 EDITORIAL/evidence telemetry.js':'MLS_EVIDENCE_TELEMETRY',
    'MLS R32 EDITORIAL/evidence api.js':'MLS_EVIDENCE_API'
  };
  const evidenceDeps={
    './evidence foundation.js':'MLS_EVIDENCE_FOUNDATION',
    './evidence policies.js':'MLS_EVIDENCE_POLICIES',
    './evidence registry.js':'MLS_EVIDENCE_REGISTRY',
    './evidence claims.js':'MLS_EVIDENCE_CLAIMS',
    './evidence apa.js':'MLS_EVIDENCE_APA',
    './evidence reviews.js':'MLS_EVIDENCE_REVIEWS',
    './evidence validator.js':'MLS_EVIDENCE_VALIDATOR',
    './evidence provenance.js':'MLS_EVIDENCE_PROVENANCE',
    './evidence telemetry.js':'MLS_EVIDENCE_TELEMETRY',
    './evidence api.js':'MLS_EVIDENCE_API'
  };
  const bundleEvidence=file=>{
    let source=read(file).replace(/^['"]use strict['"];?\s*/,'');
    source=source.replace(/const\s+(\w+)\s*=\s*require\(['"]([^'"]+)['"]\);/g,(all,name,id)=>{
      const dep=evidenceDeps[id]; if(!dep) throw Error('Dependencia Evidence no permitida: '+id);
      return 'const '+name+'='+dep+';';
    });
    if(/\brequire\s*\(/.test(source)) throw Error('Evidence runtime conserva require(): '+file);
    return 'var '+evidenceNames[file]+'=(()=>{const module={exports:{}};'+source+'\nreturn module.exports;})();\n';
  };
  const evidenceRuntime=Object.keys(evidenceNames).map(bundleEvidence).join('');
  const contract = require(path.join(root, 'MLS R32 EDITORIAL/contrato editorial.js'));
  if (contract.promptVersion !== '32.0') throw Error('Actualizar integración de ChatGPT para la nueva versión editorial.');
  if (!/WIKI_PROMPT_VERSION\s*=\s*["']32\.0["']/.test(read(contract.canonicalRuntime))) throw Error('El runtime canónico ya no es R32 / 32.0.');
  const importer = read('scripts/importar lotes editoriales.js');
  const names = ['fail', 'countWords', 'countFourthLevelHeadings', 'validateCalibration', 'validateArticle'];
  const functions = names.map(name => {
    const begin = importer.indexOf('function ' + name + '(');
    const end = importer.indexOf('\nfunction ', begin + 1);
    if (begin < 0 || end < 0) throw Error('No se encontró el validador original ' + name);
    return importer.slice(begin, end);
  }).join('\n');
  const languages = importer.slice(importer.indexOf('const LANGUAGES ='), importer.indexOf('\nfunction fail('));
  if (!languages.startsWith('const LANGUAGES =')) throw Error('Falta el mapa original de idiomas.');
  return `\nvar MLS_CHAT_CONTRACT = ${JSON.stringify(contract)};\n` +
    `var MLS_CHAT_VALIDATORS = (() => { const contract = MLS_CHAT_CONTRACT; ${languages}\n${functions}\nreturn {validateCalibration, validateArticle}; })();\n` +
    `var MLS_CHAT_OPENAPI = ${augmentEditorialOpenApi(read('MLS R32 EDITORIAL/chat openapi.json'))};\n` +
    `var MLS_CHAT_INSTRUCTIONS = ${JSON.stringify(read('MLS R32 EDITORIAL/GPT privado instrucciones.md'))};\n` +
    evidenceRuntime +
    read('MLS R32 EDITORIAL/autoopt.js').replace(/^if \(typeof module .*$/gm, '') + '\n' +
    read('MLS R32 EDITORIAL/autoopt history.js').replace(/^if \(typeof module .*$/gm, '') + '\n' +
    read('MLS R32 EDITORIAL/autoopt health.js').replace(/^if \(typeof module .*$/gm, '') + '\n' +
    read('MLS R32 EDITORIAL/chat workflow.js') + '\n' +
    read('MLS R32 EDITORIAL/staging.js') + '\n' +
    read('MLS R32 EDITORIAL/deferred rescue.js').replace(/^if \(typeof module .*$/gm, '') + '\n' +
    read('MLS R32 EDITORIAL/semantic audit.js').replace(/^if \(typeof module .*$/gm, '') + '\n' +
    read('MLS R32 EDITORIAL/coverage map.js').replace(/^if \(typeof module .*$/gm, '');
}
function patchAutooptPanel(html) {
  const deferredSection = `<section class="card"><h2>Deferred inteligente</h2><p class="note">Diagnóstico determinista de incidencias pendientes. AUTOOPT recomienda; no rescata, publica ni cambia FIFO automáticamente.</p><div id="deferredGeneral" class="grid"></div><div class="tablewrap"><table><thead><tr><th>Categoría</th><th>Cantidad</th></tr></thead><tbody id="deferredCategories"></tbody></table></div><div class="tablewrap"><table><thead><tr><th>Idioma</th><th>Familia</th><th>Cantidad</th></tr></thead><tbody id="deferredFamilies"></tbody></table></div></section>`;
  const semanticSection = `<section class="card"><h2>Auditoría semántica por muestra</h2><p class="note">Revisión diagnóstica de artículos publicados. Una muestra correcta no certifica todo el corpus y esta vista nunca modifica artículos.</p><div id="semanticGeneral" class="grid"></div><p id="semanticAlert" class="note"></p><div class="tablewrap"><table><thead><tr><th>Idioma</th><th>Familia</th><th>Auditados</th></tr></thead><tbody id="semanticFamilies"></tbody></table></div><div class="tablewrap"><table><thead><tr><th>Hallazgo</th><th>Cantidad</th></tr></thead><tbody id="semanticCategories"></tbody></table></div></section>`;
  const coverageSection = `<section class="card"><h2>Mapa de cobertura editorial</h2><p class="note">El avance por idioma usa denominadores canónicos y es exacto. Nivel, capítulo y familia muestran evidencia observada entre lo ya publicado; no son porcentajes de completitud planificada.</p><div id="coverageGeneral" class="grid"></div><div class="tablewrap"><table><thead><tr><th>Idioma</th><th>Publicadas</th><th>Total</th><th>Pendientes</th><th>Avance</th><th>Auditadas</th></tr></thead><tbody id="coverageLanguages"></tbody></table></div><div class="tablewrap"><table><thead><tr><th>Idioma</th><th>Nivel</th><th>Publicadas</th><th>Auditadas</th><th>Evidencia</th></tr></thead><tbody id="coverageLevels"></tbody></table></div><div class="tablewrap"><table><thead><tr><th>Idioma</th><th>Familia</th><th>Publicadas</th><th>Auditadas</th><th>Evidencia</th></tr></thead><tbody id="coverageFamilies"></tbody></table></div></section>`;
  const anchor = '<section class="card"><h2>Historial separado de evidencia viva</h2>';
  if (!html.includes('id="deferredGeneral"')) html = html.replace(anchor, deferredSection + '\n' + anchor);
  if (!html.includes('id="semanticGeneral"')) html = html.replace(anchor, semanticSection + '\n' + anchor);
  if (!html.includes('id="coverageGeneral"')) html = html.replace(anchor, coverageSection + '\n' + anchor);
  const renderAnchor = "  $('historyGeneral').innerHTML=";
  const deferredRender = `  const d=data.deferredIntelligence||{total:0,retryable:0,notRetryable:0,unknown:0,byCategory:[],byFamily:[]};\n  $('deferredGeneral').innerHTML=metric('Deferred abiertos',num(d.total))+metric('Rescatables',num(d.retryable))+metric('Revisión humana',num(d.notRetryable))+metric('Sin clasificar',num(d.unknown));\n  $('deferredCategories').innerHTML=(d.byCategory||[]).map(x=>\`<tr><td>\${esc(x.name)}</td><td>\${num(x.count)}</td></tr>\`).join('')||'<tr><td colspan="2">Sin deferred abiertos.</td></tr>';\n  $('deferredFamilies').innerHTML=(d.byFamily||[]).map(x=>\`<tr><td>\${esc(x.language)}</td><td>\${esc(x.family)}</td><td>\${num(x.count)}</td></tr>\`).join('')||'<tr><td colspan="3">Sin familias deferred.</td></tr>';\n`;
  const semanticRender = `  const s=data.semanticAudit||{audited:0,totalPublished:0,coverage:0,ok:0,watch:0,reviewRequired:0,byFamily:[],byCategory:[],alert:{status:'evidencia insuficiente',reasons:[]}};\n  $('semanticGeneral').innerHTML=metric('Auditados',num(s.audited))+metric('Publicados',num(s.totalPublished))+metric('Cobertura',pct(s.coverage))+metric('OK',num(s.ok))+metric('Vigilar',num(s.watch))+metric('Revisión requerida',num(s.reviewRequired));\n  $('semanticAlert').textContent=(s.alert?.reasons||[]).join(' ');\n  $('semanticFamilies').innerHTML=(s.byFamily||[]).map(x=>\`<tr><td>\${esc(x.language)}</td><td>\${esc(x.family)}</td><td>\${num(x.count)}</td></tr>\`).join('')||'<tr><td colspan="3">Sin auditorías semánticas todavía.</td></tr>';\n  $('semanticCategories').innerHTML=(s.byCategory||[]).map(x=>\`<tr><td>\${esc(x.name)}</td><td>\${num(x.count)}</td></tr>\`).join('')||'<tr><td colspan="2">Sin hallazgos registrados.</td></tr>';\n`;
  const coverageRender = `  const c=data.coverageMap||{exact:{planned:0,published:0,pending:0,completion:0,byLanguage:[]},observed:{levels:[],families:[]}};\n  $('coverageGeneral').innerHTML=metric('Plan canónico',num(c.exact?.planned))+metric('Publicadas',num(c.exact?.published))+metric('Pendientes',num(c.exact?.pending))+metric('Avance exacto',pct(c.exact?.completion));\n  $('coverageLanguages').innerHTML=(c.exact?.byLanguage||[]).map(x=>\`<tr><td>\${esc(x.languageName||x.language)}</td><td>\${num(x.published)}</td><td>\${num(x.total)}</td><td>\${num(x.pending)}</td><td>\${pct(x.completion)}</td><td>\${num(x.semanticAudited)}</td></tr>\`).join('')||'<tr><td colspan="6">Sin datos de cobertura.</td></tr>';\n  $('coverageLevels').innerHTML=(c.observed?.levels||[]).map(x=>\`<tr><td>\${esc(x.language)}</td><td>\${esc(x.level)}</td><td>\${num(x.published)}</td><td>\${num(x.semanticAudited)}</td><td>\${esc(x.evidence)}</td></tr>\`).join('')||'<tr><td colspan="5">Sin evidencia por nivel.</td></tr>';\n  $('coverageFamilies').innerHTML=(c.observed?.families||[]).sort((a,b)=>a.published-b.published).slice(0,40).map(x=>\`<tr><td>\${esc(x.language)}</td><td>\${esc(x.family)}</td><td>\${num(x.published)}</td><td>\${num(x.semanticAudited)}</td><td>\${esc(x.evidence)}</td></tr>\`).join('')||'<tr><td colspan="5">Sin evidencia por familia.</td></tr>';\n`;
  if (!html.includes("$('deferredGeneral').innerHTML")) html = html.replace(renderAnchor, deferredRender + renderAnchor);
  if (!html.includes("$('semanticGeneral').innerHTML")) html = html.replace(renderAnchor, semanticRender + renderAnchor);
  if (!html.includes("$('coverageGeneral').innerHTML")) html = html.replace(renderAnchor, coverageRender + renderAnchor);
  return html;
}
function main() {
  const target = 'src/index.js'; let runtime = fs.readFileSync(target, 'utf8');
  if (runtime.includes('async function handleMlsChat(')) throw Error('La integración ChatGPT ya está instalada en este runtime.');
  const marker = '    const url = new URL(request.url);';
  if (!runtime.includes(marker) || !runtime.includes('function getEditorialContextR32(')) throw Error('Ejecutar primero habilitar flujo editorial.js sobre R32.');
  const privateRoutes = `
    if (url.pathname === "/api/wiki/editorial/chat/autoopt/health") return handleMlsAutooptHealth(request, env);
    if (url.pathname === "/api/wiki/editorial/chat/coverage/status") return handleMlsCoverageMap(request, env);
    if (url.pathname.startsWith("/api/wiki/editorial/chat/semantic/")) return handleMlsSemanticAudit(request, env, url);
    if (url.pathname.startsWith("/api/wiki/editorial/staging/")) return handleMlsStaging(request, env, url);
    if (url.pathname.startsWith("/api/wiki/editorial/evidence/")) return MLS_EVIDENCE_API.handleMlsEvidence(request, env, url, {authenticate:mlsChatAuthenticate, body:mlsChatBody, json:mlsChatJson, error:mlsChatError, ensureWikiDb});
    if (url.pathname.startsWith("/api/wiki/editorial/chat/")) return handleMlsChat(request, env, url);
    if (url.pathname.startsWith("/api/wiki/editorial/rescue/")) return handleMlsRescue(request, env, url);`;
  runtime = runtime.replace(marker, marker + privateRoutes);
  fs.writeFileSync(target, runtime + buildChatRuntime());
  const panelSource = path.join(process.cwd(), 'MLS R32 EDITORIAL/autoopt health.html');
  const panelTarget = path.join(process.cwd(), 'public/autoopt.html');
  fs.copyFileSync(panelSource, panelTarget);
  fs.writeFileSync(panelTarget, patchAutooptPanel(fs.readFileSync(panelTarget, 'utf8')));
  console.log('ChatGPT editorial habilitado; requiere MLS_EDITORIAL_CHAT_KEY. Panel AUTOOPT, rescate, auditoría semántica y mapa de cobertura copiados.');
}
module.exports = {buildChatRuntime, patchAutooptPanel, augmentEditorialOpenApi};
if (require.main === module) main();
