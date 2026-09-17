'use strict';
const fs=require('node:fs');

const TARGET='public/js/ai.js';
const MARKER="const SUGGESTIONS_VERSION='1.0';";

function replaceOnce(source,needle,replacement,label){
  if(!source.includes(needle))throw new Error(`No se encontró el ancla de ${label}.`);
  return source.replace(needle,replacement);
}

function patchAi(source){
  source=String(source);
  if(source.includes(MARKER))return source;

  const anchor=`  function status(modal,msg,kind=''){`;
  const helpers=`  const SUGGESTIONS_VERSION='1.0';\n  function suggestionSlug(entry,meta){return String((entry&&entry.language)||(meta&&meta.slug)||'').trim();}\n  function suggestionTopic(entry){return String((entry&&entry.target)||(entry&&entry.title)||'este tema').replace(/\\s+/g,' ').trim().slice(0,120)||'este tema';}\n  function suggestionsFor(entry,meta){\n    const slug=suggestionSlug(entry,meta),topic=suggestionTopic(entry),level=String(entry&&entry.level||'').toUpperCase(),advanced=/^(B2|C1|C2)$/.test(level);\n    const sets={\n      'espanol-guatemala':()=>[\`¿Cómo se usa «\${topic}» en Guatemala y qué registro tiene?\`,\`Dame ejemplos guatemaltecos naturales de «\${topic}».\`,\`¿Con qué otras formas del español se puede confundir «\${topic}»?\`,advanced?\`¿Qué matices gramaticales o pragmáticos tiene «\${topic}»?\`:\`Explícame «\${topic}» con palabras sencillas.\`],\n      ingles:()=>[\`¿Cómo se usa «\${topic}» en inglés contemporáneo natural?\`,\`¿Hay diferencias relevantes entre US y UK para «\${topic}»?\`,\`Dame ejemplos reales de registro formal e informal con «\${topic}».\`,advanced?\`¿Qué matices semánticos o sintácticos tiene «\${topic}»?\`:\`¿Cuál es la forma más fácil de entender «\${topic}»?\`],\n      portugues:()=>[\`¿Cómo se usa «\${topic}» en portugués de Brasil?\`,\`¿Cómo cambia «\${topic}» entre conversación y escritura en Brasil?\`,\`Dame ejemplos brasileños naturales con «\${topic}».\`,advanced?\`¿Qué matices de registro o sintaxis tiene «\${topic}» en Brasil?\`:\`Explícame «\${topic}» de forma sencilla.\`],\n      italiano:()=>[\`¿Cómo se usa «\${topic}» en italiano estándar actual?\`,\`¿Cómo aparece «\${topic}» en italiano hablado frente al escrito?\`,\`Dame ejemplos naturales y corrige posibles confusiones con «\${topic}».\`,advanced?\`¿Qué matices gramaticales tiene «\${topic}»?\`:\`Explícame «\${topic}» con una regla simple y ejemplos.\`],\n      frances:()=>[\`¿Cómo se usa «\${topic}» en francés estándar actual?\`,\`¿Qué cambia al hablar cuando se usa «\${topic}»?\`,\`Dame ejemplos naturales de «\${topic}» con su registro.\`,advanced?\`¿Qué matices de sintaxis, elisión o concordancia intervienen en «\${topic}»?\`:\`Explícame «\${topic}» de la forma más clara posible.\`],\n      aleman:()=>[\`¿Cómo funciona «\${topic}» en Standarddeutsch?\`,\`¿Qué papel tienen el caso o el orden verbal en «\${topic}»?\`,\`Dame ejemplos naturales de «\${topic}» con traducción explicada.\`,advanced?\`¿Qué matices de declinación o estructura tiene «\${topic}»?\`:\`Explícame «\${topic}» paso a paso.\`],\n      japones:()=>[\`¿Cómo se escribe y se lee «\${topic}» usando kanji y kana?\`,\`¿Qué nivel de cortesía o registro tiene «\${topic}»?\`,\`¿Cómo se usa «\${topic}» en conversación japonesa natural?\`,advanced?\`¿Qué matices gramaticales propios del japonés tiene «\${topic}»?\`:\`Explícame «\${topic}» sin depender del rōmaji.\`],\n      'chino-taiwan':()=>[\`¿Cómo se escribe «\${topic}» en caracteres tradicionales y cómo se usa en Taiwán?\`,\`¿Qué tonos o cambios tonales importan en «\${topic}»?\`,\`Dame ejemplos naturales de Taiwán con «\${topic}».\`,advanced?\`¿Qué matices gramaticales o pragmáticos tiene «\${topic}» en mandarín de Taiwán?\`:\`Explícame «\${topic}» usando tradicionales como escritura principal.\`],\n      coreano:()=>[\`¿Cómo se usa «\${topic}» en coreano natural manteniendo Hangul?\`,\`¿Qué nivel de habla u honorífico corresponde a «\${topic}»?\`,\`¿Hay cambios de pronunciación o batchim relevantes en «\${topic}»?\`,advanced?\`¿Qué función tienen las partículas o terminaciones en «\${topic}»?\`:\`Explícame «\${topic}» con ejemplos sencillos en Hangul.\`],\n      ruso:()=>[\`¿Cómo se usa «\${topic}» en ruso natural manteniendo cirílico?\`,\`¿Dónde cae el acento y qué cambia en la pronunciación de «\${topic}»?\`,\`¿Qué caso o aspecto verbal interviene en «\${topic}»?\`,advanced?\`¿Qué matices de aspecto, caso o sintaxis tiene «\${topic}»?\`:\`Explícame «\${topic}» paso a paso en cirílico.\`]\n    };\n    const fallback=()=>[\`Explícame «\${topic}» con más claridad.\`,\`Dame ejemplos naturales de «\${topic}».\`,\`¿Cuándo se usa «\${topic}»?\`];\n    return (sets[slug]||fallback)().slice(0,5);\n  }\n`;
  source=replaceOnce(source,anchor,helpers+anchor,'helpers de sugerencias');

  const oldQuick=`      <div class="ai-quick" aria-label="Preguntas rápidas">\n        <button type="button" data-q="Explícamelo todavía más fácil, sin perder precisión.">Más simple</button>\n        <button type="button" data-q="Dame más ejemplos y explícame por qué cada uno funciona.">Más ejemplos</button>\n        <button type="button" data-q="Explícamelo paso a paso y define cualquier término técnico que uses.">Paso a paso</button>\n        <button type="button" data-q="Compáralo con el español de Guatemala cuando sea útil.">Comparar con español</button>\n      </div>`;
  const newQuick=`      <div class="ai-quick" data-ai-suggestions aria-label="Preguntas sugeridas para esta entrada"></div>`;
  source=replaceOnce(source,oldQuick,newQuick,'preguntas rápidas estáticas');

  const binding=`    modal.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>ask(entry,meta,b.dataset.q,modal));`;
  const rendered=`    const suggestionBox=modal.querySelector('[data-ai-suggestions]');\n    for(const q of suggestionsFor(entry,meta)){const b=make('button');b.type='button';b.dataset.q=q;text(b,q);suggestionBox.append(b);}\n    modal.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>ask(entry,meta,b.dataset.q,modal));`;
  source=replaceOnce(source,binding,rendered,'render de sugerencias');

  const versionAnchor=`  MLS.aiTutor={open,professorConversationVersion:CONVERSATION_VERSION};`;
  const versioned=`  MLS.aiTutor={open,professorConversationVersion:CONVERSATION_VERSION,professorSuggestionsVersion:SUGGESTIONS_VERSION,suggestionsFor};`;
  source=replaceOnce(source,versionAnchor,versioned,'versión de sugerencias');
  return source;
}

function main(){
  if(!fs.existsSync(TARGET))throw new Error('No se encontró public/js/ai.js después de extraer el bundle R32.');
  fs.writeFileSync(TARGET,patchAi(fs.readFileSync(TARGET,'utf8')),'utf8');
  console.log('Preguntas sugeridas contextuales del Profesor IA habilitadas.');
}

module.exports={patchAi,MARKER};
if(require.main===module)main();
