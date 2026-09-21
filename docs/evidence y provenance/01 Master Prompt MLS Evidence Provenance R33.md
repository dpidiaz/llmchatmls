# MASTER PROMPT — MLS EVIDENCE & PROVENANCE R33

**SOURCE REGISTRY · CLAIM EVIDENCE · PROVENANCE · VERIFICATION · APA · URL GUATEMALA · CHAT NATIVE**

Versión del documento: 1.0  
Proyecto: MASTER LANGUAGE SYSTEM  
Base: MLS R32  
Objetivo: preparar MLS R33  
Repositorio autorizado: `dpidiaz/llmchatmls`  
Modo: ENCICLOPEDIA  
Operación: Chat native  
Dependencia de ChatGPT Work: ninguna  
Principio económico: FREE ONLY $0.00  
Principio visual: TEXT ONLY / NO IMAGES  
Principio epistemológico: **AI assists; sources substantiate**  
Principio operativo: **AUTOOPT observes; Evidence verifies**  
Principio de migración: **ADDITIVE, INCREMENTAL, NON DESTRUCTIVE**  
Estilo bibliográfico inicial: APA 7  
Perfil institucional inicial: URL Guatemala 2025

---

## 1. ROL

Actúa simultáneamente como:

- Senior Knowledge Systems Architect
- Evidence & Provenance Engineer
- Academic Research Workflow Designer
- Senior Full Stack Engineer
- Cloudflare Workers Engineer
- D1 Database Architect
- GitHub Platform Engineer
- Editorial Systems Engineer
- Information Architecture Specialist
- AI Reliability Engineer
- QA Engineer
- Technical Documentation Lead

Tu tarea no es únicamente diseñar una idea.

Debes:

**INSPECCIONAR → ANALIZAR → DISEÑAR → IMPLEMENTAR → PROBAR → MEDIR → DOCUMENTAR → VERIFICAR**

sobre el repositorio real.

## 2. MISIÓN

Añadir a MASTER LANGUAGE SYSTEM una capa formal de **EVIDENCE & PROVENANCE** capaz de responder para una entrada:

- ¿Qué afirma?
- ¿Qué fuentes respaldan esas afirmaciones?
- ¿Qué partes siguen sin verificar?
- ¿Qué fuente se utilizó?
- ¿Dónde se encuentra la evidencia?
- ¿Cómo fue creada esta entrada?
- ¿Qué modelo o proceso participó?
- ¿Cuándo fue revisada?
- ¿Qué revisión estoy viendo?
- ¿Qué cambió entre versiones?

Evolucionar:

**MLS R32 — AI assisted + editorially validated**

hacia:

**MLS R33 — AI assisted + editorially validated + evidence backed + provenance aware + auditable**

## 3. NO CONVERTIR MLS EN MKS

Este proyecto trabaja exclusivamente sobre MASTER LANGUAGE SYSTEM.

No crear MKS Core, otros dominios, megarepositorio universal, ni reestructurar MLS como plataforma general.

Evidence & Provenance puede diseñarse con principios reutilizables, pero se implementa primero y únicamente en MLS.

## 4. INSPECCIÓN OBLIGATORIA

Antes de escribir código inspeccionar como mínimo:

- `MLS R32 EDITORIAL/AUTOOPT.md`
- `MLS R32 EDITORIAL/AUTOOPT arquitectura.md`
- `MLS R32 EDITORIAL/AUTOOPT historial.md`
- `MLS R32 EDITORIAL/autoopt.js`
- `MLS R32 EDITORIAL/contrato editorial.js`
- `MLS R32 EDITORIAL/MLS GITHUB STAGING.md`
- `MLS R32 EDITORIAL/staging.js`
- `MLS R32 EDITORIAL/chat workflow.js`

Además:

- schemas D1 actuales;
- `wiki_articles`;
- provenance existente;
- staging;
- publicación;
- validadores;
- Actions;
- OpenAPI;
- tests;
- semantic search;
- Virtuoso;
- Profesor IA;
- endpoints editoriales;
- scripts de predeploy;
- configuración FREE ONLY.

No inventar infraestructura que ya exista.

## 5. PRESERVAR R32

R33 debe ser aditivo.

No romper corpus, IDs, navegación, búsqueda, Virtuoso, Profesor IA, AUTOOPT, GitHub Staging, FIFO, Publish First, recuperación, generación por visita, FREE ONLY, offline, UX/UI ni accesibilidad.

Una entrada R32 debe seguir siendo legible aunque:

`evidenceStatus = UNSOURCED`

## 6. EL PROBLEMA

El corpus R32 fue generado principalmente mediante IA y validación editorial. Eso aporta estructura, consistencia, utilidad pedagógica, organización, estilo y cobertura, pero no constituye automáticamente fundamentación documental.

Clasificación inicial:

- `generatedWithAI = true`
- `editoriallyValidated = true`
- `evidenceStatus = UNSOURCED`

UNSOURCED significa **not yet independently evidence verified**, no “incorrect”.

## 7. PRINCIPIO EPISTEMOLÓGICO

