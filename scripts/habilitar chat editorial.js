'use strict';
const fs = require('fs');
const path = require('path');
function augmentEditorialOpenApi(text) {
  const api = JSON.parse(text);
  api.info.version = '32.0.5';
  api.paths['/api/wiki/editorial/chat/semantic/status']={get:{operationId:'estadoAuditoriaSemanticaMLS',summary:'Consultar cobertura y hallazgos agregados de la auditoría semántica por muestra.', 'x-openai-isConsequential':false,responses:{'200':{description:'Estado diagnóstico de la muestra.'},'401':{description:'Clave ausente o incorrecta.'}}}};
  api.paths['/api/wiki/editorial/chat/semantic/sample']={post:{operationId:'muestraAuditoriaSemanticaMLS',summary:'Seleccionar una muestra balanceada de artículos publicados aún no auditados.', 'x-openai-isConsequential':false,requestBody:{required:true,content:{'application/json':{schema:{type:'object',properties:{count:{type:'integer',minimum:1,maximum:10},language:{type:'string'}},additionalProperties:false}}}},responses:{'200':{description:'Muestra privada para revisión semántica.'},'401':{description:'Clave ausente o incorrecta.'}}}};
  api.paths['/api/wiki/editorial/chat/semantic/record']={post:{operationId:'registrarAuditoriaSemanticaMLS',summary:'Registrar el resultado diagnóstico de una revisión semántica sin modificar el artículo.', 'x-openai-isConsequential':true,requestBody:{required:true,content:{'application/json':{schema:{type:'object',properties:{code:{type:'string'},generatedAt:{type:'string'},verdict:{type:'string',enum:['ok','watch','review_required']},categories:{type:'array',items:{type:'string',enum:['accuracy','terminology','examples','ambiguity','variety','factual','other']}},confidence:{type:'string',enum:['low','medium','high']},notes:{type:'string',minLength:20,maxLength:3000},reviewer:{type:'string',enum:['chatgpt','human']}},required:['code','generatedAt','verdict','categories','confidence','notes','reviewer'],additionalProperties:false}}}},responses:{'200':{description:'Resultado semántico registrado para la versión exacta del artículo.'},'401':{description:'Clave ausente o incorrecta.'},'409':{description:'El artículo cambió desde la muestra.'},'422':{description:'Resultado de auditoría no válido.'}}}};
  api.paths['/api/wiki/editorial/chat/coverage/status']={get:{operationId:'estadoCoberturaEditorialMLS',summary:'Consultar el mapa de cobertura editorial de solo lectura.', 'x-openai-isConsequential':false,responses:{'200':{description:'Avance exacto por idioma y evidencia observada por nivel, parte, capítulo y familia.'},'401':{description:'Clave ausente o incorrecta.'}}}};
  return JSON.stringify(api);
}
function buildChatRuntime(root = process.cwd()) {
  const read = file => fs.readFileSync(path.join(root, file), 'utf8');
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
    read('MLS R32 EDITORIAL/autoopt.js').replace(/^if \(typeof module .*$/gm, '') + '\n' +
    read('MLS R32 EDITORIAL/autoopt history.js').replace(/^if \(typeof module .*$/gm, '') + '\n' +
    read('MLS R32 EDITORIAL/autoopt health.js').replace(/^if \(typeof module .*$/gm, '') + '\n' +
    read('MLS R32 EDITORIAL/chat workflow.js') + '\n' +
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
  runtime = runtime.replace(marker, marker + '\n    if (url.pathname === "/api/wiki/editorial/chat/autoopt/health") return handleMlsAutooptHealth(request, env);\n    if (url.pathname === "/api/wiki/editorial/chat/coverage/status") return handleMlsCoverageMap(request, env);\n    if (url.pathname.startsWith("/api/wiki/editorial/chat/semantic/")) return handleMlsSemanticAudit(request, env, url);\n    if (url.pathname.startsWith("/api/wiki/editorial/chat/")) return handleMlsChat(request, env, url);\n    if (url.pathname.startsWith("/api/wiki/editorial/rescue/")) return handleMlsRescue(request, env, url);');
  fs.writeFileSync(target, runtime + buildChatRuntime());
  const panelSource = path.join(process.cwd(), 'MLS R32 EDITORIAL/autoopt health.html');
  const panelTarget = path.join(process.cwd(), 'public/autoopt.html');
  fs.copyFileSync(panelSource, panelTarget);
  fs.writeFileSync(panelTarget, patchAutooptPanel(fs.readFileSync(panelTarget, 'utf8')));
  console.log('ChatGPT editorial habilitado; requiere MLS_EDITORIAL_CHAT_KEY. Panel AUTOOPT, rescate, auditoría semántica y mapa de cobertura copiados.');
}
module.exports = {buildChatRuntime, patchAutooptPanel, augmentEditorialOpenApi};
if (require.main === module) main();
