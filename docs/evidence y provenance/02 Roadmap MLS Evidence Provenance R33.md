# ROADMAP — MLS EVIDENCE & PROVENANCE R33

Estado del documento: VIVO  
Repositorio: `dpidiaz/llmchatmls`  
Base funcional: MLS R32  
Programa: Evidence & Provenance R33  
Última actualización: 2026-09-21  
Responsable operativo: implementación chat native sobre el repositorio real

---

## 1. PROPÓSITO DEL ROADMAP

Este archivo es la fuente de seguimiento de R33.

Debe consultarse:

- antes de comenzar cualquier cambio R33;
- antes de modificar schema D1;
- antes de tocar GitHub Staging;
- antes de añadir endpoints;
- antes de iniciar un gate de migración;
- antes de declarar un checkpoint cerrado.

Debe actualizarse:

- después de cada checkpoint;
- cuando cambie una decisión arquitectónica;
- cuando aparezca un bloqueo;
- cuando un gate se abra o se cierre;
- cuando cambien HEAD, branch, tests o impacto medido.

No utilizar la memoria conversacional como única fuente de estado.

---

## 2. ESTADO GLOBAL

**Estado actual: FASE 4B — GITHUB-NATIVE BENCHMARK 100 READY / GATE 500 BLOCKED**

Progreso global inicial:

| Fase | Estado | Gate |
| --- | --- | --- |
| Documentación contractual R33 | COMPLETE | Prompt y roadmap versionados |
| Fase 0 Auditoría | COMPLETE | Arquitectura y schema recomendados |
| Fase 1 Foundation | COMPLETE | Foundation R33 certificada |
| Fase 2 Piloto 20 | COMPLETE — PASS WITH FINDINGS | 20/20 procesadas; Fase 3 obligatoria |
| Fase 3 Evaluación | COMPLETE — GO | E1–E5 cerrados; E3 REVIEWED humano live |
| Fase 4 Gate 100 | COMPLETE — PASS QUALITY / CORRECT AND REPEAT SCALE | 100/100 VERIFIED; 0 excepciones; read amplification requiere corrección |
| Fase 4B Benchmark GitHub-native 100 | READY / AUTHORIZED | 100 entradas frescas; R33 Farm R2; 0 D1/Cloudflare editorial obligatorio |
| Fase 5 Gate 500 | BLOCKED / NOT AUTHORIZED | Requiere cierre favorable del benchmark GitHub-native 100 |
| Fase 6 Gate 1000 | NOT STARTED | 1000 estables |
| Fase 7 Escalamiento corpus | NOT STARTED | Viabilidad demostrada |
| Source first para nuevas entradas | DEFERRED | Después de R33 estable |
| AUTOOPT Evidence metrics | DEFERRED | Después de R33 estable |

R33 no está autorizado a saltar directamente a migración masiva.

---

## 3. BASELINE DE REPOSITORIO

Contexto inspeccionado al crear este roadmap:

- SYSTEM: MLS
- REPOSITORY: `dpidiaz/llmchatmls`
- DOMAIN: language
- BASE BRANCH: `main`
- BASE HEAD: `47c720005bfc0a3ceab1aad46079d4db913ffb61`
- DOCUMENTATION BRANCH: `r33-evidence-provenance-docs`

Antes de nuevas escrituras volver a verificar HEAD y branch.

Si el repositorio no coincide:

`REPO_CONTEXT_MISMATCH`

y detener.

---

## 4. HALLAZGOS CONFIRMADOS DE FASE 0

### 4.1 AUTOOPT

Confirmado:

- AUTOOPT 1.0 es observacional.
- No redacta ni verifica verdad.
- `firstPassSuccessRate` no equivale a accuracy.
- Su versionado ya separa `autooptVersion` y `promptVersion`.
- R33 debe añadir `evidenceVersion` sin reinterpretar historial.

### 4.2 Style references

Confirmado:

- R32 utiliza `references` y `referenceCodes` para calibración editorial.
- Esas referencias no son evidencia bibliográfica.
- R33 debe conservar compatibilidad y añadir conceptos explícitos de evidence.

### 4.3 GitHub Staging

Confirmado:

- rama de datos separada;
- snapshot fijado por `snapshotVersion` y `snapshotCommit`;
- commits sobre HEAD esperado;
- `force:false`;
- reconciliación contra D1;
- GitHub no es fallback silencioso;
- D1 no es fallback silencioso;
- start/next/status/validate/stage/cancel staging no consumen D1;
- snapshot e integración sí pueden usar D1.

### 4.4 Provenance existente

Confirmado:

`wiki_article_provenance` ya registra:

- code;
- origin;
- standard;
- prompt_version;
- staging_run_id;
- snapshot_version;
- snapshot_commit;
- staged_at;
- integrated_at;
- source_audit_model;
- recorded_at.

R33 debe extender o relacionar esta estructura, no duplicarla sin razón.

### 4.5 Publicación canónica

Confirmado:

- `wiki_articles.code` actúa como identidad canónica existente.
- staging preserva artículos ajenos como `preservedExisting`.
- no debe etiquetarse provenance staging si el `audit_model` no coincide.

### 4.6 QA y deploy

Scripts actualmente presentes:

- `npm run test:chat-editorial`
- `npm run qa:baseline`
- `npm run predeploy`
- `npm run check`
- `npm run recovery:verify`

`npm run deploy` despliega realmente y no se utiliza como test.

---

## 5. DECISIONES ARQUITECTÓNICAS VIGENTES

| ID | Decisión | Estado |
| --- | --- | --- |
| R33 D001 | Evidence es una capa distinta de AUTOOPT | LOCKED |
| R33 D002 | Style references y evidence sources son conceptos distintos | LOCKED |
| R33 D003 | R32 sigue usable con `UNSOURCED` | LOCKED |
| R33 D004 | GitHub guarda el estado editorial canónico de Evidence, Sources, provenance y coordinación | LOCKED |
| R33 D005 | Cloudflare/D1 quedan fuera del proceso editorial; solo pueden consumir artefactos GitHub consolidados en deploy/serving | LOCKED |
| R33 D006 | No un archivo Git por claim | LOCKED |
| R33 D007 | Source Registry normalizado y deduplicado | LOCKED |
| R33 D008 | VERIFIED requiere reglas backend deterministas | LOCKED |
| R33 D009 | APA renderizado deriva de metadata estructurada | LOCKED |
| R33 D010 | APA inicial = 7; perfil institucional = URL Guatemala 2025 | LOCKED |
| R33 D011 | No migración masiva antes de gates | LOCKED |
| R33 D012 | FREE ONLY $0.00 | LOCKED |
| R33 D013 | No imágenes ni ejercicios | LOCKED |
| R33 D014 | Source first queda diferido hasta estabilizar R33 | LOCKED |
| R33 D015 | No deploy remoto como método de prueba | LOCKED |

Cambiar una decisión LOCKED requiere documentar motivo, impacto, compatibilidad y nueva versión semántica cuando corresponda.

---

# 6. FASE 0 — AUDITORÍA Y DISEÑO

**Estado: COMPLETE**

## Objetivo

Comprender completamente R32 y producir un diseño implementable de Foundation sin tocar todavía el corpus masivamente.

## Trabajo completado

- [x] Verificar identidad del repositorio.
- [x] Verificar rama `main`.
- [x] Inspeccionar AUTOOPT.
- [x] Inspeccionar contrato editorial.
- [x] Inspeccionar Chat Editorial.
- [x] Inspeccionar GitHub Staging.
- [x] Confirmar provenance existente.
- [x] Confirmar scripts QA/predeploy actuales.
- [x] Consolidar Master Prompt R33.
- [x] Incorporar APA 7 + perfil URL Guatemala 2025.
- [x] Crear roadmap vivo.