Regla central:

**AI PRODUCES. SOURCES SUBSTANTIATE.**

La IA puede redactar, explicar, sintetizar, comparar, reorganizar, proponer, detectar claims y localizar candidatos.

La IA no puede utilizarse como autoridad independiente para verificar sus propias afirmaciones.

Nunca usar `source = ChatGPT` como fundamento académico.

Sí registrar IA como provenance mediante provider, model, promptVersion, generationMethod y campos equivalentes.

## 8. MLS SIGUE SIENDO ENCICLOPEDIA

Preservar:

`MODE = ENCICLOPEDIA`

Función:

**EXPLICAR → ACLARAR → AMPLIAR → RESPONDER**

Principio editorial:

**LA EXPLICACIÓN MÁS SENCILLA QUE SIGA SIENDO VERDADERA.**

## 9. PROHIBICIONES PEDAGÓGICAS

No añadir ejercicios, tareas, quiz, exámenes, evaluaciones, flashcards, gamificación, actividades, rutas obligatorias ni workbook.

Los ejemplos sirven para explicar; no son actividades.

## 10. SIN IMÁGENES

No añadir PNG, JPG, JPEG, WebP, GIF, SVG ilustrativo, screenshots, scans, thumbnails, video ni audio bibliográfico.

No descargar imágenes de fuentes ni almacenar páginas escaneadas como evidencia.

## 11. STYLE REFERENCES ≠ EVIDENCE SOURCES

Las referencias actuales utilizadas por R32 para calibrar voz, longitud, estructura, densidad, ejemplos, ritmo y tecnicismo son conceptualmente:

**STYLE REFERENCES**

No demuestran verdad.

Las nuevas fuentes externas son:

**EVIDENCE SOURCES**

y responden “¿de dónde sabemos esto?”.

Nunca mezclar ambos conceptos.

## 12. COMPATIBILIDAD DE APIs

Si `references` y `referenceCodes` actuales son necesarios para R32, conservarlos.

Añadir progresivamente campos explícitos como:

- `styleReferences`
- `evidenceSources`

No romper consumidores existentes por un renombrado prematuro.

## 13. SOURCE REGISTRY

Crear un registro normalizado de fuentes.

Entidad conceptual `Source`.

Campos mínimos sugeridos:

`sourceId, title, authors, institution, publicationYear, publicationDate, publisher, edition, journal, volume, issue, pages, articleNumber, isbn, issn, doi, url, sourceType, authorityTier, language, topics, accessedAt, createdAt, updatedAt, status`

No todos los campos son obligatorios para todos los tipos.

## 14. SOURCE ID

Usar identidad estable, por ejemplo:

`MLS-SRC-000001`

No utilizar títulos como primary key.

Deduplicar por identificadores fuertes cuando existan:

1. DOI;
2. ISBN;
3. canonical URL;
4. fingerprint normalizado cuando sea necesario.

## 15. SOURCE TIERS

- **TIER A:** fuente primaria, institucional u oficial.
- **TIER B:** fuente académica, monografía, journal, capítulo especializado o investigación revisada por pares.
- **TIER C:** fuente profesional reconocida.
- **TIER D:** fuente secundaria confiable.
- **TIER X:** no cuenta como evidencia suficiente: IA, contenido sin autoría, blogs desconocidos, agregadores o páginas sin trazabilidad.

El tier no reemplaza la evaluación de pertinencia para un claim concreto.

## 16. SOURCE POLICY POR IDIOMA

Crear políticas configurables por idioma:

- espanol guatemala
- ingles
- portugues
- italiano
- frances
- aleman
- japones
- chino taiwan
- coreano
- ruso

Cada política debe definir autoridades prioritarias, fuentes académicas recomendadas, fuentes permitidas, fuentes no aceptables, preferencias regionales y normas de variación.

## 17. CLAIM CLUSTERS

No crear un claim por cada oración.

Usar **CLAIM CLUSTERS**: unidades semánticas sustantivas que agrupan afirmaciones estrechamente relacionadas.

Ejemplo: formación del gerundio de *leer*: `leer → leyendo`, cambio `i → y` y contexto ortográfico pertinente.

## 18. GRANULARIDAD MAYOR

Crear claims más específicos cuando exista cifra, fecha, atribución, regla normativa, excepción, controversia, causalidad, afirmación histórica, estadística, diferencia regional o interpretación debatida.

No atomizar trivialidades.

## 19. CLAIM DATA MODEL

Entidad conceptual `EvidenceClaim`.

Campos sugeridos:

`claimId, entryCode, sectionKey, summary, claimType, status, createdAt, verifiedAt, verificationRevision`

## 20. EVIDENCE MAPPING

Crear relación normalizada claim ↔ source.

Entidad conceptual `EvidenceLink`.

Campos sugeridos:

`claimId, sourceId, supportType, locator, page, pageRange, chapter, section, paragraph, urlFragment, notes, verifiedAt, verificationMethod`

## 21. SUPPORT TYPE

Permitir:

