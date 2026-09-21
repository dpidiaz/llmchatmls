'use strict';

const SOURCE_POLICY_VERSION='1.0';
const ALLOWED_TIERS=Object.freeze(['A','B','C','D']);
const DISALLOWED_EVIDENCE_KINDS=Object.freeze([
  'ai_output',
  'unauthored_content',
  'unknown_blog',
  'aggregator',
  'untraceable_content'
]);
const PREFERRED_AUTHORITY_KINDS=Object.freeze([
  'official_language_or_standards_institution',
  'national_education_or_culture_authority',
  'official_dictionary_or_normative_reference',
  'institutional_corpus'
]);
const RECOMMENDED_ACADEMIC_SOURCE_KINDS=Object.freeze([
  'peer_reviewed_linguistics',
  'university_press',
  'academic_monograph',
  'specialist_book_chapter',
  'recognized_academic_corpus'
]);

function makePolicy(language,regionalScope,notes){
  return Object.freeze({
    version:SOURCE_POLICY_VERSION,
    language,
    regionalScope,
    defaultAllowedTiers:[...ALLOWED_TIERS],
    claimRules:Object.freeze({
      normative:Object.freeze({allowedTiers:['A','B']}),
      orthography:Object.freeze({allowedTiers:['A','B']}),
      quotation:Object.freeze({allowedTiers:['A','B','C','D'],requiresLocator:true}),
      regional_variation:Object.freeze({allowedTiers:['A','B','C'],preserveVariation:true}),
      historical:Object.freeze({allowedTiers:['A','B','C']})
    }),
    preferredAuthorityKinds:[...PREFERRED_AUTHORITY_KINDS],
    recommendedAcademicSourceKinds:[...RECOMMENDED_ACADEMIC_SOURCE_KINDS],
    disallowedEvidenceKinds:[...DISALLOWED_EVIDENCE_KINDS],
    variation:Object.freeze({
      regional:true,
      standard:true,
      register:true,
      historical:true,
      doNotTreatAsConflictByDefault:true
    }),
    approvedSourcePool:Object.freeze([]),
    notes
  });
}

const SOURCE_POLICIES=Object.freeze({
  'espanol-guatemala':makePolicy('espanol-guatemala','Guatemala y español internacional; preservar voseo y variación regional legítima.','No imponer una variedad panhispánica como sustituto automático del uso guatemalteco.'),
  'ingles':makePolicy('ingles','Inglés internacional; documentar diferencias regionales cuando sean materialmente relevantes.','No existe una única autoridad normativa global para todo el inglés; la fuerza depende del tipo de claim y la fuente.'),
  'portugues':makePolicy('portugues','Portugués de Brasil como variante objetivo principal de MLS; documentar otras variantes cuando sean pertinentes.','No convertir diferencias Brasil/Portugal en contradicciones automáticas.'),
  'italiano':makePolicy('italiano','Italiano contemporáneo; preservar variación regional o de registro cuando sea pertinente.','Preferir evidencia institucional o académica para reglas normativas.'),
  'frances':makePolicy('frances','Francés contemporáneo; documentar diferencias regionales cuando sean pertinentes.','Distinguir norma, uso y variación regional.'),
  'aleman':makePolicy('aleman','Alemán contemporáneo; documentar estándares nacionales/regionales cuando sean pertinentes.','La variación estándar entre regiones germanófonas no es contradicción automática.'),
  'japones':makePolicy('japones','Japonés contemporáneo; conservar distinciones de escritura, registro y uso.','Claims de escritura y norma requieren evidencia fuerte; romanización no sustituye la escritura canónica.'),
  'chino-taiwan':makePolicy('chino-taiwan','Mandarín de Taiwán; caracteres tradicionales y uso taiwanés como variante objetivo principal.','No sustituir automáticamente convenciones de Taiwán por las de otras regiones sin explicitar la variación.'),
  'coreano':makePolicy('coreano','Coreano contemporáneo; explicitar diferencias normativas o regionales cuando sean pertinentes.','No tratar variantes legítimas como errores por defecto.'),
  'ruso':makePolicy('ruso','Ruso contemporáneo; distinguir norma, uso, registro e historia cuando sea pertinente.','Preferir evidencia institucional/académica para reglas normativas.')
});

function sourcePolicyForLanguage(language,{allowGeneric=false}={}){
  const key=String(language||'').trim().toLowerCase();
  if(!key){
    if(allowGeneric)return null;
    const e=new Error('SOURCE_POLICY_LANGUAGE_REQUIRED');e.code='SOURCE_POLICY_LANGUAGE_REQUIRED';e.status=422;throw e;
  }
  const policy=SOURCE_POLICIES[key];
  if(!policy){
    if(allowGeneric)return null;
    const e=new Error('SOURCE_POLICY_NOT_FOUND');e.code='SOURCE_POLICY_NOT_FOUND';e.status=422;e.language=key;throw e;
  }
  return policy;
}

module.exports={
  SOURCE_POLICY_VERSION,
  SOURCE_POLICIES,
  ALLOWED_TIERS,
  DISALLOWED_EVIDENCE_KINDS,
  PREFERRED_AUTHORITY_KINDS,
  RECOMMENDED_ACADEMIC_SOURCE_KINDS,
  sourcePolicyForLanguage
};
