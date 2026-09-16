'use strict';
const fs = require('fs');
const path = require('path');
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
    `var MLS_CHAT_OPENAPI = ${read('MLS R32 EDITORIAL/chat openapi.json').trim()};\n` +
    `var MLS_CHAT_INSTRUCTIONS = ${JSON.stringify(read('MLS R32 EDITORIAL/GPT privado instrucciones.md'))};\n` +
    read('MLS R32 EDITORIAL/autoopt.js').replace(/^if \(typeof module .*$/gm, '') + '\n' +
    read('MLS R32 EDITORIAL/autoopt history.js').replace(/^if \(typeof module .*$/gm, '') + '\n' +
    read('MLS R32 EDITORIAL/autoopt health.js').replace(/^if \(typeof module .*$/gm, '') + '\n' +
    read('MLS R32 EDITORIAL/chat workflow.js') + '\n' +
    read('MLS R32 EDITORIAL/deferred rescue.js').replace(/^if \(typeof module .*$/gm, '');
}
function patchAutooptPanel(html) {
  const section = `<section class="card"><h2>Deferred inteligente</h2><p class="note">Diagnóstico determinista de incidencias pendientes. AUTOOPT recomienda; no rescata, publica ni cambia FIFO automáticamente.</p><div id="deferredGeneral" class="grid"></div><div class="tablewrap"><table><thead><tr><th>Categoría</th><th>Cantidad</th></tr></thead><tbody id="deferredCategories"></tbody></table></div><div class="tablewrap"><table><thead><tr><th>Idioma</th><th>Familia</th><th>Cantidad</th></tr></thead><tbody id="deferredFamilies"></tbody></table></div></section>`;
  const anchor = '<section class="card"><h2>Historial separado de evidencia viva</h2>';
  if (!html.includes('id="deferredGeneral"')) html = html.replace(anchor, section + '\n' + anchor);
  const renderAnchor = "  $('historyGeneral').innerHTML=";
  const render = `  const d=data.deferredIntelligence||{total:0,retryable:0,notRetryable:0,unknown:0,byCategory:[],byFamily:[]};\n  $('deferredGeneral').innerHTML=metric('Deferred abiertos',num(d.total))+metric('Rescatables',num(d.retryable))+metric('Revisión humana',num(d.notRetryable))+metric('Sin clasificar',num(d.unknown));\n  $('deferredCategories').innerHTML=(d.byCategory||[]).map(x=>\`<tr><td>\${esc(x.name)}</td><td>\${num(x.count)}</td></tr>\`).join('')||'<tr><td colspan="2">Sin deferred abiertos.</td></tr>';\n  $('deferredFamilies').innerHTML=(d.byFamily||[]).map(x=>\`<tr><td>\${esc(x.language)}</td><td>\${esc(x.family)}</td><td>\${num(x.count)}</td></tr>\`).join('')||'<tr><td colspan="3">Sin familias deferred.</td></tr>';\n`;
  if (!html.includes("$('deferredGeneral').innerHTML")) html = html.replace(renderAnchor, render + renderAnchor);
  return html;
}
function main() {
  const target = 'src/index.js'; let runtime = fs.readFileSync(target, 'utf8');
  if (runtime.includes('async function handleMlsChat(')) throw Error('La integración ChatGPT ya está instalada en este runtime.');
  const marker = '    const url = new URL(request.url);';
  if (!runtime.includes(marker) || !runtime.includes('function getEditorialContextR32(')) throw Error('Ejecutar primero habilitar flujo editorial.js sobre R32.');
  runtime = runtime.replace(marker, marker + '\n    if (url.pathname === "/api/wiki/editorial/chat/autoopt/health") return handleMlsAutooptHealth(request, env);\n    if (url.pathname.startsWith("/api/wiki/editorial/chat/")) return handleMlsChat(request, env, url);\n    if (url.pathname.startsWith("/api/wiki/editorial/rescue/")) return handleMlsRescue(request, env, url);');
  fs.writeFileSync(target, runtime + buildChatRuntime());
  const panelSource = path.join(process.cwd(), 'MLS R32 EDITORIAL/autoopt health.html');
  const panelTarget = path.join(process.cwd(), 'public/autoopt.html');
  fs.copyFileSync(panelSource, panelTarget);
  fs.writeFileSync(panelTarget, patchAutooptPanel(fs.readFileSync(panelTarget, 'utf8')));
  console.log('ChatGPT editorial habilitado; las operaciones requieren MLS_EDITORIAL_CHAT_KEY. Panel AUTOOPT y rescate inteligente copiados.');
}
module.exports = {buildChatRuntime, patchAutooptPanel};
if (require.main === module) main();