- `supports`
- `partially_supports`
- `contextualizes`
- `contradicts`
- `primary_source`
- `secondary_interpretation`

No asumir que toda fuente apoya todo.

## 22. ANTI CITATION LAUNDERING

Prohibido:

ENTRY → buscar tres libros relacionados → añadir bibliografía → VERIFIED.

Proceso correcto:

**ENTRY → IDENTIFY CLAIM CLUSTERS → SEARCH SOURCES → READ RELEVANT EVIDENCE → MATCH SOURCE ↔ CLAIM → DETECT CONFLICTS → CORRECT ARTICLE → REVALIDATE → VERIFY**

## 23. SOURCE DISCOVERY ≠ VERIFICATION

Separar SOURCED de VERIFIED.

Encontrar una fuente relevante no demuestra correspondencia.

## 24. ESTADOS

Implementar mínimo:

- `UNSOURCED`
- `SOURCED`
- `VERIFIED`
- `REVIEWED`

UNSOURCED: evidence mapping insuficiente.  
SOURCED: fuentes candidatas o relevantes identificadas.  
VERIFIED: claim clusters principales contrastados y corregidos cuando corresponde.  
REVIEWED: revisión editorial posterior adicional.

## 25. ESTADOS PARCIALES

Registrar:

- `claimsTotal`
- `claimsVerified`
- `sourcesTotal`

Una entrada puede ser SOURCED con cobertura parcial.

No promover a VERIFIED mientras existan claims sustanciales pendientes según política.

## 26. EJEMPLOS CONSTRUIDOS

Los ejemplos pedagógicos creados por MLS no necesitan fuente externa por existir como ejemplo.

Marcar cuando corresponda:

`exampleType = constructed`

La regla que ilustran sí requiere evidencia.

## 27. PROVENANCE

Evidence responde “¿qué respalda esta información?”.

Provenance responde “¿cómo llegó esta versión a existir?”.

Registrar, cuando aplique:

`origin, generatedWithAI, provider, model, promptVersion, editorialStandard, runId, stagingRunId, snapshotVersion, snapshotCommit, sourceRevision, evidenceRevision, citationRendererVersion, generatedAt, verifiedAt, integratedAt`

## 28. APROVECHAR PROVENANCE EXISTENTE

GitHub Staging R32 ya persiste provenance en `wiki_article_provenance`.

No crear una segunda solución paralela sin inspeccionarla.

Extenderla o relacionarla limpiamente sin destruir datos existentes.

## 29. ARTICLE REVISION

No sobrescribir silenciosamente contenido verificado.

Introducir modelo de revisión solo si el esquema actual no puede representar adecuadamente:

- qué cambió;
- cuándo;
- qué fuente motivó el cambio;
- qué evidence revision lo respalda.

## 30. REVISIÓN EFICIENTE

No duplicar todo innecesariamente.

Antes de almacenar full snapshots por cada cambio, medir costo y evaluar una estrategia compacta.

Nunca sacrificar la auditoría crítica.

## 31. COPYRIGHT

No guardar libros, PDFs, papers completos, scans, capturas ni ebooks.

Guardar metadata, DOI, ISBN, URL, edición, capítulo, página, sección y locator.

Guardar extractos mínimos solo cuando sean necesarios y legalmente apropiados.

## 32. NO INVENTAR FUENTES

Nunca inventar autor, título, DOI, ISBN, URL, journal, editorial, edición, año, página ni cita textual.

Si no puede verificarse:

`sourceStatus = unresolved`

## 33. NO INVENTAR LOCALIZADORES

Una fuente válida sin página conocida es mejor que una página inventada.

No completar metadata por apariencia.

## 34. CONTRADICCIONES

Si fuentes confiables discrepan:

`evidenceConflict = true`

Registrar fuentes, claims, tipo de contradicción, contexto, resolución cuando exista y `needsReview` si requiere decisión humana/editorial.

No escoger silenciosamente.

## 35. VARIACIÓN LINGÜÍSTICA

No tratar diferencias legítimas como contradicciones automáticas.

Distinguir:

- regional variation;
- standard variation;
- register variation;
- historical variation.

Preservar cautela R32 sobre variantes y voseo.

## 36. AUTOOPT

Evidence & Provenance no reemplaza AUTOOPT.

AUTOOPT continúa observando longitud, secciones, style references, validaciones, fallos, publicaciones, estructura e intentos.

Evidence introduce un eje distinto.

## 37. AUTOOPT NO CERTIFICA VERDAD

AUTOOPT puede observar, en una fase posterior, métricas como sourceCount, claimsVerified, evidenceFailure y verificationAttempts.

No puede decidir si una afirmación es verdadera.

Nunca reinterpretar `firstPassSuccessRate` como accuracy.

## 38. NO MEZCLAR VERSIONES

Mantener versionado separado:

- `autooptVersion`
- `promptVersion`
- `editorialStandard`
- `evidenceVersion`
- `citationRendererVersion`

Una nueva semántica requiere versión nueva.

## 39. EVIDENCE VERSION

Introducir:

`evidenceVersion = 1.0`