## Trabajo pendiente

Ninguno para el exit gate de Fase 0.

## Trabajo completado adicional

- [x] Inventariar DDL actual de `wiki_articles`, Chat Editorial, AUTOOPT, Semantic Audit y provenance.
- [x] Localizar `ensureWikiArticleProvenanceDb` y su schema exacto.
- [x] Inventariar superficie editorial/OpenAPI relevante.
- [x] Auditar Virtuoso y Profesor IA como consumidores futuros de Evidence.
- [x] Auditar semantic/full text search.
- [x] Auditar `canonical-entry.schema.json`.
- [x] Auditar Service Worker/offline: `/api/*` es network-only y la lectura canónica no depende de Evidence.
- [x] Medir corpus canónico: ~31.3 MB de entradas, ~3.1 KB/entrada.
- [x] Evaluar tres opciones de schema.
- [x] Seleccionar capa D1 normalizada separada.
- [x] Definir state machine UNSOURCED → SOURCED → VERIFIED → REVIEWED.
- [x] Definir guardas deterministas mínimas de VERIFIED.
- [x] Definir optimistic concurrency por generatedAt + articleHash + evidenceRevision.
- [x] Definir estructura conceptual de source policies.
- [x] Definir dedupe Source Registry por DOI/ISBN/URL/fingerprint.
- [x] Definir metadata APA + versionado de renderer.
- [x] Documentar impacto D1/GitHub/tamaño y unidades F1–F8.

Documento de cierre: `03 Fase 0 Arquitectura y diseño recomendado.md`.

## Deliverable de cierre

Debe producir:

```
CURRENT ARCHITECTURE
REUSABLE COMPONENTS
CONFLICTS
SCHEMA OPTIONS
RECOMMENDED DESIGN
RISKS
SIZE IMPACT ESTIMATE
D1 IMPACT ESTIMATE
GITHUB IMPACT ESTIMATE
```

## Exit gate

Fase 0 solo se cierra cuando existe una arquitectura Foundation suficientemente concreta para implementar sin inventar durante el coding.

---

# 7. FASE 1 — FOUNDATION

**Estado: COMPLETE**

## Alcance permitido

Implementar únicamente:

- Source Registry;
- Evidence status;
- Claim model;
- EvidenceLink model;
- Evidence review state;
- provenance extension/relationship;
- article revision minimum viable model;
- deterministic Evidence Validator;
- APA metadata normalization;
- APA renderer/validator foundation;
- source policy configuration;
- tests.

No migrar corpus completo.

## Schema candidates a evaluar

Nombres tentativos, no aprobados todavía:

- `wiki_sources`
- `wiki_evidence_claims`
- `wiki_evidence_links`
- `wiki_evidence_reviews`
- `wiki_article_revisions`

Debe decidirse si `wiki_article_provenance` se amplía o se relaciona con nuevas tablas.

## Progreso de implementación

- [x] F1 contracts: constantes Evidence/APA.
- [x] F1 schema: siete tablas aditivas y sus índices mínimos.
- [x] F1 identidad: articleHash SHA-256, Source/Claim/EvidenceLink IDs deterministas.
- [x] F1 normalización: DOI, ISBN y canonical URL.
- [x] F1 state machine base y optimistic concurrency 409.
- [x] F1 tests dedicados: 12 casos locales verdes.
- [x] F1 certificación completa del PR #125 contra main.
- [x] F2 Source Registry runtime/persistence; repository-certified.
- [x] F3 Claims and links persistence; repository-certified.
- [x] F4 State validator integrado; repository-certified.
- [x] F5 APA renderer/validator; repository-certified.
- [x] F6 Reviews/revisions.
- [x] F7 Private API/OpenAPI.
- [x] F8 Regression certification.
- [x] F9 Contract closure: source policies por los 10 idiomas.
- [x] F9 Contract closure: provenance R32+R33 compuesto explícitamente.
- [x] F9 Contract closure: repo identity / boundary contracts explícitos.

## Required tests

- [x] Source deduplication DOI.
- [x] Source deduplication ISBN.
- [x] Source deduplication canonical URL.
- [x] Fingerprint fallback.
- [x] Invalid DOI.
- [x] Invalid ISBN.
- [x] UNSOURCED default.
- [x] SOURCED transition.
- [x] VERIFIED hard guard.
- [x] Unresolved claims block VERIFIED.
- [x] Contradiction handling.
- [x] Idempotent verification.
- [x] Concurrent verification.
- [x] Revision creation.
- [x] No silent overwrite.
- [x] Style references remain distinct.
- [x] AUTOOPT unchanged.
- [x] GitHub Staging unchanged.
- [x] FREE ONLY.
- [x] Repo identity guard.
- [x] No image storage.
- [x] No exercises.
- [x] APA metadata/render separation.
- [x] Citation versioning.
- [x] No invented locator acceptance.

## Regression gate

Ejecutar scripts existentes que sigan vigentes tras inspeccionar `package.json`.

Mínimo esperado:

```sh
npm run test:chat-editorial
npm run test:evidence
npm run test:canonical-tools
npm run qa:baseline
npm run predeploy
npm run recovery:verify
node --test test/deploy-contract.test.cjs
npm run check
```

No deploy remoto.

## Exit gate

Foundation debe demostrar:

- additive schema;
- idempotent migrations;
- deterministic VERIFIED guard;
- zero R32 regression;
- zero paid dependency;
- no GitHub runtime dependency;
- storage estimate aceptable.

---

# 8. FASE 2 — PILOTO 20

**Estado: COMPLETE — PASS WITH FINDINGS (20/20)**

## Selección

Aproximadamente 20 entradas.

La muestra debe incluir:

- varios idiomas;
- varios niveles;
- varias familias AUTOOPT;
- reglas normativas;
- variación regional;
- ortografía;
- morfología;
- sintaxis;
- pronunciación cuando aplique;
- entradas cortas y extensas;
- al menos algunos casos potencialmente ambiguos o conflictivos.

No elegir solo casos fáciles.

### Muestra preparada

Manifest canónico: `docs/evidence y provenance/04 Pilot 20 Manifest.json`.

Plan operativo: `docs/evidence y provenance/03 Pilot 20 Plan.md`.

La muestra queda bloqueada en 20 entradas reales:

- 10 idiomas;
- 2 entradas por idioma;
- niveles A1, A2, B1, B2, C1, G1 y G4;
- ortografía, morfología, sintaxis, pronunciación, discurso, casos, opcionalidad y variación regional;
- 42,966 caracteres de artículo;
- mínimo 1,052; máximo 6,529;
- identidad fijada por Git blob SHA, `generatedAt` y metadata canónica.

Una entrada que cambie produce `PILOT_ENTRY_VERSION_MISMATCH`; no se sustituye silenciosamente.


## Flujo por entrada

```
LOAD ENTRY
→ CLAIM CLUSTERS
→ SOURCE POLICY
→ SOURCE REGISTRY FIRST
→ APPROVED SOURCE POOL
→ EXTERNAL DISCOVERY ONLY IF NEEDED
→ METADATA VALIDATION
→ READ RELEVANT EVIDENCE
→ EVIDENCE LINKS
→ CONFLICT CHECK
→ ARTICLE CORRECTION IF NEEDED
→ EDITORIAL REVALIDATION
→ EVIDENCE VALIDATION
→ REVISION
→ STATUS
```

## Métricas

Registrar:

