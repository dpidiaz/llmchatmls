'use strict';
const fs=require('node:fs');

const TARGET='src/index.js';
const MARKER='// MLS EVIDENCE CONSUMER CONTRACT R33 1.0';

function replaceOnce(source,search,replacement,label){
  if(!source.includes(search))throw new Error('No se encontró ancla para '+label+'.');
  return source.replace(search,replacement);
}
function patchRuntime(input){
  let source=String(input||'');
  if(source.includes(MARKER))return source;
  if(!source.includes('var MLS_EVIDENCE_CONSUMER='))throw new Error('Evidence consumer runtime no está bundleado.');
  if(!source.includes('async function handleVirtuosoRequest(request, env)'))throw new Error('Virtuoso debe habilitarse antes del contrato Evidence.');
  if(!source.includes('async function handleChatRequest(request, env)'))throw new Error('Profesor IA no está disponible para el contrato Evidence.');

  source=replaceOnce(
    source,
    '    const entryContext = buildEntryContext(body.entry);\n    const languageGuidance = getLanguageGuidance(body.entry, messages);',
    '    const entryContext = buildEntryContext(body.entry);\n    const evidenceConsumerContext = await MLS_EVIDENCE_CONSUMER.contextForEntry(env, body.entry?.code).catch((error) => { console.warn("Profesor IA Evidence context unavailable:", error); return null; });\n    const languageGuidance = getLanguageGuidance(body.entry, messages);',
    'contexto Evidence de Profesor IA'
  );
  source=replaceOnce(
    source,
    '    if (entryContext) {\n      modelMessages.push({\n        role: "system",\n        content: entryContext\n      });\n    }\n    for (const message of messages) {',
    '    if (entryContext) {\n      modelMessages.push({\n        role: "system",\n        content: entryContext\n      });\n    }\n    if (evidenceConsumerContext) {\n      modelMessages.push({ role: "system", content: MLS_EVIDENCE_CONSUMER.professorGuidance(evidenceConsumerContext) });\n    }\n    for (const message of messages) {',
    'guidance Evidence de Profesor IA'
  );

  source=replaceOnce(
    source,
    '      semanticScore: Number.isFinite(Number(raw?.semanticScore)) ? Number(raw.semanticScore) : null\n    });\n  }\n  return { language, validated };',
    '      semanticScore: Number.isFinite(Number(raw?.semanticScore)) ? Number(raw.semanticScore) : null\n    });\n  }\n  const evidenceContexts = await MLS_EVIDENCE_CONSUMER.contextsForEntries(env, validated.map((entry) => entry.code)).catch((error) => { console.warn("Virtuoso Evidence context unavailable:", error); return {}; });\n  for (const entry of validated) entry.evidence = MLS_EVIDENCE_CONSUMER.virtuosoLabel(evidenceContexts[entry.code] || null);\n  return { language, validated };',
    'batch Evidence de Virtuoso'
  );
  source=replaceOnce(
    source,
    '      entry.section ? "Sección coincidente: " + entry.section : ""\n    ].filter(Boolean).join(" | ")).join("\\\\n");',
    '      entry.section ? "Sección coincidente: " + entry.section : "",\n      "Evidence: " + entry.evidence.status + " — " + entry.evidence.label\n    ].filter(Boolean).join(" | ")).join("\\\\n");',
    'texto de candidatos Evidence de Virtuoso'
  );
  source=replaceOnce(
    source,
    '      "No inventes códigos, títulos, niveles, capítulos, enlaces ni prerrequisitos.",\n      "Selecciona entre 1 y 5 entradas y ordénalas por utilidad para la intención del usuario.",',
    '      "No inventes códigos, títulos, niveles, capítulos, enlaces ni prerrequisitos.",\n      "Evidence es informativo y no cambia el ranking por sí solo. UNSOURCED o SOURCED nunca significan verificado. VERIFIED permite decir verificada con fuentes, pero no revisión humana. Solo REVIEWED con revisión humana demostrada permite decir revisada por una persona.",\n      "Selecciona entre 1 y 5 entradas y ordénalas por utilidad para la intención del usuario.",',
    'regla epistemológica de Virtuoso'
  );
  source=replaceOnce(
    source,
    '      reason: "Coincide con tu consulta dentro de la biblioteca de MLS.",\n      deepLink: "/#entry=" + entry.code',
    '      reason: "Coincide con tu consulta dentro de la biblioteca de MLS.",\n      evidence: entry.evidence,\n      deepLink: "/#entry=" + entry.code',
    'Evidence en fallback de Virtuoso'
  );
  source=replaceOnce(
    source,
    '        reason: virtuosoText(raw?.reason, 600) || "Entrada relevante para tu objetivo.",\n        deepLink: "/#entry=" + entry.code',
    '        reason: virtuosoText(raw?.reason, 600) || "Entrada relevante para tu objetivo.",\n        evidence: entry.evidence,\n        deepLink: "/#entry=" + entry.code',
    'Evidence en recomendaciones de Virtuoso'
  );

  return source.replace('async function handleChatRequest(request, env) {',MARKER+'\nasync function handleChatRequest(request, env) {');
}
function install(){
  const source=fs.readFileSync(TARGET,'utf8');
  fs.writeFileSync(TARGET,patchRuntime(source),'utf8');
}
function main(){install();console.log('Contrato Evidence de Virtuoso y Profesor IA habilitado.');}

module.exports={TARGET,MARKER,patchRuntime,install};
if(require.main===module)main();