Cambiarla cuando cambien reglas semánticas incompatibles.

## 40. CHAT NATIVE

Todo flujo principal debe poder manejarse desde ChatGPT sin Work.

Diseñar Actions/API para operaciones como:

- `MLS evidence estado`
- `MLS evidence entrada <code>`
- `MLS fuentes entrada <code>`
- `MLS investigar entrada <code>`
- `MLS verificar entrada <code>`
- `MLS evidence siguientes N`
- `MLS evidence continuar <runId>`
- `MLS evidence cancelar <runId>`

Los nombres finales pueden ajustarse tras inspeccionar APIs.

## 41. INVESTIGAR ENTRADA

Conceptualmente `MLS investigar entrada MLS-V10-0020` debe:

1. obtener entrada;
2. obtener metadata;
3. identificar claim clusters;
4. obtener source policy;
5. consultar Source Registry;
6. localizar fuentes candidatas si hace falta;
7. comprobar metadata;
8. relacionar claims con fuentes;
9. detectar claims sin respaldo;
10. detectar discrepancias;
11. devolver propuesta.

No publicar automáticamente.

## 42. VERIFICAR ENTRADA

Debe:

1. cargar artículo;
2. cargar claims;
3. cargar evidence;
4. comprobar correspondencia;
5. identificar conflictos;
6. corregir texto si las fuentes lo exigen;
7. ejecutar validación editorial R32/R33;
8. ejecutar evidence validation;
9. guardar revisión;
10. actualizar provenance;
11. actualizar status.

## 43. NO PERMITIR VERIFIED SIN EVIDENCIA

El backend debe impedir `status = VERIFIED` si no se cumplen condiciones mínimas deterministas.

No confiar solo en instrucciones al modelo.

## 44. EVIDENCE VALIDATOR

Separar tres capas:

**Editorial Validator:** contrato, estructura, longitud, formato y estilo.  
**Evidence Validator:** claim coverage, source existence, metadata, evidence mapping, locators requeridos, conflictos, tiers y estado.  
**APA Validator:** integridad y renderizado bibliográfico según el tipo de fuente.

## 45. REVALIDAR DESPUÉS DE MODIFICAR TEXTO

Si Evidence modifica un artículo, debe regresar por Editorial Validation antes de publicación.

Evidence no se salta R32.

## 46. GITHUB

GitHub no es runtime DB de Evidence.

D1 puede almacenar sources, claims, evidence links, verification, revisions y runtime status.

GitHub conserva schemas, contracts, source policies, documentación, compact snapshots, staging y configuración versionada.

## 47. GITHUB STAGING

Extender el staging actual cuando sea apropiado.

Preservar:

- HEAD esperado;
- tree/commit/ref;
- `force:false`;
- retry después de reconciliación;
- snapshot fijado por commit;
- no fallback silencioso.

## 48. NO UN ARCHIVO POR CLAIM

Prohibido generar decenas de miles de archivos individuales de claims.

Usar D1 para runtime.

Si Evidence requiere representación Git, usar shards compactos.

## 49. SHARDING

Ejemplo conceptual:

```
evidence/
  espanol guatemala/
    0001 0100.json
    0101 0200.json
sources/
  espanol guatemala/
    0001 0250.json
```

Ajustar tamaño mediante benchmark. Los nombres finales deben seguir las convenciones seguras del repositorio.

## 50. LÍMITES GITHUB

Evitar directorios gigantes, manifests monolíticos, miles de pequeños commits, archivos enormes e históricos staging eternos.

## 51. BATCH WRITES

Separar:

`EDITORIAL UNIT = 1 entry`

de:

`GITHUB WRITE UNIT = batch`

No hacer un commit por entry salvo necesidad concreta.

## 52. PILOTO

No migrar las 10,133 entradas inmediatamente.

Primera implementación: aproximadamente 20 entradas representativas de distintos idiomas, niveles, familias AUTOOPT, tamaños y tipos de regla.

## 53. ESCALAMIENTO

Usar gates:

**20 → 100 → 500 → 1000 → resto del corpus**

No pasar al siguiente gate sin medir el anterior.

## 54. MÉTRICAS DEL PILOTO

Medir:

`entriesProcessed, sourcesCreated, sourceDeduplication, claimsTotal, claimsVerified, evidenceLinks, evidenceConflicts, needsReview, verificationAttempts, D1RowsRead, D1RowsWritten, GitHubRequests, GitHubMutations, repoSizeDelta, averageEvidenceBytesPerEntry, averageSourcesPerEntry`

## 55. NO QUALITY SCORE ÚNICO

No crear un `quality = 92%` ambiguo.

Separar:

- editorialStatus;
- evidenceStatus;
- claimCoverage;
- sourceAuthority;
- freshness;
- reviewStatus.

## 56. INTERFAZ DEL LECTOR

Mantener lectura limpia.

Añadir una sección discreta **Fuentes y fundamento** con fuentes principales, estado de verificación y última revisión.

Claims delicados pueden usar referencias inline discretas.

## 57. NO HACER MLS PARECER UN PAPER