- entriesProcessed;
- sourcesCreated;
- sourcesReused;
- sourceDeduplication;
- claimsTotal;
- claimsVerified;
- evidenceLinks;
- evidenceConflicts;
- needsReview;
- verificationAttempts;
- D1RowsRead;
- D1RowsWritten;
- GitHubRequests;
- GitHubMutations;
- repoSizeDelta;
- averageEvidenceBytesPerEntry;
- averageSourcesPerEntry;
- APA validation failures;
- manual review burden.

### Instrumentación preparada

- [x] `proposal` reporta Sources creadas/reutilizadas/actualizadas y operaciones de Claims/Links/conflictos.
- [x] Telemetry D1 por request distingue metadata exacta de filas meramente observadas.
- [x] `d1RowsRead/d1RowsWritten` permanecen `null` si Cloudflare no entrega metadata exacta.
- [x] Endpoint read-only `/api/wiki/editorial/evidence/metrics` calcula bytes lógicos Evidence.
- [x] Manifest integrity y telemetry tests verdes en run #316.
- [x] Full Foundation regression suite verde en run #316.
- [x] **Start gate live:** confirmado en producción con `exactRowsRead=true` y `exactRowsWritten=true` sobre `MLS-V10-0020` antes de iniciar el piloto.

El Pilot 20 está **COMPLETE**. Checkpoints 1–4 y 5–8: PASS. Checkpoints 9–12, 13–16 y 17–20: PASS WITH FINDINGS. Resultado final: 20/20 procesadas, 17 VERIFIED y 3 SOURCED sin VERIFIED. Siguiente fase obligatoria: Fase 3 — Evaluación.


## Exit gate

No avanzar si:

- existen falsos VERIFIED;
- dedupe es inestable;
- concurrencia sobrescribe;
- Evidence duplica demasiado el corpus;
- D1 impact es incompatible con FREE ONLY;
- APA metadata se pierde al renderizar;
- source discovery se confunde con verification.

---

# 9. FASE 3 — EVALUACIÓN

**Estado: COMPLETE — GO**

Documento de decisión: `10 Fase 3 Evaluacion Pilot 20.md`.

## Resultado

El Pilot 20 validó las garantías centrales:

- 20/20 entradas procesadas;
- 17 VERIFIED;
- 3 SOURCED bloqueadas correctamente;
- 53/55 claims sustanciales con cobertura suficiente;
- 1 conflicto sustantivo real detectado;
- 3 revisiones de artículo propuestas;
- 0 silent overwrite;
- 0 falsos VERIFIED observados;
- 0 fallos APA finales;
- FREE ONLY compatible con Pilot 20.

La decisión es:

`CORRECT AND REPEAT`

No se autoriza Gate 100 todavía.

## Correcciones E1–E5

- [x] **E1 DOI identity scope** — PASS LIVE, commands 0274–0279.
- [x] **E2 Cross-entry Source reuse** — PASS LIVE, commands 0269–0271.
- [x] **E3 Human REVIEWED lifecycle** — PASS LIVE; MLS-V10-0020 pasó VERIFIED → REVIEWED con aprobación humana explícita, command 0285.
- [x] **E4 Control-plane scaling** — PASS/MITIGATED; batch command 0280 procesó 3/3.
- [x] **E5 Consumer evidence contract** — PASS LIVE; command 0282 devolvió VERIFIED conservador por endpoint consumer.

## Repeat dirigido

No repetir las 20 entradas completas.

El repeat debe demostrar:

1. dos recursos granulares distintos con un DOI de contenedor compartido no colisionan;
2. DOI de recurso específico conserva dedupe por DOI;
3. reuse cross-entry devuelve el mismo Source ID;
4. REVIEWED humano funciona sobre snapshot VERIFIED vigente;
5. consumidores distinguen UNSOURCED / SOURCED / VERIFIED / REVIEWED;
6. full regression permanece verde.

Solo después del repeat se vuelve a emitir una decisión:

`GO`, `CORRECT AND REPEAT` o `STOP`.

---

# 10. FASE 4 — GATE 100

**Estado: COMPLETE — PASS QUALITY / CORRECT AND REPEAT SCALE**

Precondición Fase 3 = GO: cumplida.

Manifest canónico: `13 Gate 100 Manifest.json`.
Reporte final: `14 Gate 100 Final Report.md`.

Resultado certificado:

- 100/100 entradas completas;
- 100/100 VERIFIED;
- 0 excepciones finales;
- 0 needs_evidence;
- 0 external discovery pendiente;
- 0 conflictos actuales;
- 0 falsos REVIEWED humanos;
- 149 claims;
- 151 EvidenceLinks;
- 401,507 logical Evidence bytes;
- 134,214 D1 rows read durante ejecución;
- 2,099 D1 rows written durante ejecución.

Hallazgo de escala dominante:

- D1 reads/entrada: 1,342.14 frente a 461.6 en Pilot 20;
- Registry-first inicial: 47;
- external discovery requerido inicialmente: 52;
- control-plane commits/entrada: 0.64, mejora sustancial frente a Pilot 20.

Decisión:

`PASS QUALITY / CORRECT AND REPEAT SCALABILITY`

Gate 500 no está autorizado todavía.

Siguiente trabajo obligatorio:

1. reducir read amplification de `triageBatchEvidenceMLS`;
2. aumentar reuse efectivo Registry-first;
3. robustecer guardado concurrente del control plane;
4. ejecutar un Gate 100 Correction Repeat sobre muestra fresca y determinista;
5. reevaluar GO / CORRECT AND REPEAT / STOP antes de Gate 500.

---

## 10.1 BENCHMARK GITHUB-NATIVE R2 — 100 FRESCAS

**Estado: READY / AUTHORIZED — GATE 500 AÚN BLOQUEADO**

Motivo: el Correction Repeat histórico fue migrado a GitHub en PR #688, pero sus 100 artefactos conservan provenance `migratedFromD1Snapshot: true` y links con `locator: {}`. Esa migración valida compatibilidad, no una ejecución editorial fresca R2.

Pool canónico activo:

`docs/evidence y provenance/17 GitHub Native Benchmark 100 Pool.json`

Reglas:

- 100 entradas frescas, 10 por idioma;
- 0 solapamiento con Pilot 20, Gate 100 y Correction Repeat;
- selección determinista por cuantiles y blob SHA;
- GitHub única fuente editorial;
- 0 D1 reads/writes editoriales;
- 0 Cloudflare/Bridge/Workers AI como dependencia editorial;
- Evidence nuevo no puede declarar `migratedFromD1Snapshot`;
- locator claim-specific cuando el recurso ofrece página/capítulo/sección/fragmento estable; si no aplica, debe quedar justificado explícitamente;
- `REVIEWED` humano nunca se fabrica.

Criterio para abrir Gate 500:

```yaml
verified: 100%
exceptions: 0_or_controlled
falseVerified: 0_after_audit
cloudflareEditorialInteractions: 0
d1EditorialInteractions: 0
migratedFromD1Snapshot: 0
controlPlaneLostUpdates: 0
locatorPolicy: PASS
```

# 11. FASE 5 — GATE 500

**Estado: BLOCKED / NOT AUTHORIZED**

Precondición: Gate 100 estable y Correction Repeat favorable.

Objetivo: validar comportamiento a escala intermedia.

No aceptar crecimiento accidental de:

- archivos Git;
- commits por entry;
- D1 scans;
- duplicated source metadata;
- revisiones redundantes;
- unresolved queues sin política.

---

# 12. FASE 6 — GATE 1000

**Estado: NOT STARTED**

Precondición: 500 estable.

