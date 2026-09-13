'use strict';

module.exports = Object.freeze({
  standardId: 'MLS R32',
  name: 'MASTER LANGUAGE SYSTEM Revision 32',
  promptVersion: '32.0',
  canonicalRuntime: 'MLS R32 OVERLAY/index.js',
  canonicalSymbols: Object.freeze({
    systemPrompt: 'SYSTEM_PROMPT',
    languageModules: 'LANGUAGE_MODULES',
    generator: 'generateWikiDraftR32',
    deterministicValidator: 'basicArticleValidation',
    aiAuditor: 'auditWikiDraftR32',
    corrector: 'correctWikiDraftR32',
    publisher: 'publishWikiArticle'
  }),
  mode: 'ENCICLOPEDIA',
  function: 'EXPLICAR → ACLARAR → AMPLIAR → RESPONDER',
  centralPrinciple: 'LA EXPLICACIÓN MÁS SENCILLA QUE SIGA SIENDO VERDADERA',
  forbiddenSpontaneousModes: Object.freeze([
    'examen', 'quiz', 'ejercicio', 'tarea', 'evaluación', 'flashcards', 'gamificación', 'ruta obligatoria de estudio'
  ]),
  targetWords: Object.freeze({
    A1: '180–300', A2: '180–300', B1: '250–450', B2: '250–450', C1: '350–600', C2: '350–600', default: '250–450'
  }),
  minimumWords: 90,
  requiresFourthLevelHeading: true,

  // Coherencia editorial: las entradas ya publicadas son el patrón estilístico
  // más importante. El prompt define la precisión lingüística; el corpus
  // publicado define voz, densidad, estructura y proporción de ejemplos.
  publishedCorpusIsStyleAuthority: true,
  calibrationRequiredForExternalBatches: true,
  referenceSampleSize: 6,
  referenceEndpoint: '/api/wiki/editorial/reference',
  contextEndpoint: '/api/wiki/editorial/context',
  pendingEndpoint: '/api/wiki/editorial/pending',
  calibrationDimensions: Object.freeze([
    'extensión relativa',
    'número y orden de secciones',
    'densidad de ejemplos',
    'longitud de párrafos',
    'nivel de tecnicismo',
    'progresión explicación → ejemplo → regla → matiz',
    'forma de cerrar la entrada'
  ]),

  importedArticleProvider: 'mls-r32',
  importedArticleModel: 'editorial-standard-32',
  importedAuditProvider: 'mls-r32-validator',
  importedAuditModel: 'deterministic-32.0',
  provenanceVisibility: 'internal-only'
});