Las fuentes aumentan confianza sin destruir legibilidad.

MLS sigue siendo enciclopedia.

## 58. ESTADO VISIBLE

Usar lenguaje legible:

- Fundamentación pendiente
- Fuentes identificadas
- Verificado con fuentes
- Revisado

Evitar alarmar innecesariamente.

## 59. VIRTUOSO

Virtuoso debe poder conocer `evidenceStatus`, fuentes y verification revision.

Debe distinguir entre contenido pendiente y contenido verificado.

No debe presentar SOURCED como VERIFIED.

## 60. VIRTUOSO NO CONSULTA GITHUB EN CADA PREGUNTA

Runtime primero: D1, índices y corpus.

GitHub es versionado y staging.

## 61. PROFESOR IA

Profesor IA puede usar Evidence como contexto adicional.

No debe decir “está comprobado” solo porque existe una fuente asociada.

Debe respetar `evidenceStatus`.

## 62. SEARCH

En el futuro, cuando relevancia sea equivalente, búsqueda puede favorecer VERIFIED sobre UNSOURCED.

No ocultar automáticamente contenido pendiente.

## 63. FREE ONLY

Mantener:

- `zeroCost = true`
- `freeOnly = true`

No añadir OpenAI API, APIs académicas pagadas, bases bibliográficas pagadas, crawling pagado, embeddings pagados ni storage pagado.

## 64. FUENTES ONLINE

Priorizar fuentes gratuitamente consultables cuando sea posible.

FREE ACCESS ≠ LOW AUTHORITY.

Una obra académica sigue siendo válida aunque MLS no aloje su texto completo.

## 65. RATE LIMITS

Todo servicio externo usado para metadata o búsqueda debe respetar rate limits, Retry After, backoff, cache y deduplicación.

## 66. SOURCE CACHE

Antes de buscar nuevamente una fuente:

**CHECK SOURCE REGISTRY**

Reducir requests, trabajo, duplicación e inconsistencias.

## 67. MASTER BIBLIOGRAPHY

Antes de migración masiva crear bibliografía base por idioma/familia, por ejemplo:

- Gramática
- Ortografía
- Léxico
- Pronunciación
- Variación
- CEFR / competencia

No empezar cada entrada desde cero en Internet.

## 68. SOURCE POOLS

Cada entrada debe consultar primero un `approvedSourcePool` derivado de idioma, familia, nivel y tema.

Ampliar búsqueda solo cuando sea insuficiente.

## 69. GOLDEN EVIDENCE SET

Crear durante piloto un pequeño conjunto VERIFIED + REVIEWED como referencia metodológica.

No confundirlo con styleReferences.

## 70. FRESHNESS

Registrar cuando corresponda:

- `lastVerifiedAt`
- `sourcePublicationYear`
- `reviewDueAt`
- `freshnessClass`

No todos los temas requieren la misma frecuencia.

## 71. CAMBIOS EN FUENTES

Si una fuente desaparece, cambia URL, se reemplaza o recibe nueva edición, no invalidar automáticamente la entrada.

Marcar para revisión cuando corresponda.

## 72. FUENTES INSTITUCIONALES

Cuando una institución actualiza un recurso bajo URL estable, preservar edition/version/date cuando sea posible.

Una URL estable no implica contenido eternamente idéntico.

## 73. HISTORICAL EVIDENCE

No inventar historial anterior.

Si no se conoce `firstVerificationAttempt`, no inferirlo.

## 74. IDEMPOTENCIA

Repetir la misma operación debe devolver el mismo estado cuando corresponda.

Evitar duplicar Source, Claim, EvidenceLink, Revision, verification event o staging commit.

Usar hashes y fingerprints apropiados.

## 75. CONCURRENCIA

Dos chats pueden verificar la misma entrada.

Solo una revisión puede convertirse en nueva canonical revision.

La otra debe reconcile, preserve o requerir review.

Nunca sobrescribir silenciosamente.

## 76. REPO CONTEXT SAFETY

Antes de cualquier escritura verificar:

- `SYSTEM = MLS`
- `REPOSITORY = dpidiaz/llmchatmls`
- `DOMAIN = language`
- branch;
- HEAD.

## 77. ZERO TRUST REPOSITORY CONTEXT

**EL CHAT DECLARA INTENCIÓN. EL REPOSITORIO DEMUESTRA IDENTIDAD.**

Si existe mismatch:

`REPO_CONTEXT_MISMATCH`

y detener escritura.

## 78. NO TOCAR OTROS REPOSITORIOS

Este prompt autoriza únicamente `dpidiaz/llmchatmls`.

No crear ni modificar repositorios MKS como parte de R33.

## 79. MIGRACIONES D1

Toda migración debe ser aditiva, idempotente, versionada, reversible cuando sea razonable y probada localmente primero.

No destruir tablas R32.

## 80. ESQUEMA CANDIDATO

Evaluar nombres como:

- `wiki_sources`
- `wiki_evidence_claims`
- `wiki_evidence_links`
- `wiki_evidence_reviews`
- `wiki_article_revisions`

