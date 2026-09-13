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
    read('MLS R32 EDITORIAL/chat workflow.js');
}
function main() {
  const target = 'src/index.js'; let runtime = fs.readFileSync(target, 'utf8');
  if (runtime.includes('async function handleMlsChat(')) throw Error('La integración ChatGPT ya está instalada en este runtime.');
  const marker = '    const url = new URL(request.url);';
  if (!runtime.includes(marker) || !runtime.includes('function getEditorialContextR32(')) throw Error('Ejecutar primero habilitar flujo editorial.js sobre R32.');
  runtime = runtime.replace(marker, marker + '\n    if (url.pathname.startsWith("/api/wiki/editorial/chat/")) return handleMlsChat(request, env, url);');
  fs.writeFileSync(target, runtime + buildChatRuntime());
  console.log('ChatGPT editorial habilitado; las operaciones requieren MLS_EDITORIAL_CHAT_KEY.');
}
module.exports = {buildChatRuntime};
if (require.main === module) main();
