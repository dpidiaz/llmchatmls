'use strict';
const fs=require('node:fs');

const TARGET='src/index.js';
const MARKER='// MLS R33 EVIDENCE CONSUMERS 1.0';

function patchProfessorEvidenceConsumer(source){
  source=String(source);
  if(source.includes(MARKER))return source;

  const contextAnchor='    const entryContext = buildEntryContext(body.entry);\n    const languageGuidance = getLanguageGuidance(body.entry, messages);';
  if(!source.includes(contextAnchor))throw new Error('No se encontró el contexto del Profesor IA para Evidence.');
  source=source.replace(contextAnchor,
`    const entryContext = buildEntryContext(body.entry);
    const languageGuidance = getLanguageGuidance(body.entry, messages);
    let evidenceConsumerContext = null;
    if (body?.entry?.code && typeof MLS_EVIDENCE_CONSUMER !== "undefined") {
      try {
        evidenceConsumerContext = await MLS_EVIDENCE_CONSUMER.contextForEntry(env, body.entry.code);
      } catch (error) {
        console.warn("Profesor IA Evidence context unavailable:", body.entry.code, error);
      }
    }
    const evidenceGuidance = evidenceConsumerContext
      ? MLS_EVIDENCE_CONSUMER.systemGuidance(evidenceConsumerContext, "Profesor IA")
      : null;`);

  const messageAnchor=`    if (entryContext) {
      modelMessages.push({
        role: "system",
        content: entryContext
      });
    }
    for (const message of messages) {`;
  if(!source.includes(messageAnchor))throw new Error('No se encontró el bloque de mensajes del Profesor IA para Evidence.');
  source=source.replace(messageAnchor,
`    if (entryContext) {
      modelMessages.push({
        role: "system",
        content: entryContext
      });
    }
    if (evidenceGuidance) {
      modelMessages.push({
        role: "system",
        content: evidenceGuidance
      });
    }
    for (const message of messages) {`);

  const functionAnchor='async function handleChatRequest(request, env) {';
  if(!source.includes(functionAnchor))throw new Error('No se encontró handleChatRequest.');
  return source.replace(functionAnchor,MARKER+'\n'+functionAnchor);
}

function validateVirtuosoEvidenceConsumer(source){
  if(!source.includes('async function virtuosoAttachEvidence(env, payload)'))
    throw new Error('Virtuoso todavía no consume Evidence.');
  if(!source.includes('MLS_EVIDENCE_CONSUMER.contextForEntry(env, recommendation.code)'))
    throw new Error('Virtuoso no usa el contrato Evidence por entrada.');
  if(!source.includes('No infieras ni anuncies que una entrada está verificada o revisada'))
    throw new Error('Virtuoso no contiene la prohibición de inferir verificación.');
  return true;
}

function install(){
  if(!fs.existsSync(TARGET))throw new Error('No existe src/index.js.');
  let source=fs.readFileSync(TARGET,'utf8');
  validateVirtuosoEvidenceConsumer(source);
  source=patchProfessorEvidenceConsumer(source);
  fs.writeFileSync(TARGET,source,'utf8');
  console.log('Evidence consumer contract habilitado para Virtuoso y Profesor IA.');
}

function main(){install();}
module.exports={MARKER,patchProfessorEvidenceConsumer,validateVirtuosoEvidenceConsumer,install};
if(require.main===module)main();