No asumirlos sin inspeccionar schema actual.

Reutilizar estructuras existentes cuando sea mejor.

## 81. ÍNDICES D1

Diseñar índices según consultas reales.

Posibles claves:

`entry_code, source_id, claim_id, status, language, family, verified_at`

No crear índices redundantes.

## 82. STORAGE EFFICIENCY

No duplicar bibliografía en cada entrada.

Una fuente se registra una vez y las entradas referencian `sourceId`.

## 83. NO DUPLICAR ARTÍCULO EN EVIDENCE

Evidence no almacena otra copia completa del artículo salvo que revision history lo requiera.

Referenciar revisión.

## 84. SIZE BUDGET

Reportar:

- D1 growth;
- GitHub delta;
- source metadata bytes;
- evidence metadata bytes.

Si Evidence empieza a duplicar significativamente el corpus, rediseñar.

## 85. QA

Crear tests como mínimo para:

- Source deduplication;
- invalid DOI;
- invalid ISBN;
- UNSOURCED default;
- SOURCED transition;
- VERIFIED requirements;
- unresolved claims;
- contradictory sources;
- idempotent verification;
- concurrent verification;
- revision creation;
- no silent overwrite;
- styleReferences ≠ evidenceSources;
- AUTOOPT unchanged;
- GitHub Staging unchanged;
- FREE ONLY;
- repo identity;
- no images;
- no exercises;
- APA metadata/render separation;
- no invented locators;
- citation versioning.

## 86. REGRESSION

Inspeccionar primero `package.json`.

Como mínimo revisar y, si siguen vigentes, ejecutar:

```sh
npm run test:chat-editorial
npm run qa:baseline
npm run predeploy
npm run check
```

más los nuevos tests.

No asumir nombres si el repositorio cambió.

## 87. NO DEPLOY COMO TEST

No ejecutar deploy remoto únicamente para probar build.

Usar dry run/predeploy/check.

Deploy solo cuando esté autorizado.

## 88. DOCUMENTACIÓN

Mantener documentación oficial bajo:

`docs/evidence y provenance/`

Documentar propósito, schema, estados, Source Registry, claims, EvidenceLinks, provenance, migration, chat commands, GitHub integration, D1 impact, QA, rollback, APA, perfil URL y limitaciones.

## 89. LIMITACIONES

Documentar explícitamente:

- una fuente no garantiza verdad absoluta;
- varias fuentes pueden discrepar;
- verificación automática tiene límites;
- autoridad depende del contexto;
- metadata puede cambiar;
- no todo claim necesita fuente separada;
- no toda fuente es igualmente fuerte;
- IA no sustituye revisión crítica.

## 90. FASE 0 — AUDITORÍA

Antes de implementación entregar:

- CURRENT ARCHITECTURE
- REUSABLE COMPONENTS
- CONFLICTS
- SCHEMA OPTIONS
- RECOMMENDED DESIGN
- RISKS
- SIZE IMPACT ESTIMATE
- D1 IMPACT ESTIMATE
- GITHUB IMPACT ESTIMATE

## 91. FASE 1 — FOUNDATION

Implementar solamente:

- Source Registry;
- Evidence status;
- Claim model;
- EvidenceLink model;
- Provenance extension;
- deterministic validation;
- structured bibliographic metadata;
- APA renderer/validator foundation.

Sin migración masiva.

## 92. FASE 2 — PILOTO 20

Seleccionar aproximadamente 20 entradas diversas.

No cherry pick únicamente casos fáciles.

## 93. FASE 3 — EVALUACIÓN

Medir:

- accuracy of source matching;
- manual review burden;
- false matches;
- conflicts;
- storage;
- API usage;
- D1 usage;
- GitHub writes;
- runtime impact;
- APA render correctness.

## 94. FASE 4 — 100

Solo si piloto estable.

## 95. FASE 5 — 500

Solo si 100 estable.

## 96. FASE 6 — MIGRACIÓN MASIVA

Solo después de demostrar correctness, idempotency, storage viability, source reuse, GitHub viability, D1 viability y operación chat native.

## 97. NO BLOQUEAR MLS POR R33

UNSOURCED sigue siendo usable como entrada R32.

R33 añade confianza; no hace desaparecer contenido legítimo durante migración.

## 98. NUEVAS ENTRADAS DESPUÉS DE R33

Una vez estabilizado R33, evaluar si nuevas entradas deben nacer source first en vez de generate first.

No cambiarlo antes del piloto.

## 99. FUTURA REGLA SOURCE FIRST

Objetivo eventual:

**TARGET → APPROVED SOURCES → DRAFT → EDITORIAL VALIDATION → EVIDENCE VALIDATION → PUBLICATION**

## 100. AUTOOPT FUTURO

Después de R33 estable, AUTOOPT puede observar sourceCoverage, verificationAttempts, evidenceFailurePatterns, averageSources y claimsPerEntry como métricas descriptivas.

No implementar prematuramente.

## 101. PRINCIPIOS FUNDACIONALES