Objetivo: probar que arquitectura, costos y operación chat native son sostenibles antes del resto del corpus.

En este gate debe existir suficiente evidencia para estimar el costo total de las 10,133 entradas.

---

# 13. FASE 7 — ESCALAMIENTO DEL CORPUS

**Estado: NOT STARTED**

Solo después de demostrar:

- correctness;
- idempotency;
- concurrency safety;
- storage viability;
- D1 viability;
- GitHub viability;
- source reuse;
- policy stability;
- QA stability;
- chat native operation.

Escalar en lotes controlados.

Nunca usar “añadimos bibliografía” como criterio de completitud.

---

# 14. SOURCE FIRST PARA ENTRADAS NUEVAS

**Estado: DEFERRED**

No implementar antes del piloto.

Objetivo eventual:

```
TARGET
→ APPROVED SOURCES
→ DRAFT
→ EDITORIAL VALIDATION
→ EVIDENCE VALIDATION
→ PUBLICATION
```

Debe existir un cambio explícito de contrato/versionado antes de convertirlo en flujo canónico.

---

# 15. APA Y PERFIL URL

## Baseline vigente

- citationStyle: APA
- citationEdition: 7
- citationProfile: URL-GT-2025
- citationRendererVersion: 1.0 inicial

## Fuentes normativas iniciales

APA official Publication Manual 7th edition:
`https://www.apa.org/pubs/books/publication-manual-7th-edition-paperback`

Universidad Rafael Landívar, guía APA, segunda edición 2025:
`https://biblioteca.url.edu.gt/vrip/guia-para-citar-obras-en-el-sistema-de-la-american-psychological-association-apa/`

## Regla

APA formatting no es evidencia.

El renderer nunca sustituye metadata normalizada.

---

# 16. RIESGOS ABIERTOS

| Riesgo | Severidad inicial | Mitigación |
| --- | --- | --- |
| Citation laundering | Alta | Claim ↔ source mapping obligatorio |
| Falsos VERIFIED | Alta | Guard backend determinista |
| Fuentes inventadas | Alta | Metadata verification + unresolved |
| Locators inventados | Alta | Validación explícita |
| Source duplication | Media/Alta | DOI/ISBN/URL/fingerprint |
| D1 growth | Media | Benchmark por gate |
| GitHub file explosion | Alta | Runtime en D1 + shards compactos |
| Concurrency overwrite | Alta | Revision guard/reconcile |
| Confundir variation con contradiction | Alta | Source policies por idioma |
| APA string como canonical data | Media | Metadata estructurada + renderer |
| AUTOOPT reinterpretado como truth metric | Alta | Separación contractual |
| R32 regression | Alta | Additive migrations + regression suites |
| Auto deploy al hacer push de ramas | Media/Alta | Verificar integración Cloudflare/GitHub antes de ramas de implementación; distinguir push documental de autorización explícita de release |
| Paid API creep | Alta | FREE ONLY contract |
| Reader clutter | Media | Fuentes y fundamento discreto |
| Search bias excesivo | Media | VERIFIED solo desempata relevancia equivalente |
| Stale institutional source | Media | Version/date/freshness |

---

# 17. MÉTRICAS ACUMULADAS

Actualizar en cada checkpoint.

```yaml
entriesProcessed: 20
entriesVerified: 17
entriesSourcedNotVerified: 3
entriesSourcedNeedsReview: 1
entriesReviewedHuman: 1
sourcesCreated: 57
sourceReuseOperations: 3
sourceMetadataUpdates: 1
crossEntrySourceReuse: 1
claimsCreated: 55
claimReuseOperations: 2
claimsVerifiedByCoverage: 53
evidenceLinks: 81
evidenceLinkReuseOperations: 3
evidenceConflicts: 1
needsReview: 1
verificationAttempts: 17
verificationReviewsCreated: 17
articleRevisionsProposed: 3
articleRevisionsIntegrated: 0
d1RowsRead: 9232
d1RowsWritten: 1000
runtimeGitHubRequests: 0
runtimeGitHubMutations: 0
controlPlaneCommits: 197
controlBranchBlobDeltaBytes: 788553
githubTransportRequests: null
mainRepoEvidenceDataDeltaBytes: 0
logicalEvidenceBytes: 176399
averageD1RowsReadPerEntry: 461.6
averageD1RowsWrittenPerEntry: 50
averageEvidenceBytesPerEntry: 8819.95
averageSourcesPerEntry: 2.85
averageClaimsPerEntry: 2.75
averageEvidenceLinksPerEntry: 4.05
apaValidationFailures: 0
apaMetadataCorrectionsBeforeVerification: 1
manualHumanReviewEvents: 1
```

Notas:

- `sourceReuseOperations=3` incluye retries/enrichment idempotentes; `crossEntrySourceReuse=0` porque la misma Source no apareció de manera natural en dos entradas distintas.
- 17/20 entradas alcanzaron VERIFIED; las 3 restantes fueron bloqueadas por evidencia insuficiente o conflicto, no por fallo del runtime.
- 53/55 claims sustanciales alcanzaron cobertura suficiente.
- Los porcentajes del piloto son descriptivos, no una puntuación de accuracy.

No inventar números cuando no se hayan medido.

---

# 18. CHANGE LOG DEL ROADMAP

## 2026-09-22 — Pilot 20 COMPLETE — checkpoint 17–20 PASS WITH FINDINGS

- Entradas 17–20 procesadas y medidas.
- Entry 17 MLS-V08-0010: VERIFIED.
- Entry 18 MLS-V08-0875: SOURCED; claim de frecuencia académica insuficientemente respaldado; VERIFIED bloqueado; revisión propuesta.
- Entry 19 MLS-V09-0155: VERIFIED.
- Entry 20 MLS-V09-0825: VERIFIED.
- Bloque 17–20: 1,907 exact rows read / 215 exact rows written / 41,584 logical Evidence bytes.
- Resultado final Pilot 20: 17 VERIFIED, 3 SOURCED no VERIFIED, 0 REVIEWED humanos.
- 57 Sources creadas, 55 Claims, 81 EvidenceLinks, 1 conflicto sustantivo.
- 53/55 Claims con cobertura suficiente.
- 3 revisiones de artículo propuestas; 0 integradas.
- D1 total: 9,232 exact rows read / 1,000 exact rows written.
- Logical Evidence total: 176,399 bytes.
- FREE ONLY compatible con Pilot 20.
- Hallazgo de identidad: distinguir DOI específico de recurso vs DOI de obra/contenedor antes de Gate 100.
- Cross-entry Source reuse no fue observado en la muestra.
- Lifecycle REVIEWED humano no fue ejercitado live.
- Pilot 20 COMPLETE. Gate 100 NO autorizado hasta Fase 3.
- Documento detallado: `09 Pilot 20 Checkpoint 17 a 20.md`.

## 2026-09-21 / 2026-09-22 — E1 DOI scope implementado y certificado

- Añadido `doiScope = resource | container`.
- `resource`: DOI mantiene identidad primaria.
- `container`: canonical URL granular identifica la Source; DOI se conserva como metadata.
- `container` sin canonical URL falla cerrado.
- Migración D1 aditiva/idempotente añade `doi_scope` y backfill histórico `resource`.
- APA usa DOI únicamente cuando identifica el recurso; DOI de contenedor no sustituye URL granular.
- Tests Foundation/Registry/APA/API cubren coexistencia de `mit` y `laut`, dedupe por DOI de recurso y migración legacy.
- GitHub Actions run #329: SUCCESS.
- Production deploy: SKIPPED.
- E1 está cerrado en código; el repeat live debe ejecutarse después de actualizar el runtime.

