'use strict';
const fs=require('node:fs');

const TARGET='public/js/ai.js';
const MARKER="const PROMPT_OPTIMIZATION_VERSION='1.0';";

function replaceOnce(source,needle,replacement,label){
  if(!source.includes(needle))throw new Error(`No se encontró el ancla de ${label}.`);
  return source.replace(needle,replacement);
}
function replaceBetween(source,startNeedle,endNeedle,replacement,label){
  const start=source.indexOf(startNeedle),end=source.indexOf(endNeedle,start+startNeedle.length);
  if(start<0||end<0)throw new Error(`No se encontró el bloque de ${label}.`);
  return source.slice(0,start)+replacement+source.slice(end);
}

function patchAi(source){
  source=String(source);
  if(source.includes(MARKER))return source;

  const start=`  function contextFromEntry(entry,meta){`;
  const end=`  const SUGGESTIONS_VERSION='1.0';`;
  const optimized=`  const PROMPT_OPTIMIZATION_VERSION='1.0';\n  const MAX_CLIENT_CONTEXT_CHARS=11500;\n  const PROFESSOR_BLOCK_RE=/\\[MLS_PROFESSOR_(PROFILE|PREFERENCES|QUICK_ACTION|PRONUNCIATION)[^\\]]*\\][\\s\\S]*?\\[\\/MLS_PROFESSOR_\\1\\]/g;\n  function normalizedPromptText(value){return String(value||'').replace(/\\r\\n/g,'\\n').trim();}\n  function stripProfessorBlocks(value){return String(value||'').replace(PROFESSOR_BLOCK_RE,'').replace(/\\n{3,}/g,'\\n\\n').trim();}\n  function collectProfessorBlocks(entry,...values){\n    const ordered=[entry&&entry.professorProfilePrompt,entry&&entry.professorPreferencesPrompt,entry&&entry.professorQuickActionPrompt,entry&&entry.professorPronunciationPrompt],seen=new Set(),out=[];\n    for(const value of values){const matches=String(value||'').match(PROFESSOR_BLOCK_RE)||[];ordered.push(...matches);}\n    for(const value of ordered){const text=normalizedPromptText(value);if(!text||seen.has(text))continue;seen.add(text);out.push(text);}\n    return out;\n  }\n  function contextFromEntry(entry,meta){\n    const plain=entry.plain||{};\n    const leadRaw=plain.lead||entry.definition||'';\n    const advancedRaw=String(entry.auditedBody||entry.body||'');\n    const prompts=collectProfessorBlocks(entry,leadRaw,advancedRaw);\n    const definition=stripProfessorBlocks(leadRaw);\n    const article=stripProfessorBlocks(advancedRaw);\n    const parts=[];\n    if(prompts.length)parts.push('Instrucciones activas del Profesor IA:\\n'+prompts.join('\\n\\n'));\n    if(entry.target)parts.push('Forma o tema objetivo:\\n'+String(entry.target));\n    if(plain.look)parts.push('Nota visible:\\n'+String(plain.look));\n    const base=parts.join('\\n\\n');\n    const label='Detalles de referencia:\\n';\n    const remaining=Math.max(2200,MAX_CLIENT_CONTEXT_CHARS-base.length-label.length-(base?2:0));\n    const advanced=article.slice(0,remaining);\n    if(advanced)parts.push(label+advanced);\n    let content=parts.join('\\n\\n');\n    if(content.length>MAX_CLIENT_CONTEXT_CHARS)content=content.slice(0,MAX_CLIENT_CONTEXT_CHARS);\n    return {\n      code:entry.code,\n      language:meta?.name||entry.language||'',\n      level:entry.level||'',\n      part:String(entry.part||entry.partNum||''),\n      chapter:String(entry.chapter||entry.chapterNum||''),\n      title:entry.title||'',\n      definition,\n      examples:[plain.example||''].filter(Boolean),\n      content\n    };\n  }\n`;
  source=replaceBetween(source,start,end,optimized,'contextFromEntry optimizado');

  source=replaceOnce(source,
`  MLS.aiTutor={open,professorConversationVersion:CONVERSATION_VERSION,professorSuggestionsVersion:SUGGESTIONS_VERSION,suggestionsFor,professorInternalLinksVersion:INTERNAL_LINKS_VERSION,internalLinkMatches,professorRobustnessVersion:ROBUSTNESS_VERSION,classifyProfessorError};`,
`  MLS.aiTutor={open,professorConversationVersion:CONVERSATION_VERSION,professorSuggestionsVersion:SUGGESTIONS_VERSION,suggestionsFor,professorInternalLinksVersion:INTERNAL_LINKS_VERSION,internalLinkMatches,professorRobustnessVersion:ROBUSTNESS_VERSION,classifyProfessorError,professorPromptOptimizationVersion:PROMPT_OPTIMIZATION_VERSION};`,
  'versión de optimización');

  return source;
}

function main(){
  if(!fs.existsSync(TARGET))throw new Error('No se encontró public/js/ai.js después de extraer el bundle R32.');
  fs.writeFileSync(TARGET,patchAi(fs.readFileSync(TARGET,'utf8')),'utf8');
  console.log('Optimización de prompt del Profesor IA habilitada.');
}
module.exports={patchAi,MARKER};
if(require.main===module)main();