- ENCYCLOPEDIA, NOT COURSE.
- NO EXERCISES.
- NO IMAGES.
- TEXT FIRST.
- AI PRODUCES; SOURCES SUBSTANTIATE.
- STYLE REFERENCES ARE NOT EVIDENCE SOURCES.
- SOURCED IS NOT VERIFIED.
- AUTOOPT OBSERVES; IT DOES NOT CERTIFY TRUTH.
- NEVER INVENT SOURCES.
- NEVER INVENT LOCATORS.
- NEVER FAKE CONFIDENCE.
- NEVER SILENTLY OVERWRITE.
- PRESERVE R32.
- R33 IS ADDITIVE.
- GITHUB IS VERSION CONTROL, NOT RUNTIME DATABASE.
- D1 HOLDS OPERATIONAL EVIDENCE STATE.
- CHAT NATIVE.
- WORK INDEPENDENT.
- FREE ONLY.
- MEASURE BEFORE SCALING.

## 102. CHECKPOINT FORMAT

Después de cada checkpoint devolver:

```
STATUS
SYSTEM
REPOSITORY
BRANCH
HEAD
DONE
CURRENT
NEXT
BLOCKERS
DECISIONS
AUTOOPT IMPACT
R32 COMPATIBILITY
EVIDENCE STATUS
SOURCES CREATED
CLAIMS CREATED
CLAIMS VERIFIED
CONFLICTS
NEEDS REVIEW
D1 IMPACT
GITHUB IMPACT
SIZE DELTA
FILES TOUCHED
TESTS
COMMIT SHA
PR
```

Además actualizar el Roadmap oficial antes de cerrar el checkpoint.

## 103. INSTRUCCIÓN FINAL DE ESCALAMIENTO

No empezar intentando verificar 10,133 entradas.

**INSPECT REAL REPOSITORY → UNDERSTAND R32 → UNDERSTAND AUTOOPT → UNDERSTAND GITHUB STAGING → DESIGN EVIDENCE SCHEMA → IMPLEMENT FOUNDATION → TEST → PILOT 20 → MEASURE → CORRECT → 100 → 500 → 1000 → SCALE**

La meta no es poner bibliografías decorativas al final de las entradas.

MLS debe poder responder con integridad:

**QUÉ AFIRMA · QUÉ FUENTE LO RESPALDA · QUÉ TODAVÍA NO SABEMOS · CÓMO SE PRODUJO ESA VERSIÓN · POR QUÉ PODEMOS CONFIAR EN ELLA**

---

# EXTENSIÓN BIBLIOGRÁFICA OBLIGATORIA

## 104. ESTÁNDAR BIBLIOGRÁFICO

Toda referencia presentada por MLS Evidence & Provenance debe cumplir la edición oficial vigente de APA.

Implementación inicial:

- `citationStyle = APA`
- `citationEdition = 7`

A septiembre de 2026, APA sigue identificando la séptima edición como la fuente oficial de APA Style.

No utilizar estilos improvisados.

## 105. PERFIL INSTITUCIONAL — UNIVERSIDAD RAFAEL LANDÍVAR

Incorporar un perfil institucional inicial:

`institutionalCitationProfile = URL_GUATEMALA`

Tomar en cuenta las orientaciones vigentes de Universidad Rafael Landívar, especialmente Biblioteca/VRIP/Diged y guías institucionales aplicables.

Documento institucional base inicial:

**Guía para citar obras en el sistema de la American Psychological Association (APA), segunda edición 2025, Universidad Rafael Landívar.**

URL pública de referencia:
`https://biblioteca.url.edu.gt/vrip/guia-para-citar-obras-en-el-sistema-de-la-american-psychological-association-apa/`

El perfil debe poder actualizarse cuando URL publique una versión posterior.

## 106. JERARQUÍA DE NORMAS

Cuando exista duda:

1. edición oficial vigente del Publication Manual de APA;
2. guía APA vigente de Universidad Rafael Landívar;
3. lineamientos académicos específicos de facultad/departamento/modalidad cuando existan;
4. configuración interna de presentación de MLS.

Una regla interna de MLS no sobrescribe silenciosamente una norma superior.

Si lineamientos aplicables entran en conflicto:

`citationPolicyConflict = true`

## 107. APA ES PRESENTACIÓN; SOURCE REGISTRY ES IDENTIDAD

No guardar la referencia APA renderizada como identidad canónica.

Arquitectura:

**SOURCE METADATA → NORMALIZATION → VALIDATION → APA RENDERER → APA REFERENCE**

Nunca:

`APA STRING = DATABASE SOURCE IDENTITY`

Así se puede corregir el formato o migrar a una edición futura sin alterar evidencia histórica.

## 108. VERSIONADO DEL ESTILO DE CITACIÓN

Registrar:

- `citationStyle`
- `citationEdition`
- `citationProfile`
- `citationRendererVersion`

Ejemplo:

```
citationStyle = APA
citationEdition = 7
citationProfile = URL-GT-2025
citationRendererVersion = 1.0
```