## 2026-09-21 / 2026-09-22 — Fase 3 evaluada: CORRECT AND REPEAT

- Pilot 20 completo: 20/20.
- 17 VERIFIED; 3 SOURCED no VERIFIED.
- 53/55 claims con cobertura suficiente.
- 1 conflicto sustantivo; 3 article revisions propuestas; 0 integradas.
- D1: 9,232 reads / 1,000 writes.
- Logical Evidence: 176,399 bytes.
- Source retry/enrichment reuse funcionó; cross-entry reuse no se observó.
- REVIEWED humano no se ejercitó.
- DOI de contenedor compartido puede causar falsa colisión si se trata como DOI del recurso granular.
- Control plane acumuló 197 commits y +788,553 blob bytes.
- Virtuoso/Profesor IA todavía no tienen certificación de consumo Evidence.
- Decisión: CORRECT AND REPEAT.
- Gate 100: BLOCKED.
- Documento: `10 Fase 3 Evaluacion Pilot 20.md`.

## 2026-09-21 — Pilot 20 checkpoint 13–16 PASS WITH FINDING

- Entradas procesadas acumuladas: 16/20.
- Estado acumulado: 14 VERIFIED; 2 SOURCED sin VERIFIED.
- MLS-V06-0010: VERIFIED, 2 Sources, 2 Claims, 4 Links, 6,706 logical Evidence bytes.
- MLS-V06-0822: VERIFIED, 3 Sources, 3 Claims, 5 Links, 8,988 bytes.
- MLS-V07-0152: VERIFIED, 4 Sources, 3 Claims, 5 Links, 9,391 bytes.
- MLS-V07-0813: SOURCED, 4 Sources, 4 Claims, 3 coverage-qualified, 8 Links, 1 article revision proposed, 17,892 bytes.
- Entry 16 detectó un evidence gap: la literatura sí sostiene usos discursivos de 沒有 y 啦 como marcador de ajuste, pero no basta para atribuir a 啦 una regla causal general de suavización y una lista fija de tonos.
- El backend bloqueó VERIFIED por unverified_substantial_claims; no se fabricó conflicto.
- Se creó revisión propuesta MLS-ARTREV-76D3ACB29540CC3F85EA22E2 sin overwrite.
- Checkpoint 13–16: 1,906 rows read / 238 rows written / 42,977 logical Evidence bytes.
- Acumulado 1–16: 7,325 reads / 785 writes / 134,815 bytes.
- 43 Claims creados; 42 tienen cobertura calificable.
- 44 Sources creadas; cross-entry Source reuse aún no observado.
- 1 conflicto acumulado; 1 needsReview; 2 article revisions proposed; 0 human reviews.
- 0 falsos VERIFIED y 0 fallos APA.
- Control plane acumulado: 158 commits, +621,522 blob bytes.
- Decisión: PASS WITH FINDING; continuar 17–20.
- Documento detallado: `08 Pilot 20 Checkpoint 13 a 16.md`.

## 2026-09-21 — Pilot 20 checkpoint 9–12 PASS WITH FINDING

- Entradas procesadas acumuladas: 12/20.
- Estado acumulado: 11 VERIFIED; 1 SOURCED + needsReview.
- MLS-V04-0174: SOURCED, 4 Sources, 3 Claims, 5 Links, 1 conflicto, 1 article revision proposed, 13,804 logical Evidence bytes.
- MLS-V04-0927: VERIFIED, 3 Sources, 3 Claims, 4 Links, 8,336 bytes.
- MLS-V05-0165: VERIFIED, 3 Sources, 3 Claims, 3 Links, 7,598 bytes.
- MLS-V05-0881: VERIFIED, 3 Sources, 3 Claims, 4 Links, 8,232 bytes.
- Entry 9 detectó la primera contradicción sustantiva real del piloto: la regla canónica “-ci = primero / -là = segundo” no se sostuvo como regla general.
- El backend bloqueó VERIFIED con unresolved_substantive_conflict y mantuvo needsReview=1.
- Se creó revisión propuesta MLS-ARTREV-624FF06CE1F0EB39C9214F60 sin overwrite del artículo R32.
- Checkpoint 9–12: 1,824 rows read / 212 rows written / 37,970 logical Evidence bytes.
- Acumulado 1–12: 5,419 reads / 547 writes / 91,838 bytes.
- 31 Claims tienen cobertura Evidence; 3 pertenecen a la entrada 9 y no elevan el estado global a VERIFIED mientras exista el conflicto.
- 31 Sources creadas; cross-entry source reuse aún no observado.
- Hallazgo de granularidad: un DOI de obra/contenedor compartido por múltiples fichas IDS puede ser demasiado grueso para identificar una Source específica. En entry 12 se usó canonical URL para evitar falso dedupe.
- 1 conflicto acumulado; 1 needsReview; 1 article revision proposed; 0 human reviews.
- 0 falsos VERIFIED.
- 0 fallos APA.
- Pilot 20 sigue compatible con FREE ONLY.
- Control plane acumulado: 121 commits, +456,479 blob bytes.
- Decisión: PASS WITH FINDING; continuar 13–16.
- Documento detallado: `07 Pilot 20 Checkpoint 9 a 12.md`.


## 2026-09-21 — Pilot 20 checkpoint 5–8 PASS

- Entradas procesadas acumuladas: 8/20; 8/8 VERIFIED.
- MLS-V02-0180: VERIFIED, 2 Sources, 2 Claims, 3 Links, 6,144 logical Evidence bytes.
- MLS-V02-0959: VERIFIED, 2 Sources, 2 Claims, 3 Links, 6,110 bytes.
- MLS-V03-0122: VERIFIED, 2 Sources, 2 Claims, 3 Links, 6,209 bytes.
- MLS-V03-0648: VERIFIED, 4 Sources, 3 Claims, 4 Links, 9,367 bytes.
- Checkpoint 5–8: 1,875 rows read / 172 rows written / 27,830 logical Evidence bytes.
- Acumulado 1–8: 3,595 reads / 335 writes / 53,868 bytes.
- 19/19 Claims sustanciales acumulados verificados.
- 26 EvidenceLinks acumulados.
- 18 Sources creadas.
- Primer ejercicio live de dedupe/idempotencia: en MLS-V02-0959 se reutilizaron 2 Sources, 2 Claims y 3 Links; una Source se enriqueció sin cambiar IDs.
- Cross-entry source reuse todavía no observado; no confundir retry/enrichment reuse con reutilización entre artículos.
- Una Source académica requirió completar `articleNumber=e18257` antes de VERIFIED; APA quedó válida en la revalidación.
- 0 conflictos, 0 needsReview, 0 article revisions, 0 reviews humanas.
- 0 fallos APA; 1 corrección de metadata APA antes de verificación.
- Proyección lineal Pilot 20 con promedio 1–8: ~8,987.5 reads / ~837.5 writes / ~134,670 logical bytes.
- FREE ONLY continúa viable para Pilot 20.
- Extrapolación matemática del promedio a 10,133 entradas: ~4.55M reads / ~424k writes; no es forecast final y confirma que una migración completa no cabe en un solo día por writes.
- Control plane acumulado desde baseline: 83 commits, +302,120 blob bytes, 87 archivos cambiados.
- Workers Builds sobre mlschatcontrol continúa como optimización operacional pendiente, no como bloqueo del piloto.
- Stop conditions audit: PASS.
- Decisión: continuar secuencialmente con entradas 9–12.
- Documento detallado: `06 Pilot 20 Checkpoint 5 a 8.md`.

## 2026-09-21 — Pilot 20 checkpoint 1–4 PASS

- Start gate live aprobado con metadata D1 exacta.
- Entradas procesadas: 4/20.
- MLS-V10-0020: VERIFIED, 3 Sources, 3 Claims, 4 Links, 7,787 logical Evidence bytes.
- MLS-V10-0140: VERIFIED, 2 Sources, 3 Claims, 4 Links, 7,542 bytes.
- MLS-V01-0115: VERIFIED, 1 Source, 2 Claims, 2 Links, 4,527 bytes.
- MLS-V01-0613: VERIFIED, 2 Sources, 2 Claims, 3 Links, 6,182 bytes.
- 10/10 Claims sustanciales verificados.
- 8 Sources creadas; 0 reutilizadas porque no hubo una Source repetida entre estas cuatro entradas.
- 13 EvidenceLinks.
- 0 conflictos.
- 0 needsReview.
- 0 article revisions.
- 0 editorial reviews humanas.
- 0 fallos APA.
- D1 acumulado: 1,720 rows read / 163 rows written.
- Logical Evidence total: 26,038 bytes; promedio 6,509.5 bytes/entrada.
- Promedio D1: 430 reads / 40.75 writes por entrada.
- Proyección lineal del Pilot 20: ~8,600 reads / ~815 writes / ~130,190 logical bytes.
- FREE ONLY continúa viable para el piloto bajo los límites oficiales actuales de D1 Free.
- Una extrapolación lineal a 10,133 entradas excedería el límite diario de writes; no autoriza migración masiva y confirma la necesidad de gates/lotes.
- Evidence runtime mantuvo GitHub requests/mutations = 0.
- Bridge de control: 42 commits y +147,177 blob bytes desde el baseline del control plane.
- Los pushes a mlschatcontrol producen Workers Builds/Version IDs; auditar Branch control/Build watch paths antes de escalamiento prolongado.
- Stop conditions audit: PASS.
- Decisión: continuar secuencialmente con entradas 5–8.
- Documento detallado: `05 Pilot 20 Checkpoint 1 a 4.md`.

## 2026-09-21 — Pilot 20 preparado; ejecución aún bloqueada

- PR #134 prepara Phase 2 sin ejecutar Evidence sobre el corpus.
- Se fijó una muestra canónica de 20 entradas: dos por cada idioma MLS.
- La muestra se bloqueó por Git blob SHA + generatedAt + metadata para evitar drift silencioso.
- Se añadió plan operativo y stop conditions.
- Se añadió telemetría por request para D1; rows exactas solo se reportan cuando Cloudflare las entrega.
- `observedRowsRead/observedRowsWritten` quedan separados y nunca sustituyen billed rows.
- `proposal` reporta creación/reutilización de Sources, Claims, Links y conflictos.
- Se añadió medición read-only de bytes lógicos Evidence.
- CI detectó y corrigió dos errores de preparación: familia AUTOOPT esperada incorrecta para MLS-V01-0613 y un placeholder extra en un fixture SQLite.
- GitHub Actions run #316: SUCCESS.
- test:chat-editorial, test:evidence, test:canonical-tools, qa:baseline, predeploy, recovery:verify, deploy-contract y check: SUCCESS.
- Production deploy: SKIPPED.
- Start gate pendiente: preflight live de metadata D1 en el runtime que vaya a ejecutar el piloto.
- entriesProcessed=0; sourcesCreated=0; claimsCreated=0; claimsVerified=0 en producción.

## 2026-09-21 — F9 Contract Closure certificado; Phase 1 COMPLETE

- Se implementaron Source Policies explícitas para los 10 idiomas canónicos MLS.
- approvedSourcePool permanece vacío hasta verificar fuentes reales durante el piloto; no se preaprobaron autoridades concretas por intuición.
- Español Guatemala, Portugués Brasil y Chino Taiwán conservan explícitamente su variante objetivo.
- El Evidence Validator selecciona la policy a partir del language canónico del artículo.
- Se añadió provenance compuesto R32 + R33 reutilizando wiki_article_provenance cuando existe.
- Se añadió endpoint privado read-only de provenance.
- Se declaró y bloqueó la identidad canónica MLS / dpidiaz/llmchatmls / language; mismatch produce REPO_CONTEXT_MISMATCH.
- Tests de boundary impiden paid APIs, GitHub como runtime DB, style-reference laundering, imágenes/ejercicios y overwrite de wiki_articles desde Evidence.
- verifyEntryEvidence quedó idempotente sobre el mismo snapshot: reusa el verification review y no incrementa evidence_revision.
- GitHub Actions run #309: SUCCESS.
- test:chat-editorial, test:evidence, test:canonical-tools, qa:baseline, predeploy, recovery:verify, deploy-contract y check: SUCCESS.
- Production deploy: SKIPPED.
- No se crearon Sources, Claims ni EvidenceLinks en D1 de producción.
- Phase 1 queda COMPLETE. Phase 2 Pilot 20 queda READY pero NOT STARTED.

## 2026-09-21 — F8 Regression certification aprobado; gap audit de cierre

- GitHub Actions run #303: SUCCESS.
- Pasaron explícitamente `test:chat-editorial`, `test:evidence`, `test:canonical-tools`, `qa:baseline`, `predeploy`, `recovery:verify`, deploy-contract y `check`.
- Production deploy permaneció SKIPPED.
- El gate técnico F8 está aprobado.
- El contraste contra el contrato completo de Foundation detectó tres pendientes antes de cerrar Phase 1: source policies por los 10 idiomas, composición explícita de provenance R32+R33 y boundary/repo identity contracts explícitos.
- Se crea F9 Contract Closure; Phase 1 no se declara COMPLETE hasta que esos contratos estén implementados y recertificados.

## 2026-09-21 — F7 Private Evidence API certificado

- Se añadió el namespace privado `/api/wiki/editorial/evidence/*` bajo la misma autenticación `MLS_EDITORIAL_CHAT_KEY`.
- Operaciones disponibles: status, entry, sources, proposal, validate, verify, review y revision/propose.
- El flujo chat-native queda operativo como `entry → investigación externa de ChatGPT → proposal → validate → verify → review`.
- El Worker no hace crawling ni búsqueda académica automática.
- `proposal` exige versión/hash exactos y `expectedEvidenceRevision`; preflight valida referencias internas antes de escrituras Evidence.
- `validate` es read-only; `proposal`, `verify`, `review` y `revision/propose` son consecuenciales en OpenAPI.
- Los módulos CommonJS de Evidence se empaquetan como IIFEs aisladas para Cloudflare; el runtime generado no conserva `require('./evidence...')`.
- OpenAPI privado pasa a versión 33.0.0, manteniendo el contrato de generación editorial R32/32.0 intacto.
- Se corrigieron dos defectos del ensamblador detectados por CI: un literal regex mal escapado y un bloque residual duplicado; ambos fueron corregidos sin ampliar alcance.
- GitHub Actions run #299: SUCCESS; production deploy SKIPPED.

## 2026-09-21 — F6 Reviews y Article Revisions certificado

- Se añadieron reviews append-only con `review_kind` y `evidence_snapshot_hash`.
- VERIFIED requiere un verification review persistido cuyo hash coincida exactamente con el snapshot Evidence vigente.
- REVIEWED requiere un segundo editorial review posterior y sobre el mismo snapshot.
- Cambiar claims, EvidenceLinks, metadata de Source o conflictos invalida automáticamente el review anterior para el estado efectivo.
- `verificationConfirmed` dejó de ser una vía de promoción: los booleanos de cliente no producen VERIFIED.
- `verifyEntryEvidence` y `reviewEntryEvidence` son las únicas orquestaciones internas de promoción definidas en Foundation.
- Los reviews son idempotentes y conservan historial; un snapshot stale falla con 409.
- Se implementó baseline de artículo y revisiones `proposed` con guard por articleHash.
- F6 no incluye ninguna ruta para sobrescribir `wiki_articles`; la integración canónica queda diferida al piloto.
- GitHub Actions run #290: SUCCESS; deploy de producción SKIPPED.