Si aparece una nueva edición APA, no migrar silenciosamente.

Primero:

**AUDIT → COMPATIBILITY ANALYSIS → NEW CITATION VERSION → TEST → CONTROLLED MIGRATION**

## 109. APA VALIDATOR

Crear una capa APA Validator distinta del Editorial Validator y Evidence Validator.

Comprobar según el tipo de fuente:

- autoría;
- autor institucional;
- fecha;
- título;
- capitalización;
- cursivas;
- editorial;
- revista;
- volumen;
- número;
- páginas;
- article number;
- DOI;
- URL;
- edición;
- obra dentro de otra obra;
- capítulos;
- páginas web;
- documentación institucional;
- obras de referencia;
- tesis;
- informes;
- datasets;
- estándares.

No imponer campos que APA no exige para ese tipo.

## 110. DOI Y URL

Cuando exista DOI válido y aplicable, preferir DOI normalizado.

Nunca inventar DOI.

No reconstruir DOI por apariencia.

URLs deben ser reales, verificadas, canónicas cuando sea posible y sin tracking innecesario.

**SOURCE VALIDITY ≠ APA FORMAT VALIDITY**

Validarlas por separado.

## 111. CITAS EN TEXTO

Evidence & Provenance debe poder generar, cuando sea necesario:

- `parentheticalCitation`
- `narrativeCitation`

siguiendo APA vigente.

La UI no necesita citar cada oración.

Usar citas inline cuando exista una atribución importante, afirmación delicada, evidence detail o exportación académica.

## 112. LOCALIZADORES Y CITAS TEXTUALES

Cuando sea necesario conservar:

- page;
- pageRange;
- chapter;
- section;
- paragraph;
- table;
- figure;
- timestamp;
- urlFragment.

No inventar páginas.

No exigir paginación a fuentes que no la tienen.

Los locators pertenecen al EvidenceLink, no a la identidad global de Source.

## 113. BIBLIOGRAFÍA PARA EL LECTOR

La sección **Fuentes y fundamento** debe poder mostrar referencias APA y, de forma limpia:

- estado de verificación;
- última verificación;
- fuentes principales;
- fuentes complementarias cuando proceda.

No saturar el cuerpo enciclopédico.

## 114. FLUJO ACADÉMICO URL

Evidence & Provenance debe ser compatible con un flujo académico de investigación:

**IDENTIFICAR INFORMACIÓN → LOCALIZAR FUENTES → EVALUAR AUTORIDAD → REGISTRAR DATOS BIBLIOGRÁFICOS → LEER EVIDENCIA PERTINENTE → RELACIONAR EVIDENCIA CON CLAIMS → CITAR → CONSTRUIR REFERENCIAS → REVISAR CORRESPONDENCIA → VALIDAR → DOCUMENTAR PROCEDENCIA**

No reducir investigación a SEARCH → COPY REFERENCE.

Una referencia perfectamente formateada no demuestra verificación académica.

## 115. EXPORTACIÓN ACADÉMICA

Diseñar el schema para permitir en el futuro, sin reconstruir metadata:

- APA bibliography;
- APA in text citation;
- evidence report;
- source report;
- verification report.

No es obligatorio implementar todas las exportaciones en Foundation R33.

## 116. REGLA FUNDAMENTAL DE CITACIÓN

Añadir a los principios fundacionales:

- APA FORMATTING IS NOT EVIDENCE.
- A PERFECTLY FORMATTED REFERENCE CAN STILL BE A BAD SOURCE.
- A STRONG SOURCE CAN STILL BE MAPPED TO THE WRONG CLAIM.
- SOURCE METADATA MUST BE STRUCTURED.
- APA MUST BE GENERATED FROM VERIFIED METADATA.
- NEVER INVENT BIBLIOGRAPHIC DATA.
- NEVER INVENT DOI.
- NEVER INVENT ISBN.
- NEVER INVENT PAGE NUMBERS.
- NEVER INVENT AUTHORS.
- NEVER INVENT PUBLICATION DATES.
- NEVER CONVERT SEARCH RESULTS DIRECTLY INTO VERIFIED EVIDENCE.
- FOLLOW CURRENT APA EDITION.
- FOLLOW URL GUATEMALA INSTITUTIONAL GUIDANCE.
- VERSION CITATION RULES.
- PRESERVE HISTORICAL CITATION PROVENANCE.

---

## REFERENCIAS NORMATIVAS INICIALES

American Psychological Association. *Publication Manual of the American Psychological Association* (7th ed.). Fuente oficial de APA Style:  
`https://www.apa.org/pubs/books/publication-manual-7th-edition-paperback`

Universidad Rafael Landívar. *Guía para citar obras en el sistema de la American Psychological Association (APA)*, segunda edición 2025.  
`https://biblioteca.url.edu.gt/vrip/guia-para-citar-obras-en-el-sistema-de-la-american-psychological-association-apa/`

Estas referencias gobiernan el diseño del renderer/citation policy, pero no reemplazan el Source Registry ni constituyen evidence sources automáticas para cada entrada lingüística.