## 2026-09-21 — F5 APA validator y renderer implementados

- Se verificó nuevamente la base institucional: la guía URL 2025 declara alineación con APA 7.
- Se añadió metadata explícita de editors para capítulos de libro.
- APA Validator soporta inicialmente book, book chapter, journal article, institutional webpage, report y reference entry.
- El renderer produce referencia APA derivada de metadata estructurada y citas parentéticas/narrativas.
- DOI se normaliza como `https://doi.org/...` y tiene prioridad sobre URL.
- Se implementó regla APA 7 de hasta 20 autores y elipsis para más de 20.
- El perfil `URL-GT-2025` usa fechas renderizadas en español para `es-GT`.
- El renderer no inventa sentence case, autores, páginas, DOI ni metadata faltante: falla cerrado cuando un tipo requiere campos ausentes.
- `citationReady` dejó de ser confiable desde el cliente: F4 ahora lo calcula internamente usando el APA Validator sobre las fuentes que realmente sostienen cada claim.
- Una fuente `unresolved` puede renderizarse si su metadata es suficiente, pero nunca cuenta como `citationReady`.
- Suite acumulada local F1–F5: 43/43 verde.
- F4 fue certificado en GitHub Actions run #287 e integrado por PR #128 (`3d6008a...`).

## 2026-09-21 — F4 State validator implementado

- Se añadió validador determinista separado de Editorial Validator y del futuro APA Validator.
- Fuente identificada se distingue de fuente suficientemente fuerte: una fuente débil puede mantener SOURCED sin contar para VERIFIED.
- Claims `normative` requieren Tier A/B por política inicial; la política es configurable.
- Claims `quotation` requieren locator explícito; nunca se inventa uno.
- Cobertura completa no puede alcanzar VERIFIED si `citationReady` es falso.
- Cobertura completa tampoco alcanza VERIFIED sin evento explícito de verificación.
- Contradicción sustantiva unresolved bloquea VERIFIED; variación regional accepted no lo bloquea.
- Estado efectivo vuelve a UNSOURCED automáticamente si cambia el hash/version del artículo.
- Persistencia del state usa `expectedEvidenceRevision` y devuelve conflicto 409 ante revisión obsoleta.
- Un state stale puede reiniciarse a la nueva versión únicamente con expected revision 0.
- 12/12 tests locales de F4 verdes.
- F3 fue certificado por GitHub Actions run #284 e integrado por PR #127 (`305cf098...`).

## 2026-09-21 — F3 Claims, EvidenceLinks y conflictos implementado

- Claims se vinculan obligatoriamente a la versión exacta `code + generatedAt + articleHash`.
- Claim IDs y EvidenceLink IDs son deterministas e idempotentes.
- Los constructed examples se modelan explícitamente y no se convierten por sí solos en claims sustanciales verificados.
- EvidenceLinks requieren Claim y Source existentes.
- Locators aceptan únicamente page, pageRange, chapter, section, paragraph, table, figure, timestamp y urlFragment.
- Un locator ausente permanece ausente: no se inventa página ni sección.
- Conflictos registran `source_ids_json` para preservar qué fuentes intervienen.
- Contradicción unresolved marca needsReview; variación accepted requiere resolución explícita.
- F3 no promueve VERIFIED ni modifica `wiki_evidence_entry_state`; eso queda reservado a F4.
- 10/10 tests locales de F3 verdes.
- F2 quedó certificado por GitHub Actions run #282 y fue integrado en `main` mediante PR #126 (`b494432...`).

## 2026-09-21 — F2 Source Registry implementado

- Se creó `evidence registry.js` con persistencia D1 aislada del runtime público.
- Upsert idempotente: repetir metadata idéntica no genera escritura adicional.
- Deduplicación efectiva por DOI, ISBN, canonical URL y fingerprint.
- Enriquecimiento conservador completa campos ausentes sin crear otra Source.
- Conflictos en metadata fuerte fallan cerrado con `SOURCE_METADATA_CONFLICT` 409.
- Una fuente superseded no puede reactivarse silenciosamente.
- URL estable + `resourceVersion`/publicationDate produce identidad versionada distinta.
- Estado agregado del Source Registry disponible internamente.
- 8/8 tests locales del registry verdes tras corregir el hash para excluir campos transitorios.
- No se crearon Sources, Claims ni EvidenceLinks en D1 real; son pruebas SQLite en memoria.
- Certificación completa del PR pendiente.

## 2026-09-21 — F1 Contracts and schema certificado

- GitHub Actions run #279 completó SUCCESS contra `main`.
- Pasaron `test:chat-editorial`, `predeploy`, `recovery:verify`, deploy-contract y `check`.
- El paso de despliegue de producción del workflow fue SKIPPED.
- F1 cumple su gate técnico y queda listo para merge.

## 2026-09-21 — F1 Contracts and schema iniciado

- Se creó la rama `r33-evidence-provenance-foundation` desde el checkpoint documental.
- Se añadieron contratos y schema aditivos sin conectar Evidence al runtime.
- Se añadieron IDs deterministas y normalización DOI/ISBN/URL.
- Se añadieron guards UNSOURCED/SOURCED/VERIFIED/REVIEWED y concurrencia 409.
- 12 tests dedicados pasaron localmente.
- `test:evidence` y el test de Foundation se añadieron al contrato de tests.
- PR #125 abierto contra `main` para certificación real.
- No se ejecutó migración D1 ni procesamiento de corpus.

## 2026-09-21 — Cierre de Fase 0

- Auditoría D1, provenance, OpenAPI, Virtuoso, Profesor IA, search, offline y canonical schema completada.
- Se rechazó añadir Evidence directamente a `wiki_articles`.
- Se seleccionó arquitectura D1 normalizada separada.
- Se definió vínculo de Evidence a `code + generatedAt + articleHash`.
- Se definió Source Registry global deduplicado.
- Se definieron state machine, concurrency guard, reviews y article revision strategy.
- Se midió el corpus canónico en ~31.3 MB de entradas, ~3.1 KB por entrada.
- Se estimó Evidence completo en escenarios lean/expected/high y se dejó el piloto como autoridad final de métricas.
- Fase 1 queda READY TO START.
- No se modificó código de producción ni D1.

## 2026-09-21 — Baseline documental

- Se creó documentación R33.
- Se consolidó Evidence & Provenance con APA/URL.
- Se verificó repo identity.
- Se confirmó separación AUTOOPT/Evidence.
- Se confirmó que R32 references son style calibration.
- Se confirmó provenance existente de GitHub Staging.
- Se fijó Fase 0 como estado activo.
- No se cambió código de producción.
- No se ejecutó manualmente `npm run deploy` ni un comando remoto de despliegue.
- La integración GitHub → Cloudflare desplegó automáticamente el commit de documentación de la rama; el cambio desplegado contiene solo documentación y no modifica código de producción.
- No se ejecutó migración D1.
- No se procesaron entradas del corpus.

---

# 19. ÚLTIMO CHECKPOINT

Actualizar este bloque al cerrar cada trabajo.

```
STATUS: PHASE 4 GATE 100 COMPLETE — PASS QUALITY / CORRECT AND REPEAT SCALE
SYSTEM: MLS
REPOSITORY: dpidiaz/llmchatmls
MAIN REPORT: docs/evidence y provenance/14 Gate 100 Final Report.md
AUDIT COMMIT: 8ff2b7719258d79fda6ca46139991627646bf2f5

DONE:
- Farm complete: 10,133/10,133 terminal
- Gate 100 manifest: 100 entries, 10 per language
- Gate 100 final certification: 100/100 complete
- Gate 100 final status: 100/100 VERIFIED
- Final exceptions: 0
- Final needs_evidence: 0
- Final external discovery pending: 0
- Claims current: 149
- EvidenceLinks current: 151
- Logical Evidence bytes: 401,507
- D1 execution rows read: 134,214
- D1 execution rows written: 2,099
- Reporting rows read: 2,504
- Source create operations: 48
- Source reuse operations: 57
- Source metadata updates: 7
- Proposal attempts/failures: 105 / 10
- Verification attempts/failures: 101 / 2
- Control plane: 0.64 commits/entry
- Post-report audit independently recalculated and persisted
- FREE ONLY preserved
- R32 preserved

CURRENT:
- Gate 100 closed
- Scalability finding open: read amplification
- Gate 500 blocked

NEXT:
- Inspect and optimize triageBatchEvidenceMLS read path
- Reduce repeated Source Registry scans/metadata reads
- Increase Registry-first effectiveness
- Harden concurrent result-file persistence if needed
- Prepare fresh deterministic Gate 100 Correction Repeat manifest
- Run Correction Repeat
- Re-evaluate GO / CORRECT AND REPEAT / STOP
- Only GO may authorize Gate 500

BLOCKERS:
- No quality/integrity blocker
- Scale blocker: average D1 reads/entry 1342.14 vs Pilot 20 baseline 461.6
- Discovery blocker: 52/99 new Evidence entries initially required external discovery

DECISION:
- Gate 100 editorial: PASS
- Gate 100 scalability: CORRECT AND REPEAT
- Gate 500 authorized: false
```
---

# 20. PROTOCOLO PARA FUTUROS CHATS

Cuando un chat reciba una instrucción para continuar R33:

1. leer `00 Indice.md`;
2. leer `01 Master Prompt MLS Evidence Provenance R33.md`;
3. leer este Roadmap;
4. verificar repo/branch/HEAD;
5. inspeccionar el código actual relevante, no confiar en snapshots conversacionales;
6. identificar la tarea pendiente exacta del Roadmap;
7. implementar sin ampliar alcance innecesariamente;
8. ejecutar QA correspondiente;
9. actualizar métricas reales;
10. actualizar decisiones si cambiaron;
11. actualizar Change Log;
12. reemplazar Último Checkpoint;
13. commit de documentación junto al cambio cuando corresponda;
14. reportar el formato de checkpoint del Master Prompt.

El Roadmap es parte del sistema de control de cambios R33, no una nota opcional.

## 2026-09-22 — Correction Repeat E1/E2/E4/E5

- E1 PASS LIVE: commands 0274–0279 demostraron `doiScope=container` con URLs granulares distintas para `laut` y `mit`; ambas entradas regresaron a VERIFIED.
- E2 PASS LIVE: commands 0269–0271 reutilizaron `MLS-SRC-13608E329726A3D4557A` entre artículos distintos sin duplicar Source.
- La actualización de una Source compartida invalidó correctamente un review anterior por cambio de Evidence snapshot; tras estabilizar metadata, la entrada fue revalidada.
- E4 PASS/MITIGATED: batch envelope de 1–50 operaciones implementado. Command 0280 procesó 3/3 operaciones HTTP 200 mediante un solo command/result pair.
- El script operativo completo del Bridge se preserva también en main para recuperación; allowlist cerrada, sin URL arbitraria.
- Build watch path recomendado: excluir `mls chat bridge/*` en Cloudflare Workers Builds. Es configuración externa documentada; no se afirma aplicada desde Git.
- E5 CODE + CI PASS: contrato read-only para UNSOURCED/SOURCED/VERIFIED/REVIEWED, needsReview y revisiones propuestas.
- Profesor IA recibe Evidence como system guidance de la entrada actual y degrada de forma segura si no puede leerlo.
- Virtuoso conserva relevance/reranking y solo recibe anotación Evidence después de seleccionar recomendaciones; no puede inferir VERIFIED/REVIEWED.
- Endpoint privado `/api/wiki/editorial/evidence/consumer` añadido como non-consequential.
- PR #145 runs #337 y #338: SUCCESS; test:chat-editorial, test:evidence, canonical tools, baseline, predeploy, recovery, deploy-contract y check verdes; production deploy SKIPPED.
- E3 permanece PENDING HUMAN. No se creó ni se autoriza crear un REVIEWED humano ficticio.
- Gate 100 continúa BLOCKED.
- Documento: `11 Correction Repeat E1 E2 E4 E5.md`.


## 2026-09-22 — Gate 100 scalability preparation

- E5 live smoke PASS: command 0282 returned HTTP 200 and a conservative VERIFIED consumer contract.
- Added read-only Source reuse candidate pool; candidates are explicitly `approved:false` and require claim-specific verification.
- Added batch triage up to 50 entries with lanes complete / exception / resume_existing / needs_evidence.
- Added discovery modes none / human_or_manual / registry_first / external_discovery.
- Added Bridge operations for reuse candidates and batch triage.
- Gate 100 remains blocked by E3 Human REVIEWED and all new prep returns `gate100Authorized:false`.
- Document: `12 Gate 100 Scalability Preparation.md`.

## 2026-09-22 — Phase 3 GO after E3 Human REVIEWED

- Human approval was received explicitly for `MLS-V10-0020`.
- Bridge command 0285 returned HTTP 200.
- Entry transitioned from VERIFIED to REVIEWED on the same Evidence snapshot.
- 3/3 claims remain verified; 3 Sources; 0 conflicts; needsReview=false.
- editorialReviewId: `MLS-REVW-6D2F925AD10C240E9AD96E59`.
- evidenceRevision advanced from 2 to 3.
- E1–E5 are now all PASS.
- Phase 3 decision changes from CORRECT AND REPEAT to GO.
- Gate 100 is READY, but the #146 scale-prep runtime endpoints are not yet live; command 0284 correctly exposed this operational gap with HTTP 404.


## 2026-09-23 — Gate 100 closure and post-report audit

- Gate 100 completed 100/100 entries across 10 languages.
- Final certification: 100 complete, 100 VERIFIED, 0 exceptions, 0 needs_evidence, 0 external discovery pending.
- Metrics commands 0329–0330 measured 149 claims, 151 EvidenceLinks and 401,507 logical Evidence bytes.
- Independent audit recalculated commands 0298–0328: 134,214 D1 reads, 2,099 D1 writes, 105 proposal attempts / 10 recoverable failures, 101 verification attempts / 2 APA-blocked failures, 48 Source creates, 57 reuse operations and 7 metadata updates.
- Reporting commands added 2,504 reads and 0 writes.
- Initial triage: 1 already complete, 99 needed Evidence, 47 Registry-first, 52 external discovery.
- Pilot 20 comparison baseline rechecked: 461.6 D1 reads/entry, 50 writes/entry, 8,819.95 logical bytes/entry and 197 control-plane commits.
- Decision remains PASS QUALITY / CORRECT AND REPEAT SCALE.
- Gate 500 remains blocked pending a successful Gate 100 Correction Repeat.
- Audit checkpoint persisted in commit 8ff2b7719258d79fda6ca46139991627646bf2f5.
